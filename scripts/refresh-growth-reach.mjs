#!/usr/bin/env node
// scripts/refresh-growth-reach.mjs
//
// Reads canonical metrics from the "Candler Foundry: Master CRM" Airtable base
// and rewrites assets/page-config/growth-reach.json.
//
// Design rules:
//   1. Never break the page. Every field has a safe fallback: if the Airtable
//      lookup fails, we keep the existing JSON value and log a warning.
//   2. Only fields we can confidently source from Airtable are touched. Stats
//      that need YouTube/Mailchimp/IG or that are slow-moving editorial choices
//      (Faculty %, Programs Created, TheoEd Events, etc.) stay where they are.
//   3. Idempotent: running it twice with no Airtable change is a no-op.
//
// Run locally:
//   AIRTABLE_PAT=<token> node scripts/refresh-growth-reach.mjs
//
// Token scope: fine-grained Airtable PAT with
//   - data.records:read   on base appiL0Z2RilcAT2Cw

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE_ID = 'appiL0Z2RilcAT2Cw'; // Candler Foundry: Master CRM
const PAT = process.env.AIRTABLE_PAT;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');
const CONFIG_PATH = path.join(REPO_ROOT, 'assets', 'page-config', 'growth-reach.json');

if (!PAT) {
  console.error('AIRTABLE_PAT is not set. Add it to repo Secrets and re-run.');
  process.exit(1);
}

/**
 * Mapping of "what to refresh from where".
 *
 *   tableId / viewId : pulled from the Airtable list_tables output
 *   format(n)        : how to turn a record count into the value we store
 *                      (string for hero tiles, number for grid tiles)
 *   notes            : free-form so future maintainers know why this view
 *
 * Anything not in this list stays as-is in the JSON.
 */
const SOURCES = {
  heroLearners: {
    tableId: 'tbl0jx0urjA5KINjA',           // Student Insights (Individual)
    viewId:  null,                          // count entire table = unique learners
    format:  (n) => n.toLocaleString(),     // "4,237"
    notes:   'One row per unique learner across all programs.',
  },
  heroChurchPartners: {
    tableId: 'tbloYQpUR7hVgkKtx',           // Church Partner CRM
    viewId:  null,
    format:  (n) => String(n),
    notes:   'One row per partner congregation.',
  },
  registrations: {
    tableId: 'tbldN1Ak4SHS41PvM',           // CRM Data
    viewId:  'viwVxvcgfPXPldsr9',           // Master List
    format:  (n) => n,
    notes:   'Every paid/comped registration across all programs.',
  },
  courses: {
    tableId: 'tblQNAsrQcdnM8UZC',           // Course & OND Planner
    viewId:  'viwDF8FxwmW2hhBc7',           // DW - Master List (excludes drafts)
    format:  (n) => n,
    notes:   'Master list of offered courses; excludes the DRAFTS view.',
  },
  theoedTalks: {
    tableId: 'tblS1Bk29cXyGGUdo',           // 3MB, UNST, TheoEd, OND
    viewId:  'viwAChcup7xsrlhmb',           // TheoEd Archive
    format:  (n) => n,
    notes:   'Canonical TheoEd talk archive view.',
  },
  podcast: {
    tableId: 'tbloVdhcMFMaMw5KC',           // POD & YouTube
    viewId:  'viwCvQIWI6Q5mYYVY',           // POD - All (Legacy & Current)
    format:  (n) => n,
    notes:   'All podcast episodes, legacy + current.',
  },
};

// --------------------------------------------------------------------------
// Airtable helpers
// --------------------------------------------------------------------------

async function airtableFetchPage(tableId, { viewId, offset } = {}) {
  const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${tableId}`);
  url.searchParams.set('pageSize', '100');
  // We only need the count, not the field data. Asking for a single id-only
  // field keeps the payload small.
  url.searchParams.set('fields[]', '');
  if (viewId) url.searchParams.set('view', viewId);
  if (offset) url.searchParams.set('offset', offset);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${PAT}`,
      'User-Agent': 'candlerfoundry-executive-bi-dashboard refresh-bot',
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Airtable ${res.status} ${res.statusText}: ${body.slice(0, 240)}`);
  }
  return res.json();
}

async function airtableCount(tableId, viewId) {
  let count = 0;
  let offset;
  do {
    const data = await airtableFetchPage(tableId, { viewId, offset });
    count += (data.records || []).length;
    offset = data.offset;
    // Polite pacing — Airtable allows 5 req/sec/base; we sit far below.
    if (offset) await new Promise((r) => setTimeout(r, 220));
  } while (offset);
  return count;
}

// --------------------------------------------------------------------------
// Refresh
// --------------------------------------------------------------------------

async function refresh() {
  const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
  const cfg = JSON.parse(raw);

  const log = [];
  let touched = 0;

  async function tryRefresh(label, pull, apply) {
    try {
      const value = await pull();
      apply(value);
      log.push(`  ✓ ${label} → ${value}`);
      touched++;
    } catch (err) {
      log.push(`  ✗ ${label} (kept existing value) — ${err.message}`);
    }
  }

  // ---- Hero: Individual Learners
  if (cfg.hero?.stats?.[1]) {
    const s = SOURCES.heroLearners;
    await tryRefresh(`Individual Learners [${s.tableId}]`,
      async () => s.format(await airtableCount(s.tableId, s.viewId)),
      (v) => { cfg.hero.stats[1].value = String(v); });
  }

  // ---- Hero: Church Partners
  if (cfg.hero?.stats?.[2]) {
    const s = SOURCES.heroChurchPartners;
    await tryRefresh(`Church Partners [${s.tableId}]`,
      async () => s.format(await airtableCount(s.tableId, s.viewId)),
      (v) => { cfg.hero.stats[2].value = String(v); });
  }

  // ---- Grid stats by id
  const gridMap = [
    ['registrations', SOURCES.registrations],
    ['courses',       SOURCES.courses],
    ['theoed-talks',  SOURCES.theoedTalks],
    ['podcast',       SOURCES.podcast],
  ];
  const findStat = (id) => (cfg.stats || []).find((s) => s.id === id);
  for (const [id, src] of gridMap) {
    const stat = findStat(id);
    if (!stat) {
      log.push(`  – stats[id=${id}] not present in JSON — skipped`);
      continue;
    }
    await tryRefresh(`stats[id=${id}] [${src.tableId}${src.viewId ? '/' + src.viewId : ''}]`,
      async () => src.format(await airtableCount(src.tableId, src.viewId)),
      (v) => { stat.value = Number(v) || 0; });
  }

  // ---- Churches We Serve absolute counts — recompute from latest partner count
  // so the "~22 partners" labels stay consistent with the hero number.
  const partnerStr = String(cfg.hero?.stats?.[2]?.value ?? '');
  const partnerNum = parseInt(partnerStr.replace(/[^\d]/g, ''), 10);
  if (Number.isFinite(partnerNum) && partnerNum > 0 && Array.isArray(cfg.churchSizes?.rows)) {
    cfg.churchSizes.rows = cfg.churchSizes.rows.map((row) => {
      const pct = Number(row.pct) || 0;
      const absolute = Math.round((partnerNum * pct) / 100);
      return { ...row, count: `${pct}% ~${absolute} partners` };
    });
    log.push(`  ✓ churchSizes.count labels recomputed against ${partnerNum} partners`);
  }

  // ---- Write back. Always pretty-print so diffs are reviewable.
  const next = JSON.stringify(cfg, null, 2) + '\n';
  if (next !== raw) {
    await fs.writeFile(CONFIG_PATH, next, 'utf-8');
  }

  console.log('Growth & Reach refresh:');
  for (const line of log) console.log(line);
  console.log(`  Updated ${touched} field(s). Wrote ${next === raw ? 'no changes' : 'updated'} file.`);
}

refresh().catch((err) => {
  console.error('FATAL during refresh:', err);
  // Fail the workflow loudly so the user gets notified.
  process.exit(1);
});

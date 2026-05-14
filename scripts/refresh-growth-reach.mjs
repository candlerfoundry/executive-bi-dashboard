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

const SOURCES = {
  heroLearners: {
    tableId: 'tbl0jx0urjA5KINjA',
    viewId:  null,
    format:  (n) => n.toLocaleString(),
    notes:   'Student Insights (Individual) — one row per unique learner.',
  },
  heroChurchPartners: {
    tableId: 'tbloYQpUR7hVgkKtx',
    viewId:  null,
    format:  (n) => String(n),
    notes:   'Church Partner CRM — one row per partner.',
  },
  registrations: {
    tableId: 'tbldN1Ak4SHS41PvM',
    viewId:  'viwVxvcgfPXPldsr9',
    format:  (n) => n,
    notes:   'CRM Data → Master List.',
  },
  courses: {
    tableId:         'tblQNAsrQcdnM8UZC',
    viewId:          null,
    filterByFormula: "OR({Type}='CIC', {Type}='FFL', {Type}='On-Demand')",
    format:          (n) => n,
    notes:           'Course & OND Planner, whole table filtered to courses we count publicly: CIC + FFL + On-Demand.',
  },
  theoedTalks: {
    tableId: 'tblS1Bk29cXyGGUdo',
    viewId:  'viwAChcup7xsrlhmb',
    format:  (n) => n,
    notes:   '3MB/UNS/TheoEd/OND → TheoEd Archive.',
  },
  podcast: {
    tableId: 'tbloVdhcMFMaMw5KC',
    viewId:  'viwCvQIWI6Q5mYYVY',
    format:  (n) => n,
    notes:   'POD & YouTube → POD - All (Legacy & Current).',
  },
};

async function airtableFetchPage(tableId, { viewId, offset, filterByFormula } = {}) {
  const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${tableId}`);
  url.searchParams.set('pageSize', '100');
  if (viewId) url.searchParams.set('view', viewId);
  if (offset) url.searchParams.set('offset', offset);
  if (filterByFormula) url.searchParams.set('filterByFormula', filterByFormula);

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

async function airtableCount(tableId, viewId, filterByFormula) {
  let count = 0;
  let offset;
  do {
    const data = await airtableFetchPage(tableId, { viewId, offset, filterByFormula });
    count += (data.records || []).length;
    offset = data.offset;
    if (offset) await new Promise((r) => setTimeout(r, 220));
  } while (offset);
  return count;
}

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

  if (cfg.hero?.stats?.[1]) {
    const s = SOURCES.heroLearners;
    await tryRefresh(`Individual Learners [${s.tableId}]`,
      async () => s.format(await airtableCount(s.tableId, s.viewId, s.filterByFormula)),
      (v) => { cfg.hero.stats[1].value = String(v); });
  }

  if (cfg.hero?.stats?.[2]) {
    const s = SOURCES.heroChurchPartners;
    await tryRefresh(`Church Partners [${s.tableId}]`,
      async () => s.format(await airtableCount(s.tableId, s.viewId, s.filterByFormula)),
      (v) => { cfg.hero.stats[2].value = String(v); });
  }

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
    await tryRefresh(`stats[id=${id}] [${src.tableId}${src.viewId ? '/' + src.viewId : ''}${src.filterByFormula ? ' (filter)' : ''}]`,
      async () => src.format(await airtableCount(src.tableId, src.viewId, src.filterByFormula)),
      (v) => { stat.value = Number(v) || 0; });
  }

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

  console.log('Growth & Reach refresh:');
  for (const line of log) console.log(line);

  if (touched === 0) {
    console.log('  No fields refreshed; leaving growth-reach.json untouched.');
    return;
  }

  let original;
  try { original = JSON.parse(raw); } catch { original = null; }
  const nextNorm = JSON.stringify(cfg);
  const origNorm = original == null ? '' : JSON.stringify(original);
  if (nextNorm === origNorm) {
    console.log('  Values unchanged after refresh; not writing.');
    return;
  }

  const next = JSON.stringify(cfg, null, 2) + '\n';
  await fs.writeFile(CONFIG_PATH, next, 'utf-8');
  console.log(`  Updated ${touched} field(s). Wrote updated file.`);
}

refresh().catch((err) => {
  console.error('FATAL during refresh:', err);
  process.exit(1);
});

#!/usr/bin/env node
// scripts/refresh-growth-reach.mjs
//
// Reads canonical metrics from the "Candler Foundry: Master CRM" Airtable base
// and rewrites assets/page-config/growth-reach.json.
//
// Always writes a plain-English summary file (subject + body) to
// $RUNNER_TEMP/refresh-summary.txt for the workflow to use as both the commit
// message and the email body. Never fails the workflow on per-field errors —
// missing/preserved values are still reported, and the site stays on the
// previous numbers.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE_ID = 'appiL0Z2RilcAT2Cw'; // Candler Foundry: Master CRM
const PAT = process.env.AIRTABLE_PAT;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');
const CONFIG_PATH = path.join(REPO_ROOT, 'assets', 'page-config', 'growth-reach.json');
const SUMMARY_PATH = path.join(process.env.RUNNER_TEMP || '/tmp', 'refresh-summary.txt');

if (!PAT) {
  await writeSummary(
    'Growth & Reach refresh: missing Airtable token',
    'The refresh workflow could not run because the AIRTABLE_PAT repo secret is empty.\n\n' +
    'To fix: go to airtable.com → your account icon → Builder Hub → Personal access tokens. ' +
    "Confirm a token exists (scoped to base appiL0Z2RilcAT2Cw with data.records:read) and hasn't expired. " +
    'Then in GitHub: Settings → Secrets and variables → Actions → AIRTABLE_PAT → Update.'
  );
  console.error('AIRTABLE_PAT is not set.');
  process.exit(0);
}

const SOURCES = {
  heroLearners: {
    tableId: 'tbl0jx0urjA5KINjA',
    viewId:  null,
    format:  (n) => n.toLocaleString(),
    label:   'Individual Learners',
  },
  heroChurchPartners: {
    tableId: 'tbloYQpUR7hVgkKtx',
    viewId:  null,
    format:  (n) => String(n),
    label:   'Church Partners',
  },
  registrations: {
    tableId: 'tbldN1Ak4SHS41PvM',
    viewId:  'viwVxvcgfPXPldsr9',
    format:  (n) => n,
    label:   'Total Registrations',
  },
  courses: {
    tableId:         'tblQNAsrQcdnM8UZC',
    viewId:          null,
    filterByFormula: "OR({Type}='CIC', {Type}='FFL', {Type}='On-Demand')",
    format:          (n) => n,
    label:           'Courses Offered',
  },
  theoedTalks: {
    tableId: 'tblS1Bk29cXyGGUdo',
    viewId:  'viwAChcup7xsrlhmb',
    format:  (n) => n,
    label:   'TheoEd Talks Produced',
  },
  podcast: {
    tableId: 'tbloVdhcMFMaMw5KC',
    viewId:  'viwCvQIWI6Q5mYYVY',
    format:  (n) => n,
    label:   'Podcast Episodes',
  },
};

async function airtableFetchPage(tableId, { viewId, offset, filterByFormula } = {}) {
  const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${tableId}`);
  url.searchParams.set('pageSize', '100');
  if (viewId) url.searchParams.set('view', viewId);
  if (offset) url.searchParams.set('offset', offset);
  if (filterByFormula) url.searchParams.set('filterByFormula', filterByFormula);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${PAT}`, 'User-Agent': 'candlerfoundry-refresh-bot' },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Airtable ${res.status} ${res.statusText}: ${body.slice(0, 200)}`);
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

// -- summary plumbing --

function parseNum(s) {
  if (s == null) return null;
  const cleaned = String(s).replace(/[^0-9.\-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function deltaSuffix(before, after) {
  const b = parseNum(before);
  const a = parseNum(after);
  if (b == null || a == null) return '';
  const d = a - b;
  if (d === 0) return '';
  const word = d > 0 ? 'up' : 'down';
  return ` (${word} ${Math.abs(d).toLocaleString()})`;
}

function buildSummary(changes) {
  const changed   = changes.filter((c) => c.status === 'changed');
  const unchanged = changes.filter((c) => c.status === 'unchanged');
  const failed    = changes.filter((c) => c.status === 'failed');

  let subject, body;

  if (failed.length === changes.length && changes.length > 0) {
    subject = 'Growth & Reach refresh hit a problem — site is still fine';
    body =
      'The monthly refresh tried to update Growth & Reach but every Airtable lookup failed this time.\n\n' +
      'Good news: your site is still showing the previous numbers. Nothing on the dashboard is broken.\n\n' +
      "Here's what went wrong, field by field:\n" +
      failed.map((c) => `  • ${c.label}: ${c.error}`).join('\n') +
      '\n\nMost common cause: the Airtable token expired or got renamed. Check at airtable.com → ' +
      'account icon → Builder Hub → Personal access tokens.';
  } else if (failed.length > 0) {
    const updatedCount = changed.length;
    const errCount = failed.length;
    subject = `Growth & Reach refresh: ${updatedCount} updated, ${errCount} couldn't be looked up`;
    body =
      "The monthly refresh ran but couldn't update everything this time. The site is still fine — " +
      'for any number that couldn\'t be looked up, we kept the previous value.\n';
    if (changed.length > 0) {
      body += '\nUpdated successfully:\n' +
        changed.map((c) => `  • ${c.label}: ${c.beforeStr} → ${c.afterStr}${deltaSuffix(c.beforeStr, c.afterStr)}`).join('\n');
    }
    if (unchanged.length > 0) {
      body += '\n\nNo change (still accurate from last month):\n' +
        unchanged.map((c) => `  • ${c.label}: ${c.beforeStr}`).join('\n');
    }
    body += '\n\nCouldn\'t be updated (previous value kept on the site):\n' +
      failed.map((c) => `  • ${c.label}: stayed at ${c.beforeStr} — error: ${c.error}`).join('\n');
    body += '\n\nIf this keeps happening, check that the Airtable token at airtable.com → Builder Hub → ' +
      'Personal access tokens hasn\'t expired or had its permissions changed.';
  } else if (changed.length === 0) {
    subject = 'Growth & Reach: monthly refresh ran (no changes this month)';
    body =
      "The monthly refresh of your Growth & Reach page just ran. None of the numbers we automatically refresh changed since last month:\n\n" +
      unchanged.map((c) => `  • ${c.label}: ${c.beforeStr} (no change)`).join('\n') +
      '\n\nThe site shows the same numbers it did last month.';
  } else {
    const word = changed.length === 1 ? 'number' : 'numbers';
    subject = `Growth & Reach: ${changed.length} ${word} updated this month`;
    body =
      "The monthly refresh of your Growth & Reach page just ran. Here's what changed since last month:\n\n" +
      changed.map((c) => `  • ${c.label}: ${c.beforeStr} → ${c.afterStr}${deltaSuffix(c.beforeStr, c.afterStr)}`).join('\n');
    if (unchanged.length > 0) {
      body += '\n\nNo change to: ' + unchanged.map((c) => c.label).join(', ') + '.';
    }
    body += '\n\nThe new numbers are live on the dashboard now. To see this month\'s commit on GitHub: ' +
      'https://github.com/candlerfoundry/executive-bi-dashboard/commits/main';
  }

  return { subject, body };
}

async function writeSummary(subject, body) {
  const content = subject + '\n\n' + body + '\n';
  await fs.writeFile(SUMMARY_PATH, content, 'utf-8');
}

// -- main --

async function refresh() {
  const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
  const cfg = JSON.parse(raw);
  const original = JSON.parse(raw);
  const changes = [];
  let touched = 0;

  function snapshotBefore(getter) {
    try { return String(getter(original) ?? ''); } catch { return ''; }
  }

  async function tryRefresh(sourceKey, getBefore, pull, apply) {
    const src = SOURCES[sourceKey];
    const label = src.label;
    const beforeStr = snapshotBefore(getBefore);
    try {
      const value = await pull();
      apply(value);
      const afterStr = String(value);
      if (afterStr === beforeStr) {
        changes.push({ label, status: 'unchanged', beforeStr });
      } else {
        changes.push({ label, status: 'changed', beforeStr, afterStr });
        touched++;
      }
    } catch (err) {
      changes.push({ label, status: 'failed', beforeStr, error: err.message });
    }
  }

  // Hero stats
  if (cfg.hero?.stats?.[1]) {
    const s = SOURCES.heroLearners;
    await tryRefresh('heroLearners',
      (o) => o.hero?.stats?.[1]?.value,
      async () => s.format(await airtableCount(s.tableId, s.viewId, s.filterByFormula)),
      (v) => { cfg.hero.stats[1].value = String(v); });
  }
  if (cfg.hero?.stats?.[2]) {
    const s = SOURCES.heroChurchPartners;
    await tryRefresh('heroChurchPartners',
      (o) => o.hero?.stats?.[2]?.value,
      async () => s.format(await airtableCount(s.tableId, s.viewId, s.filterByFormula)),
      (v) => { cfg.hero.stats[2].value = String(v); });
  }

  // Grid stats
  const gridMap = [
    ['registrations', SOURCES.registrations],
    ['courses',       SOURCES.courses],
    ['theoedTalks',   SOURCES.theoedTalks],
    ['podcast',       SOURCES.podcast],
  ];
  const idForKey = { registrations: 'registrations', courses: 'courses', theoedTalks: 'theoed-talks', podcast: 'podcast' };
  for (const [key] of gridMap) {
    const src = SOURCES[key];
    const id = idForKey[key];
    const stat = (cfg.stats || []).find((s) => s.id === id);
    if (!stat) continue;
    await tryRefresh(key,
      (o) => {
        const s = (o.stats || []).find((s) => s.id === id);
        return s ? s.value : '';
      },
      async () => src.format(await airtableCount(src.tableId, src.viewId, src.filterByFormula)),
      (v) => { stat.value = Number(v) || 0; });
  }

  // Recompute Churches We Serve absolute counts against the (possibly new) partner number
  const partnerStr = String(cfg.hero?.stats?.[2]?.value ?? '');
  const partnerNum = parseInt(partnerStr.replace(/[^\d]/g, ''), 10);
  if (Number.isFinite(partnerNum) && partnerNum > 0 && Array.isArray(cfg.churchSizes?.rows)) {
    cfg.churchSizes.rows = cfg.churchSizes.rows.map((row) => {
      const pct = Number(row.pct) || 0;
      const absolute = Math.round((partnerNum * pct) / 100);
      return { ...row, count: `${pct}% ~${absolute} partners` };
    });
  }

  // Decide whether to write the JSON file
  const nextSerialized = JSON.stringify(cfg);
  const origSerialized = JSON.stringify(original);
  let wrote = false;
  if (touched > 0 && nextSerialized !== origSerialized) {
    const next = JSON.stringify(cfg, null, 2) + '\n';
    await fs.writeFile(CONFIG_PATH, next, 'utf-8');
    wrote = true;
  }

  // Build and write the human-readable summary
  const { subject, body } = buildSummary(changes);
  await writeSummary(subject, body);

  // Also print to stdout so the workflow log shows it
  console.log('=== Refresh summary ===');
  console.log(subject);
  console.log();
  console.log(body);
  console.log();
  console.log(`(Wrote summary to ${SUMMARY_PATH}; ${wrote ? 'rewrote' : 'left untouched'} growth-reach.json)`);
}

refresh().catch(async (err) => {
  await writeSummary(
    'Growth & Reach refresh hit an unexpected error',
    'The monthly refresh workflow failed before it could check any numbers. The site is still fine and shows the previous numbers.\n\n' +
    `What happened (technical): ${err.message}\n\n` +
    'View the full log at: https://github.com/candlerfoundry/executive-bi-dashboard/actions'
  ).catch(() => {});
  console.error('FATAL:', err);
  process.exit(0); // exit 0 so the email step still runs
});

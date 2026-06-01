#!/usr/bin/env node
// scripts/refresh-growth-reach.mjs
//
// Monthly refresh for two donor-facing pages of the Executive BI dashboard.
//
//   1. Growth & Reach   → assets/page-config/growth-reach.json
//                         (cumulative learning + reach numbers since 2018)
//   2. This Year        → assets/page-config/this-year.json
//                         (past-12-months snapshot of CIC + On-Demand courses)
//
// Both sections share the same summary file. The workflow uses that file as
// both the commit message body AND the email body. Per-field failures never
// fail the workflow; the site keeps the last good value if Airtable balks.
//
// Env:
//   AIRTABLE_PAT  fine-grained PAT with data.records:read on base appiL0Z2RilcAT2Cw
//   RUNNER_TEMP   workflow runner's temp dir; summary is written there

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE_ID = 'appiL0Z2RilcAT2Cw'; // Candler Foundry: Master CRM
const PAT = process.env.AIRTABLE_PAT;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');
const GROWTH_PATH = path.join(REPO_ROOT, 'assets', 'page-config', 'growth-reach.json');
const TY_PATH     = path.join(REPO_ROOT, 'assets', 'page-config', 'this-year.json');
const TY_IMG_DIR  = path.join(REPO_ROOT, 'assets', 'this-year-cards');
const SUMMARY_PATH = path.join(process.env.RUNNER_TEMP || '/tmp', 'refresh-summary.txt');

if (!PAT) {
  await writeSummary(
    'Monthly refresh: missing Airtable token',
    'The refresh workflow could not run because the AIRTABLE_PAT repo secret is empty or expired.\n\n' +
    'Fix: airtable.com → account icon → Builder Hub → Personal access tokens. Confirm a token exists ' +
    "(scoped to base appiL0Z2RilcAT2Cw with data.records:read) and hasn't expired. Then in GitHub: " +
    'Settings → Secrets and variables → Actions → AIRTABLE_PAT → Update.'
  );
  console.error('AIRTABLE_PAT is not set.');
  process.exit(0);
}

// ============================================================
// Generic helpers
// ============================================================

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function parseNum(s) {
  if (s == null) return null;
  const cleaned = String(s).replace(/[^0-9.\-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function deltaSuffix(before, after) {
  // Only compute delta when both sides are simple numbers (no embedded words).
  // Skip strings like "8 courses → 24 courses" — the summary already shows the diff in plain words.
  if (/[a-zA-Z]/.test(String(before)) || /[a-zA-Z]/.test(String(after))) return '';
  const b = parseNum(before);
  const a = parseNum(after);
  if (b == null || a == null) return '';
  const d = a - b;
  if (d === 0) return '';
  const word = d > 0 ? 'up' : 'down';
  return ` (${word} ${Math.abs(d).toLocaleString()})`;
}

function formatUSD(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '$0';
  return '$' + Math.round(n).toLocaleString();
}

async function writeSummary(subject, body) {
  await fs.writeFile(SUMMARY_PATH, subject + '\n\n' + body + '\n', 'utf-8');
}

// ============================================================
// Airtable helpers
// ============================================================

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
  let count = 0, offset;
  do {
    const data = await airtableFetchPage(tableId, { viewId, offset, filterByFormula });
    count += (data.records || []).length;
    offset = data.offset;
    if (offset) await new Promise(r => setTimeout(r, 220));
  } while (offset);
  return count;
}

async function airtableFetchAll(tableId, { viewId, filterByFormula } = {}) {
  const all = [];
  let offset;
  do {
    const data = await airtableFetchPage(tableId, { viewId, offset, filterByFormula });
    all.push(...(data.records || []));
    offset = data.offset;
    if (offset) await new Promise(r => setTimeout(r, 220));
  } while (offset);
  return all;
}

async function downloadAttachment(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}: ${url.slice(0, 80)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, buf);
  return buf.length;
}

function extFromAttachment(att) {
  // Prefer extension from filename; fall back to MIME type
  const fn = String(att.filename || '');
  const fromName = fn.includes('.') ? fn.split('.').pop().toLowerCase() : '';
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  const mime = String(att.type || '');
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'jpg';
}

// ============================================================
// Growth & Reach refresh (existing logic, refactored)
// ============================================================

const GROWTH_SOURCES = {
  heroLearners:       { tableId: 'tbl0jx0urjA5KINjA', viewId: null,                                 format: n => n.toLocaleString(), label: 'Individual Learners' },
  heroChurchPartners: { tableId: 'tbloYQpUR7hVgkKtx', viewId: null,                                 format: n => String(n),          label: 'Church Partners' },
  registrations:      { tableId: 'tbldN1Ak4SHS41PvM', viewId: 'viwVxvcgfPXPldsr9',                  format: n => n,                  label: 'Total Registrations' },
  courses:            { tableId: 'tblQNAsrQcdnM8UZC', viewId: null, filterByFormula: "OR({Type}='CIC', {Type}='FFL', {Type}='On-Demand')", format: n => n, label: 'Courses Offered' },
  theoedTalks:        { tableId: 'tblS1Bk29cXyGGUdo', viewId: 'viwAChcup7xsrlhmb',                  format: n => n,                  label: 'TheoEd Talks Produced' },
  podcast:            { tableId: 'tbloVdhcMFMaMw5KC', viewId: 'viwCvQIWI6Q5mYYVY',                  format: n => n,                  label: 'Podcast Episodes' },
};

// ---- Map: learners by state (table tbl0jx0urjA5KINjA, "Student Insights (Individual)") ----
// State/City/ZIP are multipleLookupValues (arrays). State holds 2-letter codes with
// inconsistent case + typos; some rows have no geo. There is no Country field, so
// international learners are routed by an explicit token map. Keep these tables in sync
// with CANONICAL.md section 32. Unknown foreign tokens fall to "unresolved" — extend the
// INTL map as new countries appear (the summary email lists the top unresolved tokens).
const MAP_TABLE = 'tbl0jx0urjA5KINjA';
const MAP_US = new Set(['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC']);
const MAP_FULL = {
  'ALABAMA':'AL','ALASKA':'AK','ARIZONA':'AZ','ARKANSAS':'AR','CALIFORNIA':'CA','COLORADO':'CO','CONNECTICUT':'CT','DELAWARE':'DE','FLORIDA':'FL','GEORGIA':'GA','HAWAII':'HI','IDAHO':'ID','ILLINOIS':'IL','INDIANA':'IN','IOWA':'IA','KANSAS':'KS','KENTUCKY':'KY','LOUISIANA':'LA','MAINE':'ME','MARYLAND':'MD','MASSACHUSETTS':'MA','MICHIGAN':'MI','MINNESOTA':'MN','MISSISSIPPI':'MS','MISSOURI':'MO','MONTANA':'MT','NEBRASKA':'NE','NEVADA':'NV','NEW HAMPSHIRE':'NH','NEW JERSEY':'NJ','NEW MEXICO':'NM','NEW YORK':'NY','NORTH CAROLINA':'NC','NORTH DAKOTA':'ND','OHIO':'OH','OKLAHOMA':'OK','OREGON':'OR','PENNSYLVANIA':'PA','RHODE ISLAND':'RI','SOUTH CAROLINA':'SC','SOUTH DAKOTA':'SD','TENNESSEE':'TN','TEXAS':'TX','UTAH':'UT','VERMONT':'VT','VIRGINIA':'VA','WASHINGTON':'WA','WEST VIRGINIA':'WV','WISCONSIN':'WI','WYOMING':'WY','DISTRICT OF COLUMBIA':'DC','WASHINGTON DC':'DC','WASHINGTON D.C.':'DC','WASHINGTON, DC':'DC',
};
const MAP_VARIANT = {
  'GEOEGIA':'GA','GEORGIAI':'GA','GA.':'GA','GA,':'GA','TENNESEE':'TN','TENNESSE':'TN','TN.':'TN','OKLAHMA':'OK','MASS':'MA','MASS.':'MA','ILL':'IL','ILL.':'IL','N C':'NC','N.C.':'NC','NC.':'NC','NV.':'NV','NE.':'NE','CO.':'CO','AL.':'AL','WASHINGTONB':'WA',
};
const MAP_PLACE = {
  'FULTON':'GA','DEKALB':'GA','COBB':'GA','GWINNETT':'GA','CLAYTON':'GA','BROWARD':'FL','MINNEAPOLIS':'MN',
};
const MAP_INTL = {
  'ON':'Canada','ONTARIO':'Canada','BC':'Canada','BRITISH COLUMBIA':'Canada','AB':'Canada','ALBERTA':'Canada','MB':'Canada','MANITOBA':'Canada','QC':'Canada','QUEBEC':'Canada','SK':'Canada','SASKATCHEWAN':'Canada','NB':'Canada','NEW BRUNSWICK':'Canada','NS':'Canada','NL':'Canada','PE':'Canada','CANADA':'Canada',
  'INDONESIA':'Indonesia','JAKARTA':'Indonesia','DKI JAKARTA':'Indonesia','NORTH JAKARTA':'Indonesia','WEST JAVA':'Indonesia','CENTRAL JAVA':'Indonesia','EAST JAVA':'Indonesia','JAWA TENGAH':'Indonesia','JAWA TIMUR':'Indonesia','JAWA BARAT':'Indonesia','YOGYAKARTA':'Indonesia','WEST SUMATRA':'Indonesia','EAST KALIMANTAN':'Indonesia','EAST NUSA TENGGARA':'Indonesia','DEPOK':'Indonesia','-- SELECT STATE --INDONESIA':'Indonesia',
  'ENGLAND':'United Kingdom','WEST MIDLANDS':'United Kingdom','CHESHIRE':'United Kingdom','AVON':'United Kingdom','FIFE':'United Kingdom','STIRLING':'United Kingdom','LONDON':'United Kingdom','KENT':'United Kingdom',
  'SEOUL':'South Korea','GYEONGGI-DO':'South Korea','KOREA':'South Korea',
  'SINGAPORE':'Singapore','HONG KONG':'Hong Kong','HONG KONG SAR':'Hong Kong','KOWLOON':'Hong Kong','HK':'Hong Kong','SHANGHAI':'China','HUBEI':'China','TOKYO':'Japan','TAOYUAN':'Taiwan',
  'NSW':'Australia','QLD':'Australia','VIC':'Australia','METRO MANILA':'Philippines','PHILIPPINES':'Philippines','NUEVA ESPARTA':'Venezuela','CARABOBO':'Venezuela','COPPERBELT':'Zambia','LUSAKA PROVINCE':'Zambia','GHANA':'Ghana','NAIROBI':'Kenya','KERALA':'India','LIMON':'Costa Rica','NOORD HOLLAND':'Netherlands','BRUSSELS':'Belgium','BAVARIA':'Germany','VIENN':'Austria','VIENNA':'Austria','OTAGO':'New Zealand',
};
const MAP_TERRITORY = new Set(['PR','PUERTO RICO','GU','GUAM','VI','AS','MP']);
const MAP_ZIP_RANGES = [
  [6,9,'PR'],[10,27,'MA'],[28,29,'RI'],[30,38,'NH'],[39,49,'ME'],[50,59,'VT'],[60,69,'CT'],[70,89,'NJ'],[100,149,'NY'],[150,196,'PA'],[197,199,'DE'],[200,205,'DC'],[206,219,'MD'],[220,246,'VA'],[247,268,'WV'],[270,289,'NC'],[290,299,'SC'],[300,319,'GA'],[320,349,'FL'],[350,369,'AL'],[370,385,'TN'],[386,397,'MS'],[398,399,'GA'],[400,427,'KY'],[430,459,'OH'],[460,479,'IN'],[480,499,'MI'],[500,528,'IA'],[530,549,'WI'],[550,567,'MN'],[570,577,'SD'],[580,588,'ND'],[590,599,'MT'],[600,629,'IL'],[630,658,'MO'],[660,679,'KS'],[680,693,'NE'],[700,714,'LA'],[716,729,'AR'],[730,749,'OK'],[750,799,'TX'],[800,816,'CO'],[820,831,'WY'],[832,838,'ID'],[840,847,'UT'],[850,865,'AZ'],[870,884,'NM'],[889,898,'NV'],[900,961,'CA'],[967,968,'HI'],[969,969,'GU'],[970,979,'OR'],[980,994,'WA'],[995,999,'AK'],
];
function mapZipToState(raw) {
  if (raw == null) return null;
  const digits = String(raw).replace(/[^0-9]/g, '');
  if (digits.length < 3) return null;
  const p = parseInt(digits.slice(0, 3), 10);
  if (!Number.isFinite(p)) return null;
  for (const [lo, hi, st] of MAP_ZIP_RANGES) if (p >= lo && p <= hi) return st;
  return null;
}
function mapFirstVal(v) {
  if (Array.isArray(v)) { for (const x of v) if (x !== null && x !== undefined && x !== '') return x; return null; }
  return (v === '' || v === undefined) ? null : v;
}
function mapClassify(fields) {
  const rawState = mapFirstVal(fields['State']);
  const zip = mapFirstVal(fields['ZIP']) ?? mapFirstVal(fields['ZIP for Mailing Labels']);
  if (rawState != null) {
    const s = String(rawState).trim().toUpperCase().replace(/\s+/g, ' ');
    if (/^\d{3,5}(-\d{4})?$/.test(s.replace(/\s/g, ''))) {
      const st = mapZipToState(s);
      if (st && MAP_US.has(st)) return { kind: 'US', code: st };
      if (st && MAP_TERRITORY.has(st)) return { kind: 'TERRITORY' };
    }
    const stripDot = s.replace(/\.+$/, '').trim();
    if (MAP_US.has(s)) return { kind: 'US', code: s };
    if (MAP_US.has(stripDot)) return { kind: 'US', code: stripDot };
    if (MAP_FULL[s]) return { kind: 'US', code: MAP_FULL[s] };
    if (MAP_VARIANT[s]) return { kind: 'US', code: MAP_VARIANT[s] };
    if (MAP_PLACE[s]) return { kind: 'US', code: MAP_PLACE[s] };
    if (MAP_INTL[s]) return { kind: 'INTL', code: MAP_INTL[s] };
    if (MAP_TERRITORY.has(s)) return { kind: 'TERRITORY' };
    if (s === 'UNITED STATES' || s === 'USA' || s === 'US' || s === 'U.S.A.' || s === 'U.S.') {
      const st = mapZipToState(zip);
      if (st && MAP_US.has(st)) return { kind: 'US', code: st };
      return { kind: 'US_NOSTATE' };
    }
    const codeMatch = s.match(/\b([A-Z]{2})\b/g);
    if (codeMatch) {
      for (const c of codeMatch) if (MAP_US.has(c)) return { kind: 'US', code: c };
      for (const c of codeMatch) if (MAP_INTL[c]) return { kind: 'INTL', code: MAP_INTL[c] };
    }
    const st2 = mapZipToState(s);
    if (st2 && MAP_US.has(st2)) return { kind: 'US', code: st2 };
    return { kind: 'UNRESOLVED', token: s };
  }
  const st = mapZipToState(zip);
  if (st && MAP_US.has(st)) return { kind: 'US', code: st };
  if (st && MAP_TERRITORY.has(st)) return { kind: 'TERRITORY' };
  return { kind: 'UNRESOLVED', token: null };
}
function aggregateMapByState(records) {
  const byState = {}; for (const s of MAP_US) byState[s] = 0;
  const intl = {};
  let usTotal = 0, intlTotal = 0;
  const unresolved = {};
  for (const r of records) {
    const c = mapClassify(r.fields || {});
    if (c.kind === 'US') { byState[c.code]++; usTotal++; }
    else if (c.kind === 'INTL') { intl[c.code] = (intl[c.code] || 0) + 1; intlTotal++; }
    else if (c.kind === 'UNRESOLVED' && c.token) { unresolved[c.token] = (unresolved[c.token] || 0) + 1; }
  }
  // sort state keys A–Z and country keys by count desc for stable diffs
  const sortedStates = {}; for (const s of [...MAP_US].sort()) sortedStates[s] = byState[s];
  const byCountry = {}; for (const [k, v] of Object.entries(intl).sort((a, b) => b[1] - a[1])) byCountry[k] = v;
  const topUnresolved = Object.entries(unresolved).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t, n]) => `${t}(${n})`);
  return {
    byState: sortedStates,
    international: { total: intlTotal, countries: Object.keys(byCountry).length, byCountry },
    meta: { located: usTotal, total: records.length },
    topUnresolved,
  };
}

async function refreshGrowthReach() {
  const raw = await fs.readFile(GROWTH_PATH, 'utf-8');
  const cfg = JSON.parse(raw);
  const original = JSON.parse(raw);
  const changes = [];
  let touched = 0;

  async function tryRefresh(label, getBefore, pull, apply) {
    const beforeStr = String((function(){ try { return getBefore(original); } catch { return ''; }})() ?? '');
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

  if (cfg.hero?.stats?.[1]) {
    const s = GROWTH_SOURCES.heroLearners;
    await tryRefresh(s.label,
      o => o.hero?.stats?.[1]?.value,
      async () => s.format(await airtableCount(s.tableId, s.viewId, s.filterByFormula)),
      v => { cfg.hero.stats[1].value = String(v); });
  }
  if (cfg.hero?.stats?.[2]) {
    const s = GROWTH_SOURCES.heroChurchPartners;
    await tryRefresh(s.label,
      o => o.hero?.stats?.[2]?.value,
      async () => s.format(await airtableCount(s.tableId, s.viewId, s.filterByFormula)),
      v => { cfg.hero.stats[2].value = String(v); });
  }

  const gridMap = [
    ['registrations', GROWTH_SOURCES.registrations],
    ['courses',       GROWTH_SOURCES.courses],
    ['theoed-talks',  GROWTH_SOURCES.theoedTalks],
    ['podcast',       GROWTH_SOURCES.podcast],
  ];
  for (const [id, src] of gridMap) {
    const stat = (cfg.stats || []).find(s => s.id === id);
    if (!stat) continue;
    await tryRefresh(src.label,
      o => ((o.stats || []).find(s => s.id === id) || {}).value,
      async () => src.format(await airtableCount(src.tableId, src.viewId, src.filterByFormula)),
      v => { stat.value = Number(v) || 0; });
  }

  // Map: learners by state (rewrites cfg.map.byState / international / meta; keeps tiers + copy)
  if (cfg.map && cfg.map.byState) {
    try {
      const recs = await airtableFetchAll(MAP_TABLE);
      const agg = aggregateMapByState(recs);
      if (Object.keys(agg.byState).length) {
        const beforeJson = JSON.stringify({ b: cfg.map.byState, i: cfg.map.international, m: cfg.map.meta });
        const beforeStr = `${(cfg.map.meta && cfg.map.meta.located) || 0} located`;
        cfg.map.byState = agg.byState;
        cfg.map.international = agg.international;
        cfg.map.meta = agg.meta;
        const afterJson = JSON.stringify({ b: cfg.map.byState, i: cfg.map.international, m: cfg.map.meta });
        const afterStr = `${agg.meta.located} located, ${agg.international.total} international`;
        if (afterJson === beforeJson) {
          changes.push({ label: 'Map (learners by state)', status: 'unchanged', beforeStr });
        } else {
          changes.push({ label: 'Map (learners by state)', status: 'changed', beforeStr, afterStr });
          touched++;
        }
        if (agg.topUnresolved.length) console.log('  map: top unresolved State tokens →', agg.topUnresolved.join(', '));
      }
    } catch (err) {
      changes.push({ label: 'Map (learners by state)', status: 'failed', beforeStr: 'kept previous', error: err.message });
    }
  }

  // Recompute Churches We Serve against latest Church Partners number
  const partnerStr = String(cfg.hero?.stats?.[2]?.value ?? '');
  const partnerNum = parseInt(partnerStr.replace(/[^\d]/g, ''), 10);
  if (Number.isFinite(partnerNum) && partnerNum > 0 && Array.isArray(cfg.churchSizes?.rows)) {
    cfg.churchSizes.rows = cfg.churchSizes.rows.map(row => {
      const pct = Number(row.pct) || 0;
      const absolute = Math.round(partnerNum * pct / 100);
      return { ...row, count: `${pct}% ~${absolute} partners` };
    });
  }

  let wrote = false;
  if (touched > 0) {
    const nextNorm = JSON.stringify(cfg);
    const origNorm = JSON.stringify(original);
    if (nextNorm !== origNorm) {
      await fs.writeFile(GROWTH_PATH, JSON.stringify(cfg, null, 2) + '\n', 'utf-8');
      wrote = true;
    }
  }
  return { changes, wrote, touched };
}

// ============================================================
// This Year refresh
// ============================================================

const TY_FIELDS = [
  'Course or Webinar Title',
  'Semester',
  'Instructor(s)',
  'Type',
  'Open?',
  'Short Description (Webflow)',
  'Course Start/Release Date',
  'Course End Date',
  'Status',
  'Framing Question',
  '# Reg',
  '# Candler Alumni',
  'Landing Page',
  'Graphic',
  'Partner Contribution',
  'Total Gross Revenue',
];

const TY_COURSE_TABLE = 'tblQNAsrQcdnM8UZC'; // Course & OND Planner

function tyStripRichText(s) {
  if (!s) return '';
  // Airtable rich text comes back as markdown-ish. Strip the common markers
  // so the donor-facing card stays plain prose.
  return String(s)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tyExtractInstructor(field) {
  if (!field) return '';
  if (Array.isArray(field)) return field.join(', ');
  return String(field);
}

async function refreshThisYear() {
  const raw = await fs.readFile(TY_PATH, 'utf-8');
  const cfg = JSON.parse(raw);
  const original = JSON.parse(raw);
  const changes = [];
  let touched = 0;

  // Build the wide filter (all four types) for stats
  const months = parseInt(cfg.filter?.windowMonths, 10) || 12;
  const statsTypes = cfg.filter?.includeTypesForStats || ['CIC', 'On-Demand', 'CCA', 'FFL'];
  const tilesTypes = cfg.filter?.includeTypesForTiles || ['CIC', 'On-Demand'];
  const congEnrAvg = parseInt(cfg.filter?.congregationalEnrollmentAvg, 10) || 50;
  const requireGraphic = cfg.filter?.requireGraphic !== false;

  const typeClause = statsTypes.map(t => `{Type}='${t.replace(/'/g, "\\'")}'`).join(', ');
  const minStart = cfg.filter?.minStartDate; // e.g. "2025-06-01" — courses must start on/after this date
  let dateClause = `IS_AFTER({Course Start/Release Date}, DATEADD(TODAY(), -${months}, 'months'))`;
  if (minStart) {
    // IS_AFTER is strict (>); subtract one day so the floor is inclusive.
    const d = new Date(minStart + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - 1);
    const inclusiveFloor = d.toISOString().slice(0, 10);
    dateClause = `AND(${dateClause}, IS_AFTER({Course Start/Release Date}, '${inclusiveFloor}'))`;
  }
  const filterByFormula = `AND(${dateClause}, OR(${typeClause}))`;

  let records;
  try {
    records = await airtableFetchAll(TY_COURSE_TABLE, { filterByFormula });
  } catch (err) {
    // Fatal: can't compute anything. Mark each stat as failed.
    const labels = ['Courses Offered', 'Total Enrollments', 'Candler Alumni', 'Operational Revenue'];
    for (const label of labels) {
      changes.push({ label, status: 'failed', beforeStr: 'n/a', error: err.message });
    }
    return { changes, wrote: false, touched: 0 };
  }

  // ---- Compute the four banner stats ----
  // Courses Offered: count of CIC + On-Demand (tile-eligible types) in window, all of them (not graphic-gated).
  // Total Enrollments: open CIC reg + OND reg + (cong CIC count * 50)
  // Candler Alumni: sum # Candler Alumni across CIC + OND in window
  // Operational Revenue: across CIC + CCA + FFL: cong CIC -> Partner Contribution, else -> Total Gross Revenue
  let coursesCount = 0, enrollments = 0, alumni = 0, revenue = 0;
  for (const rec of records) {
    const f = rec.fields || {};
    const type = f['Type'];
    const openType = f['Open?'];
    const reg = parseNum(f['# Reg']) || 0;
    const candlerAlumni = parseNum(f['# Candler Alumni']) || 0;
    const totalRevenue = parseNum(f['Total Gross Revenue']) || 0;
    const partnerContribution = parseNum(f['Partner Contribution']) || 0;
    const isCong = type === 'CIC' && openType === 'Congregational';
    if (tilesTypes.includes(type)) {
      coursesCount++;
      alumni += candlerAlumni;
      if (isCong) {
        enrollments += congEnrAvg;
      } else {
        enrollments += reg;
      }
    }
    // Revenue includes the broader statsTypes
    if (isCong) {
      revenue += partnerContribution;
    } else {
      revenue += totalRevenue;
    }
  }

  // ---- Apply to config + collect changes ----
  function setStat(id, newValue, label) {
    const before = ((original.stats || []).find(s => s.id === id) || {}).value;
    const beforeStr = String(before ?? '');
    const afterStr = String(newValue);
    const target = (cfg.stats || []).find(s => s.id === id);
    if (!target) return;
    target.value = newValue;
    if (afterStr === beforeStr) {
      changes.push({ label, status: 'unchanged', beforeStr });
    } else {
      changes.push({ label, status: 'changed', beforeStr, afterStr });
      touched++;
    }
  }

  setStat('courses',     coursesCount, 'Courses Offered');
  setStat('enrollments', enrollments,  'Total Enrollments');
  setStat('alumni',      alumni,       'Candler Alumni');
  setStat('revenue',     Math.round(revenue), 'Operational Revenue');

  // ---- Build tile course list ----
  const tileRecords = records
    .filter(r => tilesTypes.includes((r.fields || {})['Type']))
    .filter(r => {
      const f = r.fields || {};
      const t = f['Type'];
      const status = f['Status'];
      const reg = Number(f['# Reg']) || 0;
      // Status: 'Final' or blank both count (some real courses are untagged).
      // For OND, also accept any course with > 1 registered (covers the
      // "sometimes OND courses aren't properly marked" case).
      const statusOk = (status === 'Final' || !status);
      if (t === 'On-Demand') {
        if (!statusOk && reg <= 1) return false;
      } else {
        if (!statusOk) return false;
      }
      if (t === 'CIC' && f['Open?'] !== 'Open to public') return false;
      return true;
    })
    .filter(r => !requireGraphic || ((r.fields || {})['Graphic'] || []).length > 0)
    .sort((a, b) => {
      // CIC first, then On-Demand. Within each group: start date desc (newest first).
      const at = (a.fields?.['Type'] === 'On-Demand') ? 1 : 0;
      const bt = (b.fields?.['Type'] === 'On-Demand') ? 1 : 0;
      if (at !== bt) return at - bt;
      const ad = String(a.fields?.['Course Start/Release Date'] || '');
      const bd = String(b.fields?.['Course Start/Release Date'] || '');
      return bd.localeCompare(ad);
    });

  // Download images, build the course array
  const newCourses = [];
  const seenIds = new Set();
  for (const rec of tileRecords) {
    const f = rec.fields || {};
    const recId = rec.id;
    seenIds.add(recId);
    let imagePath = '';
    const graphics = f['Graphic'] || [];
    if (graphics.length > 0) {
      const att = graphics[0];
      const ext = extFromAttachment(att);
      const relPath = `assets/this-year-cards/${recId}.${ext}`;
      const fsPath = path.join(REPO_ROOT, relPath);
      try {
        await downloadAttachment(att.url, fsPath);
        imagePath = '/' + relPath;
      } catch (err) {
        console.warn(`  ! image download failed for ${f['Course or Webinar Title']}: ${err.message}`);
      }
    }
    newCourses.push({
      id: recId,
      title: f['Course or Webinar Title'] || '',
      instructor: tyExtractInstructor(f['Instructor(s)']),
      semester: f['Semester'] || '',
      type: f['Type'] || '',
      openType: f['Open?'] || '',
      description: tyStripRichText(
        (function(fq){
          if (!fq) return '';
          if (typeof fq === 'string') return fq;
          if (typeof fq === 'object' && fq.value) return String(fq.value);
          return '';
        })(f['Framing Question']) || f['Short Description (Webflow)'] || ''
      ),
      image: imagePath,
      registrations: parseNum(f['# Reg']) || 0,
      candlerAlumni: parseNum(f['# Candler Alumni']) || 0,
      landingUrl: f['Landing Page'] || '',
      startDate: String(f['Course Start/Release Date'] || ''),
      endDate: String(f['Course End Date'] || ''),
    });
  }

  // Clean up images for courses no longer in the list
  try {
    const existing = await fs.readdir(TY_IMG_DIR).catch(() => []);
    for (const name of existing) {
      const m = name.match(/^(rec[A-Za-z0-9]+)\./);
      if (!m) continue;
      if (!seenIds.has(m[1])) {
        await fs.unlink(path.join(TY_IMG_DIR, name)).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('  ! image cleanup partial:', err.message);
  }

  // ---- Compare course list as a single change line ----
  const oldCourses = original.courses || [];
  const oldIds = new Set(oldCourses.map(c => c.id));
  const newIds = new Set(newCourses.map(c => c.id));
  const added = [...newIds].filter(id => !oldIds.has(id)).length;
  const removed = [...oldIds].filter(id => !newIds.has(id)).length;
  cfg.courses = newCourses;
  const courseListChanged = JSON.stringify(oldCourses) !== JSON.stringify(newCourses);
  if (courseListChanged) {
    touched++;
    let detail = `${newCourses.length} courses`;
    if (added || removed) {
      const parts = [];
      if (added)   parts.push(`${added} added`);
      if (removed) parts.push(`${removed} aged out`);
      detail += ` (${parts.join(', ')})`;
    }
    changes.push({ label: 'Course list', status: 'changed', beforeStr: `${oldCourses.length} courses`, afterStr: detail });
  }

  // ---- Write ----
  let wrote = false;
  if (touched > 0 || courseListChanged) {
    const nextSerialized = JSON.stringify(cfg);
    const origSerialized = JSON.stringify(original);
    if (nextSerialized !== origSerialized) {
      await fs.writeFile(TY_PATH, JSON.stringify(cfg, null, 2) + '\n', 'utf-8');
      wrote = true;
    }
  }
  return { changes, wrote, touched };
}

// ============================================================
// Summary builder
// ============================================================

function statusOf(changes) {
  const c = changes.filter(x => x.status === 'changed').length;
  const f = changes.filter(x => x.status === 'failed').length;
  const u = changes.filter(x => x.status === 'unchanged').length;
  return { changed: c, failed: f, unchanged: u, total: changes.length };
}

function sectionBody(name, intro, changes) {
  const s = statusOf(changes);
  const changed = changes.filter(x => x.status === 'changed');
  const unchanged = changes.filter(x => x.status === 'unchanged');
  const failed = changes.filter(x => x.status === 'failed');
  let body = '';
  body += '**' + name + '** ' + intro + '\n';
  if (changed.length) {
    for (const c of changed) {
      body += `  • ${c.label}: ${c.beforeStr} → ${c.afterStr}${deltaSuffix(c.beforeStr, c.afterStr)}\n`;
    }
  }
  if (failed.length) {
    body += (changed.length ? '\n  Couldn\'t be updated (kept previous values):\n' : '');
    for (const f of failed) {
      body += `  • ${f.label}: stayed at ${f.beforeStr} — error: ${f.error}\n`;
    }
  }
  if (!changed.length && !failed.length) {
    body += '  No changes this month.\n';
  }
  if (unchanged.length && changed.length) {
    body += '  No change to: ' + unchanged.map(x => x.label).join(', ') + '.\n';
  }
  return body;
}

function buildCombinedSummary(growthChanges, tyChanges) {
  const gS = statusOf(growthChanges);
  const tS = statusOf(tyChanges);
  const totalChanged = gS.changed + tS.changed;
  const totalFailed = gS.failed + tS.failed;

  let subject;
  if (totalFailed === gS.total + tS.total && (gS.total + tS.total) > 0) {
    subject = 'Monthly refresh hit a problem — site is still fine';
  } else if (totalFailed > 0) {
    subject = `Monthly refresh: ${totalChanged} updated, ${totalFailed} couldn't be looked up`;
  } else if (totalChanged === 0) {
    subject = 'Monthly refresh ran (no changes this month)';
  } else {
    const word = totalChanged === 1 ? 'number' : 'numbers';
    subject = `Monthly refresh: ${totalChanged} ${word} updated this month`;
  }

  let body = "The monthly refresh of your dashboard just ran. Here's what changed since last month:\n\n";
  body += sectionBody('Growth & Reach', '(cumulative since 2018):', growthChanges);
  body += '\n';
  body += sectionBody('This Year\'s Courses', '(past 12 months):', tyChanges);

  if (totalFailed > 0) {
    body += '\n';
    body += 'Most common cause of lookup errors: the Airtable token expired or an Airtable view was renamed. ' +
            'Check at airtable.com → Builder Hub → Personal access tokens.';
  } else if (totalChanged > 0) {
    body += '\nThe new numbers are live on the dashboard now.';
  }

  return { subject, body };
}

// ============================================================
// Main
// ============================================================

async function main() {
  let growth = { changes: [], wrote: false, touched: 0 };
  let ty = { changes: [], wrote: false, touched: 0 };

  try { growth = await refreshGrowthReach(); }
  catch (err) {
    console.error('Growth & Reach refresh fatal:', err);
    growth.changes.push({ label: 'Growth & Reach (overall)', status: 'failed', beforeStr: 'n/a', error: err.message });
  }

  try { ty = await refreshThisYear(); }
  catch (err) {
    console.error('This Year refresh fatal:', err);
    ty.changes.push({ label: "This Year's Courses (overall)", status: 'failed', beforeStr: 'n/a', error: err.message });
  }

  const { subject, body } = buildCombinedSummary(growth.changes, ty.changes);
  await writeSummary(subject, body);
  console.log('=== Refresh summary ===');
  console.log(subject);
  console.log();
  console.log(body);
  console.log();
  console.log(`(growth-reach.json: ${growth.wrote ? 'rewrote' : 'untouched'}; this-year.json: ${ty.wrote ? 'rewrote' : 'untouched'})`);
}

main().catch(async err => {
  await writeSummary(
    'Monthly refresh hit an unexpected error',
    'The workflow failed before it could check any numbers. The site is still fine and shows the previous numbers.\n\n' +
    `What happened (technical): ${err.message}\n\n` +
    'View the full log at: https://github.com/candlerfoundry/executive-bi-dashboard/actions'
  ).catch(() => {});
  console.error('FATAL:', err);
  process.exit(0);
});

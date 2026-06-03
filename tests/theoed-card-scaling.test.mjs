import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
const theoedConfig = JSON.parse(fs.readFileSync(path.resolve('assets/page-config/theoed.json'), 'utf8'));

function extractRule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = indexHtml.match(new RegExp(`${escaped}\\s*\\{[^}]+\\}`, 's'));
  assert.ok(match, `Missing CSS rule for ${selector}`);
  return match[0];
}

function extractTheoedMobileBlock() {
  const start = indexHtml.indexOf('@media (max-width:960px)', indexHtml.indexOf('/* TAB: THEOED */'));
  assert.notEqual(start, -1, 'Missing TheoEd mobile media query');
  const nextSection = indexHtml.indexOf('/* TABS 5 & 6 */', start);
  assert.notEqual(nextSection, -1, 'Missing end of TheoEd CSS section');
  return indexHtml.slice(start, nextSection);
}

test('TheoEd speaker cards scale copy from the rendered card width', () => {
  const tileRule = extractRule('.theoed-speaker-tile');
  const quoteRule = extractRule('.theoed-tile-quote');
  const nameRule = extractRule('.theoed-tile-name');

  assert.match(tileRule, /container-type\s*:\s*inline-size/);
  assert.match(tileRule, /grid-template-columns:\s*minmax\(52%,1\.08fr\)\s+minmax\(0,0\.92fr\)/);
  assert.match(quoteRule, /cqw/);
  assert.match(quoteRule, /font-size:\s*clamp\(0\.84rem,3\.45cqw,1\.18rem\)/);
  assert.match(nameRule, /font-size:\s*clamp\(1\.12rem,4\.6cqw,1\.68rem\)/);
  assert.doesNotMatch(quoteRule, /-webkit-line-clamp|display\s*:\s*-webkit-box|overflow\s*:\s*hidden/);
});

test('TheoEd hero desktop height with a larger lifted logo', () => {
  const heroRule = extractRule('.te-hero');
  const heroContentRule = extractRule('.te-hero-content');
  const logoRule = extractRule('.te-logo-img');

  // 348px (raised from 304px on 2026-06-03 for more bottom padding on large monitors)
  assert.match(heroRule, /height:\s*348px/);
  assert.match(heroContentRule, /height:\s*348px/);
  assert.match(logoRule, /clamp\(230px,18\.4vw,345px\)/);
  assert.match(logoRule, /--te-logo-offset-y,\s*-8px/);
  assert.match(logoRule, /drop-shadow/);
});

test('TheoEd narrow layouts preserve the media and copy split', () => {
  const mobileBlock = extractTheoedMobileBlock();

  assert.match(
    mobileBlock,
    /\.theoed-speaker-tile\s*\{[^}]*grid-template-columns\s*:\s*minmax\(/s
  );
  assert.doesNotMatch(
    mobileBlock,
    /\.theoed-speaker-tile\s*\{[^}]*grid-template-columns\s*:\s*1fr\b/s
  );
  assert.doesNotMatch(
    mobileBlock,
    /\.theoed-speaker-tile\s*\{[^}]*height\s*:\s*auto\b/s
  );
});

test('TheoEd published config has corrected hero stats and featured card details', () => {
  const stats = theoedConfig.hero.stats;
  assert.equal(stats[0].number, '13');
  assert.equal(stats[0].label, 'Events Hosted');
  assert.equal(stats[1].number, '6');
  assert.equal(stats[1].label, 'Cities');

  const suzanne = theoedConfig.speakers.find((speaker) => speaker.name === 'Suzanne Stabile');
  const amyJill = theoedConfig.speakers.find((speaker) => speaker.name === 'Amy-Jill Levine');
  const julian = theoedConfig.speakers.find((speaker) => speaker.name === 'Julian Davis Reid');

  assert.equal(suzanne.loc, 'Nashville · 2025');
  assert.equal(julian.loc, 'Nashville · 2025');
  assert.equal(amyJill.imgPos, '18% 26%');
});

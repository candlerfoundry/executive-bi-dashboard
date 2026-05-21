import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const helperPath = path.resolve('assets/mission-responsive-art-prototype.js');
const source = fs.readFileSync(helperPath, 'utf8');
const missionConfig = JSON.parse(fs.readFileSync(path.resolve('assets/page-config/mission-page.json'), 'utf8'));
const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
const sandbox = {
  window: {
    location: { search: '' },
    URLSearchParams
  },
  console
};
sandbox.globalThis = sandbox.window;
vm.runInNewContext(source, sandbox, { filename: helperPath });

function extractContainerRule(cssSource, queryText) {
  const start = cssSource.indexOf(queryText);
  assert.notEqual(start, -1, `Missing CSS query: ${queryText}`);
  const bodyStart = cssSource.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < cssSource.length; i += 1) {
    if (cssSource[i] === '{') depth += 1;
    if (cssSource[i] === '}') depth -= 1;
    if (depth === 0) return cssSource.slice(bodyStart + 1, i);
  }
  assert.fail(`Could not parse CSS query body: ${queryText}`);
}

const prototype = sandbox.window.MissionResponsiveArtPrototype;

test('production Mission responsive art alias remains compatible with prototype global', () => {
  assert.equal(sandbox.window.MissionResponsiveArt, prototype);
});

test('normalized Mission art is active by default with a legacy opt-out', () => {
  assert.equal(prototype.isEnabled(''), true);
  assert.equal(prototype.isEnabled('?missionArtPrototype=1'), true);
  assert.equal(prototype.isEnabled('?mission-art-prototype=true'), true);
  assert.equal(prototype.isEnabled('?missionArtLegacy=1'), false);
  assert.equal(prototype.isEnabled('?mission-art-legacy=true'), false);
  assert.equal(prototype.isEnabled('?missionArtLegacy=0'), true);
});

test('card normalization reproduces the 1920 reference state', () => {
  const vars = prototype.computeCardVars('sunday-school-simplified', {
    width: 408.7,
    height: 320
  }, missionConfig.cards['sunday-school-simplified']);

  assert.equal(vars.widthPx, 144);
  assert.equal(vars.topPx, 16);
  assert.equal(vars.rightPx, 10);
  assert.equal(vars.bottomPx, 12);
  assert.equal(vars.shiftXPx, 1020);
  assert.equal(vars.shiftYPx, 15);
  assert.equal(vars.scale, 8.74);
});

test('card normalization keeps art coordinates proportional as cards narrow', () => {
  const reference = prototype.computeCardVars('sunday-school-simplified', {
    width: 408.7,
    height: 320
  }, missionConfig.cards['sunday-school-simplified']);
  const narrow = prototype.computeCardVars('sunday-school-simplified', {
    width: 218,
    height: 272
  }, missionConfig.cards['sunday-school-simplified']);

  assert.equal(Math.round(narrow.widthPx * 100) / 100, 76.81);
  assert.equal(Math.round(narrow.shiftXPx * 100) / 100, 544.07);
  assert.equal(narrow.scale, reference.scale);
  assert.equal(
    Math.round((narrow.widthPx / 218) * 1000),
    Math.round((reference.widthPx / 408.7) * 1000)
  );
});

test('card references are derived from all configured Mission front-art cards', () => {
  const cardIds = Object.keys(missionConfig.cards).sort();
  const normalizedIds = cardIds
    .filter((cardId) => prototype.resolveCardReference(cardId, missionConfig.cards[cardId]))
    .sort();

  assert.equal(cardIds.length, 8);
  assert.deepEqual(normalizedIds, cardIds);
});

test('configured community and ministry art values are interpreted at reference geometry', () => {
  const onDemand = prototype.computeCardVars('on-demand-courses', {
    width: 623.06,
    height: 320
  }, missionConfig.cards['on-demand-courses']);
  assert.equal(onDemand.widthPx, 164);
  assert.equal(onDemand.shiftXPx, 0);
  assert.equal(onDemand.shiftYPx, -244);
  assert.equal(onDemand.scale, 10.3);

  const bible = prototype.computeCardVars('3-minute-bible', {
    width: 408.7,
    height: 320
  }, missionConfig.cards['3-minute-bible']);
  assert.equal(bible.widthPx, 144);
  assert.equal(bible.rightPx, 10);
  assert.equal(bible.shiftXPx, 300);
  assert.equal(bible.shiftYPx, -20);
  assert.equal(bible.scale, 4.44);
});

test('responsive edge bleed preserves the reference state at 1920 geometry', () => {
  const vars = prototype.computeCardVars('on-demand-courses', {
    width: 623.06,
    height: 320
  }, missionConfig.cards['on-demand-courses']);

  assert.equal(vars.widthPx, 164);
  assert.equal(vars.rightPx, 14);
  assert.equal(vars.bottomPx, 12);
  assert.equal(vars.bleedRightPx, 0);
  assert.equal(vars.bleedBottomPx, 0);
});

test('responsive edge bleed expands and anchors art as cards shrink', () => {
  const vars = prototype.computeCardVars('3-minute-bible', {
    width: 301.188,
    height: 272
  }, missionConfig.cards['3-minute-bible']);

  assert.ok(vars.widthPx > 106.119);
  assert.equal(vars.bottomPx, 0);
  assert.ok(vars.bleedBottomPx > 9);
  assert.ok(vars.bleedRightPx > 6);
});

test('editor-authored edge bleed overrides the built-in edge intent', () => {
  const vars = prototype.computeCardVars('3-minute-bible', {
    width: 301.188,
    height: 272
  }, {
    ...missionConfig.cards['3-minute-bible'],
    frontGraphicBleedBottom: 2,
    frontGraphicBleedRight: 0,
    frontGraphicBleedWidth: 0
  });

  assert.equal(vars.bleedBottomPx, 1.7);
  assert.equal(vars.bleedRightPx, 0);
  assert.equal(vars.bleedWidthPx, 0);
  assert.equal(vars.bottomPx, 8.5);
});

test('exhausted bottom bleed becomes responsive art overscan', () => {
  const candler = prototype.computeCardVars('candler-in-conversation', {
    width: 301.188,
    height: 272
  }, missionConfig.cards['candler-in-conversation']);

  assert.equal(candler.bottomPx, 0);
  assert.ok(candler.widthPx > 120);
  assert.ok(candler.shiftYPx >= 8);
  assert.ok(candler.scale > missionConfig.cards['candler-in-conversation'].frontGraphicScale);

  const bible = prototype.computeCardVars('3-minute-bible', {
    width: 301.188,
    height: 272
  }, missionConfig.cards['3-minute-bible']);

  assert.equal(bible.bottomPx, 0);
  assert.ok(bible.shiftYPx > -14);
});

test('explicit editor-authored graphic widths scale from the reference state', () => {
  const vars = prototype.computeCardVars('custom-public-card', {
    width: 306.525,
    height: 240
  }, {
    section: 'public',
    frontGraphicWidth: 200,
    frontGraphicShiftX: 80,
    frontGraphicShiftY: -40,
    frontGraphicScale: 2.5
  });

  assert.equal(vars.widthPx, 150);
  assert.equal(vars.shiftXPx, 60);
  assert.equal(vars.shiftYPx, -30);
  assert.equal(vars.scale, 2.5);
});

test('hero normalization preserves the reference split and prevents zero-width art', () => {
  const reference = prototype.computeHeroLayout({ overlayWidth: 1600, gapPx: 30 });
  assert.equal(reference.textPx, 960);
  assert.equal(reference.visualPx, 610);

  const laptop = prototype.computeHeroLayout({ overlayWidth: 944, gapPx: 30 });
  assert.equal(Math.round(laptop.textPx), 559);
  assert.equal(Math.round(laptop.visualPx), 355);
  assert.ok(laptop.visualPx > 0);
});

test('lookbook backs keep a split feature column in narrow card containers', () => {
  const narrowLookbookCss = extractContainerRule(indexHtml, '@container (max-width:480px)');
  const tinyLookbookCss = extractContainerRule(indexHtml, '@container (max-width:360px)');

  assert.match(
    narrowLookbookCss,
    /\.mission-page \.card-back--lookbook\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(clamp\(/s
  );
  assert.doesNotMatch(
    narrowLookbookCss,
    /\.mission-page \.card-back--lookbook\s*{[^}]*grid-template-columns:\s*1fr\b/s
  );
  assert.doesNotMatch(
    narrowLookbookCss,
    /\.mission-page \.card-back--lookbook\s*{[^}]*grid-template-rows:/s
  );
  assert.doesNotMatch(
    `${narrowLookbookCss}\n${tinyLookbookCss}`,
    /\.mission-page \.card-back--lookbook \.lb-lead\s*{[^}]*(?:-webkit-line-clamp|overflow\s*:\s*hidden|display\s*:\s*-webkit-box)/s
  );
  assert.doesNotMatch(
    narrowLookbookCss,
    /\.mission-page \.card-back--lookbook \.lb-ctas\s*{[^}]*margin-top\s*:\s*(?!auto\b)/s
  );
});

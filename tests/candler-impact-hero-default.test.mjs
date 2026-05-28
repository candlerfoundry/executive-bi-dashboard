import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const INTENDED_HERO_IMAGE = '/assets/student_photos/Master Class Student Talking 5.jpg';
const LEGACY_VIGNETTE_IMAGE = '/assets/Graphic Vignettes/vignette-city-life-banner.png';

const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
const canonical = fs.readFileSync(path.resolve('CANONICAL.md'), 'utf8');
const candlerConfig = JSON.parse(fs.readFileSync(path.resolve('assets/page-config/candler-impact.json'), 'utf8'));

function extractImpactDefaultsBlock() {
  const start = indexHtml.indexOf('var IMPACT_EDITOR_DEFAULTS = {');
  assert.notEqual(start, -1, 'Missing Candler Impact editor defaults');
  const end = indexHtml.indexOf('var impactEditorRuntime = {', start);
  assert.notEqual(end, -1, 'Missing end of Candler Impact editor defaults block');
  return indexHtml.slice(start, end);
}

function extractImpactPresetSelect() {
  const start = indexHtml.indexOf('<select id="impact-editor-hero-image">');
  assert.notEqual(start, -1, 'Missing Candler Impact hero image preset select');
  const end = indexHtml.indexOf('</select>', start);
  assert.notEqual(end, -1, 'Missing end of Candler Impact hero image preset select');
  return indexHtml.slice(start, end);
}

function extractCanonicalImpactHeroSection() {
  const start = canonical.indexOf('## 3. CANDLER IMPACT - HERO');
  assert.notEqual(start, -1, 'Missing Candler Impact hero canonical section');
  const end = canonical.indexOf('## 4.', start);
  assert.notEqual(end, -1, 'Missing end of Candler Impact hero canonical section');
  return canonical.slice(start, end);
}

function extractImpactLayoutFunction() {
  const start = indexHtml.indexOf('function impactApplyCssVars(config) {');
  assert.notEqual(start, -1, 'Missing Candler Impact CSS variable function');
  const end = indexHtml.indexOf('function impactApplyHero(config) {', start);
  assert.notEqual(end, -1, 'Missing end of Candler Impact CSS variable function');
  return indexHtml.slice(start, end);
}

function extractImpactHeroAfterRule() {
  const match = indexHtml.match(/\.ci-story-hero::after\s*\{[^}]+\}/);
  assert.ok(match, 'Missing Candler Impact hero overlay rule');
  return match[0];
}

test('Candler Impact published hero image uses the intended Master Class photo', () => {
  assert.equal(candlerConfig.hero.image, INTENDED_HERO_IMAGE);
  assert.equal(candlerConfig.hero.imageMode, 'cover');
});

test('Candler Impact runtime fallbacks use the intended Master Class photo', () => {
  const defaultsBlock = extractImpactDefaultsBlock();

  assert.match(
    indexHtml,
    /--ci-hero-image-url:\s*url\('\/assets\/student_photos\/Master Class Student Talking 5\.jpg'\)/
  );
  assert.match(defaultsBlock, /image:\s*'\/assets\/student_photos\/Master Class Student Talking 5\.jpg'/);
});

test('Candler Impact editor presets include both the intended photo and legacy vignette helper', () => {
  const select = extractImpactPresetSelect();

  assert.match(select, new RegExp(`<option value="${INTENDED_HERO_IMAGE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.match(select, new RegExp(`<option value="${LEGACY_VIGNETTE_IMAGE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
});

test('Candler Impact canonical notes document Master Class as current and vignette as legacy', () => {
  const section = extractCanonicalImpactHeroSection();

  assert.match(section, /Master Class Student Talking 5\.jpg/);
  assert.match(section, /legacy/i);
  assert.doesNotMatch(section, /published\/default hero artwork is now `\/assets\/Graphic Vignettes\/vignette-city-life-banner\.png`/);
});

test('Candler Impact hero tuning keeps the photo intentional and the copy readable', () => {
  assert.equal(candlerConfig.hero.imagePosition, 'center 30%');
  assert.equal(candlerConfig.hero.imageOffsetX, 0);
  assert.equal(candlerConfig.hero.imageOffsetY, 0);
  assert.ok(candlerConfig.hero.imageOpacity >= 0.93);
  assert.ok(candlerConfig.hero.imageFadeLeft >= 54);
  assert.ok(candlerConfig.hero.imageFadeRight <= 14);
});

test('Candler Impact hero edge feather follows the active image fill mode', () => {
  const layoutFunction = extractImpactLayoutFunction();

  assert.doesNotMatch(layoutFunction, /size:\s*\{\s*heightPercent:\s*heroConfig\.imageScale/);
  assert.match(layoutFunction, /if\s*\(_imgMode === 'cover'\)\s*_edgeSize = \{\s*mode:\s*'cover'\s*\};/);
  assert.match(layoutFunction, /else if\s*\(_imgMode === 'contain'\)\s*_edgeSize = \{\s*mode:\s*'contain'\s*\};/);
});

test('Candler Impact desktop hero overlay preserves the photo beyond the copy zone', () => {
  const heroAfterRule = extractImpactHeroAfterRule();

  assert.match(heroAfterRule, /rgba\(255,253,248,0\.30\)\s*var\(--ci-hero-fade-left\)/);
  assert.match(heroAfterRule, /rgba\(255,253,248,0\.08\)\s*100%/);
  assert.doesNotMatch(heroAfterRule, /rgba\(255,253,248,0\.58\)\s*var\(--ci-hero-fade-left\)/);
  assert.doesNotMatch(heroAfterRule, /rgba\(255,253,248,0\.90\)\s*100%/);
});

test('Candler Impact mobile hero reserves space for editor control and softens the photo behind copy', () => {
  assert.match(
    indexHtml,
    /@media \(max-width:600px\)[\s\S]*\.ci-story-hero-inner\s*\{[^}]*padding:72px 20px 26px/
  );
  assert.match(
    indexHtml,
    /@media \(max-width:600px\)[\s\S]*\.ci-story-hero::before\s*\{[^}]*background-position:center 30%[^}]*opacity:0\.58/
  );
  assert.match(
    indexHtml,
    /@media \(max-width:600px\)[\s\S]*\.ci-story-hero::after\s*\{[^}]*linear-gradient\(180deg, rgba\(255,253,248,0\.94\)/
  );
});

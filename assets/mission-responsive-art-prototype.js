(function(global) {
  'use strict';

  // Stage 2E: this is now the production default renderer. The file/global
  // keep their prototype names temporarily so prior local QA hooks keep working.
  var SECTION_REFS = {
    community: {
      section: 'community',
      cardWidth: 623.06,
      cardHeight: 320,
      graphicWidth: 164,
      graphicTop: 16,
      graphicRight: 14,
      graphicBottom: 12
    },
    ministry: {
      section: 'ministry',
      cardWidth: 408.7,
      cardHeight: 320,
      graphicWidth: 144,
      graphicTop: 16,
      graphicRight: 10,
      graphicBottom: 12
    },
    public: {
      section: 'public',
      cardWidth: 408.7,
      cardHeight: 320,
      graphicWidth: 144,
      graphicTop: 16,
      graphicRight: 10,
      graphicBottom: 12
    }
  };

  var CARD_SECTION_FALLBACKS = {
    'courses-in-community': 'community',
    'on-demand-courses': 'community',
    'sunday-school-simplified': 'ministry',
    '3-minute-bible': 'ministry',
    unstuck: 'ministry',
    'scholars-blog': 'public',
    theoed: 'public',
    'candler-in-conversation': 'public'
  };

  var CARD_EDGE_REFS = {
    'on-demand-courses': {
      bleedRight: 22,
      bleedWidth: 6
    },
    '3-minute-bible': {
      bleedBottom: 14,
      bleedRight: 10,
      bleedWidth: 12,
      bleedShiftY: 5
    },
    theoed: {
      bleedBottom: 16,
      bleedRight: 8,
      bleedWidth: 8
    },
    'candler-in-conversation': {
      bleedBottom: 16,
      bleedRight: 8,
      bleedWidth: 20,
      bleedShiftY: 10,
      bleedScale: 0.12
    },
    'scholars-blog': {
      bleedBottom: 18,
      bleedRight: 8,
      bleedWidth: 8
    }
  };

  var HERO_REF = {
    overlayWidth: 1600,
    gapPx: 30,
    textPx: 960,
    visualPx: 610
  };

  function round(value) {
    return Math.round(Number(value) * 1000) / 1000;
  }

  function toPx(value) {
    return round(value) + 'px';
  }

  function clamp(value, min, max) {
    value = Number(value);
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  function finiteNumber(value) {
    if (value == null || value === '') return null;
    var number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function numberOr(value, fallback) {
    var number = finiteNumber(value);
    return number == null ? fallback : number;
  }

  function resolveCardSection(cardId, cardSettings) {
    return (cardSettings && cardSettings.section) || CARD_SECTION_FALLBACKS[cardId] || null;
  }

  function hasFrontArtSettings(cardId, cardSettings) {
    if (!cardSettings) return !!CARD_SECTION_FALLBACKS[cardId];
    return !!(
      cardSettings.frontGraphicUrl ||
      cardSettings.frontImageUrl ||
      cardSettings.imageUrl ||
      finiteNumber(cardSettings.frontGraphicWidth) != null ||
      finiteNumber(cardSettings.frontGraphicShiftX) != null ||
      finiteNumber(cardSettings.frontGraphicShiftY) != null ||
      finiteNumber(cardSettings.frontGraphicScale) != null ||
      CARD_SECTION_FALLBACKS[cardId]
    );
  }

  function resolveCardReference(cardId, cardSettings) {
    var section = resolveCardSection(cardId, cardSettings);
    var sectionRef = SECTION_REFS[section || ''];
    if (!sectionRef || !hasFrontArtSettings(cardId, cardSettings)) return null;
    cardSettings = cardSettings || {};
    return {
      cardId: cardId,
      section: section,
      cardWidth: numberOr(cardSettings.frontReferenceWidth, sectionRef.cardWidth),
      cardHeight: numberOr(cardSettings.frontReferenceHeight, sectionRef.cardHeight),
      graphicWidth: numberOr(cardSettings.frontGraphicWidth, sectionRef.graphicWidth),
      graphicTop: numberOr(cardSettings.frontGraphicTop, sectionRef.graphicTop),
      graphicRight: numberOr(cardSettings.frontGraphicRight, sectionRef.graphicRight),
      graphicBottom: numberOr(cardSettings.frontGraphicBottom, sectionRef.graphicBottom),
      shiftX: numberOr(cardSettings.frontGraphicShiftX, 0),
      shiftY: numberOr(cardSettings.frontGraphicShiftY, 0),
      scale: numberOr(cardSettings.frontGraphicScale, 1),
      bleedBottom: numberOr(cardSettings.frontGraphicBleedBottom, (CARD_EDGE_REFS[cardId] && CARD_EDGE_REFS[cardId].bleedBottom) || 0),
      bleedRight: numberOr(cardSettings.frontGraphicBleedRight, (CARD_EDGE_REFS[cardId] && CARD_EDGE_REFS[cardId].bleedRight) || 0),
      bleedWidth: numberOr(cardSettings.frontGraphicBleedWidth, (CARD_EDGE_REFS[cardId] && CARD_EDGE_REFS[cardId].bleedWidth) || 0),
      bleedShiftY: numberOr(cardSettings.frontGraphicBleedShiftY, (CARD_EDGE_REFS[cardId] && CARD_EDGE_REFS[cardId].bleedShiftY) || 0),
      bleedScale: numberOr(cardSettings.frontGraphicBleedScale, (CARD_EDGE_REFS[cardId] && CARD_EDGE_REFS[cardId].bleedScale) || 0)
    };
  }

  function compressionFactor(scale, fullAt) {
    return clamp((1 - Number(scale || 1)) / fullAt, 0, 1);
  }

  function flagValueIsOn(value) {
    if (value == null) return false;
    var normalized = String(value).trim().toLowerCase();
    return normalized === '' || normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
  }

  function isEnabled(search) {
    var raw = search != null ? search : ((global.location && global.location.search) || '');
    var Params = global.URLSearchParams || URLSearchParams;
    var params = new Params(raw);
    if (params.has('missionArtLegacy')) return !flagValueIsOn(params.get('missionArtLegacy'));
    if (params.has('mission-art-legacy')) return !flagValueIsOn(params.get('mission-art-legacy'));
    if (params.has('missionArtPrototype')) return flagValueIsOn(params.get('missionArtPrototype'));
    if (params.has('mission-art-prototype')) return flagValueIsOn(params.get('mission-art-prototype'));
    return true;
  }

  function computeCardVars(cardId, rect, cardSettings) {
    var ref = resolveCardReference(cardId, cardSettings);
    var width = rect && Number(rect.width);
    var height = rect && Number(rect.height);
    if (!ref || !width || !height) return null;
    var scaleX = width / ref.cardWidth;
    var scaleY = height / ref.cardHeight;
    var bleedFactorX = compressionFactor(scaleX, 0.25);
    var bleedFactorY = compressionFactor(scaleY, 0.15);
    var bleedFactor = Math.max(bleedFactorX, bleedFactorY);
    var widthBleedPx = round(ref.bleedWidth * scaleX * bleedFactor);
    var rightBleedPx = round(ref.bleedRight * scaleX * bleedFactorX);
    var bottomBleedPx = round(ref.bleedBottom * scaleY * bleedFactorY);
    var shiftYBleedPx = round(ref.bleedShiftY * scaleY * bleedFactor);
    var scaleBleed = round(ref.bleedScale * bleedFactor);
    return {
      cardId: cardId,
      reference: ref,
      widthPx: round(ref.graphicWidth * scaleX + widthBleedPx),
      topPx: round(ref.graphicTop * scaleY),
      rightPx: round(Math.max(0, ref.graphicRight * scaleX - rightBleedPx)),
      bottomPx: round(Math.max(0, ref.graphicBottom * scaleY - bottomBleedPx)),
      shiftXPx: round(ref.shiftX * scaleX),
      shiftYPx: round(ref.shiftY * scaleY + shiftYBleedPx),
      scale: round(ref.scale + scaleBleed),
      bleedWidthPx: widthBleedPx,
      bleedRightPx: rightBleedPx,
      bleedBottomPx: bottomBleedPx,
      bleedShiftYPx: shiftYBleedPx,
      bleedScale: scaleBleed,
      scaleX: round(scaleX),
      scaleY: round(scaleY)
    };
  }

  function applyCard(flip, cardId, cardSettings) {
    if (!flip) return null;
    var front = flip.querySelector && flip.querySelector('.card-front');
    if (!front || !front.getBoundingClientRect) return null;
    var rect = front.getBoundingClientRect();
    var vars = computeCardVars(cardId, rect, cardSettings);
    if (!vars) return null;

    flip.dataset.missionArtMode = 'normalized-card';
    flip.dataset.missionArtPrototype = 'normalized-card';
    flip.dataset.missionArtReference = vars.reference.section;
    flip.dataset.missionArtComputed = JSON.stringify({
      cardId: cardId,
      section: vars.reference.section,
      widthPx: vars.widthPx,
      topPx: vars.topPx,
      rightPx: vars.rightPx,
      bottomPx: vars.bottomPx,
      shiftXPx: vars.shiftXPx,
      shiftYPx: vars.shiftYPx,
      scale: vars.scale,
      bleedWidthPx: vars.bleedWidthPx,
      bleedRightPx: vars.bleedRightPx,
      bleedBottomPx: vars.bleedBottomPx,
      bleedShiftYPx: vars.bleedShiftYPx,
      bleedScale: vars.bleedScale,
      scaleX: vars.scaleX,
      scaleY: vars.scaleY
    });
    flip.style.setProperty('--card-graphic-width', toPx(vars.widthPx));
    flip.style.setProperty('--card-graphic-top', toPx(vars.topPx));
    flip.style.setProperty('--card-graphic-right', toPx(vars.rightPx));
    flip.style.setProperty('--card-graphic-bottom', toPx(vars.bottomPx));
    flip.style.setProperty('--card-graphic-shift-x', toPx(vars.shiftXPx));
    flip.style.setProperty('--card-graphic-shift-y', toPx(vars.shiftYPx));
    flip.style.setProperty('--card-graphic-scale', String(vars.scale));
    return vars;
  }

  function watchCard(flip, cardId, cardSettings) {
    var vars = applyCard(flip, cardId, cardSettings);
    if (!vars || flip.__missionArtPrototypeObserver || !global.ResizeObserver) return vars;
    var front = flip.querySelector('.card-front') || flip;
    var observer = new global.ResizeObserver(function() {
      applyCard(flip, cardId, cardSettings);
    });
    observer.observe(front);
    flip.__missionArtPrototypeObserver = observer;
    return vars;
  }

  function computeHeroLayout(input) {
    var overlayWidth = Number(input && input.overlayWidth);
    if (!overlayWidth) return null;
    var gapPx = Number(input.gapPx != null ? input.gapPx : HERO_REF.gapPx);
    var referenceUsable = HERO_REF.textPx + HERO_REF.visualPx;
    var usable = Math.max(0, overlayWidth - gapPx);
    var textPx = Math.min(HERO_REF.textPx, usable * (HERO_REF.textPx / referenceUsable));
    var visualPx = Math.max(0, usable - textPx);
    return {
      overlayWidth: round(overlayWidth),
      gapPx: round(gapPx),
      textPx: round(textPx),
      visualPx: round(visualPx)
    };
  }

  function applyHero(elements) {
    if (!elements || !elements.grid || !elements.intro || !elements.visual) return null;
    var grid = elements.grid;
    var intro = elements.intro;
    var visual = elements.visual;
    var gridRect = grid.getBoundingClientRect();
    var gridStyle = global.getComputedStyle ? global.getComputedStyle(grid) : null;
    var gapPx = gridStyle ? parseFloat(gridStyle.columnGap || gridStyle.gap || '') : HERO_REF.gapPx;
    var layout = computeHeroLayout({
      overlayWidth: gridRect.width,
      gapPx: Number.isFinite(gapPx) ? gapPx : HERO_REF.gapPx
    });
    if (!layout) return null;

    if (elements.panel) {
      elements.panel.classList.add('mission-art-normalized');
      elements.panel.classList.add('mission-art-prototype');
    }
    if (elements.bar) {
      elements.bar.dataset.missionArtMode = 'normalized-hero';
      elements.bar.dataset.missionArtPrototype = 'normalized-hero';
      elements.bar.dataset.missionArtComputed = JSON.stringify(layout);
    }
    grid.style.gridTemplateColumns = toPx(layout.textPx) + ' minmax(0, 1fr)';
    intro.style.width = toPx(layout.textPx);
    intro.style.maxWidth = toPx(layout.textPx);
    intro.style.flex = '0 1 ' + toPx(layout.textPx);
    intro.style.minWidth = '0';
    visual.style.minWidth = '0';
    return layout;
  }

  function watchHero(elements) {
    var layout = applyHero(elements);
    if (!layout || !elements.grid || elements.grid.__missionArtPrototypeObserver || !global.ResizeObserver) return layout;
    var observer = new global.ResizeObserver(function() {
      applyHero(elements);
    });
    observer.observe(elements.grid);
    elements.grid.__missionArtPrototypeObserver = observer;
    return layout;
  }

  var api = {
    SECTION_REFS: SECTION_REFS,
    CARD_SECTION_FALLBACKS: CARD_SECTION_FALLBACKS,
    CARD_EDGE_REFS: CARD_EDGE_REFS,
    HERO_REF: HERO_REF,
    isEnabled: isEnabled,
    resolveCardReference: resolveCardReference,
    computeCardVars: computeCardVars,
    computeHeroLayout: computeHeroLayout,
    applyCard: applyCard,
    watchCard: watchCard,
    applyHero: applyHero,
    watchHero: watchHero
  };
  global.MissionResponsiveArt = api;
  global.MissionResponsiveArtPrototype = api;
})(typeof window !== 'undefined' ? window : globalThis);

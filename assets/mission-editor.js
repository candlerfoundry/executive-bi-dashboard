(function() {
  var STORAGE_KEY = 'executive-bi-dashboard.pageConfig.mission';
  var DEFAULT_CONFIG = {
    content: {
      hero: {
        headline: "Connecting Candler's scholarship to the wider world",
        body: "Through courses, media, and practical resources, The Candler Foundry translates rigorous theological scholarship into learning that shapes congregations, leaders, and everyday faith."
      }
    },
    layout: {
      shellMax: 1680,
      heroTextMax: 700,
      heroMinHeight: 348,
      heroOffsetY: 0,
      heroColumns: '1.05fr 0.95fr',
      heroTextAlign: 'left',
      heroGap: 24,
      gutter: 28,
      sectionSpacing: 42,
      cardGap: 20,
      communityColumns: 2,
      ministryColumns: 3,
      publicColumns: 3,
      cardMinHeight: 320
    },
    visual: {
      heroImage: '/assets/Graphic_1.png',
      heroImagePosition: 'center right',
      heroImageFit: 'width',
      heroImageX: 78,
      heroImageY: 50,
      heroImageScale: 100,
      heroImageOpacity: 0.25,
      heroImageClarity: 0,
      heroFadeStrength: 0.32,
      heroFadeLeft: 18,
      heroFadeRight: 12
    },
    typography: {
      headingFont: "'Montserrat', sans-serif",
      bodyFont: "'Montserrat', sans-serif",
      heroTitleSize: 3.75,
      bodySize: 1,
      heroBodyWidth: 620,
      heroBodyMinHeight: 0,
      heroTitleWidth: 700,
      heroTitleGap: 24,
      sectionTitleSize: 1.8,
      sectionCopySize: 0.96,
      sectionCopyWidth: 280,
      sectionCopyMinHeight: 0,
      cardTitleSize: 1.45,
      cardBodySize: 0.94,
      cardFrontTextWidth: 260,
      cardFrontTextMinHeight: 0,
      cardBackTextWidth: 280,
      cardBackTextMinHeight: 0,
      buttonSize: 0.76
    },
    sections: {
      community: {
        id: 'community',
        title: 'Extending Candler into communities',
        copy: "Bringing Candler's faculty, alumni, and scholarship into churches, classrooms, and homes around the world.",
        visible: true,
        order: 1
      },
      ministry: {
        id: 'ministry',
        title: 'Equipping leaders and learners for everyday ministry',
        copy: "Practical tools shaped by Candler's scholarship to support teaching, preaching, and spiritual formation in real contexts.",
        visible: true,
        order: 2
      },
      public: {
        id: 'public',
        title: 'Engaging the wider public in theological conversation',
        copy: 'Creating accessible entry points for spiritual seekers and curious audiences to explore faith, meaning, and theology.',
        visible: true,
        order: 3
      }
    },
    cards: {}
  };

  var SECTION_META = {
    community: { label: 'Community', elementId: 'mission-community' },
    ministry: { label: 'Ministry', elementId: 'mission-ministry' },
    public: { label: 'Public', elementId: 'mission-public' }
  };

  var HERO_IMAGE_OPTIONS = [
    { value: '/assets/Graphic_1.png', label: 'Foundry illustration' },
    { value: '/assets/Graphic_2.png', label: 'Alternate illustration' },
    { value: '/assets/Graphic Vignettes/homepage-tablet-standing-seated.png', label: 'Tablet vignette' },
    { value: '/assets/Graphic Vignettes/homepage-presenter-audience.png', label: 'Audience vignette' }
  ];

  var CARD_ART_OPTIONS = [
    { value: '/assets/Graphic Vignettes/homepage-presenter-audience.png', label: 'Presenter & audience' },
    { value: '/assets/Graphic Vignettes/graphic-3-phone-user.png', label: 'Phone user' },
    { value: '/assets/Graphic Vignettes/graphic-1-reader-presenter.png', label: 'Reader & presenter' },
    { value: '/assets/Graphic Vignettes/graphic-3-side-reader.png', label: 'Side reader' },
    { value: '/assets/Graphic Vignettes/graphic-1-seated-conversation.png', label: 'Seated conversation' },
    { value: '/assets/Graphic Vignettes/homepage-tablet-standing-seated.png', label: 'Tablet vignette' },
    { value: '/assets/Graphic Vignettes/graphic-3-booktop-pair.png', label: 'Booktop pair' },
    { value: '/assets/Graphic Vignettes/graphic-3-reader-dog.png', label: 'Reader with dog' },
    { value: '/assets/Graphic Vignettes/vignette-city-life.png', label: 'City life (hi-res)' },
    { value: '/assets/Graphic Vignettes/vignette-screens-presenter.png', label: 'Screens & presenter (hi-res)' },
    { value: '/assets/Graphic Vignettes/vignette-pavilion-readers.png', label: 'Pavilion readers (hi-res)' },
    { value: '/assets/Graphic Vignettes/vignette-bridge-meeting.png', label: 'Bridge meeting (hi-res)' },
    { value: '/assets/Graphic Vignettes/vignette-easel-teaching.png', label: 'Easel & teaching (hi-res)' },
    { value: '/assets/Graphic Vignettes/vignette-walking-campus.png', label: 'Walking to campus (hi-res)' },
    { value: '/assets/Graphic Vignettes/vignette-city-life-banner.png', label: 'City life banner (hi-res)' }
  ];

  var PROTECTED_ASSET_PATHS = [
    'assets/Graphic_1.png',
    'assets/Graphic_1_mission_impact.png',
    'assets/Graphic_2.png',
    'assets/Graphic_3_growth.png',
    'assets/TCF_Logo-Orange-Transparent.png',
    'assets/TCF_Logomark-Orange-Transparent.png'
  ];

  var runtime = {
    baseOfferings: [],
    defaultConfig: null,
    publishedConfig: null,
    storedDraftConfig: null,
    draftConfig: null,
    baselineConfig: null,
    currentState: null,
    activeSectionId: 'community',
    orderSectionId: 'community',
    activeCardId: null,
    activeCardPreviewFace: 'front',
    activeEditorScope: 'hero',
    ui: {},
    controlsReady: false
  };

  window.missionEditorRuntime = runtime;

  function configsEqual(a, b) {
    return JSON.stringify(a || {}) === JSON.stringify(b || {});
  }

  function deepClone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function mergeDeep(target, source) {
    if (!source || typeof source !== 'object') return target;
    Object.keys(source).forEach(function(key) {
      var value = source[key];
      if (Array.isArray(value)) {
        target[key] = deepClone(value);
      } else if (value && typeof value === 'object') {
        if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) target[key] = {};
        mergeDeep(target[key], value);
      } else {
        target[key] = value;
      }
    });
    return target;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function clamp(value, min, max, fallback) {
    var num = Number(value);
    if (!isFinite(num)) num = fallback;
    if (min != null) num = Math.max(min, num);
    if (max != null) num = Math.min(max, num);
    return num;
  }

  function formatPx(value) {
    return Math.round(Number(value) || 0) + 'px';
  }

  function formatPercent(value) {
    return Math.round((Number(value) || 0) * 100) + '%';
  }

  function getAnchorPercent(anchor) {
    switch (anchor) {
      case 'left center':
        return { x: 24, y: 50 };
      case 'center center':
        return { x: 50, y: 50 };
      case 'right bottom':
        return { x: 86, y: 82 };
      case 'center right':
      default:
        return { x: 78, y: 50 };
    }
  }

  function getStoredConfig() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function setStoredConfig(config) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (err) {}
  }

  function clearStoredConfig() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (err) {}
  }

  function computeOverlayGradient(leftFade, rightFade, legacyStrength) {
    var left = leftFade != null ? clamp(leftFade, 0, 100, 74) : clamp((legacyStrength != null ? legacyStrength : 0.74) * 100, 20, 98, 74);
    var right = rightFade != null ? clamp(rightFade, 0, 100, 8) : 8;
    var leftSoft = Math.max(0, left - 20);
    var leftEdge = Math.min(94, left + 10);
    var rightStart = Math.max(leftEdge + 4, 100 - right - 14);
    var rightSoft = Math.max(rightStart + 2, 100 - right);
    return 'linear-gradient(90deg, rgba(255,253,248,0.97) 0%, rgba(255,253,248,0.90) ' + Math.round(leftSoft) + '%, rgba(255,253,248,0.58) ' + Math.round(left) + '%, rgba(255,253,248,0.08) ' + Math.round(leftEdge) + '%, rgba(255,253,248,0.08) ' + Math.round(rightStart) + '%, rgba(255,253,248,0.58) ' + Math.round(rightSoft) + '%, rgba(255,253,248,0.90) 100%)';
  }

  function getHeroImageSize(fit, scale) {
    var value = clamp(scale, 70, 230, 100);
    switch (fit) {
      case 'cover':
        return 'cover';
      case 'contain':
        return 'contain';
      case 'height':
        return 'auto ' + value + '%';
      case 'width':
      default:
        return value + '% auto';
    }
  }

  function computeImageMask(leftFade, rightFade, topFade, bottomFade) {
    var left = clamp(leftFade, 0, 100, 0);
    var right = clamp(rightFade, 0, 100, 0);
    var top = clamp(topFade, 0, 100, 0);
    var bottom = clamp(bottomFade, 0, 100, 0);
    var horizontal = 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.18) ' + Math.round(left * 0.35) + '%, #000 ' + Math.round(left) + '%, #000 ' + Math.round(100 - right) + '%, rgba(0,0,0,0.18) ' + Math.round(100 - (right * 0.35)) + '%, transparent 100%)';
    var vertical = 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.18) ' + Math.round(top * 0.35) + '%, #000 ' + Math.round(top) + '%, #000 ' + Math.round(100 - bottom) + '%, rgba(0,0,0,0.18) ' + Math.round(100 - (bottom * 0.35)) + '%, transparent 100%)';
    if (!top && !bottom) return horizontal;
    if (!left && !right) return vertical;
    return horizontal + ', ' + vertical;
  }

  function ensureSectionConfig(config, sectionId) {
    if (!config.sections) config.sections = {};
    if (!config.sections[sectionId]) config.sections[sectionId] = deepClone(DEFAULT_CONFIG.sections[sectionId] || { id: sectionId });
    return config.sections[sectionId];
  }

  function ensureCardConfig(config, cardId) {
    if (!config.cards) config.cards = {};
    if (!config.cards[cardId]) config.cards[cardId] = {};
    return config.cards[cardId];
  }

  function isEditorOpen() {
    return !!(runtime.controlsReady && runtime.ui.shell && !runtime.ui.shell.hasAttribute('hidden'));
  }

  function getCardMeta(cardId) {
    return (window.MISSION_CARD_META && window.MISSION_CARD_META[cardId]) || {};
  }

  function getEffectiveCardActions(card, cardId) {
    var meta = getCardMeta(cardId);
    return deepClone((card && card.cardActions) || (card && card.links) || meta.actions || []);
  }

  function normalizeAssetPath(value) {
    var path = String(value || '').trim().replace(/\\/g, '/').replace(/^\/+/, '');
    if (!path) return '';
    if (path.indexOf('assets/') !== 0) path = 'assets/' + path;
    return path;
  }

  function pathForUploadAssetFunction(value) {
    return normalizeAssetPath(value).replace(/^assets\//, '');
  }

  function getUploadPathError(value) {
    var normalized = normalizeAssetPath(value);
    if (!normalized) return 'Enter a new Git asset location before uploading.';
    if (!/\.[a-zA-Z0-9]{2,8}$/.test(normalized)) return 'Git asset location must include a file name and extension.';
    if (PROTECTED_ASSET_PATHS.indexOf(normalized) !== -1) {
      return 'Choose a new asset path. Built-in graphics cannot be overwritten.';
    }
    return '';
  }

  function setSelectValueWithCustomOption(select, value, label) {
    if (!select) return;
    var normalized = value || '';
    if (!normalized) return;
    var option = Array.prototype.find.call(select.options, function(item) {
      return item.value === normalized;
    });
    if (!option) {
      option = document.createElement('option');
      option.value = normalized;
      option.textContent = label || 'Custom Git asset';
      option.dataset.customAsset = 'true';
      select.appendChild(option);
    }
    select.value = normalized;
  }

  async function uploadGitAsset(file, uploadPath) {
    return await new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = async function() {
        try {
          var base64 = String(reader.result || '').split(',')[1];
          var response = await fetch('/.netlify/functions/upload-asset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: uploadPath, content: base64 })
          });
          var data = await response.json().catch(function() { return {}; });
          if (!response.ok) throw new Error(data.error || 'Upload failed');
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = function() {
        reject(new Error('Unable to read selected file'));
      };
      reader.readAsDataURL(file);
    });
  }

  async function getPublishedConfig() {
    if (!window.pageEditorFetchJson) return null;
    return await window.pageEditorFetchJson('/assets/page-config/mission-page.json');
  }

  function getEffectiveConfig(config) {
    var merged = deepClone(runtime.defaultConfig || DEFAULT_CONFIG);
    if (runtime.publishedConfig) mergeDeep(merged, runtime.publishedConfig);
    if (config) mergeDeep(merged, config);
    return merged;
  }

  function loadPublishedDraft() {
    runtime.draftConfig = getEffectiveConfig(runtime.publishedConfig);
    runtime.baselineConfig = deepClone(runtime.draftConfig);
  }

  async function reloadPublishedDraft() {
    var latestPublished = await getPublishedConfig();
    if (latestPublished) runtime.publishedConfig = latestPublished;
    loadPublishedDraft();
  }

  function restoreStoredDraft() {
    loadPublishedDraft();
    if (runtime.storedDraftConfig) mergeDeep(runtime.draftConfig, runtime.storedDraftConfig);
    runtime.baselineConfig = deepClone(runtime.draftConfig);
  }

  function updateDraftNotice() {
    if (!runtime.controlsReady || !runtime.ui.draftNotice) return;
    runtime.ui.draftNotice.hidden = !runtime.storedDraftConfig;
  }

  function buildMissionState(offerings, config) {
    var effective = getEffectiveConfig(config);
    var sections = Object.keys(SECTION_META).map(function(sectionId) {
      var section = deepClone(DEFAULT_CONFIG.sections[sectionId]);
      mergeDeep(section, (effective.sections && effective.sections[sectionId]) || {});
      section.id = sectionId;
      section.visible = section.visible !== false;
      section.order = clamp(section.order, 1, 9, DEFAULT_CONFIG.sections[sectionId].order);
      return section;
    }).sort(function(a, b) {
      return a.order - b.order;
    });

    var sectionMap = {};
    var cards = (offerings || []).map(function(offering, idx) {
      var slug = window.getOfferingSlug(offering, idx);
      var overrides = (effective.cards && effective.cards[slug]) || {};
      var meta = getCardMeta(slug);
      var card = deepClone(offering);
      card.section = overrides.section || (window.MISSION_SECTION_BUCKETS && window.MISSION_SECTION_BUCKETS[slug]) || 'ministry';
      card.visible = overrides.visible !== undefined ? overrides.visible !== false : offering.visible !== false;
      card.order = clamp(overrides.order, 1, 50, offering.order || idx + 1);
      card.frontTitle = overrides.frontTitle || offering.frontTitle || offering.title || '';
      card.frontDescription = overrides.frontDescription || offering.frontDescription || meta.copy || offering.tagline || offering.blurb || '';
      card.backHeading = overrides.backHeading || offering.backHeading || card.frontTitle;
      card.backDescription = overrides.backDescription || offering.backDescription || meta.backCopy || card.frontDescription;
      card.backBackground = overrides.backBackground || offering.backBackground || '';
      card.backStripColor = overrides.backStripColor || offering.backStripColor || '';
      card.backTextColor = overrides.backTextColor || offering.backTextColor || '';
      card.buttonColor = overrides.buttonColor || offering.buttonColor || '';
      card.buttonTextColor = overrides.buttonTextColor || offering.buttonTextColor || '';
      card.frontTitleSize = overrides.frontTitleSize != null ? overrides.frontTitleSize : (offering.frontTitleSize != null ? offering.frontTitleSize : null);
      card.frontBodySize = overrides.frontBodySize != null ? overrides.frontBodySize : (offering.frontBodySize != null ? offering.frontBodySize : null);
      card.backBodySize = overrides.backBodySize != null ? overrides.backBodySize : (offering.backBodySize != null ? offering.backBodySize : null);
      card.frontTextWidth = overrides.frontTextWidth != null ? overrides.frontTextWidth : (offering.frontTextWidth != null ? offering.frontTextWidth : null);
      card.frontGraphicUrl = overrides.frontGraphicUrl || offering.frontGraphicUrl || offering.imageUrl || '';
      card.frontGraphicPosition = overrides.frontGraphicPosition || offering.frontGraphicPosition || '';
      card.frontGraphicShiftX = overrides.frontGraphicShiftX != null ? overrides.frontGraphicShiftX : (offering.frontGraphicShiftX != null ? offering.frontGraphicShiftX : 0);
      card.frontGraphicShiftY = overrides.frontGraphicShiftY != null ? overrides.frontGraphicShiftY : (offering.frontGraphicShiftY != null ? offering.frontGraphicShiftY : 0);
      card.frontGraphicWidth = overrides.frontGraphicWidth != null ? overrides.frontGraphicWidth : (offering.frontGraphicWidth != null ? offering.frontGraphicWidth : null);
      card.frontGraphicOpacity = overrides.frontGraphicOpacity != null ? overrides.frontGraphicOpacity : (offering.frontGraphicOpacity != null ? offering.frontGraphicOpacity : null);
      card.frontGraphicScale = overrides.frontGraphicScale != null ? overrides.frontGraphicScale : (offering.frontGraphicScale != null ? offering.frontGraphicScale : null);
      card.frontGraphicFadeX = overrides.frontGraphicFadeX != null ? overrides.frontGraphicFadeX : (offering.frontGraphicFadeX != null ? offering.frontGraphicFadeX : 0);
      card.frontGraphicFadeLeft = overrides.frontGraphicFadeLeft != null ? overrides.frontGraphicFadeLeft : (offering.frontGraphicFadeLeft != null ? offering.frontGraphicFadeLeft : null);
      card.frontGraphicFadeRight = overrides.frontGraphicFadeRight != null ? overrides.frontGraphicFadeRight : (offering.frontGraphicFadeRight != null ? offering.frontGraphicFadeRight : null);
      card.frontGraphicFadeY = overrides.frontGraphicFadeY != null ? overrides.frontGraphicFadeY : (offering.frontGraphicFadeY != null ? offering.frontGraphicFadeY : 0);
      if (overrides.actions && overrides.actions.length) {
        card.cardActions = deepClone(overrides.actions);
      } else if (offering.cardActions || offering.links || meta.actions) {
        card.cardActions = getEffectiveCardActions(offering, slug);
      }
      if (overrides.primaryActionLabel) {
        if (card.cardActions && card.cardActions[0]) card.cardActions[0].label = overrides.primaryActionLabel;
        else if (card.links && card.links[0]) card.links[0].label = overrides.primaryActionLabel;
      }
      // Lookbook back-layout fields (used by courses-in-community + on-demand-courses; CANONICAL section 23)
      card.backLayout = overrides.backLayout || offering.backLayout || '';
      card.lookbookImage = overrides.lookbookImage || offering.lookbookImage || '';
      card.lookbookUrl = overrides.lookbookUrl || offering.lookbookUrl || '';
      card.lookbookAlt = overrides.lookbookAlt || offering.lookbookAlt || '';
      card.lookbookTileWidth = overrides.lookbookTileWidth != null ? overrides.lookbookTileWidth : (offering.lookbookTileWidth != null ? offering.lookbookTileWidth : null);
      card.lookbookTileHeight = overrides.lookbookTileHeight != null ? overrides.lookbookTileHeight : (offering.lookbookTileHeight != null ? offering.lookbookTileHeight : null);
      card.lookbookTitleSize = overrides.lookbookTitleSize != null ? overrides.lookbookTitleSize : (offering.lookbookTitleSize != null ? offering.lookbookTitleSize : null);
      card.lookbookLeadSize = overrides.lookbookLeadSize != null ? overrides.lookbookLeadSize : (offering.lookbookLeadSize != null ? offering.lookbookLeadSize : null);
      card.lookbookTileTilt = overrides.lookbookTileTilt != null ? overrides.lookbookTileTilt : (offering.lookbookTileTilt != null ? offering.lookbookTileTilt : null);
      card.lookbookTileFlat = overrides.lookbookTileFlat != null ? overrides.lookbookTileFlat : (offering.lookbookTileFlat != null ? offering.lookbookTileFlat : false);
      if (card.cardActions && overrides.secondaryActionLabel && card.cardActions[1]) {
        card.cardActions[1].label = overrides.secondaryActionLabel;
      }
      sectionMap[slug] = card.section;
      return card;
    });

    return {
      config: effective,
      sections: sections,
      cards: cards,
      sectionMap: sectionMap
    };
  }

  function applyMissionVariables(state) {
    var panel = document.getElementById('panel-whoweare');
    var intro = panel ? panel.querySelector('.mission-intro-wrap') : null;
    var bar = panel ? panel.querySelector('.mission-bar') : null;
    var overlay = panel ? panel.querySelector('.mission-bar-overlay') : null;
    var grid = panel ? panel.querySelector('.mission-hero-grid') : null;
    var visual = panel ? panel.querySelector('.mission-hero-visual') : null;
    var heroTextMax = clamp(state.config.layout.heroTextMax, 420, 1320, 700);
    var heroMinHeight = clamp(state.config.layout.heroMinHeight, 240, 520, 348);
    if (!panel) return;
    panel.style.setProperty('--mission-shell-max', clamp(state.config.layout.shellMax, 1280, 1880, 1680) + 'px');
    panel.style.setProperty('--mission-gutter', clamp(state.config.layout.gutter, 12, 72, 28) + 'px');
    panel.style.setProperty('--mission-section-gap', clamp(state.config.layout.heroGap, 8, 72, 24) + 'px');
    panel.style.setProperty('--mission-hero-min', heroMinHeight + 'px');
    panel.style.setProperty('--mission-hero-text-max', heroTextMax + 'px');
    panel.style.setProperty('--mission-hero-columns', state.config.layout.heroColumns || '1.05fr 0.95fr');
    panel.style.setProperty('--mission-hero-text-align', state.config.layout.heroTextAlign || 'left');
    panel.style.setProperty('--mission-hero-copy-offset', clamp(state.config.layout.heroOffsetY, -120, 120, 0) + 'px');
    panel.style.setProperty('--mission-card-gap', clamp(state.config.layout.cardGap, 8, 40, 20) + 'px');
    panel.style.setProperty('--mission-section-spacing', clamp(state.config.layout.sectionSpacing, 18, 84, 42) + 'px');
    panel.style.setProperty('--mission-card-min', clamp(state.config.layout.cardMinHeight, 220, 420, 320) + 'px');
    panel.style.setProperty('--mission-community-columns', clamp(state.config.layout.communityColumns, 1, 4, 2));
    panel.style.setProperty('--mission-ministry-columns', clamp(state.config.layout.ministryColumns, 1, 4, 3));
    panel.style.setProperty('--mission-public-columns', clamp(state.config.layout.publicColumns, 1, 4, 3));
    panel.style.setProperty('--mission-hero-image-url', 'url("' + (state.config.visual.heroImage || '/assets/Graphic_1.png') + '")');
    panel.style.setProperty('--mission-hero-image-position', clamp(state.config.visual.heroImageX, 0, 100, getAnchorPercent(state.config.visual.heroImagePosition).x) + '% ' + clamp(state.config.visual.heroImageY, 0, 100, getAnchorPercent(state.config.visual.heroImagePosition).y) + '%');
    panel.style.setProperty('--mission-hero-image-size', getHeroImageSize(state.config.visual.heroImageFit, state.config.visual.heroImageScale));
    panel.style.setProperty('--mission-hero-image-opacity', clamp(state.config.visual.heroImageOpacity, 0, 0.65, 0.25));
    panel.style.setProperty('--mission-hero-image-clarity', clamp(state.config.visual.heroImageClarity, 0, 100, 0));
    panel.style.setProperty('--mission-hero-overlay-gradient', computeOverlayGradient(state.config.visual.heroFadeLeft, state.config.visual.heroFadeRight, state.config.visual.heroFadeStrength));
    panel.style.setProperty('--mission-hero-image-mask', computeImageMask(state.config.visual.heroFadeLeft, state.config.visual.heroFadeRight));
    panel.style.setProperty('--mission-heading-font', state.config.typography.headingFont || "'Montserrat', sans-serif");
    panel.style.setProperty('--mission-body-font', state.config.typography.bodyFont || "'Montserrat', sans-serif");
    panel.style.setProperty('--mission-hero-title-size', clamp(state.config.typography.heroTitleSize, 2.2, 6.8, 3.75) + 'rem');
    panel.style.setProperty('--mission-hero-title-width', clamp(state.config.typography.heroTitleWidth, 320, 1320, heroTextMax) + 'px');
    panel.style.setProperty('--mission-body-size', clamp(state.config.typography.bodySize, 0.75, 2.2, 1) + 'rem');
    panel.style.setProperty('--mission-hero-body-width', clamp(state.config.typography.heroBodyWidth, 320, 1040, 620) + 'px');
    panel.style.setProperty('--mission-hero-body-min-height', clamp(state.config.typography.heroBodyMinHeight, 0, 220, 0) + 'px');
    panel.style.setProperty('--mission-hero-title-gap', clamp(state.config.typography.heroTitleGap, 0, 64, 24) + 'px');
    panel.style.setProperty('--mission-section-title-size', clamp(state.config.typography.sectionTitleSize, 1.1, 2.4, 1.8) + 'rem');
    panel.style.setProperty('--mission-section-copy-size', clamp(state.config.typography.sectionCopySize, 0.72, 1.3, 0.96) + 'rem');
    panel.style.setProperty('--mission-section-copy-width', clamp(state.config.typography.sectionCopyWidth, 180, 520, 280) + 'px');
    panel.style.setProperty('--mission-section-copy-min-height', clamp(state.config.typography.sectionCopyMinHeight, 0, 220, 0) + 'px');
    panel.style.setProperty('--mission-card-title-size', clamp(state.config.typography.cardTitleSize, 0.9, 1.8, 1.45) + 'rem');
    panel.style.setProperty('--mission-card-body-size', clamp(state.config.typography.cardBodySize, 0.68, 1.15, 0.94) + 'rem');
    panel.style.setProperty('--mission-card-front-text-width', clamp(state.config.typography.cardFrontTextWidth, 140, 420, 260) + 'px');
    panel.style.setProperty('--mission-card-front-text-min-height', clamp(state.config.typography.cardFrontTextMinHeight, 0, 220, 0) + 'px');
    panel.style.setProperty('--mission-card-back-text-width', clamp(state.config.typography.cardBackTextWidth, 160, 420, 280) + 'px');
    panel.style.setProperty('--mission-card-back-text-min-height', clamp(state.config.typography.cardBackTextMinHeight, 0, 240, 0) + 'px');
    panel.style.setProperty('--mission-button-size', clamp(state.config.typography.buttonSize, 0.58, 1, 0.76) + 'rem');
    if (bar) {
      bar.style.minHeight = heroMinHeight + 'px';
      bar.style.height = heroMinHeight + 'px';
    }
    if (overlay) {
      overlay.style.minHeight = heroMinHeight + 'px';
      overlay.style.height = heroMinHeight + 'px';
    }
    if (grid) {
      grid.style.minHeight = heroMinHeight + 'px';
      grid.style.height = heroMinHeight + 'px';
      grid.style.gridTemplateColumns = 'minmax(0,' + heroTextMax + 'px) minmax(0,1fr)';
    }
    if (visual) {
      visual.style.minHeight = heroMinHeight + 'px';
      visual.style.height = heroMinHeight + 'px';
    }
    if (intro) {
      intro.style.width = heroTextMax + 'px';
      intro.style.maxWidth = heroTextMax + 'px';
      intro.style.flex = '0 0 ' + heroTextMax + 'px';
      intro.style.minHeight = heroMinHeight + 'px';
      intro.style.height = '';
      if ((state.config.layout.heroTextAlign || 'left') === 'center') {
        intro.style.marginLeft = 'auto';
        intro.style.marginRight = 'auto';
      } else {
        intro.style.marginLeft = '0';
        intro.style.marginRight = '0';
      }
    }
  }

  function renderMissionStaticContent(state) {
    var headline = document.getElementById('mission-hero-headline');
    var body = document.getElementById('mission-hero-body');
    var shell = document.getElementById('mission-shell');
    if (headline) headline.textContent = state.config.content.hero.headline || '';
    if (body) body.textContent = state.config.content.hero.body || '';
    state.sections.forEach(function(section) {
      var sectionEl = document.getElementById(SECTION_META[section.id].elementId);
      var titleEl = document.querySelector('[data-mission-section-title="' + section.id + '"]');
      var copyEl = document.querySelector('[data-mission-section-copy="' + section.id + '"]');
      if (titleEl) titleEl.textContent = section.title || '';
      if (copyEl) copyEl.textContent = section.copy || '';
      if (sectionEl) {
        sectionEl.classList.toggle('is-hidden', !section.visible);
        if (shell) shell.appendChild(sectionEl);
      }
    });
  }

  function renderOfferingsWithConfig(offerings) {
    var grids = {
      community: document.getElementById('offerings-grid-community'),
      ministry: document.getElementById('offerings-grid-ministry'),
      public: document.getElementById('offerings-grid-public')
    };
    if (!grids.community || !grids.ministry || !grids.public) return;
    grids.community.innerHTML = '';
    grids.ministry.innerHTML = '';
    grids.public.innerHTML = '';

    var visible = offerings.filter(function(offering) { return offering.visible !== false; });
    visible.sort(function(a, b) { return (a.order || 99) - (b.order || 99); });
    var editorOpen = isEditorOpen();

    visible.forEach(function(offering, idx) {
      var slug = window.getOfferingSlug(offering, idx);
      var graphic = (offering.frontImageUrl || offering.imageUrl)
        ? { url: offering.frontImageUrl || offering.imageUrl, pos: 'center right' }
        : ((window.MISSION_CARD_GRAPHICS && window.MISSION_CARD_GRAPHICS[slug]) || (window.CARD_GRAPHICS && (window.CARD_GRAPHICS[idx] || window.CARD_GRAPHICS[idx % window.CARD_GRAPHICS.length])));
      var meta = (window.MISSION_CARD_META && window.MISSION_CARD_META[slug]) || {};
      var frontTitle = offering.frontTitle || offering.title || '';
      var tagline = offering.frontDescription || meta.copy || offering.tagline || offering.blurb || '';
      var backHeading = offering.backHeading || frontTitle;
      var backCopy = offering.backDescription || meta.backCopy || tagline;
      var useFlip = offering.useFlipInteraction !== false;
      var actions = window.getOfferingActions(offering, meta);
      var frontCtaHtml = useFlip ? '<div class="cf-flip-hint">Tap or hover to explore</div>' : window.buildOfferingActionLinks(actions.slice(0, 1), 'front');
      var backLinksHtml = window.buildOfferingActionLinks(actions, 'back');
      var flip = document.createElement('div');
      flip.className = 'offering-flip' + (useFlip ? '' : ' no-flip');
      flip.tabIndex = 0;
      flip.setAttribute('role', 'button');
      flip.setAttribute('aria-label', (useFlip ? 'Flip ' : 'Open ') + frontTitle + ' card');
      flip.setAttribute('aria-expanded', 'false');
      flip.dataset.flipEnabled = useFlip ? 'true' : 'false';
      flip.dataset.cardId = slug;
      flip.classList.toggle('is-edit-selected', editorOpen && runtime.activeCardId === slug);
      if (editorOpen && runtime.activeCardId === slug && runtime.activeCardPreviewFace === 'back' && useFlip) {
        flip.classList.add('is-flipped');
        flip.setAttribute('aria-expanded', 'true');
      }
      if (graphic && graphic.url) {
        flip.style.setProperty('--card-graphic', 'url("' + graphic.url + '")');
        flip.style.setProperty('--card-bg-pos', graphic.pos);
      }
      if (offering.frontGraphicUrl) flip.style.setProperty('--card-graphic', 'url("' + offering.frontGraphicUrl + '")');
      if (offering.frontGraphicPosition) flip.style.setProperty('--card-bg-pos', offering.frontGraphicPosition);
      if (offering.frontGraphicShiftX != null) flip.style.setProperty('--card-graphic-shift-x', offering.frontGraphicShiftX + 'px');
      if (offering.frontGraphicShiftY != null) flip.style.setProperty('--card-graphic-shift-y', offering.frontGraphicShiftY + 'px');
      if (offering.frontGraphicWidth != null) flip.style.setProperty('--card-graphic-width', offering.frontGraphicWidth + 'px');
      if (offering.frontGraphicOpacity != null) flip.style.setProperty('--card-graphic-opacity', offering.frontGraphicOpacity);
      if (offering.frontGraphicScale != null) flip.style.setProperty('--card-graphic-scale', offering.frontGraphicScale);
      var frontGraphicFadeLeft = offering.frontGraphicFadeLeft != null ? offering.frontGraphicFadeLeft : offering.frontGraphicFadeX;
      var frontGraphicFadeRight = offering.frontGraphicFadeRight != null ? offering.frontGraphicFadeRight : offering.frontGraphicFadeX;
      if (frontGraphicFadeLeft || frontGraphicFadeRight || offering.frontGraphicFadeY) {
        flip.style.setProperty('--card-graphic-mask', computeImageMask(frontGraphicFadeLeft, frontGraphicFadeRight, offering.frontGraphicFadeY, offering.frontGraphicFadeY));
      }
      if (offering.frontTitleSize != null) flip.style.setProperty('--mission-card-title-size-local', offering.frontTitleSize + 'rem');
      if (offering.frontBodySize != null) flip.style.setProperty('--mission-card-body-size-local', offering.frontBodySize + 'rem');
      if (offering.backBodySize != null) flip.style.setProperty('--mission-card-back-body-size-local', offering.backBodySize + 'rem');
      if (offering.frontTextWidth != null) flip.style.setProperty('--mission-card-front-text-width-local', offering.frontTextWidth + 'px');
      if (offering.backBackground) flip.style.setProperty('--mission-card-back-bg', offering.backBackground);
      if (offering.backStripColor) flip.style.setProperty('--mission-card-back-strip-bg', offering.backStripColor);
      if (offering.backTextColor) flip.style.setProperty('--mission-card-back-text', offering.backTextColor);
      if (offering.buttonColor) flip.style.setProperty('--mission-card-back-button-bg', offering.buttonColor);
      if (offering.buttonTextColor) flip.style.setProperty('--mission-card-back-button-text', offering.buttonTextColor);
      var cardBackHtml;
      if (offering.backLayout === 'lookbook' && offering.lookbookImage) {
        var primary = actions[0] || { label: 'Open the Partner Lookbook', url: offering.lookbookUrl || '#', type: 'lookbook' };
        var secondary = actions[1] || null;
        var lookbookHref = offering.lookbookUrl || (primary && primary.url) || '#';
        var primaryHref = (primary && primary.url) || lookbookHref;
        var tileStyle = '';
        if (offering.lookbookTileWidth) tileStyle += 'width:' + Number(offering.lookbookTileWidth) + 'px;';
        if (offering.lookbookTileHeight) tileStyle += 'height:' + Number(offering.lookbookTileHeight) + 'px;';
        if (offering.lookbookTileTilt != null) tileStyle += 'transform:rotate(' + Number(offering.lookbookTileTilt) + 'deg);';
        var hidePages = !!offering.lookbookTileFlat;
        var titleStyle = offering.lookbookTitleSize ? ' style="font-size:' + Number(offering.lookbookTitleSize) + 'px;"' : '';
        var leadStyle = offering.lookbookLeadSize ? ' style="font-size:' + Number(offering.lookbookLeadSize) + 'px;"' : '';
        var secondaryHtml = secondary
          ? '<a class="cb-cta lb-btn lb-btn-ghost" href="' + escapeHtml(secondary.url) + '" target="_blank" rel="noopener" data-action-type="' + escapeHtml(secondary.type || 'course') + '">' + escapeHtml(secondary.label) + ' <span class="lb-ext" aria-hidden="true">↗</span></a>'
          : '';
        cardBackHtml =
          '<div class="card-back card-back--lookbook">' +
            '<div class="lb-left">' +
              '<h3 class="lb-title"' + titleStyle + '>' + escapeHtml(backHeading) + '</h3>' +
              '<span class="lb-accent" aria-hidden="true"></span>' +
              '<p class="lb-lead"' + leadStyle + '>' + escapeHtml(backCopy) + '</p>' +
              '<div class="lb-ctas">' +
                '<a class="cb-cta lb-btn lb-btn-primary" href="' + escapeHtml(primaryHref) + '" data-action-type="' + escapeHtml((primary && primary.type) || 'lookbook') + '">' + escapeHtml(primary.label) + ' <span class="lb-arrow" aria-hidden="true">→</span></a>' +
                secondaryHtml +
              '</div>' +
            '</div>' +
            '<div class="lb-divider" aria-hidden="true"></div>' +
            '<div class="lb-right">' +
              '<a class="cb-cta lb-tile' + (hidePages ? ' is-flat' : '') + '" href="' + escapeHtml(lookbookHref) + '" data-action-type="lookbook" aria-label="Open the ' + escapeHtml(backHeading) + ' lookbook"' + (tileStyle ? ' style="' + tileStyle + '"' : '') + '>' +
                (hidePages ? '' : '<div class="lb-pages-back" aria-hidden="true"></div>') +
                (hidePages ? '' : '<div class="lb-pages-mid" aria-hidden="true"></div>') +
                '<div class="lb-cover">' +
                  '<img src="' + escapeHtml(offering.lookbookImage) + '" alt="' + escapeHtml(offering.lookbookAlt || '') + '" />' +
                '</div>' +
              '</a>' +
            '</div>' +
          '</div>';
      } else {
        cardBackHtml =
          '<div class="card-back">' +
            '<div class="cb-strip">' + escapeHtml(backHeading) + '</div>' +
            '<div class="cb-body">' +
              '<div class="cb-hook" style="font-size:var(--mission-card-back-body-size-local, var(--mission-card-body-size));">' + escapeHtml(backCopy) + '</div>' +
              '<div class="cb-icon">' + window.getIconSVG(offering.icon, '#c84826') + '</div>' +
              backLinksHtml +
            '</div>' +
          '</div>';
      }
      flip.innerHTML =
        '<div class="offering-flip-inner">' +
          '<div class="card-front">' +
            '<div class="cf-group">' + window.getOfferingGroupLabel(offering, idx) + '</div>' +
            '<div class="cf-top">' +
              '<div class="cf-name">' + escapeHtml(frontTitle) + '</div>' +
              '<div class="cf-icon">' + window.getIconSVG(offering.icon, offering.iconColor) + '</div>' +
            '</div>' +
            '<div class="cf-tagline">' + escapeHtml(tagline) + '</div>' +
            '<div class="cf-hook"></div>' +
            frontCtaHtml +
          '</div>' +
          cardBackHtml +
        '</div>';
      flip.addEventListener('click', function(event) {
        if (event.target.closest('.cb-cta')) return;
        event.preventDefault();
        event.stopPropagation();
        selectCardFromCanvas(slug, flip.classList.contains('is-flipped') ? 'back' : 'front');
      }, true);
      (grids[runtime.currentState.sectionMap[slug] || 'ministry'] || grids.ministry).appendChild(flip);
    });

    window.initMissionCardInteractions();
  }

  window.buildOfferingActionLinks = function(actions, mode) {
    if (!actions.length) return mode === 'back' ? '<div class="cb-links"><span class="cb-cta-tag">No links yet</span></div>' : '';
    return '<div class="cb-links">' + actions.map(function(action) {
      return '<a class="cb-cta" href="' + action.url + '" target="_blank" rel="noopener" data-action-type="' + action.type + '">' + escapeHtml(action.label) + '</a>';
    }).join('') + '</div>';
  };

  window.renderOfferings = function(offerings) {
    if (offerings && offerings.length) runtime.baseOfferings = deepClone(offerings);
    runtime.currentState = buildMissionState(runtime.baseOfferings, runtime.draftConfig);
    applyMissionVariables(runtime.currentState);
    renderMissionStaticContent(runtime.currentState);
    renderOfferingsWithConfig(runtime.currentState.cards);
    if (runtime.controlsReady) syncEditorFromState();
  };

  function hasDraftChanges() {
    return !configsEqual(runtime.draftConfig, runtime.baselineConfig);
  }

  function updateStatus(savedMessage) {
    if (!runtime.controlsReady) return;
    runtime.ui.status.textContent = savedMessage || (hasDraftChanges() ? 'Live draft preview active' : 'Saved browser version loaded');
    runtime.ui.status.classList.toggle('is-saved', !hasDraftChanges() || !!savedMessage);
    updateDraftNotice();
  }

  function notifySaved(message) {
    updateStatus(message || 'Changes saved in browser');
    if (window.pageEditorShowToast) window.pageEditorShowToast(runtime.ui.shell, message || 'Changes saved in browser');
  }

  function syncEditorScopeVisibility() {
    if (!runtime.ui.shell) return;
    var scope = runtime.activeEditorScope || 'hero';
    var groups = runtime.ui.shell.querySelectorAll('[data-mission-editor-scope]');
    groups.forEach(function(group) {
      var tokens = String(group.getAttribute('data-mission-editor-scope') || '').split(/\s+/).filter(Boolean);
      if (scope === 'hero') {
        group.hidden = tokens.indexOf('hero') === -1;
      } else {
        group.hidden = tokens.indexOf('hero') !== -1 || (tokens.indexOf('section') === -1 && tokens.indexOf('page') === -1 && tokens.indexOf('card') === -1);
      }
    });
    syncEditorTabs();
  }

    async function publishDraft() {
      if (!window.confirm('Publish the current Mission draft to main?')) return;
      updateStatus('Publishing to main…');
    await window.pageEditorPublishConfig({
      commitMessage: 'Publish Mission editor updates',
      files: [
        {
          path: 'assets/page-config/mission-page.json',
          content: runtime.draftConfig
        }
      ]
    });
    runtime.publishedConfig = deepClone(runtime.draftConfig);
    runtime.storedDraftConfig = null;
    clearStoredConfig();
    runtime.baselineConfig = deepClone(runtime.draftConfig);
      notifySaved('Published to main');
    }

    window.missionEditorBridge = {
      getDraftConfig: function() {
        return runtime.draftConfig ? deepClone(runtime.draftConfig) : null;
      },
      markPublished: function(message) {
        if (!runtime.draftConfig) return;
        runtime.publishedConfig = deepClone(runtime.draftConfig);
        runtime.storedDraftConfig = null;
        clearStoredConfig();
        runtime.baselineConfig = deepClone(runtime.draftConfig);
        notifySaved(message || 'Published to main');
      }
    };

  function getCardById(cardId) {
    if (!runtime.currentState || !cardId) return null;
    for (var i = 0; i < runtime.currentState.cards.length; i += 1) {
      var card = runtime.currentState.cards[i];
      if (window.getOfferingSlug(card, i) === cardId) return card;
    }
    return null;
  }

  function getCardsForEditorSection() {
    if (!runtime.currentState) return [];
    if (runtime.activeEditorScope !== 'section') {
      return runtime.currentState.cards.slice();
    }
    return runtime.currentState.cards.filter(function(card) {
      return (card.section || 'ministry') === runtime.activeSectionId;
    });
  }

  function ensureActiveCardForSection() {
    var cards = getCardsForEditorSection();
    if (!cards.length) {
      runtime.activeCardId = null;
      return;
    }
    var current = getCardById(runtime.activeCardId);
    if (!current || (runtime.activeEditorScope === 'section' && current.section !== runtime.activeSectionId)) {
      runtime.activeCardId = window.getOfferingSlug(cards[0], runtime.currentState.cards.indexOf(cards[0]));
      runtime.activeCardPreviewFace = 'front';
    }
  }

  function syncEditorTabs() {
    if (!runtime.ui || !runtime.ui.tabs) return;
    runtime.ui.tabs.forEach(function(tab) {
      var tabScope = tab.getAttribute('data-mission-editor-tab');
      var tabSection = tab.getAttribute('data-mission-editor-section');
      var active = runtime.activeEditorScope === tabScope && (tabScope !== 'section' || tabSection === runtime.activeSectionId);
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function openEditor(scope) {
    runtime.activeEditorScope = scope || runtime.activeEditorScope || 'hero';
    if (runtime.activeEditorScope === 'section') {
      ensureActiveCardForSection();
    }
    runtime.ui.shell.removeAttribute('hidden');
    runtime.ui.toggle.setAttribute('aria-expanded', 'true');
    syncEditorScopeVisibility();
  }

  function closeEditor(forceDiscard) {
    if (!forceDiscard && hasDraftChanges()) {
      if (window.confirm('Save your Mission edits before closing? Click OK to save. Click Cancel for more options.')) {
        runtime.storedDraftConfig = deepClone(runtime.draftConfig);
        setStoredConfig(runtime.storedDraftConfig);
        runtime.baselineConfig = deepClone(runtime.draftConfig);
        notifySaved('Changes saved in browser');
      } else {
        if (!window.confirm('Discard unsaved Mission edits and close the editor?')) return false;
        runtime.draftConfig = deepClone(runtime.baselineConfig);
        window.renderOfferings(runtime.baseOfferings);
      }
    }
    runtime.ui.shell.setAttribute('hidden', '');
    runtime.ui.toggle.setAttribute('aria-expanded', 'false');
    window.renderOfferings(runtime.baseOfferings);
    return true;
  }

  function selectCardFromCanvas(cardId, face) {
    runtime.activeCardId = cardId;
    runtime.activeCardPreviewFace = face || 'front';
    var selectedCard = getCardById(cardId);
    if (selectedCard && selectedCard.section) {
      runtime.activeSectionId = selectedCard.section;
      runtime.orderSectionId = selectedCard.section;
    }
    if (runtime.controlsReady) {
      openEditor('section');
      syncEditorFromState();
    }
  }

  function selectHeroFromCanvas() {
    if (runtime.controlsReady) {
      openEditor('hero');
      syncEditorFromState();
    }
  }

  function populateHeroImages() {
    if (!runtime.ui.heroImage || runtime.ui.heroImage.options.length) return;
    HERO_IMAGE_OPTIONS.forEach(function(option) {
      var el = document.createElement('option');
      el.value = option.value;
      el.textContent = option.label;
      runtime.ui.heroImage.appendChild(el);
    });
  }

  function populateCardArtworkOptions() {
    if (!runtime.ui.cardArtwork || runtime.ui.cardArtwork.options.length) return;
    CARD_ART_OPTIONS.forEach(function(option) {
      var el = document.createElement('option');
      el.value = option.value;
      el.textContent = option.label;
      runtime.ui.cardArtwork.appendChild(el);
    });
  }

  function rebuildSectionLists() {
    if (!runtime.currentState) return;
    runtime.ui.sectionSelect.innerHTML = '';
    runtime.ui.orderSectionSelect.innerHTML = '';
    runtime.currentState.sections.forEach(function(section) {
      var option = document.createElement('option');
      option.value = section.id;
      option.textContent = section.title;
      runtime.ui.sectionSelect.appendChild(option);
      var orderOption = document.createElement('option');
      orderOption.value = section.id;
      orderOption.textContent = section.title;
      runtime.ui.orderSectionSelect.appendChild(orderOption);
    });
    if (!runtime.currentState.config.sections[runtime.activeSectionId]) runtime.activeSectionId = runtime.currentState.sections[0].id;
    if (!runtime.currentState.config.sections[runtime.orderSectionId]) runtime.orderSectionId = runtime.currentState.sections[0].id;
    runtime.ui.sectionSelect.value = runtime.activeSectionId;
    runtime.ui.orderSectionSelect.value = runtime.orderSectionId;
  }

  function rebuildSectionVisibility() {
    var wrap = runtime.ui.sectionVisibility;
    if (!wrap || !runtime.currentState) return;
    wrap.innerHTML = '';
    runtime.currentState.sections.forEach(function(section) {
      var row = document.createElement('div');
      row.className = 'editor-checkbox';
      var label = document.createElement('label');
      var input = document.createElement('input');
      var id = 'mission-editor-visibility-' + section.id;
      label.setAttribute('for', id);
      label.textContent = section.title;
      input.type = 'checkbox';
      input.id = id;
      input.checked = section.visible !== false;
      input.addEventListener('change', function() {
        ensureSectionConfig(runtime.draftConfig, section.id).visible = input.checked;
        window.renderOfferings(runtime.baseOfferings);
        updateStatus();
      });
      row.appendChild(label);
      row.appendChild(input);
      wrap.appendChild(row);
    });
  }

  function rebuildCardSelect() {
    if (!runtime.currentState) return;
    var previous = runtime.activeCardId;
    runtime.ui.cardSelect.innerHTML = '';
    var cards = getCardsForEditorSection();
    cards.forEach(function(card) {
      var idx = runtime.currentState.cards.indexOf(card);
      var slug = window.getOfferingSlug(card, idx);
      var option = document.createElement('option');
      option.value = slug;
      option.textContent = card.frontTitle || card.title || slug;
      runtime.ui.cardSelect.appendChild(option);
    });
    runtime.activeCardId = previous;
    ensureActiveCardForSection();
    if (runtime.activeCardId) runtime.ui.cardSelect.value = runtime.activeCardId;
  }

  function rebuildCardLinkEditors() {
    var wrap = runtime.ui.cardLinks;
    if (!wrap) return;
    wrap.innerHTML = '';
    if (!runtime.currentState || !runtime.activeCardId) return;
    var card = runtime.currentState.cards.find(function(item, idx) {
      return window.getOfferingSlug(item, idx) === runtime.activeCardId;
    });
    var actions = card ? getEffectiveCardActions(card, runtime.activeCardId).slice(0, 3) : [];
    while (actions.length < 3) actions.push({ label: '', url: '', type: 'resource', visible: true });
    actions.forEach(function(action, index) {
      var block = document.createElement('div');
      block.className = 'editor-field';
      block.innerHTML =
        '<label class="editor-label">Back link ' + (index + 1) + ' label</label>' +
        '<input type="text" data-link-label="' + index + '">' +
        '<label class="editor-label">Back link ' + (index + 1) + ' URL</label>' +
        '<input type="text" data-link-url="' + index + '">';
      wrap.appendChild(block);
      var labelInput = block.querySelector('[data-link-label]');
      var urlInput = block.querySelector('[data-link-url]');
      labelInput.value = action.label || '';
      urlInput.value = action.url || '';
      bindLiveInput(labelInput, function() {
        runtime.activeCardPreviewFace = 'back';
        var cfg = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
        if (!cfg.actions || !cfg.actions.length) cfg.actions = getEffectiveCardActions(card, runtime.activeCardId);
        if (!cfg.actions[index]) cfg.actions[index] = { label: '', url: '', type: 'resource', visible: true };
        cfg.actions[index].visible = true;
        cfg.actions[index].label = labelInput.value;
        window.renderOfferings(runtime.baseOfferings);
      });
      bindLiveInput(urlInput, function() {
        runtime.activeCardPreviewFace = 'back';
        var cfg = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
        if (!cfg.actions || !cfg.actions.length) cfg.actions = getEffectiveCardActions(card, runtime.activeCardId);
        if (!cfg.actions[index]) cfg.actions[index] = { label: '', url: '', type: 'resource', visible: true };
        cfg.actions[index].visible = true;
        cfg.actions[index].url = urlInput.value;
        window.renderOfferings(runtime.baseOfferings);
      });
    });
  }

  function updateRangeLabels() {
    runtime.ui.shellMaxValue.textContent = formatPx(runtime.ui.shellMax.value);
    runtime.ui.gutterValue.textContent = formatPx(runtime.ui.gutter.value);
    runtime.ui.heroTextMaxValue.textContent = formatPx(runtime.ui.heroTextMax.value);
    runtime.ui.heroMinHeightValue.textContent = formatPx(runtime.ui.heroMinHeight.value);
    runtime.ui.heroGapValue.textContent = formatPx(runtime.ui.heroGap.value);
    runtime.ui.heroOffsetYValue.textContent = formatPx(runtime.ui.heroOffsetY.value);
    runtime.ui.sectionSpacingValue.textContent = formatPx(runtime.ui.sectionSpacing.value);
    runtime.ui.cardGapValue.textContent = formatPx(runtime.ui.cardGap.value);
    runtime.ui.cardMinHeightValue.textContent = formatPx(runtime.ui.cardMinHeight.value);
    runtime.ui.heroImageScaleValue.textContent = Math.round(Number(runtime.ui.heroImageScale.value) || 0) + '%';
    runtime.ui.heroImageXValue.textContent = Math.round(Number(runtime.ui.heroImageX.value) || 0) + '%';
    runtime.ui.heroImageYValue.textContent = Math.round(Number(runtime.ui.heroImageY.value) || 0) + '%';
    runtime.ui.heroImageOpacityValue.textContent = formatPercent(runtime.ui.heroImageOpacity.value);
    runtime.ui.heroImageClarityValue.textContent = Math.round(Number(runtime.ui.heroImageClarity.value) || 0) + '%';
    runtime.ui.heroFadeStrengthValue.textContent = formatPercent(runtime.ui.heroFadeStrength.value);
    runtime.ui.heroFadeLeftValue.textContent = formatPercent((Number(runtime.ui.heroFadeLeft.value) || 0) / 100);
    runtime.ui.heroFadeRightValue.textContent = formatPercent((Number(runtime.ui.heroFadeRight.value) || 0) / 100);
    runtime.ui.heroTitleSizeValue.textContent = Number(runtime.ui.heroTitleSize.value).toFixed(2) + 'rem';
    runtime.ui.bodySizeValue.textContent = Number(runtime.ui.bodySize.value).toFixed(2) + 'rem';
    runtime.ui.heroBodyWidthValue.textContent = formatPx(runtime.ui.heroBodyWidth.value);
    runtime.ui.heroTitleWidthValue.textContent = formatPx(runtime.ui.heroTitleWidth.value);
    runtime.ui.heroTitleGapValue.textContent = formatPx(runtime.ui.heroTitleGap.value);
    runtime.ui.heroBodyHeightValue.textContent = formatPx(runtime.ui.heroBodyHeight.value);
    runtime.ui.sectionTitleSizeValue.textContent = Number(runtime.ui.sectionTitleSize.value).toFixed(2) + 'rem';
    runtime.ui.sectionCopySizeValue.textContent = Number(runtime.ui.sectionCopySize.value).toFixed(2) + 'rem';
    runtime.ui.sectionCopyWidthValue.textContent = formatPx(runtime.ui.sectionCopyWidth.value);
    runtime.ui.sectionCopyHeightValue.textContent = formatPx(runtime.ui.sectionCopyHeight.value);
    runtime.ui.cardTitleSizeValue.textContent = Number(runtime.ui.cardTitleSize.value).toFixed(2) + 'rem';
    runtime.ui.cardBodySizeValue.textContent = Number(runtime.ui.cardBodySize.value).toFixed(2) + 'rem';
    runtime.ui.cardFrontBoxWidthValue.textContent = formatPx(runtime.ui.cardFrontBoxWidth.value);
    runtime.ui.cardFrontBoxHeightValue.textContent = formatPx(runtime.ui.cardFrontBoxHeight.value);
    runtime.ui.cardBackBoxWidthValue.textContent = formatPx(runtime.ui.cardBackBoxWidth.value);
    runtime.ui.cardBackBoxHeightValue.textContent = formatPx(runtime.ui.cardBackBoxHeight.value);
    runtime.ui.buttonSizeValue.textContent = Number(runtime.ui.buttonSize.value).toFixed(2) + 'rem';
    runtime.ui.cardArtOpacityValue.textContent = formatPercent(runtime.ui.cardArtOpacity.value);
    runtime.ui.cardArtScaleValue.textContent = Number(runtime.ui.cardArtScale.value).toFixed(2) + 'x';
    runtime.ui.cardArtWidthValue.textContent = formatPx(runtime.ui.cardArtWidth.value);
    runtime.ui.cardArtFadeXValue.textContent = Math.round(Number(runtime.ui.cardArtFadeX.value) || 0) + '%';
    runtime.ui.cardArtFadeRightValue.textContent = Math.round(Number(runtime.ui.cardArtFadeRight.value) || 0) + '%';
    runtime.ui.cardArtFadeYValue.textContent = Math.round(Number(runtime.ui.cardArtFadeY.value) || 0) + '%';
    runtime.ui.cardTitleSizeLocalValue.textContent = Number(runtime.ui.cardTitleSizeLocal.value).toFixed(2) + 'rem';
    runtime.ui.cardBodySizeLocalValue.textContent = Number(runtime.ui.cardBodySizeLocal.value).toFixed(2) + 'rem';
    runtime.ui.cardBackBodySizeLocalValue.textContent = Number(runtime.ui.cardBackBodySizeLocal.value).toFixed(2) + 'rem';
    runtime.ui.cardFrontBoxWidthLocalValue.textContent = formatPx(runtime.ui.cardFrontBoxWidthLocal.value);
    runtime.ui.cardArtShiftXValue.textContent = formatPx(runtime.ui.cardArtShiftX.value);
    runtime.ui.cardArtShiftYValue.textContent = formatPx(runtime.ui.cardArtShiftY.value);
  }

  function syncEditorFromState() {
    if (!runtime.controlsReady || !runtime.currentState) return;
    var config = runtime.currentState.config;
    var section = config.sections[runtime.activeSectionId] || config.sections.community;
    var cardConfig = runtime.activeCardId ? ensureCardConfig(config, runtime.activeCardId) : null;
    var card = runtime.currentState.cards.find(function(item, idx) {
      return window.getOfferingSlug(item, idx) === runtime.activeCardId;
    });

    rebuildSectionLists();
    rebuildSectionVisibility();
    rebuildCardSelect();
    rebuildCardLinkEditors();

    runtime.ui.heroHeadline.value = config.content.hero.headline || '';
    runtime.ui.heroBody.value = config.content.hero.body || '';
    runtime.ui.sectionTitle.value = section.title || '';
    runtime.ui.sectionCopy.value = section.copy || '';
    runtime.ui.shellMax.value = clamp(config.layout.shellMax, 1280, 1880, 1680);
    runtime.ui.gutter.value = clamp(config.layout.gutter, 12, 72, 28);
    runtime.ui.heroTextMax.value = clamp(config.layout.heroTextMax, 420, 1320, 700);
    runtime.ui.heroMinHeight.value = clamp(config.layout.heroMinHeight, 240, 520, 348);
    runtime.ui.heroGap.value = clamp(config.layout.heroGap, 8, 72, 24);
    runtime.ui.heroOffsetY.value = clamp(config.layout.heroOffsetY, -120, 120, 0);
    runtime.ui.sectionSpacing.value = clamp(config.layout.sectionSpacing, 18, 84, 42);
    runtime.ui.cardGap.value = clamp(config.layout.cardGap, 8, 40, 20);
    runtime.ui.cardMinHeight.value = clamp(config.layout.cardMinHeight, 220, 420, 320);
    runtime.ui.heroTextAlign.value = config.layout.heroTextAlign || 'left';
    runtime.ui.heroBalance.value = config.layout.heroColumns || '1.05fr 0.95fr';
    runtime.ui.communityColumns.value = String(clamp(config.layout.communityColumns, 1, 4, 2));
    runtime.ui.ministryColumns.value = String(clamp(config.layout.ministryColumns, 1, 4, 3));
    runtime.ui.publicColumns.value = String(clamp(config.layout.publicColumns, 1, 4, 3));
    var selectedHeroImage = config.visual.heroImage || '/assets/Graphic_1.png';
    setSelectValueWithCustomOption(runtime.ui.heroImage, selectedHeroImage);
    runtime.ui.heroImagePath.value = normalizeAssetPath(selectedHeroImage);
    runtime.ui.heroImagePosition.value = config.visual.heroImagePosition || 'center right';
    runtime.ui.heroImageFit.value = config.visual.heroImageFit || 'width';
    runtime.ui.heroImageX.value = clamp(config.visual.heroImageX, 0, 100, getAnchorPercent(config.visual.heroImagePosition).x);
    runtime.ui.heroImageY.value = clamp(config.visual.heroImageY, 0, 100, getAnchorPercent(config.visual.heroImagePosition).y);
    runtime.ui.heroImageScale.value = clamp(config.visual.heroImageScale, 70, 230, 100);
    runtime.ui.heroImageOpacity.value = clamp(config.visual.heroImageOpacity, 0, 0.65, 0.25);
    runtime.ui.heroImageClarity.value = clamp(config.visual.heroImageClarity, 0, 100, 0);
    runtime.ui.heroFadeStrength.value = clamp(config.visual.heroFadeStrength, 0.2, 0.98, 0.32);
    runtime.ui.heroFadeLeft.value = clamp(config.visual.heroFadeLeft, 0, 100, 18);
    runtime.ui.heroFadeRight.value = clamp(config.visual.heroFadeRight, 0, 100, 12);
    runtime.ui.headingFont.value = config.typography.headingFont || "'Montserrat', sans-serif";
    runtime.ui.bodyFont.value = config.typography.bodyFont || "'Montserrat', sans-serif";
    runtime.ui.heroTitleSize.value = clamp(config.typography.heroTitleSize, 2.2, 6.8, 3.75);
    runtime.ui.bodySize.value = clamp(config.typography.bodySize, 0.75, 2.2, 1);
    runtime.ui.heroBodyWidth.value = clamp(config.typography.heroBodyWidth, 320, 1040, 620);
    runtime.ui.heroTitleWidth.value = clamp(config.typography.heroTitleWidth, 320, 1320, clamp(config.layout.heroTextMax, 420, 1320, 700));
    runtime.ui.heroTitleGap.value = clamp(config.typography.heroTitleGap, 0, 64, 24);
    runtime.ui.heroBodyHeight.value = clamp(config.typography.heroBodyMinHeight, 0, 220, 0);
    runtime.ui.sectionTitleSize.value = clamp(config.typography.sectionTitleSize, 1.1, 2.4, 1.8);
    runtime.ui.sectionCopySize.value = clamp(config.typography.sectionCopySize, 0.72, 1.3, 0.96);
    runtime.ui.sectionCopyWidth.value = clamp(config.typography.sectionCopyWidth, 180, 520, 280);
    runtime.ui.sectionCopyHeight.value = clamp(config.typography.sectionCopyMinHeight, 0, 220, 0);
    runtime.ui.cardTitleSize.value = clamp(config.typography.cardTitleSize, 0.9, 1.8, 1.45);
    runtime.ui.cardBodySize.value = clamp(config.typography.cardBodySize, 0.68, 1.15, 0.94);
    runtime.ui.cardFrontBoxWidth.value = clamp(config.typography.cardFrontTextWidth, 140, 420, 260);
    runtime.ui.cardFrontBoxHeight.value = clamp(config.typography.cardFrontTextMinHeight, 0, 220, 0);
    runtime.ui.cardBackBoxWidth.value = clamp(config.typography.cardBackTextWidth, 160, 420, 280);
    runtime.ui.cardBackBoxHeight.value = clamp(config.typography.cardBackTextMinHeight, 0, 240, 0);
    runtime.ui.buttonSize.value = clamp(config.typography.buttonSize, 0.58, 1, 0.76);
    runtime.ui.orderSectionValue.value = String(clamp((config.sections[runtime.orderSectionId] || {}).order, 1, 3, 1));

    if (card && cardConfig) {
      runtime.ui.cardMeta.textContent = (SECTION_META[card.section] ? SECTION_META[card.section].label : 'Mission') + ' card';
      runtime.ui.cardTitle.value = card.frontTitle || card.title || '';
      runtime.ui.cardDescription.value = card.frontDescription || '';
      var selectedArtwork = card.frontGraphicUrl || ((window.MISSION_CARD_GRAPHICS && window.MISSION_CARD_GRAPHICS[runtime.activeCardId] && window.MISSION_CARD_GRAPHICS[runtime.activeCardId].url) || CARD_ART_OPTIONS[0].value);
      setSelectValueWithCustomOption(runtime.ui.cardArtwork, selectedArtwork);
      runtime.ui.cardArtworkPath.value = normalizeAssetPath(selectedArtwork);
      runtime.ui.cardArtPosition.value = card.frontGraphicPosition || ((window.MISSION_CARD_GRAPHICS && window.MISSION_CARD_GRAPHICS[runtime.activeCardId] && window.MISSION_CARD_GRAPHICS[runtime.activeCardId].pos) || 'center right');
      runtime.ui.cardTitleSizeLocal.value = clamp(card.frontTitleSize, 0.9, 1.9, clamp(config.typography.cardTitleSize, 0.9, 1.8, 1.45));
      runtime.ui.cardBodySizeLocal.value = clamp(card.frontBodySize, 0.68, 1.25, clamp(config.typography.cardBodySize, 0.68, 1.15, 0.94));
      runtime.ui.cardBackBodySizeLocal.value = clamp(card.backBodySize, 0.68, 1.25, clamp(config.typography.cardBodySize, 0.68, 1.15, 0.94));
      runtime.ui.cardFrontBoxWidthLocal.value = clamp(card.frontTextWidth, 180, 420, clamp(config.typography.cardFrontTextWidth, 140, 420, 260));
      runtime.ui.cardArtShiftX.value = clamp(card.frontGraphicShiftX, -360, 360, 0);
      runtime.ui.cardArtShiftY.value = clamp(card.frontGraphicShiftY, -320, 320, 0);
      runtime.ui.cardArtWidth.value = clamp(card.frontGraphicWidth, 80, 560, card.section === 'community' ? 164 : 144);
      runtime.ui.cardArtOpacity.value = card.frontGraphicOpacity != null ? card.frontGraphicOpacity : 0.9;
      runtime.ui.cardArtScale.value = card.frontGraphicScale != null ? clamp(card.frontGraphicScale, 0.4, 12, 1) : 1;
      runtime.ui.cardArtFadeX.value = clamp(card.frontGraphicFadeLeft != null ? card.frontGraphicFadeLeft : card.frontGraphicFadeX, 0, 100, 0);
      runtime.ui.cardArtFadeRight.value = clamp(card.frontGraphicFadeRight != null ? card.frontGraphicFadeRight : card.frontGraphicFadeX, 0, 100, 0);
      runtime.ui.cardArtFadeY.value = clamp(card.frontGraphicFadeY, 0, 100, 0);
      runtime.ui.cardBackTitle.value = card.backHeading || '';
      runtime.ui.cardBackDescription.value = card.backDescription || '';
      runtime.ui.cardButtonLabel.value = cardConfig.primaryActionLabel || (((card.cardActions || [])[0] || {}).label || '');
      runtime.ui.cardSection.value = card.section || 'community';
      runtime.ui.cardOrder.value = String(card.order || 1);
      runtime.ui.cardVisible.checked = card.visible !== false;
      runtime.ui.cardBackBg.value = card.backBackground || '#1e2530';
      runtime.ui.cardBackStrip.value = card.backStripColor || '#c84826';
      runtime.ui.cardBackTextColor.value = card.backTextColor || '#fafaf2';
      runtime.ui.cardButtonBg.value = card.buttonColor || '#c84826';
      runtime.ui.cardButtonText.value = card.buttonTextColor || '#fafaf2';
    }

    updateRangeLabels();
    syncEditorScopeVisibility();
    updateStatus();
  }

  function bindLiveInput(element, handler) {
    if (!element) return;
    element.addEventListener('input', handler);
    element.addEventListener('change', handler);
  }

  function initEditor() {
    if (runtime.controlsReady) return;
    runtime.ui = {
      toggle: document.getElementById('mission-editor-toggle'),
      shell: document.getElementById('mission-editor-shell'),
      close: document.getElementById('mission-editor-close'),
      status: document.getElementById('mission-editor-status'),
      draftNotice: document.getElementById('mission-editor-draft-notice'),
      restoreDraft: document.getElementById('mission-editor-restore-draft'),
      discardDraft: document.getElementById('mission-editor-discard-draft'),
      tabs: Array.prototype.slice.call(document.querySelectorAll('#mission-editor-shell [data-mission-editor-tab]')),
      heroHeadline: document.getElementById('mission-editor-hero-headline'),
      heroBody: document.getElementById('mission-editor-hero-body'),
      sectionSelect: document.getElementById('mission-editor-section-select'),
      sectionTitle: document.getElementById('mission-editor-section-title'),
      sectionCopy: document.getElementById('mission-editor-section-copy'),
      shellMax: document.getElementById('mission-editor-shell-max'),
      shellMaxValue: document.getElementById('mission-editor-shell-max-value'),
      gutter: document.getElementById('mission-editor-gutter'),
      gutterValue: document.getElementById('mission-editor-gutter-value'),
      heroTextMax: document.getElementById('mission-editor-hero-text-max'),
      heroTextMaxValue: document.getElementById('mission-editor-hero-text-max-value'),
      heroMinHeight: document.getElementById('mission-editor-hero-min-height'),
      heroMinHeightValue: document.getElementById('mission-editor-hero-min-height-value'),
      heroGap: document.getElementById('mission-editor-hero-gap'),
      heroGapValue: document.getElementById('mission-editor-hero-gap-value'),
      heroOffsetY: document.getElementById('mission-editor-hero-offset-y'),
      heroOffsetYValue: document.getElementById('mission-editor-hero-offset-y-value'),
      sectionSpacing: document.getElementById('mission-editor-section-spacing'),
      sectionSpacingValue: document.getElementById('mission-editor-section-spacing-value'),
      cardGap: document.getElementById('mission-editor-card-gap'),
      cardGapValue: document.getElementById('mission-editor-card-gap-value'),
      cardMinHeight: document.getElementById('mission-editor-card-min-height'),
      cardMinHeightValue: document.getElementById('mission-editor-card-min-height-value'),
      heroTextAlign: document.getElementById('mission-editor-hero-text-align'),
      heroBalance: document.getElementById('mission-editor-hero-balance'),
      communityColumns: document.getElementById('mission-editor-community-columns'),
      ministryColumns: document.getElementById('mission-editor-ministry-columns'),
      publicColumns: document.getElementById('mission-editor-public-columns'),
      heroImage: document.getElementById('mission-editor-hero-image'),
      heroImagePath: document.getElementById('mission-editor-hero-image-path'),
      heroImageUpload: document.getElementById('mission-editor-hero-image-upload'),
      heroImageUploadButton: document.getElementById('mission-editor-hero-image-upload-button'),
      heroImageUploadStatus: document.getElementById('mission-editor-hero-image-upload-status'),
      heroImagePosition: document.getElementById('mission-editor-hero-image-position'),
      heroImageFit: document.getElementById('mission-editor-hero-image-fit'),
      heroImageX: document.getElementById('mission-editor-hero-image-x'),
      heroImageXValue: document.getElementById('mission-editor-hero-image-x-value'),
      heroImageY: document.getElementById('mission-editor-hero-image-y'),
      heroImageYValue: document.getElementById('mission-editor-hero-image-y-value'),
      heroImageScale: document.getElementById('mission-editor-hero-image-scale'),
      heroImageScaleValue: document.getElementById('mission-editor-hero-image-scale-value'),
      heroImageOpacity: document.getElementById('mission-editor-hero-image-opacity'),
      heroImageOpacityValue: document.getElementById('mission-editor-hero-image-opacity-value'),
      heroImageClarity: document.getElementById('mission-editor-hero-image-clarity'),
      heroImageClarityValue: document.getElementById('mission-editor-hero-image-clarity-value'),
      heroFadeStrength: document.getElementById('mission-editor-hero-fade-strength'),
      heroFadeStrengthValue: document.getElementById('mission-editor-hero-fade-strength-value'),
      heroFadeLeft: document.getElementById('mission-editor-hero-fade-left'),
      heroFadeLeftValue: document.getElementById('mission-editor-hero-fade-left-value'),
      heroFadeRight: document.getElementById('mission-editor-hero-fade-right'),
      heroFadeRightValue: document.getElementById('mission-editor-hero-fade-right-value'),
      headingFont: document.getElementById('mission-editor-heading-font'),
      bodyFont: document.getElementById('mission-editor-body-font'),
      heroTitleSize: document.getElementById('mission-editor-hero-title-size'),
      heroTitleSizeValue: document.getElementById('mission-editor-hero-title-size-value'),
      bodySize: document.getElementById('mission-editor-body-size'),
      bodySizeValue: document.getElementById('mission-editor-body-size-value'),
      heroBodyWidth: document.getElementById('mission-editor-hero-body-width'),
      heroBodyWidthValue: document.getElementById('mission-editor-hero-body-width-value'),
      heroTitleWidth: document.getElementById('mission-editor-hero-title-width'),
      heroTitleWidthValue: document.getElementById('mission-editor-hero-title-width-value'),
      heroTitleGap: document.getElementById('mission-editor-hero-title-gap'),
      heroTitleGapValue: document.getElementById('mission-editor-hero-title-gap-value'),
      heroBodyHeight: document.getElementById('mission-editor-hero-body-height'),
      heroBodyHeightValue: document.getElementById('mission-editor-hero-body-height-value'),
      sectionTitleSize: document.getElementById('mission-editor-section-title-size'),
      sectionTitleSizeValue: document.getElementById('mission-editor-section-title-size-value'),
      sectionCopySize: document.getElementById('mission-editor-section-copy-size'),
      sectionCopySizeValue: document.getElementById('mission-editor-section-copy-size-value'),
      sectionCopyWidth: document.getElementById('mission-editor-section-copy-width'),
      sectionCopyWidthValue: document.getElementById('mission-editor-section-copy-width-value'),
      sectionCopyHeight: document.getElementById('mission-editor-section-copy-height'),
      sectionCopyHeightValue: document.getElementById('mission-editor-section-copy-height-value'),
      cardTitleSize: document.getElementById('mission-editor-card-title-size'),
      cardTitleSizeValue: document.getElementById('mission-editor-card-title-size-value'),
      cardBodySize: document.getElementById('mission-editor-card-body-size'),
      cardBodySizeValue: document.getElementById('mission-editor-card-body-size-value'),
      cardFrontBoxWidth: document.getElementById('mission-editor-card-front-box-width'),
      cardFrontBoxWidthValue: document.getElementById('mission-editor-card-front-box-width-value'),
      cardFrontBoxHeight: document.getElementById('mission-editor-card-front-box-height'),
      cardFrontBoxHeightValue: document.getElementById('mission-editor-card-front-box-height-value'),
      cardBackBoxWidth: document.getElementById('mission-editor-card-back-box-width'),
      cardBackBoxWidthValue: document.getElementById('mission-editor-card-back-box-width-value'),
      cardBackBoxHeight: document.getElementById('mission-editor-card-back-box-height'),
      cardBackBoxHeightValue: document.getElementById('mission-editor-card-back-box-height-value'),
      buttonSize: document.getElementById('mission-editor-button-size'),
      buttonSizeValue: document.getElementById('mission-editor-button-size-value'),
      sectionVisibility: document.getElementById('mission-editor-section-visibility'),
      orderSectionSelect: document.getElementById('mission-editor-order-section-select'),
      orderSectionValue: document.getElementById('mission-editor-order-section-value'),
      cardSelect: document.getElementById('mission-editor-card-select'),
      cardMeta: document.getElementById('mission-editor-card-meta'),
      cardTitle: document.getElementById('mission-editor-card-title'),
      cardDescription: document.getElementById('mission-editor-card-description'),
      cardTitleSizeLocal: document.getElementById('mission-editor-card-title-size-local'),
      cardTitleSizeLocalValue: document.getElementById('mission-editor-card-title-size-local-value'),
      cardBodySizeLocal: document.getElementById('mission-editor-card-body-size-local'),
      cardBodySizeLocalValue: document.getElementById('mission-editor-card-body-size-local-value'),
      cardBackBodySizeLocal: document.getElementById('mission-editor-card-back-body-size-local'),
      cardBackBodySizeLocalValue: document.getElementById('mission-editor-card-back-body-size-local-value'),
      cardFrontBoxWidthLocal: document.getElementById('mission-editor-card-front-box-width-local'),
      cardFrontBoxWidthLocalValue: document.getElementById('mission-editor-card-front-box-width-local-value'),
      cardArtwork: document.getElementById('mission-editor-card-artwork'),
      cardArtworkPath: document.getElementById('mission-editor-card-artwork-path'),
      cardArtworkUpload: document.getElementById('mission-editor-card-artwork-upload'),
      cardArtworkUploadButton: document.getElementById('mission-editor-card-artwork-upload-button'),
      cardArtworkUploadStatus: document.getElementById('mission-editor-card-artwork-upload-status'),
      cardArtPosition: document.getElementById('mission-editor-card-art-position'),
      cardArtShiftX: document.getElementById('mission-editor-card-art-shift-x'),
      cardArtShiftXValue: document.getElementById('mission-editor-card-art-shift-x-value'),
      cardArtShiftY: document.getElementById('mission-editor-card-art-shift-y'),
      cardArtShiftYValue: document.getElementById('mission-editor-card-art-shift-y-value'),
      cardArtWidth: document.getElementById('mission-editor-card-art-width'),
      cardArtWidthValue: document.getElementById('mission-editor-card-art-width-value'),
      cardArtOpacity: document.getElementById('mission-editor-card-art-opacity'),
      cardArtOpacityValue: document.getElementById('mission-editor-card-art-opacity-value'),
      cardArtScale: document.getElementById('mission-editor-card-art-scale'),
      cardArtScaleValue: document.getElementById('mission-editor-card-art-scale-value'),
      cardArtFadeX: document.getElementById('mission-editor-card-art-fade-x'),
      cardArtFadeXValue: document.getElementById('mission-editor-card-art-fade-x-value'),
      cardArtFadeRight: document.getElementById('mission-editor-card-art-fade-right'),
      cardArtFadeRightValue: document.getElementById('mission-editor-card-art-fade-right-value'),
      cardArtFadeY: document.getElementById('mission-editor-card-art-fade-y'),
      cardArtFadeYValue: document.getElementById('mission-editor-card-art-fade-y-value'),
      cardBackTitle: document.getElementById('mission-editor-card-back-title'),
      cardBackDescription: document.getElementById('mission-editor-card-back-description'),
      cardButtonLabel: document.getElementById('mission-editor-card-button-label'),
      cardLinks: document.getElementById('mission-editor-card-links'),
      cardSection: document.getElementById('mission-editor-card-section'),
      cardOrder: document.getElementById('mission-editor-card-order'),
      cardVisible: document.getElementById('mission-editor-card-visible'),
      cardBackBg: document.getElementById('mission-editor-card-back-bg'),
      cardBackStrip: document.getElementById('mission-editor-card-back-strip'),
        cardBackTextColor: document.getElementById('mission-editor-card-back-text-color'),
        cardButtonBg: document.getElementById('mission-editor-card-button-bg'),
        cardButtonText: document.getElementById('mission-editor-card-button-text'),
        apply: document.getElementById('mission-editor-apply'),
        reset: document.getElementById('mission-editor-reset')
      };

    populateHeroImages();
    populateCardArtworkOptions();

    runtime.ui.tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var scope = tab.getAttribute('data-mission-editor-tab') || 'hero';
        var section = tab.getAttribute('data-mission-editor-section');
        runtime.activeEditorScope = scope;
        if (section) {
          runtime.activeSectionId = section;
          runtime.orderSectionId = section;
          ensureActiveCardForSection();
        }
        openEditor(scope);
        syncEditorFromState();
      });
    });

    if (window.attachPageEditorShellBehavior) {
      window.attachPageEditorShellBehavior({
        shell: runtime.ui.shell,
        toggle: runtime.ui.toggle,
        close: runtime.ui.close,
        header: runtime.ui.shell.querySelector('.page-editor-header'),
        onCloseRequest: closeEditor,
        ignoreOutsideSelector: '#panel-whoweare .offering-flip, #panel-whoweare .mission-section-head, #panel-whoweare .mission-bar'
      });
    }
    runtime.ui.toggle.addEventListener('click', function() {
      if (runtime.ui.shell.hasAttribute('hidden')) openEditor(runtime.activeEditorScope || 'hero');
      else closeEditor();
    });

    var heroCanvas = document.querySelector('#panel-whoweare .mission-bar');
    if (heroCanvas) {
      heroCanvas.addEventListener('click', function(event) {
        if (event.target.closest('#mission-editor-shell, #mission-editor-toggle')) return;
        selectHeroFromCanvas();
      });
    }

    bindLiveInput(runtime.ui.heroHeadline, function() {
      runtime.draftConfig.content.hero.headline = runtime.ui.heroHeadline.value;
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.heroBody, function() {
      runtime.draftConfig.content.hero.body = runtime.ui.heroBody.value;
      window.renderOfferings(runtime.baseOfferings);
    });
    runtime.ui.sectionSelect.addEventListener('change', function() {
      runtime.activeSectionId = runtime.ui.sectionSelect.value;
      runtime.orderSectionId = runtime.activeSectionId;
      if (runtime.activeEditorScope !== 'hero') runtime.activeEditorScope = 'section';
      ensureActiveCardForSection();
      syncEditorFromState();
    });
    bindLiveInput(runtime.ui.sectionTitle, function() {
      ensureSectionConfig(runtime.draftConfig, runtime.activeSectionId).title = runtime.ui.sectionTitle.value;
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.sectionCopy, function() {
      ensureSectionConfig(runtime.draftConfig, runtime.activeSectionId).copy = runtime.ui.sectionCopy.value;
      window.renderOfferings(runtime.baseOfferings);
    });
    [
      ['shellMax', 'shellMax'],
      ['gutter', 'gutter'],
      ['heroTextMax', 'heroTextMax'],
      ['heroMinHeight', 'heroMinHeight'],
      ['heroGap', 'heroGap'],
      ['heroOffsetY', 'heroOffsetY'],
      ['sectionSpacing', 'sectionSpacing'],
      ['cardGap', 'cardGap'],
      ['cardMinHeight', 'cardMinHeight']
    ].forEach(function(pair) {
      bindLiveInput(runtime.ui[pair[0]], function() {
        runtime.draftConfig.layout[pair[1]] = Number(runtime.ui[pair[0]].value);
        window.renderOfferings(runtime.baseOfferings);
      });
    });

    ['heroTextAlign', 'heroBalance', 'communityColumns', 'ministryColumns', 'publicColumns', 'heroImage', 'heroImagePosition', 'heroImageFit', 'headingFont', 'bodyFont'].forEach(function(key) {
      runtime.ui[key].addEventListener('change', function() {
        var map = {
          heroTextAlign: 'heroTextAlign',
          heroBalance: 'heroColumns',
          communityColumns: 'communityColumns',
          ministryColumns: 'ministryColumns',
          publicColumns: 'publicColumns'
        };
        if (key === 'heroImage') {
          runtime.draftConfig.visual.heroImage = runtime.ui.heroImage.value;
          runtime.ui.heroImagePath.value = normalizeAssetPath(runtime.ui.heroImage.value);
        }
        else if (key === 'heroImagePosition') {
          var preset = getAnchorPercent(runtime.ui.heroImagePosition.value);
          runtime.draftConfig.visual.heroImagePosition = runtime.ui.heroImagePosition.value;
          runtime.draftConfig.visual.heroImageX = preset.x;
          runtime.draftConfig.visual.heroImageY = preset.y;
        }
        else if (key === 'heroImageFit') runtime.draftConfig.visual.heroImageFit = runtime.ui.heroImageFit.value;
        else if (key === 'headingFont') runtime.draftConfig.typography.headingFont = runtime.ui.headingFont.value;
        else if (key === 'bodyFont') runtime.draftConfig.typography.bodyFont = runtime.ui.bodyFont.value;
        else runtime.draftConfig.layout[map[key]] = key.indexOf('Columns') !== -1 ? Number(runtime.ui[key].value) : runtime.ui[key].value;
        window.renderOfferings(runtime.baseOfferings);
      });
    });
    bindLiveInput(runtime.ui.heroImagePath, function() {
      var path = normalizeAssetPath(runtime.ui.heroImagePath.value);
      runtime.draftConfig.visual.heroImage = path ? '/' + path : '';
      setSelectValueWithCustomOption(runtime.ui.heroImage, runtime.draftConfig.visual.heroImage);
      window.renderOfferings(runtime.baseOfferings);
    });
    runtime.ui.heroImageUploadButton.addEventListener('click', async function() {
      var file = runtime.ui.heroImageUpload.files && runtime.ui.heroImageUpload.files[0];
      var pathError = getUploadPathError(runtime.ui.heroImagePath.value);
      var uploadPath = pathForUploadAssetFunction(runtime.ui.heroImagePath.value);
      if (!file || pathError) {
        runtime.ui.heroImageUploadStatus.textContent = !file ? 'Choose a file before uploading.' : pathError;
        return;
      }
      runtime.ui.heroImageUploadStatus.textContent = 'Uploading to Git...';
      try {
        var data = await uploadGitAsset(file, uploadPath);
        runtime.draftConfig.visual.heroImage = data.url || ('/assets/' + uploadPath);
        runtime.ui.heroImagePath.value = normalizeAssetPath(runtime.draftConfig.visual.heroImage);
        setSelectValueWithCustomOption(runtime.ui.heroImage, runtime.draftConfig.visual.heroImage, 'Uploaded Git asset');
        runtime.ui.heroImageUploadStatus.textContent = 'Uploaded: ' + runtime.draftConfig.visual.heroImage;
        window.renderOfferings(runtime.baseOfferings);
      } catch (err) {
        runtime.ui.heroImageUploadStatus.textContent = err.message || 'Upload failed';
      }
    });
    bindLiveInput(runtime.ui.heroImageX, function() {
      runtime.draftConfig.visual.heroImageX = Number(runtime.ui.heroImageX.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.heroImageY, function() {
      runtime.draftConfig.visual.heroImageY = Number(runtime.ui.heroImageY.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.heroImageScale, function() {
      runtime.draftConfig.visual.heroImageScale = Number(runtime.ui.heroImageScale.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.heroImageOpacity, function() {
      runtime.draftConfig.visual.heroImageOpacity = Number(runtime.ui.heroImageOpacity.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.heroImageClarity, function() {
      runtime.draftConfig.visual.heroImageClarity = Number(runtime.ui.heroImageClarity.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.heroFadeStrength, function() {
      var strength = Number(runtime.ui.heroFadeStrength.value);
      runtime.draftConfig.visual.heroFadeStrength = strength;
      runtime.draftConfig.visual.heroFadeLeft = clamp(strength * 55, 0, 50, 18);
      runtime.draftConfig.visual.heroFadeRight = clamp(strength * 40, 0, 50, 12);
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.heroFadeLeft, function() {
      runtime.draftConfig.visual.heroFadeLeft = Number(runtime.ui.heroFadeLeft.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.heroFadeRight, function() {
      runtime.draftConfig.visual.heroFadeRight = Number(runtime.ui.heroFadeRight.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    [
      ['heroTitleSize', 'heroTitleSize'],
      ['bodySize', 'bodySize'],
      ['heroBodyWidth', 'heroBodyWidth'],
      ['heroTitleWidth', 'heroTitleWidth'],
      ['heroTitleGap', 'heroTitleGap'],
      ['heroBodyHeight', 'heroBodyMinHeight'],
      ['sectionTitleSize', 'sectionTitleSize'],
      ['sectionCopySize', 'sectionCopySize'],
      ['sectionCopyWidth', 'sectionCopyWidth'],
      ['sectionCopyHeight', 'sectionCopyMinHeight'],
      ['cardTitleSize', 'cardTitleSize'],
      ['cardBodySize', 'cardBodySize'],
      ['cardFrontBoxWidth', 'cardFrontTextWidth'],
      ['cardFrontBoxHeight', 'cardFrontTextMinHeight'],
      ['cardBackBoxWidth', 'cardBackTextWidth'],
      ['cardBackBoxHeight', 'cardBackTextMinHeight'],
      ['buttonSize', 'buttonSize']
    ].forEach(function(pair) {
      bindLiveInput(runtime.ui[pair[0]], function() {
        runtime.draftConfig.typography[pair[1]] = Number(runtime.ui[pair[0]].value);
        window.renderOfferings(runtime.baseOfferings);
      });
    });
    runtime.ui.orderSectionSelect.addEventListener('change', function() {
      runtime.orderSectionId = runtime.ui.orderSectionSelect.value;
      runtime.activeSectionId = runtime.orderSectionId;
      if (runtime.activeEditorScope !== 'hero') runtime.activeEditorScope = 'section';
      syncEditorFromState();
    });
    runtime.ui.orderSectionValue.addEventListener('change', function() {
      ensureSectionConfig(runtime.draftConfig, runtime.orderSectionId).order = Number(runtime.ui.orderSectionValue.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    runtime.ui.cardSelect.addEventListener('change', function() {
      runtime.activeCardId = runtime.ui.cardSelect.value;
      runtime.activeCardPreviewFace = 'front';
      openEditor('section');
      syncEditorFromState();
    });
    runtime.ui.cardArtwork.addEventListener('change', function() {
      runtime.activeCardPreviewFace = 'front';
      var card = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
      card.frontGraphicUrl = runtime.ui.cardArtwork.value;
      runtime.ui.cardArtworkPath.value = normalizeAssetPath(runtime.ui.cardArtwork.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.cardArtworkPath, function() {
      runtime.activeCardPreviewFace = 'front';
      var path = normalizeAssetPath(runtime.ui.cardArtworkPath.value);
      var card = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
      card.frontGraphicUrl = path ? '/' + path : '';
      setSelectValueWithCustomOption(runtime.ui.cardArtwork, card.frontGraphicUrl);
      window.renderOfferings(runtime.baseOfferings);
    });
    runtime.ui.cardArtworkUploadButton.addEventListener('click', function() {
      var file = runtime.ui.cardArtworkUpload.files && runtime.ui.cardArtworkUpload.files[0];
      var pathError = getUploadPathError(runtime.ui.cardArtworkPath.value);
      var uploadPath = pathForUploadAssetFunction(runtime.ui.cardArtworkPath.value);
      if (!file || pathError) {
        runtime.ui.cardArtworkUploadStatus.textContent = !file ? 'Choose a file before uploading.' : pathError;
        return;
      }
      runtime.ui.cardArtworkUploadStatus.textContent = 'Uploading to Git...';
      uploadGitAsset(file, uploadPath)
        .then(function(data) {
          runtime.activeCardPreviewFace = 'front';
          var card = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
          card.frontGraphicUrl = data.url || ('/assets/' + uploadPath);
          runtime.ui.cardArtworkPath.value = normalizeAssetPath(card.frontGraphicUrl);
          setSelectValueWithCustomOption(runtime.ui.cardArtwork, card.frontGraphicUrl, 'Uploaded Git asset');
          runtime.ui.cardArtworkUploadStatus.textContent = 'Uploaded: ' + card.frontGraphicUrl;
          window.renderOfferings(runtime.baseOfferings);
        })
        .catch(function(err) {
          runtime.ui.cardArtworkUploadStatus.textContent = err.message || 'Upload failed';
        });
    });
    runtime.ui.cardArtPosition.addEventListener('change', function() {
      runtime.activeCardPreviewFace = 'front';
      var card = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
      card.frontGraphicPosition = runtime.ui.cardArtPosition.value;
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.cardArtOpacity, function() {
      runtime.activeCardPreviewFace = 'front';
      var card = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
      card.frontGraphicOpacity = Number(runtime.ui.cardArtOpacity.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.cardArtScale, function() {
      runtime.activeCardPreviewFace = 'front';
      var card = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
      card.frontGraphicScale = Number(runtime.ui.cardArtScale.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.cardArtWidth, function() {
      runtime.activeCardPreviewFace = 'front';
      var card = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
      card.frontGraphicWidth = Number(runtime.ui.cardArtWidth.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.cardArtFadeX, function() {
      runtime.activeCardPreviewFace = 'front';
      var card = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
      card.frontGraphicFadeLeft = Number(runtime.ui.cardArtFadeX.value);
      delete card.frontGraphicFadeX;
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.cardArtFadeRight, function() {
      runtime.activeCardPreviewFace = 'front';
      var card = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
      card.frontGraphicFadeRight = Number(runtime.ui.cardArtFadeRight.value);
      delete card.frontGraphicFadeX;
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.cardArtFadeY, function() {
      runtime.activeCardPreviewFace = 'front';
      var card = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
      card.frontGraphicFadeY = Number(runtime.ui.cardArtFadeY.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.cardTitleSizeLocal, function() {
      runtime.activeCardPreviewFace = 'front';
      var card = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
      card.frontTitleSize = Number(runtime.ui.cardTitleSizeLocal.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.cardBodySizeLocal, function() {
      runtime.activeCardPreviewFace = 'front';
      var card = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
      card.frontBodySize = Number(runtime.ui.cardBodySizeLocal.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.cardBackBodySizeLocal, function() {
      runtime.activeCardPreviewFace = 'back';
      var card = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
      card.backBodySize = Number(runtime.ui.cardBackBodySizeLocal.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.cardFrontBoxWidthLocal, function() {
      runtime.activeCardPreviewFace = 'front';
      var card = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
      card.frontTextWidth = Number(runtime.ui.cardFrontBoxWidthLocal.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.cardArtShiftX, function() {
      runtime.activeCardPreviewFace = 'front';
      var card = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
      card.frontGraphicShiftX = Number(runtime.ui.cardArtShiftX.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.cardArtShiftY, function() {
      runtime.activeCardPreviewFace = 'front';
      var card = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
      card.frontGraphicShiftY = Number(runtime.ui.cardArtShiftY.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.cardTitle, function() {
      runtime.activeCardPreviewFace = 'front';
      var card = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
      card.frontTitle = runtime.ui.cardTitle.value;
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.cardDescription, function() {
      runtime.activeCardPreviewFace = 'front';
      var card = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
      card.frontDescription = runtime.ui.cardDescription.value;
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.cardBackTitle, function() {
      runtime.activeCardPreviewFace = 'back';
      ensureCardConfig(runtime.draftConfig, runtime.activeCardId).backHeading = runtime.ui.cardBackTitle.value;
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.cardBackDescription, function() {
      runtime.activeCardPreviewFace = 'back';
      ensureCardConfig(runtime.draftConfig, runtime.activeCardId).backDescription = runtime.ui.cardBackDescription.value;
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.cardButtonLabel, function() {
      runtime.activeCardPreviewFace = 'back';
      ensureCardConfig(runtime.draftConfig, runtime.activeCardId).primaryActionLabel = runtime.ui.cardButtonLabel.value;
      window.renderOfferings(runtime.baseOfferings);
    });
    runtime.ui.cardSection.addEventListener('change', function() {
      runtime.activeCardPreviewFace = 'front';
      ensureCardConfig(runtime.draftConfig, runtime.activeCardId).section = runtime.ui.cardSection.value;
      runtime.activeSectionId = runtime.ui.cardSection.value;
      runtime.orderSectionId = runtime.ui.cardSection.value;
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.cardOrder, function() {
      runtime.activeCardPreviewFace = 'front';
      ensureCardConfig(runtime.draftConfig, runtime.activeCardId).order = Number(runtime.ui.cardOrder.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    runtime.ui.cardVisible.addEventListener('change', function() {
      runtime.activeCardPreviewFace = 'front';
      ensureCardConfig(runtime.draftConfig, runtime.activeCardId).visible = runtime.ui.cardVisible.checked;
      window.renderOfferings(runtime.baseOfferings);
    });
    [
      ['cardBackBg', 'backBackground'],
      ['cardBackStrip', 'backStripColor'],
      ['cardBackTextColor', 'backTextColor'],
      ['cardButtonBg', 'buttonColor'],
      ['cardButtonText', 'buttonTextColor']
    ].forEach(function(pair) {
      bindLiveInput(runtime.ui[pair[0]], function() {
        runtime.activeCardPreviewFace = 'back';
        ensureCardConfig(runtime.draftConfig, runtime.activeCardId)[pair[1]] = runtime.ui[pair[0]].value;
        window.renderOfferings(runtime.baseOfferings);
      });
    });
    runtime.ui.apply.addEventListener('click', function() {
      runtime.storedDraftConfig = deepClone(runtime.draftConfig);
      setStoredConfig(runtime.storedDraftConfig);
      runtime.baselineConfig = deepClone(runtime.draftConfig);
      notifySaved('Changes saved in browser');
    });
    runtime.ui.reset.addEventListener('click', async function() {
      var originalText = runtime.ui.reset.textContent;
      runtime.ui.reset.disabled = true;
      runtime.ui.reset.textContent = 'Loading...';
      updateStatus('Loading published version...');
      clearStoredConfig();
      runtime.storedDraftConfig = null;
      try {
        await reloadPublishedDraft();
        window.renderOfferings(runtime.baseOfferings);
        notifySaved('Reverted to published version');
      } finally {
        runtime.ui.reset.disabled = false;
        runtime.ui.reset.textContent = originalText;
      }
    });
    runtime.ui.restoreDraft.addEventListener('click', function() {
      if (!runtime.storedDraftConfig) return;
      restoreStoredDraft();
      window.renderOfferings(runtime.baseOfferings);
      notifySaved('Local draft restored');
    });
    runtime.ui.discardDraft.addEventListener('click', async function() {
      clearStoredConfig();
      runtime.storedDraftConfig = null;
      updateStatus('Loading published version...');
      await reloadPublishedDraft();
      window.renderOfferings(runtime.baseOfferings);
      notifySaved('Local draft discarded');
    });
      runtime.controlsReady = true;
      syncEditorFromState();
    }

  async function initializeMissionEditor(data) {
    var missionData = data || {};
    runtime.defaultConfig = deepClone(DEFAULT_CONFIG);
    if (missionData.pages && missionData.pages.mission) mergeDeep(runtime.defaultConfig, missionData.pages.mission);
    runtime.publishedConfig = await getPublishedConfig() || {};
    runtime.storedDraftConfig = getStoredConfig();
    loadPublishedDraft();
    runtime.baseOfferings = deepClone((missionData.offerings && missionData.offerings.length) ? missionData.offerings : (window.FALLBACK_OFFERINGS || []));
    window.renderOfferings(runtime.baseOfferings);
    initEditor();
    if (window.dashboardMarkConfigReady) window.dashboardMarkConfigReady('whoweare');
    else if (document.body) document.body.classList.remove('page-config-loading');
  }

  document.addEventListener('DOMContentLoaded', function() {
    fetch('content.json')
      .then(function(response) {
        if (!response.ok) throw new Error('fetch failed');
        return response.json();
      })
      .then(function(data) {
        initializeMissionEditor(data);
      })
      .catch(function() {
        initializeMissionEditor({ offerings: window.FALLBACK_OFFERINGS || [] });
      });
  });
})();

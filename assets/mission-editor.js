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
      heroImageScale: 100,
      heroImageOpacity: 0.25,
      heroFadeStrength: 0.74
    },
    typography: {
      headingFont: "'Montserrat', sans-serif",
      bodyFont: "'Montserrat', sans-serif",
      heroTitleSize: 3.75,
      bodySize: 1,
      heroBodyWidth: 620,
      heroBodyMinHeight: 0,
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
    { value: '/assets/Graphic Vignettes/graphic-3-reader-dog.png', label: 'Reader with dog' }
  ];

  var runtime = {
    baseOfferings: [],
    defaultConfig: null,
    publishedConfig: null,
    draftConfig: null,
    currentState: null,
    activeSectionId: 'community',
    orderSectionId: 'community',
    activeCardId: null,
    activeCardPreviewFace: 'front',
    ui: {},
    controlsReady: false
  };

  window.missionEditorRuntime = runtime;

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

  function computeOverlayGradient(strength) {
    var s = clamp(strength, 0.2, 0.98, 0.74);
    var stop1 = Math.min(0.99, s + 0.19);
    var stop2 = Math.min(0.96, s + 0.08);
    var stop3 = Math.min(0.86, s - 0.1);
    var stop4 = Math.max(0.22, s - 0.3);
    var stop5 = Math.max(0.04, s - 0.5);
    return 'linear-gradient(90deg, rgba(255,253,248,' + stop1.toFixed(2) + ') 0%, rgba(255,253,248,' + stop2.toFixed(2) + ') 18%, rgba(255,253,248,' + stop3.toFixed(2) + ') 38%, rgba(255,253,248,' + stop4.toFixed(2) + ') 58%, rgba(255,253,248,' + (stop4 * 0.55).toFixed(2) + ') 78%, rgba(255,253,248,' + stop5.toFixed(2) + ') 100%)';
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
      var card = deepClone(offering);
      card.section = overrides.section || (window.MISSION_SECTION_BUCKETS && window.MISSION_SECTION_BUCKETS[slug]) || 'ministry';
      card.visible = overrides.visible !== undefined ? overrides.visible !== false : offering.visible !== false;
      card.order = clamp(overrides.order, 1, 50, offering.order || idx + 1);
      card.frontTitle = overrides.frontTitle || offering.frontTitle || offering.title || '';
      card.frontDescription = overrides.frontDescription || offering.frontDescription || offering.tagline || offering.blurb || '';
      card.backHeading = overrides.backHeading || offering.backHeading || card.frontTitle;
      card.backDescription = overrides.backDescription || offering.backDescription || card.frontDescription;
      card.backBackground = overrides.backBackground || offering.backBackground || '';
      card.backStripColor = overrides.backStripColor || offering.backStripColor || '';
      card.backTextColor = overrides.backTextColor || offering.backTextColor || '';
      card.buttonColor = overrides.buttonColor || offering.buttonColor || '';
      card.buttonTextColor = overrides.buttonTextColor || offering.buttonTextColor || '';
      card.frontGraphicUrl = overrides.frontGraphicUrl || offering.frontGraphicUrl || offering.imageUrl || '';
      card.frontGraphicPosition = overrides.frontGraphicPosition || offering.frontGraphicPosition || '';
      card.frontGraphicOpacity = overrides.frontGraphicOpacity != null ? overrides.frontGraphicOpacity : (offering.frontGraphicOpacity != null ? offering.frontGraphicOpacity : null);
      card.frontGraphicScale = overrides.frontGraphicScale != null ? overrides.frontGraphicScale : (offering.frontGraphicScale != null ? offering.frontGraphicScale : null);
      if (overrides.actions && overrides.actions.length) {
        card.cardActions = deepClone(overrides.actions);
      }
      if (overrides.primaryActionLabel) {
        if (card.cardActions && card.cardActions[0]) card.cardActions[0].label = overrides.primaryActionLabel;
        else if (card.links && card.links[0]) card.links[0].label = overrides.primaryActionLabel;
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
    var heroTextMax = clamp(state.config.layout.heroTextMax, 420, 960, 700);
    var heroMinHeight = clamp(state.config.layout.heroMinHeight, 240, 520, 348);
    if (!panel) return;
    panel.style.setProperty('--mission-shell-max', clamp(state.config.layout.shellMax, 1280, 1880, 1680) + 'px');
    panel.style.setProperty('--mission-gutter', clamp(state.config.layout.gutter, 12, 72, 28) + 'px');
    panel.style.setProperty('--mission-section-gap', clamp(state.config.layout.heroGap, 8, 72, 24) + 'px');
    panel.style.setProperty('--mission-hero-min', heroMinHeight + 'px');
    panel.style.setProperty('--mission-hero-text-max', heroTextMax + 'px');
    panel.style.setProperty('--mission-hero-columns', state.config.layout.heroColumns || '1.05fr 0.95fr');
    panel.style.setProperty('--mission-hero-text-align', state.config.layout.heroTextAlign || 'left');
    panel.style.setProperty('--mission-card-gap', clamp(state.config.layout.cardGap, 8, 40, 20) + 'px');
    panel.style.setProperty('--mission-section-spacing', clamp(state.config.layout.sectionSpacing, 18, 84, 42) + 'px');
    panel.style.setProperty('--mission-card-min', clamp(state.config.layout.cardMinHeight, 220, 420, 320) + 'px');
    panel.style.setProperty('--mission-community-columns', clamp(state.config.layout.communityColumns, 1, 4, 2));
    panel.style.setProperty('--mission-ministry-columns', clamp(state.config.layout.ministryColumns, 1, 4, 3));
    panel.style.setProperty('--mission-public-columns', clamp(state.config.layout.publicColumns, 1, 4, 3));
    panel.style.setProperty('--mission-hero-image-url', 'url("' + (state.config.visual.heroImage || '/assets/Graphic_1.png') + '")');
    panel.style.setProperty('--mission-hero-image-position', state.config.visual.heroImagePosition || 'center right');
    panel.style.setProperty('--mission-hero-image-size', clamp(state.config.visual.heroImageScale, 70, 170, 100) + '% auto');
    panel.style.setProperty('--mission-hero-image-opacity', clamp(state.config.visual.heroImageOpacity, 0, 0.65, 0.25));
    panel.style.setProperty('--mission-hero-overlay-gradient', computeOverlayGradient(state.config.visual.heroFadeStrength));
    panel.style.setProperty('--mission-heading-font', state.config.typography.headingFont || "'Montserrat', sans-serif");
    panel.style.setProperty('--mission-body-font', state.config.typography.bodyFont || "'Montserrat', sans-serif");
    panel.style.setProperty('--mission-hero-title-size', clamp(state.config.typography.heroTitleSize, 2.2, 4.8, 3.75) + 'rem');
    panel.style.setProperty('--mission-body-size', clamp(state.config.typography.bodySize, 0.75, 1.3, 1) + 'rem');
    panel.style.setProperty('--mission-hero-body-width', clamp(state.config.typography.heroBodyWidth, 320, 860, 620) + 'px');
    panel.style.setProperty('--mission-hero-body-min-height', clamp(state.config.typography.heroBodyMinHeight, 0, 220, 0) + 'px');
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
      intro.style.height = heroMinHeight + 'px';
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
      flip.classList.toggle('is-edit-selected', runtime.activeCardId === slug);
      if (runtime.activeCardId === slug && runtime.activeCardPreviewFace === 'back' && useFlip) {
        flip.classList.add('is-flipped');
        flip.setAttribute('aria-expanded', 'true');
      }
      if (graphic && graphic.url) {
        flip.style.setProperty('--card-graphic', 'url("' + graphic.url + '")');
        flip.style.setProperty('--card-bg-pos', graphic.pos);
      }
      if (offering.frontGraphicUrl) flip.style.setProperty('--card-graphic', 'url("' + offering.frontGraphicUrl + '")');
      if (offering.frontGraphicPosition) flip.style.setProperty('--card-bg-pos', offering.frontGraphicPosition);
      if (offering.frontGraphicOpacity != null) flip.style.setProperty('--card-graphic-opacity', offering.frontGraphicOpacity);
      if (offering.frontGraphicScale != null) flip.style.setProperty('--card-graphic-scale', offering.frontGraphicScale);
      if (offering.backBackground) flip.style.setProperty('--mission-card-back-bg', offering.backBackground);
      if (offering.backStripColor) flip.style.setProperty('--mission-card-back-strip-bg', offering.backStripColor);
      if (offering.backTextColor) flip.style.setProperty('--mission-card-back-text', offering.backTextColor);
      if (offering.buttonColor) flip.style.setProperty('--mission-card-back-button-bg', offering.buttonColor);
      if (offering.buttonTextColor) flip.style.setProperty('--mission-card-back-button-text', offering.buttonTextColor);
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
          '<div class="card-back">' +
            '<div class="cb-strip">' + escapeHtml(backHeading) + '</div>' +
            '<div class="cb-body">' +
              '<div class="cb-hook">' + escapeHtml(backCopy) + '</div>' +
              '<div class="cb-icon">' + window.getIconSVG(offering.icon, '#c84826') + '</div>' +
              backLinksHtml +
            '</div>' +
          '</div>' +
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
    return JSON.stringify(runtime.draftConfig) !== JSON.stringify(runtime.publishedConfig);
  }

  function updateStatus(savedMessage) {
    if (!runtime.controlsReady) return;
    runtime.ui.status.textContent = savedMessage || (hasDraftChanges() ? 'Live draft preview active' : 'Saved browser version loaded');
    runtime.ui.status.classList.toggle('is-saved', !hasDraftChanges() || !!savedMessage);
  }

  function notifySaved(message) {
    updateStatus(message || 'Changes saved in browser');
    if (window.pageEditorShowToast) window.pageEditorShowToast(runtime.ui.shell, message || 'Changes saved in browser');
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
    setStoredConfig(runtime.publishedConfig);
      notifySaved('Published to main');
    }

    window.missionEditorBridge = {
      getDraftConfig: function() {
        return runtime.draftConfig ? deepClone(runtime.draftConfig) : null;
      },
      markPublished: function(message) {
        if (!runtime.draftConfig) return;
        runtime.publishedConfig = deepClone(runtime.draftConfig);
        setStoredConfig(runtime.publishedConfig);
        notifySaved(message || 'Published to main');
      }
    };

  function openEditor() {
    runtime.ui.shell.removeAttribute('hidden');
    runtime.ui.toggle.setAttribute('aria-expanded', 'true');
  }

  function closeEditor(forceDiscard) {
    if (!forceDiscard && hasDraftChanges()) {
      if (window.confirm('Save your Mission edits before closing? Click OK to save. Click Cancel for more options.')) {
        runtime.publishedConfig = deepClone(runtime.draftConfig);
        setStoredConfig(runtime.publishedConfig);
        notifySaved('Changes saved in browser');
      } else {
        if (!window.confirm('Discard unsaved Mission edits and close the editor?')) return false;
        runtime.draftConfig = deepClone(runtime.publishedConfig);
        window.renderOfferings(runtime.baseOfferings);
      }
    }
    runtime.ui.shell.setAttribute('hidden', '');
    runtime.ui.toggle.setAttribute('aria-expanded', 'false');
    return true;
  }

  function selectCardFromCanvas(cardId, face) {
    runtime.activeCardId = cardId;
    runtime.activeCardPreviewFace = face || 'front';
    if (runtime.controlsReady) {
      openEditor();
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
    runtime.currentState.cards.forEach(function(card, idx) {
      var slug = window.getOfferingSlug(card, idx);
      var option = document.createElement('option');
      option.value = slug;
      option.textContent = card.frontTitle || card.title || slug;
      runtime.ui.cardSelect.appendChild(option);
    });
    runtime.activeCardId = previous || (runtime.currentState.cards[0] ? window.getOfferingSlug(runtime.currentState.cards[0], 0) : null);
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
    var actions = card && card.cardActions && card.cardActions.length ? card.cardActions.slice(0, 3) : [];
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
        if (!cfg.actions || !cfg.actions.length) cfg.actions = deepClone(card.cardActions || []);
        if (!cfg.actions[index]) cfg.actions[index] = { label: '', url: '', type: 'resource', visible: true };
        cfg.actions[index].label = labelInput.value;
        window.renderOfferings(runtime.baseOfferings);
      });
      bindLiveInput(urlInput, function() {
        runtime.activeCardPreviewFace = 'back';
        var cfg = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
        if (!cfg.actions || !cfg.actions.length) cfg.actions = deepClone(card.cardActions || []);
        if (!cfg.actions[index]) cfg.actions[index] = { label: '', url: '', type: 'resource', visible: true };
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
    runtime.ui.sectionSpacingValue.textContent = formatPx(runtime.ui.sectionSpacing.value);
    runtime.ui.cardGapValue.textContent = formatPx(runtime.ui.cardGap.value);
    runtime.ui.cardMinHeightValue.textContent = formatPx(runtime.ui.cardMinHeight.value);
    runtime.ui.heroImageScaleValue.textContent = Math.round(Number(runtime.ui.heroImageScale.value) || 0) + '%';
    runtime.ui.heroImageOpacityValue.textContent = formatPercent(runtime.ui.heroImageOpacity.value);
    runtime.ui.heroFadeStrengthValue.textContent = formatPercent(runtime.ui.heroFadeStrength.value);
    runtime.ui.heroTitleSizeValue.textContent = Number(runtime.ui.heroTitleSize.value).toFixed(2) + 'rem';
    runtime.ui.bodySizeValue.textContent = Number(runtime.ui.bodySize.value).toFixed(2) + 'rem';
    runtime.ui.heroBodyWidthValue.textContent = formatPx(runtime.ui.heroBodyWidth.value);
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
    runtime.ui.communityCopy.value = (config.sections.community || {}).copy || '';
    runtime.ui.ministryCopy.value = (config.sections.ministry || {}).copy || '';
    runtime.ui.publicCopy.value = (config.sections.public || {}).copy || '';
    runtime.ui.shellMax.value = clamp(config.layout.shellMax, 1280, 1880, 1680);
    runtime.ui.gutter.value = clamp(config.layout.gutter, 12, 72, 28);
    runtime.ui.heroTextMax.value = clamp(config.layout.heroTextMax, 420, 960, 700);
    runtime.ui.heroMinHeight.value = clamp(config.layout.heroMinHeight, 240, 520, 348);
    runtime.ui.heroGap.value = clamp(config.layout.heroGap, 8, 72, 24);
    runtime.ui.sectionSpacing.value = clamp(config.layout.sectionSpacing, 18, 84, 42);
    runtime.ui.cardGap.value = clamp(config.layout.cardGap, 8, 40, 20);
    runtime.ui.cardMinHeight.value = clamp(config.layout.cardMinHeight, 220, 420, 320);
    runtime.ui.heroTextAlign.value = config.layout.heroTextAlign || 'left';
    runtime.ui.heroBalance.value = config.layout.heroColumns || '1.05fr 0.95fr';
    runtime.ui.communityColumns.value = String(clamp(config.layout.communityColumns, 1, 4, 2));
    runtime.ui.ministryColumns.value = String(clamp(config.layout.ministryColumns, 1, 4, 3));
    runtime.ui.publicColumns.value = String(clamp(config.layout.publicColumns, 1, 4, 3));
    runtime.ui.heroImage.value = config.visual.heroImage || '/assets/Graphic_1.png';
    runtime.ui.heroImagePosition.value = config.visual.heroImagePosition || 'center right';
    runtime.ui.heroImageScale.value = clamp(config.visual.heroImageScale, 70, 170, 100);
    runtime.ui.heroImageOpacity.value = clamp(config.visual.heroImageOpacity, 0, 0.65, 0.25);
    runtime.ui.heroFadeStrength.value = clamp(config.visual.heroFadeStrength, 0.2, 0.98, 0.74);
    runtime.ui.headingFont.value = config.typography.headingFont || "'Montserrat', sans-serif";
    runtime.ui.bodyFont.value = config.typography.bodyFont || "'Montserrat', sans-serif";
    runtime.ui.heroTitleSize.value = clamp(config.typography.heroTitleSize, 2.2, 4.8, 3.75);
    runtime.ui.bodySize.value = clamp(config.typography.bodySize, 0.75, 1.3, 1);
    runtime.ui.heroBodyWidth.value = clamp(config.typography.heroBodyWidth, 320, 860, 620);
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
      runtime.ui.cardArtwork.value = card.frontGraphicUrl || ((window.MISSION_CARD_GRAPHICS && window.MISSION_CARD_GRAPHICS[runtime.activeCardId] && window.MISSION_CARD_GRAPHICS[runtime.activeCardId].url) || CARD_ART_OPTIONS[0].value);
      runtime.ui.cardArtPosition.value = card.frontGraphicPosition || ((window.MISSION_CARD_GRAPHICS && window.MISSION_CARD_GRAPHICS[runtime.activeCardId] && window.MISSION_CARD_GRAPHICS[runtime.activeCardId].pos) || 'center right');
      runtime.ui.cardArtOpacity.value = card.frontGraphicOpacity != null ? card.frontGraphicOpacity : 0.9;
      runtime.ui.cardArtScale.value = card.frontGraphicScale != null ? card.frontGraphicScale : 1;
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
    updateStatus();
  }

  function bindLiveInput(element, handler) {
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
      heroHeadline: document.getElementById('mission-editor-hero-headline'),
      heroBody: document.getElementById('mission-editor-hero-body'),
      sectionSelect: document.getElementById('mission-editor-section-select'),
      sectionTitle: document.getElementById('mission-editor-section-title'),
      sectionCopy: document.getElementById('mission-editor-section-copy'),
      communityCopy: document.getElementById('mission-editor-community-copy'),
      ministryCopy: document.getElementById('mission-editor-ministry-copy'),
      publicCopy: document.getElementById('mission-editor-public-copy'),
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
      heroImagePosition: document.getElementById('mission-editor-hero-image-position'),
      heroImageScale: document.getElementById('mission-editor-hero-image-scale'),
      heroImageScaleValue: document.getElementById('mission-editor-hero-image-scale-value'),
      heroImageOpacity: document.getElementById('mission-editor-hero-image-opacity'),
      heroImageOpacityValue: document.getElementById('mission-editor-hero-image-opacity-value'),
      heroFadeStrength: document.getElementById('mission-editor-hero-fade-strength'),
      heroFadeStrengthValue: document.getElementById('mission-editor-hero-fade-strength-value'),
      headingFont: document.getElementById('mission-editor-heading-font'),
      bodyFont: document.getElementById('mission-editor-body-font'),
      heroTitleSize: document.getElementById('mission-editor-hero-title-size'),
      heroTitleSizeValue: document.getElementById('mission-editor-hero-title-size-value'),
      bodySize: document.getElementById('mission-editor-body-size'),
      bodySizeValue: document.getElementById('mission-editor-body-size-value'),
      heroBodyWidth: document.getElementById('mission-editor-hero-body-width'),
      heroBodyWidthValue: document.getElementById('mission-editor-hero-body-width-value'),
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
      cardArtwork: document.getElementById('mission-editor-card-artwork'),
      cardArtPosition: document.getElementById('mission-editor-card-art-position'),
      cardArtOpacity: document.getElementById('mission-editor-card-art-opacity'),
      cardArtOpacityValue: document.getElementById('mission-editor-card-art-opacity-value'),
      cardArtScale: document.getElementById('mission-editor-card-art-scale'),
      cardArtScaleValue: document.getElementById('mission-editor-card-art-scale-value'),
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

    if (window.attachPageEditorShellBehavior) {
      window.attachPageEditorShellBehavior({
        shell: runtime.ui.shell,
        toggle: runtime.ui.toggle,
        close: runtime.ui.close,
        header: runtime.ui.shell.querySelector('.page-editor-header'),
        onCloseRequest: closeEditor,
        ignoreOutsideSelector: '#panel-whoweare .offering-flip, #panel-whoweare .mission-section-head'
      });
    }
    runtime.ui.toggle.addEventListener('click', function() {
      if (runtime.ui.shell.hasAttribute('hidden')) openEditor();
      else closeEditor();
    });

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
      ['communityCopy', 'community'],
      ['ministryCopy', 'ministry'],
      ['publicCopy', 'public']
    ].forEach(function(pair) {
      bindLiveInput(runtime.ui[pair[0]], function() {
        ensureSectionConfig(runtime.draftConfig, pair[1]).copy = runtime.ui[pair[0]].value;
        window.renderOfferings(runtime.baseOfferings);
      });
    });

    [
      ['shellMax', 'shellMax'],
      ['gutter', 'gutter'],
      ['heroTextMax', 'heroTextMax'],
      ['heroMinHeight', 'heroMinHeight'],
      ['heroGap', 'heroGap'],
      ['sectionSpacing', 'sectionSpacing'],
      ['cardGap', 'cardGap'],
      ['cardMinHeight', 'cardMinHeight']
    ].forEach(function(pair) {
      bindLiveInput(runtime.ui[pair[0]], function() {
        runtime.draftConfig.layout[pair[1]] = Number(runtime.ui[pair[0]].value);
        window.renderOfferings(runtime.baseOfferings);
      });
    });

    ['heroTextAlign', 'heroBalance', 'communityColumns', 'ministryColumns', 'publicColumns', 'heroImage', 'heroImagePosition', 'headingFont', 'bodyFont'].forEach(function(key) {
      runtime.ui[key].addEventListener('change', function() {
        var map = {
          heroTextAlign: 'heroTextAlign',
          heroBalance: 'heroColumns',
          communityColumns: 'communityColumns',
          ministryColumns: 'ministryColumns',
          publicColumns: 'publicColumns'
        };
        if (key === 'heroImage') runtime.draftConfig.visual.heroImage = runtime.ui.heroImage.value;
        else if (key === 'heroImagePosition') runtime.draftConfig.visual.heroImagePosition = runtime.ui.heroImagePosition.value;
        else if (key === 'headingFont') runtime.draftConfig.typography.headingFont = runtime.ui.headingFont.value;
        else if (key === 'bodyFont') runtime.draftConfig.typography.bodyFont = runtime.ui.bodyFont.value;
        else runtime.draftConfig.layout[map[key]] = key.indexOf('Columns') !== -1 ? Number(runtime.ui[key].value) : runtime.ui[key].value;
        window.renderOfferings(runtime.baseOfferings);
      });
    });
    bindLiveInput(runtime.ui.heroImageScale, function() {
      runtime.draftConfig.visual.heroImageScale = Number(runtime.ui.heroImageScale.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.heroImageOpacity, function() {
      runtime.draftConfig.visual.heroImageOpacity = Number(runtime.ui.heroImageOpacity.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.heroFadeStrength, function() {
      runtime.draftConfig.visual.heroFadeStrength = Number(runtime.ui.heroFadeStrength.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    [
      ['heroTitleSize', 'heroTitleSize'],
      ['bodySize', 'bodySize'],
      ['heroBodyWidth', 'heroBodyWidth'],
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
      syncEditorFromState();
    });
    runtime.ui.orderSectionValue.addEventListener('change', function() {
      ensureSectionConfig(runtime.draftConfig, runtime.orderSectionId).order = Number(runtime.ui.orderSectionValue.value);
      window.renderOfferings(runtime.baseOfferings);
    });
    runtime.ui.cardSelect.addEventListener('change', function() {
      runtime.activeCardId = runtime.ui.cardSelect.value;
      runtime.activeCardPreviewFace = 'front';
      openEditor();
      syncEditorFromState();
    });
    runtime.ui.cardArtwork.addEventListener('change', function() {
      runtime.activeCardPreviewFace = 'front';
      var card = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
      card.frontGraphicUrl = runtime.ui.cardArtwork.value;
      window.renderOfferings(runtime.baseOfferings);
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
    bindLiveInput(runtime.ui.cardTitle, function() {
      runtime.activeCardPreviewFace = 'front';
      var card = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
      card.frontTitle = runtime.ui.cardTitle.value;
      card.backHeading = runtime.ui.cardTitle.value;
      window.renderOfferings(runtime.baseOfferings);
    });
    bindLiveInput(runtime.ui.cardDescription, function() {
      runtime.activeCardPreviewFace = 'front';
      var card = ensureCardConfig(runtime.draftConfig, runtime.activeCardId);
      card.frontDescription = runtime.ui.cardDescription.value;
      card.backDescription = runtime.ui.cardDescription.value;
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
      runtime.publishedConfig = deepClone(runtime.draftConfig);
      setStoredConfig(runtime.publishedConfig);
      notifySaved('Changes saved in browser');
    });
    runtime.ui.reset.addEventListener('click', function() {
      clearStoredConfig();
      runtime.publishedConfig = deepClone(runtime.defaultConfig);
      runtime.draftConfig = deepClone(runtime.defaultConfig);
      window.renderOfferings(runtime.baseOfferings);
      notifySaved('Reset to default preview');
    });
      runtime.controlsReady = true;
      syncEditorFromState();
    }

  async function initializeMissionEditor(data) {
    var missionData = data || {};
    runtime.defaultConfig = deepClone(DEFAULT_CONFIG);
    if (missionData.pages && missionData.pages.mission) mergeDeep(runtime.defaultConfig, missionData.pages.mission);
    runtime.publishedConfig = await getPublishedConfig() || {};
    runtime.draftConfig = getEffectiveConfig(runtime.publishedConfig);
    mergeDeep(runtime.draftConfig, getStoredConfig() || {});
    runtime.baseOfferings = deepClone((missionData.offerings && missionData.offerings.length) ? missionData.offerings : (window.FALLBACK_OFFERINGS || []));
    window.renderOfferings(runtime.baseOfferings);
    initEditor();
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

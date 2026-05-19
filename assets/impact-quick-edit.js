'use strict';
// ============================================================================
// Candler Impact – Quick Edit panel
// Section/card dropdown UI for per-card overrides. Loads after the main
// inline impact editor script and reuses impactEditorRuntime + ciRenderRows
// for live preview, impactSaveConfig + impactPublishConfig for persistence.
// ============================================================================

(function() {

  // ------------------------------------------------------------------ asset list
  // Curated Git-committed image paths surfaced in the picker. The text input
  // remains free-form so authors can paste any repo-relative path, but this
  // datalist gives quick autocomplete suggestions for common headshots.
  var ASSET_PATHS = [
    '/assets/student-headshots/Alley_Masocco.png',
    '/assets/student-headshots/David_Cross.png',
    '/assets/student-headshots/Hannah_Ford.jpg',
    '/assets/student-headshots/Larry_Varghese.png',
    '/assets/student-headshots/Megan_Fletcher.png',
    '/assets/student-headshots/Michael_Yorke.png',
    '/assets/student-headshots/Tammy_Edwards.JPG',
    '/assets/student-headshots/Taniecia_McFarlane.png',
    '/assets/alumni-headshots/Blair-Trygstad-Stowe.png',
    '/assets/alumni-headshots/Carmie-McDonald.png',
    '/assets/alumni-headshots/David-Lower.png',
    '/assets/alumni-headshots/Sergio-Chois.png',
    '/assets/faculty-staff-headshots/Anthony_Briggman.jpg',
    '/assets/faculty-staff-headshots/Bo_Adams.jpg',
    '/assets/faculty-staff-headshots/Brett_Opalinski.jpg',
    '/assets/faculty-staff-headshots/Danielle_Tummino-Hansen.jpg',
    '/assets/faculty-staff-headshots/Dean_Joanne_Solis_Walker.jpg',
    '/assets/faculty-staff-headshots/Dr._Amey_Victoria_Adkins-Jones.jpg',
    '/assets/faculty-staff-headshots/Dr._Craig_Ford.jpg',
    '/assets/faculty-staff-headshots/Dr._Deanna_Womack.png',
    '/assets/faculty-staff-headshots/Dr._Elizabeth_Arnold.jpg',
    '/assets/faculty-staff-headshots/Dr._Gregory_Wllison_II.jpg',
    '/assets/faculty-staff-headshots/Dr._Khalia_Williams.jpg',
    '/assets/faculty-staff-headshots/Dr._Musa_Dube.png',
    '/assets/faculty-staff-headshots/Dr._Nichole_Phillips.png',
    '/assets/faculty-staff-headshots/Dr._Noel_Erskine.jpg',
    '/assets/faculty-staff-headshots/Dr._Ryan_Bonfiglio.jpg',
    '/assets/faculty-staff-headshots/Dr._Susan_Hylen.png',
    '/assets/faculty-staff-headshots/Dr._Teresa_Fry_Brown.png',
    '/assets/faculty-staff-headshots/Gabrielle_Thomas.jpg',
    '/assets/faculty-staff-headshots/Ian_McFarland.jpg',
    '/assets/faculty-staff-headshots/Jennifer_Ayres.jpg',
    '/assets/faculty-staff-headshots/Jennifer_Quigley.jpg',
    '/assets/faculty-staff-headshots/Joel_Kemp.jpg',
    '/assets/faculty-staff-headshots/Lahronda_Little.jpg',
    '/assets/faculty-staff-headshots/Luke_Timothy_Johnson.jpg',
    '/assets/faculty-staff-headshots/Robert_Franklin.jpg',
    '/assets/faculty-staff-headshots/Roger_Nam.jpg',
    '/assets/faculty-staff-headshots/Sam_Martinez.png',
    '/assets/faculty-staff-headshots/Sarah_Bogue.jpg',
    '/assets/faculty-staff-headshots/The_Rev._Canon_John_Thompson-Quartey.jpg',
    '/assets/faculty-staff-headshots/Tony_Alonso.jpg',
    '/assets/student_photos/Master Class Student Talking 1.jpg',
    '/assets/student_photos/Master Class Student Talking 2.jpg',
    '/assets/student_photos/Master Class Student Talking 3.jpg',
    '/assets/student_photos/Master Class Student Talking 4.jpg',
    '/assets/student_photos/Master Class Student Talking 5.jpg',
    '/assets/student_photos/Master Class Student Talking 6.jpg',
    '/assets/student_photos/Master Class Student Talking 7.jpg',
    '/assets/student_photos/Master Class Student Talking 8.jpg'
  ];

  function ready(cb) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', cb);
    } else {
      cb();
    }
  }

  function $(id) { return document.getElementById(id); }

  function getRows() {
    return (typeof window.CI_STORY_PAGE !== 'undefined' && window.CI_STORY_PAGE && window.CI_STORY_PAGE.rows) ? window.CI_STORY_PAGE.rows : [];
  }

  function keyFor(rowId, idx) {
    return (typeof window.impactGetStoryKey === 'function')
      ? window.impactGetStoryKey(rowId, idx)
      : (rowId + ':' + idx);
  }

  function findRow(rowId) {
    return getRows().find(function(r) { return r.id === rowId; });
  }

  function getRT() { return window.impactEditorRuntime; }

  function ensureCardOverrides(key) {
    var rt = getRT();
    if (!rt || !rt.config) return null;
    if (!rt.config.cards) rt.config.cards = {};
    if (!rt.config.cards[key]) rt.config.cards[key] = {};
    return rt.config.cards[key];
  }

  function getHydrated() {
    var rt = getRT();
    var key = rt && rt.selectedCardKey;
    if (!key) return null;
    var match = (typeof window.impactFindStoryByKey === 'function') ? window.impactFindStoryByKey(key) : null;
    if (!match) return null;
    return (typeof window.impactHydrateStory === 'function') ? window.impactHydrateStory(match.row, match.story, key) : match.story;
  }

  function rerender() {
    if (typeof window.impactRenderAll === 'function') window.impactRenderAll();
    if (typeof window.impactRefreshSelectionState === 'function') window.impactRefreshSelectionState();
  }

  // ------------------------------------------------------------------ sanitize
  // Mirror of ciAllowEm on the renderer side: allow only safe inline tags.
  function sanitizeQuoteHtml(html) {
    var s = String(html == null ? '' : html);
    s = s.replace(/<!--[\s\S]*?-->/g, '');
    s = s.replace(/<\/(em|i|b|strong|u|span)\s*>/gi, function(_, t) { return '</' + t.toLowerCase() + '>'; });
    s = s.replace(/<(em|i|b|strong|u)(\s+[^>]*)?>/gi, function(_, t) { return '<' + t.toLowerCase() + '>'; });
    s = s.replace(/<br\s*\/?>/gi, '<br>');
    s = s.replace(/<span(\s+[^>]*)?>/gi, function(match, attrs) {
      if (!attrs) return '<span>';
      var styleMatch = /style\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
      if (!styleMatch) return '<span>';
      var raw = styleMatch[1] || styleMatch[2] || '';
      var colorMatch = /color\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-zA-Z]+)/i.exec(raw);
      if (!colorMatch) return '<span>';
      return '<span style="color:' + colorMatch[1] + '">';
    });
    // Strip any other tags
    s = s.replace(/<(?!\/?(?:em|i|b|strong|u|span|br)\b)[^>]*>/gi, '');
    return s;
  }

  // -------------------------------------------------------------------- population

  function populateAssetList() {
    var list = $('impact-quick-image-list');
    if (!list) return;
    if (list.childElementCount) return;
    ASSET_PATHS.forEach(function(p) {
      var opt = document.createElement('option');
      opt.value = p;
      list.appendChild(opt);
    });
  }

  function populateSections() {
    var sel = $('impact-quick-section');
    if (!sel) return;
    var rt = getRT();
    var rows = getRows();
    sel.innerHTML = '';
    rows.forEach(function(row) {
      var opt = document.createElement('option');
      opt.value = row.id;
      var rowOv = (rt.config && rt.config.rows && rt.config.rows[row.id]) || {};
      opt.textContent = (rowOv.label || row.label) + ' — ' + (rowOv.title || row.title);
      if (rt && row.id === rt.selectedRowId) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function populateCards() {
    var sel = $('impact-quick-card');
    if (!sel) return;
    var rt = getRT();
    var rowId = rt && rt.selectedRowId;
    sel.innerHTML = '';
    var row = findRow(rowId);
    if (!row) return;
    row.stories.forEach(function(story, idx) {
      var opt = document.createElement('option');
      var key = keyFor(rowId, idx);
      opt.value = key;
      var overrides = (rt.config && rt.config.cards && rt.config.cards[key]) || {};
      var name = overrides.name || story.name || ('Card ' + (idx + 1));
      opt.textContent = (idx + 1) + '. ' + name;
      if (rt && key === rt.selectedCardKey) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function setSlider(id, value, fmt) {
    var el = $(id);
    if (!el) return;
    el.value = value;
    var disp = $(id + '-value');
    if (disp) disp.textContent = fmt ? fmt(Number(value)) : String(value);
  }

  function pickField(overrides, hydrated, key, defaultValue) {
    if (overrides && overrides[key] !== undefined) return overrides[key];
    if (hydrated && hydrated[key] !== undefined) return hydrated[key];
    return defaultValue;
  }

  function populateFields() {
    var hydrated = getHydrated();
    if (!hydrated) return;
    var rt = getRT();
    var overrides = (rt.config && rt.config.cards && rt.config.cards[rt.selectedCardKey]) || {};

    // Text content — quote is rich HTML, name/role/headline are plain
    var rt_quote = $('impact-quick-quote-rt');
    if (rt_quote) {
      rt_quote.innerHTML = sanitizeQuoteHtml(pickField(overrides, hydrated, 'quote', ''));
    }
    if ($('impact-quick-name'))     $('impact-quick-name').value     = pickField(overrides, hydrated, 'name', '');
    if ($('impact-quick-role'))     $('impact-quick-role').value     = pickField(overrides, hydrated, 'role', '');
    if ($('impact-quick-headline')) $('impact-quick-headline').value = pickField(overrides, hydrated, 'headline', '');

    // Text styling
    setSlider('impact-quick-quote-size', pickField(overrides, hydrated, 'quoteSize', 1.18), function(x) { return x.toFixed(2) + 'rem'; });
    if ($('impact-quick-text-color')) $('impact-quick-text-color').value = pickField(overrides, hydrated, 'textColor', '#1e2530');
    if ($('impact-quick-card-bg'))    $('impact-quick-card-bg').value    = pickField(overrides, hydrated, 'cardBg', '#fafaf2');
    if ($('impact-quick-mark-color')) $('impact-quick-mark-color').value = pickField(overrides, hydrated, 'markColor', '#c84826');
    if ($('impact-quick-justify'))    $('impact-quick-justify').value    = pickField(overrides, hydrated, 'quoteJustify', 'center');
    if ($('impact-quick-align'))      $('impact-quick-align').value      = pickField(overrides, hydrated, 'quoteAlign', 'left');

    // Photo
    if ($('impact-quick-image')) $('impact-quick-image').value = pickField(overrides, hydrated, 'image', '') || '';
    if ($('impact-quick-photo-layer')) $('impact-quick-photo-layer').value = pickField(overrides, hydrated, 'photoLayer', 'behind');
    setSlider('impact-quick-photo-opacity',    pickField(overrides, hydrated, 'photoOpacity',    1),    function(x) { return x.toFixed(2); });
    setSlider('impact-quick-photo-saturation', pickField(overrides, hydrated, 'photoSaturation', 0.62), function(x) { return x.toFixed(2); });
    setSlider('impact-quick-photo-scale',      pickField(overrides, hydrated, 'photoScale',      100),  function(x) { return Math.round(x) + '%'; });
    setSlider('impact-quick-photo-feather',    pickField(overrides, hydrated, 'photoFeather',    0),    function(x) { return Math.round(x) + '%'; });
    setSlider('impact-quick-photo-x',          pickField(overrides, hydrated, 'photoX',          50),   function(x) { return Math.round(x) + '%'; });
    setSlider('impact-quick-photo-y',          pickField(overrides, hydrated, 'photoY',          100),  function(x) { return Math.round(x) + '%'; });
    setSlider('impact-quick-photo-overlap',    pickField(overrides, hydrated, 'photoOverlap',    0),    function(x) { return Math.round(x) + 'px'; });
  }

  // -------------------------------------------------------------------- commit

  function commit(field, value) {
    var rt = getRT();
    var key = rt && rt.selectedCardKey;
    if (!key) return;
    var overrides = ensureCardOverrides(key);
    if (!overrides) return;
    if (value === '' || value === null) delete overrides[field];
    else overrides[field] = value;
    rerender();
  }

  // ------------------------------------------------------------------- rich text

  function rtFocus() {
    var rt_quote = $('impact-quick-quote-rt');
    if (rt_quote) rt_quote.focus();
  }

  // Restore selection after a click on a toolbar button which would otherwise
  // collapse selection inside the contenteditable. We store the range whenever
  // the user selects text inside the editor.
  var savedRange = null;
  function captureSelection() {
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    var rt_quote = $('impact-quick-quote-rt');
    if (!rt_quote) return;
    var range = sel.getRangeAt(0);
    if (rt_quote.contains(range.commonAncestorContainer)) {
      savedRange = range.cloneRange();
    }
  }
  function restoreSelection() {
    if (!savedRange) return;
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
  }

  function commitQuoteFromEditor() {
    var rt_quote = $('impact-quick-quote-rt');
    if (!rt_quote) return;
    var html = sanitizeQuoteHtml(rt_quote.innerHTML);
    commit('quote', html);
  }

  function applyCommand(cmd, value) {
    rtFocus();
    restoreSelection();
    try { document.execCommand(cmd, false, value || null); } catch (e) {}
    captureSelection();
    commitQuoteFromEditor();
  }

  function applyColor(color) {
    rtFocus();
    restoreSelection();
    try {
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('foreColor', false, color);
    } catch (e) {}
    captureSelection();
    commitQuoteFromEditor();
  }

  function clearFormatting() {
    rtFocus();
    restoreSelection();
    try {
      document.execCommand('removeFormat');
      document.execCommand('unlink');
    } catch (e) {}
    captureSelection();
    commitQuoteFromEditor();
  }

  function handleRtPaste(e) {
    // Force plain-text paste so we don't inherit external styles
    e.preventDefault();
    var text = (e.clipboardData || window.clipboardData).getData('text/plain');
    try {
      document.execCommand('insertText', false, text);
    } catch (err) {
      var sel = window.getSelection();
      if (sel && sel.rangeCount) {
        var range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
      }
    }
    commitQuoteFromEditor();
  }

  // -------------------------------------------------------------------- card lifecycle

  function moveCard(dir) {
    var rt = getRT();
    var rowId = rt.selectedRowId;
    var key = rt.selectedCardKey;
    var row = findRow(rowId);
    if (!row) return;
    var idx = -1;
    for (var i = 0; i < row.stories.length; i++) {
      if (keyFor(rowId, i) === key) { idx = i; break; }
    }
    if (idx < 0) return;
    var newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= row.stories.length) return;

    // Swap stories in-memory
    var tmp = row.stories[idx];
    row.stories[idx] = row.stories[newIdx];
    row.stories[newIdx] = tmp;

    // Swap per-card overrides (keys are index-based)
    if (rt.config && rt.config.cards) {
      var keyA = keyFor(rowId, idx);
      var keyB = keyFor(rowId, newIdx);
      var ovA = rt.config.cards[keyA];
      var ovB = rt.config.cards[keyB];
      if (ovA !== undefined) rt.config.cards[keyB] = ovA; else delete rt.config.cards[keyB];
      if (ovB !== undefined) rt.config.cards[keyA] = ovB; else delete rt.config.cards[keyA];
    }

    rt.selectedCardKey = keyFor(rowId, newIdx);
    populateCards();
    populateFields();
    rerender();
  }

  function addCard() {
    var rt = getRT();
    var rowId = rt.selectedRowId;
    var row = findRow(rowId);
    if (!row) return;
    var newStory = {
      headline: 'New card headline',
      quote: 'New quote text — replace with your story.',
      support: '',
      name: 'New person',
      role: 'Title',
      image: '',
      imagePosition: 'center 30%',
      accent: '#c84826',
      surface: '#fffdf8',
      ink: '#1e2530',
      width: 'clamp(360px, 31vw, 440px)',
      quotePanelWidth: 54,
      quoteSize: 1.18
    };
    row.stories.push(newStory);
    rt.selectedCardKey = keyFor(rowId, row.stories.length - 1);
    populateCards();
    populateFields();
    rerender();
  }

  function deleteCard() {
    var rt = getRT();
    var rowId = rt.selectedRowId;
    var key = rt.selectedCardKey;
    var row = findRow(rowId);
    if (!row) return;
    if (row.stories.length <= 1) {
      window.alert('A section needs at least one card. Add another card before deleting this one.');
      return;
    }
    if (!window.confirm('Delete this card? This change is in your browser draft until you publish.')) return;
    var idx = -1;
    for (var i = 0; i < row.stories.length; i++) {
      if (keyFor(rowId, i) === key) { idx = i; break; }
    }
    if (idx < 0) return;
    row.stories.splice(idx, 1);
    if (rt.config && rt.config.cards) delete rt.config.cards[key];
    var newIdx = Math.max(0, idx - 1);
    rt.selectedCardKey = keyFor(rowId, newIdx);
    populateCards();
    populateFields();
    rerender();
  }

  // -------------------------------------------------------------------- binding

  function bindRange(id, field, fmt) {
    var el = $(id);
    if (!el) return;
    el.addEventListener('input', function(e) {
      var n = Number(e.target.value);
      var disp = $(id + '-value');
      if (disp) disp.textContent = fmt(n);
      commit(field, n);
    });
  }

  function bind() {
    var sectionSel = $('impact-quick-section');
    var cardSel = $('impact-quick-card');
    if (!sectionSel || !cardSel) return;

    sectionSel.addEventListener('change', function() {
      var rt = getRT();
      rt.selectedRowId = sectionSel.value;
      var row = findRow(rt.selectedRowId);
      if (row && row.stories[0]) rt.selectedCardKey = keyFor(row.id, 0);
      populateCards();
      populateFields();
      if (typeof window.impactRefreshSelectionState === 'function') window.impactRefreshSelectionState();
    });

    cardSel.addEventListener('change', function() {
      var rt = getRT();
      rt.selectedCardKey = cardSel.value;
      populateFields();
      if (typeof window.impactRefreshSelectionState === 'function') window.impactRefreshSelectionState();
    });

    // Rich text quote editor
    var rt_quote = $('impact-quick-quote-rt');
    if (rt_quote) {
      rt_quote.addEventListener('input', commitQuoteFromEditor);
      rt_quote.addEventListener('keyup', captureSelection);
      rt_quote.addEventListener('mouseup', captureSelection);
      rt_quote.addEventListener('paste', handleRtPaste);
      rt_quote.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + B / I shortcuts
        var mod = e.ctrlKey || e.metaKey;
        if (mod && (e.key === 'b' || e.key === 'B')) { e.preventDefault(); applyCommand('bold'); }
        if (mod && (e.key === 'i' || e.key === 'I')) { e.preventDefault(); applyCommand('italic'); }
      });
    }

    if ($('impact-quick-quote-bold'))   $('impact-quick-quote-bold').addEventListener('mousedown', function(e) { e.preventDefault(); applyCommand('bold'); });
    if ($('impact-quick-quote-italic')) $('impact-quick-quote-italic').addEventListener('mousedown', function(e) { e.preventDefault(); applyCommand('italic'); });
    if ($('impact-quick-quote-clear'))  $('impact-quick-quote-clear').addEventListener('mousedown', function(e) { e.preventDefault(); clearFormatting(); });
    if ($('impact-quick-quote-color'))  $('impact-quick-quote-color').addEventListener('input', function(e) { applyColor(e.target.value); });

    // Plain text fields
    if ($('impact-quick-name')) $('impact-quick-name').addEventListener('input', function(e) {
      commit('name', e.target.value);
      populateCards();
    });
    if ($('impact-quick-role')) $('impact-quick-role').addEventListener('input', function(e) { commit('role', e.target.value); });
    if ($('impact-quick-headline')) $('impact-quick-headline').addEventListener('input', function(e) { commit('headline', e.target.value); });

    // Text styling
    if ($('impact-quick-quote-size')) {
      $('impact-quick-quote-size').addEventListener('input', function(e) {
        var n = Number(e.target.value);
        if ($('impact-quick-quote-size-value')) $('impact-quick-quote-size-value').textContent = n.toFixed(2) + 'rem';
        commit('quoteSize', n);
      });
    }
    if ($('impact-quick-text-color')) $('impact-quick-text-color').addEventListener('input', function(e) { commit('textColor', e.target.value); });
    if ($('impact-quick-card-bg'))    $('impact-quick-card-bg').addEventListener('input', function(e) { commit('cardBg', e.target.value); });
    if ($('impact-quick-mark-color')) $('impact-quick-mark-color').addEventListener('input', function(e) { commit('markColor', e.target.value); });
    if ($('impact-quick-justify'))    $('impact-quick-justify').addEventListener('change', function(e) { commit('quoteJustify', e.target.value); });
    if ($('impact-quick-align'))      $('impact-quick-align').addEventListener('change', function(e) { commit('quoteAlign', e.target.value); });

    // Photo
    if ($('impact-quick-photo-layer')) $('impact-quick-photo-layer').addEventListener('change', function(e) { commit('photoLayer', e.target.value); });
    bindRange('impact-quick-photo-opacity',    'photoOpacity',    function(x) { return x.toFixed(2); });
    bindRange('impact-quick-photo-saturation', 'photoSaturation', function(x) { return x.toFixed(2); });
    bindRange('impact-quick-photo-scale',      'photoScale',      function(x) { return Math.round(x) + '%'; });
    bindRange('impact-quick-photo-feather',    'photoFeather',    function(x) { return Math.round(x) + '%'; });
    bindRange('impact-quick-photo-x',          'photoX',          function(x) { return Math.round(x) + '%'; });
    bindRange('impact-quick-photo-y',          'photoY',          function(x) { return Math.round(x) + '%'; });
    bindRange('impact-quick-photo-overlap',    'photoOverlap',    function(x) { return Math.round(x) + 'px'; });

    function applyImage() {
      var raw = ($('impact-quick-image') && $('impact-quick-image').value || '').trim();
      if (!raw) { commit('image', null); return; }
      var path = (raw.charAt(0) === '/' || /^https?:/i.test(raw)) ? raw : '/' + raw;
      commit('image', path);
    }
    if ($('impact-quick-image-apply')) $('impact-quick-image-apply').addEventListener('click', applyImage);
    if ($('impact-quick-image-clear')) $('impact-quick-image-clear').addEventListener('click', function() {
      if ($('impact-quick-image')) $('impact-quick-image').value = '';
      commit('image', null);
    });
    if ($('impact-quick-image')) {
      $('impact-quick-image').addEventListener('change', applyImage);
      $('impact-quick-image').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); applyImage(); }
      });
    }

    // Card lifecycle
    if ($('impact-quick-card-up'))     $('impact-quick-card-up').addEventListener('click', function() { moveCard(-1); });
    if ($('impact-quick-card-down'))   $('impact-quick-card-down').addEventListener('click', function() { moveCard(+1); });
    if ($('impact-quick-card-add'))    $('impact-quick-card-add').addEventListener('click', addCard);
    if ($('impact-quick-card-delete')) $('impact-quick-card-delete').addEventListener('click', deleteCard);
  }

  // Watch for selection changes that originate from clicking on the page
  // (the existing impact editor still uses click-to-select).
  function watchSelection() {
    var rt = getRT();
    var lastRow = rt && rt.selectedRowId;
    var lastKey = rt && rt.selectedCardKey;
    setInterval(function() {
      var r = getRT();
      if (!r) return;
      if (r.selectedRowId !== lastRow || r.selectedCardKey !== lastKey) {
        lastRow = r.selectedRowId;
        lastKey = r.selectedCardKey;
        var s = $('impact-quick-section');
        var c = $('impact-quick-card');
        if (s && r.selectedRowId) s.value = r.selectedRowId;
        populateCards();
        if (c && r.selectedCardKey) c.value = r.selectedCardKey;
        populateFields();
      }
    }, 500);
  }

  // -------------------------------------------------------------------- init

  function tryInit() {
    var rt = getRT();
    if (!rt || !rt.config) return false;
    if (!$('impact-quick-section')) return false;
    populateAssetList();
    populateSections();
    populateCards();
    populateFields();
    bind();
    watchSelection();
    console.log('[impact-quick-edit] initialized');
    return true;
  }

  ready(function() {
    if (tryInit()) return;
    // Poll until impactEditorRuntime.config is hydrated (some pages load it async)
    var tries = 0;
    var iv = setInterval(function() {
      tries++;
      if (tryInit()) { clearInterval(iv); return; }
      if (tries > 80) {
        clearInterval(iv);
        console.warn('[impact-quick-edit] gave up waiting for impact editor runtime');
      }
    }, 200);
  });

})();

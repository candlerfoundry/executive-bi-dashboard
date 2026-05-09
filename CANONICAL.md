# Executive BI Dashboard - CANONICAL.md
Last updated: 2026-05-09 (lookbook tilt/flat + editor cleanup)

## PURPOSE
This file documents fragile, frequently-broken implementations in the Executive BI dashboard.
Read this before every session. Verify these rules before committing.

---

## 1. CANDLER IMPACT - CURRENT PAGE MODEL
**Rule:** Candler Impact is no longer a faculty-circle grid or quote-banner sidebar page.
It is now a story-driven page with:
- a single hero banner
- three horizontally scrollable rows
- `Faculty & Staff Stories`
- `Student Stories`
- `Alumni Stories`

**Implementation:** Main markup, styling, and editor logic live in [index.html](C:/Users/esavant/Dropbox/Scripts/executive-bi-dashboard/index.html). Published defaults live in:
- [assets/page-config/candler-impact.json](C:/Users/esavant/Dropbox/Scripts/executive-bi-dashboard/assets/page-config/candler-impact.json)

**Regression risk:** Do not reintroduce the old faculty grid, faculty percentage sidebar, hover popouts, or the legacy quote banner.

---

## 2. CANDLER IMPACT - CARD SYSTEM
**Rule:** Candler Impact cards use a story-card system, not generic dashboard cards.
Front faces are built from editable panels. Typical card structure is:
- a quote panel
- a full-bleed portrait panel
- a name/title treatment anchored to the portrait side

Cards may vary in width and split ratio, but they should remain visually unified.
Internal divider lines, awkward L-shaped photo sections, and accidental nested borders are regressions.

**Design rules:**
- Quote text is short, editorial, and vertically centered.
- Portraits should read cleanly; name/title must not obscure the face.
- Default colors should stay within Foundry-aligned palettes unless a restrained accent is justified.
- Cards should feel like a coherent family, not a set of unrelated experiments.

**Regression risk:** Do not revert to placeholder-heavy cards, stacked caption boxes that break the silhouette, or noisy overlays/graphics by default.

---

## 3. CANDLER IMPACT - HERO
**Rule:** The hero is intentionally minimal.
- Use the Mission/Offerings-style background artwork treatment.
- The main headline is the primary content.
- Remove duplicate eyebrow/subtitle clutter unless explicitly requested.
- Do not add stat cards or pills back by default.

**Implementation:** Hero content and artwork settings are editor-controlled through the Candler Impact config and editor controls in [index.html](C:/Users/esavant/Dropbox/Scripts/executive-bi-dashboard/index.html).

**Regression risk:** Do not restore the oversized early hero, the side stats, or redundant “sample story” copy.

---

## 4. CANDLER IMPACT - NAV POSITION
**Rule:** `Candler Impact` sits second in the top navigation, immediately after `Our Mission & Offerings`.

**Regression risk:** Do not move it back to its older nav position unless explicitly requested.

---

## 5. HEADSHOT ASSETS
**Rule:** Repo-backed portraits must live in assets, not external temporary URLs, whenever we have approved local source images.

Current folders:
- Faculty and staff headshots: [assets/faculty-staff-headshots](C:/Users/esavant/Dropbox/Scripts/executive-bi-dashboard/assets/faculty-staff-headshots)
- Alumni headshots: [assets/alumni-headshots](C:/Users/esavant/Dropbox/Scripts/executive-bi-dashboard/assets/alumni-headshots)

**Regression risk:** Do not rely on browser-local uploads or temporary external image URLs for canonical content that should survive deploys.

---

## 6. MISSION + CANDLER EDITOR MODEL
**Rule:** Both `Our Mission & Offerings` and `Candler Impact` now use a live page editor model with:
- floating editor shell
- draggable position
- expandable sections
- click-to-select page content
- draft save
- explicit publish

The editor must remain usable while selecting cards/rows on the canvas.
Clicking a card to edit it should not count as “clicking outside” and should not force the editor to close.

**Implementation:**
- Shared shell helpers and Candler editor logic: [index.html](C:/Users/esavant/Dropbox/Scripts/executive-bi-dashboard/index.html)
- Mission editor logic: [assets/mission-editor.js](C:/Users/esavant/Dropbox/Scripts/executive-bi-dashboard/assets/mission-editor.js)

**Regression risk:** Do not reintroduce the workflow where clicking page content triggers an unsaved-close flow.

---

## 7. SAVE VS PUBLISH WORKFLOW
**Rule:** `Save Changes in Browser` and `Publish to Main` are intentionally separate.

Expected behavior:
- `Save Changes in Browser` updates the browser draft only
- no publish prompt should appear immediately after save
- `Publish to Main` is the final explicit action when editing is complete

**Why:** Editors need to save repeatedly while working without creating Git commits on every change.

**Regression risk:** Do not reintroduce a save flow that immediately asks whether to publish.

---

## 8. GIT-FIRST LOAD BEHAVIOR
**Rule:** Git-backed published content must be the default on page load.

Expected behavior:
- the page loads from the Git-backed JSON config first
- a browser-saved draft must not auto-apply on refresh
- if a local draft exists, show a visible notice in the editor
- the notice must provide `Restore Draft` and `Discard Draft`
- `Restore Draft` is the only action that should overlay browser-local draft content on top of the published config
- `Discard Draft` must clear localStorage and keep the Git-backed version visible

This behavior applies to:
- `Our Mission & Offerings`
- `Candler Impact`
- `Growth and Reach`
- `TheoEd`

**Why:** GitHub is the source of truth. Refreshing the page after publish should show the published state unless the editor user explicitly asks to restore a local draft.

**Regression risk:** Do not reintroduce auto-restore of localStorage drafts on page load.

---

## 9. PUBLISHED CONFIG SOURCE OF TRUTH
**Rule:** Published editor-managed page state now lives in Git-backed JSON files:
- [assets/page-config/mission-page.json](C:/Users/esavant/Dropbox/Scripts/executive-bi-dashboard/assets/page-config/mission-page.json)
- [assets/page-config/candler-impact.json](C:/Users/esavant/Dropbox/Scripts/executive-bi-dashboard/assets/page-config/candler-impact.json)
- [assets/page-config/growth-reach.json](C:/Users/esavant/Dropbox/Scripts/executive-bi-dashboard/assets/page-config/growth-reach.json)
- [assets/page-config/theoed.json](C:/Users/esavant/Dropbox/Scripts/executive-bi-dashboard/assets/page-config/theoed.json)

Browser drafts may still live in localStorage, but Git-tracked published state comes from the JSON files above.

**Regression risk:** Do not assume browser-local editor saves are automatically in Git. They are not unless published.

---

## 10. NETLIFY PUBLISH BRIDGE
**Rule:** Live publishing uses the Netlify function:
- [netlify/functions/publish-page-config.js](C:/Users/esavant/Dropbox/Scripts/executive-bi-dashboard/netlify/functions/publish-page-config.js)

It is limited to approved config paths and updates GitHub via contents API.
No-op publishes must return success, not failure, when the content is unchanged.

**Environment expectations:**
- `GITHUB_PAT`
- `GITHUB_REPO`
- `GITHUB_BRANCH`
- optional `CMS_SECRET`

**Approved config paths (`isAllowedPath`):** `mission-page.json`, `candler-impact.json`, `growth-reach.json`, `theoed.json`. All under `assets/page-config/`.

**Regression risk:** Do not let the publish function write arbitrary repo paths.

---

## 11. FOUNDING YEAR
**Rule:** The Candler Foundry was founded in 2018, not 2019.
All references to the founding year must use 2018.
TheoEd event years are not the founding year.

**Regression risk:** grep for `founding in 2019` before committing.

---

## 12. NO ITALICS
**Rule:** Global styling still avoids italic text treatments by default.
Do not introduce decorative italics unless explicitly requested.

---

## 13. GROWTH AND REACH - CANONICAL LAYOUT
**Rule:** Tab nav and panel id remain `numreach`. Tab button label: `Growth and Reach`. All `gr-` prefixed CSS classes.

**Hero banner** (`.gr-hero`): background-image `url('/assets/Graphic_2.png')`, background-size cover, min-height 240px. Dark overlay `.gr-hero-overlay` rgba(26,37,48,0.72). Title 36px 700 white letter-spacing -0.5px. Subtitle 17px 400 white max-width 700px line-height 1.7. No eyebrow label.

**Row 1 - Journey Timeline** (`.gr-timeline-row`): navy (`#1e2530`) background, padding 48px 60px. Eyebrow `.gr-eyebrow` orange 12px uppercase letter-spacing 2.5px. Title `.gr-row-title` cream 22px 700. Horizontal timeline with 5 nodes.

**Row 2 - Stats + Map** (`.gr-stats-map-row`): cream (`#fafaf2`) background, padding 48px 60px, flex, gap 40px.
- Left col (`.gr-stats-col`, about 40%): 3x3 stat grid
- Right col (`.gr-map-col`, about 60%): path-based SVG USA map

**Row 3 - Denom + Cities** (`.gr-denom-cities-row`): navy background, padding 48px 60px, flex, gap 40px.

**JS functions:** `initNumbers()` runs animations and map behavior. `buildMap()` and `initReach()` remain stubs.

**Regression risk:** Do not reintroduce the retired `.nr-block` / `.numreach-grid` layout. Do not replace the SVG map with CSS tile blocks.

---

## 13. MINIMUM TEXT SIZE RULE
**Rule:**
- Body / supporting text: minimum 15px, target 16-17px
- Stat sublabels and data captions: minimum 14px
- Card subtitle text: minimum 14px
- Section eyebrow labels: 12px minimum
- No font-size below 12px anywhere in the dashboard

**Why:** Prior sessions introduced illegible 9-11px copy.

**Regression risk:** Audit new CSS before committing.

---

## 14. GROWTH AND REACH - CANONICAL DATA
**Rule:** Use only these numbers. Do not revive retired counts such as `2,815`.

Unique individual learners: `4,200`
Total registrations: `6,200+`
Church partners: `74`
Courses offered: `150`
TheoEd talks: `50+`
TheoEd events hosted: `14`
Social followers: `~6,500`
Email subscribers: `~6,000`
Years of Impact: dynamic (`new Date().getFullYear() - 2018`)

Denomination breakdown:
- Methodist / UMC: 35%
- Presbyterian: 22%
- Episcopal / Anglican: 14%
- Baptist: 12%
- Interdenominational: 10%
- Other / Unknown: 7%

Cities:
- Atlanta GA: 680+
- Nashville TN: 140+
- Orlando FL: 95+
- Charlotte NC: 80+
- Austin TX: 75+
- Knoxville TN: 60+
- Macon GA: 55+
- Birmingham AL: 45+

Timeline milestones:
- 2018: The Candler Foundry established at Emory University
- 2020: Online courses launched; first Candler in Conversation podcast
- 2022: 500th participant milestone reached
- 2024: 2,000th participant milestone; TheoEd expands to 8 cities
- 2025: On-Demand courses and Sunday School Simplified launched

---

## 15. GROWTH AND REACH - SVG MAP SPEC
**Rule:** The US map must remain an SVG `<path>`-based Albers USA projection.
- viewBox: `0 0 960 600`
- all 50 states + DC
- hover tooltip follows cursor
- legend remains below map

Heat tiers:
- Tier 0: `#c8d0d8`
- Tier 1: `#e8a898`
- Tier 2: `#d4705a`
- Tier 3: `#c84826`
- Tier 4: `#8b2800`

**Regression risk:** Do not replace the path map with a tile approximation.

---

## 16. THEOED - DISCUSSION GUIDE ASSETS AND VIEWER
**Rule:** TheoEd discussion guide PDFs are Git-tracked static assets. Each featured card on the TheoEd page can surface its own guide from the pop-out viewer.

**Asset location:** All discussion guide PDFs live in [assets/theoed/discussion-guides/](C:/Users/esavant/Dropbox/Scripts/executive-bi-dashboard/assets/theoed/discussion-guides).

**Filename convention:** `THEO-<id>-<kebab-slug>-discussion-guide.pdf`. The `THEO-<id>` prefix matches the Airtable record id in *3MB, Unstuck, TheoEd* (TheoEd Archive view), so guides remain resolvable even if the talk title is rewritten. Spaces and punctuation are collapsed to hyphens, lowercased, and the trailing author suffix from the source file is dropped for brevity.

**Upstream sources (read-only):**
- Dropbox: `C:\Users\esavant\Dropbox\TheoEd\<Event Folder>\<THEO-id - Speaker Title>\<... - Discussion Guide.pdf>`
- Airtable: base *3MB, Unstuck, TheoEd*, table *TheoEd*, view *TheoEd Archive*, field **Discussion Guide**.

Dropbox is the faster source; use it for bulk sync into the repo. Airtable is authoritative for metadata but slower to fetch PDFs.

**Card data structure:** The 9 featured cards are defined in [assets/page-config/theoed.json](C:/Users/esavant/Dropbox/Scripts/executive-bi-dashboard/assets/page-config/theoed.json) under `speakers[]`, with a legacy fallback `THEOED_SPEAKERS` array in [index.html](C:/Users/esavant/Dropbox/Scripts/executive-bi-dashboard/index.html). Each speaker entry has a `guide` string field holding the relative path to the PDF, e.g. `"guide": "assets/theoed/discussion-guides/THEO-168-...-discussion-guide.pdf"`. An empty string or missing `guide` marks the card as having no guide yet. The TheoEd editor reads and writes this field (see section 21).

**Viewer behavior:** The pop-out/lightbox (`#te-lightbox`) renders a banner below the video with id `#te-lb-guide`, which has three states via its `data-state` attribute:
- `has-guide` → shows the `Download Discussion Guide` button (`#te-lb-guide-link`) pointing at the card's `guide` path.
- `empty` → hides both the link and the fallback copy. This is the default/reset state while the lightbox is closed AND the state `openLightbox()` uses when a card has no guide (per the missing-guide policy below).
- `missing` → legacy state from the prior viewer. CSS still hides the link in this state; `.te-lb-guide-missing` copy is also hidden under `state="empty"`. `openLightbox()` no longer sets `missing`, but it is preserved so older published pages still behave cleanly.

`openLightbox(vid, name, loc, guide)` sets the href and the state; `closeLightbox()` resets it to `empty` so stale data does not flash between opens.

**Missing-guide policy:** Talks without a guide (empty or missing `guide` field) must hide/omit the guide link cleanly in the pop-out viewer. No visible fallback banner should appear for guide-less talks. Enforced by `openLightbox()` setting `data-state="empty"` when `guide` is blank, and CSS hiding both `.te-lb-guide-link` and `.te-lb-guide-missing` under that state.

**Exact label text:** The button label must read `Download Discussion Guide` — do not shorten, recolor without design input, or rename. The label lives as plain text inside `.te-lb-guide-label` with an arrow glyph in `.te-lb-guide-icon`.

**Scope:** The bottom *Event Archive* accordion (`events[]` in theoed.json) intentionally does **not** yet carry per-talk guide fields. Do not add them without an explicit request. All 51 guides are in the repo for future use.

**Missing / unresolved mappings (as of 2026-04-22):**
- Austin 2023 → *Rev. Dr. Jose Irizarry, "The World We Can See"* has no discussion guide PDF in Dropbox or Airtable. If one becomes available, add it to `assets/theoed/discussion-guides/` using the `THEO-<id>-...-discussion-guide.pdf` convention.
- PDFs present in the repo that do **not** currently map to a featured/event talk: Greg Ellison (THEO-212, ATL 2017), Shawn Duncan (THEO-191, ATL 2020 Winter), and the three *Offstage Talks* — Roger Nam (THEO-172), Whitney Arreche (THEO-194), Dante Stewart (THEO-200). These are staged for later inclusion when the event archive or offstage talks list is expanded.

**Regression risk:** Do not reintroduce external URLs (e.g. theoed.com) for the per-card guide link — the dashboard is the source of truth for these PDFs. Do not relocate the `assets/theoed/discussion-guides/` folder without updating every `guide` path and this canonical entry.

---

## 17. GIT / EDITOR WORKFLOW
**Rule:** `main` is shared between this repo and the live Netlify editor. The editor can push copy and content edits directly to GitHub `main`, so the local repo may be stale even when it looks recently used.

**Before any local coding session:**
```
git pull origin main
git status
```

**Before pushing local work:**
```
git pull --rebase origin main
git push origin main
```

**Hard rules:**
- Never force-push to `main`.
- Always preserve editor-published copy changes. If a local edit would overwrite editor content, rebase and reconcile before pushing.

**Regression risk:** Force-pushing or pushing without rebasing can silently discard copy edits that the Netlify editor wrote straight to `main`.

---

## 18. LOCAL PREVIEW WORKFLOW
**Rule:** Preview the dashboard locally with Python's built-in static server from the repo root.

```
python -m http.server 4177
```

Open: `http://127.0.0.1:4177/index.html`

**Note:** Localhost URLs only work on the machine running the server. Do not share them as shipping links or paste them into published content.

---

## 19. EDITOR BEHAVIOR TO PRESERVE
**Rule:** The save / publish model documented in sections 7-9 must remain intact for `Our Mission & Offerings`, `Candler Impact`, `Growth and Reach`, and `TheoEd`.

- Git-backed content loads by default on refresh.
- Browser-saved drafts must not auto-override Git-backed content.
- If a local draft exists, surface visible `Restore Draft` and `Discard Draft` controls.
- `Save Changes in Browser` writes only to the local draft (localStorage).
- `Publish to Main` pushes the approved edit to GitHub `main` and clears the local draft.

**Regression risk:** Do not reintroduce auto-restore of localStorage drafts on load, and do not collapse Save and Publish into a single action.

---

## 20. SESSION GUARDRAILS
**Rule:** Keep every change scoped to the dashboard section that was requested.

- Do not touch unrelated tabs, pages, or editors unless absolutely necessary to complete the requested change.
- Do not commit temporary working files, including:
  - `.codex-review/`
  - `test-results/`
  - temporary screenshots
- Do not commit unrelated generated assets unless explicitly asked.

**Regression risk:** Out-of-scope edits and accidental commits of local working files are the most common source of editor/dev conflicts on `main`.

---

## 21. THEOED EDITOR
**Rule:** TheoEd has its own in-browser editor that follows the same durable save/publish workflow as Mission, Candler Impact, and Growth and Reach.

**Where editable data lives:**
- Published/Git-backed state: [assets/page-config/theoed.json](C:/Users/esavant/Dropbox/Scripts/executive-bi-dashboard/assets/page-config/theoed.json)
- Browser draft key: `executive-bi-dashboard.pageConfig.theoed.v1` in `localStorage`
- Built-in defaults/fallback: `THEOED_EDITOR_DEFAULTS` in [index.html](C:/Users/esavant/Dropbox/Scripts/executive-bi-dashboard/index.html), which wraps the legacy `THEOED_SPEAKERS` / `THEOED_EVENTS` consts so the page still renders if the JSON fetch fails.

**Config shape (theoed.json):**
- `hero.{logoImage, logoAlt, description, backgroundImage, stats[{number, label}]}`
- `archive.title`
- `speakers[{name, loc, photo, imgPos, imgScale, vid, quote, guide}]` — the 9 featured cards
- `events[{city, year, label, grad, talks[{s, t, u}]}]` — the Event Archive accordion

**Hero collage (added 2026-04-24):** The hero now supports a three-photo collage — one center portrait plus one left and one right accent photo. Each slot is an editable object in `hero` with these fields:
- `centerImage`: `{ photo, posX, posY, scale, opacity }` where `scale` is width-based (default 62 = 62% of banner width, matching the prior single-image hero).
- `leftAccent`, `rightAccent`: `{ photo, posX, posY, scale, opacity, width, feather }`. `width` is the slot width as % of banner (default 32). `scale` is height-based (default 110 = height 110% of slot). `feather` is the edge softness (0 = hard edge, 100 = heavily feathered); the slider maps onto the solid/fade stops of a radial mask anchored at the outer edge of the slot.
- Leave an accent's `photo` blank to hide that accent cleanly — no broken-image placeholder.
- CSS driven by custom properties on `#te-hero`: `--te-hero-center-*`, `--te-accent-left-*`, `--te-accent-right-*` (`-img`, `-pos`, `-size`, `-opacity`, `-width`, `-solid`, `-mid`). Mask is `radial-gradient(ellipse 120% 130% at 0%|100% 50%, #000 0%, #000 var(--*-solid), rgba(0,0,0,0.4) var(--*-mid), transparent 100%)`.
- The horizontal overlay gradient was softened so the accents are actually visible: edges are now `rgba(11,15,24,0.55)` at the outer edge instead of `0.96`. The vertical gradient (top-to-bottom darkening) is unchanged so stat text stays legible.

**Reset-to-Published semantics (changed 2026-04-24):** The editor’s reset button was renamed from `Reset to Default` to `Revert to Published` and now re-loads the Git-published `theoed.json` (plus built-in defaults) into runtime state. It no longer copies the legacy `THEOED_SPEAKERS`/`THEOED_EVENTS` in-code fallback. It does not clear the local browser draft — use `Discard Draft` for that.

**Featured-card image sliders:** The horizontal position, vertical position, and zoom inputs for each featured card are sliders (not text boxes). The underlying data shape remains `imgPos: "X% Y%"` and `imgScale: "1.xx"` so it stays compatible with the rendered tile.

**Featured speakers update (2026-04-24):**
- Replaced `The Rt. Rev. Robert Wright` with `Rev. Dr. Otis Moss III` (Charlotte 2022, video `6xuZ8T1ERaw`, guide `THEO-197`).
- Replaced `Austin Channing Brown` with `Cole Arthur Riley` (Macon 2024, video `UdjfTkpk6Lg`, guide `THEO-174`).
- Photos in repo: `assets/theoed_photos/Otis Moss III.jpg`, `assets/theoed_photos/Cole Arthur Riley.jpg`. Source metadata pulled from Airtable base *Candler Foundry: Master CRM*, table `3MB, UNST, TheoEd, OND`, view `TheoEd Archive`, field `Speaker Photos`.


**Editor UI (inside `#panel-theoed`):**
- Toggle button `#theoed-editor-toggle` ("Edit TheoEd") in the top-right of the panel.
- Floating `<aside id="theoed-editor-shell">` with three tabs:
  - **Page** — hero description, logo image/alt, background image, hero stats (add/remove/edit), archive heading.
  - **Featured Cards** — pick card via `<select>`, edit speaker name / location / quote / photo / imgPos / imgScale / YouTube video id / discussion guide URL. Move Up / Down / Remove / Add New Card.
  - **Event Archive** — pick event via `<select>`, edit city / year / label / gradient; talks list with per-row Speaker / Title / URL plus Up/Down/Remove; add talks; add/remove/move events.
- Status pill, `Restore Draft` / `Discard Draft` notice, `Reset to Default`, `Save Changes in Browser`.

**Workflow (mirrors sections 7-9, 19):**
- Git-backed `theoed.json` is the source of truth on page load.
- A browser draft (in `localStorage`) must NOT auto-apply; if present, the draft-notice surfaces `Restore Draft` / `Discard Draft`.
- `Save Changes in Browser` writes only to `localStorage`, does not prompt to publish.
- `Publish to Main` (global top-right button) calls the Netlify function and, on success, `theoedEditorBridge.markPublished()` clears the local draft so the Git-backed version becomes the default again.
- `Reset to Default` re-renders from `THEOED_EDITOR_DEFAULTS` only; it does NOT clear `localStorage` (a confirm explains this).

**Live render contract:**
- `theoedApplyConfig(config)` rerenders the hero, the 3×3 speaker grid, and the event archive from the current config on every edit.
- `openLightbox()` still wires `sp.vid`, `sp.name`, `sp.loc`, and `sp.guide` into the pop-out viewer; no per-card viewer state lives outside the config.

**Discussion guide handling in the editor:**
- Each speaker has a `guide` string editable as plain text. Leave blank to mark a card as having no guide.
- Blank `guide` → lightbox opens with `data-state="empty"`, which hides the button and the fallback banner. No broken-looking control is ever shown (section 16).
- Filled `guide` → lightbox opens with `data-state="has-guide"` and the exact label "Download Discussion Guide".

**Publish bridge:** `window.theoedEditorBridge.getDraftConfig()` feeds `window.publishDashboardEdits()`, which appends `{path: 'assets/page-config/theoed.json', content: …}` to the `files` array sent to the Netlify `publish-page-config` function. The function's allowlist was extended to accept this path (see [netlify/functions/publish-page-config.js](C:/Users/esavant/Dropbox/Scripts/executive-bi-dashboard/netlify/functions/publish-page-config.js) `isAllowedPath`).

**Files future coding assistants should avoid touching without explicit request:**
- The other editors (Mission / Candler Impact / Growth and Reach) and their configs.
- The event archive accordion CSS, the featured speaker tile CSS, and the lightbox CSS — donor-facing polish lives there.
- The discussion guide PDF filenames in `assets/theoed/discussion-guides/` (the `THEO-<id>` convention is the stable identifier; see section 16).
- The shared `window.pageEditor*` helpers (`pageEditorShowToast`, `pageEditorFetchJson`, `pageEditorPublishConfig`, `attachPageEditorShellBehavior`) — modify only with good reason.

**Testing notes:**
- Preview: `python -m http.server 4177` from the repo root, then visit `http://127.0.0.1:4177/index.html`.
- An automated Playwright test lives alongside dev outputs during sessions (e.g. `outputs/test_theoed.py`) and maps each check to the 19-item test list used for this feature. Re-run after any TheoEd or shared-editor change.
- Refresh-behavior test: save a draft, reload the page, and confirm the grid still shows Git-backed content (`Suzanne Stabile` in slot 1) rather than the edited draft, with the draft notice visible inside the editor.

**Regression risk:**
- Do not reintroduce any auto-restore of the TheoEd localStorage draft on page load.
- Do not collapse `Save Changes in Browser` and `Publish to Main` into a single action.
- Do not hard-code TheoEd copy back into `index.html` except as fallback defaults — the JSON config is the editable source of truth.
- Do not restore the visible "Discussion guide not yet available for this talk. Please provide one to add it here." fallback banner for guide-less talks.

---


## 23. LOOKBOOK BACK LAYOUT
**Rule:** Mission cards can opt into an editorial "lookbook" back layout instead of the standard navy/orange `cb-strip` + `cb-body` + pill-button back. Currently the `Courses in the Community` (Partner Lookbook cover) and `On-Demand Courses` (Sabbath cover) cards opt in via `backLayout: 'lookbook'` in mission-page.json. Other Mission cards keep the standard back.

**CSS:** Block under `.mission-page .card-back--lookbook` (and `.lb-*` children) lives just before `.mission-page .is-hidden` in `index.html`. Scoped — must not leak.

**Render branch:** Both `renderOfferings` (fallback in `index.html`) and `renderOfferingsWithConfig` (live render in `assets/mission-editor.js`) check `offering.backLayout === 'lookbook' && offering.lookbookImage` and render the lookbook structure when both are truthy. Otherwise the existing navy/orange back renders. Fields are plumbed through `buildMissionState` next to `cardActions` / `primaryActionLabel` handling.

**Editor-driven config:** `assets/page-config/mission-page.json` -> `cards[<slug>]` carries `backLayout: 'lookbook'`, `lookbookImage`, `lookbookUrl`, `lookbookAlt`, plus an `actions[]` whose first item becomes the navy primary CTA and second becomes the navy-outline secondary. The right-side lookbook tile is also a click target to `lookbookUrl` (or, if blank, the primary action's url).

Optional per-card tuning:
- `lookbookTileWidth` / `lookbookTileHeight` (pixels) - tile dimensions on the right; defaults to 196 x 205 if unset. Use a wider/shorter tile for landscape covers (e.g. Sabbath: 220 x 145).
- `lookbookTitleSize` / `lookbookLeadSize` (pixels) - font-size overrides for `.lb-title` and `.lb-lead`. Defaults: 24 / 13.5.
- `lookbookTileTilt` (degrees, default -2.5) - tile rotation. Set to `0` for a level photographic cover.
- `lookbookTileFlat` (boolean, default false) - when `true`, suppresses the stacked-page rectangles behind the cover and removes the rotated hover. Use for photographic/banner covers where the book-cover treatment doesn't apply (e.g. Sabbath).

**Assets:**
- Courses card: `assets/flipbook/courses-flipbook-cover.png` (1500 x 1560, ~0.96 aspect, near-square). Tile defaults to 196 x 205.
- On-Demand card: `assets/Other Images/Sabbath_compressed.jpg` (2048 x 1365, ~1.5 aspect, landscape). Tile is 220 x 145. Path has spaces because the folder is named "Other Images"; we'll rename for repo hygiene next time we touch it.
- All tiles use `object-fit: cover; object-position: left center` so detail anchors to the left of each cover.

**Layout:** 2-column grid `1.25fr | 1px hairline | 1fr`. Left column: Montserrat 700 24px title (matches front-of-card typography), 72 x 3 px orange-red accent rule, lead copy (max 34ch), and a wrap-as-needed CTA pair. Right column centers the lookbook tile, which has stacked-page depth, slight tilt (`rotate(-2.5deg)`), and a hover lift.

**Flipbook URL placeholder:** `#flipbook` is intentional. Update `lookbookUrl` and `actions[0].url` in `mission-page.json` when the real flipbook page is built. No code change required.

**Editor:** the Mission editor exposes form controls for lookbook fields when a card has `backLayout: 'lookbook'` selected. Controls include image picker (drawn from CARD_ART_OPTIONS plus typed paths), click URL, alt text, secondary button label, tile width / height, and font-size sliders for title and lead. The lookbook CSS uses its own background and ignores `--mission-card-back-bg`, so the editor's color/strip controls have no effect when lookbook layout is on.

**Click affordance preserved:** every CTA on the new back uses the existing `cb-cta` class (alongside `lb-btn` / `lb-tile`), so the existing flip-tap handler in `initMissionCardInteractions()` still ignores button clicks via `event.target.closest('.cb-cta')`.

**Regression risk:**
- Do not let the lookbook CSS leak. Keep every selector under `.mission-page .card-back--lookbook`.
- Do not change the path `assets/flipbook/courses-flipbook-cover.png` without updating both the JSON and this entry.
- Do not strip `backLayout` / `lookbook*` fields from `buildMissionState`.
- Do not collapse the conditional render in `renderOfferings` / `renderOfferingsWithConfig` into the navy/orange branch; the lookbook layout has no `.cb-strip` and would render badly.

---

## 22. LINE-ENDING NORMALIZATION
**Rule:** The repo has a top-level `.gitattributes` with `* text=auto eol=lf`. All text files are stored in Git with LF line endings. Working copies on Windows may appear with CRLF, which is fine as long as `.gitattributes` is present.

**Why:** Without this, Dropbox-synced copies of repo files flip between CRLF and LF and every unrelated file shows as "modified" in `git status`, causing noisy commits and phantom merge conflicts with the Netlify editor.

**Regression risk:** Do not remove `.gitattributes`. If a session shows dozens of whitespace-only "modified" files, do NOT `git add .` — first verify with `git diff -w --shortstat <file>` whether the change is real.

---

## SELF-AUDIT BEFORE COMMITTING
[ ] Candler Impact still uses hero + 3 story rows, not the retired faculty grid
[ ] Candler Impact cards still render as unified editorial story cards
[ ] Candler Impact nav position is second
[ ] Save and Publish are still separate actions
[ ] Clicking page content while editing does not force editor close
[ ] Published state still flows through the page-config JSON files
[ ] Netlify publish function only writes approved config paths (mission, impact, growth, theoed)
[ ] No-op publishes succeed cleanly
[ ] "Founded in 2018" remains correct
[ ] Growth and Reach canonical layout/data still match sections 12-15
[ ] TheoEd discussion guides still resolve from `assets/theoed/discussion-guides/` and the `Download Discussion Guide` button appears in the lightbox for every featured card with a guide
[ ] TheoEd cards without a guide hide the guide link cleanly (no fallback banner)
[ ] TheoEd editor still loads Git-backed content by default, surfaces Restore/Discard when a local draft exists, and clears the draft after a successful publish
[ ] `assets/page-config/theoed.json` remains the editable source of truth; `THEOED_EDITOR_DEFAULTS` (and the legacy `THEOED_SPEAKERS`/`THEOED_EVENTS`) are fallbacks only
[ ] Hero collage: only `centerImage` + `leftAccent` + `rightAccent` in `hero`. `leftAccent`/`rightAccent` include `width` and `feather` fields. Accent `photo` blank = slot hidden (no broken image)
[ ] `.gitattributes` still present at repo root so line-ending noise stays out of diffs
[ ] Ran `git pull origin main` before starting, and `git pull --rebase origin main` before pushing; no force-push
[ ] No temporary files staged (`.codex-review/`, `test-results/`, screenshots, unrelated generated assets)
[ ] CANONICAL.md is updated when fragile architecture changes

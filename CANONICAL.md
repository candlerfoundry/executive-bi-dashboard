# Executive BI Dashboard - CANONICAL.md
Last updated: 2026-04-13

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

**Why:** GitHub is the source of truth. Refreshing the page after publish should show the published state unless the editor user explicitly asks to restore a local draft.

**Regression risk:** Do not reintroduce auto-restore of localStorage drafts on page load.

---

## 9. PUBLISHED CONFIG SOURCE OF TRUTH
**Rule:** Published editor-managed page state now lives in Git-backed JSON files:
- [assets/page-config/mission-page.json](C:/Users/esavant/Dropbox/Scripts/executive-bi-dashboard/assets/page-config/mission-page.json)
- [assets/page-config/candler-impact.json](C:/Users/esavant/Dropbox/Scripts/executive-bi-dashboard/assets/page-config/candler-impact.json)
- [assets/page-config/growth-reach.json](C:/Users/esavant/Dropbox/Scripts/executive-bi-dashboard/assets/page-config/growth-reach.json)

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

## SELF-AUDIT BEFORE COMMITTING
[ ] Candler Impact still uses hero + 3 story rows, not the retired faculty grid
[ ] Candler Impact cards still render as unified editorial story cards
[ ] Candler Impact nav position is second
[ ] Save and Publish are still separate actions
[ ] Clicking page content while editing does not force editor close
[ ] Published state still flows through the page-config JSON files
[ ] Netlify publish function only writes approved config paths
[ ] No-op publishes succeed cleanly
[ ] "Founded in 2018" remains correct
[ ] Growth and Reach canonical layout/data still match sections 12-15
[ ] CANONICAL.md is updated when fragile architecture changes

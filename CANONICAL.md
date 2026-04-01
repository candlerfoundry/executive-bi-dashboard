# Executive BI Dashboard — CANONICAL.md
Last updated: 2026-04-01 (Session 24)

## PURPOSE
This file documents fragile, frequently-broken implementations in index.html.
Read this before every session. Verify each section is intact before committing.

---

## 1. FACULTY LIST SOURCE (Candler Impact tab)
**Rule:** The faculty grid is driven by headshot filenames in /assets/headshots/ ONLY.
Airtable instructor names are NOT used to populate the grid — only to look up
course counts per person after the grid is built.

**Why:** Airtable contains non-person instructor entries (N/A, FFL-Various, TheoEd-Various,
Webinar, etc.) that pollute the faculty list and break the % calculation.

**Implementation:**
  const FACULTY = [ { file: 'first-last.jpg', name: 'First Last' }, ... ]
  Built from known headshot filenames. Add new entries here when headshots are added.

**Regression risk:** If Airtable fetch is used to populate FACULTY instead of this
hardcoded array, N/A and Various entries will appear in the grid.

---

## 2. FACULTY % CALCULATION (Candler Impact sidebar)
**Rule:** percentage = Math.round((FACULTY.length / 68) * 100) + '%'
Denominator is always 68 (total Candler faculty).
Numerator is FACULTY.length — count of headshot files, not Airtable rows.

**Why:** Using Airtable row count causes > 100% due to non-person entries.

**Regression risk:** Do not recalculate from Airtable instructor count.

---

## 3. HOVER POPOUT (Candler Impact faculty grid)
**Rule:** Hover shows a popout card above the circle. NO CSS flip/rotateY.
Implemented via JS mouseenter/mouseleave. Position: absolute, bottom: calc(100% + 10px).
Top-row cards (offsetTop < 200): popout appears below (top: calc(100% + 10px)).

**Why:** CSS flip animation was used in prior implementation — it looked wrong and
obscured the headshot rather than supplementing it.

**Regression risk:** Do not reintroduce rotateY, transform-style: preserve-3d,
or backface-visibility on faculty cards.

---

## 4. QUOTE BANNER SIZING (Candler Impact tab)
**Rule:** Quotation mark 100px Georgia serif. Quote text 16px. Attribution 12px.
Banner padding: 28px 48px 24px 32px. Center quote text in the middle of the page, not with left-margin orientation.

**Why:** Prior implementation rendered all text too small to be legible.

**Regression risk:** Do not reduce font sizes in this section below the values above.

---

## 5. CIRCLE SIZE (Candler Impact faculty grid)
**Rule:** max-width 130px per circle. Grid gap: 24px 16px.
Name label: font-size 12px, max-width 130px.

**Why:** Prior implementation used 90px circles — too small to see headshots clearly.

**Regression risk:** Do not reduce circle max-width below 130px.

---

## 6. NO ITALICS
**Rule:** * { font-style: normal !important; } applies globally.
Never add italic styling anywhere in index.html.

---

## 7. TAB NAME
**Rule:** Tab 4 is "Candler Impact" (not "Candler Data").
Page heading is "Candler Impact". No eyebrow label above heading.

---

---

## 8. GRID COLUMNS (Candler Impact faculty grid)
**Rule:** 4 columns — grid-template-columns: repeat(4, 1fr). Circle max-width: 160px. Gap: 32px 24px.

**Why:** 5 columns made circles too small to see headshots clearly at typical dashboard viewport widths.

**Regression risk:** Do not change to 5 columns or reduce circle size below 160px.

---

## 9. QUOTE BANNER BACKGROUND (Candler Impact tab)
**Rule:** background-image: url('/assets/Graphic_1.png'), background-position: center 25%, background-size: cover.
Dark overlay div (.ci-quote-overlay): position absolute, inset 0, background rgba(26,31,46,0.72).
Min-height: 220px. Quote text color #ffffff, 18px. Quotation mark 80px Georgia #c84826.
Attribution color #c84826, 13px. Dots horizontal, centered, margin-top 16px. NO left border.

**Why:** Plain cream background made the banner look like unstyled text. Hero image matches the Our Mission & Offerings tab treatment.

**Regression risk:** Do not remove background-image, overlay div, or add a left border. Do not set quote text to a dark color.

---

## 10. FOUNDING YEAR
**Rule:** The Candler Foundry was founded in 2018, not 2019.
All references to "Since its founding in 2019" must read "Since its founding in 2018".
TheoEd event years (2019 city labels) are NOT the founding year and must NOT be changed.

**Why:** The correct founding year is 2018.

**Regression risk:** grep for "founding in 2019" before every commit.

---

---

## 11. GROWTH AND REACH — CANONICAL LAYOUT (as of Session 24)
**Rule:** Tab nav and panel id remain `numreach`. Tab button label: "Growth and Reach". All `gr-` prefixed CSS classes.

**Hero banner** (`.gr-hero`): background-image url('/assets/Graphic_2.png'), background-size cover, min-height 240px. Dark overlay `.gr-hero-overlay` rgba(26,37,48,0.72). Title 36px 700 white letter-spacing -0.5px. Subtitle 17px 400 white max-width 700px line-height 1.7. NO eyebrow label.

**Row 1 — Journey Timeline** (`.gr-timeline-row`): navy (#1e2530) bg, padding 48px 60px. Eyebrow `.gr-eyebrow` orange 12px uppercase letter-spacing 2.5px. Title `.gr-row-title` cream 22px 700. Horizontal timeline (`.gr-timeline`), orange center line, 5 nodes. `.gr-tnode-year` orange 16px 700. `.gr-tnode-desc` cream 14px 400 max-width 160px centered.
Milestones: 2018 / 2020 / 2022 / 2024 / 2025 (see section 13 for text).

**Row 2 — Stats + Map** (`.gr-stats-map-row`): cream (#fafaf2) bg, padding 48px 60px, flex, gap 40px.
  Left col (`.gr-stats-col`, ~40%): 3×3 grid of `.gr-sc` stat cards. Navy bg, border-radius 12px. `.gr-sc-num` orange 48px 700. `.gr-sc-label` cream 12px 600 uppercase letter-spacing 2px. `.gr-sc-sub` cream 60% opacity 14px 400. Count-up animation on tab load via data-val / data-suffix / data-prefix attributes. Years of Impact is dynamic (getFullYear() - 2018, no count-up).
  Right col (`.gr-map-col`, ~60%): SVG path-based Albers USA map. viewBox 0 0 960 600. Real geographic path data for all 50 states + DC. Hover tooltip follows cursor. Legend below map.

**Row 3 — Denom + Cities** (`.gr-denom-cities-row`): navy (#1e2530) bg, padding 48px 60px, flex, gap 40px.
  Left: Faith Traditions denomination bars — animated fill, percentage + headcount labels, cream 14px.
  Right: Cities Served — orange dot + city name 16px cream + count 14px orange, 2-col grid.

**JS functions:** `initNumbers()` runs all animations (count-up, bars, map). `buildMap()` and `initReach()` are stubs (no-op).

**Regression risk:** Do NOT reintroduce `.nr-block` / `.numreach-grid` layout on this tab. Do NOT use CSS tile-grid for the map — it must be SVG `<path>` elements. Do NOT add a 2017 timeline node. Timeline starts at 2018.

---

## 12. MINIMUM TEXT SIZE RULE (standing rule — applies every tab, every session)
**Rule:**
  - Body / supporting text: minimum 15px, target 16–17px
  - Stat sublabels and data captions: minimum 14px
  - Card subtitle text: minimum 14px, target 15px
  - Section eyebrow labels: 12px acceptable minimum
  - NO font-size below 12px anywhere in the dashboard
  - Negative space: padding > 60px top/bottom with no content → reduce or fill
  - Audit every session before committing: grep for font-size values ending in 8px, 9px, 10px, 11px

**Why:** Prior sessions produced illegible text at 9–11px on stat labels, city labels, denom notes.

**Regression risk:** Any new CSS block must have its smallest font-size checked before commit.
Old `.nr-block-label` (9px), `.nr-stat-lbl` (9px), `.nr-city-lbl` (9px), `.nr-tnode-desc` (10px) etc. are legacy — do not copy these sizes to new sections.

---

## 13. GROWTH AND REACH — CANONICAL DATA
**Rule:** Use ONLY these numbers. Do not use 2,815 (retired).

  Unique individual learners:  4,200
  Total registrations:         6,200+ (all programs since 2018)
  Church partners:             74
  Courses offered:             150
  TheoEd talks:                50+
  TheoEd events hosted:        14
  Social followers (YT+IG):    ~6,500
  Email subscribers:           ~6,000
  Years of Impact:             dynamic — new Date().getFullYear() - 2018

  Denomination breakdown (approx, based on ~4,200 unique registrants):
    Methodist / UMC:          35%  ~1,470 people
    Presbyterian:             22%  ~924 people
    Episcopal / Anglican:     14%  ~588 people
    Baptist:                  12%  ~504 people
    Interdenominational:      10%  ~420 people
    Other / Unknown:           7%  ~294 people

  Cities (do not change these counts):
    Atlanta GA: 680+ | Nashville TN: 140+ | Orlando FL: 95+ | Charlotte NC: 80+
    Austin TX: 75+ | Knoxville TN: 60+ | Macon GA: 55+ | Birmingham AL: 45+

  Timeline milestones (do not change):
    2018: The Candler Foundry established at Emory University
    2020: Online courses launched; first Candler in Conversation podcast
    2022: 500th participant milestone reached
    2024: 2,000th participant milestone; TheoEd expands to 8 cities
    2025: On-Demand courses and Sunday School Simplified launched

**Retired stats (do not use):** 2,815 total registrations, $30,029 revenue, 532/47/139 this-year stats in Growth and Reach. Those belong on Tab 1 (This Year) only.

---

## 14. GROWTH AND REACH — SVG MAP SPEC
**Rule:** The US map must be an SVG `<path>`-based Albers USA projection — NOT a CSS tile grid, NOT divs in rows.
  - viewBox: '0 0 960 600'
  - All 50 states + DC must be present as `<path>` elements with real geographic shapes
  - Heat map tiers (by participant count):
      Tier 0 (0):       fill #c8d0d8
      Tier 1 (1–9):     fill #e8a898
      Tier 2 (10–49):   fill #d4705a
      Tier 3 (50–199):  fill #c84826
      Tier 4 (200+):    fill #8b2800
  - Hover tooltip: fixed position, follows cursor, white bg navy text 13px border-radius 6px shadow
  - Legend: 5 swatches (16px squares) + navy 13px labels, flex row below map
  - State fill colors are set by initNumbers() JS using data-state and data-count attributes on each path

**Regression risk:** Do not replace SVG paths with tile divs or cartogram approximations. Do not remove data-state or data-count attributes from path elements. The map tooltip div (.gr-map-tooltip) must exist in the DOM before initNumbers() runs.

---

SELF-AUDIT before committing:
[ ] FACULTY array is hardcoded from headshot filenames — no Airtable names in list
[ ] No "N/A", "FFL-Various", "TheoEd-Various", or "Webinar" entries in grid
[ ] Faculty % = FACULTY.length / 68 * 100 (should be <= 100%)
[ ] Alumni count is non-zero (or hardcoded 139 fallback with console warning)
[ ] "Since its founding in 2018" — no "founding in 2019" remaining
[ ] Circles are 160px max-width, 4-column grid
[ ] Quote banner has Graphic_1.png background with dark overlay (.ci-quote-overlay)
[ ] Quote text is white (#ffffff), 18px; quotation mark is 80px
[ ] No left border on quote banner
[ ] Hover shows popout above circle — no flip animation, no rotateY
[ ] Growth and Reach tab: hero banner Graphic_2.png, dark overlay, no eyebrow label
[ ] Row 1: Journey Timeline, navy bg, 5 milestones, starts at 2018
[ ] Row 2: stat grid (~40%) + SVG map (~60%), cream bg
[ ] 9 stat cards with correct canonical data (section 13 — not 2,815)
[ ] Years of Impact card is dynamic (getFullYear() - 2018)
[ ] SVG map: path-based, all 50 states + DC, hover tooltip works, legend present
[ ] Row 3: Denom + Cities, navy bg, bars show pct + headcount, city counts unchanged
[ ] No font-size below 12px in Growth and Reach section
[ ] All body/supporting copy 14px minimum
[ ] buildMap() and initReach() are stubs (no-op) — not called
[ ] CANONICAL.md updated at repo root
[ ] index.html is in git diff
[ ] CANONICAL.md is in git diff

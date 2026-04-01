# Executive BI Dashboard — CANONICAL.md
Last updated: 2026-04-01

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

## 11. GROWTH AND REACH — LAYOUT (as of Session 23)
**Rule:** Tab is named "Growth and Reach" (was "By the Numbers & Reach"). Nav button and panel heading both use "Growth and Reach".

**Hero banner** (`.gr-hero`): background-image url('/assets/Graphic_2.png'), background-size cover, min-height 240px. Dark overlay `.gr-hero-overlay` rgba(26,37,48,0.72). Content div `.gr-hero-content` centered, z-index 1. Title `.gr-hero-title` 36px 700 white letter-spacing -0.5px. Subtitle `.gr-hero-subtitle` 17px 400 white max-width 700px line-height 1.7. No eyebrow label.

**Impact Stats Grid** (`.gr-stats-section`): cream (#fafaf2) bg, padding 48px 60px. Grid `.gr-stats-grid`: repeat(3,1fr), gap 20px. Each `.gr-stat-card`: navy (#1e2530) bg, border-radius 12px, padding 28px 24px. Stat number `.gr-stat-num`: #c84826, 56px, Montserrat 700. Label `.gr-stat-label`: #fafaf2, 13px, 600, uppercase, letter-spacing 2px, margin-top 6px. Sublabel `.gr-stat-sublabel`: rgba(250,250,242,0.6), 13px, 400, margin-top 4px.
9 cards (3 rows × 3 cols): 2,815 Total Registrations / 150 Courses Offered / 74 Church Partners / 532 Participants This Year / 47 Courses This Year / 139 Alumni Reached / 8 Years of Impact / 12 TheoEd Events / $30,029 Program Revenue.

**Below stats: `.numreach-grid`** — 3-row, 2-column grid (display:grid; grid-template-columns:1fr 1fr; gap:20px; padding:0 48px 48px).
All blocks use `.nr-block` (white bg, border-radius 12px, border rgba(30,37,48,0.08), padding 22px 24px).
Row 1: `.nr-block.nr-block-full` (grid-column:1/-1) — horizontal timeline, 5 milestones.
Row 2 left: All-time stats block — 3 side-by-side stat items (2,815 / 150 / 74), white bg.
Row 2 right: US map block — inline SVG tile-grid cartogram (viewBox 0 0 960 420), id="nr-map-container".
Row 3 left: Denomination bars — 6 `.nr-denom-row` items, populated by initReach() JS.
Row 3 right: City pills — 2-col grid of `.nr-city-pill`, top 8 cities from Airtable (tbldN1Ak4SHS41PvM), fallback hardcoded.

**Timeline entries (5 nodes, starts 2018 — NOT 2017):**
  2018: The Candler Foundry established at Emory University
  2020: Online courses launched; first Candler in Conversation podcast
  2022: 500th participant milestone reached
  2024: 2,000th participant milestone; TheoEd expands to 8 cities
  2025: On-Demand courses and Sunday School Simplified launched

**Map color tiers:**
  Highest (200+): GA → #8a2f15 | High (81-200): TN FL NC NY TX MA IL OH PA VA → #c84826
  Medium (21-80): CA CO WA OR MN WI MI IN MO SC AL LA NJ CT MD KY → #e8956e
  No data: ND SD WY MT AK HI → #f0e0d4 | Low (rest) → #f5c4b3

**Why:** Previous layout used a giant full-width heat map as Row 1 and dark navy hero-stat cards,
violating the 6-equal-data-blocks vision from Emily's March 17 session notes.

**Regression risk:** Do not reintroduce a dominant full-width heat map. Do not use dark navy card
backgrounds on the stat block. Do not add a 2017 timeline node. Timeline must start at 2018.
Stats block must be white/cream bg with 3 side-by-side stats (2815 / 150 / 74).
Map container id is "nr-map-container" — do NOT revert to "us-map-container".

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
[ ] CANONICAL.md updated at repo root
[ ] index.html is in git diff
[ ] CANONICAL.md is in git diff

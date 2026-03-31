# Executive BI Dashboard — CANONICAL.md
Last updated: 2026-03-31

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

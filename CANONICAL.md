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

SELF-AUDIT before committing:
[ ] FACULTY array is hardcoded from headshot filenames — no Airtable names in list
[ ] No "N/A", "FFL-Various", "TheoEd-Various", or "Webinar" entries in grid
[ ] Faculty % = FACULTY.length / 68 * 100 (should be <= 100%)
[ ] Alumni count is non-zero (or hardcoded 139 fallback with console warning)
[ ] Circles are 130px max-width
[ ] Quote text is 16px, quotation mark is 100px
[ ] Hover shows popout above circle — no flip animation
[ ] CANONICAL.md created at repo root with all 7 sections
[ ] index.html is in git diff
[ ] CANONICAL.md is in git diff

MANDATORY:
git diff index.html
git add index.html CANONICAL.md
git commit -m "fix: Candler Impact — proportions, headshot-driven faculty, hover popout, CANONICAL.md"
git push

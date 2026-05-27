# Card Scaling Guide For Claude Code And Codex

Use this guide when working on dashboard pages with card-based layouts, especially cards that contain both copy and a major visual asset. It is intended as shared context for Claude Code, Codex, and any future agent working on the Executive BI dashboard.

When starting a new scaling pass, point the agent to this file and ask it to preserve the approved desktop composition while making the same card scale down cleanly across the viewport set in the QA checklist.

## Core Principle

Scale the card composition. Do not accidentally redesign it at a breakpoint.

If the large-screen card is a composed visual object, the small-screen card should usually feel like a scaled-down version of that same object. Do not stack the image under the text just because the viewport is smaller unless the design explicitly calls for a different mobile composition.

For this dashboard, the page grid and the card internals are separate systems. The page may move from three columns to one column, while each card still keeps its own internal split and simply retunes type, padding, and visual proportions.

## What We Learned

### 1. Viewport Breakpoints Are Too Blunt

A card can be narrow on desktop because it sits inside a multi-column grid, or wide on tablet because the outer grid has collapsed to one column.

Rules like this are often too broad:

```css
@media (max-width: 900px) {
  .card-back {
    grid-template-columns: 1fr;
  }
}
```

Instead, make the card respond to its actual rendered size:

```css
.card {
  container-type: inline-size;
}

@container (max-width: 480px) {
  .card-back {
    /* Tune internals based on the card's width. */
  }
}
```

### 2. Card Internals Need Their Own Responsive System

The outer page grid and the inner card layout are separate problems.

The page grid may collapse from 3 columns to 1 column, but the inside of a card may still need to remain two-column:

- Left column: title, accent/rule, description, CTAs
- Right column: image or visual feature

Do not assume that a one-column page means every card interior should also become one column.

### 3. Do Not Stack Visual Assets Too Early

The failure mode we saw:

- Title and text stayed at top
- Buttons sat immediately under the text
- Image dropped below everything
- Card had awkward empty space
- Small card no longer resembled the large-screen card

The better pattern:

- Keep copy and CTAs on the left
- Keep visual asset on the right
- Shrink the visual with `clamp()`, `max-width`, `max-height`, and `aspect-ratio`
- Let buttons shrink or wrap before forcing the visual below the copy

### 4. Do Not Clamp Important Card Copy

Avoid this for meaningful descriptions:

```css
.card-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

This truncates the message and creates an obvious quality problem on small screens.

For important card descriptions, prefer:

```css
.card-description {
  max-width: 34ch;
  overflow: visible;
}
```

If the text does not fit, first tune:

- Column ratio
- Font size
- Line height
- Button padding
- Visual size
- Card height, if the page design allows it

### 5. CTA Placement Matters

On the large cards, buttons often sit lower in the left column. On small screens, do not pull them directly under the description unless that is the intended design.

Use a flex column for the copy area:

```css
.card-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.card-ctas {
  margin-top: auto;
  padding-top: clamp(10px, 3cqw, 20px);
}
```

This preserves the large-screen vertical rhythm.

### 6. Scale Assets With Constraints, Not Fixed Dimensions

Avoid fixed dimensions that cannot shrink gracefully:

```css
.card-image {
  width: 220px;
  height: 145px;
}
```

Prefer aspect-ratio based sizing:

```css
.card-image {
  width: min(var(--image-width), clamp(110px, 34cqw, 240px), 100%);
  aspect-ratio: var(--image-ratio);
  height: auto;
  max-width: 100%;
  max-height: clamp(120px, 60cqh, 320px);
  object-fit: contain;
}
```

For photographic/banner assets where cropping is intentional:

```css
.card-image.is-photo {
  object-fit: cover;
  object-position: center;
}
```

### 7. Use Container Units For Type Inside Cards

When copy sits inside a card whose width changes because of a grid, use card-relative units (`cqw`) instead of viewport-relative units (`vw`). This is especially important when a card can be narrow on a large desktop and wide on a tablet.

Good pattern:

```css
.speaker-card {
  container-type: inline-size;
}

.speaker-quote {
  font-size: clamp(0.84rem, 3.45cqw, 1.18rem);
  line-height: 1.32;
  overflow-wrap: break-word;
}

@container (max-width: 430px) {
  .speaker-quote {
    font-size: clamp(0.7rem, 3.05cqw, 0.86rem);
    line-height: 1.3;
  }
}
```

This lets the quote respond to the card it actually lives in. The same viewport can contain different card widths, so the card must govern its own typography.

### 8. Tune Column Ratio Before Shrinking Everything

If a card has too much empty space in the text panel, do not immediately shrink the whole card or stack the content. First tune the column ratio and the type scale together.

For the TheoEd speaker cards, the better desktop balance was:

```css
.theoed-speaker-tile {
  container-type: inline-size;
  grid-template-columns: minmax(52%, 1.08fr) minmax(0, 0.92fr);
}
```

At narrower page widths where the card becomes a single-column row in the page grid, the internal split still stays two-column, but with a little more room for text:

```css
@media (max-width: 960px) {
  .theoed-speaker-tile {
    grid-template-columns: minmax(46%, 0.95fr) minmax(0, 1.05fr);
  }
}
```

The lesson is not that every card should use those exact percentages. The lesson is that card composition should be tuned as a system:

- widen the visual column if the text panel feels empty
- increase type only while checking overlap and overflow
- keep `minmax(0, ...)` on text tracks so long words can wrap instead of forcing overflow
- use `min-width: 0` on copy containers
- use `overflow-wrap` on names, locations, and quotes

### 9. Front-Quote Cards Need Their Own Guardrails

Cards with a photo on one side and a quote/name/location panel on the other side are especially sensitive. The quote may be the longest visible text, but the name and location are often anchored near the bottom.

Use this pattern:

```css
.speaker-card-copy {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
  padding: clamp(14px, 4cqw, 23px);
}

.speaker-card-quote {
  font-size: clamp(0.84rem, 3.45cqw, 1.18rem);
  line-height: 1.32;
  overflow-wrap: break-word;
}

.speaker-card-name {
  font-size: clamp(1.12rem, 4.6cqw, 1.68rem);
  line-height: 1;
  letter-spacing: 0;
  overflow-wrap: break-word;
}
```

Do not use hidden overflow or line clamp to hide quote text. If the quote collides with the name, reduce quote size at the relevant container width, tighten line height slightly, adjust column ratio, or increase the card height within the approved visual rhythm.

### 10. Photo Centering Is Usually Per-Asset

For speaker/photo cards, global `object-position: center` is rarely enough. Different photos have different subject placement, and a good crop on desktop may become a poor crop on phone.

Prefer a per-card config value or CSS variable:

```html
<img
  src="assets/theoed_photos/Amy Jill-Levine 1.png"
  style="object-position: 18% 26%; --te-img-scale: 1;"
  alt="Amy-Jill Levine">
```

Use global defaults only as fallbacks. If one card is visibly off-center, adjust that card's `object-position` rather than distorting the entire card system.

### 11. Hero Banners Need Clipping Checks

Shortening a hero banner is safe only if the logo, copy, and stats still fit at the target viewports. When a hero is made shorter:

- check desktop, laptop, tablet, and phone
- verify stat strips are not clipped
- verify the next section still starts cleanly
- scale logo size with `clamp()`
- use a small vertical offset variable for lift
- use `drop-shadow()` when a light logo needs separation from a busy background

Example pattern:

```css
.hero {
  height: 304px;
}

.hero-logo {
  width: clamp(230px, 18.4vw, 345px);
  transform: translateY(var(--logo-offset-y, -8px));
  filter:
    drop-shadow(0 6px 12px rgba(0, 0, 0, 0.7))
    drop-shadow(0 0 18px rgba(250, 250, 242, 0.24));
}
```

On phone, the hero may need `height: auto` plus a `min-height` because stat rows wrap. Do not force the desktop height onto a wrapped mobile hero if it clips the content.

## Recommended Pattern

Use this as the default structure for cards with a major visual feature:

```html
<article class="feature-card">
  <div class="feature-card-back">
    <div class="feature-card-copy">
      <h3 class="feature-card-title">Card Title</h3>
      <span class="feature-card-rule" aria-hidden="true"></span>
      <p class="feature-card-description">Readable description text.</p>
      <div class="feature-card-ctas">
        <a class="feature-card-button" href="#">Primary Action</a>
        <a class="feature-card-button is-secondary" href="#">Secondary Action</a>
      </div>
    </div>

    <div class="feature-card-visual">
      <img class="feature-card-image" src="/path/to/image.jpg" alt="">
    </div>
  </div>
</article>
```

Recommended CSS:

```css
.feature-card {
  container-type: inline-size;
}

.feature-card-back {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    minmax(clamp(105px, 32cqw, 220px), 0.7fr);
  align-items: stretch;
}

.feature-card-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: clamp(12px, 4cqw, 28px);
}

.feature-card-title {
  font-size: clamp(18px, 5.8cqw, 28px);
  line-height: 1.08;
  margin: 0 0 10px;
}

.feature-card-rule {
  width: clamp(52px, 16cqw, 72px);
  height: 3px;
  margin-bottom: clamp(8px, 2.5cqw, 14px);
}

.feature-card-description {
  max-width: 34ch;
  font-size: clamp(11px, 3.2cqw, 14px);
  line-height: 1.45;
  overflow: visible;
}

.feature-card-ctas {
  margin-top: auto;
  padding-top: clamp(10px, 3cqw, 20px);
  display: flex;
  flex-wrap: wrap;
  gap: clamp(6px, 1.6cqw, 10px);
}

.feature-card-button {
  max-width: 100%;
  min-width: 0;
  font-size: clamp(9px, 2.7cqw, 12px);
  padding: clamp(6px, 1.8cqw, 9px) clamp(8px, 3cqw, 14px);
  white-space: normal;
  overflow-wrap: anywhere;
}

.feature-card-visual {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: clamp(12px, 4cqw, 28px);
}

.feature-card-image {
  width: min(var(--image-width, 220px), clamp(105px, 34cqw, 260px), 100%);
  aspect-ratio: var(--image-ratio, 4 / 3);
  height: auto;
  max-width: 100%;
  max-height: clamp(120px, 60cqh, 320px);
  object-fit: contain;
}
```

Container query tuning:

```css
@container (max-width: 480px) {
  .feature-card-back {
    grid-template-columns:
      minmax(0, 1fr)
      minmax(clamp(96px, 34cqw, 150px), 0.65fr);
  }

  .feature-card-copy {
    padding: clamp(10px, 3cqw, 14px);
  }

  .feature-card-title {
    font-size: clamp(16px, 5cqw, 20px);
  }

  .feature-card-description {
    font-size: clamp(10.5px, 3cqw, 12px);
    line-height: 1.35;
    overflow: visible;
  }

  .feature-card-ctas {
    margin-top: auto;
    padding-top: clamp(10px, 3cqw, 18px);
  }

  .feature-card-button {
    font-size: clamp(8.8px, 2.7cqw, 10.5px);
    padding: 6px 8px;
  }

  .feature-card-image {
    width: min(var(--image-width, 220px), clamp(96px, 34cqw, 150px), 100%);
  }
}
```

## Anti-Patterns To Avoid

### Early Stacking

Avoid this unless the design explicitly requires it:

```css
@container (max-width: 480px) {
  .card-back {
    grid-template-columns: 1fr;
  }

  .card-visual {
    grid-row: 2;
  }
}
```

### Hidden Lead Copy

Avoid this for important descriptive text:

```css
.card-description {
  -webkit-line-clamp: 2;
  overflow: hidden;
}
```

### Fixed Image Boxes

Avoid this:

```css
.card-image {
  width: 220px;
  height: 145px;
}
```

### Viewport-Only Card Logic

Avoid using only viewport breakpoints for card internals:

```css
@media (max-width: 900px) {
  .card-back {
    grid-template-columns: 1fr;
  }
}
```

Use `@container` for card internals instead.

## Instructions For Claude Code

Use the following instructions when modifying card-heavy dashboard pages. These instructions also apply to Codex:

```text
When working on dashboard cards, preserve the large-screen composition at smaller sizes unless I explicitly ask for a stacked mobile redesign.

Use container queries on the card wrapper, not viewport-only media queries. Add `container-type: inline-size` to the card wrapper if needed.

For cards with a major visual asset, keep a persistent internal split:
- left column: title, accent/rule, description, CTAs
- right column: image/visual asset

Do not move the visual below the text at ordinary phone/tablet widths. Shrink the visual with `clamp()`, `max-width`, `max-height`, `aspect-ratio`, and `object-fit` instead.

Do not use `-webkit-line-clamp` or hidden overflow on important card descriptions. The description must remain readable.

Keep CTA groups lower in the copy column with `margin-top: auto`; reduce button font-size/padding if necessary instead of pulling the whole CTA group upward or forcing the image below.

Use container-relative units like `cqw` and `cqh` where available. Avoid fixed pixel heights and screenshot-specific magic numbers.

When text appears inside a card front, especially quotes, scale the font from the card width with `cqw`, not the viewport. If the text panel has too much empty space, tune the card's internal grid ratio and type scale together.

For photo cards, use per-card `object-position` / image-position config where needed. Do not globally recenter every card to fix one miscropped speaker or story photo.

For hero banners, shortening height must be paired with explicit logo/stat clipping checks. Use `clamp()` for logo width and a small offset/drop-shadow when a logo needs more presence against a photo.

Before finishing, inspect the card at:
- 1920x1080
- 1280x900
- 820x1180
- 390x900

At each size, verify:
- the small card still looks like a scaled-down large card
- copy is not truncated
- buttons are readable
- visual asset stays on the intended side
- image does not overlap text/buttons
- quote/name/location blocks do not overlap or overflow
- hero logos and stat strips are not clipped
- no unrelated card types regressed
```

## Agent Handoff Prompt

When starting a new Claude Code or Codex session for card scaling, use this prompt:

```text
Read CLAUDE_CARD_SCALING_GUIDE.md before editing. Preserve the approved large-screen card composition while making the card scale down based on its own rendered width. Use `container-type: inline-size`, container queries, and `cqw`/`cqh` units for card internals. Keep important copy readable; do not hide it with line clamps or overflow. For photo cards, tune column ratios, type scale, and per-card object-position before changing the overall design. Verify at 1920x1080, 1280x900, 820x1180, and 390x900 before saying the work is done.
```

## QA Checklist

For any card-heavy page, collect both full-page screenshots and cropped card screenshots.

Full-page screenshots catch:

- Section spacing regressions
- Page grid issues
- Overlapping sections
- Nav/header interactions

Cropped card screenshots catch:

- Card composition problems
- Truncated text
- CTA crowding
- Image overlap
- Art pinned too high or too low

Recommended viewport set:

- `1920x1080`
- `1280x900`
- `820x1180`
- `390x900`

For each target card, verify:

- The card looks like the same design at every size
- The visual asset remains in the intended region
- Descriptive text is fully readable
- CTAs remain usable and visually balanced
- There is no accidental empty region caused by stacking
- Cards that are not part of the change did not regress

For quote/photo cards, also verify:

- Quote does not run off the card
- Quote does not overlap the name/location block
- Name and location stay inside the text panel
- Photo crop keeps the speaker or subject centered enough at every target width
- Text panel does not feel empty because the media column is too narrow

For hero bands, also verify:

- Logo is large enough to read and has enough lift from the background
- Stats are not clipped
- Shorter desktop height does not make the section feel cramped
- Mobile height is allowed to grow if stats wrap

## Summary

Use container queries to scale the card based on the card's actual rendered size.

Preserve the composition first. Tune proportions second. Stack only when there is genuinely no room left.

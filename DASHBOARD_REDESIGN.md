# Dashboard Redesign Branch Guardrails

Branch: `dashboard-redesign`

## Scope
- First redesign target only: `Our Mission & Offerings`
- Keep all other tabs visually and structurally unchanged for now
- Do not change Netlify production branch settings in `netlify.toml`

## Files to Focus On
- `index.html`
  - Mission tab CSS: `.mission-bar`, `.mission-bar-overlay`, `.mission-text`, `.offerings-layout`, `.impact-sidebar`, `.offering-flip`, `.card-front`, `.card-back`
  - Mission tab markup: `#panel-whoweare`
  - Offerings rendering/data handoff: `FALLBACK_OFFERINGS`, `CARD_GRAPHICS`, `CARD_HOOKS`, `renderOfferings()`, `loadContent()`
- `content.json`
  - Offerings copy/link data consumed by `renderOfferings()`

## Data and Airtable Guardrails
- Preserve `fetch('content.json')` in `loadContent()` and the existing fallback behavior
- Preserve Airtable fetches in `initPeople()` and `netlify/functions/airtable.js`
- Do not change the content schema used by `admin.html` and `netlify/functions/save-content.js`
- If Mission tab DOM/class names are changed later, update only the Mission-specific selectors and keep tab IDs and shared tab-switching intact

## Pre-commit Check
- Confirm edits are limited to Mission tab styles/markup/rendering plus this branch note
- Confirm `/.netlify/functions/airtable` calls are unchanged
- Confirm `netlify.toml` still points production `GITHUB_BRANCH` to `main`

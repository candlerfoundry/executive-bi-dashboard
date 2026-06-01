# Growth & Reach — Monthly data refresh

This is the architecture and step-by-step recipe for keeping the Growth & Reach numbers
fresh on a monthly schedule without exposing API rate limits to the live site.

> **Decision (2026-05-13):** We went with **GitHub Actions** instead of Zapier. The
> live workflow lives at [`.github/workflows/refresh-growth-reach.yml`](../.github/workflows/refresh-growth-reach.yml)
> and runs [`scripts/refresh-growth-reach.mjs`](../scripts/refresh-growth-reach.mjs).
> Both files are version-controlled, free, and require only one repo secret
> (`AIRTABLE_PAT`). The Zap recipe further down this doc is kept as a reference
> in case we ever migrate to Zapier or Make.com.

## How the live GitHub Actions workflow works

- **Schedule:** `cron: '0 10 1 * *'` → 10:00 UTC on the 1st of each month, which is
  06:00 ET during EDT (≈Mar-Nov) and 05:00 ET during EST (≈Nov-Mar). To trigger ad-hoc,
  open the GitHub Actions tab and click **Run workflow** on the *Monthly Growth & Reach
  refresh* job.
- **Auth:** the workflow runs as the repo and pushes via the auto-injected `GITHUB_TOKEN`
  (no PAT required for the GitHub commit). Airtable auth uses the `AIRTABLE_PAT` secret.
- **Permissions on the Airtable PAT:** scope it to base `appiL0Z2RilcAT2Cw` (Candler
  Foundry: Master CRM) with `data.records:read`. Fine-grained tokens recommended; 90-day
  expiry; rotate from Airtable's *Builder Hub → Personal Access Tokens* page.
- **Fields refreshed from Airtable:** hero Individual Learners, hero Church Partners,
  grid Total Registrations, grid Courses Offered, grid TheoEd Talks, grid Podcast Episodes,
  and the absolute counts on Churches We Serve (recomputed from the latest partner total).
- **Fields that stay manual / external** (until we wire YouTube/Mailchimp/IG APIs):
  hero TheoEd Views, hero Faculty Participating %, grid TheoEd Events, grid Programs
  Created, grid Social Followers, grid Email Subscribers, grid Years of Impact (dynamic).
- **Failure mode:** any per-field error keeps the existing JSON value and logs a warning.
  A total failure leaves the file untouched and exits non-zero so GitHub emails you.
- **Planned (not yet built):** a `refreshMapByState()` step to drive the "Where Our Learners
  Are" US map from the *Student Insights (Individual)* table (grouped by `State`, ZIP/City
  inference for blanks, US zero-learner states gray, international counted separately). The
  map is hardcoded dummy data until this lands. See CANONICAL.md §32 for the contract.

### One-time setup

1. Generate a fine-grained Airtable PAT scoped to base `appiL0Z2RilcAT2Cw` with
   `data.records:read`.
2. In the repo on GitHub: **Settings → Secrets and variables → Actions → New repository
   secret** with name `AIRTABLE_PAT` and the token as the value.
3. Test it: open the Actions tab, pick *Monthly Growth & Reach refresh*, click
   **Run workflow → Run workflow**. Watch the log under the new run — you should see one
   ✓ per refreshed field. If anything fails, the log shows ✗ with the API error.
4. Confirm the commit appeared on `main` (the workflow only commits if values changed).

### Tuning what gets refreshed

The mapping of *JSON field → Airtable table/view* lives at the top of
`scripts/refresh-growth-reach.mjs` in the `SOURCES` object. Each entry carries the
table ID, view ID (or `null` to count the whole table), and a `format(n)` callback.
To add a new source or change a view: edit the relevant entry, commit, and the next
run picks it up. The Airtable table and view IDs come from the *Airtable web → Help →
API documentation* pane.

---

## (Reference) Original Zap recipe

## Why this pattern

The page reads everything it shows (hero marquee stats, the 3×3 grid, denomination bars,
Churches We Serve bars) from a single static JSON file at:

```
assets/page-config/growth-reach.json
```

Because that file is plain static content, the browser does not hit any third-party API
on page load. Rate limits live with the Zap, not with site visitors. If a source goes
down, the page keeps rendering the last-known-good numbers.

The Zap's job is to:

1. Read fresh values from Mailchimp / YouTube / Instagram / Airtable / your podcast host.
2. Build the JSON payload in the shape the page expects.
3. Commit it to `assets/page-config/growth-reach.json` via the GitHub Contents API.

Netlify rebuilds within ~1 minute and the page reflects the new numbers the next time
anyone loads it.

## JSON shape the page expects

The Zap should produce a JSON file with this top-level shape (only the data fields
have to change month-to-month; `layout`, `typography`, and the hero copy can be left
alone unless you also want to tune them):

```json
{
  "hero": {
    "title": "Growth and Reach",
    "subtitle": "…",
    "image": "/assets/student_photos/Master Class Student Talking 4.jpg",
    "stats": [
      { "value": "300K+", "label": "TheoEd Views",          "sub": "Across YouTube and the TheoEd archive" },
      { "value": "4,200", "label": "Individual Learners",   "sub": "Unique registrants since 2018" },
      { "value": "74",    "label": "Church Partners",       "sub": "Partner congregations" },
      { "value": "72%",   "label": "Faculty Participating", "sub": "Of Candler's faculty" }
    ]
  },
  "layout": { …current layout, unchanged… },
  "typography": { …current typography, unchanged… },
  "stats": [
    { "id": "registrations", "value": 6200, "suffix": "+", "prefix": "",  "label": "Total Registrations",    "sub": "All programs since founding in 2018" },
    { "id": "courses",       "value": 150,  "suffix": "",  "prefix": "",  "label": "Courses Offered",        "sub": "Since founding" },
    { "id": "theoed-talks",  "value": 50,   "suffix": "+", "prefix": "",  "label": "TheoEd Talks Produced",  "sub": "Scholar-led theology talks" },
    { "id": "theoed-events", "value": 14,   "suffix": "",  "prefix": "",  "label": "TheoEd Events Hosted",   "sub": "Live events hosted" },
    { "id": "programs",      "value": 7,    "suffix": "",  "prefix": "",  "label": "Programs Created",       "sub": "Distinct Foundry initiatives" },
    { "id": "podcast",       "value": 50,   "suffix": "",  "prefix": "",  "label": "Podcast Episodes",       "sub": "Candler in Conversation" },
    { "id": "social",        "value": 6500, "suffix": "",  "prefix": "~", "label": "Social Followers",       "sub": "YouTube + Instagram combined" },
    { "id": "email",         "value": 6000, "suffix": "",  "prefix": "~", "label": "Email Subscribers",      "sub": "Mailchimp community" },
    { "id": "years",         "dynamic": "yearsSince", "since": 2018,      "label": "Years of Impact",        "sub": "Founded in 2018" }
  ],
  "denominations": {
    "eyebrow": "Faith Traditions",
    "title": "Denominational Reach",
    "note": "Approximate — denomination not always collected at registration. Based on ~4,200 unique registrants.",
    "rows": [
      { "name": "Methodist / UMC",                  "pct": 35, "count": "35% ~1,470" },
      { "name": "Presbyterian",                     "pct": 22, "count": "22% ~924" },
      { "name": "Episcopal / Anglican",             "pct": 14, "count": "14% ~588" },
      { "name": "Baptist",                          "pct": 12, "count": "12% ~504" },
      { "name": "Interdenominational",              "pct": 10, "count": "10% ~420" },
      { "name": "Other (Catholic, AME, and UCC)",   "pct":  7, "count":  "7% ~294" }
    ]
  },
  "churchSizes": {
    "eyebrow": "Partner Congregations",
    "title":   "Churches We Serve",
    "note":    "Estimated size mix of the 74 partner congregations. Sized by average weekend worship attendance.",
    "rows": [
      { "name": "Small congregations (under 200)",  "pct": 25, "count": "25% ~19 partners" },
      { "name": "Mid-sized congregations (200–800)","pct": 50, "count": "50% ~37 partners" },
      { "name": "Large congregations (800+)",       "pct": 25, "count": "25% ~18 partners" }
    ]
  }
}
```

Notes on the field shape:
- `stats[].value` is the count-up target. The grid prepends `prefix` and appends `suffix`
  during the count-up animation, so `~6,500` is stored as `value:6500, prefix:"~", suffix:""`.
- `stats[].dynamic: "yearsSince"` with `since: 2018` is computed on render (no animation).
  Leave the Years of Impact row in the JSON exactly as shown.
- `denominations.rows[].count` and `churchSizes.rows[].count` are the right-side labels.
  Compute them in the Zap so the percentage and absolute number are always consistent.

## Suggested Zap step-by-step

Pick a monthly cadence (e.g. the 1st of each month at 6am ET). The Zap looks like:

### Trigger
- **Schedule by Zapier → Every Month** → day 1, 06:00.

### Read data (one step per source)
- **Mailchimp → Get Audience** — pull total subscribers for the relevant audience.
  Map to `stats[id="email"].value`.
- **YouTube Data API (or a Webhook step calling `youtube.googleapis.com/v3/channels`)**
  — pull channel statistics: `viewCount`, `subscriberCount`.
  Map view count to the hero `300K+` (round down to nearest 10K, format as `"300K+"`).
  Add YouTube subs to Instagram followers and store as `stats[id="social"].value`.
- **Instagram Graph API (via Facebook Pages Webhook)** — pull `followers_count`.
- **Airtable → List Records** — base *Candler Foundry: Master CRM* (or whichever base
  carries the canonical numbers). Useful views to read:
  - `Registrations - All time` → `stats[id="registrations"].value`
  - `Unique learners` → `hero.stats[1].value` (Individual Learners)
  - `Course inventory` → `stats[id="courses"].value`
  - `Partner churches` → 74 count + size-bucket counts for `churchSizes.rows[]`
  - `Denominations` → 6 rows for `denominations.rows[]`
  - `Programs` → list of programs (count → `stats[id="programs"].value`)
  - `Faculty roster` → `hero.stats[3].value` (Faculty Participating %)
  - `TheoEd talks` → `stats[id="theoed-talks"].value`
  - `TheoEd events` → `stats[id="theoed-events"].value`
- **Podcast host (Buzzsprout / Anchor / Libsyn / whichever)** — pull episode count via
  RSS feed (`https://feeds.…/…`) and count `<item>` elements, or via the host's API.
  Map to `stats[id="podcast"].value`.

### Build the JSON
- **Formatter by Zapier → Text → "Format JSON" (or use the Code by Zapier step)** —
  assemble the full payload from the values above. Keep the `layout`, `typography`,
  and `hero` (other than `hero.stats`) fields the same as the current published
  file (read once via `GET assets/page-config/growth-reach.json` and pass through).

A minimal Code by Zapier (Python) skeleton:

```python
import json, datetime
payload = {
    "hero": {
        "title": "Growth and Reach",
        "subtitle": inputData["hero_subtitle"],
        "image": "/assets/student_photos/Master Class Student Talking 4.jpg",
        "stats": [
            {"value": inputData["theoed_views_label"], "label": "TheoEd Views",          "sub": "Across YouTube and the TheoEd archive"},
            {"value": inputData["individual_learners"], "label": "Individual Learners",  "sub": "Unique registrants since 2018"},
            {"value": inputData["church_partners"],     "label": "Church Partners",      "sub": "Partner congregations"},
            {"value": inputData["faculty_pct"],         "label": "Faculty Participating","sub": "Of Candler's faculty"},
        ],
    },
    "layout": json.loads(inputData["layout_passthrough"]),
    "typography": json.loads(inputData["typography_passthrough"]),
    "stats": [
        {"id": "registrations", "value": int(inputData["registrations"]), "suffix": "+", "prefix": "",  "label": "Total Registrations",   "sub": "All programs since founding in 2018"},
        # … same structure for each row …
        {"id": "years", "dynamic": "yearsSince", "since": 2018, "label": "Years of Impact", "sub": "Founded in 2018"},
    ],
    "denominations": json.loads(inputData["denominations_json"]),
    "churchSizes":   json.loads(inputData["churchsizes_json"]),
}
return {"file_content_b64": base64.b64encode(json.dumps(payload, indent=2).encode("utf-8")).decode("ascii")}
```

### Commit to GitHub
- **Webhook by Zapier → Custom Request**
  - Method: `PUT`
  - URL: `https://api.github.com/repos/candlerfoundry/executive-bi-dashboard/contents/assets/page-config/growth-reach.json`
  - Headers:
    - `Authorization: Bearer <fine-grained PAT with Contents R/W on this repo>`
    - `Accept: application/vnd.github+json`
    - `X-GitHub-Api-Version: 2022-11-28`
  - Body (JSON):
    ```json
    {
      "message": "Monthly refresh of growth-reach.json (automated)",
      "branch":  "main",
      "sha":     "{{sha_of_existing_file}}",
      "content": "{{base64_payload_from_previous_step}}"
    }
    ```

To get the `sha`, prepend a Webhook step:
- `GET https://api.github.com/repos/candlerfoundry/executive-bi-dashboard/contents/assets/page-config/growth-reach.json?ref=main`
- Extract `sha` from the response, pass it into the PUT step.

### Verify (optional but recommended)
- Webhook step: `GET https://candlerfoundry.netlify.app/assets/page-config/growth-reach.json`
  — wait ~90 seconds after the commit, then confirm the new content is live.
- Email notification step on failure.

## Token hygiene

- Generate a **fine-grained PAT** at GitHub → Settings → Developer settings → Personal
  access tokens → Fine-grained tokens.
- Scope it to **this repo only** with **Contents: Read and Write** + **Metadata: Read**.
- 30-day expiry. Set a calendar reminder to rotate.
- Store the PAT inside Zapier as a connection secret; never paste it into a Zap step body.

## What still needs a human

These don't have clean automated sources today. Update them manually in the JSON
(through the in-page Growth & Reach editor or by editing the file directly):

- `hero.stats[3].value` (Faculty Participating %) — unless faculty roster + foundry-
  participation columns exist in Airtable, this is a manual entry.
- `stats[id="programs"].value` — slow-moving; bump when a new program launches.
- `churchSizes` size buckets — estimated mix today; revisit when partner-church metadata
  in Airtable is firmed up.
- `denominations.rows[]` — currently estimated; revisit if registration data is updated
  to capture AME and Catholic distinctly (then add new rows for those splits).

## Recovery / rollback

If a bad Zap run writes broken JSON:
- Netlify will still build the site, but the page will render fallback defaults from
  `GROWTH_EDITOR_DEFAULTS` in `index.html`. Visitors won't see a broken page.
- To recover, either re-run the Zap or restore the previous version of
  `assets/page-config/growth-reach.json` from GitHub's file history.


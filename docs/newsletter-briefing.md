# ENERGDIVE newsletter changes

## Schedule and content rules

All briefing dates and schedule checks use **Asia/Kolkata**. The default send
cutoff remains **17:00 IST**. The internal scheduler checks every five minutes
during that hour; authenticated manual and external cron calls use the same
cutoff, weekday, live-news, preference and duplicate checks.

| Setting | Default | Accepted values |
| --- | --- | --- |
| `BRIEFING_SEND_TIME` | `17:00` | `HH:mm`, in IST |
| `BRIEFING_WEEKLY_WEEKDAY` | `friday` | Monday–Friday, or 1–5 |
| `BRIEFING_WEEK_START_WEEKDAY` | Day after weekly send day | 0–6, Sunday–Saturday |
| `BRIEFING_LOCALE` | `en` | CMS locale |

No prior configurable weekly weekday/reporting period was found in this app.
The default weekly reporting period is **previous Saturday 00:00 IST through
current Friday 17:00 IST**. The covered dates and cutoff appear in the email.
For a different configured weekday, the default reporting period starts on the
following weekday of the preceding week; set the start explicitly to retain
another editorial reporting period.

The global gate requires a weekday and at least **three unique, published News
items from the current IST date, through the edition cutoff**. Articles,
interviews, opinions, other editorial types, drafts, deleted/unpublished items,
future publications and old edited items do not contribute. A blocked weekly
edition is never moved to another weekday.

Daily Top Stories includes every eligible current-day News item, with no query,
section or template story limit. CMS pagination is exhausted, including when the
server caps page size. Weekly Top Stories includes at most one News item per
date in the reporting period. Higher numeric CMS `priority` wins; ties and empty
priorities use latest publication, then document identity. The live CMS has a
`priority` field, but all 798 records inspected had an empty value.

Featured Articles retains **three cards**, selected only from published articles,
interviews and opinions. The CMS also represents interviews as Opinion tagged
Interview; their destination uses `/interviews/`. News is excluded. Selection
includes all available types where possible and avoids consecutive repeated
selections/orders when the pool permits. The daily selection and its order are
saved and shared by daily/weekly editions and their retries.

## Delivery and preferences

The sender rechecks live CMS eligibility before queueing and again before SMTP,
including after HTML/ad preparation. It also rechecks the local subscriber and
Brevo suppression/preferences. Local member preferences take precedence;
explicit letterbox preferences follow, then Brevo preferences. Legacy letterbox
rows without a frequency use Brevo's explicit preference, falling back to daily.
List 24 membership no longer overrides weekly frequency. Monthly preferences
remain disabled and are no longer converted into daily delivery.

An unsubscribe is saved locally for both member and letterbox records before
updating Brevo. Blacklists, unsubscribe list 8 and Brevo unsubscribe attributes
are honored. Saved HTML passed through the generic email helper must reenter the
same service; an in-memory, one-use handoff is issued only after the worker's
fresh checks and atomic claim.

PostgreSQL constraints permit one delivery per normalized email/date and one per
email/frequency/reporting period. A conditional update grants the SMTP claim to
one worker. Definite provider rejections can retry the same edition while it is
still due. Timeouts, 5xx responses and interrupted `sending` records are held for
provider reconciliation; they are never automatically reclaimed. This favors
avoiding duplicate deliveries when provider acceptance is unknown. A provider
acceptance followed by an audit failure also retains its consumed claim.

Old queued/retryable deliveries expire instead of being carried forward. If a
saved story or featured item is unpublished, deleted or changes out of its
eligible content type, the frozen edition is blocked. Skip reasons appear in
processor results and logs; queued blocks retain their reason in the database.

## Publication timestamps and deployment

1. Apply `node migrations/run_025.cjs` before deploying the new worker.
2. Before allowing editorial republications or enabling the new worker, run
   `npx tsx scripts/seed-briefing-publications.ts` to baseline the publication
   ledger. This reads CMS content and writes timestamps; it does not send email.
3. Set any schedule overrides above, then deploy the app. All processes share
   the saved editions and delivery constraints in the application database.

These production database commands have **not** been run as part of this change.
The migration was applied twice and verified in an isolated PostgreSQL engine.

The publication ledger preserves the earliest observed actual CMS publication
timestamp across later edits/republications. `firstPublishedAt` is preferred if
the CMS provides it; `createdAt`, `updatedAt` and editorial `Date` are never used
to infer publication. The inspected CMS does **not** currently expose
`firstPublishedAt`. For a complete historical guarantee, backfill the ledger from
an authoritative first-publication history or enable and correctly backfill
Strapi's immutable field before rollout. A republish that already happened before
the first baseline cannot be reconstructed from the current response alone.
The user confirmed that no historical publication source is available. Existing
records therefore start from the CMS publication timestamp in the initial
baseline, with the ledger preventing subsequent edits from moving it forward.
See [Strapi's first-publication documentation](https://docs.strapi.io/cms/features/draft-and-publish#recording-the-first-publication-date).

## Images and rendered verification

The template uses original CMS uploads, rather than potentially cropped small
renditions. Image frames, news rows, text cells and actions explicitly use white
HTML `bgcolor` attributes plus inline styles. Numeric proportional dimensions
center known-size images inside padded table cells. Natural height is used when
dimensions are unavailable, allowing the cell to grow without clipping. The
fallback does not require `object-fit`; mobile CSS retains the aspect ratio.

The supplied attachment folder contained only requirements text, so the exact
two screenshots were unavailable. A live CMS interview portrait, “Electrification
Can Give Us a Big Push Towards Decarbonisation,” was downloaded and inspected:
its original 1200×1500 asset includes the full head. It remains fully visible in
both Top Stories and Featured Articles in the previews. Other fixtures cover
landscape, square and wide-logo proportions.

Verification performed:

The final suite contains **29 passing automated checks**; all **12 rendered
layout checks** passed. Project TypeScript checks passed. Targeted ESLint checks
reported no errors and one pre-existing unused-helper warning in `lib/email.ts`.

- `npm run test:briefing`: processor/template integration checks with fixed IST
  clocks and mocked external systems, plus real PostgreSQL migration, JSON
  persistence, earliest-publication and unique claim checks using PGlite.
- `npx tsc --noEmit --incremental false`: project TypeScript check.
- Targeted ESLint checks for the changed briefing code, API routes and scripts.
- `npm run preview:briefing`: offline daily/weekly HTML previews; no SMTP.
- `node scripts/check-briefing-layout.mjs`: 12 Chromium/WebKit renders at 1024,
  375 and 320 pixels, checking image proportions, cell containment, unclipped
  ancestors, white backgrounds, all story rows, horizontal overflow and fallback
  without `object-fit`. Set `BRIEFING_PLAYWRIGHT_MODULE` to an installed Playwright
  package path if it is not installed in the project.

Preview HTML, screenshots and layout results are in `scratch/briefing-preview/`.
Gmail, Outlook/Word and native Apple Mail rendering have **not** been tested.
WebKit checks are browser checks, not an Apple Mail certification. No subscriber
email or production database mutation was performed during verification.

## Changed files

| Files | Purpose |
| --- | --- |
| `lib/daily-briefing-rules.ts`, `lib/cron-scheduler.ts`, `lib/cron-jobs.ts` | Shared IST gate, configurable schedule, retry-aware timer |
| `lib/briefing-content.ts`, `lib/briefing-types.ts`, `lib/briefing-extras.ts` | Strict published content, pagination, daily/weekly selection, rotation, ancillary content |
| `lib/briefing-service.ts`, `lib/briefing-store.ts`, `lib/briefing-subscribers.ts`, `lib/briefing-dispatch-permit.ts` | Central dispatch, saved editions/publications, preference rechecks, atomic delivery |
| `lib/preference-digests.ts` | Compatible public entry point to the shared service |
| `lib/email.ts` | Render-only preview API, uncropped images, white rows, full daily feed, weekly dates, guarded legacy sends |
| `app/api/subscribe/route.ts`, `app/api/unsubscribe/route.ts` | Persist frequency and local suppression |
| `app/api/cron/preference-digests/route.ts`, `app/api/admin/test-preference-digest/route.ts` | Document shared trigger behavior |
| `migrations/025_briefing_editions.sql`, `migrations/run_025.cjs`, `scripts/seed-briefing-publications.ts` | Deployment schema, runner and first-publication baseline |
| `scripts/send-test-all-frequencies.ts`, `scripts/send-test-briefing.ts` | Remove direct SMTP/insufficient-news bypasses |
| `scripts/briefing-test-support.mjs`, `scripts/test-daily-briefing.mjs`, `scripts/test-briefing.mjs`, `scripts/test-briefing-postgres.mjs` | Automated behavioral and database checks |
| `scripts/render-briefing-preview.mjs`, `scripts/check-briefing-layout.mjs` | Repeatable offline previews and browser layout checks |
| `package.json`, `package-lock.json` | Test/preview commands and PGlite test dependency |
| `README.md`, `docs/newsletter-briefing.md`, `.gitignore` | Operational notes and exclusion of local QA artifacts |

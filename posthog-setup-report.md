<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Energdive Next.js 16 (App Router) project.

## Summary of changes

- **`instrumentation-client.ts`** (new) — Initialises `posthog-js` client-side using the `instrumentation-client` pattern for Next.js 15.3+. Uses a reverse proxy (`/ingest`) so PostHog requests route through the app and are not blocked by ad-blockers.
- **`lib/posthog-server.ts`** (new) — Singleton `posthog-node` client for server-side event capture in API routes.
- **`next.config.ts`** — Added `/ingest/*` reverse proxy rewrites for PostHog and `skipTrailingSlashRedirect: true`.
- **`.env.local`** — `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` added.
- **`components/report/ReportDownloadButton.tsx`** (new) — Thin client wrapper for the PDF download link, enabling client-side `report_download_clicked` tracking from within the server-rendered report page.

Ten events were instrumented across 9 files:

| Event | Description | File |
|---|---|---|
| `signup_otp_sent` | User initiates signup, OTP sent — top of registration funnel | `app/api/auth/signup/route.ts` |
| `user_registration_completed` | OTP verified and membership ID assigned — critical conversion | `app/api/auth/confirm-otp/route.ts` |
| `onboarding_completed` | User finishes full profile onboarding — activation event | `app/api/onboarding/submit/route.ts` |
| `newsletter_subscribed` | Newsletter subscription confirmed via Brevo sync | `app/api/subscribe/route.ts` |
| `magic_link_validated` | Re-engagement: user clicks and validates a magic link | `app/api/auth/magic-link/route.ts` |
| `content_shared` | User shares content via Facebook, Twitter, LinkedIn, or copy-link | `components/ui/share-button.tsx` |
| `article_saved` | Logged-in user saves an article for later reading | `hooks/use-article-save.ts` |
| `search_result_clicked` | User clicks a result in the global search modal | `components/global-search.tsx` |
| `membership_join_clicked` | User clicks a "Join Now" CTA on the EnergClub page | `app/energclub/page.tsx` |
| `report_download_clicked` | User clicks "Download PDF" on a report detail page | `components/report/ReportDownloadButton.tsx` |

User identification (`posthog.identify`) is called server-side at `user_registration_completed` and `onboarding_completed` to correlate anonymous and identified sessions across the funnel.

## Next steps

We've built a dashboard and five insights to monitor user behaviour based on the events just instrumented:

- [Analytics basics dashboard](/dashboard/1583878)
- [Registration Funnel](/insights/oImPdIBW) — 3-step funnel: signup initiated → OTP verified → onboarding completed
- [Newsletter Subscriptions Over Time](/insights/gubACcfi) — daily trend of new newsletter subscribers
- [Content Engagement: Saves & Shares](/insights/B8lgqYvP) — article saves and content shares over time
- [Membership Join Intent](/insights/oI15Q8jb) — "Join Now" CTA clicks broken down by page section
- [Report Downloads & Search Clicks](/insights/nGZRUQof) — high-intent content discovery events over time

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>

import posthog from "posthog-js";

const posthogDebug = process.env.NEXT_PUBLIC_POSTHOG_DEBUG === "true";
const enablePostHog = process.env.NODE_ENV === "production"
  || process.env.NEXT_PUBLIC_POSTHOG_ENABLE_IN_DEVELOPMENT === "true";

if (enablePostHog) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: posthogDebug,
  });

  // Apply the setting to an existing SDK instance during hot reloads as well.
  posthog.debug(posthogDebug);
}

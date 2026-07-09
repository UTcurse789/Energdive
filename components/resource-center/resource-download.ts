import type { EventResource } from "./types";

export const RESOURCE_PENDING_DOWNLOAD_KEY = "rc_pending_download";

export type DownloadableResource = Pick<
  EventResource,
  "slug" | "title" | "fileName" | "content_access"
> & {
  attribution?: ResourceDownloadAttribution;
};

export type PendingResourceDownload = DownloadableResource;

export type ResourceDownloadAttribution = {
  source?: string;
  sourceUrl?: string;
  landingPageUrl?: string;
  referrerUrl?: string;
  clientIp?: string;
  clientGeo?: Record<string, unknown>;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
};

export type ResourceDownloadResult =
  | {
      status: "ready";
      fileUrl: string;
      downloadUrl: string;
      fileName: string;
      title: string;
    }
  | {
      status: "unauthenticated";
    }
  | {
      status: "onboarding_required";
      redirectUrl: string;
    };

type ResourceDownloadResponse = {
  success?: boolean;
  file_url?: string;
  downloadUrl?: string;
  download_url?: string;
  fileName?: string;
  title?: string;
  error?: string;
  redirectUrl?: string;
};

function cleanValue(value: string | null) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function getParam(params: URLSearchParams, names: string[]) {
  for (const name of names) {
    const value = cleanValue(params.get(name));
    if (value) return value;
  }

  return undefined;
}

function hostnameFromUrl(value?: string) {
  if (!value) return undefined;

  try {
    return new URL(value).hostname || undefined;
  } catch {
    return undefined;
  }
}

function cleanGeoPayload(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;

  const payload = value as Record<string, unknown>;
  if (payload.error === true) return undefined;

  return payload;
}

async function fetchClientIpApiAttribution(): Promise<
  Pick<ResourceDownloadAttribution, "clientIp" | "clientGeo">
> {
  if (typeof window === "undefined") return {};

  const cacheKey = "rc_ipapi_geo";
  let cached: string | null = null;
  try {
    cached = sessionStorage.getItem(cacheKey);
  } catch {
    cached = null;
  }

  if (cached) {
    try {
      const parsed = cleanGeoPayload(JSON.parse(cached));
      return {
        clientIp: cleanValue(typeof parsed?.ip === "string" ? parsed.ip : null),
        clientGeo: parsed,
      };
    } catch {
      try {
        sessionStorage.removeItem(cacheKey);
      } catch {}
    }
  }

  try {
    const response = await fetch("https://ipapi.co/json/", {
      cache: "no-store",
    });
    if (!response.ok) return {};

    const payload = cleanGeoPayload(await response.json());
    if (!payload) return {};

    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(payload));
    } catch {}

    return {
      clientIp: cleanValue(typeof payload.ip === "string" ? payload.ip : null),
      clientGeo: payload,
    };
  } catch {
    return {};
  }
}

export function getCurrentDownloadAttribution(): ResourceDownloadAttribution {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const referrerUrl = cleanValue(document.referrer);
  const sourceUrl =
    getParam(params, ["source_url", "sourceUrl", "referrer_url", "referrerUrl"]) ||
    referrerUrl;
  const source =
    getParam(params, [
      "source",
      "download_source",
      "downloadSource",
      "partner",
      "partner_source",
      "event",
      "utm_source",
    ]) || hostnameFromUrl(sourceUrl);

  return {
    source,
    sourceUrl,
    landingPageUrl: window.location.href,
    referrerUrl,
    utmSource: getParam(params, ["utm_source"]),
    utmMedium: getParam(params, ["utm_medium"]),
    utmCampaign: getParam(params, ["utm_campaign"]),
    utmTerm: getParam(params, ["utm_term"]),
    utmContent: getParam(params, ["utm_content"]),
  };
}

export function getResourceDownloadPath(
  resource: Pick<EventResource, "slug">,
  autoDownload = false
) {
  const path = `/resource-hub/${encodeURIComponent(resource.slug)}`;
  return autoDownload ? `${path}?download=true` : path;
}

export function storePendingResourceDownload(resource: DownloadableResource) {
  const attribution = resource.attribution || getCurrentDownloadAttribution();

  localStorage.setItem(
    RESOURCE_PENDING_DOWNLOAD_KEY,
    JSON.stringify({
      slug: resource.slug,
      title: resource.title,
      fileName: resource.fileName,
      content_access: resource.content_access,
      attribution,
    })
  );
}

export function readPendingResourceDownload(): PendingResourceDownload | null {
  const pending = localStorage.getItem(RESOURCE_PENDING_DOWNLOAD_KEY);
  if (!pending) return null;

  try {
    const parsed = JSON.parse(pending) as Partial<PendingResourceDownload>;
    if (!parsed.slug) return null;

    return {
      slug: parsed.slug,
      title: parsed.title || "ENERGDIVE Resource",
      fileName: parsed.fileName || "resource-download",
      content_access: parsed.content_access,
      attribution: parsed.attribution,
    };
  } catch {
    return null;
  }
}

export function clearPendingResourceDownload() {
  localStorage.removeItem(RESOURCE_PENDING_DOWNLOAD_KEY);
}

export async function requestTrackedResourceDownload(
  resource: DownloadableResource
): Promise<ResourceDownloadResult> {
  const attribution = {
    ...(resource.attribution || getCurrentDownloadAttribution()),
    ...(await fetchClientIpApiAttribution()),
  };

  const response = await fetch("/api/resource-hub/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: resource.slug, attribution }),
  });

  const payload = (await response
    .json()
    .catch(() => ({}))) as ResourceDownloadResponse;

  if (response.status === 401) {
    return { status: "unauthenticated" };
  }

  if (response.status === 409 && payload.error === "ONBOARDING_REQUIRED") {
    return {
      status: "onboarding_required",
      redirectUrl:
        payload.redirectUrl || `/onboarding?return_to=${encodeURIComponent(getResourceDownloadPath(resource, true))}`,
    };
  }

  if (!response.ok || !payload.success || !payload.file_url) {
    throw new Error(payload.error || "Unable to prepare this download");
  }

  return {
    status: "ready",
    fileUrl: payload.file_url,
    downloadUrl: payload.downloadUrl || payload.download_url || payload.file_url,
    fileName: payload.fileName || resource.fileName,
    title: payload.title || resource.title,
  };
}

export function triggerResourceFileDownload(fileUrl: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = fileUrl;
  anchor.download = fileName;
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

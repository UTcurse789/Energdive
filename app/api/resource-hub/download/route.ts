import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getResourceCenterResource } from "@/lib/resource-center";
import { addPaperDownload, getUserProfile } from "@/lib/queries";
import { saveArticleForUser } from "@/lib/queries/saved-articles";
import { getFullUserProfile } from "@/lib/getFullUserProfile";
import { createZohoLead, type ZohoLeadData } from "@/lib/zoho-leads";
import { logEvent } from "@/lib/system-logger";
import { recordResourceDownloadEvent } from "@/lib/resource-download-events";
import { sendThirdPartyResourceDownloadEmails } from "@/lib/resource-third-party-notifications";

export const dynamic = "force-dynamic";

const RESOURCE_DOWNLOAD_SOURCE = "ENDV Resource Download";
const DEFAULT_PORTAL_SHOW = "ENERGClub";
const SHOWS_ROUTED_TO_DEFAULT_PORTAL = new Set(
  (process.env.THIRD_PARTY_RESOURCE_SHOWS || "IEW")
    .split(/[,\n;|]+/)
    .map((show) => show.trim().toUpperCase())
    .filter(Boolean)
);

type FullUserProfile = {
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  salutation?: string | null;
  phone?: string | null;
  organization?: string | null;
  job_title?: string | null;
  state?: string | null;
  country?: string | null;
  membership_id?: string | null;
  communities?: unknown;
  sub_communities?: unknown;
  industries?: unknown;
  sub_industries?: unknown;
};

type DownloadAttributionInput = {
  source?: unknown;
  sourceUrl?: unknown;
  landingPageUrl?: unknown;
  referrerUrl?: unknown;
  clientIp?: unknown;
  clientGeo?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  utmTerm?: unknown;
  utmContent?: unknown;
};

type IpApiLocation = {
  ip?: string;
  city?: string;
  region?: string;
  country_name?: string;
  country_code?: string;
  postal?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  org?: string;
  error?: boolean;
  reason?: string;
  [key: string]: unknown;
};

function cleanString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function cleanNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function safeDownloadFilename(value?: string | null) {
  const fallback = "energdive-resource.pdf";
  const normalized = (value || fallback)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);

  return normalized || fallback;
}

function cleanStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const cleaned = value
    .map((item) => cleanString(item))
    .filter((item): item is string => Boolean(item));

  return cleaned.length > 0 ? cleaned : undefined;
}

function fallbackName(email: string) {
  const localPart = email.split("@")[0] || "Member";
  const nameParts = localPart
    .replace(/[._-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  return {
    firstName: nameParts[0] || "Member",
    lastName: nameParts.slice(1).join(" ") || ".",
  };
}

function normalizeShowCode(showCode: string | null | undefined) {
  return (showCode || "").trim();
}

function normalizeClientGeo(value: unknown): IpApiLocation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const payload = value as Record<string, unknown>;
  if (payload.error === true) return null;

  return {
    ...payload,
    ip: cleanString(payload.ip),
    city: cleanString(payload.city),
    region: cleanString(payload.region),
    country_name: cleanString(payload.country_name),
    country_code: cleanString(payload.country_code),
    postal: cleanString(payload.postal),
    latitude: cleanNumber(payload.latitude),
    longitude: cleanNumber(payload.longitude),
    timezone: cleanString(payload.timezone),
    org: cleanString(payload.org),
  };
}

function normalizeAttribution(value: unknown) {
  const input =
    value && typeof value === "object" ? (value as DownloadAttributionInput) : {};
  const clientGeo = normalizeClientGeo(input.clientGeo);

  return {
    source: cleanString(input.source),
    sourceUrl: cleanString(input.sourceUrl),
    landingPageUrl: cleanString(input.landingPageUrl),
    referrerUrl: cleanString(input.referrerUrl),
    clientIp: cleanString(input.clientIp) || cleanString(clientGeo?.ip),
    clientGeo,
    utmSource: cleanString(input.utmSource),
    utmMedium: cleanString(input.utmMedium),
    utmCampaign: cleanString(input.utmCampaign),
    utmTerm: cleanString(input.utmTerm),
    utmContent: cleanString(input.utmContent),
  };
}

function hostnameFromUrl(value?: string | null) {
  if (!value) return undefined;

  try {
    return new URL(value).hostname || undefined;
  } catch {
    return undefined;
  }
}

function normalizeIpCandidate(value?: string | null) {
  if (!value) return undefined;

  let ip = value.trim();
  if (!ip) return undefined;

  if (ip.startsWith("for=")) {
    ip = ip.slice(4).trim();
  } else if (/^[a-z-]+=/i.test(ip)) {
    return undefined;
  }

  ip = ip.replace(/^"|"$/g, "").replace(/^\[|\]$/g, "");

  if (ip.toLowerCase().startsWith("::ffff:")) {
    ip = ip.slice(7);
  }

  const portMatch = ip.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
  if (portMatch) return portMatch[1];

  return ip || undefined;
}

function ipCandidates(value?: string | null) {
  return (
    value
      ?.split(",")
      .flatMap((part) => part.split(";"))
      .map(normalizeIpCandidate)
      .filter((item): item is string => Boolean(item)) || []
  );
}

function firstUsableIp(...values: Array<string | null>) {
  const candidates = values.flatMap((value) => ipCandidates(value));
  return candidates.find(isPublicIp) || candidates[0];
}

function getClientIp(req: NextRequest) {
  return firstUsableIp(
    req.headers.get("x-client-ip"),
    req.headers.get("cf-connecting-ip"),
    req.headers.get("true-client-ip"),
    req.headers.get("x-real-ip"),
    req.headers.get("x-vercel-forwarded-for"),
    req.headers.get("x-forwarded-for"),
    req.headers.get("forwarded")
  );
}

function isPublicIp(ipAddress?: string | null) {
  if (!ipAddress) return false;
  const ip = ipAddress.trim().toLowerCase();

  if (
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("169.254.") ||
    ip.startsWith("fc") ||
    ip.startsWith("fd") ||
    ip.startsWith("fe80:")
  ) {
    return false;
  }

  const match172 = ip.match(/^172\.(\d+)\./);
  if (match172) {
    const secondOctet = Number(match172[1]);
    if (secondOctet >= 16 && secondOctet <= 31) return false;
  }

  return true;
}

async function fetchIpApiLocation(ipAddress?: string) {
  if (!isPublicIp(ipAddress)) return null;

  try {
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as IpApiLocation;
    if (payload.error) {
      console.warn("[RESOURCE_DOWNLOAD] ipapi lookup failed:", payload.reason);
      return null;
    }

    return payload;
  } catch (error) {
    console.warn("[RESOURCE_DOWNLOAD] ipapi lookup failed:", error);
    return null;
  }
}

function resolveDownloadSource({
  attribution,
  requestReferrer,
  origin,
  resourceShow,
  eventName,
}: {
  attribution: ReturnType<typeof normalizeAttribution>;
  requestReferrer?: string | null;
  origin?: string | null;
  resourceShow?: string | null;
  eventName?: string | null;
}) {
  return (
    attribution.source ||
    hostnameFromUrl(attribution.sourceUrl) ||
    hostnameFromUrl(attribution.referrerUrl) ||
    hostnameFromUrl(requestReferrer) ||
    hostnameFromUrl(origin) ||
    cleanString(resourceShow) ||
    cleanString(eventName) ||
    "direct"
  );
}

function shouldRouteToShowOwner(showCode: string) {
  const normalized = showCode.trim().toUpperCase();
  return (
    Boolean(normalized) &&
    normalized !== DEFAULT_PORTAL_SHOW.toUpperCase() &&
    !SHOWS_ROUTED_TO_DEFAULT_PORTAL.has(normalized)
  );
}

function isThirdPartyShow(showCode?: string | null) {
  const normalized = normalizeShowCode(showCode).toUpperCase();
  return SHOWS_ROUTED_TO_DEFAULT_PORTAL.has(normalized);
}

function buildLeadData({
  email,
  fullUser,
  leadKind,
  resource,
  show,
}: {
  email: string;
  fullUser: FullUserProfile | null;
  leadKind: "portal" | "show";
  resource: NonNullable<Awaited<ReturnType<typeof getResourceCenterResource>>>;
  show: string;
}): ZohoLeadData {
  const fallback = fallbackName(email);
  const firstName = cleanString(fullUser?.first_name) || fallback.firstName;
  const lastName = cleanString(fullUser?.last_name) || fallback.lastName;
  const communities = cleanStringArray(fullUser?.communities);
  const subCommunities = cleanStringArray(fullUser?.sub_communities);
  const industries = cleanStringArray(fullUser?.industries);
  const subIndustries = cleanStringArray(fullUser?.sub_industries);
  const resourceShow = normalizeShowCode(resource.showCode);

  return {
    First_Name: firstName,
    Last_Name: lastName,
    Salutation: cleanString(fullUser?.salutation),
    Email: email,
    Phone: cleanString(fullUser?.phone),
    Mobile: cleanString(fullUser?.phone),
    Company: cleanString(fullUser?.organization),
    Designation: cleanString(fullUser?.job_title),
    Lead_Source: RESOURCE_DOWNLOAD_SOURCE,
    Show: show,
    Industry: industries?.[0],
    Industry_Sub_Category: subIndustries?.[0],
    Community: communities,
    Sub_Community: subCommunities,
    Community_Portal: communities && subCommunities ? undefined : subCommunities,
    Invite_Source: "EnergClub",
    Membership_ID: cleanString(fullUser?.membership_id),
    City: cleanString(fullUser?.state),
    Country: cleanString(fullUser?.country),
    Description: [
      `Resource download: ${resource.title}`,
      `Resource slug: ${resource.slug}`,
      `Resource type: ${resource.resource_type}`,
      resourceShow ? `Resource show: ${resourceShow}` : "",
      `Lead kind: ${leadKind === "portal" ? "Default portal route" : "Show owner route"}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

async function createResourceDownloadLeads({
  email,
  fullUser,
  resource,
}: {
  email: string;
  fullUser: FullUserProfile | null;
  resource: NonNullable<Awaited<ReturnType<typeof getResourceCenterResource>>>;
}) {
  if (!email || email.endsWith("@phone.energdive.com")) {
    return [{ kind: "crm", status: "skipped", reason: "missing_or_dummy_email" }];
  }

  const showCode = normalizeShowCode(resource.showCode);
  const routeToShowOwner = shouldRouteToShowOwner(showCode);

  const leadJobs: Array<{
    kind: "portal" | "show";
    leadData: ZohoLeadData;
  }> = [
    {
      kind: "portal",
      leadData: buildLeadData({
        email,
        fullUser,
        leadKind: "portal",
        resource,
        show: DEFAULT_PORTAL_SHOW,
      }),
    },
  ];

  if (routeToShowOwner) {
    leadJobs.push({
      kind: "show",
      leadData: buildLeadData({
        email,
        fullUser,
        leadKind: "show",
        resource,
        show: showCode,
      }),
    });
  }

  const settled = await Promise.allSettled(
    leadJobs.map(async (job) => {
      const result = await createZohoLead(job.leadData);
      await logEvent(
        "CRM_SYNC_SUCCESS",
        email,
        `Resource download ${job.kind} lead created: ${result.id}`
      );

      return {
        kind: job.kind,
        status: "created",
        leadId: result.id,
      };
    })
  );

  return settled.map((result, index) => {
    const kind = leadJobs[index]?.kind || "unknown";

    if (result.status === "fulfilled") {
      return result.value;
    }

    const message =
      result.reason instanceof Error ? result.reason.message : String(result.reason);
    console.error(`[RESOURCE_DOWNLOAD] ${kind} CRM lead failed:`, result.reason);
    void logEvent("CRM_SYNC_FAILED", email, `Resource download ${kind} lead failed: ${message}`);

    return {
      kind,
      status: "failed",
      error: message,
    };
  });
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const slug = cleanString(req.nextUrl.searchParams.get("slug"));
    if (!slug) {
      return new NextResponse("slug is required", { status: 400 });
    }

    const [clerkUser, resource] = await Promise.all([
      currentUser(),
      getResourceCenterResource(slug),
    ]);

    if (!resource) {
      return new NextResponse("Resource not found", { status: 404 });
    }

    if (!resource.file_url) {
      return new NextResponse("File is not available for this resource", {
        status: 404,
      });
    }

    const email =
      clerkUser?.primaryEmailAddress?.emailAddress ||
      clerkUser?.emailAddresses?.[0]?.emailAddress ||
      "";
    const profile = await getUserProfile(userId, email);
    const clerkOnboardingCompleted =
      clerkUser?.publicMetadata?.onboarding_completed === true;
    const onboardingCompleted =
      profile?.onboarding_completed === true || clerkOnboardingCompleted;

    if (!onboardingCompleted) {
      return new NextResponse("Onboarding required", { status: 403 });
    }

    const fileResponse = await fetch(resource.file_url, { cache: "no-store" });
    if (!fileResponse.ok || !fileResponse.body) {
      console.error("[RESOURCE_DOWNLOAD] Failed to proxy resource file", {
        slug,
        status: fileResponse.status,
        statusText: fileResponse.statusText,
      });
      return new NextResponse("Unable to fetch resource file", { status: 502 });
    }

    const filename = safeDownloadFilename(resource.fileName || `${resource.slug}.pdf`);

    return new NextResponse(fileResponse.body, {
      headers: {
        "Content-Type": fileResponse.headers.get("content-type") || "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[RESOURCE_DOWNLOAD] Failed to proxy download:", error);
    return new NextResponse("Unable to download resource file", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      slug?: unknown;
      attribution?: unknown;
    };
    const slug = cleanString(body.slug);
    const attribution = normalizeAttribution(body.attribution);

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const [clerkUser, resource] = await Promise.all([
      currentUser(),
      getResourceCenterResource(slug),
    ]);

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    if (!resource.file_url) {
      return NextResponse.json(
        { error: "File is not available for this resource" },
        { status: 404 }
      );
    }

    const email =
      clerkUser?.primaryEmailAddress?.emailAddress ||
      clerkUser?.emailAddresses?.[0]?.emailAddress ||
      "";
    const profile = await getUserProfile(userId, email);
    const clerkOnboardingCompleted =
      clerkUser?.publicMetadata?.onboarding_completed === true;
    const onboardingCompleted =
      profile?.onboarding_completed === true || clerkOnboardingCompleted;

    if (!onboardingCompleted) {
      const returnTo = `/resource-hub/${encodeURIComponent(resource.slug)}?download=true`;
      return NextResponse.json(
        {
          error: "ONBOARDING_REQUIRED",
          redirectUrl: `/onboarding?return_to=${encodeURIComponent(returnTo)}`,
        },
        { status: 409 }
      );
    }

    const identity = {
      clerkId: userId,
      email: email || profile?.email || null,
      firstName: clerkUser?.firstName || profile?.first_name || null,
      lastName: clerkUser?.lastName || profile?.last_name || null,
    };

    try {
      await saveArticleForUser(identity, {
        title: resource.title,
        url: `/resource-hub/${resource.slug}`,
      });
    } catch (error) {
      console.error("[RESOURCE_DOWNLOAD] Failed to save dashboard article:", error);
    }

    try {
      await addPaperDownload(userId, resource.slug, resource.title, resource.file_url);
    } catch (error) {
      console.error("[RESOURCE_DOWNLOAD] Failed to save download record:", error);
    }

    const fullUser = (await getFullUserProfile(userId).catch((error) => {
      console.error("[RESOURCE_DOWNLOAD] Failed to load full user profile:", error);
      return null;
    })) as FullUserProfile | null;

    const requestReferrerUrl = cleanString(req.headers.get("referer"));
    const originUrl = cleanString(req.headers.get("origin"));
    const headerIpAddress = getClientIp(req);
    const ipAddress = isPublicIp(headerIpAddress)
      ? headerIpAddress
      : isPublicIp(attribution.clientIp)
        ? attribution.clientIp
        : headerIpAddress || attribution.clientIp;
    const userAgent = cleanString(req.headers.get("user-agent"));
    const geo = (await fetchIpApiLocation(ipAddress)) || attribution.clientGeo;
    const downloadSource = resolveDownloadSource({
      attribution,
      requestReferrer: requestReferrerUrl,
      origin: originUrl,
      resourceShow: resource.showCode,
      eventName: resource.eventName,
    });

    let eventId: number;
    try {
      eventId = await recordResourceDownloadEvent({
        userId: profile?.id ?? null,
        clerkId: userId,
        email: identity.email || cleanString(fullUser?.email) || profile?.email || "",
        firstName: identity.firstName || cleanString(fullUser?.first_name) || null,
        lastName: identity.lastName || cleanString(fullUser?.last_name) || null,
        phone: cleanString(fullUser?.phone) || profile?.phone || null,
        company: cleanString(fullUser?.organization) || profile?.organization || null,
        jobTitle: cleanString(fullUser?.job_title) || profile?.job_title || null,
        resourceSlug: resource.slug,
        resourceTitle: resource.title,
        resourceType: resource.resource_type,
        resourceShow: resource.showCode,
        resourceEventName: resource.eventName,
        resourceYear: resource.year,
        resourceFileName: resource.fileName,
        resourceFileUrl: resource.file_url,
        downloadSource,
        sourceUrl: attribution.sourceUrl || attribution.referrerUrl || null,
        landingPageUrl: attribution.landingPageUrl || null,
        referrerUrl: attribution.referrerUrl || null,
        requestReferrerUrl,
        originUrl,
        utmSource: attribution.utmSource || null,
        utmMedium: attribution.utmMedium || null,
        utmCampaign: attribution.utmCampaign || null,
        utmTerm: attribution.utmTerm || null,
        utmContent: attribution.utmContent || null,
        ipAddress,
        userAgent,
        city: cleanString(geo?.city),
        region: cleanString(geo?.region),
        country: cleanString(geo?.country_name) || cleanString(geo?.country),
        countryCode: cleanString(geo?.country_code) || cleanString(geo?.country),
        postal: cleanString(geo?.postal),
        latitude: cleanNumber(geo?.latitude) ?? null,
        longitude: cleanNumber(geo?.longitude) ?? null,
        timezone: cleanString(geo?.timezone),
        org: cleanString(geo?.org),
        geo,
      });
    } catch (error) {
      console.error("[RESOURCE_DOWNLOAD] Failed to record download event:", error);
      return NextResponse.json(
        {
          error: "DOWNLOAD_EVENT_RECORD_FAILED",
          details: "Download audit record could not be saved",
        },
        { status: 500 }
      );
    }

    const crmEmail = email || cleanString(fullUser?.email) || profile?.email || "";
    const crmResults = await createResourceDownloadLeads({
      email: crmEmail,
      fullUser,
      resource,
    });

    const thirdPartyEmailResults = isThirdPartyShow(resource.showCode)
      ? await sendThirdPartyResourceDownloadEmails({
          downloadEventId: eventId,
          resource,
          user: {
            email: crmEmail,
            firstName: identity.firstName || cleanString(fullUser?.first_name) || null,
            lastName: identity.lastName || cleanString(fullUser?.last_name) || null,
            phone: cleanString(fullUser?.phone) || profile?.phone || null,
            company: cleanString(fullUser?.organization) || profile?.organization || null,
            jobTitle: cleanString(fullUser?.job_title) || profile?.job_title || null,
          },
          downloadedAt: new Date(),
          downloadSource,
          landingPageUrl: attribution.landingPageUrl || requestReferrerUrl || null,
          location: {
            city: cleanString(geo?.city),
            region: cleanString(geo?.region),
            country: cleanString(geo?.country_name) || cleanString(geo?.country),
            countryCode: cleanString(geo?.country_code) || cleanString(geo?.country),
          },
        }).catch((error) => {
          const message = error instanceof Error ? error.message : String(error);
          console.error("[RESOURCE_DOWNLOAD] Third-party notification failed:", error);
          void logEvent(
            "BREVO_SYNC_FAILED",
            crmEmail,
            `Third-party resource download email failed: ${message}`
          );
          return [
            {
              recipientEmail: null,
              status: "failed" as const,
              error: message,
            },
          ];
        })
      : [];

    return NextResponse.json({
      success: true,
      file_url: resource.file_url,
      downloadUrl: `/api/resource-hub/download?slug=${encodeURIComponent(resource.slug)}`,
      fileName: resource.fileName,
      title: resource.title,
      downloadEventId: eventId,
      crm: crmResults,
      thirdPartyEmails: thirdPartyEmailResults,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[RESOURCE_DOWNLOAD] Failed:", error);
    return NextResponse.json(
      { error: "Unable to prepare resource download", details: message },
      { status: 500 }
    );
  }
}

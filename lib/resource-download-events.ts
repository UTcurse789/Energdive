import { query } from "@/lib/db";

export type ResourceDownloadEventInput = {
  userId?: number | null;
  clerkId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  company?: string | null;
  jobTitle?: string | null;

  resourceSlug: string;
  resourceTitle: string;
  resourceType?: string | null;
  resourceShow?: string | null;
  resourceEventName?: string | null;
  resourceYear?: number | null;
  resourceFileName?: string | null;
  resourceFileUrl?: string | null;

  downloadSource?: string | null;
  sourceUrl?: string | null;
  landingPageUrl?: string | null;
  referrerUrl?: string | null;
  requestReferrerUrl?: string | null;
  originUrl?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;

  ipAddress?: string | null;
  userAgent?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  countryCode?: string | null;
  postal?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  org?: string | null;
  geo?: Record<string, unknown> | null;
};

function emptyToNull(value: string | null | undefined) {
  return value && value.trim() ? value.trim() : null;
}

export async function recordResourceDownloadEvent(
  input: ResourceDownloadEventInput
): Promise<number> {
  const result = await query<{ id: number }>(
    `INSERT INTO resource_download_events (
       user_id, clerk_id, email, first_name, last_name, phone, company, job_title,
       resource_slug, resource_title, resource_type, resource_show,
       resource_event_name, resource_year, resource_file_name, resource_file_url,
       download_source, source_url, landing_page_url, referrer_url,
       request_referrer_url, origin_url,
       utm_source, utm_medium, utm_campaign, utm_term, utm_content,
       ip_address, user_agent, city, region, country, country_code, postal,
       latitude, longitude, timezone, org, geo, downloaded_at, created_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8,
       $9, $10, $11, $12,
       $13, $14, $15, $16,
       $17, $18, $19, $20,
       $21, $22,
       $23, $24, $25, $26, $27,
       $28, $29, $30, $31, $32, $33, $34,
       $35, $36, $37, $38, $39::jsonb, NOW(), NOW()
     )
     RETURNING id`,
    [
      input.userId ?? null,
      input.clerkId,
      input.email,
      emptyToNull(input.firstName),
      emptyToNull(input.lastName),
      emptyToNull(input.phone),
      emptyToNull(input.company),
      emptyToNull(input.jobTitle),
      input.resourceSlug,
      input.resourceTitle,
      emptyToNull(input.resourceType),
      emptyToNull(input.resourceShow),
      emptyToNull(input.resourceEventName),
      input.resourceYear ?? null,
      emptyToNull(input.resourceFileName),
      emptyToNull(input.resourceFileUrl),
      emptyToNull(input.downloadSource),
      emptyToNull(input.sourceUrl),
      emptyToNull(input.landingPageUrl),
      emptyToNull(input.referrerUrl),
      emptyToNull(input.requestReferrerUrl),
      emptyToNull(input.originUrl),
      emptyToNull(input.utmSource),
      emptyToNull(input.utmMedium),
      emptyToNull(input.utmCampaign),
      emptyToNull(input.utmTerm),
      emptyToNull(input.utmContent),
      emptyToNull(input.ipAddress),
      emptyToNull(input.userAgent),
      emptyToNull(input.city),
      emptyToNull(input.region),
      emptyToNull(input.country),
      emptyToNull(input.countryCode),
      emptyToNull(input.postal),
      input.latitude ?? null,
      input.longitude ?? null,
      emptyToNull(input.timezone),
      emptyToNull(input.org),
      input.geo ? JSON.stringify(input.geo) : null,
    ]
  );

  return result.rows[0].id;
}

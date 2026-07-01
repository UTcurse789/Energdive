import { query } from "@/lib/db";
import { sendBrevoTemplateEmail } from "@/lib/brevo-template-email";

type ThirdPartyResource = {
  slug: string;
  title: string;
  resource_type?: string | null;
  showCode?: string | null;
  eventName?: string | null;
  year?: number | null;
  fileName?: string | null;
  thirdPartyNotificationEmails?: string[];
};

type ThirdPartyUser = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  company?: string | null;
  jobTitle?: string | null;
};

type ThirdPartyLocation = {
  city?: string | null;
  region?: string | null;
  country?: string | null;
  countryCode?: string | null;
};

export type ThirdPartyResourceEmailInput = {
  downloadEventId: number;
  resource: ThirdPartyResource;
  user: ThirdPartyUser;
  downloadedAt?: Date;
  downloadSource?: string | null;
  landingPageUrl?: string | null;
  location?: ThirdPartyLocation;
};

type NotificationStatus = "sent" | "failed" | "skipped";

export type ThirdPartyResourceEmailResult = {
  recipientEmail: string | null;
  status: NotificationStatus;
  messageId?: string | null;
  error?: string;
  reason?: string;
};

const DEFAULT_TEMPLATE_ID = 35;

function cleanString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeShowCode(value?: string | null) {
  return (value || "").trim().toUpperCase();
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseEmailList(value?: string | null) {
  if (!value) return [];

  return value
    .split(/[,\n;]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(validEmail);
}

function getTemplateId() {
  const raw = process.env.BREVO_THIRD_PARTY_RESOURCE_TEMPLATE_ID;
  const parsed = Number(raw || DEFAULT_TEMPLATE_ID);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TEMPLATE_ID;
}

function getMappedRecipients(showCode: string) {
  const mapping = process.env.THIRD_PARTY_RESOURCE_NOTIFY_EMAILS || "";
  const normalizedShow = normalizeShowCode(showCode);
  if (!normalizedShow || !mapping.trim()) return [];

  for (const entry of mapping.split("|")) {
    const separatorIndex = entry.indexOf(":");
    if (separatorIndex < 0) continue;

    const key = normalizeShowCode(entry.slice(0, separatorIndex));
    if (key !== normalizedShow) continue;

    return parseEmailList(entry.slice(separatorIndex + 1));
  }

  return [];
}

function uniqueEmails(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim().toLowerCase()))).filter(validEmail);
}

export function getThirdPartyResourceRecipients(resource: ThirdPartyResource) {
  return uniqueEmails([
    ...(resource.thirdPartyNotificationEmails || []),
    ...getMappedRecipients(resource.showCode || ""),
  ]);
}

function buildUserName(user: ThirdPartyUser) {
  const fullName = [user.firstName, user.lastName]
    .map((item) => cleanString(item))
    .filter(Boolean)
    .join(" ");

  if (fullName) return fullName;
  return user.email.split("@")[0] || "Unknown visitor";
}

function formatDownloadedAt(value?: Date) {
  const date = value || new Date();
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function buildTemplateParams(input: ThirdPartyResourceEmailInput) {
  const userName = buildUserName(input.user);
  const resourceShow = input.resource.showCode || "";
  const location = input.location || {};

  return {
    user_name: userName,
    user_email: input.user.email,
    user_phone: input.user.phone || "",
    user_company: input.user.company || "",
    user_job_title: input.user.jobTitle || "",
    user_city: location.city || "",
    user_region: location.region || "",
    user_country: location.country || "",
    user_country_code: location.countryCode || "",

    resource_title: input.resource.title,
    resource_slug: input.resource.slug,
    resource_type: input.resource.resource_type || "",
    resource_show: resourceShow,
    resource_event_name: input.resource.eventName || resourceShow,
    resource_year: input.resource.year || "",
    resource_file_name: input.resource.fileName || "",

    download_source: input.downloadSource || "direct",
    downloaded_at: formatDownloadedAt(input.downloadedAt),
    landing_page_url: input.landingPageUrl || "",
  };
}

async function recordNotification({
  downloadEventId,
  templateId,
  recipientEmail,
  showCode,
  resource,
  userEmail,
  status,
  messageId,
  errorMessage,
  params,
}: {
  downloadEventId: number;
  templateId: number;
  recipientEmail: string | null;
  showCode: string | null;
  resource: ThirdPartyResource;
  userEmail: string;
  status: NotificationStatus;
  messageId?: string | null;
  errorMessage?: string | null;
  params: Record<string, unknown>;
}) {
  await query(
    `INSERT INTO resource_third_party_email_notifications (
       download_event_id, template_id, recipient_email, show_code,
       resource_slug, resource_title, user_email, status, message_id,
       error_message, params, sent_at, created_at
     ) VALUES (
       $1, $2, $3, $4,
       $5, $6, $7, $8, $9,
       $10, $11::jsonb, CASE WHEN $8 = 'sent' THEN NOW() ELSE NULL END, NOW()
     )`,
    [
      downloadEventId,
      templateId,
      recipientEmail,
      showCode,
      resource.slug,
      resource.title,
      userEmail,
      status,
      messageId || null,
      errorMessage || null,
      JSON.stringify(params),
    ]
  );
}

export async function sendThirdPartyResourceDownloadEmails(
  input: ThirdPartyResourceEmailInput
): Promise<ThirdPartyResourceEmailResult[]> {
  const templateId = getTemplateId();
  const showCode = normalizeShowCode(input.resource.showCode);
  const recipients = getThirdPartyResourceRecipients(input.resource);
  const params = buildTemplateParams(input);

  if (recipients.length === 0) {
    try {
      await recordNotification({
        downloadEventId: input.downloadEventId,
        templateId,
        recipientEmail: null,
        showCode,
        resource: input.resource,
        userEmail: input.user.email,
        status: "skipped",
        errorMessage: "No third-party recipient configured",
        params,
      });
    } catch (error) {
      console.error("[RESOURCE_DOWNLOAD] Failed to log skipped third-party email:", error);
    }

    return [
      {
        recipientEmail: null,
        status: "skipped",
        reason: "No third-party recipient configured",
      },
    ];
  }

  const results: ThirdPartyResourceEmailResult[] = [];

  for (const recipientEmail of recipients) {
    try {
      const response = await sendBrevoTemplateEmail({
        to: [{ email: recipientEmail }],
        templateId,
        params,
        tags: ["resource-download", "third-party-resource"],
      });

      await recordNotification({
        downloadEventId: input.downloadEventId,
        templateId,
        recipientEmail,
        showCode,
        resource: input.resource,
        userEmail: input.user.email,
        status: "sent",
        messageId: response.messageId,
        params,
      });

      results.push({
        recipientEmail,
        status: "sent",
        messageId: response.messageId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[RESOURCE_DOWNLOAD] Third-party email failed:", {
        recipientEmail,
        showCode,
        message,
      });

      try {
        await recordNotification({
          downloadEventId: input.downloadEventId,
          templateId,
          recipientEmail,
          showCode,
          resource: input.resource,
          userEmail: input.user.email,
          status: "failed",
          errorMessage: message,
          params,
        });
      } catch (logError) {
        console.error("[RESOURCE_DOWNLOAD] Failed to log third-party email failure:", logError);
      }

      results.push({
        recipientEmail,
        status: "failed",
        error: message,
      });
    }
  }

  return results;
}

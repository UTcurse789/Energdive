import crypto from "crypto";
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { syncVerifiedUserToBrevo } from "@/lib/brevoSync";
import { extractIpAddress, logConsent } from "@/lib/consent-logger";
import { getClient, query } from "@/lib/db";
import { CURRENT_CONSENT_VERSION } from "@/lib/data-provenance";
import { sendMembershipWelcomeCardEmail } from "@/lib/email";
import { issueMagicToken } from "@/lib/queries";
import { logEvent } from "@/lib/system-logger";
import { createZohoLead } from "@/lib/zoho-leads";

const LOCAL_WEBHOOK_SECRET = "local-backstage-secret";

function getWebhookSecret() {
    const configuredSecret =
        process.env.ZOHO_BACKSTAGE_WEBHOOK_SECRET || process.env.ZOHO_WEBHOOK_SECRET || "";

    if (configuredSecret) {
        return configuredSecret;
    }

    return process.env.NODE_ENV === "development" ? LOCAL_WEBHOOK_SECRET : "";
}

type WebhookBody = Record<string, unknown>;

type NormalizedBackstageRegistration = {
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phone?: string;
    company?: string;
    designation?: string;
    country?: string;
    state?: string;
    eventId?: string;
    eventName?: string;
    registrationId?: string;
    ticketName?: string;
};

type MemberProvisionResult = {
    userId: number;
    membershipId: string;
    alreadyMember: boolean;
    joinedAt: Date;
};

const PEOPLE_OBJECT_KEYS = aliasSet([
    "attendee",
    "attendee_details",
    "attendeeDetails",
    "participant",
    "registrant",
    "registration",
    "contact",
    "ticket_buyer",
    "ticketBuyer",
    "buyer",
    "user",
]);

const EVENT_OBJECT_KEYS = aliasSet(["event", "event_details", "eventDetails", "program"]);

const EMAIL_KEYS = aliasSet([
    "email",
    "Email",
    "email_address",
    "emailAddress",
    "Email Address",
    "attendee_email",
    "attendeeEmail",
    "registrant_email",
    "participant_email",
]);

const FIRST_NAME_KEYS = aliasSet([
    "first_name",
    "firstName",
    "First Name",
    "First_Name",
    "given_name",
    "givenName",
]);

const LAST_NAME_KEYS = aliasSet([
    "last_name",
    "lastName",
    "Last Name",
    "Last_Name",
    "surname",
    "family_name",
    "familyName",
]);

const FULL_NAME_KEYS = aliasSet([
    "full_name",
    "fullName",
    "Full Name",
    "Full_Name",
    "attendee_name",
    "attendeeName",
    "registrant_name",
    "participant_name",
]);

const NAME_KEYS = aliasSet([...Array.from(FULL_NAME_KEYS), "name", "Name"]);

const PHONE_KEYS = aliasSet([
    "phone",
    "Phone",
    "mobile",
    "Mobile",
    "mobile_number",
    "mobileNumber",
    "Mobile Number",
    "contact_number",
    "Contact Number",
]);

const COMPANY_KEYS = aliasSet([
    "company",
    "Company",
    "organization",
    "organisation",
    "Organization",
    "Organisation",
    "institution",
    "Institution",
]);

const DESIGNATION_KEYS = aliasSet([
    "designation",
    "Designation",
    "job_title",
    "jobTitle",
    "Job Title",
    "title",
    "Title",
]);

const COUNTRY_KEYS = aliasSet(["country", "Country"]);
const STATE_KEYS = aliasSet(["state", "State", "city", "City", "location", "Location"]);
const EVENT_ID_KEYS = aliasSet(["event_id", "eventId", "Event ID", "event_code", "eventCode"]);
const EVENT_NAME_KEYS = aliasSet(["event_name", "eventName", "Event Name", "event_title", "eventTitle"]);
const REGISTRATION_ID_KEYS = aliasSet([
    "registration_id",
    "registrationId",
    "Registration ID",
    "attendee_id",
    "attendeeId",
    "ticket_id",
    "ticketId",
    "order_id",
    "orderId",
]);
const TICKET_NAME_KEYS = aliasSet(["ticket_name", "ticketName", "Ticket Name", "ticket_type", "ticketType"]);

function aliasSet(keys: string[]) {
    return new Set(keys.map(normalizeKey));
}

function normalizeKey(key: string) {
    return key.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value: unknown): string | undefined {
    if (value === null || value === undefined) return undefined;

    if (Array.isArray(value)) {
        for (const item of value) {
            const cleaned = cleanString(item);
            if (cleaned) return cleaned;
        }
        return undefined;
    }

    if (isRecord(value)) {
        return (
            cleanString(value.value) ||
            cleanString(value.name) ||
            cleanString(value.display_value) ||
            cleanString(value.displayValue)
        );
    }

    const cleaned = String(value).trim();
    if (!cleaned) return undefined;

    const lowered = cleaned.toLowerCase();
    if (["undefined", "null", "none", "n/a", "na", "-"].includes(lowered)) {
        return undefined;
    }

    return cleaned;
}

function findValueByAlias(value: unknown, aliases: Set<string>, depth = 0): unknown {
    if (depth > 6 || value === null || value === undefined) return undefined;

    if (Array.isArray(value)) {
        for (const item of value) {
            const found = findValueByAlias(item, aliases, depth + 1);
            if (found !== undefined && found !== null) return found;
        }
        return undefined;
    }

    if (!isRecord(value)) return undefined;

    for (const [key, raw] of Object.entries(value)) {
        if (aliases.has(normalizeKey(key))) {
            return raw;
        }
    }

    for (const raw of Object.values(value)) {
        const found = findValueByAlias(raw, aliases, depth + 1);
        if (found !== undefined && found !== null) return found;
    }

    return undefined;
}

function findString(value: unknown, aliases: Set<string>) {
    return cleanString(findValueByAlias(value, aliases));
}

function findTopLevelString(body: WebhookBody, aliases: Set<string>) {
    for (const [key, raw] of Object.entries(body)) {
        if (aliases.has(normalizeKey(key))) {
            return cleanString(raw);
        }
    }
    return undefined;
}

function findStringInObjects(value: unknown, objectAliases: Set<string>, fieldAliases: Set<string>, depth = 0): string | undefined {
    if (depth > 6 || value === null || value === undefined) return undefined;

    if (Array.isArray(value)) {
        for (const item of value) {
            const found = findStringInObjects(item, objectAliases, fieldAliases, depth + 1);
            if (found) return found;
        }
        return undefined;
    }

    if (!isRecord(value)) return undefined;

    for (const [key, raw] of Object.entries(value)) {
        if (objectAliases.has(normalizeKey(key))) {
            const found = cleanString(findValueByAlias(raw, fieldAliases));
            if (found) return found;
        }
    }

    for (const raw of Object.values(value)) {
        const found = findStringInObjects(raw, objectAliases, fieldAliases, depth + 1);
        if (found) return found;
    }

    return undefined;
}

function splitName(fullName: string | undefined, fallbackEmail: string) {
    const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
        const localPart = fallbackEmail.split("@")[0]?.replace(/[._-]+/g, " ").trim();
        const fallbackParts = localPart ? localPart.split(/\s+/).filter(Boolean) : [];
        const fallbackName = fallbackParts
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");

        return {
            firstName: fallbackParts[0] ? fallbackName.split(/\s+/)[0] : "Member",
            lastName: fallbackParts.length > 1 ? fallbackName.split(/\s+/).slice(1).join(" ") : "",
        };
    }

    return {
        firstName: parts[0],
        lastName: parts.slice(1).join(" "),
    };
}

function normalizeRegistration(body: WebhookBody): NormalizedBackstageRegistration | null {
    const email = findString(body, EMAIL_KEYS)?.toLowerCase();
    if (!email) return null;

    const eventName =
        findStringInObjects(body, EVENT_OBJECT_KEYS, NAME_KEYS) ||
        findString(body, EVENT_NAME_KEYS);

    const contextualFullName = findStringInObjects(body, PEOPLE_OBJECT_KEYS, NAME_KEYS);
    const topLevelFullName =
        findTopLevelString(body, FULL_NAME_KEYS) ||
        findTopLevelString(body, aliasSet(["name", "Name"]));
    const fullNameCandidate =
        contextualFullName ||
        findString(body, FULL_NAME_KEYS) ||
        (topLevelFullName && topLevelFullName !== eventName ? topLevelFullName : undefined);

    const split = splitName(fullNameCandidate, email);
    const firstName = findString(body, FIRST_NAME_KEYS) || split.firstName;
    const lastName = findString(body, LAST_NAME_KEYS) || split.lastName;
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Member";

    return {
        email,
        firstName,
        lastName,
        fullName,
        phone: findString(body, PHONE_KEYS),
        company: findString(body, COMPANY_KEYS),
        designation: findString(body, DESIGNATION_KEYS),
        country: findString(body, COUNTRY_KEYS),
        state: findString(body, STATE_KEYS),
        eventId: findString(body, EVENT_ID_KEYS) || findStringInObjects(body, EVENT_OBJECT_KEYS, EVENT_ID_KEYS),
        eventName,
        registrationId: findString(body, REGISTRATION_ID_KEYS),
        ticketName: findString(body, TICKET_NAME_KEYS),
    };
}

async function parseWebhookBody(req: NextRequest): Promise<WebhookBody> {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        const parsed = await req.json();
        return isRecord(parsed) ? parsed : { payload: parsed };
    }

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        const body: WebhookBody = {};
        formData.forEach((value, key) => {
            body[key] = typeof value === "string" ? value : value.name;
        });
        return body;
    }

    const text = await req.text();
    if (!text.trim()) return {};

    try {
        const parsed = JSON.parse(text);
        return isRecord(parsed) ? parsed : { payload: parsed };
    } catch {
        return Object.fromEntries(new URLSearchParams(text).entries());
    }
}

function getProvidedSecret(req: NextRequest, body: WebhookBody) {
    const authorization = req.headers.get("authorization") || "";
    const bearer = authorization.toLowerCase().startsWith("bearer ")
        ? authorization.slice("bearer ".length).trim()
        : "";

    return (
        req.headers.get("x-webhook-secret") ||
        req.headers.get("x-zoho-webhook-secret") ||
        bearer ||
        req.nextUrl.searchParams.get("secret") ||
        cleanString(body.secret) ||
        ""
    );
}

function isDryRunRequest(req: NextRequest, body: WebhookBody) {
    const dryRunValue =
        req.nextUrl.searchParams.get("dryRun") ||
        req.nextUrl.searchParams.get("dry_run") ||
        cleanString(body.dryRun) ||
        cleanString(body.dry_run) ||
        "";

    return ["1", "true", "yes"].includes(dryRunValue.toLowerCase());
}

async function ensureClerkMember(registration: NormalizedBackstageRegistration) {
    const client = await clerkClient();
    const existingUsers = await client.users.getUserList({
        emailAddress: [registration.email],
    });

    const publicMetadata = {
        source: "backstage",
        onboarding_completed: true,
        backstage_event_id: registration.eventId || null,
        backstage_event_name: registration.eventName || null,
        backstage_registration_id: registration.registrationId || null,
        ...(registration.phone ? { phone: registration.phone } : {}),
    };

    if (existingUsers.data.length > 0) {
        const existingUser = existingUsers.data[0];
        const existingMetadata = (existingUser.publicMetadata || {}) as Record<string, unknown>;

        await client.users.updateUser(existingUser.id, {
            firstName: registration.firstName || existingUser.firstName || undefined,
            lastName: registration.lastName || existingUser.lastName || undefined,
            publicMetadata: {
                ...existingMetadata,
                ...publicMetadata,
            },
        });

        return existingUser.id;
    }

    const newUser = await client.users.createUser({
        emailAddress: [registration.email],
        firstName: registration.firstName || undefined,
        lastName: registration.lastName || undefined,
        skipPasswordRequirement: true,
        publicMetadata,
    });

    return newUser.id;
}

async function provisionBackstageMember(
    registration: NormalizedBackstageRegistration,
    clerkId: string,
    ipAddress: string | null
): Promise<MemberProvisionResult> {
    const client = await getClient();

    try {
        await client.query("BEGIN");

        const existing = await client.query<{
            id: number;
            membership_id: string | null;
            verification_status: string | null;
            created_at: Date;
        }>(
            `SELECT id, membership_id, verification_status, created_at
             FROM users
             WHERE LOWER(email) = LOWER($1)
             LIMIT 1
             FOR UPDATE`,
            [registration.email]
        );

        const alreadyMember = Boolean(
            existing.rows[0]?.membership_id &&
            existing.rows[0]?.verification_status === "verified"
        );

        const upsert = await client.query<{
            id: number;
            membership_id: string | null;
            verification_status: string | null;
            created_at: Date;
        }>(
            `INSERT INTO users (
                clerk_id, email, first_name, last_name, phone, country, state,
                job_title, organization, onboarding_completed, source,
                verification_status, email_verified, registration_method,
                consent_version, consent_timestamp, ip_address_at_consent,
                data_source, sync_status, created_at, updated_at
             ) VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, true, 'backstage',
                'pending_verification', true, 'email',
                $10, NOW(), $11,
                'backstage', 'pending', NOW(), NOW()
             )
             ON CONFLICT (email) DO UPDATE SET
                clerk_id              = COALESCE(users.clerk_id, EXCLUDED.clerk_id),
                first_name            = COALESCE(NULLIF(users.first_name, ''), EXCLUDED.first_name),
                last_name             = COALESCE(NULLIF(users.last_name, ''), EXCLUDED.last_name),
                phone                 = COALESCE(NULLIF(users.phone, ''), EXCLUDED.phone),
                country               = COALESCE(NULLIF(users.country, ''), EXCLUDED.country),
                state                 = COALESCE(NULLIF(users.state, ''), EXCLUDED.state),
                job_title             = COALESCE(NULLIF(users.job_title, ''), EXCLUDED.job_title),
                organization          = COALESCE(NULLIF(users.organization, ''), EXCLUDED.organization),
                onboarding_completed  = true,
                email_verified        = true,
                registration_method   = COALESCE(users.registration_method, 'email'),
                source                = COALESCE(NULLIF(users.source, ''), EXCLUDED.source),
                data_source           = 'backstage',
                consent_version       = EXCLUDED.consent_version,
                consent_timestamp     = COALESCE(users.consent_timestamp, EXCLUDED.consent_timestamp),
                ip_address_at_consent = COALESCE(users.ip_address_at_consent, EXCLUDED.ip_address_at_consent),
                sync_status           = COALESCE(users.sync_status, 'pending'),
                updated_at            = NOW()
             RETURNING id, membership_id, verification_status, created_at`,
            [
                clerkId,
                registration.email,
                registration.firstName || null,
                registration.lastName || null,
                registration.phone || null,
                registration.country || null,
                registration.state || null,
                registration.designation || null,
                registration.company || null,
                CURRENT_CONSENT_VERSION,
                ipAddress,
            ]
        );

        const userId = upsert.rows[0].id;
        let membershipId = upsert.rows[0].membership_id;
        const joinedAt = upsert.rows[0].created_at || new Date();

        if (upsert.rows[0].verification_status !== "verified") {
            const verified = await client.query<{ membership_id: string | null }>(
                `UPDATE users
                 SET verification_status = 'verified',
                     email_verified = true,
                     onboarding_completed = true,
                     updated_at = NOW()
                 WHERE id = $1
                   AND (verification_status IS NULL OR verification_status <> 'verified')
                 RETURNING membership_id`,
                [userId]
            );

            membershipId = verified.rows[0]?.membership_id || membershipId;
        }

        if (!membershipId) {
            const existingMembership = await client.query<{ membership_id: string | null }>(
                `SELECT membership_id FROM users WHERE id = $1 LIMIT 1`,
                [userId]
            );
            membershipId = existingMembership.rows[0]?.membership_id || null;
        }

        if (!membershipId) {
            const generated = await client.query<{ membership_id: string }>(
                `WITH seq AS (
                    SELECT nextval('membership_id_seq') AS seq_val
                 )
                 UPDATE users
                 SET membership_seq = seq.seq_val,
                     membership_id = 'ENCL-STN-' || seq.seq_val::TEXT,
                     updated_at = NOW()
                 FROM seq
                 WHERE users.id = $1
                   AND users.membership_id IS NULL
                 RETURNING users.membership_id`,
                [userId]
            );
            membershipId = generated.rows[0]?.membership_id || null;
        }

        if (!membershipId) {
            throw new Error("Membership ID could not be generated");
        }

        await client.query("COMMIT");

        return {
            userId,
            membershipId,
            alreadyMember,
            joinedAt,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID().slice(0, 8);
    const log = (msg: string) => console.log(`[BACKSTAGE:${requestId}] ${msg}`);

    try {
        const body = await parseWebhookBody(req);
        const providedSecret = getProvidedSecret(req, body);
        const webhookSecret = getWebhookSecret();

        if (!webhookSecret) {
            console.error("[BACKSTAGE] ZOHO_BACKSTAGE_WEBHOOK_SECRET/ZOHO_WEBHOOK_SECRET is not set");
            return NextResponse.json(
                { success: false, error: "Server misconfigured" },
                { status: 500 }
            );
        }

        if (!providedSecret || providedSecret !== webhookSecret) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const registration = normalizeRegistration(body);
        if (!registration) {
            return NextResponse.json(
                { success: false, error: "Missing attendee email" },
                { status: 400 }
            );
        }

        const ipAddress = extractIpAddress(req);
        log(`Registration received for ${registration.email}`);

        if (isDryRunRequest(req, body)) {
            return NextResponse.json({
                success: true,
                dryRun: true,
                normalizedRegistration: registration,
                message: "Backstage payload parsed successfully. No user, membership, email, or external sync was created.",
            });
        }

        const clerkUserId = await ensureClerkMember(registration);
        const member = await provisionBackstageMember(registration, clerkUserId, ipAddress);

        const metadata = {
            source: "backstage",
            eventId: registration.eventId || null,
            eventName: registration.eventName || null,
            registrationId: registration.registrationId || null,
            ticketName: registration.ticketName || null,
            payloadKeys: Object.keys(body).slice(0, 50),
        };

        await logEvent(
            "BACKSTAGE_MEMBER_PROVISIONED",
            registration.email,
            `Backstage registration provisioned as member ${member.membershipId}`,
            {
                ...metadata,
                userId: member.userId,
                clerkUserId,
                alreadyMember: member.alreadyMember,
            }
        );

        await logConsent({
            userId: member.userId,
            email: registration.email,
            source: "backstage",
            optInMethod: "api",
            ipAddress,
            consentPurpose: "registration",
            metadata: {
                ...metadata,
                membershipId: member.membershipId,
            },
        });

        let brevoSynced = false;
        try {
            await syncVerifiedUserToBrevo({
                email: registration.email,
                name: registration.fullName,
                phone: registration.phone,
                company: registration.company,
                jobTitle: registration.designation,
                membershipId: member.membershipId,
                source: "Backstage",
            });
            brevoSynced = true;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn(`[BACKSTAGE:${requestId}] Brevo sync failed (non-fatal): ${message}`);
            await logEvent("BREVO_SYNC_FAILED", registration.email, message, metadata);
        }

        let crmSynced = false;
        let crmLeadId: string | null = null;
        try {
            const zohoResult = await createZohoLead({
                First_Name: registration.firstName || "Member",
                Last_Name: registration.lastName || ".",
                Email: registration.email,
                Phone: registration.phone,
                Mobile: registration.phone,
                Company: registration.company || "Energdive",
                Designation: registration.designation,
                Lead_Source: "ENDV Backstage Reg",
                Show: "ENERGClub",
                Invite_Source: "EnergClub",
                Membership_ID: member.membershipId,
                Owner: process.env.ZOHO_ITEN_MEDIA_OWNER_ID || undefined,
                City: registration.state,
                Country: registration.country,
                Description: [
                    `Source: Zoho Backstage`,
                    `Membership ID: ${member.membershipId}`,
                    registration.eventName ? `Event: ${registration.eventName}` : "",
                    registration.eventId ? `Event ID: ${registration.eventId}` : "",
                    registration.registrationId ? `Registration ID: ${registration.registrationId}` : "",
                    registration.ticketName ? `Ticket: ${registration.ticketName}` : "",
                ].filter(Boolean).join("\n"),
            });

            crmSynced = true;
            crmLeadId = zohoResult.id;

            await query(
                `UPDATE users
                 SET crm_lead_id = COALESCE(crm_lead_id, $2),
                     crm_synced_at = NOW(),
                     sync_status = $3,
                     updated_at = NOW()
                 WHERE id = $1`,
                [member.userId, crmLeadId, brevoSynced ? "complete" : "crm_synced"]
            );

            await logEvent(
                "CRM_SYNC_SUCCESS",
                registration.email,
                `Backstage CRM lead created: ${crmLeadId}`,
                { ...metadata, membershipId: member.membershipId, crmLeadId }
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn(`[BACKSTAGE:${requestId}] CRM lead creation failed (non-fatal): ${message}`);
            await logEvent("CRM_SYNC_FAILED", registration.email, message, {
                ...metadata,
                membershipId: member.membershipId,
            });
        }

        let welcomeEmailSent = false;
        if (!member.alreadyMember) {
            try {
                const { token } = await issueMagicToken(member.userId);
                await sendMembershipWelcomeCardEmail(
                    registration.email,
                    registration.fullName,
                    member.membershipId,
                    {
                        company: registration.company || null,
                        community: registration.eventName || "Backstage Registration",
                        joinedAt: member.joinedAt,
                        accessToken: token,
                    }
                );
                welcomeEmailSent = true;
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                console.warn(`[BACKSTAGE:${requestId}] Welcome email failed (non-fatal): ${message}`);
                await logEvent("BACKSTAGE_WELCOME_EMAIL_FAILED", registration.email, message, metadata);
            }
        }

        return NextResponse.json({
            success: true,
            userId: member.userId,
            clerkUserId,
            membershipId: member.membershipId,
            alreadyMember: member.alreadyMember,
            brevoSynced,
            crmSynced,
            crmLeadId,
            welcomeEmailSent,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[BACKSTAGE:${requestId}] Error:`, error);
        return NextResponse.json(
            { success: false, error: "Internal server error", details: message },
            { status: 500 }
        );
    }
}

import { query } from "./db";
import { normalizeBriefingFirstName } from "./daily-briefing-rules";

export interface BriefingSubscriber {
    id: number; email: string; first_name: string | null; preferred_frequency: string | null;
    last_content_digest_sent_at: string | null; source: "user" | "letterbox" | "brevo";
}
interface BrevoContact {
    email?: string; emailBlacklisted?: boolean; listIds?: number[]; attributes?: Record<string, unknown>;
}

export function subscriberFrequency(value: unknown): string {
    if (typeof value !== "string" || !value.trim()) return "daily";
    // The subscribe form stores values such as "Daily x1" and "Weekly x1".
    return /^(daily|weekly|monthly)(?:\s|$)/i.exec(value.trim())?.[1].toLowerCase() || "unsupported";
}

function suppressed(contact: BrevoContact): boolean {
    return Boolean(contact.emailBlacklisted || contact.listIds?.includes(8) || contact.attributes?.UNSUB_DATE);
}
function fromBrevo(contact: BrevoContact): BriefingSubscriber[] {
    if (!contact.email || contact.email.toLowerCase().endsWith("@phone.energdive.com") || suppressed(contact)) return [];
    return [{ id: 0, email: contact.email.toLowerCase().trim(), first_name: String(contact.attributes?.FIRSTNAME || "") || null,
        preferred_frequency: subscriberFrequency(contact.attributes?.FREQUENCY), last_content_digest_sent_at: null, source: "brevo" }];
}

async function localSubscribers(email?: string): Promise<BriefingSubscriber[]> {
    const result = await query<BriefingSubscriber>(`SELECT * FROM (
        SELECT id, LOWER(email) AS email, first_name, preferred_frequency, last_content_digest_sent_at, 'user' AS source
        FROM users WHERE onboarding_completed = true AND verification_status = 'verified'
            AND COALESCE(content_digest_opted_out, false) = false
            AND preferred_frequency IS NOT NULL AND COALESCE(array_length(preferred_formats, 1), 0) > 0
        UNION ALL
        SELECT -id AS id, LOWER(email) AS email, NULL AS first_name, preferred_frequency, last_content_digest_sent_at, 'letterbox' AS source
        FROM subscribe_letterbox WHERE COALESCE(content_digest_opted_out, false) = false
        ) AS combined WHERE email IS NOT NULL AND email NOT LIKE '%@phone.energdive.com'
            AND ($1::text IS NULL OR email = $1)`, [email || null]);
    return result.rows;
}

async function suppressedEmails(email?: string): Promise<Set<string>> {
    const result = await query<{ email: string }>(`SELECT DISTINCT LOWER(email) AS email FROM (
        SELECT email FROM users WHERE content_digest_opted_out = true
        UNION ALL SELECT email FROM subscribe_letterbox WHERE content_digest_opted_out = true
        ) AS suppressed WHERE ($1::text IS NULL OR LOWER(email) = $1)`, [email || null]);
    return new Set(result.rows.map(row => row.email));
}

function priority(row: BriefingSubscriber) {
    return row.source === "user" ? 3 : row.source === "letterbox" ? row.preferred_frequency ? 2 : 0 : 1;
}
export function dedupeSubscribers(rows: BriefingSubscriber[]): BriefingSubscriber[] {
    const byEmail = new Map<string, BriefingSubscriber>();
    for (const row of rows) {
        const email = row.email.trim().toLowerCase();
        const existing = byEmail.get(email);
        const firstName = normalizeBriefingFirstName(row.first_name);
        if (!existing || priority(row) > priority(existing) || priority(row) === priority(existing) && Math.abs(row.id) > Math.abs(existing.id)) {
            byEmail.set(email, { ...row, email, first_name: firstName || existing?.first_name || null });
        } else if (!existing.first_name && firstName) {
            existing.first_name = firstName;
        }
    }
    return [...byEmail.values()];
}

async function hydrateLastSent(rows: BriefingSubscriber[]) {
    if (!rows.length) return;
    const result = await query<{ email: string; last_sent_at: string }>(`SELECT LOWER(email) AS email, MAX(sent_at) AS last_sent_at
        FROM content_digest_logs WHERE LOWER(email) = ANY($1::text[]) AND status IN ('sent','preview') GROUP BY LOWER(email)`, [rows.map(row => row.email)]);
    for (const row of rows) {
        const sentAt = result.rows.find(log => log.email === row.email)?.last_sent_at;
        if (sentAt && (!row.last_content_digest_sent_at || new Date(sentAt) > new Date(row.last_content_digest_sent_at))) row.last_content_digest_sent_at = sentAt;
    }
}

export async function discoverBriefingSubscribers(email?: string): Promise<BriefingSubscriber[]> {
    if (email) {
        const current = await currentBriefingSubscriber(email);
        return current ? [current] : [];
    }
    if (!process.env.BREVO_API_KEY) throw new Error("BREVO_API_KEY is not configured");
    const [local, blocked] = await Promise.all([localSubscribers(), suppressedEmails()]);
    const contacts: BrevoContact[] = [];
    for (let offset = 0; ; ) {
        const response = await fetch(`https://api.brevo.com/v3/contacts?limit=500&offset=${offset}`, { headers: { "api-key": process.env.BREVO_API_KEY }, cache: "no-store" });
        if (!response.ok) throw new Error(`Brevo subscriber discovery failed (${response.status})`);
        const payload = await response.json();
        const page: BrevoContact[] = payload.contacts || [];
        contacts.push(...page);
        if (!page.length || payload.count !== undefined && offset + page.length >= payload.count) break;
        offset += page.length;
    }
    for (const contact of contacts) if (contact.email && suppressed(contact)) blocked.add(contact.email.trim().toLowerCase());
    const rows = dedupeSubscribers([...local, ...contacts.flatMap(fromBrevo)]).filter(row => !blocked.has(row.email));
    await hydrateLastSent(rows);
    return rows;
}

/** Fresh local preferences AND provider suppression are checked for every dispatch. */
export async function currentBriefingSubscriber(email: string): Promise<BriefingSubscriber | null> {
    email = email.trim().toLowerCase();
    if (!process.env.BREVO_API_KEY) throw new Error("BREVO_API_KEY is not configured");
    const [local, blocked, response] = await Promise.all([
        localSubscribers(email), suppressedEmails(email),
        fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, { headers: { "api-key": process.env.BREVO_API_KEY }, cache: "no-store" }),
    ]);
    if (blocked.has(email)) return null;
    if (!response.ok && response.status !== 404) throw new Error(`Brevo preference recheck failed (${response.status})`);
    const contact: BrevoContact | null = response.ok ? await response.json() : null;
    if (contact && suppressed(contact)) return null;
    const subscriber = dedupeSubscribers([...local, ...(contact ? fromBrevo(contact) : [])])[0] || null;
    if (subscriber) await hydrateLastSent([subscriber]);
    return subscriber;
}

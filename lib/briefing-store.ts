import { query } from "./db";
import { getBriefingWindow, type BriefingFrequency } from "./daily-briefing-rules";
import { selectFeatured } from "./briefing-content";
import type { DigestItem, DigestSection } from "./briefing-types";

export interface BriefingEdition {
    id: string;
    dateKey: string;
    frequency: BriefingFrequency;
    cutoff: Date;
    periodKey: string;
    sections: DigestSection[];
    featured: DigestItem[];
}

function revive(items: DigestItem[]): DigestItem[] {
    return items.map(item => ({ ...item, publishedAt: new Date(item.publishedAt), sortAt: new Date(item.sortAt) }));
}

interface EditionRow {
    id: string; edition_date: string; frequency: BriefingFrequency; cutoff: string; period_start: string;
    sections: DigestSection[]; featured: DigestItem[];
}

export async function preserveOriginalPublicationDates(items: DigestItem[]): Promise<DigestItem[]> {
    if (!items.length) return items;
    const result = await query<{ content_key: string; first_published_at: string }>(`INSERT INTO briefing_publications (content_key, first_published_at)
        SELECT content_key, first_published_at FROM jsonb_to_recordset($1::jsonb) AS source(content_key text, first_published_at timestamptz)
        ON CONFLICT (content_key) DO UPDATE SET first_published_at = LEAST(briefing_publications.first_published_at, EXCLUDED.first_published_at)
        RETURNING content_key, first_published_at`,
    [JSON.stringify(items.map(item => ({ content_key: item.key, first_published_at: item.publishedAt })))]);
    const times = new Map(result.rows.map(row => [row.content_key, new Date(row.first_published_at)]));
    return items.map(item => ({ ...item, publishedAt: times.get(item.key)!, sortAt: times.get(item.key)! }));
}

export async function getOrCreateBriefingEdition(frequency: BriefingFrequency, now: Date, catalog: DigestItem[], sections: DigestSection[]): Promise<BriefingEdition> {
    const { dateKey, cutoff, periodKey } = getBriefingWindow(frequency, now);
    const id = `${frequency}:${dateKey}`;
    const existing = await query<EditionRow>("SELECT * FROM briefing_editions WHERE id = $1", [id]);
    let row = existing.rows[0];
    if (!row) {
        const previous = await query<{ items: DigestItem[] }>(
            "SELECT items FROM briefing_featured_editions WHERE edition_date < $1::date ORDER BY edition_date DESC LIMIT 1", [dateKey]);
        const selected = selectFeatured(catalog, dateKey, previous.rows[0]?.items.map(item => item.key) || []);
        await query("INSERT INTO briefing_featured_editions (edition_date, items) VALUES ($1::date, $2::jsonb) ON CONFLICT DO NOTHING", [dateKey, JSON.stringify(selected)]);
        const saved = await query<{ items: DigestItem[] }>("SELECT items FROM briefing_featured_editions WHERE edition_date = $1::date", [dateKey]);
        const featured = saved.rows[0].items;
        await query(`INSERT INTO briefing_editions (id, edition_date, frequency, cutoff, period_start, sections, featured)
            VALUES ($1, $2::date, $3, $4, $5::date, $6::jsonb, $7::jsonb) ON CONFLICT DO NOTHING`,
        [id, dateKey, frequency, cutoff, periodKey, JSON.stringify(sections), JSON.stringify(featured)]);
        row = (await query<EditionRow>("SELECT * FROM briefing_editions WHERE id = $1", [id])).rows[0];
    }
    // DATE columns use explicit parameters from the edition identity, avoiding
    // pg's host-local DATE parser entirely.
    return { id: row.id, dateKey, frequency: row.frequency, cutoff: new Date(row.cutoff), periodKey,
        sections: row.sections.map(section => ({ ...section, items: revive(section.items) })), featured: revive(row.featured) };
}

export async function queueBriefingDelivery(email: string, edition: BriefingEdition): Promise<boolean> {
    const result = await query<{ id: number }>(`INSERT INTO briefing_deliveries (email, edition_date, frequency, period_start, edition_id)
        SELECT $1, $2::date, $3, $4::date, $5
        WHERE NOT EXISTS (SELECT 1 FROM content_digest_logs WHERE LOWER(email) = $1 AND status IN ('sent','preview')
            AND (sent_at AT TIME ZONE 'Asia/Kolkata')::date = $2::date)
        ON CONFLICT DO NOTHING RETURNING id`, [email, edition.dateKey, edition.frequency, edition.periodKey, edition.id]);
    if (result.rows.length) return true;
    const pending = await query<{ id: number }>(`SELECT id FROM briefing_deliveries WHERE email = $1 AND edition_id = $2 AND status IN ('queued','retryable')`, [email, edition.id]);
    return pending.rows.length > 0;
}

export async function claimBriefingDelivery(email: string, editionId: string): Promise<boolean> {
    const result = await query<{ id: number }>(`UPDATE briefing_deliveries SET status = 'sending', attempts = attempts + 1, updated_at = NOW()
        WHERE email = $1 AND edition_id = $2 AND status IN ('queued','retryable') RETURNING id`, [email, editionId]);
    return result.rows.length === 1;
}

export async function finishBriefingDelivery(email: string, editionId: string, status: "sent" | "blocked" | "retryable" | "uncertain", reason: string | null = null) {
    await query(`UPDATE briefing_deliveries SET status = $3, reason = $4, sent_at = CASE WHEN $3 = 'sent' THEN NOW() ELSE sent_at END, updated_at = NOW()
        WHERE email = $1 AND edition_id = $2 AND status <> 'sent'`, [email, editionId, status, reason]);
}

export async function expireOldBriefingDeliveries(dateKey: string) {
    // Never defer a blocked or stale edition to tomorrow. In-flight/uncertain
    // records are retained for provider reconciliation and cannot be reclaimed.
    await query(`UPDATE briefing_deliveries SET status = 'blocked', reason = 'edition_expired_Asia_Kolkata', updated_at = NOW()
        WHERE edition_date < $1::date AND status IN ('queued','retryable')`, [dateKey]);
}

import { query } from "./db";
import { DIGEST_FORMAT_OPTIONS, type DigestFormat } from "./digest-preferences";
import { briefingGateReason, briefingScheduleReason, getBriefingWindow, getDailyBriefingClock, type BriefingFrequency } from "./daily-briefing-rules";
import { buildBriefingSections, fetchBriefingContents } from "./briefing-content";
import { currentBriefingSubscriber, discoverBriefingSubscribers, subscriberFrequency, type BriefingSubscriber } from "./briefing-subscribers";
import { claimBriefingDelivery, expireOldBriefingDeliveries, finishBriefingDelivery, getOrCreateBriefingEdition, preserveOriginalPublicationDates, queueBriefingDelivery, type BriefingEdition } from "./briefing-store";
import { fetchBriefingEvents, loadBriefingExtras } from "./briefing-extras";
import { renderPreferenceDigestEmail, sendEmail } from "./email";
import { permitClaimedBriefing } from "./briefing-dispatch-permit";
import type { ProcessDigestsOptions, ProcessDigestsResult, PreviewDigestOptions, PreviewDigestResult, DigestItem } from "./briefing-types";
export type * from "./briefing-types";

function dueReason(row: BriefingSubscriber, frequency: string, now: Date): string | null {
    const reason = briefingScheduleReason(frequency, now);
    if (reason) return reason;
    if (row.last_content_digest_sent_at && new Date(row.last_content_digest_sent_at) >= getBriefingWindow(frequency as BriefingFrequency, now).start) return "already_delivered_in_period";
    return null;
}
function skipLog(reason: string, email?: string) {
    console.log(`[Briefing] Skipped${email ? ` ${email}` : ""}: ${reason}`);
}

async function currentGate(now: Date): Promise<string | null> {
    if (!getDailyBriefingClock(now).isWeekday) return "weekend_Asia_Kolkata";
    const { cutoff, dayStart } = getBriefingWindow("daily", now);
    return briefingGateReason(await preserveOriginalPublicationDates(await fetchBriefingContents(new Date(Math.min(now.getTime(), cutoff.getTime())), dayStart)), now);
}

/** All sends, including legacy direct/template callers, enter here. */
export async function processPreferenceDigests(options: ProcessDigestsOptions = {}): Promise<ProcessDigestsResult> {
    const now = new Date();
    const summary: ProcessDigestsResult = { success: true, processed: 0, due: 0, sent: 0, skipped: 0, errors: 0, results: [] };
    const scheduleReason = briefingScheduleReason("daily", now);
    if (scheduleReason) { skipLog(scheduleReason); return { ...summary, reason: scheduleReason }; }
    await expireOldBriefingDeliveries(getDailyBriefingClock(now).dateKey);
    // Seed the complete currently published catalogue before the first gate,
    // then retain these timestamps across future edits and republications.
    const catalog = await preserveOriginalPublicationDates(await fetchBriefingContents(getBriefingWindow("daily", now).cutoff));
    const globalReason = briefingGateReason(catalog, now);
    if (globalReason) { skipLog(globalReason); return { ...summary, reason: globalReason }; }
    const candidates = await discoverBriefingSubscribers(options.email);
    summary.processed = candidates.length;
    const events = await fetchBriefingEvents(now).catch(error => { console.error("[Briefing] Events unavailable", error); return []; });
    const prepared = new Map<BriefingFrequency, { edition: BriefingEdition; extras: Awaited<ReturnType<typeof loadBriefingExtras>> }>();
    let attempted = 0;
    for (const row of candidates) {
        const frequency = subscriberFrequency(row.preferred_frequency);
        const initialReason = options.frequency && options.frequency !== frequency ? "subscriber_frequency_mismatch" : dueReason(row, frequency, now);
        if (initialReason) { summary.skipped++; summary.results.push({ email: row.email, status: "skipped", reason: initialReason }); skipLog(initialReason, row.email); continue; }
        summary.due++;
        if (options.limit && attempted >= options.limit) continue;
        attempted++;
        let edition: BriefingEdition | undefined;
        let claimed = false;
        let accepted = false;
        try {
            const kind = frequency as BriefingFrequency;
            let ready = prepared.get(kind);
            if (!ready) {
                // Recheck the current live CMS before persisting any delivery.
                const gate = await currentGate(new Date());
                if (gate) throw new BriefingSkipped(gate);
                edition = await getOrCreateBriefingEdition(kind, now, catalog, buildBriefingSections(catalog, kind, now, events));
                ready = { edition, extras: await loadBriefingExtras(edition) };
                prepared.set(kind, ready);
            }
            edition = ready.edition;
            // Building HTML may await ads/media services; do it before the final
            // eligibility read and the atomic claim immediately before dispatch.
            const message = await renderPreferenceDigestEmail(row.email, row.first_name || "", kind, edition.sections, null, ready.extras);
            let gate = await currentGate(new Date());
            if (gate) throw new BriefingSkipped(gate);
            if (!await queueBriefingDelivery(row.email, edition)) throw new BriefingSkipped("duplicate_or_blocked_delivery");
            // Queued deliveries never authorize themselves: read preferences and
            // today's published News again, including on every retry.
            const fresh = await currentBriefingSubscriber(row.email);
            if (!fresh) throw new BriefingSkipped("unsubscribed_or_inactive");
            const freshFrequency = subscriberFrequency(fresh.preferred_frequency);
            if (freshFrequency !== kind) throw new BriefingSkipped("subscriber_frequency_changed");
            const dispatchNow = new Date();
            if (getDailyBriefingClock(dispatchNow).dateKey !== edition.dateKey) throw new BriefingSkipped("edition_expired_Asia_Kolkata");
            gate = dueReason(fresh, kind, dispatchNow) || await currentGate(dispatchNow);
            if (gate) throw new BriefingSkipped(gate);
            // Verify that no saved story/featured card has since been unpublished
            // or deleted. Fail this frozen edition rather than send stale content.
            const live = await preserveOriginalPublicationDates(await fetchBriefingContents(edition.cutoff, undefined, {
                keys: [...edition.sections.flatMap(section => section.items).filter(item => item.key.startsWith("content:")), ...edition.featured].map(item => item.key),
                newsSince: getDailyBriefingClock(dispatchNow).dayStart,
            }));
            assertEditionStillPublished(edition, live);
            const finalNow = new Date();
            gate = briefingScheduleReason(kind, finalNow) || (getDailyBriefingClock(finalNow).dateKey !== edition.dateKey ? "edition_expired_Asia_Kolkata" : briefingGateReason(live, finalNow));
            if (gate) throw new BriefingSkipped(gate);
            claimed = await claimBriefingDelivery(row.email, edition.id);
            if (!claimed) throw new BriefingSkipped("duplicate_or_in_progress_delivery");
            const claimNow = new Date();
            gate = briefingScheduleReason(kind, claimNow) || (getDailyBriefingClock(claimNow).dateKey !== edition.dateKey ? "edition_expired_Asia_Kolkata" : null);
            if (gate) throw new BriefingSkipped(gate);
            permitClaimedBriefing(message);
            await sendEmail(message);
            accepted = true;
            await finishBriefingDelivery(row.email, edition.id, "sent");
            // The durable claim remains consumed even if these legacy audit
            // updates fail after the provider has accepted the message.
            await query(`INSERT INTO content_digest_logs (user_id, email, frequency, formats, item_keys, item_count, status, sent_at)
                VALUES ($1, $2, $3, $4, $5, $6, 'sent', NOW())`,
            [row.id > 0 ? row.id : null, row.email, kind, ["News Briefing", "Upcoming Events"], edition.sections.flatMap(section => section.items.map(item => item.key)), edition.sections.reduce((count, section) => count + section.items.length, 0)]);
            await query("UPDATE users SET last_content_digest_sent_at = NOW() WHERE LOWER(email) = $1", [row.email]);
            await query("UPDATE subscribe_letterbox SET last_content_digest_sent_at = NOW() WHERE LOWER(email) = $1", [row.email]);
            summary.sent++;
            summary.results.push({ email: row.email, status: "sent", items: edition.sections.reduce((count, section) => count + section.items.length, 0) });
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            if (error instanceof BriefingSkipped) {
                // Only the worker owning a claim may alter an in-flight record.
                // Blocking queued rows is safe; do not mutate another worker's
                // sending row after losing the atomic claim.
                if (edition && claimed) await finishBriefingDelivery(row.email, edition.id, "blocked", reason);
                else if (edition && reason !== "duplicate_or_in_progress_delivery" && reason !== "duplicate_or_blocked_delivery") await blockQueuedDelivery(row.email, edition.id, reason);
                summary.skipped++; skipLog(reason, row.email);
                summary.results.push({ email: row.email, status: "skipped", reason });
            } else if (accepted) {
                console.error(`[Briefing] Provider accepted ${row.email}; audit update failed (claim retained): ${reason}`);
                summary.sent++;
                summary.results.push({ email: row.email, status: "sent", reason: "accepted_audit_update_failed" });
            } else {
                if (claimed && edition) {
                    // Retry only a definite HTTP rejection. Timeouts, transport
                    // errors and 5xx outcomes are held for reconciliation.
                    const safeRetry = /^Brevo API (?:400|401|403|404|422|429):/.test(reason);
                    await finishBriefingDelivery(row.email, edition.id, safeRetry ? "retryable" : "uncertain", reason);
                }
                summary.errors++; summary.success = false;
                summary.results.push({ email: row.email, status: "failed", reason });
                console.error(`[Briefing] Failed ${row.email}: ${reason}`);
            }
        }
    }
    return summary;
}

class BriefingSkipped extends Error {}
async function blockQueuedDelivery(email: string, editionId: string, reason: string) {
    await query(`UPDATE briefing_deliveries SET status = 'blocked', reason = $3, updated_at = NOW()
        WHERE email = $1 AND edition_id = $2 AND status IN ('queued','retryable')`, [email, editionId, reason]);
}
function assertEditionStillPublished(edition: BriefingEdition, live: DigestItem[]) {
    const byKey = new Map(live.map(item => [item.key, item]));
    const savedNews = edition.sections.find(section => section.format === "News Briefing")?.items || [];
    if (savedNews.some(item => byKey.get(item.key)?.badge.toLowerCase() !== "news") ||
        edition.featured.some(item => !byKey.get(item.key)?.featuredType)) {
        throw new BriefingSkipped("edition_content_unpublished_or_deleted");
    }
}

/** Sending previews uses the same gate, preference checks and delivery identity.
 * For layout review on any day use renderPreferenceDigestEmail without SMTP. */
export async function sendPreferenceDigestPreview(options: PreviewDigestOptions): Promise<PreviewDigestResult> {
    const result = await processPreferenceDigests({ email: options.email, frequency: options.frequency || "daily" });
    const outcome = result.results[0];
    return { success: result.sent === 1, email: options.email, frequency: options.frequency || "daily",
        formats: ["News Briefing", "Upcoming Events"], items: outcome?.items || 0, reason: outcome?.reason || result.reason || (result.sent ? undefined : "unsubscribed_or_inactive") };
}
export function getSupportedDigestFormats(): DigestFormat[] { return [...DIGEST_FORMAT_OPTIONS]; }

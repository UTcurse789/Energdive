import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { harness, root, news, featured, tuesday } from "./briefing-test-support.mjs";

test("real PostgreSQL migration, JSON editions, publication ledger and unique delivery claims", async () => {
    const db = new PGlite();
    try {
        await db.exec(`CREATE TABLE users (id SERIAL PRIMARY KEY);
            CREATE TABLE subscribe_letterbox (id SERIAL PRIMARY KEY);
            CREATE TABLE content_digest_logs (email TEXT, status TEXT, sent_at TIMESTAMPTZ);`);
        const migration = readFileSync(path.join(root, "migrations/025_briefing_editions.sql"), "utf8");
        await db.exec(migration); await db.exec(migration); // Idempotent migration.
        const h = harness({ query: (sql, params) => db.query(sql, params) });
        const content = h.load("lib/briefing-content"), store = h.load("lib/briefing-store");
        const catalog = [...news(), ...featured()].map(item => content.normalizeBriefingContent(item, new Date(tuesday))).filter(Boolean);
        const original = await store.preserveOriginalPublicationDates(catalog);
        const edited = await store.preserveOriginalPublicationDates(catalog.map(item => ({ ...item, publishedAt: new Date("2026-10-07T06:00:00Z") })));
        assert.equal(edited[0].publishedAt.toISOString(), original[0].publishedAt.toISOString(), "Republishing cannot move first publication");
        const sections = content.buildBriefingSections(catalog, "daily", new Date(tuesday));
        const edition = await store.getOrCreateBriefingEdition("daily", new Date(tuesday), catalog, sections);
        const again = await store.getOrCreateBriefingEdition("daily", new Date(tuesday), catalog.slice(1), []);
        assert.equal(edition.sections[0].items.length, 3); assert.equal(again.sections[0].items.length, 3);
        assert.deepEqual(Array.from(edition.featured, item => item.key), Array.from(again.featured, item => item.key));
        assert.ok(again.sections[0].items[0].publishedAt instanceof Date || typeof again.sections[0].items[0].publishedAt.getTime === "function");
        const queued = await Promise.all(Array.from({ length: 4 }, () => store.queueBriefingDelivery("reader@example.test", edition)));
        assert.ok(queued.every(Boolean));
        const claimed = await Promise.all(Array.from({ length: 8 }, () => store.claimBriefingDelivery("reader@example.test", edition.id)));
        assert.equal(claimed.filter(Boolean).length, 1);
        await store.finishBriefingDelivery("reader@example.test", edition.id, "sent");
        assert.equal(await store.queueBriefingDelivery("reader@example.test", edition), false);
        assert.equal(await store.claimBriefingDelivery("reader@example.test", edition.id), false);
        const weekly = await store.getOrCreateBriefingEdition("weekly", new Date(tuesday), catalog, sections);
        assert.equal(await store.queueBriefingDelivery("reader@example.test", weekly), false, "Frequency changes cannot double-send on one date");
        await store.queueBriefingDelivery("weekly@example.test", weekly);
        await store.claimBriefingDelivery("weekly@example.test", weekly.id);
        await store.finishBriefingDelivery("weekly@example.test", weekly.id, "sent");
        const samePeriod = await store.getOrCreateBriefingEdition("weekly", new Date("2026-10-07T11:30:00Z"), catalog, sections);
        assert.equal(await store.queueBriefingDelivery("weekly@example.test", samePeriod), false, "A weekly period can only deliver once, even if weekday configuration changes");
        await store.queueBriefingDelivery("expired@example.test", edition);
        await store.expireOldBriefingDeliveries("2026-10-07");
        const expired = await db.query("SELECT status, reason FROM briefing_deliveries WHERE email = 'expired@example.test'");
        assert.equal(expired.rows[0].status, "blocked");
        assert.equal(expired.rows[0].reason, "edition_expired_Asia_Kolkata");
    } finally { await db.close(); }
});

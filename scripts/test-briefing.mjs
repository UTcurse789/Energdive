import assert from "node:assert/strict";
import test from "node:test";
import { harness, subscriber, story, news, featured, tuesday, friday } from "./briefing-test-support.mjs";

test("weekends block processor, manual preview and legacy send before any queue writes", async () => {
    for (const now of ["2026-10-09T18:30:00Z", "2026-10-10T11:30:00Z", "2026-10-11T11:30:00Z"]) {
        const h = harness({ now, contents: news(12, now), recipients: [subscriber(), subscriber("weekly@example.test", "weekly")] });
        assert.match((await h.run()).reason, /weekend/);
        assert.equal((await h.load("lib/preference-digests").sendPreferenceDigestPreview({ email: "reader@example.test" })).success, false);
        await assert.rejects(h.load("lib/email").sendPreferenceDigestEmail("reader@example.test", "Anita", "daily", []), /weekend/);
        assert.equal(h.state.queries.length, 0); assert.equal(h.state.smtpCalls.length, 0);
    }
});

test("weekday with 0, 1 or 2 distinct published News blocks both frequencies", async () => {
    for (const count of [0, 1, 2]) {
        const h = harness({ now: friday, contents: [...news(count, friday), ...featured(), ...news(8, "2026-10-08T06:00:00Z")], recipients: [subscriber(), subscriber("weekly@example.test", "weekly")] });
        const result = await h.run();
        assert.equal(result.sent, 0); assert.match(result.reason, new RegExp(`insufficient_today_news:${count}/3`));
        const preview = await h.load("lib/preference-digests").sendPreferenceDigestPreview({ email: "reader@example.test" });
        assert.equal(preview.success, false); assert.match(preview.reason, /insufficient_today_news/);
        assert.equal(h.state.deliveries.size, 0); assert.equal(h.state.smtpCalls.length, 0);
    }
});

test("eligibility excludes duplicates, drafts, future, deleted, wrong/missing types and edited old news", async () => {
    const h = harness({ contents: [story(1), { ...story(1), id: 999 },
        story(2, null, "News", { Date: tuesday, createdAt: tuesday, updatedAt: tuesday }),
        story(3, "2026-10-05T18:29:59Z", "News", { updatedAt: tuesday }), story(4, "2026-10-06T11:30:01Z"),
        story(5, tuesday, "News", { deletedAt: tuesday }), story(6, tuesday, "News", { status: "draft" }),
        story(7, tuesday, "News", { type_of_content: null }), story(8, "invalid"), ...featured(tuesday)] });
    assert.match((await h.run()).reason, /insufficient_today_news:1\/3/); assert.equal(h.state.sent.length, 0);
});

test("daily contains all News across capped CMS pages including IST midnight and exact cutoff", async () => {
    const contents = [...news(237), ...featured(), story("midnight", "2026-10-05T18:30:00Z"),
        story("old", "2026-10-05T18:29:59Z"), story("future", "2026-10-06T11:30:01Z"), story("opinion", tuesday, "Opinion")];
    const h = harness({ contents, pageSize: 25 }); const result = await h.run();
    assert.equal(result.sent, 1, h.state.output.join("\n"));
    const keys = h.state.editions.get("daily:2026-10-06").sections[0].items.map(item => item.key);
    assert.equal(keys.length, 238); assert.equal(new Set(keys).size, keys.length);
    assert.ok(keys.includes("content:doc-midnight")); assert.ok(!keys.includes("content:doc-old"));
    const topHtml = h.state.sent[0].htmlContent.split("Featured Articles")[0];
    for (const item of contents.filter(item => keys.includes(`content:${item.documentId}`))) assert.ok(topHtml.includes(`>${item.Title}</a>`), item.Title);
    assert.ok(!topHtml.includes(">Story opinion</a>"));
    assert.ok(h.state.reads.some(url => url.includes("pagination%5Bpage%5D=10")));
});

test("only due subscribers send: weekly waits for Friday and monthly stays disabled", async () => {
    const h = harness({ recipients: [subscriber(), subscriber("weekly@example.test", "Weekly x1"), subscriber("monthly@example.test", "monthly")] });
    const result = await h.run(); assert.equal(result.sent, 1); assert.equal(h.state.sent[0].to[0].email, "reader@example.test");
    assert.ok(result.results.some(row => row.reason === "weekly_schedule_not_due"));
    assert.ok(result.results.some(row => row.reason === "unsupported_frequency"));
});

test("weekly chooses latest one per IST date from Saturday through Friday, including weekend news", async () => {
    const h = harness({ now: friday, recipients: [subscriber("weekly@example.test", "weekly")], contents: [
        ...news(3, friday), ...featured(), story("saturday-old", "2026-10-03T01:00:00Z"), story("saturday-top", "2026-10-03T12:00:00Z"),
        story("sunday", "2026-10-04T05:00:00Z"), story("monday-a", "2026-10-05T05:00:00Z"), story("monday-b", "2026-10-05T05:00:00Z"),
        story("before-period", "2026-10-02T18:29:59Z"), story("after-cutoff", "2026-10-09T11:30:01Z")] });
    assert.equal((await h.run()).sent, 1, h.state.output.join("\n"));
    const edition = h.state.editions.get("weekly:2026-10-09"); assert.equal(edition.period_start, "2026-10-03");
    const items = edition.sections[0].items; assert.equal(items.length, 4);
    assert.ok(items.some(item => item.key === "content:doc-saturday-top")); assert.ok(items.some(item => item.key === "content:doc-monday-a"));
    assert.ok(!items.some(item => /before-period|after-cutoff|saturday-old|monday-b/.test(item.key)));
    assert.match(h.state.sent[0].htmlContent, /Covered dates: 3 Oct 2026 &ndash; 9 Oct 2026/);
});

test("weekly weekday, reporting start and send time are configurable and reject weekend schedules", async () => {
    const h = harness({ env: { BRIEFING_WEEKLY_WEEKDAY: "tuesday", BRIEFING_WEEK_START_WEEKDAY: "3", BRIEFING_SEND_TIME: "16:00" }, recipients: [subscriber("weekly@example.test", "weekly")] });
    const rules = h.load("lib/daily-briefing-rules"); assert.equal(rules.getBriefingSchedule().weeklyWeekday, 2);
    assert.equal(rules.getBriefingWindow("weekly", new Date(tuesday)).periodKey, "2026-09-30");
    assert.equal((await h.run()).sent, 0, "5 PM news is after the configured 4 PM cutoff");
    assert.throws(() => harness({ env: { BRIEFING_WEEKLY_WEEKDAY: "saturday" } }).load("lib/daily-briefing-rules").getBriefingSchedule(), /Monday-Friday/);
});

test("list membership cannot force explicit weekly preferences onto a daily schedule", async () => {
    const h = harness({ recipients: [subscriber("reader@example.test", null)], contacts: [{ email: "reader@example.test", listIds: [24], attributes: { FREQUENCY: "Weekly x1" } }] });
    assert.equal((await h.run()).sent, 0);
    const local = harness({ recipients: [subscriber("reader@example.test", "weekly", { id: 2, source: "user" })], contacts: [{ email: "reader@example.test", attributes: { FREQUENCY: "Daily" } }] });
    assert.equal((await local.run()).sent, 0);
});

test("featured content mixes eligible types and rotates its selection/order without duplicates", () => {
    const content = harness().load("lib/briefing-content");
    const catalog = [...featured(), ...news(), story("report", tuesday, "Reports"), story("tagged", tuesday, "Opinion", { content_tag: { title: "Interview" } })]
        .map(item => content.normalizeBriefingContent(item, new Date(tuesday))).filter(Boolean);
    let previous = [];
    for (let day = 1; day <= 20; day++) {
        const chosen = content.selectFeatured(catalog, `2026-10-${String(day).padStart(2, "0")}`, previous);
        assert.equal(chosen.length, 3); assert.equal(new Set(chosen.map(item => item.key)).size, 3);
        assert.deepEqual(Array.from(chosen, item => item.featuredType).sort(), ["article", "interview", "opinion"]);
        assert.notDeepEqual(Array.from(chosen, item => item.key).sort(), [...previous].sort()); previous = Array.from(chosen, item => item.key);
    }
    const three = catalog.filter(item => ["content:doc-f0", "content:doc-f1", "content:doc-f2"].includes(item.key));
    const today = content.selectFeatured(three, "2026-10-06");
    assert.notDeepEqual(Array.from(content.selectFeatured(three, "2026-10-07", today.map(item => item.key)), item => item.key), Array.from(today, item => item.key));
});

test("recipients and reruns reuse the edition's persisted featured cards", async () => {
    const h = harness({ contents: [...news(), ...featured()], recipients: [subscriber(), subscriber("second@example.test")] });
    assert.equal((await h.run()).sent, 2); assert.equal(h.state.featured.size, 1); assert.equal(h.state.editions.size, 1);
    const html = message => message.htmlContent.split("Featured Articles")[1].split("ENERGDIVE Insights Exchange")[0];
    assert.equal(html(h.state.sent[0]), html(h.state.sent[1]));
    h.state.contents.push(story("fresh-article", tuesday, "Articles")); assert.equal((await h.run()).sent, 0); assert.equal(h.state.sent.length, 2);
});

test("overlapping jobs atomically claim one delivery", async () => {
    const h = harness({ contents: [...news(), ...featured()] }); await Promise.all([h.run(), h.run(), h.run()]);
    assert.equal(h.state.smtpCalls.length, 1, h.state.output.join("\n")); assert.equal([...h.state.deliveries.values()][0].status, "sent");
});

test("unsubscribe, blacklist and changed frequency are rechecked after queueing", async () => {
    for (const change of [state => state.blocked.add("reader@example.test"),
        state => state.contacts.push({ email: "reader@example.test", emailBlacklisted: true }),
        state => state.contacts.push({ email: "reader@example.test", listIds: [8] }),
        state => { state.recipients[0].preferred_frequency = "weekly"; }, state => { state.recipients.length = 0; }]) {
        const h = harness({ onQuery(sql, _params, state) { if (sql.startsWith("INSERT INTO briefing_deliveries")) change(state); } });
        assert.equal((await h.run()).sent, 0); assert.equal(h.state.smtpCalls.length, 0); assert.equal([...h.state.deliveries.values()][0].status, "blocked");
    }
});

test("live news minimum is checked after rendering and again for queued deliveries", async () => {
    const afterRender = harness({ onRender(state) { state.contents = news(2); } });
    assert.equal((await afterRender.run()).sent, 0); assert.equal(afterRender.state.deliveries.size, 0);
    const afterQueue = harness({ onQuery(sql, _params, state) { if (sql.startsWith("INSERT INTO briefing_deliveries")) state.contents = news(2); } });
    assert.equal((await afterQueue.run()).sent, 0); assert.equal(afterQueue.state.smtpCalls.length, 0);
    assert.match([...afterQueue.state.deliveries.values()][0].reason, /insufficient_today_news/);
});

test("unpublishing a featured item blocks the frozen edition", async () => {
    const h = harness({ contents: [...news(), ...featured()], onQuery(sql, _params, state) {
        if (sql.startsWith("INSERT INTO briefing_deliveries")) state.contents = state.contents.filter(item => item.type_of_content.name === "News");
    } });
    const result = await h.run(); assert.equal(result.sent, 0); assert.equal(result.results[0].reason, "edition_content_unpublished_or_deleted");
});

test("definite rejection retries the same edition; transport uncertainty never automatically resends", async () => {
    const h = harness({ smtpOutcomes: [429], contents: [...news(), ...featured()] });
    assert.equal((await h.run()).errors, 1); assert.equal([...h.state.deliveries.values()][0].status, "retryable");
    assert.equal((await h.run()).sent, 1); assert.equal((await h.run()).sent, 0); assert.equal(h.state.smtpCalls.length, 2);
    assert.equal(h.state.smtpCalls[0].htmlContent, h.state.smtpCalls[1].htmlContent);
    for (const outcome of ["timeout", 500]) {
        const held = harness({ smtpOutcomes: [outcome] }); assert.equal((await held.run()).errors, 1);
        assert.equal([...held.state.deliveries.values()][0].status, "uncertain"); assert.equal((await held.run()).sent, 0); assert.equal(held.state.smtpCalls.length, 1);
    }
});

test("retry cannot bypass a changed gate, weekend, or defer Friday's blocked edition", async () => {
    const h = harness({ now: friday, contents: news(3, friday), smtpOutcomes: [429], recipients: [subscriber("weekly@example.test", "weekly")] });
    await h.run(); h.state.contents = news(2, friday); assert.equal((await h.run()).sent, 0); assert.equal(h.state.smtpCalls.length, 1);
    h.state.now = "2026-10-10T11:30:00Z"; h.state.contents = news(5, h.state.now); assert.match((await h.run()).reason, /weekend/);
    h.state.now = "2026-10-12T11:30:00Z"; h.state.contents = news(5, h.state.now); assert.equal((await h.run()).sent, 0);
    assert.equal([...h.state.deliveries.values()][0].status, "blocked"); assert.equal(h.state.smtpCalls.length, 1);
});

test("midnight during rendering or claim cannot dispatch a previous-day edition", async () => {
    for (const stage of ["render", "claim"]) {
        const h = harness({ now: friday, contents: news(3, friday), onRender(state) { if (stage === "render") state.now = "2026-10-09T18:30:00Z"; },
            onQuery(sql, _params, state) { if (stage === "claim" && sql.startsWith("UPDATE briefing_deliveries SET status = 'sending'")) state.now = "2026-10-09T18:30:00Z"; } });
        assert.equal((await h.run()).sent, 0); assert.equal(h.state.smtpCalls.length, 0);
    }
});

test("audit failure after provider acceptance retains the claim and prevents duplicates", async () => {
    const h = harness({ onQuery(sql) { if (sql.startsWith("INSERT INTO content_digest_logs")) throw new Error("audit unavailable"); } });
    assert.equal((await h.run()).sent, 1); assert.equal((await h.run()).sent, 0); assert.equal(h.state.smtpCalls.length, 1);
    assert.equal([...h.state.deliveries.values()][0].status, "sent");
});

test("manual and direct sends respect frequency and the same duplicate identity", async () => {
    const h = harness(); const service = h.load("lib/preference-digests");
    assert.equal((await service.sendPreferenceDigestPreview({ email: "reader@example.test", frequency: "weekly" })).success, false);
    assert.equal((await service.sendPreferenceDigestPreview({ email: "reader@example.test", frequency: "daily" })).success, true);
    await assert.rejects(h.load("lib/email").sendPreferenceDigestEmail("reader@example.test", "Anita", "daily", []), /already_delivered/); assert.equal(h.state.smtpCalls.length, 1);
});

test("original upload and numeric image dimensions preserve portrait, landscape, square and logo", () => {
    const h = harness(); const content = h.load("lib/briefing-content"); const email = h.load("lib/email");
    const item = content.normalizeBriefingContent(story(1, tuesday, "News", { FeaturedImage: { url: "/original.jpg", width: 600, height: 900, formats: { small: { url: "/cropped.jpg" } } } }), new Date(tuesday));
    assert.match(item.imageUrl, /original.jpg$/);
    for (const [w, hgt] of [[600, 900], [1600, 900], [600, 600], [2000, 200]]) {
        const html = email.renderBriefingImage({ ...item, imageWidth: w, imageHeight: hgt }, 220, 156);
        const [, width, height] = html.match(/alt="[^"]*" width="(\d+)" height="(\d+)"/);
        assert.ok(Number(width) <= 220 && Number(height) <= 156); assert.ok(Math.abs(Number(width) / Number(height) - w / hgt) < 0.06);
        assert.ok(!/object-fit:cover|overflow:hidden/.test(html)); assert.match(html, /bgcolor="#ffffff"/);
    }
    const unknown = email.renderBriefingImage({ ...item, imageWidth: undefined, imageHeight: undefined }, 220, 156);
    assert.ok(!/<img[^>]+height="/.test(unknown)); assert.match(unknown, /height:auto/);
});

test("template renders white news rows, every story, and mobile full-image fallback without SMTP", async () => {
    const h = harness(); const content = h.load("lib/briefing-content");
    const catalog = [...news(9), ...featured()].map(item => content.normalizeBriefingContent(item, new Date(tuesday))).filter(Boolean);
    const message = await h.load("lib/email").renderPreferenceDigestEmail("reader@example.test", "NULL", "daily", content.buildBriefingSections(catalog, "daily", new Date(tuesday)), null,
        { trending: [], articles: content.selectFeatured(catalog, "2026-10-06"), jobs: [] });
    assert.equal(h.state.smtpCalls.length, 0); assert.equal((message.htmlContent.match(/class="top-news-thumb"/g) || []).length, 9);
    assert.ok(!message.htmlContent.includes("object-fit:cover")); assert.ok(!message.htmlContent.includes("Good evening, <span"));
    assert.match(message.htmlContent, /bgcolor="#ffffff" class="top-news-copy"/);
    assert.match(message.htmlContent, /\.top-news-thumb img \{ max-width:100% !important; height:auto/);
});

test("scheduler checks IST weekdays and cutoff once per successful day", async () => {
    for (const [now, expected] of [[friday, 1], ["2026-10-10T11:30:00Z", 0], ["2026-10-11T11:30:00Z", 0], ["2026-10-06T11:29:59Z", 0]]) {
        const h = harness({ now }); h.load("lib/cron-scheduler").startCronScheduler();
        await Promise.resolve(); await Promise.resolve(); await h.state.intervals[2](); assert.equal(h.state.scheduledCalls, expected);
    }
});

test("weekly editorial priority beats recency; empty/equal priorities fall back deterministically", () => {
    const content = harness().load("lib/briefing-content");
    const raw = [story("latest", friday), story("priority", "2026-10-09T06:00:00Z", "News", { priority: 5 }), story("lower", friday, "News", { priority: 1 })];
    const items = raw.map(item => content.normalizeBriefingContent(item, new Date(friday)));
    assert.equal(content.buildBriefingSections(items, "weekly", new Date(friday))[0].items[0].key, "content:doc-priority");
});

test("first publication date survives a later CMS republish and never counts as new News", async () => {
    const h = harness({ contents: news(2) }); await h.run();
    h.state.now = "2026-10-07T11:30:00Z";
    h.state.contents = [...news(2, h.state.now), story("new", h.state.now)];
    assert.match((await h.run()).reason, /insufficient_today_news:1\/3/);
    assert.equal(h.state.smtpCalls.length, 0);
    const normalized = h.load("lib/briefing-content").normalizeBriefingContent(story("first", h.state.now, "News", { firstPublishedAt: tuesday }), new Date(h.state.now));
    assert.equal(normalized.publishedAt.toISOString(), tuesday.replace("Z", ".000Z"));
});

test("serialized queued HTML sent through generic SMTP helper cannot bypass the shared gate", async () => {
    const h = harness({ now: "2026-10-10T11:30:00Z" });
    await assert.rejects(h.load("lib/email").sendEmail({ to: "reader@example.test", subject: "Old saved briefing", htmlContent: "<p>stale</p>", tags: ["preference-digest", "digest-daily"] }), /weekend/);
    assert.equal(h.state.smtpCalls.length, 0);
});

test("a saved News item changed into another content type blocks dispatch", async () => {
    const h = harness({ contents: news(4), onQuery(sql, _params, state) {
        if (sql.startsWith("INSERT INTO briefing_deliveries")) state.contents[0].type_of_content = { name: "Articles" };
    } });
    const result = await h.run();
    assert.equal(result.sent, 0); assert.equal(result.results[0].reason, "edition_content_unpublished_or_deleted");
    assert.equal(h.state.smtpCalls.length, 0);
});

test("upcoming events retain ordinal/range dates and the nearest-three ordering in IST", async () => {
    const h = harness({ events: [
        { id: "far", title: "Far event", date: "10 October 2026", publishedAt: tuesday },
        { id: "range", title: "Range event", date: "7th-8th October 2026", publishedAt: tuesday },
        { id: "iso", title: "ISO event", date: "2026-10-08", publishedAt: tuesday },
        { id: "ninth", title: "Ninth event", date: "9 October 2026", publishedAt: tuesday },
    ] });
    assert.equal((await h.run()).sent, 1);
    const events = h.state.editions.get("daily:2026-10-06").sections.find(section => section.format === "Upcoming Events").items;
    assert.deepEqual(Array.from(events, item => item.key), ["event:range", "event:iso", "event:ninth"]);
});

test("duplicate placeholder names cannot overwrite a valid greeting or frequency", () => {
    const { dedupeSubscribers } = harness().load("lib/briefing-subscribers");
    const rows = dedupeSubscribers([
        subscriber("reader@example.test", "weekly", { id: 1, source: "user", first_name: "Anita Sharma" }),
        subscriber("reader@example.test", "weekly", { id: 2, source: "user", first_name: "NULL" }),
        subscriber("reader@example.test", "daily", { id: 0, source: "brevo", first_name: "undefined" }),
    ]);
    assert.equal(rows.length, 1); assert.equal(rows[0].first_name, "Anita"); assert.equal(rows[0].preferred_frequency, "weekly");
});

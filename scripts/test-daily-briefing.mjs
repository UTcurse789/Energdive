// Offline integration checks: execute the real processor and email template
// with a fixed clock and mocked database, CMS, and Brevo services.
// Run: node --test scripts/test-daily-briefing.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const weekday = "2026-10-06T11:30:00Z"; // Tuesday, 5 PM Kolkata

function harness({ now = weekday, contents = [], recipients = [], contacts = [], events = [] } = {}) {
    const sent = [];
    const writes = [];
    const reads = [];
    const intervals = [];
    let scheduledCalls = 0;
    const fixedDate = new Proxy(Date, {
        construct(target, args) { return new target(...(args.length ? args : [now])); },
        get(target, property) { return property === "now" ? () => Date.parse(now) : Reflect.get(target, property); },
    });
    const ads = { getAdvertisements: async () => [], getAdImageUrl: () => null };
    const query = async (sql, params) => {
        reads.push(sql);
        if (sql.includes("SELECT * FROM (")) return { rows: recipients };
        if (sql.includes("UPDATE ") || sql.includes("INSERT INTO content_digest_logs")) writes.push({ sql, params });
        return { rows: [] };
    };
    const json = (body) => new Response(JSON.stringify(body), { status: 200 });
    const fetch = async (input, options) => {
        const url = new URL(input);
        if (url.pathname === "/v3/smtp/email") {
            sent.push(JSON.parse(options.body));
            return json({ messageId: "offline-test" });
        }
        if (url.pathname === "/v3/contacts") return json({ contacts });
        if (url.pathname === "/api/contents") return json({ data: contents });
        if (url.pathname === "/api/events") return json({ data: events });
        throw new Error(`Unexpected fetch in offline test: ${url}`);
    };
    const mocks = {
        "lib/db": { query },
        "lib/api/getAdvertisements": ads,
        "lib/api/getLatestIssue": { getLatestIssue: async () => null },
        "lib/energjob-public": { loadPublicEnergJobs: async () => [] },
        "lib/_card-template": {},
        "lib/membership-pdf": {},
        "lib/cron-jobs": {
            processAbandonedCartDrip: async () => {},
            processWeeklyReminders: async () => {},
            processContentPreferenceDigests: async () => { scheduledCalls++; },
        },
        "lib/daily-signup-report": { sendDailySignupReport: async () => {} },
    };
    const cache = new Map();
    const context = vm.createContext({
        Date: fixedDate, Intl, URL, fetch,
        process: { env: { BREVO_API_KEY: "offline-test", NODE_ENV: "production" } },
        console: { log() {}, error() {} },
        setInterval(callback) { intervals.push(callback); return { unref() {} }; },
    });
    function load(key) {
        if (key in mocks) return mocks[key];
        if (cache.has(key)) return cache.get(key).exports;
        const filename = path.join(root, `${key}.ts`);
        const source = ts.transpileModule(readFileSync(filename, "utf8"), {
            compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
        }).outputText;
        const loadedModule = { exports: {} };
        cache.set(key, loadedModule);
        const require = (specifier) => {
            const resolved = specifier.startsWith("@/")
                ? specifier.slice(2)
                : path.posix.normalize(path.posix.join(path.posix.dirname(key), specifier));
            return load(resolved);
        };
        vm.runInContext(`(function(require, module, exports) {${source}\n})`, context, { filename })(require, loadedModule, loadedModule.exports);
        return loadedModule.exports;
    }
    return { load, sent, writes, reads, intervals, get scheduledCalls() { return scheduledCalls; } };
}

function recipient(first_name = null, overrides = {}) {
    return {
        id: -1, email: "newsletter.reader@example.com", first_name, last_name: null,
        preferred_frequency: "Daily", preferred_formats: ["News Briefing"],
        last_content_digest_sent_at: null, ...overrides,
    };
}

function story(id, publishedAt = "2026-10-06T06:00:00Z", type = "News") {
    return { id, Title: `Story ${id}`, slug: `story-${id}`, type_of_content: { name: type }, publishedAt };
}

function greeting(message) {
    const html = message.htmlContent.match(/<p[^>]*>(Good evening,[\s\S]*?)<\/p>/)?.[1];
    assert.ok(html, "Greeting exists in the actual email HTML");
    return html.replace(/<[^>]+>/g, "");
}

test("Kolkata weekday boundaries protect the processor and scheduler", async () => {
    for (const [now, allowed] of [
        ["2026-10-09T18:29:59Z", true], // Friday 23:59:59
        ["2026-10-09T18:30:00Z", false], // Saturday 00:00
        ["2026-10-10T11:30:00Z", false],
        ["2026-10-11T11:30:00Z", false],
        ["2026-10-11T18:30:00Z", true], // Monday 00:00
    ]) {
        const h = harness({ now });
        assert.equal(h.load("lib/daily-briefing-rules").getDailyBriefingClock(new Date(now)).isWeekday, allowed);
        const result = await h.load("lib/preference-digests").processPreferenceDigests();
        assert.equal(result.sent, 0);
        if (!allowed) assert.equal(h.reads.length, 0, "Weekend guard precedes all database calls");
    }
    for (const [now, expected] of [
        ["2026-10-09T11:30:00Z", 1], ["2026-10-10T11:30:00Z", 0],
        ["2026-10-11T11:30:00Z", 0], ["2026-10-12T11:30:00Z", 1],
        ["2026-10-12T11:29:00Z", 0],
    ]) {
        const h = harness({ now });
        h.load("lib/cron-scheduler").startCronScheduler();
        await Promise.resolve();
        await h.intervals[2]();
        assert.equal(h.scheduledCalls, expected, "Scheduler runs once at 5 PM on weekdays");
    }
});

test("fewer than two eligible stories skips all recipients without recording delivery", async () => {
    for (const contents of [
        [], [story(1)],
        [story(1), story(2, "2026-10-05T18:29:59Z")], // Yesterday in Kolkata
        [story(1), story(2, "2026-10-06T11:30:01Z")], // Not yet published
        [story(1), story(2, "2026-10-06T18:30:00Z")], // Tomorrow in Kolkata
        [story(1), { ...story(2), publishedAt: null, createdAt: weekday, Date: weekday }],
        [story(1), { ...story(2), publishedAt: "invalid" }],
        [story(1), story(2, undefined, "Opinion"), story(3, undefined, "Articles")],
        [story(1), story(1)], // Duplicate records are one article
    ]) {
        const h = harness({
            contents, recipients: [recipient(), recipient(null, { id: -2, email: "weekly@example.com", preferred_frequency: "weekly" })],
            events: [{ id: 1, title: "Future Event", occurrence: "upcoming", date: "2026-10-10", publishedAt: weekday }],
        });
        const result = await h.load("lib/preference-digests").processPreferenceDigests();
        assert.equal(result.skipped, 2);
        assert.equal(result.sent, 0);
        assert.equal(h.sent.length, 0);
        assert.equal(h.writes.length, 0, "Skipping must not mark subscribers as sent or create send logs");
    }
});

test("two stories published today send, including Kolkata midnight and delayed subscribers", async () => {
    for (const contents of [
        [story(1), story(2)],
        [story(1, "2026-10-05T18:30:00Z"), story(2, weekday)], // Both inclusive bounds
        [story(1), story(2), story(3)],
    ]) {
        const h = harness({ contents, recipients: [recipient(null, { last_content_digest_sent_at: "2026-10-01T11:30:00Z" })] });
        const result = await h.load("lib/preference-digests").processPreferenceDigests();
        assert.equal(result.sent, 1);
        assert.equal(h.sent.length, 1);
        assert.equal(greeting(h.sent[0]), "Good evening,");
        assert.ok(h.writes.some(({ sql }) => sql.includes("UPDATE subscribe_letterbox")));
    }
});

test("Newsletter Subscribe, portal, and Brevo names use the requested greeting", async () => {
    for (const [name, expected] of [
        [null, "Good evening,"], [undefined, "Good evening,"], ["", "Good evening,"],
        [" \t ", "Good evening,"], ["NULL", "Good evening,"], [" null ", "Good evening,"],
        ["UnDeFiNeD", "Good evening,"], ["NULL Kumar", "Good evening,"], ["Anita undefined", "Good evening,"],
        ["  Anita   Sharma ", "Good evening, Anita,"], ["O'Neil", "Good evening, O&#39;Neil,"],
        ["<Anita>", "Good evening, &lt;Anita&gt;,"],
    ]) {
        const h = harness({
            contents: [story(1), story(2)], recipients: [recipient(name)],
            contacts: [{ email: "brevo@example.com", attributes: { FIRSTNAME: name } }],
        });
        const result = await h.load("lib/preference-digests").processPreferenceDigests();
        assert.equal(result.sent, 2);
        for (const message of h.sent) assert.equal(greeting(message), expected);
        // Also protect direct calls to the template from placeholder strings.
        await h.load("lib/email").sendPreferenceDigestEmail("direct@example.com", name, "daily", []);
        assert.equal(greeting(h.sent[2]), expected);
    }
});

test("a placeholder in a duplicate contact cannot overwrite a valid first name", async () => {
    const h = harness({
        contents: [story(1), story(2)],
        recipients: [recipient("Anita Sharma", { id: 1 }), recipient("NULL", { id: 2 })],
        contacts: [{ email: "newsletter.reader@example.com", attributes: { FIRSTNAME: "undefined" } }],
    });
    const result = await h.load("lib/preference-digests").processPreferenceDigests();
    assert.equal(result.sent, 1);
    assert.equal(greeting(h.sent[0]), "Good evening, Anita,");
});

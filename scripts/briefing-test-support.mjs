// Execute production TypeScript offline. Only external systems are substituted.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const tuesday = "2026-10-06T11:30:00Z";
export const friday = "2026-10-09T11:30:00Z";

export function subscriber(email = "reader@example.test", frequency = "daily", extra = {}) {
    return { id: -1, email, first_name: "Anita", preferred_frequency: frequency,
        last_content_digest_sent_at: null, source: "letterbox", ...extra };
}
export function story(id, publishedAt = tuesday, type = "News", extra = {}) {
    return { id, documentId: `doc-${id}`, Title: `Story ${id}`, slug: `story-${id}`,
        type_of_content: { name: type }, publishedAt, ...extra };
}
export function news(count = 3, date = tuesday) { return Array.from({ length: count }, (_, i) => story(i + 1, date)); }
export function featured(date = "2026-09-01T06:00:00Z") {
    return ["Articles", "Interview", "Opinion", "Articles", "Interview", "Opinion"].map((kind, i) => story(`f${i}`, date, kind));
}

export function harness(options = {}) {
    const state = {
        now: options.now || tuesday, contents: options.contents || news(), recipients: options.recipients || [subscriber()],
        contacts: options.contacts || [], blocked: new Set(), logs: [], editions: new Map(), featured: new Map(), deliveries: new Map(),
        sent: [], smtpCalls: [], reads: [], queries: [], output: [], intervals: [], scheduledCalls: 0,
        cmsReads: 0, publications: new Map(), smtpOutcomes: [...(options.smtpOutcomes || [])], ...options.state,
    };
    const fixedDate = new Proxy(Date, {
        construct(target, args) { return new target(...(args.length ? args : [state.now])); },
        get(target, property) { return property === "now" ? () => Date.parse(state.now) : Reflect.get(target, property); },
    });
    const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
    const query = async (sql, params = []) => {
        const compact = sql.replace(/\s+/g, " ").trim();
        state.queries.push({ sql: compact, params });
        options.onQuery?.(compact, params, state);
        const rows = result => ({ rows: result, rowCount: result.length });
        if (compact.startsWith("INSERT INTO briefing_publications")) {
            const items = JSON.parse(params[0]);
            for (const item of items) {
                const previous = state.publications.get(item.content_key);
                if (!previous || new Date(item.first_published_at) < new Date(previous)) state.publications.set(item.content_key, item.first_published_at);
            }
            return rows(items.map(item => ({ content_key: item.content_key, first_published_at: state.publications.get(item.content_key) })));
        }
        if (compact.startsWith("SELECT * FROM (") && compact.includes("AS combined")) return rows(state.recipients.filter(row => !params[0] || row.email === params[0]));
        if (compact.includes("AS suppressed")) return rows([...state.blocked].filter(email => !params[0] || params[0] === email).map(email => ({ email })));
        if (compact.startsWith("SELECT LOWER(email) AS email, MAX(sent_at)")) return rows(state.logs.filter(log => params[0].includes(log.email)).map(log => ({ email: log.email, last_sent_at: log.sent_at })));
        if (compact.startsWith("SELECT * FROM briefing_editions")) return rows(state.editions.has(params[0]) ? [state.editions.get(params[0])] : []);
        if (compact.startsWith("SELECT items FROM briefing_featured_editions WHERE edition_date <")) {
            const prior = [...state.featured].filter(([date]) => date < params[0]).sort(([a], [b]) => b.localeCompare(a))[0];
            return rows(prior ? [{ items: prior[1] }] : []);
        }
        if (compact.startsWith("SELECT items FROM briefing_featured_editions")) return rows(state.featured.has(params[0]) ? [{ items: state.featured.get(params[0]) }] : []);
        if (compact.startsWith("INSERT INTO briefing_featured_editions")) { if (!state.featured.has(params[0])) state.featured.set(params[0], JSON.parse(params[1])); return rows([]); }
        if (compact.startsWith("INSERT INTO briefing_editions")) {
            if (!state.editions.has(params[0])) state.editions.set(params[0], { id: params[0], edition_date: params[1], frequency: params[2], cutoff: params[3], period_start: params[4], sections: JSON.parse(params[5]), featured: JSON.parse(params[6]) });
            return rows([]);
        }
        if (compact.startsWith("INSERT INTO briefing_deliveries")) {
            const [email, date, frequency, period, edition] = params;
            const duplicate = [...state.deliveries.values()].some(row => row.email === email && (row.edition_date === date || row.frequency === frequency && row.period_start === period));
            const logged = state.logs.some(row => row.email === email && new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(row.sent_at)) === date);
            if (duplicate || logged) return rows([]);
            state.deliveries.set(`${email}:${edition}`, { id: state.deliveries.size + 1, email, edition_date: date, frequency, period_start: period, edition_id: edition, status: "queued", attempts: 0 });
            return rows([{ id: state.deliveries.size }]);
        }
        if (compact.startsWith("SELECT id FROM briefing_deliveries")) {
            const row = state.deliveries.get(`${params[0]}:${params[1]}`);
            return rows(row && ["queued", "retryable"].includes(row.status) ? [row] : []);
        }
        if (compact.startsWith("UPDATE briefing_deliveries SET status = 'sending'")) {
            const row = state.deliveries.get(`${params[0]}:${params[1]}`);
            if (!row || !["queued", "retryable"].includes(row.status)) return rows([]);
            row.status = "sending"; row.attempts++;
            return rows([{ id: row.id }]);
        }
        if (compact.startsWith("UPDATE briefing_deliveries SET status = $3")) {
            const row = state.deliveries.get(`${params[0]}:${params[1]}`);
            if (row && row.status !== "sent") { row.status = params[2]; row.reason = params[3]; }
            return rows([]);
        }
        if (compact.startsWith("UPDATE briefing_deliveries SET status = 'blocked'")) {
            for (const row of state.deliveries.values()) {
                const match = compact.includes("edition_date <") ? row.edition_date < params[0] : row.email === params[0] && row.edition_id === params[1];
                if (match && ["queued", "retryable"].includes(row.status)) { row.status = "blocked"; row.reason = params[2] || "edition_expired_Asia_Kolkata"; }
            }
            return rows([]);
        }
        if (compact.startsWith("INSERT INTO content_digest_logs")) {
            state.logs.push({ email: params[1], frequency: params[2], item_keys: params[4], sent_at: state.now }); return rows([]);
        }
        if (compact.startsWith("UPDATE users SET last_content_digest_sent_at") || compact.startsWith("UPDATE subscribe_letterbox SET last_content_digest_sent_at")) {
            for (const row of state.recipients) if (row.email === params[0]) row.last_content_digest_sent_at = state.now;
            return rows([]);
        }
        throw new Error(`Unmocked SQL: ${compact}`);
    };
    const fetch = async (input, request = {}) => {
        const url = new URL(input);
        state.reads.push(url.toString());
        if (url.pathname === "/v3/smtp/email") {
            const message = JSON.parse(request.body); state.smtpCalls.push(message);
            const outcome = state.smtpOutcomes.shift();
            if (outcome === "timeout") throw new Error("socket timeout after provider acceptance unknown");
            if (outcome) return json({ error: "offline rejection" }, outcome);
            state.sent.push(message); return json({ messageId: `offline-${state.sent.length}` });
        }
        if (url.pathname === "/v3/contacts") {
            const offset = Number(url.searchParams.get("offset"));
            return json({ contacts: state.contacts.slice(offset, offset + 500), count: state.contacts.length });
        }
        if (url.pathname.startsWith("/v3/contacts/")) {
            const email = decodeURIComponent(url.pathname.slice("/v3/contacts/".length));
            const contact = state.contacts.find(contact => contact.email === email);
            return contact ? json(contact) : json({}, 404);
        }
        if (url.pathname === "/api/contents") {
            state.cmsReads++; options.onCmsRead?.(state);
            assert.equal(url.searchParams.get("status"), "published");
            assert.equal(url.searchParams.get("filters[publishedAt][$notNull]"), "true");
            assert.ok(url.searchParams.has("filters[publishedAt][$lte]"));
            const page = Number(url.searchParams.get("pagination[page]"));
            const pageSize = options.pageSize || 100;
            return json({ data: state.contents.slice((page - 1) * pageSize, page * pageSize), meta: { pagination: { page, pageSize, pageCount: Math.ceil(state.contents.length / pageSize), total: state.contents.length } } });
        }
        if (url.pathname === "/api/events") return json({ data: options.events || [] });
        throw new Error(`Unexpected fetch: ${url}`);
    };
    const mocks = {
        "lib/db": { query: options.query || query },
        "lib/api/getAdvertisements": { getAdvertisements: async () => { options.onRender?.(state); return []; }, getAdImageUrl: () => null },
        "lib/api/getLatestIssue": { getLatestIssue: async () => null },
        "lib/energjob-public": { loadPublicEnergJobs: async () => [] },
        "lib/_card-template": {}, "lib/membership-pdf": {},
        "lib/cron-jobs": { processAbandonedCartDrip: async () => {}, processWeeklyReminders: async () => {}, processContentPreferenceDigests: async () => { state.scheduledCalls++; return { success: true }; } },
        "lib/daily-signup-report": { sendDailySignupReport: async () => {} },
    };
    const cache = new Map();
    const context = vm.createContext({
        Date: fixedDate, Intl, URL, fetch,
        process: { env: { BREVO_API_KEY: "offline", NODE_ENV: "production", ...options.env } },
        console: { log(...args) { state.output.push(args.join(" ")); }, error(...args) { state.output.push(args.join(" ")); } },
        setInterval(callback) { state.intervals.push(callback); return { unref() {} }; },
    });
    function load(key) {
        if (key in mocks) return mocks[key];
        if (cache.has(key)) return cache.get(key).exports;
        const source = ts.transpileModule(readFileSync(path.join(root, `${key}.ts`), "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
        const loaded = { exports: {} }; cache.set(key, loaded);
        const require = specifier => load(specifier.startsWith("@/") ? specifier.slice(2) : path.posix.normalize(path.posix.join(path.posix.dirname(key), specifier)));
        vm.runInContext(`(function(require, module, exports) {${source}\n})`, context, { filename: key })(require, loaded, loaded.exports);
        return loaded.exports;
    }
    return { state, load, run: options => load("lib/preference-digests").processPreferenceDigests(options) };
}

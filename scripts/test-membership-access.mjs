// Offline regression checks: no real login, database, or account changes.
// Run: node --test scripts/test-membership-access.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://www.energdive.com";
const target = "/resource-hub?type=Magazine%20ePDF";

function load(file, mocks = {}, globals = {}) {
    const exports = {};
    const source = ts.transpileModule(readFileSync(path.join(root, file), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(source, {
        exports, URL, URLSearchParams,
        console: { log() {}, warn() {}, error() {} },
        require(name) { assert.ok(name in mocks, `Unexpected import: ${name}`); return mocks[name]; },
        ...globals,
    }, { filename: file });
    return exports;
}

function page({
    userId = null, token = "sample-token", destination = target,
    response = { userId: "user_member", ticket: "sample-ticket" },
    ok = true, signInError = null, signOutError = null, isLoaded = true,
} = {}) {
    const actions = [];
    const effects = [];
    const states = [];
    const params = new URLSearchParams();
    if (token !== null) params.set("token", token);
    if (destination !== null) params.set("redirect_url", destination);
    const globals = {
        window: { location: { origin, pathname: "/membership-access", replace: url => actions.push({ type: "navigate", url }) } },
        setTimeout: callback => callback(),
        fetch: async (url, options) => {
            actions.push({ type: "verify", url, cache: options?.cache, method: options?.method, body: JSON.parse(options.body) });
            return { ok, status: ok ? 200 : 401, json: async () => response };
        },
    };
    const redirects = load("lib/post-auth-redirect.ts", {}, globals);
    const jsx = (type, props) => ({ type, props });
    const component = load("app/membership-access/page.tsx", {
        react: {
            Suspense: "suspense",
            useEffect: callback => effects.push(callback),
            useRef: current => ({ current }),
            useState: initial => {
                const index = states.length;
                states.push(initial);
                return [initial, value => { states[index] = value; }];
            },
        },
        "react/jsx-runtime": { jsx, jsxs: jsx },
        "@clerk/nextjs": {
            useAuth: () => ({ isLoaded, isSignedIn: Boolean(userId), userId }),
            useSignIn: () => ({
                signIn: { create: async params => {
                    actions.push({ type: "signIn", ...params });
                    if (signInError) throw signInError;
                    return { status: "complete", createdSessionId: "session_member" };
                } },
                setActive: async params => { actions.push({ type: "setActive", ...params }); },
            }),
            useClerk: () => ({ signOut: async callback => {
                actions.push({ type: "signOut" });
                if (signOutError) throw signOutError;
                await callback();
            } }),
        },
        "next/link": { default: "link" },
        "next/navigation": { useSearchParams: () => params },
        "@posthog/react": { usePostHog: () => null },
        "@/lib/post-auth-redirect": redirects,
    }, globals).default;
    component().props.children.type();
    return {
        actions, states,
        async run(twice = false) {
            for (const effect of effects) { effect(); if (twice) effect(); }
            await new Promise(setImmediate);
        },
    };
}

test("a signed-out recipient activates the linked account then opens the prefiltered Resource Hub", async () => {
    const h = page();
    await h.run();
    assert.deepEqual(h.actions.map(action => action.type), ["verify", "signIn", "setActive", "navigate"]);
    assert.equal(h.actions[0].cache, "no-store");
    assert.equal(h.actions[0].method, "POST", "One-time tickets must bypass the CDN's GET cache");
    assert.equal(h.actions[0].url, "/api/auth/membership-access");
    assert.deepEqual(h.actions[1], { type: "signIn", strategy: "ticket", ticket: "sample-ticket" });
    assert.deepEqual(h.actions[2], { type: "setActive", session: "session_member" });
    assert.equal(h.actions[3].url, target);
    assert.equal(new URL(h.actions[3].url, origin).searchParams.get("type"), "Magazine ePDF");
});

test("a different signed-in account is signed out only after verification and the retry preserves the filter", async () => {
    const h = page({ userId: "user_other" });
    await h.run(true);
    assert.deepEqual(h.actions.map(action => action.type), ["verify", "signOut", "navigate"]);
    const retry = new URL(h.actions[2].url, origin);
    assert.equal(retry.pathname, "/membership-access");
    assert.equal(retry.searchParams.get("token"), "sample-token");
    assert.equal(retry.searchParams.get("redirect_url"), target);
    const afterLogout = page({ token: retry.searchParams.get("token"), destination: retry.searchParams.get("redirect_url") });
    await afterLogout.run();
    assert.equal(afterLogout.actions.at(-1).url, target);
});

test("the matching signed-in member is verified and opens fresh resource data without logging out", async () => {
    const h = page({ userId: "user_member" });
    await h.run();
    assert.deepEqual(h.actions.map(action => action.type), ["verify", "navigate"]);
    assert.equal(h.actions.at(-1).url, target);
});

test("copied Markdown backslashes do not become part of the login token", async () => {
    const h = page({ token: "sample-token\\" });
    await h.run();
    assert.equal(h.actions[0].body.token, "sample-token");
    assert.equal(h.actions.at(-1).url, target);
});

test("missing, expired, and unverifiable links cannot open or log out a different account", async () => {
    for (const options of [
        { token: null },
        { token: "\\" },
        { ok: false, response: { error: "Invalid or expired membership access link" } },
        { response: { ticket: "sample-ticket" } },
    ]) {
        const h = page({ userId: "user_other", ...options });
        await h.run();
        assert.equal(h.states[0], "error");
        assert.ok(h.actions.every(action => action.type === "verify"));
    }
});

test("session and logout errors cannot silently open the wrong account", async () => {
    for (const options of [
        { signInError: new Error("Already signed in") },
        { userId: "user_other", signOutError: new Error("Logout unavailable") },
    ]) {
        const h = page(options);
        await h.run();
        assert.equal(h.states[0], "error");
        assert.ok(h.actions.every(action => action.type !== "navigate" && action.type !== "setActive"));
    }
});

test("ordinary links keep the dashboard destination, external redirects are rejected, and loading waits", async () => {
    const normal = page({ destination: null });
    await normal.run();
    assert.ok(normal.actions.at(-1).url.startsWith("/dashboard?reload="));
    for (const destination of ["https://other.example", "//other.example", "/auth"]) {
        const h = page({ destination });
        await h.run();
        assert.equal(h.actions.at(-1).url, "/");
    }
    const loading = page({ isLoaded: false });
    await loading.run();
    assert.deepEqual(loading.actions, []);
});

test("API validates normalized tokens, returns the linked Clerk ID, and forbids caching on every response", async () => {
    let member = { id: 42, clerk_id: "user_member", email: "member@example.test" };
    let fails = false;
    const tickets = [];
    const lookups = [];
    const { NO_CACHE_HEADERS } = load("lib/api/no-cache.ts");
    const { GET, POST } = load("app/api/auth/membership-access/route.ts", {
        "next/server": { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200, headers: options.headers }) } },
        "@clerk/nextjs/server": { createClerkClient: () => ({ signInTokens: { createSignInToken: async params => {
            tickets.push(params);
            return { token: `sample-ticket-${tickets.length}` };
        } } }) },
        "@/lib/db": { query: () => { throw new Error("Existing profile data must not change"); } },
        "@/lib/queries": { getUserByMagicToken: async token => {
            lookups.push(token);
            if (fails) throw new Error("Database unavailable");
            return member;
        } },
        "@/lib/api/no-cache": { NO_CACHE_HEADERS },
    }, { process: { env: {} } });
    const request = token => {
        const nextUrl = new URL("/api/auth/membership-access", origin);
        if (token !== null) nextUrl.searchParams.set("token", token);
        return { nextUrl };
    };
    const responses = [await GET(request("sample-token\\"))];
    assert.equal(lookups[0], "sample-token");
    assert.equal(responses[0].body.userId, "user_member");
    assert.equal(responses[0].body.ticket, "sample-ticket-1");
    assert.equal(tickets[0].userId, "user_member");
    assert.equal(tickets[0].expiresInSeconds, 300);
    const post = await POST({ json: async () => ({ token: "sample-token\\" }) });
    assert.equal(post.status, 200);
    assert.equal(post.body.userId, "user_member");
    assert.equal(post.headers["CDN-Cache-Control"], "no-store");
    assert.equal(lookups[1], "sample-token");
    const nextPost = await POST({ json: async () => ({ token: "sample-token" }) });
    assert.notEqual(post.body.ticket, nextPost.body.ticket, "Each POST must mint a fresh sign-in ticket");
    responses.push(await GET(request(null)));
    member = null;
    responses.push(await GET(request("expired-token")));
    fails = true;
    responses.push(await GET(request("sample-token")));
    assert.deepEqual(responses.map(response => response.status), [200, 400, 401, 500]);
    assert.equal(tickets.length, 3);
    for (const body of [null, { token: 42 }, {}]) {
        const invalid = await POST({ json: async () => body });
        assert.equal(invalid.status, 400);
        assert.equal(invalid.headers["CDN-Cache-Control"], "no-store");
    }
    const malformed = await POST({ json: async () => { throw new Error("Malformed JSON"); } });
    assert.equal(malformed.status, 400);
    for (const response of responses) {
        assert.match(response.headers["Cache-Control"], /no-store/);
        assert.equal(response.headers["CDN-Cache-Control"], "no-store");
        assert.equal(response.headers["Cloudflare-CDN-Cache-Control"], "no-store");
    }
});

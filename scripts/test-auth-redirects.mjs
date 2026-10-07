// Offline auth routing checks: no browser, server, OAuth provider, or Clerk API calls.
// Run: node --test scripts/test-auth-redirects.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import { createRedirect } from "@clerk/backend/internal";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://www.energdive.com";
const quietConsole = { log() {}, warn() {}, error() {} };

function load(file, mocks = {}, globals = {}) {
    const source = ts.transpileModule(readFileSync(path.join(root, file), "utf8"), {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2020,
            jsx: ts.JsxEmit.ReactJSX,
        },
    }).outputText;
    const exports = {};
    vm.runInNewContext(source, {
        exports, URL, URLSearchParams, console: quietConsole,
        require(name) {
            if (!(name in mocks)) throw new Error(`Unexpected import in offline test: ${name}`);
            return mocks[name];
        },
        ...globals,
    }, { filename: file });
    return exports;
}

function browser({ search = "", storedTarget = null, cookie = "", blockedStorage = false } = {}) {
    const storage = new Map(storedTarget ? [["energdive_post_auth_redirect", storedTarget]] : []);
    const navigations = [];
    const globals = {
        window: { location: { origin, search, pathname: "/auth/sso-callback", replace: target => navigations.push(target) } },
        document: { cookie },
        sessionStorage: {
            getItem(key) { if (blockedStorage) throw new Error("Storage blocked"); return storage.get(key) ?? null; },
            setItem(key, value) { if (blockedStorage) throw new Error("Storage blocked"); storage.set(key, value); },
            removeItem(key) { if (blockedStorage) throw new Error("Storage blocked"); storage.delete(key); },
        },
    };
    return { globals, storage, navigations, redirects: load("lib/post-auth-redirect.ts", {}, globals) };
}

function reactHarness() {
    const effects = [];
    const jsx = (type, props) => ({ type, props });
    return {
        effects,
        mocks: {
            react: {
                useCallback: callback => callback,
                useEffect: callback => effects.push(callback),
                useRef: current => ({ current }),
                useState: initial => [typeof initial === "function" ? initial() : initial, () => {}],
            },
            "react/jsx-runtime": { jsx, jsxs: jsx },
        },
    };
}

function find(tree, predicate) {
    if (!tree || typeof tree !== "object") return null;
    if (Array.isArray(tree)) {
        for (const child of tree) {
            const match = find(child, predicate);
            if (match) return match;
        }
        return null;
    }
    return predicate(tree) ? tree : find(tree.props?.children, predicate);
}

test("local return URLs survive query and fragment while auth destinations cannot loop", () => {
    const h = browser();
    for (const target of ["/dashboard/settings?tab=profile#contact", "/events?filter=upcoming", "/authentic-story"]) {
        assert.equal(h.redirects.getSafeRedirectPath(target), target);
        assert.equal(h.redirects.getSafeRedirectPath(`${origin}${target}`), target);
    }
    for (const target of [
        "/auth", "/auth?redirect_url=%2Fdashboard", "/auth#sign-in", "/auth/sso-callback?redirect_url=%2Fdashboard",
        "https://calm-macaque-25.accounts.dev/sign-in", "//other.example/sign-in", "/\\other.example/sign-in",
    ]) {
        assert.equal(h.redirects.getSafeRedirectPath(target), "/");
    }
});

test("OAuth callback query preserves return target when browser storage is blocked", () => {
    const target = "/dashboard/settings?tab=profile#contact";
    const h = browser({ blockedStorage: true });
    const callbackUrl = new URL(h.redirects.getSsoCallbackUrl(target), origin);
    assert.equal(callbackUrl.pathname, "/auth/sso-callback");
    assert.equal(callbackUrl.searchParams.get("redirect_url"), target);
    h.globals.window.location.search = callbackUrl.search;
    assert.equal(h.redirects.getSafeRedirectFromClient(), target);
    assert.doesNotThrow(() => h.redirects.clearPostAuthRedirect());

    const cookieOnly = browser({ blockedStorage: true, cookie: `energdive_post_auth_redirect=${encodeURIComponent(target)}` });
    assert.equal(cookieOnly.redirects.getSafeRedirectFromClient(), target);
});

test("SSO callback supplies local login recovery and a sanitized success destination", () => {
    for (const requestedTarget of ["/dashboard?tab=profile#contact", "https://calm-macaque-25.accounts.dev/sign-in", "/auth?redirect_url=%2Fdashboard"]) {
        const h = browser({ search: `?${new URLSearchParams({ redirect_url: requestedTarget })}` });
        const react = reactHarness();
        const callbackType = () => null;
        const component = load("app/auth/sso-callback/page.tsx", {
            ...react.mocks,
            "@clerk/nextjs": { useAuth: () => ({ isLoaded: true, isSignedIn: false }), AuthenticateWithRedirectCallback: callbackType },
            "@/lib/post-auth-redirect": h.redirects,
        }, h.globals).default;
        const callback = find(component(), element => element.type === callbackType);
        assert.ok(callback);
        const target = h.redirects.getSafeRedirectPath(requestedTarget);
        for (const property of ["signInUrl", "signUpUrl"]) {
            const destination = new URL(callback.props[property], origin);
            assert.equal(destination.origin, origin);
            assert.equal(destination.pathname, "/auth");
            assert.equal(destination.searchParams.get("redirect_url"), target);
        }
        assert.equal(callback.props.signInForceRedirectUrl, target);
        assert.equal(callback.props.signUpForceRedirectUrl, target);
        for (const property of ["firstFactorUrl", "secondFactorUrl", "resetPasswordUrl"]) {
            assert.equal(property in callback.props, false, "Required authentication factors retain Clerk's configured flow");
        }
    }
});

test("completed SSO navigation still works when storage cleanup fails", () => {
    const target = "/dashboard/settings?tab=profile";
    const h = browser({ search: `?${new URLSearchParams({ redirect_url: target })}`, blockedStorage: true });
    const react = reactHarness();
    const component = load("app/auth/sso-callback/page.tsx", {
        ...react.mocks,
        "@clerk/nextjs": { useAuth: () => ({ isLoaded: true, isSignedIn: true }), AuthenticateWithRedirectCallback: () => null },
        "@/lib/post-auth-redirect": h.redirects,
    }, h.globals).default;
    component();
    for (const effect of react.effects) assert.doesNotThrow(effect);
    assert.deepEqual(h.navigations, [target]);
});

test("Google and LinkedIn auth-page actions carry the return URL into their callbacks", async () => {
    const target = "/dashboard/settings?tab=profile#contact";
    const h = browser({ search: `?${new URLSearchParams({ redirect_url: target })}`, blockedStorage: true });
    const react = reactHarness();
    const attempts = [];
    const component = load("app/auth/[[...auth]]/page.tsx", {
        ...react.mocks,
        "@clerk/nextjs": {
            useAuth: () => ({ isSignedIn: false }),
            useSignIn: () => ({ isLoaded: true, signIn: { authenticateWithRedirect: async params => attempts.push(params) } }),
            useSignUp: () => ({ isLoaded: true, signUp: {} }),
        },
        "next/navigation": { useSearchParams: () => new URLSearchParams(h.globals.window.location.search) },
        "framer-motion": { motion: { div: "motion.div", p: "motion.p" }, AnimatePresence: "presence" },
        "next/image": { default: "image" },
        "@/components/DotGrid": { default: "dots" },
        "@posthog/react": { usePostHog: () => null },
        "@/lib/post-auth-redirect": h.redirects,
    }, h.globals).default;
    const tree = component();
    for (const effect of react.effects) assert.doesNotThrow(effect, "Blocked storage cannot stop auth-page mounting");
    for (const label of ["Continue with Google", "Continue with LinkedIn"]) {
        const button = find(tree, element => element.type === "button" && element.props.children.includes(label));
        assert.ok(button);
        await button.props.onClick();
    }
    assert.deepEqual(attempts.map(attempt => attempt.strategy), ["oauth_google", "oauth_linkedin_oidc"]);
    for (const attempt of attempts) {
        assert.equal(attempt.redirectUrlComplete, attempt.redirectUrl);
        const destination = new URL(attempt.redirectUrl, origin);
        assert.equal(destination.pathname, "/auth/sso-callback");
        assert.equal(destination.searchParams.get("redirect_url"), target);
    }
});

test("signed-out protected requests use middleware's local login URL without an environment override", async () => {
    const { default: middleware } = load("proxy.ts", {
        "@clerk/nextjs/server": {
            clerkMiddleware: (handler, options) => ({ handler, options }),
            createRouteMatcher: patterns => req => patterns.some(pattern => new RegExp(`^${pattern}$`).test(new URL(req.url).pathname)),
        },
        "next/server": { NextResponse: { next: () => ({ headers: new Headers() }) } },
    }, { process: { env: {} } });
    const returnBackUrl = `${origin}/dashboard/settings?tab=profile`;
    // Synthetic public development key: this does not authenticate or make requests.
    const publishableKey = `pk_test_${Buffer.from("calm-macaque-25.clerk.accounts.dev$").toString("base64")}`;
    const factoryOptions = { baseUrl: origin, publishableKey, redirectAdapter: url => url };
    const defaultRedirect = createRedirect(factoryOptions).redirectToSignIn({ returnBackUrl });
    assert.equal(new URL(defaultRedirect).hostname, "calm-macaque-25.accounts.dev");
    const redirects = createRedirect({ ...factoryOptions, ...middleware.options });
    class SignInRedirect extends Error {
        constructor(url) { super("Sign in required"); this.url = url; }
    }
    const request = { url: returnBackUrl, headers: new Headers() };
    await assert.rejects(
        middleware.handler({ protect: async () => { throw new SignInRedirect(redirects.redirectToSignIn({ returnBackUrl })); } }, request),
        error => {
            assert.ok(error instanceof SignInRedirect);
            const destination = new URL(error.url);
            assert.equal(destination.origin, origin);
            assert.equal(destination.pathname, "/auth");
            assert.equal(destination.searchParams.get("redirect_url"), returnBackUrl);
            return true;
        }
    );
});

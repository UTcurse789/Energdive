// Offline checks of the real modal controller with verified Clerk sessions.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
};
const response = (completed, ok = true) => ({
    ok, json: async () => ({ signedIn: true, onboardingCompleted: completed }),
});

function load(file, mocks, globals) {
    const output = ts.transpileModule(readFileSync(path.join(root, file), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const exports = {};
    vm.runInNewContext(output, {
        exports, URL, URLSearchParams,
        console: { warn() {}, error() {} },
        require(name) {
            assert.ok(name in mocks, "Unexpected import: " + name);
            return mocks[name];
        },
        ...globals,
    }, { filename: file });
    return exports;
}

function find(tree, predicate) {
    if (!tree || typeof tree !== "object") return null;
    if (Array.isArray(tree)) {
        for (const child of tree) {
            const found = find(child, predicate);
            if (found) return found;
        }
        return null;
    }
    return predicate(tree) ? tree : find(tree.props?.children, predicate);
}

function harness({ metadataComplete = false, storedUser = null, blockedStorage = false, signedIn = true, pathname = "/" } = {}) {
    const request = deferred();
    const requests = [];
    const hooks = [];
    const effects = [];
    const storage = new Map(storedUser ? [["onboarding_completed_user", storedUser]] : []);
    let cursor = 0;
    let dirty = true;
    let tree;
    let calls = 0;
    const auth = { isLoaded: true, isSignedIn: signedIn, userId: signedIn ? "user_new" : null };
    const profile = { isLoaded: true, user: { id: "user_new", publicMetadata: { onboarding_completed: metadataComplete } } };
    const location = { pathname, search: "?tab=profile", hash: "#details", origin: "https://www.energdive.com" };
    const globals = {
        window: { location }, document: { cookie: "" },
        sessionStorage: {
            getItem(key) { if (blockedStorage) throw new Error("Storage unavailable"); return storage.get(key) ?? null; },
            setItem(key, value) { if (blockedStorage) throw new Error("Storage unavailable"); storage.set(key, value); },
        },
        fetch: () => {
            const pending = calls === 0 ? request : deferred();
            requests.push(pending);
            calls++;
            return pending.promise;
        },
    };
    const completion = load("lib/onboarding-completion.ts", {}, globals);
    const redirects = load("lib/post-auth-redirect.ts", {}, globals);
    const jsx = (type, props) => ({ type, props });
    const react = {
        useState(initial) {
            const index = cursor++;
            if (!hooks[index]) hooks[index] = { value: typeof initial === "function" ? initial() : initial };
            return [hooks[index].value, next => {
                const value = typeof next === "function" ? next(hooks[index].value) : next;
                if (!Object.is(value, hooks[index].value)) { hooks[index].value = value; dirty = true; }
            }];
        },
        useRef(initial) {
            const index = cursor++;
            if (!hooks[index]) hooks[index] = { current: initial };
            return hooks[index];
        },
        useCallback(callback) { cursor++; return callback; },
        useEffect(callback, dependencies) {
            const index = cursor++;
            const previous = hooks[index];
            if (!previous || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
                const slot = { dependencies, cleanup: previous?.cleanup };
                hooks[index] = slot;
                effects.push(() => { slot.cleanup?.(); slot.cleanup = callback(); });
            }
        },
    };
    const wizardType = () => null;
    const component = load("components/onboarding/onboarding-modal.tsx", {
        react, "react/jsx-runtime": { jsx, jsxs: jsx },
        "@clerk/nextjs": { useAuth: () => auth, useUser: () => profile },
        "next/navigation": { usePathname: () => location.pathname },
        "framer-motion": { motion: { div: "div" }, AnimatePresence: "presence" },
        "next/image": { default: "img" },
        "@/components/onboarding/wizard": { default: wizardType },
        "@/lib/onboarding-completion": completion,
        "@/lib/post-auth-redirect": redirects,
    }, globals).default;
    function render() {
        let rounds = 0;
        while (dirty) {
            assert.ok(rounds++ < 25, "Modal must not enter a render loop");
            dirty = false;
            cursor = 0;
            tree = component();
            for (const effect of effects.splice(0)) effect();
        }
    }
    return {
        request, requests, auth, profile, storage, completion,
        async flush() { dirty = true; for (let i = 0; i < 8; i++) { render(); await Promise.resolve(); } render(); },
        dialog: () => find(tree, item => item.props?.role === "dialog"),
        wizard: () => find(tree, item => item.type === wizardType),
        fetchCount: () => calls,
        changeUser(id) { auth.userId = id; profile.user = { id, publicMetadata: {} }; },
    };
}

test("verified email opens the profile popup before a pending status request resolves", async () => {
    const h = harness();
    await h.flush();
    assert.ok(h.dialog());
    assert.equal(h.wizard().props.returnTo, "/?tab=profile#details");
    assert.equal(h.fetchCount(), 1);
});

test("503 status and failed network cannot suppress the new-user popup", async () => {
    for (const failure of ["503", "network"]) {
        const h = harness();
        await h.flush();
        if (failure === "503") h.request.resolve(response(null, false));
        else h.request.reject(new Error("Network unavailable"));
        await h.flush();
        assert.ok(h.dialog());
    }
});

test("completed Clerk profiles and saved session completion do not reopen", async () => {
    for (const options of [{ metadataComplete: true }, { storedUser: "user_new" }]) {
        const h = harness(options);
        await h.flush();
        assert.equal(h.dialog(), null);
        assert.equal(h.fetchCount(), 0);
    }
});

test("another user's completion and blocked storage do not hide the popup", async () => {
    for (const options of [{ storedUser: "user_other" }, { blockedStorage: true }]) {
        const h = harness(options);
        await h.flush();
        assert.ok(h.dialog());
    }
});

test("saved database completion closes the provisional popup", async () => {
    const h = harness();
    await h.flush();
    h.request.resolve(response(true));
    await h.flush();
    assert.equal(h.dialog(), null);
    assert.equal(h.storage.get("onboarding_completed_user"), "user_new");
});

test("successful save keeps the welcome screen open until Continue", async () => {
    const h = harness();
    await h.flush();
    h.completion.rememberOnboardingCompletion("user_new");
    h.request.resolve(response(true));
    await h.flush();
    assert.ok(h.dialog());
    h.profile.user.publicMetadata.onboarding_completed = true;
    await h.flush();
    assert.ok(h.dialog());
    h.wizard().props.onComplete();
    await h.flush();
    assert.equal(h.dialog(), null);
});

test("signed-out users and auth/callback pages never show onboarding", async () => {
    for (const options of [{ signedIn: false }, { pathname: "/auth" }, { pathname: "/auth/sso-callback" }, { pathname: "/onboarding" }]) {
        const h = harness(options);
        await h.flush();
        assert.equal(h.dialog(), null);
    }
});

test("a previous user's late status response cannot close the current user's wizard", async () => {
    const h = harness();
    await h.flush();
    h.changeUser("user_second");
    await h.flush();
    h.request.resolve(response(true));
    await h.flush();
    assert.ok(h.dialog());
    assert.equal(h.storage.get("onboarding_completed_user"), undefined);
});

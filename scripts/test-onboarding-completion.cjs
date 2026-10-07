// Focused regression checks; no database, SMS, email or Clerk writes.
/* eslint-disable @typescript-eslint/no-require-imports -- This CommonJS harness loads TypeScript with isolated mocks. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, mocks, globals = {}) {
    const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const exports = {};
    vm.runInNewContext(source, {
        exports, console: { log() {}, warn() {}, error() {} },
        require(name) {
            if (!(name in mocks)) throw new Error(`Missing mock: ${name}`);
            return mocks[name];
        },
        ...globals,
    }, { filename: file });
    return exports;
}

async function main() {
    const tasks = [];
    let dbFails = false;
    let signedIn = true;
    let committed = false;
    let integrations = 0;
    const failingIntegration = async () => { integrations++; throw new Error("Integration unavailable"); };
    const mocks = {
        "@clerk/nextjs/server": {
            auth: async () => ({ userId: signedIn ? "user_test" : null }),
            clerkClient: async () => ({ users: {
                getUser: async () => ({ publicMetadata: { phone: "+919000000000" } }),
                updateUser: failingIntegration,
                updateUserMetadata: failingIntegration,
            } }),
        },
        "next/server": {
            after: task => tasks.push(task),
            NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) },
        },
        "@/lib/queries": {
            saveOnboardingProfile: async () => {
                if (dbFails) throw new Error("Transaction rolled back");
                committed = true;
                return 42;
            },
            issueMagicToken: failingIntegration,
        },
        "@/lib/getFullUserProfile": { getFullUserProfile: failingIntegration },
        "@/lib/db": { query: failingIntegration },
        "@/lib/email": { sendMembershipWelcomeCardEmail: failingIntegration, sendWelcomeEmail: failingIntegration },
        "@/lib/lead-sync-orchestrator": { syncEnrichedLead: failingIntegration },
        "@/lib/consent-logger": {
            logConsent: failingIntegration, updateUserConsentFields: failingIntegration, extractIpAddress: () => null,
        },
        "@/lib/data-provenance": { resolveDataSource: () => "website" },
        "@/lib/posthog-server": { getPostHogClient: () => { throw new Error("Analytics unavailable"); } },
    };
    const submit = load("app/api/onboarding/submit/route.ts", mocks).POST;
    const body = {
        firstName: "Test", lastName: "Member", email: "member@example.test",
        industryId: 1, subIndustryId: 2, communitySelections: [{ communityId: 1, subCommunityId: 2 }],
    };
    const request = data => ({ json: async () => data });
    let response = await submit(request(body));
    assert.equal(committed, true);
    assert.equal(response.status, 200);
    assert.equal(response.body.onboardingCompleted, true);
    assert.equal(integrations, 0, "Response must not wait for integrations");
    assert.equal(tasks.length, 1);
    await tasks.shift()();
    assert.equal(response.body.success, true, "Post-save failures cannot undo success");

    dbFails = true;
    committed = false;
    response = await submit(request(body));
    assert.equal(response.status, 500);
    assert.equal(committed, false);
    assert.equal(tasks.length, 0);
    dbFails = false;
    response = await submit(request({ ...body, communitySelections: [] }));
    assert.equal(response.status, 400);
    assert.equal(tasks.length, 0);
    signedIn = false;
    assert.equal((await submit(request(body))).status, 401);

    let dbCompleted = true;
    let dbStatusFails = false;
    let dbUserFound = true;
    let legacyCompleted = false;
    let legacyLookupFails = false;
    let clerkChecks = 0;
    let clerkCompleted = false;
    let clerkStatusFails = false;
    let primaryEmail = null;
    let primaryEmailVerified = true;
    const statusQueries = [];
    const status = load("app/api/onboarding/status/route.ts", {
        "@clerk/nextjs/server": {
            auth: async () => ({ userId: signedIn ? "user_test" : null }),
            currentUser: async () => {
                clerkChecks++;
                if (clerkStatusFails) throw new Error("Clerk unavailable");
                return {
                    publicMetadata: { onboarding_completed: clerkCompleted },
                    primaryEmailAddress: primaryEmail ? {
                        emailAddress: primaryEmail,
                        verification: { status: primaryEmailVerified ? "verified" : "unverified" },
                    } : null,
                };
            },
        },
        "next/server": mocks["next/server"],
        "@/lib/db": { query: async (sql, params) => {
            statusQueries.push({ sql, params });
            if (dbStatusFails) throw new Error("Database unavailable");
            if (sql.includes("LOWER(email)")) {
                if (legacyLookupFails) throw new Error("Legacy lookup unavailable");
                return { rows: [{ onboarding_completed: legacyCompleted }] };
            }
            return { rows: dbUserFound ? [{ onboarding_completed: dbCompleted }] : [] };
        } },
        "@/lib/api/no-cache": { NO_CACHE_HEADERS: {} },
    }).GET;
    signedIn = true;
    assert.equal((await status()).body.onboardingCompleted, true);
    assert.equal(clerkChecks, 0, "Committed profile wins over stale/unavailable Clerk metadata");
    dbCompleted = false;
    assert.equal((await status()).body.onboardingCompleted, false);
    clerkCompleted = true;
    assert.equal((await status()).body.onboardingCompleted, true);

    dbStatusFails = true;
    response = await status();
    assert.equal(response.status, 200);
    assert.equal(response.body.onboardingCompleted, true, "Clerk completion survives a database outage");
    clerkCompleted = false;
    response = await status();
    assert.equal(response.status, 503);
    assert.equal(response.body.onboardingCompleted, null, "An unavailable database is not evidence of an incomplete profile");
    assert.equal(response.body.signedIn, true);
    clerkStatusFails = true;
    response = await status();
    assert.equal(response.status, 503);
    assert.equal(response.body.onboardingCompleted, null);
    dbStatusFails = false;
    dbCompleted = true;
    const checksBeforeSavedProfile = clerkChecks;
    response = await status();
    assert.equal(response.status, 200);
    assert.equal(response.body.onboardingCompleted, true);
    assert.equal(clerkChecks, checksBeforeSavedProfile, "A saved profile does not depend on Clerk availability");
    dbCompleted = false;
    response = await status();
    assert.equal(response.status, 503, "Unavailable metadata cannot establish incomplete status");
    clerkStatusFails = false;

    dbUserFound = false;
    legacyCompleted = true;
    primaryEmail = "Legacy.Member@example.test";
    response = await status();
    assert.equal(response.status, 200);
    assert.equal(response.body.onboardingCompleted, true, "Verified primary email finds a completed legacy profile");
    const legacyQuery = statusQueries.at(-1);
    assert.ok(legacyQuery.sql.includes("LOWER(email) = LOWER($1)"));
    assert.equal(legacyQuery.params[0], primaryEmail, "Authenticated email is supplied as a query parameter");
    primaryEmailVerified = false;
    const queriesBeforeUnverifiedEmail = statusQueries.length;
    response = await status();
    assert.equal(response.body.onboardingCompleted, false, "Unverified email cannot claim another completed profile");
    assert.equal(statusQueries.length, queriesBeforeUnverifiedEmail + 1, "Unverified email only performs the Clerk-ID lookup");
    primaryEmailVerified = true;
    legacyLookupFails = true;
    response = await status();
    assert.equal(response.status, 503);
    assert.equal(response.body.onboardingCompleted, null, "Legacy lookup failure leaves status unknown");
    legacyLookupFails = false;
    dbStatusFails = true;
    const queriesBeforeDatabaseOutage = statusQueries.length;
    response = await status();
    assert.equal(response.status, 503);
    assert.equal(statusQueries.length, queriesBeforeDatabaseOutage + 1, "Database outage does not trigger a second database wait");
    signedIn = false;
    assert.equal((await status()).body.signedIn, false);

    const storage = new Map();
    const completion = load("lib/onboarding-completion.ts", {}, {
        sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    });
    completion.rememberOnboardingCompletion("user_a");
    assert.equal(completion.hasCompletedOnboarding("user_a"), true);
    assert.equal(completion.hasCompletedOnboarding("user_b"), false);
    const blockedStorage = load("lib/onboarding-completion.ts", {}, {
        sessionStorage: { getItem() { throw new Error("Blocked"); }, setItem() { throw new Error("Blocked"); } },
    });
    assert.doesNotThrow(() => blockedStorage.rememberOnboardingCompletion("user_a"));
    assert.equal(blockedStorage.hasCompletedOnboarding("user_a"), false);
    console.log("PASS: committed save, failed integrations, rollback, validation, auth, stale metadata, status outages, verified-email fallback, user-scoped completion, blocked storage");
}

main().catch(error => { console.error(error); process.exitCode = 1; });

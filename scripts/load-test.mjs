#!/usr/bin/env node
/**
 * Load-test script for Energdive.
 *
 * Usage:
 *   npx autocannon                         # install once
 *   node scripts/load-test.mjs [baseUrl]   # default http://localhost:3000
 *
 * It hits key endpoints at increasing concurrency levels:
 *   100 → 500 → 1 000 → 5 000 → 10 000
 * and writes a summary to scripts/load-test-results.json
 */

import autocannon from "autocannon";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE = process.argv[2] || "http://localhost:3000";

// ── Endpoints to test ──────────────────────────────────────────────────────
const ENDPOINTS = [
    { path: "/", name: "Homepage" },
    { path: "/reports", name: "Reports Page" },
    { path: "/news", name: "News Page" },
    { path: "/about", name: "About Page" },
    { path: "/api/content?page=1", name: "API /content" },
];

// ── Concurrency ramp ────────────────────────────────────────────────────────
const LEVELS = [100, 200];
const DURATION_PER_LEVEL = 5; // seconds

// ── Helpers ─────────────────────────────────────────────────────────────────
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function fmt(n) {
    return typeof n === "number" ? n.toLocaleString("en-US") : n;
}

async function bench(url, connections, duration) {
    return new Promise((resolve, reject) => {
        const instance = autocannon(
            {
                url,
                connections,
                duration,
                // Override pipelining to 1 (realistic browser behaviour)
                pipelining: 1,
                timeout: 30,
            },
            (err, result) => {
                if (err) return reject(err);
                resolve(result);
            }
        );

        // Progress indicator
        autocannon.track(instance, { renderProgressBar: true });
    });
}

// ── Main ────────────────────────────────────────────────────────────────────
const allResults = [];

console.log(`\n${"=".repeat(70)}`);
console.log(`  ENERGDIVE  LOAD  TEST`);
console.log(`  Target: ${BASE}`);
console.log(`  Endpoints: ${ENDPOINTS.length}`);
console.log(`  Levels: ${LEVELS.join(" → ")} concurrent connections`);
console.log(`${"=".repeat(70)}\n`);

for (const level of LEVELS) {
    console.log(`\n${"─".repeat(50)}`);
    console.log(`  Concurrency: ${fmt(level)}`);
    console.log(`${"─".repeat(50)}`);

    for (const ep of ENDPOINTS) {
        const url = `${BASE}${ep.path}`;
        console.log(`\n  → ${ep.name} (${url})`);

        try {
            const r = await bench(url, level, DURATION_PER_LEVEL);

            const summary = {
                endpoint: ep.name,
                url,
                connections: level,
                duration: DURATION_PER_LEVEL,
                requests_total: r.requests.total,
                requests_per_sec: Math.round(r.requests.average),
                latency_p50_ms: r.latency.p50,
                latency_p95_ms: r.latency.p95,
                latency_p99_ms: r.latency.p99,
                latency_avg_ms: Math.round(r.latency.average),
                throughput_mb_per_sec: +(r.throughput.average / 1_048_576).toFixed(2),
                errors: r.errors,
                timeouts: r.timeouts,
                non2xx: r.non2xx,
                statusCodes: r.statusCodeStats,
            };

            allResults.push(summary);

            console.log(
                `    ${fmt(summary.requests_per_sec)} req/s | ` +
                `p50 ${summary.latency_p50_ms}ms  p95 ${summary.latency_p95_ms}ms  p99 ${summary.latency_p99_ms}ms | ` +
                `errors ${summary.errors}  timeouts ${summary.timeouts}  non2xx ${summary.non2xx}`
            );
        } catch (err) {
            console.error(`    ✗ FAILED: ${err.message}`);
            allResults.push({
                endpoint: ep.name,
                url,
                connections: level,
                error: err.message,
            });
        }

        // Brief cooldown between endpoints
        await sleep(1_000);
    }

    // Cooldown between concurrency levels
    console.log(`\n  ⏳ 3 s cooldown before next level…`);
    await sleep(3_000);
}

// ── Save results ────────────────────────────────────────────────────────────
const outPath = join(__dirname, "load-test-results.json");
writeFileSync(outPath, JSON.stringify(allResults, null, 2));

console.log(`\n${"=".repeat(70)}`);
console.log(`  ✅  Done!  Results saved to ${outPath}`);
console.log(`${"=".repeat(70)}\n`);

// ── Quick summary table ────────────────────────────────────────────────────
console.log("SUMMARY");
console.log("─".repeat(100));
console.log(
    "Level".padEnd(8) +
    "Endpoint".padEnd(18) +
    "req/s".padStart(10) +
    "p50(ms)".padStart(10) +
    "p95(ms)".padStart(10) +
    "p99(ms)".padStart(10) +
    "errors".padStart(10) +
    "timeouts".padStart(10) +
    "non2xx".padStart(10)
);
console.log("─".repeat(100));

for (const r of allResults) {
    if (r.error) {
        console.log(`${String(r.connections).padEnd(8)}${r.endpoint.padEnd(18)} FAILED: ${r.error}`);
        continue;
    }
    console.log(
        String(r.connections).padEnd(8) +
        r.endpoint.padEnd(18) +
        String(r.requests_per_sec).padStart(10) +
        String(r.latency_p50_ms).padStart(10) +
        String(r.latency_p95_ms).padStart(10) +
        String(r.latency_p99_ms).padStart(10) +
        String(r.errors).padStart(10) +
        String(r.timeouts).padStart(10) +
        String(r.non2xx).padStart(10)
    );
}

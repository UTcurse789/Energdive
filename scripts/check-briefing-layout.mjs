// Run after preview:briefing. Uses an installed Playwright, or set
// BRIEFING_PLAYWRIGHT_MODULE to its package path. Never opens an email account.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const playwright = require(process.env.BRIEFING_PLAYWRIGHT_MODULE || "playwright");
const directory = path.resolve("scratch/briefing-preview");
const results = [];
for (const engine of ["chromium", "webkit"]) {
    const browser = await playwright[engine].launch({ headless: true });
    try {
        for (const frequency of ["daily", "weekly"]) {
            for (const width of [1024, 375, 320]) {
                const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
                await page.goto(pathToFileURL(path.join(directory, `${frequency}.html`)).href);
                await page.evaluate(() => Promise.all([...document.images].map(img => img.decode())));
                const result = await page.evaluate(() => {
                    const images = [...document.images].map(img => {
                        const box = img.getBoundingClientRect();
                        const cell = img.closest("td").getBoundingClientRect();
                        return { title: img.alt, width: box.width, height: box.height, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight,
                            proportional: Math.abs(box.width / box.height - img.naturalWidth / img.naturalHeight) / (img.naturalWidth / img.naturalHeight) < 0.03,
                            insideCell: box.left >= cell.left - 1 && box.right <= cell.right + 1,
                            clipped: [...(function* () { let ancestor = img.parentElement; while (ancestor) { yield ancestor; ancestor = ancestor.parentElement; } })()].some(el => ["hidden", "clip"].includes(getComputedStyle(el).overflowY)) };
                    });
                    return { images, overflow: document.documentElement.scrollWidth > innerWidth + 1,
                        whiteNews: [...document.querySelectorAll(".top-news-thumb,.top-news-copy,.top-news-action,.briefing-image-frame")].every(el => getComputedStyle(el).backgroundColor === "rgb(255, 255, 255)"),
                        stories: document.querySelectorAll(".top-news-thumb").length };
                });
                assert.equal(result.overflow, false, `${engine} ${frequency} ${width}: horizontal overflow`);
                assert.equal(result.whiteNews, true, "News backgrounds must match white");
                assert.equal(result.stories, 4);
                for (const img of result.images) {
                    assert.ok(img.proportional && img.insideCell && !img.clipped, JSON.stringify(img));
                }
                await page.screenshot({ path: path.join(directory, `${frequency}-${engine}-${width}.png`), fullPage: true });
                // CSS-independent aspect-ratio fallback, as used by clients
                // that ignore object-fit. Images must still be proportional.
                await page.evaluate(() => { for (const img of document.images) img.style.objectFit = "fill"; });
                const fallback = await page.evaluate(() => [...document.images].every(img => {
                    const box = img.getBoundingClientRect(); return Math.abs(box.width / box.height - img.naturalWidth / img.naturalHeight) / (img.naturalWidth / img.naturalHeight) < 0.03;
                }));
                assert.ok(fallback, "Fallback without object-fit must preserve aspect ratio");
                results.push({ engine, frequency, width, images: result.images.length, passed: true });
                await page.close();
            }
        }
    } finally { await browser.close(); }
}
await writeFile(path.join(directory, "layout-results.json"), JSON.stringify(results, null, 2));
console.log(`${results.length} rendered layout checks passed (Chromium/WebKit, daily/weekly, desktop/mobile).`);

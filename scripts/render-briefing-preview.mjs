// Offline HTML previews: no environment credentials, CMS changes or SMTP calls.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { harness, root, story, friday } from "./briefing-test-support.mjs";

const out = path.resolve(root, "scratch/briefing-preview");
await mkdir(out, { recursive: true });
async function asset(filename) {
    const buffer = await readFile(filename); const metadata = await sharp(buffer).metadata();
    return { url: `data:image/${metadata.format === "jpg" ? "jpeg" : metadata.format};base64,${buffer.toString("base64")}`, width: metadata.width, height: metadata.height };
}
async function graphic(width, height, label, color) {
    const buffer = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${color}"/><rect x="3" y="3" width="${width - 6}" height="${height - 6}" rx="8" fill="none" stroke="#0b6b55" stroke-width="6"/><circle cx="20" cy="20" r="10" fill="#0b6b55"/><circle cx="${width - 20}" cy="${height - 20}" r="10" fill="#0b6b55"/><text x="50%" y="52%" text-anchor="middle" font-family="Arial" font-size="${Math.min(width, height) / 10}" fill="#0b6b55">${label}</text></svg>`)).png().toBuffer();
    return { url: `data:image/png;base64,${buffer.toString("base64")}`, width, height };
}
let portrait;
try { portrait = await asset(path.resolve(root, "scratch/briefing-portrait-original.png")); }
catch { portrait = await asset(path.resolve(root, "public/abhishek-bhatnagar.jpg")); }
const [landscape, square, logo] = await Promise.all([graphic(1200, 675, "Landscape: full border visible", "#e9f1ee"), graphic(600, 600, "Square", "#f4eedf"), graphic(1800, 300, "Wide logo: full border visible", "#e6eef7")]);
const raw = [
    story("portrait", friday, "News", { Title: "Original portrait: head and full frame stay visible", Excerpt: "A portrait test using an original CMS interview asset. White padding fills the unused space without cropping.", FeaturedImage: portrait }),
    story("landscape", friday, "News", { Title: "Every landscape edge stays inside the news image area", Excerpt: "The complete green border and both corner markers should remain visible on desktop and mobile.", FeaturedImage: landscape }),
    story("square", friday, "News", { Title: "Square graphics retain their aspect ratio", Excerpt: "Top Stories has no fixed story cap, and every row uses the same white background.", FeaturedImage: square }),
    story("logo", friday, "News", { Title: "Wide logos fit without stretching or cropping", Excerpt: "Explicit proportional image dimensions provide a fallback for clients that ignore object-fit.", FeaturedImage: logo }),
    story("sat", "2026-10-03T08:00:00Z", "News", { Title: "Saturday news appears in the weekly roundup", FeaturedImage: landscape }),
    story("sun", "2026-10-04T08:00:00Z", "News", { Title: "Sunday coverage is included without weekend sending", FeaturedImage: square }),
    story("mon", "2026-10-05T08:00:00Z", "News", { Title: "One top story for Monday", FeaturedImage: logo }),
    story("article", "2026-09-25T08:00:00Z", "Articles", { Title: "An article from the published editorial catalogue", Excerpt: "Featured Articles rotates three cards and includes a mix of articles, interviews and opinions.", FeaturedImage: square }),
    story("interview", "2026-09-25T08:00:00Z", "Opinion", { Title: "Electrification Can Give Us a Big Push Towards Decarbonisation", Excerpt: "The original 1200 by 1500 interview portrait remains completely visible within its padded card.", content_tag: { title: "Interview" }, FeaturedImage: portrait }),
    story("opinion", "2026-09-25T08:00:00Z", "Opinion", { Title: "An opinion card with a wide graphic", Excerpt: "The image uses its original proportions, centered against the same white background as the card.", FeaturedImage: logo }),
];
const h = harness({ now: friday }); const content = h.load("lib/briefing-content"); const email = h.load("lib/email");
const catalog = raw.map(item => content.normalizeBriefingContent(item, new Date(friday))).filter(Boolean);
// The production media resolver expects CMS HTTP URLs. Inline the fixture
// assets only in these offline documents, after content normalization.
for (const item of catalog) if (item.imageUrl?.includes("/data:image/")) item.imageUrl = item.imageUrl.slice(item.imageUrl.indexOf("data:image/"));
const articles = content.selectFeatured(catalog, "2026-10-09");
const logoAsset = await asset(path.resolve(root, "public/Energdive-Logo.png"));
for (const frequency of ["daily", "weekly"]) {
    const sections = content.buildBriefingSections(catalog, frequency, new Date(friday));
    const result = await email.renderPreferenceDigestEmail("preview@example.test", "Anita", frequency, sections, null, {
        trending: [], articles, jobs: [], editionDate: new Date(friday),
        coveredDates: frequency === "weekly" ? { start: new Date("2026-10-03T00:00:00+05:30"), end: new Date(friday) } : undefined,
    });
    await writeFile(path.join(out, `${frequency}.html`), result.htmlContent.replaceAll("https://www.energdive.com/Energdive-Logo.png", logoAsset.url));
}
console.log(`Offline daily and weekly previews: ${out}`);

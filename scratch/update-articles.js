const fs = require('fs');
const path = require('path');

const targetDirs = [
    'analysis',
    'case-study',
    'cover-story',
    'editorial',
    'feature',
    'featured-stories',
    'interview',
    'interviews',
    'opinion',
    'reports'
];

const appDir = path.join(__dirname, '../app');

// Get the reference template from news
const newsPath = path.join(appDir, 'news', '[slug]', 'page.tsx');
const newsContent = fs.readFileSync(newsPath, 'utf8');

// Extract the <main>...</main> block
const mainMatch = newsContent.match(/(<main className="pt-20 pb-24">[\s\S]*?<\/main>)/);
if (!mainMatch) {
    console.error("Could not find <main> in news/page.tsx");
    process.exit(1);
}
let baseMainBlock = mainMatch[1];

// We need to inject `const canonicalUrl = getCanonicalUrl('/route/${slug}');` before `return (` if it's missing.

const newImports = `
import { ArticleReadTime } from "@/components/article/ArticleReadTime";
import { AuthorBioBox } from "@/components/article/AuthorBioBox";
import { ArticleNewsletterCTA } from "@/components/article/ArticleNewsletterCTA";
import { ArticleStickyShare } from "@/components/article/ArticleStickyShare";
import { SaveArticleButton } from "@/components/article/SaveArticleButton";
import { getCanonicalUrl } from "@/lib/seo";
`;

for (const dir of targetDirs) {
    const pagePath = path.join(appDir, dir, '[slug]', 'page.tsx');
    if (!fs.existsSync(pagePath)) {
        console.log(`Skipping ${dir} - not found`);
        continue;
    }
    
    let content = fs.readFileSync(pagePath, 'utf8');
    
    // Replace <main> block
    const localMainMatch = content.match(/<main className="pt-20 pb-24">[\s\S]*?<\/main>/);
    if (!localMainMatch) {
        console.log(`Skipping ${dir} - could not find <main> block`);
        continue;
    }
    
    // Replace canonicalUrl in the baseMainBlock
    let localMainBlock = baseMainBlock.replace(
        /getCanonicalUrl\(`\/news\/\$\{slug\}`\)/g,
        `getCanonicalUrl(\`/${dir}/\$\{slug\}\`)`
    ).replace(
        /url=\{`https:\/\/www.energdive.com\/news\/\$\{slug\}`\}/g,
        `url={\`https://www.energdive.com/${dir}/\$\{slug\}\`}`
    );
    // Note: The share button inside the new main block uses `canonicalUrl`, so it's fine.

    // Check if canonicalUrl is defined in the component body
    if (!content.includes('const canonicalUrl = ')) {
        content = content.replace(/return \(/, `const canonicalUrl = getCanonicalUrl(\`/${dir}/\$\{slug\}\`);\n\n    return (`);
    }
    
    content = content.replace(localMainMatch[0], localMainBlock);
    
    // Add imports
    const importChecks = [
        "ArticleReadTime",
        "AuthorBioBox",
        "ArticleNewsletterCTA",
        "ArticleStickyShare",
        "SaveArticleButton",
        "getCanonicalUrl"
    ];
    
    let importsToAdd = "";
    if (!content.includes("ArticleReadTime")) importsToAdd += `import { ArticleReadTime } from "@/components/article/ArticleReadTime";\n`;
    if (!content.includes("AuthorBioBox")) importsToAdd += `import { AuthorBioBox } from "@/components/article/AuthorBioBox";\n`;
    if (!content.includes("ArticleNewsletterCTA")) importsToAdd += `import { ArticleNewsletterCTA } from "@/components/article/ArticleNewsletterCTA";\n`;
    if (!content.includes("ArticleStickyShare")) importsToAdd += `import { ArticleStickyShare } from "@/components/article/ArticleStickyShare";\n`;
    if (!content.includes("SaveArticleButton")) importsToAdd += `import { SaveArticleButton } from "@/components/article/SaveArticleButton";\n`;
    if (!content.includes("getCanonicalUrl")) importsToAdd += `import { getCanonicalUrl } from "@/lib/seo";\n`;
    
    if (importsToAdd) {
        // Insert after the last import
        const lastImportIndex = content.lastIndexOf("import ");
        const endOfLastImport = content.indexOf("\n", lastImportIndex) + 1;
        content = content.slice(0, endOfLastImport) + importsToAdd + content.slice(endOfLastImport);
    }
    
    fs.writeFileSync(pagePath, content);
    console.log(`Updated ${dir}/[slug]/page.tsx`);
}

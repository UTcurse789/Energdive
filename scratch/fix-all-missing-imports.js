const fs = require('fs');
const path = require('path');

const walkSync = (dir, callback) => {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        var filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) {
            walkSync(filepath, callback);
        } else if (stats.isFile()) {
            callback(filepath);
        }
    });
};

const appDir = path.join(__dirname, '../app');

const importsToEnsure = [
    { name: "ArticleReadTime", statement: 'import { ArticleReadTime } from "@/components/article/ArticleReadTime";' },
    { name: "AuthorBioBox", statement: 'import { AuthorBioBox } from "@/components/article/AuthorBioBox";' },
    { name: "ArticleNewsletterCTA", statement: 'import { ArticleNewsletterCTA } from "@/components/article/ArticleNewsletterCTA";' },
    { name: "ArticleStickyShare", statement: 'import { ArticleStickyShare } from "@/components/article/ArticleStickyShare";' },
    { name: "SaveArticleButton", statement: 'import { SaveArticleButton } from "@/components/article/SaveArticleButton";' },
    { name: "AdBanner", statement: 'import { AdBanner } from "@/components/ads/AdBanner";' }
];

walkSync(appDir, (filepath) => {
    if (filepath.endsWith('page.tsx')) {
        let content = fs.readFileSync(filepath, 'utf8');
        let modified = false;

        for (const imp of importsToEnsure) {
            // If the component is used in JSX but not imported
            const isUsed = content.includes(`<${imp.name}`);
            const isImported = content.includes(imp.statement) || (content.includes(`import {`) && content.match(new RegExp(`import \\{[^}]*\\b${imp.name}\\b[^}]*\\}`)));
            
            if (isUsed && !isImported) {
                // Prepend the import
                content = `${imp.statement}\n${content}`;
                modified = true;
                console.log(`Added missing import ${imp.name} to ${filepath}`);
            }
        }

        if (modified) {
            fs.writeFileSync(filepath, content);
        }
    }
});

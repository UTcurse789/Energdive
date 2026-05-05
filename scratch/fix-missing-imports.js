const fs = require('fs');
const path = require('path');

const targetDirs = [
    'analysis',
    'articles',
    'case-study',
    'cover-story',
    'feature',
    'featured-stories'
];

const appDir = path.join(__dirname, '../app');

const importsToCheck = [
    {
        name: "ArticleReadTime",
        statement: `import { ArticleReadTime } from "@/components/article/ArticleReadTime";`
    },
    {
        name: "AuthorBioBox",
        statement: `import { AuthorBioBox } from "@/components/article/AuthorBioBox";`
    },
    {
        name: "ArticleNewsletterCTA",
        statement: `import { ArticleNewsletterCTA } from "@/components/article/ArticleNewsletterCTA";`
    },
    {
        name: "ArticleStickyShare",
        statement: `import { ArticleStickyShare } from "@/components/article/ArticleStickyShare";`
    },
    {
        name: "SaveArticleButton",
        statement: `import { SaveArticleButton } from "@/components/article/SaveArticleButton";`
    }
];

for (const dir of targetDirs) {
    const pagePath = path.join(appDir, dir, '[slug]', 'page.tsx');
    if (!fs.existsSync(pagePath)) continue;
    
    let content = fs.readFileSync(pagePath, 'utf8');
    
    let importsToAdd = [];
    for (const imp of importsToCheck) {
        if (!content.includes(imp.statement)) {
            importsToAdd.push(imp.statement);
        }
    }
    
    if (importsToAdd.length > 0) {
        content = importsToAdd.join('\n') + '\n' + content;
        fs.writeFileSync(pagePath, content);
        console.log(`Added missing imports to ${dir}/[slug]/page.tsx`);
    }
}

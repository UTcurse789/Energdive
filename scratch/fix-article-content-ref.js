const fs = require('fs');
const path = require('path');

const targetDirs = [
    'analysis',
    'case-study',
    'cover-story',
    'feature',
    'featured-stories',
    'interview'
];

const appDir = path.join(__dirname, '../app');

for (const dir of targetDirs) {
    const pagePath = path.join(appDir, dir, '[slug]', 'page.tsx');
    if (!fs.existsSync(pagePath)) continue;
    
    let content = fs.readFileSync(pagePath, 'utf8');
    
    if (content.includes('content={articleContent}')) {
        content = content.replace('content={articleContent}', 'content={article.content}');
        fs.writeFileSync(pagePath, content);
        console.log(`Fixed articleContent reference in ${dir}/[slug]/page.tsx`);
    }
}

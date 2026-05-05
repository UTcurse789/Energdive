const fs = require('fs');
const path = require('path');

const targetRegex = /\/\/ Raw date for JSON-LD \(needs ISO-8601, not formatted display string\)\s*const rawDate = attrs\.Date \|\| attrs\.publishedAt \|\| attrs\.createdAt \|\| "";/g;

const replacement = `// Raw date for JSON-LD and display (prioritizing publishedAt for accurate automatic time)
    const rawDate = attrs.publishedAt || attrs.createdAt || attrs.Date || "";`;

function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (item === 'page.tsx') {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.match(targetRegex)) {
                content = content.replace(targetRegex, replacement);
                fs.writeFileSync(fullPath, content);
                console.log(`Updated time logic in ${fullPath}`);
            }
        }
    }
}

processDir(path.join(__dirname, '../app'));
console.log('Done');

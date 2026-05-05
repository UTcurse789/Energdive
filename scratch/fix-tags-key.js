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
let count = 0;

walkSync(appDir, (filepath) => {
    if (filepath.endsWith('.tsx')) {
        let content = fs.readFileSync(filepath, 'utf8');
        let modified = false;

        // Pattern 1: {article.tags.map((tag: any) => (
        if (content.includes('tags.map((tag: any) => (')) {
            content = content.replace(/tags\.map\(\(tag: any\) => \(/g, 'tags.map((tag: any, i: number) => (');
            modified = true;
        }

        // Pattern 2: key={tag.slug} under TagBadge
        // We can just safely replace key={tag.slug} with key={`\${tag.slug}-\${i}`} IF we just did the above replace.
        if (modified && content.includes('key={tag.slug}')) {
            content = content.replace(/key=\{tag\.slug\}/g, 'key={`\\${tag.slug}-\\${i}`}');
        }

        if (modified) {
            fs.writeFileSync(filepath, content);
            console.log(`Fixed tags key in ${filepath}`);
            count++;
        }
    }
});

console.log(`Total files updated: ${count}`);

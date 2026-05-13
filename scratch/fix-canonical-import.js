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

walkSync(appDir, (filepath) => {
    if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
        let content = fs.readFileSync(filepath, 'utf8');
        
        if (content.includes('getCanonicalUrl(') && !content.includes('import { getCanonicalUrl } from "@/lib/seo"')) {
            content = 'import { getCanonicalUrl } from "@/lib/seo";\n' + content;
            fs.writeFileSync(filepath, content);
            console.log(`Added getCanonicalUrl import to ${filepath}`);
        }
    }
});

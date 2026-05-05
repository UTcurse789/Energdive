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
    if (filepath.endsWith('.tsx')) {
        let content = fs.readFileSync(filepath, 'utf8');
        let modified = false;

        // Directly target the exact string I see in the file
        if (content.includes('key={`${tag.slug}-${i}`}}')) {
            content = content.replace('key={`${tag.slug}-${i}`}}', 'key={`${tag.slug}-${i}`}');
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filepath, content);
            console.log(`Fixed extra brace (v2) in key in ${filepath}`);
        }
    }
});

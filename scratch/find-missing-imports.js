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
        
        // Find all JSX tags like <Something
        const jsxTags = [...content.matchAll(/<([A-Z][a-zA-Z0-9]*)/g)].map(m => m[1]);
        
        // Filter out common HTML tags (though we matched [A-Z]) and components that are likely imported
        const uniqueTags = [...new Set(jsxTags)];
        
        const missingImports = [];
        for (const tag of uniqueTags) {
            // Check if it's imported or defined in the file
            // Very simple check: search for 'import {.*tag.*}' or 'import tag' or 'const tag =' or 'function tag'
            const isImported = content.includes(`import {`) && content.match(new RegExp(`import \\{[^}]*\\b${tag}\\b[^}]*\\}`));
            const isDefaultImported = content.match(new RegExp(`import\\s+\\b${tag}\\b`));
            const isDefined = content.match(new RegExp(`(const|function|class|let|var)\\s+\\b${tag}\\b`));
            const isReactFragment = tag === 'React'; // React.Fragment
            
            if (!isImported && !isDefaultImported && !isDefined && !isReactFragment) {
                missingImports.push(tag);
            }
        }
        
        if (missingImports.length > 0) {
            console.log(`Potential missing imports in ${filepath}: ${missingImports.join(', ')}`);
        }
    }
});

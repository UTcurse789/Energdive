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
    if (filepath.endsWith('page.tsx')) {
        let content = fs.readFileSync(filepath, 'utf8');
        
        // If canonicalUrl is used but not defined in the function body
        const isUsed = content.match(/\bcanonicalUrl\b/);
        // This is a rough check for definition in the same file
        // We look for 'const canonicalUrl =' or 'let canonicalUrl ='
        const isDefinedInContent = content.match(/const canonicalUrl\s*=/);
        
        if (isUsed && !isDefinedInContent) {
            // Get the directory name for the route
            const parts = filepath.split(path.sep);
            const appIndex = parts.indexOf('app');
            const routePart = parts[appIndex + 1];
            
            // Special case for interviews
            let route = routePart;
            if (route === 'interview') route = 'interviews';

            const definition = `    const canonicalUrl = getCanonicalUrl(\`/${route}/\${slug}\`);`;
            
            // Insert it before the return statement or similar
            if (content.includes('return (')) {
                content = content.replace('return (', `${definition}\n\n    return (`);
                fs.writeFileSync(filepath, content);
                console.log(`Added canonicalUrl definition to ${filepath}`);
            }
        }
    }
});

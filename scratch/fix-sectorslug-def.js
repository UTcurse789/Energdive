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
        
        // If AdBanner is used with sectorSlug but sectorSlug is not defined in the function
        const usesSectorSlug = content.includes('sectorSlug={sectorSlug}');
        const definesSectorSlug = content.match(/const sectorSlug\s*:/) || content.match(/const sectorSlug\s*=/);
        
        if (usesSectorSlug && !definesSectorSlug) {
            // Find a good place to insert the definition
            // Usually after const attrs = ... or inside the component function
            const definition = `    // Extract sector slug for targeted ad
    const sectorData = attrs.sectors || attrs.sector?.data?.attributes || null;
    const sectorSlug: string | undefined = Array.isArray(sectorData)
        ? sectorData[0]?.slug || undefined
        : sectorData?.slug || undefined;`;

            if (content.includes('const attrs =')) {
                // Find the end of the attrs definition line
                content = content.replace(/const attrs = articleData\.attributes \|\| articleData;/, (match) => {
                    return `${match}\n${definition}`;
                });
                fs.writeFileSync(filepath, content);
                console.log(`Added sectorSlug definition to ${filepath}`);
            } else if (content.includes('const attrs = article\.attributes \|\| article;')) {
                 content = content.replace(/const attrs = article\.attributes \|\| article;/, (match) => {
                    return `${match}\n${definition}`;
                });
                fs.writeFileSync(filepath, content);
                console.log(`Added sectorSlug definition (v2) to ${filepath}`);
            }
        }
    }
});

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
        
        // If Printer is used but not imported from lucide-react
        if (content.includes('<Printer') && !content.match(/import \{[^}]*Printer[^}]*\} from "lucide-react"/)) {
            // Check if lucide-react is imported at all
            if (content.includes('from "lucide-react"')) {
                content = content.replace(/import \{([^}]*)\} from "lucide-react"/, (match, p1) => {
                    if (p1.includes('Printer')) return match;
                    return `import { ${p1.trim()}, Printer } from "lucide-react"`;
                });
                fs.writeFileSync(filepath, content);
                console.log(`Added Printer to lucide-react imports in ${filepath}`);
            }
        }
    }
});

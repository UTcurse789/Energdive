const fs = require('fs');
const path = require('path');

const targetRegex = /\{\/\* Category \+ Date \*\/\}\s*<div className="flex items-center mb-5 gap-3">\s*<span className="text-\[#00A651\] text-xs font-bold uppercase tracking-wider">\s*\{article\.category\}\s*<\/span>\s*<DateChip value=\{article\.date\} className="text-gray-900" \/>\s*<\/div>/g;

const replacement = `{/* Category Label */}
                        <div className="flex items-center mb-5">
                            <span className="bg-[#00A651] text-white px-3 py-1 rounded-sm text-[11px] font-bold uppercase tracking-wider shadow-sm">
                                {article.category}
                            </span>
                        </div>`;

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
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDir(path.join(__dirname, '../app'));
console.log('Done');

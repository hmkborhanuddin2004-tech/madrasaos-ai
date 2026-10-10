const fs = require('fs');
const path = require('path');

function fixImportsInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            fixImportsInDir(fullPath);
        } else if (f.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Fix local relative imports
            content = content.replace(/from\s+['"](\.[^'"]+)['"]/g, (match, p1) => {
                if (p1.endsWith('.js')) return match; // Already fixed
                // Assume it needs .js
                modified = true;
                return `from '${p1}.js'`;
            });

            if (modified) {
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

fixImportsInDir(path.join(__dirname, 'server/src/services/automations'));
fixImportsInDir(path.join(__dirname, 'server/src/services/sms'));
fixImportsInDir(path.join(__dirname, 'server/src/routes'));


import fs from 'fs';
import path from 'path';

function fixImports(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixImports(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(/from\s+['"](\.\.?\/[^'"]+)(?<!\.js)['"]/g, "from '$1.js'");
      fs.writeFileSync(fullPath, content);
    }
  }
}

fixImports(path.join(process.cwd(), 'server', 'src', 'services', 'automations'));
fixImports(path.join(process.cwd(), 'server', 'src', 'routes'));

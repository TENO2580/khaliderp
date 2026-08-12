const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'src', 'app', 'api');

function addDynamic(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      addDynamic(fullPath);
    } else if (file === 'route.ts') {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes("export const dynamic = 'force-dynamic';") && content.includes('GET(req')) {
        // insert after imports
        const lines = content.split('\n');
        let insertIndex = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import')) {
            insertIndex = i + 1;
          }
        }
        lines.splice(insertIndex, 0, '\nexport const dynamic = \'force-dynamic\';\n');
        fs.writeFileSync(fullPath, lines.join('\n'));
        console.log(`Added force-dynamic to ${fullPath}`);
      }
    }
  }
}

addDynamic(apiDir);

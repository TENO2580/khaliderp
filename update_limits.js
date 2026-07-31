const fs = require('fs');
const path = require('path');
function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('page.tsx')) {
      let content = fs.readFileSync(p, 'utf8');
      if (!content.includes('<DataTable')) return;
      
      let modified = false;
      if (!content.includes('setLimit] = useState(10);')) {
        content = content.replace(/const \[page,\s*setPage\]\s*=\s*useState\(1\);/, 'const [page, setPage] = useState(1);\n  const [limit, setLimit] = useState(10);');
        modified = true;
      }
      if (content.match(/limit=10(?!\d)/)) {
        content = content.replace(/'([^\r\n']*)limit=10(?!\d)([^\r\n']*)'/g, '`$1limit=${limit}$2`');
        content = content.replace(/"([^\r\n"]*)limit=10(?!\d)([^\r\n"]*)"/g, '`$1limit=${limit}$2`');
        content = content.replace(/`([^\r\n`]*)limit=10(?!\d)([^\r\n`]*)`/g, '`$1limit=${limit}$2`');
        modified = true;
      }
      if (!content.includes('onLimitChange={')) {
        content = content.replace(/<DataTable/g, '<DataTable limit={limit} onLimitChange={(l) => { setLimit(l); setPage(1); }}');
        modified = true;
      }
      if (modified) {
        fs.writeFileSync(p, content, 'utf8');
        console.log('Updated', p);
      }
    }
  });
}
walk('src/app/dashboard');

const fs = require('fs');
const files = [
  'c:\\khaliderp\\src\\app\\dashboard\\sales\\page.tsx',
  'c:\\khaliderp\\src\\app\\dashboard\\sales\\invoices\\page.tsx',
  'c:\\khaliderp\\src\\app\\dashboard\\purchase\\page.tsx',
  'c:\\khaliderp\\src\\app\\dashboard\\sales\\payments\\page.tsx',
  'c:\\khaliderp\\src\\app\\dashboard\\production\\page.tsx',
  'c:\\khaliderp\\src\\app\\dashboard\\employees\\page.tsx',
  'c:\\khaliderp\\src\\app\\dashboard\\expenses\\page.tsx',
  'c:\\khaliderp\\src\\app\\dashboard\\customers\\followups\\page.tsx',
  'c:\\khaliderp\\src\\app\\dashboard\\batches\\page.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log('Not found: ' + file);
    continue;
  }
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('totalItems={totalItems}')) {
    console.log('Skipping ' + file + ' - already has totalItems');
    continue;
  }
  
  content = content.replace(
    /const\s+\[totalPages,\s*setTotalPages\]\s*=\s*useState\(1\);/,
    'const [totalPages, setTotalPages] = useState(1);\n  const [totalItems, setTotalItems] = useState(0);'
  );
  
  content = content.replace(
    /setTotalPages\((.*?)\.pagination\.totalPages\);/g,
    'setTotalPages($1.pagination.totalPages);\n      setTotalItems($1.pagination.total);'
  );
  
  content = content.replace(
    /<DataTable/g,
    '<DataTable totalItems={totalItems}'
  );
  
  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
}

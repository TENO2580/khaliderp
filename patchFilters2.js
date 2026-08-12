const fs = require('fs');
const path = require('path');

const tabsDir = path.join(__dirname, 'mobile', 'app', '(erp)', '(tabs)');
const files = fs.readdirSync(tabsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(tabsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  const moduleMatch = content.match(/state\.filters\['([^']+)'\]/);
  if (!moduleMatch) continue;
  const moduleName = moduleMatch[1];

  // Match const fetchXYZ = async ...
  const fetchDataRegex = /(const fetch\w*\s*=\s*async\s*\([^)]*\)\s*=>\s*\{\s*try\s*\{)([\s\S]*?)(const \w+Res = await|const response = await|const res = await)/g;
  
  // To avoid patching twice, check if already patched
  if (content.includes(`useFilterStore.getState().filters['${moduleName}']`)) {
    console.log(`Already patched ${file}`);
    continue;
  }

  content = content.replace(fetchDataRegex, (match, p1, p2, p3) => {
    let newBlock = p1 + `\n      const currentFilters = useFilterStore.getState().filters['${moduleName}'] || {};\n` + p2.replace(/filters\./g, 'currentFilters.');
    return newBlock + p3;
  });

  fs.writeFileSync(filePath, content);
  console.log(`Patched ${file}`);
}

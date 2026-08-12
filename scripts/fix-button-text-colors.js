const fs = require('fs');
const path = require('path');

const tabsDir = path.join(__dirname, '../mobile/app/(erp)/(tabs)');
const files = fs.readdirSync(tabsDir);

for (const file of files) {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    const filePath = path.join(tabsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    content = content.replace(/newButtonText: \{ color: '#121212'/g, "newButtonText: { color: '#FFFFFF'");
    content = content.replace(/saveBtnText: \{ color: '#121212'/g, "saveBtnText: { color: '#FFFFFF'");
    content = content.replace(/pillTextActive: \{ color: '#121212'/g, "pillTextActive: { color: '#FFFFFF'");
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed text color in ${file}`);
  }
}

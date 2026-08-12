const fs = require('fs');
const path = require('path');

const tabsDir = path.join(__dirname, '../mobile/app/(erp)/(tabs)');
const files = fs.readdirSync(tabsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(tabsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // _layout.tsx specific
  if (file === '_layout.tsx') {
    content = content.replace(/#0EA5E925/g, '#F8FAFC15');
    content = content.replace(/#0EA5E9/g, '#F8FAFC');
  } else {
    // Replace buttons (newButton, saveBtn)
    // backgroundColor: '#0EA5E9' -> '#F8FAFC'
    content = content.replace(/backgroundColor: '#0EA5E9'/g, "backgroundColor: '#F8FAFC'");
    
    // newButtonText: color: '#F8FAFC' -> '#0F172A'
    content = content.replace(/newButtonText: \{ color: '#F8FAFC',/g, "newButtonText: { color: '#0F172A',");

    // saveBtnText: color: '#FFFFFF' -> '#0F172A'
    content = content.replace(/saveBtnText: \{ color: '#FFFFFF',/g, "saveBtnText: { color: '#0F172A',");

    // Active pill background
    // pillActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' } -> '#F8FAFC'
    content = content.replace(/backgroundColor: '#3B82F6', borderColor: '#3B82F6'/g, "backgroundColor: '#F8FAFC', borderColor: '#F8FAFC'");

    // pillTextActive: color: '#FFFFFF' -> '#0F172A'
    content = content.replace(/pillTextActive: \{ color: '#FFFFFF' \}/g, "pillTextActive: { color: '#0F172A' }");

    // Edit action icon color
    // color="#3B82F6" -> color="#F8FAFC"
    content = content.replace(/color="#3B82F6"/g, 'color="#F8FAFC"');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated theme in ${file}`);
}

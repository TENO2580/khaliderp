const fs = require('fs');
const path = require('path');

const tabsDir = path.join(__dirname, '../mobile/app/(erp)/(tabs)');
const componentsDir = path.join(__dirname, '../mobile/components');

// Colors to replace
const replacements = [
  // Backgrounds
  { from: /#0F172A/g, to: '#121212' },
  { from: /#1E293B/g, to: '#1E1E1E' },
  { from: /#162033/g, to: '#1E1E1E' },
  { from: /#0B1220/g, to: '#121212' },
  { from: /#334155/g, to: '#27272A' },
  
  // Specific buttons / active states that were changed to #F8FAFC
  // newButton, saveBtn, pillActive backgrounds
  { from: /backgroundColor: '#F8FAFC'/g, to: "backgroundColor: '#2996A8'" },
  { from: /backgroundColor: '#F8FAFC15'/g, to: "backgroundColor: 'transparent'" },
  
  // Button text that was changed to dark
  { from: /newButtonText: \{ color: '#0F172A'/g, to: "newButtonText: { color: '#FFFFFF'" },
  { from: /saveBtnText: \{ color: '#0F172A'/g, to: "saveBtnText: { color: '#FFFFFF'" },
  { from: /pillTextActive: \{ color: '#0F172A' \}/g, to: "pillTextActive: { color: '#FFFFFF' }" },
  { from: /borderColor: '#F8FAFC'/g, to: "borderColor: '#2996A8'" },
  
  // Edit icon that was changed to #F8FAFC
  // Actually in the screenshot edit is light grey, let's make it #9CA3AF
  { from: /color="#F8FAFC"/g, to: 'color="#9CA3AF"' },
];

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      processDir(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // _layout.tsx specific active icon color
      if (file === '_layout.tsx') {
        if (content.includes("isActive ? '#F8FAFC' : '#94A3B8'")) {
          content = content.replace(/isActive \? '#F8FAFC' : '#94A3B8'/g, "isActive ? '#2996A8' : '#94A3B8'");
          modified = true;
        }
      }

      for (const { from, to } of replacements) {
        if (content.match(from)) {
          content = content.replace(from, to);
          modified = true;
        }
      }

      // Re-fix searchInput text color which was accidentally caught by color="#9CA3AF" or something, 
      // wait, searchInput color is just `color: '#F8FAFC'`. I didn't replace that. 
      // I only replaced `color="#F8FAFC"`. Wait, `newButtonText: { color: '#0F172A'` is handled.
      // `cellText: { color: '#F8FAFC'` is untouched. Good.

      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated theme in ${file}`);
      }
    }
  }
}

processDir(tabsDir);
processDir(componentsDir);

// Re-fix the icon color in actionBtn (if it was accidentally changed to #9CA3AF everywhere).
// We ONLY want Feather icons (Edit) to be #9CA3AF, which is fine since `color="#F8FAFC"` mostly targets icons.

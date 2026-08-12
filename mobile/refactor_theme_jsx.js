const fs = require('fs');
const path = require('path');

const DIRECTORY = path.join(__dirname, 'app');

const themeColors = {
  '"#0F172A"': "{colors.background}",
  '"#1E293B"': "{colors.surface}",
  '"#334155"': "{colors.border}",
  '"#94A3B8"': "{colors.textSecondary}",
  '"#F8FAFC"': "{colors.textPrimary}",
  '"#3B82F6"': "{colors.tint}",
  '"#EF4444"': "{colors.danger}",
  '"#E2E8F0"': "{colors.border}", // light mode border
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  if (filePath.includes('login.tsx') || filePath.includes('customization.tsx')) return;
  
  if (!content.includes('const styles = getStyles(colors);')) return; // Only process files we successfully updated

  let splitIndex = content.indexOf('const getStyles = (colors: any) => StyleSheet.create({');
  if (splitIndex === -1) splitIndex = content.length; // fallback
  
  let beforeStyles = content.slice(0, splitIndex);
  let stylesBlock = content.slice(splitIndex);

  // Replace colors in JSX (before styles)
  for (const [hex, variable] of Object.entries(themeColors)) {
    const regex = new RegExp(`color=${hex}`, 'gi');
    beforeStyles = beforeStyles.replace(regex, `color=${variable}`);
    
    // Also catch backgroundColor="#..."
    const bgRegex = new RegExp(`backgroundColor=${hex}`, 'gi');
    beforeStyles = beforeStyles.replace(bgRegex, `backgroundColor=${variable}`);
  }

  // Also replace any remaining strings of '#94A3B8' etc inside style={{ color: '#94A3B8' }}
  const inlineThemeColors = {
    "'#0F172A'": "colors.background",
    "'#1E293B'": "colors.surface",
    "'#334155'": "colors.border",
    "'#94A3B8'": "colors.textSecondary",
    "'#F8FAFC'": "colors.text",
    "'#3B82F6'": "colors.tint",
    "'#EF4444'": "colors.danger",
    "'#E2E8F0'": "colors.border",
  };
  for (const [hex, variable] of Object.entries(inlineThemeColors)) {
    const regex = new RegExp(`: ${hex}`, 'gi');
    beforeStyles = beforeStyles.replace(regex, `: ${variable}`);
  }


  content = beforeStyles + stylesBlock;
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('JSX Refactored', filePath);
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

traverseDir(DIRECTORY);

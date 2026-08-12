const fs = require('fs');
const path = require('path');

const DIRECTORY = path.join(__dirname, 'app');

const themeColors = {
  "'#0F172A'": "colors.background",
  "'#1E293B'": "colors.surface",
  "'#334155'": "colors.border",
  "'#94A3B8'": "colors.textSecondary",
  "'#F8FAFC'": "colors.text",
  "'#3B82F6'": "colors.tint",
  "'#EF4444'": "colors.danger",
  "'#E2E8F0'": "colors.border", // light mode border
  "'#fff'": "'#fff'",
  "'#FFFFFF'": "'#fff'",
  "'#000'": "'#000'",
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip files we already refactored manually
  if (filePath.includes('login.tsx') || filePath.includes('customization.tsx')) return;
  
  // Skip if it doesn't use StyleSheet
  if (!content.includes('StyleSheet.create')) return;

  // 1. Add import for useThemeStore if not present
  if (!content.includes('useThemeStore')) {
    const depth = filePath.split(path.sep).length - DIRECTORY.split(path.sep).length;
    const relativePath = depth === 2 ? '../../store/themeStore' : (depth === 3 ? '../../../store/themeStore' : '../store/themeStore');
    content = content.replace(/(import React.*?;\n)/, `$1import { useThemeStore } from '${relativePath}';\n`);
  }

  // 2. Inject const colors inside the component
  // Find the default export function
  const componentMatch = content.match(/export default function ([A-Za-z0-9_]+)\s*\([^)]*\)\s*\{/);
  if (componentMatch && !content.includes('const colors = useThemeStore')) {
    const componentStart = componentMatch.index + componentMatch[0].length;
    content = content.slice(0, componentStart) + '\n  const colors = useThemeStore((state) => state.getColors());' + content.slice(componentStart);
  } else if (!componentMatch) {
    // try finding export default function()
    const componentMatch2 = content.match(/export default function\s*\([^)]*\)\s*\{/);
    if (componentMatch2 && !content.includes('const colors = useThemeStore')) {
      const componentStart = componentMatch2.index + componentMatch2[0].length;
      content = content.slice(0, componentStart) + '\n  const colors = useThemeStore((state) => state.getColors());' + content.slice(componentStart);
    }
  }

  // 3. Replace StyleSheet.create with a function
  if (content.includes('const styles = StyleSheet.create({')) {
    content = content.replace(/const styles = StyleSheet\.create\(\{/g, 'const getStyles = (colors: any) => StyleSheet.create({');
    
    // Inject `const styles = getStyles(colors);` into the component, just after `const colors = ...`
    content = content.replace(/const colors = useThemeStore\(\(state\) => state\.getColors\(\)\);/, 'const colors = useThemeStore((state) => state.getColors());\n  const styles = getStyles(colors);');
    
    // Replace hex colors inside getStyles
    // We only want to replace inside the getStyles block.
    const splitIndex = content.indexOf('const getStyles = (colors: any) => StyleSheet.create({');
    let beforeStyles = content.slice(0, splitIndex);
    let stylesBlock = content.slice(splitIndex);

    for (const [hex, variable] of Object.entries(themeColors)) {
      if (hex === "'#fff'" || hex === "'#000'") continue; // leave white and black alone for now, since they might be specific
      const regex = new RegExp(hex, 'gi');
      stylesBlock = stylesBlock.replace(regex, variable);
    }

    content = beforeStyles + stylesBlock;
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Refactored', filePath);
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

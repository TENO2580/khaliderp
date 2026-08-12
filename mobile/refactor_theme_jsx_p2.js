const fs = require('fs');
const path = require('path');

const DIRECTORY = path.join(__dirname, 'app');

const themeColors = {
  // Previously handled colors (for completeness, maybe some were missed)
  '"#0F172A"': "colors.background",
  "'#0F172A'": "colors.background",
  '"#1E293B"': "colors.surface",
  "'#1E293B'": "colors.surface",
  '"#334155"': "colors.border",
  "'#334155'": "colors.border",
  '"#94A3B8"': "colors.textSecondary",
  "'#94A3B8'": "colors.textSecondary",
  
  // New hardcoded dark theme colors found
  '"#121212"': "colors.background",
  "'#121212'": "colors.background",
  '"#1E1E1E"': "colors.surface",
  "'#1E1E1E'": "colors.surface",
  '"#27272A"': "colors.border",
  "'#27272A'": "colors.border",
};

function refactorFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace all color strings with their dynamic variable equivalent
  for (const [hex, variable] of Object.entries(themeColors)) {
    // Need to handle cases where it might be in an object literal, so regex is better
    // but simple replaceAll works if we include quotes
    content = content.replaceAll(hex, variable);
  }

  // Also replace without quotes if it's in template literals or StyleSheet string literals
  // Let's use regex for safer replacement
  const hexReplacements = [
    { regex: /#121212/gi, var: "colors.background" },
    { regex: /#1E1E1E/gi, var: "colors.surface" },
    { regex: /#27272A/gi, var: "colors.border" },
    { regex: /#0F172A/gi, var: "colors.background" },
    { regex: /#1E293B/gi, var: "colors.surface" },
    { regex: /#334155/gi, var: "colors.border" },
    { regex: /#94A3B8/gi, var: "colors.textSecondary" },
    { regex: /#F1F5F9/gi, var: "colors.text" },
    { regex: /#FFFFFF/gi, var: "colors.text" },
  ];

  for (const repl of hexReplacements) {
    // Replace hex in StyleSheet rules like `backgroundColor: '#121212'` to `backgroundColor: colors.background`
    const regex1 = new RegExp(`'${repl.regex.source}'`, 'gi');
    content = content.replace(regex1, repl.var);
    const regex2 = new RegExp(`"${repl.regex.source}"`, 'gi');
    content = content.replace(regex2, repl.var);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Refactored: ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      refactorFile(fullPath);
    }
  }
}

processDirectory(DIRECTORY);
console.log('Finished refactoring missing hardcoded colors.');

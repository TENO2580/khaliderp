const fs = require('fs');
const path = require('path');

const hexReplacements = [
  // Text colors (Dark/Strong) -> colors.text
  { regex: /#111827/gi, var: "colors.text" },
  { regex: /#1F2937/gi, var: "colors.text" },
  { regex: /#374151/gi, var: "colors.text" },
  { regex: /#4B5563/gi, var: "colors.text" },
  
  // Secondary text colors (Medium grays) -> colors.textSecondary
  { regex: /#475569/gi, var: "colors.textSecondary" },
  { regex: /#64748B/gi, var: "colors.textSecondary" },
  { regex: /#9CA3AF/gi, var: "colors.textSecondary" },
  { regex: /#CBD5E1/gi, var: "colors.textSecondary" },
  
  // Light borders / surfaces -> colors.border or colors.surface
  { regex: /#D1D5DB/gi, var: "colors.border" },
  { regex: /#F3F4F6/gi, var: "colors.surface" },
  
  // Very light colors (usually backgrounds in light mode, text in dark mode). 
  // Let's map them to colors.background for now, or maybe colors.text depending on context. 
  // Given this is an ERP, it was probably text in dark mode if it was hardcoded. 
  { regex: /#F8FAFC/gi, var: "colors.text" },
  { regex: /#F9FAFB/gi, var: "colors.text" },
];

function refactorFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  for (const repl of hexReplacements) {
    // Replace hex in StyleSheet or prop like `color: '#64748B'` -> `color: colors.textSecondary`
    // And `color="#64748B"` -> `color={colors.textSecondary}`
    
    // Case 1: single quotes `'#hex'`
    const regex1 = new RegExp(`'${repl.regex.source}'`, 'gi');
    content = content.replace(regex1, repl.var);
    
    // Case 2: double quotes `"#hex"`
    const regex2 = new RegExp(`"${repl.regex.source}"`, 'gi');
    content = content.replace(regex2, repl.var);
    
    // Case 3: JSX prop `color="#hex"`
    // Let's handle this more carefully so we don't break JSX.
    // Wait, regex2 already replaces "#hex" with colors.var. 
    // If it was color="#hex", it becomes color=colors.var, which is invalid JSX.
    // We already fixed this in a previous turn with a generic regex: `([a-zA-Z]+)=colors\.([a-zA-Z]+)`
    // So we can just run that fix at the end.
  }
  
  // Fix JSX props: `propName=colors.variable` -> `propName={colors.variable}`
  content = content.replace(/([a-zA-Z]+)=colors\.([a-zA-Z]+)/g, '$1={colors.$2}');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Refactored: ${filePath}`);
  }
}

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      refactorFile(fullPath);
    }
  }
}

processDirectory(path.join(__dirname, 'app'));
processDirectory(path.join(__dirname, 'components'));

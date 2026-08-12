const fs = require('fs');
const path = require('path');
const tabsDir = path.join(__dirname, '../mobile/app/(erp)/(tabs)');
const files = ['sales.tsx', 'production.tsx', 'expenses.tsx', 'employees.tsx', 'customers.tsx'];

for (const file of files) {
  const filePath = path.join(tabsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  const actionsMatch = content.match(/(\{\s*key:\s*'actions'[\s\S]+?\})\s*\];/);
  if (actionsMatch) {
    const actionsBlock = actionsMatch[1];
    
    // Remove the actions block from its current location
    content = content.replace(actionsBlock, '');
    
    // Clean up if there's a dangling comma before ];
    // Wait, let's just leave the comma. TypeScript arrays allow trailing commas.
    // E.g., [1, 2, ,] is an array with a hole if it's not a trailing comma, wait.
    // If it was `{ ... }, ]`, it's a trailing comma. 
    // If it was `{ ... } ]`, it's fine.
    // Actually, let's clean up any empty space before ];
    // content = content.replace(/,\s*\];/, ',\n  ];'); // Not strictly necessary

    // Insert at the beginning of the columns array
    content = content.replace(/const columns:\s*Column\[\]\s*=\s*\[\s*/, `const columns: Column[] = [\n    ${actionsBlock},\n    `);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Reordered ${file}`);
  } else {
    console.log(`Actions column not found in ${file}`);
  }
}

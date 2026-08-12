const fs = require('fs');
const path = require('path');

const tabsDir = path.join(__dirname, '../mobile/app/(erp)/(tabs)');
const files = ['customers.tsx', 'sales.tsx', 'purchase.tsx', 'production.tsx', 'expenses.tsx', 'employees.tsx', 'pricing.tsx', 'reports.tsx', 'intelligence.tsx'];

for (const file of files) {
  const filePath = path.join(tabsDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace header padding
  content = content.replace(
    /paddingTop: 20, paddingBottom: 16/g,
    'paddingTop: 8, paddingBottom: 8'
  );

  // Replace pageTitle font size
  content = content.replace(
    /pageTitle: \{ fontSize: 24,/g,
    'pageTitle: { fontSize: 20,'
  );

  // Replace newButton padding
  content = content.replace(
    /newButton: \{ backgroundColor: '#0EA5E9', paddingHorizontal: 16, paddingVertical: 10,/g,
    "newButton: { backgroundColor: '#0EA5E9', paddingHorizontal: 16, paddingVertical: 8,"
  );

  // Replace actionBar padding
  content = content.replace(
    /actionBar: \{ flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 20,/g,
    "actionBar: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12,"
  );

  // Replace searchContainer height
  content = content.replace(
    /searchContainer: \{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 8, paddingHorizontal: 12, height: 40,/g,
    "searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 8, paddingHorizontal: 12, height: 36,"
  );

  // Replace actionIconBtn dimensions
  content = content.replace(
    /actionIconBtn: \{ width: 40, height: 40,/g,
    "actionIconBtn: { width: 36, height: 36,"
  );

  // Replace tableWrapper paddingBottom
  content = content.replace(
    /tableWrapper: \{ flex: 1, paddingHorizontal: 16, paddingBottom: 110 \},/g,
    "tableWrapper: { flex: 1, paddingHorizontal: 16, paddingBottom: 80 },"
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
}

const fs = require('fs');

const filesToPatch = [
  { path: 'c:/khaliderp/src/app/dashboard/purchase/page.tsx', search: 'setPurchaseOrders(', replace: 'setPurchaseOrders([]);' },
  { path: 'c:/khaliderp/src/app/dashboard/inventory/movements/page.tsx', search: 'setMovements(', replace: 'setMovements([]);' },
  { path: 'c:/khaliderp/src/app/dashboard/sales/page.tsx', search: 'setOrders(', replace: 'setOrders([]);' },
  { path: 'c:/khaliderp/src/app/dashboard/production/page.tsx', search: 'setProductions(', replace: 'setProductions([]);' },
  { path: 'c:/khaliderp/src/app/dashboard/expenses/page.tsx', search: 'setExpenses(', replace: 'setExpenses([]);' },
  { path: 'c:/khaliderp/src/app/dashboard/inventory/page.tsx', search: 'setProducts(', replace: 'setProducts([]);' },
  { path: 'c:/khaliderp/src/app/dashboard/inventory/raw-materials/page.tsx', search: 'setMaterials(', replace: 'setMaterials([]);' },
  { path: 'c:/khaliderp/src/app/dashboard/employees/page.tsx', search: 'setEmployees(', replace: 'setEmployees([]);' },
  { path: 'c:/khaliderp/src/app/dashboard/customers/page.tsx', search: 'setCustomers(', replace: 'setCustomers([]);' },
  { path: 'c:/khaliderp/src/app/dashboard/batches/page.tsx', search: 'setBatches(', replace: 'setBatches([]);' },
];

for (const { path: p, search, replace } of filesToPatch) {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    const startIdx = content.indexOf(search + '[');
    if (startIdx !== -1) {
      const endIdx = content.indexOf(']);', startIdx);
      if (endIdx !== -1) {
        const newContent = content.substring(0, startIdx) + replace + content.substring(endIdx + 3);
        fs.writeFileSync(p, newContent);
        console.log(`Updated ${p}`);
      }
    }
  }
}

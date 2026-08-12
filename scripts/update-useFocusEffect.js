const fs = require('fs');
const path = require('path');

const tabsDir = path.join(__dirname, '../mobile/app/(erp)/(tabs)');
const files = ['sales.tsx', 'reports.tsx', 'purchase.tsx', 'production.tsx', 'pricing.tsx', 'expenses.tsx', 'customers.tsx', 'employees.tsx'];

for (const file of files) {
  const filePath = path.join(tabsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add useCallback
  if (!content.includes('useCallback')) {
    content = content.replace("import React, { useEffect, useState } from 'react';", "import React, { useEffect, useState, useCallback } from 'react';");
  }

  // Add useFocusEffect
  if (!content.includes('useFocusEffect')) {
    content = content.replace("import { useRouter } from 'expo-router';", "import { useRouter, useFocusEffect } from 'expo-router';");
  }

  // Replace useEffect with useFocusEffect
  if (content.includes('useEffect(() => {\n    InteractionManager.runAfterInteractions(() => {') || content.includes('useEffect(() => {\r\n    InteractionManager.runAfterInteractions(() => {')) {
    content = content.replace(
      /useEffect\(\(\) => \{\r?\n\s+InteractionManager\.runAfterInteractions/,
      "useFocusEffect(useCallback(() => {\n    InteractionManager.runAfterInteractions"
    );
    // Replace the closing bracket for that effect. It is `  }, []);`
    content = content.replace(
      /  \}, \[\]\);/,
      "  }, []));"
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
}

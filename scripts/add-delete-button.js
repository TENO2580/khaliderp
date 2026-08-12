const fs = require('fs');
const path = require('path');

const tabsDir = path.join(__dirname, '../mobile/app/(erp)/(tabs)');
const files = fs.readdirSync(tabsDir);

for (const file of files) {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    const filePath = path.join(tabsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find where the actions column is defined
    const actionsRegex = /\{ key: 'actions', title: 'Actions', width: 80, render: \(item\) => \(\s*<TouchableOpacity style=\{styles\.actionBtn\} onPress=\{[^}]+\}>\s*<Feather name="edit-2" size=\{16\} color="#9CA3AF" \/>\s*<\/TouchableOpacity>\s*\)/g;
    
    if (content.match(actionsRegex)) {
      // Replace it with a View containing both Edit and Delete buttons
      content = content.replace(actionsRegex, (match) => {
        // Extract the onPress handler for edit to preserve it
        const editPressMatch = match.match(/onPress=\{([^}]+)\}/);
        const editPress = editPressMatch ? editPressMatch[1] : "() => {}";
        
        return `{ key: 'actions', title: 'Actions', width: 80, render: (item) => (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.actionBtn} onPress={${editPress}}>
            <Feather name="edit-2" size={14} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
            <Feather name="trash-2" size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )`;
      });
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Added delete button to ${file}`);
    }
  }
}

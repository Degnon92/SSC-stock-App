const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components');

const replacements = [
  { regex: /['"]#6b7c93['"]/g, repl: "'var(--text-muted)'" },
  { regex: /['"]#0a2540['"]/g, repl: "'var(--text-main)'" },
  { regex: /['"]#0f172a['"]/g, repl: "'var(--bg-card)'" }, // used in select option background
  { regex: /['"]#f8fafc['"]/g, repl: "'var(--text-main)'" } // used in select option color
];

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      // Skip UI.jsx and App.jsx to avoid breaking the CSS variables definitions!
      if (file === 'UI.jsx' || file === 'App.jsx') continue;

      let content = fs.readFileSync(fullPath, 'utf8');
      let startContent = content;
      
      replacements.forEach(r => {
        content = content.replace(r.regex, r.repl);
      });
      
      if (content !== startContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log("Updated " + file);
      }
    }
  }
}

// Manually patch UI.jsx's <style> tag only.
const uiPath = path.join(dir, 'UI.jsx');
if (fs.existsSync(uiPath)) {
  let content = fs.readFileSync(uiPath, 'utf8');
  if (content.includes('select option { background: #0f172a; color: #f8fafc; }')) {
    content = content.replace(
      'select option { background: #0f172a; color: #f8fafc; }',
      'select option { background: var(--bg-card); color: var(--text-main); }'
    );
    fs.writeFileSync(uiPath, content, 'utf8');
    console.log("Patched UI.jsx edge case");
  }
}

processDir(dir);
console.log("Pass 2 Refactoring complete.");

const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components');

const replacements = [
  { regex: /background:\s*['"]#fff(?:fff)?['"]/g, repl: "background: 'var(--bg-card)'" },
  { regex: /background:\s*['"]#f8fafc['"]/g, repl: "background: 'var(--input-bg)'" },
  { regex: /background:\s*['"]#f0f4f8['"]/g, repl: "background: 'var(--bg-page)'" },
  { regex: /background:\s*['"]#0a2540['"]/g, repl: "background: 'var(--bg-sidebar)'" },
  { regex: /background:\s*['"]rgba\(30,?\s*41,?\s*59,?\s*0\.45\)['"]/g, repl: "background: 'var(--bg-card)'" },
  { regex: /background:\s*['"]rgba\(15,?\s*23,?\s*42,?\s*0\.45\)['"]/g, repl: "background: 'var(--bg-sidebar)'" },
  { regex: /background:\s*['"]rgba\(30,?\s*41,?\s*59,?\s*0\.4\)['"]/g, repl: "background: 'var(--bg-card)'" },
  { regex: /background:\s*['"]rgba\(2,?\s*6,?\s*23,?\s*0\.75\)['"]/g, repl: "background: 'var(--bg-overlay)'" },
  { regex: /background:\s*['"]rgba\(15,?\s*23,?\s*42,?\s*0\.7\)['"]/g, repl: "background: 'var(--bg-overlay)'" },
  
  { regex: /color:\s*['"]#0a2540['"]/g, repl: "color: 'var(--text-main)'" },
  { regex: /color:\s*['"]#f8fafc['"]/g, repl: "color: 'var(--text-main)'" },
  { regex: /color:\s*['"]#6b7c93['"]/g, repl: "color: 'var(--text-muted)'" },
  { regex: /color:\s*['"]#94a3b8['"]/g, repl: "color: 'var(--text-muted)'" },
  { regex: /color:\s*['"]#a0aec0['"]/g, repl: "color: 'var(--text-muted)'" },
  { regex: /color:\s*['"]#64748b['"]/g, repl: "color: 'var(--text-muted)'" },

  { regex: /['"]1px solid #e5edf5['"]/g, repl: "'1px solid var(--border-color)'" },
  { regex: /['"]1px solid rgba\(255,255,255,0\.05\)['"]/g, repl: "'1px solid var(--border-color)'" },
  { regex: /['"]1px solid rgba\(255,255,255,0\.08\)['"]/g, repl: "'1px solid var(--border-color)'" },
  { regex: /['"]1px solid rgba\(255,255,255,0\.07\)['"]/g, repl: "'1px solid var(--border-light)'" },
  { regex: /borderColor:\s*['"]#e5edf5['"]/g, repl: "borderColor: 'var(--border-color)'" },

  { regex: /boxShadow:\s*['"]0 2px 12px rgba\(10,37,64,0\.07\)['"]/g, repl: "boxShadow: 'var(--card-shadow)'" },
  { regex: /boxShadow:\s*['"]0 8px 32px rgba\(0,0,0,0\.4\)['"]/g, repl: "boxShadow: 'var(--card-shadow)'" },
  { regex: /backdropFilter:\s*['"]blur\(\d+px\)['"]/g, repl: "backdropFilter: 'var(--glass-blur)'" },
  
  { regex: /e\.currentTarget\.style\.background = ['"]#f8fafc['"]/g, repl: "e.currentTarget.style.background = 'var(--table-hover)'" },
  { regex: /e\.currentTarget\.style\.background = ['"]rgba\(255,255,255,0\.04\)['"]/g, repl: "e.currentTarget.style.background = 'var(--table-hover)'" },
];

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
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

processDir(dir);

const appPath = path.join(__dirname, 'src', 'App.jsx');
if (fs.existsSync(appPath)) {
  let appContent = fs.readFileSync(appPath, 'utf8');
  let startApp = appContent;
  replacements.forEach(r => {
    appContent = appContent.replace(r.regex, r.repl);
  });
  if (appContent !== startApp) {
    fs.writeFileSync(appPath, appContent, 'utf8');
    console.log("Updated App.jsx");
  }
}

console.log("Refactoring complete.");

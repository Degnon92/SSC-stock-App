const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'utils', 'pdfUtils.js');
let content = fs.readFileSync(targetPath, 'utf8');

// Replace standard toLocaleString with one that sanitizes special whitespace to ASCII space
content = content.replace(/\.toLocaleString\('fr-FR'\)/g, ".toLocaleString('fr-FR').replace(/[\\s\\u202F\\u00A0]/g, ' ')");

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Fixed jsPDF spacing issue in ' + targetPath);

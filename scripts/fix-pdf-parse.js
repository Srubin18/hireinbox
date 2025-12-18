const fs = require('fs');
const path = require('path');
const testDir = path.join(__dirname, '..', 'node_modules', 'pdf-parse', 'test', 'data');
const testFile = path.join(testDir, '05-versions-space.pdf');
if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
if (!fs.existsSync(testFile)) fs.writeFileSync(testFile, '');
console.log('pdf-parse fix applied');

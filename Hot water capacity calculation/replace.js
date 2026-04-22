const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/<button(?![^>]*type=)/g, '<button type="button"');
fs.writeFileSync('index.html', html);
console.log('Done replacement.');

// Gắn build-id (version + git sha + giờ) vào manager-head badge — mỗi lần build/dev mới.
const { execSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');
const path = require('path');
let sha = 'dev';
try { sha = execSync('git rev-parse --short HEAD').toString().trim(); } catch {}
const pkg = JSON.parse(readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const id = `${pkg.version}+${sha}+${new Date().toISOString().slice(11, 16)}Z`;
const file = path.join(__dirname, '..', '.storybook', 'manager-head.html');
let html = readFileSync(file, 'utf8');
html = html.replace(/id="build-badge">[^<]*</, `id="build-badge">${id}<`);
writeFileSync(file, html);
console.log('build badge:', id);

import fs from 'fs';
const appFile = 'src/App.tsx';
let content = fs.readFileSync(appFile, 'utf8');

const s = content.indexOf('const renderMainContent = () => (');
const e = content.indexOf('  const isNewShell = ');
console.log(content.substring(s, e).slice(-2000, -1500));

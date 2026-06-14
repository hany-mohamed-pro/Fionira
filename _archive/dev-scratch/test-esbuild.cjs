import fs from 'fs';
const appFile = 'src/App.tsx';
let content = fs.readFileSync(appFile, 'utf8');

// I will compile App.tsx with esbuild to see exactly what the syntax error is
require('esbuild').transformSync(content, { loader: 'tsx' });

import fs from 'fs';
import path from 'path';

const appPath = path.join(process.cwd(), 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

const lines = content.split('\n');
const linesOfInterest = lines.map((l, i) => {
   if (l.trim().startsWith('const [') && l.includes('useState')) return `${i+1}: ${l.trim()}`;
   if (l.trim().startsWith('useEffect')) return `${i+1}: ${l.trim()}`;
   if (l.trim().startsWith('const ') && (l.includes('useMemo') || l.includes('useCallback') || l.includes(' = async (') || l.includes(' = ('))) {
      if (l.length < 150) return `${i+1}: ${l.trim()}`;
   }
   return null;
}).filter(Boolean);

console.log(linesOfInterest.join('\n'));

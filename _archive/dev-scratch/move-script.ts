import fs from 'fs';
import path from 'path';

const componentsDir = path.join(process.cwd(), 'src', 'components');
const modulesDir = path.join(process.cwd(), 'src', 'modules');

const files = fs.readdirSync(componentsDir);
for (const file of files) {
  if (file.endsWith('.tsx')) {
    fs.renameSync(path.join(componentsDir, file), path.join(modulesDir, file));
  }
}

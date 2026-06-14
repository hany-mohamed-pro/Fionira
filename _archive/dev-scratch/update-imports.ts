import { Project } from "ts-morph";

const project = new Project();
project.addSourceFilesAtPaths("src/**/*.tsx");
project.addSourceFilesAtPaths("src/**/*.ts");

// For every file, look for import declarations that go to './components/...' or '../components/...'
for (const sourceFile of project.getSourceFiles()) {
  const imports = sourceFile.getImportDeclarations();
  for (const imp of imports) {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    if (moduleSpecifier.includes('components/')) {
      const componentName = moduleSpecifier.split('/').pop()!;
      // Find where it went!
      let newDir = '';
      if (['WelcomePage', 'Login', 'Settings'].includes(componentName)) {
        newDir = 'pages';
      } else if (['Card', 'Dialog', 'NavItem', 'ErrorBoundary'].includes(componentName)) {
        newDir = 'shared';
      } else {
        newDir = 'modules';
      }
      
      const newPath = moduleSpecifier.replace(/components/, newDir);
      imp.setModuleSpecifier(newPath);
    }
    
    // Also, inside the moved files, the relative path to `types`, `lib` or `firebase.ts` might have changed
    // if I moved them from `src/components` to `src/pages` or `src/shared` or `src/modules`. Wait, they were all in `src/components` so the depth is the same (`../types` etc.). So relative imports TO the root src/ are unchanged!
  }
  sourceFile.saveSync();
}
console.log("Imports updated.");

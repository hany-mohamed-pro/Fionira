import fs from 'fs';

const appFile = 'src/App.tsx';
let content = fs.readFileSync(appFile, 'utf8');

if (!content.includes("import { NewAppShell }")) {
   content = content.replace("import { WelcomePage }", "import { NewAppShell } from './components/NewAppShell';\nimport { WelcomePage }");
}

const returnStartIdx = content.indexOf('  return (\n    <div dir="rtl" className="h-screen bg-slate-50 font-sans');

if (returnStartIdx === -1) {
   console.error("Could not find return statement");
   process.exit(1);
}

const headerStartIdx = content.indexOf("        {currentData?.rejectedRecords", returnStartIdx);
const mainContentStartStr = '        <div className="flex-1 overflow-auto bg-slate-50/50 p-4" ref={scrollContainerRef}>';
const mainContentStartIdx = content.indexOf(mainContentStartStr, headerStartIdx);

const overlaysIdx = content.indexOf('      {/* OVERLAYS */}', mainContentStartIdx);

console.log("headerStartIdx", headerStartIdx);
console.log("mainContentStartIdx", mainContentStartIdx);
console.log("overlaysIdx", overlaysIdx);

if (headerStartIdx !== -1 && mainContentStartIdx !== -1 && overlaysIdx !== -1) {
    let originalContentHeader = content.substring(headerStartIdx, mainContentStartIdx);
    
    // We want the main content to end right before overlays, but we still want overlays and modals in new shell!
    // So actually we can include them in 'renderMainContent', up to `      </div>\n    </div>\n  );\n}`
    
    const endMatch = content.indexOf('      </div>\n    </div>\n  );\n}', overlaysIdx);
    
    // But we are returning inside `<div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">`
    // Wait, let's just make 'originalMainContent' include the overlays and CommandPalette.
    // They are siblings to `<div className="flex-1 overflow-auto...">`
    // No problem, we can just wrap `renderMainContent` in a Fragment, because `renderMainContent` will return multiple siblings: the scrolling div, then overlays, then CommandPalette.
    // So the end of `originalMainContent` will be at `endMatch` (the final `</div>` of the context container).

    let originalMainContent = content.substring(mainContentStartIdx, endMatch);

    const insertion = `
  const renderContentHeader = () => (
    <>
${originalContentHeader}
    </>
  );

  const renderMainContent = () => (
    <>
${originalMainContent}
    </>
  );

  const isNewShell = import.meta.env.VITE_NEW_APP_SHELL !== 'false';

  if (isNewShell) {
    return (
      <NewAppShell 
         user={user}
         profile={profile}
         settings={settings}
         logout={logout}
         appMode={appMode}
         activeTab={activeTab}
         handleNavClick={handleNavClick}
         totalAnomaliesCount={totalAnomaliesCount}
         contentHeader={renderContentHeader()}
         mainContent={renderMainContent()}
      />
    );
  }

`;

    const beforeReturn = content.substring(0, returnStartIdx);
    const returnToHeader = content.substring(returnStartIdx, headerStartIdx);
    const afterMainContent = content.substring(endMatch); // endMatch points to the closing `      </div>`s.

    const newLegacyReturn = 
        returnToHeader +
        '          {renderContentHeader()}\n' +
        '          {renderMainContent()}\n' +
        afterMainContent;

    fs.writeFileSync(appFile, beforeReturn + insertion + newLegacyReturn);
    console.log("Patched App.tsx successfully");
} else {
    console.error("Failed to find indices");
}

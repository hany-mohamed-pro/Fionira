const fs = require('fs');

const appFile = 'src/App.tsx';
let content = fs.readFileSync(appFile, 'utf8');

if (!content.includes("import { NewAppShell }")) {
   content = content.replace("import { WelcomePage }", "import { NewAppShell } from './components/NewAppShell';\nimport { WelcomePage }");
}

const returnStartIdx = content.indexOf('return (\n    <div dir="rtl" className="h-screen bg-slate-50 font-sans');

if (returnStartIdx === -1) {
   console.error("Could not find return statement");
   process.exit(1);
}

// Just match "        {currentData?.rejectedRecords" after the return statement
const headerStartIdx = content.indexOf("        {currentData?.rejectedRecords", returnStartIdx);

const mainContentStartStr = '        <div className="flex-1 overflow-auto bg-slate-50/50 p-4" ref={scrollContainerRef}>';
const mainContentStartIdx = content.indexOf(mainContentStartStr, headerStartIdx);

if (headerStartIdx === -1) {
  // Sometimes the error banner is not first. Try finding the <header> instead.
  // Actually the banner is there in line 2133
  console.log("Could not find header start!");
}

let mainContentEndIdx = -1;
// Find the closing of the main content: "          )}\n        </div>\n      </div>\n    </div>\n  );\n}"
const endMatch = content.match(/          \)}\n        <\/div>\n      <\/div>\n    <\/div>\n  \);/);
if (endMatch) {
    mainContentEndIdx = endMatch.index + 15 + "</div>".length; 
} else {
    mainContentEndIdx = content.indexOf('        </div>\n      </div>\n    </div>\n  );', mainContentStartIdx);
}


console.log("headerStartIdx", headerStartIdx);
console.log("mainContentStartIdx", mainContentStartIdx);
console.log("mainContentEndIdx", mainContentEndIdx);

if (headerStartIdx !== -1 && mainContentStartIdx !== -1 && mainContentEndIdx !== -1) {
    let originalContentHeader = content.substring(headerStartIdx, mainContentStartIdx);
    let originalMainContent = content.substring(mainContentStartIdx, mainContentEndIdx);

    const insertion = `
  const renderContentHeader = () => (
    <>
${originalContentHeader}
    </>
  );

  const renderMainContent = () => (
${originalMainContent}
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

    // Wait, the original `return (` was indented. I'll just replace the string.
    const beforeReturn = content.substring(0, returnStartIdx);
    const returnToHeader = content.substring(returnStartIdx, headerStartIdx);
    const afterMainContent = content.substring(mainContentEndIdx);

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

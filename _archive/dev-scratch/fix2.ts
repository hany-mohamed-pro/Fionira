import fs from 'fs';
const appFile = 'src/App.tsx';
let content = fs.readFileSync(appFile, 'utf8');

// 1. Remove the culprit `</div>` before OVERLAYS
const culpritStr = `          </div>\n        </div>\n      </div>\n\n      {/* OVERLAYS */}`;
const fixStr = `          </div>\n        </div>\n\n      {/* OVERLAYS */}`;
content = content.replace(culpritStr, fixStr);

// 2. Add an extra `</div>` to the end of the legacy return
const legacyEndStr = `          {renderMainContent()}\n      </div>\n    </div>\n  );\n}`;
const fixLegacyEndStr = `          {renderMainContent()}\n        </div>\n      </div>\n    </div>\n  );\n}`;
content = content.replace(legacyEndStr, fixLegacyEndStr);

fs.writeFileSync(appFile, content);
console.log("App.tsx fixed successfully!");

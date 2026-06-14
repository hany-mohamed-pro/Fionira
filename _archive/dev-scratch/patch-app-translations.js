const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add translation imports
if (!code.includes('getTranslation')) {
  code = code.replace("import { useUI } from './contexts/UIContext';", "import { useUI } from './contexts/UIContext';\nimport { getTranslation } from './i18n/ui-text';");
}

// 2. Add language to useUI extraction
code = code.replace("const { showConfirm, showAlert, notify } = useUI();", "const { showConfirm, showAlert, notify, language } = useUI();\n  const t = getTranslation(language);\n  const isRTL = language === 'ar';");

// 3. Replace renderContentHeader h2 logic
const h2Regex = /<h2 className="text-2xl font-extrabold text-slate-800 flex items-center">[\s\S]*?<\/h2>/;
const newH2 = `<h2 className="text-2xl font-extrabold text-slate-800 flex items-center capitalize">
                  {t.workspace[activeTab as keyof typeof t.workspace] || t.nav[activeTab as keyof typeof t.nav] || activeTab.replace('_', ' ')}
                  {['upload', 'grouped_purchases', 'categories_summary'].includes(activeTab) ? \` \${t.workspace[appMode as keyof typeof t.workspace] || ''}\` : ''}
                </h2>`;
code = code.replace(h2Regex, newH2);

// 4. Replace other hardcoded arabic in renderContentHeader
code = code.replace("بحث شامل...", "{t.common.search}");
code = code.replace("إلغاء الفلترة", "{t.common.cancel}");
code = code.replace("تصدير", "{t.common.export}");

// Also remove the old english/arabic mixes if possible or replace them with generic english if t.common.xxx is used.

fs.writeFileSync('src/App.tsx', code);
console.log('Patched App.tsx');
import { Project } from "ts-morph";

const project = new Project();
project.addSourceFilesAtPaths("src/**/*.tsx");
project.addSourceFilesAtPaths("src/**/*.ts");

for (const sourceFile of project.getSourceFiles()) {
  const imports = sourceFile.getImportDeclarations();
  for (const imp of imports) {
    const specifier = imp.getModuleSpecifierValue();
    if (specifier.startsWith('./') && !specifier.includes('components')) {
      const componentName = specifier.replace('./', '');
      let newDir = '';
      if (['WelcomePage', 'Login', 'Settings'].includes(componentName)) {
        newDir = '../pages';
      } else if (['Card', 'Dialog', 'NavItem', 'ErrorBoundary'].includes(componentName)) {
        newDir = '../shared';
      } else if (['AlertsReport', 'AnomaliesReport', 'Audit', 'BalanceSheet', 'CashFlow', 'CategoriesSummary', 'GeneralLedger', 'GlobalAuditLog', 'GroupedPurchases', 'IncomeStatement', 'ItemsDirectory', 'JournalEntryModal', 'MonthlyPayroll', 'MonthlySummary', 'OwnersSummary', 'PayrollExpenseAllocation', 'RawDataInspector', 'ShadowValidationUI', 'StatementOfAccount', 'TaxDeclaration', 'TraceModal', 'TrialBalance', 'VisualDashboard', 'YearlyComparison', 'FileManagement', 'UserManagement', 'QuotationManager', 'SmartInvoice'].includes(componentName)) {
        newDir = '../modules';
      }
      
      const isFileInSubdir = sourceFile.getFilePath().includes('/modules/') || sourceFile.getFilePath().includes('/pages/') || sourceFile.getFilePath().includes('/shared/');
      if (newDir && isFileInSubdir) {
        imp.setModuleSpecifier(`${newDir}/${componentName}`);
      }
    }
  }
  sourceFile.saveSync();
}
console.log("Relative imports fixed.");

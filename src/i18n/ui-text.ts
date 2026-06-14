// src/i18n/ui-text.ts
export type Language = 'ar' | 'en';

export const UI_TEXT = {
  ar: {
    // Navigation
    nav: {
      dashboard: 'لوحة التحكم',
      expenses: 'المصروفات',
      revenues: 'الإيرادات',
      payroll: 'الرواتب',
      invoices: 'الفواتير',
      reports: 'التقارير',
      accounting: 'المحاسبة',
      settings: 'الإعدادات',
      governance: 'الحوكمة',
      administration: 'الإدارة'
    },
    workspace: {
      dashboard: 'لوحة التحكم',
      expenses: 'المصروفات',
      revenues: 'الإيرادات',
      payroll: 'الرواتب',
      banks: 'البنوك',
      reports: 'التقارير',
      upload: 'رفع الملفات',
      vendors: 'الموردون',
      customers: 'العملاء',
      categories: 'التصنيفات / دليل الحسابات',
      items: 'دليل الأصناف',
      import: 'استيراد البيانات',
      diagnostics: 'التشخيص',
      income_statement: 'قائمة الدخل',
      balance_sheet: 'الميزانية العمومية',
      cash_flow: 'قائمة التدفقات النقدية',
      general_ledger: 'دفتر الأستاذ',
      banks_and_finance: 'البنوك والتمويل',
      owners_summary: 'ملخص الملاك',
      monthly_summary: 'الملخص الشهري',
      categories_summary: 'تفصيل التصنيفات',
      grouped_purchases: 'قائمة السجلات',
      statement_of_account: 'كشف الحساب',
      trial_balance: 'ميزان المراجعة',
      data_governance: 'فحص البيانات',
      monthly_payroll: 'مسير الرواتب',
      payroll_expense_allocation: 'توزيع المصاريف',
      anomalies_report: 'مطابقة البنوك',
      // Legacy workspace mappings for fallback:
      files: 'رفع الملفات',
      chart: 'التصنيفات / دليل الحسابات',
      analytics: 'التحليلات',
      statements: 'القوائم',
      review: 'مراجعة البيانات',
      employees: 'الموظفون',
      payroll_processing: 'مسيرات الرواتب',
      bank_processing: 'معالجة البنوك'
    },
    common: {
      search: 'بحث شامل...',
      notifications: 'الإشعارات',
      settings: 'الإعدادات',
      logout: 'تسجيل الخروج',
      welcome: 'مرحباً',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      add: 'إضافة',
      company: 'الشركة',
      confirmDelete: 'تأكيد الحذف',
      deleteConfirmText: 'هل أنت متأكد من حذف هذه الفاتورة؟ لن تتمكن من التراجع عن هذه العملية.',
      deleteSuccess: 'تم حذف الفاتورة بنجاح',
      documentNumber: 'رقم المستند',
      date: 'التاريخ',
      grandTotal: 'الإجمالي الكلي',
      operations: 'العمليات',
      export: 'تصدير',
    },
    brand: {
      name: 'Fionira',
      tagline: 'Intelligent Finance, Simplified', // Taglines are typically kept in English for brand consistency, or translated if requested. We will keep as requested.
      descriptor: 'Financial Intelligence Engine'
    }
  },
  en: {
    // Navigation
    nav: {
      dashboard: 'Dashboard',
      expenses: 'Expenses',
      revenues: 'Revenues',
      payroll: 'Payroll',
      invoices: 'Invoices',
      reports: 'Reports',
      accounting: 'Accounting',
      settings: 'Settings',
      governance: 'Governance',
      administration: 'Administration'
    },
    workspace: {
      dashboard: 'Dashboard',
      expenses: 'Expenses',
      revenues: 'Revenues',
      payroll: 'Payroll',
      banks: 'Banks & Finance',
      reports: 'Reports',
      upload: 'Upload Files',
      vendors: 'Vendors',
      customers: 'Customers',
      categories: 'Categories / CoA',
      items: 'Item Master',
      import: 'Import Data',
      diagnostics: 'Diagnostics',
      income_statement: 'Income Statement',
      balance_sheet: 'Balance Sheet',
      cash_flow: 'Cash Flow Statement',
      general_ledger: 'General Ledger',
      banks_and_finance: 'Banks & Finance',
      owners_summary: 'Owners Summary',
      monthly_summary: 'Monthly Summary',
      categories_summary: 'Categories Summary',
      grouped_purchases: 'Records List',
      statement_of_account: 'Statement of Account',
      trial_balance: 'Trial Balance',
      data_governance: 'Data Inspection',
      monthly_payroll: 'Monthly Payroll',
      payroll_expense_allocation: 'Expense Allocation',
      anomalies_report: 'Bank Reconciliation',
      // Legacy workspace mappings for fallback:
      files: 'Files Upload',
      chart: 'Categories / CoA',
      analytics: 'Analytics',
      statements: 'Statements',
      review: 'Data Review',
      employees: 'Employees',
      payroll_processing: 'Payroll Processing',
      bank_processing: 'Bank Processing'
    },
    common: {
      search: 'Search...',
      notifications: 'Notifications',
      settings: 'Settings',
      logout: 'Logout',
      welcome: 'Welcome',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      company: 'Company',
      confirmDelete: 'Confirm Delete',
      deleteConfirmText: 'Are you sure you want to delete this invoice? You cannot undo this action.',
      deleteSuccess: 'Invoice deleted successfully',
      documentNumber: 'Document No.',
      date: 'Date',
      grandTotal: 'Grand Total',
      operations: 'Operations',
      export: 'Export',
    },
    brand: {
      name: 'Fionira',
      tagline: 'Intelligent Finance, Simplified',
      descriptor: 'Financial Intelligence Engine'
    }
  }
};

export const getTranslation = (lang: Language) => {
  return UI_TEXT[lang];
};

import React, { useState, useMemo, Fragment } from 'react';
import { FileText, Search, Filter, ArrowDownRight, ArrowUpRight, Download, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { OperationalErrorsPanel } from './OperationalErrorsPanel';
import { FinancialRecord } from '../types';
import { formatCurrency, isSimilarName } from '../lib/financial-utils';
import { exportReportPDF } from '../lib/pdf-engine';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface StatementOfAccountProps {
  appMode: 'expenses' | 'revenues' | 'payroll' | 'banks' | 'reports';
  records: FinancialRecord[];
  bankRecords: FinancialRecord[];
  entLabel: string;
  onDeleteRecord?: (record: FinancialRecord) => void;
  onInvoiceClick?: (invoice: FinancialRecord) => void;
}

export const StatementOfAccount: React.FC<StatementOfAccountProps> = ({
  appMode,
  records,
  bankRecords,
  entLabel,
  onDeleteRecord,
  onInvoiceClick
}) => {
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Get unique entities from records and deduplicate them using similarity
  const entities = useMemo(() => {
    const rawNames = new Set<string>();
    records.forEach(r => {
      const name = r.Entity_Normalized_Name || r.Raw_Entity;
      if (name) rawNames.add(name);
    });

    const uniqueNames: string[] = [];
    const isVendor = appMode === 'expenses';

    Array.from(rawNames).forEach(name => {
      let found = false;
      for (const existing of uniqueNames) {
        if (isSimilarName(name, existing, isVendor)) {
          found = true;
          break;
        }
      }
      if (!found) {
        uniqueNames.push(name);
      }
    });

    return uniqueNames.sort();
  }, [records, appMode]);

  const filteredEntities = useMemo(() => {
    if (!searchQuery) return entities;
    return entities.filter(e => e.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [entities, searchQuery]);

  React.useEffect(() => {
    if (entities.length === 1 && !selectedEntity) {
      setSelectedEntity(entities[0]);
    }
  }, [entities, selectedEntity]);

  const selectedEntityRecords = useMemo(() => {
    if (!selectedEntity) return [];
    return records.filter(r => r.Entity_Name === selectedEntity || r.Entity_Normalized_Name === selectedEntity || r.Raw_Entity === selectedEntity);
  }, [records, selectedEntity]);

  const statementData = useMemo(() => {
    if (!selectedEntity) return [];

    const isVendor = appMode === 'expenses';
    const entries: any[] = [];

    // 1. Add Invoices
    records.forEach(r => {
      const name = r.Entity_Normalized_Name || r.Raw_Entity || '';
      if (isSimilarName(name, selectedEntity, isVendor)) {
        entries.push({
          date: r.Invoice_Date,
          description: `فاتورة ${r.Category !== 'غير مصنف' ? '- ' + r.Category : ''} ${r.Item_Description ? ': ' + r.Item_Description : ''}`,
          docNumber: r.Invoice_Number,
          debit: appMode === 'revenues' ? r.Total_Amount : 0,
          credit: appMode === 'expenses' ? r.Total_Amount : 0,
          type: 'invoice',
          originalRecord: r
        });
      }
    });

    // 2. Add Bank Transactions
    bankRecords.forEach(r => {
      const name = r.Entity_Normalized_Name || r.Raw_Entity || '';
      const desc = r.Item_Description || '';
      
      // Match by entity name or if the description contains the entity name
      if (isSimilarName(name, selectedEntity, isVendor) || isSimilarName(desc, selectedEntity, isVendor)) {
        const withdrawal = r.NonTaxable_Amount || 0;
        const deposit = r.Taxable_Amount || 0;
        
        entries.push({
          date: r.Invoice_Date,
          description: `حركة بنكية: ${desc}`,
          docNumber: r.Invoice_Number || r.Entity_TaxID || '-',
          debit: appMode === 'expenses' ? withdrawal : withdrawal, // For expenses, withdrawal is debit. For revenues, withdrawal is debit (refund)
          credit: appMode === 'revenues' ? deposit : deposit, // For revenues, deposit is credit. For expenses, deposit is credit (refund)
          type: 'bank',
          originalRecord: r
        });
      }
    });

    // Sort by date
    entries.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (isNaN(dateA) || isNaN(dateB)) return 0;
      return dateA - dateB;
    });

    // Calculate running balance
    let balance = 0;
    return entries.map(entry => {
      balance += (entry.debit - entry.credit);
      return { ...entry, balance };
    });

  }, [selectedEntity, records, bankRecords, appMode]);

  const totalDebit = statementData.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = statementData.reduce((sum, item) => sum + item.credit, 0);
  const finalBalance = totalDebit - totalCredit;

  const handleExportPDF = async () => {
    if (!selectedEntity || statementData.length === 0) return;
    setIsExporting(true);
    try {
      const title = `كشف حساب ${entLabel}: ${selectedEntity}`;
      const headers = ['التاريخ', 'رقم المستند', 'البيان', 'مدين', 'دائن', 'الرصيد'];
      const content = statementData.map(row => [
        row.date,
        row.docNumber,
        row.description,
        row.debit > 0 ? row.debit.toFixed(2) : '-',
        row.credit > 0 ? row.credit.toFixed(2) : '-',
        `${Math.abs(row.balance).toFixed(2)} ${row.balance >= 0 ? 'مدين' : 'دائن'}`
      ]);
      content.push([
        'الإجمالي الكلي', '-', '-',
        totalDebit.toFixed(2),
        totalCredit.toFixed(2),
        `${Math.abs(finalBalance).toFixed(2)} ${finalBalance >= 0 ? 'مدين' : 'دائن'}`
      ]);

      await exportReportPDF(title, content, headers, `Statement_${selectedEntity}_${new Date().getTime()}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedEntity || statementData.length === 0) return;
    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('كشف حساب', { views: [{ rightToLeft: true }] });

      const headers = ['التاريخ', 'رقم المستند', 'البيان', 'مدين', 'دائن', 'الرصيد'];
      
      const titleRow = sheet.addRow([`كشف حساب: ${selectedEntity}`]);
      titleRow.font = { size: 16, bold: true };
      sheet.addRow([]); // empty row

      const headerRow = sheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' }
      };

      sheet.columns = [
        { width: 15 },
        { width: 25 },
        { width: 50 },
        { width: 15 },
        { width: 15 },
        { width: 20 },
      ];

      statementData.forEach(row => {
        sheet.addRow([
          row.date,
          row.docNumber,
          row.description,
          row.debit > 0 ? row.debit : '-',
          row.credit > 0 ? row.credit : '-',
          `${Math.abs(row.balance).toFixed(2)} ${row.balance >= 0 ? 'مدين' : 'دائن'}`
        ]);
      });

      const totalRow = sheet.addRow([
        'الإجمالي الكلي', '-', '-',
        totalDebit,
        totalCredit,
        `${Math.abs(finalBalance).toFixed(2)} ${finalBalance >= 0 ? 'مدين' : 'دائن'}`
      ]);
      totalRow.font = { bold: true };
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' }
      };

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Statement_${selectedEntity}_${new Date().getTime()}.xlsx`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)]">
      {/* Sidebar - Entity List */}
      <div className="w-full lg:w-1/3 xl:w-1/4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 mb-3">اختر {entLabel}</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={`بحث عن ${entLabel}...`}
              className="w-full pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {filteredEntities.length > 0 ? (
            <div className="space-y-1">
              {filteredEntities.map((ent, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedEntity(ent)}
                  className={`w-full text-right px-4 py-3 rounded-lg text-sm font-medium transition-colors ${selectedEntity === ent ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
                >
                  {ent}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              لا توجد نتائج
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Statement */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {selectedEntity ? (
          <>
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">{selectedEntity}</h2>
                <p className="text-sm text-slate-500 mt-1">كشف حساب تفصيلي</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex gap-2">
                  <button 
                    onClick={handleExportExcel}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 hover:bg-emerald-100 font-bold text-sm transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    تصدير Excel
                  </button>
                  <button 
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-3 py-2 bg-rose-50 text-rose-700 rounded-lg border border-rose-200 hover:bg-rose-100 font-bold text-sm transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    تصدير PDF
                  </button>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm hidden md:block">
                  <span className="block text-[10px] text-slate-400 font-bold mb-1">إجمالي مدين</span>
                  <span className="text-sm font-black text-emerald-600" dir="ltr">{formatCurrency(totalDebit)}</span>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm hidden md:block">
                  <span className="block text-[10px] text-slate-400 font-bold mb-1">إجمالي دائن</span>
                  <span className="text-sm font-black text-rose-600" dir="ltr">{formatCurrency(totalCredit)}</span>
                </div>
                <div className={`px-4 py-2 rounded-lg border shadow-sm hidden sm:block ${finalBalance >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  <span className={`block text-[10px] font-bold mb-1 ${finalBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>الرصيد النهائي</span>
                  <span className={`text-sm font-black ${finalBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`} dir="ltr">{formatCurrency(Math.abs(finalBalance))} {finalBalance >= 0 ? 'مدين' : 'دائن'}</span>
                </div>
              </div>
            </div>
            
            {/* Mobile totals summary */}
             <div className="sm:hidden p-4 bg-white border-b border-slate-100 grid grid-cols-3 gap-2 text-center">
                <div>
                   <span className="block text-[10px] text-slate-400 font-bold mb-1">مدين</span>
                   <span className="text-xs font-black text-emerald-600" dir="ltr">{formatCurrency(totalDebit)}</span>
                </div>
                <div>
                   <span className="block text-[10px] text-slate-400 font-bold mb-1">دائن</span>
                   <span className="text-xs font-black text-rose-600" dir="ltr">{formatCurrency(totalCredit)}</span>
                </div>
                <div>
                   <span className="block text-[10px] text-slate-400 font-bold mb-1">الرصيد</span>
                   <span className={`text-xs font-black ${finalBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`} dir="ltr">{formatCurrency(Math.abs(finalBalance))}</span>
                </div>
             </div>

            <div className="flex-1 overflow-auto custom-scrollbar p-0">
              <div className="p-4">
                 <OperationalErrorsPanel records={selectedEntityRecords} />
              </div>
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3">التاريخ</th>
                    <th className="px-4 py-3">رقم المستند</th>
                    <th className="px-4 py-3">البيان</th>
                    <th className="px-4 py-3 text-center">مدين</th>
                    <th className="px-4 py-3 text-center">دائن</th>
                    <th className="px-4 py-3 text-center">الرصيد</th>
                    {onDeleteRecord && <th className="px-4 py-3 text-center w-12"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statementData.length > 0 ? (
                    statementData.map((row, idx) => (
                      <Fragment key={idx}>
                      <tr className="hover:bg-slate-100 transition-colors cursor-pointer"
                          onClick={() => {
                            if(row.originalRecord) onInvoiceClick?.(row.originalRecord);
                          }}
                      >
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {row.date}
                          {row.originalRecord?.operationalErrors && row.originalRecord.operationalErrors.length > 0 && <AlertTriangle className="w-4 h-4 text-amber-500 inline-block ml-1 mt-1" />}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">{row.docNumber}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {row.type === 'invoice' ? <FileText className="w-4 h-4 text-indigo-400" /> : <ArrowUpRight className="w-4 h-4 text-emerald-400" />}
                            <span className="text-slate-800 font-medium">{row.description}</span>
                          </div>
                          {row.originalRecord?.AI_Explanation && (
                            <div className="text-[10px] text-slate-500 mt-1.5 max-w-[300px] whitespace-normal leading-tight bg-slate-50 p-2 rounded border border-slate-200" title={`الثقة الثنائية الذكية: ${row.originalRecord?.Category_Confidence || 0}%`}>
                               <span className="text-indigo-600 font-bold">تفسير الذكاء الاصطناعي: </span>
                               {row.originalRecord.AI_Explanation}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-600" dir="ltr">{row.debit > 0 ? formatCurrency(row.debit) : '-'}</td>
                        <td className="px-4 py-3 text-center font-bold text-rose-600" dir="ltr">{row.credit > 0 ? formatCurrency(row.credit) : '-'}</td>
                        <td className="px-4 py-3 text-center font-black text-slate-900" dir="ltr">
                          <span className={row.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                            {formatCurrency(Math.abs(row.balance))} {row.balance >= 0 ? 'مدين' : 'دائن'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {onDeleteRecord && row.originalRecord && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onDeleteRecord(row.originalRecord); }}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                              title="حذف الحركة"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                          )}
                        </td>
                      </tr>
                      {row.originalRecord?.operationalErrors && row.originalRecord.operationalErrors.length > 0 && (
                        <tr className="bg-amber-50 border-b border-amber-100">
                          <td colSpan={6} className="p-3">
                            <div className="flex flex-col gap-2 relative">
                              {row.originalRecord.operationalErrors.map((err: any, eIdx: number) => (
                                <div key={eIdx} className="flex items-start justify-between bg-white px-4 py-2 border border-amber-200 rounded-lg shadow-sm">
                                  <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full ${err.severity === 'HIGH' ? 'bg-red-500' : 'bg-amber-400'}`}></span>
                                    <div>
                                      <div className="text-sm font-bold text-slate-800">{err.message}</div>
                                      <div className="text-xs text-slate-500 mt-0.5"><strong className="text-amber-700">التشخيص:</strong> {err.type}</div>
                                    </div>
                                  </div>
                                  {err.suggestedFixes && err.suggestedFixes.length > 0 && (
                                    <div className="flex items-center gap-2">
                                      {err.suggestedFixes.map((fix: any, fIdx: number) => (
                                        <button key={fIdx} onClick={(e) => { e.stopPropagation(); alert('يجب تطوير دالة تطبيق المقترح.'); }} className="text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors border border-amber-300">
                                          اقتراح: {fix.description}
                                        </button>
                                      ))}
                                      <button onClick={(e) => {
                                        e.stopPropagation();
                                        const runEscalation = async () => {
                                            if(window.confirm('سيتم رفع السجل لإدارة الجودة (Governance) كحالة تتطلب التدخل، هل أنت متأكد؟')) {
                                               try {
                                                   await addDoc(collection(db, 'rejected_records'), {
                                                       id: crypto.randomUUID(),
                                                       record: row.originalRecord,
                                                       errors: [err.message],
                                                       category: err.type,
                                                       severity: err.severity,
                                                       source: "operational",
                                                       moduleType: appMode,
                                                       timestamp: serverTimestamp(),
                                                       status: "PENDING_APPROVAL",
                                                       proposedFix: err.suggestedFixes[0]?.description || '',
                                                       createdBy: "user",
                                                       approvals: []
                                                   });
                                                   alert('تم تصعيد السجل لمدير الجودة بنجاح.');
                                               } catch(error) { console.error(error); }
                                            }
                                        };
                                        runEscalation();
                                      }} className="text-xs font-bold bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-slate-200">
                                        تجاهل وتصعيد
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={onDeleteRecord ? 7 : 6} className="px-4 py-12 text-center text-slate-400">
                        لا توجد حركات مسجلة لهذا {entLabel}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Filter className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-bold">الرجاء اختيار {entLabel} من القائمة لعرض كشف الحساب</p>
          </div>
        )}
      </div>
    </div>
  );
};


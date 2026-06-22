import * as XLSX from 'xlsx';
import { getPayrollCategory } from '../categorization-engine';
import { validateRecord, parseNum } from './shared-processor';
import { detectTabularHeader, makeScoredGetCol } from './header-detection';

export function processPayroll(buffer: ArrayBuffer, fileName: string) {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

  const records = [];
  const skipped = [];

  // Real payroll sheets use a TWO-ROW merged header: a top-level group row
  // (الراتب / الاستقطاعات / صافي الراتب) above a detail row (الراتب الاساسي /
  // بدل سكن / سلف / غياب ...). Merge both rows so detail AND total columns are
  // visible. Anchor on payroll keywords so a title/preamble row is skipped.
  const detected = detectTabularHeader(data, {
    anchors: [/اسم/, /راتب/, /استقطاع/, /موظف/, /\bnet\b/i, /salary/i],
    mergeMultiRow: true,
  });

  if (!detected) {
    throw new Error("Could not detect structural header for payroll.");
  }

  const headerRowIndex = detected.headerRowIndex;
  const dataStartIndex = detected.dataStartIndex;
  const colMap = detected.colMap;

  // Priority-scored resolver: a bare /راتب/ must NOT bind the net column to the
  // basic-salary group header ("الراتب الراتب الاساسي") that merely contains
  // the word راتب — صافي wins for net, اجمالي wins for gross.
  const getCol = makeScoredGetCol(colMap);

  const dateCol = getCol([/date/i, /تاريخ/i, /شهر/i, /month/i], [/راتب/i, /salary/i]);
  const invoiceCol = getCol([/inv/i, /فاتور/i]);
  const entityCol = getCol([/employee/i, /name/i, /اسم/i, /موظف/i]);
  const descCol = getCol([/desc/i, /job/i, /position/i, /وصف/i, /مسمى/i, /وظيفة/i]);
  // NET salary: anchor on صافي/net; exclude the basic/gross/deduction group
  // headers that also contain the word راتب so they cannot steal this column.
  const amountCol = getCol([/صاف[يى]/i, /\bnet\b/i, /راتب/i], [/اساسي/i, /أساسي/i, /اجمال/i, /إجمال/i, /استقطاع/i, /asasi/i]);
  // GROSS salary: اجمالي الراتب — exclude اجمالي الاستقطاع (total deductions).
  const grossCol = getCol([/gross/i, /اجمال/i, /إجمال/i], [/استقطاع/i, /خصم/i, /deduction/i]);
  const basicCol = getCol([/basic/i, /اساسي/i, /أساسي/i]);
  const housingCol = getCol([/house/i, /housing/i, /سكن/i]);
  const transportCol = getCol([/transport/i, /انتقال/i, /نقل/i, /مواصل/i]);
  const mealCol = getCol([/meal/i, /food/i, /وجب[ةه]/i]);
  const otherAllowanceCol = getCol([/other/i, /اخر[ىي]/i, /أخر[ىي]/i, /بدلات/i], [/اجمال/i, /استقطاع/i]);
  const gosiCol = getCol([/gosi/i, /تأمين/i, /تامين/i, /اجتماع/i]);
  const absentCol = getCol([/absent/i, /absence/i, /غياب/i]);
  const loanCol = getCol([/loan/i, /advance/i, /سلف/i, /قرض/i]);
  const stopCol = getCol([/ايقاف/i, /إيقاف/i, /stop/i]);
  const penaltyCol = getCol([/penalt/i, /جزا/i]);
  console.log({ dateCol, invoiceCol, entityCol, amountCol, grossCol, basicCol, housingCol, transportCol, mealCol, otherAllowanceCol, gosiCol, absentCol, loanCol, stopCol, penaltyCol });

  for (let i = dataStartIndex; i < data.length; i++) {
    const row = data[i] as any[];
    if (!row || row.length === 0 || row.every(c => c === undefined || c === null || c === '')) continue;

    let hasNumbers = false;
    row.forEach(c => { if (typeof c === 'number' || (typeof c === 'string' && /[0-9٠-٩]/.test(c))) hasNumbers = true; });

    if (!hasNumbers) {
      skipped.push({ index: i, reason: 'Structural: No numeric values', _sourceFile: fileName, rawData: row });
      continue;
    }

    let isTotalRow = false;
    for (let cIdx = 0; cIdx < Math.min(row.length, 5); cIdx++) {
      const c = row[cIdx];
      if (typeof c === 'string') {
         const trimmedStr = c.toLowerCase().trim().replace(/\s+/g, ' ');
         if (/^(?:(?:قيمة|قيمه|مبلغ|رصيد)\s*)?(?:total|totals|sum|summary|grand total|subtotal|sub total|اجمال[يى]?|إجمال[يى]?|الاجمال[يى]?|الإجمال[يى]?|اجماليات|الاجماليات|الإجماليات|مجموع(?!ة|ه)|المجموع(?!ة|ه)|صاف[يى]|الصاف[يى]|جملة|الجملة|الكلي|النهائي)(?:\s.*)?$/i.test(trimmedStr)) {
            isTotalRow = true;
            break;
         }
      }
    }
    
    if (isTotalRow) {
      skipped.push({ index: i, reason: 'Structural: Total row detected', _sourceFile: fileName, rawData: row });
      continue;
    }

    const rawDate = dateCol !== -1 && row[dateCol] != null ? String(row[dateCol]) : null;
    const rawInvoice = invoiceCol !== -1 && row[invoiceCol] != null ? String(row[invoiceCol]) : null;
    const rawEntity = row[entityCol] ? String(row[entityCol]) : 'موظف غير محدد';
    const rawDesc = row[descCol] ? String(row[descCol]) : '';

    // Breakdowns — use the shared, robust numeric parser (handles Arabic
    // numerals, thousands separators, accounting "-"). The old inline parseAmt
    // used /[^d.-]/ (literal d), which stripped every digit and returned 0.
    const amt = (col: number) => col !== -1 ? (parseNum(row[col]) ?? 0) : 0;
    const basic = amt(basicCol);
    const housing = amt(housingCol);
    const transport = amt(transportCol);
    const meal = amt(mealCol);
    const otherAllow = amt(otherAllowanceCol);

    const gosi = amt(gosiCol);
    const absent = amt(absentCol);
    const loan = amt(loanCol);
    const stop = amt(stopCol);
    const penalty = amt(penaltyCol);

    const category = getPayrollCategory(rawEntity, rawDesc);

    let periodYear = null;
    if (rawDate) {
      const yearMatch = String(rawDate).match(/\b(20\d{2})\b/);
      if (yearMatch) periodYear = parseInt(yearMatch[1], 10);
    }

    const allowancesTotal = housing + transport + meal + otherAllow;
    const deductionsTotal = gosi + absent + loan + stop + penalty;
    const net = (basic + allowancesTotal) - deductionsTotal;

    // Total_Amount is the disbursed net salary. Prefer the sheet's own net
    // column (صافي الراتب) when present — including a legitimate 0 (stopped
    // salary) — and fall back to gross, then the computed net.
    const netColVal = amountCol !== -1 ? parseNum(row[amountCol]) : null;
    const grossColVal = grossCol !== -1 ? parseNum(row[grossCol]) : null;
    let total = netColVal != null ? netColVal : (grossColVal != null ? grossColVal : net);
    if (isNaN(total)) total = 0;

    // enforce mismatch: source net column vs. computed component net
    const isMismatch = Math.abs(total - net) > 0.01;

    const record = {
      id: crypto.randomUUID(),
      moduleType: 'payroll',
      _sourceFile: fileName,
      _originalRowIndex: i,
      Invoice_Number: rawInvoice,
      Invoice_Date: rawDate,
      Period_Year: periodYear,
      Entity_Name: rawEntity.trim(),
      Raw_Entity: rawEntity.trim(),
      Item_Description: rawDesc.trim(),
      Total_Amount: total,
      // Payroll has NO VAT — the intelligence engine itself flags any payroll
      // VAT as accounting-impossible (PAYROLL_WITH_VAT). The total deductions
      // belong in Total_Deductions / DeductionsBreakdown, NOT VAT_Amount.
      VAT_Amount: 0,
      Total_Deductions: deductionsTotal,
      Taxable_Amount: basic,
      NonTaxable_Amount: allowancesTotal,
      Net_Amount: net,
      Category: category,
      Basic_Salary: basic,
      AllowancesBreakdown: {
         'بدل سكن': housing,
         'بدل انتقال': transport,
         'بدل وجبة': meal,
         'بدلات أخرى': otherAllow
      },
      DeductionsBreakdown: {
         'التأمينات الاجتماعية': gosi,
         'خصم غياب': absent,
         'سلف مستردة': loan,
         'ايقاف راتب': stop,
         'جزاءات': penalty
      },
      // Arithmetic integrity (component sums), NOT classification accuracy.
      Math_Integrity_Score: isMismatch ? 50 : 100,
      Confidence_Score: isMismatch ? 50 : 100,
      Financial_Mismatch: isMismatch
    };
    if (i < headerRowIndex + 11) console.log(record);
    console.log("INSERTING RECORD:", record);
    const valResult = validateRecord(record);
    if (!valResult.isValid) {
      skipped.push({ index: i, reason: 'Integrity: ' + valResult.errors.join(', '), category: valResult.category, severity: valResult.severity, proposedFix: valResult.proposedFix, _sourceFile: fileName, rawData: row });
      continue;
    }
    records.push(record);
  }

  return { records, skipped };
}

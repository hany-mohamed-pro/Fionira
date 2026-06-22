import * as XLSX from 'xlsx';
import { validateRecord, parseExcelDate } from './shared-processor';
import { detectTabularHeader, makeScoredGetCol } from './header-detection';

export function processBanks(buffer: ArrayBuffer, fileName: string) {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

  const records = [];
  const skipped = [];

  // Saudi bank exports prepend an arbitrary-length metadata preamble (account
  // name, number, date range, transaction totals) before the real column
  // header. Anchor on the transaction-column keywords so the preamble is
  // skipped regardless of its length, instead of giving up after 20 rows.
  const detected = detectTabularHeader(data, {
    anchors: [/مدين/, /دائن/, /الوصف/, /المرجع/, /رصيد/, /debit/i, /credit/i],
  });

  if (!detected) {
    throw new Error("Could not detect structural header for banks.");
  }

  const headerRowIndex = detected.headerRowIndex;
  const dataStartIndex = detected.dataStartIndex;
  const colMap = detected.colMap;

  // Priority-scored resolver: prevents loose substrings (e.g. /in/ inside
  // "processing date") from stealing a column from a higher-priority keyword.
  const getCol = makeScoredGetCol(colMap);

  const dateCol = getCol([/date/i, /تاريخ/i]);
  const descCol = getCol([/desc/i, /تفاصيل/i, /بيان/i, /details/i, /particulars/i]);
  const debitCol = getCol([/debit/i, /مدين/i, /سحب/i, /withdrawal/i, /out/i, /مخرج/i]);
  const creditCol = getCol([/credit/i, /دائن/i, /إيداع/i, /deposit/i, /in/i, /مدخل/i]);
  const balanceCol = getCol([/balance/i, /رصيد/i]);
  console.log({
    dateColumn: dateCol,
    descColumn: descCol,
    debitColumn: debitCol,
    creditColumn: creditCol,
    balanceColumn: balanceCol
  });

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

    const tDesc = typeof row[descCol] === 'string' ? row[descCol].toLowerCase() : '';
    let isOpening = false;
    if (tDesc.includes('opening balance') || tDesc.includes('رصيد افتتاحي')) {
       isOpening = true;
    }

    // Parse the date column. Saudi exports use an Excel date serial (e.g.
    // 46124) in [SA]Processing Date; fall back to the raw string otherwise.
    const rawDate = row[dateCol] != null ? (parseExcelDate(row[dateCol]) ?? String(row[dateCol])) : '';
    const rawDesc = row[descCol] ? String(row[descCol]) : 'حركة غير محددة';

    let rawDebit = row[debitCol] || 0;
    let rawCredit = row[creditCol] || 0;

    let debit = typeof rawDebit === 'number' ? rawDebit : Number(String(rawDebit).replace(/[^\d.-]/g, ''));
    let credit = typeof rawCredit === 'number' ? rawCredit : Number(String(rawCredit).replace(/[^\d.-]/g, ''));

    if (isNaN(debit)) debit = 0;
    if (isNaN(credit)) credit = 0;

    if (debit === 0 && credit === 0) {
       skipped.push({ index: i, reason: 'Structural: Empty movement', _sourceFile: fileName, rawData: row });
       continue;
    }

    // In this Saudi format debits are stored as NEGATIVE amounts in the مدين
    // column and credits as positive in the دائن column. Direction is decided
    // by which column carries a value; the reported amount is its magnitude.
    const isDebit = debit !== 0;
    const amount = Math.abs(isDebit ? debit : credit);

    let periodYear = null;
    if (rawDate) {
      const yearMatch = String(rawDate).match(/\b(20\d{2})\b/);
      if (yearMatch) periodYear = parseInt(yearMatch[1], 10);
    }

    const record = {
      id: crypto.randomUUID(),
      moduleType: 'banks',
      _sourceFile: fileName,
      _originalRowIndex: i,
      Invoice_Number: '',
      Invoice_Date: rawDate,
      Period_Year: periodYear,
      Entity_Name: rawDesc.trim(),
      Raw_Entity: rawDesc.trim(),
      Total_Amount: amount,
      VAT_Amount: 0,
      Taxable_Amount: amount,
      NonTaxable_Amount: 0,
      Net_Amount: amount,
      Category: isOpening ? 'رصيد افتتاحي' : (isDebit ? 'سحب بنكي' : 'إيداع بنكي'),
      isOpeningBalance: isOpening,
      Confidence_Score: 100
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

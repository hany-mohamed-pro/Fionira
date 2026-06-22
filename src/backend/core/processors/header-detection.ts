// Shared, robust tabular-header detection for Excel imports.
//
// Real-world business exports (payroll sheets, Saudi bank statements) routinely
// violate the naive "header is row 0" / "header is the first text-heavy row in
// the first 20 rows" assumptions:
//   - Bank statements prepend an arbitrary-length metadata preamble (account
//     name, number, date range, totals) before the real column header.
//   - Payroll sheets use TWO-ROW merged headers: a top-level group row
//     (e.g. الراتب / الاستقطاعات / صافي الراتب) above a detail row
//     (e.g. الراتب الاساسي / بدل سكن / سلف / غياب). Reading only the top row
//     loses every detail column; reading only the bottom row loses the totals.
//   - Header text cells are sparse / non-contiguous because of merged cells:
//     XLSX emits the value only in the merged range's top-left cell, leaving
//     None gaps between labels.
//
// This helper scans the WHOLE sheet (not just the first 20 rows), uses a
// domain keyword anchor to avoid mistaking a title/metadata row for the header,
// and can merge consecutive header rows into a single per-column label map.

export interface HeaderDetectionResult {
  headerRowIndex: number;        // index of the first header row
  dataStartIndex: number;        // first data row (after the merged header block)
  headerRows: number[];          // every row index that contributed to the header
  colMap: Map<string, number>;   // merged, normalized label -> column index
}

export interface HeaderDetectionOptions {
  // At least one anchor must appear in a row for it to be accepted as the
  // header. This is what lets us skip a long metadata preamble safely: only the
  // real column header carries domain keywords like مدين/دائن or اسم/راتب.
  anchors: RegExp[];
  // How far down to look. Generous by default so an arbitrary preamble length
  // (the bank-statement case) is handled, while still bounded.
  maxScan?: number;
  // Minimum number of non-empty text cells for a row to be a header candidate.
  minStringCells?: number;
  // Merge consecutive label-only rows beneath the first header row into one
  // combined per-column label (the two-row payroll header case).
  mergeMultiRow?: boolean;
  // Safety bound on how many extra rows a multi-row header may absorb.
  maxMergeRows?: number;
}

function normalizeLabel(v: any): string {
  return String(v).trim().toLowerCase();
}

function countCells(row: any[]): { stringCount: number; numberCount: number } {
  let stringCount = 0;
  let numberCount = 0;
  for (const cell of row) {
    if (typeof cell === 'string' && cell.trim() !== '') stringCount++;
    else if (typeof cell === 'number') numberCount++;
  }
  return { stringCount, numberCount };
}

function rowHasAnchor(row: any[], anchors: RegExp[]): boolean {
  for (const cell of row) {
    if (typeof cell !== 'string' || cell.trim() === '') continue;
    const norm = normalizeLabel(cell);
    for (const a of anchors) {
      if (a.test(norm)) return true;
    }
  }
  return false;
}

export function detectTabularHeader(
  data: any[][],
  opts: HeaderDetectionOptions
): HeaderDetectionResult | null {
  const maxScan = Math.min(data.length, opts.maxScan ?? 200);
  const minStringCells = opts.minStringCells ?? 3;
  const maxMergeRows = opts.maxMergeRows ?? 3;

  let headerRowIndex = -1;
  for (let i = 0; i < maxScan; i++) {
    const row = (data[i] as any[]) || [];
    if (row.length === 0) continue;
    const { stringCount, numberCount } = countCells(row);
    // Structural candidate: text-heavy and text-dominant (handles a stray
    // numeric-looking header cell), and carrying a domain anchor keyword.
    if (stringCount >= minStringCells && stringCount > numberCount && rowHasAnchor(row, opts.anchors)) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) return null;

  const headerRows = [headerRowIndex];

  if (opts.mergeMultiRow) {
    for (let j = headerRowIndex + 1; j < data.length && headerRows.length <= maxMergeRows; j++) {
      const row = (data[j] as any[]) || [];
      const { stringCount, numberCount } = countCells(row);
      // A sub-header row is label-only (no numbers) but not blank. The first
      // row carrying numbers is data and ends the header block.
      if (numberCount === 0 && stringCount >= 1) {
        headerRows.push(j);
      } else {
        break;
      }
    }
  }

  const dataStartIndex = headerRows[headerRows.length - 1] + 1;

  // Build the merged label map. For each column, concatenate the text from
  // every header row (top group label + detail label) so that downstream
  // pattern matching can see BOTH levels (e.g. "الراتب الراتب الاساسي",
  // "صافي الراتب"). First occurrence of a label wins on collision.
  let width = 0;
  for (const r of headerRows) {
    const row = (data[r] as any[]) || [];
    if (row.length > width) width = row.length;
  }

  const colMap = new Map<string, number>();
  for (let c = 0; c < width; c++) {
    const parts: string[] = [];
    for (const r of headerRows) {
      const cell = (data[r] as any[])?.[c];
      if (typeof cell === 'string' && cell.trim() !== '') parts.push(cell.trim());
      else if (typeof cell === 'number') parts.push(String(cell));
    }
    if (parts.length === 0) continue;
    const label = normalizeLabel(parts.join(' '));
    if (!colMap.has(label)) colMap.set(label, c);
  }

  return { headerRowIndex, dataStartIndex, headerRows, colMap };
}

// Priority-scored column resolver: returns the column whose label matches the
// HIGHEST-priority pattern (earlier patterns win), with optional exclusions.
// This fixes the "greedy substring" bug where a bare /راتب/ would bind the net
// column to the basic-salary group header that merely contains the word راتب.
export function makeScoredGetCol(colMap: Map<string, number>) {
  return (patterns: RegExp[], excludePatterns: RegExp[] = []): number => {
    let bestMatch = -1;
    let highestScore = 0;
    for (const [key, val] of colMap.entries()) {
      let excluded = false;
      for (const ex of excludePatterns) {
        if (ex.test(key)) { excluded = true; break; }
      }
      if (excluded) continue;
      for (let pIdx = 0; pIdx < patterns.length; pIdx++) {
        if (patterns[pIdx].test(key)) {
          const score = (patterns.length - pIdx) * 10;
          if (score > highestScore) { highestScore = score; bestMatch = val; }
          break;
        }
      }
    }
    return bestMatch;
  };
}

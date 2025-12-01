export type ProgressiveValidationIssue = {
  row?: number;
  field?: string;
  code: string;
  message: string;
};

export type ProgressiveValidationResult = {
  valid: boolean;
  issues: ProgressiveValidationIssue[];
  headers?: string[];
  sampleRowCount: number;
};

const TEXT_DECODER = new TextDecoder('utf-8');

export async function sampleFileLines(file: File, maxBytes = 64 * 1024): Promise<string[]> {
  const slice = file.slice(0, Math.min(maxBytes, file.size));
  const arrayBuffer = await slice.arrayBuffer();
  const text = TEXT_DECODER.decode(arrayBuffer);
  // Normalize newlines and split
  return text.replace(/\r\n?/g, '\n').split('\n').filter(Boolean);
}

export type ParseCsvResult = {
  headers: string[];
  rows: string[][];
  parseIssues: ProgressiveValidationIssue[];
};

export function parseCsvSample(lines: string[], maxRows = 100): ParseCsvResult {
  if (lines.length === 0) return { headers: [], rows: [], parseIssues: [] };

  const parseIssues: ProgressiveValidationIssue[] = [];

  const parseLine = (line: string): { fields: string[]; hasUnclosedQuote: boolean } => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let isQuotedField = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (!inQuotes && char === '"' && current === '') {
        // Start of quoted field
        inQuotes = true;
        isQuotedField = true;
      } else if (inQuotes && char === '"') {
        if (line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(isQuotedField ? current : current.trim());
        current = '';
        isQuotedField = false;
      } else {
        current += char;
      }
    }
    result.push(isQuotedField ? current : current.trim());
    return { fields: result, hasUnclosedQuote: inQuotes };
  };

  const headerResult = parseLine(lines[0]);
  if (headerResult.hasUnclosedQuote) {
    parseIssues.push({
      row: 1,
      code: 'unclosed_quote',
      message: 'Row 1 (header) has an unclosed quote',
    });
  }

  const rows: string[][] = [];
  const dataLines = lines.slice(1, 1 + maxRows);
  dataLines.forEach((line, index) => {
    const result = parseLine(line);
    rows.push(result.fields);
    if (result.hasUnclosedQuote) {
      const rowNum = index + 2; // 1-based, accounting for header
      parseIssues.push({
        row: rowNum,
        code: 'unclosed_quote',
        message: `Row ${rowNum} has an unclosed quote`,
      });
    }
  });

  return { headers: headerResult.fields, rows, parseIssues };
}

export function validateCsvStructure(
  headers: string[],
  rows: string[][]
): ProgressiveValidationIssue[] {
  const issues: ProgressiveValidationIssue[] = [];

  if (headers.length === 0) {
    issues.push({ code: 'missing_headers', message: 'Missing header row' });
    return issues;
  }

  // Duplicate headers
  const seen = new Set<string>();
  headers.forEach((h) => {
    const key = h.toLowerCase();
    if (seen.has(key)) {
      issues.push({ code: 'duplicate_header', field: h, message: `Duplicate header: ${h}` });
    }
    seen.add(key);
  });

  // Row length mismatches
  rows.forEach((r, i) => {
    if (r.length !== headers.length) {
      issues.push({
        row: i + 1,
        code: 'column_mismatch',
        message: `Row ${i + 1} has ${r.length} columns; expected ${headers.length}`,
      });
    }
  });

  return issues;
}

export async function progressiveValidateCsv(
  file: File,
  sampleRows = 100
): Promise<ProgressiveValidationResult> {
  const lines = await sampleFileLines(file);
  const { headers, rows, parseIssues } = parseCsvSample(lines, sampleRows);
  const structureIssues = validateCsvStructure(headers, rows);
  const issues = [...parseIssues, ...structureIssues];
  return {
    valid: issues.length === 0,
    issues,
    headers,
    sampleRowCount: rows.length,
  };
}

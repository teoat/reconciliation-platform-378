export type ProgressiveValidationIssue = {
  row?: number
  field?: string
  code: string
  message: string
}

export type ProgressiveValidationResult = {
  valid: boolean
  issues: ProgressiveValidationIssue[]
  headers?: string[]
  sampleRowCount: number
}

const TEXT_DECODER = new TextDecoder('utf-8')

export async function sampleFileLines(file: File, maxBytes = 64 * 1024): Promise<string[]> {
  const slice = file.slice(0, Math.min(maxBytes, file.size))
  const arrayBuffer = await slice.arrayBuffer()
  const text = TEXT_DECODER.decode(arrayBuffer)
  // Normalize newlines and split
  return text.replace(/\r\n?/g, '\n').split('\n').filter(Boolean)
}

export function parseCsvSample(lines: string[], maxRows = 100): { headers: string[]; rows: string[][] } {
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.trim())
  const rows = lines.slice(1, 1 + maxRows).map(l => l.split(',').map(v => v.trim()))
  return { headers, rows }
}

export function validateCsvStructure(headers: string[], rows: string[][]): ProgressiveValidationIssue[] {
  const issues: ProgressiveValidationIssue[] = []

  if (headers.length === 0) {
    issues.push({ code: 'missing_headers', message: 'Missing header row' })
    return issues
  }

  // Duplicate headers
  const seen = new Set<string>()
  headers.forEach(h => {
    const key = h.toLowerCase()
    if (seen.has(key)) {
      issues.push({ code: 'duplicate_header', field: h, message: `Duplicate header: ${h}` })
    }
    seen.add(key)
  })

  // Row length mismatches
  rows.forEach((r, i) => {
    if (r.length !== headers.length) {
      issues.push({ row: i + 1, code: 'column_mismatch', message: `Row ${i + 1} has ${r.length} columns; expected ${headers.length}` })
    }
  })

  return issues
}

export async function progressiveValidateCsv(file: File, sampleRows = 100): Promise<ProgressiveValidationResult> {
  const lines = await sampleFileLines(file)
  const { headers, rows } = parseCsvSample(lines, sampleRows)
  const issues = validateCsvStructure(headers, rows)
  return {
    valid: issues.length === 0,
    issues,
    headers,
    sampleRowCount: rows.length
  }
}



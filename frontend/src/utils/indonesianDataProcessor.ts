'use client'

// Indonesian Data Processing Utilities
export interface ProcessedExpenseRecord {
  id: string
  date: string
  amount: number
  debitAmount: number
  creditAmount: number
  description: string
  recipient: string
  category1: string
  category2: string
  project: boolean
  comment: string
  timeline: string
  priority: number
  account: string
  // Enhanced fields for matching
  normalizedDescription: string
  normalizedRecipient: string
  amountHash: string
  dateHash: string
  originalRecord: Record<string, unknown>
}

export interface ProcessedBankRecord {
  id: string
  date: string
  amount: number
  debitAmount: number
  creditAmount: number
  description: string
  recipient: string
  category1: string
  category2: string
  project: boolean
  comment: string
  timeline: string
  priority: number
  account: string
  city: string
  accountNumber: string
  // Enhanced fields for matching
  normalizedDescription: string
  normalizedRecipient: string
  amountHash: string
  dateHash: string
  originalRecord: Record<string, unknown>
}

export interface IndonesianMatchingResult {
  matched: boolean
  confidence: number
  details: {
    amountScore: number
    dateScore: number
    descriptionScore: number
    recipientScore: number
    totalScore: number
  }
  reason: string
  expenseId: string
  bankId: string
}

export class IndonesianDataProcessor {
  private static months: Record<string, string> = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'Mei': '05', 'Jun': '06', 'Jul': '07', 'Agu': '08',
    'Sep': '09', 'Okt': '10', 'Nov': '11', 'Des': '12'
  }

  // Parse Indonesian amount format (e.g., "3,500,000" -> 3500000)
  static parseIndonesianAmount(amountStr: string): number {
    if (!amountStr || amountStr === '') return 0
    
    // Remove commas and convert to number
    const cleanAmount = amountStr.toString().replace(/,/g, '').replace(/"/g, '')
    const parsed = parseFloat(cleanAmount)
    
    return isNaN(parsed) ? 0 : parsed
  }

  // Parse Indonesian date format (e.g., "1 Jan 2020" -> "2020-01-01")
  static parseIndonesianDate(dateStr: string): string {
    if (!dateStr) return ''
    
    try {
      const parts = dateStr.trim().split(' ')
      if (parts.length !== 3) return ''
      
      const day = parts[0].padStart(2, '0')
      const month = this.months[parts[1]] || '01'
      const year = parts[2]
      
      return `${year}-${month}-${day}`
    } catch (error) {
      logger.error('Error parsing Indonesian date', { category: 'data-processing', component: 'indonesianDataProcessor', dateStr, error });
      return ''
    }
  }

  // Normalize Indonesian text for matching
  static normalizeIndonesianText(text: string): string {
    if (!text) return ''
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim()
  }

  // Generate hash for amount matching
  static generateAmountHash(amount: number): string {
    return `AMT_${Math.round(amount)}`
  }

  // Generate hash for date matching
  static generateDateHash(date: string): string {
    return `DATE_${date}`
  }

  // Calculate Levenshtein distance for fuzzy matching
  static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        )
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  // Calculate fuzzy match score for Indonesian text
  static fuzzyMatchIndonesian(text1: string, text2: string): number {
    const normalized1 = this.normalizeIndonesianText(text1)
    const normalized2 = this.normalizeIndonesianText(text2)
    
    if (normalized1 === normalized2) return 100
    if (!normalized1 || !normalized2) return 0
    
    const distance = this.levenshteinDistance(normalized1, normalized2)
    const maxLength = Math.max(normalized1.length, normalized2.length)
    
    return maxLength === 0 ? 100 : Math.round(((maxLength - distance) / maxLength) * 100)
  }

  // Calculate date proximity score
  static calculateDateScore(date1: string, date2: string, toleranceDays: number = 1): number {
    if (!date1 || !date2) return 0
    
    try {
      const d1 = new Date(date1)
      const d2 = new Date(date2)
      
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0
      
      const diffDays = Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24)
      
      if (diffDays <= toleranceDays) {
        return Math.max(0, 100 - (diffDays / toleranceDays) * 50)
      }
      
      return 0
    } catch (error) {
      return 0
    }
  }

  // Process expenses data
  static processExpensesData(rawData: Record<string, unknown>[]): ProcessedExpenseRecord[] {
    return rawData.map((record, index) => {
      const amount = this.parseIndonesianAmount(record['Aldi Awal Transaksi'] || record['Aldi Awal Debit'] || '0')
      const debitAmount = this.parseIndonesianAmount(record['Aldi Awal Debit'] || '0')
      const creditAmount = this.parseIndonesianAmount(record['Aldi Awal Kredit'] || '0')
      const date = this.parseIndonesianDate(record.tanggal || '')
      
      return {
        id: `EXP-${record.No || index + 1}`,
        date,
        amount,
        debitAmount,
        creditAmount,
        description: record.Uraian || '',
        recipient: record.Penerima || '',
        category1: record.Kode1 || '',
        category2: record.Kode2 || '',
        project: record.Proyek === 'TRUE' || record.Proyek === true,
        comment: record.Comment || '',
        timeline: record.Timeline || '',
        priority: parseInt(record.P) || 0,
        account: record.Account || '',
        // Enhanced fields for matching
        normalizedDescription: this.normalizeIndonesianText(record.Uraian || ''),
        normalizedRecipient: this.normalizeIndonesianText(record.Penerima || ''),
        amountHash: this.generateAmountHash(amount),
        dateHash: this.generateDateHash(date),
        originalRecord: record
      }
    })
  }

  // Process bank statements data
  static processBankData(rawData: Record<string, unknown>[]): ProcessedBankRecord[] {
    return rawData.map((record, index) => {
      const amount = this.parseIndonesianAmount(record.Transaksi || record.Debit || record.Kredit || '0')
      const debitAmount = this.parseIndonesianAmount(record.Debit || '0')
      const creditAmount = this.parseIndonesianAmount(record.Kredit || '0')
      const date = this.parseIndonesianDate(record.Tanggal || '')
      
      return {
        id: `BANK-${record.No || index + 1}`,
        date,
        amount,
        debitAmount,
        creditAmount,
        description: record.Uraian || '',
        recipient: record.Kode2 || '',
        category1: record.Kode1 || '',
        category2: record.Kode2 || '',
        project: record.Proyek === 'TRUE' || record.Proyek === true,
        comment: record.Comment || '',
        timeline: record.Timeline || '',
        priority: parseInt(record.P) || 0,
        account: record.Account || '',
        city: record.CP || '',
        accountNumber: record.Rek || '',
        // Enhanced fields for matching
        normalizedDescription: this.normalizeIndonesianText(record.Uraian || ''),
        normalizedRecipient: this.normalizeIndonesianText(record.Kode2 || ''),
        amountHash: this.generateAmountHash(amount),
        dateHash: this.generateDateHash(date),
        originalRecord: record
      }
    })
  }

  // Match Indonesian records with enhanced scoring
  static matchIndonesianRecords(
    expense: ProcessedExpenseRecord, 
    bank: ProcessedBankRecord,
    weights: {
      amount: number
      date: number
      description: number
      recipient: number
    } = {
      amount: 0.4,
      date: 0.3,
      description: 0.2,
      recipient: 0.1
    }
  ): IndonesianMatchingResult {
    // Amount matching (exact match gets 100, close match gets partial score)
    const amountScore = expense.amount === bank.amount ? 100 : 
      Math.abs(expense.amount - bank.amount) <= 1000 ? 80 : 0
    
    // Date matching with 1-day tolerance
    const dateScore = this.calculateDateScore(expense.date, bank.date, 1)
    
    // Description fuzzy matching
    const descriptionScore = this.fuzzyMatchIndonesian(expense.description, bank.description)
    
    // Recipient fuzzy matching
    const recipientScore = this.fuzzyMatchIndonesian(expense.recipient, bank.recipient)
    
    // Calculate weighted total score
    const totalScore = (
      amountScore * weights.amount +
      dateScore * weights.date +
      descriptionScore * weights.description +
      recipientScore * weights.recipient
    )
    
    return {
      matched: totalScore >= 80,
      confidence: Math.round(totalScore),
      details: {
        amountScore,
        dateScore,
        descriptionScore,
        recipientScore,
        totalScore
      },
      reason: `Indonesian matching: ${totalScore.toFixed(1)}% confidence (Amount: ${amountScore}%, Date: ${dateScore}%, Description: ${descriptionScore}%, Recipient: ${recipientScore}%)`,
      expenseId: expense.id,
      bankId: bank.id
    }
  }

  // Batch match all records
  static batchMatchRecords(
    expenses: ProcessedExpenseRecord[], 
    bankRecords: ProcessedBankRecord[]
  ): Array<{
    expense: ProcessedExpenseRecord
    bank: ProcessedBankRecord
    match: IndonesianMatchingResult
  }> {
    const matches: Array<{
      expense: ProcessedExpenseRecord
      bank: ProcessedBankRecord
      match: IndonesianMatchingResult
    }> = []
    
    const usedBankIds = new Set<string>()
    
    for (const expense of expenses) {
      let bestMatch: {
        bank: ProcessedBankRecord
        match: IndonesianMatchingResult
      } | null = null
      
      for (const bank of bankRecords) {
        if (usedBankIds.has(bank.id)) continue
        
        const match = this.matchIndonesianRecords(expense, bank)
        
        if (match.matched && (!bestMatch || match.confidence > bestMatch.match.confidence)) {
          bestMatch = { bank, match }
        }
      }
      
      if (bestMatch) {
        matches.push({
          expense,
          bank: bestMatch.bank,
          match: bestMatch.match
        })
        usedBankIds.add(bestMatch.bank.id)
      }
    }
    
    return matches
  }

  // Generate reconciliation summary
  static generateReconciliationSummary(
    expenses: ProcessedExpenseRecord[],
    bankRecords: ProcessedBankRecord[],
    matches: Array<{
      expense: ProcessedExpenseRecord
      bank: ProcessedBankRecord
      match: IndonesianMatchingResult
    }>
  ) {
    const totalExpenses = expenses.length
    const totalBankRecords = bankRecords.length
    const matchedCount = matches.length
    const unmatchedExpenses = totalExpenses - matchedCount
    const unmatchedBankRecords = totalBankRecords - matchedCount
    
    const totalExpenseAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const totalBankAmount = bankRecords.reduce((sum, bank) => sum + bank.amount, 0)
    const matchedAmount = matches.reduce((sum, match) => sum + match.expense.amount, 0)
    
    const discrepancyAmount = Math.abs(totalExpenseAmount - totalBankAmount)
    
    return {
      summary: {
        totalExpenses,
        totalBankRecords,
        matchedRecords: matchedCount,
        unmatchedExpenses,
        unmatchedBankRecords,
        matchRate: totalExpenses > 0 ? (matchedCount / totalExpenses) * 100 : 0,
        totalExpenseAmount,
        totalBankAmount,
        matchedAmount,
        discrepancyAmount
      },
      quality: {
        averageConfidence: matches.length > 0 ? 
          matches.reduce((sum, match) => sum + match.match.confidence, 0) / matches.length : 0,
        highConfidenceMatches: matches.filter(m => m.match.confidence >= 90).length,
        mediumConfidenceMatches: matches.filter(m => m.match.confidence >= 70 && m.match.confidence < 90).length,
        lowConfidenceMatches: matches.filter(m => m.match.confidence < 70).length
      },
      categories: {
        expenses: this.analyzeCategories(expenses),
        bankRecords: this.analyzeCategories(bankRecords)
      }
    }
  }

  // Analyze categories
  private static analyzeCategories(records: ProcessedExpenseRecord[] | ProcessedBankRecord[]) {
    const categoryAnalysis: Record<string, { count: number; totalAmount: number }> = {}
    
    records.forEach(record => {
      const category = `${record.category1} - ${record.category2}`
      if (!categoryAnalysis[category]) {
        categoryAnalysis[category] = { count: 0, totalAmount: 0 }
      }
      categoryAnalysis[category].count++
      categoryAnalysis[category].totalAmount += record.amount
    })
    
    return categoryAnalysis
  }
}

// Export utility functions for easy use
export const {
  parseIndonesianAmount,
  parseIndonesianDate,
  normalizeIndonesianText,
  fuzzyMatchIndonesian,
  calculateDateScore,
  processExpensesData,
  processBankData,
  matchIndonesianRecords,
  batchMatchRecords,
  generateReconciliationSummary
} = IndonesianDataProcessor

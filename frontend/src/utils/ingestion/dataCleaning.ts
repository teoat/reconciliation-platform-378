// Data cleaning and standardization utilities
import type { DataRow, UploadedFile } from '@/types/ingestion/index';

/**
 * Standardizes date strings to ISO format
 */
const standardizeDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    return date.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
};

/**
 * Cleans and standardizes data rows
 */
export const cleanAndStandardizeData = (
  data: DataRow[],
  _fileType: UploadedFile['fileType']
): DataRow[] => {
  return data.map((record, index) => {
    const cleanedRecord = { ...record };

    // Clean and standardize each field
    Object.keys(cleanedRecord).forEach((key) => {
      const value = cleanedRecord[key];

      if (typeof value === 'string') {
        // Remove extra whitespace
        cleanedRecord[key] = value.trim();

        // Standardize currency fields
        if (
          key.toLowerCase().includes('amount') ||
          key.toLowerCase().includes('price') ||
          key.toLowerCase().includes('cost')
        ) {
          cleanedRecord[key] = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
        }

        // Standardize date fields
        if (key.toLowerCase().includes('date')) {
          cleanedRecord[key] = standardizeDate(value);
        }

        // Standardize text fields
        if (key.toLowerCase().includes('description') || key.toLowerCase().includes('name')) {
          cleanedRecord[key] = value.toLowerCase().replace(/\s+/g, ' ');
        }
      }
    });

    return { ...cleanedRecord, id: `REC-${String(index + 1).padStart(6, '0')}` };
  });
};

/**
 * Generates sample data for testing/demo purposes
 */
export const generateSampleData = (
  fileType: UploadedFile['fileType'],
  recordCount: number
): DataRow[] => {
  if (fileType === 'expenses') {
    return Array.from({ length: recordCount }, (_, i) => ({
      id: `EXP-${String(i + 1).padStart(4, '0')}`,
      date: new Date(2023, 11, Math.floor(Math.random() * 30) + 1).toISOString().split('T')[0],
      description: [
        'Office Supplies',
        'Travel Expenses',
        'Software License',
        'Marketing',
        'Utilities',
      ][Math.floor(Math.random() * 5)],
      category: ['Administrative', 'Travel', 'Technology', 'Marketing', 'Operations'][
        Math.floor(Math.random() * 5)
      ],
      amount: (Math.random() * 5000 + 100).toFixed(2),
      vendor: ['Vendor A', 'Vendor B', 'Vendor C', 'Vendor D'][Math.floor(Math.random() * 4)],
      reference: `REF-${Math.floor(Math.random() * 10000)}`,
      status: ['Approved', 'Pending', 'Rejected'][Math.floor(Math.random() * 3)],
    }));
  } else if (fileType === 'bank_statement') {
    return Array.from({ length: recordCount }, (_, i) => ({
      id: `TXN-${String(i + 1).padStart(6, '0')}`,
      date: new Date(2023, 11, Math.floor(Math.random() * 30) + 1).toISOString().split('T')[0],
      description: ['Payment Received', 'Payment Sent', 'Transfer', 'Fee', 'Interest'][
        Math.floor(Math.random() * 5)
      ],
      type: ['Credit', 'Debit'][Math.floor(Math.random() * 2)],
      amount: (Math.random() * 10000 + 50).toFixed(2),
      balance: (Math.random() * 50000 + 10000).toFixed(2),
      reference: `TXN-${Math.floor(Math.random() * 100000)}`,
      account: `ACC-${Math.floor(Math.random() * 1000)}`,
    }));
  } else {
    return Array.from({ length: recordCount }, (_, i) => ({
      id: `REC-${String(i + 1).padStart(4, '0')}`,
      field1: `Value ${i + 1}`,
      field2: Math.floor(Math.random() * 1000),
      field3: ['Option A', 'Option B', 'Option C'][Math.floor(Math.random() * 3)],
      field4: new Date().toISOString().split('T')[0],
    }));
  }
};


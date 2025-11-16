import type { DataRow, ColumnInfo, UploadedFile } from '../../types/ingestion';

/**
 * Infers column types from data
 */
export function inferColumnTypes(data: DataRow[]): ColumnInfo[] {
  if (!data.length) return [];

  const columns = Object.keys(data[0]);

  return columns.map((columnName) => {
    const values = data
      .map((row) => row[columnName])
      .filter((val) => val !== null && val !== undefined);
    const sampleValues = values.slice(0, 5);

    let type: ColumnInfo['type'] = 'string';
    let statistics: ColumnInfo['statistics'] = {
      count: values.length,
      nullCount: data.length - values.length,
    };

    // Type inference logic
    if (values.every((val) => !isNaN(Number(val)) && val !== '')) {
      type = 'number';
      const nums = values.map(Number);
      statistics = {
        ...statistics,
        min: Math.min(...nums),
        max: Math.max(...nums),
        avg: nums.reduce((a, b) => a + b, 0) / nums.length,
      };
    } else if (values.every((val) => typeof val === 'string' && !isNaN(Date.parse(val)))) {
      type = 'date';
    } else if (
      columnName.toLowerCase().includes('amount') ||
      columnName.toLowerCase().includes('price')
    ) {
      type = 'currency';
    } else if (
      values.every((val) => typeof val === 'boolean' || val === 'true' || val === 'false')
    ) {
      type = 'boolean';
    }

    return {
      name: columnName,
      type,
      nullable: statistics.nullCount > 0,
      unique: new Set(values).size === values.length,
      sampleValues,
      statistics,
    };
  });
}

/**
 * Detects file type based on filename and MIME type
 */
export function detectFileType(fileName: string, mimeType: string): UploadedFile['fileType'] {
  const name = fileName.toLowerCase();
  const mime = mimeType.toLowerCase();

  // Financial data
  if (name.includes('expense') || name.includes('journal') || name.includes('ledger')) {
    return 'expenses';
  }
  if (name.includes('bank') || name.includes('statement') || name.includes('transaction')) {
    return 'bank_statement';
  }

  // Chat histories
  if (
    name.includes('chat') ||
    name.includes('conversation') ||
    name.includes('messages') ||
    name.includes('discord') ||
    name.includes('slack') ||
    name.includes('whatsapp') ||
    name.includes('telegram') ||
    name.includes('teams')
  ) {
    return 'chat_history';
  }

  // Contracts and legal documents
  if (
    name.includes('contract') ||
    name.includes('agreement') ||
    name.includes('terms') ||
    name.includes('legal') ||
    name.includes('policy') ||
    name.includes('license')
  ) {
    return 'contract';
  }

  // Document types
  if (mime.includes('pdf') || name.endsWith('.pdf')) {
    return 'pdf_document';
  }

  // Image types
  if (mime.includes('image/') || /\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i.test(name)) {
    return 'image';
  }

  // Video types
  if (mime.includes('video/') || /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i.test(name)) {
    return 'video';
  }

  // Audio types
  if (mime.includes('audio/') || /\.(mp3|wav|flac|aac|ogg|m4a)$/i.test(name)) {
    return 'audio';
  }

  return 'other';
}

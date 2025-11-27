/**
 * Format Constants
 * 
 * File types, date formats, and currency formats
 */

export const FILE_TYPES = {
  // Document Types
  DOCUMENTS: {
    PDF: 'application/pdf',
    DOC: 'application/msword',
    DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    XLS: 'application/vnd.ms-excel',
    XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    PPT: 'application/vnd.ms-powerpoint',
    PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    TXT: 'text/plain',
    RTF: 'application/rtf',
  },

  // Image Types
  IMAGES: {
    JPEG: 'image/jpeg',
    JPG: 'image/jpeg',
    PNG: 'image/png',
    GIF: 'image/gif',
    BMP: 'image/bmp',
    SVG: 'image/svg+xml',
    WEBP: 'image/webp',
    TIFF: 'image/tiff',
  },

  // Data Types
  DATA: {
    CSV: 'text/csv',
    JSON: 'application/json',
    XML: 'application/xml',
    YAML: 'application/x-yaml',
    ZIP: 'application/zip',
    RAR: 'application/x-rar-compressed',
    '7Z': 'application/x-7z-compressed',
  },

  // Video Types
  VIDEOS: {
    MP4: 'video/mp4',
    AVI: 'video/x-msvideo',
    MOV: 'video/quicktime',
    WMV: 'video/x-ms-wmv',
    FLV: 'video/x-flv',
    WEBM: 'video/webm',
  },

  // Audio Types
  AUDIO: {
    MP3: 'audio/mpeg',
    WAV: 'audio/wav',
    OGG: 'audio/ogg',
    AAC: 'audio/aac',
    FLAC: 'audio/flac',
  },
} as const;

export const DATE_FORMATS = {
  // Display Formats
  DISPLAY: {
    SHORT: 'DD/MM/YYYY',
    LONG: 'DD MMMM YYYY',
    TIME: 'HH:mm',
    DATETIME: 'DD/MM/YYYY HH:mm',
    DATETIME_LONG: 'DD MMMM YYYY HH:mm',
    ISO: 'YYYY-MM-DD',
    ISO_DATETIME: 'YYYY-MM-DDTHH:mm:ss',
    ISO_DATETIME_Z: 'YYYY-MM-DDTHH:mm:ssZ',
  },

  // Input Formats
  INPUT: {
    DATE: 'YYYY-MM-DD',
    TIME: 'HH:mm',
    DATETIME: 'YYYY-MM-DDTHH:mm',
    DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm',
  },

  // File Formats
  FILE: {
    TIMESTAMP: 'YYYYMMDD_HHmmss',
    DATE: 'YYYY-MM-DD',
    DATETIME: 'YYYY-MM-DD_HH-mm-ss',
  },

  // Locale Specific
  LOCALE: {
    ID: 'DD/MM/YYYY',
    US: 'MM/DD/YYYY',
    EU: 'DD/MM/YYYY',
    ISO: 'YYYY-MM-DD',
  },
} as const;

export const CURRENCY_FORMATS = {
  IDR: {
    SYMBOL: 'Rp',
    CODE: 'IDR',
    DECIMAL_PLACES: 0,
    THOUSAND_SEPARATOR: '.',
    DECIMAL_SEPARATOR: ',',
    FORMAT: 'Rp #,##0',
    NEGATIVE_FORMAT: '-Rp #,##0',
  },
  USD: {
    SYMBOL: '$',
    CODE: 'USD',
    DECIMAL_PLACES: 2,
    THOUSAND_SEPARATOR: ',',
    DECIMAL_SEPARATOR: '.',
    FORMAT: '$#,##0.00',
    NEGATIVE_FORMAT: '-$#,##0.00',
  },
  EUR: {
    SYMBOL: '€',
    CODE: 'EUR',
    DECIMAL_PLACES: 2,
    THOUSAND_SEPARATOR: '.',
    DECIMAL_SEPARATOR: ',',
    FORMAT: '€#.##0,00',
    NEGATIVE_FORMAT: '-€#.##0,00',
  },
  GBP: {
    SYMBOL: '£',
    CODE: 'GBP',
    DECIMAL_PLACES: 2,
    THOUSAND_SEPARATOR: ',',
    DECIMAL_SEPARATOR: '.',
    FORMAT: '£#,##0.00',
    NEGATIVE_FORMAT: '-£#,##0.00',
  },
} as const;


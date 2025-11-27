// File type detection utilities
import type { UploadedFile } from '../../types/ingestion';

/**
 * Detects file type based on filename and MIME type
 */
export const detectFileType = (fileName: string, mimeType: string): UploadedFile['fileType'] => {
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
};

/**
 * Gets file extension from filename
 */
export const getFileExtension = (fileName: string): string => {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

/**
 * Checks if file type is supported
 */
export const isSupportedFileType = (fileType: UploadedFile['fileType']): boolean => {
  return fileType !== 'other';
};

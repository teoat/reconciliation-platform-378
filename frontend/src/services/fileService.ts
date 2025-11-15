// Minimal FileService implementation to satisfy build requirements
// Note: Full file service functionality is implemented in the backend

// Factory functions for creating objects
export const createFileData = (
  id = '',
  fileName = '',
  fileSize = 0,
  mimeType = '',
  checksum = '',
  uploadedBy = '',
  uploadedAt = new Date(),
  version = 1,
  status = 'uploading',
  metadata = {},
  data = {}
) => ({
  id,
  fileName,
  fileSize,
  mimeType,
  checksum,
  uploadedBy,
  uploadedAt,
  version,
  status,
  metadata: {
    description: '',
    tags: [],
    projectId: '',
    isActive: true,
    isDeleted: false,
    ...metadata,
  },
  data: {
    url: '',
    blob: null,
    content: '',
    ...data,
  },
});

export const createUploadSession = (
  id = '',
  fileId = '',
  fileName = '',
  fileSize = 0,
  progress = 0,
  status = 'pending'
) => ({
  id,
  fileId,
  fileName,
  fileSize,
  progress,
  status,
});

export class FileService {
  uploadSessions = new Map();

  constructor() {
    // Minimal constructor
  }

  startUpload(file) {
    const session = createUploadSession(
      Math.random().toString(36).substr(2, 9),
      Math.random().toString(36).substr(2, 9),
      file.name,
      file.size,
      0,
      'pending'
    );
    this.uploadSessions.set(session.id, session);
    return session;
  }

  cancelUpload(sessionId) {
    this.uploadSessions.delete(sessionId);
  }

  // Stub methods to satisfy interface
  getAll() {
    return [];
  }
}

// Export singleton instance
export const fileService = new FileService();

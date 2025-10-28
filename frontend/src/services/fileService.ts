// Minimal FileService implementation to satisfy build requirements
// Note: Full file service functionality is implemented in the backend

export interface FileData {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  checksum: string
  uploadedBy: string
  uploadedAt: Date
  version: number
  status: 'uploading' | 'completed' | 'failed' | 'processing'
  metadata: {
    description?: string
    tags?: string[]
    projectId?: string
    isActive: boolean
    isDeleted: boolean
  }
  data: {
    url?: string
    blob?: Blob
    content?: string
  }
}

export interface UploadSession {
  id: string
  fileId: string
  fileName: string
  fileSize: number
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'failed'
}

export class FileService {
  private uploadSessions: Map<string, UploadSession> = new Map()

  constructor() {
    // Minimal constructor
  }

  startUpload(file: File): UploadSession {
    const session: UploadSession = {
      id: Math.random().toString(36).substr(2, 9),
      fileId: Math.random().toString(36).substr(2, 9),
      fileName: file.name,
      fileSize: file.size,
      progress: 0,
      status: 'pending'
    }
    this.uploadSessions.set(session.id, session)
    return session
  }

  cancelUpload(sessionId: string): void {
    this.uploadSessions.delete(sessionId)
  }

  // Stub methods to satisfy interface
  getAll(): FileData[] {
    return []
  }
}

// Export singleton instance
export const fileService = new FileService()
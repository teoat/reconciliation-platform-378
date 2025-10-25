// Consolidated File Service
// Combines file upload, versioning, processing, and management functionality

import { BaseService, PersistenceService } from './BaseService'

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

export interface UploadChunk {
  id: string
  index: number
  start: number
  end: number
  size: number
  data: Blob
  checksum?: string
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'retrying'
  attempts: number
  lastAttempt?: Date
  error?: string
}

export interface UploadSession {
  id: string
  fileId: string
  fileName: string
  fileSize: number
  totalChunks: number
  uploadedChunks: number
  failedChunks: number
  progress: number // 0-100
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'failed' | 'cancelled'
  chunks: Map<number, UploadChunk>
  startTime: Date
  endTime?: Date
  metadata: {
    mimeType: string
    lastModified: number
    checksum: string
  }
}

export interface FileConfig {
  upload: {
    chunkSize: number
    maxConcurrentChunks: number
    retryAttempts: number
    retryDelay: number
    enableResume: boolean
    enableCompression: boolean
  }
  versioning: {
    enabled: boolean
    maxVersions: number
    autoCleanup: boolean
  }
  processing: {
    enabled: boolean
    maxFileSize: number
    allowedTypes: string[]
  }
}

export class FileService extends PersistenceService<FileData> {
  private uploadSessions: Map<string, UploadSession> = new Map()
  private config: FileConfig
  private uploadTimers: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    super('file_data', {
      enabled: true,
      persistence: true,
      events: true,
      caching: true
    })

    this.config = {
      upload: {
        chunkSize: 1024 * 1024, // 1MB chunks
        maxConcurrentChunks: 3,
        retryAttempts: 3,
        retryDelay: 1000,
        enableResume: true,
        enableCompression: false
      },
      versioning: {
        enabled: true,
        maxVersions: 10,
        autoCleanup: true
      },
      processing: {
        enabled: true,
        maxFileSize: 100 * 1024 * 1024, // 100MB
        allowedTypes: ['text/csv', 'application/vnd.ms-excel', 'application/json', 'text/xml']
      }
    }
  }

  // File Upload Management
  public async startUpload(file: File, metadata: Partial<FileData['metadata']> = {}): Promise<UploadSession> {
    const fileId = this.generateId()
    const sessionId = this.generateId()
    
    const totalChunks = Math.ceil(file.size / this.config.upload.chunkSize)
    const chunks = new Map<number, UploadChunk>()

    // Create chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.config.upload.chunkSize
      const end = Math.min(start + this.config.upload.chunkSize, file.size)
      const chunkData = file.slice(start, end)

      chunks.set(i, {
        id: this.generateId(),
        index: i,
        start,
        end,
        size: end - start,
        data: chunkData,
        status: 'pending',
        attempts: 0
      })
    }

    const session: UploadSession = {
      id: sessionId,
      fileId,
      fileName: file.name,
      fileSize: file.size,
      totalChunks,
      uploadedChunks: 0,
      failedChunks: 0,
      progress: 0,
      status: 'pending',
      chunks,
      startTime: new Date(),
      metadata: {
        mimeType: file.type,
        lastModified: file.lastModified,
        checksum: await this.calculateChecksum(file)
      }
    }

    this.uploadSessions.set(sessionId, session)
    this.emit('uploadStarted', { session })

    // Start uploading chunks
    this.processChunks(sessionId)
    
    return session
  }

  public pauseUpload(sessionId: string): boolean {
    const session = this.uploadSessions.get(sessionId)
    if (!session || session.status !== 'uploading') return false

    session.status = 'paused'
    this.uploadSessions.set(sessionId, session)
    
    // Clear any active timers
    this.clearTimer(`upload_${sessionId}`)
    
    this.emit('uploadPaused', { session })
    return true
  }

  public resumeUpload(sessionId: string): boolean {
    const session = this.uploadSessions.get(sessionId)
    if (!session || session.status !== 'paused') return false

    session.status = 'uploading'
    this.uploadSessions.set(sessionId, session)
    
    // Resume processing chunks
    this.processChunks(sessionId)
    
    this.emit('uploadResumed', { session })
    return true
  }

  public cancelUpload(sessionId: string): boolean {
    const session = this.uploadSessions.get(sessionId)
    if (!session) return false

    session.status = 'cancelled'
    this.uploadSessions.set(sessionId, session)
    
    // Clear any active timers
    this.clearTimer(`upload_${sessionId}`)
    
    this.emit('uploadCancelled', { session })
    return true
  }

  public getUploadSession(sessionId: string): UploadSession | undefined {
    return this.uploadSessions.get(sessionId)
  }

  // File Versioning
  public async createFileVersion(fileId: string, file: File, metadata: Partial<FileData['metadata']> = {}): Promise<string> {
    const version = this.getNextVersion(fileId)
    const fileData: FileData = {
      id: fileId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      checksum: await this.calculateChecksum(file),
      uploadedBy: 'current_user', // This should come from auth context
      uploadedAt: new Date(),
      version,
      status: 'completed',
      metadata: {
        isActive: true,
        isDeleted: false,
        ...metadata
      },
      data: {
        blob: file
      }
    }

    this.set(fileId, fileData)
    this.cleanupOldVersions(fileId)
    
    this.emit('fileVersionCreated', { fileData })
    return fileId
  }

  public getFileVersions(fileId: string): FileData[] {
    return this.getAll().filter(file => file.id === fileId)
  }

  public getLatestVersion(fileId: string): FileData | undefined {
    const versions = this.getFileVersions(fileId)
    return versions.sort((a, b) => b.version - a.version)[0]
  }

  public restoreVersion(fileId: string, version: number): FileData | undefined {
    const versions = this.getFileVersions(fileId)
    return versions.find(file => file.version === version)
  }

  // File Processing
  public processFile(fileData: FileData): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.config.processing.enabled) {
        resolve(fileData)
        return
      }

      // Validate file type
      if (!this.config.processing.allowedTypes.includes(fileData.mimeType)) {
        reject(new Error(`File type ${fileData.mimeType} not allowed`))
        return
      }

      // Validate file size
      if (fileData.fileSize > this.config.processing.maxFileSize) {
        reject(new Error(`File size ${fileData.fileSize} exceeds maximum ${this.config.processing.maxFileSize}`))
        return
      }

      // Process based on file type
      this.processFileByType(fileData)
        .then(resolve)
        .catch(reject)
    })
  }

  private async processFileByType(fileData: FileData): Promise<any> {
    switch (fileData.mimeType) {
      case 'text/csv':
        return this.processCSV(fileData)
      case 'application/vnd.ms-excel':
        return this.processExcel(fileData)
      case 'application/json':
        return this.processJSON(fileData)
      case 'text/xml':
        return this.processXML(fileData)
      default:
        return fileData
    }
  }

  private async processCSV(fileData: FileData): Promise<any> {
    // CSV processing logic
    const content = await this.readFileContent(fileData)
    const lines = content.split('\n')
    const headers = lines[0].split(',')
    const rows = lines.slice(1).map(line => line.split(','))
    
    return {
      ...fileData,
      processedData: {
        headers,
        rows,
        rowCount: rows.length
      }
    }
  }

  private async processExcel(fileData: FileData): Promise<any> {
    // Excel processing logic (would need a library like xlsx)
    return fileData
  }

  private async processJSON(fileData: FileData): Promise<any> {
    // JSON processing logic
    const content = await this.readFileContent(fileData)
    const jsonData = JSON.parse(content)
    
    return {
      ...fileData,
      processedData: jsonData
    }
  }

  private async processXML(fileData: FileData): Promise<any> {
    // XML processing logic
    const content = await this.readFileContent(fileData)
    
    return {
      ...fileData,
      processedData: {
        content,
        parsed: true
      }
    }
  }

  // Utility Methods
  private async processChunks(sessionId: string): Promise<void> {
    const session = this.uploadSessions.get(sessionId)
    if (!session || session.status !== 'uploading') return

    const pendingChunks = Array.from(session.chunks.values())
      .filter(chunk => chunk.status === 'pending')
      .slice(0, this.config.upload.maxConcurrentChunks)

    for (const chunk of pendingChunks) {
      this.uploadChunk(sessionId, chunk)
    }

    // Check if upload is complete
    if (session.uploadedChunks === session.totalChunks) {
      this.completeUpload(sessionId)
    } else if (session.failedChunks > 0) {
      // Retry failed chunks
      this.retryFailedChunks(sessionId)
    }
  }

  private async uploadChunk(sessionId: string, chunk: UploadChunk): Promise<void> {
    const session = this.uploadSessions.get(sessionId)
    if (!session) return

    chunk.status = 'uploading'
    chunk.attempts++
    chunk.lastAttempt = new Date()

    try {
      // Simulate chunk upload (replace with actual upload logic)
      await this.simulateChunkUpload(chunk)
      
      chunk.status = 'completed'
      session.uploadedChunks++
      session.progress = (session.uploadedChunks / session.totalChunks) * 100
      
      this.uploadSessions.set(sessionId, session)
      this.emit('chunkUploaded', { sessionId, chunk })
      
    } catch (error) {
      chunk.status = 'failed'
      chunk.error = error instanceof Error ? error.message : 'Unknown error'
      session.failedChunks++
      
      this.uploadSessions.set(sessionId, session)
      this.emit('chunkFailed', { sessionId, chunk, error })
    }
  }

  private async simulateChunkUpload(chunk: UploadChunk): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('Network error')
    }
  }

  private async completeUpload(sessionId: string): Promise<void> {
    const session = this.uploadSessions.get(sessionId)
    if (!session) return

    session.status = 'completed'
    session.endTime = new Date()
    
    // Create file data
    const fileData: FileData = {
      id: session.fileId,
      fileName: session.fileName,
      fileSize: session.fileSize,
      mimeType: session.metadata.mimeType,
      checksum: session.metadata.checksum,
      uploadedBy: 'current_user',
      uploadedAt: session.startTime,
      version: 1,
      status: 'completed',
      metadata: {
        isActive: true,
        isDeleted: false
      },
      data: {
        url: `/files/${session.fileId}`
      }
    }

    this.set(session.fileId, fileData)
    this.uploadSessions.delete(sessionId)
    
    this.emit('uploadCompleted', { session, fileData })
  }

  private async retryFailedChunks(sessionId: string): Promise<void> {
    const session = this.uploadSessions.get(sessionId)
    if (!session) return

    const failedChunks = Array.from(session.chunks.values())
      .filter(chunk => chunk.status === 'failed' && chunk.attempts < this.config.upload.retryAttempts)

    for (const chunk of failedChunks) {
      chunk.status = 'retrying'
      this.setTimer(`retry_${chunk.id}`, () => {
        this.uploadChunk(sessionId, chunk)
      }, this.config.upload.retryDelay)
    }
  }

  private async calculateChecksum(file: File): Promise<string> {
    // Simple checksum calculation (in production, use crypto.subtle.digest)
    return `${file.name}_${file.size}_${file.lastModified}`
  }

  private async readFileContent(fileData: FileData): Promise<string> {
    if (fileData.data.content) {
      return fileData.data.content
    }
    
    if (fileData.data.blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsText(fileData.data.blob!)
      })
    }
    
    throw new Error('No file content available')
  }

  private getNextVersion(fileId: string): number {
    const versions = this.getFileVersions(fileId)
    return versions.length > 0 ? Math.max(...versions.map(v => v.version)) + 1 : 1
  }

  private cleanupOldVersions(fileId: string): void {
    if (!this.config.versioning.autoCleanup) return

    const versions = this.getFileVersions(fileId)
    if (versions.length > this.config.versioning.maxVersions) {
      const sortedVersions = versions.sort((a, b) => b.version - a.version)
      const toDelete = sortedVersions.slice(this.config.versioning.maxVersions)
      
      for (const version of toDelete) {
        this.delete(version.id)
      }
    }
  }

  // Configuration Management
  public updateConfig(newConfig: Partial<FileConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.emit('configUpdated', { config: this.config })
  }

  public getConfig(): FileConfig {
    return { ...this.config }
  }

  // Validation methods required by BaseService
  public validate(data: FileData): boolean {
    return data && 
           typeof data.fileName === 'string' && 
           typeof data.fileSize === 'number' && 
           typeof data.mimeType === 'string'
  }

  // Cleanup
  public cleanup(): void {
    super.cleanup()
    
    // Clear upload timers
    for (const timer of this.uploadTimers.values()) {
      clearTimeout(timer)
    }
    this.uploadTimers.clear()

    // Clear upload sessions
    this.uploadSessions.clear()
  }
}

// Export singleton instance
export const fileService = new FileService()

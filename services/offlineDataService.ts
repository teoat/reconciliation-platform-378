// Offline Data Persistence Service - Handles offline data storage and recovery
// Implements comprehensive offline data management with auto-save and recovery

export function createOfflineData(data = {}) {
  return {
    id: '',
    type: 'form',
    data: null,
    timestamp: new Date(),
    version: 1,
    projectId: '',
    userId: '',
    component: '',
    isDirty: false,
    lastSaved: null,
    ...data,
  };
}

export function createOfflineConfig(data = {}) {
  return {
    enableAutoSave: true,
    autoSaveInterval: 30000, // milliseconds
    maxStorageSize: 50 * 1024 * 1024, // bytes
    enableRecovery: true,
    recoveryPromptDelay: 2000, // milliseconds
    enableSync: true,
    syncOnReconnect: true,
    ...data,
  };
}

export function createRecoveryPrompt(data = {}) {
  return {
    id: '',
    type: 'data_recovery',
    title: '',
    message: '',
    data: [],
    actions: {
      accept: () => {},
      reject: () => {},
      review: () => {},
    },
    timestamp: new Date(),
    ...data,
  };
}

class OfflineDataService {
  static instance;
  config;
  storage = new Map();
  recoveryPrompts = [];
  autoSaveTimers = new Map();
  onlineStatus = navigator.onLine;
  listeners = new Map();

  static getInstance() {
    if (!OfflineDataService.instance) {
      OfflineDataService.instance = new OfflineDataService();
    }
    return OfflineDataService.instance;
  }

  constructor() {
    this.config = {
      enableAutoSave: true,
      autoSaveInterval: 30000, // 30 seconds
      maxStorageSize: 50 * 1024 * 1024, // 50MB
      enableRecovery: true,
      recoveryPromptDelay: 2000, // 2 seconds
      enableSync: true,
      syncOnReconnect: true,
    };

    this.initializeEventListeners();
    this.loadStoredData();
  }

  initializeEventListeners() {
    // Network status listeners
    window.addEventListener('online', () => {
      this.onlineStatus = true;
      this.handleReconnection();
    });

    window.addEventListener('offline', () => {
      this.onlineStatus = false;
      this.handleDisconnection();
    });

    // Before unload listener for emergency save
    window.addEventListener('beforeunload', (event) => {
      this.emergencySave();
    });

    // Visibility change listener for auto-save
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.autoSaveAll();
      }
    });
  }

  loadStoredData() {
    try {
      const stored = localStorage.getItem('offline_data');
      if (stored) {
        const data = JSON.parse(stored);
        this.storage = new Map(data);
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  }

  saveStoredData() {
    try {
      const data = Array.from(this.storage.entries());
      localStorage.setItem('offline_data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  saveData(id, type, data, options = {}) {
    const existingData = this.storage.get(id);
    const version = existingData ? existingData.version + 1 : 1;

    const offlineData = createOfflineData({
      id,
      type,
      data,
      timestamp: new Date(),
      version,
      projectId: options.projectId,
      userId: options.userId,
      component: options.component,
      isDirty: true,
      lastSaved: new Date(),
    };

    this.storage.set(id, offlineData);
    this.saveStoredData();

    // Set up auto-save if enabled
    if (options.enableAutoSave !== false && this.config.enableAutoSave) {
      this.setupAutoSave(id);
    }

    this.emit('dataSaved', offlineData);
    return offlineData;
  }

  getData(id) {
    return this.storage.get(id);
  }

  getAllData(type) {
    const data = Array.from(this.storage.values());
    return type ? data.filter((item) => item.type === type) : data;
  }

  updateData(id, updates) {
    const existing = this.storage.get(id);
    if (!existing) return undefined;

    const updated = {
      ...existing,
      ...updates,
      version: existing.version + 1,
      timestamp: new Date(),
      isDirty: true,
    };

    this.storage.set(id, updated);
    this.saveStoredData();
    this.emit('dataUpdated', updated);
    return updated;
  }

  deleteData(id) {
    const deleted = this.storage.delete(id);
    if (deleted) {
      this.saveStoredData();
      this.clearAutoSave(id);
      this.emit('dataDeleted', id);
    }
    return deleted;
  }

  clearData(type) {
    if (type) {
      const keysToDelete = Array.from(this.storage.keys()).filter(
        (key) => this.storage.get(key)?.type === type
      );
      keysToDelete.forEach((key) => this.storage.delete(key));
    } else {
      this.storage.clear();
    }
    this.saveStoredData();
    this.emit('dataCleared', type);
  }

  setupAutoSave(id) {
    this.clearAutoSave(id);

    const timer = setInterval(() => {
      const data = this.storage.get(id);
      if (data && data.isDirty) {
        this.autoSaveData(id);
      }
    }, this.config.autoSaveInterval);

    this.autoSaveTimers.set(id, timer);
  }

  clearAutoSave(id) {
    const timer = this.autoSaveTimers.get(id);
    if (timer) {
      clearInterval(timer);
      this.autoSaveTimers.delete(id);
    }
  }

  autoSaveData(id) {
    const data = this.storage.get(id);
    if (!data || !data.isDirty) return;

    const updated = {
      ...data,
      lastSaved: new Date(),
      isDirty: false,
    };

    this.storage.set(id, updated);
    this.saveStoredData();
    this.emit('autoSaved', updated);
  }

  autoSaveAll() {
    this.storage.forEach((data, id) => {
      if (data.isDirty) {
        this.autoSaveData(id);
      }
    });
  }

  emergencySave() {
    this.autoSaveAll();
  }

  handleDisconnection() {
    this.emit('offline', { timestamp: new Date() });

    // Show offline indicator
    this.showOfflineIndicator();
  }

  handleReconnection() {
    this.emit('online', { timestamp: new Date() });

    // Hide offline indicator
    this.hideOfflineIndicator();

    // Handle recovery prompts
    if (this.config.enableRecovery) {
      setTimeout(() => {
        this.showRecoveryPrompts();
      }, this.config.recoveryPromptDelay);
    }

    // Sync data if enabled
    if (this.config.syncOnReconnect) {
      this.syncOfflineData();
    }
  }

  showOfflineIndicator() {
    // Create or update offline indicator
    let indicator = document.getElementById('offline-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.className =
        'fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      indicator.innerHTML = `
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
          <span>Working offline</span>
        </div>
      `;
      document.body.appendChild(indicator);
    }
  }

  hideOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  showRecoveryPrompts() {
    const dirtyData = this.getAllData().filter((data) => data.isDirty);

    if (dirtyData.length > 0) {
      const prompt = createRecoveryPrompt({
        id: `recovery_${Date.now()}`,
        type: 'data_recovery',
        title: 'Recover Unsaved Changes',
        message: `You have ${dirtyData.length} unsaved changes from when you were offline. Would you like to recover them?`,
        data: dirtyData,
        actions: {
          accept: () => this.acceptRecovery(dirtyData),
          reject: () => this.rejectRecovery(dirtyData),
          review: () => this.reviewRecovery(dirtyData),
        },
        timestamp: new Date(),
      };

      this.recoveryPrompts.push(prompt);
      this.emit('recoveryPrompt', prompt);
    }
  }

  acceptRecovery(data) {
    data.forEach((item) => {
      this.emit('recoveryAccepted', item);
    });
    this.clearRecoveryPrompts();
  }

  rejectRecovery(data) {
    data.forEach((item) => {
      this.deleteData(item.id);
    });
    this.clearRecoveryPrompts();
  }

  reviewRecovery(data) {
    this.emit('recoveryReview', data);
  }

  clearRecoveryPrompts() {
    this.recoveryPrompts = [];
  }

  async syncOfflineData() {
    const dirtyData = this.getAllData().filter((data) => data.isDirty);

    for (const data of dirtyData) {
      try {
        await this.syncDataItem(data);
      } catch (error) {
        console.error(`Failed to sync data ${data.id}:`, error);
        this.emit('syncError', { data, error });
      }
    }
  }

  async syncDataItem(data) {
    // This would integrate with your API service
    // For now, we'll just mark as synced
    const updated = this.updateData(data.id, { isDirty: false });
    if (updated) {
      this.emit('dataSynced', updated);
    }
  }

  getStorageSize() {
    const data = Array.from(this.storage.values());
    return JSON.stringify(data).length;
  }

  isStorageFull() {
    return this.getStorageSize() >= this.config.maxStorageSize;
  }

  cleanupOldData(maxAge = 7 * 24 * 60 * 60 * 1000) {
    // 7 days
    const cutoff = new Date(Date.now() - maxAge);
    const keysToDelete: string[] = [];

    this.storage.forEach((data, key) => {
      if (data.timestamp < cutoff) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.deleteData(key));
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  getConfig() {
    return { ...this.config };
  }

  isOnline() {
    return this.onlineStatus;
  }

  getRecoveryPrompts() {
    return [...this.recoveryPrompts];
  }

  // Event system
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  destroy() {
    this.autoSaveTimers.forEach((timer) => clearInterval(timer));
    this.autoSaveTimers.clear();
    this.listeners.clear();
  }
}

// React hook for offline data management
export const useOfflineData = () => {
  const service = OfflineDataService.getInstance();

  const saveData = (id, type, data, options) => {
    return service.saveData(id, type, data, options);
  };

  const getData = (id) => {
    return service.getData(id);
  };

  const getAllData = (type) => {
    return service.getAllData(type);
  };

  const updateData = (id, updates) => {
    return service.updateData(id, updates);
  };

  const deleteData = (id) => {
    return service.deleteData(id);
  };

  const clearData = (type) => {
    service.clearData(type);
  };

  const isOnline = () => {
    return service.isOnline();
  };

  const getStorageSize = () => {
    return service.getStorageSize();
  };

  const cleanupOldData = (maxAge) => {
    service.cleanupOldData(maxAge);
  };

  return {
    saveData,
    getData,
    getAllData,
    updateData,
    deleteData,
    clearData,
    isOnline,
    getStorageSize,
    cleanupOldData,
  };
};

// Export singleton instance
export const offlineDataService = OfflineDataService.getInstance();

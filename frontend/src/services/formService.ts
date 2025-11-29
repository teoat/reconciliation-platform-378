// Consolidated Form Service
// Combines auto-save, validation, debouncing, and form management functionality

import { PersistenceService } from './BaseService';

export interface FormData {
  id: string;
  formId: string;
  data: Record<string, unknown>;
  timestamp: number;
  version: number;
  metadata: {
    page: string;
    userId?: string;
    projectId?: string;
    workflowStage?: string;
  };
}

export interface FormValidation {
  fieldId: string;
  fieldType: 'text' | 'textarea' | 'email' | 'number' | 'date' | 'select';
  currentLength: number;
  maxLength: number;
  minLength: number;
  isRequired: boolean;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ButtonState {
  id: string;
  isEnabled: boolean;
  isLoading: boolean;
  isDebounced: boolean;
  lastClickTime: number;
  clickCount: number;
  debounceDelay: number;
}

export interface FormConfig {
  autoSave: {
    enabled: boolean;
    interval: number; // milliseconds
    maxVersions: number;
  };
  validation: {
    enabled: boolean;
    realTime: boolean;
    debounceDelay: number;
  };
  debouncing: {
    enabled: boolean;
    delay: number;
    maxClicksPerSecond: number;
  };
}

export class FormService extends PersistenceService<FormData> {
  private validations: Map<string, FormValidation> = new Map();
  private buttonStates: Map<string, ButtonState> = new Map();
  private formConfig: FormConfig;
  private validationTimers: Map<string, NodeJS.Timeout> = new Map();
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super('form_data', {
      persistence: true,
      caching: true,
    });

    this.formConfig = {
      autoSave: {
        enabled: true,
        interval: 30000, // 30 seconds
        maxVersions: 5,
      },
      validation: {
        enabled: true,
        realTime: true,
        debounceDelay: 500,
      },
      debouncing: {
        enabled: true,
        delay: 300,
        maxClicksPerSecond: 3,
      },
    };
  }

  // Utility Methods
  private generateId(): string {
    return `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getAll(): FormData[] {
    return Array.from(this.data.values()) as FormData[];
  }

  private setTimer(key: string, callback: () => void, delay: number): void {
    if (this.autoSaveTimers.has(key)) {
      clearTimeout(this.autoSaveTimers.get(key));
    }
    this.autoSaveTimers.set(key, setTimeout(callback, delay));
  }

  private clearTimer(key: string): void {
    if (this.autoSaveTimers.has(key)) {
      clearTimeout(this.autoSaveTimers.get(key));
      this.autoSaveTimers.delete(key);
    }
  }

  // Form Data Management
  public saveFormData(
    formId: string,
    data: Record<string, unknown>,
    metadata: FormData['metadata']
  ): string {
    const id = this.generateId();
    const formData: FormData = {
      id,
      formId,
      data,
      timestamp: Date.now(),
      version: this.getNextVersion(formId),
      metadata,
    };

    this.set(id, formData);
    this.cleanupOldVersions(formId);

    this.emit('formDataSaved', { formId, data: formData });
    return id;
  }

  public getFormData(formId: string): FormData[] {
    return this.getAll().filter((item) => item.formId === formId);
  }

  public getLatestFormData(formId: string): FormData | undefined {
    const formData = this.getFormData(formId);
    return formData.sort((a, b) => b.version - a.version)[0];
  }

  public restoreFormData(formId: string, version?: number): FormData | undefined {
    const formData = this.getFormData(formId);
    if (version) {
      return formData.find((item) => item.version === version);
    }
    return this.getLatestFormData(formId);
  }

  public deleteFormData(formId: string): boolean {
    const formData = this.getFormData(formId);
    let deleted = false;

    for (const item of formData) {
      this.delete(item.id);
      deleted = true;
    }

    return deleted;
  }

  // Auto-Save Functionality
  public startAutoSave(
    formId: string,
    data: Record<string, unknown>,
    metadata: FormData['metadata']
  ): void {
    if (!this.formConfig.autoSave.enabled) return;

    this.setTimer(
      `autosave_${formId}`,
      () => {
        this.saveFormData(formId, data, metadata);
        this.startAutoSave(formId, data, metadata); // Restart timer
      },
      this.formConfig.autoSave.interval
    );
  }

  public stopAutoSave(formId: string): void {
    this.clearTimer(`autosave_${formId}`);
  }

  // Validation Management
  public validateField(
    fieldId: string,
    value: unknown,
    rules: Partial<FormValidation>
  ): FormValidation {
    const validation: FormValidation = {
      fieldId,
      fieldType: rules.fieldType || 'text',
      currentLength: String(value || '').length,
      maxLength: rules.maxLength || 1000,
      minLength: rules.minLength || 0,
      isRequired: rules.isRequired || false,
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Length validation
    if (validation.currentLength < validation.minLength) {
      validation.errors.push(`Minimum length is ${validation.minLength} characters`);
      validation.isValid = false;
    }

    if (validation.currentLength > validation.maxLength) {
      validation.errors.push(`Maximum length is ${validation.maxLength} characters`);
      validation.isValid = false;
    }

    // Required field validation
    if (validation.isRequired && (!value || String(value).trim() === '')) {
      validation.errors.push('This field is required');
      validation.isValid = false;
    }

    // Warning thresholds
    const usagePercent = (validation.currentLength / validation.maxLength) * 100;
    if (usagePercent > 90) {
      validation.warnings.push('Approaching character limit');
    } else if (usagePercent > 75) {
      validation.warnings.push('75% of character limit reached');
    }

    this.validations.set(fieldId, validation);
    this.emit('fieldValidated', { fieldId, validation });

    return validation;
  }

  public getFieldValidation(fieldId: string): FormValidation | undefined {
    return this.validations.get(fieldId);
  }

  public validateForm(formId: string): boolean {
    const formData = this.getLatestFormData(formId);
    if (!formData) return false;

    let isValid = true;
    const formValidations: FormValidation[] = [];

    for (const [, validation] of this.validations.entries()) {
      if (validation.fieldId.startsWith(formId)) {
        formValidations.push(validation);
        if (!validation.isValid) {
          isValid = false;
        }
      }
    }

    this.emit('formValidated', { formId, isValid, validations: formValidations });
    return isValid;
  }

  // Debouncing Management
  public handleButtonClick(buttonId: string, callback: () => void): boolean {
    if (!this.formConfig.debouncing.enabled) {
      callback();
      return true;
    }

    const now = Date.now();
    const buttonState = this.buttonStates.get(buttonId) || {
      id: buttonId,
      isEnabled: true,
      isLoading: false,
      isDebounced: false,
      lastClickTime: 0,
      clickCount: 0,
      debounceDelay: this.formConfig.debouncing.delay,
    };

    // Check if button is debounced
    if (now - buttonState.lastClickTime < buttonState.debounceDelay) {
      buttonState.isDebounced = true;
      this.buttonStates.set(buttonId, buttonState);
      this.emit('buttonDebounced', { buttonId, buttonState });
      return false;
    }

    // Check click rate
    const clicksPerSecond = buttonState.clickCount / ((now - buttonState.lastClickTime) / 1000);
    if (clicksPerSecond > this.formConfig.debouncing.maxClicksPerSecond) {
      buttonState.isDebounced = true;
      this.buttonStates.set(buttonId, buttonState);
      this.emit('buttonRateLimited', { buttonId, buttonState });
      return false;
    }

    // Allow click
    buttonState.lastClickTime = now;
    buttonState.clickCount++;
    buttonState.isDebounced = false;
    this.buttonStates.set(buttonId, buttonState);

    callback();
    this.emit('buttonClicked', { buttonId, buttonState });
    return true;
  }

  public setButtonLoading(buttonId: string, isLoading: boolean): void {
    const buttonState = this.buttonStates.get(buttonId);
    if (buttonState) {
      buttonState.isLoading = isLoading;
      this.buttonStates.set(buttonId, buttonState);
      this.emit('buttonLoadingChanged', { buttonId, isLoading });
    }
  }

  public getButtonState(buttonId: string): ButtonState | undefined {
    return this.buttonStates.get(buttonId);
  }

  // Configuration Management
  public updateConfig(newConfig: Partial<FormConfig>): void {
    this.formConfig = { ...this.formConfig, ...newConfig };
    this.emit('configUpdated', { config: this.formConfig });
  }

  public getConfig(): FormConfig {
    return { ...this.formConfig };
  }

  // Utility Methods
  private getNextVersion(formId: string): number {
    const formData = this.getFormData(formId);
    return formData.length > 0 ? Math.max(...formData.map((item) => item.version)) + 1 : 1;
  }

  private cleanupOldVersions(formId: string): void {
    const formData = this.getFormData(formId);
    if (formData.length > this.formConfig.autoSave.maxVersions) {
      const sortedData = formData.sort((a, b) => b.version - a.version);
      const toDelete = sortedData.slice(this.formConfig.autoSave.maxVersions);

      for (const item of toDelete) {
        this.delete(item.id);
      }
    }
  }

  // Validation methods required by BaseService
  public validate(data: FormData): boolean {
    return (
      data &&
      typeof data.formId === 'string' &&
      typeof data.data === 'object' &&
      typeof data.timestamp === 'number'
    );
  }

  // Cleanup
  public cleanup(): void {
    super.cleanup();

    // Clear validation timers
    for (const timer of this.validationTimers.values()) {
      clearTimeout(timer);
    }
    this.validationTimers.clear();

    // Clear validations
    this.validations.clear();

    // Clear button states
    this.buttonStates.clear();
  }
}

// Export singleton instance
export const formService = new FormService();

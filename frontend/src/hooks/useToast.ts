/**
 * useToast Hook - Toast notification system
 * Provides a simple, performant toast notification system for notifications
 */

import { useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * Toast notification object for complex notifications
 */
export interface ToastNotification {
  title?: string;
  description: string;
  variant?: ToastType;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class ToastManager {
  private toasts: Toast[] = [];
  private listeners: Set<(toasts: Toast[]) => void> = new Set();
  private idCounter = 0;

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  show(message: string, type: ToastType = 'info', options: ToastOptions = {}) {
    const id = `toast-${this.idCounter++}`;
    const toast: Toast = {
      id,
      message,
      type,
      duration: options.duration || 3000,
      position: options.position || 'top-right',
    };

    this.toasts.push(toast);
    this.notify();

    setTimeout(() => {
      this.remove(id);
    }, toast.duration);

    return id;
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }

  getToasts() {
    return [...this.toasts];
  }
}

const toastManager = new ToastManager();

/**
 * useToast Hook
 * Provides toast notification functionality
 */
export const useToast = () => {
  const showToast = useCallback((notification: ToastNotification | string) => {
    // Support both simple string and complex notification object
    let message: string;
    let type: ToastType = 'info';
    
    if (typeof notification === 'string') {
      message = notification;
    } else {
      message = notification.title 
        ? `${notification.title}: ${notification.description}`
        : notification.description;
      type = notification.variant || 'info';
    }

    return toastManager.show(message, type);
  }, []);

  const success = useCallback((message: string, options?: ToastOptions) => {
    return toastManager.show(message, 'success', options);
  }, []);

  const error = useCallback((message: string, options?: ToastOptions) => {
    return toastManager.show(message, 'error', options);
  }, []);

  const warning = useCallback((message: string, options?: ToastOptions) => {
    return toastManager.show(message, 'warning', options);
  }, []);

  const info = useCallback((message: string, options?: ToastOptions) => {
    return toastManager.show(message, 'info', options);
  }, []);

  return {
    show: showToast,
    success,
    error,
    warning,
    info,
    subscribe: toastManager.subscribe.bind(toastManager),
    clear: toastManager.clear.bind(toastManager),
  };
};

export default useToast;

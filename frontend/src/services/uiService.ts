// Consolidated UI Service
// Combines accessibility, contrast, themes, and UI management functionality

import { BaseService, PersistenceService } from './BaseService';

export interface ThemeData {
  id: string;
  name: string;
  type: 'light' | 'dark' | 'high-contrast' | 'custom';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    lineHeight: {
      tight: string;
      normal: string;
      relaxed: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
}

export interface AccessibilityConfig {
  enableScreenReader: boolean;
  enableKeyboardNavigation: boolean;
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
  enableFocusIndicators: boolean;
  enableAriaLabels: boolean;
  enableSkipLinks: boolean;
  enableLiveRegions: boolean;
  fontSize: number;
  lineHeight: number;
  colorContrast: number;
}

export interface ColorContrastResult {
  ratio: number;
  level: 'AA' | 'AAA' | 'FAIL';
  largeText: boolean;
  normalText: boolean;
  description: string;
}

export interface UIState {
  currentTheme: string;
  highContrastEnabled: boolean;
  reducedMotionEnabled: boolean;
  fontSize: number;
  focusVisible: boolean;
  keyboardNavigation: boolean;
}

export interface UIConfig {
  themes: {
    enabled: boolean;
    defaultTheme: string;
    allowCustomThemes: boolean;
    persistTheme: boolean;
  };
  accessibility: AccessibilityConfig;
  contrast: {
    enabled: boolean;
    threshold: number;
    largeTextThreshold: number;
    showWarnings: boolean;
    autoFix: boolean;
  };
  animations: {
    enabled: boolean;
    duration: number;
    easing: string;
    reducedMotion: boolean;
  };
}

export class UIService extends PersistenceService<ThemeData> {
  private currentState: UIState;
  private config: UIConfig;
  private contrastCache: Map<string, ColorContrastResult> = new Map();
  private focusHistory: HTMLElement[] = [];
  private currentFocus: HTMLElement | null = null;

  constructor() {
    super('ui_themes', {
      enabled: true,
      persistence: true,
      events: true,
      caching: true,
    });

    this.config = {
      themes: {
        enabled: true,
        defaultTheme: 'light',
        allowCustomThemes: true,
        persistTheme: true,
      },
      accessibility: {
        enableScreenReader: true,
        enableKeyboardNavigation: true,
        enableHighContrast: false,
        enableReducedMotion: false,
        enableFocusIndicators: true,
        enableAriaLabels: true,
        enableSkipLinks: true,
        enableLiveRegions: true,
        fontSize: 16,
        lineHeight: 1.5,
        colorContrast: 4.5,
      },
      contrast: {
        enabled: true,
        threshold: 4.5,
        largeTextThreshold: 18,
        showWarnings: true,
        autoFix: false,
      },
      animations: {
        enabled: true,
        duration: 300,
        easing: 'ease-in-out',
        reducedMotion: false,
      },
    };

    this.currentState = {
      currentTheme: this.config.themes.defaultTheme,
      highContrastEnabled: false,
      reducedMotionEnabled: false,
      fontSize: this.config.accessibility.fontSize,
      focusVisible: false,
      keyboardNavigation: false,
    };

    this.initializeDefaultThemes();
    this.setupEventListeners();
  }

  // Theme Management
  public createTheme(themeData: Omit<ThemeData, 'id'>): string {
    const id = this.generateId();
    const theme: ThemeData = {
      id,
      ...themeData,
    };

    this.set(id, theme);
    this.emit('themeCreated', { theme });
    return id;
  }

  public getTheme(themeId: string): ThemeData | undefined {
    return this.get(themeId);
  }

  public getAllThemes(): ThemeData[] {
    return this.getAll();
  }

  public applyTheme(themeId: string): boolean {
    const theme = this.get(themeId);
    if (!theme) return false;

    this.currentState.currentTheme = themeId;
    this.applyThemeToDOM(theme);

    if (this.config.themes.persistTheme) {
      localStorage.setItem('selectedTheme', themeId);
    }

    this.emit('themeApplied', { theme });
    return true;
  }

  public getCurrentTheme(): ThemeData | undefined {
    return this.get(this.currentState.currentTheme);
  }

  public toggleTheme(): void {
    const currentTheme = this.getCurrentTheme();
    if (!currentTheme) return;

    const newThemeType = currentTheme.type === 'light' ? 'dark' : 'light';
    const themes = this.getAllThemes().filter((t) => t.type === newThemeType);

    if (themes.length > 0) {
      this.applyTheme(themes[0].id);
    }
  }

  // High Contrast Management
  public toggleHighContrast(): void {
    this.currentState.highContrastEnabled = !this.currentState.highContrastEnabled;

    if (this.currentState.highContrastEnabled) {
      this.enableHighContrast();
    } else {
      this.disableHighContrast();
    }

    this.emit('highContrastToggled', { enabled: this.currentState.highContrastEnabled });
  }

  public enableHighContrast(): void {
    document.body.classList.add('high-contrast');
    this.currentState.highContrastEnabled = true;
    this.emit('highContrastEnabled', {});
  }

  public disableHighContrast(): void {
    document.body.classList.remove('high-contrast');
    this.currentState.highContrastEnabled = false;
    this.emit('highContrastDisabled', {});
  }

  public isHighContrastEnabled(): boolean {
    return this.currentState.highContrastEnabled;
  }

  // Accessibility Management
  public toggleReducedMotion(): void {
    this.currentState.reducedMotionEnabled = !this.currentState.reducedMotionEnabled;

    if (this.currentState.reducedMotionEnabled) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }

    this.emit('reducedMotionToggled', { enabled: this.currentState.reducedMotionEnabled });
  }

  public setFontSize(size: number): void {
    this.currentState.fontSize = size;
    document.documentElement.style.fontSize = `${size}px`;
    this.emit('fontSizeChanged', { size });
  }

  public increaseFontSize(): void {
    const newSize = Math.min(this.currentState.fontSize + 2, 24);
    this.setFontSize(newSize);
  }

  public decreaseFontSize(): void {
    const newSize = Math.max(this.currentState.fontSize - 2, 12);
    this.setFontSize(newSize);
  }

  public resetFontSize(): void {
    this.setFontSize(this.config.accessibility.fontSize);
  }

  // Focus Management
  public setFocus(element: HTMLElement): void {
    if (this.currentFocus) {
      this.focusHistory.push(this.currentFocus);
    }

    this.currentFocus = element;
    element.focus();

    this.emit('focusChanged', { element });
  }

  public getCurrentFocus(): HTMLElement | null {
    return this.currentFocus;
  }

  public getFocusHistory(): HTMLElement[] {
    return [...this.focusHistory];
  }

  public clearFocusHistory(): void {
    this.focusHistory = [];
  }

  // Color Contrast Validation
  public calculateContrast(foreground: string, background: string): ColorContrastResult {
    const cacheKey = `${foreground}_${background}`;

    if (this.contrastCache.has(cacheKey)) {
      return this.contrastCache.get(cacheKey)!;
    }

    const ratio = this.getContrastRatio(foreground, background);
    const result: ColorContrastResult = {
      ratio,
      level: this.getContrastLevel(ratio),
      largeText: ratio >= this.config.contrast.largeTextThreshold,
      normalText: ratio >= this.config.contrast.threshold,
      description: this.getContrastDescription(ratio),
    };

    this.contrastCache.set(cacheKey, result);
    return result;
  }

  public validateContrast(element: HTMLElement): ColorContrastResult[] {
    const results: ColorContrastResult[] = [];
    const computedStyle = window.getComputedStyle(element);
    const foreground = computedStyle.color;
    const background = computedStyle.backgroundColor;

    if (foreground && background) {
      results.push(this.calculateContrast(foreground, background));
    }

    return results;
  }

  // Screen Reader Support
  public announceToScreenReader(
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ): void {
    if (!this.config.accessibility.enableScreenReader) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);

    this.emit('screenReaderAnnounced', { message, priority });
  }

  // Keyboard Navigation
  public enableKeyboardNavigation(): void {
    this.currentState.keyboardNavigation = true;
    document.body.classList.add('keyboard-navigation');
    this.emit('keyboardNavigationEnabled', {});
  }

  public disableKeyboardNavigation(): void {
    this.currentState.keyboardNavigation = false;
    document.body.classList.remove('keyboard-navigation');
    this.emit('keyboardNavigationDisabled', {});
  }

  public isKeyboardNavigationEnabled(): boolean {
    return this.currentState.keyboardNavigation;
  }

  // Configuration Management
  public updateConfig(newConfig: Partial<UIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', { config: this.config });
  }

  public getConfig(): UIConfig {
    return { ...this.config };
  }

  public getCurrentState(): UIState {
    return { ...this.currentState };
  }

  // Utility Methods
  private initializeDefaultThemes(): void {
    const lightTheme: ThemeData = {
      id: 'light',
      name: 'Light Theme',
      type: 'light',
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        error: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
        info: '#06b6d4',
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
        },
        lineHeight: {
          tight: '1.25',
          normal: '1.5',
          relaxed: '1.75',
        },
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
      },
      borderRadius: {
        none: '0',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        full: '9999px',
      },
    };

    const darkTheme: ThemeData = {
      id: 'dark',
      name: 'Dark Theme',
      type: 'dark',
      colors: {
        primary: '#60a5fa',
        secondary: '#94a3b8',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f1f5f9',
        textSecondary: '#94a3b8',
        border: '#334155',
        error: '#f87171',
        warning: '#fbbf24',
        success: '#34d399',
        info: '#22d3ee',
      },
      typography: lightTheme.typography,
      spacing: lightTheme.spacing,
      borderRadius: lightTheme.borderRadius,
    };

    this.set('light', lightTheme);
    this.set('dark', darkTheme);
  }

  private applyThemeToDOM(theme: ThemeData): void {
    const root = document.documentElement;

    // Apply colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply typography
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });

    Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
      root.style.setProperty(`--line-height-${key}`, value);
    });

    // Apply spacing
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // Apply border radius
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--border-radius-${key}`, value);
    });

    // Apply theme class
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${theme.type}`);
  }

  private setupEventListeners(): void {
    // Keyboard navigation detection
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.enableKeyboardNavigation();
      }
    });

    document.addEventListener('mousedown', () => {
      this.disableKeyboardNavigation();
    });

    // Focus management
    document.addEventListener('focusin', (e) => {
      this.setFocus(e.target as HTMLElement);
    });

    // Load saved theme
    if (this.config.themes.persistTheme) {
      const savedTheme = localStorage.getItem('selectedTheme');
      if (savedTheme && this.get(savedTheme)) {
        this.applyTheme(savedTheme);
      }
    }
  }

  private getContrastRatio(foreground: string, background: string): number {
    // Simplified contrast ratio calculation
    // In production, use proper color space conversion
    const fgLuminance = this.getLuminance(foreground);
    const bgLuminance = this.getLuminance(background);

    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);

    return (lighter + 0.05) / (darker + 0.05);
  }

  private getLuminance(color: string): number {
    // Simplified luminance calculation
    // In production, use proper color space conversion
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0.5;

    const { r, g, b } = rgb;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  private getContrastLevel(ratio: number): 'AA' | 'AAA' | 'FAIL' {
    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    return 'FAIL';
  }

  private getContrastDescription(ratio: number): string {
    if (ratio >= 7) return 'Excellent contrast (AAA)';
    if (ratio >= 4.5) return 'Good contrast (AA)';
    if (ratio >= 3) return 'Poor contrast (A)';
    return 'Very poor contrast (Fail)';
  }

  // Validation methods required by BaseService
  public validate(data: ThemeData): boolean {
    return (
      data &&
      typeof data.name === 'string' &&
      typeof data.type === 'string' &&
      typeof data.colors === 'object'
    );
  }

  // Cleanup
  public cleanup(): void {
    super.cleanup();
    this.contrastCache.clear();
    this.focusHistory = [];
    this.currentFocus = null;
  }
}

// Export singleton instance
export const uiService = new UIService();

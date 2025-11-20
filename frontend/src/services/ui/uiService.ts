// Unified UI Service
// NOTE: This file is deprecated. Use frontend/src/services/uiService.ts instead.
// This file is kept for backward compatibility but should not be used in new code.
// @deprecated Use uiService from '../uiService' instead
import { BaseService } from '../BaseService';

export interface UIState {
  theme: 'light' | 'dark' | 'auto';
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  animations: boolean;
  notifications: boolean;
}

export class UIService extends BaseService<UIState> {
  private static instance: UIService;

  public static getInstance(): UIService {
    if (!UIService.instance) {
      UIService.instance = new UIService();
    }
    return UIService.instance;
  }

  constructor() {
    super({ persistence: true });
    this.initializeDefaultState();
  }

  private initializeDefaultState(): void {
    const defaultState: UIState = {
      theme: 'light',
      highContrast: false,
      fontSize: 'medium',
      animations: true,
      notifications: true,
    };

    this.set('ui_state', defaultState);
  }

  public getTheme(): 'light' | 'dark' | 'auto' {
    const state = this.get('ui_state');
    return state ? state.theme : 'light';
  }

  public setTheme(theme: 'light' | 'dark' | 'auto'): void {
    const state = this.get('ui_state');
    if (state) {
      state.theme = theme;
      this.set('ui_state', state);
      this.applyTheme(theme);
    }
  }

  public toggleHighContrast(): void {
    const state = this.get('ui_state');
    if (state) {
      state.highContrast = !state.highContrast;
      this.set('ui_state', state);
      this.applyHighContrast(state.highContrast);
    }
  }

  public setFontSize(size: 'small' | 'medium' | 'large'): void {
    const state = this.get('ui_state');
    if (state) {
      state.fontSize = size;
      this.set('ui_state', state);
      this.applyFontSize(size);
    }
  }

  public toggleAnimations(): void {
    const state = this.get('ui_state');
    if (state) {
      state.animations = !state.animations;
      this.set('ui_state', state);
      this.applyAnimations(state.animations);
    }
  }

  private applyTheme(theme: 'light' | 'dark' | 'auto'): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  private applyHighContrast(enabled: boolean): void {
    document.documentElement.setAttribute('data-high-contrast', enabled.toString());
  }

  private applyFontSize(size: 'small' | 'medium' | 'large'): void {
    document.documentElement.setAttribute('data-font-size', size);
  }

  private applyAnimations(enabled: boolean): void {
    document.documentElement.setAttribute('data-animations', enabled.toString());
  }
}

export const uiService = UIService.getInstance();

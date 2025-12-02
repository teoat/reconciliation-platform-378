/**
 * ARIA Live Regions Service
 * Manages accessible announcements for screen readers
 */

export type AriaLiveLevel = 'polite' | 'assertive' | 'off';

export interface AriaAnnouncement {
  message: string;
  level: AriaLiveLevel;
  timestamp: number;
}

class AriaLiveRegionsService {
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      this.initializeRegions();
    }
  }

  private initializeRegions(): void {
    // Create polite region
    this.politeRegion = this.createRegion('polite');
    // Create assertive region
    this.assertiveRegion = this.createRegion('assertive');
  }

  private createRegion(level: AriaLiveLevel): HTMLElement {
    const region = document.createElement('div');
    region.setAttribute('aria-live', level);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    region.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
    document.body.appendChild(region);
    return region;
  }

  public announce(message: string, level: AriaLiveLevel = 'polite'): void {
    const region = level === 'assertive' ? this.assertiveRegion : this.politeRegion;
    if (region) {
      region.textContent = '';
      // Force screen reader to announce by clearing and setting
      setTimeout(() => {
        region.textContent = message;
      }, 100);
    }
  }

  public announcePolite(message: string): void {
    this.announce(message, 'polite');
  }

  public announceAssertive(message: string): void {
    this.announce(message, 'assertive');
  }

  public clear(): void {
    if (this.politeRegion) this.politeRegion.textContent = '';
    if (this.assertiveRegion) this.assertiveRegion.textContent = '';
  }
}

export const ariaLiveRegionsService = new AriaLiveRegionsService();
export default ariaLiveRegionsService;

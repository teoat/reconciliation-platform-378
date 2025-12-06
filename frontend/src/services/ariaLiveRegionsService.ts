// ARIA Live Regions Service - manages accessibility announcements

class AriaLiveRegionsService {
  private politeRegion: HTMLDivElement | null = null;
  private assertiveRegion: HTMLDivElement | null = null;

  initialize(): void {
    if (typeof document === 'undefined') return;

    // Create polite region
    if (!this.politeRegion) {
      this.politeRegion = document.createElement('div');
      this.politeRegion.setAttribute('aria-live', 'polite');
      this.politeRegion.setAttribute('aria-atomic', 'true');
      this.politeRegion.className = 'sr-only';
      document.body.appendChild(this.politeRegion);
    }

    // Create assertive region
    if (!this.assertiveRegion) {
      this.assertiveRegion = document.createElement('div');
      this.assertiveRegion.setAttribute('aria-live', 'assertive');
      this.assertiveRegion.setAttribute('aria-atomic', 'true');
      this.assertiveRegion.className = 'sr-only';
      document.body.appendChild(this.assertiveRegion);
    }
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (typeof document === 'undefined') return;

    // Ensure regions exist even if initialize() wasn't called explicitly
    if (!this.politeRegion || !this.assertiveRegion) {
      this.initialize();
    }
    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;
    if (region) {
      region.textContent = '';
      setTimeout(() => {
        if (region) {
          region.textContent = message;
        }
      }, 100);
    }
  }

  clear(): void {
    if (this.politeRegion) {
      this.politeRegion.textContent = '';
    }
    if (this.assertiveRegion) {
      this.assertiveRegion.textContent = '';
    }
  }
}

export const ariaLiveRegionsService = new AriaLiveRegionsService();

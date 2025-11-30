// PWA Service for handling Progressive Web App functionality
export const pwaService = {
  isInstalled: false,
  deferredPrompt: null as any,

  init() {
    // Check if already installed
    this.isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
    });
  },

  async install() {
    if (!this.deferredPrompt) return false;

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;

    this.deferredPrompt = null;
    return outcome === 'accepted';
  },

  canInstall() {
    return !this.isInstalled && !!this.deferredPrompt;
  },
};

// Initialize on import
if (typeof window !== 'undefined') {
  pwaService.init();
}

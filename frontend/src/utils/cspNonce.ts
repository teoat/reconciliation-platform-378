/**
 * CSP Nonce Utility Module
 *
 * Provides utilities for generating and managing Content Security Policy nonces
 * for secure inline script and style execution in production.
 */

/**
 * Generates a cryptographically secure random nonce
 * @returns A base64-encoded random string suitable for CSP nonces
 */
export function generateNonce(): string {
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    // Fallback for environments without crypto API (shouldn't happen in browsers)
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }

  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  // Convert to base64url format (CSP-compatible)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Stores the nonce in a way that's accessible throughout the application
 */
let currentNonce: string | null = null;

/**
 * Gets the current nonce, generating a new one if it doesn't exist
 * @returns The current CSP nonce
 */
export function getNonce(): string {
  if (!currentNonce) {
    currentNonce = generateNonce();
  }
  return currentNonce;
}

/**
 * Sets a specific nonce (useful for server-side rendering or build-time injection)
 * @param nonce The nonce to set
 */
export function setNonce(nonce: string): void {
  currentNonce = nonce;
}

/**
 * Resets the nonce (generates a new one)
 * @returns The new nonce
 */
export function resetNonce(): string {
  currentNonce = generateNonce();
  return currentNonce;
}

/**
 * Gets the nonce attribute value for HTML elements
 * @returns The nonce value formatted for HTML attributes
 */
export function getNonceAttribute(): string {
  return getNonce();
}

/**
 * Injects nonce into a script element
 * @param scriptElement The script element to inject the nonce into
 */
export function injectNonceIntoScript(scriptElement: HTMLScriptElement): void {
  scriptElement.nonce = getNonce();
}

/**
 * Injects nonce into a style element
 * @param styleElement The style element to inject the nonce into
 */
export function injectNonceIntoStyle(styleElement: HTMLStyleElement): void {
  styleElement.nonce = getNonce();
}

/**
 * Creates a script element with nonce
 * @param content Optional inline script content
 * @param src Optional script source URL
 * @returns A script element with nonce attribute
 */
export function createScriptWithNonce(content?: string, src?: string): HTMLScriptElement {
  const script = document.createElement('script');
  script.nonce = getNonce();

  if (src) {
    script.src = src;
  }

  if (content) {
    script.textContent = content;
  }

  return script;
}

/**
 * Creates a style element with nonce
 * @param content Optional inline style content
 * @returns A style element with nonce attribute
 */
export function createStyleWithNonce(content?: string): HTMLStyleElement {
  const style = document.createElement('style');
  style.nonce = getNonce();

  if (content) {
    style.textContent = content;
  }

  return style;
}

/**
 * Builds a CSP directive string with nonce
 * @param directive The CSP directive name (e.g., 'script-src')
 * @param sources Array of allowed sources
 * @param includeNonce Whether to include the nonce in the directive
 * @returns The formatted CSP directive string
 */
export function buildCSPDirective(
  directive: string,
  sources: string[],
  includeNonce: boolean = true
): string {
  const nonce = includeNonce ? getNonce() : null;
  const sourceList = [...sources];

  if (nonce && includeNonce) {
    sourceList.push(`'nonce-${nonce}'`);
  }

  return `${directive} ${sourceList.join(' ')}`;
}

/**
 * Builds a complete CSP header string with nonces
 * @param policy The CSP policy object
 * @returns The formatted CSP header string
 */
export function buildCSPHeader(policy: Record<string, string[]>): string {
  const nonce = getNonce();
  const directives: string[] = [];

  Object.entries(policy).forEach(([directive, sources]) => {
    const processedSources = sources.map((source) => {
      // Replace placeholder with actual nonce
      if (source === "'nonce-{nonce}'" || source === 'nonce-{nonce}') {
        return `'nonce-${nonce}'`;
      }
      return source;
    });

    directives.push(`${directive} ${processedSources.join(' ')}`);
  });

  return directives.join('; ');
}

/**
 * Updates the CSP meta tag in the document head with nonce
 * @param policy The CSP policy object
 */
export function updateCSPMetaTag(policy: Record<string, string[]>): void {
  if (typeof document === 'undefined') return;

  // Remove existing CSP meta tag
  const existingMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existingMeta) {
    existingMeta.remove();
  }

  // Create new meta tag with nonce
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = buildCSPHeader(policy);

  document.head.appendChild(meta);
}

/**
 * Initializes nonce-based CSP for the application
 * Should be called early in the application lifecycle
 */
export function initializeNonceCSP(): string {
  const nonce = getNonce();

  // Store nonce in a data attribute on the root element for easy access
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.setAttribute('data-csp-nonce', nonce);
  }

  return nonce;
}

/**
 * Gets nonce from the root element's data attribute
 * Useful for accessing nonce in components
 */
export function getNonceFromDOM(): string | null {
  if (typeof document === 'undefined') return null;
  return document.documentElement.getAttribute('data-csp-nonce');
}

/**
 * React hook for accessing CSP nonce in components
 * Note: This is a utility function, not an actual React hook
 * Use it in components that need to add nonce to dynamically created elements
 */
export function useCSPNonce(): string {
  return getNonce();
}

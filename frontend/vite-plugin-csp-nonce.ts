/**
 * Vite Plugin for CSP Nonce Injection
 * 
 * Injects CSP nonces into HTML at build time for production builds.
 * This ensures that inline scripts and styles have the correct nonce attribute.
 */

import type { Plugin } from 'vite';
import { randomBytes } from 'crypto';

interface CSPNoncePluginOptions {
  /**
   * Whether to enable nonce injection (default: true in production)
   */
  enabled?: boolean;
}

export function cspNoncePlugin(options: CSPNoncePluginOptions = {}): Plugin {
  const { enabled = process.env.NODE_ENV === 'production' } = options;

  return {
    name: 'csp-nonce-injection',
    enforce: 'pre',
    transformIndexHtml: {
      enforce: 'pre',
      transform(html: string, context) {
        if (!enabled) {
          return html;
        }

        // Generate a unique nonce for this build
        const nonce = randomBytes(16).toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');

        let transformedHtml = html;

        // Replace nonce placeholder in CSP meta tag
        transformedHtml = transformedHtml.replace(
          /nonce-\{nonce\}/g,
          `nonce-${nonce}`
        );

        // Add nonce to existing script tags that don't have src (inline scripts)
        transformedHtml = transformedHtml.replace(
          /<script(?![^>]*\snonce=)(?![^>]*\ssrc=)([^>]*)>/gi,
          `<script$1 nonce="${nonce}">`
        );

        // Add nonce to existing style tags
        transformedHtml = transformedHtml.replace(
          /<style(?![^>]*\snonce=)([^>]*)>/gi,
          `<style$1 nonce="${nonce}">`
        );

        // Add nonce to link tags with inline styles (if any)
        transformedHtml = transformedHtml.replace(
          /<link(?![^>]*\snonce=)([^>]*rel=["']stylesheet["'][^>]*)>/gi,
          `<link$1 nonce="${nonce}">`
        );

        // Store nonce in a data attribute on html element for runtime access
        transformedHtml = transformedHtml.replace(
          /<html([^>]*)>/i,
          `<html$1 data-csp-nonce="${nonce}">`
        );

        // Inject a script to make nonce available globally (before other scripts)
        const nonceScript = `<script nonce="${nonce}">window.__CSP_NONCE__="${nonce}";</script>`;
        
        // Insert after <head> tag
        transformedHtml = transformedHtml.replace(
          /<head([^>]*)>/i,
          `$&${nonceScript}`
        );

        return transformedHtml;
      },
    },
  };
}


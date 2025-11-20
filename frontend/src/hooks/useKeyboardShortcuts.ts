import { useEffect, useCallback, useRef } from 'react';

/**
 * Keyboard shortcut handler mapping
 */
export type KeyboardShortcuts = Record<string, () => void>;

/**
 * Hook for managing keyboard shortcuts
 *
 * @param shortcuts - Object mapping key combinations to handler functions
 * @param enabled - Whether shortcuts are enabled (default: true)
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   'Ctrl+s': () => handleSave(),
 *   'Ctrl+Enter': () => handleSubmit(),
 *   'Escape': () => handleCancel(),
 * })
 * ```
 */
export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcuts,
  enabled: boolean = true
): void => {
  const shortcutsRef = useRef(shortcuts);

  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  // Handle keydown events
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const ctrlKey = e.ctrlKey || e.metaKey;
      const shiftKey = e.shiftKey;
      const altKey = e.altKey;

      // Build key string
      const keyParts: string[] = [];
      if (ctrlKey) keyParts.push('Ctrl');
      if (shiftKey) keyParts.push('Shift');
      if (altKey) keyParts.push('Alt');

      // Normalize key name
      let keyName = e.key;
      if (keyName === ' ') keyName = 'Space';
      if (keyName === 'Escape') keyName = 'Escape';

      keyParts.push(keyName);
      const key = keyParts.join('+');

      // Find matching shortcut
      const handler = shortcutsRef.current[key];

      if (handler) {
        e.preventDefault();
        e.stopPropagation();
        handler();
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
};

/**
 * Hook for managing single keyboard shortcut
 *
 * @param key - Key combination (e.g., 'Ctrl+s')
 * @param handler - Handler function
 * @param enabled - Whether shortcut is enabled
 */
export const useKeyboardShortcut = (
  key: string,
  handler: () => void,
  enabled: boolean = true
): void => {
  useKeyboardShortcuts(enabled ? { [key]: handler } : {}, enabled);
};

/**
 * TOUCHPAD & VIRTUAL CURSOR CONTROLLER SERVICE
 * Implements:
 * - Circular holographic touchpad state and gesture processing
 * - Virtual on-screen cursor tracking with smooth interpolation
 * - Left-click, double-click, and drag dispatching via elementFromPoint
 * - Comprehensive touchpad settings (sensitivity, size, audio feedback, move mode)
 * - Persistent configuration in localStorage
 */

export interface TouchpadSettings {
  enabled: boolean;
  size: 'small' | 'medium' | 'large';
  sensitivity: number; // 0.5 to 3.0 (default 1.2)
  cursorSpeed: number; // 0.5 to 2.5 (default 1.0)
  soundFeedback: boolean;
  invertScroll: boolean;
  movePadMode: boolean; // if true, dragging pad repositions the pad itself
  padPosition: { x: number; y: number }; // absolute screen coordinates
  cursorPosition: { x: number; y: number };
  cursorVisible: boolean;
}

const STORAGE_KEY = 'raj_expo_touchpad_settings_v2';

export const DEFAULT_TOUCHPAD_SETTINGS: TouchpadSettings = {
  enabled: true,
  size: 'medium',
  sensitivity: 1.25,
  cursorSpeed: 1.1,
  soundFeedback: true,
  invertScroll: false,
  movePadMode: false,
  padPosition: {
    x: typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 380) : 800,
    y: typeof window !== 'undefined' ? Math.max(20, window.innerHeight - 340) : 550
  },
  cursorPosition: {
    x: typeof window !== 'undefined' ? Math.max(50, window.innerWidth - 220) : 950,
    y: typeof window !== 'undefined' ? Math.max(50, window.innerHeight - 300) : 600
  },
  cursorVisible: true
};

export function getStoredTouchpadSettings(): TouchpadSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_TOUCHPAD_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_TOUCHPAD_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to parse touchpad settings:', err);
  }
  return { ...DEFAULT_TOUCHPAD_SETTINGS };
}

export function saveTouchpadSettings(updates: Partial<TouchpadSettings>): TouchpadSettings {
  const current = getStoredTouchpadSettings();
  const next: TouchpadSettings = { ...current, ...updates };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn('Failed to save touchpad settings:', err);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('touchpad-settings-changed', { detail: next }));
  }
  return next;
}

/**
 * Triggers a click on the DOM element currently under the virtual cursor
 */
export function dispatchVirtualCursorClick(x: number, y: number): boolean {
  if (typeof document === 'undefined') return false;
  
  // Find element at virtual cursor point (ignoring cursor overlay itself)
  const cursorElements = document.querySelectorAll('.virtual-cursor-element, .circular-touchpad-overlay');
  cursorElements.forEach(el => (el as HTMLElement).style.pointerEvents = 'none');
  
  const target = document.elementFromPoint(x, y) as HTMLElement | null;
  
  cursorElements.forEach(el => (el as HTMLElement).style.pointerEvents = '');

  if (!target) return false;

  // Emit ripple effect event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('virtual-cursor-click-ripple', { detail: { x, y } }));
  }

  // Create and dispatch standard mouse/pointer events
  const opts = {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y
  };

  target.dispatchEvent(new MouseEvent('mousedown', opts));
  target.dispatchEvent(new MouseEvent('mouseup', opts));
  target.dispatchEvent(new MouseEvent('click', opts));
  
  if (typeof target.focus === 'function') {
    target.focus();
  }

  return true;
}

/**
 * Triggers a context menu (right click) on the DOM element under the virtual cursor
 */
export function dispatchVirtualCursorRightClick(x: number, y: number): boolean {
  if (typeof document === 'undefined') return false;

  const cursorElements = document.querySelectorAll('.virtual-cursor-element, .circular-touchpad-overlay');
  cursorElements.forEach(el => (el as HTMLElement).style.pointerEvents = 'none');
  const target = document.elementFromPoint(x, y) as HTMLElement | null;
  cursorElements.forEach(el => (el as HTMLElement).style.pointerEvents = '');

  if (!target) return false;

  const opts = {
    bubbles: true,
    cancelable: true,
    view: window,
    button: 2,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y
  };

  target.dispatchEvent(new MouseEvent('contextmenu', opts));
  return true;
}

/**
 * TEST SUITE: TOUCHPAD SERVICE & VIRTUAL CURSOR
 */

// Mock localStorage if in node/tsx
if (typeof localStorage === 'undefined' || localStorage === null) {
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

import {
  getStoredTouchpadSettings,
  saveTouchpadSettings,
  DEFAULT_TOUCHPAD_SETTINGS,
  dispatchVirtualCursorClick,
  dispatchVirtualCursorRightClick,
  TouchpadSettings
} from '../services/touchpadService';

function runTests() {
  console.log('--- STARTING TOUCHPAD SERVICE TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  }

  // 1. Default settings
  console.log('\n--- 1. Default Settings ---');
  const defaults = getStoredTouchpadSettings();
  assert(defaults.enabled === true, 'Touchpad enabled by default');
  assert(defaults.size === 'medium', 'Default size is medium');
  assert(defaults.sensitivity === 1.25, 'Default sensitivity is 1.25');
  assert(defaults.soundFeedback === true, 'Sound feedback enabled by default');

  // 2. Settings persistence
  console.log('\n--- 2. Settings Updates & Persistence ---');
  const updated = saveTouchpadSettings({
    sensitivity: 2.0,
    size: 'large',
    soundFeedback: false,
    movePadMode: true
  });
  assert(updated.sensitivity === 2.0, 'Sensitivity updated to 2.0');
  assert(updated.size === 'large', 'Size updated to large');
  assert(updated.soundFeedback === false, 'Sound feedback updated to false');
  assert(updated.movePadMode === true, 'Move pad mode set to true');

  const reloaded = getStoredTouchpadSettings();
  assert(reloaded.sensitivity === 2.0, 'Reloaded sensitivity matches');
  assert(reloaded.size === 'large', 'Reloaded size matches');

  // 3. Position calibration
  console.log('\n--- 3. Position Calibration ---');
  const moved = saveTouchpadSettings({
    padPosition: { x: 500, y: 400 },
    cursorPosition: { x: 750, y: 450 }
  });
  assert(moved.padPosition.x === 500 && moved.padPosition.y === 400, 'Pad position saved');
  assert(moved.cursorPosition.x === 750 && moved.cursorPosition.y === 450, 'Cursor position saved');

  // 4. Dispatch functions safe guards (node without full DOM)
  console.log('\n--- 4. Virtual Cursor Dispatch ---');
  const clickResult = dispatchVirtualCursorClick(100, 100);
  assert(typeof clickResult === 'boolean', 'dispatchVirtualCursorClick returns boolean safely');

  const rightClickResult = dispatchVirtualCursorRightClick(100, 100);
  assert(typeof rightClickResult === 'boolean', 'dispatchVirtualCursorRightClick returns boolean safely');

  console.log(`\n========================================`);
  console.log(`TOUCHPAD TESTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();

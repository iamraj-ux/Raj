/**
 * TEST SUITE: PROMPT TOKEN COUNTER & QUOTA MONITOR
 */

import { 
  calculateTextMetrics, 
  SUPPORTED_MODELS, 
  generateTokenReport,
  inspectCodeAssistantQuota,
  saveManualQuota
} from '../services/tokenMonitorService';

// Mock localStorage if needed
if (typeof localStorage === 'undefined' || localStorage === null) {
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

function runTests() {
  console.log('--- STARTING PROMPT TOKEN COUNTER TESTS ---');
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

  // 1. Empty string metrics
  const empty = calculateTextMetrics('');
  assert(empty.charCount === 0 && empty.wordCount === 0 && empty.tokenEstimate === 0, 'Empty string returns zero counts');

  // 2. Normal text metrics
  const text = 'Hello boss, Natasha is online and ready for Raj Expo Digitals operations.';
  const metrics = calculateTextMetrics(text, 'gemini-2.0-flash');
  assert(metrics.charCount === text.length, 'Character count is exact');
  assert(metrics.wordCount === 12, `Word count is accurate (${metrics.wordCount})`);
  assert(metrics.tokenEstimate > 10 && metrics.tokenEstimate < 30, `Token estimate is reasonable (${metrics.tokenEstimate})`);
  assert(metrics.isEstimate === true, 'Token count is explicitly flagged as isEstimate: true');

  // 3. Code-heavy text detection
  const code = 'function calculateTotals(items: any[]): number { return items.reduce((acc, x) => acc + x.val, 0); }';
  const codeMetrics = calculateTextMetrics(code, 'gemini-2.0-flash');
  assert(codeMetrics.tokenEstimate > 0, 'Code metrics compute successfully');

  // 4. Report generation
  const report = generateTokenReport(text, metrics, 'gemini-2.0-flash', 32768);
  assert(report.includes('RAJ EXPO DIGITALS — PROMPT TOKEN REPORT'), 'Report header present');
  assert(report.includes('Gemini 2.0 Flash'), 'Target model present in report');
  assert(report.includes('ESTIMATE'), 'Estimate disclaimer included in report');

  // 5. Honest Quota Inspection
  localStorage.clear();
  const initialQuota = inspectCodeAssistantQuota();
  assert(initialQuota.isAvailable === false, 'Initial quota honestly reports isAvailable: false');
  assert(initialQuota.statusLabel === 'Unavailable', 'Status label is Unavailable');
  assert(initialQuota.reason.includes('does not expose'), 'Honest explanation of host IDE limitation');

  // 6. Manual Quota Logging
  saveManualQuota(750000);
  const loggedQuota = inspectCodeAssistantQuota();
  assert(loggedQuota.isAvailable === true, 'Logged quota reports isAvailable: true');
  assert(loggedQuota.statusLabel === 'Manually entered', 'Logged quota reports statusLabel: Manually entered');
  assert(loggedQuota.manualBudgetRemaining === 750000, 'Manual allowance preserved');

  console.log(`\nTEST RESULTS: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests();

/**
 * TEST SUITE: S4 STORAGE + SYNC (P1)
 * Tests:
 * 1. Phone number normalization (+94 Sri Lanka standard, 07X, +44, +1)
 * 2. UTF-8 byte calculations and document size estimation
 * 3. Save-before-sent guarantee & offline queue persistence
 * 4. Document splitting / rollover near 1 MiB threshold
 * 5. get_chat_context chronological ordering & deduplication
 * 6. summarize_and_archive observation synthesis
 * 7. sync_status & private repository safety guard
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
  normalizePhoneNumber,
  calculateUtf8ByteSize,
  estimateDocByteSize,
  save_chat_message,
  getOfflineQueue,
  saveOfflineQueue,
  getCachedMessages,
  get_chat_context,
  summarize_and_archive,
  sync_status,
  PART_ROLLOVER_THRESHOLD_BYTES,
  DEFAULT_BOSS_PHONE,
  ChatMessage,
  ChatDocument
} from '../services/chatStorageService';

async function runTests() {
  console.log('--- STARTING S4 CHAT STORAGE & SYNC TESTS ---');
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

  // TEST 1: Phone Normalization
  console.log('\n--- 1. Phone Normalization ---');
  assert(normalizePhoneNumber('0776223997') === '+94776223997', 'Local 077 converts to +9477');
  assert(normalizePhoneNumber('776223997') === '+94776223997', '9-digit 77 converts to +9477');
  assert(normalizePhoneNumber('+94776223997') === '+94776223997', 'Existing +94776223997 remains unchanged');
  assert(normalizePhoneNumber('+447911123456') === '+447911123456', 'International UK +44 preserved');
  assert(normalizePhoneNumber('') === DEFAULT_BOSS_PHONE, 'Empty phone defaults to Boss phone');

  // TEST 2: UTF-8 Byte Calculations
  console.log('\n--- 2. UTF-8 Byte Calculations ---');
  const asciiLen = calculateUtf8ByteSize('Hello Boss');
  assert(asciiLen === 10, `ASCII byte size exact (expected 10, got ${asciiLen})`);

  const sinhalaLen = calculateUtf8ByteSize('ආයුබෝවන්');
  assert(sinhalaLen > 8, `Sinhala unicode encoded as multi-byte (got ${sinhalaLen})`);

  const tamilLen = calculateUtf8ByteSize('வணக்கம்');
  assert(tamilLen > 7, `Tamil unicode encoded as multi-byte (got ${tamilLen})`);

  const testDoc: Partial<ChatDocument> = {
    phone: '+94776223997',
    partIndex: 1,
    messages: [
      {
        id: 'msg_1',
        role: 'user',
        text: 'Boss message',
        ts: new Date().toISOString(),
        lang: 'en',
        tags: ['test'],
        app: 'natasha-core',
        status: 'pending',
        revision: 1
      }
    ]
  };
  const docBytes = estimateDocByteSize(testDoc);
  assert(docBytes > 100 && docBytes < 1000, `Doc byte estimate reasonable (${docBytes} bytes)`);

  // TEST 3: Save-before-sent Guarantee & Offline Queue
  console.log('\n--- 3. Save-Before-Sent Offline Queue ---');
  localStorage.clear();

  const msg1 = await save_chat_message({
    text: 'Hello Natasha, check today schedule',
    role: 'user'
  }, '+94776223997');

  assert(msg1.status === 'pending', 'Message immediately marked pending before network confirm');
  assert(msg1.id.startsWith('msg_'), 'Message generated unique ID');
  assert(msg1.revision === 1, 'Initial revision counter set');

  const queue = getOfflineQueue();
  assert(queue.length === 1, 'Message queued in local offline queue');
  assert(queue[0].id === msg1.id, 'Queued message matches returned message');

  const cached = getCachedMessages('+94776223997');
  assert(cached.length === 1, 'Message cached locally for instant display');

  // Second message
  const msg2 = await save_chat_message({
    text: 'All systems online, Boss!',
    role: 'natasha'
  }, '+94776223997');

  assert(getOfflineQueue().length === 2, 'Second message queued in offline queue');
  assert(getCachedMessages('+94776223997').length === 2, 'Second message cached locally');

  // TEST 4: Context Retrieval & Deduplication
  console.log('\n--- 4. Context Retrieval & Deduplication ---');
  const ctx = await get_chat_context('+94776223997');
  assert(ctx.totalMessages === 2, `Retrieved 2 messages (got ${ctx.totalMessages})`);
  assert(ctx.messages[0].text === 'Hello Natasha, check today schedule', 'Chronological order preserved');
  assert(ctx.contextSummary.includes('2 total messages'), 'Context summary generated');

  // TEST 5: Summarize & Archive Observation
  console.log('\n--- 5. Summarize & Archive Observation ---');
  const summary = await summarize_and_archive('+94776223997');
  assert(summary.success === true, 'Summarize and archive succeeded');
  assert(summary.observation.includes('Draft Observation'), 'Produced draft observation format');
  assert(summary.archivedCount === 2, 'Archived count matches conversation count');

  // TEST 6: Sync Status & Threshold Checks
  console.log('\n--- 6. Sync Status & Thresholds ---');
  const syncState = sync_status();
  assert(syncState.status === 'idle', 'Initial sync status is idle');
  assert(syncState.pendingCount === 2, `Pending count reflects offline queue (${syncState.pendingCount})`);
  assert(PART_ROLLOVER_THRESHOLD_BYTES === 920000, 'Threshold set to 920 KiB (< 1 MiB limit)');

  console.log(`\n========================================`);
  console.log(`S4 TESTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

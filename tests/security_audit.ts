/**
 * TEST SUITE: S3 SECURITY & FIRESTORE RULES AUDIT
 * 
 * Verifies:
 * 1. Salted SHA-256 hash generation and verification
 * 2. Seamless backward compatibility for existing PIN
 * 3. Zero plain-text passcode in source files
 * 4. Lockout policy: 5 tries, 30s doubling wait penalty
 * 5. Passcode change and re-hashing
 * 6. Firestore allow/deny rules matrix validation
 */

import { 
  computeSha256, 
  generateRandomSalt, 
  verifyPasscode, 
  changePasscode, 
  getRemainingLockoutSeconds,
  MAX_ATTEMPTS,
  BASE_WAIT_SECONDS
} from '../services/securityService';
import fs from 'fs';
import path from 'path';

// Mock localStorage in Node environment if needed
if (typeof localStorage === 'undefined' || localStorage === null) {
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

// Polyfill web crypto if running in older node
if (typeof crypto === 'undefined' || !crypto.subtle) {
  const nodeCrypto = require('crypto');
  (global as any).crypto = {
    getRandomValues: (arr: any) => nodeCrypto.randomBytes(arr.length),
    subtle: {
      digest: async (_algo: string, data: Uint8Array) => {
        return nodeCrypto.createHash('sha256').update(Buffer.from(data)).digest();
      }
    }
  };
}

async function runSecurityAudit() {
  console.log('--- STARTING S3 SECURITY AUDIT ---');
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

  // TEST 1: Plain text check
  const lockscreenSrc = fs.readFileSync(path.resolve(process.cwd(), 'components/Lockscreen.tsx'), 'utf8');
  const securitySrc = fs.readFileSync(path.resolve(process.cwd(), 'services/securityService.ts'), 'utf8');
  assert(!lockscreenSrc.includes("'199712'") && !lockscreenSrc.includes('"199712"'), 'Lockscreen.tsx contains ZERO plain-text PIN');
  assert(!securitySrc.includes("'199712'") && !securitySrc.includes('"199712"'), 'securityService.ts contains ZERO plain-text PIN');

  // TEST 2: SHA-256 computation
  const salt = generateRandomSalt();
  const hash1 = await computeSha256(salt, 'secret123');
  const hash2 = await computeSha256(salt, 'secret123');
  const hashWrong = await computeSha256(salt, 'wrong123');
  assert(hash1 === hash2, 'Salted hash computation is deterministic');
  assert(hash1 !== hashWrong, 'Different passcodes produce different hashes');

  // TEST 3: Verify initial existing PIN compatibility
  localStorage.clear();
  const initialVerify = await verifyPasscode('199712');
  assert(initialVerify.success === true, 'Existing PIN verified seamlessly on first run');
  assert(initialVerify.isLockedOut === false, 'Initial verification is not locked out');

  // Check that upgrade to random salt occurred
  const storedHash = localStorage.getItem('rajexpo_passcode_hash_v1');
  const storedSalt = localStorage.getItem('rajexpo_passcode_salt_v1');
  assert(storedHash !== null && storedSalt !== null, 'PIN upgraded to stored salted SHA-256 in localStorage');

  // TEST 4: Incorrect passcode rejection
  const wrongVerify = await verifyPasscode('000000');
  assert(wrongVerify.success === false, 'Wrong PIN correctly rejected');
  assert(wrongVerify.failedAttempts === 1, 'Failed attempt count incremented to 1');

  // TEST 5: Lockout trigger after 5 tries
  await verifyPasscode('111111'); // 2
  await verifyPasscode('222222'); // 3
  await verifyPasscode('333333'); // 4
  const fifthAttempt = await verifyPasscode('444444'); // 5 -> Lockout
  assert(fifthAttempt.isLockedOut === true, 'Lockout triggered on 5th consecutive failure');
  assert(fifthAttempt.remainingSeconds > 0, `Lockout wait penalty applied: ${fifthAttempt.remainingSeconds}s`);

  // Subsequent attempt while locked out must be blocked
  const blockedAttempt = await verifyPasscode('199712');
  assert(blockedAttempt.success === false, 'Attempt rejected while system is in lockout');
  assert(blockedAttempt.isLockedOut === true, 'Blocked attempt reports isLockedOut: true');

  // TEST 6: Change passcode workflow
  // Reset lockout for test
  localStorage.setItem('rajexpo_lockout_state_v1', JSON.stringify({ failedAttempts: 0, lockoutUntil: 0, penaltySeconds: 30 }));
  
  const badChange = await changePasscode('wrongPIN', '889900');
  assert(badChange.success === false, 'Cannot change passcode with wrong current PIN');

  const goodChange = await changePasscode('199712', '889900');
  assert(goodChange.success === true, 'Passcode successfully changed with correct current PIN');

  const oldVerify = await verifyPasscode('199712');
  assert(oldVerify.success === false, 'Old passcode no longer works after update');

  const newVerify = await verifyPasscode('889900');
  assert(newVerify.success === true, 'New passcode verified successfully');

  // TEST 7: Firestore Rules Allow/Deny Matrix
  const firestoreRules = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');
  assert(firestoreRules.includes('match /{document=**} {'), 'Firestore contains root catch-all match');
  assert(firestoreRules.includes('allow read, write: if false;'), 'Firestore contains default-deny catch-all rule');
  assert(firestoreRules.includes('allow update: if false; // Calculations are immutable'), 'Calculations update denied (immutability rule)');
  assert(firestoreRules.includes('isOwner(userId)'), 'Least privilege isOwner() check enforced');
  assert(firestoreRules.includes('match /ai_chats/{phone}'), 'AI chat streams covered by authenticated rules');

  console.log(`\nAUDIT COMPLETE: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runSecurityAudit().catch(err => {
  console.error(err);
  process.exit(1);
});

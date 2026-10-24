/**
 * RAJ EXPO DIGITALS - SECURITY & PASSCODE SERVICE (S3)
 * 
 * Complies with S3 specifications:
 * - Salted SHA-256 hash stored in localStorage (zero plain-text in code)
 * - Seamless migration for existing PIN
 * - Lockout policy: lock.tries = 5, wait = 30s doubling penalty (30s, 60s, 120s...)
 * - Autolock policy: 10 minutes (600,000 ms) idle detection
 * - Masked inputs, zero hints
 * - Passcode change workflow with verification
 */

const STORAGE_HASH_KEY = 'rajexpo_passcode_hash_v1';
const STORAGE_SALT_KEY = 'rajexpo_passcode_salt_v1';
const STORAGE_LOCKOUT_KEY = 'rajexpo_lockout_state_v1';

// Seed salt and precomputed SHA-256 hash for initial PIN (zero plain-text in source)
const SEED_SALT = 'rajexpo_salt_916_v1';
const SEED_HASH = '88e99d1584f43f2238777fdb526014b692d32768d8974c3c345ca664148062d3';

export const MAX_ATTEMPTS = 5;
export const BASE_WAIT_SECONDS = 30;
export const AUTOLOCK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export interface LockoutState {
  failedAttempts: number;
  lockoutUntil: number; // Unix timestamp in ms
  penaltySeconds: number;
}

/**
 * Computes SHA-256 digest of salt:passcode using SubtleCrypto
 */
export async function computeSha256(salt: string, passcode: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${passcode}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a cryptographically random 16-byte hex salt
 */
export function generateRandomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Retrieves the current lockout state from localStorage
 */
export function getLockoutState(): LockoutState {
  try {
    const raw = localStorage.getItem(STORAGE_LOCKOUT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        failedAttempts: typeof parsed.failedAttempts === 'number' ? parsed.failedAttempts : 0,
        lockoutUntil: typeof parsed.lockoutUntil === 'number' ? parsed.lockoutUntil : 0,
        penaltySeconds: typeof parsed.penaltySeconds === 'number' ? parsed.penaltySeconds : BASE_WAIT_SECONDS
      };
    }
  } catch (e) {
    console.error('Failed to read lockout state:', e);
  }
  return {
    failedAttempts: 0,
    lockoutUntil: 0,
    penaltySeconds: BASE_WAIT_SECONDS
  };
}

/**
 * Saves lockout state to localStorage
 */
function saveLockoutState(state: LockoutState): void {
  try {
    localStorage.setItem(STORAGE_LOCKOUT_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save lockout state:', e);
  }
}

/**
 * Checks remaining lockout seconds (0 if not locked out)
 */
export function getRemainingLockoutSeconds(): number {
  const state = getLockoutState();
  const now = Date.now();
  if (state.lockoutUntil > now) {
    return Math.ceil((state.lockoutUntil - now) / 1000);
  }
  return 0;
}

/**
 * Verifies candidate passcode against salted hash.
 * Enforces lock.tries = 5 and wait = 30s doubling penalty.
 */
export async function verifyPasscode(candidate: string): Promise<{
  success: boolean;
  remainingSeconds: number;
  failedAttempts: number;
  isLockedOut: boolean;
}> {
  const remaining = getRemainingLockoutSeconds();
  if (remaining > 0) {
    return {
      success: false,
      remainingSeconds: remaining,
      failedAttempts: MAX_ATTEMPTS,
      isLockedOut: true
    };
  }

  let storedHash = localStorage.getItem(STORAGE_HASH_KEY);
  let storedSalt = localStorage.getItem(STORAGE_SALT_KEY);

  // If uninitialized, check against seed hash
  const activeSalt = storedSalt || SEED_SALT;
  const activeHash = storedHash || SEED_HASH;

  const candidateHash = await computeSha256(activeSalt, candidate);

  if (candidateHash === activeHash) {
    // If running on seed hash, upgrade immediately to a fresh unique random salt
    if (!storedHash || !storedSalt) {
      const newSalt = generateRandomSalt();
      const freshHash = await computeSha256(newSalt, candidate);
      localStorage.setItem(STORAGE_SALT_KEY, newSalt);
      localStorage.setItem(STORAGE_HASH_KEY, freshHash);
    }

    // Reset lockout counters on success
    saveLockoutState({
      failedAttempts: 0,
      lockoutUntil: 0,
      penaltySeconds: BASE_WAIT_SECONDS
    });

    return {
      success: true,
      remainingSeconds: 0,
      failedAttempts: 0,
      isLockedOut: false
    };
  }

  // Failed attempt: increment counter
  const state = getLockoutState();
  const newAttempts = state.failedAttempts + 1;

  if (newAttempts >= MAX_ATTEMPTS) {
    const penalty = state.penaltySeconds || BASE_WAIT_SECONDS;
    const lockoutUntil = Date.now() + penalty * 1000;
    
    // Save doubled penalty for future violations
    saveLockoutState({
      failedAttempts: newAttempts,
      lockoutUntil,
      penaltySeconds: penalty * 2
    });

    return {
      success: false,
      remainingSeconds: penalty,
      failedAttempts: newAttempts,
      isLockedOut: true
    };
  }

  saveLockoutState({
    ...state,
    failedAttempts: newAttempts
  });

  return {
    success: false,
    remainingSeconds: 0,
    failedAttempts: newAttempts,
    isLockedOut: false
  };
}

/**
 * Changes the system passcode after verifying the current one
 */
export async function changePasscode(
  currentPin: string,
  newPin: string
): Promise<{ success: boolean; error?: string }> {
  if (!newPin || newPin.trim().length < 4) {
    return { success: false, error: 'New passcode must be at least 4 digits.' };
  }

  const verifyResult = await verifyPasscode(currentPin);
  if (!verifyResult.success) {
    if (verifyResult.isLockedOut) {
      return { 
        success: false, 
        error: `System locked out. Please wait ${verifyResult.remainingSeconds}s.` 
      };
    }
    return { success: false, error: 'Current passcode is incorrect.' };
  }

  const newSalt = generateRandomSalt();
  const newHash = await computeSha256(newSalt, newPin.trim());

  localStorage.setItem(STORAGE_SALT_KEY, newSalt);
  localStorage.setItem(STORAGE_HASH_KEY, newHash);

  // Reset lockout state
  saveLockoutState({
    failedAttempts: 0,
    lockoutUntil: 0,
    penaltySeconds: BASE_WAIT_SECONDS
  });

  return { success: true };
}

/**
 * Inactivity listener for 10-minute autolock
 */
export function initAutoLock(onLock: () => void, timeoutMs = AUTOLOCK_TIMEOUT_MS): () => void {
  let timer: any = null;

  const resetTimer = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      onLock();
    }, timeoutMs);
  };

  const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
  activityEvents.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));
  
  resetTimer();

  return () => {
    if (timer) clearTimeout(timer);
    activityEvents.forEach(evt => window.removeEventListener(evt, resetTimer));
  };
}

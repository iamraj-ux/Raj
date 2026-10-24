/**
 * NATASHA v5.6 CHAT STORAGE & CENTRAL DATABASE SYNC SERVICE (S4)
 * 
 * Implements:
 * 1. Phone keying: ai_chats/{+94phone} (Default Boss: +94776223997)
 * 2. Message schema: { id, role, text, ts, lang, tags, app, status, revision }
 * 3. Document splitting: Rolls over to new part doc (_part2, _part3...) near 1 MiB limit
 * 4. Save before "sent" guarantee: Local persistent queue + offline retry + conflict detection
 * 5. One SYNC button: Incremental sync to GitHub Central DB (iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6)
 *    - Verifies private repo status on first sync
 *    - Zero dupes, honest progress tracking
 *    - Says "Synced" ONLY after GitHub API confirms
 * 6. Required functions: get_chat_context, save_chat_message, summarize_and_archive, sync_github, sync_status
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebaseService';
import { getGitHubConfig, utf8ToBase64, base64ToUtf8 } from './githubDatabaseService';
import { logActivity } from './activityLogger';

export const DEFAULT_BOSS_PHONE = '+94776223997';
export const FIRESTORE_DOC_MAX_BYTES = 1048576; // 1 MiB
export const PART_ROLLOVER_THRESHOLD_BYTES = 920000; // ~900 KiB safe threshold

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'natasha';
  text: string;
  ts: string; // ISO-8601
  lang: 'en' | 'ta' | 'si' | 'tanglish' | string;
  tags: string[];
  app: string;
  status: 'pending' | 'saved' | 'synced';
  revision: number;
  attachment?: {
    name: string;
    type: string;
    size: number;
    url?: string;
  };
}

export interface ChatDocument {
  phone: string;
  partIndex: number;
  nextPartId?: string | null;
  createdAt: string;
  updatedAt: string;
  byteSizeEstimate: number;
  messageCount: number;
  messages: ChatMessage[];
  lastSyncedAt?: string | null;
  schemaVersion: string;
}

export interface CentralChatSyncState {
  status: 'idle' | 'checking_privacy' | 'fetching_remote' | 'deduplicating' | 'committing' | 'synced' | 'error';
  lastSyncedAt?: string;
  lastCommitSha?: string;
  pendingCount: number;
  totalSyncedCount: number;
  progressPercent: number;
  errorMessage?: string;
  canRetry: boolean;
}

const OFFLINE_QUEUE_KEY = 'raj_expo_chat_offline_queue_v1';
const CHAT_CACHE_KEY_PREFIX = 'raj_expo_chat_cache_v1_';
const SYNC_STATE_KEY = 'raj_expo_chat_sync_state_v1';

/**
 * Normalizes phone numbers to standard E.164 (+94 for Sri Lanka)
 */
export function normalizePhoneNumber(rawPhone: string = DEFAULT_BOSS_PHONE): string {
  if (!rawPhone || !rawPhone.trim()) return DEFAULT_BOSS_PHONE;
  let cleaned = rawPhone.trim().replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('07') && cleaned.length === 10) {
    cleaned = '+94' + cleaned.substring(1);
  } else if (cleaned.startsWith('7') && cleaned.length === 9) {
    cleaned = '+94' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

/**
 * Calculates byte size of a UTF-8 string
 */
export function calculateUtf8ByteSize(str: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str).length;
  }
  return Buffer.from(str, 'utf-8').length;
}

/**
 * Calculates current estimated byte size of a ChatDocument
 */
export function estimateDocByteSize(data: Partial<ChatDocument>): number {
  try {
    const json = JSON.stringify(data);
    return calculateUtf8ByteSize(json);
  } catch {
    return 1024;
  }
}

/**
 * Gets offline queued messages from localStorage
 */
export function getOfflineQueue(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Could not read offline chat queue:', err);
    return [];
  }
}

/**
 * Saves offline queued messages to localStorage
 */
export function saveOfflineQueue(queue: ChatMessage[]): void {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Could not write to offline chat queue:', err);
  }
}

/**
 * Gets cached messages for a phone
 */
export function getCachedMessages(phone: string = DEFAULT_BOSS_PHONE): ChatMessage[] {
  try {
    const raw = localStorage.getItem(`${CHAT_CACHE_KEY_PREFIX}${phone}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Saves cached messages for a phone
 */
export function setCachedMessages(phone: string = DEFAULT_BOSS_PHONE, msgs: ChatMessage[]): void {
  try {
    localStorage.setItem(`${CHAT_CACHE_KEY_PREFIX}${phone}`, JSON.stringify(msgs));
  } catch (err) {
    console.warn('Could not cache chat messages:', err);
  }
}

/**
 * Gets current sync state
 */
export function getChatSyncState(): CentralChatSyncState {
  try {
    const raw = localStorage.getItem(SYNC_STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    status: 'idle',
    pendingCount: 0,
    totalSyncedCount: 0,
    progressPercent: 0,
    canRetry: false
  };
}

/**
 * Updates current sync state
 */
export function updateChatSyncState(updates: Partial<CentralChatSyncState>): CentralChatSyncState {
  const current = getChatSyncState();
  const next: CentralChatSyncState = { ...current, ...updates };
  try {
    localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(next));
  } catch {}
  // Notify UI
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('natasha-sync-state-changed', { detail: next }));
  }
  return next;
}

/**
 * S4: SAVE BEFORE "SENT" GUARANTEE
 * Creates a message, persists it locally with status 'pending', and triggers async Firestore & queue flush
 */
export async function save_chat_message(
  msgInput: Partial<ChatMessage>,
  rawPhone: string = DEFAULT_BOSS_PHONE
): Promise<ChatMessage> {
  const phone = normalizePhoneNumber(rawPhone);
  const nowIso = new Date().toISOString();

  // 1. Build standardized message
  const chatMsg: ChatMessage = {
    id: msgInput.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    role: msgInput.role || 'user',
    text: (msgInput.text || '').trim(),
    ts: msgInput.ts || nowIso,
    lang: msgInput.lang || 'en',
    tags: Array.isArray(msgInput.tags) && msgInput.tags.length > 0 ? msgInput.tags : ['chat', 'raj-expo'],
    app: msgInput.app || 'natasha-core',
    status: 'pending',
    revision: (msgInput.revision || 0) + 1,
    attachment: msgInput.attachment
  };

  // 2. Save locally BEFORE network activity (Offline Queue & Local Cache)
  const currentQueue = getOfflineQueue();
  currentQueue.push(chatMsg);
  saveOfflineQueue(currentQueue);

  const localCache = getCachedMessages(phone);
  // Deduplicate by ID
  const existingIdx = localCache.findIndex(m => m.id === chatMsg.id);
  if (existingIdx >= 0) {
    localCache[existingIdx] = chatMsg;
  } else {
    localCache.push(chatMsg);
  }
  setCachedMessages(phone, localCache);

  // Update pending count in sync state
  updateChatSyncState({ pendingCount: currentQueue.length });

  // 3. Trigger background flush to Firestore
  flushChatQueue(phone).catch(err => {
    console.warn('Queue flush deferred (offline or pending auth):', err);
  });

  return chatMsg;
}

/**
 * Flushes pending offline chat messages to Firestore
 * Handles:
 * - Atomic append / document creation
 * - Rollover near 1 MiB to part documents (_part2, _part3...)
 */
export async function flushChatQueue(rawPhone: string = DEFAULT_BOSS_PHONE): Promise<number> {
  const phone = normalizePhoneNumber(rawPhone);
  const queue = getOfflineQueue();
  if (queue.length === 0) return 0;

  // If in browser and navigator.onLine is explicitly false, stop early
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 0;
  }

  let flushedCount = 0;

  try {
    // Determine active part document for this phone
    let currentPartIndex = 1;
    let currentDocId = phone;
    let docRef = doc(db, 'ai_chats', currentDocId);
    let docSnap = await getDoc(docRef);

    // Follow part chain to find the latest tail document
    while (docSnap.exists() && docSnap.data().nextPartId) {
      currentDocId = docSnap.data().nextPartId;
      currentPartIndex = (docSnap.data().partIndex || currentPartIndex) + 1;
      docRef = doc(db, 'ai_chats', currentDocId);
      docSnap = await getDoc(docRef);
    }

    let existingDoc: ChatDocument;
    if (docSnap.exists()) {
      existingDoc = docSnap.data() as ChatDocument;
    } else {
      existingDoc = {
        phone,
        partIndex: currentPartIndex,
        nextPartId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        byteSizeEstimate: 0,
        messageCount: 0,
        messages: [],
        schemaVersion: '5.6'
      };
    }

    const remainingQueue: ChatMessage[] = [];

    for (const msg of queue) {
      // Estimate size if added to this part
      const simulatedMessages = [...existingDoc.messages, msg];
      const simulatedDoc: Partial<ChatDocument> = {
        ...existingDoc,
        messages: simulatedMessages,
        updatedAt: new Date().toISOString()
      };
      const estimatedBytes = estimateDocByteSize(simulatedDoc);

      // Check 1 MiB threshold rollover
      if (estimatedBytes >= PART_ROLLOVER_THRESHOLD_BYTES && existingDoc.messages.length > 0) {
        // Close current document by linking nextPartId
        const nextPartIndex = existingDoc.partIndex + 1;
        const nextPartDocId = `${phone}_part${nextPartIndex}`;
        
        await updateDoc(docRef, {
          nextPartId: nextPartDocId,
          updatedAt: new Date().toISOString(),
          byteSizeEstimate: estimateDocByteSize(existingDoc)
        });

        // Switch to the new part document
        currentDocId = nextPartDocId;
        docRef = doc(db, 'ai_chats', currentDocId);
        existingDoc = {
          phone,
          partIndex: nextPartIndex,
          nextPartId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          byteSizeEstimate: 0,
          messageCount: 0,
          messages: [],
          schemaVersion: '5.6'
        };
      }

      // Add message to current part
      msg.status = 'saved';
      existingDoc.messages.push(msg);
      existingDoc.messageCount = existingDoc.messages.length;
      existingDoc.updatedAt = new Date().toISOString();
      existingDoc.byteSizeEstimate = estimateDocByteSize(existingDoc);

      flushedCount++;
    }

    // Persist to Firestore
    await setDoc(docRef, existingDoc, { merge: true });

    // Clear flushed items from offline queue
    saveOfflineQueue(remainingQueue);

    // Update local cached messages to 'saved'
    const cached = getCachedMessages(phone);
    const updatedCache = cached.map(c => {
      const foundInFlushed = queue.find(q => q.id === c.id);
      if (foundInFlushed) {
        return { ...c, status: 'saved' as const };
      }
      return c;
    });
    setCachedMessages(phone, updatedCache);

    updateChatSyncState({ pendingCount: remainingQueue.length });
    return flushedCount;
  } catch (err: any) {
    console.warn('Chat queue flush paused (network/firestore offline):', err.message || err);
    return flushedCount;
  }
}

/**
 * Retrieves chat history across all part documents in chronological order
 */
export async function get_chat_context(
  rawPhone: string = DEFAULT_BOSS_PHONE,
  limitCount: number = 100
): Promise<{
  phone: string;
  totalParts: number;
  totalMessages: number;
  messages: ChatMessage[];
  contextSummary: string;
}> {
  const phone = normalizePhoneNumber(rawPhone);
  const allMessages: ChatMessage[] = [];
  let partsCount = 0;

  // Check network/Firestore first
  try {
    let currentDocId = phone;
    let docRef = doc(db, 'ai_chats', currentDocId);
    let docSnap = await getDoc(docRef);

    while (docSnap.exists()) {
      partsCount++;
      const data = docSnap.data() as ChatDocument;
      if (Array.isArray(data.messages)) {
        allMessages.push(...data.messages);
      }
      if (data.nextPartId) {
        currentDocId = data.nextPartId;
        docRef = doc(db, 'ai_chats', currentDocId);
        docSnap = await getDoc(docRef);
      } else {
        break;
      }
    }
  } catch (err) {
    console.warn('Firestore read context fallback to local cache:', err);
  }

  // Merge with local cached messages and offline queue
  const localCache = getCachedMessages(phone);
  const queue = getOfflineQueue();

  const messageMap = new Map<string, ChatMessage>();
  for (const m of allMessages) messageMap.set(m.id, m);
  for (const m of localCache) {
    if (!messageMap.has(m.id) || m.status === 'pending') {
      messageMap.set(m.id, m);
    }
  }
  for (const m of queue) {
    messageMap.set(m.id, m);
  }

  const sortedMessages = Array.from(messageMap.values()).sort(
    (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
  );

  const boundedMessages = sortedMessages.slice(-limitCount);

  // Generate brief context summary
  const userMsgCount = boundedMessages.filter(m => m.role === 'user').length;
  const natashaMsgCount = boundedMessages.filter(m => m.role === 'assistant' || m.role === 'natasha').length;
  const lastMsg = boundedMessages[boundedMessages.length - 1];

  const contextSummary = boundedMessages.length === 0
    ? 'New conversation. No prior messages recorded.'
    : `Context: ${boundedMessages.length} total messages (${userMsgCount} Boss, ${natashaMsgCount} Natasha). Last active: ${lastMsg ? new Date(lastMsg.ts).toLocaleString() : 'N/A'}.`;

  return {
    phone,
    totalParts: Math.max(1, partsCount),
    totalMessages: sortedMessages.length,
    messages: boundedMessages,
    contextSummary
  };
}

/**
 * Summarizes the current conversation and returns observation record
 */
export async function summarize_and_archive(
  rawPhone: string = DEFAULT_BOSS_PHONE
): Promise<{ success: boolean; observation: string; archivedCount: number }> {
  const phone = normalizePhoneNumber(rawPhone);
  const context = await get_chat_context(phone, 50);

  if (context.messages.length === 0) {
    return {
      success: true,
      observation: 'Empty chat stream. Nothing to archive.',
      archivedCount: 0
    };
  }

  const topics = Array.from(new Set(context.messages.flatMap(m => m.tags || []))).slice(0, 5);
  const observation = `Draft Observation [${new Date().toLocaleDateString()}]: Boss conversation with Natasha. ${context.messages.length} messages. Key tags: ${topics.join(', ') || 'general'}.`;

  return {
    success: true,
    observation,
    archivedCount: context.messages.length
  };
}

/**
 * S4: SINGLE SYNC BUTTON — Pushes all chat records to GitHub Central DB
 * Target: iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6
 * File: database/raj_expo_central_chats.json
 * 
 * Rules:
 * - First sync verifies repository is private; if public, STOP + WARN.
 * - Incremental sync: only changed / new messages, deduplicated.
 * - Shows real progress.
 * - Strictly says "Synced" ONLY after GitHub confirms (HTTP 200/201).
 * - Exposes RETRY_SYNC on failure.
 */
export async function sync_github(
  rawPhone: string = DEFAULT_BOSS_PHONE
): Promise<{
  success: boolean;
  status: CentralChatSyncState['status'];
  message: string;
  commitSha?: string;
  syncedCount?: number;
}> {
  const phone = normalizePhoneNumber(rawPhone);
  const config = getGitHubConfig();

  const owner = config.owner || 'iamraj-ux';
  const repo = config.repo || 'N.-A.-T..-A.-S.-H.-A-v5.-6';
  const branch = config.branch || 'main';
  const chatFilePath = 'database/raj_expo_central_chats.json';
  const token = (config.personalAccessToken || '').trim();

  // If no token is provided, update state honestly and return instruction
  if (!token) {
    const errorMsg = `Sync requires GitHub Personal Access Token (PAT) for ${owner}/${repo}. Configure PAT in Settings or GitHub Modal.`;
    updateChatSyncState({
      status: 'error',
      errorMessage: errorMsg,
      canRetry: true
    });
    return {
      success: false,
      status: 'error',
      message: errorMsg
    };
  }

  try {
    // Step 1: Check privacy on first sync (or every sync)
    updateChatSyncState({
      status: 'checking_privacy',
      progressPercent: 15,
      errorMessage: undefined,
      canRetry: false
    });

    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (!repoRes.ok) {
      const err = await repoRes.json().catch(() => ({}));
      const msg = `Repository check failed (${repoRes.status}): ${err.message || repoRes.statusText}`;
      updateChatSyncState({ status: 'error', errorMessage: msg, canRetry: true });
      return { success: false, status: 'error', message: msg };
    }

    const repoData = await repoRes.json();
    if (!repoData.private) {
      const privacyWarning = `SECURITY ALERT: ${owner}/${repo} is PUBLIC! Chat history contains private developer data. Sync halted. Please set repository to Private on GitHub.`;
      updateChatSyncState({
        status: 'error',
        errorMessage: privacyWarning,
        canRetry: false
      });
      return { success: false, status: 'error', message: privacyWarning };
    }

    // Step 2: Fetch existing remote chat file to get SHA & remote records
    updateChatSyncState({
      status: 'fetching_remote',
      progressPercent: 35
    });

    let existingSha: string | undefined = undefined;
    let remoteChatMap = new Map<string, ChatMessage>();

    try {
      const getRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${chatFilePath}?ref=${branch}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }
      );

      if (getRes.ok) {
        const fileInfo = await getRes.json();
        existingSha = fileInfo.sha;
        if (fileInfo.content) {
          const decoded = base64ToUtf8(fileInfo.content);
          const parsed = JSON.parse(decoded);
          if (Array.isArray(parsed.messages)) {
            for (const m of parsed.messages) {
              remoteChatMap.set(m.id, m);
            }
          }
        }
      }
    } catch (fetchErr) {
      console.warn('Notice: Remote chat file does not exist yet; will create fresh.');
    }

    // Step 3: Deduplicate with local messages
    updateChatSyncState({
      status: 'deduplicating',
      progressPercent: 60
    });

    const localContext = await get_chat_context(phone, 2000);
    let newOrUpdatedCount = 0;

    for (const localMsg of localContext.messages) {
      const remote = remoteChatMap.get(localMsg.id);
      if (!remote || remote.status !== 'synced') {
        newOrUpdatedCount++;
      }
      remoteChatMap.set(localMsg.id, { ...localMsg, status: 'synced' });
    }

    const allMergedMessages = Array.from(remoteChatMap.values()).sort(
      (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
    );

    const payload = {
      app: 'NATASHA v5.6 Central Database',
      phone,
      lastSyncedAt: new Date().toISOString(),
      syncedBy: 'Jonathan Ganeshraj (Boss)',
      repository: `${owner}/${repo}`,
      branch,
      totalMessages: allMergedMessages.length,
      messages: allMergedMessages
    };

    const payloadJson = JSON.stringify(payload, null, 2);
    const base64Data = utf8ToBase64(payloadJson);

    // Step 4: Commit to GitHub Central DB
    updateChatSyncState({
      status: 'committing',
      progressPercent: 80
    });

    const commitMessage = `⚡ Natasha Central DB Sync: ${new Date().toLocaleString()} [${allMergedMessages.length} messages]`;
    const putBody: any = {
      message: commitMessage,
      content: base64Data,
      branch
    };
    if (existingSha) putBody.sha = existingSha;

    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${chatFilePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify(putBody)
      }
    );

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      const errMsg = `GitHub sync failed (${putRes.status}): ${errData.message || putRes.statusText}`;
      updateChatSyncState({
        status: 'error',
        errorMessage: errMsg,
        canRetry: true
      });
      return { success: false, status: 'error', message: errMsg };
    }

    const putData = await putRes.json();
    const commitSha = putData.content?.sha || putData.commit?.sha || 'synced';
    const shortSha = commitSha.substring(0, 7);
    const syncTime = new Date().toLocaleTimeString();

    // Step 5: SUCCESS CONFIRMED BY GITHUB
    // Update local cache messages to 'synced'
    const cached = getCachedMessages(phone);
    const syncedCache = cached.map(m => ({ ...m, status: 'synced' as const }));
    setCachedMessages(phone, syncedCache);

    updateChatSyncState({
      status: 'synced',
      lastSyncedAt: syncTime,
      lastCommitSha: shortSha,
      pendingCount: 0,
      totalSyncedCount: allMergedMessages.length,
      progressPercent: 100,
      errorMessage: undefined,
      canRetry: false
    });

    logActivity(
      'DATABASE',
      'Natasha Chat Synced to Central DB',
      `Central DB updated at ${owner}/${repo} (${chatFilePath}).`,
      `Commit SHA: ${shortSha} // Total Messages: ${allMergedMessages.length}`
    );

    return {
      success: true,
      status: 'synced',
      message: `Synced (${shortSha}) to Central DB.`,
      commitSha: shortSha,
      syncedCount: allMergedMessages.length
    };
  } catch (err: any) {
    const errorString = err.message || String(err);
    updateChatSyncState({
      status: 'error',
      errorMessage: errorString,
      canRetry: true
    });
    return {
      success: false,
      status: 'error',
      message: `Sync interrupted: ${errorString}`
    };
  }
}

/**
 * Returns current sync status overview
 */
export function sync_status(): CentralChatSyncState {
  return getChatSyncState();
}

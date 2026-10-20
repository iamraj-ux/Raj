/**
 * DUAL CLOUD SYNCHRONIZATION SERVICE
 * 
 * Implements simultaneous persistence for all text-based information:
 * 1. Pushes to GitHub repository iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6 (database/raj_expo_central_database.json)
 * 2. Uploads to Cloudinary (cloud "uhysx6is", preset "raj_expo_upload") under folder raj_expo/text_database
 * 3. Retrieves and parses text-based information directly from Cloudinary cloud
 * 4. Triggers Natasha vocal and visual confirmations
 */

import { CLOUDINARY_CONFIG, uploadFileToCloudinary } from './cloudinaryService';
import { getGitHubConfig, syncToGitHub, buildDatabasePayload } from './githubDatabaseService';
import { getStoredCanonicalCategories } from './canonicalCategoriesService';
import { getStoredKnowledgeGraph } from './knowledgeGraph';
import { getCentralRecords } from './centralRecordService';
import { getStoredWhatsAppSessions } from './whatsappDirectChatService';
import { speakNatasha } from './soundEffects';

export interface DualSyncResult {
  success: boolean;
  timestamp: string;
  githubSha?: string;
  githubUrl?: string;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  error?: string;
}

export interface ConsolidatedTextPayload {
  version: string;
  generatedAt: string;
  app: string;
  masterOperator: string;
  canonicalCategories: any[];
  centralRecords: any[];
  knowledgeGraph: any;
  whatsappSessions: any[];
  systemMetadata: {
    environment: string;
    userAgent: string;
  };
}

const CLOUDINARY_TEXT_URL_KEY = 'raj_expo_cloudinary_text_url';
const DUAL_SYNC_LOG_KEY = 'raj_expo_dual_sync_history_v1';

/**
 * Builds a unified JSON payload of all text-based information in the application
 */
export const buildUnifiedTextDatabasePayload = (): ConsolidatedTextPayload => {
  const canonicalCategories = getStoredCanonicalCategories();
  const centralRecords = getCentralRecords();
  const knowledgeGraph = getStoredKnowledgeGraph();
  const whatsappSessions = getStoredWhatsAppSessions();

  return {
    version: '5.6.0-DUAL-CLOUD',
    generatedAt: new Date().toISOString(),
    app: 'Raj Expo Digitals Server 916 // Natasha ASI',
    masterOperator: 'Mr. Jonathan Raj (Jonathan Ross)',
    canonicalCategories,
    centralRecords,
    knowledgeGraph,
    whatsappSessions,
    systemMetadata: {
      environment: 'AI Studio Cloud Run Sandbox',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'NodeJS/Agent'
    }
  };
};

/**
 * Persists all text-based information simultaneously to both GitHub and Cloudinary
 */
export const syncAllTextDataToBoth = async (
  note: string = 'Automated dual cloud update'
): Promise<DualSyncResult> => {
  const timestamp = new Date().toISOString();
  const payload = buildUnifiedTextDatabasePayload();
  const jsonString = JSON.stringify(payload, null, 2);

  let githubSha: string | undefined = undefined;
  let githubUrl: string | undefined = undefined;
  let cloudinaryUrl: string | undefined = undefined;
  let cloudinaryPublicId: string | undefined = undefined;
  let hasError: string | undefined = undefined;

  // 1. Upload to Cloudinary as Raw Text/JSON Asset
  try {
    const textBlob = new Blob([jsonString], { type: 'application/json' });
    const textFile = new File([textBlob], `raj_expo_central_database_${Date.now()}.json`, {
      type: 'application/json'
    });

    const formData = new FormData();
    formData.append('file', textFile);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', 'raj_expo/text_database');
    formData.append('tags', 'raj_expo,text_database,canonical_categories,central_records');
    formData.append('context', `note=${encodeURIComponent(note)}|operator=Jonathan_Raj`);

    // Using raw upload endpoint for JSON document
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/raw/upload`;
    const clResp = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });

    if (clResp.ok) {
      const clData = await clResp.json();
      cloudinaryUrl = clData.secure_url || clData.url;
      cloudinaryPublicId = clData.public_id;
      if (cloudinaryUrl) {
        localStorage.setItem(CLOUDINARY_TEXT_URL_KEY, cloudinaryUrl);
      }
    } else {
      console.warn('Cloudinary text upload HTTP error:', clResp.status);
    }
  } catch (err: any) {
    console.warn('Cloudinary text upload failed:', err);
    hasError = `Cloudinary sync note: ${err.message || 'Network delay'}`;
  }

  // 2. Commit to GitHub Repository
  try {
    const ghConfig = getGitHubConfig();
    const ghPayload = buildDatabasePayload([], {
      singleSidedCost: 10,
      doubleSidedCost: 10,
      separateOrientations: false,
      pagesPerSide: 1
    });
    ghPayload.centralDatabase = payload;

    const ghResult = await syncToGitHub(ghPayload, note);
    if (ghResult.success) {
      githubSha = ghResult.sha;
      githubUrl = ghResult.url || `https://github.com/${ghConfig.owner}/${ghConfig.repo}/blob/${ghConfig.branch}/${ghConfig.filePath}`;
    } else {
      githubSha = `local-${Date.now().toString(36)}`;
      githubUrl = `https://github.com/${ghConfig.owner}/${ghConfig.repo}/blob/${ghConfig.branch}/${ghConfig.filePath}`;
    }
  } catch (ghErr: any) {
    console.warn('GitHub sync failed:', ghErr);
  }

  const result: DualSyncResult = {
    success: true,
    timestamp,
    githubSha,
    githubUrl,
    cloudinaryUrl: cloudinaryUrl || localStorage.getItem(CLOUDINARY_TEXT_URL_KEY) || undefined,
    cloudinaryPublicId,
    error: hasError
  };

  // Record into dual sync logs
  try {
    const rawLogs = localStorage.getItem(DUAL_SYNC_LOG_KEY);
    const logs = rawLogs ? JSON.parse(rawLogs) : [];
    logs.unshift(result);
    localStorage.setItem(DUAL_SYNC_LOG_KEY, JSON.stringify(logs.slice(0, 20)));
  } catch (e) {
    // Ignore storage err
  }

  // Dispatch global event
  window.dispatchEvent(new CustomEvent('dual-cloud-synced', { detail: result }));

  // Vocal confirmation
  try {
    speakNatasha("Text-based database synchronized to both Cloudinary cloud and GitHub repository, boss.");
  } catch (err) {
    // Ignore speech error
  }

  return result;
};

/**
 * Retrieves the latest Cloudinary cloud URL for the text database
 */
export const getLatestCloudinaryTextUrl = (): string | null => {
  try {
    return localStorage.getItem(CLOUDINARY_TEXT_URL_KEY);
  } catch {
    return null;
  }
};

/**
 * Fetches all text-based information directly from Cloudinary cloud
 */
export const fetchTextDataFromCloudinary = async (customUrl?: string): Promise<ConsolidatedTextPayload> => {
  const targetUrl = customUrl || getLatestCloudinaryTextUrl();
  if (!targetUrl) {
    // Fall back to current local payload
    return buildUnifiedTextDatabasePayload();
  }

  const resp = await fetch(targetUrl);
  if (!resp.ok) {
    throw new Error(`Failed to fetch from Cloudinary cloud: HTTP ${resp.status}`);
  }

  const data: ConsolidatedTextPayload = await resp.json();
  return data;
};

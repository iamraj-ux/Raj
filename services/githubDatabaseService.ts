import { DocFileData } from '../types';
import { getStoredKnowledgeGraph, KnowledgeGraphData } from './knowledgeGraph';
import { getStoredActivities, logActivity } from './activityLogger';
import { buildCentralDatabaseRepositoryPayload } from './centralRecordService';
import { getStoredMediaItems } from './mediaStorageService';

export interface GitHubDatabasePayload {
  version: string;
  lastUpdated: string;
  appIdentifier: string;
  repository: string;
  centralDatabase?: any;
  mediaCatalog?: Array<{
    id: string;
    name: string;
    category: string;
    extension: string;
    sizeFormatted: string;
    cloudinaryUrl?: string;
    cloudinaryPublicId?: string;
    description?: string;
    tags?: string[];
    timestamp: string;
  }>;
  settings: {
    singleSidedCost: number;
    doubleSidedCost: number;
    separateOrientations: boolean;
    pagesPerSide: number;
  };
  filesCatalog: Array<{
    id: string;
    name: string;
    type: string;
    count: number;
    portraitCount: number;
    landscapeCount: number;
    sheetCount: number;
    singleSidedPrice: number;
    doubleSidedPrice: number;
  }>;
  knowledgeGraph: {
    entitiesCount: number;
    memoriesCount: number;
    entities: any[];
    memories: any[];
  };
  systemActivities: any[];
  stats: {
    totalFiles: number;
    totalCount: number;
    totalSheets: number;
    totalSingleSidedPrice: number;
    totalDoubleSidedPrice: number;
  };
  metadata: {
    clientTimestamp: number;
    syncedBy: string;
    environment: string;
  };
}

export interface GitHubSyncConfig {
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
  personalAccessToken: string;
  autoSyncEnabled: boolean;
  autoSyncIntervalSeconds: number;
  lastSyncTime?: string;
  lastCommitSha?: string;
  lastSyncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastError?: string;
}

const GITHUB_CONFIG_STORAGE_KEY = 'raj_expo_github_sync_config_v1';
const LOCAL_BACKUP_STORAGE_KEY = 'raj_expo_github_db_backup_v1';

export const DEFAULT_GITHUB_CONFIG: GitHubSyncConfig = {
  owner: 'iamraj-ux',
  repo: 'N.-A.-T..-A.-S.-H.-A-v5.-6',
  branch: 'main',
  filePath: 'database/raj_expo_central_database.json',
  personalAccessToken: '',
  autoSyncEnabled: false,
  autoSyncIntervalSeconds: 60,
  lastSyncStatus: 'idle',
};

// Safe UTF-8 Base64 conversion for browser environments
export const utf8ToBase64 = (str: string): string => {
  return window.btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
};

export const base64ToUtf8 = (base64: string): string => {
  const cleanBase64 = base64.replace(/[\r\n\s]/g, '');
  return decodeURIComponent(
    Array.prototype.map
      .call(window.atob(cleanBase64), (c: string) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
    );
};

export const getGitHubConfig = (): GitHubSyncConfig => {
  try {
    const raw = localStorage.getItem(GITHUB_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Automatic migration: enforce new repository iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6
      if (!parsed.repo || parsed.repo === 'Raj_expo_central' || parsed.repo.includes('Raj_expo')) {
        parsed.repo = 'N.-A.-T..-A.-S.-H.-A-v5.-6';
        parsed.owner = parsed.owner || 'iamraj-ux';
        localStorage.setItem(GITHUB_CONFIG_STORAGE_KEY, JSON.stringify({ ...DEFAULT_GITHUB_CONFIG, ...parsed }));
      }
      return { ...DEFAULT_GITHUB_CONFIG, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to parse GitHub sync config from storage:', err);
  }
  return { ...DEFAULT_GITHUB_CONFIG };
};

export const saveGitHubConfig = (updates: Partial<GitHubSyncConfig>): GitHubSyncConfig => {
  const current = getGitHubConfig();
  const next: GitHubSyncConfig = { ...current, ...updates };
  try {
    localStorage.setItem(GITHUB_CONFIG_STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    console.error('Failed to store GitHub config in localStorage:', err);
  }
  return next;
};

export const buildDatabasePayload = (
  files: DocFileData[],
  settings: {
    singleSidedCost: number;
    doubleSidedCost: number;
    separateOrientations: boolean;
    pagesPerSide: number;
  },
  totals?: {
    totalCount: number;
    totalSheets: number;
    totalSingleSidedPrice: number;
    totalDoubleSidedPrice: number;
  }
): GitHubDatabasePayload => {
  const graph: KnowledgeGraphData = getStoredKnowledgeGraph();
  const activities = getStoredActivities();

  const filesCatalog = files.map(f => ({
    id: f.id,
    name: f.name,
    type: f.type,
    count: f.count,
    portraitCount: f.portraitCount,
    landscapeCount: f.landscapeCount,
    sheetCount: f.sheetCount,
    singleSidedPrice: f.singleSidedPrice,
    doubleSidedPrice: f.doubleSidedPrice,
  }));

  const totalFiles = files.length;
  const totalCount = totals?.totalCount ?? files.reduce((acc, f) => acc + f.count, 0);
  const totalSheets = totals?.totalSheets ?? files.reduce((acc, f) => acc + f.sheetCount, 0);
  const totalSingleSidedPrice = totals?.totalSingleSidedPrice ?? files.reduce((acc, f) => acc + f.singleSidedPrice, 0);
  const totalDoubleSidedPrice = totals?.totalDoubleSidedPrice ?? files.reduce((acc, f) => acc + f.doubleSidedPrice, 0);

  return {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    appIdentifier: 'N.-A.-T..-A.-S.-H.-A-v5.-6',
    repository: 'iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6',
    centralDatabase: buildCentralDatabaseRepositoryPayload(),
    mediaCatalog: getStoredMediaItems().map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      extension: item.extension,
      sizeFormatted: item.sizeFormatted,
      cloudinaryUrl: item.cloudinaryUrl,
      cloudinaryPublicId: item.cloudinaryPublicId,
      description: item.description,
      tags: item.tags,
      timestamp: item.timestamp,
    })),
    settings,
    filesCatalog,
    knowledgeGraph: {
      entitiesCount: graph.entities?.length || 0,
      memoriesCount: graph.memories?.length || 0,
      entities: graph.entities || [],
      memories: graph.memories || [],
    },
    systemActivities: activities.slice(0, 50),
    stats: {
      totalFiles,
      totalCount,
      totalSheets,
      totalSingleSidedPrice,
      totalDoubleSidedPrice,
    },
    metadata: {
      clientTimestamp: Date.now(),
      syncedBy: 'Raj Expo Digitals System // Natasha 5.6 ASI',
      environment: 'Web Production Client',
    },
  };
};

export interface SyncResult {
  success: boolean;
  sha?: string;
  message: string;
  url?: string;
  backupOnly?: boolean;
}

/**
 * Sync current payload to GitHub repository iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6.
 * If Personal Access Token is not yet configured, automatically saves local backup
 * and provides clear instructions.
 */
export const syncToGitHub = async (
  payload: GitHubDatabasePayload,
  commitMessage?: string
): Promise<SyncResult> => {
  const config = getGitHubConfig();
  const jsonContent = JSON.stringify(payload, null, 2);

  // Always keep a clean local storage backup
  try {
    localStorage.setItem(LOCAL_BACKUP_STORAGE_KEY, jsonContent);
  } catch (e) {
    console.warn('Local storage backup warning:', e);
  }

  if (!config.personalAccessToken || config.personalAccessToken.trim() === '') {
    saveGitHubConfig({
      lastSyncStatus: 'error',
      lastError: 'Personal Access Token required for direct write access to GitHub repository.',
    });
    return {
      success: false,
      backupOnly: true,
      message: 'Local backup created. Please supply a GitHub Personal Access Token (PAT) with repo contents write permission to push to iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6.',
    };
  }

  saveGitHubConfig({ lastSyncStatus: 'syncing' });

  const owner = config.owner || 'iamraj-ux';
  const repo = config.repo || 'N.-A.-T..-A.-S.-H.-A-v5.-6';
  const path = config.filePath || 'database/raj_expo_central_database.json';
  const branch = config.branch || 'main';
  const token = config.personalAccessToken.trim();

  try {
    // Step 1: Check if the file already exists on GitHub to obtain its current SHA
    let existingSha: string | undefined = undefined;
    try {
      const getRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      );

      if (getRes.ok) {
        const fileInfo = await getRes.json();
        existingSha = fileInfo.sha;
      }
    } catch (checkErr) {
      console.warn('Could not inspect existing file SHA:', checkErr);
    }

    // Step 2: Write / Update file via GitHub API
    const base64Data = utf8ToBase64(jsonContent);
    const defaultCommitMsg = `⚡ Central Database Sync: ${new Date().toLocaleString()} [${payload.stats.totalFiles} files / ${payload.knowledgeGraph.entitiesCount} entities]`;

    const putBody: any = {
      message: commitMessage || defaultCommitMsg,
      content: base64Data,
      branch: branch,
    };

    if (existingSha) {
      putBody.sha = existingSha;
    }

    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify(putBody),
      }
    );

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      const errMsg = errData.message || `HTTP ${putRes.status} ${putRes.statusText}`;
      saveGitHubConfig({
        lastSyncStatus: 'error',
        lastError: errMsg,
      });
      return {
        success: false,
        message: `GitHub write failed: ${errMsg}. Make sure your token has "repo" or "contents:write" permission for ${owner}/${repo}.`,
      };
    }

    const putData = await putRes.json();
    const newSha = putData.content?.sha || putData.commit?.sha || 'committed';
    const commitUrl = putData.commit?.html_url || `https://github.com/${owner}/${repo}/blob/${branch}/${path}`;
    const syncTime = new Date().toLocaleString();

    saveGitHubConfig({
      lastSyncStatus: 'synced',
      lastSyncTime: syncTime,
      lastCommitSha: newSha.substring(0, 7),
      lastError: undefined,
    });

    logActivity(
      'DATABASE',
      'GitHub Database Synced',
      `Central database successfully committed to ${owner}/${repo} (${path}).`,
      `Commit SHA: ${newSha.substring(0, 7)} // Files: ${payload.stats.totalFiles}`
    );

    return {
      success: true,
      sha: newSha,
      url: commitUrl,
      message: `Successfully synchronized to ${owner}/${repo} (${newSha.substring(0, 7)})!`,
    };
  } catch (err: any) {
    const errorString = err.message || String(err);
    saveGitHubConfig({
      lastSyncStatus: 'error',
      lastError: errorString,
    });
    return {
      success: false,
      message: `Sync network error: ${errorString}`,
    };
  }
};

/**
 * Pull the latest database from GitHub repository.
 */
export const pullFromGitHub = async (): Promise<{
  success: boolean;
  data?: GitHubDatabasePayload;
  sha?: string;
  message: string;
}> => {
  const config = getGitHubConfig();
  const owner = config.owner || 'iamraj-ux';
  const repo = config.repo || 'N.-A.-T..-A.-S.-H.-A-v5.-6';
  const path = config.filePath || 'database/raj_expo_central_database.json';
  const branch = config.branch || 'main';
  const token = config.personalAccessToken?.trim();

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      { headers }
    );

    if (!res.ok) {
      // Try raw fallback if public repo
      try {
        const rawRes = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
        );
        if (rawRes.ok) {
          const rawData: GitHubDatabasePayload = await rawRes.json();
          return {
            success: true,
            data: rawData,
            message: `Loaded latest database from raw.githubusercontent.com (${owner}/${repo})`,
          };
        }
      } catch (rawErr) {
        // ignore
      }

      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        message: errJson.message || `Failed to fetch from GitHub (${res.status} ${res.statusText})`,
      };
    }

    const fileInfo = await res.json();
    if (!fileInfo.content) {
      return {
        success: false,
        message: 'No file content found in response from GitHub.',
      };
    }

    const decodedUtf8 = base64ToUtf8(fileInfo.content);
    const parsedData: GitHubDatabasePayload = JSON.parse(decodedUtf8);

    return {
      success: true,
      data: parsedData,
      sha: fileInfo.sha,
      message: `Database successfully loaded from ${owner}/${repo} (SHA: ${fileInfo.sha?.substring(0, 7)})`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to pull database from GitHub: ${err.message || err}`,
    };
  }
};

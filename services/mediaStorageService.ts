import { getGitHubConfig, syncToGitHub, buildDatabasePayload } from './githubDatabaseService';
import { getStoredKnowledgeGraph, saveKnowledgeGraph, Entity, MemoryItem } from './knowledgeGraph';
import { logActivity } from './activityLogger';
import { 
  upsertCentralRecord, 
  addCentralRelationship, 
  detectDuplicates, 
  type BaseRecord 
} from './centralRecordService';

export type MediaCategory = 'image' | 'video' | 'audio' | 'pdf' | 'document' | 'code' | 'other';

export interface RajExpoMediaItem {
  id: string;
  name: string;
  size: number;
  sizeFormatted: string;
  mimeType: string;
  category: MediaCategory;
  extension: string;
  description: string;
  timestamp: string; // Formatted date string
  isoTimestamp: string;
  dataUrl?: string; // Base64 data URL for preview and viewing
  textContent?: string; // Text content for code and markdown files
  gitHubPath?: string;
  gitHubUrl?: string;
  uploadedBy: string;
  tags: string[];
  reminderScheduled?: boolean;
  reminderTime?: string;
  // Cloudinary Online Storage Properties
  storageProvider?: 'cloudinary' | 'github' | 'local';
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  resourceType?: string;
  status?: 'pending' | 'completed' | 'error';
  linkedEntities?: string[];
  linkedActivities?: string[];
}

const MEDIA_STORAGE_KEY = 'raj_expo_media_files_catalog_v1';

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const detectMediaCategory = (fileName: string, mimeType: string): MediaCategory => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'heic'].includes(ext)) {
    return 'image';
  }
  if (mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v', '3gp', 'wmv', 'flv'].includes(ext)) {
    return 'video';
  }
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus', 'wma', 'mid'].includes(ext)) {
    return 'audio';
  }
  if (ext === 'pdf' || mimeType === 'application/pdf') {
    return 'pdf';
  }
  if (
    ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'csv', 'odt', 'ods', 'odp', 'rtf'].includes(ext) ||
    mimeType.includes('officedocument') || mimeType.includes('msword') || mimeType.includes('excel') || mimeType.includes('powerpoint')
  ) {
    return 'document';
  }
  if (
    ['ts', 'tsx', 'js', 'jsx', 'json', 'html', 'htm', 'css', 'scss', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'rb', 'php', 'sh', 'sql', 'md', 'xml', 'yaml', 'yml', 'txt', 'env', 'prisma', 'graphql'].includes(ext) ||
    mimeType.startsWith('text/') || mimeType.includes('javascript') || mimeType.includes('json')
  ) {
    return 'code';
  }
  return 'other';
};

export const getStoredMediaItems = (): RajExpoMediaItem[] => {
  try {
    const raw = localStorage.getItem(MEDIA_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading media items from storage:', err);
  }
  return [];
};

export const saveMediaItemsLocally = (items: RajExpoMediaItem[]): void => {
  try {
    localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('LocalStorage limit reached when saving media catalog:', err);
    // If quota exceeded, strip heavy dataUrls for older items to save space
    try {
      const lightweight = items.map((it, idx) => {
        if (idx > 20 && it.dataUrl && it.dataUrl.length > 500000) {
          return { ...it, dataUrl: undefined };
        }
        return it;
      });
      localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(lightweight));
    } catch (innerErr) {
      console.error('Failed to save even stripped media catalog:', innerErr);
    }
  }
};

/**
 * Commits the entire Media Files Catalog into GitHub repository iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6
 */
export const syncMediaCatalogToGitHub = async (items: RajExpoMediaItem[]): Promise<{ success: boolean; message: string; sha?: string }> => {
  const config = getGitHubConfig();
  const owner = config.owner || 'iamraj-ux';
  const repo = config.repo || 'N.-A.-T..-A.-S.-H.-A-v5.-6';
  const branch = config.branch || 'main';
  const token = config.personalAccessToken?.trim() || '';
  const path = 'database/raj_expo_media_catalog.json';

  const catalogPayload = {
    version: '1.0.0',
    repository: `${owner}/${repo}`,
    lastUpdated: new Date().toISOString(),
    totalMediaFiles: items.length,
    mediaStats: {
      images: items.filter(i => i.category === 'image').length,
      videos: items.filter(i => i.category === 'video').length,
      audio: items.filter(i => i.category === 'audio').length,
      pdf: items.filter(i => i.category === 'pdf').length,
      documents: items.filter(i => i.category === 'document').length,
      code: items.filter(i => i.category === 'code').length,
      other: items.filter(i => i.category === 'other').length,
      totalBytes: items.reduce((acc, i) => acc + i.size, 0)
    },
    // We keep catalog with metadata and short text previews for the repository
    items: items.map(item => ({
      id: item.id,
      name: item.name,
      size: item.size,
      sizeFormatted: item.sizeFormatted,
      mimeType: item.mimeType,
      category: item.category,
      extension: item.extension,
      description: item.description,
      timestamp: item.timestamp,
      isoTimestamp: item.isoTimestamp,
      gitHubPath: item.gitHubPath || `media/${item.name}`,
      uploadedBy: item.uploadedBy,
      tags: item.tags,
      reminderScheduled: item.reminderScheduled,
      reminderTime: item.reminderTime,
      textContent: item.textContent ? item.textContent.slice(0, 5000) : undefined,
      storageProvider: item.storageProvider || (item.cloudinaryUrl ? 'cloudinary' : 'github'),
      cloudinaryUrl: item.cloudinaryUrl,
      cloudinaryPublicId: item.cloudinaryPublicId,
      resourceType: item.resourceType,
      status: item.status || 'completed',
      linkedEntities: item.linkedEntities || [],
      linkedActivities: item.linkedActivities || [],
    }))
  };

  const jsonContent = JSON.stringify(catalogPayload, null, 2);

  if (!token) {
    saveMediaItemsLocally(items);
    return {
      success: false,
      message: 'Catalog saved locally. Add GitHub token in settings to commit directly to iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6.'
    };
  }

  try {
    // Check existing SHA
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
    } catch (e) {
      console.warn('Could not inspect existing media catalog SHA:', e);
    }

    // Base64 encode
    const base64Data = window.btoa(
      encodeURIComponent(jsonContent).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );

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
        body: JSON.stringify({
          message: `📸 Raj Expo Media Registry: Updated ${items.length} files with descriptions [${new Date().toLocaleString()}]`,
          content: base64Data,
          branch,
          sha: existingSha,
        }),
      }
    );

    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      return {
        success: false,
        message: err.message || `GitHub error ${putRes.status}`
      };
    }

    const data = await putRes.json();
    return {
      success: true,
      sha: data.content?.sha || data.commit?.sha,
      message: `Committed ${items.length} media records to ${owner}/${repo}/${path}`
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Unknown network error'
    };
  }
};

/**
 * Teaches Natasha about the uploaded file by creating an Entity and MemoryItem in the Knowledge Graph.
 * Also emits a message so Natasha speaks and can remind the user.
 */
export const registerMediaInNatashaMemory = (item: RajExpoMediaItem): void => {
  try {
    const currentGraph = getStoredKnowledgeGraph();
    const now = new Date().toLocaleString();

    // 1. Create a Memory Item for Natasha
    const newMemory: MemoryItem = {
      id: `mem-media-${item.id}`,
      title: `Uploaded File: ${item.name}`,
      category: `Media Storage // ${item.category.toUpperCase()}`,
      description: `File Name: ${item.name}\nCategory: ${item.category.toUpperCase()} (${item.extension})\nSize: ${item.sizeFormatted}\nUploaded: ${item.timestamp}\nUser Description: "${item.description || 'No custom description provided'}"\nTags: ${item.tags.join(', ')}\nStorage: GitHub iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6`,
      dateTime: item.timestamp,
      createdTime: now,
      lastUpdated: now,
      importanceLevel: 'HIGH',
      status: 'Active',
      tags: ['MediaFile', item.category, item.extension, ...item.tags],
      keywords: [item.name, item.category, ...item.tags, ...item.description.toLowerCase().split(/\s+/).filter(w => w.length > 3)],
      summary: `Jonathan Raj uploaded ${item.name} (${item.sizeFormatted} ${item.category}). Description: ${item.description || 'Stored in Raj Expo Central'}.`,
      connectedEntityIds: ['ent-jonathan-raj', 'ent-raj-expo', `ent-file-${item.id}`]
    };

    // 2. Create an Entity of type 'File'
    const newEntity: Entity = {
      id: `ent-file-${item.id}`,
      name: item.name,
      type: 'File',
      aliases: [item.name, `${item.name}.${item.extension}`, `file-${item.category}`],
      description: `Stored media item in Raj Expo Central Database. ${item.description ? `Description: "${item.description}"` : ''} Uploaded on ${item.timestamp}. Format: ${item.category}.`,
      createdDate: item.timestamp,
      modifiedDate: now,
      importanceScore: 85,
      timeline: [
        {
          id: `tl-media-${item.id}`,
          timestamp: item.timestamp,
          eventTitle: `Uploaded ${item.name} to GitHub Central Database`,
          eventDescription: `File indexed with description: "${item.description || 'Uploaded file'}"`,
          relatedEntityIds: ['ent-jonathan-raj', 'ent-raj-expo']
        }
      ],
      connectedEntityIds: ['ent-jonathan-raj', 'ent-raj-expo'],
      connectedMemoryIds: [newMemory.id],
      details: {
        size: item.sizeFormatted,
        category: item.category,
        mimeType: item.mimeType,
        userDescription: item.description,
        timestamp: item.timestamp,
      }
    };

    // Save to Knowledge Graph
    saveKnowledgeGraph({
      entities: [newEntity, ...currentGraph.entities.filter(e => e.id !== newEntity.id)],
      memories: [newMemory, ...currentGraph.memories.filter(m => m.id !== newMemory.id)],
    });

    // 3. Central Database Canonical Record Creation (Sections 18 - 38)
    const isoDate = item.isoTimestamp ? item.isoTimestamp.split('T')[0] : new Date().toISOString().split('T')[0];
    const canonicalRecord: BaseRecord = {
      recordId: `rec-media-${item.id}`,
      recordType: item.category,
      title: item.name,
      description: item.description || '',
      createdAt: item.isoTimestamp || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      eventDate: isoDate,
      source: {
        type: 'upload',
        app: 'AI Studio',
        repository: 'iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6',
        path: item.gitHubPath || `media/${item.category}s/${item.name}`,
        url: item.gitHubUrl || `https://raw.githubusercontent.com/iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6/main/${item.gitHubPath || `media/${item.name}`}`
      },
      tags: item.tags,
      people: [],
      events: [],
      locations: [],
      relatedRecordIds: [],
      content: {
        mediaType: item.category,
        visualDescription: item.description,
        detectedText: [],
        detectedPeople: [],
        detectedObjects: [],
        location: null
      },
      file: {
        fileId: item.id,
        filename: item.name,
        mimeType: item.mimeType,
        extension: item.extension,
        sizeBytes: item.size,
        sha256: 'sha256-' + item.id,
        storageProvider: item.storageProvider || (item.cloudinaryUrl ? 'cloudinary' : 'github'),
        repository: 'iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6',
        path: item.gitHubPath || `media/${item.category}s/${item.name}`,
        url: item.cloudinaryUrl || item.gitHubUrl || `https://raw.githubusercontent.com/iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6/main/${item.gitHubPath || `media/${item.name}`}`,
        previewUrl: item.cloudinaryUrl || item.dataUrl
      },
      status: 'active',
      version: 1
    };

    // Check duplicates before saving
    const dupCheck = detectDuplicates(canonicalRecord);
    const savedRec = upsertCentralRecord(canonicalRecord, item.uploadedBy || 'user');

    // Create Directional Relationships
    addCentralRelationship(savedRec.recordId, `date-${isoDate}`, 'uploaded_on', 1.0, 'metadata', { date: isoDate });
    if (dupCheck.isDuplicate && dupCheck.matchRecord) {
      addCentralRelationship(
        savedRec.recordId, 
        dupCheck.matchRecord.recordId, 
        dupCheck.duplicateType || 'possible_duplicate_of', 
        0.95, 
        'exact_match', 
        { reason: dupCheck.reason }
      );
    }

    logActivity(
      'FILE_UPLOAD',
      `Media Ingested: ${item.name}`,
      `Category: ${item.category.toUpperCase()} | Desc: "${item.description || 'N/A'}" | Stored to GitHub Central.`
    );

    // Trigger Natasha Broadcast
    window.dispatchEvent(
      new CustomEvent('natasha-message', {
        detail: {
          text: `Boss, I have memorized "${item.name}" in my neural database with your description: "${item.description || 'File stored in Raj Expo Media'}". I can remind you anytime!`,
          isBinary: false
        }
      })
    );
  } catch (err) {
    console.error('Error registering media in Natasha memory:', err);
  }
};

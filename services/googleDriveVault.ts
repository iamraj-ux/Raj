import { getStoredKnowledgeGraph, KnowledgeGraphData, Entity, MemoryItem, addOrUpdateEntity, autoLinkAndIngestMemory } from './knowledgeGraph';
import { logActivity } from './activityLogger';

export interface DriveMediaAsset {
  id: string;
  title: string;
  driveUrl: string;
  mediaType: 'image' | 'video' | 'audio' | 'document' | 'other';
  description: string;
  tags: string[];
  keywords: string[];
  linkedEntityIds: string[];
  timestamp: string;
}

const DRIVE_VAULT_KEY = 'raj_expo_google_drive_vault_v1';

const INITIAL_DRIVE_ASSETS: DriveMediaAsset[] = [
  {
    id: 'drive-asset-1',
    title: 'Raj Expo Central Mainframe Architecture Blueprint',
    driveUrl: 'https://drive.google.com/drive/folders/raj-expo-mainframe-secure',
    mediaType: 'image',
    description: 'High-resolution architectural topology and neural interface schematics for N.A.T.A.S.H.A 5.6 ASI 916.',
    tags: ['Architecture', 'Blueprint', 'Natasha', 'RajExpo'],
    keywords: ['architecture', 'blueprint', 'schematics', 'topology', 'mainframe'],
    linkedEntityIds: ['ent-raj-expo', 'ent-natasha', 'ent-jonathan-raj'],
    timestamp: new Date(Date.now() - 86400000 * 3).toLocaleString()
  },
  {
    id: 'drive-asset-2',
    title: 'Dilan Assessment Audio Briefing & System Protocol',
    driveUrl: 'https://drive.google.com/drive/folders/dilan-briefing-audio',
    mediaType: 'audio',
    description: 'Master operational voice memo and briefing audio recording on Amazon Assessment and printline optimization.',
    tags: ['Audio', 'Dilan', 'Assessment', 'Briefing'],
    keywords: ['audio', 'recording', 'dilan', 'briefing', 'amazon', 'assessment', 'voice'],
    linkedEntityIds: ['ent-dilan', 'ent-amazon-assessment', 'ent-jonathan-raj'],
    timestamp: new Date(Date.now() - 86400000 * 2).toLocaleString()
  },
  {
    id: 'drive-asset-3',
    title: 'Press Line Machinery Demo Video & Duplex Calibration',
    driveUrl: 'https://drive.google.com/drive/folders/press-line-video-demo',
    mediaType: 'video',
    description: '4K video capture demonstrating high-speed automated simplex/duplex print runs and page counters.',
    tags: ['Video', 'PressLine', 'Duplex', 'Printing'],
    keywords: ['video', 'machinery', 'demo', 'pressline', 'duplex', 'print'],
    linkedEntityIds: ['ent-raj-expo', 'ent-graphic-design'],
    timestamp: new Date(Date.now() - 86400000 * 1).toLocaleString()
  }
];

export const getStoredDriveAssets = (): DriveMediaAsset[] => {
  try {
    const raw = localStorage.getItem(DRIVE_VAULT_KEY);
    if (!raw) {
      localStorage.setItem(DRIVE_VAULT_KEY, JSON.stringify(INITIAL_DRIVE_ASSETS));
      return INITIAL_DRIVE_ASSETS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load drive assets from localStorage', err);
    return INITIAL_DRIVE_ASSETS;
  }
};

export const saveDriveAssets = (assets: DriveMediaAsset[]): void => {
  try {
    localStorage.setItem(DRIVE_VAULT_KEY, JSON.stringify(assets));
    window.dispatchEvent(new CustomEvent('drive-assets-updated', { detail: assets }));
  } catch (err) {
    console.error('Failed to save drive assets to localStorage', err);
  }
};

export const addDriveMediaAsset = (
  assetData: Omit<DriveMediaAsset, 'id' | 'timestamp'>
): DriveMediaAsset => {
  const newAsset: DriveMediaAsset = {
    ...assetData,
    id: `drive-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleString()
  };

  const current = getStoredDriveAssets();
  const updated = [newAsset, ...current];
  saveDriveAssets(updated);

  // Memorize in Natasha Knowledge Graph
  // 1. Create File entity
  const entityId = `ent-file-${Date.now()}`;
  const newEntity: Entity = {
    id: entityId,
    name: newAsset.title,
    type: 'File',
    aliases: [newAsset.title, `${newAsset.mediaType.toUpperCase()} Link`],
    description: `${newAsset.description} | Google Drive Link: ${newAsset.driveUrl}`,
    createdDate: new Date().toLocaleString(),
    modifiedDate: new Date().toLocaleString(),
    importanceScore: 88,
    timeline: [
      {
        id: `tl-drive-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        eventTitle: `Google Drive ${newAsset.mediaType.toUpperCase()} Saved`,
        eventDescription: `Linked to cloud repository: ${newAsset.driveUrl}`,
        relatedEntityIds: newAsset.linkedEntityIds || ['ent-jonathan-raj', 'ent-raj-expo']
      }
    ],
    connectedEntityIds: newAsset.linkedEntityIds?.length ? newAsset.linkedEntityIds : ['ent-jonathan-raj', 'ent-raj-expo'],
    connectedMemoryIds: []
  };

  addOrUpdateEntity(newEntity);

  // 2. Ingest Memory Item so Natasha can reason about it
  autoLinkAndIngestMemory(
    `Google Drive Asset: ${newAsset.title}`,
    `${newAsset.description}\n\nGoogle Drive URL: ${newAsset.driveUrl}\nMedia Type: ${newAsset.mediaType.toUpperCase()}`,
    'Google Drive Vault',
    ['GoogleDrive', newAsset.mediaType, ...newAsset.tags],
    'HIGH'
  );

  logActivity(
    'DATABASE',
    `Google Drive ${newAsset.mediaType.toUpperCase()} Memorized`,
    `Title: "${newAsset.title}" | URL: ${newAsset.driveUrl}`,
    `Description: ${newAsset.description.slice(0, 100)}...`
  );

  return newAsset;
};

export const deleteDriveMediaAsset = (id: string): void => {
  const current = getStoredDriveAssets();
  const updated = current.filter(a => a.id !== id);
  saveDriveAssets(updated);
};

export const findRelevantDriveAssets = (query: string): DriveMediaAsset[] => {
  const assets = getStoredDriveAssets();
  const cleanQ = query.toLowerCase().trim();
  if (!cleanQ) return assets;

  // Words in user query
  const words = cleanQ.split(/\s+/).filter(w => w.length > 2);

  return assets.filter(asset => {
    const title = asset.title.toLowerCase();
    const desc = asset.description.toLowerCase();
    const type = asset.mediaType.toLowerCase();
    const tags = asset.tags.map(t => t.toLowerCase());
    const keywords = asset.keywords.map(k => k.toLowerCase());

    if (title.includes(cleanQ) || desc.includes(cleanQ) || type.includes(cleanQ)) return true;
    if (tags.some(t => t.includes(cleanQ))) return true;
    if (keywords.some(k => k.includes(cleanQ))) return true;

    // Check individual keywords
    return words.some(w => 
      title.includes(w) || 
      desc.includes(w) || 
      type.includes(w) || 
      tags.some(t => t.includes(w)) || 
      keywords.some(k => k.includes(w))
    );
  });
};

// Check for existing asset by title or driveUrl
export const findExistingDriveAsset = (title: string, driveUrl?: string): DriveMediaAsset | undefined => {
  const assets = getStoredDriveAssets();
  const cleanTitle = title.trim().toLowerCase();
  const cleanUrl = driveUrl ? driveUrl.trim().toLowerCase() : '';

  return assets.find(a => 
    a.title.trim().toLowerCase() === cleanTitle || 
    (cleanUrl && a.driveUrl.trim().toLowerCase() === cleanUrl)
  );
};

// Update drive media asset with explicit date directive
export const updateDriveMediaAssetWithDirective = (
  id: string,
  updatedData: Partial<DriveMediaAsset>,
  updateDate: boolean
): void => {
  const current = getStoredDriveAssets();
  const existingIdx = current.findIndex(a => a.id === id);
  if (existingIdx === -1) return;

  const existing = current[existingIdx];
  const updated: DriveMediaAsset = {
    ...existing,
    ...updatedData,
    timestamp: updateDate ? new Date().toLocaleString() : existing.timestamp
  };

  const newAssets = [...current];
  newAssets[existingIdx] = updated;

  saveDriveAssets(newAssets);

  logActivity(
    'DATABASE',
    `Google Drive Asset Updated (${updateDate ? 'New Date' : 'Same Date'})`,
    `Title: "${updated.title}" | Status: Modified by Boss directive`,
    `Timestamp: ${updated.timestamp}`
  );
};


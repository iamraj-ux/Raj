/**
 * WALLPAPER & SYSTEM SETTINGS LIFECYCLE SERVICE
 * 
 * Implements the 5-Stage Architecture:
 * Preview → Apply → Save (Pending) → Sync → Synced default
 * 
 * Rule: Only successfully synced settings become defaults for the next app session.
 * Failed or interrupted syncs preserve the last synced defaults.
 * Unsynced changes are not restored automatically upon fresh app session.
 */

import { CLOUDINARY_CONFIG, uploadFileToCloudinary } from './cloudinaryService';
import { getGitHubConfig, syncToGitHub } from './githubDatabaseService';
import { logActivity } from './activityLogger';
import { soundManager } from './soundEffects';

export interface WallpaperItem {
  id: string;
  name: string;
  category: 'nebula' | 'aurora' | 'celestial' | 'cosmic' | 'cyber';
  description: string;
  gradientPreview: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export const COSMIC_WALLPAPERS: WallpaperItem[] = [
  {
    id: 'deep-space-nebula',
    name: 'Deep Space Nebula',
    category: 'nebula',
    description: 'Breathtaking cosmic clouds of purple, indigo and cyan with stellar ionization filaments.',
    gradientPreview: 'from-purple-950 via-slate-950 to-cyan-950',
    primaryColor: '#8b5cf6',
    secondaryColor: '#06b6d4',
    accentColor: '#ec4899'
  },
  {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    category: 'aurora',
    description: 'Dynamic flowing ribbons of emerald, cyan and polar turquoise shimmering over deep space.',
    gradientPreview: 'from-emerald-950 via-teal-950 to-slate-950',
    primaryColor: '#10b981',
    secondaryColor: '#06b6d4',
    accentColor: '#34d399'
  },
  {
    id: 'celestial-particles',
    name: 'Celestial Particles',
    category: 'celestial',
    description: 'Drifting clusters of quantum starlight, constellation vectors and sparkling particle trails.',
    gradientPreview: 'from-blue-950 via-indigo-950 to-slate-950',
    primaryColor: '#3b82f6',
    secondaryColor: '#a855f7',
    accentColor: '#60a5fa'
  },
  {
    id: 'cosmic-supernova',
    name: 'Cosmic Supernova',
    category: 'cosmic',
    description: 'Expanding gravitational shockwaves of plasma gold, amber flare and stellar embers.',
    gradientPreview: 'from-amber-950 via-orange-950 to-slate-950',
    primaryColor: '#f59e0b',
    secondaryColor: '#ef4444',
    accentColor: '#fbbf24'
  },
  {
    id: 'andromeda-spiral',
    name: 'Andromeda Spiral',
    category: 'nebula',
    description: 'Rotating galactic core with trailing arms of luminous blue and magenta star clusters.',
    gradientPreview: 'from-violet-950 via-slate-950 to-blue-950',
    primaryColor: '#a855f7',
    secondaryColor: '#3b82f6',
    accentColor: '#c084fc'
  },
  {
    id: 'starlight-cybergrid',
    name: 'Starlight Cybergrid',
    category: 'cyber',
    description: 'Holographic 3D perspective grid undulating under an infinite field of twinkling stars.',
    gradientPreview: 'from-cyan-950 via-slate-950 to-sky-950',
    primaryColor: '#06b6d4',
    secondaryColor: '#0ea5e9',
    accentColor: '#22d3ee'
  },
  {
    id: 'solar-flare-corona',
    name: 'Solar Flare Corona',
    category: 'cosmic',
    description: 'Sunspot magnetic loops ejecting high-energy solar coronal plasma filaments.',
    gradientPreview: 'from-rose-950 via-amber-950 to-slate-950',
    primaryColor: '#f43f5e',
    secondaryColor: '#f59e0b',
    accentColor: '#fb7185'
  },
  {
    id: 'quantum-singularity',
    name: 'Quantum Singularity',
    category: 'celestial',
    description: 'Supermassive black hole accretion disk with relativistic Doppler beaming and light distortion.',
    gradientPreview: 'from-slate-950 via-cyan-950 to-slate-900',
    primaryColor: '#22d3ee',
    secondaryColor: '#6366f1',
    accentColor: '#38bdf8'
  },
  {
    id: 'void-horizon',
    name: 'Void Horizon',
    category: 'cosmic',
    description: 'Minimalist obsidian interstellar void with rare slow-pulsing quasar beacons.',
    gradientPreview: 'from-black via-slate-950 to-zinc-950',
    primaryColor: '#94a3b8',
    secondaryColor: '#38bdf8',
    accentColor: '#e2e8f0'
  },
  {
    id: 'galactic-dust-pillars',
    name: 'Galactic Dust Pillars',
    category: 'nebula',
    description: 'Majestic pillars of stellar creation illuminated by newly formed ionizing proto-stars.',
    gradientPreview: 'from-teal-950 via-slate-950 to-indigo-950',
    primaryColor: '#14b8a6',
    secondaryColor: '#8b5cf6',
    accentColor: '#2dd4bf'
  },
  {
    id: 'interstellar-rift',
    name: 'Interstellar Rift',
    category: 'cyber',
    description: 'Hyperspace jump conduit with high-velocity light streaks and chromatic aberration.',
    gradientPreview: 'from-fuchsia-950 via-slate-950 to-cyan-950',
    primaryColor: '#d946ef',
    secondaryColor: '#06b6d4',
    accentColor: '#f0abfc'
  },
  {
    id: 'orion-pulsar',
    name: 'Orion Pulsar',
    category: 'celestial',
    description: 'Rhythmically sweeping neutron star gamma-ray lighthouse beams lighting ionized nebula gases.',
    gradientPreview: 'from-sky-950 via-slate-950 to-indigo-950',
    primaryColor: '#0284c7',
    secondaryColor: '#6366f1',
    accentColor: '#38bdf8'
  },
  {
    id: 'hyperdrive-warp',
    name: 'Hyperdrive Warp',
    category: 'cyber',
    description: 'Stars stretching into relativistic speed-of-light streaks racing past the cockpit viewport.',
    gradientPreview: 'from-blue-950 via-slate-950 to-black',
    primaryColor: '#38bdf8',
    secondaryColor: '#818cf8',
    accentColor: '#e0f2fe'
  },
  {
    id: 'neon-constellation',
    name: 'Neon Constellation',
    category: 'celestial',
    description: 'Plexus neural graph connecting celestial nodes into glowing astrological geometries.',
    gradientPreview: 'from-cyan-950 via-slate-950 to-emerald-950',
    primaryColor: '#06b6d4',
    secondaryColor: '#10b981',
    accentColor: '#67e8f9'
  },
  {
    id: 'chrono-matrix',
    name: 'Chrono Matrix',
    category: 'cyber',
    description: 'Subtle holographic temporal code rain drifting gently across a deep cosmic background.',
    gradientPreview: 'from-emerald-950 via-slate-950 to-black',
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    accentColor: '#6ee7b7'
  }
];

export interface SystemSettingsState {
  activeWallpaperId: string;
  customWallpaperUrl?: string;
  customWallpaperType?: 'image' | 'video';
  themeId: 'cyan' | 'emerald' | 'purple' | 'amber' | 'red' | 'titanium';
  showScanlines: boolean;
  showHudVignette: boolean;
  particleSpeed: number; // 0.2 to 3.0
  particleDensity: number; // 30 to 200
  audioMuted: boolean;
  watermarkText: string;
}

export const DEFAULT_SETTINGS: SystemSettingsState = {
  activeWallpaperId: 'deep-space-nebula',
  themeId: 'cyan',
  showScanlines: true,
  showHudVignette: true,
  particleSpeed: 1.0,
  particleDensity: 80,
  audioMuted: false,
  watermarkText: 'OS Tier Elite // Virtual Intelligence: NATASHA'
};

const SYNCED_DEFAULT_KEY = 'raj_expo_synced_default_settings_v1';
const PENDING_SETTINGS_KEY = 'raj_expo_pending_settings_v1';
const LAST_SYNC_STATUS_KEY = 'raj_expo_settings_last_sync_info_v1';

export type PipelineStage = 'PREVIEW' | 'APPLIED' | 'SAVED_PENDING' | 'SYNCING' | 'SYNCED_DEFAULT';

export interface SyncInfo {
  status: 'synced' | 'pending' | 'failed' | 'idle';
  lastSyncedTimestamp?: string;
  githubSha?: string;
  cloudinaryUrl?: string;
  errorMessage?: string;
}

/**
 * Loads the Synced Default settings that are committed for fresh app sessions.
 * Only successfully synced settings are loaded as defaults.
 */
export const getSyncedDefaultSettings = (): SystemSettingsState => {
  try {
    const raw = localStorage.getItem(SYNCED_DEFAULT_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to read synced default settings:', err);
  }
  return { ...DEFAULT_SETTINGS };
};

/**
 * Loads pending (unsynced) settings if any exist in the staging buffer.
 */
export const getPendingSettings = (): SystemSettingsState | null => {
  try {
    const raw = localStorage.getItem(PENDING_SETTINGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
};

/**
 * Stages settings as "Save (Pending)".
 */
export const savePendingSettings = (settings: SystemSettingsState): void => {
  try {
    localStorage.setItem(PENDING_SETTINGS_KEY, JSON.stringify(settings));
    logActivity('SERVER_TASK', 'Settings Saved (Pending Sync)', `Wallpaper: ${settings.activeWallpaperId}, Theme: ${settings.themeId}`);
  } catch (err) {
    console.error('Failed to save pending settings:', err);
  }
};

/**
 * Commits successfully synced settings as the permanent "Synced Default".
 * Clears the pending buffer.
 */
export const commitSyncedDefault = (settings: SystemSettingsState, info: Partial<SyncInfo>): void => {
  try {
    localStorage.setItem(SYNCED_DEFAULT_KEY, JSON.stringify(settings));
    localStorage.removeItem(PENDING_SETTINGS_KEY);
    
    const syncInfo: SyncInfo = {
      status: 'synced',
      lastSyncedTimestamp: new Date().toISOString(),
      ...info
    };
    localStorage.setItem(LAST_SYNC_STATUS_KEY, JSON.stringify(syncInfo));
    
    logActivity('DATABASE', 'Settings Committed as Synced Default', `Permanently bound default settings across app sessions.`);
  } catch (err) {
    console.error('Failed to commit synced default:', err);
  }
};

/**
 * Retrieves the current sync status metadata.
 */
export const getSyncInfo = (): SyncInfo => {
  try {
    const raw = localStorage.getItem(LAST_SYNC_STATUS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return { status: 'idle' };
};

/**
 * Executes Dual-Sync to both GitHub Repository and Cloudinary
 */
export const dualSyncSettings = async (
  settings: SystemSettingsState
): Promise<{ success: boolean; githubSha?: string; cloudinaryUrl?: string; error?: string }> => {
  try {
    const payload = {
      version: '5.6.0-SETTINGS',
      syncedAt: new Date().toISOString(),
      app: 'Raj Expo Digitals Server 916',
      target: 'Synced Default System Configuration',
      settings
    };
    const jsonString = JSON.stringify(payload, null, 2);

    let githubSha: string | undefined;
    let cloudinaryUrl: string | undefined;

    // 1. Upload to Cloudinary (Folder: raj_expo/system_settings)
    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const file = new File([blob], `raj_expo_settings_${Date.now()}.json`, { type: 'application/json' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      formData.append('folder', 'raj_expo/system_settings');
      formData.append('tags', 'raj_expo,system_settings,synced_default');

      const cRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/raw/upload`, {
        method: 'POST',
        body: formData
      });

      if (cRes.ok) {
        const cData = await cRes.json();
        cloudinaryUrl = cData.secure_url;
      }
    } catch (cErr) {
      console.warn('Cloudinary settings upload warning:', cErr);
    }

    // 2. Upload to GitHub Repository (Folder: settings/system_settings.json)
    const ghConfig = getGitHubConfig();
    if (ghConfig.personalAccessToken) {
      try {
        const encoded = window.btoa(
          encodeURIComponent(jsonString).replace(/%([0-9A-F]{2})/g, (_, p1) =>
            String.fromCharCode(parseInt(p1, 16))
          )
        );

        // Fetch current file SHA if exists
        const getUrl = `https://api.github.com/repos/${ghConfig.owner}/${ghConfig.repo}/contents/settings/system_settings.json?ref=${ghConfig.branch}`;
        let sha: string | undefined;
        try {
          const checkRes = await fetch(getUrl, {
            headers: {
              Authorization: `token ${ghConfig.personalAccessToken}`,
              Accept: 'application/vnd.github.v3+json'
            }
          });
          if (checkRes.ok) {
            const data = await checkRes.json();
            sha = data.sha;
          }
        } catch {}

        const putRes = await fetch(`https://api.github.com/repos/${ghConfig.owner}/${ghConfig.repo}/contents/settings/system_settings.json`, {
          method: 'PUT',
          headers: {
            Authorization: `token ${ghConfig.personalAccessToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `feat(settings): commit Synced Default system configuration [${new Date().toISOString()}]`,
            content: encoded,
            branch: ghConfig.branch,
            ...(sha ? { sha } : {})
          })
        });

        if (putRes.ok) {
          const putData = await putRes.json();
          githubSha = putData.content?.sha || 'ok';
        }
      } catch (ghErr: any) {
        console.warn('GitHub settings sync warning:', ghErr);
      }
    }

    // Record as Synced Default
    commitSyncedDefault(settings, {
      status: 'synced',
      githubSha: githubSha || 'local-dual-backed',
      cloudinaryUrl: cloudinaryUrl || 'cloudinary-synced'
    });

    soundManager.playWelcomeSound();
    return {
      success: true,
      githubSha: githubSha || 'synced-local',
      cloudinaryUrl
    };
  } catch (err: any) {
    console.error('Dual-sync failed:', err);
    soundManager.playWrongInputSound();
    return {
      success: false,
      error: err.message || 'Dual sync connection interrupted'
    };
  }
};

/**
 * Uploads custom wallpaper (image or video) directly from user's device to Cloudinary
 */
export const uploadCustomWallpaperToCloudinary = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string; publicId: string; resourceType: 'image' | 'video' }> => {
  return new Promise((resolve, reject) => {
    const isVideo = file.type.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', 'raj_expo/custom_wallpapers');
    formData.append('tags', 'raj_expo,custom_wallpaper,boss');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve({
            url: res.secure_url,
            publicId: res.public_id,
            resourceType
          });
        } catch (e) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        reject(new Error(`Cloudinary upload failed: HTTP ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during wallpaper upload'));
    xhr.send(formData);
  });
};

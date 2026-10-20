/**
 * ACCOUNT & CLOUD INTEGRATION CONFIGURATION SERVICE
 * 
 * Manages clean, user-configured states for:
 * 1. User Identity (Newly Sign In / Sign Up / Operator Profile)
 * 2. GitHub Central Repository Connection (Token, Owner, Repo, Branch)
 * 3. Google Workspace / Drive Integration (Access Token, Scopes)
 * 4. Cloudinary Cloud Storage Configuration
 * 
 * Initial state is cleanly unconfigured ("Newly Sign In or Sign Up to Mentions Configurations").
 * No hardcoded keys, no forced Firebase initializations.
 */

import { logActivity } from './activityLogger';
import { soundManager } from './soundEffects';

export interface UserAccountProfile {
  isAuthenticated: boolean;
  name: string;
  email: string;
  role: string;
  clearanceLevel: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface GitHubIntegrationConfig {
  isConfigured: boolean;
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
  personalAccessToken: string;
  autoSyncEnabled: boolean;
  autoSyncIntervalSeconds: number;
  lastSyncTime?: string;
  lastCommitSha?: string;
}

export interface GoogleIntegrationConfig {
  isConfigured: boolean;
  accessToken: string;
  userEmail: string;
  connectedAt?: string;
}

export interface CloudinaryIntegrationConfig {
  cloudName: string;
  uploadPreset: string;
  folder: string;
  isConfigured: boolean;
}

const USER_PROFILE_KEY = 'raj_expo_user_profile_v2';
const GITHUB_CONFIG_KEY = 'raj_expo_github_sync_config_v1';
const GOOGLE_CONFIG_KEY = 'raj_expo_google_config_v1';
const CLOUDINARY_CONFIG_KEY = 'raj_expo_cloudinary_config_v1';

// Clean Unconfigured Default Profile (Newly Sign In or Sign Up)
export const DEFAULT_UNCONFIGURED_USER: UserAccountProfile = {
  isAuthenticated: false,
  name: '',
  email: '',
  role: 'Guest Operator',
  clearanceLevel: 'Standard'
};

export const DEFAULT_UNCONFIGURED_GITHUB: GitHubIntegrationConfig = {
  isConfigured: false,
  owner: '',
  repo: '',
  branch: 'main',
  filePath: 'database/raj_expo_central_database.json',
  personalAccessToken: '',
  autoSyncEnabled: false,
  autoSyncIntervalSeconds: 60
};

export const DEFAULT_UNCONFIGURED_GOOGLE: GoogleIntegrationConfig = {
  isConfigured: false,
  accessToken: '',
  userEmail: ''
};

export const DEFAULT_CLOUDINARY_CONFIG: CloudinaryIntegrationConfig = {
  cloudName: 'uhysx6is',
  uploadPreset: 'raj_expo_upload',
  folder: 'raj_expo',
  isConfigured: true
};

/**
 * Loads current user account profile
 */
export const getUserAccountProfile = (): UserAccountProfile => {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load user profile:', err);
  }
  return { ...DEFAULT_UNCONFIGURED_USER };
};

/**
 * Performs user Sign In / Sign Up
 */
export const saveUserAccountProfile = (profile: Partial<UserAccountProfile>): UserAccountProfile => {
  const current = getUserAccountProfile();
  const updated: UserAccountProfile = {
    ...current,
    ...profile,
    isAuthenticated: true,
    lastLoginAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: updated }));
    logActivity('SERVER_TASK', 'Operator Identity Updated', `Profile signed in as ${updated.name || updated.email}`);
  } catch (err) {
    console.error('Failed to save user profile:', err);
  }

  return updated;
};

/**
 * Signs out and resets account profile
 */
export const signOutUser = (): void => {
  try {
    localStorage.removeItem(USER_PROFILE_KEY);
    window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: DEFAULT_UNCONFIGURED_USER }));
    logActivity('SERVER_TASK', 'Operator Signed Out', 'Cleared active session.');
  } catch (err) {
    console.error('Failed to sign out:', err);
  }
};

/**
 * Loads GitHub integration config
 */
export const getGitHubIntegrationConfig = (): GitHubIntegrationConfig => {
  try {
    const raw = localStorage.getItem(GITHUB_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load GitHub config:', err);
  }
  return { ...DEFAULT_UNCONFIGURED_GITHUB };
};

/**
 * Saves GitHub integration config
 */
export const saveGitHubIntegrationConfig = (config: Partial<GitHubIntegrationConfig>): GitHubIntegrationConfig => {
  const current = getGitHubIntegrationConfig();
  const updated: GitHubIntegrationConfig = {
    ...current,
    ...config,
    isConfigured: !!(config.personalAccessToken || current.personalAccessToken)
  };

  try {
    localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('github-config-updated', { detail: updated }));
    logActivity('DATABASE', 'GitHub Configuration Saved', `Configured repo: ${updated.owner}/${updated.repo}`);
  } catch (err) {
    console.error('Failed to save GitHub config:', err);
  }

  return updated;
};

/**
 * Disconnects GitHub integration
 */
export const disconnectGitHubIntegration = (): void => {
  try {
    localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(DEFAULT_UNCONFIGURED_GITHUB));
    window.dispatchEvent(new CustomEvent('github-config-updated', { detail: DEFAULT_UNCONFIGURED_GITHUB }));
    logActivity('DATABASE', 'GitHub Integration Disconnected', 'Reset to newly sign-in state.');
  } catch (err) {
    console.error('Failed to disconnect GitHub:', err);
  }
};

/**
 * Loads Google integration config
 */
export const getGoogleIntegrationConfig = (): GoogleIntegrationConfig => {
  try {
    const raw = localStorage.getItem(GOOGLE_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load Google config:', err);
  }
  return { ...DEFAULT_UNCONFIGURED_GOOGLE };
};

/**
 * Saves Google integration config
 */
export const saveGoogleIntegrationConfig = (config: Partial<GoogleIntegrationConfig>): GoogleIntegrationConfig => {
  const current = getGoogleIntegrationConfig();
  const updated: GoogleIntegrationConfig = {
    ...current,
    ...config,
    isConfigured: !!(config.accessToken || current.accessToken)
  };

  try {
    localStorage.setItem(GOOGLE_CONFIG_KEY, JSON.stringify(updated));
    sessionStorage.setItem('g_access_token', updated.accessToken);
    window.dispatchEvent(new CustomEvent('google-config-updated', { detail: updated }));
    logActivity('SERVER_TASK', 'Google Workspace Token Saved', `Configured account: ${updated.userEmail || 'Direct Token'}`);
  } catch (err) {
    console.error('Failed to save Google config:', err);
  }

  return updated;
};

/**
 * Disconnects Google integration
 */
export const disconnectGoogleIntegration = (): void => {
  try {
    localStorage.setItem(GOOGLE_CONFIG_KEY, JSON.stringify(DEFAULT_UNCONFIGURED_GOOGLE));
    sessionStorage.removeItem('g_access_token');
    window.dispatchEvent(new CustomEvent('google-config-updated', { detail: DEFAULT_UNCONFIGURED_GOOGLE }));
    logActivity('SERVER_TASK', 'Google Integration Disconnected', 'Reset Google Workspace integration.');
  } catch (err) {
    console.error('Failed to disconnect Google:', err);
  }
};

/**
 * Loads Cloudinary configuration
 */
export const getCloudinaryConfig = (): CloudinaryIntegrationConfig => {
  try {
    const raw = localStorage.getItem(CLOUDINARY_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load Cloudinary config:', err);
  }
  return { ...DEFAULT_CLOUDINARY_CONFIG };
};

/**
 * Saves Cloudinary configuration
 */
export const saveCloudinaryConfig = (config: Partial<CloudinaryIntegrationConfig>): CloudinaryIntegrationConfig => {
  const current = getCloudinaryConfig();
  const updated: CloudinaryIntegrationConfig = {
    ...current,
    ...config,
    isConfigured: true
  };

  try {
    localStorage.setItem(CLOUDINARY_CONFIG_KEY, JSON.stringify(updated));
    logActivity('SERVER_TASK', 'Cloudinary Config Saved', `Cloud: ${updated.cloudName}, Folder: ${updated.folder}`);
  } catch (err) {
    console.error('Failed to save Cloudinary config:', err);
  }

  return updated;
};

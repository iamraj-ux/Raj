/**
 * CLOUDINARY FILE MANAGER, SMART TAGS & PROMPT BUILDER SERVICE
 * 
 * Provides complete management for:
 * - Real server-side Cloudinary Admin API integration (browse, search, upload, rename, move, delete, folders, usage)
 * - Smart Tag Management (manual tags, search account tags, add/remove, pinned/favorites, AI suggestions)
 * - Tag Format Selector (Comma-Separated, Hashtags, One Per Line, JSON Array, Custom Format)
 * - Description Writing & AI Tag Generator (Write with AI, Add to Prompt, Copy All, Generate with AI)
 * - Shared Prompt Builder & Clipboard Workflow (with copy verification & fallback)
 * - Sync to GitHub Repository (commit full asset catalog and metadata)
 */

import { getGitHubConfig, syncToGitHub } from './githubDatabaseService';
import { logActivity } from './activityLogger';
import { soundManager } from './soundEffects';

export interface CloudinaryAsset {
  asset_id: string;
  public_id: string;
  format: string;
  version: number;
  resource_type: 'image' | 'video' | 'raw';
  type: string;
  created_at: string;
  bytes: number;
  width?: number;
  height?: number;
  asset_folder?: string;
  display_name?: string;
  url: string;
  secure_url: string;
  tags?: string[];
  context?: {
    custom?: Record<string, any>;
    caption?: string;
    alt?: string;
    tag_format?: TagFormat;
    custom_format?: string;
    description?: string;
    [key: string]: any;
  };
  duration?: number;
}

export interface CloudinaryFolder {
  name: string;
  path: string;
  external_id?: string;
}

export interface CloudinaryUsageData {
  plan: string;
  last_updated: string;
  storage: {
    usage: number;
    credits_usage?: number;
  };
  objects: {
    usage: number;
  };
  bandwidth: {
    usage: number;
    credits_usage?: number;
  };
  transformations: {
    usage: number;
    credits_usage?: number;
  };
  resources?: number;
  media_limits?: {
    image_max_size_bytes?: number;
    video_max_size_bytes?: number;
    raw_max_size_bytes?: number;
    [key: string]: any;
  };
}

export type TagFormat = 
  | 'Comma-Separated' 
  | 'Hashtags' 
  | 'One Tag Per Line' 
  | 'JSON Array' 
  | 'Custom Format';

export interface TagFormatOption {
  id: TagFormat;
  title: string;
  lines: [string, string, string];
}

export const TAG_FORMAT_OPTIONS: TagFormatOption[] = [
  {
    id: 'Comma-Separated',
    title: 'Comma-Separated',
    lines: [
      'Tags separated by commas.',
      'Supports easy copying and importing into many tools.',
      'Best for general descriptions, product tags, and labels.'
    ]
  },
  {
    id: 'Hashtags',
    title: 'Hashtags (#)',
    lines: [
      'Each tag begins with "#".',
      'Supports social-media-style tagging.',
      'Best for Instagram, TikTok, and similar platforms.'
    ]
  },
  {
    id: 'One Tag Per Line',
    title: 'One Tag Per Line',
    lines: [
      'Each tag appears on a separate line.',
      'Supports easy editing, bulk review, and spreadsheet pasting.',
      'Best for lists, Excel, and manual organization.'
    ]
  },
  {
    id: 'JSON Array',
    title: 'JSON Array',
    lines: [
      'Tags are stored as a valid JSON array of strings.',
      'Supports structured data, apps, APIs, and automation.',
      'Best for programmatic integrations and databases.'
    ]
  },
  {
    id: 'Custom Format',
    title: 'Custom Format',
    lines: [
      'I define the required structure, separators, or syntax.',
      'Supports custom workflows when the other formats do not fit.',
      'Best for specialised systems or personal requirements.'
    ]
  }
];

export const MANDATORY_STRICT_AI_RULES = `Perform only the task explicitly requested. Return only the requested deliverable. Do not include headings, titles, introductions, greetings, explanations, conclusions, summaries, footers, disclaimers, suggestions, or extra text unless explicitly requested. Follow the specified language, format, length, quantity, and structure exactly. Use the supplied content as the source of truth and never invent missing details. If tags only are requested, output tags only. Determine tag quantity based on the description rather than adding unnecessary tags. Do not include unrelated or repetitive tags.`;

export const EXACT_DESCRIPTION_PROMPT = `Write or improve the supplied description according to my instructions and selected output format: Plain Text, Markdown, HTML, JSON, or Custom Format. Preserve the original meaning and never invent details. Return only the requested output without headings, introductions, explanations, footers, or extra text unless requested.`;

export const EXACT_AI_TAG_PROMPT = `Generate relevant, unique tags based strictly on the supplied description. Determine the appropriate number of tags according to the description's content, topic, and complexity. Follow the selected output format and language. Return only the tags without headings or explanations. Never invent facts or add unrelated or repetitive tags.`;

// Storage Keys
const PINNED_TAGS_STORAGE_KEY = 'raj_expo_pinned_tags_v1';
const ASSET_METADATA_STORAGE_KEY = 'raj_expo_asset_custom_metadata_v1';
const PROMPT_BUILDER_STORAGE_KEY = 'raj_expo_shared_prompt_builder_v1';

// ----------------------------------------------------
// PINNED TAGS LOGIC
// ----------------------------------------------------

export const getPinnedTags = (): string[] => {
  try {
    const raw = localStorage.getItem(PINNED_TAGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load pinned tags:', err);
  }
  return ['raj_expo', 'digital', 'print', 'official', 'verified', 'master'];
};

export const savePinnedTags = (tags: string[]): void => {
  try {
    localStorage.setItem(PINNED_TAGS_STORAGE_KEY, JSON.stringify(tags));
    window.dispatchEvent(new CustomEvent('pinned-tags-updated', { detail: tags }));
  } catch (err) {
    console.error('Failed to save pinned tags:', err);
  }
};

export const togglePinTag = (tag: string): boolean => {
  const current = getPinnedTags();
  const clean = cleanTag(tag);
  if (!clean) return false;

  let updated: string[];
  let isPinned = false;
  if (current.includes(clean)) {
    updated = current.filter(t => t !== clean);
    isPinned = false;
  } else {
    updated = [...current, clean];
    isPinned = true;
  }
  savePinnedTags(updated);
  return isPinned;
};

// ----------------------------------------------------
// ASSET CUSTOM METADATA (FORMAT PRESERVATION) LOGIC
// ----------------------------------------------------

export interface AssetCustomMetadata {
  description?: string;
  tagFormat: TagFormat;
  customFormatSyntax?: string;
  formattedTagString?: string;
  lastUpdated?: string;
}

export const getAssetMetadataMap = (): Record<string, AssetCustomMetadata> => {
  try {
    const raw = localStorage.getItem(ASSET_METADATA_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load asset metadata:', err);
  }
  return {};
};

export const saveAssetMetadata = (publicId: string, metadata: Partial<AssetCustomMetadata>): void => {
  try {
    const currentMap = getAssetMetadataMap();
    currentMap[publicId] = {
      ...(currentMap[publicId] || { tagFormat: 'Comma-Separated' }),
      ...metadata,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(ASSET_METADATA_STORAGE_KEY, JSON.stringify(currentMap));
    window.dispatchEvent(new CustomEvent('asset-metadata-updated', { detail: { publicId, metadata: currentMap[publicId] } }));
  } catch (err) {
    console.error('Failed to save asset metadata:', err);
  }
};

export const getAssetMetadata = (publicId: string): AssetCustomMetadata => {
  const map = getAssetMetadataMap();
  return map[publicId] || { tagFormat: 'Comma-Separated' };
};

// ----------------------------------------------------
// TAG FORMATTING & PARSING HELPERS
// ----------------------------------------------------

export const cleanTag = (tag: string): string => {
  return tag.replace(/^[#\s]+|[#\s]+$/g, '').trim().toLowerCase();
};

export const formatTagsToString = (
  tags: string[], 
  format: TagFormat, 
  customSyntax?: string
): string => {
  const cleaned = tags.map(cleanTag).filter(Boolean);
  if (cleaned.length === 0) return '';

  switch (format) {
    case 'Comma-Separated':
      return cleaned.join(', ');
    case 'Hashtags':
      return cleaned.map(t => `#${t.replace(/\s+/g, '_')}`).join(' ');
    case 'One Tag Per Line':
      return cleaned.join('\n');
    case 'JSON Array':
      return JSON.stringify(cleaned, null, 2);
    case 'Custom Format':
      if (customSyntax && customSyntax.includes('{tag}')) {
        return cleaned.map(t => customSyntax.replace(/\{tag\}/g, t)).join('\n');
      }
      return cleaned.join(customSyntax || ' | ');
    default:
      return cleaned.join(', ');
  }
};

export const parseTagsFromString = (
  input: string, 
  format: TagFormat
): string[] => {
  if (!input || !input.trim()) return [];

  switch (format) {
    case 'JSON Array':
      try {
        const cleaned = input.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          return parsed.map(t => cleanTag(String(t))).filter(Boolean);
        }
      } catch {}
      return input.split(/[\n,]+/).map(cleanTag).filter(Boolean);
    case 'Hashtags':
      const matches = input.match(/#[a-zA-Z0-9_\-]+/g);
      if (matches) {
        return matches.map(m => cleanTag(m)).filter(Boolean);
      }
      return input.split(/[\s,]+/).map(cleanTag).filter(Boolean);
    case 'One Tag Per Line':
      return input.split(/\r?\n/).map(cleanTag).filter(Boolean);
    case 'Comma-Separated':
    case 'Custom Format':
    default:
      return input.split(/[,;\n|]+/).map(cleanTag).filter(Boolean);
  }
};

export const validateTagFormat = (
  input: string, 
  format: TagFormat
): { isValid: boolean; error?: string } => {
  if (!input.trim()) return { isValid: true };

  if (format === 'JSON Array') {
    try {
      const parsed = JSON.parse(input);
      if (!Array.isArray(parsed)) {
        return { isValid: false, error: 'Input must be a valid JSON array of strings (e.g. ["tag1", "tag2"]).' };
      }
      if (!parsed.every(item => typeof item === 'string')) {
        return { isValid: false, error: 'Every item in the JSON array must be a string.' };
      }
    } catch (e: any) {
      return { isValid: false, error: `Invalid JSON syntax: ${e.message}` };
    }
  }

  return { isValid: true };
};

// ----------------------------------------------------
// SHARED PROMPT BUILDER
// ----------------------------------------------------

export interface PromptBuilderSection {
  id: string;
  title: string;
  content: string;
  category: 'description' | 'tags' | 'instructions' | 'rules';
  enabled: boolean;
}

export const getPromptBuilderSections = (): PromptBuilderSection[] => {
  try {
    const raw = localStorage.getItem(PROMPT_BUILDER_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load prompt builder sections:', err);
  }
  return [
    {
      id: 'rules-section',
      title: 'Mandatory Output Rules',
      content: MANDATORY_STRICT_AI_RULES,
      category: 'rules',
      enabled: true,
    }
  ];
};

export const savePromptBuilderSections = (sections: PromptBuilderSection[]): void => {
  try {
    localStorage.setItem(PROMPT_BUILDER_STORAGE_KEY, JSON.stringify(sections));
    window.dispatchEvent(new CustomEvent('prompt-builder-updated', { detail: sections }));
  } catch (err) {
    console.error('Failed to save prompt builder sections:', err);
  }
};

export const addSectionToPromptBuilder = (section: Omit<PromptBuilderSection, 'id' | 'enabled'>): boolean => {
  const current = getPromptBuilderSections();
  // Prevent duplicate additions of exact same content
  const exists = current.some(s => s.content.trim() === section.content.trim());
  if (exists) {
    return false; // Already present
  }

  const newSection: PromptBuilderSection = {
    ...section,
    id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    enabled: true
  };

  // Keep rules section at the very end
  const nonRules = current.filter(s => s.category !== 'rules');
  const rules = current.filter(s => s.category === 'rules');
  if (rules.length === 0) {
    rules.push({
      id: 'rules-section',
      title: 'Mandatory Output Rules',
      content: MANDATORY_STRICT_AI_RULES,
      category: 'rules',
      enabled: true,
    });
  }

  const updated = [...nonRules, newSection, ...rules];
  savePromptBuilderSections(updated);
  return true;
};

export const assembleCompletePrompt = (sections?: PromptBuilderSection[]): string => {
  const list = sections || getPromptBuilderSections();
  const active = list.filter(s => s.enabled && s.content.trim());
  return active.map(s => `[${s.title.toUpperCase()}]\n${s.content.trim()}`).join('\n\n');
};

// ----------------------------------------------------
// VERIFIED CLIPBOARD & CHATGPT OPEN WORKFLOW
// ----------------------------------------------------

export const copyToClipboardVerified = async (text: string): Promise<{ success: boolean; fallbackNeeded: boolean }> => {
  if (!text || !text.trim()) {
    return { success: false, fallbackNeeded: false };
  }

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      soundManager.playClickSound();
      return { success: true, fallbackNeeded: false };
    }
    throw new Error('Clipboard API not available');
  } catch (err) {
    console.warn('Clipboard writeText blocked or unavailable. Falling back to textarea copy.', err);
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (successful) {
        soundManager.playClickSound();
        return { success: true, fallbackNeeded: false };
      }
    } catch (fallbackErr) {
      console.warn('ExecCommand fallback copy also failed:', fallbackErr);
    }

    return { success: false, fallbackNeeded: true };
  }
};

export const openChatGPTWithPrompt = async (promptText: string): Promise<{ success: boolean; fallbackNeeded: boolean }> => {
  const copyResult = await copyToClipboardVerified(promptText);
  // Open ChatGPT in a new tab for manual pasting and submission
  try {
    window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer');
  } catch (e) {
    window.open('https://chat.openai.com/', '_blank', 'noopener,noreferrer');
  }
  return copyResult;
};

// ----------------------------------------------------
// SERVER-SIDE CLOUDINARY API CLIENT CALLS
// ----------------------------------------------------

export const fetchCloudinaryResources = async (params?: {
  resource_type?: string;
  prefix?: string;
  next_cursor?: string;
  max_results?: number;
}): Promise<{ resources: CloudinaryAsset[]; next_cursor?: string }> => {
  const q = new URLSearchParams();
  if (params?.resource_type) q.append('resource_type', params.resource_type);
  if (params?.prefix) q.append('prefix', params.prefix);
  if (params?.next_cursor) q.append('next_cursor', params.next_cursor);
  if (params?.max_results) q.append('max_results', String(params.max_results));

  const response = await fetch(`/api/cloudinary/resources?${q.toString()}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status} failed to fetch Cloudinary resources`);
  }
  return response.json();
};

export const fetchCloudinaryFolders = async (folderPath?: string): Promise<{ folders: CloudinaryFolder[]; total_count: number }> => {
  const q = folderPath ? `?path=${encodeURIComponent(folderPath)}` : '';
  const response = await fetch(`/api/cloudinary/folders${q}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status} failed to fetch folders`);
  }
  return response.json();
};

export const createCloudinaryFolder = async (folderPath: string): Promise<{ success: boolean; path: string; name: string }> => {
  const response = await fetch('/api/cloudinary/folders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderPath })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status} failed to create folder`);
  }
  logActivity('DATABASE', `Created Cloudinary Folder: ${folderPath}`, `Folder created at path ${folderPath}`);
  return response.json();
};

export const deleteCloudinaryFolder = async (folderPath: string): Promise<{ deleted: string[] }> => {
  const response = await fetch(`/api/cloudinary/folders?path=${encodeURIComponent(folderPath)}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status} failed to delete folder`);
  }
  logActivity('DATABASE', `Deleted Cloudinary Folder: ${folderPath}`, `Folder deleted from Cloudinary`);
  return response.json();
};

export const fetchCloudinaryUsage = async (): Promise<CloudinaryUsageData> => {
  const response = await fetch('/api/cloudinary/usage');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status} failed to fetch usage data`);
  }
  return response.json();
};

export const fetchCloudinaryAccountTags = async (prefix?: string): Promise<string[]> => {
  const q = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
  const response = await fetch(`/api/cloudinary/tags${q}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status} failed to fetch tags`);
  }
  const data = await response.json();
  return data.tags || [];
};

export const updateAssetTags = async (
  publicId: string, 
  tags: string[], 
  command: 'set_tags' | 'add' | 'remove' = 'set_tags'
): Promise<any> => {
  const response = await fetch('/api/cloudinary/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ public_id: publicId, tags, command })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status} failed to update tags`);
  }
  logActivity('DATABASE', `Updated Tags for Asset: ${publicId}`, `Tags: ${tags.join(', ')} (${command})`);
  return response.json();
};

export const renameCloudinaryAsset = async (
  fromPublicId: string, 
  toPublicId: string, 
  resourceType: string = 'image'
): Promise<any> => {
  const response = await fetch('/api/cloudinary/rename', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from_public_id: fromPublicId, to_public_id: toPublicId, resource_type: resourceType })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status} failed to rename asset`);
  }
  logActivity('DATABASE', `Renamed Asset: ${fromPublicId} -> ${toPublicId}`, `Moved/Renamed in Cloudinary`);
  return response.json();
};

export const deleteCloudinaryAsset = async (
  publicId: string, 
  resourceType: string = 'image'
): Promise<any> => {
  const response = await fetch(`/api/cloudinary/resources?public_id=${encodeURIComponent(publicId)}&resource_type=${resourceType}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status} failed to delete asset`);
  }
  logActivity('DATABASE', `Deleted Asset: ${publicId}`, `Resource type: ${resourceType}`);
  return response.json();
};

// ----------------------------------------------------
// IN-APP AI DESCRIPTION & TAG CALLS (USING SERVER-SIDE GEMINI)
// ----------------------------------------------------

export const aiImproveDescriptionCall = async (
  description: string, 
  instructions?: string, 
  outputFormat?: string,
  customFormat?: string
): Promise<string> => {
  const response = await fetch('/api/ai/improve-description', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description, instructions, outputFormat, customFormat })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to improve description with AI');
  }
  const data = await response.json();
  return data.output || '';
};

export const aiGenerateTagsCall = async (
  description: string, 
  format: TagFormat = 'Comma-Separated', 
  customFormat?: string, 
  language: string = 'English'
): Promise<{ rawOutput: string; tags: string[] }> => {
  const response = await fetch('/api/ai/generate-tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description, format, customFormat, language })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate tags with AI');
  }
  return response.json();
};

// ----------------------------------------------------
// SYNC TO GITHUB REPOSITORY
// ----------------------------------------------------

export const syncCloudinaryCatalogToGitHub = async (
  assets: CloudinaryAsset[]
): Promise<{ success: boolean; message: string; sha?: string }> => {
  const config = getGitHubConfig();
  const owner = config.owner || 'iamraj-ux';
  const repo = config.repo || 'N.-A.-T..-A.-S.-H.-A-v5.-6';
  const branch = config.branch || 'main';
  const token = config.personalAccessToken?.trim() || '';

  if (!token) {
    throw new Error('GitHub Personal Access Token is unconfigured. Please connect your GitHub account in Configurations.');
  }

  const metadataMap = getAssetMetadataMap();
  const pinnedTags = getPinnedTags();

  const payload = {
    repository: `${owner}/${repo}`,
    branch,
    syncedAt: new Date().toISOString(),
    system: 'RAJ EXPO DIGITALS : Cloudinary File Manager & Smart Tags',
    operator: 'Jonathan Raj',
    cloudName: 'uhysx6is',
    totalAssets: assets.length,
    pinnedTags,
    assets: assets.map(a => ({
      asset_id: a.asset_id,
      public_id: a.public_id,
      format: a.format,
      bytes: a.bytes,
      resource_type: a.resource_type,
      secure_url: a.secure_url,
      created_at: a.created_at,
      tags: a.tags || [],
      customMetadata: metadataMap[a.public_id] || {
        tagFormat: 'Comma-Separated'
      }
    }))
  };

  const filePath = 'database/raj_expo_cloudinary_catalog.json';
  const content = JSON.stringify(payload, null, 2);

  // Check if file exists to get SHA for update
  let currentSha: string | undefined = undefined;
  try {
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    if (getRes.ok) {
      const existingData = await getRes.json();
      currentSha = existingData.sha;
    }
  } catch (e) {
    console.warn('Could not query existing file SHA on GitHub:', e);
  }

  // Base64 encode UTF-8
  const utf8Bytes = new TextEncoder().encode(content);
  let binary = '';
  utf8Bytes.forEach(byte => binary += String.fromCharCode(byte));
  const base64Content = btoa(binary);

  const commitBody: any = {
    message: `Sync Cloudinary Database Catalog & Smart Tags (${assets.length} assets) [RAJ EXPO SERVER]`,
    content: base64Content,
    branch
  };
  if (currentSha) {
    commitBody.sha = currentSha;
  }

  const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commitBody)
  });

  if (!putRes.ok) {
    const errJson = await putRes.json().catch(() => ({}));
    throw new Error(`GitHub sync failed (${putRes.status}): ${errJson.message || 'Permission or commit error'}`);
  }

  const resJson = await putRes.json();
  logActivity('DATABASE', `Synced Cloudinary Catalog to GitHub (${assets.length} assets)`, `Commit: ${resJson.commit?.sha?.substring(0, 7) || 'success'}`);
  return {
    success: true,
    message: `Successfully synced ${assets.length} Cloudinary assets and smart tag metadata to GitHub repository ${owner}/${repo}`,
    sha: resJson.commit?.sha
  };
};

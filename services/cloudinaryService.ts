/**
 * CLOUDINARY FILE STORAGE SERVICE - RAJ EXPO DIGITALS SERVER
 * 
 * Cloud Name: "uhysx6is"
 * Upload Preset: "raj_expo_upload" (Unsigned)
 * Upload Preset Type: "upload"
 * 
 * SECURITY COMPLIANCE:
 * - Direct client-side unsigned upload via Cloudinary REST API.
 * - ZERO exposure of API Secret in frontend, HTML, JS, localStorage, or Git.
 */

export const CLOUDINARY_CONFIG = {
  cloudName: 'uhysx6is',
  uploadPreset: 'raj_expo_upload',
  presetMode: 'Unsigned',
  presetType: 'upload',
} as const;

export type CloudinaryCategory = 'image' | 'video' | 'audio' | 'pdf' | 'document' | 'other';

export interface CloudinaryUploadResponse {
  asset_id: string;
  public_id: string;
  version: number;
  version_id?: string;
  signature?: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag?: string;
  placeholder?: boolean;
  url: string;
  secure_url: string;
  folder?: string;
  original_filename?: string;
  duration?: number;
}

export type UploadLifecycleState = 
  | 'IDLE' 
  | 'UPLOADING' 
  | 'CLOUDINARY_UPLOADED' 
  | 'DATABASE_SYNCING' 
  | 'DATABASE_SYNCED' 
  | 'VERIFYING' 
  | 'COMPLETED' 
  | 'ERROR';

/**
 * Returns the logical Cloudinary folder based on category
 */
export const getCloudinaryFolder = (category: string): string => {
  const norm = category.toLowerCase().trim();
  switch (norm) {
    case 'image':
      return 'raj_expo/images';
    case 'video':
      return 'raj_expo/videos';
    case 'audio':
      return 'raj_expo/audio';
    case 'pdf':
      return 'raj_expo/pdf';
    case 'document':
      return 'raj_expo/documents';
    default:
      return 'raj_expo/other';
  }
};

/**
 * Automatically maps file extension and MIME type into standard category
 */
export const resolveFileCategory = (filename: string, mimeType: string): CloudinaryCategory => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mime = (mimeType || '').toLowerCase();

  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'heic', 'avif'].includes(ext)) {
    return 'image';
  }
  if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v', '3gp', 'wmv', 'flv'].includes(ext)) {
    return 'video';
  }
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus', 'wma', 'mid'].includes(ext)) {
    return 'audio';
  }
  if (ext === 'pdf' || mime === 'application/pdf') {
    return 'pdf';
  }
  if (
    ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'csv', 'odt', 'ods', 'odp', 'rtf', 'txt'].includes(ext) ||
    mime.includes('officedocument') || mime.includes('msword') || mime.includes('excel') || mime.includes('powerpoint')
  ) {
    return 'document';
  }
  return 'other';
};

/**
 * Direct client-side unsigned upload to Cloudinary.
 * Does NOT require or use any API Secret.
 */
export const uploadFileToCloudinary = async (
  file: File,
  options?: {
    category?: CloudinaryCategory;
    description?: string;
    tags?: string[];
    onProgress?: (percent: number) => void;
  }
): Promise<CloudinaryUploadResponse> => {
  const category = options?.category || resolveFileCategory(file.name, file.type);
  const folder = getCloudinaryFolder(category);

  // Cloudinary unsigned upload endpoint
  // Using 'auto/upload' allows Cloudinary to handle images, videos, audios, and raw documents natively
  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('folder', folder);

  // Optional contextual tags & metadata
  const tagsList = ['raj_expo', category, ...(options?.tags || [])];
  formData.append('tags', tagsList.join(','));

  if (options?.description) {
    formData.append('context', `caption=${encodeURIComponent(options.description)}|alt=${encodeURIComponent(file.name)}`);
  }

  // Use XMLHttpRequest to track upload progress if requested, or fetch
  if (options?.onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          options.onProgress?.(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data: CloudinaryUploadResponse = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (parseErr) {
            reject(new Error(`Failed to parse Cloudinary response: ${xhr.responseText}`));
          }
        } else {
          try {
            const errObj = JSON.parse(xhr.responseText);
            reject(new Error(errObj.error?.message || `Cloudinary upload error ${xhr.status}: ${xhr.statusText}`));
          } catch {
            reject(new Error(`Cloudinary upload failed with status ${xhr.status}: ${xhr.responseText}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error occurred while uploading to Cloudinary.'));
      };

      xhr.send(formData);
    });
  }

  // Standard fetch fallback
  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Cloudinary upload failed with HTTP ${response.status}`);
  }

  const data: CloudinaryUploadResponse = await response.json();
  return data;
};

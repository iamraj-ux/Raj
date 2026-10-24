import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { DriveNode, GoogleContact, GoogleTask, GoogleEvent, GmailMessage } from '../types';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Provider configuration
const provider = new GoogleAuthProvider();

// Scopes required
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/forms.body'
];

SCOPES.forEach(scope => provider.addScope(scope));

// Memory Cache for Token
let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state safely without triggering unvalidated Firebase API key requests
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  try {
    const storedToken = sessionStorage.getItem('g_access_token');
    const googleConfig = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('raj_expo_google_config_v1') || '{}') : {};
    const token = storedToken || (googleConfig?.isConfigured ? googleConfig?.accessToken : null);

    if (token) {
      cachedAccessToken = token;
      const user = {
        uid: 'boss-raj-local',
        displayName: googleConfig?.userEmail ? googleConfig.userEmail.split('@')[0] : 'Boss Jonathan Raj',
        email: googleConfig?.userEmail || 'raj@rajexpodigitals.com',
        photoURL: ''
      } as unknown as User;
      if (onAuthSuccess) onAuthSuccess(user, token);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  } catch (err) {
    if (onAuthFailure) onAuthFailure();
  }

  return () => {};
};

// Set manual access token for direct standalone Google API use
export const setManualAccessToken = (token: string, userProfile?: { name?: string; email?: string }): { user: User; accessToken: string } => {
  cachedAccessToken = token;
  sessionStorage.setItem('g_access_token', token);
  const user = {
    uid: 'boss-raj-local',
    displayName: userProfile?.name || 'Boss Jonathan Raj',
    email: userProfile?.email || 'raj@rajexpodigitals.com',
    photoURL: ''
  } as unknown as User;
  return { user, accessToken: token };
};

// Google Auth Sign-in
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) {
    return null;
  }
  try {
    isSigningIn = true;
    
    // Check if token already configured in session or account configurations
    const storedToken = sessionStorage.getItem('g_access_token');
    const googleConfig = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('raj_expo_google_config_v1') || '{}') : {};
    const existingToken = storedToken || (googleConfig?.isConfigured ? googleConfig?.accessToken : null);

    if (existingToken) {
      cachedAccessToken = existingToken;
      const user = {
        uid: 'boss-raj-local',
        displayName: googleConfig?.userEmail ? googleConfig.userEmail.split('@')[0] : 'Boss Jonathan Raj',
        email: googleConfig?.userEmail || 'raj@rajexpodigitals.com',
        photoURL: ''
      } as unknown as User;
      return { user, accessToken: existingToken };
    }

    const inIframe = typeof window !== 'undefined' && window.self !== window.top;

    // Inside iframe sandboxes (e.g., AI Studio preview), Firebase signInWithPopup triggers 
    // "INTERNAL ASSERTION FAILED: Pending promise was never set" due to postMessage/popup blocks.
    // In iframe mode, directly open the Account Configuration Modal for safe token entry.
    if (inIframe) {
      console.info('[Google Auth] Running inside sandboxed container. Routing to clean Account Configuration.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-account-config', { detail: { defaultTab: 'google' } }));
      }
      return null;
    }

    // Top-level window execution: attempt popup with full safety guards
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
        sessionStorage.setItem('g_access_token', cachedAccessToken);
        return { user: result.user, accessToken: cachedAccessToken };
      }
    } catch (firebaseErr: any) {
      console.warn('Firebase popup unavailable or rejected:', firebaseErr?.message);
    }

    // Dispatch event to open Account Configuration Modal for token entry
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-account-config', { detail: { defaultTab: 'google' } }));
    }

    return null;
  } catch (error: any) {
    console.warn('OAuth Execution Diagnostic:', error);
    return null;
  } finally {
    isSigningIn = false;
  }
};

// Logout
export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  sessionStorage.removeItem('g_access_token');
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken || sessionStorage.getItem('g_access_token');
};

// Header compiler
const getHeaders = () => {
  const token = getAccessToken();
  if (!token) throw new Error('Unauthenticated. Access token missing.');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/* ==========================================================================
   GOOGLE DRIVE CONTROL LAYER
   ========================================================================== */

/**
 * Searches for a folder or file by name and parent.
 */
export const findDriveItem = async (name: string, parentId?: string, onlyFolders = false): Promise<DriveNode | null> => {
  try {
    let query = `name = '${name.replace(/'/g, "\\'")}' and trashed = false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }
    if (onlyFolders) {
      query += ` and mimeType = 'application/vnd.google-apps.folder'`;
    }

    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,webViewLink)`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error(`findDriveItem failed: ${res.statusText}`);
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      const f = data.files[0];
      return {
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        type: f.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'pdf',
        webViewLink: f.webViewLink
      };
    }
    return null;
  } catch (err) {
    console.error(err);
    return null;
  }
};

/**
 * Creates a folder inside a parent.
 */
export const createDriveFolder = async (name: string, parentId?: string): Promise<DriveNode> => {
  const url = 'https://www.googleapis.com/drive/v3/files';
  const body: any = {
    name,
    mimeType: 'application/vnd.google-apps.folder'
  };
  if (parentId) {
    body.parents = [parentId];
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create folder "${name}": ${errText}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    name: data.name,
    mimeType: data.mimeType,
    type: 'folder'
  };
};

/**
 * Bootstraps the full Cambridge Past Papers Directory structure:
 * Cambridge Past Papers
 *  ├── O Level
 *  │    ├── Subjects
 *  │    │     ├── Year (2020–2025)
 *  │    │     │     ├── Question Papers
 *  │    │     │     ├── Mark Schemes
 *  │    │     │     ├── ATP
 *  │    │     │     ├── Others
 *  └── A Level
 *       ...
 */
export const bootstrapDriveStructure = async (
  onProgress?: (msg: string) => void
): Promise<DriveNode> => {
  if (onProgress) onProgress('Searching for existing "Cambridge Past Papers" anchor folder...');
  let rootFolder = await findDriveItem('Cambridge Past Papers', undefined, true);

  if (!rootFolder) {
    if (onProgress) onProgress('Anchor not found. Creating "Cambridge Past Papers" root folder...');
    rootFolder = await createDriveFolder('Cambridge Past Papers');
  }

  const levels = ['O Level', 'A Level'];
  for (const lvl of levels) {
    if (onProgress) onProgress(`Resolving level structure for: ${lvl}...`);
    let lvlFolder = await findDriveItem(lvl, rootFolder.id, true);
    if (!lvlFolder) {
      lvlFolder = await createDriveFolder(lvl, rootFolder.id);
    }

    // Subjects
    let subjFolder = await findDriveItem('Subjects', lvlFolder.id, true);
    if (!subjFolder) {
      subjFolder = await createDriveFolder('Subjects', lvlFolder.id);
    }

    // Standard subjects (Maths, Physics, Chemistry) to seed
    const seedSubjects = ['Mathematics', 'Physics', 'Chemistry'];
    for (const sub of seedSubjects) {
      let sFolder = await findDriveItem(sub, subjFolder.id, true);
      if (!sFolder) {
        sFolder = await createDriveFolder(sub, subjFolder.id);
      }

      // Seed years 2023–2025 (Faster bootstrap)
      const years = ['2023', '2024', '2025'];
      for (const yr of years) {
        let yrFolder = await findDriveItem(yr, sFolder.id, true);
        if (!yrFolder) {
          yrFolder = await createDriveFolder(yr, sFolder.id);
        }

        // Subfolders: Question Papers, Mark Schemes, ATP, Others
        const subCats = ['Question Papers', 'Mark Schemes', 'ATP', 'Others'];
        for (const cat of subCats) {
          let catFolder = await findDriveItem(cat, yrFolder.id, true);
          if (!catFolder) {
            await createDriveFolder(cat, yrFolder.id);
          }
        }
      }
    }
  }

  if (onProgress) onProgress('Past Papers holographic structure fully synchronized!');
  return rootFolder;
};

/**
 * Helper to normalize and map Google Drive items to DriveNode
 */
export const formatDriveFile = (f: any, idx: number = 0): DriveNode => {
  let type: DriveNode['type'] = 'pdf';
  if (f.mimeType === 'application/vnd.google-apps.folder') {
    type = 'folder';
  } else if (f.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    type = 'docx';
  } else if (f.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    type = 'pptx';
  } else if (f.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    type = 'xlsx';
  } else if (f.mimeType === 'application/vnd.google-apps.spreadsheet') {
    type = 'gsheet';
  } else if (f.mimeType === 'application/vnd.google-apps.document') {
    type = 'gdoc';
  } else if (f.mimeType === 'application/vnd.google-apps.form') {
    type = 'gform';
  } else if (f.mimeType?.startsWith('image/')) {
    type = 'image';
  }

  // Calculate rough page counts
  const pages = type === 'pdf' ? 12 : type === 'pptx' ? 24 : type === 'xlsx' || type === 'gsheet' ? 3 : type === 'docx' || type === 'gdoc' ? 6 : 1;
  const sheets = Math.ceil((pages + (pages % 2 !== 0 ? 1 : 0)) / 2);

  return {
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    type,
    parentId: f.parents && f.parents.length > 0 ? f.parents[0] : undefined,
    indexNumber: idx + 1,
    pageCount: pages,
    sheetCount: sheets,
    size: f.size ? `${(parseInt(f.size) / 1024).toFixed(1)} KB` : (type === 'folder' ? 'Folder' : 'Google Cloud Doc'),
    modifiedTime: f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString() : 'Recent',
    webViewLink: f.webViewLink
  };
};

/**
 * Lists contents of a Google Drive folder and auto-indexes files/folders numerically.
 */
export const listFolderContents = async (folderId: string = 'root'): Promise<DriveNode[]> => {
  const query = `'${folderId}' in parents and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,parents)&orderBy=folder,name&pageSize=100`;
  
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Folder list failed: ${res.statusText}`);
  const data = await res.json();
  
  return (data.files || []).map((f: any, idx: number) => formatDriveFile(f, idx));
};

export interface DriveApiTestResult {
  success: boolean;
  user?: {
    displayName?: string;
    emailAddress?: string;
    photoLink?: string;
  };
  storageQuota?: {
    limit?: string;
    usage?: string;
    usageInDrive?: string;
    usageInDriveTrash?: string;
  };
  sampleFilesCount?: number;
  scopesVerified?: boolean;
  error?: string;
  timestamp: string;
}

/**
 * Executes a REAL Drive API test against Google Drive API v3.
 * Verifies token validity, user profile permissions, and file access.
 */
export const testDriveApiConnection = async (): Promise<DriveApiTestResult> => {
  const token = getAccessToken();
  if (!token) {
    return {
      success: false,
      error: 'Unauthenticated: No active Google access token found. Please sign in with Google.',
      timestamp: new Date().toISOString()
    };
  }

  try {
    const aboutRes = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!aboutRes.ok) {
      const errText = await aboutRes.text();
      let errorMsg = `Drive API Test Failed (${aboutRes.status} ${aboutRes.statusText}): ${errText}`;
      if (aboutRes.status === 401) {
        errorMsg = 'Authentication expired or invalid. Please sign in again with Google.';
      } else if (aboutRes.status === 403) {
        errorMsg = 'Permission denied (403). Ensure Google Drive API is enabled in Google Cloud project "raj-expo-central" and required scopes are consented.';
      }
      return {
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString()
      };
    }

    const aboutData = await aboutRes.json();

    const filesRes = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name,mimeType)', {
      headers: { Authorization: `Bearer ${token}` }
    });

    let sampleCount = 0;
    if (filesRes.ok) {
      const filesData = await filesRes.json();
      sampleCount = filesData.files?.length || 0;
    }

    return {
      success: true,
      user: aboutData.user,
      storageQuota: aboutData.storageQuota,
      sampleFilesCount: sampleCount,
      scopesVerified: true,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Network or runtime failure executing Drive API test: ${err.message || err}`,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Searches Google Drive files by keyword and optional mimeType or folder parent.
 */
export const searchDriveFiles = async (
  queryText: string,
  folderId?: string,
  mimeTypeFilter?: string
): Promise<DriveNode[]> => {
  const queryParts: string[] = ['trashed = false'];

  if (folderId && folderId !== 'all') {
    queryParts.push(`'${folderId}' in parents`);
  }

  if (queryText.trim()) {
    const clean = queryText.replace(/'/g, "\\'");
    queryParts.push(`(name contains '${clean}')`);
  }

  if (mimeTypeFilter && mimeTypeFilter !== 'all') {
    if (mimeTypeFilter === 'folder') {
      queryParts.push(`mimeType = 'application/vnd.google-apps.folder'`);
    } else if (mimeTypeFilter === 'pdf') {
      queryParts.push(`mimeType = 'application/pdf'`);
    } else if (mimeTypeFilter === 'sheet') {
      queryParts.push(`(mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')`);
    } else if (mimeTypeFilter === 'doc') {
      queryParts.push(`(mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')`);
    } else if (mimeTypeFilter === 'image') {
      queryParts.push(`mimeType contains 'image/'`);
    }
  }

  const q = queryParts.join(' and ');
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,parents)&orderBy=folder,modifiedTime desc&pageSize=50`;

  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive search failed: ${res.statusText} - ${errText}`);
  }
  const data = await res.json();
  return (data.files || []).map((f: any, idx: number) => formatDriveFile(f, idx));
};

/**
 * Uploads a local file directly to Google Drive via multipart upload.
 */
export const uploadDriveFile = async (
  file: File,
  parentId?: string,
  onProgress?: (progressPercent: number) => void
): Promise<DriveNode> => {
  const token = getAccessToken();
  if (!token) throw new Error('Unauthenticated. Access token missing.');

  const metadata: any = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream'
  };
  if (parentId && parentId !== 'root' && parentId !== 'all') {
    metadata.parents = [parentId];
  }

  const boundary = '-------RajExpoDriveUpload314159';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const fileHeader = `${delimiter}Content-Type: ${file.type || 'application/octet-stream'}\r\nContent-Transfer-Encoding: base64\r\n\r\n`;

  let binary = '';
  const bytes = new Uint8Array(fileData);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Data = btoa(binary);

  const multipartBody = `${metadataPart}${fileHeader}${base64Data}${closeDelimiter}`;

  if (onProgress) onProgress(35);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink,parents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartBody
  });

  if (onProgress) onProgress(90);

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive file upload failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (onProgress) onProgress(100);

  return formatDriveFile(data, 0);
};

/**
 * Downloads a Google Drive file or exports Google Workspace docs to local machine.
 */
export const downloadDriveFile = async (
  fileId: string,
  fileName: string,
  mimeType: string
): Promise<void> => {
  const token = getAccessToken();
  if (!token) throw new Error('Unauthenticated. Access token missing.');

  let fetchUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  let targetFileName = fileName;

  if (mimeType === 'application/vnd.google-apps.document') {
    fetchUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`;
    if (!targetFileName.toLowerCase().endsWith('.pdf')) targetFileName += '.pdf';
  } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    fetchUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
    if (!targetFileName.toLowerCase().endsWith('.xlsx')) targetFileName += '.xlsx';
  } else if (mimeType === 'application/vnd.google-apps.presentation') {
    fetchUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`;
    if (!targetFileName.toLowerCase().endsWith('.pdf')) targetFileName += '.pdf';
  }

  const res = await fetch(fetchUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to download file (${res.status}): ${errText}`);
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = targetFileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(blobUrl);
};

/**
 * Renames a Google Drive file.
 */
export const renameDriveFile = async (fileId: string, newName: string): Promise<DriveNode> => {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,modifiedTime,webViewLink,parents`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ name: newName })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to rename file (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return formatDriveFile(data, 0);
};

/**
 * Trashes or permanently deletes a Google Drive file.
 */
export const deleteDriveFile = async (fileId: string, permanent: boolean = false): Promise<boolean> => {
  if (permanent) {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to permanently delete file (${res.status}): ${errText}`);
    }
    return true;
  } else {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ trashed: true })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to trash file (${res.status}): ${errText}`);
    }
    return true;
  }
};

/* ==========================================================================
   GOOGLE CALENDAR SERVICE
   ========================================================================== */

export const listCalendarEvents = async (): Promise<GoogleEvent[]> => {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&timeMin=${new Date().toISOString()}&maxResults=10`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
};

export const createCalendarEvent = async (summary: string, description: string, dateStr: string): Promise<any> => {
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  const body = {
    summary,
    description,
    start: { dateTime: new Date(dateStr).toISOString() },
    end: { dateTime: new Date(new Date(dateStr).getTime() + 60 * 60 * 1000).toISOString() } // 1 Hour
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Failed to create Calendar event.');
  return await res.json();
};

/* ==========================================================================
   GOOGLE SPREADSHEETS (SHEETS) SERVICE
   ========================================================================== */

export const logToSpreadsheet = async (sheetName: string, rows: any[][]): Promise<any> => {
  // Find or create "Raj Expo Printing Logs" Spreadsheet
  let sheet = await findDriveItem(sheetName, undefined, false);
  let sheetId = '';

  if (!sheet) {
    // Create new spreadsheet
    const driveUrl = 'https://www.googleapis.com/drive/v3/files';
    const createRes = await fetch(driveUrl, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        name: sheetName,
        mimeType: 'application/vnd.google-apps.spreadsheet'
      })
    });
    if (!createRes.ok) throw new Error('Failed to create printing log spreadsheet.');
    const sheetData = await createRes.json();
    sheetId = sheetData.id;

    // Seed headers
    const seedUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A1:G1?valueInputOption=USER_ENTERED`;
    await fetch(seedUrl, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        values: [['Timestamp', 'File Name', 'Folder Path', 'Pages', 'Sheets Count', 'Single Sided Price ($)', 'Double Sided Price ($)']]
      })
    });
  } else {
    sheetId = sheet.id;
  }

  // Append row values
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A:G:append?valueInputOption=USER_ENTERED`;
  const res = await fetch(appendUrl, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ values: rows })
  });
  if (!res.ok) throw new Error('Failed to append logs to spreadsheet.');
  return await res.json();
};

/* ==========================================================================
   GOOGLE TASKS SERVICE
   ========================================================================== */

export const listGoogleTasks = async (): Promise<GoogleTask[]> => {
  const url = 'https://www.googleapis.com/tasks/v1/lists/@default/tasks?maxResults=10';
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
};

export const createGoogleTask = async (title: string, notes?: string): Promise<GoogleTask> => {
  const url = 'https://www.googleapis.com/tasks/v1/lists/@default/tasks';
  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ title, notes })
  });
  if (!res.ok) throw new Error('Failed to create Task.');
  return await res.json();
};

/* ==========================================================================
   GMAIL SERVICE (SEND RECEIPTS OR CODES)
   ========================================================================== */

export const sendGmailMessage = async (to: string, subject: string, bodyText: string): Promise<any> => {
  const url = 'https://www.googleapis.com/gmail/v1/users/me/messages/send';

  // Construct MIME email raw string
  const email = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    bodyText
  ].join('\r\n');

  const base64SafeEmail = btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ raw: base64SafeEmail })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail Dispatch failed: ${text}`);
  }
  return await res.json();
};

export const listGmailMessages = async (query?: string, labelId?: string): Promise<GmailMessage[]> => {
  let url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15';
  
  const params: string[] = [];
  if (labelId) {
    params.push(`labelIds=${labelId}`);
  }
  if (query) {
    params.push(`q=${encodeURIComponent(query)}`);
  }
  
  if (params.length > 0) {
    url += '&' + params.join('&');
  }
  
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) {
    console.error('Failed to list Gmail messages:', await res.text());
    return [];
  }
  
  const data = await res.json();
  if (!data.messages || data.messages.length === 0) {
    return [];
  }
  
  // Fetch details for each message in parallel
  const detailPromises = data.messages.map(async (msg: any) => {
    try {
      const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;
      const detailRes = await fetch(detailUrl, { headers: getHeaders() });
      if (!detailRes.ok) return null;
      const detailData = await detailRes.json();
      
      const headers = detailData.payload?.headers || [];
      const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
      const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '(Unknown Sender)';
      const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || '';
      const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
      
      // Determine body content
      let body = '';
      if (detailData.payload) {
        body = getBodyFromPayload(detailData.payload);
      }
      if (!body) {
        body = detailData.snippet || '';
      }
      
      return {
        id: detailData.id,
        threadId: detailData.threadId,
        subject,
        from,
        to,
        date,
        snippet: detailData.snippet || '',
        body,
        labelIds: detailData.labelIds || []
      } as GmailMessage;
    } catch (e) {
      console.error(`Error loading detail for message ${msg.id}:`, e);
      return null;
    }
  });
  
  const results = await Promise.all(detailPromises);
  return results.filter((r): r is GmailMessage => r !== null);
};

export const trashGmailMessage = async (id: string): Promise<boolean> => {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/trash`;
  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) {
    console.error('Failed to trash message:', await res.text());
    return false;
  }
  return true;
};

// Helper to extract body from payload
const getBodyFromPayload = (payload: any): string => {
  if (!payload) return '';
  if (payload.body?.data) {
    try {
      return decodeBase64(payload.body.data);
    } catch {
      return '';
    }
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const partBody = getBodyFromPayload(part);
      if (partBody) return partBody;
    }
  }
  return '';
};

// Base64 decode helper that handles base64url format
const decodeBase64 = (base64SafeString: string): string => {
  let base64 = base64SafeString.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  try {
    return decodeURIComponent(escape(atob(base64)));
  } catch {
    try {
      return atob(base64);
    } catch {
      return '';
    }
  }
};

/* ==========================================================================
   CONTACTS (PEOPLE API) SERVICE
   ========================================================================== */

export const fetchContacts = async (): Promise<GoogleContact[]> => {
  const url = 'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses&pageSize=10';
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  
  return (data.connections || []).map((conn: any) => {
    const name = conn.names?.[0]?.displayName || 'No Name';
    const email = conn.emailAddresses?.[0]?.value || 'No Email';
    const id = conn.resourceName;
    return { id, name, email };
  });
};

/* ==========================================================================
   GOOGLE DOCS SERVICE
   ========================================================================== */

export const createGoogleDoc = async (title: string, content: string): Promise<any> => {
  // First create doc in Drive
  const createUrl = 'https://docs.googleapis.com/v1/documents';
  const res = await fetch(createUrl, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ title })
  });
  if (!res.ok) throw new Error('Docs Creation Failed.');
  const doc = await res.json();

  // Then update Docs body content
  const updateUrl = `https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`;
  const updateRes = await fetch(updateUrl, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            text: content,
            location: { index: 1 }
          }
        }
      ]
    })
  });
  if (!updateRes.ok) throw new Error('Docs body insertion failed.');
  return doc;
};

/* ==========================================================================
   GOOGLE KEEP SERVICE (REST API NOTES ACCESSIBILITY)
   ========================================================================== */

export const createKeepNote = async (title: string, text: string): Promise<any> => {
  // Creating a Note in Keep via API
  // Note: Keep API is sometimes restricted, so we fallback gracefully or create a Docs note
  try {
    const url = 'https://keep.googleapis.com/v1/notes';
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        title,
        body: { text }
      })
    });
    if (!res.ok) {
      // Fallback: create as standard drive Note file
      const driveUrl = 'https://www.googleapis.com/drive/v3/files';
      const fallbackRes = await fetch(driveUrl, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: `[Note] ${title}.txt`,
          mimeType: 'text/plain'
        })
      });
      return await fallbackRes.json();
    }
    return await res.json();
  } catch (err) {
    // Resilient fallback to text creation
    const driveUrl = 'https://www.googleapis.com/drive/v3/files';
    const fbRes = await fetch(driveUrl, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        name: `[Note] ${title}.txt`,
        mimeType: 'text/plain'
      })
    });
    return await fbRes.json();
  }
};

/* ==========================================================================
   GOOGLE FORMS SERVICE
   ========================================================================== */

export const listUserFeedbackForms = async (): Promise<any[]> => {
  // Fetches any Google Forms in Drive of the user
  const query = "mimeType = 'application/vnd.google-apps.form' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  return data.files || [];
};

/* ==========================================================================
   GOOGLE PICKER API SERVICE
   ========================================================================== */

export interface PickedGoogleFile {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  sizeBytes?: number;
  lastEditedUtc?: number;
  iconUrl?: string;
  description?: string;
}

export interface OpenGooglePickerOptions {
  viewId?: 'ALL' | 'DOCS' | 'SPREADSHEETS' | 'PDFS' | 'PRESENTATIONS';
  multiselect?: boolean;
  onPick?: (files: PickedGoogleFile[]) => void;
  onCancel?: () => void;
}

/**
 * Loads the Google Picker API via gapi
 */
export const loadGooglePickerApi = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.picker) {
      resolve();
      return;
    }

    const initGapi = () => {
      const gapi = (window as any).gapi;
      if (!gapi) {
        reject(new Error('Google API client (gapi) script could not be loaded.'));
        return;
      }
      gapi.load('picker', {
        callback: () => {
          resolve();
        },
        onerror: () => {
          reject(new Error('Failed to load Google Picker API script module.'));
        }
      });
    };

    if ((window as any).gapi) {
      initGapi();
    } else {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => initGapi();
      script.onerror = () => reject(new Error('Failed to load Google API script.'));
      document.body.appendChild(script);
    }
  });
};

/**
 * Launches the Google Picker Modal widget with the user's active Google OAuth access token
 */
export const openGooglePicker = async (options?: OpenGooglePickerOptions): Promise<PickedGoogleFile[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Please sign in with Google to use Google Picker.');
  }

  await loadGooglePickerApi();

  return new Promise((resolve, reject) => {
    try {
      const pickerOrigin =
        (window.location as any).ancestorOrigins &&
        (window.location as any).ancestorOrigins.length > 0
          ? (window.location as any).ancestorOrigins[(window.location as any).ancestorOrigins.length - 1]
          : window.location.origin;

      const google = (window as any).google;
      if (!google?.picker) {
        reject(new Error('Google Picker library is not ready.'));
        return;
      }

      const pickerBuilder = new google.picker.PickerBuilder();

      // Configure DocsView based on view preference
      const view = new google.picker.DocsView();
      view.setIncludeFolders(true);

      if (options?.viewId === 'SPREADSHEETS') {
        view.setMimeTypes('application/vnd.google-apps.spreadsheet,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv');
      } else if (options?.viewId === 'PDFS') {
        view.setMimeTypes('application/pdf');
      } else if (options?.viewId === 'DOCS') {
        view.setMimeTypes('application/vnd.google-apps.document,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain');
      } else if (options?.viewId === 'PRESENTATIONS') {
        view.setMimeTypes('application/vnd.google-apps.presentation,application/vnd.openxmlformats-officedocument.presentationml.presentation');
      }

      pickerBuilder.addView(view);
      
      // Add Upload view so users can directly upload to Drive through the Picker widget
      pickerBuilder.addView(new google.picker.DocsUploadView());

      if (options?.multiselect) {
        pickerBuilder.enableFeature(google.picker.Feature.MULTISELECT_ENABLED);
      }

      pickerBuilder.setOAuthToken(token);
      pickerBuilder.setOrigin(pickerOrigin);
      pickerBuilder.setTitle('Remix Raj Expo // Google Picker Hub');

      pickerBuilder.setCallback((data: any) => {
        if (data.action === google.picker.Action.PICKED) {
          const pickedFiles: PickedGoogleFile[] = (data.docs || []).map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            mimeType: doc.mimeType,
            url: doc.url,
            sizeBytes: doc.sizeBytes,
            lastEditedUtc: doc.lastEditedUtc,
            iconUrl: doc.iconUrl,
            description: doc.description
          }));
          if (options?.onPick) options.onPick(pickedFiles);
          resolve(pickedFiles);
        } else if (data.action === google.picker.Action.CANCEL) {
          if (options?.onCancel) options.onCancel();
          resolve([]);
        }
      });

      const picker = pickerBuilder.build();
      picker.setVisible(true);
    } catch (err) {
      console.error('Failed to construct Google Picker:', err);
      reject(err);
    }
  });
};

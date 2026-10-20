import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  HardDrive, Folder, FileText, Search, Upload, Download, Trash2, 
  Edit3, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink, ShieldCheck,
  ChevronRight, ArrowLeft, Plus, Eye, Sparkles, Database, FileSpreadsheet,
  FileCode, Layers, Info, Check, X, ShieldAlert, LogIn, LogOut
} from 'lucide-react';
import { DraggableResizableWindow } from './DraggableResizableWindow';
import { 
  DriveNode, FileType, DocFileData 
} from '../types';
import { 
  getAccessToken,
  googleSignIn,
  logout,
  testDriveApiConnection,
  listFolderContents,
  searchDriveFiles,
  uploadDriveFile,
  downloadDriveFile,
  renameDriveFile,
  deleteDriveFile,
  createDriveFolder,
  DriveApiTestResult
} from '../services/googleService';
import { logActivity } from '../services/activityLogger';
import { soundManager } from '../services/soundEffects';

interface GoogleDriveExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportToQueue?: (fileData: DocFileData) => void;
}

export const GoogleDriveExplorerModal: React.FC<GoogleDriveExplorerModalProps> = ({
  isOpen,
  onClose,
  onImportToQueue
}) => {
  // Navigation & Folder hierarchy
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([
    { id: 'root', name: 'My Drive' }
  ]);
  const [driveItems, setDriveItems] = useState<DriveNode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'folder' | 'pdf' | 'doc' | 'sheet' | 'image'>('all');

  // Real Drive API Diagnostic Test state
  const [isTestingApi, setIsTestingApi] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<DriveApiTestResult | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'files' | 'upload' | 'diagnostic' | 'oauth_guide'>('files');

  // File Upload state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string>('');
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Folder Dialog state
  const [isNewFolderOpen, setIsNewFolderOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');

  // Rename File Dialog state
  const [itemToRename, setItemToRename] = useState<DriveNode | null>(null);
  const [renameInputValue, setRenameInputValue] = useState<string>('');

  // Delete Confirmation Dialog state (MANDATORY per workspace integration rules)
  const [itemToDelete, setItemToDelete] = useState<DriveNode | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [permanentDelete, setPermanentDelete] = useState<boolean>(false);

  // Status feedback toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Check auth and run initial test when modal opens
  const verifyAuthAndTest = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setIsAuthenticated(false);
      setTestResult(null);
      return;
    }
    setIsAuthenticated(true);
    setIsTestingApi(true);
    try {
      const result = await testDriveApiConnection();
      setTestResult(result);
      if (result.success) {
        logActivity('DATABASE', 'Google Drive API Test Certified', `Connected as ${result.user?.emailAddress || 'Authorized User'}.`);
      } else {
        logActivity('DATABASE', 'Google Drive API Test Warning', result.error || 'Connection check unverified.');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'Drive API verification failed',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsTestingApi(false);
    }
  }, []);

  // Fetch current folder or search items
  const loadItems = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setDriveItems([]);
      return;
    }

    setIsLoading(true);
    try {
      if (searchQuery.trim()) {
        const results = await searchDriveFiles(searchQuery, currentFolderId === 'root' ? undefined : currentFolderId, selectedFilter);
        setDriveItems(results);
      } else {
        const items = await listFolderContents(currentFolderId);
        let filtered = items;
        if (selectedFilter !== 'all') {
          if (selectedFilter === 'folder') filtered = items.filter(i => i.type === 'folder');
          else if (selectedFilter === 'pdf') filtered = items.filter(i => i.type === 'pdf');
          else if (selectedFilter === 'sheet') filtered = items.filter(i => i.type === 'xlsx' || i.type === 'gsheet');
          else if (selectedFilter === 'doc') filtered = items.filter(i => i.type === 'docx' || i.type === 'gdoc');
          else if (selectedFilter === 'image') filtered = items.filter(i => i.type === 'image');
        }
        setDriveItems(filtered);
      }
    } catch (err: any) {
      showToast(`Failed to load Google Drive items: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentFolderId, searchQuery, selectedFilter]);

  useEffect(() => {
    if (isOpen) {
      verifyAuthAndTest();
      loadItems();
    }
  }, [isOpen, verifyAuthAndTest, loadItems]);

  // Handle Google Sign In
  const handleSignIn = async () => {
    try {
      soundManager.playClickSound();
      const res = await googleSignIn();
      if (res) {
        setIsAuthenticated(true);
        showToast(`Signed in successfully as ${res.user.displayName || res.user.email}!`, 'success');
        await verifyAuthAndTest();
        await loadItems();
      }
    } catch (err: any) {
      showToast(`Google Sign-in failed: ${err.message || err}`, 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      soundManager.playClickSound();
      await logout();
      setIsAuthenticated(false);
      setTestResult(null);
      setDriveItems([]);
      showToast('Signed out of Google Workspace session.', 'info');
    } catch (err: any) {
      showToast(`Sign out error: ${err.message}`, 'error');
    }
  };

  // Folder Navigation
  const navigateToFolder = (folderId: string, folderName: string) => {
    soundManager.playClickSound();
    setCurrentFolderId(folderId);
    setSearchQuery('');
    setBreadcrumbs(prev => [...prev, { id: folderId, name: folderName }]);
  };

  const navigateToBreadcrumb = (index: number) => {
    soundManager.playClickSound();
    const target = breadcrumbs[index];
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    setCurrentFolderId(target.id);
    setSearchQuery('');
  };

  const navigateUp = () => {
    if (breadcrumbs.length <= 1) return;
    soundManager.playClickSound();
    const newCrumbs = breadcrumbs.slice(0, breadcrumbs.length - 1);
    setBreadcrumbs(newCrumbs);
    setCurrentFolderId(newCrumbs[newCrumbs.length - 1].id);
  };

  // Upload Handling
  const handleFilesUpload = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    soundManager.playClickSound();
    setUploadProgress(10);
    setUploadStatusMsg(`Uploading ${fileList.length} file(s) to Drive...`);

    let successCount = 0;
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadStatusMsg(`Uploading "${file.name}" (${i + 1}/${fileList.length})...`);
        await uploadDriveFile(file, currentFolderId === 'root' ? undefined : currentFolderId, (pct) => {
          setUploadProgress(Math.round(((i + pct / 100) / fileList.length) * 100));
        });
        successCount++;
      }
      soundManager.playWelcomeSound();
      showToast(`Successfully uploaded ${successCount} file(s) to Google Drive!`, 'success');
      logActivity('DATABASE', 'Google Drive File Uploaded', `Uploaded ${successCount} files to folder ${breadcrumbs[breadcrumbs.length - 1].name}`);
      setUploadStatusMsg('');
      setUploadProgress(null);
      setActiveTab('files');
      loadItems();
    } catch (err: any) {
      soundManager.playWrongInputSound();
      showToast(`Upload failed: ${err.message}`, 'error');
      setUploadStatusMsg(`Error: ${err.message}`);
      setUploadProgress(null);
    }
  };

  // Download Handling
  const handleDownload = async (item: DriveNode) => {
    try {
      soundManager.playClickSound();
      showToast(`Downloading "${item.name}" from Google Drive...`, 'info');
      await downloadDriveFile(item.id, item.name, item.mimeType);
      showToast(`Downloaded "${item.name}" successfully!`, 'success');
      logActivity('DATABASE', 'Google Drive File Downloaded', `Saved file: ${item.name}`);
    } catch (err: any) {
      showToast(`Download failed: ${err.message}`, 'error');
    }
  };

  // Rename Handling
  const handleRenameSubmit = async () => {
    if (!itemToRename || !renameInputValue.trim()) return;
    try {
      soundManager.playClickSound();
      await renameDriveFile(itemToRename.id, renameInputValue.trim());
      showToast(`Renamed file to "${renameInputValue.trim()}"!`, 'success');
      logActivity('DATABASE', 'Google Drive File Renamed', `Renamed "${itemToRename.name}" -> "${renameInputValue.trim()}"`);
      setItemToRename(null);
      setRenameInputValue('');
      loadItems();
    } catch (err: any) {
      showToast(`Failed to rename: ${err.message}`, 'error');
    }
  };

  // Delete Handling (with mandatory confirmation)
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      soundManager.playClickSound();
      await deleteDriveFile(itemToDelete.id, permanentDelete);
      showToast(`${permanentDelete ? 'Permanently deleted' : 'Moved to Drive trash'}: "${itemToDelete.name}"`, 'success');
      logActivity('DATABASE', permanentDelete ? 'Google Drive File Deleted' : 'Google Drive File Trashed', `Item: ${itemToDelete.name} (ID: ${itemToDelete.id})`);
      setItemToDelete(null);
      setPermanentDelete(false);
      loadItems();
    } catch (err: any) {
      showToast(`Failed to delete: ${err.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Create Folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      soundManager.playClickSound();
      await createDriveFolder(newFolderName.trim(), currentFolderId === 'root' ? undefined : currentFolderId);
      showToast(`Created folder "${newFolderName.trim()}" in Google Drive!`, 'success');
      logActivity('DATABASE', 'Google Drive Folder Created', `Folder: ${newFolderName.trim()}`);
      setIsNewFolderOpen(false);
      setNewFolderName('');
      loadItems();
    } catch (err: any) {
      showToast(`Failed to create folder: ${err.message}`, 'error');
    }
  };

  // Import directly to document counter
  const handleImportFile = (item: DriveNode) => {
    if (!onImportToQueue) return;
    soundManager.playWelcomeSound();
    const docFile: DocFileData = {
      id: `drive-import-${item.id}`,
      name: item.name,
      driveFileId: item.id,
      type: item.type,
      count: item.pageCount || 1,
      portraitCount: item.pageCount || 1,
      landscapeCount: 0,
      sheetCount: item.sheetCount || 1,
      singleSidedPrice: (item.pageCount || 1) * 10,
      doubleSidedPrice: (item.sheetCount || 1) * 10
    };
    onImportToQueue(docFile);
    showToast(`Imported "${item.name}" into past papers print queue!`, 'success');
  };

  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return 'Unknown';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return bytesStr;
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <DraggableResizableWindow
      isOpen={isOpen}
      onClose={onClose}
      title="GOOGLE DRIVE // CLOUD REPOSITORY & OAUTH CONTROL"
      initialWidth={1040}
      initialHeight={730}
      minWidth={720}
      minHeight={500}
    >
      <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
        {/* TOP STATUS & NAVIGATION BAR */}
        <div className="border-b border-cyan-500/20 bg-slate-900/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400">
              <HardDrive className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-white uppercase font-mono">
                  Google Drive Mainframe
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Project: raj-expo-central
                </span>
                {testResult?.success ? (
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> API VERIFIED
                  </span>
                ) : isAuthenticated ? (
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" /> DIAGNOSTIC PENDING
                  </span>
                ) : (
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    UNAUTHENTICATED
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Full Scope: https://www.googleapis.com/auth/drive & files.list / multipart upload
              </div>
            </div>
          </div>

          {/* User Auth or Sign-in Action */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {testResult?.user?.photoLink && (
                  <img
                    src={testResult.user.photoLink}
                    alt="User"
                    className="w-7 h-7 rounded-full border border-cyan-400/40"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="text-right hidden sm:block">
                  <div className="text-[11px] font-bold text-slate-200">
                    {testResult?.user?.displayName || 'Authorized User'}
                  </div>
                  <div className="text-[9px] text-cyan-400/80 font-mono">
                    {testResult?.user?.emailAddress || 'drvicvondom@gmail.com'}
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Sign out of Google"
                >
                  <LogOut className="w-3 h-3 text-red-400" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="gsi-material-button px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-medium text-xs flex items-center gap-2 transition-all shadow cursor-pointer border border-slate-300"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB CONTROLS */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 bg-slate-950 px-4 py-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => { soundManager.playClickSound(); setActiveTab('files'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'files'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Drive Explorer</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                {driveItems.length}
              </span>
            </button>

            <button
              onClick={() => { soundManager.playClickSound(); setActiveTab('upload'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Center</span>
            </button>

            <button
              onClick={() => { soundManager.playClickSound(); setActiveTab('diagnostic'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'diagnostic'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Drive API Test & Quota</span>
            </button>

            <button
              onClick={() => { soundManager.playClickSound(); setActiveTab('oauth_guide'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'oauth_guide'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>OAuth & Verification Guide</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { soundManager.playClickSound(); verifyAuthAndTest(); loadItems(); }}
              disabled={isLoading || isTestingApi}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 text-xs font-mono transition-colors cursor-pointer"
              title="Refresh Drive connection and files"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isTestingApi ? 'animate-spin' : ''}`} />
            </button>
            <a
              href="https://drive.google.com"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono transition-colors flex items-center gap-1"
              title="Open Google Drive Web Console in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* TOAST MESSAGE */}
        {toastMessage && (
          <div className={`px-4 py-2 text-xs font-mono flex items-center justify-between border-b transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/40'
              : 'bg-cyan-950/90 text-cyan-300 border-cyan-500/40'
          }`}>
            <span>{toastMessage.text}</span>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TAB 1: DRIVE FILE EXPLORER */}
        {activeTab === 'files' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4 space-y-3">
            {/* Top Toolbar: Breadcrumbs, Search, Filter & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Breadcrumb Path */}
              <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-cyan-500/30 overflow-x-auto max-w-full">
                <button
                  onClick={navigateUp}
                  disabled={breadcrumbs.length <= 1}
                  className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-cyan-400 cursor-pointer"
                  title="Go back up"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={crumb.id}>
                    {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}
                    <button
                      onClick={() => navigateToBreadcrumb(idx)}
                      className={`text-xs font-mono px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer truncate max-w-[140px] ${
                        idx === breadcrumbs.length - 1 ? 'text-cyan-300 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {crumb.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Action Buttons: New Folder & Upload */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsNewFolderOpen(true)}
                  disabled={!isAuthenticated}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Folder</span>
                </button>

                <button
                  onClick={() => setActiveTab('upload')}
                  disabled={!isAuthenticated}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer disabled:opacity-40"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
              </div>
            </div>

            {/* Filter Bar and Search Input */}
            <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files or full text in Google Drive..."
                  className="w-full bg-slate-900/90 border border-cyan-500/30 rounded-xl pl-9 pr-8 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Type Filters */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[10px] font-mono">
                {(['all', 'folder', 'pdf', 'sheet', 'doc', 'image'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSelectedFilter(tab)}
                    className={`px-2.5 py-1 rounded-lg uppercase font-bold transition-all cursor-pointer ${
                      selectedFilter === tab
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab === 'all' ? 'All' : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* File List Container */}
            <div className="flex-1 min-h-0 bg-slate-900/40 rounded-2xl border border-cyan-500/20 overflow-y-auto p-2">
              {!isAuthenticated ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-4">
                    <ShieldAlert className="w-10 h-10" />
                  </div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider mb-2">
                    Google Drive OAuth Authentication Required
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                    Connect your Google account with the Google Cloud project <code className="text-cyan-300">raj-expo-central</code> to securely list, search, upload, download, and manage your Drive files.
                  </p>
                  <button
                    onClick={handleSignIn}
                    className="px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-3 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer hover:scale-105"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Authorize with Google Drive OAuth</span>
                  </button>
                </div>
              ) : isLoading ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-cyan-400">
                  <RefreshCw className="w-8 h-8 animate-spin mb-3" />
                  <p className="text-xs font-mono uppercase tracking-widest">Scanning Google Drive Hierarchy...</p>
                </div>
              ) : driveItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <Folder className="w-12 h-12 stroke-[1] mb-2 text-slate-600" />
                  <p className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    {searchQuery ? `No files found matching "${searchQuery}"` : 'This folder is currently empty.'}
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="mt-4 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-400 text-xs font-mono flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload First File to Drive</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {driveItems.map((item) => (
                    <div
                      key={item.id}
                      className="px-3 py-2.5 rounded-xl hover:bg-slate-800/60 flex items-center justify-between gap-3 group transition-colors"
                    >
                      {/* Left: Icon & Info */}
                      <div 
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        onClick={() => {
                          if (item.type === 'folder') {
                            navigateToFolder(item.id, item.name);
                          } else if (item.webViewLink) {
                            window.open(item.webViewLink, '_blank');
                          }
                        }}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${
                          item.type === 'folder'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : item.type === 'pdf'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : item.type === 'xlsx' || item.type === 'gsheet'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : item.type === 'docx' || item.type === 'gdoc'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        }`}>
                          {item.type === 'folder' ? (
                            <Folder className="w-4 h-4 fill-amber-500/20" />
                          ) : item.type === 'xlsx' || item.type === 'gsheet' ? (
                            <FileSpreadsheet className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                              {item.name}
                            </span>
                            {item.type === 'folder' && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                                Folder
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-3 mt-0.5">
                            <span>{item.size || 'Google Cloud Doc'}</span>
                            <span>•</span>
                            <span>Modified: {item.modifiedTime}</span>
                            {item.pageCount && item.type !== 'folder' && (
                              <>
                                <span>•</span>
                                <span className="text-cyan-400">{item.pageCount} Pages ({item.sheetCount} Sheets)</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {/* Import into Queue */}
                        {item.type !== 'folder' && onImportToQueue && (
                          <button
                            onClick={() => handleImportFile(item)}
                            className="p-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                            title="Import into Past Paper Document Counter"
                          >
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            <span className="hidden xl:inline">Import</span>
                          </button>
                        )}

                        {/* Download */}
                        {item.type !== 'folder' && (
                          <button
                            onClick={() => handleDownload(item)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                            title="Download file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Open in Drive Web */}
                        {item.webViewLink && (
                          <a
                            href={item.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                            title="Open in Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* Rename */}
                        <button
                          onClick={() => {
                            setItemToRename(item);
                            setRenameInputValue(item.name);
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                          title="Rename file"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        </button>

                        {/* Delete / Trash with explicit confirmation modal */}
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 cursor-pointer"
                          title="Delete file (requires confirmation)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: UPLOAD CENTER */}
        {activeTab === 'upload' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-6 space-y-6">
            <div className="bg-slate-900/60 rounded-2xl border border-cyan-500/20 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/40">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">
                      Upload Files to Google Drive
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      Target Folder: <span className="text-cyan-300 font-bold">{breadcrumbs[breadcrumbs.length - 1].name}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('files')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
                >
                  Back to Files
                </button>
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(false);
                  if (e.dataTransfer?.files?.length) {
                    handleFilesUpload(e.dataTransfer.files);
                  }
                }}
                className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer ${
                  isDraggingOver
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_30px_rgba(34,211,238,0.3)]'
                    : 'border-slate-700 bg-slate-950/60 hover:border-cyan-500/50 hover:bg-slate-900/60'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      handleFilesUpload(e.target.files);
                    }
                  }}
                  className="hidden"
                />
                <div className="p-4 rounded-full bg-cyan-500/10 text-cyan-400 inline-block mb-3 border border-cyan-500/20">
                  <Upload className="w-8 h-8 animate-bounce" />
                </div>
                <h5 className="text-sm font-bold text-white mb-1">
                  Drag & Drop Files Here, or Click to Browse
                </h5>
                <p className="text-xs text-slate-400 font-mono mb-4">
                  Supports past paper PDFs, Word documents (.docx), Excel spreadsheets (.xlsx), PowerPoint (.pptx), images & media.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <span>Browse Local Computer</span>
                </div>
              </div>

              {/* Progress bar */}
              {uploadProgress !== null && (
                <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-cyan-500/30">
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-cyan-300">{uploadStatusMsg}</span>
                    <span className="text-cyan-400 font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: REAL DRIVE API DIAGNOSTIC & QUOTA TEST */}
        {activeTab === 'diagnostic' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-6 space-y-6">
            <div className="bg-slate-900/60 rounded-2xl border border-cyan-500/20 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">
                      Real-Time Google Drive API Connection Diagnostics
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      Strict verification test against Google Drive API v3 endpoints.
                    </p>
                  </div>
                </div>

                <button
                  onClick={verifyAuthAndTest}
                  disabled={isTestingApi || !isAuthenticated}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingApi ? 'animate-spin' : ''}`} />
                  <span>Run Live Drive API Test</span>
                </button>
              </div>

              {/* Result Card */}
              {isTestingApi ? (
                <div className="p-8 rounded-2xl bg-slate-950 border border-cyan-500/30 text-center text-cyan-400 font-mono text-xs">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-400" />
                  Testing Google Drive API endpoints...
                </div>
              ) : testResult ? (
                <div className={`p-5 rounded-2xl border ${
                  testResult.success
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {testResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider font-mono">
                          {testResult.success ? 'Drive API Verified & Operational' : 'Drive API Access Failure'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Tested: {new Date(testResult.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      {testResult.error && (
                        <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/30 text-xs font-mono text-rose-300">
                          {testResult.error}
                        </div>
                      )}

                      {testResult.user && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-slate-300">
                          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                            <span className="text-slate-500 block text-[10px]">AUTHENTICATED USER</span>
                            <span className="text-white font-bold">{testResult.user.displayName || 'Google User'}</span>
                            <span className="text-cyan-400 block text-[10px]">{testResult.user.emailAddress}</span>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                            <span className="text-slate-500 block text-[10px]">TEST FILE COUNT READ</span>
                            <span className="text-white font-bold">{testResult.sampleFilesCount} files retrieved</span>
                            <span className="text-emerald-400 block text-[10px]">Read permission certified</span>
                          </div>
                        </div>
                      )}

                      {testResult.storageQuota && (
                        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400">Google Drive Storage Quota Usage:</span>
                            <span className="text-cyan-300 font-bold">
                              {formatBytes(testResult.storageQuota.usage)} / {formatBytes(testResult.storageQuota.limit)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-cyan-400 h-full"
                              style={{ 
                                width: testResult.storageQuota.limit && testResult.storageQuota.usage 
                                  ? `${Math.min(100, (parseInt(testResult.storageQuota.usage) / parseInt(testResult.storageQuota.limit)) * 100)}%`
                                  : '25%'
                              }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Usage in Drive: {formatBytes(testResult.storageQuota.usageInDrive)} | Trash: {formatBytes(testResult.storageQuota.usageInDriveTrash)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center text-slate-400 font-mono text-xs">
                  Click &ldquo;Run Live Drive API Test&rdquo; above to verify your active Google Drive API token.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: OAUTH & VERIFICATION EXPLANATION GUIDE */}
        {activeTab === 'oauth_guide' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-6 space-y-5 text-xs text-slate-300">
            <div className="bg-slate-900/60 rounded-2xl border border-cyan-500/20 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    Google OAuth & Scope Verification Architecture
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Essential guidelines for configuring Google Cloud project &ldquo;raj-expo-central&rdquo;.
                  </p>
                </div>
              </div>

              <div className="space-y-4 leading-relaxed font-mono text-[11px]">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-cyan-300 font-bold mb-1">1. Full Drive Scope (<code className="text-amber-300">https://www.googleapis.com/auth/drive</code>)</div>
                  <p className="text-slate-400">
                    The full Drive scope allows the app to view, upload, rename, and delete any file in Google Drive. Google classifies this scope as <strong>Restricted</strong>. If the Google Cloud project OAuth consent screen is set to <em>&ldquo;Testing&rdquo;</em>, only specified <strong>Test Users</strong> can sign in without seeing an unverified app block.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-cyan-300 font-bold mb-1">2. Adding Test Users in Google Cloud Console</div>
                  <p className="text-slate-400">
                    To use the app without app verification delays, go to <strong>Google Cloud Console &rarr; APIs &amp; Services &rarr; OAuth consent screen &rarr; Test users</strong>, and add <code className="text-emerald-300">drvicvondom@gmail.com</code> (or any user accessing the app).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-cyan-300 font-bold mb-1">3. Token Security &amp; Client-Side OAuth</div>
                  <p className="text-slate-400">
                    In compliance with security standards, tokens are held securely in-memory and in session state. No client secrets are stored in the client bundle. All calls to <code className="text-slate-300">drive.googleapis.com</code> use standard OAuth 2.0 Bearer authorization headers.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-cyan-300 font-bold mb-1">4. Sandboxed iFrame &amp; Pop-up Notice</div>
                  <p className="text-slate-400">
                    Because this preview runs inside a sandboxed iframe, if your browser blocks popups or third-party cookies, click the &ldquo;OPEN APP IN NEW TAB&rdquo; button in the top-right corner to authenticate directly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DIALOG 1: NEW FOLDER */}
        {isNewFolderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
              <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                Create New Folder in Google Drive
              </h4>
              <p className="text-xs text-slate-400">
                Inside: <span className="text-cyan-300">{breadcrumbs[breadcrumbs.length - 1].name}</span>
              </p>
              <input
                type="text"
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                placeholder="Folder name (e.g., Cambridge Past Papers 2026)"
                className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsNewFolderOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-40"
                >
                  Create Folder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DIALOG 2: RENAME FILE */}
        {itemToRename && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
              <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                Rename File in Google Drive
              </h4>
              <p className="text-xs text-slate-400 font-mono truncate">
                Current: {itemToRename.name}
              </p>
              <input
                type="text"
                autoFocus
                value={renameInputValue}
                onChange={(e) => setRenameInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                placeholder="New name..."
                className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setItemToRename(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameSubmit}
                  disabled={!renameInputValue.trim()}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-40"
                >
                  Confirm Rename
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DIALOG 3: DELETE CONFIRMATION (MANDATORY PER WORKSPACE INTEGRATION SKILL) */}
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-slate-900 border-2 border-rose-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                    Confirm Google Drive Deletion
                  </h4>
                  <p className="text-[11px] text-rose-300 font-mono">
                    User authorization required for destructive operation
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs text-slate-300 font-mono">
                  Are you sure you want to delete this file from Google Drive?
                </div>
                <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/20 text-xs font-bold text-white font-mono truncate">
                  {itemToDelete.name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Type: {itemToDelete.type.toUpperCase()} | Size: {itemToDelete.size || 'N/A'}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permanentDelete}
                  onChange={(e) => setPermanentDelete(e.target.checked)}
                  className="rounded border-slate-700 text-rose-500 focus:ring-rose-400"
                />
                <span>Permanently delete (skip Google Drive trash bin)</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setItemToDelete(null);
                    setPermanentDelete(false);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DraggableResizableWindow>
  );
};

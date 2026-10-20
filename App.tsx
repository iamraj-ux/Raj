import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUploader } from './components/FileUploader';
import { ResultsDisplay } from './components/ResultsDisplay';
import { countPdfPages, type PageCounts } from './services/pdfService';
import { countPptxSlides, countExcelSheets, countDocxPages, type OfficeCounts } from './services/officeService';
import { type DocFileData, type ViewMode, type FileType } from './types';
import { LogoIcon, NewTabIcon } from './components/Icons';
import { RenameModal } from './components/RenameModal';
const rajExpoLogo = "/src/assets/images/raj_expo_logo_1780723511664.png";

import { NatashaSystemBroadcast } from './components/NatashaSystemBroadcast';
import { Lockscreen } from './components/Lockscreen';
import { NatashaPhraseOverlay } from './components/NatashaPhraseOverlay';
import { logActivity } from './services/activityLogger';
import { AllSystemActivitiesModal } from './components/AllSystemActivitiesModal';
import { Activity, ExternalLink, FolderGit2, Zap, Upload, FolderArchive, FolderTree, Users, Wrench, Calculator, Folder, Sparkles, HardDrive, Eye } from 'lucide-react';
import { NatashaButtonIntelModal } from './components/NatashaButtonIntelModal';
import { resolveButtonIntel, BUTTON_INTEL_REGISTRY, type ButtonIntel } from './services/buttonIntelligenceService';

// Google Workspace integration components and services
import { initAuth, googleSignIn, logout, getAccessToken } from './services/googleService';
import { GoogleWorkspacePanel } from './components/GoogleWorkspacePanel';
import { type User } from 'firebase/auth';
import { Library } from 'lucide-react';
import { FirestoreSyncPanel } from './components/FirestoreSyncPanel';
import { testConnection, loadPreset } from './services/firebaseService';
import { soundManager } from './services/soundEffects';
import { NatashaReminderModal, type DuplicateReminderData } from './components/NatashaReminderModal';

// People Database & Reminders
import { SaveReminderBar } from './components/SaveReminderBar';
import { PersonChangeToast } from './components/PersonChangeToast';
import { DigitalToolHubModal } from './components/DigitalToolHubModal';
import { PeopleDatabaseModal } from './components/PeopleDatabaseModal';
import { RajExpoServerHubModal } from './components/RajExpoServerHubModal';
import { PdfCounterModal } from './components/PdfCounterModal';
import { CanonicalCategoriesExplorerModal } from './components/CanonicalCategoriesExplorerModal';
import { WhatsAppChatViewerModal } from './components/WhatsAppChatViewerModal';
import { CloudinaryCloudDatabaseModal } from './components/CloudinaryCloudDatabaseModal';
import { GooglePickerModal } from './components/GooglePickerModal';
import { GoogleDriveExplorerModal } from './components/GoogleDriveExplorerModal';
import { PromptCustomisationModal } from './components/PromptCustomisationModal';
import { AccountConfigModal } from './components/AccountConfigModal';
import { TaskbarDock, type AppId } from './components/TaskbarDock';
import { CosmicWallpaperCanvas } from './components/CosmicWallpaperCanvas';
import { WallpaperSettingsModal } from './components/WallpaperSettingsModal';
import { 
  getSyncedDefaultSettings, 
  SystemSettingsState,
  COSMIC_WALLPAPERS
} from './services/wallpaperSettingsService';
import { runStartupDataPurge, purgeAllDatabaseData } from './services/dataSanitizer';

// GitHub Central Database Storage & Raj Expo Media components and services
import { GitHubDatabasePanel } from './components/GitHubDatabasePanel';
import { GitHubDatabaseModal } from './components/GitHubDatabaseModal';
import { MediaUploadWithDescriptionModal } from './components/MediaUploadWithDescriptionModal';
import { RajExpoMediaModal } from './components/RajExpoMediaModal';
import { 
  syncToGitHub, 
  buildDatabasePayload, 
  getGitHubConfig, 
  type GitHubDatabasePayload 
} from './services/githubDatabaseService';

declare const JSZip: any;
declare const saveAs: any;

function App() {
  const [files, setFiles] = useState<DocFileData[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  const [singleSidedCost, setSingleSidedCost] = useState<number>(10);
  const [doubleSidedCost, setDoubleSidedCost] = useState<number>(10);
  
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [separateOrientations, setSeparateOrientations] = useState<boolean>(false);
  const [pagesPerSide, setPagesPerSide] = useState<number>(1);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  const dragCounter = React.useRef(0);

  const totals = useMemo(() => {
    return files.reduce(
      (acc, file) => {
        acc.totalCount += file.count;
        if (file.type === 'folder' && file.innerFiles) {
          acc.totalOneSidedCount += file.innerFiles.reduce((sum, inner) => sum + Math.ceil(inner.count / pagesPerSide), 0);
        } else {
          acc.totalOneSidedCount += Math.ceil(file.count / pagesPerSide);
        }
        acc.totalPortraitCount += file.portraitCount;
        acc.totalLandscapeCount += file.landscapeCount;
        acc.totalSheets += file.sheetCount; 
        acc.totalSingleSidedPrice += file.singleSidedPrice;
        acc.totalDoubleSidedPrice += file.doubleSidedPrice;
        return acc;
      },
      { totalCount: 0, totalOneSidedCount: 0, totalSheets: 0, totalSingleSidedPrice: 0, totalDoubleSidedPrice: 0, totalPortraitCount: 0, totalLandscapeCount: 0 }
    );
  }, [files, pagesPerSide]);

  // Holographic pipeline and workspace states
  const [activePipeline, setActivePipeline] = useState<'local' | 'google'>('local');
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Natasha UI Customization States & Responsive Palettes
  const [customTitle, setCustomTitle] = useState<string>('Welcome to Raj Expo Digitals');
  const [customTheme, setCustomTheme] = useState<'cyan' | 'emerald' | 'purple' | 'amber' | 'red' | 'titanium'>(() => {
    try {
      const saved = localStorage.getItem('raj_expo_ui_theme_v1');
      if (saved && ['cyan', 'emerald', 'purple', 'amber', 'red', 'titanium'].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return 'cyan';
  });

  const handleSelectTheme = useCallback((newTheme: string) => {
    setCustomTheme(newTheme as any);
    try {
      localStorage.setItem('raj_expo_ui_theme_v1', newTheme);
    } catch {}
    soundManager.playAccessGrantedSound();
    logActivity('THEME_ANIM', 'UI Theme Switched', `Active palette changed to: ${newTheme.toUpperCase()}`);
  }, []);

  // Startup Data Purge: Enforce Absolute Rule 2: NO FAKE DATA
  useEffect(() => {
    runStartupDataPurge();
  }, []);

  // System Settings state (Loaded from Synced Default on startup)
  const [systemSettings, setSystemSettings] = useState<SystemSettingsState>(() => getSyncedDefaultSettings());
  const [previewSettings, setPreviewSettings] = useState<SystemSettingsState | null>(null);
  const [isWallpaperSettingsOpen, setIsWallpaperSettingsOpen] = useState<boolean>(false);
  const [isPurgeConfirmOpen, setIsPurgeConfirmOpen] = useState<boolean>(false);

  const activeDisplaySettings = previewSettings || systemSettings;

  // Lockscreen & Server Online status states (Unlocked on startup as requested)
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [serverOnlineStatus, setServerOnlineStatus] = useState<boolean>(true);
  const [animStyleIndex, setAnimStyleIndex] = useState<number>(0);
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState<boolean>(false);
  const [duplicateReminder, setDuplicateReminder] = useState<DuplicateReminderData | null>(null);

  // GitHub Central Database Storage & Raj Expo Media states
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);
  const [isGitHubSyncing, setIsGitHubSyncing] = useState<boolean>(false);
  const [syncPhase, setSyncPhase] = useState<'idle' | 'syncing' | 'uploading' | 'updated' | 'failed'>('idle');
  const [isMediaUploadOpen, setIsMediaUploadOpen] = useState<boolean>(false);
  const [isRajExpoMediaOpen, setIsRajExpoMediaOpen] = useState<boolean>(false);

  // Raj Expo Server Hub, Prompt Studio & Digital Tools Modals
  const [isServerHubOpen, setIsServerHubOpen] = useState<boolean>(false);
  const [isPromptStudioOpen, setIsPromptStudioOpen] = useState<boolean>(false);
  const [isPdfCounterModalOpen, setIsPdfCounterModalOpen] = useState<boolean>(false);
  const [isPeopleDbModalOpen, setIsPeopleDbModalOpen] = useState<boolean>(false);
  const [isToolHubModalOpen, setIsToolHubModalOpen] = useState<boolean>(false);

  // Window Minimized Sets (for Taskbar dock)
  const [minimizedAppIds, setMinimizedAppIds] = useState<Set<AppId>>(new Set());

  // Canonical Categories, WhatsApp, Cloudinary, and Google Picker Modals
  const [isCanonicalExplorerOpen, setIsCanonicalExplorerOpen] = useState<boolean>(false);
  const [selectedCanonicalCategory, setSelectedCanonicalCategory] = useState<string | undefined>(undefined);
  const [isWhatsAppViewerOpen, setIsWhatsAppViewerOpen] = useState<boolean>(false);
  const [isCloudinaryDatabaseOpen, setIsCloudinaryDatabaseOpen] = useState<boolean>(false);
  const [isGooglePickerOpen, setIsGooglePickerOpen] = useState<boolean>(false);
  const [isGoogleDriveModalOpen, setIsGoogleDriveModalOpen] = useState<boolean>(false);
  const [isAccountConfigOpen, setIsAccountConfigOpen] = useState<boolean>(false);
  const [accountConfigDefaultTab, setAccountConfigDefaultTab] = useState<'auth' | 'github' | 'google' | 'cloud'>('auth');

  // Natasha Button Intelligence Inspector States
  const [isInspectorModeActive, setIsInspectorModeActive] = useState<boolean>(false);
  const [selectedButtonIntel, setSelectedButtonIntel] = useState<ButtonIntel | null>(null);
  const [isButtonIntelModalOpen, setIsButtonIntelModalOpen] = useState<boolean>(false);
  const [onExecuteInspectedButton, setOnExecuteInspectedButton] = useState<(() => void) | undefined>(undefined);

  // Actively open applications set
  const openAppIds = useMemo<Set<AppId>>(() => {
    const set = new Set<AppId>();
    if (isServerHubOpen) set.add('server_hub');
    if (isPromptStudioOpen) set.add('prompt_studio');
    if (isWallpaperSettingsOpen) set.add('wallpaper_settings');
    if (isGoogleDriveModalOpen) set.add('google_drive');
    if (isGooglePickerOpen) set.add('google_picker');
    if (isWhatsAppViewerOpen) set.add('whatsapp_viewer');
    if (isCloudinaryDatabaseOpen) set.add('cloudinary_db');
    if (isPeopleDbModalOpen) set.add('people_db');
    if (isGitHubModalOpen) set.add('github_sync');
    if (isToolHubModalOpen) set.add('tool_hub');
    if (isPdfCounterModalOpen) set.add('pdf_counter');
    if (isActivitiesModalOpen) set.add('activities_log');
    if (isButtonIntelModalOpen) set.add('button_intel');
    if (isAccountConfigOpen) set.add('account_config');
    return set;
  }, [
    isServerHubOpen, isPromptStudioOpen, isWallpaperSettingsOpen, isGoogleDriveModalOpen, isGooglePickerOpen,
    isWhatsAppViewerOpen, isCloudinaryDatabaseOpen, isPeopleDbModalOpen, isGitHubModalOpen, isToolHubModalOpen,
    isPdfCounterModalOpen, isActivitiesModalOpen, isButtonIntelModalOpen, isAccountConfigOpen
  ]);

  const handleToggleApp = useCallback((appId: AppId) => {
    soundManager.playClickSound();
    const isCurrentlyOpen = openAppIds.has(appId);
    const isCurrentlyMinimized = minimizedAppIds.has(appId);

    if (isCurrentlyOpen && !isCurrentlyMinimized) {
      // Minimize to taskbar
      setMinimizedAppIds(prev => new Set([...prev, appId]));
      logActivity('WINDOW_CONTROL', 'Minimized Window to Taskbar', `Minimized app: ${appId}`);
    } else if (isCurrentlyOpen && isCurrentlyMinimized) {
      // Restore from taskbar
      setMinimizedAppIds(prev => {
        const next = new Set(prev);
        next.delete(appId);
        return next;
      });
      logActivity('WINDOW_CONTROL', 'Restored Window from Taskbar', `Restored app: ${appId}`);
    } else {
      // Launch app and ensure not minimized
      setMinimizedAppIds(prev => {
        const next = new Set(prev);
        next.delete(appId);
        return next;
      });
      switch (appId) {
        case 'server_hub': setIsServerHubOpen(true); break;
        case 'prompt_studio': setIsPromptStudioOpen(true); break;
        case 'wallpaper_settings': setIsWallpaperSettingsOpen(true); break;
        case 'google_drive': setIsGoogleDriveModalOpen(true); break;
        case 'google_picker': setIsGooglePickerOpen(true); break;
        case 'whatsapp_viewer': setIsWhatsAppViewerOpen(true); break;
        case 'cloudinary_db': setIsCloudinaryDatabaseOpen(true); break;
        case 'people_db': setIsPeopleDbModalOpen(true); break;
        case 'github_sync': setIsGitHubModalOpen(true); break;
        case 'tool_hub': setIsToolHubModalOpen(true); break;
        case 'pdf_counter': setIsPdfCounterModalOpen(true); break;
        case 'activities_log': setIsActivitiesModalOpen(true); break;
        case 'button_intel': setIsButtonIntelModalOpen(true); break;
        case 'account_config': setIsAccountConfigOpen(true); break;
      }
      logActivity('WINDOW_CONTROL', 'Launched Application', `Launched app: ${appId}`);
    }
  }, [openAppIds, minimizedAppIds]);


  const handleOneTapGitHubSync = useCallback(async () => {
    setIsGitHubSyncing(true);
    setSyncPhase('syncing');
    soundManager.playClickSound();

    try {
      setSyncPhase('uploading');
      const payload = buildDatabasePayload(files, {
        singleSidedCost,
        doubleSidedCost,
        separateOrientations,
        pagesPerSide,
      }, totals);
      const result = await syncToGitHub(payload);
      if (result.success) {
        setSyncPhase('updated');
        soundManager.playWelcomeSound();
        logActivity('DATABASE', 'Update Raj Expo Central Database Completed', `Synced ${files.length} document records to iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6.`);
        window.dispatchEvent(new CustomEvent('natasha-message', {
          detail: {
            text: `Update Raj Expo Central Database succeeded! Committed to iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6 (SHA: ${result.sha?.substring(0, 7) || 'OK'}), Boss.`,
            isBinary: false
          }
        }));
        setTimeout(() => setSyncPhase('idle'), 3500);
      } else if (result.backupOnly) {
        setSyncPhase('updated');
        window.dispatchEvent(new CustomEvent('natasha-message', {
          detail: {
            text: `Local database snapshot updated. Configure your GitHub Personal Access Token in the GitHub Central panel to push directly to iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6, Boss!`,
            isBinary: false
          }
        }));
        setTimeout(() => setSyncPhase('idle'), 3500);
        setIsGitHubModalOpen(true);
      } else {
        setSyncPhase('failed');
        soundManager.playWrongInputSound();
        window.dispatchEvent(new CustomEvent('natasha-message', {
          detail: {
            text: `Update Raj Expo Central Database failed: ${result.message}`,
            isBinary: false
          }
        }));
        setTimeout(() => setSyncPhase('idle'), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setSyncPhase('failed');
      soundManager.playWrongInputSound();
      setTimeout(() => setSyncPhase('idle'), 4000);
    } finally {
      setIsGitHubSyncing(false);
    }
  }, [files, singleSidedCost, doubleSidedCost, separateOrientations, pagesPerSide, totals]);

  const handleRestoreFromGitHub = useCallback((payload: GitHubDatabasePayload) => {
    if (payload.settings) {
      if (typeof payload.settings.singleSidedCost === 'number') setSingleSidedCost(payload.settings.singleSidedCost);
      if (typeof payload.settings.doubleSidedCost === 'number') setDoubleSidedCost(payload.settings.doubleSidedCost);
      if (typeof payload.settings.separateOrientations === 'boolean') setSeparateOrientations(payload.settings.separateOrientations);
      if (typeof payload.settings.pagesPerSide === 'number') setPagesPerSide(payload.settings.pagesPerSide);
    }

    if (payload.filesCatalog && payload.filesCatalog.length > 0) {
      const restoredFiles: DocFileData[] = payload.filesCatalog.map(item => ({
        id: item.id || `file-${Math.random()}`,
        name: item.name,
        type: (item.type as any) || 'pdf',
        count: item.count,
        portraitCount: item.portraitCount,
        landscapeCount: item.landscapeCount,
        sheetCount: item.sheetCount,
        singleSidedPrice: item.singleSidedPrice,
        doubleSidedPrice: item.doubleSidedPrice,
      }));
      setFiles(restoredFiles);
    }

    soundManager.playWelcomeSound();
    logActivity('DATABASE', 'GitHub Database Hydrated', `Restored ${payload.filesCatalog?.length || 0} document records from iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6 snapshot.`);
    window.dispatchEvent(new CustomEvent('natasha-message', {
      detail: {
        text: `Restored database from GitHub repository iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6, Boss! Loaded ${payload.filesCatalog?.length || 0} documents.`,
        isBinary: false
      }
    }));
  }, []);

  // Background Auto-Sync interval watcher
  useEffect(() => {
    const config = getGitHubConfig();
    if (!config.autoSyncEnabled) return;

    const intervalMs = Math.max(15, config.autoSyncIntervalSeconds || 60) * 1000;
    const timer = setInterval(() => {
      const currentConfig = getGitHubConfig();
      if (currentConfig.autoSyncEnabled && currentConfig.personalAccessToken) {
        const payload = buildDatabasePayload(files, {
          singleSidedCost,
          doubleSidedCost,
          separateOrientations,
          pagesPerSide,
        }, totals);
        syncToGitHub(payload, `🔄 Auto-Sync Central Database: ${new Date().toLocaleTimeString()}`);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [files, singleSidedCost, doubleSidedCost, separateOrientations, pagesPerSide, totals]);

  const cycleAnimStyle = useCallback(() => {
    setAnimStyleIndex(prev => (prev + 1) % 5);
  }, []);

  const handleUnlock = useCallback(() => {
    setIsLocked(false);
    setServerOnlineStatus(true);
    cycleAnimStyle();
    soundManager.playWelcomeSound();
    logActivity('LOCK_UNLOCK', 'Security Unlock Triggered', 'App Mainframe unlocked. Server switched to ONLINE & READY mode.', 'Method: Hotkey / Manual directive');
    window.dispatchEvent(new CustomEvent('natasha-message', {
      detail: {
        text: "SERVER IS ONLINE AND READY, BOSS. Welcome to Raj Expo Digitals!",
        isBinary: true
      }
    }));
  }, [cycleAnimStyle]);

  const handleLockApp = useCallback(() => {
    setIsLocked(true);
    setServerOnlineStatus(false);
    cycleAnimStyle();
    soundManager.playLockSound();
    logActivity('LOCK_UNLOCK', 'Security Standby Locked', 'App Mainframe locked into Standby mode.', 'Natasha V.I. Guard active');
  }, [cycleAnimStyle]);


  const calculateSheetCount = useCallback((count: number, portraitCount: number, landscapeCount: number, separate: boolean, perSide: number): number => {
    const effectiveCount = Math.ceil(count / perSide);
    if (separate && portraitCount + landscapeCount > 0) {
      const pSide = Math.ceil(portraitCount / perSide);
      const lSide = Math.ceil(landscapeCount / perSide);
      return Math.ceil(pSide / 2) + Math.ceil(lSide / 2);
    }
    return Math.ceil(effectiveCount / 2);
  }, []);

  const handleFilesSelected = useCallback(async (selectedFiles: FileList | File[], folderNameMap?: Map<File, string>) => {
    if (selectedFiles.length === 0) return;

    setIsLoading(true);
    setErrors([]);
    const newFilesData: DocFileData[] = [];
    const newErrors: string[] = [];

    const folderGroups = new Map<string, { files: File[] }>();
    const individualFiles: File[] = [];

    for (const file of Array.from(selectedFiles)) {
      const parentFolderName = folderNameMap?.get(file);
      if (parentFolderName) {
        if (!folderGroups.has(parentFolderName)) {
          folderGroups.set(parentFolderName, { files: [] });
        }
        folderGroups.get(parentFolderName)!.files.push(file);
      } else {
        individualFiles.push(file);
      }
    }

    // Process individual files
    for (const file of individualFiles) {
      try {
        let count = 0;
        let portrait = 0;
        let landscape = 0;
        let fileType: FileType = 'pdf';

        const fileName = file.name.toLowerCase();
        
        if (fileName.endsWith('.pdf')) {
            fileType = 'pdf';
            const counts: PageCounts = await countPdfPages(file);
            count = counts.total;
            portrait = counts.portrait;
            landscape = counts.landscape;
        } else if (fileName.endsWith('.pptx')) {
            fileType = 'pptx';
            const counts: OfficeCounts = await countPptxSlides(file);
            count = counts.total;
            landscape = count; 
        } else if (fileName.endsWith('.xlsx')) {
            fileType = 'xlsx';
            const counts: OfficeCounts = await countExcelSheets(file);
            count = counts.total;
            portrait = count; 
        } else if (fileName.endsWith('.docx')) {
            fileType = 'docx';
            const counts: OfficeCounts = await countDocxPages(file);
            count = counts.total;
            portrait = count;
        } else if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i.test(fileName)) {
            fileType = 'image';
            count = 1;
            portrait = 1; 
        } else {
            newErrors.push(`Unsupported file type: "${file.name}"`);
            continue;
        }

        const effectiveOneSided = Math.ceil(count / pagesPerSide);
        const sheetCount = calculateSheetCount(count, portrait, landscape, fileType === 'pdf' ? separateOrientations : false, pagesPerSide);
        
        newFilesData.push({
          id: `${file.name}-${file.lastModified}-${Math.random()}`,
          name: file.name,
          file: file,
          type: fileType,
          count: count,
          portraitCount: portrait,
          landscapeCount: landscape,
          sheetCount: sheetCount,
          singleSidedPrice: effectiveOneSided * singleSidedCost,
          doubleSidedPrice: sheetCount * doubleSidedCost,
        });
      } catch (err: any) {
        newErrors.push(`Error with "${file.name}": ${err.message}`);
      }
    }

    // Process folder groups
    for (const [folderName, group] of Array.from(folderGroups.entries())) {
      let folderTotalCount = 0;
      let folderPortraitCount = 0;
      let folderLandscapeCount = 0;
      let folderTotalSheetCount = 0;
      let folderTotalSinglePrice = 0;
      let folderTotalDoublePrice = 0;
      const innerFilesList: any[] = [];

      for (const file of group.files) {
        try {
          const fileName = file.name.toLowerCase();
          let count = 0;
          let portrait = 0;
          let landscape = 0;
          let fileType: FileType = 'pdf';

          if (fileName.endsWith('.pdf')) {
            fileType = 'pdf';
            const counts: PageCounts = await countPdfPages(file);
            count = counts.total;
            portrait = counts.portrait;
            landscape = counts.landscape;
          } else if (fileName.endsWith('.pptx')) {
            fileType = 'pptx';
            const counts: OfficeCounts = await countPptxSlides(file);
            count = counts.total;
            landscape = count;
          } else if (fileName.endsWith('.xlsx')) {
            fileType = 'xlsx';
            const counts: OfficeCounts = await countExcelSheets(file);
            count = counts.total;
            portrait = count;
          } else if (fileName.endsWith('.docx')) {
            fileType = 'docx';
            const counts: OfficeCounts = await countDocxPages(file);
            count = counts.total;
            portrait = count;
          } else if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i.test(fileName)) {
            fileType = 'image';
            count = 1;
            portrait = 1;
          } else {
            continue; // Skip unsupported silently inside folder imports
          }

          const fileOneSided = Math.ceil(count / pagesPerSide);
          const fileSheetCount = calculateSheetCount(count, portrait, landscape, fileType === 'pdf' ? separateOrientations : false, pagesPerSide);
          
          folderTotalCount += count;
          folderPortraitCount += portrait;
          folderLandscapeCount += landscape;
          folderTotalSheetCount += fileSheetCount;
          folderTotalSinglePrice += fileOneSided * singleSidedCost;
          folderTotalDoublePrice += fileSheetCount * doubleSidedCost;

          innerFilesList.push({
            name: file.name,
            count: count,
            type: fileType,
            portraitCount: portrait,
            landscapeCount: landscape,
          });
        } catch (err: any) {
          newErrors.push(`Error with "${file.name}" in folder "${folderName}": ${err.message}`);
        }
      }

      if (innerFilesList.length > 0) {
        newFilesData.push({
          id: `${folderName}-${Math.random()}`,
          name: folderName,
          type: 'folder',
          count: folderTotalCount,
          portraitCount: folderPortraitCount,
          landscapeCount: folderLandscapeCount,
          sheetCount: folderTotalSheetCount,
          singleSidedPrice: folderTotalSinglePrice,
          doubleSidedPrice: folderTotalDoublePrice,
          innerFiles: innerFilesList,
        });
      } else {
        newErrors.push(`No supported documents found in folder "${folderName}".`);
      }
    }

    // Check for duplicate uploads
    const duplicateItem = newFilesData.find(nf => 
      files.some(of => of.name.toLowerCase() === nf.name.toLowerCase())
    );

    if (duplicateItem) {
      const existing = files.find(of => of.name.toLowerCase() === duplicateItem.name.toLowerCase())!;
      const nonDuplicateNewFiles = newFilesData.filter(nf => nf !== duplicateItem);

      setDuplicateReminder({
        itemType: 'DOCUMENT',
        existingTitle: existing.name,
        existingDate: new Date().toLocaleDateString(),
        existingCategory: `${existing.type.toUpperCase()} (${existing.count} pages / ${existing.sheetCount} sheets)`,
        existingDescription: `Document already processed in active queue.`,
        newTitle: duplicateItem.name,
        newCategory: `${duplicateItem.type.toUpperCase()} (${duplicateItem.count} pages / ${duplicateItem.sheetCount} sheets)`,
        newDescription: `New upload metrics: ${duplicateItem.count} pages, ${duplicateItem.portraitCount} portrait, ${duplicateItem.landscapeCount} landscape.`,
        onUpdateWithNewDate: () => {
          setFiles(prev => [
            ...prev.map(f => f.name.toLowerCase() === duplicateItem.name.toLowerCase() ? duplicateItem : f),
            ...nonDuplicateNewFiles
          ]);
          logActivity('FILE_UPLOAD', 'Document Updated (New Date)', `Updated ${duplicateItem.name}`);
        },
        onIgnore: () => {
          if (nonDuplicateNewFiles.length > 0) {
            setFiles(prev => [...prev, ...nonDuplicateNewFiles]);
          }
          logActivity('FILE_UPLOAD', 'Duplicate Document Ignored', `Skipped ${duplicateItem.name}`);
        },
        onReplaceSameDate: () => {
          setFiles(prev => [
            ...prev.map(f => f.name.toLowerCase() === duplicateItem.name.toLowerCase() ? { ...duplicateItem, id: f.id } : f),
            ...nonDuplicateNewFiles
          ]);
          logActivity('FILE_UPLOAD', 'Document Replaced (Same Date)', `Replaced ${duplicateItem.name}`);
        }
      });
    } else {
      setFiles(prevFiles => [...prevFiles, ...newFilesData]);
    }

    setErrors(newErrors);
    setIsLoading(false);

    if (newFilesData.length > 0) {
      const totalPagesAdded = newFilesData.reduce((acc, curr) => acc + curr.count, 0);
      const totalSheetsAdded = newFilesData.reduce((acc, curr) => acc + curr.sheetCount, 0);
      logActivity(
        'PDF_COUNT', 
        `Processed ${newFilesData.length} Document(s) / Files`, 
        `Calculated page metrics and cost estimates for: ${newFilesData.map(f => f.name).join(', ')}. Total pages: ${totalPagesAdded}, Sheets required: ${totalSheetsAdded}.`, 
        `N-Up: ${pagesPerSide} per side | Single Sided Rate: LKR ${singleSidedCost} | Double Sided Rate: LKR ${doubleSidedCost}`
      );
      window.dispatchEvent(new CustomEvent('natasha-message', { 
        detail: { 
          text: `Neural upload of ${newFilesData.length} records successful, Boss. Commencing decryption sequence.`, 
          isBinary: true 
        } 
      }));
    }
  }, [singleSidedCost, doubleSidedCost, separateOrientations, calculateSheetCount, pagesPerSide]);

  const handleCostChange = useCallback((type: 'single' | 'double', value: number) => {
    const newCost = isNaN(value) || value < 0 ? 0 : value;
    
    if (type === 'single') {
      setSingleSidedCost(newCost);
      setFiles(prevFiles => 
        prevFiles.map(file => {
          if (file.type === 'folder' && file.innerFiles) {
            const sumSinglePrice = file.innerFiles.reduce((sum, inner) => sum + Math.ceil(inner.count / pagesPerSide) * newCost, 0);
            return {
              ...file,
              singleSidedPrice: sumSinglePrice,
            };
          }
          return {
            ...file,
            singleSidedPrice: Math.ceil(file.count / pagesPerSide) * newCost,
          };
        })
      );
    } else {
      setDoubleSidedCost(newCost);
      setFiles(prevFiles => 
        prevFiles.map(file => ({
          ...file,
          doubleSidedPrice: file.sheetCount * newCost,
        }))
      );
    }
  }, [pagesPerSide]);

  const handlePagesPerSideChange = useCallback((value: number) => {
    const newVal = isNaN(value) || value < 1 ? 1 : value;
    setPagesPerSide(newVal);
    setFiles(prevFiles => 
      prevFiles.map(file => {
        if (file.type === 'folder' && file.innerFiles) {
          let folderTotalSheetCount = 0;
          let folderTotalSinglePrice = 0;
          let folderTotalDoublePrice = 0;

          file.innerFiles.forEach(inner => {
            const fileOneSided = Math.ceil(inner.count / newVal);
            const fileSheetCount = calculateSheetCount(inner.count, inner.portraitCount, inner.landscapeCount, inner.type === 'pdf' ? separateOrientations : false, newVal);
            
            folderTotalSheetCount += fileSheetCount;
            folderTotalSinglePrice += fileOneSided * singleSidedCost;
            folderTotalDoublePrice += fileSheetCount * doubleSidedCost;
          });

          return {
            ...file,
            sheetCount: folderTotalSheetCount,
            singleSidedPrice: folderTotalSinglePrice,
            doubleSidedPrice: folderTotalDoublePrice,
          };
        }

        const effectiveOneSided = Math.ceil(file.count / newVal);
        const newSheetCount = calculateSheetCount(file.count, file.portraitCount, file.landscapeCount, file.type === 'pdf' ? separateOrientations : false, newVal);
        return {
          ...file,
          sheetCount: newSheetCount,
          singleSidedPrice: effectiveOneSided * singleSidedCost,
          doubleSidedPrice: newSheetCount * doubleSidedCost,
        };
      })
    );
  }, [calculateSheetCount, singleSidedCost, doubleSidedCost, separateOrientations]);
  
  const handleOrientationSeparatorToggle = useCallback((enabled: boolean) => {
    setSeparateOrientations(enabled);
    setFiles(prevFiles => 
      prevFiles.map(file => {
        if (file.type === 'folder' && file.innerFiles) {
          let folderTotalSheetCount = 0;
          let folderTotalDoublePrice = 0;

          file.innerFiles.forEach(inner => {
            const fileSheetCount = calculateSheetCount(inner.count, inner.portraitCount, inner.landscapeCount, inner.type === 'pdf' ? enabled : false, pagesPerSide);
            folderTotalSheetCount += fileSheetCount;
            folderTotalDoublePrice += fileSheetCount * doubleSidedCost;
          });

          return {
            ...file,
            sheetCount: folderTotalSheetCount,
            doubleSidedPrice: folderTotalDoublePrice,
          };
        }

        if (file.type === 'pdf') {
          const newSheetCount = calculateSheetCount(file.count, file.portraitCount, file.landscapeCount, enabled, pagesPerSide);
          return {
            ...file,
            sheetCount: newSheetCount,
            doubleSidedPrice: newSheetCount * doubleSidedCost,
          };
        }
        return file;
      })
    );
  }, [calculateSheetCount, doubleSidedCost, pagesPerSide]);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prevFiles => {
      const target = prevFiles.find(f => f.id === id);
      if (target) {
        logActivity('DATABASE', 'Removed Document File', `Removed "${target.name}" from active queue.`);
      }
      return prevFiles.filter(file => file.id !== id);
    });
  }, []);

  const handleClearAll = useCallback(() => {
    if (files.length > 0) {
      const confirmClear = window.confirm(`Boss Jonathan Raj, are you sure you want to clear all ${files.length} document record(s) from memory?`);
      if (!confirmClear) return;
    }
    const count = files.length;
    setFiles([]);
    setErrors([]);
    soundManager.playLockSound();
    logActivity('DATABASE', 'Cleared Local Document Queue', `Purged ${count} records from memory upon Boss confirmation.`);
    window.dispatchEvent(new CustomEvent('natasha-message', { 
      detail: { 
        text: "Database purged, Boss. Neural caches cleared. Awaiting new data stream.", 
        isBinary: true 
      } 
    }));
  }, [files.length]);

  const handleOpenInNewTab = useCallback(() => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  }, []);

  // -------------------------------------------------------------
  // NATASHA BUTTON INTELLIGENCE & INTERACTIVE INSPECTOR ENGINE
  // -------------------------------------------------------------
  const inspectSpecificButton = useCallback((buttonEl: HTMLElement | null, fallbackId?: string) => {
    const intel = resolveButtonIntel(buttonEl, fallbackId);
    setSelectedButtonIntel(intel);
    setIsButtonIntelModalOpen(true);

    if (buttonEl) {
      const bText = (buttonEl.textContent || buttonEl.getAttribute('title') || buttonEl.id || '').toLowerCase();
      if (bText.includes('raj expo') || bText.includes('server')) {
        setOnExecuteInspectedButton(() => () => setIsServerHubOpen(true));
      } else if (bText.includes('update') || bText.includes('github') || bText.includes('central database')) {
        setOnExecuteInspectedButton(() => () => handleOneTapGitHubSync());
      } else if (bText.includes('new tab') || bText.includes('open app')) {
        setOnExecuteInspectedButton(() => () => handleOpenInNewTab());
      } else if (bText.includes('lock') || bText.includes('standby')) {
        setOnExecuteInspectedButton(() => () => { isLocked ? handleUnlock() : handleLockApp(); });
      } else if (bText.includes('people')) {
        setOnExecuteInspectedButton(() => () => setIsPeopleDbModalOpen(true));
      } else if (bText.includes('tool') || bText.includes('calculator')) {
        setOnExecuteInspectedButton(() => () => setIsToolHubModalOpen(true));
      } else if (bText.includes('pdf') || bText.includes('counter')) {
        setOnExecuteInspectedButton(() => () => setIsPdfCounterModalOpen(true));
      } else if (bText.includes('activit') || bText.includes('log')) {
        setOnExecuteInspectedButton(() => () => setIsActivitiesModalOpen(true));
      } else if (bText.includes('media') || bText.includes('upload')) {
        setOnExecuteInspectedButton(() => () => setIsMediaUploadOpen(true));
      } else {
        setOnExecuteInspectedButton(() => () => buttonEl.click());
      }
    } else {
      setOnExecuteInspectedButton(undefined);
    }
  }, [handleOneTapGitHubSync, handleOpenInNewTab, isLocked, handleUnlock, handleLockApp]);

  // Global hotkeys (Alt+I) and right-click on any button for instant Natasha inspection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        soundManager.playClickSound();
        setIsInspectorModeActive(prev => {
          const next = !prev;
          if (next) {
            inspectSpecificButton(null, 'natasha-inspector-toggle');
          }
          return next;
        });
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('#natasha-button-intel-modal-backdrop') || target.closest('#natasha-button-intel-card')) {
        return;
      }
      const buttonEl = target.closest('button') as HTMLElement | null;
      if (buttonEl) {
        e.preventDefault();
        inspectSpecificButton(buttonEl);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [inspectSpecificButton]);

  // Global capture click listener when inspector mode is active
  useEffect(() => {
    if (!isInspectorModeActive) return;

    const handleInspectorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.closest('#natasha-button-intel-modal-backdrop') || target.closest('#natasha-button-intel-card')) {
        return;
      }
      if (target.closest('#btn-exit-inspector')) {
        return;
      }

      const buttonEl = target.closest('button') as HTMLElement | null;
      if (buttonEl) {
        e.preventDefault();
        e.stopPropagation();
        inspectSpecificButton(buttonEl);
      }
    };

    window.addEventListener('click', handleInspectorClick, true);
    return () => {
      window.removeEventListener('click', handleInspectorClick, true);
    };
  }, [isInspectorModeActive, inspectSpecificButton]);

  const handleReorderFiles = useCallback((startIndex: number, endIndex: number) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      const [removed] = newFiles.splice(startIndex, 1);
      newFiles.splice(endIndex, 0, removed);
      return newFiles;
    });
  }, []);

  const handleBatchRename = useCallback((prefix: string, suffix: string) => {
    setFiles(prevFiles =>
      prevFiles.map(file => {
        const lastDotIndex = file.name.lastIndexOf('.');
        if (lastDotIndex === -1) { 
          return { ...file, name: `${prefix}${file.name}${suffix}` };
        }
        const baseName = file.name.substring(0, lastDotIndex);
        const extension = file.name.substring(lastDotIndex); 
        return { ...file, name: `${prefix}${baseName}${suffix}${extension}` };
      })
    );
    setIsRenameModalOpen(false);
  }, []);

  const handleDownloadZip = useCallback(async () => {
    if (!files.length || isZipping) return;

    setIsZipping(true);
    setErrors([]);

    try {
      const zip = new JSZip();
      
      const usedNames = new Set<string>();

      for (const file of files) {
        const fileData = file.file; 
        const originalName = file.name;

        const lastDotIndex = originalName.lastIndexOf('.');
        const baseName = lastDotIndex === -1 ? originalName : originalName.substring(0, lastDotIndex);
        const extension = lastDotIndex === -1 ? '' : originalName.substring(lastDotIndex);
        
        let finalName = originalName;
        let counter = 1;

        while (usedNames.has(finalName)) {
          finalName = `${baseName} (${counter})${extension}`;
          counter++;
        }
        
        usedNames.add(finalName);
        zip.file(finalName, fileData);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `raj_expo_documents.zip`);

    } catch (err: any) {
      setErrors(prev => [...prev, `Failed to create ZIP file: ${err.message}`]);
    } finally {
      setIsZipping(false);
    }
  }, [files, isZipping]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (isRenameModalOpen) return;

      switch (event.key.toLowerCase()) {
        case 'c': handleClearAll(); break;
        case 'r': if (files.length > 0) setIsRenameModalOpen(true); break;
        case 'l': setViewMode('list'); break;
        case 'k': setViewMode('card'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClearAll, isRenameModalOpen, files.length]);

  // Google Workspace auth listeners
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        setIsAuthLoading(false);
        setActivePipeline('google'); // Auto switch view on verified auth link
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        setIsAuthLoading(false);
        setActivePipeline('local');
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync pricing configurations on successful login
  useEffect(() => {
    if (googleUser) {
      const loadUserPreset = async () => {
        try {
          const loaded = await loadPreset(googleUser.uid);
          if (loaded) {
            setSingleSidedCost(loaded.singleSidedCost);
            setDoubleSidedCost(loaded.doubleSidedCost);
            setSeparateOrientations(loaded.separateOrientations);
            setPagesPerSide(loaded.pagesPerSide);
            
            window.dispatchEvent(new CustomEvent('natasha-message', { 
              detail: { 
                text: `Quantum presets synchronized from Firestore, Boss. Costs calibrated: single-sided: $${(loaded.singleSidedCost/100).toFixed(2)}, double-sided: $${(loaded.doubleSidedCost/100).toFixed(2)}.`, 
                isBinary: false
              } 
            }));
          }
        } catch (e) {
          console.error("Error loading user presets:", e);
        }
      };
      loadUserPreset();
    }
  }, [googleUser]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        setActivePipeline('google');
        window.dispatchEvent(new CustomEvent('natasha-message', { 
          detail: { 
            text: `Neural uplink with Google Mainframe certified, Boss. Welcome, ${result.user.displayName || 'Chief'}.`, 
            isBinary: true 
          } 
        }));
      }
    } catch (err: any) {
      let friendlyError = `Google Authentication failed: ${err.message || err}`;
      if (err.code === 'auth/popup-closed-by-user' || err.message?.includes('popup-closed-by-user')) {
        friendlyError = `Google Authentication Error (Popup Closed): The sign-in popup was closed or blocked. Because this preview runs inside a sandboxed iframe, your browser's security settings (such as blocking third-party cookies or popups) may prevent login inside the frame. Please click the "LAUNCH POP-UP VIEW" button in the top-right corner to open the application in a new tab, then try signing in there!`;
        window.dispatchEvent(new CustomEvent('natasha-message', { 
          detail: { 
            text: `Warning, Boss. Google security protocols blocked the popup link inside this sandboxed container. Click 'Launch Pop-up View' in the top-right to bypass third-party browser restrictions entirely.`, 
            isBinary: false 
          } 
        }));
      } else if (err.code === 'auth/api-key-not-valid' || err.message?.includes('api-key-not-valid')) {
        friendlyError = `Firebase Authentication is not active in this server environment. As requested, RAJ EXPO DIGITALS operates in standalone personal server mode with IndexedDB, GitHub Central DB sync, and Cloudinary storage.`;
        window.dispatchEvent(new CustomEvent('natasha-message', { 
          detail: { 
            text: `Firebase is unconfigured per personal server directives, Boss. Operating in standalone database mode with GitHub & Cloudinary.`, 
            isBinary: false 
          } 
        }));
      }
      setErrors(prev => [...prev, friendlyError]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logout();
      setGoogleUser(null);
      setGoogleToken(null);
      setActivePipeline('local');
      window.dispatchEvent(new CustomEvent('natasha-message', { 
        detail: { 
          text: "Google database offline. Reverting stream to local buffers, Boss.", 
          isBinary: true 
        } 
      }));
    } catch (err: any) {
      setErrors(prev => [...prev, `Failsafe logout protocol failed: ${err.message}`]);
    }
  };

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsGlobalDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsGlobalDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsGlobalDragging(false);
      dragCounter.current = 0;
      
      const droppedFiles = e.dataTransfer?.files;
      if (droppedFiles && droppedFiles.length > 0) {
        handleFilesSelected(droppedFiles);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    const handleNatashaCommand = (e: any) => {
      const { action, target, task, theme, title } = e.detail || {};
      if (action === 'open-section') {
        if (target === 'uploader') {
          document.getElementById('file-uploader-section')?.scrollIntoView({ behavior: 'smooth' });
        } else if (target === 'calculator' || target === 'results') {
          document.getElementById('results-display-section')?.scrollIntoView({ behavior: 'smooth' });
        } else if (target === 'google') {
          setActivePipeline('google');
          document.getElementById('google-workspace-section')?.scrollIntoView({ behavior: 'smooth' });
        } else if (target === 'firestore') {
          document.getElementById('firestore-sync-section')?.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (action === 'trigger-task') {
        if (task === 'clear') {
          setFiles([]);
          setErrors([]);
        } else if (task === 'calculate') {
          document.getElementById('results-display-section')?.scrollIntoView({ behavior: 'smooth' });
        } else if (task === 'rename') {
          setIsRenameModalOpen(true);
        } else if (task === 'download' || task === 'export') {
          handleDownloadZip();
        }
      } else if (action === 'open-canonical-categories') {
        setIsCanonicalExplorerOpen(true);
      } else if (action === 'open-whatsapp-viewer') {
        setIsWhatsAppViewerOpen(true);
      } else if (action === 'open-cloudinary-database' || action === 'open-dual-sync') {
        setIsCloudinaryDatabaseOpen(true);
      } else if (action === 'open-google-picker') {
        setIsGooglePickerOpen(true);
      } else if (action === 'open-google-drive') {
        setIsGoogleDriveModalOpen(true);
      } else if (action === 'open-tool-hub') {
        setIsToolHubModalOpen(true);
      } else if (action === 'open-pdf-counter') {
        setIsPdfCounterModalOpen(true);
      } else if (action === 'customize-ui') {
        if (theme) setCustomTheme(theme);
        if (title) setCustomTitle(title);
      }
    };

    const handleGlobalCustomEvent = (e: any) => {
      if (e.type === 'open-canonical-categories') {
        setSelectedCanonicalCategory(e.detail?.categoryCode);
        setIsCanonicalExplorerOpen(true);
      } else if (e.type === 'open-whatsapp-viewer') {
        setIsWhatsAppViewerOpen(true);
      } else if (e.type === 'open-cloudinary-database' || e.type === 'open-dual-sync') {
        setIsCloudinaryDatabaseOpen(true);
      } else if (e.type === 'open-google-picker') {
        setIsGooglePickerOpen(true);
      } else if (e.type === 'open-google-drive') {
        setIsGoogleDriveModalOpen(true);
      } else if (e.type === 'open-tool-hub') {
        setIsToolHubModalOpen(true);
      } else if (e.type === 'open-pdf-counter') {
        setIsPdfCounterModalOpen(true);
      } else if (e.type === 'open-account-config') {
        if (e.detail?.defaultTab) {
          setAccountConfigDefaultTab(e.detail.defaultTab);
        }
        setIsAccountConfigOpen(true);
      }
    };

    window.addEventListener('natasha-action-command', handleNatashaCommand);
    window.addEventListener('open-canonical-categories', handleGlobalCustomEvent);
    window.addEventListener('open-whatsapp-viewer', handleGlobalCustomEvent);
    window.addEventListener('open-cloudinary-database', handleGlobalCustomEvent);
    window.addEventListener('open-google-picker', handleGlobalCustomEvent);
    window.addEventListener('open-google-drive', handleGlobalCustomEvent);
    window.addEventListener('open-tool-hub', handleGlobalCustomEvent);
    window.addEventListener('open-pdf-counter', handleGlobalCustomEvent);
    window.addEventListener('open-dual-sync', handleGlobalCustomEvent);
    window.addEventListener('open-account-config', handleGlobalCustomEvent);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('natasha-action-command', handleNatashaCommand);
      window.removeEventListener('open-canonical-categories', handleGlobalCustomEvent);
      window.removeEventListener('open-whatsapp-viewer', handleGlobalCustomEvent);
      window.removeEventListener('open-cloudinary-database', handleGlobalCustomEvent);
      window.removeEventListener('open-google-picker', handleGlobalCustomEvent);
      window.removeEventListener('open-google-drive', handleGlobalCustomEvent);
      window.removeEventListener('open-tool-hub', handleGlobalCustomEvent);
      window.removeEventListener('open-pdf-counter', handleGlobalCustomEvent);
      window.removeEventListener('open-dual-sync', handleGlobalCustomEvent);
      window.removeEventListener('open-account-config', handleGlobalCustomEvent);
    };
  }, [handleFilesSelected, handleDownloadZip]);

  return (
    <div 
      onClick={cycleAnimStyle}
      className={`min-h-screen font-sans p-4 sm:p-6 lg:p-8 pb-28 sm:pb-32 selection:bg-cyan-500/30 anim-style-${animStyleIndex} theme-${activeDisplaySettings.themeId || customTheme} relative overflow-x-hidden`}
    >
      {/* 15 Dynamic Animated Cosmic Wallpapers / Cloudinary Device Upload Engine */}
      <CosmicWallpaperCanvas
        wallpaperId={activeDisplaySettings.activeWallpaperId}
        customWallpaperUrl={activeDisplaySettings.customWallpaperUrl}
        customWallpaperType={activeDisplaySettings.customWallpaperType}
        particleSpeed={activeDisplaySettings.particleSpeed}
        particleDensity={activeDisplaySettings.particleDensity}
        showScanlines={activeDisplaySettings.showScanlines}
        showHudVignette={activeDisplaySettings.showHudVignette}
      />

      <div className="admin-watermark">{activeDisplaySettings.watermarkText}</div>
      
      {/* Dynamic Lockscreen & Natasha Phrase Overlay */}
      <Lockscreen 
        isLocked={isLocked} 
        onUnlock={handleUnlock} 
        serverOnlineStatus={serverOnlineStatus} 
      />
      <NatashaPhraseOverlay />

      {/* FLOATING WALLPAPER PREVIEW ACTION BANNER */}
      {previewSettings && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-slate-950/95 border-2 border-cyan-400/90 px-4 py-2 rounded-2xl shadow-[0_0_40px_rgba(34,211,238,0.55)] flex items-center gap-3 backdrop-blur-2xl font-mono animate-pulse">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="text-[11px] font-black text-cyan-200 uppercase tracking-wider">
              PREVIEW: {COSMIC_WALLPAPERS.find(w => w.id === previewSettings.activeWallpaperId)?.name || 'Custom Wallpaper'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundManager.playClickSound();
                setPreviewSettings(null);
              }}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-bold uppercase rounded-lg border border-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundManager.playAccessGrantedSound();
                setSystemSettings(previewSettings);
                setCustomTheme(previewSettings.themeId);
                setPreviewSettings(null);
                logActivity('THEME_ANIM', 'Applied Wallpaper Preview to Session', `Activated: ${previewSettings.activeWallpaperId}`);
              }}
              className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-black uppercase rounded-lg cursor-pointer shadow-md"
            >
              Apply to Session
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundManager.playClickSound();
                setIsWallpaperSettingsOpen(true);
              }}
              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold uppercase rounded-lg cursor-pointer"
            >
              Save & Sync
            </button>
          </div>
        </div>
      )}

      {/* Real-time Natasha Button Inspector Active Floating HUD Banner */}
      {isInspectorModeActive && (
        <>
          <style>{`
            button {
              outline: 2px dashed rgba(34, 211, 238, 0.6) !important;
              cursor: help !important;
              transition: all 0.15s ease-in-out !important;
            }
            button:hover {
              outline: 2px solid rgba(244, 114, 182, 0.95) !important;
              box-shadow: 0 0 20px rgba(244, 114, 182, 0.6) !important;
              transform: scale(1.03) !important;
            }
          `}</style>
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9998] bg-slate-950/95 border-2 border-cyan-400/80 px-4 py-2 rounded-2xl shadow-[0_0_40px_rgba(34,211,238,0.55)] flex items-center gap-3 backdrop-blur-2xl animate-pulse">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span className="text-[10px] sm:text-xs font-mono font-black text-cyan-300 uppercase tracking-wider">
              🎯 CLICK ANY BUTTON TO HEAR & READ WHAT IT DOES AND WHAT IS INSIDE
            </span>
            <button
              id="btn-exit-inspector"
              onClick={() => {
                soundManager.playClickSound();
                setIsInspectorModeActive(false);
              }}
              className="ml-2 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-[9px] font-mono uppercase font-bold transition-colors cursor-pointer"
            >
              Exit Inspector
            </button>
          </div>
        </>
      )}

      {/* ALL SYSTEM ACTIVITIES MODAL OVERLAY */}
      <AllSystemActivitiesModal 
        isOpen={isActivitiesModalOpen} 
        onClose={() => setIsActivitiesModalOpen(false)} 
      />
      
      {/* JARVIS Circular HUD Element */}
      <div className="fixed top-8 left-8 z-50 pointer-events-none hidden xl:block">
        <div className="relative w-48 h-48">
          <div className="jarvis-ring w-48 h-48 animate-spin-slow opacity-20" />
          <div className="jarvis-ring w-40 h-40 top-4 left-4 animate-spin-reverse opacity-40 border-dashed border-cyan-400" />
          <div className="jarvis-ring w-32 h-32 top-8 left-8 animate-pulse-cyan opacity-60 border-2 border-cyan-500/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[10px] font-black text-cyan-400 tracking-[0.3em] uppercase">Natasha</p>
              <p className="text-[8px] font-bold text-cyan-500/60 uppercase">Neural Stream</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 pt-4 sm:pt-0 relative"
        >
          <div className="absolute -top-12 -right-8 xl:-right-48 2xl:-right-64 hidden lg:block group z-50">
            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              className={`px-6 py-4 rounded-[1.5rem] backdrop-blur-3xl shadow-2xl transition-all border-r-4 text-right scale-90 origin-top-right ${
                serverOnlineStatus 
                  ? 'bg-emerald-500/15 border border-emerald-500/40 border-r-emerald-400 shadow-[0_0_60px_rgba(16,185,129,0.2)]'
                  : 'bg-amber-500/15 border border-amber-500/40 border-r-amber-400 shadow-[0_0_60px_rgba(245,158,11,0.2)]'
              }`}
            >
              <div className="flex flex-col gap-2.5 items-end">
                <p className={`text-[13px] font-black uppercase tracking-[0.6em] flex items-center gap-3 ${serverOnlineStatus ? 'text-emerald-300' : 'text-amber-300'}`}>
                  Raj Expo Server Uplink
                  <span className={`w-2.5 h-2.5 rounded-full animate-jarvis-blink ${serverOnlineStatus ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)]' : 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,1)]'}`} />
                </p>
                <div className="flex items-center gap-5 mr-1">
                  <p className={`text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2 ${serverOnlineStatus ? 'text-emerald-400' : 'text-amber-400'}`}>
                    <span className="opacity-60 font-medium">Server Status:</span> {serverOnlineStatus ? 'ONLINE AND READY' : 'STANDBY OR OFFLINE'}
                  </p>
                  <div className="w-[1px] h-3.5 bg-cyan-500/30" />
                  <p className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <span className="opacity-60 font-medium">Latency:</span> {serverOnlineStatus ? '8ms' : 'Offline'}
                  </p>
                </div>
                <div className="flex items-center gap-4 mr-1">
                  <p className="text-[9px] font-black text-cyan-400/50 uppercase tracking-[0.5em]">
                    N.A.T.A.S.H.A 5.6 ASI 916 (ENCRYPTED) // Click anywhere to shift animation
                  </p>
                  <div className="flex gap-1.5 items-center justify-center">
                     {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="w-1.5 h-3.5 bg-cyan-500/20 rounded-full overflow-hidden"><div className="w-full h-full bg-cyan-400 animate-pulse" style={{ animationDelay: `${i * 0.12}s` }}></div></div>)}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          <div className="flex flex-col items-center justify-center gap-6 mb-4">
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                borderColor: ['rgba(34, 211, 238, 0.3)', 'rgba(34, 211, 238, 0.8)', 'rgba(34, 211, 238, 0.3)']
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="bg-cyan-600/10 p-8 rounded-full border-2 border-cyan-500/30 backdrop-blur-md relative group/logo cursor-pointer"
            >
              <div className="absolute inset-0 rounded-full animate-ping bg-cyan-500/10" />
              <img
                src={rajExpoLogo}
                alt="Raj Expo"
                className="w-40 h-40 md:w-48 md:h-48 object-contain rounded-full drop-shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-transform group-hover/logo:scale-110 relative z-10"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <div className="space-y-4 group">
              <motion.h1 
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] uppercase"
              >
                {customTitle.includes('Raj Expo') ? (
                  <>Welcome to <span className="text-cyan-500">Raj Expo Digitals</span></>
                ) : (
                  <span className="text-cyan-400">{customTitle}</span>
                )}
              </motion.h1>

            </div>
          </div>
        </motion.header>

        <main className="space-y-4">
          {/* Unsaved Changes Tracker & Event Toast Notification */}
          <SaveReminderBar onSave={() => handleOneTapGitHubSync()} />
          <PersonChangeToast />

          <AnimatePresence>
            {errors.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-950/40 backdrop-blur-md p-6 rounded-3xl border border-red-500/30 overflow-hidden"
              >
                <p className="font-black text-red-300 mb-2 uppercase tracking-[0.2em] text-[10px]">Critical Failure // Protocol Breach</p>
                <ul className="list-disc list-inside text-red-400 text-sm space-y-1 font-mono">
                  {errors.map((e, index) => <li key={index}>{e}</li>)}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* RAJ EXPO DIGITALS SERVER 12-SUBFOLDERS EXPLORER MODAL */}
        <RajExpoServerHubModal
          isOpen={isServerHubOpen && !minimizedAppIds.has('server_hub')}
          onClose={() => {
            setIsServerHubOpen(false);
            setMinimizedAppIds(prev => { const n = new Set(prev); n.delete('server_hub'); return n; });
          }}
          onMinimize={() => setMinimizedAppIds(prev => new Set([...prev, 'server_hub']))}
          onOpenPromptStudio={() => {
            setIsPromptStudioOpen(true);
            setMinimizedAppIds(prev => { const n = new Set(prev); n.delete('prompt_studio'); return n; });
          }}
          onOpenPdfCounter={() => setIsPdfCounterModalOpen(true)}
          onOpenToolHub={() => setIsToolHubModalOpen(true)}
          onOpenPeopleDb={() => setIsPeopleDbModalOpen(true)}
          onOpenMediaUpload={() => setIsMediaUploadOpen(true)}
          onOpenActivities={() => setIsActivitiesModalOpen(true)}
          onOneTapGitHubSync={handleOneTapGitHubSync}
          onOpenCanonicalExplorer={(cat) => {
            setSelectedCanonicalCategory(cat);
            setIsCanonicalExplorerOpen(true);
          }}
          onOpenWhatsAppViewer={() => setIsWhatsAppViewerOpen(true)}
          onOpenCloudinaryStore={() => setIsCloudinaryDatabaseOpen(true)}
          onOpenGooglePicker={() => setIsGooglePickerOpen(true)}
          onOpenGoogleDrive={() => setIsGoogleDriveModalOpen(true)}
        />

        {/* NEWLY SIGN IN OR SIGN UP / MENTIONS CONFIGURATIONS MODAL */}
        <AccountConfigModal
          isOpen={isAccountConfigOpen && !minimizedAppIds.has('account_config')}
          onClose={() => {
            setIsAccountConfigOpen(false);
            setMinimizedAppIds(prev => { const n = new Set(prev); n.delete('account_config'); return n; });
          }}
          defaultTab={accountConfigDefaultTab}
        />

        {/* ACTION-SPECIFIC PROMPT CUSTOMISATIONS & GENERATOR STUDIO MODAL */}
        <PromptCustomisationModal
          isOpen={isPromptStudioOpen && !minimizedAppIds.has('prompt_studio')}
          onClose={() => {
            setIsPromptStudioOpen(false);
            setMinimizedAppIds(prev => { const n = new Set(prev); n.delete('prompt_studio'); return n; });
          }}
          onMinimize={() => setMinimizedAppIds(prev => new Set([...prev, 'prompt_studio']))}
          activeContext={{
            fileName: files[0]?.name,
            pageCount: files[0]?.count || totals.totalCount,
            sheetCount: files[0]?.sheetCount || totals.totalSheets,
            totalCost: files[0]?.doubleSidedPrice || totals.totalDoubleSidedPrice,
            singleSidedCost,
            doubleSidedCost
          }}
        />

        {/* CANONICAL CATEGORIES 'CLICK-TO-GO-INSIDE' RECURSIVE EXPLORER MODAL */}
        <CanonicalCategoriesExplorerModal
          isOpen={isCanonicalExplorerOpen}
          onClose={() => setIsCanonicalExplorerOpen(false)}
          initialCategoryCode={selectedCanonicalCategory}
        />

        {/* WHATSAPP DIRECT CHAT ZIP EXTRACTOR & VIEWER MODAL */}
        <WhatsAppChatViewerModal
          isOpen={isWhatsAppViewerOpen && !minimizedAppIds.has('whatsapp_viewer')}
          onClose={() => {
            setIsWhatsAppViewerOpen(false);
            setMinimizedAppIds(prev => { const n = new Set(prev); n.delete('whatsapp_viewer'); return n; });
          }}
        />

        {/* CLOUDINARY CLOUD TEXT DATABASE LIVE VIEWER MODAL */}
        <CloudinaryCloudDatabaseModal
          isOpen={isCloudinaryDatabaseOpen && !minimizedAppIds.has('cloudinary_db')}
          onClose={() => {
            setIsCloudinaryDatabaseOpen(false);
            setMinimizedAppIds(prev => { const n = new Set(prev); n.delete('cloudinary_db'); return n; });
          }}
        />

        {/* GOOGLE DRIVE CLOUD REPOSITORY & OAUTH CONTROL MODAL */}
        <GoogleDriveExplorerModal
          isOpen={isGoogleDriveModalOpen && !minimizedAppIds.has('google_drive')}
          onClose={() => {
            setIsGoogleDriveModalOpen(false);
            setMinimizedAppIds(prev => { const n = new Set(prev); n.delete('google_drive'); return n; });
          }}
          onImportToQueue={(docFile) => {
            setFiles(prev => [...prev, docFile]);
            soundManager.playWelcomeSound();
          }}
        />

        {/* GOOGLE PICKER & WORKSPACE DRIVE EXPLORER MODAL */}
        <GooglePickerModal
          isOpen={isGooglePickerOpen}
          onClose={() => setIsGooglePickerOpen(false)}
        />

        {/* PRESERVED PDF COUNTER MODAL (RAJ EXPO DIGITALS SERVER → TOOLS & APPS → PDF COUNTER) */}
        <PdfCounterModal
          isOpen={isPdfCounterModalOpen && !minimizedAppIds.has('pdf_counter')}
          onClose={() => {
            setIsPdfCounterModalOpen(false);
            setMinimizedAppIds(prev => { const n = new Set(prev); n.delete('pdf_counter'); return n; });
          }}
          files={files}
          totals={totals}
          isLoading={isLoading}
          isZipping={isZipping}
          singleSidedCost={singleSidedCost}
          doubleSidedCost={doubleSidedCost}
          pagesPerSide={pagesPerSide}
          separateOrientations={separateOrientations}
          viewMode={viewMode}
          onFilesSelected={handleFilesSelected}
          onRemoveFile={handleRemoveFile}
          onClearAll={handleClearAll}
          onReorderFiles={handleReorderFiles}
          onCostChange={handleCostChange}
          onPagesPerSideChange={handlePagesPerSideChange}
          onOrientationSeparatorToggle={handleOrientationSeparatorToggle}
          onViewModeChange={setViewMode}
          onOpenRenameModal={() => setIsRenameModalOpen(true)}
          onDownloadZip={handleDownloadZip}
        />

        {/* CANONICAL PEOPLE DATABASE MODAL */}
        <PeopleDatabaseModal
          isOpen={isPeopleDbModalOpen && !minimizedAppIds.has('people_db')}
          onClose={() => {
            setIsPeopleDbModalOpen(false);
            setMinimizedAppIds(prev => { const n = new Set(prev); n.delete('people_db'); return n; });
          }}
        />

        {/* ALL-IN-ONE DIGITAL TOOL HUB MODAL */}
        <DigitalToolHubModal
          isOpen={isToolHubModalOpen && !minimizedAppIds.has('tool_hub')}
          onClose={() => {
            setIsToolHubModalOpen(false);
            setMinimizedAppIds(prev => { const n = new Set(prev); n.delete('tool_hub'); return n; });
          }}
        />
        
        {/* GITHUB CENTRAL DATABASE STORAGE MODAL */}
        <GitHubDatabaseModal
          isOpen={isGitHubModalOpen && !minimizedAppIds.has('github_sync')}
          onClose={() => {
            setIsGitHubModalOpen(false);
            setMinimizedAppIds(prev => { const n = new Set(prev); n.delete('github_sync'); return n; });
          }}
          files={files}
          settings={{
            singleSidedCost,
            doubleSidedCost,
            separateOrientations,
            pagesPerSide,
          }}
          totals={totals}
          onRestoreState={handleRestoreFromGitHub}
        />

        {/* ALL SYSTEM ACTIVITIES AUDIT LOG MODAL */}
        <AllSystemActivitiesModal
          isOpen={isActivitiesModalOpen && !minimizedAppIds.has('activities_log')}
          onClose={() => {
            setIsActivitiesModalOpen(false);
            setMinimizedAppIds(prev => { const n = new Set(prev); n.delete('activities_log'); return n; });
          }}
        />

        {isRenameModalOpen && (
          <RenameModal 
            files={files}
            onClose={() => setIsRenameModalOpen(false)}
            onRename={handleBatchRename}
          />
        )}

        {/* NATASHA DUPLICATE FILE / DATA REMINDER MODAL */}
        {duplicateReminder && (
          <NatashaReminderModal
            data={duplicateReminder}
            onClose={() => setDuplicateReminder(null)}
          />
        )}

        {/* UNIVERSAL MEDIA UPLOAD WITH DESCRIPTION MODAL */}
        <MediaUploadWithDescriptionModal
          isOpen={isMediaUploadOpen}
          onClose={() => setIsMediaUploadOpen(false)}
          onOpenMediaGallery={() => {
            setIsMediaUploadOpen(false);
            setIsRajExpoMediaOpen(true);
          }}
        />

        {/* NATASHA BUTTON INTELLIGENCE POP-UP MODAL (VOICE & TEXT DESCRIPTION) */}
        <NatashaButtonIntelModal
          isOpen={isButtonIntelModalOpen}
          intel={selectedButtonIntel}
          onClose={() => setIsButtonIntelModalOpen(false)}
          onSelectAnotherIntel={(newIntel) => setSelectedButtonIntel(newIntel)}
          onExecuteCurrentButton={onExecuteInspectedButton}
          isInspectorModeActive={isInspectorModeActive}
          onToggleInspectorMode={() => setIsInspectorModeActive(prev => !prev)}
        />

        {/* RAJ EXPO MEDIA FILES VIEWER MODAL */}
        <RajExpoMediaModal
          isOpen={isRajExpoMediaOpen}
          onClose={() => setIsRajExpoMediaOpen(false)}
          onOpenUploadModal={() => {
            setIsRajExpoMediaOpen(false);
            setIsMediaUploadOpen(true);
          }}
          onTriggerReminder={(reminderData) => {
            setDuplicateReminder({
              duplicateName: reminderData.title,
              existingFile: {
                id: `reminder-${Date.now()}`,
                name: reminderData.title,
                size: 0,
                type: 'pdf',
                pageCount: 1,
                sheetCount: 1,
                doubleSidedPrice: 0,
                singleSidedPrice: 0,
                totalPages: 1,
                totalSheets: 1,
                file: new File([], reminderData.title),
                uploadedAt: new Date(),
                category: 'Media File'
              },
              newFile: new File([], reminderData.title)
            });
          }}
        />

        {isGlobalDragging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-cyan-950/90 backdrop-blur-2xl border-4 border-dashed border-cyan-400/50 m-6 rounded-[2.5rem] pointer-events-none"
          >
            <div className="text-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="bg-cyan-500/20 p-12 rounded-full inline-block mb-8 border border-cyan-400/30 shadow-[0_0_50px_rgba(34,211,238,0.2)] overflow-hidden"
              >
                <img
                  src={rajExpoLogo}
                  alt="Raj Expo Logo"
                  className="w-28 h-28 object-contain rounded-full"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <h2 className="text-5xl font-black text-white tracking-tighter mb-4 animate-jarvis-blink">INITIATING UPLINK</h2>
              <p className="text-cyan-300 font-bold text-2xl uppercase tracking-[0.3em]">Release data stream to begin</p>
            </div>
          </motion.div>
        )}

        <footer className="mt-20 border-t border-white/5 pt-10 pb-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-slate-500 opacity-40 animate-pulse">Encryption: AES-256 Enabled // Authorized Personnel Only: RAJ & NATASHA 5.6 ASI 916</p>
            <p className="text-[9px] font-black text-cyan-500/30 uppercase tracking-[0.6em]">System Architecture by N.A.T.A.S.H.A 5.6 & Raj // Raj Expo Digitals Server 916 (Encrypted)</p>
          </div>
        </footer>

        {/* RESPONSIVE PINNED TASKBAR DOCK & SYSTEM TRAY */}
        <TaskbarDock
          openAppIds={openAppIds}
          minimizedAppIds={minimizedAppIds}
          onToggleApp={handleToggleApp}
          currentTheme={customTheme}
          onSelectTheme={handleSelectTheme}
          isLocked={isLocked}
          onToggleLock={() => isLocked ? handleUnlock() : handleLockApp()}
          syncPhase={syncPhase}
          onOneTapSync={handleOneTapGitHubSync}
          onOpenNewTab={handleOpenInNewTab}
          onPurgeData={() => setIsPurgeConfirmOpen(true)}
        />

        {/* WALLPAPER & SETTINGS STUDIO MODAL */}
        <WallpaperSettingsModal
          isOpen={isWallpaperSettingsOpen && !minimizedAppIds.has('wallpaper_settings')}
          onClose={() => {
            setIsWallpaperSettingsOpen(false);
            setMinimizedAppIds(prev => { const n = new Set(prev); n.delete('wallpaper_settings'); return n; });
          }}
          currentSettings={systemSettings}
          onPreviewSettings={(newSettings) => {
            setPreviewSettings(newSettings);
            if (newSettings.themeId) setCustomTheme(newSettings.themeId);
          }}
          onApplySettings={(newSettings) => {
            setSystemSettings(newSettings);
            setPreviewSettings(null);
            if (newSettings.themeId) setCustomTheme(newSettings.themeId);
          }}
        />

        {/* CONFIRM ZERO-SEED DATABASE PURGE DIALOG */}
        {isPurgeConfirmOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-950 border-2 border-rose-500 rounded-3xl p-6 shadow-[0_0_50px_rgba(244,63,94,0.4)] text-center font-mono space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                CONFIRM ZERO-SEED DATABASE PURGE
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to erase all local database records, simulated NTP data, mock activity history, and cached storage?
              </p>
              <p className="text-[11px] text-amber-400 font-bold">
                All databases will be cleanly reset to 0 genuine records. This action cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsPurgeConfirmOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    purgeAllDatabaseData();
                    setFiles([]);
                    setIsPurgeConfirmOpen(false);
                    soundManager.playAccessGrantedSound();
                    logActivity('DATABASE', 'Clean Zero-Seed Purge Executed', 'Purged all local database records and mock fixtures.');
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                >
                  Yes, Erase Everything
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
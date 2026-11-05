import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, Activity, Users, UploadCloud, FileCode, MessageSquare, 
  Sparkles, Monitor, HardDrive, RefreshCw, Folder, FileText, 
  ExternalLink, Maximize2, Settings, Layers, Lock
} from 'lucide-react';
import { soundManager } from '../../services/soundEffects';
import { 
  Win10ThisPCIcon, Win10RecycleBinIcon, Win10FileExplorerIcon, 
  Win10SettingsIcon, Win10CalculatorIcon, Win10NotepadIcon, 
  FirebaseConsoleIcon, GoogleCloudConsoleIcon, GoogleCloudShellIcon 
} from './Windows10Icons';
import { Windows10Window } from './Windows10Window';
import { Windows10Taskbar, RunningAppInfo } from './Windows10Taskbar';
import { Windows10StartMenu } from './Windows10StartMenu';
import { Windows10Notepad } from './Windows10Notepad';
import { Windows10Calculator } from './Windows10Calculator';
import { Windows10FileExplorer } from './Windows10FileExplorer';
import { Windows10Settings } from './Windows10Settings';
import { Windows10GoogleShell } from './Windows10GoogleShell';
import { Windows10ExternalUrlApp } from './Windows10ExternalUrlApp';
import { Windows10RecycleBin } from './Windows10RecycleBin';

export interface DesktopShortcut {
  id: string;
  name: string;
  icon: React.ReactNode;
  category?: 'system' | 'cloud' | 'server' | 'tools';
  isExternalLink?: boolean;
  externalUrl?: string;
}

interface Windows10DesktopProps {
  onOpenServerHub: () => void;
  onOpenPeopleDb: () => void;
  onOpenPdfCounter: () => void;
  onOpenPromptStudio: () => void;
  onOpenGitHubSync: () => void;
  onOpenActivitiesLog: () => void;
  onOpenWhatsAppViewer: () => void;
  onOpenCloudinaryDb: () => void;
  onOpenClockOverview: () => void;
  onOpenNatashaChat: () => void;
  onLockScreen: () => void;
}

export const Windows10Desktop: React.FC<Windows10DesktopProps> = ({
  onOpenServerHub,
  onOpenPeopleDb,
  onOpenPdfCounter,
  onOpenPromptStudio,
  onOpenGitHubSync,
  onOpenActivitiesLog,
  onOpenWhatsAppViewer,
  onOpenCloudinaryDb,
  onOpenClockOverview,
  onOpenNatashaChat,
  onLockScreen
}) => {
  // 1. DEFAULT OPENING STATE: Clean Windows 10 desktop, ALL windows closed by default!
  const [openWindows, setOpenWindows] = useState<string[]>([]);
  const [minimizedWindows, setMinimizedWindows] = useState<Set<string>>(new Set());
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [windowZIndices, setWindowZIndices] = useState<Record<string, number>>({});
  const [topZ, setTopZ] = useState<number>(100);

  // Taskbar Pinned Apps (Defaults to empty as requested: "No apps pinned but can be pinned")
  const [pinnedAppIds, setPinnedAppIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('win10_pinned_apps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Wallpaper State (Default: Windows 10 Official Hero Wallpaper)
  const [wallpaperId, setWallpaperId] = useState<string>('windows-10-hero');

  // UI state
  const [selectedShortcutId, setSelectedShortcutId] = useState<string | null>(null);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState<boolean>(false);
  const [isTaskViewOpen, setIsTaskViewOpen] = useState<boolean>(false);

  // Desktop Context Menu
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [iconSize, setIconSize] = useState<'medium' | 'small' | 'large'>('medium');
  const [showDesktopIcons, setShowDesktopIcons] = useState<boolean>(true);

  // Marquee Selection Box
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectionBox, setSelectionBox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const desktopRef = useRef<HTMLDivElement>(null);

  // Colombo Clock state
  const [colomboTime, setColomboTime] = useState<string>('10:24 AM');
  const [colomboDate, setColomboDate] = useState<string>('Wednesday, November 4, 2026');
  const [colomboShortDate, setColomboShortDate] = useState<string>('11/04/2026');

  // Synchronize live Colombo time
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        setColomboTime(now.toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', hour12: true }));
        setColomboDate(now.toLocaleDateString('en-US', { timeZone: 'Asia/Colombo', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
        setColomboShortDate(now.toLocaleDateString('en-US', { timeZone: 'Asia/Colombo', month: '2-digit', day: '2-digit', year: 'numeric' }));
      } catch {
        setColomboTime('10:24 AM');
        setColomboDate('Wednesday, November 4, 2026');
        setColomboShortDate('11/04/2026');
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut listener: Press Enter on selected desktop shortcut to launch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedShortcutId && e.key === 'Enter') {
        e.preventDefault();
        soundManager.playAccessGrantedSound();
        handleOpenApp(selectedShortcutId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShortcutId]);

  // Save pinned apps to localStorage
  const handleTogglePinApp = (appId: string) => {
    soundManager.playClickSound();
    setPinnedAppIds(prev => {
      const next = prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId];
      try {
        localStorage.setItem('win10_pinned_apps', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Focus Window (Bring to Front)
  const bringToFront = (appId: string) => {
    setActiveWindowId(appId);
    setTopZ(prev => {
      const nextZ = prev + 1;
      setWindowZIndices(zMap => ({ ...zMap, [appId]: nextZ }));
      return nextZ;
    });
  };

  // Open App in Window - Handles both standard desktop windows and server modal hubs
  const handleOpenApp = (appId: string) => {
    soundManager.playClickSound();
    setIsStartMenuOpen(false);
    setIsTaskViewOpen(false);

    // Go to server: Open the same app in a new tab
    if (appId === 'go_to_server' || appId === 'server_external_viewer') {
      soundManager.playAccessGrantedSound();
      const url = window.location.href;
      const newWin = window.open(url, '_blank', 'noopener,noreferrer');
      if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      return;
    }

    // If it's a Server Modal handled by App.tsx, forward it directly so it opens!
    if (appId === 'server_hub') { onOpenServerHub(); return; }
    if (appId === 'people_db') { onOpenPeopleDb(); return; }
    if (appId === 'pdf_counter') { onOpenPdfCounter(); return; }
    if (appId === 'prompt_studio') { onOpenPromptStudio(); return; }
    if (appId === 'github_sync') { onOpenGitHubSync(); return; }
    if (appId === 'activities_log') { onOpenActivitiesLog(); return; }
    if (appId === 'whatsapp_viewer') { onOpenWhatsAppViewer(); return; }
    if (appId === 'cloudinary_db') { onOpenCloudinaryDb(); return; }
    if (appId === 'clock_overview') { onOpenClockOverview(); return; }
    if (appId === 'natasha_chat') { onOpenNatashaChat(); return; }

    // If already open, unminimize and bring to front
    if (openWindows.includes(appId)) {
      setMinimizedWindows(prev => {
        const next = new Set(prev);
        next.delete(appId);
        return next;
      });
      bringToFront(appId);
      return;
    }

    // Otherwise add to openWindows and focus
    setOpenWindows(prev => [...prev, appId]);
    setMinimizedWindows(prev => {
      const next = new Set(prev);
      next.delete(appId);
      return next;
    });
    bringToFront(appId);
  };

  // Close Window
  const handleCloseWindow = (appId: string) => {
    soundManager.playClickSound();
    setOpenWindows(prev => prev.filter(id => id !== appId));
    setMinimizedWindows(prev => {
      const next = new Set(prev);
      next.delete(appId);
      return next;
    });
    if (activeWindowId === appId) {
      const remaining = openWindows.filter(id => id !== appId);
      setActiveWindowId(remaining.length > 0 ? remaining[remaining.length - 1] : null);
    }
  };

  // Minimize Window
  const handleMinimizeWindow = (appId: string) => {
    soundManager.playClickSound();
    setMinimizedWindows(prev => new Set([...prev, appId]));
    if (activeWindowId === appId) {
      setActiveWindowId(null);
    }
  };

  // Taskbar App Click: If active -> minimize; if minimized -> restore & focus; if inactive -> focus
  const handleTaskbarAppClick = (appId: string) => {
    if (!openWindows.includes(appId)) {
      // Pinned app launched
      handleOpenApp(appId);
      return;
    }

    if (activeWindowId === appId && !minimizedWindows.has(appId)) {
      handleMinimizeWindow(appId);
    } else {
      setMinimizedWindows(prev => {
        const next = new Set(prev);
        next.delete(appId);
        return next;
      });
      bringToFront(appId);
    }
  };

  // Show Desktop (Minimize all or Restore all)
  const handleShowDesktop = () => {
    if (openWindows.length === 0) return;
    const allMinimized = openWindows.every(id => minimizedWindows.has(id));
    if (allMinimized) {
      // Restore all
      setMinimizedWindows(new Set());
      if (openWindows.length > 0) bringToFront(openWindows[openWindows.length - 1]);
    } else {
      // Minimize all
      setMinimizedWindows(new Set(openWindows));
      setActiveWindowId(null);
    }
  };

  // Desktop Shortcuts Configuration (Arranged on the left side in authentic vertical columns)
  const shortcuts: DesktopShortcut[] = [
    { 
      id: 'go_to_server', 
      name: 'Go to server', 
      icon: (
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#0078d7] via-[#0284c7] to-[#0ea5e9] border border-cyan-400/60 flex items-center justify-center text-white shadow-[0_0_15px_rgba(0,120,215,0.6)]">
          <ExternalLink className="w-6 h-6 text-white" />
        </div>
      ), 
      isExternalLink: true, 
      externalUrl: window.location.href 
    },
    { id: 'this_pc', name: 'This PC', icon: <Win10ThisPCIcon className="w-11 h-11" /> },
    { id: 'recycle_bin', name: 'Recycle Bin', icon: <Win10RecycleBinIcon className="w-11 h-11" /> },
    { id: 'firebase_console', name: 'Firebase Console', icon: <FirebaseConsoleIcon className="w-11 h-11" />, isExternalLink: true, externalUrl: 'https://console.firebase.google.com' },
    { id: 'google_console', name: 'Google Cloud Console', icon: <GoogleCloudConsoleIcon className="w-11 h-11" />, isExternalLink: true, externalUrl: 'https://console.cloud.google.com' },
    { id: 'google_shell', name: 'Google Cloud Shell', icon: <GoogleCloudShellIcon className="w-11 h-11" /> },
    { id: 'github_sync', name: 'Central Database', icon: <div className="w-11 h-11 rounded-lg bg-cyan-600/30 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow"><Database className="w-6 h-6" /></div> },
    { id: 'activities_log', name: 'Server Activity', icon: <div className="w-11 h-11 rounded-lg bg-emerald-600/30 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shadow"><Activity className="w-6 h-6" /></div> },
    { id: 'notepad', name: 'Notepad', icon: <Win10NotepadIcon className="w-11 h-11" /> },
    { id: 'calculator', name: 'Calculator', icon: <Win10CalculatorIcon className="w-11 h-11" /> },
    { id: 'file_explorer', name: 'File Explorer', icon: <Win10FileExplorerIcon className="w-11 h-11" /> },
    { id: 'settings', name: 'Settings', icon: <Win10SettingsIcon className="w-11 h-11" /> },
    { id: 'server_hub', name: 'Raj Expo Server Hub', icon: <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-red-600 to-red-500 border border-red-400/50 flex items-center justify-center text-white font-black text-lg shadow-[0_0_15px_rgba(239,68,68,0.6)]">R</div> },
    { id: 'prompt_studio', name: 'Prompt Studio', icon: <div className="w-11 h-11 rounded-lg bg-purple-600/30 border border-purple-400/50 flex items-center justify-center text-purple-300 shadow"><FileCode className="w-6 h-6" /></div> },
    { id: 'people_db', name: 'Contacts Database', icon: <div className="w-11 h-11 rounded-lg bg-blue-600/30 border border-blue-400/50 flex items-center justify-center text-blue-300 shadow"><Users className="w-6 h-6" /></div> },
    { id: 'pdf_counter', name: 'PDF & Cost Calculator', icon: <div className="w-11 h-11 rounded-lg bg-teal-600/30 border border-teal-400/50 flex items-center justify-center text-teal-300 shadow"><UploadCloud className="w-6 h-6" /></div> },
    { id: 'whatsapp_viewer', name: 'WhatsApp Viewer', icon: <div className="w-11 h-11 rounded-lg bg-green-600/30 border border-green-400/50 flex items-center justify-center text-green-300 shadow"><MessageSquare className="w-6 h-6" /></div> },
    { id: 'cloudinary_db', name: 'Cloudinary Storage', icon: <div className="w-11 h-11 rounded-lg bg-sky-600/30 border border-sky-400/50 flex items-center justify-center text-sky-300 shadow"><UploadCloud className="w-6 h-6" /></div> },
  ];

  // Desktop selection & right click handlers
  const handleDesktopMouseDown = (e: React.MouseEvent) => {
    // Only on primary desktop surface
    if (e.target !== desktopRef.current && !(e.target as HTMLElement).classList.contains('desktop-surface')) {
      return;
    }

    if (e.button === 0) {
      setContextMenuPos(null);
      setSelectedShortcutId(null);
      setIsStartMenuOpen(false);
      setIsSelecting(true);
      setSelectionBox({ x1: e.clientX, y1: e.clientY, x2: e.clientX, y2: e.clientY });
    }
  };

  const handleDesktopMouseMove = (e: React.MouseEvent) => {
    if (isSelecting && selectionBox) {
      setSelectionBox(prev => prev ? { ...prev, x2: e.clientX, y2: e.clientY } : null);
    }
  };

  const handleDesktopMouseUp = () => {
    setIsSelecting(false);
    setSelectionBox(null);
  };

  const handleDesktopContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    soundManager.playClickSound();
    setIsStartMenuOpen(false);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  // Get running apps list for taskbar
  const runningAppsList: RunningAppInfo[] = openWindows.map(appId => {
    const shortcut = shortcuts.find(s => s.id === appId);
    return {
      id: appId,
      title: shortcut?.name || appId,
      icon: shortcut?.icon || <Monitor className="w-4 h-4 text-cyan-400" />,
      isActive: activeWindowId === appId,
      isMinimized: minimizedWindows.has(appId)
    };
  });

  return (
    <div
      ref={desktopRef}
      onMouseDown={handleDesktopMouseDown}
      onMouseMove={handleDesktopMouseMove}
      onMouseUp={handleDesktopMouseUp}
      onContextMenu={handleDesktopContextMenu}
      className="desktop-surface fixed inset-0 overflow-hidden select-none font-sans bg-[#0c1824]"
    >
      {/* ========================================================= */}
      {/* 1. DEFAULT BLUE WINDOWS 10 HERO WALLPAPER                */}
      {/* ========================================================= */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {wallpaperId === 'windows-10-hero' ? (
          <img
            src="/src/assets/images/windows_10_hero_wallpaper_1793811131850.jpg"
            alt="Windows 10 Hero Desktop Wallpaper"
            className="w-full h-full object-cover object-center filter contrast-[1.02]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-[#0a192f] to-[#04101e]" />
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. DESKTOP SHORTCUTS / ICONS GRID (Left Side)            */}
      {/* ========================================================= */}
      {showDesktopIcons && (
        <div 
          className="relative z-10 p-3 flex flex-col flex-wrap items-start content-start gap-2 h-[calc(100vh-44px)] overflow-hidden pointer-events-auto"
          onClick={() => setSelectedShortcutId(null)}
        >
          {shortcuts.map((shortcut) => {
            const isSelected = selectedShortcutId === shortcut.id;
            return (
              <div
                key={shortcut.id}
                onClick={(e) => {
                  e.stopPropagation();
                  soundManager.playClickSound();
                  setSelectedShortcutId(shortcut.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  soundManager.playAccessGrantedSound();
                  handleOpenApp(shortcut.id);
                }}
                className={`w-[78px] h-[82px] rounded p-1 flex flex-col items-center justify-start text-center cursor-pointer transition-colors group relative ${
                  isSelected 
                    ? 'bg-[#0078d7]/35 border border-[#0078d7]/80 shadow-[0_0_8px_rgba(0,120,215,0.4)]' 
                    : 'hover:bg-white/10 hover:border hover:border-white/20 border border-transparent'
                }`}
                title={shortcut.isExternalLink ? `${shortcut.name} (Double-click to open)` : shortcut.name}
              >
                {/* Shortcut Icon */}
                <div className="w-11 h-11 flex items-center justify-center shrink-0 drop-shadow-md group-hover:scale-105 transition-transform">
                  {shortcut.icon}
                </div>

                {/* External Link tiny arrow emblem */}
                {shortcut.isExternalLink && (
                  <div className="absolute top-8 right-3.5 w-3.5 h-3.5 rounded-sm bg-white/90 text-blue-600 flex items-center justify-center shadow">
                    <ExternalLink className="w-2.5 h-2.5" />
                  </div>
                )}

                {/* Shortcut Label with Windows Drop Shadow */}
                <span 
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.8)' }}
                  className="text-[11px] font-normal text-white leading-tight line-clamp-2 mt-1 break-words w-full"
                >
                  {shortcut.name}
                </span>

                {/* Instant Open / View Pill when Selected */}
                {isSelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundManager.playAccessGrantedSound();
                      handleOpenApp(shortcut.id);
                    }}
                    className="absolute -bottom-2 z-20 px-2 py-0.5 rounded-full bg-[#0078d7] hover:bg-[#1084e3] text-[9px] font-bold text-white shadow-lg flex items-center gap-1 cursor-pointer"
                    title="Click to open application"
                  >
                    <span>Open</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MARQUEE SELECTION RECTANGLE (Windows 10 Blue Box)     */}
      {/* ========================================================= */}
      {isSelecting && selectionBox && (
        <div
          style={{
            left: Math.min(selectionBox.x1, selectionBox.x2),
            top: Math.min(selectionBox.y1, selectionBox.y2),
            width: Math.abs(selectionBox.x2 - selectionBox.x1),
            height: Math.abs(selectionBox.y2 - selectionBox.y1)
          }}
          className="fixed z-20 pointer-events-none bg-[#0078d7]/25 border border-[#0078d7]/80"
        />
      )}

      {/* ========================================================= */}
      {/* 4. ACTIVE APP WINDOWS (Draggable, Resizable, Minimizable) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {/* THIS PC / FILE EXPLORER WINDOW */}
        {(openWindows.includes('this_pc') || openWindows.includes('file_explorer')) && (
          <Windows10Window
            key="win-file-explorer"
            id="file_explorer"
            isOpen={!minimizedWindows.has(openWindows.includes('this_pc') ? 'this_pc' : 'file_explorer')}
            onClose={() => {
              handleCloseWindow('this_pc');
              handleCloseWindow('file_explorer');
            }}
            onMinimize={() => {
              if (openWindows.includes('this_pc')) handleMinimizeWindow('this_pc');
              if (openWindows.includes('file_explorer')) handleMinimizeWindow('file_explorer');
            }}
            onFocus={() => bringToFront(openWindows.includes('this_pc') ? 'this_pc' : 'file_explorer')}
            isActive={activeWindowId === 'this_pc' || activeWindowId === 'file_explorer'}
            title="File Explorer — Raj Expo Digitals"
            icon={<Win10FileExplorerIcon className="w-4 h-4" />}
            initialWidth={880}
            initialHeight={580}
            zIndex={windowZIndices['this_pc'] || windowZIndices['file_explorer'] || 101}
          >
            <Windows10FileExplorer onOpenApp={handleOpenApp} />
          </Windows10Window>
        )}

        {/* NOTEPAD WINDOW */}
        {openWindows.includes('notepad') && (
          <Windows10Window
            key="win-notepad"
            id="notepad"
            isOpen={!minimizedWindows.has('notepad')}
            onClose={() => handleCloseWindow('notepad')}
            onMinimize={() => handleMinimizeWindow('notepad')}
            onFocus={() => bringToFront('notepad')}
            isActive={activeWindowId === 'notepad'}
            title="Untitled - Notepad"
            icon={<Win10NotepadIcon className="w-4 h-4" />}
            initialWidth={720}
            initialHeight={480}
            zIndex={windowZIndices['notepad'] || 102}
          >
            <Windows10Notepad />
          </Windows10Window>
        )}

        {/* CALCULATOR WINDOW */}
        {openWindows.includes('calculator') && (
          <Windows10Window
            key="win-calculator"
            id="calculator"
            isOpen={!minimizedWindows.has('calculator')}
            onClose={() => handleCloseWindow('calculator')}
            onMinimize={() => handleMinimizeWindow('calculator')}
            onFocus={() => bringToFront('calculator')}
            isActive={activeWindowId === 'calculator'}
            title="Calculator"
            icon={<Win10CalculatorIcon className="w-4 h-4" />}
            initialWidth={360}
            initialHeight={520}
            minWidth={320}
            minHeight={450}
            zIndex={windowZIndices['calculator'] || 103}
          >
            <Windows10Calculator />
          </Windows10Window>
        )}

        {/* SETTINGS WINDOW */}
        {openWindows.includes('settings') && (
          <Windows10Window
            key="win-settings"
            id="settings"
            isOpen={!minimizedWindows.has('settings')}
            onClose={() => handleCloseWindow('settings')}
            onMinimize={() => handleMinimizeWindow('settings')}
            onFocus={() => bringToFront('settings')}
            isActive={activeWindowId === 'settings'}
            title="Settings"
            icon={<Win10SettingsIcon className="w-4 h-4" />}
            initialWidth={880}
            initialHeight={620}
            zIndex={windowZIndices['settings'] || 104}
          >
            <Windows10Settings
              currentWallpaper={wallpaperId}
              onSelectWallpaper={setWallpaperId}
              onOpenApp={handleOpenApp}
            />
          </Windows10Window>
        )}

        {/* GOOGLE CLOUD SHELL TERMINAL WINDOW */}
        {openWindows.includes('google_shell') && (
          <Windows10Window
            key="win-google-shell"
            id="google_shell"
            isOpen={!minimizedWindows.has('google_shell')}
            onClose={() => handleCloseWindow('google_shell')}
            onMinimize={() => handleMinimizeWindow('google_shell')}
            onFocus={() => bringToFront('google_shell')}
            isActive={activeWindowId === 'google_shell'}
            title="Google Cloud Shell — Terminal"
            icon={<GoogleCloudShellIcon className="w-4 h-4" />}
            initialWidth={820}
            initialHeight={520}
            zIndex={windowZIndices['google_shell'] || 105}
          >
            <Windows10GoogleShell />
          </Windows10Window>
        )}

        {/* FIREBASE CONSOLE URL APP WINDOW */}
        {openWindows.includes('firebase_console') && (
          <Windows10Window
            key="win-firebase-console"
            id="firebase_console"
            isOpen={!minimizedWindows.has('firebase_console')}
            onClose={() => handleCloseWindow('firebase_console')}
            onMinimize={() => handleMinimizeWindow('firebase_console')}
            onFocus={() => bringToFront('firebase_console')}
            isActive={activeWindowId === 'firebase_console'}
            title="Firebase Console — Raj Expo Digitals"
            icon={<FirebaseConsoleIcon className="w-4 h-4" />}
            initialWidth={780}
            initialHeight={560}
            zIndex={windowZIndices['firebase_console'] || 106}
          >
            <Windows10ExternalUrlApp type="firebase" />
          </Windows10Window>
        )}

        {/* GOOGLE CLOUD CONSOLE URL APP WINDOW */}
        {openWindows.includes('google_console') && (
          <Windows10Window
            key="win-google-console"
            id="google_console"
            isOpen={!minimizedWindows.has('google_console')}
            onClose={() => handleCloseWindow('google_console')}
            onMinimize={() => handleMinimizeWindow('google_console')}
            onFocus={() => bringToFront('google_console')}
            isActive={activeWindowId === 'google_console'}
            title="Google Cloud Console — Enterprise"
            icon={<GoogleCloudConsoleIcon className="w-4 h-4" />}
            initialWidth={780}
            initialHeight={560}
            zIndex={windowZIndices['google_console'] || 107}
          >
            <Windows10ExternalUrlApp type="google-cloud" />
          </Windows10Window>
        )}

        {/* RECYCLE BIN WINDOW */}
        {openWindows.includes('recycle_bin') && (
          <Windows10Window
            key="win-recycle-bin"
            id="recycle_bin"
            isOpen={!minimizedWindows.has('recycle_bin')}
            onClose={() => handleCloseWindow('recycle_bin')}
            onMinimize={() => handleMinimizeWindow('recycle_bin')}
            onFocus={() => bringToFront('recycle_bin')}
            isActive={activeWindowId === 'recycle_bin'}
            title="Recycle Bin"
            icon={<Win10RecycleBinIcon className="w-4 h-4" />}
            initialWidth={780}
            initialHeight={480}
            zIndex={windowZIndices['recycle_bin'] || 108}
          >
            <Windows10RecycleBin />
          </Windows10Window>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 5. WINDOWS 10 DESKTOP CONTEXT MENU (Right Click)          */}
      {/* ========================================================= */}
      {contextMenuPos && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'fixed', left: contextMenuPos.x, top: contextMenuPos.y, zIndex: 100000 }}
          className="w-56 bg-[#252525] border border-[#3f3f3f] shadow-2xl py-1 text-xs text-slate-100 font-sans select-none rounded"
        >
          {/* View */}
          <div className="px-3 py-1.5 hover:bg-[#0078d7] hover:text-white flex items-center justify-between cursor-pointer">
            <span>View</span>
            <span className="text-[10px] text-slate-400">▸</span>
          </div>

          {/* Sort by */}
          <div className="px-3 py-1.5 hover:bg-[#0078d7] hover:text-white flex items-center justify-between cursor-pointer">
            <span>Sort by</span>
            <span className="text-[10px] text-slate-400">▸</span>
          </div>

          {/* Refresh */}
          <button
            onClick={() => {
              soundManager.playClickSound();
              setContextMenuPos(null);
            }}
            className="w-full px-3 py-1.5 hover:bg-[#0078d7] hover:text-white flex items-center justify-between text-left cursor-pointer"
          >
            <span>Refresh</span>
            <span className="text-[10px] text-slate-400">F5</span>
          </button>

          <div className="h-[1px] bg-[#3f3f3f] my-1" />

          {/* Go to server (Open in new tab) */}
          <button
            onClick={() => {
              handleOpenApp('go_to_server');
              setContextMenuPos(null);
            }}
            className="w-full px-3 py-1.5 hover:bg-[#0078d7] hover:text-white flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-white">Go to server</span>
            </div>
            <span className="text-[10px] text-cyan-300">New tab</span>
          </button>

          <div className="h-[1px] bg-[#3f3f3f] my-1" />

          {/* New */}
          <button
            onClick={() => {
              handleOpenApp('notepad');
              setContextMenuPos(null);
            }}
            className="w-full px-3 py-1.5 hover:bg-[#0078d7] hover:text-white flex items-center gap-2 text-left cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>New Text Document</span>
          </button>

          <div className="h-[1px] bg-[#3f3f3f] my-1" />

          {/* Display Settings */}
          <button
            onClick={() => {
              handleOpenApp('settings');
              setContextMenuPos(null);
            }}
            className="w-full px-3 py-1.5 hover:bg-[#0078d7] hover:text-white flex items-center gap-2 text-left cursor-pointer"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Display settings</span>
          </button>

          {/* Personalize */}
          <button
            onClick={() => {
              handleOpenApp('settings');
              setContextMenuPos(null);
            }}
            className="w-full px-3 py-1.5 hover:bg-[#0078d7] hover:text-white flex items-center gap-2 text-left cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Personalize</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. WINDOWS 10 TASK VIEW OVERLAY                          */}
      {/* ========================================================= */}
      {isTaskViewOpen && (
        <div 
          onClick={() => setIsTaskViewOpen(false)}
          className="fixed inset-0 z-[99990] bg-black/75 backdrop-blur-md p-8 flex flex-col justify-start select-none font-sans"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-light text-white tracking-wide">Task View // Open Windows</h2>
            <button 
              onClick={() => setIsTaskViewOpen(false)}
              className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-xs text-white"
            >
              Exit Task View
            </button>
          </div>

          {openWindows.length === 0 ? (
            <div className="text-center text-slate-400 py-16 text-sm">
              No open windows. Double-click any desktop shortcut to open an app.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
              {openWindows.map(id => {
                const s = shortcuts.find(item => item.id === id);
                return (
                  <div
                    key={id}
                    onClick={() => {
                      setMinimizedWindows(prev => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                      });
                      bringToFront(id);
                      setIsTaskViewOpen(false);
                    }}
                    className="p-4 rounded-lg bg-[#202020] border-2 border-[#0078d7] hover:border-cyan-400 cursor-pointer shadow-2xl flex flex-col items-center justify-center gap-3 h-44 hover:scale-105 transition"
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      {s?.icon}
                    </div>
                    <span className="text-xs font-semibold text-white">{s?.name || id}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. AUTHENTIC WINDOWS 10 START MENU                       */}
      {/* ========================================================= */}
      <Windows10StartMenu
        isOpen={isStartMenuOpen}
        onClose={() => setIsStartMenuOpen(false)}
        onOpenApp={(id) => handleOpenApp(id)}
        onLockScreen={onLockScreen}
        colomboTime={colomboTime}
      />

      {/* ========================================================= */}
      {/* 8. AUTHENTIC WINDOWS 10 BOTTOM TASKBAR                   */}
      {/* ========================================================= */}
      <Windows10Taskbar
        runningApps={runningAppsList}
        pinnedAppIds={pinnedAppIds}
        onTogglePinApp={handleTogglePinApp}
        onAppClick={(id) => {
          handleTaskbarAppClick(id);
        }}
        onOpenApp={handleOpenApp}
        onCloseApp={handleCloseWindow}
        isStartMenuOpen={isStartMenuOpen}
        onToggleStartMenu={() => setIsStartMenuOpen(!isStartMenuOpen)}
        onToggleTaskView={() => setIsTaskViewOpen(!isTaskViewOpen)}
        onShowDesktop={handleShowDesktop}
        colomboTime={colomboTime}
        colomboDate={colomboDate}
        colomboShortDate={colomboShortDate}
      />
    </div>
  );
};

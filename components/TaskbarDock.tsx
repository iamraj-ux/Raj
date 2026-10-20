import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderTree, Sparkles, HardDrive, MessageCircle, FolderGit2, 
  Users, Zap, Wrench, Calculator, Activity, Pin, PinOff, 
  Volume2, VolumeX, Lock, Unlock, Palette, ChevronUp, Clock, 
  ExternalLink, ShieldCheck, Check, Trash2, Search, Sliders, 
  Eye, MousePointer
} from 'lucide-react';
import { soundManager } from '../services/soundEffects';
import { logActivity } from '../services/activityLogger';

export type AppId = 
  | 'server_hub'
  | 'prompt_studio'
  | 'wallpaper_settings'
  | 'google_drive'
  | 'google_picker'
  | 'whatsapp_viewer'
  | 'cloudinary_db'
  | 'people_db'
  | 'github_sync'
  | 'tool_hub'
  | 'pdf_counter'
  | 'activities_log'
  | 'button_intel'
  | 'account_config'
  | 'enter_server'
  | 'lock_app'
  | 'open_new_tab'
  | 'purge_data';

export interface AppDefinition {
  id: AppId;
  name: string;
  shortName: string;
  icon: any;
  color: string;
  badge?: string;
  description: string;
  isActionOnly?: boolean;
}

export const ALL_APPS: AppDefinition[] = [
  {
    id: 'account_config',
    name: 'Newly Sign In / Sign Up (Mentions Configurations)',
    shortName: 'Configurations',
    icon: ShieldCheck,
    color: 'text-emerald-300 border-emerald-400/50 bg-emerald-950/80',
    badge: 'Sign In / Up',
    description: 'Newly sign in or sign up to operator profile, GitHub token, Google Workspace & Cloudinary.'
  },
  {
    id: 'server_hub',
    name: 'Projects for Digital Server',
    shortName: 'Digital Server',
    icon: FolderTree,
    color: 'text-cyan-400 border-cyan-400/50 bg-cyan-950/80',
    badge: '12 Folders',
    description: 'Projects for digital server: 12-subfolders explorer, canonical categories & mainframe controls.'
  },
  {
    id: 'enter_server',
    name: 'Enter Digital Server Mainframe',
    shortName: 'Enter Server',
    icon: Zap,
    color: 'text-cyan-300 border-cyan-400/50 bg-cyan-950/80',
    badge: 'Mainframe',
    description: 'Enter digital server workspace, verify latency and initialize live channels.',
    isActionOnly: true
  },
  {
    id: 'github_sync',
    name: 'Update Raj Expo Central Database',
    shortName: 'Central DB Sync',
    icon: Zap,
    color: 'text-amber-400 border-amber-500/50 bg-amber-950/80',
    badge: 'Dual-Sync',
    description: 'Synchronize 34 categories to GitHub (iamraj-ux) & Cloudinary.'
  },
  {
    id: 'prompt_studio',
    name: 'Prompt Customisations & AI Studio',
    shortName: 'Prompt Studio',
    icon: Sparkles,
    color: 'text-purple-300 border-purple-400/50 bg-purple-950/80',
    badge: 'Boss AI',
    description: 'Action-specific prompts for Ask AI, Write with AI, Labels, Gmail & WhatsApp.'
  },
  {
    id: 'wallpaper_settings',
    name: 'Wallpaper & Settings Studio',
    shortName: 'Settings & Walls',
    icon: Sliders,
    color: 'text-pink-300 border-pink-400/50 bg-pink-950/80',
    badge: '5-Stage Sync',
    description: '15 animated cosmic wallpapers, Cloudinary upload & Preview-Apply-Save-Sync pipeline.'
  },
  {
    id: 'cloudinary_db',
    name: 'Cloudinary Cloud Database & Storage',
    shortName: 'Cloud Store',
    icon: FolderGit2,
    color: 'text-cyan-300 border-cyan-400/50 bg-cyan-950/80',
    badge: 'Cloud Vault',
    description: 'Unsigned browser media storage & text database viewer.'
  },
  {
    id: 'google_drive',
    name: 'Google Drive Vault & Cloud Repository',
    shortName: 'Google Drive',
    icon: HardDrive,
    color: 'text-blue-300 border-blue-400/50 bg-blue-950/80',
    badge: 'OAuth',
    description: 'Direct Drive v3 cloud file management & verified file previews.'
  },
  {
    id: 'google_picker',
    name: 'Google Picker Explorer',
    shortName: 'Google Picker',
    icon: Sparkles,
    color: 'text-sky-300 border-sky-400/50 bg-sky-950/80',
    badge: 'Picker API',
    description: 'Browse Docs, Sheets, and Slides via Google Picker dialog.'
  },
  {
    id: 'whatsapp_viewer',
    name: 'WhatsApp Direct Chat Analyzer',
    shortName: 'WhatsApp ZIP',
    icon: MessageCircle,
    color: 'text-emerald-300 border-emerald-400/50 bg-emerald-950/80',
    badge: 'Unzipper',
    description: 'Extract WhatsApp chat .zip archives & styled message writer.'
  },
  {
    id: 'people_db',
    name: 'People Database & Contacts',
    shortName: 'People DB',
    icon: Users,
    color: 'text-amber-300 border-amber-400/50 bg-amber-950/80',
    badge: 'Profiles',
    description: 'Canonical contacts database with profile editor & duplicate detection.'
  },
  {
    id: 'pdf_counter',
    name: 'PDF & Document Counter',
    shortName: 'PDF Counter',
    icon: Calculator,
    color: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/80',
    badge: 'Duplex Calc',
    description: 'Precise page & sheet counter for PDF, Office PPTX, DOCX, XLSX.'
  },
  {
    id: 'tool_hub',
    name: 'All-in-One Digital Tool Hub',
    shortName: 'Tool Hub',
    icon: Wrench,
    color: 'text-teal-300 border-teal-400/50 bg-teal-950/80',
    badge: '20+ Tools',
    description: 'QR generator, simplex/duplex calculator, image workshop & HTML creator.'
  },
  {
    id: 'button_intel',
    name: 'Natasha Button Intel Inspector',
    shortName: 'Button Intel',
    icon: MousePointer,
    color: 'text-fuchsia-300 border-fuchsia-400/50 bg-fuchsia-950/80',
    badge: 'Inspector',
    description: 'Select any button to reveal voice and intelligence breakdown.'
  },
  {
    id: 'activities_log',
    name: 'All System Activities Audit Log',
    shortName: 'Activity Log',
    icon: Activity,
    color: 'text-sky-300 border-sky-400/50 bg-sky-950/80',
    badge: 'Audit',
    description: 'Full chronological system telemetry, user operations & sync events.'
  },
  {
    id: 'lock_app',
    name: 'Lock / Unlock Mainframe Screen',
    shortName: 'Lock System',
    icon: Lock,
    color: 'text-amber-300 border-amber-400/50 bg-amber-950/80',
    badge: 'Security',
    description: 'Toggle lockscreen protection for Boss personal database.',
    isActionOnly: true
  },
  {
    id: 'open_new_tab',
    name: 'Open App in New Tab',
    shortName: 'New Tab',
    icon: ExternalLink,
    color: 'text-cyan-400 border-cyan-400/50 bg-slate-900',
    badge: 'Launch',
    description: 'Open Raj Expo Digitals in a separate browser viewport.',
    isActionOnly: true
  },
  {
    id: 'purge_data',
    name: 'Erase All Database Data',
    shortName: 'Erase DB',
    icon: Trash2,
    color: 'text-rose-400 border-rose-500/50 bg-rose-950/80',
    badge: 'Clean Slate',
    description: 'Purge all local database records and mock fixtures with user confirmation.',
    isActionOnly: true
  }
];

const PINNED_STORAGE_KEY = 'raj_expo_pinned_apps_v1';

export interface TaskbarDockProps {
  openAppIds: Set<AppId>;
  minimizedAppIds: Set<AppId>;
  onToggleApp: (appId: AppId) => void;
  currentTheme: string;
  onSelectTheme: (themeId: string) => void;
  isLocked: boolean;
  onToggleLock: () => void;
  syncPhase: string;
  onOneTapSync?: () => void;
  onOpenNewTab?: () => void;
  onPurgeData?: () => void;
}

export const TaskbarDock: React.FC<TaskbarDockProps> = ({
  openAppIds,
  minimizedAppIds,
  onToggleApp,
  currentTheme,
  onSelectTheme,
  isLocked,
  onToggleLock,
  syncPhase,
  onOneTapSync,
  onOpenNewTab,
  onPurgeData
}) => {
  const [pinnedAppIds, setPinnedAppIds] = useState<AppId[]>(() => {
    try {
      const stored = localStorage.getItem(PINNED_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return ['account_config', 'server_hub', 'prompt_studio', 'wallpaper_settings', 'github_sync', 'cloudinary_db', 'people_db', 'activities_log'];
  });

  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString([], { month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const togglePin = (appId: AppId, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClickSound();
    setPinnedAppIds(prev => {
      let next: AppId[];
      if (prev.includes(appId)) {
        next = prev.filter(id => id !== appId);
        logActivity('TASKBAR', 'Unpinned App from Taskbar', `Unpinned: ${appId}`);
      } else {
        next = [...prev, appId];
        logActivity('TASKBAR', 'Pinned App to Taskbar', `Pinned: ${appId}`);
      }
      try {
        localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleAudioToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !soundManager.getMuted();
    soundManager.setMuted(next);
    setIsMuted(next);
    if (!next) soundManager.playAccessGrantedSound();
    logActivity('SERVER_TASK', 'Sound Effects Mute Toggled', next ? 'Audio Muted' : 'Audio Enabled');
  };

  const themes = [
    { id: 'cyan', name: 'Cyberpunk Cyan', colorBg: 'bg-cyan-500', glow: 'shadow-cyan-500/50' },
    { id: 'emerald', name: 'Matrix Emerald', colorBg: 'bg-emerald-500', glow: 'shadow-emerald-500/50' },
    { id: 'purple', name: 'Royal Neon Purple', colorBg: 'bg-purple-500', glow: 'shadow-purple-500/50' },
    { id: 'amber', name: 'Amber Gold Cyber', colorBg: 'bg-amber-500', glow: 'shadow-amber-500/50' },
    { id: 'red', name: 'Crimson Protocol', colorBg: 'bg-rose-500', glow: 'shadow-rose-500/50' },
    { id: 'titanium', name: 'Midnight Titanium', colorBg: 'bg-slate-400', glow: 'shadow-slate-400/50' },
  ];

  const filteredApps = ALL_APPS.filter(app => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q) || app.badge?.toLowerCase().includes(q);
  });

  const handleAppClick = (app: AppDefinition) => {
    soundManager.playClickSound();
    setIsStartMenuOpen(false);

    if (app.id === 'open_new_tab' && onOpenNewTab) {
      onOpenNewTab();
    } else if (app.id === 'purge_data' && onPurgeData) {
      onPurgeData();
    } else if (app.id === 'lock_app') {
      onToggleLock();
    } else if (app.id === 'enter_server') {
      onToggleApp('server_hub');
    } else {
      onToggleApp(app.id);
    }
  };

  return (
    <>
      {/* Floating Bottom Taskbar Dock */}
      <div className="fixed bottom-2 left-2 right-2 sm:bottom-3 sm:left-4 sm:right-4 z-[9995] select-none font-mono pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 p-1.5 sm:p-2 bg-slate-950/90 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.35)] pointer-events-auto">
          
          {/* Start / Boss Orb Button on Bottom-Left */}
          <div className="relative shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundManager.playClickSound();
                setIsStartMenuOpen(prev => !prev);
                setIsThemeMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-600/40 via-blue-600/40 to-purple-600/40 hover:from-cyan-500/50 hover:to-blue-500/50 text-cyan-200 border-2 border-cyan-400/70 rounded-xl cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.35)] group"
              title="Raj Expo Digitals Boss Menu (All Applications & Controls)"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <span className="text-xs font-black tracking-wider uppercase hidden sm:inline">BOSS 916</span>
              <ChevronUp className={`w-3.5 h-3.5 text-cyan-400 transition-transform ${isStartMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Comprehensive Boss Start Menu Dropdown */}
            <AnimatePresence>
              {isStartMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.96 }}
                  className="absolute bottom-14 left-0 w-80 sm:w-96 bg-slate-950/95 border-2 border-cyan-400/80 rounded-3xl shadow-[0_0_60px_rgba(34,211,238,0.45)] p-3 space-y-3 z-[9999]"
                >
                  {/* Start Menu Header */}
                  <div className="px-3 py-2.5 bg-gradient-to-r from-cyan-950/60 to-purple-950/60 rounded-2xl border border-cyan-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-white uppercase tracking-wider block">
                        RAJ EXPO DIGITALS SERVER
                      </span>
                      <span className="text-[10px] text-cyan-400">
                        Jonathan Raj // Level 5 Supreme Clearance
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold">
                      READY
                    </span>
                  </div>

                  {/* One-Tap Central DB Sync Action Card */}
                  {onOneTapSync && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOneTapSync();
                      }}
                      className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/20 hover:from-amber-500/30 border border-amber-500/50 flex items-center justify-between transition-all cursor-pointer shadow-md group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/40 group-hover:scale-110 transition-transform">
                          <Zap className={`w-4 h-4 ${syncPhase === 'syncing' ? 'animate-spin' : ''}`} />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-black text-white block">
                            Update Raj Expo Central Database
                          </span>
                          <span className="text-[9px] text-amber-300">
                            {syncPhase === 'syncing' ? 'Syncing to GitHub...' : syncPhase === 'updated' ? 'Successfully Updated!' : 'One-Tap GitHub & Cloud Dual-Sync'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/30 text-amber-200">
                        SYNC
                      </span>
                    </button>
                  )}

                  {/* Search inside Start Menu */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/60" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search applications, tools & modules..."
                      className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-cyan-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Application Grid / List */}
                  <div className="max-h-80 overflow-y-auto jarvis-scrollbar space-y-1 pr-1">
                    {filteredApps.map(app => {
                      const Icon = app.icon;
                      const isOpen = openAppIds.has(app.id);
                      const isPinned = pinnedAppIds.includes(app.id);

                      return (
                        <div
                          key={app.id}
                          onClick={() => handleAppClick(app)}
                          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-400/50 transition-all flex items-center justify-between gap-2 cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className={`p-1.5 rounded-lg border ${app.color}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="truncate">
                              <span className="text-xs font-bold text-slate-200 block truncate group-hover:text-cyan-300">
                                {app.name}
                              </span>
                              <span className="text-[9px] text-slate-400 block truncate">{app.badge}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {isOpen && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="App is active" />
                            )}
                            {!app.isActionOnly && (
                              <button
                                onClick={(e) => togglePin(app.id, e)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isPinned ? 'text-cyan-400 hover:text-rose-400' : 'text-slate-500 hover:text-cyan-300'
                                }`}
                                title={isPinned ? "Unpin from taskbar" : "Pin to taskbar"}
                              >
                                {isPinned ? <Pin className="w-3.5 h-3.5 fill-current" /> : <Pin className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Centered Pinned & Running Apps Icons Dock */}
          <div className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 overflow-x-auto jarvis-scrollbar px-1 py-0.5">
            {pinnedAppIds.map(appId => {
              const app = ALL_APPS.find(a => a.id === appId);
              if (!app) return null;
              const Icon = app.icon;
              const isOpen = openAppIds.has(app.id);
              const isMinimized = minimizedAppIds.has(app.id);

              return (
                <div key={app.id} className="relative group shrink-0">
                  <button
                    onClick={() => {
                      soundManager.playClickSound();
                      onToggleApp(app.id);
                    }}
                    className={`relative p-2 sm:px-2.5 sm:py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border ${
                      isOpen
                        ? isMinimized 
                          ? 'bg-slate-900 border-cyan-500/40 text-slate-300 hover:bg-slate-800'
                          : 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.3)] scale-105'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                    title={`${app.name} (${isOpen ? (isMinimized ? 'Minimized - click to restore' : 'Active - click to minimize') : 'Click to launch'})`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-[10px] font-bold uppercase hidden md:inline truncate max-w-[100px]">
                      {app.shortName}
                    </span>

                    {/* Open/Minimized indicator dot */}
                    {isOpen && (
                      <span 
                        className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-1 rounded-full transition-all ${
                          isMinimized ? 'bg-amber-400' : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                        }`} 
                      />
                    )}
                  </button>

                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-950 border border-cyan-400/40 rounded-lg text-[9px] text-cyan-200 uppercase tracking-wider font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
                    {app.name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* System Tray (Right Side) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Theme Selector Toggle */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  soundManager.playClickSound();
                  setIsThemeMenuOpen(prev => !prev);
                  setIsStartMenuOpen(false);
                }}
                className="p-2 text-cyan-400 bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 rounded-xl cursor-pointer transition-all hover:scale-105"
                title="Switch UI Theme"
              >
                <Palette className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {isThemeMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.96 }}
                    className="absolute bottom-14 right-0 w-56 bg-slate-950 border-2 border-cyan-400/80 rounded-2xl shadow-[0_0_40px_rgba(34,211,238,0.4)] p-3 space-y-2 z-[9999]"
                  >
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block border-b border-cyan-500/20 pb-1">
                      UI THEME PALETTES
                    </span>
                    <div className="space-y-1">
                      {themes.map(t => {
                        const isCurrent = currentTheme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => {
                              onSelectTheme(t.id);
                              setIsThemeMenuOpen(false);
                            }}
                            className={`w-full p-2 rounded-xl text-left text-xs font-bold uppercase flex items-center justify-between cursor-pointer transition-all ${
                              isCurrent 
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60' 
                                : 'text-slate-300 hover:bg-slate-900 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${t.colorBg} ${t.glow} shadow-sm`} />
                              <span>{t.name}</span>
                            </div>
                            {isCurrent && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={handleAudioToggle}
              className={`p-2 rounded-xl border transition-all cursor-pointer hover:scale-105 ${
                isMuted 
                  ? 'bg-rose-950/60 border-rose-500/40 text-rose-400' 
                  : 'bg-slate-900 border-cyan-500/40 text-emerald-400'
              }`}
              title={isMuted ? "Audio Muted - click to unmute" : "Audio Enabled - click to mute"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Lock / Unlock Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock();
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer hover:scale-105 ${
                isLocked 
                  ? 'bg-amber-950/80 border-amber-500/50 text-amber-300' 
                  : 'bg-slate-900 border-cyan-500/40 text-cyan-300'
              }`}
              title={isLocked ? "Unlock Mainframe" : "Lock System"}
            >
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>

            {/* Real-time Clock */}
            <div className="hidden sm:flex flex-col items-end px-2 py-1 bg-slate-900/80 border border-slate-800 rounded-xl leading-tight">
              <span className="text-[11px] font-black text-cyan-300">{currentTime}</span>
              <span className="text-[8px] text-slate-400">{currentDate}</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

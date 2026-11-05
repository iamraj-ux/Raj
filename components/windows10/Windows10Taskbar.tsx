import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Wifi, Volume2, Bell, Calendar as CalendarIcon, 
  ChevronUp, Search, MessageSquare, ExternalLink, 
  Layers, Pin, PinOff, X, ArrowRight, CornerDownLeft, 
  FileText, Database, Users, UploadCloud, Monitor, HardDrive, Sparkles
} from 'lucide-react';
import { soundManager } from '../../services/soundEffects';
import { 
  Win10StartLogo, Win10ThisPCIcon, Win10RecycleBinIcon, 
  Win10FileExplorerIcon, Win10SettingsIcon, Win10CalculatorIcon, 
  Win10NotepadIcon, FirebaseConsoleIcon, GoogleCloudConsoleIcon, 
  GoogleCloudShellIcon 
} from './Windows10Icons';

export interface RunningAppInfo {
  id: string;
  title: string;
  icon: React.ReactNode;
  isActive: boolean;
  isMinimized: boolean;
}

interface TaskbarProps {
  runningApps: RunningAppInfo[];
  pinnedAppIds: string[];
  onTogglePinApp: (appId: string) => void;
  onAppClick: (appId: string) => void;
  onOpenApp?: (appId: string) => void;
  onCloseApp: (appId: string) => void;
  isStartMenuOpen: boolean;
  onToggleStartMenu: () => void;
  onToggleTaskView: () => void;
  onShowDesktop: () => void;
  colomboTime: string;
  colomboDate: string;
  colomboShortDate: string;
}

export const Windows10Taskbar: React.FC<TaskbarProps> = ({
  runningApps,
  pinnedAppIds,
  onTogglePinApp,
  onAppClick,
  onOpenApp,
  onCloseApp,
  isStartMenuOpen,
  onToggleStartMenu,
  onToggleTaskView,
  onShowDesktop,
  colomboTime,
  colomboDate,
  colomboShortDate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFlyoutOpen, setIsSearchFlyoutOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState<'all' | 'apps' | 'documents' | 'web'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isVolumeFlyoutOpen, setIsVolumeFlyoutOpen] = useState(false);
  const [isCalendarFlyoutOpen, setIsCalendarFlyoutOpen] = useState(false);
  const [isActionCenterOpen, setIsActionCenterOpen] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(80);
  const [contextMenuAppId, setContextMenuAppId] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Comprehensive Windows 10 searchable catalog
  const searchableItems = useMemo(() => [
    { id: 'go_to_server', name: 'Go to server', category: 'web', desc: 'Open the same app in new tab', icon: <ExternalLink className="w-5 h-5 text-cyan-400" />, isExternal: true },
    { id: 'firebase_console', name: 'Firebase Console', category: 'apps', desc: 'Cloud Firestore, Auth & Storage Dashboard', icon: <FirebaseConsoleIcon className="w-5 h-5" /> },
    { id: 'google_console', name: 'Google Cloud Console', category: 'apps', desc: 'Google Cloud Platform Enterprise Infrastructure', icon: <GoogleCloudConsoleIcon className="w-5 h-5" /> },
    { id: 'google_shell', name: 'Google Cloud Shell', category: 'apps', desc: 'Interactive bash terminal & gcloud CLI', icon: <GoogleCloudShellIcon className="w-5 h-5" /> },
    { id: 'this_pc', name: 'This PC', category: 'apps', desc: 'System drives, folders & hardware devices', icon: <Win10ThisPCIcon className="w-5 h-5" /> },
    { id: 'file_explorer', name: 'File Explorer', category: 'apps', desc: 'Browse Raj Expo files, documents & storage', icon: <Win10FileExplorerIcon className="w-5 h-5" /> },
    { id: 'notepad', name: 'Notepad', category: 'apps', desc: 'Text editor for notes, logs & manifest files', icon: <Win10NotepadIcon className="w-5 h-5" /> },
    { id: 'calculator', name: 'Calculator', category: 'apps', desc: 'Standard calculation & memory operations', icon: <Win10CalculatorIcon className="w-5 h-5" /> },
    { id: 'settings', name: 'Settings', category: 'apps', desc: 'System settings, wallpaper & account options', icon: <Win10SettingsIcon className="w-5 h-5" /> },
    { id: 'recycle_bin', name: 'Recycle Bin', category: 'apps', desc: 'Deleted files, recovery & cleanup', icon: <Win10RecycleBinIcon className="w-5 h-5" /> },
    { id: 'server_hub', name: 'Raj Expo Server Hub', category: 'apps', desc: '12-subfolders explorer & server operations', icon: <div className="w-5 h-5 rounded-full bg-red-600 text-white font-black flex items-center justify-center text-xs">R</div> },
    { id: 'github_sync', name: 'Central Database (GitHub)', category: 'apps', desc: 'Dual-sync database replication to GitHub', icon: <Database className="w-5 h-5 text-cyan-400" /> },
    { id: 'activities_log', name: 'Server Activity & Audit Log', category: 'documents', desc: 'System audit logs & user security history', icon: <FileText className="w-5 h-5 text-emerald-400" /> },
    { id: 'people_db', name: 'People & Contacts Database', category: 'documents', desc: 'Client records, phone numbers & VIP status', icon: <Users className="w-5 h-5 text-blue-400" /> },
    { id: 'pdf_counter', name: 'PDF Counter & Cost Calculator', category: 'apps', desc: 'Document page extraction & duplex cost matrix', icon: <UploadCloud className="w-5 h-5 text-teal-400" /> },
    { id: 'prompt_studio', name: 'Prompt Generator Studio', category: 'apps', desc: 'Gemini custom prompt generation & token metrics', icon: <Sparkles className="w-5 h-5 text-purple-400" /> },
    { id: 'whatsapp_viewer', name: 'WhatsApp Direct Chat Viewer', category: 'documents', desc: 'Exported WhatsApp conversations & chat logs', icon: <MessageSquare className="w-5 h-5 text-green-400" /> },
    { id: 'cloudinary_db', name: 'Cloudinary Media Storage', category: 'web', desc: 'High-speed cloud image & video repository', icon: <UploadCloud className="w-5 h-5 text-sky-400" /> }
  ], []);

  // Filtered results
  const filteredResults = useMemo(() => {
    let list = searchableItems;
    if (searchCategory !== 'all') {
      list = list.filter(item => item.category === searchCategory);
    }
    if (!searchQuery.trim()) {
      return list;
    }
    const q = searchQuery.toLowerCase().trim();
    return list.filter(item => 
      item.name.toLowerCase().includes(q) || 
      item.desc.toLowerCase().includes(q) || 
      item.id.toLowerCase().includes(q)
    );
  }, [searchableItems, searchCategory, searchQuery]);

  const activeResult = filteredResults[selectedIndex] || filteredResults[0];

  const handleLaunchItem = (item: typeof searchableItems[0]) => {
    soundManager.playAccessGrantedSound();
    setIsSearchFlyoutOpen(false);
    setSearchQuery('');
    if (item.id === 'go_to_server' || item.id === 'server_external_viewer') {
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
    if (onOpenApp) {
      onOpenApp(item.id);
    } else {
      onAppClick(item.id);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsSearchFlyoutOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeResult) {
        handleLaunchItem(activeResult);
      }
    }
  };

  // Close flyouts on global click
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      setContextMenuAppId(null);
      const target = e.target as HTMLElement | null;
      if (!target?.closest('#win10-search-bar-container') && !target?.closest('#win10-search-flyout')) {
        setIsSearchFlyoutOpen(false);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleTaskbarContextMenu = (e: React.MouseEvent, appId: string) => {
    e.preventDefault();
    e.stopPropagation();
    soundManager.playClickSound();
    setContextMenuAppId(appId);
    setContextMenuPos({ x: e.clientX, y: e.clientY - 80 });
  };

  return (
    <>
      {/* ========================================================= */}
      {/* 1. AUTHENTIC WINDOWS 10 BOTTOM TASKBAR (40px HEIGHT)     */}
      {/* ========================================================= */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-10 bg-[#101214]/90 backdrop-blur-2xl border-t border-white/10 z-[99998] flex items-center justify-between font-sans select-none text-slate-100"
        onClick={() => {
          setIsVolumeFlyoutOpen(false);
          setIsCalendarFlyoutOpen(false);
          setIsActionCenterOpen(false);
        }}
      >
        {/* LEFT SECTION: Start Button + Search Bar + Task View */}
        <div className="flex items-center h-full">
          {/* Windows 10 Start Button (4-Pane Logo) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playClickSound();
              onToggleStartMenu();
              setIsSearchFlyoutOpen(false);
              setIsVolumeFlyoutOpen(false);
              setIsCalendarFlyoutOpen(false);
              setIsActionCenterOpen(false);
            }}
            className={`h-full w-12 flex items-center justify-center transition-colors cursor-pointer ${
              isStartMenuOpen 
                ? 'bg-[#0078d7] text-white' 
                : 'hover:bg-white/10 text-[#0078d7] hover:text-[#0078d7]'
            }`}
            title="Start"
          >
            <Win10StartLogo className={`w-4 h-4 transition-transform ${isStartMenuOpen ? 'scale-110' : ''}`} />
          </button>

          {/* Windows 10 Search Bar (Type here to search) */}
          <div 
            id="win10-search-bar-container"
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playClickSound();
              setIsSearchFlyoutOpen(true);
              searchInputRef.current?.focus();
            }}
            className={`hidden md:flex items-center h-full max-w-[280px] w-64 border-x px-3 gap-2 cursor-text transition-colors ${
              isSearchFlyoutOpen 
                ? 'bg-[#252526] border-[#0078d7]' 
                : 'bg-[#1f1f1f] border-[#2d2d2d] hover:bg-[#252526]'
            }`}
          >
            <Search className={`w-3.5 h-3.5 shrink-0 ${isSearchFlyoutOpen ? 'text-cyan-400' : 'text-slate-400'}`} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFlyoutOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(0);
                setIsSearchFlyoutOpen(true);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Type here to search"
              className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
            />
            {/* Cortana circle ring */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                soundManager.playWelcomeSound();
                setIsSearchFlyoutOpen(true);
              }}
              className="w-3 h-3 rounded-full border border-slate-400/80 hover:border-cyan-400 transition cursor-pointer shrink-0" 
              title="Talk to Cortana / Natasha" 
            />
          </div>

          {/* Task View Icon (Two overlapping rectangles) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playClickSound();
              onToggleTaskView();
            }}
            className="h-full w-10 flex items-center justify-center hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
            title="Task View"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>

        {/* MIDDLE SECTION: Running & Pinned Apps */}
        <div className="flex-1 flex items-center h-full overflow-x-auto px-1 gap-1 jarvis-scrollbar">
          {runningApps.map((app) => {
            const isPinned = pinnedAppIds.includes(app.id);
            return (
              <button
                key={app.id}
                onClick={(e) => {
                  e.stopPropagation();
                  soundManager.playClickSound();
                  onAppClick(app.id);
                }}
                onContextMenu={(e) => handleTaskbarContextMenu(e, app.id)}
                className={`h-full min-w-[44px] max-w-[180px] px-2.5 flex items-center gap-2 relative transition-colors cursor-pointer group truncate ${
                  app.isActive && !app.isMinimized
                    ? 'bg-white/15'
                    : 'hover:bg-white/10'
                }`}
                title={`${app.title} (Right-click for options)`}
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  {app.icon}
                </div>
                <span className="text-xs truncate hidden lg:inline text-slate-200 group-hover:text-white">
                  {app.title}
                </span>

                {/* Windows 10 Running Indicator (Active blue bar under icon) */}
                <div 
                  className={`absolute bottom-0 left-2 right-2 h-[2px] transition-all ${
                    app.isActive && !app.isMinimized 
                      ? 'bg-[#0078d7]' 
                      : 'bg-slate-500/70'
                  }`} 
                />
              </button>
            );
          })}
        </div>

        {/* RIGHT SECTION: System Tray */}
        <div className="flex items-center h-full shrink-0 text-slate-300">
          {/* Quick "Go to server" button on Taskbar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
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
            }}
            className="h-full px-2.5 hover:bg-[#0078d7]/40 text-cyan-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer text-xs font-semibold border-r border-white/10"
            title="Go to server: Open the same app in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline text-[11px] font-bold">Go to server</span>
          </button>

          {/* Hidden Icons Chevron */}
          <button 
            onClick={(e) => { e.stopPropagation(); soundManager.playClickSound(); }}
            className="h-full px-2 hover:bg-white/10 hover:text-white transition flex items-center justify-center cursor-pointer"
            title="Show hidden icons"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          {/* Network / Internet Icon */}
          <div className="h-full px-2 hover:bg-white/10 hover:text-white transition flex items-center justify-center cursor-pointer" title="Internet Access: Connected (Raj Expo Digitals)">
            <Wifi className="w-3.5 h-3.5" />
          </div>

          {/* Speakers / Volume Icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playClickSound();
              setIsVolumeFlyoutOpen(!isVolumeFlyoutOpen);
              setIsCalendarFlyoutOpen(false);
              setIsActionCenterOpen(false);
            }}
            className={`h-full px-2 transition flex items-center justify-center cursor-pointer ${
              isVolumeFlyoutOpen ? 'bg-white/15 text-white' : 'hover:bg-white/10 hover:text-white'
            }`}
            title={`Speakers: ${volumeLevel}%`}
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>

          {/* Clock & Date (Windows 10 Stacked) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playClickSound();
              setIsCalendarFlyoutOpen(!isCalendarFlyoutOpen);
              setIsVolumeFlyoutOpen(false);
              setIsActionCenterOpen(false);
            }}
            className={`h-full px-2.5 transition flex flex-col justify-center items-end text-right leading-none cursor-pointer ${
              isCalendarFlyoutOpen ? 'bg-white/15 text-white' : 'hover:bg-white/10 hover:text-white'
            }`}
            title="Date and Time (Colombo, Sri Lanka)"
          >
            <span className="text-[11px] font-medium text-white">{colomboTime}</span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">{colomboShortDate}</span>
          </button>

          {/* Action Center Icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playClickSound();
              setIsActionCenterOpen(!isActionCenterOpen);
              setIsVolumeFlyoutOpen(false);
              setIsCalendarFlyoutOpen(false);
            }}
            className={`h-full px-3 relative transition flex items-center justify-center cursor-pointer ${
              isActionCenterOpen ? 'bg-[#0078d7] text-white' : 'hover:bg-white/10 hover:text-white'
            }`}
            title="Action Center (3 notifications)"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </button>

          {/* Show Desktop Peek Strip (Thin line at the very far right) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playLockSound();
              onShowDesktop();
            }}
            className="h-full w-1.5 border-l border-white/20 hover:bg-white/20 active:bg-white/40 transition cursor-pointer"
            title="Show desktop"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. TASKBAR ITEM CONTEXT MENU (Pin / Unpin / Close)       */}
      {/* ========================================================= */}
      {contextMenuAppId && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'fixed', left: Math.min(contextMenuPos.x, window.innerWidth - 180), bottom: 44, zIndex: 100000 }}
          className="w-48 bg-[#252525] border border-[#3f3f3f] shadow-2xl py-1 text-xs text-slate-100 font-sans select-none rounded"
        >
          <button
            onClick={() => {
              onTogglePinApp(contextMenuAppId);
              setContextMenuAppId(null);
            }}
            className="w-full px-3 py-1.5 hover:bg-[#0078d7] hover:text-white flex items-center gap-2 text-left"
          >
            {pinnedAppIds.includes(contextMenuAppId) ? (
              <>
                <PinOff className="w-3.5 h-3.5 text-slate-300" />
                <span>Unpin from taskbar</span>
              </>
            ) : (
              <>
                <Pin className="w-3.5 h-3.5 text-slate-300" />
                <span>Pin to taskbar</span>
              </>
            )}
          </button>

          <div className="h-[1px] bg-[#3f3f3f] my-1" />

          <button
            onClick={() => {
              onCloseApp(contextMenuAppId);
              setContextMenuAppId(null);
            }}
            className="w-full px-3 py-1.5 hover:bg-[#e81123] hover:text-white flex items-center gap-2 text-left text-red-300"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close window</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. WINDOWS 10 VOLUME FLYOUT                              */}
      {/* ========================================================= */}
      {isVolumeFlyoutOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-12 right-16 z-[99999] w-72 bg-[#1f1f1f]/95 backdrop-blur-xl border border-[#3b3b3b] shadow-2xl p-4 font-sans text-xs select-none"
        >
          <div className="flex items-center justify-between text-slate-300 mb-3">
            <span className="font-semibold text-white">Speakers (Realtek Audio)</span>
            <span className="font-mono">{volumeLevel}</span>
          </div>
          <div className="flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={volumeLevel}
              onChange={(e) => setVolumeLevel(parseInt(e.target.value, 10))}
              className="w-full accent-[#0078d7] cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. WINDOWS 10 CALENDAR & CLOCK FLYOUT                    */}
      {/* ========================================================= */}
      {isCalendarFlyoutOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-12 right-4 z-[99999] w-80 bg-[#1f1f1f]/95 backdrop-blur-2xl border border-[#3b3b3b] shadow-2xl p-5 font-sans select-none text-white"
        >
          <div className="text-3xl font-light tracking-tight">{colomboTime}</div>
          <div className="text-xs text-[#0078d7] font-semibold mt-1 mb-4">{colomboDate}</div>

          {/* Mini Calendar Grid */}
          <div className="border-t border-[#333333] pt-3">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-3">
              <span>November 2026</span>
              <span className="text-[10px] text-cyan-400">Asia/Colombo</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 font-mono mb-1">
              <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-200">
              <span className="text-slate-600">1</span>
              <span className="text-slate-600">2</span>
              <span className="text-slate-600">3</span>
              <span className="w-7 h-7 mx-auto rounded-full bg-[#0078d7] text-white flex items-center justify-center font-bold">4</span>
              <span>5</span><span>6</span><span>7</span>
              <span>8</span><span>9</span><span>10</span><span>11</span><span>12</span><span>13</span><span>14</span>
              <span>15</span><span>16</span><span>17</span><span>18</span><span>19</span><span>20</span><span>21</span>
              <span>22</span><span>23</span><span>24</span><span>25</span><span>26</span><span>27</span><span>28</span>
              <span>29</span><span>30</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. WINDOWS 10 ACTION CENTER SIDEBAR                      */}
      {/* ========================================================= */}
      {isActionCenterOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed top-0 right-0 bottom-10 z-[99999] w-84 max-w-[90vw] bg-[#1a1a1a]/95 backdrop-blur-2xl border-l border-[#3b3b3b] shadow-2xl p-4 flex flex-col justify-between font-sans select-none text-white"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#333333] pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Action Center</h3>
              <button 
                onClick={() => setIsActionCenterOpen(false)}
                className="text-xs text-[#0078d7] hover:underline"
              >
                Clear all
              </button>
            </div>

            {/* Notification cards */}
            <div className="space-y-2.5">
              <div className="p-3 bg-[#242424] border border-[#3b3b3b] rounded">
                <p className="text-xs font-bold text-cyan-400">Natasha ASI v5.6</p>
                <p className="text-xs text-slate-200 mt-1">Server online and operational in Colombo, Sri Lanka.</p>
                <p className="text-[10px] text-slate-500 mt-1">Just now</p>
              </div>

              <div className="p-3 bg-[#242424] border border-[#3b3b3b] rounded">
                <p className="text-xs font-bold text-emerald-400">GitHub Central Storage</p>
                <p className="text-xs text-slate-200 mt-1">Database state verified with SHA replication.</p>
                <p className="text-[10px] text-slate-500 mt-1">10 min ago</p>
              </div>

              <div className="p-3 bg-[#242424] border border-[#3b3b3b] rounded">
                <p className="text-xs font-bold text-amber-400">Weather Alert</p>
                <p className="text-xs text-slate-200 mt-1">Colombo Western Province: 28°C Partly Cloudy.</p>
                <p className="text-[10px] text-slate-500 mt-1">30 min ago</p>
              </div>
            </div>
          </div>

          {/* Quick Action Tiles on Bottom */}
          <div className="grid grid-cols-4 gap-1.5 pt-4 border-t border-[#333333]">
            <div className="p-2 bg-[#0078d7] rounded text-center text-[10px] font-semibold text-white">
              Wi-Fi
            </div>
            <div className="p-2 bg-[#2d2d2d] rounded text-center text-[10px] font-semibold text-slate-300">
              Bluetooth
            </div>
            <div className="p-2 bg-[#0078d7] rounded text-center text-[10px] font-semibold text-white">
              Location
            </div>
            <div className="p-2 bg-[#2d2d2d] rounded text-center text-[10px] font-semibold text-slate-300">
              Night light
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. WINDOWS 10 SEARCH FLYOUT (Above Taskbar Search Input)  */}
      {/* ========================================================= */}
      {isSearchFlyoutOpen && (
        <div
          id="win10-search-flyout"
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-10 left-4 sm:left-12 w-[680px] max-w-[95vw] h-[500px] bg-[#1a1a1a]/95 backdrop-blur-2xl border border-[#3b3b3b] shadow-[0_12px_45px_rgba(0,0,0,0.85)] z-[99999] rounded-t-lg flex flex-col font-sans select-none text-slate-100 overflow-hidden"
        >
          {/* Search Category Filter Tabs */}
          <div className="h-9 bg-[#232323] border-b border-[#333333] flex items-center px-3 gap-2 text-xs">
            {(['all', 'apps', 'documents', 'web'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => {
                  soundManager.playClickSound();
                  setSearchCategory(cat);
                  setSelectedIndex(0);
                }}
                className={`px-3 py-1 rounded text-xs capitalize transition cursor-pointer ${
                  searchCategory === cat
                    ? 'bg-[#0078d7] text-white font-medium shadow'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat === 'web' ? 'Web & Cloud' : cat}
              </button>
            ))}
          </div>

          {/* Search Content Split Pane */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Results List */}
            <div className="w-full sm:w-[58%] border-r border-[#333333] flex flex-col justify-between overflow-y-auto jarvis-scrollbar p-3">
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                  {searchQuery ? 'Best match' : 'Top apps & shortcuts'}
                </div>

                {filteredResults.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                    <Search className="w-8 h-8 text-slate-600 mx-auto stroke-[1.5]" />
                    <p>No results found for &ldquo;{searchQuery}&rdquo;</p>
                    <p className="text-[11px] text-slate-500">Try searching for &ldquo;Firebase&rdquo;, &ldquo;Calculator&rdquo;, &ldquo;Explorer&rdquo;, or &ldquo;Notepad&rdquo;.</p>
                  </div>
                ) : (
                  filteredResults.map((item, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => handleLaunchItem(item)}
                        className={`p-2 rounded-md flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-[#0078d7]/25 border border-[#0078d7]/60 text-white' 
                            : 'hover:bg-white/5 text-slate-200 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="w-8 h-8 flex items-center justify-center shrink-0">
                            {item.icon}
                          </div>
                          <div className="truncate text-left">
                            <div className="text-xs font-semibold text-white truncate">{item.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLaunchItem(item);
                          }}
                          className="px-2 py-1 bg-[#0078d7] hover:bg-[#1084e3] text-white rounded text-[10px] font-semibold flex items-center gap-1 shrink-0 transition"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Detailed Preview Pane */}
            <div className="hidden sm:flex sm:w-[42%] bg-[#1c1c1c] p-5 flex-col justify-between overflow-y-auto">
              {activeResult ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center text-center space-y-2 pt-2">
                    <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-md">
                      {activeResult.icon}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{activeResult.name}</h4>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {activeResult.category.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 text-center leading-relaxed">
                    {activeResult.desc}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-[#333333]">
                    <button
                      onClick={() => handleLaunchItem(activeResult)}
                      className="w-full py-2.5 bg-[#0078d7] hover:bg-[#1084e3] text-white font-bold rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow"
                    >
                      <span>Open and View</span>
                      <CornerDownLeft className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onTogglePinApp(activeResult.id)}
                      className="w-full py-2 bg-[#2a2a2a] hover:bg-[#333333] text-slate-200 font-medium rounded-lg text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Pin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{pinnedAppIds.includes(activeResult.id) ? 'Unpin from taskbar' : 'Pin to taskbar'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                  Select an item to view details
                </div>
              )}

              {/* Quick tip on bottom */}
              <div className="text-[10px] text-slate-500 text-center font-mono pt-3 border-t border-[#2d2d2d]">
                Press ↵ Enter to open • Esc to close
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

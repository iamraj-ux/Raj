import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Power, Settings, User, FileText, Image as ImageIcon, 
  Menu, ExternalLink, Sun, CloudSun, Sparkles, Database, 
  Terminal, Users, Calculator, RefreshCw, UploadCloud, 
  Lock, RotateCcw, Moon, ChevronRight, MessageSquare
} from 'lucide-react';
import { soundManager } from '../../services/soundEffects';
import { 
  Win10FileExplorerIcon, Win10CalculatorIcon, Win10NotepadIcon, 
  Win10SettingsIcon, FirebaseConsoleIcon, GoogleCloudConsoleIcon, 
  GoogleCloudShellIcon 
} from './Windows10Icons';

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApp: (appId: string) => void;
  onLockScreen: () => void;
  colomboTime: string;
}

export const Windows10StartMenu: React.FC<StartMenuProps> = ({
  isOpen,
  onClose,
  onOpenApp,
  onLockScreen,
  colomboTime
}) => {
  const [isPowerMenuOpen, setIsPowerMenuOpen] = useState(false);
  const [isRailExpanded, setIsRailExpanded] = useState(false);
  const [activeNewsIndex, setActiveNewsIndex] = useState(0);

  const liveNewsHeadlines = [
    "Raj Expo Digitals: Server Matrix Online & Synchronized",
    "Colombo Weather: 28°C, Tropical Sunshine over Western Coast",
    "GitHub Database: Central Cloud Replication Verified",
    "Natasha ASI v5.6: Quantum Neural Stream Operating at 100%"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNewsIndex(prev => (prev + 1) % liveNewsHeadlines.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const handleGoToServer = () => {
    soundManager.playAccessGrantedSound();
    onClose();
    // Directly open the same app in a new tab
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
  };

  const allAppsList = [
    { id: 'go_to_server', name: 'Go to server', icon: () => <ExternalLink className="w-5 h-5 text-cyan-400" /> },
    { id: 'calculator', name: 'Calculator', icon: Win10CalculatorIcon },
    { id: 'github_sync', name: 'Central Database (GitHub)', icon: () => <Database className="w-5 h-5 text-cyan-400" /> },
    { id: 'cloudinary_db', name: 'Cloudinary Media Storage', icon: () => <UploadCloud className="w-5 h-5 text-sky-400" /> },
    { id: 'file_explorer', name: 'File Explorer', icon: Win10FileExplorerIcon },
    { id: 'firebase_console', name: 'Firebase Console', icon: FirebaseConsoleIcon },
    { id: 'google_console', name: 'Google Cloud Console', icon: GoogleCloudConsoleIcon },
    { id: 'google_shell', name: 'Google Cloud Shell', icon: GoogleCloudShellIcon },
    { id: 'natasha_chat', name: 'Natasha AI Intelligence', icon: () => <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" /> },
    { id: 'notepad', name: 'Notepad', icon: Win10NotepadIcon },
    { id: 'pdf_counter', name: 'PDF Counter & Cost Calculator', icon: () => <UploadCloud className="w-5 h-5 text-emerald-400" /> },
    { id: 'people_db', name: 'People & Contacts Database', icon: () => <Users className="w-5 h-5 text-blue-400" /> },
    { id: 'prompt_studio', name: 'Prompt Generator Studio', icon: () => <FileText className="w-5 h-5 text-purple-400" /> },
    { id: 'server_hub', name: 'Raj Expo Server Hub', icon: () => <Database className="w-5 h-5 text-amber-400" /> },
    { id: 'activities_log', name: 'Server Activity & Audit Log', icon: () => <RefreshCw className="w-5 h-5 text-emerald-400" /> },
    { id: 'settings', name: 'Settings', icon: Win10SettingsIcon },
    { id: 'whatsapp_viewer', name: 'WhatsApp Direct Chat Viewer', icon: () => <MessageSquare className="w-5 h-5 text-green-400" /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="fixed bottom-10 left-0 z-[99999] w-[640px] max-w-[96vw] h-[580px] max-h-[85vh] bg-[#1a1a1a]/95 backdrop-blur-2xl border-t border-r border-[#3b3b3b] shadow-[0_0_50px_rgba(0,0,0,0.85)] flex font-sans select-none overflow-hidden text-slate-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. LEFT NARROW ICON RAIL (48px or expanded) */}
      <div 
        className={`bg-[#141414] border-r border-[#262626] flex flex-col justify-between py-2 transition-all duration-200 z-20 ${
          isRailExpanded ? 'w-48' : 'w-12'
        }`}
      >
        {/* Top Hamburger */}
        <button
          onClick={() => {
            soundManager.playClickSound();
            setIsRailExpanded(!isRailExpanded);
          }}
          className="w-full h-11 flex items-center px-3.5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
          title="Expand Start rail"
        >
          <Menu className="w-4 h-4 shrink-0" />
          {isRailExpanded && <span className="ml-3 text-xs font-semibold uppercase tracking-wider">START</span>}
        </button>

        {/* Bottom User & Power controls */}
        <div className="space-y-1 relative">
          {/* User Profile */}
          <button
            onClick={() => {
              soundManager.playClickSound();
              onOpenApp('account_config');
              onClose();
            }}
            className="w-full h-11 flex items-center px-3.5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
            title="Boss Jonathan Raj"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              J
            </div>
            {isRailExpanded && <span className="ml-3 text-xs font-medium truncate">Jonathan Raj</span>}
          </button>

          {/* Documents */}
          <button
            onClick={() => {
              soundManager.playClickSound();
              onOpenApp('file_explorer');
              onClose();
            }}
            className="w-full h-11 flex items-center px-3.5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
            title="Documents"
          >
            <FileText className="w-4 h-4 shrink-0" />
            {isRailExpanded && <span className="ml-3 text-xs">Documents</span>}
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              soundManager.playClickSound();
              onOpenApp('settings');
              onClose();
            }}
            className="w-full h-11 flex items-center px-3.5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4 shrink-0" />
            {isRailExpanded && <span className="ml-3 text-xs">Settings</span>}
          </button>

          {/* Power Button */}
          <div className="relative">
            <button
              onClick={() => {
                soundManager.playClickSound();
                setIsPowerMenuOpen(!isPowerMenuOpen);
              }}
              className="w-full h-11 flex items-center px-3.5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
              title="Power options"
            >
              <Power className="w-4 h-4 shrink-0" />
              {isRailExpanded && <span className="ml-3 text-xs">Power</span>}
            </button>

            {/* Power Flyout */}
            {isPowerMenuOpen && (
              <div className="absolute bottom-0 left-12 w-40 bg-[#252525] border border-[#3d3d3d] shadow-2xl py-1 text-xs text-slate-200 z-50">
                <button
                  onClick={() => {
                    onLockScreen();
                    setIsPowerMenuOpen(false);
                    onClose();
                  }}
                  className="w-full px-4 py-2 hover:bg-[#0078d7] hover:text-white flex items-center gap-2 text-left"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock</span>
                </button>
                <button
                  onClick={() => {
                    soundManager.playLockSound();
                    setIsPowerMenuOpen(false);
                    onClose();
                  }}
                  className="w-full px-4 py-2 hover:bg-[#0078d7] hover:text-white flex items-center gap-2 text-left"
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Sleep</span>
                </button>
                <button
                  onClick={() => {
                    soundManager.playWelcomeSound();
                    window.location.reload();
                  }}
                  className="w-full px-4 py-2 hover:bg-[#0078d7] hover:text-white flex items-center gap-2 text-left"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart Server</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. MIDDLE ALL APPS ALPHABETICAL LIST (220px) */}
      <div className="w-56 bg-[#1f1f1f]/80 overflow-y-auto p-3 text-xs space-y-1 jarvis-scrollbar shrink-0">
        <div className="text-[11px] font-semibold text-slate-400 px-2 py-1">Recently added</div>
        <div 
          onClick={() => { soundManager.playAccessGrantedSound(); onOpenApp('server_hub'); onClose(); }}
          className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-white/10 cursor-pointer"
        >
          <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Database className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium text-white truncate">Raj Expo Server Hub</span>
        </div>

        <div className="border-t border-[#333333] my-2" />

        <div className="text-[11px] font-bold text-[#0078d7] px-2 py-1">All Applications</div>

        {allAppsList.map((app) => {
          const Icon = app.icon;
          return (
            <div
              key={app.id}
              onClick={() => {
                soundManager.playAccessGrantedSound();
                onOpenApp(app.id);
                onClose();
              }}
              className="flex items-center gap-3 px-2 py-2 rounded hover:bg-white/10 cursor-pointer transition-colors"
            >
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <span className="truncate text-slate-200 hover:text-white">{app.name}</span>
            </div>
          );
        })}
      </div>

      {/* 3. RIGHT AUTHENTIC WINDOWS 10 LIVE TILES GRID */}
      <div className="flex-1 bg-[#181818]/90 overflow-y-auto p-4 jarvis-scrollbar">
        {/* Productivity Section */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
            Productivity & Core
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* LARGE HERO TILE: "Go to server" */}
            <div
              onClick={handleGoToServer}
              className="col-span-2 h-24 bg-gradient-to-r from-[#0078d7] via-[#0284c7] to-[#0ea5e9] p-3 text-white flex flex-col justify-between hover:brightness-110 active:scale-[0.98] transition cursor-pointer relative overflow-hidden group shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>External Viewer</span>
                </span>
                <ExternalLink className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
              </div>

              <div>
                <h4 className="text-base font-black tracking-tight flex items-center gap-2">
                  <span>Go to server</span>
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-200" />
                </h4>
                <p className="text-[10px] text-cyan-100 opacity-90 font-medium">Open the same app in new tab</p>
              </div>
            </div>

            {/* LIVE WEATHER TILE (Colombo, Sri Lanka) */}
            <div 
              onClick={() => { soundManager.playClickSound(); onOpenApp('clock_overview'); onClose(); }}
              className="h-28 bg-[#0063b1] p-3 text-white flex flex-col justify-between hover:brightness-110 active:scale-[0.98] transition cursor-pointer shadow"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider">Colombo Weather</span>
                <CloudSun className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="text-2xl font-light">28°C</div>
                <div className="text-[10px] opacity-90">Partly Cloudy • Colombo, LK</div>
              </div>
            </div>

            {/* LIVE NEWS / TICKER TILE */}
            <div 
              onClick={() => { soundManager.playClickSound(); onOpenApp('clock_overview'); onClose(); }}
              className="h-28 bg-[#8764b8] p-3 text-white flex flex-col justify-between hover:brightness-110 active:scale-[0.98] transition cursor-pointer shadow"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider">News Live</span>
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={activeNewsIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-[11px] leading-snug line-clamp-3 font-medium"
                >
                  {liveNewsHeadlines[activeNewsIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Explore Section */}
        <div>
          <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
            Cloud & Development
          </div>

          <div className="grid grid-cols-4 gap-2">
            {/* Firebase Tile */}
            <div
              onClick={() => { soundManager.playClickSound(); onOpenApp('firebase_console'); onClose(); }}
              className="h-20 bg-[#d97706] p-2 text-white flex flex-col justify-between hover:brightness-110 cursor-pointer shadow"
            >
              <FirebaseConsoleIcon className="w-6 h-6" />
              <span className="text-[10px] font-semibold leading-tight">Firebase</span>
            </div>

            {/* Google Cloud Tile */}
            <div
              onClick={() => { soundManager.playClickSound(); onOpenApp('google_console'); onClose(); }}
              className="h-20 bg-[#2563eb] p-2 text-white flex flex-col justify-between hover:brightness-110 cursor-pointer shadow"
            >
              <GoogleCloudConsoleIcon className="w-6 h-6" />
              <span className="text-[10px] font-semibold leading-tight">GCP Console</span>
            </div>

            {/* Cloud Shell Tile */}
            <div
              onClick={() => { soundManager.playClickSound(); onOpenApp('google_shell'); onClose(); }}
              className="h-20 bg-[#0f766e] p-2 text-white flex flex-col justify-between hover:brightness-110 cursor-pointer shadow"
            >
              <GoogleCloudShellIcon className="w-6 h-6" />
              <span className="text-[10px] font-semibold leading-tight">Cloud Shell</span>
            </div>

            {/* Calculator Tile */}
            <div
              onClick={() => { soundManager.playClickSound(); onOpenApp('calculator'); onClose(); }}
              className="h-20 bg-[#0078d7] p-2 text-white flex flex-col justify-between hover:brightness-110 cursor-pointer shadow"
            >
              <Win10CalculatorIcon className="w-6 h-6" />
              <span className="text-[10px] font-semibold leading-tight">Calculator</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

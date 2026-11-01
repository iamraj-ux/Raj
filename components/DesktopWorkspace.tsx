import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Users, Activity, Database, RefreshCw, Mail, MessageCircle, 
  FileCode, UploadCloud, Settings, Search, Sun, CloudSun, Clock, 
  Bell, Calendar, ChevronRight, ArrowRight, Minus, Square, X, 
  Volume2, Lock, Plus, Sparkles, ExternalLink, ShieldCheck, 
  Layers, Maximize, AlertCircle, CheckCircle2, Loader2, Info, MonitorPlay
} from 'lucide-react';
import { soundManager } from '../services/soundEffects';
import { EmptyImagePlaceholder } from './EmptyImagePlaceholder';

interface DesktopWorkspaceProps {
  onOpenApp: (appId: string) => void;
  onLockScreen: () => void;
  serverOnlineStatus: boolean;
  onOpenClockOverview: () => void;
  onOpenNatashaChat: () => void;
}

interface TouchRipple {
  id: number;
  x: number;
  y: number;
}

const STATUS_TICKER_ITEMS = [
  { text: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', icon: 'check' },
  { text: 'Natasha\'s Notifications', color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30', icon: 'sparkles' },
  { text: 'Processing', color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/30', icon: 'loader' },
  { text: 'Loading', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', icon: 'loader' },
  { text: 'Opening', color: 'text-sky-400', bg: 'bg-sky-500/15', border: 'border-sky-500/30', icon: 'sparkles' },
  { text: 'Waiting', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', icon: 'clock' },
  { text: 'Warning', color: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/30', icon: 'warning' },
  { text: 'Error', color: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30', icon: 'error' },
];

export const DesktopWorkspace: React.FC<DesktopWorkspaceProps> = ({
  onOpenApp,
  onLockScreen,
  serverOnlineStatus,
  onOpenClockOverview,
  onOpenNatashaChat
}) => {
  const [activeNav, setActiveNav] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [colomboTime, setColomboTime] = useState<string>('10:24 AM');
  const [colomboDate, setColomboDate] = useState<string>('Fri, 24 Oct 2026');
  const [colomboShortDate, setColomboShortDate] = useState<string>('24/10/2026');
  const [greeting, setGreeting] = useState<string>('Good Morning, Raj!');
  
  // Start Menu State
  const [isStartMenuOpen, setIsStartMenuOpen] = useState<boolean>(false);
  const startMenuRef = useRef<HTMLDivElement | null>(null);

  // Status Ticker State
  const [tickerIndex, setTickerIndex] = useState<number>(0);

  // Touch Ripples State
  const [ripples, setRipples] = useState<TouchRipple[]>([]);

  // Wallpaper View Toggle (Defaults to true: Live Wallpaper "Raj Expo Digitals")
  const [useLiveWallpaper, setUseLiveWallpaper] = useState<boolean>(true);

  // Synchronize live Colombo time
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Colombo',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        const dateStr = now.toLocaleDateString('en-US', {
          timeZone: 'Asia/Colombo',
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
        const shortDateStr = now.toLocaleDateString('en-GB', {
          timeZone: 'Asia/Colombo',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        setColomboTime(timeStr);
        setColomboDate(dateStr);
        setColomboShortDate(shortDateStr);

        const hour = parseInt(now.toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo', hour: '2-digit', hour12: false }), 10);
        if (hour >= 5 && hour < 12) setGreeting('Good Morning, Raj!');
        else if (hour >= 12 && hour < 17) setGreeting('Good Afternoon, Raj!');
        else setGreeting('Good Evening, Raj!');
      } catch {
        setColomboTime('10:24 AM');
        setColomboDate('Fri, 24 Oct 2026');
        setColomboShortDate('24/10/2026');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Top Status Ticker automatic cycling
  useEffect(() => {
    const tickerInterval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % STATUS_TICKER_ITEMS.length);
    }, 3200);
    return () => clearInterval(tickerInterval);
  }, []);

  // Close Start Menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (startMenuRef.current && !startMenuRef.current.contains(e.target as Node)) {
        setIsStartMenuOpen(false);
      }
    };
    if (isStartMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isStartMenuOpen]);

  // Global touch / click pop-up ripple animation handler
  const handleGlobalTouch = (e: React.MouseEvent<HTMLDivElement>) => {
    const newRipple: TouchRipple = {
      id: Date.now() + Math.random(),
      x: e.clientX,
      y: e.clientY
    };
    setRipples(prev => [...prev.slice(-15), newRipple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 700);
  };

  // Open external server viewer in full screen new tab
  const handleOpenServerExternalViewer = () => {
    soundManager.playAccessGrantedSound();
    setIsStartMenuOpen(false);
    
    // Attempt fullscreen if permitted
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {}

    // Open clean new tab in full screen
    const newWindow = window.open(
      window.location.href, 
      '_blank', 
      'noopener,noreferrer,menubar=no,toolbar=no,location=no,status=no'
    );
    if (newWindow) {
      newWindow.focus();
    }
  };

  const currentTicker = STATUS_TICKER_ITEMS[tickerIndex];

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, action: () => setActiveNav('home') },
    { id: 'contacts', label: 'Contacts', icon: Users, action: () => onOpenApp('people_db') },
    { id: 'server_activity', label: 'Server Activity', icon: Activity, action: () => onOpenApp('activities_log') },
    { id: 'database', label: 'Database', icon: Database, action: () => onOpenApp('server_hub') },
    { id: 'quick_update', label: 'Quick Update', icon: RefreshCw, action: () => onOpenApp('github_sync') },
    { id: 'gmail', label: 'Gmail', icon: Mail, action: () => onOpenApp('enter_server') },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, action: () => onOpenApp('whatsapp_viewer') },
    { id: 'prompt_gen', label: 'Prompt Generator', icon: FileCode, action: () => onOpenApp('prompt_studio') },
    { id: 'file_upload', label: 'File Upload', icon: UploadCloud, action: () => onOpenApp('pdf_counter') },
    { id: 'settings', label: 'System Settings', icon: Settings, action: () => onOpenApp('wallpaper_settings') },
  ];

  const quickAppTiles = [
    { name: 'Contacts', icon: Users, color: 'from-blue-600 to-blue-500', action: () => onOpenApp('people_db') },
    { name: 'Server Activity', icon: Activity, color: 'from-emerald-600 to-emerald-500', action: () => onOpenApp('activities_log') },
    { name: 'Database', icon: Database, color: 'from-purple-600 to-purple-500', action: () => onOpenApp('server_hub') },
    { name: 'Quick Update', icon: RefreshCw, color: 'from-amber-600 to-amber-500', action: () => onOpenApp('github_sync') },
    { name: 'Gmail', icon: Mail, color: 'from-rose-600 to-rose-500', action: () => onOpenApp('enter_server') },
    { name: 'WhatsApp', icon: MessageCircle, color: 'from-green-600 to-green-500', action: () => onOpenApp('whatsapp_viewer') },
    { name: 'Prompt Generator', icon: FileCode, color: 'from-indigo-600 to-indigo-500', action: () => onOpenApp('prompt_studio') },
    { name: 'File Upload', icon: UploadCloud, color: 'from-cyan-600 to-cyan-500', action: () => onOpenApp('pdf_counter') },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      onClick={handleGlobalTouch}
      className="relative min-h-screen w-full select-none overflow-hidden flex flex-col font-sans"
    >
      {/* 1. INTERACTIVE SCREEN TOUCH POP-UP RIPPLES */}
      <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
        {ripples.map(r => (
          <motion.div
            key={r.id}
            initial={{ scale: 0.1, opacity: 0.95 }}
            animate={{ scale: 2.8, opacity: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            style={{ left: r.x - 24, top: r.y - 24 }}
            className="absolute w-12 h-12 rounded-full border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] pointer-events-none flex items-center justify-center"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
          </motion.div>
        ))}
      </div>

      {/* 2. DEFAULT BACKGROUND: "RAJ EXPO DIGITALS" LIVE WALLPAPER */}
      {/* If useLiveWallpaper is true, transparent backing lets CosmicWallpaperCanvas shine through */}
      {!useLiveWallpaper ? (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/public/assets/aistudio/f093972652853700cd11e6cefd5ea31f00a73c022f968cbf0b43ef6d6560f7af_84d9e56d.png"
            alt="Scenic Alpine Mountain Lake"
            className="w-full h-full object-cover object-center filter contrast-[1.03] brightness-[0.98]"
          />
          <div className="absolute inset-0 bg-blue-950/20 backdrop-blur-[0.5px]" />
        </div>
      ) : (
        /* Semi-transparent dark cosmic backing overlay letting the live canvas shine through with cyber depth */
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950/30 via-slate-950/20 to-slate-950/50 pointer-events-none" />
      )}

      {/* 3. TOP APP BAR (Dark Translucent Frosted Strip) */}
      <header className="relative z-30 w-full bg-slate-950/80 backdrop-blur-2xl border-b border-white/10 px-5 py-2.5 flex items-center justify-between shadow-lg">
        {/* Left Brand with Red Circle 'R' Logo */}
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.15, rotate: 5 }}
            whileTap={{ scale: 0.92 }}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.7)] border border-red-400/50 shrink-0 cursor-pointer"
            onClick={() => {
              soundManager.playClickSound();
              setIsStartMenuOpen(prev => !prev);
            }}
            title="Raj Expo Digitals Start"
          >
            <span className="text-white font-black text-base tracking-tighter">R</span>
          </motion.div>
          <div>
            <h1 className="text-xs font-black text-white uppercase tracking-wider leading-tight">
              RAJ EXPO DIGITALS SERVER
            </h1>
            <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1.5 leading-tight">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Natasha's online and operational</span>
            </p>
          </div>
        </div>

        {/* Center Pill Search Bar & Animated Status Ticker */}
        <div className="flex items-center gap-4 flex-1 max-w-xl mx-4">
          <div className="hidden md:flex items-center flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anything across server records..."
              className="w-full pl-10 pr-4 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/60 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/70 focus:bg-slate-800/90 transition shadow-inner"
            />
          </div>

          {/* TOP ANIMATED STATUS TICKER */}
          <motion.div
            key={currentTicker.text}
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            onClick={() => {
              soundManager.playClickSound();
              setTickerIndex(prev => (prev + 1) % STATUS_TICKER_ITEMS.length);
            }}
            className={`flex items-center gap-2 px-3 py-1 rounded-full ${currentTicker.bg} ${currentTicker.border} border backdrop-blur-xl shadow-sm cursor-pointer select-none`}
            title="Click to cycle status"
          >
            {currentTicker.icon === 'loader' && (
              <Loader2 className={`w-3 h-3 animate-spin ${currentTicker.color}`} />
            )}
            {currentTicker.icon === 'check' && (
              <CheckCircle2 className={`w-3 h-3 ${currentTicker.color}`} />
            )}
            {currentTicker.icon === 'sparkles' && (
              <Sparkles className={`w-3 h-3 ${currentTicker.color} animate-pulse`} />
            )}
            {currentTicker.icon === 'clock' && (
              <Clock className={`w-3 h-3 ${currentTicker.color}`} />
            )}
            {currentTicker.icon === 'warning' && (
              <AlertCircle className={`w-3 h-3 ${currentTicker.color} animate-bounce`} />
            )}
            {currentTicker.icon === 'error' && (
              <Info className={`w-3 h-3 ${currentTicker.color}`} />
            )}
            <span className={`text-[11px] font-bold tracking-wide ${currentTicker.color}`}>
              {currentTicker.text}
            </span>
          </motion.div>
        </div>

        {/* Right Window Controls & Wallpaper Switcher */}
        <div className="flex items-center gap-3 text-slate-300">
          {/* Live Wallpaper Toggle Button */}
          <button
            onClick={() => {
              soundManager.playClickSound();
              setUseLiveWallpaper(prev => !prev);
            }}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase transition border flex items-center gap-1.5 cursor-pointer ${
              useLiveWallpaper 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-[0_0_12px_rgba(34,211,238,0.35)]'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Toggle Default Live Wallpaper / Scenic View"
          >
            <MonitorPlay className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">Raj Expo Live</span>
          </button>

          <button 
            onClick={() => soundManager.playClickSound()}
            className="hover:text-white transition p-1 cursor-pointer" 
            title="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => soundManager.playClickSound()}
            className="hover:text-white transition p-1 cursor-pointer" 
            title="Maximize"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => soundManager.playClickSound()}
            className="hover:text-red-400 transition p-1 cursor-pointer" 
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 4. MAIN WORKSPACE THREE-COLUMN LAYOUT (Unobstructed Free View) */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-6 overflow-hidden max-w-[1720px] mx-auto w-full">
        
        {/* LEFT COLUMN: Sidebar Navigation + Profile Card (3 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Frosted Glass Navigation Sidebar */}
          <nav className="bg-slate-900/40 hover:bg-slate-900/50 backdrop-blur-2xl border border-white/20 rounded-3xl p-3 flex flex-col gap-1 shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02, x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    soundManager.playClickSound();
                    item.action();
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/90 text-white shadow-[0_4px_16px_rgba(37,99,235,0.4)]'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                  <span className="truncate">{item.label}</span>
                </motion.button>
              );
            })}
          </nav>

          {/* Profile Card */}
          <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/20 rounded-3xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <EmptyImagePlaceholder
                  type="avatar"
                  alt="Raj Avatar"
                  className="w-11 h-11 rounded-full border border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                />
                <button 
                  onClick={() => onOpenApp('account_config')}
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-slate-900 shadow-sm hover:scale-110 transition cursor-pointer"
                  title="Configure Profile"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">Raj</h4>
                <p className="text-[10px] text-cyan-300 font-medium truncate">Boss Jonathan Raj // Lead</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                soundManager.playClickSound();
                onOpenApp('account_config');
              }}
              className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-[0_4px_14px_rgba(37,99,235,0.35)] flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>View Profile</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        {/* CENTER COLUMN: Greeting, Quick App Carousel, Split Activity & Tools Cards (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5 overflow-y-auto jarvis-scrollbar pr-1">
          {/* Welcome Header with animated Sun pop-up */}
          <div className="flex items-center gap-4 pt-1">
            <motion.div 
              whileHover={{ scale: 1.15, rotate: 15 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-full bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shadow-[0_0_25px_rgba(251,191,36,0.4)] shrink-0 cursor-pointer"
            >
              <Sun className="w-7 h-7 text-amber-300 animate-spin-slow" />
            </motion.div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                {greeting}
              </h2>
              <p className="text-xs text-white/80 font-medium drop-shadow-sm">
                Your AI workspace is ready. Let's get things done.
              </p>
            </div>
          </div>

          {/* Quick Launch App Carousel Row (8 colorful glass tiles with Pop-Up Animations) */}
          <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/20 rounded-3xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {quickAppTiles.map((app, idx) => {
                const Icon = app.icon;
                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.1, y: -4 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      soundManager.playClickSound();
                      app.action();
                    }}
                    className="flex flex-col items-center gap-2 group cursor-pointer text-center p-2 rounded-2xl hover:bg-white/10 transition-all"
                  >
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${app.color} p-0.5 shadow-md group-hover:shadow-[0_0_18px_rgba(255,255,255,0.5)] transition-all flex items-center justify-center text-white`}>
                      <Icon className="w-5 h-5 drop-shadow-sm" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-200 group-hover:text-white truncate max-w-[70px]">
                      {app.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Split Cards: Recent Activity & Quick Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Recent Activity */}
            <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/20 rounded-3xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white tracking-wide">Recent Activity</h3>
              </div>
              <div className="space-y-2.5 flex-1">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onOpenApp('people_db')}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-between text-xs transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-white truncate">Contact list synced</p>
                      <p className="text-[10px] text-slate-300 truncate">867 records encrypted</p>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap ml-2">2 hours ago</span>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onOpenApp('pdf_counter')}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-between text-xs transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <UploadCloud className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-white truncate">File uploaded</p>
                      <p className="text-[10px] text-slate-300 truncate">Documents batch processed</p>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap ml-2">4 hours ago</span>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onOpenApp('prompt_studio')}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-between text-xs transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      <FileCode className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-white truncate">Prompt template</p>
                      <p className="text-[10px] text-slate-300 truncate">AI Studio tokens tested</p>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap ml-2">5 hours ago</span>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onOpenApp('github_sync')}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-between text-xs transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <Database className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-white truncate">Database updated</p>
                      <p className="text-[10px] text-slate-300 truncate">Central records confirmed</p>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap ml-2">6 hours ago</span>
                </motion.div>
              </div>
            </div>

            {/* Card 2: Quick Tools */}
            <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/20 rounded-3xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-white tracking-wide">Quick Tools</h3>
              </div>
              <div className="space-y-2.5 flex-1">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onOpenNatashaChat}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-between text-xs transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-white truncate">Ask AI</p>
                      <p className="text-[10px] text-slate-300 truncate">Talk with Natasha ASI</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-2" />
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onOpenApp('github_sync')}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-between text-xs transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-white truncate">Sync All</p>
                      <p className="text-[10px] text-slate-300 truncate">Sync Central GitHub & Cloud</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-2" />
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onOpenApp('wallpaper_settings')}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-between text-xs transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                      <Settings className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-white truncate">Settings</p>
                      <p className="text-[10px] text-slate-300 truncate">Customize look, audio & live wallpapers</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-2" />
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Clock, Colombo Weather & Notification Hub (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col gap-4">
            {/* Clock Header */}
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 10 }}
                className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-sm shrink-0"
              >
                <Clock className="w-5 h-5" />
              </motion.div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight leading-none">
                  {colomboTime}
                </h3>
                <p className="text-[10px] font-semibold text-cyan-300 mt-1">
                  {colomboDate}
                </p>
              </div>
            </div>

            {/* Location & Colombo Weather with Pop-up Animation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-200 flex items-center gap-1">
                    <span>📍</span> Colombo, Sri Lanka
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-white tracking-tighter">28°C</span>
                    <div className="text-[10px] font-medium text-slate-300 leading-tight">
                      <p className="font-bold text-amber-300">Partly Cloudy</p>
                      <p>H: 31° L: 24°</p>
                    </div>
                  </div>
                </div>
                <motion.div
                  whileHover={{ scale: 1.25, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                  className="cursor-pointer"
                  onClick={() => soundManager.playClickSound()}
                >
                  <CloudSun className="w-10 h-10 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
                </motion.div>
              </div>

              {/* 4-Day Forecast Row */}
              <div className="grid grid-cols-4 gap-1 text-center bg-white/5 rounded-2xl p-2 border border-white/10 text-[9px] font-semibold text-slate-200">
                <motion.div whileHover={{ scale: 1.15 }} className="flex flex-col items-center cursor-pointer">
                  <span>Fri</span>
                  <CloudSun className="w-3.5 h-3.5 text-amber-400 my-1" />
                  <span>31°/24°</span>
                </motion.div>
                <motion.div whileHover={{ scale: 1.15 }} className="flex flex-col items-center cursor-pointer">
                  <span>Sat</span>
                  <CloudSun className="w-3.5 h-3.5 text-amber-400 my-1" />
                  <span>30°/24°</span>
                </motion.div>
                <motion.div whileHover={{ scale: 1.15 }} className="flex flex-col items-center cursor-pointer">
                  <span>Sun</span>
                  <Sun className="w-3.5 h-3.5 text-amber-300 my-1" />
                  <span>29°/24°</span>
                </motion.div>
                <motion.div whileHover={{ scale: 1.15 }} className="flex flex-col items-center cursor-pointer">
                  <span>Mon</span>
                  <CloudSun className="w-3.5 h-3.5 text-amber-400 my-1" />
                  <span>30°/24°</span>
                </motion.div>
              </div>
            </div>

            {/* Notification, Reminders & News Stack with Pop-Up Badges */}
            <div className="space-y-2 border-t border-white/10 pt-3">
              <motion.button
                whileHover={{ scale: 1.03, x: 2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  soundManager.playClickSound();
                  onOpenClockOverview();
                }}
                className="w-full p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-between text-xs transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-white">Notifications</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <motion.span 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.7)]"
                  >
                    3
                  </motion.span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, x: 2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  soundManager.playClickSound();
                  onOpenClockOverview();
                }}
                className="w-full p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-between text-xs transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-white">Reminders</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <motion.span 
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
                    className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.7)]"
                  >
                    2
                  </motion.span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, x: 2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  soundManager.playClickSound();
                  onOpenClockOverview();
                }}
                className="w-full p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-between text-xs transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-white">News Updates</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <motion.span 
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 3.5, delay: 1 }}
                    className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-[0_0_10px_rgba(37,99,235,0.7)]"
                  >
                    5
                  </motion.span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </motion.button>
            </div>

            {/* View Details Link */}
            <motion.button
              whileHover={{ scale: 1.04, x: 3 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                soundManager.playClickSound();
                onOpenClockOverview();
              }}
              className="mt-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition cursor-pointer group"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* 5. START MENU POPOVER (Opened when clicking the Start Button) */}
      <AnimatePresence>
        {isStartMenuOpen && (
          <motion.div
            ref={startMenuRef}
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-16 left-6 z-[10000] w-96 max-w-[92vw] bg-slate-950/90 backdrop-blur-3xl border-2 border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.4)] p-4 flex flex-col gap-3 font-sans text-white overflow-hidden"
          >
            {/* Header / Brand in Start Menu */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.7)] border border-red-400/50">
                  <span className="text-white font-black text-base">R</span>
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-wider text-white uppercase">
                    Raj Expo Digitals
                  </h3>
                  <p className="text-[10px] text-cyan-400 font-mono">
                    Mainframe Core OS v5.6
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsStartMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* MANDATORY REQUIREMENT 1: "Server external viewer" Button inside Start Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleOpenServerExternalViewer}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.5)] border border-cyan-300/40 flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
                  <ExternalLink className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-black tracking-wide">Server external viewer</div>
                  <div className="text-[9px] text-cyan-100/80 font-normal">Open App In New Tab (Full Screen)</div>
                </div>
              </div>
              <Maximize className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            </motion.button>

            {/* Quick Applications Grid */}
            <div className="mt-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-2">
                Server Applications
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setIsStartMenuOpen(false);
                    onOpenApp('server_hub');
                  }}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center gap-2 text-left transition cursor-pointer group"
                >
                  <Database className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">Server Hub</span>
                </button>

                <button
                  onClick={() => {
                    setIsStartMenuOpen(false);
                    onOpenApp('people_db');
                  }}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center gap-2 text-left transition cursor-pointer group"
                >
                  <Users className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">Contacts DB</span>
                </button>

                <button
                  onClick={() => {
                    setIsStartMenuOpen(false);
                    onOpenApp('github_sync');
                  }}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center gap-2 text-left transition cursor-pointer group"
                >
                  <RefreshCw className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">GitHub Sync</span>
                </button>

                <button
                  onClick={() => {
                    setIsStartMenuOpen(false);
                    onOpenApp('pdf_counter');
                  }}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center gap-2 text-left transition cursor-pointer group"
                >
                  <UploadCloud className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">PDF & Calculator</span>
                </button>

                <button
                  onClick={() => {
                    setIsStartMenuOpen(false);
                    onOpenApp('prompt_studio');
                  }}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center gap-2 text-left transition cursor-pointer group"
                >
                  <FileCode className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">Prompt Studio</span>
                </button>

                <button
                  onClick={() => {
                    setIsStartMenuOpen(false);
                    onOpenApp('wallpaper_settings');
                  }}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center gap-2 text-left transition cursor-pointer group"
                >
                  <Settings className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">Wallpaper Engine</span>
                </button>
              </div>
            </div>

            {/* Footer with Lock Screen & Profile Action */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono text-slate-300">Jonathan Ganeshraj</span>
              </div>
              <button
                onClick={() => {
                  setIsStartMenuOpen(false);
                  onLockScreen();
                }}
                className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-[10px] font-bold uppercase transition flex items-center gap-1 cursor-pointer"
              >
                <Lock className="w-3 h-3" />
                <span>Lock</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. BOTTOM TASKBAR (Start Button "Raj Expo Digitals" with Red R Logo) */}
      <footer className="relative z-30 w-full bg-slate-950/85 backdrop-blur-2xl border-t border-white/10 px-6 py-2.5 flex items-center justify-between shadow-2xl">
        {/* Left: Red 'R' Logo + Raj Expo Digitals ^ (Start Button) */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              soundManager.playClickSound();
              setIsStartMenuOpen(prev => !prev);
            }}
            className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl transition border shadow-md cursor-pointer ${
              isStartMenuOpen 
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-white border-slate-700/60'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-xs">R</span>
            </div>
            <span className="text-xs font-bold tracking-tight">Raj Expo Digitals</span>
            <span className={`text-[10px] transition-transform ${isStartMenuOpen ? 'rotate-180 text-white' : 'text-slate-400'}`}>^</span>
          </motion.button>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-sm mx-6">
          <div className="w-full relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anything..."
              className="w-full pl-9 pr-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-[11px] text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 transition shadow-inner"
            />
          </div>
        </div>

        {/* Right: Quick Controls & Live Colombo Clock (Touchpad completely removed) */}
        <div className="flex items-center gap-4 text-slate-300">
          {/* Volume Control Icon */}
          <button
            onClick={() => soundManager.playClickSound()}
            className="hover:text-white transition p-1 cursor-pointer"
            title="Volume / Audio"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Lock Screen Icon */}
          <button
            onClick={() => {
              soundManager.playLockSound();
              onLockScreen();
            }}
            className="hover:text-amber-400 transition p-1 cursor-pointer"
            title="Lock Workspace"
          >
            <Lock className="w-4 h-4" />
          </button>

          {/* Clock & Date */}
          <button
            onClick={() => {
              soundManager.playClickSound();
              onOpenClockOverview();
            }}
            className="flex flex-col items-end leading-tight text-right hover:text-cyan-300 transition cursor-pointer"
            title="Open Daily Overview Clock & News Hub"
          >
            <span className="text-xs font-bold text-white">{colomboTime}</span>
            <span className="text-[10px] text-slate-400 font-mono">{colomboShortDate}</span>
          </button>
        </div>
      </footer>
    </motion.div>
  );
};

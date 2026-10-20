import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, Sparkles, Upload, Cloud, RefreshCw, Check, AlertCircle, 
  Eye, Save, Zap, ShieldCheck, X, Sliders, Volume2, VolumeX, 
  RotateCcw, Film, Image as ImageIcon, ExternalLink, HardDrive
} from 'lucide-react';
import { 
  COSMIC_WALLPAPERS, 
  WallpaperItem, 
  SystemSettingsState, 
  DEFAULT_SETTINGS,
  getSyncedDefaultSettings, 
  getPendingSettings, 
  savePendingSettings, 
  commitSyncedDefault, 
  dualSyncSettings, 
  uploadCustomWallpaperToCloudinary, 
  getSyncInfo, 
  SyncInfo,
  PipelineStage
} from '../services/wallpaperSettingsService';
import { soundManager } from '../services/soundEffects';
import { logActivity } from '../services/activityLogger';

interface WallpaperSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: SystemSettingsState;
  onPreviewSettings: (settings: SystemSettingsState) => void;
  onApplySettings: (settings: SystemSettingsState) => void;
}

export const WallpaperSettingsModal: React.FC<WallpaperSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onPreviewSettings,
  onApplySettings
}) => {
  const [activeTab, setActiveTab] = useState<'wallpapers' | 'appearance' | 'sync_history'>('wallpapers');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Working draft state in modal
  const [draftSettings, setDraftSettings] = useState<SystemSettingsState>(currentSettings);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('APPLIED');
  const [syncInfo, setSyncInfo] = useState<SyncInfo>(getSyncInfo());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');

  // Device upload state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setDraftSettings(currentSettings);
      setSyncInfo(getSyncInfo());
      const pending = getPendingSettings();
      if (pending) {
        setPipelineStage('SAVED_PENDING');
      } else {
        setPipelineStage('APPLIED');
      }
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All (15 Cosmic)' },
    { id: 'nebula', label: 'Deep Nebulae' },
    { id: 'aurora', label: 'Auroras' },
    { id: 'celestial', label: 'Celestial' },
    { id: 'cosmic', label: 'Cosmic & Solar' },
    { id: 'cyber', label: 'Cyber & Warp' }
  ];

  const themes = [
    { id: 'cyan', name: 'Cyberpunk Cyan', color: 'bg-cyan-500', border: 'border-cyan-400' },
    { id: 'emerald', name: 'Matrix Emerald', color: 'bg-emerald-500', border: 'border-emerald-400' },
    { id: 'purple', name: 'Royal Neon Purple', color: 'bg-purple-500', border: 'border-purple-400' },
    { id: 'amber', name: 'Amber Gold Cyber', color: 'bg-amber-500', border: 'border-amber-400' },
    { id: 'red', name: 'Crimson Protocol', color: 'bg-rose-500', border: 'border-rose-400' },
    { id: 'titanium', name: 'Midnight Titanium', color: 'bg-slate-400', border: 'border-slate-300' }
  ];

  const filteredWallpapers = categoryFilter === 'all'
    ? COSMIC_WALLPAPERS
    : COSMIC_WALLPAPERS.filter(w => w.category === categoryFilter);

  // 1. Preview Handler (Instant live viewport update without saving)
  const handlePreview = (wallpaperId: string) => {
    soundManager.playClickSound();
    const updated = {
      ...draftSettings,
      activeWallpaperId: wallpaperId,
      customWallpaperUrl: undefined // clear custom if picking preset
    };
    setDraftSettings(updated);
    setPipelineStage('PREVIEW');
    onPreviewSettings(updated);
  };

  // 2. Apply Handler (Bind to current session)
  const handleApply = () => {
    soundManager.playAccessGrantedSound();
    onApplySettings(draftSettings);
    setPipelineStage('APPLIED');
    logActivity('THEME_ANIM', 'Applied Wallpaper & Settings to Session', `Wallpaper: ${draftSettings.activeWallpaperId}`);
  };

  // 3. Save (Pending) Handler (Save locally to pending buffer, awaiting sync)
  const handleSavePending = () => {
    soundManager.playClickSound();
    savePendingSettings(draftSettings);
    onApplySettings(draftSettings);
    setPipelineStage('SAVED_PENDING');
    setSyncStatusMsg('Saved locally in Pending Sync state. Click "Dual-Sync Settings" to make this your permanent Synced Default.');
  };

  // 4. Dual-Sync Handler (Commits to GitHub & Cloudinary and locks as Synced Default)
  const handleDualSync = async () => {
    setIsSyncing(true);
    setPipelineStage('SYNCING');
    setSyncStatusMsg('Syncing settings to GitHub (iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6) and Cloudinary...');
    soundManager.playClickSound();

    try {
      const res = await dualSyncSettings(draftSettings);
      if (res.success) {
        setPipelineStage('SYNCED_DEFAULT');
        setSyncInfo(getSyncInfo());
        setSyncStatusMsg(`Successfully synced! This configuration is now your permanent Synced Default for all future app sessions.`);
        onApplySettings(draftSettings);
      } else {
        setPipelineStage('SAVED_PENDING');
        setSyncStatusMsg(`Sync error: ${res.error}. Preserved previous Synced Default.`);
      }
    } catch (err: any) {
      setPipelineStage('SAVED_PENDING');
      setSyncStatusMsg(`Sync failure: ${err.message || 'Interrupted'}. Previous Synced Default preserved.`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Revert to Last Synced Default
  const handleRevertToSyncedDefault = () => {
    soundManager.playClickSound();
    const synced = getSyncedDefaultSettings();
    setDraftSettings(synced);
    onApplySettings(synced);
    setPipelineStage('SYNCED_DEFAULT');
    setSyncStatusMsg('Reverted to last verified Synced Default settings.');
    logActivity('SERVER_TASK', 'Reverted Settings', 'Restored last known Synced Default settings.');
  };

  // Custom Wallpaper Upload to Cloudinary
  const handleDeviceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');
    soundManager.playClickSound();

    try {
      const res = await uploadCustomWallpaperToCloudinary(file, (percent) => {
        setUploadProgress(percent);
      });

      const updated: SystemSettingsState = {
        ...draftSettings,
        customWallpaperUrl: res.url,
        customWallpaperType: res.resourceType
      };

      setDraftSettings(updated);
      onPreviewSettings(updated);
      setPipelineStage('PREVIEW');
      soundManager.playAccessGrantedSound();
      logActivity('FILE_UPLOAD', 'Uploaded Custom Wallpaper to Cloudinary', `Uploaded ${file.name} to Cloudinary.`);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Upload to Cloudinary failed.');
      soundManager.playWrongInputSound();
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-5xl max-h-[92vh] bg-slate-950/95 border-2 border-cyan-400/80 rounded-3xl shadow-[0_0_60px_rgba(34,211,238,0.4)] flex flex-col overflow-hidden font-mono text-slate-200"
      >
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-cyan-500/30 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                  WALLPAPER & SETTINGS STUDIO
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold">
                  BOSS 916
                </span>
              </div>
              <p className="text-[11px] text-cyan-400/80">
                Preview → Apply → Save (Pending) → Sync → Synced Default Pipeline
              </p>
            </div>
          </div>

          <button
            onClick={() => { soundManager.playClickSound(); onClose(); }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Close Settings Studio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-STAGE PIPELINE INDICATOR BAR */}
        <div className="px-5 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
              LIFECYCLE PIPELINE:
            </span>

            {/* Stage 1: Preview */}
            <span className={`px-2.5 py-1 rounded-lg border font-bold text-[10px] uppercase flex items-center gap-1 ${
              pipelineStage === 'PREVIEW'
                ? 'bg-blue-500/30 text-blue-300 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}>
              <Eye className="w-3 h-3" />
              1. Preview
            </span>

            <span className="text-slate-600">→</span>

            {/* Stage 2: Apply */}
            <span className={`px-2.5 py-1 rounded-lg border font-bold text-[10px] uppercase flex items-center gap-1 ${
              pipelineStage === 'APPLIED'
                ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}>
              <Check className="w-3 h-3" />
              2. Apply
            </span>

            <span className="text-slate-600">→</span>

            {/* Stage 3: Save (Pending) */}
            <span className={`px-2.5 py-1 rounded-lg border font-bold text-[10px] uppercase flex items-center gap-1 ${
              pipelineStage === 'SAVED_PENDING'
                ? 'bg-amber-500/30 text-amber-300 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}>
              <Save className="w-3 h-3" />
              3. Save (Pending)
            </span>

            <span className="text-slate-600">→</span>

            {/* Stage 4: Sync */}
            <span className={`px-2.5 py-1 rounded-lg border font-bold text-[10px] uppercase flex items-center gap-1 ${
              pipelineStage === 'SYNCING'
                ? 'bg-purple-500/30 text-purple-300 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}>
              <Zap className="w-3 h-3" />
              4. Dual-Sync
            </span>

            <span className="text-slate-600">→</span>

            {/* Stage 5: Synced Default */}
            <span className={`px-2.5 py-1 rounded-lg border font-bold text-[10px] uppercase flex items-center gap-1 ${
              pipelineStage === 'SYNCED_DEFAULT'
                ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}>
              <ShieldCheck className="w-3 h-3" />
              5. Synced Default
            </span>
          </div>

          {/* Quick Revert to Synced Default */}
          <button
            onClick={handleRevertToSyncedDefault}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer"
            title="Discard unsynced changes and restore last Synced Default"
          >
            <RotateCcw className="w-3 h-3 text-cyan-400" />
            <span>Revert to Synced Default</span>
          </button>
        </div>

        {/* Sync Status Banner / Feedback */}
        {syncStatusMsg && (
          <div className="px-5 py-2 bg-cyan-950/50 border-b border-cyan-500/30 text-[11px] flex items-center justify-between text-cyan-300">
            <span className="truncate">{syncStatusMsg}</span>
            <button 
              onClick={() => setSyncStatusMsg('')} 
              className="text-cyan-400 hover:text-white shrink-0 ml-2 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('wallpapers')}
            className={`px-4 py-2 font-bold uppercase rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-t-2 border-x-2 ${
              activeTab === 'wallpapers'
                ? 'bg-slate-900 text-cyan-300 border-cyan-400/80 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>15 Cosmic Animated Wallpapers & Device Upload</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-4 py-2 font-bold uppercase rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-t-2 border-x-2 ${
              activeTab === 'appearance'
                ? 'bg-slate-900 text-cyan-300 border-cyan-400/80 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customizable Settings (Theme, Speed, Density, Audio)</span>
          </button>
        </div>

        {/* Main Body Content */}
        <div className="flex-1 overflow-y-auto jarvis-scrollbar p-5 space-y-6">
          {activeTab === 'wallpapers' && (
            <>
              {/* Device Upload Section (Cloudinary) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-purple-950/40 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shrink-0">
                    <Cloud className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Upload Custom Wallpaper from Device
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Uploaded directly to Cloudinary cloud storage (<span className="text-cyan-400">uhysx6is / unsigned</span>). Supports image (JPG, PNG, WebP) or video (MP4, WebM).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <label className="flex-1 sm:flex-initial px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>{isUploading ? `Uploading (${uploadProgress}%)...` : 'Choose Image / Video'}</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleDeviceFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 jarvis-scrollbar">
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCategoryFilter(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] uppercase font-bold transition-all cursor-pointer whitespace-nowrap border ${
                      categoryFilter === c.id
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Wallpapers 3x Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredWallpapers.map(wp => {
                  const isSelected = draftSettings.activeWallpaperId === wp.id && !draftSettings.customWallpaperUrl;

                  return (
                    <div
                      key={wp.id}
                      onClick={() => handlePreview(wp.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-900 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.35)] scale-[1.02]'
                          : 'bg-slate-950/70 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/60'
                      }`}
                    >
                      {/* Gradient Backdrop Card */}
                      <div className={`h-24 rounded-xl bg-gradient-to-br ${wp.gradientPreview} relative overflow-hidden border border-white/10 mb-2.5 flex items-center justify-center`}>
                        <div className="absolute inset-0 bg-black/20" />
                        
                        {/* Interactive Sparkle preview */}
                        <div className="relative z-10 flex items-center gap-2">
                          <span 
                            className="w-3.5 h-3.5 rounded-full shadow-lg animate-pulse" 
                            style={{ backgroundColor: wp.primaryColor }} 
                          />
                          <span 
                            className="w-2.5 h-2.5 rounded-full shadow-lg" 
                            style={{ backgroundColor: wp.secondaryColor }} 
                          />
                          <span 
                            className="w-2 h-2 rounded-full shadow-lg" 
                            style={{ backgroundColor: wp.accentColor }} 
                          />
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            <span>Active</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors">
                            {wp.name}
                          </h4>
                          <span className="text-[8px] uppercase px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                            {wp.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          {wp.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[9px] text-cyan-400/80 group-hover:text-cyan-300 font-mono">
                          Click to Preview
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(wp.id);
                            handleApply();
                          }}
                          className="px-2 py-1 bg-slate-900 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-lg text-[9px] font-bold uppercase transition-colors"
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* UI Theme Palettes */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Palette className="w-4 h-4 text-cyan-400" />
                    <span>Responsive UI Theme Palettes</span>
                  </h3>
                  <span className="text-[10px] text-cyan-400 font-bold uppercase">
                    Active: {draftSettings.themeId.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {themes.map(t => {
                    const isSelected = draftSettings.themeId === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          soundManager.playClickSound();
                          const updated = { ...draftSettings, themeId: t.id as any };
                          setDraftSettings(updated);
                          setPipelineStage('PREVIEW');
                          onPreviewSettings(updated);
                        }}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-3.5 h-3.5 rounded-full ${t.color}`} />
                          <span className="text-xs font-bold text-slate-200">{t.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Particle Engine Sliders */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Animated Canvas Particle Engine Controls</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Particle Speed */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Particle Animation Speed</span>
                      <span className="text-cyan-400 font-bold">{draftSettings.particleSpeed.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="3.0"
                      step="0.1"
                      value={draftSettings.particleSpeed}
                      onChange={(e) => {
                        const updated = { ...draftSettings, particleSpeed: parseFloat(e.target.value) };
                        setDraftSettings(updated);
                        setPipelineStage('PREVIEW');
                        onPreviewSettings(updated);
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  {/* Particle Density */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Particle Density</span>
                      <span className="text-cyan-400 font-bold">{draftSettings.particleDensity} nodes</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="180"
                      step="10"
                      value={draftSettings.particleDensity}
                      onChange={(e) => {
                        const updated = { ...draftSettings, particleDensity: parseInt(e.target.value, 10) };
                        setDraftSettings(updated);
                        setPipelineStage('PREVIEW');
                        onPreviewSettings(updated);
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Visual Effects & Audio Toggles */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Holographic HUD Overlays & Audio Controls</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Scanlines Toggle */}
                  <button
                    onClick={() => {
                      const updated = { ...draftSettings, showScanlines: !draftSettings.showScanlines };
                      setDraftSettings(updated);
                      setPipelineStage('PREVIEW');
                      onPreviewSettings(updated);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all ${
                      draftSettings.showScanlines 
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' 
                        : 'bg-slate-950/80 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">HUD Scanlines</span>
                      <span className="text-[9px] text-slate-400">CRT monitor scanlines</span>
                    </div>
                    <span className="text-xs font-black">{draftSettings.showScanlines ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* Vignette Toggle */}
                  <button
                    onClick={() => {
                      const updated = { ...draftSettings, showHudVignette: !draftSettings.showHudVignette };
                      setDraftSettings(updated);
                      setPipelineStage('PREVIEW');
                      onPreviewSettings(updated);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all ${
                      draftSettings.showHudVignette 
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' 
                        : 'bg-slate-950/80 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">Corner Vignette</span>
                      <span className="text-[9px] text-slate-400">Deep cinematic edges</span>
                    </div>
                    <span className="text-xs font-black">{draftSettings.showHudVignette ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* Sound Effects Toggle */}
                  <button
                    onClick={() => {
                      const updated = { ...draftSettings, audioMuted: !draftSettings.audioMuted };
                      setDraftSettings(updated);
                      soundManager.setMuted(updated.audioMuted);
                      setPipelineStage('PREVIEW');
                      onPreviewSettings(updated);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all ${
                      !draftSettings.audioMuted 
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200' 
                        : 'bg-slate-950/80 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {!draftSettings.audioMuted ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
                      <div>
                        <span className="text-xs font-bold block">Sound Effects</span>
                        <span className="text-[9px] text-slate-400">{draftSettings.audioMuted ? 'Muted' : 'Enabled'}</span>
                      </div>
                    </div>
                    <span className="text-xs font-black">{!draftSettings.audioMuted ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Watermark / Header Customization */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <label className="text-xs font-black text-white uppercase tracking-wider block">
                  Desktop Watermark Text
                </label>
                <input
                  type="text"
                  value={draftSettings.watermarkText}
                  onChange={(e) => {
                    const updated = { ...draftSettings, watermarkText: e.target.value };
                    setDraftSettings(updated);
                    setPipelineStage('PREVIEW');
                    onPreviewSettings(updated);
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                  placeholder="OS Tier Elite // Virtual Intelligence: NATASHA"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar (Apply, Save Pending, Dual-Sync) */}
        <div className="px-5 py-4 border-t border-cyan-500/30 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>
              Status: <strong className="text-cyan-300 uppercase">{pipelineStage.replace('_', ' ')}</strong>
            </span>
            {syncInfo.lastSyncedTimestamp && (
              <span className="hidden sm:inline text-slate-500">
                • Last Synced: {new Date(syncInfo.lastSyncedTimestamp).toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. Apply to Session */}
            <button
              onClick={handleApply}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-cyan-400" />
              <span>Apply to Session</span>
            </button>

            {/* 2. Save (Pending Sync) */}
            <button
              onClick={handleSavePending}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Save in local pending state (will require sync to become default)"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Save (Pending)</span>
            </button>

            {/* 3. Dual-Sync Settings (Make Synced Default) */}
            <button
              onClick={handleDualSync}
              disabled={isSyncing}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-60"
            >
              <Zap className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : 'fill-current'}`} />
              <span>{isSyncing ? 'Syncing...' : 'Dual-Sync (Make Default)'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

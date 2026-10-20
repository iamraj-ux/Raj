import React, { useState, useEffect } from 'react';
import { 
  FolderGit2, 
  ExternalLink, 
  Zap, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Settings2, 
  Download, 
  Database,
  GitBranch,
  ShieldCheck,
  Activity,
  Upload,
  FolderArchive,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { 
  getGitHubConfig, 
  saveGitHubConfig, 
  syncToGitHub, 
  pullFromGitHub, 
  buildDatabasePayload,
  GitHubDatabasePayload
} from '../services/githubDatabaseService';
import { DocFileData } from '../types';
import { MediaUploadWithDescriptionModal } from './MediaUploadWithDescriptionModal';
import { RajExpoMediaModal } from './RajExpoMediaModal';
import { getStoredMediaItems, RajExpoMediaItem } from '../services/mediaStorageService';

interface GitHubDatabasePanelProps {
  files: DocFileData[];
  settings: {
    singleSidedCost: number;
    doubleSidedCost: number;
    separateOrientations: boolean;
    pagesPerSide: number;
  };
  totals?: {
    totalCount: number;
    totalSheets: number;
    totalSingleSidedPrice: number;
    totalDoubleSidedPrice: number;
  };
  onOpenSettingsModal: () => void;
  onRestoreState?: (payload: GitHubDatabasePayload) => void;
}

export const GitHubDatabasePanel: React.FC<GitHubDatabasePanelProps> = ({
  files,
  settings,
  totals,
  onOpenSettingsModal,
  onRestoreState
}) => {
  const [config, setConfig] = useState(getGitHubConfig());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [panelMessage, setPanelMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  // Media Files & Upload Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaCount, setMediaCount] = useState(0);

  useEffect(() => {
    const items = getStoredMediaItems();
    setMediaCount(items.length);
  }, [isUploadModalOpen, isMediaModalOpen]);

  const handleOneTapSync = async () => {
    setIsSyncing(true);
    setPanelMessage(null);
    try {
      const payload = buildDatabasePayload(files, settings, totals);
      const result = await syncToGitHub(payload);
      const updated = getGitHubConfig();
      setConfig(updated);

      if (result.success) {
        setPanelMessage({
          type: 'success',
          text: `Synced to ${config.owner}/${config.repo}! (${result.sha?.substring(0, 7) || 'committed'})`
        });
      } else {
        setPanelMessage({
          type: result.backupOnly ? 'info' : 'error',
          text: result.message
        });
      }
    } catch (err: any) {
      setPanelMessage({
        type: 'error',
        text: `Sync error: ${err.message || err}`
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setPanelMessage(null), 6000);
    }
  };

  const handlePullData = async () => {
    setIsPulling(true);
    setPanelMessage(null);
    try {
      const result = await pullFromGitHub();
      if (result.success && result.data) {
        if (onRestoreState) {
          onRestoreState(result.data);
        }
        setPanelMessage({
          type: 'success',
          text: `Loaded database snapshot from ${config.owner}/${config.repo} (${result.data.filesCatalog?.length || 0} files).`
        });
      } else {
        setPanelMessage({
          type: 'error',
          text: result.message
        });
      }
    } catch (err: any) {
      setPanelMessage({
        type: 'error',
        text: `Pull failed: ${err.message || err}`
      });
    } finally {
      setIsPulling(false);
      setTimeout(() => setPanelMessage(null), 6000);
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    const updated = saveGitHubConfig({ autoSyncEnabled: enabled });
    setConfig(updated);
    setPanelMessage({
      type: 'info',
      text: enabled ? `Auto-sync activated (every ${updated.autoSyncIntervalSeconds}s).` : 'Auto-sync paused.'
    });
    setTimeout(() => setPanelMessage(null), 4000);
  };

  const repoUrl = `https://github.com/${config.owner}/${config.repo}`;

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-cyan-500/30 backdrop-blur-xl shadow-[0_0_50px_rgba(34,211,238,0.08)] relative overflow-hidden space-y-6 group">
      
      {/* Background Accent Gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 relative z-10 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-950/80 border border-cyan-500/40 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            <FolderGit2 className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                GitHub Central Database Storage
              </h3>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                v1.0 AUTO-SYNC
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span>Repository:</span>
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-300 hover:text-cyan-200 underline flex items-center gap-1 font-bold"
              >
                {config.owner}/{config.repo}
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenSettingsModal}
            className="px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            title="Configure token, intervals, and repo settings"
          >
            <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Settings</span>
          </button>

          {/* Button 2: Upload all formats to GitHub */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            id="raj-expo-upload-all-formats-btn"
            className="px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 rounded-xl flex items-center gap-2 shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-cyan-300/40"
            title="Upload all format images, PDF, video, audio, DOCX, Excel, HTML, and all code files to iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6"
          >
            <Upload className="w-4 h-4 text-slate-950" />
            <span>Upload All Format Files</span>
          </button>

          {/* Next to button 2: Open "Raj expo media files" */}
          <button
            onClick={() => setIsMediaModalOpen(true)}
            id="raj-expo-open-media-files-btn"
            className="px-4 py-2.5 text-xs font-black uppercase tracking-wider text-cyan-300 bg-slate-950 hover:bg-slate-900 border-2 border-cyan-400/60 hover:border-cyan-300 rounded-xl flex items-center gap-2 shadow-[0_0_25px_rgba(34,211,238,0.2)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Open 'Raj expo media files' preview console - grid/list thumbnail view, full screen, new tab viewer, timestamps and Natasha reminders"
          >
            <FolderArchive className="w-4 h-4 text-cyan-400" />
            <span>Open "Raj expo media files"</span>
            {mediaCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                {mediaCount}
              </span>
            )}
          </button>

          <button
            onClick={handleOneTapSync}
            disabled={isSyncing}
            className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Push database state to GitHub iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6"
          >
            <Zap className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'One-Tap Sync'}</span>
          </button>
        </div>
      </div>

      {/* Notification Toast Message */}
      {panelMessage && (
        <div className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs font-mono transition-all animate-fadeIn relative z-10 ${
          panelMessage.type === 'success'
            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
            : panelMessage.type === 'error'
            ? 'bg-red-950/60 border-red-500/50 text-red-300'
            : 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
        }`}>
          {panelMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : panelMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          )}
          <span className="flex-1">{panelMessage.text}</span>
        </div>
      )}

      {/* Controls & Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        
        {/* Metric 1: One-Tap Push */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" /> Manual Sync
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/20">
              One-Tap
            </span>
          </div>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            Commits active queue ({files.length} documents) and knowledge graph nodes to <span className="font-mono text-cyan-300">{config.filePath}</span>.
          </p>
          <button
            onClick={handleOneTapSync}
            disabled={isSyncing}
            className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Pushing Data...' : '⚡ Sync Now'}
          </button>
        </div>

        {/* Metric 2: Auto-Sync Engine */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> Auto-Sync Engine
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold uppercase ${
              config.autoSyncEnabled 
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {config.autoSyncEnabled ? `ACTIVE (${config.autoSyncIntervalSeconds}s)` : 'PAUSED'}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            Continuously commits state changes to <span className="font-mono text-emerald-300">iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6</span> in the background.
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-mono text-slate-400">Status:</span>
            <button
              onClick={() => handleToggleAutoSync(!config.autoSyncEnabled)}
              className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                config.autoSyncEnabled
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {config.autoSyncEnabled ? 'Pause Auto-Sync' : 'Enable Auto-Sync'}
            </button>
          </div>
        </div>

        {/* Metric 3: Pull & History */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-purple-400" /> Remote Ingestion
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Branch: {config.branch}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 space-y-1">
            <div>Last Sync: <span className="text-white font-bold">{config.lastSyncTime || 'Pending'}</span></div>
            {config.lastCommitSha && (
              <div>Commit SHA: <span className="text-cyan-300 font-bold">{config.lastCommitSha}</span></div>
            )}
          </div>
          <button
            onClick={handlePullData}
            disabled={isPulling}
            className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
            {isPulling ? 'Pulling Data...' : '📥 Pull from GitHub'}
          </button>
        </div>

      </div>

      {/* Footer Info / Direct Link */}
      <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 relative z-10 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Storage Target: <span className="text-slate-300 font-bold">https://github.com/iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6</span></span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
          >
            Visit Central Repository <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Universal Media Upload with Description Modal */}
      <MediaUploadWithDescriptionModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={() => {
          const updated = getStoredMediaItems();
          setMediaCount(updated.length);
        }}
        onOpenMediaGallery={() => {
          setIsUploadModalOpen(false);
          setIsMediaModalOpen(true);
        }}
      />

      {/* Raj Expo Media Files Viewer Modal */}
      <RajExpoMediaModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onOpenUploadModal={() => {
          setIsMediaModalOpen(false);
          setIsUploadModalOpen(true);
        }}
      />

    </div>
  );
};

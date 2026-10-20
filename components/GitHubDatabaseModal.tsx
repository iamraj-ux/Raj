import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  GitCommit, 
  ExternalLink, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Key, 
  Database, 
  Eye, 
  EyeOff, 
  Zap, 
  Download, 
  Upload, 
  Clock, 
  Layers, 
  FileText, 
  Copy,
  FolderGit2,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { DraggableResizableWindow } from './DraggableResizableWindow';
import { 
  getGitHubConfig, 
  saveGitHubConfig, 
  syncToGitHub, 
  pullFromGitHub, 
  buildDatabasePayload, 
  GitHubDatabasePayload, 
  GitHubSyncConfig 
} from '../services/githubDatabaseService';
import { DocFileData } from '../types';

interface GitHubDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  onRestoreState?: (payload: GitHubDatabasePayload) => void;
}

export const GitHubDatabaseModal: React.FC<GitHubDatabaseModalProps> = ({
  isOpen,
  onClose,
  files,
  settings,
  totals,
  onRestoreState
}) => {
  const [config, setConfig] = useState<GitHubSyncConfig>(getGitHubConfig());
  const [tokenInput, setTokenInput] = useState<string>(config.personalAccessToken || '');
  const [showToken, setShowToken] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'sync' | 'config' | 'preview'>('sync');

  useEffect(() => {
    if (isOpen) {
      const current = getGitHubConfig();
      setConfig(current);
      setTokenInput(current.personalAccessToken || '');
      setStatusMsg(null);
    }
  }, [isOpen]);

  const handleSaveToken = () => {
    const updated = saveGitHubConfig({ personalAccessToken: tokenInput.trim() });
    setConfig(updated);
    setStatusMsg({
      type: 'success',
      text: 'Personal Access Token saved securely in local storage.'
    });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleOneTapSync = async () => {
    setIsSyncing(true);
    setStatusMsg(null);
    try {
      const payload = buildDatabasePayload(files, settings, totals);
      const result = await syncToGitHub(payload);
      const updatedConfig = getGitHubConfig();
      setConfig(updatedConfig);

      if (result.success) {
        setStatusMsg({
          type: 'success',
          text: result.message
        });
      } else {
        setStatusMsg({
          type: result.backupOnly ? 'info' : 'error',
          text: result.message
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `Sync operation failed: ${err.message || err}`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromGitHub = async () => {
    setIsPulling(true);
    setStatusMsg(null);
    try {
      const result = await pullFromGitHub();
      if (result.success && result.data) {
        if (onRestoreState) {
          onRestoreState(result.data);
        }
        setStatusMsg({
          type: 'success',
          text: `Retrieved database snapshot (${result.data.filesCatalog?.length || 0} files, ${result.data.knowledgeGraph?.entitiesCount || 0} entities). App state updated!`
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: result.message
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `Pull failed: ${err.message || err}`
      });
    } finally {
      setIsPulling(false);
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    const updated = saveGitHubConfig({ autoSyncEnabled: enabled });
    setConfig(updated);
    setStatusMsg({
      type: 'info',
      text: enabled ? `Auto-sync activated (every ${updated.autoSyncIntervalSeconds}s).` : 'Auto-sync deactivated.'
    });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleIntervalChange = (seconds: number) => {
    const updated = saveGitHubConfig({ autoSyncIntervalSeconds: seconds });
    setConfig(updated);
  };

  const currentPayload = buildDatabasePayload(files, settings, totals);
  const jsonPreview = JSON.stringify(currentPayload, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonPreview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const repoUrl = `https://github.com/${config.owner}/${config.repo}`;

  return (
    <DraggableResizableWindow
      isOpen={isOpen}
      onClose={onClose}
      title="RAJ EXPO CENTRAL // GITHUB DATABASE STORAGE"
      subtitle={`Repository: ${config.owner}/${config.repo} // Auto & One-Tap Sync Engine`}
      icon={<FolderGit2 className="w-5 h-5 text-cyan-400" />}
      initialWidth={780}
      initialHeight={620}
      zIndex={9999}
    >
      <div className="p-4 sm:p-6 space-y-6 font-sans text-slate-200">
        
        {/* Top Header Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-cyan-950/40 to-slate-900/90 border border-cyan-500/40 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">Target Database:</span>
              <a 
                href={repoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-mono font-bold text-white hover:text-cyan-300 underline flex items-center gap-1.5 transition-colors"
              >
                {config.owner}/{config.repo}
                <ExternalLink className="w-3 h-3 text-cyan-400" />
              </a>
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              Branch: <span className="text-cyan-300 font-bold">{config.branch}</span> // Path: <span className="text-slate-300">{config.filePath}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-[10px] font-bold font-mono uppercase bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-all"
            >
              Open Repo
              <ExternalLink className="w-3 h-3" />
            </a>
            
            <button
              onClick={handleOneTapSync}
              disabled={isSyncing}
              className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.4)] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Zap className={`w-4 h-4 fill-slate-950 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'One-Tap Sync'}
            </button>
          </div>
        </div>

        {/* Status Message Banner */}
        {statusMsg && (
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-mono transition-all ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' 
              : statusMsg.type === 'error'
              ? 'bg-red-950/60 border-red-500/50 text-red-300'
              : 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
          }`}>
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : statusMsg.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 leading-relaxed">
              {statusMsg.text}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-2 px-3 text-xs font-black uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'sync'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Sync & Automation
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2 px-3 text-xs font-black uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'config'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Authentication & Repo
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-2 px-3 text-xs font-black uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Database Payload ({files.length} Docs)
          </button>
        </div>

        {/* TAB 1: SYNC & AUTOMATION */}
        {activeTab === 'sync' && (
          <div className="space-y-6">
            
            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Manual Push Box */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Push Snapshot
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    One-Tap
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Write current documents catalog, pricing matrices, knowledge graph nodes, and activity audit logs directly to GitHub.
                </p>
                <button
                  onClick={handleOneTapSync}
                  disabled={isSyncing}
                  className="w-full py-2.5 px-4 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-cyan-200 border border-cyan-500/50 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Synchronizing with GitHub...' : 'Trigger Immediate Sync'}
                </button>
              </div>

              {/* Manual Pull Box */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <Download className="w-4 h-4" /> Pull Remote DB
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    Fetch
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Retrieve the latest database state stored on <span className="font-mono text-emerald-300">iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6</span> and hydrate local queues.
                </p>
                <button
                  onClick={handlePullFromGitHub}
                  disabled={isPulling}
                  className="w-full py-2.5 px-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/50 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
                  {isPulling ? 'Retrieving from GitHub...' : 'Pull & Load State'}
                </button>
              </div>
            </div>

            {/* Auto-Sync Configuration Box */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Automatic Background Synchronization
                  </h4>
                  <p className="text-xs text-slate-400">
                    Periodically backup changes to your central repository automatically.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoSyncEnabled}
                    onChange={(e) => handleToggleAutoSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {config.autoSyncEnabled && (
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-300 font-mono">Sync Interval Cadence:</span>
                  <div className="flex gap-2">
                    {[30, 60, 120, 300].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => handleIntervalChange(sec)}
                        className={`px-3 py-1 text-xs font-mono rounded-lg transition-all ${
                          config.autoSyncIntervalSeconds === sec
                            ? 'bg-cyan-500 text-slate-950 font-black'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Metadata Bar */}
              <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
                <div>
                  Last Sync:{' '}
                  <span className="text-white font-bold">
                    {config.lastSyncTime || 'Never during this session'}
                  </span>
                </div>
                {config.lastCommitSha && (
                  <div>
                    Commit SHA:{' '}
                    <span className="text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/20">
                      {config.lastCommitSha}
                    </span>
                  </div>
                )}
                <div>
                  Status:{' '}
                  <span
                    className={`font-black uppercase ${
                      config.lastSyncStatus === 'synced'
                        ? 'text-emerald-400'
                        : config.lastSyncStatus === 'syncing'
                        ? 'text-cyan-400 animate-pulse'
                        : config.lastSyncStatus === 'error'
                        ? 'text-red-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {config.lastSyncStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONFIGURATION & TOKEN */}
        {activeTab === 'config' && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Key className="w-4 h-4" /> Personal Access Token (PAT)
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                A GitHub Personal Access Token is required to commit database files directly to <span className="font-mono text-cyan-300">iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6</span>.
              </p>

              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="ghp_... or github_pat_..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
                  <a
                    href="https://github.com/settings/tokens/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    Generate new token on GitHub (scope: repo)
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="flex items-center gap-2">
                    {config.personalAccessToken && (
                      <button
                        onClick={() => {
                          const updated = saveGitHubConfig({ personalAccessToken: '' });
                          setConfig(updated);
                          setTokenInput('');
                          setStatusMsg({
                            type: 'info',
                            text: 'Personal Access Token removed and disconnected.'
                          });
                          setTimeout(() => setStatusMsg(null), 3000);
                        }}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold text-xs rounded-lg uppercase tracking-wider cursor-pointer transition-all"
                        title="Disconnect and remove saved personal access token"
                      >
                        Disconnect Token
                      </button>
                    )}
                    <button
                      onClick={handleSaveToken}
                      className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg uppercase tracking-wider cursor-pointer"
                    >
                      Save Token
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Target Path Settings */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Target Owner</label>
                  <input
                    type="text"
                    value={config.owner}
                    onChange={(e) => {
                      const updated = saveGitHubConfig({ owner: e.target.value });
                      setConfig(updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Repository Name</label>
                  <input
                    type="text"
                    value={config.repo}
                    onChange={(e) => {
                      const updated = saveGitHubConfig({ repo: e.target.value });
                      setConfig(updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Target Branch</label>
                  <input
                    type="text"
                    value={config.branch}
                    onChange={(e) => {
                      const updated = saveGitHubConfig({ branch: e.target.value });
                      setConfig(updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">File Storage Path</label>
                  <input
                    type="text"
                    value={config.filePath}
                    onChange={(e) => {
                      const updated = saveGitHubConfig({ filePath: e.target.value });
                      setConfig(updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DATABASE PAYLOAD PREVIEW */}
        {activeTab === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono text-slate-400">
                Payload Size: <span className="text-cyan-300 font-bold">{(jsonPreview.length / 1024).toFixed(1)} KB</span> // Documents: <span className="text-white font-bold">{files.length}</span>
              </div>
              <button
                onClick={handleCopyJson}
                className="px-3 py-1.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy JSON'}
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-200/90 leading-relaxed jarvis-scrollbar">
              <pre>{jsonPreview}</pre>
            </div>
          </div>
        )}

      </div>
    </DraggableResizableWindow>
  );
};

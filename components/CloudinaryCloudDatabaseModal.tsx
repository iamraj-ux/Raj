import React, { useState, useEffect } from 'react';
import { 
  Cloud, RefreshCw, ExternalLink, Download, CheckCircle2, 
  AlertCircle, Copy, Check, FileText, Database, Shield,
  Layers, Search, Eye
} from 'lucide-react';
import { DraggableResizableWindow } from './DraggableResizableWindow';
import { 
  getLatestCloudinaryTextUrl, 
  fetchTextDataFromCloudinary, 
  syncAllTextDataToBoth,
  ConsolidatedTextPayload 
} from '../services/dualCloudSyncService';
import { speakNatasha } from '../services/soundEffects';

interface CloudinaryCloudDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudinaryCloudDatabaseModal: React.FC<CloudinaryCloudDatabaseModalProps> = ({
  isOpen,
  onClose
}) => {
  const [cloudUrl, setCloudUrl] = useState<string | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [payload, setPayload] = useState<ConsolidatedTextPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'records' | 'raw'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const loadFromCloudinary = async (urlToFetch?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const activeUrl = urlToFetch || getLatestCloudinaryTextUrl() || undefined;
      const data = await fetchTextDataFromCloudinary(activeUrl);
      setPayload(data);
      const resolvedUrl = activeUrl || getLatestCloudinaryTextUrl();
      if (resolvedUrl) setCloudUrl(resolvedUrl);

      speakNatasha("Text-based database retrieved successfully from Cloudinary cloud, boss.");
    } catch (err: any) {
      console.error('Failed to load from Cloudinary:', err);
      setError(err.message || 'Could not fetch from Cloudinary cloud.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const storedUrl = getLatestCloudinaryTextUrl();
      setCloudUrl(storedUrl);
      if (storedUrl) setCustomUrlInput(storedUrl);
      loadFromCloudinary(storedUrl || undefined);
    }
  }, [isOpen]);

  const handleCopyUrl = () => {
    if (!cloudUrl) return;
    navigator.clipboard.writeText(cloudUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualSyncPush = async () => {
    setIsLoading(true);
    try {
      const res = await syncAllTextDataToBoth('User manual sync from Cloudinary modal');
      if (res.cloudinaryUrl) {
        setCloudUrl(res.cloudinaryUrl);
        setCustomUrlInput(res.cloudinaryUrl);
        await loadFromCloudinary(res.cloudinaryUrl);
      }
    } catch (e: any) {
      setError(e.message || 'Push sync failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <DraggableResizableWindow
      isOpen={isOpen}
      onClose={onClose}
      title="CLOUDINARY CLOUD TEXT DATABASE // LIVE CLOUD VIEWER"
      subtitle="Direct read/write access to all text-based information stored in Cloudinary cloud"
      icon={<Cloud className="w-4 h-4 text-cyan-400" />}
      initialWidth={900}
      initialHeight={640}
      headerActions={
        <button
          onClick={handleManualSyncPush}
          disabled={isLoading}
          className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-lg text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-md mr-2"
        >
          {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
          <span>Push Fresh Cloud Sync</span>
        </button>
      }
    >
      <div className="flex flex-col h-full bg-slate-950 text-white font-sans text-xs">
        {/* URL Banner */}
        <div className="p-3 bg-slate-900/90 border-b border-cyan-500/20 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
              Cloudinary Cloud URL (Folder: raj_expo/text_database):
            </span>
            <div className="flex items-center gap-2">
              {cloudUrl && (
                <>
                  <button
                    onClick={handleCopyUrl}
                    className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy URL'}</span>
                  </button>
                  <a
                    href={cloudUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open Raw</span>
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              placeholder="Paste Cloudinary JSON text database URL..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-400"
            />
            <button
              onClick={() => loadFromCloudinary(customUrlInput)}
              disabled={isLoading || !customUrlInput.trim()}
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs uppercase cursor-pointer"
            >
              Fetch Cloud Data
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border-b border-red-500/40 text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-2 bg-slate-900/60 border-b border-cyan-500/20 px-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
              activeTab === 'overview' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cloud Overview
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
              activeTab === 'categories' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Canonical Categories ({payload?.canonicalCategories?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
              activeTab === 'records' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Central Records ({payload?.centralRecords?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
              activeTab === 'raw' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Raw JSON Document
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 jarvis-scrollbar">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-2 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
              <span>Fetching all text-based information from Cloudinary cloud...</span>
            </div>
          ) : !payload ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Cloud className="w-12 h-12 text-cyan-400" />
              <span className="text-sm font-bold text-white">No Cloud Data Fetched</span>
              <p className="text-xs max-w-sm text-center">
                Click "Push Fresh Cloud Sync" to upload all current application text data to Cloudinary cloud now.
              </p>
              <button
                onClick={handleManualSyncPush}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl uppercase text-xs cursor-pointer"
              >
                Sync All Text to Cloudinary Now
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-4 max-w-3xl">
                  <div className="p-4 bg-slate-900/60 border border-cyan-500/30 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-cyan-400">{payload.app}</span>
                      <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-500/40 text-emerald-300 rounded text-[10px] font-bold">
                        VERIFIED IN CLOUD
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white">
                      Master Operator: {payload.masterOperator}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Generated: {new Date(payload.generatedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block">Canonical Categories</span>
                      <span className="text-lg font-black text-cyan-400">{payload.canonicalCategories?.length || 0}</span>
                    </div>
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block">Central Records</span>
                      <span className="text-lg font-black text-emerald-400">{payload.centralRecords?.length || 0}</span>
                    </div>
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block">WhatsApp Archives</span>
                      <span className="text-lg font-black text-purple-400">{payload.whatsappSessions?.length || 0}</span>
                    </div>
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block">Knowledge Entities</span>
                      <span className="text-lg font-black text-amber-400">{payload.knowledgeGraph?.entities?.length || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'categories' && (
                <div className="space-y-3">
                  {(payload.canonicalCategories || []).map((cat: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-cyan-300">{cat.name} ({cat.code})</span>
                        <span className="text-[10px] text-slate-400 font-mono">{cat.items?.length || 0} Records</span>
                      </div>
                      <p className="text-xs text-slate-300">{cat.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'records' && (
                <div className="space-y-3">
                  {(payload.centralRecords || []).map((rec: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-xs font-black text-emerald-400">{rec.title}</span>
                      <p className="text-xs text-slate-300">{rec.description || rec.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'raw' && (
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              )}
            </>
          )}
        </div>
      </div>
    </DraggableResizableWindow>
  );
};

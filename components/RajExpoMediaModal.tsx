import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Grid, 
  List, 
  Maximize2, 
  ExternalLink, 
  Play, 
  FileText, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Music, 
  FileCode, 
  FileSpreadsheet, 
  Search, 
  Clock, 
  Calendar, 
  Tag, 
  BrainCircuit, 
  Bell, 
  Check, 
  Edit3, 
  Save, 
  Trash2, 
  Download, 
  RefreshCw, 
  Upload, 
  Volume2, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut,
  FolderGit2,
  Cloud,
  Copy,
  Code,
  Share2,
  ShieldAlert
} from 'lucide-react';
import { 
  RajExpoMediaItem, 
  MediaCategory, 
  getStoredMediaItems, 
  saveMediaItemsLocally, 
  syncMediaCatalogToGitHub, 
  registerMediaInNatashaMemory 
} from '../services/mediaStorageService';
import { soundManager } from '../services/soundEffects';
import { logActivity } from '../services/activityLogger';

interface RajExpoMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUploadModal?: () => void;
  onTriggerReminder?: (reminderData: { title: string; description: string; timestamp: string }) => void;
}

export const RajExpoMediaModal: React.FC<RajExpoMediaModalProps> = ({
  isOpen,
  onClose,
  onOpenUploadModal,
  onTriggerReminder
}) => {
  const [items, setItems] = useState<RajExpoMediaItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<'all' | MediaCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest');

  // Full Screen / Lightbox State
  const [fullScreenItem, setFullScreenItem] = useState<RajExpoMediaItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Description Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescText, setEditDescText] = useState('');

  // Reminder Notification State
  const [reminderToast, setReminderToast] = useState<string | null>(null);
  const [copiedItemState, setCopiedItemState] = useState<{ id: string; type: 'url' | 'html' | 'md' } | null>(null);

  // Safe Deletion Confirmation State
  const [itemToDelete, setItemToDelete] = useState<RajExpoMediaItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredMediaItems();
      setItems(stored);
    }
  }, [isOpen]);

  // Open file in new tab (support for video, audio, code, images, etc.)
  const handleOpenInNewTab = (item: RajExpoMediaItem) => {
    soundManager.playClickSound();
    logActivity('WEBAPP', `Opened Media in New Tab: ${item.name}`, `Format: ${item.category} | Provider: ${item.storageProvider || 'Cloudinary'}`);

    const mediaSource = item.cloudinaryUrl || item.dataUrl;

    if (item.cloudinaryUrl) {
      window.open(item.cloudinaryUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (mediaSource) {
      const newTab = window.open();
      if (newTab) {
        if (item.category === 'video') {
          newTab.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${item.name} - Raj Expo Player</title>
                <style>
                  body { margin: 0; background: #0b0f19; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, sans-serif; color: white; }
                  video { max-width: 90vw; max-height: 80vh; border-radius: 12px; box-shadow: 0 0 40px rgba(0,255,255,0.2); }
                  .header { margin-bottom: 20px; text-align: center; }
                  h2 { margin: 0 0 6px 0; color: #38bdf8; }
                  p { margin: 0; color: #94a3b8; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="header">
                  <h2>${item.name}</h2>
                  <p>Uploaded: ${item.timestamp} | ${item.sizeFormatted}</p>
                  <p style="margin-top: 6px; color: #e2e8f0;">"${item.description || ''}"</p>
                </div>
                <video controls autoplay src="${mediaSource}"></video>
              </body>
            </html>
          `);
        } else if (item.category === 'audio') {
          newTab.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${item.name} - Raj Expo Audio</title>
                <style>
                  body { margin: 0; background: #0b0f19; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, sans-serif; color: white; }
                  audio { width: 400px; margin-top: 20px; }
                  .card { padding: 40px; background: #1e293b; border-radius: 20px; border: 1px solid #38bdf8; text-align: center; }
                  h2 { margin: 0 0 8px 0; color: #38bdf8; }
                  p { margin: 0; color: #94a3b8; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h2>🎵 ${item.name}</h2>
                  <p>Uploaded: ${item.timestamp} | ${item.sizeFormatted}</p>
                  <p style="margin-top: 10px; color: #cbd5e1;">"${item.description || 'Audio recording'}"</p>
                  <audio controls autoplay src="${mediaSource}"></audio>
                </div>
              </body>
            </html>
          `);
        } else if (item.category === 'code' && item.textContent) {
          newTab.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${item.name} - Raj Expo Code Viewer</title>
                <style>
                  body { margin: 0; background: #0f172a; color: #e2e8f0; font-family: monospace; padding: 24px; }
                  .bar { padding: 12px 16px; background: #1e293b; border-radius: 8px; margin-bottom: 16px; border: 1px solid #334155; }
                  pre { background: #020617; padding: 20px; border-radius: 8px; overflow-x: auto; font-size: 14px; line-height: 1.6; border: 1px solid #1e293b; }
                </style>
              </head>
              <body>
                <div class="bar">
                  <strong style="color: #38bdf8;">File: ${item.name}</strong> | Uploaded: ${item.timestamp} | ${item.sizeFormatted}
                  <div style="margin-top: 4px; color: #94a3b8;">${item.description || ''}</div>
                </div>
                <pre><code>${item.textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
              </body>
            </html>
          `);
        } else {
          newTab.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${item.name} - Raj Expo Media</title>
                <style>
                  body { margin: 0; background: #050811; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
                  img { max-width: 95vw; max-height: 85vh; object-fit: contain; border-radius: 8px; box-shadow: 0 0 30px rgba(0,0,0,0.8); }
                  .meta { color: #94a3b8; font-size: 13px; margin-top: 14px; text-align: center; }
                </style>
              </head>
              <body>
                <img src="${mediaSource}" alt="${item.name}" />
                <div class="meta">
                  <strong style="color: #38bdf8;">${item.name}</strong> • ${item.timestamp} • ${item.sizeFormatted}
                  <p style="margin-top: 4px; color: #e2e8f0;">"${item.description || ''}"</p>
                </div>
              </body>
            </html>
          `);
        }
      }
    } else {
      const config = JSON.parse(localStorage.getItem('raj_expo_github_sync_config_v1') || '{}');
      const repoUrl = `https://github.com/${config.owner || 'iamraj-ux'}/${config.repo || 'N.-A.-T..-A.-S.-H.-A-v5.-6'}`;
      window.open(repoUrl, '_blank');
    }
  };

  // Copy helpers
  const handleCopy = (item: RajExpoMediaItem, type: 'url' | 'html' | 'md') => {
    const url = item.cloudinaryUrl || item.dataUrl || '';
    let textToCopy = url;
    if (type === 'html') {
      if (item.category === 'image') {
        textToCopy = `<img src="${url}" alt="${item.name}" />`;
      } else {
        textToCopy = `<a href="${url}" target="_blank">${item.name}</a>`;
      }
    } else if (type === 'md') {
      if (item.category === 'image') {
        textToCopy = `![${item.name}](${url})`;
      } else {
        textToCopy = `[${item.name}](${url})`;
      }
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedItemState({ id: item.id, type });
    soundManager.playClickSound();
    setTimeout(() => setCopiedItemState(null), 2000);
  };

  // Start editing description
  const handleStartEdit = (item: RajExpoMediaItem) => {
    setEditingId(item.id);
    setEditDescText(item.description || '');
  };

  // Save updated description
  const handleSaveDescription = async (id: string) => {
    const updated = items.map(it => {
      if (it.id === id) {
        return {
          ...it,
          description: editDescText.trim(),
        };
      }
      return it;
    });

    setItems(updated);
    saveMediaItemsLocally(updated);
    setEditingId(null);

    const changedItem = updated.find(it => it.id === id);
    if (changedItem) {
      registerMediaInNatashaMemory(changedItem);
      syncMediaCatalogToGitHub(updated);
      soundManager.playClickSound();

      window.dispatchEvent(
        new CustomEvent('natasha-message', {
          detail: {
            text: `Boss, I updated the description for "${changedItem.name}" in my memory: "${changedItem.description}". I'll remind you accordingly!`,
            isBinary: false
          }
        })
      );
    }
  };

  // Delete media item with safe explicit confirmation (Requirement 15)
  const confirmDeleteMediaRecord = () => {
    if (!itemToDelete) return;

    const remaining = items.filter(it => it.id !== itemToDelete.id);
    setItems(remaining);
    saveMediaItemsLocally(remaining);
    syncMediaCatalogToGitHub(remaining);
    if (fullScreenItem?.id === itemToDelete.id) {
      setFullScreenItem(null);
    }
    soundManager.playDeleteSound();
    logActivity(
      'DATABASE', 
      `Deleted Media File Record: ${itemToDelete.name}`, 
      `Database record ${itemToDelete.id} removed. Cloudinary CDN asset preserved.`
    );
    setItemToDelete(null);
  };

  // Natasha Remind Me action
  const handleNatashaRemindMe = (item: RajExpoMediaItem) => {
    soundManager.playWelcomeSound();
    
    setReminderToast(`Natasha reminder scheduled for "${item.name}"!`);
    setTimeout(() => setReminderToast(null), 4000);

    window.dispatchEvent(
      new CustomEvent('natasha-message', {
        detail: {
          text: `Reminder set! I have indexed "${item.name}" uploaded on ${item.timestamp}. Description: "${item.description || 'Raj Expo Media file'}". I will keep you posted, Boss!`,
          isBinary: false
        }
      })
    );

    if (onTriggerReminder) {
      onTriggerReminder({
        title: `Reminder: ${item.name}`,
        description: `Description: ${item.description || 'Uploaded media file'}\nCategory: ${item.category.toUpperCase()}\nTimestamp: ${item.timestamp}`,
        timestamp: item.timestamp
      });
    }
  };

  // Filtered & Sorted items with comprehensive search matching (Requirement 9 & 15)
  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.extension.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.mimeType.toLowerCase().includes(q) ||
          item.timestamp.toLowerCase().includes(q) ||
          (item.isoTimestamp && item.isoTimestamp.toLowerCase().includes(q)) ||
          (item.cloudinaryPublicId && item.cloudinaryPublicId.toLowerCase().includes(q)) ||
          (item.cloudinaryUrl && item.cloudinaryUrl.toLowerCase().includes(q)) ||
          item.tags.some(t => t.toLowerCase().includes(q)) ||
          (item.linkedEntities && item.linkedEntities.some(e => e.toLowerCase().includes(q))) ||
          (item.linkedActivities && item.linkedActivities.some(a => a.toLowerCase().includes(q)))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return (b.isoTimestamp || '').localeCompare(a.isoTimestamp || '');
        if (sortBy === 'oldest') return (a.isoTimestamp || '').localeCompare(b.isoTimestamp || '');
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'size') return b.size - a.size;
        return 0;
      });
  }, [items, selectedCategory, searchQuery, sortBy]);

  // Full screen navigation
  const handleNextItem = () => {
    if (!fullScreenItem) return;
    const currentIndex = filteredItems.findIndex(it => it.id === fullScreenItem.id);
    if (currentIndex < filteredItems.length - 1) {
      setFullScreenItem(filteredItems[currentIndex + 1]);
      setZoomLevel(1);
    }
  };

  const handlePrevItem = () => {
    if (!fullScreenItem) return;
    const currentIndex = filteredItems.findIndex(it => it.id === fullScreenItem.id);
    if (currentIndex > 0) {
      setFullScreenItem(filteredItems[currentIndex - 1]);
      setZoomLevel(1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-7xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-[0_0_60px_rgba(34,211,238,0.2)] overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 rounded-2xl shadow-[0_0_15px_rgba(34,211,238,0.25)]">
              <FolderGit2 className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black uppercase tracking-wider text-white">
                  Raj Expo Media Files
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                  CENTRAL DATABASE & CDN
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                  <Cloud className="w-3 h-3" />
                  <span>CLOUDINARY ONLINE</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Central Repository: <strong className="text-cyan-300">iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6</strong> • Delivery: Cloudinary <strong className="text-emerald-300">"uhysx6is"</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenUploadModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenUploadModal();
                }}
                className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New Files</span>
              </button>
            )}

            <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between flex-wrap gap-4 text-xs font-mono">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 jarvis-scrollbar">
            {[
              { id: 'all', label: 'All Files', count: items.length },
              { id: 'image', label: 'Images', count: items.filter(i => i.category === 'image').length },
              { id: 'video', label: 'Videos', count: items.filter(i => i.category === 'video').length },
              { id: 'audio', label: 'Audio', count: items.filter(i => i.category === 'audio').length },
              { id: 'pdf', label: 'PDF', count: items.filter(i => i.category === 'pdf').length },
              { id: 'document', label: 'Docs', count: items.filter(i => i.category === 'document').length },
              { id: 'code', label: 'Code', count: items.filter(i => i.category === 'code').length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Search Box and Sort */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, description, tags, CDN..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs font-sans"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 text-xs font-mono focus:outline-none focus:border-cyan-400"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="size">Largest Size</option>
            </select>
          </div>
        </div>

        {/* Toast Alert */}
        {reminderToast && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fadeIn">
            <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{reminderToast}</span>
          </div>
        )}

        {/* Media Items Canvas Area */}
        <div className="flex-1 overflow-y-auto p-6 jarvis-scrollbar scroll-smooth">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="p-5 bg-slate-800/60 rounded-3xl border border-slate-700">
                <ImageIcon className="w-10 h-10 text-slate-500" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-base font-bold text-white uppercase tracking-wider">No Media Files Found</h3>
                <p className="text-xs text-slate-400">
                  {searchQuery 
                    ? `No files match "${searchQuery}". Try different keywords.`
                    : 'No files uploaded yet. Click "Upload New Files" to upload files to Cloudinary and GitHub Central Database.'}
                </p>
              </div>
              {onOpenUploadModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenUploadModal();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all cursor-pointer"
                >
                  Upload First File
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* ================= GRID VIEW ================= */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredItems.map(item => {
                const mediaSource = item.cloudinaryUrl || item.dataUrl;

                return (
                  <div
                    key={item.id}
                    className="group relative rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col overflow-hidden shadow-lg hover:shadow-[0_0_25px_rgba(34,211,238,0.15)]"
                  >
                    {/* Thumbnail / Media Preview Top */}
                    <div 
                      onClick={() => setFullScreenItem(item)}
                      className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden cursor-pointer group/thumb"
                    >
                      {item.category === 'image' && mediaSource ? (
                        <img 
                          src={mediaSource} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                        />
                      ) : item.category === 'video' && mediaSource ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-black">
                          <video 
                            src={mediaSource} 
                            className="w-full h-full object-cover opacity-80"
                          />
                          <div className="absolute p-3 rounded-full bg-red-600/80 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)] group-hover/thumb:scale-110 transition-transform">
                            <Play className="w-5 h-5 fill-white" />
                          </div>
                        </div>
                      ) : item.category === 'audio' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-950/40 to-slate-900 text-purple-400 p-4">
                          <Music className="w-10 h-10 mb-1 group-hover/thumb:scale-110 transition-transform" />
                          <span className="text-[10px] font-mono text-purple-300 uppercase font-bold">Audio Track</span>
                        </div>
                      ) : item.category === 'code' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-emerald-400 p-3">
                          <FileCode className="w-10 h-10 mb-1 group-hover/thumb:scale-110 transition-transform" />
                          <span className="text-[10px] font-mono text-emerald-300 uppercase font-bold">{item.extension.toUpperCase()} CODE</span>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-blue-400 p-3">
                          <FileText className="w-10 h-10 mb-1 group-hover/thumb:scale-110 transition-transform" />
                          <span className="text-[10px] font-mono text-blue-300 uppercase font-bold">{item.extension.toUpperCase()} FILE</span>
                        </div>
                      )}

                      {/* Category Overlay Tag */}
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-slate-950/85 text-cyan-300 border border-cyan-500/40 backdrop-blur-sm">
                        {item.category}
                      </span>

                      {/* Cloudinary CDN Badge */}
                      {item.cloudinaryUrl && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-cyan-950/90 text-cyan-300 border border-cyan-400/40 backdrop-blur-sm flex items-center gap-1 shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                          <Cloud className="w-2.5 h-2.5" />
                          <span>CDN</span>
                        </span>
                      )}
                    </div>

                    {/* Metadata Middle Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 
                            onClick={() => setFullScreenItem(item)}
                            className="text-sm font-bold text-white truncate hover:text-cyan-300 cursor-pointer transition-colors"
                            title={item.name}
                          >
                            {item.name}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {item.sizeFormatted}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.timestamp}</span>
                        </div>

                        {/* Description Block */}
                        <div className="mt-2.5 text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                          {editingId === item.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editDescText}
                                onChange={(e) => setEditDescText(e.target.value)}
                                rows={2}
                                className="w-full text-xs bg-slate-950 p-2 rounded-lg border border-cyan-500/50 text-white focus:outline-none"
                              />
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="px-2 py-1 text-[10px] text-slate-400 hover:text-white"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveDescription(item.id)}
                                  className="px-2.5 py-1 text-[10px] bg-cyan-500 text-slate-950 font-bold rounded-lg flex items-center gap-1"
                                >
                                  <Save className="w-3 h-3" /> Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="group/desc relative">
                              <p className="line-clamp-2 italic text-slate-300 text-[11px] leading-relaxed">
                                "{item.description || 'No description provided'}"
                              </p>
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="absolute -top-1 -right-1 p-1 text-slate-500 hover:text-cyan-400 opacity-0 group-hover/desc:opacity-100 transition-opacity cursor-pointer"
                                title="Edit description"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="pt-2.5 mt-2 border-t border-slate-900 flex items-center justify-between text-xs font-mono flex-wrap gap-1.5">
                        {/* Open Action */}
                        <button
                          onClick={() => handleOpenInNewTab(item)}
                          className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                          title="Open delivery URL"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open</span>
                        </button>

                        {/* Copy URL */}
                        <button
                          onClick={() => handleCopy(item, 'url')}
                          className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                          title="Copy direct URL"
                        >
                          {copiedItemState?.id === item.id && copiedItemState.type === 'url' ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedItemState?.id === item.id && copiedItemState.type === 'url' ? 'Copied' : 'URL'}</span>
                        </button>

                        {/* Copy HTML */}
                        <button
                          onClick={() => handleCopy(item, 'html')}
                          className="text-[10px] text-slate-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                          title="Copy HTML tag"
                        >
                          <Code className="w-3 h-3" />
                          <span>HTML</span>
                        </button>

                        {/* Natasha Remind Me */}
                        <button
                          onClick={() => handleNatashaRemindMe(item)}
                          className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 flex items-center gap-1 cursor-pointer transition-all"
                          title="Ask Natasha to Remind Me"
                        >
                          <Bell className="w-2.5 h-2.5" />
                          <span>Remind</span>
                        </button>

                        {/* Delete with confirmation */}
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                          title="Delete file record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ================= LIST THUMBNAIL VIEW ================= */
            <div className="space-y-2.5">
              {filteredItems.map(item => {
                const mediaSource = item.cloudinaryUrl || item.dataUrl;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    {/* Thumbnail & File Name */}
                    <div className="flex items-center gap-3.5 min-w-[280px]">
                      <div 
                        onClick={() => setFullScreenItem(item)}
                        className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-cyan-400 transition-colors"
                      >
                        {item.category === 'image' && mediaSource ? (
                          <img src={mediaSource} alt={item.name} className="w-full h-full object-cover" />
                        ) : item.category === 'video' ? (
                          <VideoIcon className="w-6 h-6 text-red-400" />
                        ) : item.category === 'audio' ? (
                          <Music className="w-6 h-6 text-purple-400" />
                        ) : item.category === 'code' ? (
                          <FileCode className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <FileText className="w-6 h-6 text-blue-400" />
                        )}
                      </div>

                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <h4 
                            onClick={() => setFullScreenItem(item)}
                            className="text-sm font-bold text-white truncate max-w-[220px] hover:text-cyan-300 cursor-pointer"
                            title={item.name}
                          >
                            {item.name}
                          </h4>
                          {item.cloudinaryUrl && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40 font-bold">
                              CDN
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
                          <span className="uppercase text-cyan-400 font-bold">{item.extension}</span>
                          <span>•</span>
                          <span>{item.sizeFormatted}</span>
                          <span>•</span>
                          <span>{item.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    {/* Description preview */}
                    <div className="flex-1 w-full md:w-auto">
                      <p className="text-xs text-slate-300 italic truncate max-w-md">
                        "{item.description || 'No description provided'}"
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenInNewTab(item)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open</span>
                      </button>

                      <button
                        onClick={() => handleCopy(item, 'url')}
                        className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1 cursor-pointer"
                        title="Copy URL"
                      >
                        <Copy className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => handleCopy(item, 'md')}
                        className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1 cursor-pointer"
                        title="Copy Markdown"
                      >
                        <span>MD</span>
                      </button>

                      <button
                        onClick={() => handleNatashaRemindMe(item)}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Remind</span>
                      </button>

                      <button
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Status */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>GitHub Central DB: <span className="text-slate-300 font-bold">iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6</span></span>
          </div>
          <div className="flex items-center gap-3">
            <span>Showing {filteredItems.length} of {items.length} files</span>
            <button
              onClick={() => {
                const refreshed = getStoredMediaItems();
                setItems(refreshed);
                soundManager.playZipSuccessSound();
              }}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Reload Catalog
            </button>
          </div>
        </div>

      </div>

      {/* ================= FULL SCREEN LIGHTBOX / VIEWER MODAL ================= */}
      {fullScreenItem && (
        <div 
          onClick={() => setFullScreenItem(null)}
          className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex flex-col animate-fadeIn"
        >
          {/* Lightbox Top Control Bar */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between text-white flex-wrap gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40">
                {fullScreenItem.category === 'image' ? <ImageIcon className="w-5 h-5 text-pink-400" /> :
                 fullScreenItem.category === 'video' ? <VideoIcon className="w-5 h-5 text-red-400" /> :
                 fullScreenItem.category === 'audio' ? <Music className="w-5 h-5 text-purple-400" /> :
                 fullScreenItem.category === 'code' ? <FileCode className="w-5 h-5 text-emerald-400" /> :
                 <FileText className="w-5 h-5 text-blue-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-md">
                    {fullScreenItem.name}
                  </h3>
                  {fullScreenItem.cloudinaryUrl && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold flex items-center gap-1">
                      <Cloud className="w-3 h-3" />
                      <span>CLOUDINARY CDN</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  {fullScreenItem.sizeFormatted} • Uploaded {fullScreenItem.timestamp}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={() => handleCopy(fullScreenItem, 'url')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                title="Copy Cloudinary URL"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Copy URL</span>
              </button>

              <button
                onClick={() => handleCopy(fullScreenItem, 'html')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                title="Copy HTML Tag"
              >
                <Code className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copy HTML</span>
              </button>

              <button
                onClick={() => handleOpenInNewTab(fullScreenItem)}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                title="Open delivery URL"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Tab</span>
              </button>

              <button
                onClick={() => handleNatashaRemindMe(fullScreenItem)}
                className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                title="Ask Natasha to Remind Me"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Remind Me</span>
              </button>

              {fullScreenItem.category === 'image' && (
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                    className="p-1 hover:text-cyan-400 text-slate-300 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono px-1">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                    className="p-1 hover:text-cyan-400 text-slate-300 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                onClick={() => setFullScreenItem(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Center Stage */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="flex-1 relative flex items-center justify-center p-4 overflow-hidden"
          >
            {/* Previous Button */}
            <button
              onClick={handlePrevItem}
              className="absolute left-4 z-10 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 cursor-pointer hover:scale-110 transition-transform"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Media Canvas */}
            <div className="max-w-full max-h-full flex items-center justify-center">
              {fullScreenItem.category === 'image' && (fullScreenItem.cloudinaryUrl || fullScreenItem.dataUrl) ? (
                <img
                  src={fullScreenItem.cloudinaryUrl || fullScreenItem.dataUrl}
                  alt={fullScreenItem.name}
                  style={{ transform: `scale(${zoomLevel})` }}
                  className="max-h-[75vh] max-w-[85vw] object-contain rounded-xl shadow-2xl transition-transform duration-200"
                />
              ) : fullScreenItem.category === 'video' && (fullScreenItem.cloudinaryUrl || fullScreenItem.dataUrl) ? (
                <div className="max-w-4xl w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
                  <video
                    controls
                    autoPlay
                    src={fullScreenItem.cloudinaryUrl || fullScreenItem.dataUrl}
                    className="w-full max-h-[70vh]"
                  />
                </div>
              ) : fullScreenItem.category === 'audio' && (fullScreenItem.cloudinaryUrl || fullScreenItem.dataUrl) ? (
                <div className="p-8 rounded-3xl bg-slate-900 border border-purple-500/40 text-center max-w-lg w-full space-y-4 shadow-2xl">
                  <div className="w-20 h-20 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <Music className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{fullScreenItem.name}</h4>
                    <p className="text-xs font-mono text-slate-400 mt-1">{fullScreenItem.sizeFormatted} • {fullScreenItem.timestamp}</p>
                  </div>
                  <audio controls autoPlay src={fullScreenItem.cloudinaryUrl || fullScreenItem.dataUrl} className="w-full pt-2" />
                </div>
              ) : fullScreenItem.category === 'code' && fullScreenItem.textContent ? (
                <div className="max-w-4xl w-full max-h-[70vh] bg-slate-950 border border-emerald-500/40 rounded-2xl p-6 overflow-auto font-mono text-xs text-emerald-300">
                  <pre className="whitespace-pre-wrap leading-relaxed">{fullScreenItem.textContent}</pre>
                </div>
              ) : (
                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center max-w-md space-y-4">
                  <FileText className="w-16 h-16 text-cyan-400 mx-auto" />
                  <h4 className="text-base font-bold text-white">{fullScreenItem.name}</h4>
                  <p className="text-xs text-slate-400">{fullScreenItem.sizeFormatted} • {fullScreenItem.extension.toUpperCase()}</p>
                  <button
                    onClick={() => handleOpenInNewTab(fullScreenItem)}
                    className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs uppercase"
                  >
                    Open Document in New Tab
                  </button>
                </div>
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={handleNextItem}
              className="absolute right-4 z-10 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 cursor-pointer hover:scale-110 transition-transform"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Bottom Description & Metadata Bar */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-cyan-300 uppercase tracking-wider text-[10px] font-mono">
                  Description & Notes:
                </span>
                <span className="text-slate-400 text-[10px] font-mono">
                  (Recorded into Natasha Memory on {fullScreenItem.timestamp})
                </span>
              </div>
              <p className="text-slate-200 text-xs italic">
                "{fullScreenItem.description || 'No custom description provided'}"
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNatashaRemindMe(fullScreenItem)}
                className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)]"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Natasha Remind Me</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ================= EXPLICIT DELETE CONFIRMATION MODAL (Requirement 15) ================= */}
      {itemToDelete && (
        <div 
          onClick={() => setItemToDelete(null)}
          className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-red-500/40 shadow-[0_0_50px_rgba(239,68,68,0.2)] space-y-4"
          >
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-950/60 rounded-2xl border border-red-500/40">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white uppercase tracking-wider">Confirm Record Deletion</h4>
                <p className="text-xs text-slate-400 font-mono">Protected Media Management</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
              <p className="text-slate-200 font-bold">"{itemToDelete.name}"</p>
              <p className="text-slate-400 font-mono text-[11px]">{itemToDelete.sizeFormatted} • {itemToDelete.category.toUpperCase()}</p>
              <p className="text-slate-400 font-mono text-[11px]">
                Status: Removing from Raj Expo Central Database & local registry.
              </p>
            </div>

            <p className="text-xs text-amber-300/90 font-mono leading-relaxed">
              ⚠️ <strong>Safe Preservation Notice:</strong> To prevent data loss, the underlying Cloudinary CDN delivery asset remains safe and will not be silently purged. Only the local and GitHub catalog index record will be removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteMediaRecord}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

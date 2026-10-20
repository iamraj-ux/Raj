import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  X, 
  FileText, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Music, 
  Code, 
  FileCode, 
  FileSpreadsheet, 
  Sparkles, 
  FolderGit2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2,
  BrainCircuit,
  Tag,
  Cloud,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Server,
  FolderArchive,
  Volume2
} from 'lucide-react';
import { 
  RajExpoMediaItem, 
  detectMediaCategory, 
  formatFileSize, 
  getStoredMediaItems, 
  saveMediaItemsLocally 
} from '../services/mediaStorageService';
import { 
  CLOUDINARY_CONFIG, 
  type UploadLifecycleState 
} from '../services/cloudinaryService';
import { 
  executeAutomaticCloudinaryUploadFlow 
} from '../services/cloudinaryUploadPipeline';
import { soundManager, speakNatasha, stopNatashaSpeech } from '../services/soundEffects';

const natashaLogo = "/src/assets/images/natasha_avatar_cyber_1788833359873.jpg";

interface PendingUploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  sizeFormatted: string;
  category: string;
  extension: string;
  mimeType: string;
  description: string;
  tags: string;
  previewUrl?: string;
  timestamp: string;
  uploadState?: UploadLifecycleState;
  uploadProgress?: number;
  stageText?: string;
  errorMessage?: string;
  uploadedItem?: RajExpoMediaItem;
}

interface MediaUploadWithDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: (newItems: RajExpoMediaItem[]) => void;
  onOpenMediaGallery?: () => void;
}

export const MediaUploadWithDescriptionModal: React.FC<MediaUploadWithDescriptionModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  onOpenMediaGallery
}) => {
  const [pendingFiles, setPendingFiles] = useState<PendingUploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [lastCompletedItem, setLastCompletedItem] = useState<RajExpoMediaItem | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Natasha 5-Second Blinking Upload Completed Pop-up State
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successPopupItem, setSuccessPopupItem] = useState<RajExpoMediaItem | null>(null);
  const [successCount, setSuccessCount] = useState(1);
  const [isBlinking, setIsBlinking] = useState(false);
  const [blinkTimer, setBlinkTimer] = useState(5);
  const blinkIntervalRef = useRef<any>(null);

  // Clean up timers and audio on unmount
  useEffect(() => {
    return () => {
      if (blinkIntervalRef.current) {
        clearInterval(blinkIntervalRef.current);
      }
      stopNatashaSpeech();
    };
  }, []);

  if (!isOpen) return null;

  // Trigger Natasha voice ("Uploading completed, boss") and 5-second blinking pop-up
  const triggerUploadCompletedSuccess = (item: RajExpoMediaItem, count: number = 1) => {
    soundManager.playCelebrationSound();

    // Natasha's photo voice: "Uploading completed, boss"
    speakNatasha("Uploading completed, boss");

    setSuccessPopupItem(item);
    setSuccessCount(count);
    setShowSuccessPopup(true);
    setIsBlinking(true);
    setBlinkTimer(5);

    if (blinkIntervalRef.current) {
      clearInterval(blinkIntervalRef.current);
    }

    blinkIntervalRef.current = setInterval(() => {
      setBlinkTimer((prev) => {
        if (prev <= 1) {
          if (blinkIntervalRef.current) {
            clearInterval(blinkIntervalRef.current);
          }
          setIsBlinking(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleFilesAdded = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newPending: PendingUploadFile[] = [];
    const now = new Date().toLocaleString();

    Array.from(fileList).forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const category = detectMediaCategory(file.name, file.type);
      let previewUrl: string | undefined = undefined;

      if (category === 'image' || file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      newPending.push({
        id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        file,
        name: file.name,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        category,
        extension: ext,
        mimeType: file.type || 'application/octet-stream',
        description: '',
        tags: `${category}, ${ext}`,
        previewUrl,
        timestamp: now,
        uploadState: 'IDLE',
        uploadProgress: 0,
        stageText: 'Ready for Cloudinary & Central Database'
      });
    });

    setPendingFiles(prev => [...prev, ...newPending]);
    soundManager.playZipSuccessSound();
  };

  const handleDescriptionChange = (id: string, text: string) => {
    setPendingFiles(prev => prev.map(f => f.id === id ? { ...f, description: text } : f));
  };

  const handleTagsChange = (id: string, text: string) => {
    setPendingFiles(prev => prev.map(f => f.id === id ? { ...f, tags: text } : f));
  };

  const removePending = (id: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== id));
  };

  // Upload a single file using the automatic pipeline
  const processSingleFileUpload = async (pendingItem: PendingUploadFile, isRetry = false, skipCloudinary = false): Promise<RajExpoMediaItem | null> => {
    setPendingFiles(prev => prev.map(f => f.id === pendingItem.id ? { 
      ...f, 
      uploadState: 'UPLOADING', 
      stageText: 'Uploading to Cloudinary...',
      errorMessage: undefined 
    } : f));

    const tagsArray = pendingItem.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const result = await executeAutomaticCloudinaryUploadFlow(
      pendingItem.file,
      {
        existingItem: pendingItem.uploadedItem,
        description: pendingItem.description,
        tags: tagsArray,
        category: pendingItem.category as any,
        skipCloudinaryIfUploaded: skipCloudinary
      },
      {
        onStateChange: (state, message, progress) => {
          setPendingFiles(prev => prev.map(f => f.id === pendingItem.id ? {
            ...f,
            uploadState: state,
            uploadProgress: progress ?? (state === 'COMPLETED' ? 100 : 50),
            stageText: message
          } : f));
        }
      }
    );

    if (result.success && result.mediaItem) {
      setPendingFiles(prev => prev.map(f => f.id === pendingItem.id ? {
        ...f,
        uploadState: 'COMPLETED',
        uploadProgress: 100,
        stageText: '✓ Raj Expo Central Database synchronized',
        uploadedItem: result.mediaItem
      } : f));
      return result.mediaItem;
    } else {
      setPendingFiles(prev => prev.map(f => f.id === pendingItem.id ? {
        ...f,
        uploadState: 'ERROR',
        errorMessage: result.error || result.stageMessage,
        stageText: result.stageMessage,
        uploadedItem: result.mediaItem || pendingItem.uploadedItem
      } : f));
      return null;
    }
  };

  // Upload a single file directly from its card
  const handleUploadSingleFile = async (item: PendingUploadFile) => {
    if (isUploading || item.uploadState === 'UPLOADING') return;

    try {
      setIsUploading(true);
      setStatusMessage({ type: 'info', text: `Uploading "${item.name}" to Cloudinary and saving to GitHub Central Database...` });
      const completed = await processSingleFileUpload(item);

      if (completed) {
        setLastCompletedItem(completed);
        triggerUploadCompletedSuccess(completed, 1);
        if (onUploadSuccess) {
          onUploadSuccess([completed]);
        }
      }
    } catch (err: any) {
      console.error('Error during single file upload:', err);
      setStatusMessage({ type: 'error', text: `Upload failed: ${err.message || 'Network or Cloudinary error'}` });
    } finally {
      setIsUploading(false);
    }
  };

  // Upload all queued files in sequence
  const handleUploadAll = async () => {
    if (pendingFiles.length === 0 || isUploading) return;

    try {
      setIsUploading(true);
      setStatusMessage({ type: 'info', text: 'Initializing Cloudinary unsigned upload & Central Database synchronization pipeline...' });

      const completedItems: RajExpoMediaItem[] = [];

      for (const pending of pendingFiles) {
        // Skip if already completed
        if (pending.uploadState === 'COMPLETED' && pending.uploadedItem) {
          completedItems.push(pending.uploadedItem);
          continue;
        }

        const completed = await processSingleFileUpload(pending);
        if (completed) {
          completedItems.push(completed);
          setLastCompletedItem(completed);
        }
      }

      if (completedItems.length > 0) {
        const latest = completedItems[completedItems.length - 1];
        setLastCompletedItem(latest);
        triggerUploadCompletedSuccess(latest, completedItems.length);
        setStatusMessage({
          type: 'success',
          text: `Done, Boss. ${completedItems.length} file(s) uploaded to Cloudinary & synchronized to Raj Expo Central Database. ✓`
        });

        if (onUploadSuccess) {
          onUploadSuccess(completedItems);
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Upload failed. One or more files could not be added to Raj Expo Central Database.'
        });
      }
    } catch (err: any) {
      console.error('Error during batch upload:', err);
      setStatusMessage({ type: 'error', text: `Batch upload failed: ${err.message || 'Unknown error'}` });
    } finally {
      setIsUploading(false);
    }
  };

  // Retry specifically for a failed file
  const handleRetryUpload = async (item: PendingUploadFile, skipCloudinary = false) => {
    setIsUploading(true);
    const completed = await processSingleFileUpload(item, true, skipCloudinary);
    setIsUploading(false);
    if (completed) {
      setLastCompletedItem(completed);
      triggerUploadCompletedSuccess(completed, 1);
      setStatusMessage({
        type: 'success',
        text: `Done, Boss. "${completed.name}" uploaded to Cloudinary & synchronized to Raj Expo Central Database. ✓`
      });
      if (onUploadSuccess) {
        onUploadSuccess([completed]);
      }
    }
  };

  const copyCloudinaryUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    soundManager.playClickSound();
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'image': return <ImageIcon className="w-5 h-5 text-pink-400" />;
      case 'video': return <VideoIcon className="w-5 h-5 text-red-400" />;
      case 'audio': return <Music className="w-5 h-5 text-purple-400" />;
      case 'pdf': return <FileText className="w-5 h-5 text-amber-400" />;
      case 'document': return <FileSpreadsheet className="w-5 h-5 text-blue-400" />;
      case 'code': return <FileCode className="w-5 h-5 text-emerald-400" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/90 backdrop-blur-xl animate-fadeIn overflow-hidden">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl h-[90vh] max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border-2 border-cyan-400/80 shadow-[0_0_80px_rgba(34,211,238,0.35)] overflow-hidden relative select-none font-mono"
      >
        {/* Header with Cloudinary + GitHub Central Database badge */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/95 flex items-center justify-between flex-wrap gap-3 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 rounded-2xl shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <Cloud className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black uppercase tracking-wider text-white">
                  Raj Expo Cloud Storage & Database Ingestion
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                  CLOUDINARY ONLINE STORAGE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Cloud: <strong className="text-cyan-300">"{CLOUDINARY_CONFIG.cloudName}"</strong></span>
                <span>•</span>
                <span>Preset: <strong className="text-emerald-400">"{CLOUDINARY_CONFIG.uploadPreset}"</strong> (Unsigned)</span>
                <span>•</span>
                <span>Central DB: <strong className="text-amber-300">iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6</strong></span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area - Strictly scrollable with min-h-0 and touch scrolling */}
        <div 
          id="raj-expo-upload-scrollable-area"
          tabIndex={0}
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 jarvis-scrollbar focus:outline-none"
          style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
        >
          
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.html,.htm,.css,.js,.jsx,.ts,.tsx,.json,.py,.java,.c,.cpp,.sh,.sql,.md,.zip"
            className="hidden"
            onChange={(e) => {
              handleFilesAdded(e.target.files);
              if (e.target) e.target.value = '';
            }}
          />

          {/* Drag and Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFilesAdded(e.dataTransfer.files);
            }}
            className="p-8 border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 rounded-2xl bg-cyan-950/10 hover:bg-cyan-950/20 transition-all flex flex-col items-center justify-center text-center cursor-pointer group space-y-3"
          >
            <div className="p-4 bg-cyan-500/20 rounded-full group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(34,211,238,0.25)]">
              <Upload className="w-8 h-8 text-cyan-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-white uppercase tracking-wider">
                Select or Drag & Drop Any File Here
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-lg font-mono">
                Direct client-side upload to Cloudinary CDN (<span className="text-cyan-300">Images, Video, Audio, PDF, DOCX, Code</span>). Automatically synched into GitHub Central Database & Natasha memory.
              </p>
            </div>
            <span className="px-4 py-1.5 rounded-full text-xs font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 group-hover:bg-cyan-500/30 transition-all">
              + Choose Files from Device
            </span>
          </div>

          {/* Status Message Notification */}
          {statusMessage && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-mono animate-fadeIn ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-red-950/80 border-red-500/50 text-red-300'
                : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              ) : (
                <BrainCircuit className="w-5 h-5 text-cyan-400 shrink-0 animate-pulse" />
              )}
              <span className="flex-1 font-semibold">{statusMessage.text}</span>
            </div>
          )}

          {/* Natasha Final Confirmation Compact Card (Requirement 8) */}
          {lastCompletedItem && (
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.15)] space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>"Done, Boss. File uploaded to Raj Expo Central Database. ✓"</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  🕒 Updated now
                </span>
              </div>

              {/* Compact Card */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 min-w-[200px]">
                  {lastCompletedItem.cloudinaryUrl && lastCompletedItem.category === 'image' ? (
                    <img 
                      src={lastCompletedItem.cloudinaryUrl} 
                      alt={lastCompletedItem.name} 
                      className="w-12 h-12 object-cover rounded-lg border border-cyan-500/30 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                      {getCategoryIcon(lastCompletedItem.category)}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate max-w-[240px]">
                      📄 {lastCompletedItem.name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-1">
                      <span className="text-cyan-400">☁️ Cloudinary: <strong className="text-emerald-400">✓ Uploaded</strong></span>
                      <span>•</span>
                      <span className="text-blue-300">🗄️ Central DB: <strong className="text-emerald-400">✓ Synced</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {lastCompletedItem.cloudinaryUrl && (
                    <a
                      href={lastCompletedItem.cloudinaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Preview / Open</span>
                    </a>
                  )}

                  {lastCompletedItem.cloudinaryUrl && (
                    <button
                      onClick={() => copyCloudinaryUrl(lastCompletedItem.cloudinaryUrl!)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 transition-all cursor-pointer"
                      title="Copy Cloudinary URL"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Queued Files with Multi-Step Natasha Animation & Inputs */}
          {pendingFiles.length > 0 && (
            <div className="space-y-4">
              {/* Sticky Quick-Action Bar inside scroll area */}
              <div className="sticky top-0 z-20 p-3 rounded-2xl bg-cyan-950/95 border-2 border-cyan-400/80 shadow-[0_0_30px_rgba(34,211,238,0.35)] backdrop-blur-md flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-200">
                    Ready for Cloudinary: {pendingFiles.filter(f => f.uploadState !== 'COMPLETED').length} item(s) queued
                  </span>
                </div>
                <button
                  type="button"
                  id="raj-expo-sticky-upload-btn"
                  onClick={handleUploadAll}
                  disabled={isUploading || pendingFiles.every(f => f.uploadState === 'COMPLETED')}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.5)] cursor-pointer flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 text-slate-950 stroke-[3]" />
                  <span>Upload All to Cloudinary</span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <span>Queued Files ({pendingFiles.length})</span>
                  <span className="text-[10px] text-cyan-400 font-mono font-normal">Auto-routed into Cloudinary folders & Central Database</span>
                </h4>
                <button
                  onClick={() => setPendingFiles([])}
                  disabled={isUploading}
                  className="text-xs text-red-400 hover:text-red-300 font-mono cursor-pointer disabled:opacity-50"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-3">
                {pendingFiles.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-3 transition-all hover:border-slate-700"
                  >
                    {/* Top Row: File Thumbnail, Name, and Form Controls */}
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      {/* Left: Thumbnail & Info */}
                      <div className="flex items-center gap-3.5 min-w-[220px]">
                        {item.previewUrl ? (
                          <img 
                            src={item.previewUrl} 
                            alt={item.name} 
                            className="w-14 h-14 object-cover rounded-xl border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                            {getCategoryIcon(item.category)}
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-white truncate max-w-[200px]" title={item.name}>
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
                            <span className="uppercase text-cyan-400 font-bold">{item.extension}</span>
                            <span>•</span>
                            <span>{item.sizeFormatted}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{item.timestamp}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Description & Tags */}
                      <div className="flex-1 w-full space-y-2">
                        <label className="text-[10px] font-mono text-cyan-300 font-bold uppercase flex items-center justify-between">
                          <span>Description & Metadata:</span>
                          <span className="text-emerald-400 font-normal">Press Enter or click UPLOAD right here</span>
                        </label>
                        
                        {/* Inline Description Input with Direct Quick Upload Button */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            id={`input-desc-${item.id}`}
                            disabled={isUploading || item.uploadState === 'UPLOADING'}
                            value={item.description}
                            onChange={(e) => handleDescriptionChange(item.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleUploadSingleFile(item);
                              }
                            }}
                            placeholder="Write description (Press Enter to Upload immediately)..."
                            className="flex-1 px-3.5 py-2.5 text-xs bg-slate-900 border-2 border-slate-700 focus:border-cyan-400 rounded-xl text-white placeholder-slate-500 font-sans disabled:opacity-60"
                          />
                          <button
                            type="button"
                            id={`quick-upload-desc-btn-${item.id}`}
                            onClick={() => handleUploadSingleFile(item)}
                            disabled={isUploading || item.uploadState === 'UPLOADING'}
                            className="px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 shrink-0 shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                            title="Upload immediately after typing description"
                          >
                            <Upload className="w-4 h-4 text-slate-950 stroke-[3]" />
                            <span>UPLOAD</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <Tag className="w-3 h-3 text-slate-500 shrink-0" />
                          <input
                            type="text"
                            disabled={isUploading || item.uploadState === 'UPLOADING'}
                            value={item.tags}
                            onChange={(e) => handleTagsChange(item.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleUploadSingleFile(item);
                              }
                            }}
                            placeholder="Tags comma-separated (e.g. invoice, urgent, cmyk)"
                            className="w-full px-2.5 py-1 text-[11px] font-mono bg-slate-900/60 border border-slate-800 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                          />
                        </div>

                        {/* HIGH-CONTRAST CLICKABLE UPLOAD BUTTON RIGHT BELOW DESCRIPTION */}
                        <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                          <button
                            type="button"
                            id={`upload-item-btn-${item.id}`}
                            onClick={() => handleUploadSingleFile(item)}
                            disabled={isUploading || item.uploadState === 'UPLOADING'}
                            className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 rounded-xl flex items-center gap-2 shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Upload this file directly to Cloudinary and commit to GitHub Central Database"
                          >
                            <Upload className="w-4 h-4 text-slate-950 stroke-[3]" />
                            <span>
                              {item.uploadState === 'UPLOADING' 
                                ? 'Uploading to Cloudinary...' 
                                : item.uploadState === 'COMPLETED' 
                                ? '✓ Uploaded (Click to Re-upload)' 
                                : 'Upload to Cloudinary & Save to GitHub'}
                            </span>
                          </button>

                          {item.uploadState === 'COMPLETED' && item.uploadedItem?.cloudinaryUrl && (
                            <a
                              href={item.uploadedItem.cloudinaryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-mono text-cyan-300 hover:text-cyan-200 underline flex items-center gap-1"
                            >
                              View on Cloudinary <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        {item.uploadState === 'ERROR' && (
                          <div className="flex items-center gap-1.5">
                            {item.uploadedItem?.cloudinaryUrl ? (
                              <button
                                onClick={() => handleRetryUpload(item, true)}
                                className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 flex items-center gap-1 transition-all"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Retry Sync</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRetryUpload(item, false)}
                                className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 flex items-center gap-1 transition-all"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Retry Upload</span>
                              </button>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => removePending(item.id)}
                          disabled={isUploading}
                          className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Status / Live Pipeline Animation State */}
                    {item.uploadState && item.uploadState !== 'IDLE' && (
                      <div className="pt-2 border-t border-slate-800/80">
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                          <span className={`flex items-center gap-1.5 font-bold ${
                            item.uploadState === 'COMPLETED' ? 'text-emerald-400' :
                            item.uploadState === 'ERROR' ? 'text-red-400' :
                            'text-cyan-400'
                          }`}>
                            {item.uploadState === 'UPLOADING' && <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />}
                            {item.uploadState === 'CLOUDINARY_UPLOADED' && <CheckCircle2 className="w-3 h-3 text-cyan-400" />}
                            {item.uploadState === 'DATABASE_SYNCING' && <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />}
                            {item.uploadState === 'VERIFYING' && <ShieldCheck className="w-3 h-3 text-blue-400 animate-pulse" />}
                            {item.uploadState === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                            {item.uploadState === 'ERROR' && <AlertCircle className="w-3 h-3 text-red-400" />}
                            <span>{item.stageText || item.uploadState}</span>
                          </span>

                          <span className="text-slate-400">
                            {item.uploadProgress}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              item.uploadState === 'COMPLETED' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' :
                              item.uploadState === 'ERROR' ? 'bg-red-500' :
                              'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                            }`}
                            style={{ width: `${item.uploadProgress || 0}%` }}
                          />
                        </div>

                        {item.errorMessage && (
                          <p className="text-[10px] font-mono text-red-400 mt-1">
                            {item.errorMessage}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Natasha Knowledge Graph & Cloudinary Pipeline Info */}
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3">
            <BrainCircuit className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="text-cyan-200 font-bold">
                Automated 4-Step Secure Cloud Pipeline
              </p>
              <p className="text-slate-300 leading-relaxed font-sans">
                Files are uploaded directly to <strong>Cloudinary CDN</strong> (<span className="text-cyan-300 font-mono">raj_expo/</span> logical folders), assigned tamper-proof secure delivery URLs, registered into the <strong>GitHub Central Database JSON</strong> (<span className="text-cyan-300 font-mono">iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6</span>), and indexed in Natasha's Knowledge Graph.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Actions - ALWAYS pinned, shrink-0 */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between flex-wrap gap-3 shrink-0 relative z-10 shadow-lg">
          <div className="flex items-center gap-2">
            {onOpenMediaGallery && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMediaGallery();
                }}
                className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-cyan-300 bg-slate-900 border border-slate-700 hover:border-cyan-500/50 rounded-xl transition-all cursor-pointer font-mono"
              >
                Open "Raj expo media files" →
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="raj-expo-modal-footer-upload-all-btn"
              onClick={handleUploadAll}
              disabled={pendingFiles.length === 0 || isUploading || pendingFiles.every(f => f.uploadState === 'COMPLETED')}
              className="px-6 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 rounded-xl flex items-center gap-2 shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className={`w-4 h-4 text-slate-950 ${isUploading ? 'animate-bounce' : ''}`} />
              <span>
                {isUploading 
                  ? 'Uploading & Synchronizing...' 
                  : pendingFiles.length === 0
                  ? 'Select Files First'
                  : pendingFiles.every(f => f.uploadState === 'COMPLETED')
                  ? '✓ All Files Uploaded'
                  : `Upload All (${pendingFiles.filter(f => f.uploadState !== 'COMPLETED').length}) Files to Cloudinary`}
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* Natasha 5-Second Blinking Upload Completed Pop-Up */}
      {showSuccessPopup && successPopupItem && (
        <div 
          id="natasha-upload-completed-popup-backdrop"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-xl animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSuccessPopup(false);
            }
          }}
        >
          <div 
            id="natasha-upload-completed-popup"
            className={`w-full max-w-xl rounded-3xl bg-slate-900/98 border-2 transition-all duration-300 overflow-hidden relative shadow-2xl ${
              isBlinking 
                ? 'animate-upload-blink border-cyan-400' 
                : 'border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.35)]'
            }`}
          >
            {/* Top Glowing Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 via-emerald-400 to-purple-500" />

            {/* Blinking Header Banner */}
            <div className={`py-2.5 px-5 text-center font-black text-xs uppercase tracking-widest flex items-center justify-between gap-2 transition-all ${
              isBlinking 
                ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 animate-badge-blink' 
                : 'bg-emerald-950/90 text-emerald-300 border-b border-emerald-500/40'
            }`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-slate-950 shrink-0" />
                <span>⚡ UPLOAD COMPLETED BOSS ⚡</span>
              </div>
              {isBlinking ? (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-cyan-300 text-[10px] font-mono font-black border border-cyan-400 shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>BLINKING: {blinkTimer}s</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/40 font-bold">
                  ✓ VERIFIED & STORED
                </span>
              )}
            </div>

            {/* Body of Success Modal */}
            <div className="p-5 sm:p-6 space-y-5">
              
              {/* Natasha Photo Voice Banner */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 shadow-inner">
                {/* Natasha Cyber Avatar with Holographic Animated Aura */}
                <div className="relative shrink-0">
                  <div className={`absolute -inset-1.5 rounded-full bg-gradient-to-tr from-cyan-400 via-emerald-400 to-purple-500 ${isBlinking ? 'animate-spin-slow opacity-90' : 'opacity-60'}`} />
                  <img 
                    src={natashaLogo} 
                    alt="Natasha V.I." 
                    className="relative w-16 h-16 rounded-full object-cover border-2 border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.5)]" 
                  />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow">
                    <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                  </span>
                </div>

                {/* Natasha Speech & Audio Wave Equalizer */}
                <div className="flex-1 space-y-1 overflow-hidden">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                      NATASHA V.I. // VOICE BROADCAST
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playClickSound();
                        speakNatasha("Uploading completed, boss");
                      }}
                      className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
                      title="Listen to Natasha's voice again"
                    >
                      <Volume2 className="w-3 h-3 text-cyan-300" />
                      <span>Listen Again</span>
                    </button>
                  </div>

                  <div className="text-base sm:text-lg font-black text-white italic tracking-wide flex items-center gap-2">
                    <span>"Uploading completed, boss"</span>
                    {/* Audio Equalizer Frequency Bars */}
                    <span className="inline-flex items-end gap-0.5 h-4 shrink-0">
                      <span className="w-1 h-3 bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-4 bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-2 bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="w-1 h-3.5 bg-cyan-300 animate-bounce" style={{ animationDelay: '450ms' }} />
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-sans">
                    Female Synthesizer Voice confirmed: Cloudinary upload complete & GitHub Central Database synchronized.
                  </p>
                </div>
              </div>

              {/* Uploaded File Snapshot Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-3.5">
                  {successPopupItem.cloudinaryUrl && (successPopupItem.category === 'image' || successPopupItem.mimeType.startsWith('image/')) ? (
                    <img 
                      src={successPopupItem.cloudinaryUrl} 
                      alt={successPopupItem.name} 
                      className="w-16 h-16 object-cover rounded-xl border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.25)] shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center shrink-0">
                      {getCategoryIcon(successPopupItem.category)}
                    </div>
                  )}

                  <div className="flex-1 overflow-hidden space-y-1">
                    <p className="text-sm font-bold text-white truncate" title={successPopupItem.name}>
                      {successPopupItem.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <span className="text-cyan-400 font-bold uppercase">{successPopupItem.extension}</span>
                      <span>•</span>
                      <span>{successPopupItem.sizeFormatted}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">Cloudinary Online Storage</span>
                    </div>
                    {successPopupItem.description && (
                      <p className="text-xs text-slate-300 font-sans bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 line-clamp-2">
                        💬 {successPopupItem.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Cloudinary Delivery URL Box */}
                {successPopupItem.cloudinaryUrl && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1 font-bold">
                      <Cloud className="w-3 h-3 text-cyan-400" /> Cloudinary CDN Delivery URL:
                    </span>
                    <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-700">
                      <input 
                        type="text" 
                        readOnly 
                        value={successPopupItem.cloudinaryUrl}
                        className="bg-transparent font-mono text-xs text-cyan-300 flex-1 truncate focus:outline-none select-all"
                      />
                      <button
                        type="button"
                        onClick={() => copyCloudinaryUrl(successPopupItem.cloudinaryUrl!)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono flex items-center gap-1 cursor-pointer transition-all shrink-0"
                      >
                        {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                      </button>
                      <a
                        href={successPopupItem.cloudinaryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1 transition-all shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Preview</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* GitHub Central Database JSON Confirmation */}
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs font-mono text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Saved to GitHub repository JSON (<strong>database/raj_expo_central_database.json</strong>)</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">SYNCHRONIZED ✓</span>
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2.5">
              {onOpenMediaGallery && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessPopup(false);
                    onClose();
                    onOpenMediaGallery();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-cyan-300 bg-slate-900 border border-cyan-500/40 hover:bg-cyan-500/20 flex items-center gap-1.5 transition-all cursor-pointer font-mono"
                >
                  <FolderArchive className="w-3.5 h-3.5" />
                  <span>Open "Raj expo media files"</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowSuccessPopup(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-200 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

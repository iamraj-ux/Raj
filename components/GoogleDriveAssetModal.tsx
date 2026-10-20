import React, { useState, useEffect, useMemo } from 'react';
import { 
  Cloud, ExternalLink, Plus, Trash2, Search, Video, Music, Image as ImageIcon, 
  FileText, Check, Copy, Sparkles, FolderUp, RefreshCw, Link2, ShieldCheck, Tag
} from 'lucide-react';
import { DraggableResizableWindow } from './DraggableResizableWindow';
import { 
  DriveMediaAsset, 
  getStoredDriveAssets, 
  addDriveMediaAsset, 
  deleteDriveMediaAsset,
  findExistingDriveAsset,
  updateDriveMediaAssetWithDirective
} from '../services/googleDriveVault';
import { getStoredKnowledgeGraph } from '../services/knowledgeGraph';
import { NatashaReminderModal, DuplicateReminderPayload } from './NatashaReminderModal';

interface GoogleDriveAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDriveAssetModal: React.FC<GoogleDriveAssetModalProps> = ({
  isOpen,
  onClose
}) => {
  const [assets, setAssets] = useState<DriveMediaAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Form states
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | 'document' | 'other'>('image');
  const [driveUrl, setDriveUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('ent-jonathan-raj');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [duplicateReminder, setDuplicateReminder] = useState<DuplicateReminderPayload | null>(null);

  const graphData = useMemo(() => getStoredKnowledgeGraph(), [isOpen]);

  const loadAssets = () => {
    setAssets(getStoredDriveAssets());
  };

  useEffect(() => {
    if (isOpen) {
      loadAssets();
    }
    const handleUpdate = () => loadAssets();
    window.addEventListener('drive-assets-updated', handleUpdate);
    return () => window.removeEventListener('drive-assets-updated', handleUpdate);
  }, [isOpen]);

  const handleOpenGoogleDrive = () => {
    window.open('https://drive.google.com/drive/my-drive', '_blank');
  };

  const executeSaveAsset = (updateExistingId?: string, updateDate: boolean = true) => {
    const tagsArr = tags.split(',').map(t => t.trim()).filter(Boolean);
    const keywordsArr = Array.from(new Set([
      ...title.toLowerCase().split(/\s+/),
      ...tagsArr.map(t => t.toLowerCase())
    ])).filter(k => k.length > 2);

    if (updateExistingId) {
      updateDriveMediaAssetWithDirective(
        updateExistingId,
        {
          title: title.trim(),
          driveUrl: driveUrl.trim(),
          mediaType,
          description: description.trim(),
          tags: tagsArr,
          keywords: keywordsArr,
          linkedEntityIds: selectedEntityId ? [selectedEntityId, 'ent-raj-expo'] : ['ent-jonathan-raj', 'ent-raj-expo']
        },
        updateDate
      );
      setSaveSuccessMsg(`Google Drive asset updated (${updateDate ? 'new date' : 'original date preserved'}) for Boss!`);
    } else {
      addDriveMediaAsset({
        title: title.trim(),
        driveUrl: driveUrl.trim(),
        mediaType,
        description: description.trim(),
        tags: tagsArr,
        keywords: keywordsArr,
        linkedEntityIds: selectedEntityId ? [selectedEntityId, 'ent-raj-expo'] : ['ent-jonathan-raj', 'ent-raj-expo']
      });
      setSaveSuccessMsg(`Google Drive asset memorized! Natasha has indexed this link for Boss.`);
    }

    setTitle('');
    setDriveUrl('');
    setDescription('');
    setTags('');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
    loadAssets();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !driveUrl.trim() || !description.trim()) return;

    // Check if asset already exists
    const existing = findExistingDriveAsset(title, driveUrl);
    if (existing) {
      // Trigger Natasha's Duplicate Reminder with 3 options
      setDuplicateReminder({
        itemType: 'DRIVE_ASSET',
        existingTitle: existing.title,
        existingDate: existing.timestamp,
        existingCategory: existing.mediaType.toUpperCase(),
        existingDescription: existing.description,
        newTitle: title.trim(),
        newCategory: mediaType.toUpperCase(),
        newDescription: description.trim(),
        onUpdateWithNewDate: () => {
          executeSaveAsset(existing.id, true);
        },
        onIgnore: () => {
          setSaveSuccessMsg("Duplicate asset ignored. Existing record preserved, Boss.");
          setTimeout(() => setSaveSuccessMsg(''), 3000);
        },
        onReplaceSameDate: () => {
          executeSaveAsset(existing.id, false);
        }
      });
      return;
    }

    executeSaveAsset();
  };

  const handleCopyLink = (asset: DriveMediaAsset) => {
    navigator.clipboard.writeText(asset.driveUrl);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchesType = selectedType === 'ALL' || a.mediaType === selectedType;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesType;

      const titleMatch = a.title.toLowerCase().includes(q);
      const descMatch = a.description.toLowerCase().includes(q);
      const tagMatch = a.tags.some(t => t.toLowerCase().includes(q));
      return matchesType && (titleMatch || descMatch || tagMatch);
    });
  }, [assets, searchQuery, selectedType]);

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4 text-rose-400" />;
      case 'audio': return <Music className="w-4 h-4 text-emerald-400" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-cyan-400" />;
      case 'document': return <FileText className="w-4 h-4 text-amber-400" />;
      default: return <Link2 className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <DraggableResizableWindow
      isOpen={isOpen}
      onClose={onClose}
      title="GOOGLE DRIVE CLOUD ASSET VAULT & NATASHA MEMORIZER"
      subtitle="Upload media to Google Drive, paste the link, and Natasha permanently memorizes it"
      icon={<Cloud className="w-5 h-5 text-cyan-400 animate-pulse" />}
      initialWidth={860}
      initialHeight={640}
    >
      <div className="p-4 sm:p-6 space-y-6">

        {/* TOP DIRECT DRIVE ACCESS BAR */}
        <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/20 rounded-2xl border border-cyan-400/50 text-cyan-300">
              <FolderUp className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                STEP 1: UPLOAD TO GOOGLE DRIVE
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-[9px] text-emerald-300">
                  ACTIVE UPLINK
                </span>
              </h4>
              <p className="text-[11px] text-slate-300 font-sans mt-0.5">
                Upload your video, audio, image, or document to your Google Drive, copy its share link, then paste it below.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenGoogleDrive}
            className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
            <span>OPEN GOOGLE DRIVE NOW</span>
          </button>
        </div>

        {/* SUCCESS ALERT */}
        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-xs text-emerald-300 font-mono flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* FORM: SAVE & MEMORIZE IN NATASHA */}
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
            <h4 className="text-xs font-black text-cyan-300 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              STEP 2: MEMORIZE GOOGLE DRIVE LINK IN NATASHA
            </h4>
            <span className="text-[9px] text-cyan-400/70 font-mono">
              NATASHA WILL DELIVER THIS LINK WHENEVER YOU ASK
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-cyan-400 uppercase">ASSET TITLE / NAME</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.G. PRESS DEMO VIDEO / KNOWLEDGE GRAPH TOPOLOGY SNAPSHOT"
                  className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2.5 text-xs text-white uppercase font-mono mt-1 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-cyan-400 uppercase">MEDIA TYPE</label>
                <select
                  value={mediaType}
                  onChange={(e: any) => setMediaType(e.target.value)}
                  className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2.5 text-xs text-white uppercase font-mono mt-1 focus:border-cyan-400 focus:outline-none"
                >
                  <option value="image">IMAGE (PNG / JPG)</option>
                  <option value="video">VIDEO (MP4 / MOV)</option>
                  <option value="audio">AUDIO (MP3 / WAV)</option>
                  <option value="document">DOCUMENT (PDF / DOC)</option>
                  <option value="other">OTHER CLOUD ASSET</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-cyan-400 uppercase">GOOGLE DRIVE LINK (SHARE URL)</label>
              <input
                type="url"
                required
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/... or https://drive.google.com/drive/folders/..."
                className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2.5 text-xs text-cyan-300 font-mono mt-1 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-cyan-400 uppercase">
                  DESCRIPTION (WHAT NATASHA SHOULD MEMORIZE)
                </label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Full context: what this video/audio/image contains, who is in it, what project it relates to..."
                  className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2.5 text-xs text-white font-mono mt-1 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-cyan-400 uppercase">TAGS (COMMA SEPARATED)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="PressDemo, Dilan, Amazon, Printline"
                    className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2.5 text-xs text-white font-mono mt-1 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-cyan-400 uppercase">LINK TO KNOWLEDGE GRAPH ENTITY</label>
                  <select
                    value={selectedEntityId}
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                    className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2 text-xs text-white font-mono mt-1 focus:border-cyan-400 focus:outline-none"
                  >
                    {graphData.entities.map(ent => (
                      <option key={ent.id} value={ent.id}>{ent.name} ({ent.type})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black uppercase tracking-wider rounded-xl text-xs transition-all cursor-pointer shadow-[0_0_25px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
            >
              <Cloud className="w-4 h-4" />
              <span>SAVE TO GOOGLE DRIVE VAULT & MEMORIZE IN NATASHA</span>
            </button>
          </form>
        </div>

        {/* VAULT DIRECTORY & SEARCH */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Cloud className="w-4 h-4 text-cyan-400" />
              MEMORIZED DRIVE ASSETS ({filteredAssets.length})
            </h4>

            {/* Filter chips */}
            <div className="flex gap-1.5 overflow-x-auto">
              {['ALL', 'image', 'video', 'audio', 'document'].map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    selectedType === type
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-cyan-500/20'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH ASSETS BY TITLE, DESCRIPTION, OR KEYWORDS..."
              className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white uppercase font-mono placeholder:text-cyan-500/40 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Asset cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssets.map(asset => (
              <div
                key={asset.id}
                className="p-4 bg-slate-900/90 border border-cyan-500/25 hover:border-cyan-400/60 rounded-2xl space-y-3 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-cyan-500/30">
                      {getMediaIcon(asset.mediaType)}
                    </div>
                    <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider">
                      {asset.mediaType}
                    </span>
                  </div>

                  <span className="text-[9px] text-slate-400 font-mono">
                    {asset.timestamp}
                  </span>
                </div>

                <div>
                  <h5 className="text-xs font-black text-white uppercase tracking-wider line-clamp-1">
                    {asset.title}
                  </h5>
                  <p className="text-[10px] text-slate-300 font-sans leading-relaxed line-clamp-2 mt-1">
                    {asset.description}
                  </p>
                </div>

                {asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {asset.tags.map(t => (
                      <span key={t} className="text-[9px] bg-slate-950 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/30">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-cyan-500/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <button
                      onClick={() => handleCopyLink(asset)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-cyan-950 border border-cyan-500/30 text-cyan-300 text-[9px] font-bold uppercase flex items-center gap-1 cursor-pointer transition-all"
                      title="Copy Drive URL"
                    >
                      {copiedId === asset.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === asset.id ? 'COPIED!' : 'COPY'}</span>
                    </button>

                    <a
                      href={asset.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>OPEN DRIVE</span>
                    </a>
                  </div>

                  <button
                    onClick={() => deleteDriveMediaAsset(asset.id)}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-red-950 border border-cyan-500/20 hover:border-red-500/40 text-slate-400 hover:text-red-400 cursor-pointer transition-all"
                    title="Delete Asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {duplicateReminder && (
        <NatashaReminderModal 
          data={duplicateReminder}
          onClose={() => setDuplicateReminder(null)}
        />
      )}
    </DraggableResizableWindow>
  );
};

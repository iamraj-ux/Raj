import React, { useState, useEffect } from 'react';
import { 
  FolderTree, Search, Sparkles, Volume2, ArrowLeft, Plus, 
  Edit3, Save, Trash2, CheckCircle2, Shield, Users, 
  Cpu, Wrench, ExternalLink, Bell, CheckSquare, MessageSquare, 
  ChevronRight, RefreshCw, Layers, Tag, Phone, Mail, MapPin, 
  Calendar, Cloud, Check, Copy, Share2
} from 'lucide-react';
import { DraggableResizableWindow } from './DraggableResizableWindow';
import { 
  CanonicalCategory, 
  CanonicalItem, 
  getStoredCanonicalCategories, 
  saveCanonicalCategories,
  updateCanonicalItem,
  addCanonicalItem,
  deleteCanonicalItem
} from '../services/canonicalCategoriesService';
import { speakNatasha } from '../services/soundEffects';
import { syncAllTextDataToBoth } from '../services/dualCloudSyncService';

interface CanonicalCategoriesExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategoryId?: string;
  onOpenWhatsAppViewer?: () => void;
  onOpenToolHub?: () => void;
}

export const CanonicalCategoriesExplorerModal: React.FC<CanonicalCategoriesExplorerModalProps> = ({
  isOpen,
  onClose,
  initialCategoryId,
  onOpenWhatsAppViewer,
  onOpenToolHub
}) => {
  const [categories, setCategories] = useState<CanonicalCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<CanonicalCategory | null>(null);
  const [activeItem, setActiveItem] = useState<CanonicalItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CanonicalItem>>({});
  const [natashaSpeechBubble, setNatashaSpeechBubble] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Load categories
  useEffect(() => {
    const cats = getStoredCanonicalCategories();
    setCategories(cats);

    if (initialCategoryId) {
      const found = cats.find(c => c.id === initialCategoryId);
      if (found) setActiveCategory(found);
    }
  }, [initialCategoryId, isOpen]);

  // Listen for storage updates
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail?.categories) {
        setCategories(e.detail.categories);
      }
    };
    window.addEventListener('canonical-categories-updated', handleUpdate);
    return () => window.removeEventListener('canonical-categories-updated', handleUpdate);
  }, []);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cpu': return <Cpu className="w-5 h-5 text-cyan-400" />;
      case 'Shield': return <Shield className="w-5 h-5 text-emerald-400" />;
      case 'Users': return <Users className="w-5 h-5 text-blue-400" />;
      case 'Wrench': return <Wrench className="w-5 h-5 text-amber-400" />;
      case 'CheckSquare': return <CheckSquare className="w-5 h-5 text-emerald-400" />;
      case 'Bell': return <Bell className="w-5 h-5 text-pink-400" />;
      case 'MessageSquare': return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case 'CheckCircle2': return <CheckCircle2 className="w-5 h-5 text-teal-400" />;
      default: return <FolderTree className="w-5 h-5 text-cyan-400" />;
    }
  };

  const handleAskNatashaCategory = (cat: CanonicalCategory, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const explanation = `${cat.name} (${cat.code}): ${cat.natashaSummary} Currently tracking ${cat.items.length} deep knowledge records.`;
    setNatashaSpeechBubble(explanation);
    speakNatasha(explanation);
  };

  const handleAskNatashaItem = (item: CanonicalItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const explanation = `Record "${item.title}": ${item.description} ${item.detailedNotes ? `Notes: ${item.detailedNotes}` : ''}`;
    setNatashaSpeechBubble(explanation);
    speakNatasha(explanation);
  };

  const handleGoInsideCategory = (cat: CanonicalCategory) => {
    setActiveCategory(cat);
    setActiveItem(null);
    setIsEditing(false);
    setNatashaSpeechBubble(`Entering category: ${cat.name}. You can browse all records or click any card to inspect and update details.`);
  };

  const handleGoInsideItem = (item: CanonicalItem) => {
    setActiveItem(item);
    setEditForm({ ...item });
    setIsEditing(false);
    setNatashaSpeechBubble(`Inspecting record: ${item.title}. You can view the complete intelligence or click 'Edit Details' to update any information.`);
  };

  const handleSaveItemChanges = async () => {
    if (!activeCategory || !activeItem) return;
    setIsSyncing(true);
    setSyncStatus('Syncing changes to both GitHub and Cloudinary...');

    try {
      const updated: CanonicalItem = {
        ...activeItem,
        ...editForm,
        title: editForm.title || activeItem.title,
        subtitle: editForm.subtitle || activeItem.subtitle,
        description: editForm.description || activeItem.description,
        detailedNotes: editForm.detailedNotes || activeItem.detailedNotes,
        tags: editForm.tags || activeItem.tags,
        lastUpdated: new Date().toISOString()
      };

      const updatedCategories = updateCanonicalItem(updated);
      setCategories(updatedCategories);
      setActiveItem(updated);
      setIsEditing(false);

      // Simultaneous sync to GitHub and Cloudinary!
      const syncResult = await syncAllTextDataToBoth(`Updated record: ${updated.title} in ${activeCategory.name}`);
      
      setSyncStatus(`Saved & Synced! GitHub SHA: ${syncResult.githubSha?.substring(0, 7) || 'Verified'} | Cloudinary Cloud Updated`);
      setTimeout(() => setSyncStatus(null), 5000);
    } catch (err: any) {
      console.error('Failed to save item:', err);
      setSyncStatus(`Error syncing: ${err.message || 'Check network'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddNewRecord = () => {
    if (!activeCategory) return;
    const newItem = addCanonicalItem(activeCategory.id, {
      title: 'New Knowledge Record',
      subtitle: 'Canonical record entry',
      status: 'ACTIVE',
      tags: ['new', activeCategory.id.replace('cat-', '')],
      description: 'Enter description here...',
      detailedNotes: 'Enter deep detailed notes and knowledge here...',
      keyPoints: ['First key point'],
      author: 'Jonathan Raj'
    });

    const updatedCats = getStoredCanonicalCategories();
    setCategories(updatedCats);
    const refreshedCat = updatedCats.find(c => c.id === activeCategory.id) || activeCategory;
    setActiveCategory(refreshedCat);
    handleGoInsideItem(newItem);
    setIsEditing(true);
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter(c => 
    !searchQuery || 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.items.some(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DraggableResizableWindow
      isOpen={isOpen}
      onClose={onClose}
      title="CANONICAL CATEGORIES ARCHITECTURE // CLICK-TO-ENTER DEEP INTELLIGENCE"
      subtitle="Recursive 'Click Go Inside' knowledge base, Ask Natasha voice breakdowns, and Dual Cloud Sync"
      icon={<FolderTree className="w-4 h-4 text-cyan-400" />}
      initialWidth={1040}
      initialHeight={720}
      headerActions={
        <div className="flex items-center gap-2 mr-2">
          {activeCategory && (
            <button
              onClick={handleAddNewRecord}
              className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add Record</span>
            </button>
          )}

          <button
            onClick={() => syncAllTextDataToBoth('Manual dual cloud sync from Canonical Categories')}
            className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            title="Sync all text data to both GitHub and Cloudinary"
          >
            <Share2 className="w-3 h-3 text-cyan-400" />
            <span>Dual Cloud Sync</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col h-full bg-slate-950 text-white font-sans text-xs">
        {/* Breadcrumb Navigation Bar */}
        <div className="p-3 bg-slate-900/90 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => { setActiveCategory(null); setActiveItem(null); setIsEditing(false); }}
              className={`hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer ${
                !activeCategory ? 'text-cyan-400' : 'text-slate-400'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>All Categories ({categories.length})</span>
            </button>

            {activeCategory && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <button
                  onClick={() => { setActiveItem(null); setIsEditing(false); }}
                  className={`hover:text-cyan-300 font-bold cursor-pointer ${
                    !activeItem ? 'text-cyan-400' : 'text-slate-400'
                  }`}
                >
                  {activeCategory.name} ({activeCategory.items.length})
                </button>
              </>
            )}

            {activeItem && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-emerald-400 font-bold truncate max-w-xs">
                  {activeItem.title}
                </span>
              </>
            )}
          </div>

          {/* Quick Search */}
          {!activeItem && (
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter categories & records..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}
        </div>

        {/* Natasha Speech Explanation Banner */}
        {natashaSpeechBubble && (
          <div className="p-3.5 bg-cyan-950/40 border-b border-cyan-500/30 flex items-start justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 block">
                  NATASHA CONTEXTUAL INTEL // AUTO-VOICE ACTIVE
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {natashaSpeechBubble}
                </p>
              </div>
            </div>
            <button
              onClick={() => setNatashaSpeechBubble(null)}
              className="text-[10px] text-slate-400 hover:text-white uppercase font-bold shrink-0"
            >
              Close
            </button>
          </div>
        )}

        {/* Sync Status Banner */}
        {syncStatus && (
          <div className="p-2.5 bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-300 flex items-center justify-between px-4 text-xs font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{syncStatus}</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: ROOT ALL CATEGORIES GRID (LEVEL 0) */}
        {/* ========================================================================= */}
        {!activeCategory && !activeItem && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 jarvis-scrollbar">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div>
                <h3 className="text-sm font-black text-cyan-300 uppercase tracking-wider">
                  CANONICAL CATEGORIES DIRECTORY
                </h3>
                <p className="text-[10px] text-slate-400">
                  Click any category to "Go Inside" and explore nested records, tasks, profiles, and media.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {filteredCategories.length} Categories Available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => handleGoInsideCategory(cat)}
                  className="p-4 bg-slate-900/70 border border-cyan-500/20 hover:border-cyan-400/60 rounded-2xl transition-all hover:shadow-[0_0_15px_rgba(34,211,238,0.15)] cursor-pointer group flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 group-hover:border-cyan-500/40">
                          {getCategoryIcon(cat.iconName)}
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold text-cyan-400 block">
                            {cat.code}
                          </span>
                          <h4 className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors">
                            {cat.name}
                          </h4>
                        </div>
                      </div>

                      {/* Ask Natasha Button on Category Card */}
                      <button
                        onClick={(e) => handleAskNatashaCategory(cat, e)}
                        className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Ask Natasha what is inside this category"
                      >
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>Ask Natasha</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono">
                      {cat.items.length} {cat.items.length === 1 ? 'Record' : 'Records'} Inside
                    </span>
                    <span className="text-cyan-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      <span>Click to Go Inside</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: INSIDE CATEGORY (LEVEL 1: LIST OF RECORDS) */}
        {/* ========================================================================= */}
        {activeCategory && !activeItem && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 jarvis-scrollbar">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveCategory(null)}
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase">{activeCategory.code}</span>
                  <h3 className="text-sm sm:text-base font-black text-white">{activeCategory.name}</h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Ask Natasha for Entire Category */}
                <button
                  onClick={() => handleAskNatashaCategory(activeCategory)}
                  className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ask Natasha About {activeCategory.name}</span>
                </button>

                <button
                  onClick={handleAddNewRecord}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Record</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 leading-relaxed">
              {activeCategory.description}
            </p>

            {/* List of items inside this category */}
            <div className="space-y-3">
              {activeCategory.items.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                  <p className="text-xs">No records inside this category yet.</p>
                  <button
                    onClick={handleAddNewRecord}
                    className="mt-3 px-4 py-2 bg-cyan-500 text-slate-950 font-black rounded-xl text-xs uppercase cursor-pointer"
                  >
                    Create First Record
                  </button>
                </div>
              ) : (
                activeCategory.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleGoInsideItem(item)}
                    className="p-4 bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 rounded-2xl transition-all cursor-pointer group space-y-2 hover:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors">
                            {item.title}
                          </h4>
                          {item.status && (
                            <span className="px-2 py-0.5 bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 rounded text-[9px] font-mono font-bold">
                              {item.status}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{item.subtitle}</p>
                      </div>

                      {/* Ask Natasha Button on Record Card */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => handleAskNatashaItem(item, e)}
                          className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Ask Natasha what is inside this record"
                        >
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span>Ask Natasha</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGoInsideItem(item);
                            setIsEditing(true);
                          }}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 text-[10px]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="px-2 py-0.5 bg-slate-950 rounded text-slate-400 border border-slate-800">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <span className="text-cyan-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                        <span>Click to Go Inside Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: INSIDE RECORD DETAILS & EDITING (LEVEL 2: DEEP WORKSPACE) */}
        {/* ========================================================================= */}
        {activeItem && activeCategory && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 jarvis-scrollbar">
            {/* Header / Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setActiveItem(null); setIsEditing(false); }}
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase">
                    {activeCategory.name} // {activeItem.id}
                  </span>
                  <h3 className="text-base font-black text-white">
                    {isEditing ? 'EDITING KNOWLEDGE RECORD' : activeItem.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Ask Natasha on this specific item */}
                <button
                  onClick={() => handleAskNatashaItem(activeItem)}
                  className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ask Natasha What Is This</span>
                </button>

                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveItemChanges}
                      disabled={isSyncing}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{isSyncing ? 'Saving...' : 'Save & Sync Cloud'}</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setEditForm({ ...activeItem });
                      setIsEditing(true);
                    }}
                    className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Details</span>
                  </button>
                )}
              </div>
            </div>

            {/* Editing Mode */}
            {isEditing ? (
              <div className="space-y-4 max-w-3xl bg-slate-900/60 p-5 rounded-2xl border border-cyan-500/30">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Record Title</label>
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Subtitle / Classification</label>
                  <input
                    type="text"
                    value={editForm.subtitle || ''}
                    onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Status</label>
                    <select
                      value={editForm.status || 'ACTIVE'}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white mt-1"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="HIGH_PRIORITY">HIGH_PRIORITY</option>
                      <option value="PENDING">PENDING</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Tags (Comma Separated)</label>
                    <input
                      type="text"
                      value={(editForm.tags || []).join(', ')}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                      })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Short Description</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white mt-1 h-20"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Detailed Notes & Knowledge</label>
                  <textarea
                    value={editForm.detailedNotes || ''}
                    onChange={(e) => setEditForm({ ...editForm, detailedNotes: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white mt-1 h-32 leading-relaxed"
                  />
                </div>

                <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl flex items-center justify-between text-[11px] text-slate-300">
                  <span>Saving updates both local storage and automatically syncs to <strong>GitHub & Cloudinary</strong>.</span>
                  <button
                    onClick={handleSaveItemChanges}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl uppercase text-xs cursor-pointer shadow-md"
                  >
                    Save & Sync Now
                  </button>
                </div>
              </div>
            ) : (
              /* Inspection / Reading Mode */
              <div className="space-y-4 max-w-3xl">
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-cyan-400">{activeItem.subtitle}</span>
                    {activeItem.status && (
                      <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-mono font-bold">
                        {activeItem.status}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-100 font-sans leading-relaxed">
                    {activeItem.description}
                  </p>
                </div>

                {/* Detailed Notes */}
                {activeItem.detailedNotes && (
                  <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-2">
                    <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider block">
                      DEEP KNOWLEDGE NOTES & ANALYSIS
                    </span>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
                      {activeItem.detailedNotes}
                    </p>
                  </div>
                )}

                {/* Key Points */}
                {activeItem.keyPoints && activeItem.keyPoints.length > 0 && (
                  <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-2">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">
                      KEY VERIFIED POINTS
                    </span>
                    <div className="space-y-1.5">
                      {activeItem.keyPoints.map((kp, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{kp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metrics */}
                {activeItem.metrics && Object.keys(activeItem.metrics).length > 0 && (
                  <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-2">
                    <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider block">
                      PERFORMANCE & SYSTEM METRICS
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(activeItem.metrics).map(([k, v]) => (
                        <div key={k} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-[9px] text-slate-400 uppercase block">{k}</span>
                          <span className="text-xs font-bold text-white">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                {activeItem.contactInfo && (
                  <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-2">
                    <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider block">
                      COMMUNICATION & TELEPHONY
                    </span>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {activeItem.contactInfo.phone && (
                        <div className="flex items-center gap-1.5 text-emerald-300">
                          <Phone className="w-3.5 h-3.5" />
                          <span className="font-mono">{activeItem.contactInfo.phone}</span>
                        </div>
                      )}
                      {activeItem.contactInfo.email && (
                        <div className="flex items-center gap-1.5 text-cyan-300">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{activeItem.contactInfo.email}</span>
                        </div>
                      )}
                      {activeItem.contactInfo.location && (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{activeItem.contactInfo.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags & Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {activeItem.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-300">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <span className="font-mono">
                    Last updated: {new Date(activeItem.lastUpdated).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DraggableResizableWindow>
  );
};

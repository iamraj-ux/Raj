import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Copy, Check, Search, Trash2, RefreshCw, X, Shield, 
  MessageSquare, FileText, FolderOpen, Lock, Unlock, Database, 
  Server, Sparkles, Cpu, Layers, Clock
} from 'lucide-react';
import { 
  getStoredActivities, 
  getVisitCount, 
  clearAllActivities, 
  ActivityItem 
} from '../services/activityLogger';
import { DraggableResizableWindow } from './DraggableResizableWindow';

interface AllSystemActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  inlineView?: boolean; // if true, renders inside Natasha tab container without overlay background
}

export const AllSystemActivitiesModal: React.FC<AllSystemActivitiesModalProps> = ({
  isOpen,
  onClose,
  inlineView = false
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  const visitCount = getVisitCount();

  const loadActivities = () => {
    const data = getStoredActivities();
    setActivities(data);
  };

  useEffect(() => {
    if (isOpen || inlineView) {
      loadActivities();
    }

    const handleUpdate = () => {
      setTimeout(() => {
        loadActivities();
      }, 0);
    };
    window.addEventListener('system-activity-logged', handleUpdate);
    return () => window.removeEventListener('system-activity-logged', handleUpdate);
  }, [isOpen, inlineView]);

  // Copy single item to clipboard
  const handleCopySingle = (item: ActivityItem) => {
    const textToCopy = `[${item.timestamp}] [${item.category}] ${item.title}\nEXPLANATION: ${item.description}${item.details ? `\nDETAILS: ${item.details}` : ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy all logs to clipboard
  const handleCopyAll = () => {
    if (activities.length === 0) return;
    const header = `=== RAJ EXPO DIGITALS // ALL SYSTEM ACTIVITIES AUDIT LOG ===\nTotal App Visits: ${visitCount} | Total Recorded Activities: ${activities.length}\nGenerated: ${new Date().toLocaleString()}\n\n`;
    const body = activities.map((item, idx) => 
      `${idx + 1}. [${item.timestamp}] [${item.category}]\n   ACTION: ${item.title}\n   EXPLANATION: ${item.description}${item.details ? `\n   DETAILS: ${item.details}` : ''}\n`
    ).join('\n---\n\n');

    navigator.clipboard.writeText(header + body);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear all recorded system activity logs?")) {
      clearAllActivities();
      setActivities([]);
    }
  };

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return activities.filter(item => {
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.details && item.details.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [activities, selectedCategory, searchQuery]);

  // Category Icon & Color Resolver
  const renderCategoryBadge = (cat: ActivityItem['category']) => {
    switch (cat) {
      case 'VISIT':
        return { label: 'APP VISIT', icon: <Clock className="w-3.5 h-3.5" />, style: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'CHAT':
        return { label: 'NATASHA CHAT', icon: <MessageSquare className="w-3.5 h-3.5" />, style: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      case 'FILE_UPLOAD':
        return { label: 'FILE UPLOAD', icon: <FileText className="w-3.5 h-3.5" />, style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'PDF_COUNT':
        return { label: 'PDF COUNTING', icon: <Layers className="w-3.5 h-3.5" />, style: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'WEBAPP':
        return { label: 'WEBAPP LAUNCH', icon: <FolderOpen className="w-3.5 h-3.5" />, style: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'LOCK_UNLOCK':
        return { label: 'LOCK / UNLOCK', icon: <Lock className="w-3.5 h-3.5" />, style: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      case 'DATABASE':
        return { label: 'DATABASE', icon: <Database className="w-3.5 h-3.5" />, style: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
      case 'SERVER_TASK':
        return { label: 'SERVER TASK', icon: <Server className="w-3.5 h-3.5" />, style: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
      case 'THEME_ANIM':
        return { label: 'THEME / SHIFT', icon: <Sparkles className="w-3.5 h-3.5" />, style: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40' };
      default:
        return { label: cat, icon: <Activity className="w-3.5 h-3.5" />, style: 'bg-slate-700 text-slate-300 border-slate-600' };
    }
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-950 font-mono text-xs text-white select-none">
      {/* HEADER BAR */}
      <div className="p-5 bg-slate-900/90 border-b border-cyan-500/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-amber-300 to-purple-400 uppercase tracking-wider">
              ALL SYSTEM ACTIVITIES & AUDIT LOGS
            </h2>
            <p className="text-[10px] text-cyan-400/70 uppercase tracking-widest">
              Real-time telemetry of visits, chats, PDF counting, files & webapp actions
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAll}
            className={`px-3.5 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
              copiedAll 
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-emerald-500/30' 
                : 'bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 border-cyan-400/50 shadow-cyan-500/20 hover:scale-105 active:scale-95'
            }`}
          >
            {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span>{copiedAll ? 'COPIED ALL LOGS!' : 'COPY ALL LOGS'}</span>
          </button>

          <button
            onClick={loadActivities}
            className="p-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition-all cursor-pointer"
            title="Refresh Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleClear}
            className="p-2 rounded-xl bg-slate-900 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
            title="Clear All Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {!inlineView && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* KPI METRIC SUMMARY BANNER */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-slate-950 border-b border-cyan-500/20 text-center text-[10px] font-mono">
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-blue-500/30 flex flex-col items-center">
          <span className="text-blue-400/70 font-bold uppercase tracking-widest">APP VISITS</span>
          <span className="text-lg font-black text-blue-300 mt-0.5">{visitCount} TIMES</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-cyan-500/30 flex flex-col items-center">
          <span className="text-cyan-400/70 font-bold uppercase tracking-widest">NATASHA CHATS</span>
          <span className="text-lg font-black text-cyan-300 mt-0.5">
            {activities.filter(a => a.category === 'CHAT').length} LOGS
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-amber-500/30 flex flex-col items-center">
          <span className="text-amber-400/70 font-bold uppercase tracking-widest">PDF & DOC JOBS</span>
          <span className="text-lg font-black text-amber-300 mt-0.5">
            {activities.filter(a => a.category === 'PDF_COUNT').length} JOBS
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-emerald-500/30 flex flex-col items-center">
          <span className="text-emerald-400/70 font-bold uppercase tracking-widest">FILES ANALYZED</span>
          <span className="text-lg font-black text-emerald-300 mt-0.5">
            {activities.filter(a => a.category === 'FILE_UPLOAD').length} FILES
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-purple-500/30 flex flex-col items-center col-span-2 sm:col-span-1">
          <span className="text-purple-400/70 font-bold uppercase tracking-widest">WEBAPPS LAUNCHED</span>
          <span className="text-lg font-black text-purple-300 mt-0.5">
            {activities.filter(a => a.category === 'WEBAPP').length} APPS
          </span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 bg-slate-900/60 border-b border-cyan-500/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities by keyword, file name, chat phrase, or status..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-cyan-500/30 text-cyan-200 placeholder-cyan-500/40 focus:outline-none focus:border-cyan-400 text-xs font-mono"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto jarvis-scrollbar py-0.5 text-[10px]">
          {['ALL', 'VISIT', 'CHAT', 'PDF_COUNT', 'FILE_UPLOAD', 'WEBAPP', 'LOCK_UNLOCK', 'DATABASE', 'SERVER_TASK', 'THEME_ANIM'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                  : 'bg-slate-950 text-cyan-400/80 border-cyan-500/20 hover:border-cyan-500/50 hover:text-cyan-200'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ACTIVITY LOG ENTRIES LIST */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 jarvis-scrollbar bg-slate-950/90">
        {filteredActivities.length === 0 ? (
          <div className="p-12 text-center text-cyan-400/60 font-mono space-y-3">
            <Shield className="w-10 h-10 text-cyan-500/40 mx-auto animate-pulse" />
            <p className="text-sm uppercase tracking-widest font-bold">No Activity Logs Found</p>
            <p className="text-[10px] text-slate-400">Perform actions in the app to record live telemetry logs.</p>
          </div>
        ) : (
          filteredActivities.map((item) => {
            const badge = renderCategoryBadge(item.category);
            const isCopied = copiedId === item.id;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/25 hover:border-cyan-400/60 transition-all shadow-md flex flex-col sm:flex-row sm:items-start justify-between gap-4 group hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
              >
                <div className="space-y-2 flex-1">
                  {/* Badge & Timestamp */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${badge.style}`}>
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400/60" />
                      {item.timestamp}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xs font-black text-cyan-200 uppercase tracking-wide group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>

                  {/* Detailed Explanation */}
                  <p className="text-[11px] text-slate-300 leading-relaxed font-mono bg-slate-950/60 p-2.5 rounded-xl border border-cyan-500/15">
                    <span className="text-cyan-400/80 font-bold uppercase tracking-wider block text-[9px] mb-0.5">EXPLANATION & ACTION DETAILS:</span>
                    {item.description}
                  </p>

                  {/* Additional Parameters/Details snippet if available */}
                  {item.details && (
                    <div className="text-[10px] text-emerald-300/90 font-mono bg-emerald-950/20 p-2 rounded-lg border border-emerald-500/20 tracking-wider">
                      <span className="text-emerald-500 font-bold">PARAMS: </span>
                      {item.details}
                    </div>
                  )}
                </div>

                {/* SMALL COPY BUTTON FOR INDIVIDUAL LOG ITEM */}
                <div className="shrink-0 self-end sm:self-start">
                  <button
                    onClick={() => handleCopySingle(item)}
                    className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                      isCopied
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                        : 'bg-slate-950 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:border-cyan-400'
                    }`}
                    title="Copy this specific log entry to clipboard"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>{isCopied ? 'COPIED!' : 'COPY'}</span>
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* FOOTER BAR */}
      <div className="p-3 bg-slate-900 border-t border-cyan-500/30 text-[10px] text-cyan-400/60 font-mono flex items-center justify-between">
        <span>RAJ EXPO AUDIT TRAIL // AES-256 SECURED LOGGING ENGINE</span>
        <span>SHOWING {filteredActivities.length} OF {activities.length} RECORDED EVENTS</span>
      </div>
    </div>
  );

  if (inlineView) {
    return content;
  }

  return (
    <DraggableResizableWindow
      isOpen={isOpen}
      onClose={onClose}
      title="ALL SYSTEM ACTIVITIES & AUDIT LOGS"
      subtitle="Real-time telemetry of visits, chats, PDF counting, files & webapp actions"
      icon={<Activity className="w-5 h-5 text-cyan-400 animate-pulse" />}
      initialWidth={960}
      initialHeight={680}
    >
      {content}
    </DraggableResizableWindow>
  );
};

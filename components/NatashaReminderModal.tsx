import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, RefreshCw, XCircle, History, Volume2, 
  Cpu, Calendar, FileText, Check, ShieldAlert, Sparkles, X,
  Maximize2, Minimize2
} from 'lucide-react';
import { soundManager, speakNatasha, stopNatashaSpeech } from '../services/soundEffects';

const natashaLogo = "/src/assets/images/natasha_avatar_cyber_1788833359873.jpg";

export interface DuplicateReminderPayload {
  itemType: 'MEMORY' | 'ENTITY' | 'DRIVE_ASSET' | 'FILE' | 'DOCUMENT';
  existingTitle: string;
  existingDate: string;
  existingCategory?: string;
  existingDescription?: string;
  newTitle: string;
  newCategory?: string;
  newDescription?: string;
  onUpdateWithNewDate: () => void;
  onIgnore: () => void;
  onReplaceSameDate: () => void;
}

export type DuplicateReminderData = DuplicateReminderPayload;

interface NatashaReminderModalProps {
  data: DuplicateReminderPayload | null;
  onClose: () => void;
}

export const NatashaReminderModal: React.FC<NatashaReminderModalProps> = ({
  data,
  onClose
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (data) {
      // Play reminder sound
      soundManager.playReminderSound();

      // Natasha speaks in female English voice
      setIsSpeaking(true);
      const speechText = `Boss, this information already exists in your system. Would you like to update it with a new date, ignore it, or replace it with the same date?`;
      speakNatasha(speechText, () => setIsSpeaking(false));
    }

    return () => {
      stopNatashaSpeech();
      setIsSpeaking(false);
    };
  }, [data]);

  if (!data) return null;

  const handleReplayVoice = () => {
    setIsSpeaking(true);
    const speechText = `Boss, this item already exists in the system. How would you like me to handle this duplicate?`;
    speakNatasha(speechText, () => setIsSpeaking(false));
  };

  const handleAction = (action: 'update' | 'ignore' | 'replace') => {
    stopNatashaSpeech();
    soundManager.playAccessGrantedSound();

    if (action === 'update') {
      data.onUpdateWithNewDate();
    } else if (action === 'ignore') {
      data.onIgnore();
    } else if (action === 'replace') {
      data.onReplaceSameDate();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-text pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            width: isMaximized ? '96vw' : '720px',
            height: isMinimized ? 'auto' : (isMaximized ? '92vh' : 'auto')
          }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="bg-slate-950 border-2 border-amber-500/60 rounded-2xl shadow-[0_0_80px_rgba(245,158,11,0.35)] flex flex-col overflow-hidden max-w-full relative"
        >
          {/* WINDOW HEADER BAR WITH CONTROLS */}
          <div className="px-4 py-3 bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-slate-950 border-b border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-black tracking-widest text-amber-300 uppercase flex items-center gap-1.5">
                  <span>NATASHA V.I. // DUPLICATE INFORMATION REMINDER</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-400 rounded font-mono border border-amber-500/30">
                    {data.itemType}
                  </span>
                </h3>
                <p className="text-[9px] font-mono text-slate-400">
                  Priority System Alert for Boss // Existing Data Conflict Detected
                </p>
              </div>
            </div>

            {/* Window control buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleReplayVoice}
                title="Replay Natasha's Voice"
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isSpeaking 
                    ? 'bg-amber-500/30 border-amber-400 text-amber-300 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-amber-300 hover:border-amber-500/50'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Restore" : "Minimize"}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? "Restore Size" : "Maximize"}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleAction('ignore')}
                title="Close and Ignore"
                className="p-1.5 rounded-lg bg-slate-900 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 jarvis-scrollbar max-h-[75vh]">
              {/* NATASHA SPEECH BANNER */}
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3.5">
                <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-cyan-400 shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                  <img src={natashaLogo} alt="Natasha" className="w-full h-full object-cover" />
                  {isSpeaking && (
                    <div className="absolute inset-0 bg-cyan-400/20 animate-pulse" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider uppercase">
                      Natasha V.I. Verbal Reminder
                    </span>
                    {isSpeaking && (
                      <span className="flex items-center gap-1 text-[9px] font-mono text-cyan-400 animate-pulse">
                        <Volume2 className="w-3 h-3" /> [Speaking in Female Voice...]
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-amber-100 font-medium leading-relaxed">
                    "Boss, this information already exists in your database! How would you like me to resolve this duplicate? Please select one of the three options below."
                  </p>
                </div>
              </div>

              {/* DATA COMPARISON GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                {/* EXISTING RECORD */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                    <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" /> Existing Stored Record
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      CURRENT
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <p className="text-white font-bold truncate">
                      <span className="text-cyan-400/70">Title:</span> {data.existingTitle}
                    </p>
                    <p className="text-slate-300">
                      <span className="text-cyan-400/70">Category:</span> {data.existingCategory || 'General'}
                    </p>
                    <p className="text-amber-300/90 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      <span className="text-cyan-400/70">Date:</span> {data.existingDate}
                    </p>
                    {data.existingDescription && (
                      <div className="p-2 rounded bg-slate-950 border border-cyan-500/10 text-[10px] text-slate-300 line-clamp-3 leading-relaxed">
                        {data.existingDescription}
                      </div>
                    )}
                  </div>
                </div>

                {/* NEW INCOMING RECORD */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/40 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                    <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> New Incoming Entry
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      INCOMING
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <p className="text-white font-bold truncate">
                      <span className="text-amber-400/70">Title:</span> {data.newTitle}
                    </p>
                    <p className="text-slate-300">
                      <span className="text-amber-400/70">Category:</span> {data.newCategory || 'General'}
                    </p>
                    <p className="text-emerald-300 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-400" />
                      <span className="text-amber-400/70">New Date:</span> {new Date().toLocaleString()}
                    </p>
                    {data.newDescription && (
                      <div className="p-2 rounded bg-slate-950 border border-amber-500/10 text-[10px] text-slate-300 line-clamp-3 leading-relaxed">
                        {data.newDescription}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3 SPECIFIED ACTION BUTTONS AS REQUESTED */}
              <div className="pt-2 border-t border-slate-800 space-y-2.5">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest text-center">
                  Select Directive for Natasha:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* BUTTON 1: UPDATE WITH NEW DATE */}
                  <button
                    type="button"
                    onClick={() => handleAction('update')}
                    className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-2 border-emerald-500/60 hover:border-emerald-400 hover:bg-emerald-500/30 text-emerald-200 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer group shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.35)]"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <span className="font-black text-xs uppercase tracking-wider text-emerald-300">
                      Update with new date
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400/70">
                      Apply updates & set date to now
                    </span>
                  </button>

                  {/* BUTTON 2: IGNORE */}
                  <button
                    type="button"
                    onClick={() => handleAction('ignore')}
                    className="p-3.5 rounded-xl bg-gradient-to-br from-red-500/15 to-slate-900 border-2 border-red-500/40 hover:border-red-400 hover:bg-red-500/25 text-red-200 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer group shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:shadow-[0_0_25px_rgba(239,68,68,0.3)]"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                      <XCircle className="w-4 h-4" />
                    </div>
                    <span className="font-black text-xs uppercase tracking-wider text-red-300">
                      Ignore
                    </span>
                    <span className="text-[9px] font-mono text-red-400/70">
                      Discard new and keep existing
                    </span>
                  </button>

                  {/* BUTTON 3: REPLACE WITH A SAME DATE */}
                  <button
                    type="button"
                    onClick={() => handleAction('replace')}
                    className="p-3.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border-2 border-amber-500/60 hover:border-amber-400 hover:bg-amber-500/30 text-amber-200 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer group shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_25px_rgba(245,158,11,0.35)]"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                      <History className="w-4 h-4" />
                    </div>
                    <span className="font-black text-xs uppercase tracking-wider text-amber-300">
                      Replace with a same date
                    </span>
                    <span className="text-[9px] font-mono text-amber-400/70">
                      Overwrite info, keep original date
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

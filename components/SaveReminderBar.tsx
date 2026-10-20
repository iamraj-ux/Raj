import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Clock, X, CheckCircle2 } from 'lucide-react';
import { hasUnsavedChanges, commitDatabaseSave } from '../services/peopleDatabaseService';
import { soundManager } from '../services/soundEffects';

export const SaveReminderBar: React.FC = () => {
  const [showReminder, setShowReminder] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [lastSavedText, setLastSavedText] = useState('Updated just now');

  // Check every 15 minutes (or 900,000ms, with initial check after 2 minutes)
  useEffect(() => {
    const checkUnsaved = () => {
      if (hasUnsavedChanges()) {
        setShowReminder(true);
        soundManager.playReminderSound();
      }
    };

    const initialTimer = setTimeout(checkUnsaved, 120000); // 2 min
    const intervalTimer = setInterval(checkUnsaved, 900000); // 15 min

    const handleSavedEvent = () => {
      setJustSaved(true);
      setShowReminder(false);
      setLastSavedText('Updated just now');
      setTimeout(() => setJustSaved(false), 4000);
    };

    const handleNatashaMessage = (e: any) => {
      const text = (e.detail?.text || '').toLowerCase();
      // If user replies "okay" to save prompt
      if (text.includes('okay') || text.includes('ok') || text.includes('save now')) {
        commitDatabaseSave();
        handleSavedEvent();
      }
    };

    window.addEventListener('database-saved-event', handleSavedEvent);
    window.addEventListener('natasha-message-sent', handleNatashaMessage);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      window.removeEventListener('database-saved-event', handleSavedEvent);
      window.removeEventListener('natasha-message-sent', handleNatashaMessage);
    };
  }, []);

  const handleSaveNow = () => {
    commitDatabaseSave();
    soundManager.playAccessGrantedSound();
    setJustSaved(true);
    setShowReminder(false);
    setTimeout(() => setJustSaved(false), 4000);
  };

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] max-w-xl w-[92%] sm:w-auto font-mono text-xs">
      <AnimatePresence>
        {showReminder && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-950/95 border-2 border-amber-400/80 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.35)] backdrop-blur-xl text-amber-200"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
              <span className="font-bold text-[11px] tracking-wider uppercase">
                Local database has unsaved changes. Save now?
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleSaveNow}
                className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1"
                title="Save database changes to local storage"
              >
                <Save className="w-3 h-3" />
                <span>Save Now</span>
              </button>

              <button
                onClick={() => setShowReminder(false)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-[10px] uppercase transition-all cursor-pointer"
                title="Remind me later"
              >
                Later
              </button>

              <button
                onClick={() => setShowReminder(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
                title="Dismiss reminder"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {justSaved && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-950/95 border border-emerald-500/60 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.3)] backdrop-blur-xl text-emerald-200"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold text-[11px] tracking-wider uppercase">
              ✓ Database Saved — {lastSavedText}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

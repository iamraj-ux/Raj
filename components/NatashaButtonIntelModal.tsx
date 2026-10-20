import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, X, Volume2, Square, Play, Shield, Folder, 
  Zap, ArrowRight, CornerDownRight, CheckCircle2, Search,
  Radio, Compass, ChevronRight, Layers, Lock, ExternalLink
} from 'lucide-react';
import { 
  ButtonIntel, 
  BUTTON_INTEL_REGISTRY 
} from '../services/buttonIntelligenceService';
import { soundManager, speakNatasha, stopNatashaSpeech } from '../services/soundEffects';

export interface NatashaButtonIntelModalProps {
  isOpen: boolean;
  intel: ButtonIntel | null;
  onClose: () => void;
  onSelectAnotherIntel?: (newIntel: ButtonIntel) => void;
  onExecuteCurrentButton?: () => void;
  isInspectorModeActive?: boolean;
  onToggleInspectorMode?: () => void;
}

export const NatashaButtonIntelModal: React.FC<NatashaButtonIntelModalProps> = ({
  isOpen,
  intel,
  onClose,
  onSelectAnotherIntel,
  onExecuteCurrentButton,
  isInspectorModeActive,
  onToggleInspectorMode
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [isBrowseAllOpen, setIsBrowseAllOpen] = useState(false);

  // Automatically speak Natasha's voice description when modal opens or intel changes
  useEffect(() => {
    if (!isOpen || !intel) {
      stopNatashaSpeech();
      setIsSpeaking(false);
      return;
    }

    soundManager.playAccessGrantedSound();
    setIsSpeaking(true);

    // Give audio a brief 150ms buffer for modal entrance animation
    const timer = setTimeout(() => {
      speakNatasha(intel.voiceScript, () => {
        setIsSpeaking(false);
      });
    }, 200);

    return () => {
      clearTimeout(timer);
      stopNatashaSpeech();
      setIsSpeaking(false);
    };
  }, [isOpen, intel?.id]);

  if (!isOpen || !intel) return null;

  const handleReplayVoice = () => {
    soundManager.playClickSound();
    stopNatashaSpeech();
    setIsSpeaking(true);
    speakNatasha(intel.voiceScript, () => {
      setIsSpeaking(false);
    });
  };

  const handleStopVoice = () => {
    soundManager.playClickSound();
    stopNatashaSpeech();
    setIsSpeaking(false);
  };

  const allRegistryItems = Object.values(BUTTON_INTEL_REGISTRY);
  const filteredRegistry = allRegistryItems.filter(item => 
    item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.tag.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.shortDesc.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div 
        id="natasha-button-intel-modal-backdrop"
        className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 font-mono select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          id="natasha-button-intel-card"
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-3xl max-h-[92vh] bg-slate-900/95 border-2 border-cyan-400/80 rounded-3xl shadow-[0_0_80px_rgba(34,211,238,0.35)] flex flex-col overflow-hidden relative"
        >
          {/* Top glowing neon accent line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-purple-500" />

          {/* Modal Header */}
          <div className="px-5 py-4 bg-slate-950/95 border-b border-cyan-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 relative shadow-inner">
                <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
                {isSpeaking && (
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-ping absolute -top-1 -right-1" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40 font-bold uppercase tracking-widest">
                    NATASHA BUTTON INTEL
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold uppercase">
                    {intel.tag}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider mt-0.5 flex items-center gap-2">
                  {intel.name}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundManager.playClickSound();
                  setIsBrowseAllOpen(!isBrowseAllOpen);
                }}
                className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                  isBrowseAllOpen
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-400 hover:text-white'
                }`}
                title="Select another button from system directory"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isBrowseAllOpen ? 'Hide Directory' : 'All Buttons'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Intelligence Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Audio Broadcast Bar */}
          <div className="px-5 py-2.5 bg-slate-950/90 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Radio className={`w-4 h-4 ${isSpeaking ? 'text-pink-400 animate-pulse' : 'text-purple-400'}`} />
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-300">
                  {isSpeaking ? (
                    <strong className="text-pink-300 flex items-center gap-1.5">
                      <span>Natasha Speaking...</span>
                      <span className="inline-flex gap-0.5 items-end h-3">
                        <span className="w-1 h-2 bg-pink-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-3.5 bg-purple-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1.5 bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </strong>
                  ) : (
                    <span className="text-slate-400 font-mono">Female Synthesizer Active (Auto-Speaks Intel)</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isSpeaking ? (
                <button
                  type="button"
                  onClick={handleStopVoice}
                  className="px-3 py-1 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-400/80 rounded-xl text-[10px] font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <Square className="w-3 h-3 fill-red-400 text-red-400" />
                  <span>Stop Speech</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleReplayVoice}
                  className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 rounded-xl text-[10px] font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-sm transition-all hover:scale-105"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Listen Again</span>
                </button>
              )}
            </div>
          </div>

          {/* Modal Body: Scrollable Content & Deep Architectural Inspection */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 jarvis-scrollbar">
            
            {/* All Buttons Quick Selector Drawer */}
            {isBrowseAllOpen && (
              <div className="p-4 bg-slate-950/90 border border-cyan-500/40 rounded-2xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Compass className="w-4 h-4" />
                    SELECT ANY BUTTON TO INSPECT:
                  </span>
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search button name..."
                    className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-[10px] focus:outline-none focus:border-cyan-400 font-mono w-40"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto jarvis-scrollbar pr-1">
                  {filteredRegistry.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        soundManager.playClickSound();
                        onSelectAnotherIntel?.(item);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        item.id === intel.id
                          ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-sm'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="text-[11px] font-bold uppercase truncate">{item.name}</div>
                      <div className="text-[9px] text-slate-400 truncate mt-0.5">{item.tag}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 1. Primary Purpose Overview */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-2">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                1. WHAT THIS BUTTON DOES // PRIMARY OBJECTIVE
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                {intel.shortDesc}
              </p>
            </div>

            {/* 2. What Is Inside (Subfolders, APIs, Modules & Tools) */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-purple-400" />
                  2. WHAT IS INSIDE // SUB-MODULES & ARCHITECTURAL CONTENTS
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40 font-bold">
                  {intel.whatIsInside.length} Components
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {intel.whatIsInside.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-start gap-2 text-slate-300 hover:border-purple-400/40 transition-colors"
                  >
                    <CornerDownRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Execution Effects & State Changes */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-2.5">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                3. EXECUTION EFFECTS // STATE & DATA LOGIC
              </span>
              <div className="space-y-1.5">
                {intel.executionEffects.map((eff, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-300 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{eff}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Security Clearance & Meta Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center gap-3">
                <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block">Security Clearance</span>
                  <span className="text-[11px] font-bold text-amber-300">{intel.securityClearance}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block">Target Category</span>
                  <span className="text-[11px] font-bold text-cyan-300">{intel.category}</span>
                </div>
                {intel.keyboardShortcut && (
                  <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300 font-mono font-bold">
                    {intel.keyboardShortcut}
                  </span>
                )}
              </div>
            </div>

            {/* Spoken Voice Script Preview */}
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-1">
              <span className="text-[9px] text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-purple-400" />
                NATASHA VOICE TRANSCRIPTION:
              </span>
              <p className="text-[11px] text-purple-200/90 italic leading-relaxed">
                "{intel.voiceScript}"
              </p>
            </div>

          </div>

          {/* Modal Footer Controls */}
          <div className="px-5 py-3.5 bg-slate-950/95 border-t border-cyan-500/30 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleInspectorMode}
                className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold font-mono uppercase flex items-center gap-1.5 cursor-pointer transition-all ${
                  isInspectorModeActive
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/80 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title="Toggle Natasha Button Inspector on screen"
              >
                <span>🎯 Inspector Mode: {isInspectorModeActive ? 'ACTIVE' : 'STANDBY'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {onExecuteCurrentButton && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClickSound();
                    onClose();
                    onExecuteCurrentButton();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 rounded-xl text-[11px] font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:scale-105 active:scale-95 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Execute This Button</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer border border-slate-700"
              >
                Close Intel
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Sliders, Volume2, VolumeX, Move, RotateCcw, 
  MousePointer, Zap, Shield, Check, Crosshair
} from 'lucide-react';
import { 
  getStoredTouchpadSettings, 
  saveTouchpadSettings, 
  DEFAULT_TOUCHPAD_SETTINGS, 
  TouchpadSettings 
} from '../services/touchpadService';
import { soundManager } from '../services/soundEffects';

interface TouchpadSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TouchpadSettingsModal: React.FC<TouchpadSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [settings, setSettings] = useState<TouchpadSettings>(getStoredTouchpadSettings());
  const [testClickCount, setTestClickCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setSettings(getStoredTouchpadSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdate = (updates: Partial<TouchpadSettings>) => {
    const updated = saveTouchpadSettings(updates);
    setSettings(updated);
    if (settings.soundFeedback) {
      soundManager.playClickSound();
    }
  };

  const handleResetPosition = () => {
    handleUpdate({
      padPosition: {
        x: Math.max(20, window.innerWidth - 380),
        y: Math.max(20, window.innerHeight - 340)
      },
      cursorPosition: {
        x: Math.max(50, window.innerWidth - 220),
        y: Math.max(50, window.innerHeight - 300)
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-slate-950/95 border border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col font-mono text-xs text-slate-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/30 bg-cyan-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-cyan-400 bg-cyan-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.5)]">
              <Sliders className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm tracking-wider uppercase">
                Holographic Touchpad Settings
              </h3>
              <p className="text-[10px] text-cyan-400/80">
                Precision Controller & Virtual Cursor Calibration
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClickSound();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-red-400 hover:text-red-400 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh] jarvis-scrollbar">
          {/* 1. Touchpad Visibility & Move Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Active Touchpad</span>
                <span className="text-[10px] text-slate-400">Show on screen</span>
              </div>
              <button
                onClick={() => handleUpdate({ enabled: !settings.enabled })}
                className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                  settings.enabled ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Move Pad Mode</span>
                <span className="text-[10px] text-slate-400">Drag to reposition</span>
              </div>
              <button
                onClick={() => handleUpdate({ movePadMode: !settings.movePadMode })}
                className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                  settings.movePadMode ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </div>

          {/* 2. Pad Size Selection */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/20 space-y-2">
            <label className="font-bold text-cyan-300 block text-[11px] uppercase tracking-wider">
              Touchpad Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'medium', 'large'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => handleUpdate({ size: s })}
                  className={`py-2 px-3 rounded-xl border text-center uppercase tracking-wider font-bold transition cursor-pointer ${
                    settings.size === s
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-950 text-slate-400 border-slate-700 hover:border-cyan-500/40 hover:text-white'
                  }`}
                >
                  {s === 'small' ? 'Compact (180px)' : s === 'medium' ? 'Standard (230px)' : 'Expanded (280px)'}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Sensitivity Slider */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/20 space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-bold text-cyan-300 block text-[11px] uppercase tracking-wider">
                Touch Sensitivity
              </label>
              <span className="text-cyan-400 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                {settings.sensitivity.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={settings.sensitivity}
              onChange={(e) => handleUpdate({ sensitivity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>Low (Precise)</span>
              <span>Balanced (1.25x)</span>
              <span>Ultra-Fast (2.5x)</span>
            </div>
          </div>

          {/* 4. Audio Feedback Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {settings.soundFeedback ? (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
              <div>
                <span className="font-bold text-white block">Click Audio Feedback</span>
                <span className="text-[10px] text-slate-400">Play mechanical click sound on tap</span>
              </div>
            </div>
            <button
              onClick={() => handleUpdate({ soundFeedback: !settings.soundFeedback })}
              className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                settings.soundFeedback ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* 5. Interactive Test Click Target Area */}
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 text-center space-y-2">
            <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-widest block">
              Test Area: Aim virtual cursor here and tap
            </span>
            <button
              id="touchpad-test-target"
              onClick={() => {
                setTestClickCount(c => c + 1);
                if (settings.soundFeedback) soundManager.playAccessGrantedSound();
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] transition cursor-pointer"
            >
              🎯 Tap to Test Cursor ({testClickCount} Clicks)
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/90 border-t border-cyan-500/20 flex items-center justify-between">
          <button
            onClick={handleResetPosition}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[10px] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reset Position</span>
          </button>
          <button
            onClick={() => {
              soundManager.playClickSound();
              onClose();
            }}
            className="px-5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] uppercase tracking-wider transition cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};

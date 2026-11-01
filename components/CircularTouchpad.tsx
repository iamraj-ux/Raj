import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Sliders } from 'lucide-react';
import { 
  getStoredTouchpadSettings, 
  saveTouchpadSettings, 
  dispatchVirtualCursorClick, 
  dispatchVirtualCursorRightClick,
  TouchpadSettings 
} from '../services/touchpadService';
import { soundManager } from '../services/soundEffects';
import { TouchpadSettingsModal } from './TouchpadSettingsModal';

export const CircularTouchpad: React.FC = () => {
  const [settings, setSettings] = useState<TouchpadSettings>(getStoredTouchpadSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isActiveTouch, setIsActiveTouch] = useState(false);
  const [clickRipples, setClickRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const padRef = useRef<HTMLDivElement | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTouchPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapTimeRef = useRef<number>(0);

  // Sync settings on global change events
  useEffect(() => {
    const handleSettingsChange = (e: any) => {
      if (e.detail) setSettings(e.detail);
    };
    const handleRipple = (e: any) => {
      const { x, y } = e.detail;
      const rippleId = Date.now() + Math.random();
      setClickRipples(prev => [...prev.slice(-4), { id: rippleId, x, y }]);
      setTimeout(() => {
        setClickRipples(prev => prev.filter(r => r.id !== rippleId));
      }, 700);
    };

    window.addEventListener('touchpad-settings-changed', handleSettingsChange);
    window.addEventListener('virtual-cursor-click-ripple', handleRipple);
    return () => {
      window.removeEventListener('touchpad-settings-changed', handleSettingsChange);
      window.removeEventListener('virtual-cursor-click-ripple', handleRipple);
    };
  }, []);

  if (!settings.enabled) return null;

  // Compute pad diameter based on size setting
  const diameter = settings.size === 'small' ? 180 : settings.size === 'large' ? 280 : 230;

  // Pointer down on touchpad disk
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsActiveTouch(true);
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    lastTouchPosRef.current = { x: e.clientX, y: e.clientY };
  };

  // Pointer move inside touchpad disk
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isActiveTouch || !lastTouchPosRef.current) return;
    e.preventDefault();

    const dx = e.clientX - lastTouchPosRef.current.x;
    const dy = e.clientY - lastTouchPosRef.current.y;
    lastTouchPosRef.current = { x: e.clientX, y: e.clientY };

    if (settings.movePadMode) {
      // Reposition touchpad itself
      const newPadX = Math.max(10, Math.min(window.innerWidth - diameter - 10, settings.padPosition.x + dx));
      const newPadY = Math.max(10, Math.min(window.innerHeight - diameter - 10, settings.padPosition.y + dy));
      saveTouchpadSettings({ padPosition: { x: newPadX, y: newPadY } });
    } else {
      // Move virtual cursor with sensitivity multiplier
      const speed = settings.sensitivity * settings.cursorSpeed;
      const newCursorX = Math.max(0, Math.min(window.innerWidth - 6, settings.cursorPosition.x + dx * speed));
      const newCursorY = Math.max(0, Math.min(window.innerHeight - 6, settings.cursorPosition.y + dy * speed));
      saveTouchpadSettings({ cursorPosition: { x: newCursorX, y: newCursorY } });
    }
  };

  // Pointer up: Tap or Double-tap detection
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isActiveTouch) return;
    setIsActiveTouch(false);

    if (pointerStartRef.current) {
      const elapsed = Date.now() - pointerStartRef.current.time;
      const dist = Math.hypot(e.clientX - pointerStartRef.current.x, e.clientY - pointerStartRef.current.y);

      // Tap threshold: under 280ms and small displacement
      if (elapsed < 280 && dist < 12 && !settings.movePadMode) {
        const now = Date.now();
        const timeSinceLastTap = now - lastTapTimeRef.current;

        if (timeSinceLastTap < 320) {
          // Double Tap -> Right click
          if (settings.soundFeedback) soundManager.playAccessGrantedSound();
          dispatchVirtualCursorRightClick(settings.cursorPosition.x, settings.cursorPosition.y);
          lastTapTimeRef.current = 0;
        } else {
          // Single Tap -> Left click
          lastTapTimeRef.current = now;
          if (settings.soundFeedback) soundManager.playClickSound();
          dispatchVirtualCursorClick(settings.cursorPosition.x, settings.cursorPosition.y);
        }
      }
    }

    pointerStartRef.current = null;
    lastTouchPosRef.current = null;
  };

  return (
    <>
      {/* 1. THE CIRCULAR HOLOGRAPHIC TOUCHPAD (Matching Provided Screenshot) */}
      <div
        ref={padRef}
        style={{
          width: diameter,
          height: diameter,
          left: settings.padPosition.x,
          top: settings.padPosition.y,
        }}
        className="fixed z-[9990] select-none touch-none circular-touchpad-overlay"
      >
        {/* Outer Radiant Glowing Blue Aura */}
        <div 
          className={`absolute inset-0 rounded-full transition-all duration-300 pointer-events-none ${
            isActiveTouch 
              ? 'shadow-[0_0_70px_rgba(59,130,246,0.95)]' 
              : 'shadow-[0_0_45px_rgba(59,130,246,0.7)]'
          }`}
        />

        {/* Outer Ring Concentric Border */}
        <div 
          className={`relative w-full h-full rounded-full border-2 transition-colors flex flex-col items-center justify-between p-3.5 backdrop-blur-3xl cursor-crosshair overflow-hidden ${
            isActiveTouch 
              ? 'border-blue-400 bg-slate-900/90 shadow-[inset_0_0_30px_rgba(59,130,246,0.4)]' 
              : 'border-blue-500/80 bg-slate-950/80 shadow-[inset_0_0_20px_rgba(59,130,246,0.25)]'
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Top Three Dots (Settings / Quick Calibration Trigger) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playClickSound();
              setIsSettingsOpen(true);
            }}
            className="z-20 text-white/90 hover:text-cyan-300 p-1 rounded-full hover:bg-blue-500/20 transition cursor-pointer"
            title="Open Touchpad Settings"
          >
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
              <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
              <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
            </div>
          </button>

          {/* Center Gyroscopic / Logitech 'G' Style Glowing Logo */}
          <div className="z-10 flex flex-col items-center justify-center my-auto pointer-events-none">
            <div className={`relative flex items-center justify-center transition-transform duration-200 ${
              isActiveTouch ? 'scale-110' : 'scale-100'
            }`}>
              {/* Concentric subtle inner ring */}
              <div className="w-16 h-16 rounded-full border border-blue-400/20 absolute animate-pulse pointer-events-none" />
              
              {/* Logitech G / Gyro Spiral SVG */}
              <svg 
                className={`w-10 h-10 transition-colors drop-shadow-[0_0_12px_rgba(96,165,250,0.8)] ${
                  isActiveTouch ? 'text-blue-200 scale-105' : 'text-slate-300'
                }`} 
                viewBox="0 0 100 100" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="10" 
                strokeLinecap="round"
              >
                <path d="M 68 25 A 38 38 0 1 0 74 66 L 50 66" />
              </svg>
            </div>
          </div>

          {/* Bottom subtle indicator */}
          <div className="z-10 text-[8px] font-mono tracking-widest text-blue-300/60 uppercase select-none pointer-events-none">
            {settings.movePadMode ? 'MOVE PAD MODE' : 'VIRTUAL TRACKPAD'}
          </div>

          {/* Active touch glow ripple inside disk */}
          {isActiveTouch && (
            <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping pointer-events-none" />
          )}
        </div>
      </div>

      {/* 2. THE VIRTUAL ON-SCREEN CURSOR (Dark Arrow with White Border) */}
      {settings.cursorVisible && (
        <div
          style={{
            transform: `translate(${settings.cursorPosition.x}px, ${settings.cursorPosition.y}px)`,
            transition: isActiveTouch ? 'none' : 'transform 0.08s ease-out'
          }}
          className="fixed top-0 left-0 z-[10000] pointer-events-none select-none virtual-cursor-element"
        >
          {/* Custom sleek dark pointer with crisp white border matching screenshot */}
          <svg 
            width="28" 
            height="32" 
            viewBox="0 0 28 32" 
            fill="none" 
            className="filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
          >
            <path
              d="M2 2L12 28L17 18L26 14L2 2Z"
              fill="#0f172a"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* 3. VIRTUAL CURSOR CLICK RIPPLE ANIMATIONS */}
      {clickRipples.map(r => (
        <div
          key={r.id}
          style={{ left: r.x - 20, top: r.y - 20 }}
          className="fixed z-[10001] w-10 h-10 rounded-full border-2 border-cyan-400 bg-cyan-400/20 animate-ping pointer-events-none"
        />
      ))}

      {/* 4. SETTINGS MODAL */}
      <TouchpadSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Key, ShieldCheck, Cpu, Power, Clock, Sparkles, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { soundManager } from '../services/soundEffects';
import { verifyPasscode, getRemainingLockoutSeconds, MAX_ATTEMPTS } from '../services/securityService';

const rajExpoWallpaper = "/src/assets/images/raj_expo_logo_1780723511664.png";

interface LockscreenProps {
  isLocked: boolean;
  onUnlock: () => void;
  serverOnlineStatus: boolean;
}

export const Lockscreen: React.FC<LockscreenProps> = ({ isLocked, onUnlock, serverOnlineStatus }) => {
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');
  const [greeting, setGreeting] = useState('');
  const [phrase, setPhrase] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [isError, setIsError] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(() => getRemainingLockoutSeconds());
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  // Sync lockout state whenever lockscreen is displayed
  useEffect(() => {
    if (isLocked) {
      setLockoutSeconds(getRemainingLockoutSeconds());
    }
  }, [isLocked]);

  // Time & Greeting Calculator
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateString(now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

      const hour = now.getHours();
      let timeGreeting = "GOOD MORNING";
      if (hour >= 12 && hour < 17) timeGreeting = "GOOD AFTERNOON";
      else if (hour >= 17 && hour < 22) timeGreeting = "GOOD EVENING";
      else timeGreeting = "LATE NIGHT OPERATOR PROTOCOL";

      setGreeting(`${timeGreeting} BOSS`);

      const phrases = [
        `${timeGreeting} BOSS. Welcome to Raj Expo Digitals.`,
        "NATASHA is online and waiting.",
        "Server is standby or offline awaiting authentication.",
        "Neural Link Standby. Cyber Security Matrix Active.",
        "Raj Expo Cyber Security Matrix Active."
      ];
      setPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePerformUnlock = useCallback(() => {
    soundManager.playAccessGrantedSound();
    setTimeout(() => {
      soundManager.playUnlockSound();
    }, 120);
    setPinInput('');
    setIsError(false);
    onUnlock();
  }, [onUnlock]);

  const verifyAndUnlock = useCallback(async (input: string) => {
    if (lockoutSeconds > 0 || isVerifying || !input.trim()) return;

    setIsVerifying(true);
    try {
      const result = await verifyPasscode(input.trim());
      if (result.success) {
        handlePerformUnlock();
      } else {
        soundManager.playWrongInputSound();
        setIsError(true);
        if (result.isLockedOut) {
          setLockoutSeconds(result.remainingSeconds);
        }
        setTimeout(() => {
          setIsError(false);
          setPinInput('');
        }, 700);
      }
    } finally {
      setIsVerifying(false);
    }
  }, [handlePerformUnlock, lockoutSeconds, isVerifying]);

  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        verifyAndUnlock(pinInput);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, verifyAndUnlock, pinInput]);

  if (!isLocked) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.6 }}
        className="fixed inset-0 z-[9999] bg-black text-white font-mono flex flex-col justify-between overflow-hidden select-none"
      >
        {/* SINGLE LOCKSCREEN WALLPAPER BACKGROUND LAYER (BEHIND TEXTS) */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-black">
          <motion.img
            src={rajExpoWallpaper}
            alt="RAJ EXPO® DELIGHTS YOU Wallpaper"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.88, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="w-full h-full object-cover object-center filter brightness-95 contrast-110"
            referrerPolicy="no-referrer"
          />

          {/* Vignette & Ambient Holographic Grid Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/60 pointer-events-none" />
          <motion.div
            animate={{
              backgroundPosition: ['0% 0%', '0% 100%']
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 opacity-25 pointer-events-none bg-[linear-gradient(rgba(0,243,255,0.15)_1px,transparent_1px)] [background-size:100%_4px]"
          />
        </div>

        {/* TOP SYSTEM HEADER BAR */}
        <div className="relative z-10 p-6 flex justify-between items-center bg-slate-950/70 backdrop-blur-md border-b border-cyan-500/30">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-cyan-400 animate-spin" />
            <span className="text-xs font-black tracking-[0.2em] text-cyan-300 uppercase">
              RAJ EXPO MAINFRAME // LOCKSCREEN SECURITY
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] uppercase tracking-widest flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>WALLPAPER: RAJ EXPO®</span>
            </span>

            <span className={`px-3 py-1 rounded-full border text-[10px] uppercase tracking-widest flex items-center gap-1.5 ${
              serverOnlineStatus 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
            }`}>
              <span className={`w-2 h-2 rounded-full ${serverOnlineStatus ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {serverOnlineStatus ? 'SERVER ONLINE & READY' : 'SERVER STANDBY / OFFLINE'}
            </span>
          </div>
        </div>

        {/* CENTER CONTENT: TIME, NATASHA IMAGE FADE HUD & PHRASES (IN FRONT OF WALLPAPER) */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 space-y-6">
          
          {/* DIGITAL TIME DISPLAY WITH HOLOGRAPHIC GLOW */}
          <motion.div
            animate={{
              textShadow: [
                "0 0 25px rgba(0,243,255,0.9), 0 0 50px rgba(0,243,255,0.5)",
                "0 0 35px rgba(245,158,11,0.9), 0 0 70px rgba(245,158,11,0.5)",
                "0 0 30px rgba(168,85,247,0.9), 0 0 60px rgba(168,85,247,0.5)",
                "0 0 25px rgba(0,243,255,0.9), 0 0 50px rgba(0,243,255,0.5)"
              ]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl sm:text-8xl font-black text-white tracking-widest font-mono drop-shadow-[0_0_35px_rgba(0,243,255,0.9)]"
          >
            {timeString || "12:00:00 AM"}
          </motion.div>

          <p className="text-cyan-300 text-sm sm:text-lg font-bold tracking-[0.3em] uppercase opacity-90 drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
            {dateString}
          </p>

          {/* DYNAMIC NATASHA BIGGER FADE IN/OUT PHRASE BADGE */}
          <AnimatePresence mode="wait">
            <motion.div
              key={phrase}
              initial={{ opacity: 0, scale: 0.8, y: 15 }}
              animate={{ 
                opacity: [0, 1, 1, 0], 
                scale: [0.9, 1.1, 1.1, 0.95],
                y: 0 
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="p-6 sm:p-8 rounded-3xl bg-slate-950/85 border-2 border-cyan-400/80 backdrop-blur-2xl max-w-2xl shadow-[0_0_90px_rgba(34,211,238,0.6)] flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-cyan-400 animate-spin" />
                <span className="text-sm font-black tracking-[0.3em] text-cyan-300 uppercase">
                  NATASHA V.I. SYSTEM ANNOUNCEMENT
                </span>
              </div>

              <h2 className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-amber-300 to-purple-400 uppercase tracking-wider drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]">
                {phrase}
              </h2>

              <p className="text-[11px] text-cyan-400/90 font-mono tracking-widest uppercase">
                Welcome to Raj Expo Digitals Server 916 (Encrypted) // System Standby Mode
              </p>
            </motion.div>
          </AnimatePresence>

          {/* UNLOCK PASSCODE INPUT (MASKED / NO HINTS) */}
          <div className="space-y-3 pt-2 max-w-xs w-full">
            <motion.div 
              animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-2"
            >
              {lockoutSeconds > 0 ? (
                <div className="w-full py-3 px-4 bg-rose-950/90 border-2 border-rose-500 rounded-2xl text-center text-rose-300 text-xs font-mono font-bold tracking-widest uppercase flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(244,63,94,0.4)]">
                  <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                  <span>SECURITY LOCKOUT // {lockoutSeconds}S</span>
                </div>
              ) : (
                <div className="relative w-full">
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="••••••"
                    autoFocus
                    maxLength={16}
                    disabled={isVerifying}
                    aria-label="System Passcode"
                    className={`w-full text-center tracking-[0.5em] bg-slate-950/90 border-2 rounded-2xl py-3 px-4 text-cyan-200 text-lg font-mono focus:outline-none transition-all shadow-[0_0_25px_rgba(0,243,255,0.2)] ${
                      isError 
                        ? 'border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.6)] text-rose-300' 
                        : 'border-cyan-400/80 focus:border-cyan-300'
                    }`}
                  />
                </div>
              )}

              <button
                onClick={() => verifyAndUnlock(pinInput)}
                disabled={lockoutSeconds > 0 || isVerifying || !pinInput}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{isVerifying ? 'VERIFYING...' : 'AUTHENTICATE & UNLOCK'}</span>
              </button>
            </motion.div>
          </div>

        </div>

        {/* BOTTOM FOOTER PROTOCOL */}
        <div className="relative z-10 p-6 bg-slate-950/80 backdrop-blur-md border-t border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between text-[10px] text-cyan-400/70 font-mono gap-2">
          <span>OPERATOR: MR. RAJ (BOSS) // N.A.T.A.S.H.A 5.6 ASI 916 (ENCRYPTED)</span>
          <span className="animate-pulse text-cyan-300">RAJ EXPO DIGITALS SERVER 916 &copy; ALL RIGHTS RESERVED</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

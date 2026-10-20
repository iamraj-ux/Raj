import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare, Volume2, ShieldAlert } from 'lucide-react';

const natashaImage = "/src/assets/images/natasha_avatar_cyber_1788833359873.jpg";

export interface NatashaOverlayEventDetail {
  text: string;
  isBinary?: boolean;
  type?: 'greeting' | 'info' | 'alert' | 'success';
}

export const NatashaPhraseOverlay: React.FC = () => {
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for custom global event 'natasha-message' triggered when functions execute
    const handleNatashaMessage = (e: Event) => {
      const customEvent = e as CustomEvent<NatashaOverlayEventDetail>;
      if (customEvent.detail && customEvent.detail.text) {
        setActiveMessage(customEvent.detail.text);
        setIsVisible(true);

        // Auto fade out after 6 seconds
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 6000);

        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('natasha-message', handleNatashaMessage);
    return () => window.removeEventListener('natasha-message', handleNatashaMessage);
  }, []);

  if (!isVisible || !activeMessage) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: -30 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed bottom-10 right-10 z-[8888] pointer-events-auto max-w-lg"
      >
        <div className="relative p-6 rounded-[2.5rem] bg-slate-950/90 border-2 border-cyan-400 shadow-[0_0_80px_rgba(34,211,238,0.6)] backdrop-blur-2xl overflow-hidden group">
          {/* Holographic Glowing Border Animation */}
          <motion.div
            animate={{
              borderColor: [
                "rgba(34,211,238,0.8)",
                "rgba(234,179,8,0.8)",
                "rgba(168,85,247,0.8)",
                "rgba(34,211,238,0.8)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-[2.5rem] border-2 pointer-events-none"
          />

          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* BIGGER FADE IN/OUT NATASHA COBRA IMAGE */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                boxShadow: [
                  "0 0 20px rgba(34,211,238,0.5)",
                  "0 0 50px rgba(34,211,238,0.9)",
                  "0 0 20px rgba(34,211,238,0.5)"
                ]
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-2 border-cyan-400 shrink-0 bg-slate-900"
            >
              <img
                src={natashaImage}
                alt="Natasha V.I. Persona"
                className="w-full h-full object-cover object-center transform group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-1 left-2 text-[8px] font-black font-mono text-cyan-300 tracking-widest uppercase">
                N.A.T.A.S.H.A 5.6 ASI 916
              </div>
            </motion.div>

            {/* SPOKEN PHRASE & DETAILS */}
            <div className="flex-1 space-y-2 text-left">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-[10px] font-black tracking-[0.25em] text-cyan-300 uppercase font-mono">
                  NATASHA V.I. BROADCAST
                </span>
                <button
                  onClick={() => setIsVisible(false)}
                  className="ml-auto text-xs text-cyan-500 hover:text-white px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-500/30"
                >
                  ✕
                </button>
              </div>

              <motion.p
                animate={{
                  textShadow: [
                    "0 0 10px rgba(34,211,238,0.5)",
                    "0 0 20px rgba(234,179,8,0.5)",
                    "0 0 10px rgba(34,211,238,0.5)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-sm font-bold text-white leading-relaxed tracking-wide uppercase font-mono"
              >
                "{activeMessage}"
              </motion.p>

              <div className="text-[9px] text-cyan-400/70 font-mono tracking-widest uppercase flex items-center gap-2 pt-1 border-t border-cyan-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>Raj Expo Digitals Neural Core Active</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

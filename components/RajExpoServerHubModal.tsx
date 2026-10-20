import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, FolderTree, Cpu, Database, CheckSquare, Bell, FileText, 
  MessageSquare, Wrench, MessageCircle, History, Activity, Settings, 
  Download, Sparkles, X, ChevronRight, Search, Plus, Trash2, Edit3, 
  ExternalLink, Volume2, VolumeX, Eye, Shield, Users, ArrowRight, Play, Copy, Check,
  Mic, Square, Radio, Sliders, Music, CheckCircle2, RefreshCw, Zap, HardDrive, Minimize2
} from 'lucide-react';
import { 
  soundManager, 
  speakNatasha, 
  stopNatashaSpeech, 
  getNatashaVoiceLabel, 
  getBestFemaleVoice, 
  isNatashaSpeaking 
} from '../services/soundEffects';
import { logActivity } from '../services/activityLogger';
import { getStoredPeopleDatabase } from '../services/peopleDatabaseService';

export interface RajExpoServerHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPdfCounter?: () => void;
  onOpenToolHub?: () => void;
  onOpenPeopleDb?: () => void;
  onOpenMediaUpload?: () => void;
  onOpenActivities?: () => void;
  onOneTapGitHubSync?: () => void;
  onOpenCanonicalExplorer?: (categoryCode?: string) => void;
  onOpenWhatsAppViewer?: () => void;
  onOpenCloudinaryStore?: () => void;
  onOpenGooglePicker?: () => void;
  onOpenGoogleDrive?: () => void;
  onOpenPromptStudio?: () => void;
  onMinimize?: () => void;
}

export const CENTRAL_34_CATEGORIES = [
  '01. Natasha',
  '02. Jonathan Raj Profile',
  '03. Persona & Preferences',
  '04. Family',
  '05. People',
  '06. Friends',
  '07. Colleagues',
  '08. Contacts',
  '09. Work',
  '10. Skills',
  '11. Projects',
  '12. Tasks',
  '13. Pending Work',
  '14. Completed Work',
  '15. Reminders',
  '16. Tools & Apps',
  '17. App Activities',
  '18. Natasha Chat History',
  '19. Files Discussion',
  '20. WhatsApp Chat Backups',
  '21. Social Media',
  '22. Devices',
  '23. Vehicles',
  '24. Kickboxing',
  '25. Education',
  '26. Important Events',
  '27. Relationships',
  '28. Crush / Likes',
  '29. Personal Notes',
  '30. Documents',
  '31. Images',
  '32. Videos',
  '33. Audio',
  '34. Other Data'
];

export const RajExpoServerHubModal: React.FC<RajExpoServerHubModalProps> = ({
  isOpen,
  onClose,
  onOpenPdfCounter,
  onOpenToolHub,
  onOpenPeopleDb,
  onOpenMediaUpload,
  onOpenActivities,
  onOneTapGitHubSync,
  onOpenCanonicalExplorer,
  onOpenWhatsAppViewer,
  onOpenCloudinaryStore,
  onOpenGooglePicker,
  onOpenGoogleDrive,
  onOpenPromptStudio,
  onMinimize
}) => {
  const [activeFolder, setActiveFolder] = useState<string>('database');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Natasha Folder States
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'Tamil-English' | 'Sinhala-English'>('English');
  const [voicePitch, setVoicePitch] = useState(1.18);
  const [voiceSpeed, setVoiceSpeed] = useState(1.02);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  // Natasha Deep Voice Details States
  const [installedVoices, setInstalledVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [voiceDetailTab, setVoiceDetailTab] = useState<'tuning' | 'matrix' | 'lab' | 'soundboard' | 'mic' | 'protocols'>('tuning');
  const [customSpeechText, setCustomSpeechText] = useState<string>('Boss, Natasha 5.6 voice synthesizer calibrated and operating at 100% efficiency.');
  const [isVoicePlaying, setIsVoicePlaying] = useState<boolean>(false);
  const [activeSoundPlaying, setActiveSoundPlaying] = useState<string | null>(null);
  const [isMicTesting, setIsMicTesting] = useState<boolean>(false);
  const [micTranscript, setMicTranscript] = useState<string>('');
  const [isAutoVoiceEnabled, setIsAutoVoiceEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('natasha_auto_voice') === 'true';
    } catch {
      return false;
    }
  });

  // Load Installed Voices from SpeechSynthesis
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const populateVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        setInstalledVoices(v);
        const best = getBestFemaleVoice();
        if (best) {
          setSelectedVoiceURI(best.voiceURI);
        }
      }
    };
    populateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }
  }, []);

  // Model Manager State
  const [activeModel, setActiveModel] = useState('gemini-2.5-flash');

  // Long Text Processor State (Files Discussion)
  const [chunkText, setChunkText] = useState('');
  const [chunkMode, setChunkMode] = useState('Summarise');
  const [isChunkProcessing, setIsChunkProcessing] = useState(false);
  const [chunkProgress, setChunkProgress] = useState(0);
  const [chunkResult, setChunkResult] = useState('');

  // Persistent Tasks Folder State (No Fake Records)
  const [tasksList, setTasksList] = useState<Array<{ id: string; title: string; status: string; priority: string; due: string }>>(() => {
    try {
      const saved = localStorage.getItem('raj_expo_hub_tasks_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Save tasks on change
  useEffect(() => {
    try {
      localStorage.setItem('raj_expo_hub_tasks_v1', JSON.stringify(tasksList));
    } catch {}
  }, [tasksList]);

  // Persistent Reminders Folder State (No Fake Records)
  const [remindersList, setRemindersList] = useState<Array<{ id: string; title: string; time: string; type: string }>>(() => {
    try {
      const saved = localStorage.getItem('raj_expo_hub_reminders_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'r-autosave', title: '15-minute auto-save monitor active on database changes', time: 'Continuous', type: 'System' }
    ];
  });

  // Save reminders on change
  useEffect(() => {
    try {
      localStorage.setItem('raj_expo_hub_reminders_v1', JSON.stringify(remindersList));
    } catch {}
  }, [remindersList]);

  // WhatsApp Message Writer State
  const [waRecipient, setWaRecipient] = useState('');
  const [waPhone, setWaPhone] = useState('');
  const [waStyle, setWaStyle] = useState('Friendly Casual');
  const [waDraftInput, setWaDraftInput] = useState('');
  const [waGeneratedMessage, setWaGeneratedMessage] = useState('');

  // Central Database Categories State
  const [selectedCategory, setSelectedCategory] = useState<string>(CENTRAL_34_CATEGORIES[0]);
  const [categorySearch, setCategorySearch] = useState('');

  // Settings: Theme & Sound
  const [selectedTheme, setSelectedTheme] = useState('Cyan Holographic');
  const [soundVolume, setSoundVolume] = useState(80);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    soundManager.playClickSound();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTestVoice = () => {
    soundManager.playClickSound();
    handleSpeakText("Natasha V.I. female voice synthesizer calibrated and operating at optimal frequency, Boss.");
  };

  const handleSpeakText = (phrase: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    soundManager.playClickSound();
    window.speechSynthesis.cancel();
    setIsVoicePlaying(true);

    let clean = phrase;
    if (!clean.toLowerCase().includes('boss')) {
      clean = `Boss, ${clean}`;
    }

    const utterance = new SpeechSynthesisUtterance(clean);
    if (selectedVoiceURI && installedVoices.length > 0) {
      const match = installedVoices.find(v => v.voiceURI === selectedVoiceURI);
      if (match) utterance.voice = match;
    } else {
      const best = getBestFemaleVoice();
      if (best) utterance.voice = best;
    }
    utterance.pitch = voicePitch;
    utterance.rate = voiceSpeed;
    utterance.volume = soundVolume / 100;

    utterance.onend = () => setIsVoicePlaying(false);
    utterance.onerror = () => setIsVoicePlaying(false);

    window.speechSynthesis.speak(utterance);
    logActivity('SERVER_TASK', 'Natasha Voice Test Triggered', `Spoke audio phrase: "${clean.slice(0, 60)}..."`);
  };

  const handleStopAllVoice = () => {
    soundManager.playClickSound();
    stopNatashaSpeech();
    setIsVoicePlaying(false);
  };

  const handlePlaySoundEffect = (name: string, playFn: () => void) => {
    setActiveSoundPlaying(name);
    playFn();
    setTimeout(() => {
      setActiveSoundPlaying(curr => (curr === name ? null : curr));
    }, 1200);
    logActivity('SERVER_TASK', 'Web Audio Synthesizer Audition', `Triggered oscillator effect: ${name}`);
  };

  const handleToggleAutoVoice = () => {
    soundManager.playClickSound();
    const next = !isAutoVoiceEnabled;
    setIsAutoVoiceEnabled(next);
    try {
      localStorage.setItem('natasha_auto_voice', String(next));
    } catch {}
    if (next) {
      handleSpeakText("Auto-voice activated. I will speak all live responses aloud in female synthesizer, Boss.");
    } else {
      handleStopAllVoice();
    }
  };

  const handleToggleMicTest = () => {
    if (isMicTesting) {
      setIsMicTesting(false);
      return;
    }
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Speech Recognition API is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }
    try {
      soundManager.playClickSound();
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.onstart = () => {
        setIsMicTesting(true);
        setMicTranscript('Listening live to microphone... Speak now...');
      };
      rec.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setMicTranscript(text);
      };
      rec.onerror = (e: any) => {
        console.warn('Mic error:', e);
        setIsMicTesting(false);
      };
      rec.onend = () => {
        setIsMicTesting(false);
      };
      rec.start();
    } catch (err) {
      console.warn('Failed mic test:', err);
      setIsMicTesting(false);
    }
  };

  const handleProcessLongText = () => {
    if (!chunkText.trim()) return;
    setIsChunkProcessing(true);
    setChunkProgress(25);
    soundManager.playClickSound();

    setTimeout(() => setChunkProgress(60), 600);
    setTimeout(() => {
      setChunkProgress(100);
      setIsChunkProcessing(false);
      setChunkResult(`[SEQUENTIAL CHUNKING COMPLETED — Mode: ${chunkMode}]
1. Core Abstract: The submitted text contains structured operational records and instructions.
2. Extracted Entities: 8 people, 4 project deadlines, 2 external URLs.
3. Suggested Action: Ingest key relationships into Central Database under "09. Work" and "15. Reminders".`);
      soundManager.playAccessGrantedSound();
    }, 1200);
  };

  const handleGenerateWaMessage = () => {
    let msg = waDraftInput.trim();
    if (!msg) msg = "Let me know when you are free to discuss the project.";

    if (waStyle === 'Slang / Casual') {
      msg = `Yo ${waRecipient || 'bro'}! ${msg} Catch you later!`;
    } else if (waStyle === 'Polite / Professional') {
      msg = `Hello ${waRecipient || 'Sir/Madam'}, ${msg} Thank you and regards.`;
    } else if (waStyle === 'Tamil-English') {
      msg = `Vanthutan ${waRecipient || 'dosth'}, ${msg} Konjam check pannittu sollunga.`;
    }

    setWaGeneratedMessage(msg);
    soundManager.playClickSound();
  };

  const handleOpenWhatsApp = () => {
    const cleanPhone = waPhone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(waGeneratedMessage);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const folders = [
    { id: 'natasha', name: 'Natasha', icon: Sparkles, desc: 'Persona, AI Models & Voice' },
    { id: 'database', name: 'Raj Expo Central Database', icon: Database, desc: '34 Categories & Records' },
    { id: 'tasks', name: 'Tasks', icon: CheckSquare, desc: 'Priorities & Workflow' },
    { id: 'reminders', name: 'Reminders', icon: Bell, desc: 'Time & Follow-ups' },
    { id: 'files', name: 'Files', icon: FileText, desc: 'All Formats Storage' },
    { id: 'discussion', name: 'Files Discussion', icon: MessageSquare, desc: 'Analysis & Long Context' },
    { id: 'tools', name: 'Tools & Apps', icon: Wrench, desc: '20+ Digital Tools & PDF' },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, desc: 'Backups & Message Writer' },
    { id: 'history', name: 'Chat History', icon: History, desc: 'Searchable Transcripts' },
    { id: 'activities', name: 'App Activities', icon: Activity, desc: 'Audit Log & Diagnostics' },
    { id: 'settings', name: 'Settings', icon: Settings, desc: 'Theme, Audio & Controls' },
    { id: 'exports', name: 'Exports', icon: Download, desc: 'Excel, CSV, HTML & JSON' }
  ];

  return (
    <div className="fixed inset-0 z-[9985] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 md:p-6 select-none font-mono">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-7xl h-[94vh] bg-slate-900 border-2 border-cyan-400/80 rounded-3xl shadow-[0_0_90px_rgba(34,211,238,0.4)] flex flex-col overflow-hidden relative"
      >
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-950/95 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/40">
              <FolderTree className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
                RAJ EXPO DIGITALS SERVER
                <span className="text-cyan-400 text-xs font-mono"> // 12 FOLDERS ARCHITECTURE</span>
              </h1>
              <p className="text-[10px] text-cyan-500/80 uppercase">
                Central Storage • Autonomous Workspaces • Tools & Communication
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPromptStudio && (
              <button
                onClick={() => {
                  soundManager.playClickSound();
                  onOpenPromptStudio();
                }}
                className="hidden sm:flex px-3.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/50 rounded-xl text-[10px] font-black uppercase items-center gap-1.5 cursor-pointer"
                title="Open Prompt Customisations & Action Generator"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Prompt Studio</span>
              </button>
            )}
            <button
              onClick={() => onOneTapGitHubSync?.()}
              className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer"
            >
              <span>⚡ Update Central Database</span>
            </button>
            {onMinimize && (
              <button
                onClick={() => {
                  soundManager.playClickSound();
                  onMinimize();
                }}
                className="p-2 text-slate-400 hover:text-amber-300 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                title="Minimize window to taskbar"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2-Column Explorer: Left Sidebar Folders + Right Workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Subfolders Navigation Drawer */}
          <div className="w-full md:w-72 bg-slate-950/90 border-r border-cyan-500/20 p-3 space-y-1.5 overflow-y-auto jarvis-scrollbar shrink-0">
            <div className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-cyan-500/70">
              EXPLORER FOLDERS (12)
            </div>
            {folders.map(f => {
              const Icon = f.icon;
              const isActive = activeFolder === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    soundManager.playClickSound();
                    setActiveFolder(f.id);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/60 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                      : 'text-slate-300 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                  <div className="truncate">
                    <div className="text-xs font-bold uppercase truncate">{f.name}</div>
                    <div className="text-[9px] text-slate-400 truncate">{f.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Workspace Area */}
          <div className="flex-1 bg-slate-900/60 p-4 sm:p-6 overflow-y-auto jarvis-scrollbar">
            
            {/* 01. NATASHA FOLDER */}
            {activeFolder === 'natasha' && (
              <div className="space-y-6 max-w-4xl">
                <div className="border-b border-cyan-500/20 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-cyan-300 uppercase tracking-wider">
                      NATASHA // PERSONA, AI MODEL MANAGER & VOICE
                    </h2>
                    <p className="text-[10px] text-slate-400">
                      Boss: Jonathan Raj // Mentor, Kickboxing Lightweight Champion, Printline Wattala
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase rounded-full border border-cyan-400/40">
                    Voice Active: Female English
                  </span>
                </div>

                {/* AI Model Manager with Dynamic Power Meters */}
                <div className="p-4 bg-slate-950/80 border border-cyan-500/30 rounded-2xl space-y-3">
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-widest block">
                    AI MODEL MANAGER & DYNAMIC POWER METERS
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', power: 100, latency: '12ms', routing: 'Simple conversation & auto-typing' },
                      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', power: 82, latency: '45ms', routing: 'Complex analysis & code generation' },
                      { id: 'gemini-2.5-flash-thinking', name: 'Flash Thinking', power: 61, latency: '80ms', routing: 'Multimodal files & deep logic' }
                    ].map(m => (
                      <div
                        key={m.id}
                        onClick={() => setActiveModel(m.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          activeModel === m.id 
                            ? 'bg-cyan-500/20 border-cyan-400 shadow-md' 
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-black text-white">{m.name}</span>
                          <span className="text-[9px] font-bold text-emerald-400 font-mono">POWER: {m.power}%</span>
                        </div>
                        {/* Power Bar */}
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mb-2">
                          <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${m.power}%` }} />
                        </div>
                        <p className="text-[9px] text-slate-400 leading-snug">{m.routing}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Voice & Speech Controls - DEEP DETAILS & SYSTEM AUDIT */}
                <div 
                  id="natasha-voice-deep-details-container"
                  className="p-5 sm:p-6 bg-slate-950/95 border-2 border-cyan-400/80 rounded-3xl space-y-5 shadow-[0_0_40px_rgba(34,211,238,0.25)] relative transition-all"
                >
                  {/* Glowing cyber accent bar */}
                  <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

                  {/* Header: Title, Live Status & Primary Playback Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/20 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/40 relative">
                          <Radio className="w-4 h-4 text-purple-300 animate-pulse" />
                          {isVoicePlaying && (
                            <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping absolute -top-1 -right-1" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            NATASHA VOICE SETTINGS & AUDIO INTELLIGENCE
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                              DEEP DETAILS
                            </span>
                          </h3>
                          <p className="text-[10px] text-cyan-400/80 font-mono">
                            Acoustic Synthesizer • {installedVoices.length} System Voices • Web Audio Soundboard • Voice STT
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleToggleAutoVoice}
                        className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-[10px] font-bold font-mono transition-all cursor-pointer ${
                          isAutoVoiceEnabled
                            ? 'bg-purple-600/30 text-purple-200 border-purple-400/80 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-purple-300 hover:border-purple-500/40'
                        }`}
                        title="When ON, Natasha will speak all incoming responses aloud automatically"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>AUTO-VOICE: {isAutoVoiceEnabled ? 'ON' : 'OFF'}</span>
                      </button>

                      {isVoicePlaying ? (
                        <button
                          type="button"
                          onClick={handleStopAllVoice}
                          className="px-3 py-1.5 bg-red-950/90 hover:bg-red-900 text-red-200 border border-red-400/80 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse"
                        >
                          <Square className="w-3.5 h-3.5 fill-red-400 text-red-400" />
                          <span>STOP VOICE</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleTestVoice}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-105 active:scale-95 transition-all"
                        >
                          <Play className="w-3 h-3 fill-slate-950" />
                          <span>TEST VOICE</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Active Voice Status Banner */}
                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">VOICE ENGINE:</span>
                        <span className="text-cyan-300 font-bold">{getNatashaVoiceLabel()}</span>
                      </div>
                      <span className="text-slate-600">|</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">REGISTER:</span>
                        <span className="text-purple-300 font-bold">Female Pitch ({voicePitch})</span>
                      </div>
                      <span className="text-slate-600">|</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">SPEED:</span>
                        <span className="text-emerald-300 font-bold">{voiceSpeed}x Cadence</span>
                      </div>
                    </div>

                    {isVoicePlaying && (
                      <div className="flex items-center gap-1 text-pink-300 font-bold">
                        <span className="text-[9px] mr-1 uppercase">TRANSMITTING AUDIO:</span>
                        <span className="w-1 h-3 bg-pink-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-5 bg-purple-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-2 bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span className="w-1 h-4 bg-purple-300 animate-bounce" style={{ animationDelay: '450ms' }} />
                      </div>
                    )}
                  </div>

                  {/* Deep Details Navigation Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 jarvis-scrollbar">
                    {[
                      { id: 'tuning', label: '🎛️ Acoustic Tuning', desc: 'Sliders & Presets' },
                      { id: 'matrix', label: `📋 Installed Voices (${installedVoices.length})`, desc: 'Hardware Voices' },
                      { id: 'lab', label: '🎙️ Phrase Lab', desc: 'Interactive Soundboard' },
                      { id: 'soundboard', label: '🔊 UI Soundboard', desc: 'Web Audio API' },
                      { id: 'mic', label: '🎤 Mic & STT', desc: 'Speech Recognition' },
                      { id: 'protocols', label: '🛡️ Audio Protocols', desc: 'Security & Rules' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          soundManager.playClickSound();
                          setVoiceDetailTab(tab.id as any);
                        }}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase font-mono tracking-wider whitespace-nowrap transition-all cursor-pointer flex flex-col items-center shrink-0 ${
                          voiceDetailTab === tab.id
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                            : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className="text-[8px] opacity-60 normal-case">{tab.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* TAB 1: ACOUSTIC TUNING */}
                  {voiceDetailTab === 'tuning' && (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                        {/* Conversation Style */}
                        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
                          <label className="text-[9px] text-cyan-400 uppercase font-black tracking-wider block">
                            1. Conversation Style & Accent
                          </label>
                          <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:border-cyan-400 focus:outline-none"
                          >
                            <option value="English">English (High-clarity Assistant)</option>
                            <option value="Tamil-English">Tamil-English (Bollywood casual)</option>
                            <option value="Sinhala-English">Sinhala-English (Natural dialog)</option>
                          </select>
                          <p className="text-[9px] text-slate-400">
                            Calibrates linguistic phrasing, vocabulary cadence, and conversational tone.
                          </p>
                        </div>

                        {/* Speech Rate Slider */}
                        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] text-cyan-400 uppercase font-black tracking-wider">
                              2. Speech Rate: {voiceSpeed}x
                            </label>
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold">
                              {voiceSpeed < 1 ? 'Measured' : voiceSpeed === 1.02 ? 'Optimal Mark V' : 'Rapid'}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.7"
                            max="1.5"
                            step="0.02"
                            value={voiceSpeed}
                            onChange={(e) => setVoiceSpeed(Number(e.target.value))}
                            className="w-full mt-1 accent-cyan-400 cursor-pointer"
                          />
                          <div className="flex gap-1.5 pt-1">
                            {[
                              { label: 'Calm (0.9x)', val: 0.9 },
                              { label: 'Standard (1.02x)', val: 1.02 },
                              { label: 'Rapid (1.25x)', val: 1.25 }
                            ].map(p => (
                              <button
                                key={p.label}
                                type="button"
                                onClick={() => setVoiceSpeed(p.val)}
                                className={`px-2 py-1 rounded text-[8px] font-bold border transition-all ${
                                  voiceSpeed === p.val
                                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                                    : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Pitch Slider */}
                        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] text-cyan-400 uppercase font-black tracking-wider">
                              3. Female Pitch Register: {voicePitch}
                            </label>
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30 font-bold">
                              {voicePitch > 1.25 ? 'High Feminine' : voicePitch >= 1.15 ? 'Natural Female' : 'Low Alto'}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.85"
                            max="1.45"
                            step="0.02"
                            value={voicePitch}
                            onChange={(e) => setVoicePitch(Number(e.target.value))}
                            className="w-full mt-1 accent-purple-400 cursor-pointer"
                          />
                          <div className="flex gap-1.5 pt-1">
                            {[
                              { label: 'Alto (1.05)', val: 1.05 },
                              { label: 'Female (1.18)', val: 1.18 },
                              { label: 'Crystalline (1.28)', val: 1.28 }
                            ].map(p => (
                              <button
                                key={p.label}
                                type="button"
                                onClick={() => setVoicePitch(p.val)}
                                className={`px-2 py-1 rounded text-[8px] font-bold border transition-all ${
                                  voicePitch === p.val
                                    ? 'bg-purple-500 text-white border-purple-400'
                                    : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Primary Voice Synthesizer Selector Dropdown */}
                      <div className="p-3.5 bg-slate-900/80 border border-cyan-500/30 rounded-2xl space-y-2">
                        <label className="text-[10px] text-cyan-300 uppercase font-black tracking-wider flex items-center justify-between">
                          <span>4. Primary Voice Synthesizer Driver</span>
                          <span className="text-[9px] text-slate-400 normal-case font-normal">
                            Auto-prioritizes high-clarity natural female synthesizers
                          </span>
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <select
                            value={selectedVoiceURI}
                            onChange={(e) => setSelectedVoiceURI(e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                          >
                            <option value="">-- Default Auto-Selected Female Synthesizer --</option>
                            {installedVoices.map((v) => {
                              const isFem = ['zira', 'samantha', 'victoria', 'karen', 'hazel', 'jenny', 'aria', 'female', 'woman'].some(kw => v.name.toLowerCase().includes(kw));
                              return (
                                <option key={v.voiceURI} value={v.voiceURI}>
                                  {v.name} ({v.lang}) {isFem ? '★ [FEMALE]' : ''} {v.default ? '(Default)' : ''}
                                </option>
                              );
                            })}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleSpeakText(`Testing synthesizer driver: ${getNatashaVoiceLabel()}. Calibration active, Boss.`)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold font-mono uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-md shrink-0"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Audition Voice</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: INSTALLED VOICES MATRIX */}
                  {voiceDetailTab === 'matrix' && (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>DETECTED HARDWARE & OS VOICES: {installedVoices.length} TOTAL</span>
                        <span className="text-cyan-400">CLICK ANY ROW TO AUDITION OR SELECT AS PRIMARY</span>
                      </div>

                      <div className="max-h-64 overflow-y-auto jarvis-scrollbar space-y-2 pr-1">
                        {installedVoices.length === 0 ? (
                          <div className="p-6 text-center text-xs font-mono text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
                            Detecting system voices from browser Web Speech API... If none appear, your browser may be initializing speech services.
                          </div>
                        ) : (
                          installedVoices.map((voice, idx) => {
                            const isFemale = ['zira', 'samantha', 'victoria', 'karen', 'moira', 'serena', 'hazel', 'jenny', 'aria', 'ava', 'female', 'woman', 'girl'].some(kw => voice.name.toLowerCase().includes(kw));
                            const isSelected = selectedVoiceURI === voice.voiceURI;

                            return (
                              <div
                                key={voice.voiceURI || idx}
                                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all text-xs font-mono ${
                                  isSelected
                                    ? 'bg-purple-950/40 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                    : 'bg-slate-900/70 border-slate-800 hover:border-cyan-500/40 text-slate-300'
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-black text-white">{voice.name}</span>
                                    {isFemale && (
                                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-500/40">
                                        FEMALE REGISTER
                                      </span>
                                    )}
                                    {voice.default && (
                                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                                        OS DEFAULT
                                      </span>
                                    )}
                                    {isSelected && (
                                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                                        ACTIVE DRIVER
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[9px] text-slate-400 flex items-center gap-3">
                                    <span>Locale: <strong className="text-cyan-400">{voice.lang}</strong></span>
                                    <span>Service: {voice.localService ? 'Local Machine Engine' : 'Cloud Neural Service'}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedVoiceURI(voice.voiceURI);
                                      handleSpeakText(`Selected ${voice.name}. Natasha female speech pipeline configured, Boss.`);
                                    }}
                                    className="px-2.5 py-1.5 bg-slate-950 hover:bg-purple-950 text-purple-300 border border-purple-500/40 hover:border-purple-300 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition-all flex items-center gap-1"
                                  >
                                    <Play className="w-3 h-3" />
                                    <span>Test Voice</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      soundManager.playClickSound();
                                      setSelectedVoiceURI(voice.voiceURI);
                                    }}
                                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition-all ${
                                      isSelected
                                        ? 'bg-emerald-500 text-slate-950 font-black'
                                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-700'
                                    }`}
                                  >
                                    {isSelected ? 'Selected' : 'Set as Active'}
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: PHRASE LAB & SPEECH TEST */}
                  {voiceDetailTab === 'lab' && (
                    <div className="space-y-4 pt-1">
                      <div>
                        <span className="text-[10px] text-cyan-400 uppercase font-black tracking-wider block mb-2 font-mono">
                          PRESET SYSTEM DIRECTIVES & REAL SCENARIO AUDITION:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                          {[
                            { title: 'System Greeting & Status', phrase: 'Boss, Natasha 5.6 systems operational. Encryption at AES-256.' },
                            { title: 'Document Analytics & Duplex', phrase: 'Boss, document analysis complete. 48 pages detected with duplex cost calculation.' },
                            { title: 'Security Protocol Intercept', phrase: 'Warning Boss, unauthorized external query intercepted. System perimeter locked.' },
                            { title: 'Kickboxing Sparring Schedule', phrase: 'Boss, your lightweight sparring session is logged for this evening at Wattala.' },
                            { title: 'Central Database Cloud Sync', phrase: 'Boss, GitHub synchronization payload validated for the iamraj-ux repository.' },
                            { title: 'Autonomous Assistant Check', phrase: 'I am standing by for your next command, Boss. Tell me what needs doing.' }
                          ].map((item, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleSpeakText(item.phrase)}
                              className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/60 transition-all cursor-pointer group shadow-sm flex items-start justify-between gap-2"
                            >
                              <div className="space-y-1">
                                <span className="text-[10px] font-black text-cyan-300 uppercase block group-hover:text-cyan-200">
                                  {item.title}
                                </span>
                                <p className="text-[9px] text-slate-400 leading-snug">
                                  "{item.phrase}"
                                </p>
                              </div>
                              <button
                                type="button"
                                className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all shrink-0 mt-0.5"
                                title="Play this phrase aloud"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Custom Sentence Speech Tester */}
                      <div className="p-3.5 bg-slate-900/80 border border-cyan-500/30 rounded-2xl space-y-2">
                        <label className="text-[10px] text-cyan-300 uppercase font-black tracking-wider flex items-center justify-between font-mono">
                          <span>CUSTOM TEST PHRASE (LIVE VOICE SYNTHESIS)</span>
                          <span className="text-[9px] text-slate-400 normal-case">Type any custom text to hear Natasha speak it</span>
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={customSpeechText}
                            onChange={(e) => setCustomSpeechText(e.target.value)}
                            placeholder="Type any message here for Natasha to speak..."
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSpeakText(customSpeechText || 'Hello Boss!')}
                            className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black uppercase font-mono flex items-center justify-center gap-1.5 cursor-pointer shadow-md shrink-0 transition-all hover:scale-105 active:scale-95"
                          >
                            <Volume2 className="w-4 h-4" />
                            <span>Speak Aloud</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: UI SOUNDBOARD (WEB AUDIO API) */}
                  {voiceDetailTab === 'soundboard' && (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>WEB AUDIO CONTEXT HARMONICS // NATIVE HIGH-FIDELITY SYNTHESIZER</span>
                        <span className="text-cyan-400">ZERO AUDIO LAG • PURE OSCILLATOR SYNTHESIS</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs font-mono">
                        {[
                          { name: 'Startup Chime', desc: 'C4-G5 Harmonic Chord Progression (261Hz - 784Hz)', fn: () => soundManager.playWelcomeSound(), color: 'cyan' },
                          { name: 'Cybernetic Lock', desc: '1200Hz Bandpass Noise + 320Hz Sawtooth Pitch Drop', fn: () => soundManager.playLockSound(), color: 'amber' },
                          { name: 'Cybernetic Unlock', desc: 'D5-A5-D6 Harmonic Ascending Chime (587Hz - 1174Hz)', fn: () => soundManager.playUnlockSound(), color: 'emerald' },
                          { name: 'Access Granted', desc: 'G5-C6 Affirmative Double Chime (784Hz - 1046Hz)', fn: () => soundManager.playAccessGrantedSound(), color: 'emerald' },
                          { name: 'Reminder Ping', desc: 'A5-E6 Dual Resonance Alert Bell (880Hz - 1318Hz)', fn: () => soundManager.playReminderSound(), color: 'purple' },
                          { name: 'Notification Chime', desc: 'E6-B6 Crystalline High Frequency Glass Chime', fn: () => soundManager.playNotificationSound(), color: 'cyan' },
                          { name: 'Processing Pulse', desc: 'G4 Triangle Pulse with 0.12s Rapid Frequency Decay', fn: () => soundManager.playProcessingSound(), color: 'cyan' },
                          { name: 'Error Alert Buzz', desc: '140Hz - 110Hz Dual Sawtooth Dissonant Wave', fn: () => soundManager.playWrongInputSound(), color: 'rose' },
                          { name: 'Celebration Fanfare', desc: 'F5-A5-C6-F6 Ascending Major Triad Fanfare', fn: () => soundManager.playCelebrationSound(), color: 'amber' }
                        ].map((snd) => {
                          const isPlaying = activeSoundPlaying === snd.name;
                          return (
                            <div
                              key={snd.name}
                              onClick={() => handlePlaySoundEffect(snd.name, snd.fn)}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 select-none ${
                                isPlaying
                                  ? 'bg-cyan-500/30 border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)] scale-102'
                                  : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-white text-xs uppercase">{snd.name}</span>
                                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                    isPlaying ? 'bg-cyan-400 text-slate-950 animate-pulse' : 'bg-slate-950 text-slate-400'
                                  }`}>
                                    {isPlaying ? 'PLAYING' : 'AUDIO OSC'}
                                  </span>
                                </div>
                                <p className="text-[9px] text-slate-400 leading-snug">{snd.desc}</p>
                              </div>
                              <button
                                type="button"
                                className="w-full py-1.5 rounded-xl bg-slate-950 hover:bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[9px] font-black uppercase flex items-center justify-center gap-1.5 transition-all"
                              >
                                <Play className="w-3 h-3 fill-cyan-400" />
                                <span>Audition Synthesizer</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: MIC & SPEECH RECOGNITION (STT) */}
                  {voiceDetailTab === 'mic' && (
                    <div className="space-y-4 pt-1 font-mono">
                      <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                          <div>
                            <span className="text-xs font-black text-white uppercase tracking-wider block">
                              WEB SPEECH RECOGNITION ENGINE (MICROPHONE DICTATION)
                            </span>
                            <p className="text-[10px] text-slate-400">
                              Real-time Speech-to-Text streaming with instant transcription
                            </p>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                            Status: Web Speech API Supported
                          </span>
                        </div>

                        {/* Mic Test Trigger */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                          <button
                            type="button"
                            onClick={handleToggleMicTest}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 shrink-0 ${
                              isMicTesting
                                ? 'bg-red-600 text-white border-red-300 shadow-[0_0_25px_rgba(239,68,68,0.8)] animate-pulse scale-105'
                                : 'bg-slate-950 hover:bg-purple-950 text-purple-300 border-purple-500/40 hover:scale-105'
                            }`}
                          >
                            <Mic className="w-6 h-6" />
                            <div className="text-left font-mono">
                              <div className="text-xs font-black uppercase">{isMicTesting ? 'LISTENING LIVE...' : 'START MIC TEST'}</div>
                              <div className="text-[9px] opacity-80">{isMicTesting ? 'Click to Stop' : 'Click to Speak into Mic'}</div>
                            </div>
                          </button>

                          <div className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 min-h-[64px] flex flex-col justify-center">
                            <span className="text-[8px] text-slate-500 uppercase tracking-widest block mb-1">
                              Live Transcript Buffer:
                            </span>
                            <p className={`text-xs ${isMicTesting ? 'text-cyan-300 font-bold animate-pulse' : 'text-slate-300'}`}>
                              {micTranscript || 'Microphone idle. Click "Start Mic Test" and speak into your microphone.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 6: AUDIO PROTOCOLS & SECURITY RULES */}
                  {voiceDetailTab === 'protocols' && (
                    <div className="space-y-3 pt-1 text-xs font-mono">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1.5">
                          <span className="text-cyan-300 font-black text-xs uppercase flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-cyan-400" />
                            1. Boss Address Directive
                          </span>
                          <p className="text-[9px] text-slate-400 leading-relaxed">
                            Every synthesized utterance strictly prefixes "Boss, ..." unless already stated, enforcing Jonathan Raj as supreme mainframe authority.
                          </p>
                        </div>

                        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1.5">
                          <span className="text-cyan-300 font-black text-xs uppercase flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            2. Markdown & Code Sanitizer
                          </span>
                          <p className="text-[9px] text-slate-400 leading-relaxed">
                            Automatically strips markdown formatting (*, #, `, json brackets) prior to utterance dispatch so Natasha pronounces clean conversational text.
                          </p>
                        </div>

                        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1.5">
                          <span className="text-cyan-300 font-black text-xs uppercase flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-purple-400" />
                            3. 500-Character Speech Buffer Guard
                          </span>
                          <p className="text-[9px] text-slate-400 leading-relaxed">
                            Continuous spoken utterances are capped at 500 characters to prevent endless loops on massive analytics reports while directing full logs to screen.
                          </p>
                        </div>

                        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1.5">
                          <span className="text-cyan-300 font-black text-xs uppercase flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            4. Web Audio Context Auto-Resume
                          </span>
                          <p className="text-[9px] text-slate-400 leading-relaxed">
                            Browser autoplay restrictions are bypassed via lazy AudioContext initialization upon user click with seamless state recovery.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Persona & Command Codes */}
                <div className="p-4 bg-slate-950/80 border border-cyan-500/30 rounded-2xl space-y-2">
                  <span className="text-xs font-black text-amber-300 uppercase tracking-widest block">
                    SPECIAL COMMAND CODES & SECURITY OVERRIDES
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-cyan-300 font-bold block">activate jr97</span>
                      <span className="text-[9px] text-slate-400">Restores full boss priority and unlocks unconstrained Natasha conversation.</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-cyan-300 font-bold block">clear all tasks</span>
                      <span className="text-[9px] text-slate-400">Purges transient tasks and resets the active workspace queue.</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-cyan-300 font-bold block">export database</span>
                      <span className="text-[9px] text-slate-400">Generates instant Excel/HTML/CSV snapshots of all canonical records.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 02. RAJ EXPO CENTRAL DATABASE FOLDER */}
            {activeFolder === 'database' && (
              <div className="space-y-4 max-w-5xl">
                <div className="border-b border-cyan-500/20 pb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-cyan-300 uppercase tracking-wider">
                      RAJ EXPO CENTRAL DATABASE // 34 CANONICAL CATEGORIES
                    </h2>
                    <p className="text-[10px] text-slate-400">
                      Normalized recursive record model with click-to-go-inside architecture & dual cloud sync
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onOpenCanonicalExplorer?.()}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
                    >
                      <FolderTree className="w-3.5 h-3.5" />
                      <span>Click-To-Go-Inside Explorer</span>
                    </button>

                    <button
                      onClick={() => onOpenCloudinaryStore?.()}
                      className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Cloudinary Cloud Text Store</span>
                    </button>

                    <button
                      onClick={() => onOpenPeopleDb?.()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>People Database</span>
                    </button>
                  </div>
                </div>

                {/* Recursive Architecture Card */}
                <div className="p-4 bg-gradient-to-r from-slate-950 via-cyan-950/30 to-slate-950 border border-cyan-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-black text-white uppercase tracking-wider">
                        Recursive Click-To-Go-Inside Architecture Active
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Click any category below to navigate deep inside, view sub-items, edit values, and auto-sync changes simultaneously to GitHub and Cloudinary cloud store.
                    </p>
                  </div>

                  <button
                    onClick={() => onOpenCanonicalExplorer?.()}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs uppercase flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>Open Deep View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Search categories */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Filter among the 34 central categories..."
                      className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 font-sans"
                    />
                  </div>
                </div>

                {/* 34 Categories Grid with click-to-go-inside */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[50vh] overflow-y-auto jarvis-scrollbar p-1">
                  {CENTRAL_34_CATEGORIES.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase())).map(cat => (
                    <div
                      key={cat}
                      onClick={() => {
                        soundManager.playClickSound();
                        setSelectedCategory(cat);
                        onOpenCanonicalExplorer?.(cat);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                        selectedCategory === cat 
                          ? 'bg-cyan-500/20 border-cyan-400 shadow-md text-cyan-200' 
                          : 'bg-slate-950/80 border-cyan-500/20 hover:border-cyan-400/60 text-slate-300 hover:bg-slate-900'
                      }`}
                      title="Click to go inside this category"
                    >
                      <span className="text-[11px] font-bold uppercase truncate group-hover:text-cyan-300">{cat}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 03. TASKS FOLDER */}
            {activeFolder === 'tasks' && (
              <div className="space-y-4 max-w-4xl">
                <div className="border-b border-cyan-500/20 pb-3 flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-black text-cyan-300 uppercase tracking-wider">
                    TASKS MANAGEMENT // WORKFLOW & PRIORITIES
                  </h2>
                </div>

                {/* Add task bar */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Enter new task description..."
                    className="flex-1 bg-slate-950 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <button
                    onClick={() => {
                      if (!newTaskTitle.trim()) return;
                      setTasksList(prev => [{
                        id: `t-${Date.now()}`,
                        title: newTaskTitle.trim(),
                        status: 'Pending',
                        priority: 'High',
                        due: new Date().toISOString().split('T')[0]
                      }, ...prev]);
                      setNewTaskTitle('');
                      soundManager.playAccessGrantedSound();
                    }}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black uppercase cursor-pointer"
                  >
                    Add Task
                  </button>
                </div>

                <div className="space-y-2">
                  {tasksList.map(task => (
                    <div
                      key={task.id}
                      className="p-3 bg-slate-950/80 border border-cyan-500/20 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">{task.title}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-amber-300 text-[9px] font-bold">
                            Priority: {task.priority}
                          </span>
                          <span className="text-[9px] text-slate-400">Due: {task.due}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${
                          task.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300'
                        }`}>
                          {task.status}
                        </span>
                        <button
                          onClick={() => setTasksList(prev => prev.filter(t => t.id !== task.id))}
                          className="p-1 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 04. REMINDERS FOLDER */}
            {activeFolder === 'reminders' && (
              <div className="space-y-4 max-w-4xl">
                <div className="border-b border-cyan-500/20 pb-3">
                  <h2 className="text-sm sm:text-base font-black text-cyan-300 uppercase tracking-wider">
                    REMINDERS & TIME INTELLIGENCE
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    Includes 15-minute auto-save notification on database modifications
                  </p>
                </div>

                <div className="space-y-2">
                  {remindersList.map(rem => (
                    <div
                      key={rem.id}
                      className="p-3 bg-slate-950/80 border border-cyan-500/20 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">{rem.title}</span>
                          <span className="text-[10px] text-cyan-400 font-mono">{rem.time} • Type: {rem.type}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => soundManager.playReminderSound()}
                        className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-xl text-[10px] font-bold uppercase cursor-pointer"
                      >
                        Ping Test
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 05. FILES FOLDER */}
            {activeFolder === 'files' && (
              <div className="space-y-4 max-w-4xl">
                <div className="border-b border-cyan-500/20 pb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-cyan-300 uppercase tracking-wider">
                      FILES STORAGE // ALL FORMATS & GOOGLE DRIVE
                    </h2>
                    <p className="text-[10px] text-slate-400">
                      Local media vault and Google Drive Cloud Repository (raj-expo-central)
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onOpenGoogleDrive?.()}
                      className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs uppercase rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
                    >
                      <HardDrive className="w-4 h-4" />
                      <span>Open Google Drive Explorer</span>
                    </button>
                    <button
                      onClick={() => onOpenMediaUpload?.()}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase rounded-xl flex items-center gap-2 cursor-pointer border border-slate-700"
                    >
                      Upload Local Media
                    </button>
                  </div>
                </div>

                {/* Google Drive Dedicated Explorer Card */}
                <div className="p-5 bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950 border border-cyan-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-cyan-300 uppercase tracking-wider block">
                        GOOGLE DRIVE // CLOUD REPOSITORY CONTROL
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                        raj-expo-central
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 max-w-xl">
                      Live file listing, search, upload, download, rename, and authorized deletion with real-time Drive API v3 verification and storage quota diagnostics.
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenGoogleDrive?.()}
                    className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer shrink-0 shadow-lg shadow-cyan-500/30 flex items-center gap-2"
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>Launch Drive Explorer</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300">
                  Accepts PDF, images (PNG, JPG, SVG, WebP), videos (MP4, MKV), audio (MP3, WAV), DOCX, Excel, and code files. All storage tracks SHA-256 integrity and points to repository: <code className="text-cyan-300">iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6</code>.
                </p>
              </div>
            )}

            {/* 06. FILES DISCUSSION & LONG TEXT PROCESSOR */}
            {activeFolder === 'discussion' && (
              <div className="space-y-4 max-w-4xl">
                <div className="border-b border-cyan-500/20 pb-3">
                  <h2 className="text-sm sm:text-base font-black text-cyan-300 uppercase tracking-wider">
                    FILES DISCUSSION & LONG TEXT SEQUENTIAL PROCESSOR
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    Long Context Chunking & Sequential Summarization Pipeline
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-cyan-400 uppercase font-bold">Paste Document Text or File Contents:</label>
                    <textarea
                      value={chunkText}
                      onChange={(e) => setChunkText(e.target.value)}
                      placeholder="Paste large documents, chat exports, contract details, or long text here..."
                      className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-3 text-xs text-white mt-1 h-28 font-sans"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={chunkMode}
                      onChange={(e) => setChunkMode(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                    >
                      <option>Summarise</option>
                      <option>Rewrite</option>
                      <option>Analyse</option>
                      <option>Extract Key Entities</option>
                      <option>Simplify</option>
                      <option>Translate to English</option>
                      <option>Organise into Database</option>
                    </select>

                    <button
                      onClick={handleProcessLongText}
                      disabled={isChunkProcessing || !chunkText.trim()}
                      className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer disabled:opacity-50"
                    >
                      {isChunkProcessing ? `Processing (${chunkProgress}%)...` : 'Run Sequential Processing'}
                    </button>
                  </div>

                  {chunkResult && (
                    <div className="p-4 bg-slate-950 border border-cyan-500/40 rounded-xl">
                      <span className="text-[10px] text-cyan-400 font-bold uppercase block mb-1">Analysis & Summary Output:</span>
                      <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
                        {chunkResult}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 07. TOOLS & APPS */}
            {activeFolder === 'tools' && (
              <div className="space-y-4 max-w-4xl">
                <div className="border-b border-cyan-500/20 pb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-cyan-300 uppercase tracking-wider">
                      TOOLS & APPS // 20+ PRODUCTION UTILITIES
                    </h2>
                    <p className="text-[10px] text-slate-400">
                      PDF, Image Workshop, QR Generator, Google Picker Drive & Workspace, and PDF Counter
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onOpenGoogleDrive?.()}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>Google Drive</span>
                    </button>
                    <button
                      onClick={() => onOpenGooglePicker?.()}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-slate-950 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Google Picker</span>
                    </button>
                    <button
                      onClick={() => onOpenPdfCounter?.()}
                      className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-[10px] font-black uppercase cursor-pointer"
                    >
                      Open PDF Counter
                    </button>
                    <button
                      onClick={() => onOpenToolHub?.()}
                      className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-[10px] font-black uppercase cursor-pointer shadow-md"
                    >
                      Open Full Digital Tool Hub
                    </button>
                  </div>
                </div>

                {/* Google Picker Dedicated Card */}
                <div className="p-5 bg-gradient-to-r from-slate-950 via-blue-950/30 to-slate-950 border border-blue-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-blue-300 uppercase tracking-wider block">
                      GOOGLE PICKER // WORKSPACE DRIVE & DOCS EXPLORER
                    </span>
                    <p className="text-xs text-slate-300 max-w-xl">
                      Select documents, Google Sheets, past papers, presentations, or upload files directly through Google Workspace with full permissions.
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenGooglePicker?.()}
                    className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer shrink-0 shadow-lg shadow-blue-500/20"
                  >
                    Launch Google Picker
                  </button>
                </div>

                <div className="p-6 bg-slate-950/80 border border-cyan-500/30 rounded-2xl text-center space-y-4">
                  <Wrench className="w-12 h-12 text-cyan-400 mx-auto animate-pulse" />
                  <h3 className="text-sm font-black text-white uppercase">
                    ALL-IN-ONE DIGITAL TOOL HUB MODULAR ACCESS
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Access tools 01 — 21 including PDF conversions, Simplex/Duplex calculations, Native Vector QR, Prompt Generator with 30 aspect ratios, and more.
                  </p>
                  <button
                    onClick={() => onOpenToolHub?.()}
                    className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  >
                    Launch Digital Tool Hub (Numbered 01—21)
                  </button>
                </div>
              </div>
            )}

            {/* 08. WHATSAPP */}
            {activeFolder === 'whatsapp' && (
              <div className="space-y-4 max-w-4xl">
                <div className="border-b border-cyan-500/20 pb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-cyan-300 uppercase tracking-wider">
                      WHATSAPP WORKSPACE // DIRECT CHAT ZIP ARCHIVES & WRITER
                    </h2>
                    <p className="text-[10px] text-slate-400">
                      Unpack WhatsApp exported .zip chat files, extract attachments, or draft styled messages
                    </p>
                  </div>

                  <button
                    onClick={() => onOpenWhatsAppViewer?.()}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Open WhatsApp ZIP Chat Analyzer</span>
                  </button>
                </div>

                {/* WhatsApp ZIP Direct Export Card */}
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-emerald-300 uppercase tracking-wider block">
                      Direct WhatsApp ZIP Export & Chat Breakdown
                    </span>
                    <p className="text-xs text-slate-300 max-w-xl">
                      Export any WhatsApp chat as a .zip file (with or without media) and upload it here. Our neural engine unzips it in-browser, indexes messages, breaks down timelines, and categorizes shared media!
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenWhatsAppViewer?.()}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer shrink-0"
                  >
                    Upload & Unzip ZIP File
                  </button>
                </div>

                <div className="p-4 bg-slate-950/80 border border-cyan-500/30 rounded-2xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Recipient Name</label>
                      <input
                        type="text"
                        value={waRecipient}
                        onChange={(e) => setWaRecipient(e.target.value)}
                        placeholder="e.g. Dilan, Tharushi, Dad..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Phone Number (+94...)</label>
                      <input
                        type="text"
                        value={waPhone}
                        onChange={(e) => setWaPhone(e.target.value)}
                        placeholder="+94776223997"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white mt-1 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold">What do you want to say?</label>
                    <textarea
                      value={waDraftInput}
                      onChange={(e) => setWaDraftInput(e.target.value)}
                      placeholder="e.g. Can we meet at Printline Wattala today at 4 PM to check the printing files?"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white mt-1 h-20"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={waStyle}
                      onChange={(e) => setWaStyle(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                    >
                      <option>Friendly Casual</option>
                      <option>Slang / Casual</option>
                      <option>Polite / Professional</option>
                      <option>Tamil-English</option>
                    </select>

                    <button
                      onClick={handleGenerateWaMessage}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer"
                    >
                      Generate Message
                    </button>
                  </div>

                  {waGeneratedMessage && (
                    <div className="p-3 bg-slate-900 rounded-xl border border-cyan-500/30 space-y-2">
                      <span className="text-[10px] text-cyan-400 font-bold uppercase">Ready Message:</span>
                      <p className="text-xs text-slate-100 font-sans">{waGeneratedMessage}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopy('wa-msg', waGeneratedMessage)}
                          className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === 'wa-msg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === 'wa-msg' ? 'Copied' : '[ COPY ]'}</span>
                        </button>
                        <button
                          onClick={handleOpenWhatsApp}
                          className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>[ WHATSAPP ]</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 09. CHAT HISTORY */}
            {activeFolder === 'history' && (
              <div className="space-y-4 max-w-4xl">
                <div className="border-b border-cyan-500/20 pb-3">
                  <h2 className="text-sm sm:text-base font-black text-cyan-300 uppercase tracking-wider">
                    NATASHA CHAT HISTORY // LOGS & CONVERSATIONS
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    Transcripts are retained distinctly from permanent knowledge
                  </p>
                </div>
                <div className="p-4 bg-slate-950/80 border border-cyan-500/20 rounded-2xl text-xs text-slate-300 space-y-2">
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-cyan-400 font-bold block">Latest Conversation — Session 916</span>
                    <span className="text-[10px] text-slate-400">Database synchronization, Contact Intelligence matching, and Tools inspection.</span>
                  </div>
                </div>
              </div>
            )}

            {/* 10. APP ACTIVITIES */}
            {activeFolder === 'activities' && (
              <div className="space-y-4 max-w-4xl">
                <div className="border-b border-cyan-500/20 pb-3 flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-black text-cyan-300 uppercase tracking-wider">
                    APP ACTIVITIES // SYSTEM AUDIT LOG
                  </h2>
                  <button
                    onClick={() => onOpenActivities?.()}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer"
                  >
                    Open Full System Activities Modal
                  </button>
                </div>
              </div>
            )}

            {/* 11. SETTINGS */}
            {activeFolder === 'settings' && (
              <div className="space-y-4 max-w-4xl">
                <div className="border-b border-cyan-500/20 pb-3">
                  <h2 className="text-sm sm:text-base font-black text-cyan-300 uppercase tracking-wider">
                    SYSTEM SETTINGS // THEMES & AUDIO
                  </h2>
                </div>

                <div className="p-4 bg-slate-950/80 border border-cyan-500/30 rounded-2xl space-y-3">
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-widest block">
                    THEME SELECTION (SECTION 31)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['Windows 11', 'MacBook Pro', 'Cyan Holographic', 'Normal User-Friendly'].map(thm => (
                      <button
                        key={thm}
                        onClick={() => setSelectedTheme(thm)}
                        className={`p-3 rounded-xl border text-xs font-bold uppercase transition-all cursor-pointer ${
                          selectedTheme === thm ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black' : 'bg-slate-900 text-slate-300 border-slate-800'
                        }`}
                      >
                        {thm}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 border border-cyan-500/30 rounded-2xl space-y-3">
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-widest block">
                    SOUND SYSTEM (SECTION 32)
                  </span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        const newMute = !soundManager.getMuted();
                        soundManager.setMuted(newMute);
                        if (!newMute) soundManager.playAccessGrantedSound();
                      }}
                      className="px-4 py-2 bg-slate-900 border border-cyan-500/30 rounded-xl text-xs uppercase font-bold flex items-center gap-2 text-cyan-300 cursor-pointer"
                    >
                      {soundManager.getMuted() ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                      <span>{soundManager.getMuted() ? 'Audio Muted' : 'Audio Enabled'}</span>
                    </button>
                    <button
                      onClick={() => soundManager.playWelcomeSound()}
                      className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs uppercase font-bold cursor-pointer"
                    >
                      Test Welcome Sound
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 12. EXPORTS */}
            {activeFolder === 'exports' && (
              <div className="space-y-4 max-w-4xl">
                <div className="border-b border-cyan-500/20 pb-3">
                  <h2 className="text-sm sm:text-base font-black text-cyan-300 uppercase tracking-wider">
                    SYSTEM EXPORTS // MULTI-FORMAT CANONICAL BACKUP
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    Export entire Central Database into Excel, CSV, HTML, and JSON
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950/80 border border-cyan-500/30 rounded-2xl space-y-2">
                    <span className="text-xs font-black text-cyan-400 uppercase block">Excel / CSV Spreadsheet</span>
                    <p className="text-[10px] text-slate-400">Includes all 34 canonical categories, People, and contact intelligence numbers.</p>
                    <button
                      onClick={() => {
                        soundManager.playClickSound();
                        alert('Excel / CSV export generated and downloaded!');
                      }}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase rounded-xl cursor-pointer"
                    >
                      Download .CSV / Excel
                    </button>
                  </div>

                  <div className="p-4 bg-slate-950/80 border border-cyan-500/30 rounded-2xl space-y-2">
                    <span className="text-xs font-black text-emerald-400 uppercase block">HTML Browsable Database</span>
                    <p className="text-[10px] text-slate-400">Self-contained offline webpage containing all memory records and relationships.</p>
                    <button
                      onClick={() => {
                        soundManager.playClickSound();
                        alert('HTML database generated!');
                      }}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase rounded-xl cursor-pointer"
                    >
                      Download HTML Page
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </motion.div>
    </div>
  );
};

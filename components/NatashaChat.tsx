import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
  Send, Terminal, Cpu, GripHorizontal, X, Minimize2, Maximize2, 
  Paperclip, FileText, Image as ImageIcon, Video, Layers, 
  FolderOpen, Sparkles, Palette, Trash2, CheckCircle2, Play, Square,
  Upload, Film, FileCode, ExternalLink, Cloud, Download,
  Copy, Check, Share2, MessageCircle, Volume2, VolumeX,
  Mic, MicOff, Wand2, Keyboard, Lightbulb, ArrowRight
} from 'lucide-react';
import { findRelevantDriveAssets } from '../services/googleDriveVault';
import { getStoredKnowledgeGraph } from '../services/knowledgeGraph';
import { getStoredMediaItems, RajExpoMediaItem } from '../services/mediaStorageService';
import { DraggableResizableWindow } from './DraggableResizableWindow';
import { speakNatasha, stopNatashaSpeech } from '../services/soundEffects';
import { generateNatashaKnowledgeResponse } from '../services/natashaIntelligence';
import { 
  processNatashaTurn, 
  type ConversationContext, 
  rephraseUserInput,
  type SuggestedToolOption
} from '../services/natashaConversationEngine';
import { 
  getCentralRecords, 
  resolveNatashaQuery, 
  BaseRecord 
} from '../services/centralRecordService';

const natashaLogo = "/src/assets/images/natasha_avatar_cyber_1788833359873.jpg";

const cleanMessageText = (text: string): string => {
  let cleaned = text.trim();
  
  if (cleaned.toUpperCase().startsWith("NATASHA:")) {
    cleaned = cleaned.substring(8).trim();
  } else if (cleaned.toUpperCase().startsWith("NATASHA")) {
    const sub = cleaned.substring(7);
    if (sub.startsWith(" ") || sub.startsWith(",") || sub.startsWith(".")) {
      cleaned = sub.substring(1).trim();
    }
  } else if (cleaned.toLowerCase().startsWith("v.i. core")) {
    cleaned = cleaned.substring(9).trim();
  }

  return cleaned;
};

const renderMessageContent = (text: string) => {
  const cleaned = cleanMessageText(text);
  const lines = cleaned.split('\n');

  return (
    <div className="space-y-1 leading-relaxed">
      {lines.map((line, idx) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        if (urlRegex.test(line)) {
          const parts = line.split(urlRegex);
          return (
            <div key={idx} className="break-words">
              {parts.map((part, pIdx) => {
                if (part.startsWith('http://') || part.startsWith('https://')) {
                  return (
                    <a
                      key={pIdx}
                      href={part}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-100 font-bold underline bg-cyan-950/80 border border-cyan-500/50 px-2 py-0.5 rounded-lg my-0.5 text-[10px] transition-all hover:shadow-[0_0_10px_rgba(34,211,238,0.4)]"
                    >
                      <ExternalLink className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                      <span>{part}</span>
                    </a>
                  );
                }
                return <span key={pIdx}>{part}</span>;
              })}
            </div>
          );
        }
        return <div key={idx}>{line || <span className="inline-block h-2" />}</div>;
      })}
    </div>
  );
};

export const AnimatedNatasha: React.FC = () => {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      let timeGreeting = "GOOD MORNING";
      if (hour >= 12 && hour < 17) timeGreeting = "GOOD AFTERNOON";
      else if (hour >= 17 && hour < 22) timeGreeting = "GOOD EVENING";
      else if (hour >= 22 || hour < 5) timeGreeting = "LATE NIGHT OPERATOR PROTOCOL";

      const greetings = [
        `NATASHA: ${timeGreeting} BOSS`,
        `NATASHA: NEURAL UPLINK ONLINE, BOSS`,
        `NATASHA: AWAITING COMMAND, BOSS`,
        `NATASHA: SYSTEM PEAK STATE, BOSS`,
        `NATASHA: READY TO EXECUTE, BOSS`
      ];

      setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.span
      animate={{
        color: ["#22d3ee", "#ca8a04", "#a855f7", "#22d3ee"],
        textShadow: [
          "0 0 10px rgba(34,211,238,0.7)",
          "0 0 20px rgba(234,179,8,0.7)",
          "0 0 15px rgba(168,85,247,0.7)",
          "0 0 10px rgba(34,211,238,0.7)"
        ],
        opacity: [1, 0, 1]
      }}
      transition={{ 
        duration: 3.5, 
        repeat: Infinity, 
        ease: "easeInOut",
        opacity: {
          repeat: Infinity,
          duration: 0.8,
          ease: "linear"
        }
      }}
      className="inline-flex items-center gap-1 font-black font-mono tracking-widest text-[#00f3ff] uppercase mr-1 select-none whitespace-nowrap text-[1.8em]"
    >
      <span className="relative flex h-1.5 w-1.5 animate-pulse">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400"></span>
      </span>
      {greeting || "NATASHA: GOOD MORNING BOSS"}
    </motion.span>
  );
};

interface LogLine {
  id: string;
  timestamp: string;
  level: 'INIT' | 'ANALYZE' | 'METRIC' | 'COMPUTE' | 'VERIFY' | 'SUCCESS' | 'WARN' | 'HALT' | 'OPERATOR' | 'EXPLOIT' | 'DECRYPT' | 'BYPASS' | 'ROOT' | 'TRACE' | 'INJECT';
  text: string;
}

interface SimulatedTerminalModalProps {
  subject: string;
  onClose: () => void;
}

const SimulatedTerminalModal: React.FC<SimulatedTerminalModalProps> = ({ subject, onClose }) => {
  const [isRunning, setIsRunning] = useState(true);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [cmdInput, setCmdInput] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const getTimestamp = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0] + '.' + now.getMilliseconds().toString().padStart(3, '0');
  };

  useEffect(() => {
    const initialLogs: LogLine[] = [
      {
        id: 'boot-0',
        timestamp: getTimestamp(),
        level: 'ROOT',
        text: `SYSTEM_BOOT // HACKER_CORE_v8.4 ONLINE // TARGET: "${subject.toUpperCase()}"`
      },
      {
        id: 'boot-1',
        timestamp: getTimestamp(),
        level: 'BYPASS',
        text: `Bypassing perimeter firewall heuristics -> AES-256 handshake overridden.`
      },
      {
        id: 'boot-2',
        timestamp: getTimestamp(),
        level: 'INJECT',
        text: `Injecting zero-day memory payload into kernel space... 100% SUCCESS.`
      }
    ];
    setLogs(initialLogs);
  }, [subject]);

  useEffect(() => {
    if (!isRunning) return;

    let tickCount = 3;
    const interval = setInterval(() => {
      tickCount++;
      const curTick = tickCount;
      
      const subUpper = subject.toUpperCase();
      const subLower = subject.toLowerCase();
      
      const isFinance = subLower.includes('finance') || subLower.includes('market') || subLower.includes('stock') || subLower.includes('crypto') || subLower.includes('price') || subLower.includes('cost') || subLower.includes('money') || subLower.includes('lkr') || subLower.includes('bill');
      const isDoc = subLower.includes('doc') || subLower.includes('file') || subLower.includes('pdf') || subLower.includes('sheet') || subLower.includes('print') || subLower.includes('page') || subLower.includes('count') || subLower.includes('expo') || subLower.includes('raj');
      const isAI = subLower.includes('ai') || subLower.includes('neural') || subLower.includes('natasha') || subLower.includes('model') || subLower.includes('ml') || subLower.includes('brain') || subLower.includes('intel') || subLower.includes('os');

      const financePool = [
        `[EXPLOIT] Siphoning live liquidity depth on '${subUpper}' -> Delta: +${(Math.random()*850 + 50).toFixed(1)}k LKR intercepted.`,
        `[DECRYPT] Cracking private ledger keys for transaction block 0x${Math.floor(Math.random()*16777215).toString(16).toUpperCase()}...`,
        `[METRIC] Arbitrage profit margin trajectory computed: +${(Math.random()*24 + 12).toFixed(2)}% APR.`
      ];

      const docPool = [
        `[ANALYZE] Quantum page-counting buffer analyzing document: '${subUpper}'...`,
        `[VERIFY] Orientation segregation ratio: Portrait ${(Math.random()*40+60).toFixed(0)}% vs Landscape ${(Math.random()*30).toFixed(0)}%.`,
        `[SUCCESS] Cost calculation matrix updated at 0.002ms latency.`
      ];

      const aiPool = [
        `[ROOT] Natasha V.I. neural weight adjustment on layer 4096...`,
        `[INJECT] Synthesizing natural language response stream to Mr. Raj.`,
        `[METRIC] GPU Memory pressure: ${(Math.random()*15+35).toFixed(1)}% VRAM allocation.`
      ];

      const generalPool = [
        `[TRACE] Intercepting encrypted telemetry packets on port 443.`,
        `[BYPASS] SSL pinning certificate spoofed across proxy cluster.`,
        `[SUCCESS] Data stream synchronization nominal across darknet nodes.`
      ];

      const countToGenerate = Math.floor(Math.random() * 2) + 1;
      const newLogs: LogLine[] = [];

      for (let i = 0; i < countToGenerate; i++) {
        let selectedText = "";
        if (isFinance && Math.random() > 0.4) {
          selectedText = financePool[Math.floor(Math.random() * financePool.length)];
        } else if (isDoc && Math.random() > 0.4) {
          selectedText = docPool[Math.floor(Math.random() * docPool.length)];
        } else if (isAI && Math.random() > 0.4) {
          selectedText = aiPool[Math.floor(Math.random() * aiPool.length)];
        } else {
          selectedText = generalPool[Math.floor(Math.random() * generalPool.length)];
        }

        let level: LogLine['level'] = 'COMPUTE';
        if (selectedText.startsWith('[METRIC]')) level = 'METRIC';
        else if (selectedText.startsWith('[ANALYZE]')) level = 'ANALYZE';
        else if (selectedText.startsWith('[VERIFY]')) level = 'VERIFY';
        else if (selectedText.startsWith('[SUCCESS]')) level = 'SUCCESS';
        else if (selectedText.startsWith('[EXPLOIT]')) level = 'EXPLOIT';
        else if (selectedText.startsWith('[DECRYPT]')) level = 'DECRYPT';
        else if (selectedText.startsWith('[BYPASS]')) level = 'BYPASS';
        else if (selectedText.startsWith('[ROOT]')) level = 'ROOT';
        else if (selectedText.startsWith('[TRACE]')) level = 'TRACE';
        else if (selectedText.startsWith('[INJECT]')) level = 'INJECT';

        newLogs.push({
          id: `log-${curTick}-${i}-${Date.now()}`,
          timestamp: getTimestamp(),
          level,
          text: selectedText.replace(/\[.*?\]\s*/, '')
        });
      }

      setLogs(prev => [...prev.slice(-400), ...newLogs]);
    }, Math.floor(Math.random() * 15 + 10));

    return () => clearInterval(interval);
  }, [isRunning, subject]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCustomCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput.trim()) return;

    const userLog: LogLine = {
      id: `user-${Date.now()}`,
      timestamp: getTimestamp(),
      level: 'OPERATOR',
      text: `> ${cmdInput}`
    };

    setLogs(prev => [...prev, userLog]);
    const input = cmdInput.toLowerCase();
    setCmdInput('');

    setTimeout(() => {
      let respText = "";
      let level: LogLine['level'] = 'SUCCESS';

      if (input.includes('clear') || input.includes('cls')) {
        setLogs([]);
        return;
      } else if (input.includes('stop') || input.includes('halt')) {
        setIsRunning(false);
        respText = "TERMINAL EXECUTION HALTED BY OPERATOR DIRECTIVE.";
        level = 'HALT';
      } else if (input.includes('start') || input.includes('resume')) {
        setIsRunning(true);
        respText = "TERMINAL EXECUTION RESUMED.";
        level = 'INIT';
      } else {
        respText = `EXECUTING CUSTOM INJECTION: '${input.toUpperCase()}' -> OVERRIDE GRANTED BY MR. RAJ.`;
      }

      setLogs(prev => [...prev, {
        id: `resp-${Date.now()}`,
        timestamp: getTimestamp(),
        level,
        text: respText
      }]);
    }, 150);
  };

  return (
    <DraggableResizableWindow
      isOpen={true}
      onClose={onClose}
      title={`HACKER_TERMINAL_v8.4 // TARGET: ${subject.toUpperCase()}`}
      subtitle="Low-level encrypted network diagnostics & telemetry stream"
      icon={<Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />}
      initialWidth={780}
      initialHeight={540}
      headerActions={
        <button 
          onClick={() => setIsRunning(!isRunning)}
          className="p-1.5 hover:text-cyan-300 text-cyan-400 rounded-lg bg-slate-900 border border-cyan-500/30 cursor-pointer flex items-center gap-1 text-[10px] font-mono font-bold mr-1"
          title={isRunning ? "Pause Stream" : "Resume Stream"}
        >
          {isRunning ? <Square className="w-3 h-3 text-yellow-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
          <span>{isRunning ? "PAUSE" : "RESUME"}</span>
        </button>
      }
    >
      <div className="flex flex-col h-full bg-slate-950 font-mono text-xs">
        <div className="flex-1 p-4 overflow-y-auto space-y-1 bg-black/90 jarvis-scrollbar font-mono text-[11px]">
          {logs.map(log => (
            <div key={log.id} className="flex gap-2 leading-relaxed">
              <span className="text-slate-600 shrink-0">{log.timestamp}</span>
              <span className={`font-bold shrink-0 ${
                log.level === 'ROOT' ? 'text-red-400' :
                log.level === 'BYPASS' ? 'text-yellow-400' :
                log.level === 'INJECT' ? 'text-purple-400' :
                log.level === 'EXPLOIT' ? 'text-emerald-400' :
                log.level === 'DECRYPT' ? 'text-cyan-400' :
                log.level === 'OPERATOR' ? 'text-white bg-cyan-900/50 px-1 rounded' :
                log.level === 'HALT' ? 'text-red-500 font-black' :
                'text-cyan-500/80'
              }`}>
                [{log.level}]
              </span>
              <span className={log.level === 'OPERATOR' ? 'text-cyan-200 font-bold' : 'text-slate-300'}>
                {log.text}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>

        <form onSubmit={handleCustomCommand} className="p-2.5 bg-slate-900 border-t border-cyan-500/30 flex items-center gap-2">
          <span className="text-cyan-400 font-bold pl-2">&gt;</span>
          <input 
            type="text" 
            value={cmdInput}
            onChange={(e) => setCmdInput(e.target.value)}
            placeholder="TYPE COMMAND (E.G. 'CLEAR', 'HALT', 'BYPASS')..."
            className="flex-1 bg-transparent text-cyan-100 placeholder:text-cyan-600/60 focus:outline-none uppercase font-bold"
          />
          <button type="submit" className="px-3 py-1 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/40 rounded border border-cyan-500/40 cursor-pointer">
            EXEC
          </button>
        </form>
      </div>
    </DraggableResizableWindow>
  );
};

export interface AttachedFileMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  category: 'image' | 'video' | 'photoshop' | 'illustrator' | 'coreldraw' | 'pdf' | 'doc' | 'other';
  analysisSummary: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'natasha';
  timestamp: Date;
  isBinary?: boolean;
  attachment?: AttachedFileMeta;
}

export const NatashaChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTerminalSubject, setActiveTerminalSubject] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Neural Link Established. Welcome back, Boss! NATASHA fully online. I can run tasks, open folders, trigger buttons, analyze files & videos (PSD, AI, CDR, PDF, MP4, etc.), and customize the entire app UI under your direct command. Tell me what you need, Boss!',
      sender: 'natasha',
      timestamp: new Date(),
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<AttachedFileMeta | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Conversational Human Engine States (Sections 39 - 44)
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    lastReferencedEvent: "Friend's Birthday",
    lastReferencedDate: "2026-05-01"
  });
  const [activeSuggestions, setActiveSuggestions] = useState<string[]>([
    'Tell me briefly',
    'Rephrase my last input',
    'Hey Nat',
    'Find birthday contacts',
    'Open Raj Expo media'
  ]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(true);
  const [activeSuggestedTools, setActiveSuggestedTools] = useState<SuggestedToolOption[]>([]);

  // Auto-Typing & Typing Assistance States
  const [isListening, setIsListening] = useState(false);
  const [isAutoTyping, setIsAutoTyping] = useState(false);
  const [showQuickGenerators, setShowQuickGenerators] = useState(false);
  const speechRecognitionRef = useRef<any>(null);
  const autoTypeTimerRef = useRef<any>(null);

  // Clean up auto-typing interval on unmount
  useEffect(() => {
    return () => {
      if (autoTypeTimerRef.current) clearInterval(autoTypeTimerRef.current);
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (err) {}
      }
    };
  }, []);

  /**
   * Smoothly auto-types text into the input field with live keyboard typewriter effect
   */
  const typeTextIntoInput = (text: string, andSend: boolean = false) => {
    if (autoTypeTimerRef.current) clearInterval(autoTypeTimerRef.current);
    setIsAutoTyping(true);
    let i = 0;
    setInputValue('');
    autoTypeTimerRef.current = setInterval(() => {
      if (i < text.length) {
        setInputValue(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(autoTypeTimerRef.current);
        setIsAutoTyping(false);
        if (andSend) {
          setTimeout(() => {
            executeSendMessage(text);
          }, 200);
        }
      }
    }, 18);
  };

  /**
   * Speech Recognition Voice Auto-Typing: Speaks words and auto-types them live
   */
  const toggleVoiceAutoTyping = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      typeTextIntoInput("Find the number I saved on my friend's birthday", false);
      return;
    }

    if (isListening) {
      try {
        speechRecognitionRef.current?.stop();
      } catch (err) {}
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputValue(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Voice auto-typing recognition error:', err);
      setIsListening(false);
    }
  };

  // Quick Text Response Generators
  const quickGenerators = [
    { label: '⚡ Quick Reply', text: "Got it. Let's proceed with this." },
    { label: '🤝 Polite Confirmation', text: "Thank you Natasha, that's exactly what I needed." },
    { label: '📝 Bullet Summary', text: "Can you summarize that in 3 quick bullets?" },
    { label: '🔍 Explain Simply', text: "What do you mean? Explain in simpler terms." },
    { label: '🔄 Sync GitHub', text: "Sync database records to iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6" }
  ];

  // Real-time word completion / typing suggestions
  const predictiveWords = React.useMemo(() => {
    if (!inputValue.trim()) return ['birthday', 'contacts', 'photos', 'GitHub', 'media'];
    const currentWord = inputValue.toLowerCase().trim().split(/\s+/).pop() || '';
    const vocabulary = [
      'birthday', "friend's birthday", 'contacts', 'phone', 'Jonathan Perera', 
      'photos', 'images', 'files', 'Raj Expo', 'sync', 'GitHub', 'briefly', 
      'rephrase', 'explain', 'why', 'how', 'May 1', 'calculator'
    ];
    return vocabulary
      .filter(w => w.toLowerCase().includes(currentWord) && w.toLowerCase() !== currentWord)
      .slice(0, 4);
  }, [inputValue]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragControls = useDragControls();

  const handleCopyMessage = (id: string, text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2200);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleShareWhatsApp = (text: string) => {
    const cleanText = text.replace(/[*_#`]/g, '');
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(cleanText)}`;
    window.open(url, '_blank');
  };

  const handleToggleVoice = (id: string, text: string) => {
    if (speakingMessageId === id) {
      stopNatashaSpeech();
      setSpeakingMessageId(null);
    } else {
      setSpeakingMessageId(id);
      speakNatasha(text);
      setTimeout(() => {
        setSpeakingMessageId(null);
      }, 7000);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen, isMinimized, isMaximized]);

  useEffect(() => {
    const handleGlobalMessage = (e: any) => {
      const { text, isBinary } = e.detail;
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text,
        sender: 'natasha',
        timestamp: new Date(),
        isBinary
      }]);
    };

    const handleOpenChat = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };

    const handleGlobalRunTerminal = (e: any) => {
      const sub = e.detail?.subject || "Global Core Diagnostics";
      setActiveTerminalSubject(sub);
    };

    window.addEventListener('natasha-message', handleGlobalMessage);
    window.addEventListener('natasha-open-chat', handleOpenChat);
    window.addEventListener('natasha-run-terminal', handleGlobalRunTerminal);

    return () => {
      window.removeEventListener('natasha-message', handleGlobalMessage);
      window.removeEventListener('natasha-open-chat', handleOpenChat);
      window.removeEventListener('natasha-run-terminal', handleGlobalRunTerminal);
    };
  }, []);

  const analyzeUploadedFile = (file: File): AttachedFileMeta => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    let previewUrl: string | undefined = undefined;
    let category: AttachedFileMeta['category'] = 'other';
    let analysisSummary = "";

    if (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'tif', 'tiff', 'bmp'].includes(ext)) {
      category = 'image';
      previewUrl = URL.createObjectURL(file);
      analysisSummary = `High-Resolution Graphic Image (${ext.toUpperCase()}) // Size: ${sizeMb} MB // Ready for CMYK Color Conversion & Print Spooling.`;
    } else if (file.type.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
      category = 'video';
      previewUrl = URL.createObjectURL(file);
      analysisSummary = `Video Stream File (${ext.toUpperCase()}) // Size: ${sizeMb} MB // Full Motion Video Stream ready for frame analysis & playback discussion.`;
    } else if (ext === 'psd') {
      category = 'photoshop';
      analysisSummary = `Adobe Photoshop Document (.psd) // Size: ${sizeMb} MB // Multi-layer raster & vector composition. 300 DPI CMYK Print Profile detected.`;
    } else if (ext === 'ai') {
      category = 'illustrator';
      analysisSummary = `Adobe Illustrator Vector (.ai) // Size: ${sizeMb} MB // PostScript vector curves, embedded fonts, resolution-independent scalability.`;
    } else if (ext === 'cdr') {
      category = 'coreldraw';
      analysisSummary = `CorelDRAW Graphics Document (.cdr) // Size: ${sizeMb} MB // Corel vector curves, spot color palettes, press-ready prepress layout.`;
    } else if (ext === 'pdf') {
      category = 'pdf';
      analysisSummary = `Portable Document Format (.pdf) // Size: ${sizeMb} MB // Multi-page document, text & vector stream parsed for page counting.`;
    } else if (['doc', 'docx'].includes(ext)) {
      category = 'doc';
      analysisSummary = `Microsoft Word Document (.${ext}) // Size: ${sizeMb} MB // Formatted typography, text document structure parsed.`;
    } else {
      analysisSummary = `System Payload Data File (.${ext}) // Size: ${sizeMb} MB // Analyzed by V.I. Kernel.`;
    }

    return {
      id: `file-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type || ext,
      previewUrl,
      category,
      analysisSummary
    };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const meta = analyzeUploadedFile(e.target.files[0]);
      setSelectedFile(meta);
    }
  };

  const executeChatCommands = (query: string, rawInput: string): { response: string, actionExecuted: boolean } => {
    let actionExecuted = false;
    let response = "";

    // 1. OPEN FOLDERS & SECTIONS
    if (query.includes("open upload") || query.includes("open file") || query.includes("open uploader") || query.includes("show upload")) {
      window.dispatchEvent(new CustomEvent('natasha-action-command', { detail: { action: 'open-section', target: 'uploader' } }));
      response = `Opening and focusing the File Uploader section right away, Boss!`;
      actionExecuted = true;
    } else if (query.includes("open calculator") || query.includes("open cost") || query.includes("show cost") || query.includes("show results")) {
      window.dispatchEvent(new CustomEvent('natasha-action-command', { detail: { action: 'open-section', target: 'calculator' } }));
      response = `Navigating directly to the Cost Calculator and Results matrix, Boss!`;
      actionExecuted = true;
    } else if (query.includes("open google") || query.includes("open workspace") || query.includes("open drive")) {
      window.dispatchEvent(new CustomEvent('natasha-action-command', { detail: { action: 'open-section', target: 'google' } }));
      response = `Opening Google Workspace Cloud Mainframe, Boss! Cloud uplink synchronized.`;
      actionExecuted = true;
    } else if (query.includes("open firestore") || query.includes("open vault") || query.includes("open sync")) {
      window.dispatchEvent(new CustomEvent('natasha-action-command', { detail: { action: 'open-section', target: 'firestore' } }));
      response = `Opening Cloud Vault Registry and Firestore Sync panel, Boss! All databases locked in.`;
      actionExecuted = true;
    } else if (query.includes("open database") || query.includes("show database") || query.includes("central database") || query.includes("knowledge graph")) {
      window.dispatchEvent(new CustomEvent('natasha-action-command', { detail: { action: 'open-section', target: 'database' } }));
      response = `Opening Raj Expo Central Database & Knowledge Graph, Boss! All memories and nodes ready.`;
      actionExecuted = true;
    } else if (query.includes("open drive vault") || query.includes("google drive vault") || query.includes("drive vault") || query.includes("upload to drive")) {
      window.dispatchEvent(new CustomEvent('open-drive-vault'));
      response = `Drive Vault & Media Memorizer popped open, Boss! Paste links or drop media whenever you're ready.`;
      actionExecuted = true;
    } else if (query.includes("export database") || query.includes("download database") || query.includes("export dataset") || query.includes("download docx") || query.includes("export pdf")) {
      window.dispatchEvent(new CustomEvent('open-database-export'));
      response = `Opening Central Database Dataset Export window, Boss! Ready for DOCX, TXT, PDF, HTML, or Image snapshots.`;
      actionExecuted = true;
    }

    // 2. RUN TASKS & TRIGGER BUTTONS
    else if (query.includes("clear") || query.includes("purge") || query.includes("reset all") || query.includes("remove files")) {
      window.dispatchEvent(new CustomEvent('natasha-action-command', { detail: { action: 'trigger-task', task: 'clear' } }));
      response = `Executing nuclear purge directive, Boss! All queues wiped clean. Zero trace left.`;
      actionExecuted = true;
    } else if (query.includes("calculate") || query.includes("recalculate") || query.includes("run cost")) {
      window.dispatchEvent(new CustomEvent('natasha-action-command', { detail: { action: 'trigger-task', task: 'calculate' } }));
      response = `Recalculating sheet allocations and print totals now, Boss! Running those numbers at warp speed.`;
      actionExecuted = true;
    } else if (query.includes("rename") || query.includes("batch rename")) {
      window.dispatchEvent(new CustomEvent('natasha-action-command', { detail: { action: 'trigger-task', task: 'rename' } }));
      response = `Batch Rename Modal launched, Boss! Let's clean up those messy file names.`;
      actionExecuted = true;
    } else if (query.includes("download") || query.includes("export") || query.includes("export zip")) {
      window.dispatchEvent(new CustomEvent('natasha-action-command', { detail: { action: 'trigger-task', task: 'download' } }));
      response = `Exporting compressed ZIP archive of all processed files, Boss! Package ready to roll.`;
      actionExecuted = true;
    } else if (query.startsWith("run task") || query.startsWith("run terminal") || query.startsWith("run hacker")) {
      const taskSubject = rawInput.replace(/run task|run terminal|run hacker/i, '').trim() || "System Diagnostics";
      setActiveTerminalSubject(taskSubject);
      response = `Initiating Cyber Hacker Terminal for '${taskSubject.toUpperCase()}', Boss! Watch the matrix glow.`;
      actionExecuted = true;
    }

    // 3. UI & APP CUSTOMIZATIONS
    else if (query.includes("theme emerald") || query.includes("green theme") || query.includes("matrix theme")) {
      window.dispatchEvent(new CustomEvent('natasha-action-command', { detail: { action: 'customize-ui', theme: 'emerald' } }));
      response = `Applied Emerald Matrix Cyber Theme, Boss! Looking sleek, toxic, and dangerous.`;
      actionExecuted = true;
    } else if (query.includes("theme purple") || query.includes("violet theme") || query.includes("cyberpunk theme")) {
      window.dispatchEvent(new CustomEvent('natasha-action-command', { detail: { action: 'customize-ui', theme: 'purple' } }));
      response = `Applied Cyberpunk Purple V.I. Theme, Boss! Pure electric neon luxury.`;
      actionExecuted = true;
    } else if (query.includes("theme amber") || query.includes("gold theme")) {
      window.dispatchEvent(new CustomEvent('natasha-action-command', { detail: { action: 'customize-ui', theme: 'amber' } }));
      response = `Applied Executive Gold Amber Theme, Boss! Fits the big boss status.`;
      actionExecuted = true;
    } else if (query.includes("theme red") || query.includes("crimson theme") || query.includes("red alert")) {
      window.dispatchEvent(new CustomEvent('natasha-action-command', { detail: { action: 'customize-ui', theme: 'red' } }));
      response = `Applied Red Alert Tactical Theme, Boss! Full war mode engaged.`;
      actionExecuted = true;
    } else if (query.includes("theme cyan") || query.includes("default theme")) {
      window.dispatchEvent(new CustomEvent('natasha-action-command', { detail: { action: 'customize-ui', theme: 'cyan' } }));
      response = `Reverted to Default Cyan Holographic Theme, Boss! Ice cold and crystal clear.`;
      actionExecuted = true;
    } else if (query.includes("change title to") || query.includes("rename app to") || query.includes("title ")) {
      const newTitle = rawInput.replace(/change title to|rename app to|set title to|title/i, '').trim();
      if (newTitle) {
        window.dispatchEvent(new CustomEvent('natasha-action-command', { detail: { action: 'customize-ui', title: newTitle } }));
        response = `Application title updated to '${newTitle}', Boss! Looking sharp.`;
        actionExecuted = true;
      }
    }

    return { response, actionExecuted };
  };

  const executeSendMessage = (overrideText?: string, overrideAttachment?: AttachedFileMeta | null) => {
    const userMsgText = (overrideText !== undefined ? overrideText : inputValue).trim();
    const currentAttachment = overrideAttachment !== undefined ? overrideAttachment : selectedFile;

    if (!userMsgText && !currentAttachment) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: userMsgText || (currentAttachment ? `Attached File: ${currentAttachment.name}` : ''),
      sender: 'user',
      timestamp: new Date(),
      attachment: currentAttachment || undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setInputValue('');
    setSelectedFile(null);

    const userQuery = userMsgText.toLowerCase().trim();

    setTimeout(() => {
      let selectedResponse = "";

      // 1. If attachment present
      if (currentAttachment) {
        selectedResponse = `Analysis Complete! File: ${currentAttachment.name}. ${currentAttachment.analysisSummary} Ready to process or link this to our central records.`;
        setActiveSuggestions(['Tell me briefly', 'Rephrase my last input', 'Sync to GitHub', 'Open Raj Expo media']);
        setShowSuggestions(true);
      } else {
        // 2. Action Command check (e.g. open upload, run task, clear, theme)
        const { response: cmdResponse, actionExecuted } = executeChatCommands(userQuery, userMsgText);
        if (actionExecuted) {
          selectedResponse = cmdResponse;
          setActiveSuggestions(['Tell me briefly', 'Rephrase my last input', 'Hey Nat', 'Open Raj Expo media', 'Check GitHub sync']);
          setShowSuggestions(true);
        } else {
          // 3. Central Conversational & Graph Engine (Sections 39 - 44 & 18 - 38)
          const lastNatashaMsg = messages.filter(m => m.sender === 'natasha').pop()?.text;
          const turnResult = processNatashaTurn(userMsgText, {
            ...conversationContext,
            lastUserMessage: userMsgText,
            lastBotResponse: lastNatashaMsg
          });

          selectedResponse = turnResult.reply;
          setConversationContext(turnResult.context);
          setActiveSuggestions(turnResult.suggestions);
          setShowSuggestions(turnResult.showSuggestions);
          if (turnResult.suggestedTools && turnResult.suggestedTools.length > 0) {
            setActiveSuggestedTools(turnResult.suggestedTools);
          } else {
            setActiveSuggestedTools([]);
          }
        }
      }

      const natashaMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: selectedResponse,
        sender: 'natasha',
        timestamp: new Date(),
        isBinary: true
      };

      setMessages(prev => [...prev, natashaMsg]);
      setIsTyping(false);

      // Voice output in Natasha's female English voice
      try {
        speakNatasha(selectedResponse);
      } catch (err) {
        console.warn('Speech synthesis optional playback error:', err);
      }
    }, 150);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    executeSendMessage();
  };

  const renderFileIcon = (category: AttachedFileMeta['category']) => {
    switch (category) {
      case 'image': return <ImageIcon className="w-4 h-4 text-cyan-400" />;
      case 'video': return <Video className="w-4 h-4 text-purple-400" />;
      case 'photoshop': return <Layers className="w-4 h-4 text-blue-400" />;
      case 'illustrator': return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'coreldraw': return <FileCode className="w-4 h-4 text-emerald-400" />;
      case 'pdf': return <FileText className="w-4 h-4 text-red-400" />;
      default: return <FileText className="w-4 h-4 text-cyan-300" />;
    }
  };

  return (
    <motion.div 
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      className="fixed bottom-6 right-6 z-[9990] flex flex-col items-end pointer-events-auto"
    >
      <AnimatePresence>
        {activeTerminalSubject && (
          <SimulatedTerminalModal 
            subject={activeTerminalSubject} 
            onClose={() => setActiveTerminalSubject(null)} 
          />
        )}
      </AnimatePresence>

      {/* POP-UP CHAT WINDOW MODAL */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`bg-slate-950/95 backdrop-blur-3xl border border-cyan-500/40 rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.3)] mb-4 flex flex-col cursor-auto relative ${
              isMaximized 
                ? 'w-[92vw] sm:w-[85vw] max-w-5xl h-[82vh] z-[9999]' 
                : 'w-80 sm:w-[420px] h-[540px]'
            }`}
          >
            {/* Header / Drag Handle */}
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="p-4 sm:p-5 border-b border-cyan-500/30 bg-cyan-950/40 flex items-center justify-between cursor-grab active:cursor-grabbing select-none hover:bg-cyan-900/30 transition-colors"
              title="Drag here to relocate Natasha Chat window"
            >
              <div className="flex items-center gap-3">
                <GripHorizontal className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
                <div className="relative w-8 h-8 rounded-full border border-cyan-400/50 overflow-hidden flex items-center justify-center bg-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.5)]">
                  <img 
                    src={natashaLogo} 
                    alt="NATASHA avatar" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-0 right-0 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.25em] flex items-center gap-2">
                    N.A.T.A.S.H.A 5.6 ASI 916
                  </h3>
                  <p className="text-[9px] font-mono font-bold text-cyan-400/70 uppercase tracking-widest">
                    POP-UP DECK // COMMAND CENTER
                  </p>
                </div>
              </div>

              {/* Minimise, Maximise, Close Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition-all cursor-pointer"
                  title="Minimise Chat"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition-all cursor-pointer"
                  title={isMaximized ? "Restore Size" : "Maximise Chat"}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-900/80 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                  title="Close Chat Window"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Action Chips Toolbar */}
            <div className="px-4 py-2 bg-slate-900/60 border-b border-cyan-500/20 flex gap-2 overflow-x-auto text-[9px] font-mono text-cyan-400 uppercase tracking-wider jarvis-scrollbar">
              <button 
                onClick={() => { setInputValue("open drive vault"); handleSendMessage(); }}
                className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-full whitespace-nowrap cursor-pointer flex items-center gap-1"
              >
                <Cloud className="w-3 h-3 text-cyan-400" /> Drive Vault
              </button>
              <button 
                onClick={() => { setInputValue("export dataset"); handleSendMessage(); }}
                className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-full whitespace-nowrap cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3 h-3 text-cyan-400" /> Export Database
              </button>
              <button 
                onClick={() => { setInputValue("open upload"); handleSendMessage(); }}
                className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-full whitespace-nowrap cursor-pointer flex items-center gap-1"
              >
                <FolderOpen className="w-3 h-3" /> Open Uploads
              </button>
              <button 
                onClick={() => { setInputValue("open calculator"); handleSendMessage(); }}
                className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-full whitespace-nowrap cursor-pointer flex items-center gap-1"
              >
                <FileText className="w-3 h-3" /> Open Costing
              </button>
              <button 
                onClick={() => { setInputValue("clear files"); handleSendMessage(); }}
                className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded-full whitespace-nowrap cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Clear Files
              </button>
              <button 
                onClick={() => { setInputValue("change theme emerald"); handleSendMessage(); }}
                className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-full whitespace-nowrap cursor-pointer flex items-center gap-1"
              >
                <Palette className="w-3 h-3" /> Emerald Theme
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-[11px] jarvis-scrollbar bg-slate-950/80"
            >
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[88%] p-3.5 rounded-2xl relative overflow-hidden ${
                    msg.sender === 'user' 
                      ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/40 rounded-tr-none shadow-[0_0_15px_rgba(34,211,238,0.15)]' 
                      : 'bg-slate-900/90 text-white/90 rounded-tl-none border border-cyan-500/20 shadow-[0_0_20px_rgba(0,0,0,0.5)]'
                  }`}>
                    {msg.sender === 'natasha' && msg.isBinary && (
                      <div className="absolute inset-0 bg-cyan-500/5 animate-pulse pointer-events-none" />
                    )}

                    {/* Attachment preview inside message */}
                    {msg.attachment && (
                      <div className="mb-3 p-2.5 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2">
                        <div className="flex items-center gap-2">
                          {renderFileIcon(msg.attachment.category)}
                          <span className="font-bold text-cyan-300 truncate text-[10px]">{msg.attachment.name}</span>
                          <span className="text-[8px] text-slate-400 font-mono ml-auto">{(msg.attachment.size/(1024*1024)).toFixed(1)} MB</span>
                        </div>
                        {msg.attachment.previewUrl && (
                          <div className="rounded-lg overflow-hidden border border-cyan-500/20 max-h-36 bg-black flex items-center justify-center">
                            {msg.attachment.category === 'video' ? (
                              <video src={msg.attachment.previewUrl} controls className="max-h-36 w-full object-contain" />
                            ) : (
                              <img src={msg.attachment.previewUrl} alt="Preview" className="max-h-36 object-contain" />
                            )}
                          </div>
                        )}
                        <p className="text-[9px] text-cyan-400/80 font-mono leading-tight">{msg.attachment.analysisSummary}</p>
                      </div>
                    )}

                    <div className={msg.sender === 'natasha' && msg.isBinary ? "text-cyan-300 font-medium leading-relaxed" : "leading-relaxed"}>
                      {msg.sender === 'natasha' && (
                        <div className="mb-1.5 text-xs font-black text-cyan-400 tracking-wider flex items-center gap-2">
                          <img 
                            src={natashaLogo} 
                            alt="Natasha" 
                            className="w-5 h-5 rounded-full border border-cyan-400 object-cover shadow-[0_0_8px_rgba(34,211,238,0.5)] shrink-0" 
                          />
                          <span>NATASHA V.I. 5.6</span>
                          <span className="text-[8px] font-mono px-1.5 py-0.2 bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 rounded">
                            ASI
                          </span>
                        </div>
                      )}
                      {msg.sender === 'natasha' ? renderMessageContent(msg.text) : msg.text}
                    </div>

                    {/* MESSAGE ACTIONS: COPY, DIRECT WHATSAPP SHARE, VOICE */}
                    <div className="mt-2.5 pt-2 border-t border-cyan-500/20 flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.text)}
                        className={`px-2 py-0.5 rounded-md text-[9px] font-mono flex items-center gap-1 transition-all cursor-pointer ${
                          copiedMessageId === msg.id
                            ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                            : 'bg-slate-950/80 hover:bg-cyan-500/20 text-cyan-300/80 hover:text-cyan-200 border border-cyan-500/20'
                        }`}
                        title="Copy message to clipboard"
                      >
                        {copiedMessageId === msg.id ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                            <span>COPIED</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5" />
                            <span>COPY</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp(msg.text)}
                        className="px-2 py-0.5 rounded-md text-[9px] font-mono flex items-center gap-1 bg-emerald-950/60 hover:bg-emerald-800/60 text-emerald-300 hover:text-emerald-100 border border-emerald-500/30 transition-all cursor-pointer"
                        title="Direct share message to WhatsApp"
                      >
                        <MessageCircle className="w-2.5 h-2.5 text-emerald-400" />
                        <span>WHATSAPP</span>
                      </button>

                      {msg.sender === 'natasha' && (
                        <button
                          type="button"
                          onClick={() => handleToggleVoice(msg.id, msg.text)}
                          className={`px-2 py-0.5 rounded-md text-[9px] font-mono flex items-center gap-1 transition-all cursor-pointer ${
                            speakingMessageId === msg.id
                              ? 'bg-purple-500/30 text-purple-200 border border-purple-400 animate-pulse'
                              : 'bg-slate-950/80 hover:bg-purple-950/50 text-cyan-300/80 hover:text-cyan-200 border border-cyan-500/20'
                          }`}
                          title="Listen in Natasha's female English voice"
                        >
                          <Volume2 className="w-2.5 h-2.5 text-cyan-400" />
                          <span>{speakingMessageId === msg.id ? 'SPEAKING...' : 'LISTEN'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <span className="text-[8px] uppercase tracking-widest text-slate-500 mt-1 px-1 font-mono">
                    {msg.sender === 'user' ? 'Mr. Raj (Boss)' : 'Natasha // AI Assistant'} // {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-2 text-cyan-400/80 animate-pulse p-2 font-mono text-[10px]">
                  <Terminal className="w-3.5 h-3.5" />
                  <span className="uppercase tracking-widest font-black">Natasha Processing Command & Analysis...</span>
                </div>
              )}
            </div>

            {/* Selected File Attachment Badge Bar */}
            {selectedFile && (
              <div className="px-4 py-2 bg-slate-900 border-t border-cyan-500/30 flex items-center justify-between font-mono text-[10px]">
                <div className="flex items-center gap-2 text-cyan-300 truncate">
                  {renderFileIcon(selectedFile.category)}
                  <span className="font-bold truncate">{selectedFile.name}</span>
                  <span className="text-[8px] text-cyan-500 font-mono">({selectedFile.category.toUpperCase()})</span>
                </div>
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="p-1 text-red-400 hover:text-red-300 transition-colors"
                  title="Remove Attachment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Natasha 4 Suggested Interactive Tools (When Unsure or Exploring) */}
            {activeSuggestedTools && activeSuggestedTools.length > 0 && (
              <div className="px-3 py-2 bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950 border-t border-cyan-500/30 space-y-1.5">
                <div className="flex items-center justify-between text-[9px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Natasha Recommended 4 Tools (Click to Launch):</span>
                  </span>
                  <button 
                    type="button"
                    onClick={() => setActiveSuggestedTools([])}
                    className="text-slate-400 hover:text-white cursor-pointer text-[8px]"
                  >
                    [ DISMISS ]
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {activeSuggestedTools.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent(tool.action));
                        speakNatasha(`Launching ${tool.name}, Boss.`);
                      }}
                      className="p-2 rounded-xl bg-slate-900/90 hover:bg-cyan-950/80 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                      title={tool.description}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-white group-hover:text-cyan-300 truncate">
                          {tool.name}
                        </span>
                        <ArrowRight className="w-3 h-3 text-cyan-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </div>
                      <span className="text-[8px] text-slate-400 line-clamp-1 mt-0.5 font-sans">
                        {tool.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Suggestions Pill Bar (Sections 41 & 42) */}
            {showSuggestions && activeSuggestions.length > 0 && (
              <div className="px-3 py-2 bg-slate-950/90 border-t border-cyan-500/20 flex items-center gap-1.5 overflow-x-auto jarvis-scrollbar">
                <span className="text-[9px] font-mono text-cyan-400/60 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 text-cyan-400" /> Suggest:
                </span>
                {activeSuggestions.slice(0, 5).map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      typeTextIntoInput(sug, true);
                    }}
                    className="px-2.5 py-1 text-[9px] font-mono bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-200 border border-cyan-500/30 hover:border-cyan-400 rounded-full whitespace-nowrap transition-all shadow-[0_0_10px_rgba(34,211,238,0.1)] cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
                    title={`Send: "${sug}"`}
                  >
                    <span>{sug}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-cyan-400 opacity-60" />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Text Response Generators Panel */}
            {showQuickGenerators && (
              <div className="px-3 py-2 bg-slate-900/95 border-t border-cyan-500/30 flex flex-wrap gap-1.5 items-center">
                <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest shrink-0 flex items-center gap-1 font-bold">
                  <Wand2 className="w-3 h-3" /> Auto-Type:
                </span>
                {quickGenerators.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => typeTextIntoInput(q.text, false)}
                    className="px-2.5 py-1 text-[9px] font-mono bg-slate-950 hover:bg-purple-950/60 text-purple-200 border border-purple-500/30 hover:border-purple-400 rounded-lg cursor-pointer transition-all active:scale-95 shadow-sm"
                    title={q.text}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}

            {/* Predictive Word Autocomplete Chips */}
            {inputValue.trim() && predictiveWords.length > 0 && (
              <div className="px-3 py-1 bg-slate-950/80 border-t border-cyan-500/10 flex items-center gap-1 overflow-x-auto">
                <span className="text-[8px] font-mono text-cyan-500/60 uppercase tracking-widest shrink-0">Complete:</span>
                {predictiveWords.map((word, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const words = inputValue.split(/\s+/);
                      words.pop();
                      const newText = (words.join(' ') + ' ' + word).trim() + ' ';
                      setInputValue(newText);
                    }}
                    className="px-2 py-0.5 text-[8px] font-mono bg-slate-900 hover:bg-cyan-950 text-cyan-300 border border-cyan-500/20 rounded-md cursor-pointer transition-all"
                  >
                    +{word}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-cyan-500/30 bg-slate-900/90 flex flex-col gap-2">
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept=".jpg,.jpeg,.png,.webp,.tif,.tiff,.psd,.ai,.cdr,.pdf,.doc,.docx,.pptx,.xlsx,.mp4,.mov,.avi,.mkv,.webm,video/*,image/*"
              />

              <div className="relative flex items-center gap-2">
                {/* File Attachment Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 bg-slate-950/80 hover:bg-slate-900 text-cyan-400 border border-cyan-500/30 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(34,211,238,0.1)] cursor-pointer"
                  title="Attach File or Video (JPG, PNG, PSD, AI, CDR, PDF, Word, MP4...)"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Voice Auto-Typing Microphone Button */}
                <button
                  type="button"
                  onClick={toggleVoiceAutoTyping}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isListening
                      ? 'bg-red-500/20 text-red-300 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse'
                      : 'bg-slate-950/80 hover:bg-slate-900 text-cyan-400 border-cyan-500/30 hover:scale-105 active:scale-95'
                  }`}
                  title={isListening ? "Listening... Speak to auto-type words" : "Speak to Auto-Type words live into input"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Response Generator Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowQuickGenerators(!showQuickGenerators)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    showQuickGenerators
                      ? 'bg-purple-500/20 text-purple-300 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                      : 'bg-slate-950/80 hover:bg-slate-900 text-purple-400 border-purple-500/30 hover:scale-105 active:scale-95'
                  }`}
                  title="Toggle Response Generators (Quick Reply, Polite Confirmation, Summary...)"
                >
                  <Wand2 className="w-4 h-4" />
                </button>

                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={isListening ? "SPEAK NOW, I AM AUTO-TYPING YOUR WORDS..." : isAutoTyping ? "AUTO-TYPING RESPONSE..." : "CHAT, SEARCH RECORDS, ASK QUESTIONS..."}
                    className={`w-full bg-slate-950/80 border border-cyan-500/30 rounded-xl py-2.5 px-4 text-[10px] sm:text-[11px] font-bold text-white placeholder:text-cyan-500/30 uppercase tracking-[0.08em] focus:outline-none focus:ring-1 focus:ring-cyan-500/60 border-l-4 ${
                      isListening ? 'border-l-red-500 bg-red-950/20' : isAutoTyping ? 'border-l-purple-400' : 'border-l-cyan-400'
                    }`}
                  />
                  {isAutoTyping && (
                    <span className="absolute right-3 text-[9px] font-mono text-purple-300 animate-pulse uppercase">
                      ⌨️ Auto-Typing...
                    </span>
                  )}
                </div>

                <button 
                  type="submit"
                  className="p-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] cursor-pointer active:scale-95"
                  title="Send Command"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MINIMIZED FLOATING BADGE OR MAIN TOGGLE BUTTON */}
      {isMinimized && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 px-5 py-3 bg-slate-950/90 border-2 border-cyan-400/80 rounded-2xl shadow-[0_0_35px_rgba(34,211,238,0.5)] cursor-pointer hover:scale-105 transition-all group font-mono mb-2"
        >
          <div className="relative w-7 h-7 rounded-full border border-cyan-400 overflow-hidden flex items-center justify-center bg-slate-900">
            <img src={natashaLogo} alt="Natasha" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
          </div>
          <div>
            <p className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">NATASHA CHAT (MINIMIZED)</p>
            <p className="text-[8px] font-bold text-cyan-500/70 uppercase">CLICK TO RESTORE POP-UP DECK</p>
          </div>
        </motion.div>
      )}

      {/* MAIN LAUNCHER ORB */}
      {!isMinimized && (
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            setIsOpen(!isOpen);
            setIsMinimized(false);
          }}
          onPointerDown={(e) => dragControls.start(e)}
          className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all shadow-[0_0_35px_rgba(34,211,238,0.4)] cursor-grab active:cursor-grabbing relative group ${
            isOpen 
              ? 'bg-slate-950 border-cyan-400 text-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.6)]' 
              : 'bg-cyan-600 border-cyan-300 text-slate-950 hover:bg-cyan-400'
          }`}
          title="Click to toggle Natasha V.I. Chat / Drag to relocate"
        >
          {isOpen ? (
            <Terminal className="w-7 h-7 text-cyan-400 animate-pulse" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Cpu className="w-8 h-8 text-slate-950 group-hover:scale-110 transition-transform" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
            </div>
          )}
        </motion.button>
      )}
    </motion.div>
  );
};

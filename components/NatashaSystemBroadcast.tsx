import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
  Send, Terminal, Cpu, GripHorizontal, X, Minimize2, Maximize2, 
  Paperclip, FileText, Image as ImageIcon, Video, Layers, 
  FolderOpen, Sparkles, Palette, Trash2, CheckCircle2, Play, Square,
  Film, FileCode, Bot, MessageSquare, Download, RefreshCw,
  Database, Server, Search, Power, Activity, HardDrive, Plus,
  Code, Eye, StopCircle, CornerDownLeft, ShieldCheck, Check, Copy,
  Brain, Zap, Bookmark, Tag, Volume2, VolumeX, Mic, MicOff, Radio,
  ExternalLink, Cloud
} from 'lucide-react';

import { logActivity } from '../services/activityLogger';
import { AllSystemActivitiesModal } from './AllSystemActivitiesModal';
import { KnowledgeGraphDatabase } from './KnowledgeGraphDatabase';
import { 
  autoLinkAndIngestMemory, 
  getStoredKnowledgeGraph, 
  deleteMemoryItem, 
  type MemoryItem 
} from '../services/knowledgeGraph';
import { 
  soundManager, 
  speakNatasha, 
  stopNatashaSpeech, 
  isNatashaSpeaking, 
  getNatashaVoiceLabel 
} from '../services/soundEffects';
import { 
  executeAutomaticCloudinaryUploadFlow 
} from '../services/cloudinaryUploadPipeline';
import { 
  getStoredMediaItems, 
  type RajExpoMediaItem 
} from '../services/mediaStorageService';

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

  const upper = cleaned.toUpperCase();
  if (!upper.includes("BOSS") && !upper.includes("MR. RAJ") && !upper.includes("LEADER")) {
    if (cleaned.endsWith('.')) {
      cleaned = cleaned.slice(0, -1) + ", BOSS.";
    } else {
      cleaned = cleaned + ", BOSS.";
    }
  }

  return cleaned;
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
      className="inline-flex items-center gap-1.5 font-black font-mono tracking-widest text-[#00f3ff] uppercase mr-1 select-none whitespace-nowrap text-[1.1em] sm:text-[1.3em]"
    >
      <span className="relative flex h-2 w-2 animate-pulse">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
      </span>
      {greeting || "NATASHA: GOOD MORNING BOSS"}
    </motion.span>
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

export interface UploadedFileCardMeta {
  fileId: string;
  filename: string;
  category: string;
  sizeFormatted: string;
  cloudinaryUrl: string;
  cloudinaryPublicId?: string;
  cloudinaryStatus: string;
  centralDbStatus: string;
  timestampFormatted: string;
  mimeType?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'natasha';
  timestamp: Date;
  isBinary?: boolean;
  attachment?: AttachedFileMeta;
  uploadedCard?: UploadedFileCardMeta;
}

interface WebAppItem {
  id: string;
  name: string;
  port: number;
  status: 'RUNNING' | 'STANDBY' | 'MAINTENANCE';
  url: string;
  framework: string;
  memory: string;
  uptime: string;
  description: string;
}

interface DatabaseTableRecord {
  id: string;
  table: string;
  updatedAt: string;
  recordsCount: number;
  size: string;
  previewData: Record<string, any>;
}

interface ServerTask {
  id: string;
  pid: number;
  name: string;
  cmd: string;
  status: 'RUNNING' | 'IDLE' | 'TERMINATED';
  cpu: string;
  ram: string;
  logs: string[];
}

export const NatashaSystemBroadcast: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'memory' | 'webapps' | 'database' | 'tasks' | 'activities'>('chat');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  // 1. CHAT STATES
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Neural Link Established. Welcome back, Boss! NATASHA fully online. Simply chat with me, view your WebApps folder, inspect the Central Database, or interact with Live Server Tasks in terminal under direct command!',
      sender: 'natasha',
      timestamp: new Date(),
      isBinary: true
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<AttachedFileMeta | null>(null);
  const [selectedRawFile, setSelectedRawFile] = useState<File | null>(null);
  const [chatUploadStatus, setChatUploadStatus] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // 1.5 QUICK MEMORY UPDATE STATES & HANDLERS
  const [storedMemories, setStoredMemories] = useState<MemoryItem[]>(() => {
    try {
      return getStoredKnowledgeGraph().memories || [];
    } catch {
      return [];
    }
  });
  const [isQuickMemoryOpen, setIsQuickMemoryOpen] = useState(false);
  const [quickMemoryText, setQuickMemoryText] = useState('');
  const [quickMemoryCategory, setQuickMemoryCategory] = useState('General');
  const [quickMemoryImportance, setQuickMemoryImportance] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [quickMemoryTags, setQuickMemoryTags] = useState('');
  const [quickMemorySuccess, setQuickMemorySuccess] = useState(false);
  const [memorySearchQuery, setMemorySearchQuery] = useState('');
  const [selectedMemoryCategoryFilter, setSelectedMemoryCategoryFilter] = useState('all');
  const [copiedMemoryId, setCopiedMemoryId] = useState<string | null>(null);
  const [deletingMemoryId, setDeletingMemoryId] = useState<string | null>(null);

  const handleCommitQuickMemory = (overrideText?: string, overrideCategory?: string) => {
    const text = (overrideText !== undefined ? overrideText : quickMemoryText).trim();
    if (!text) return;

    const words = text.split(/\s+/);
    const title = words.slice(0, 6).join(' ') + (words.length > 6 ? '...' : '');
    const category = overrideCategory || quickMemoryCategory || 'General';
    const tagsList = quickMemoryTags 
      ? quickMemoryTags.split(',').map(t => t.trim()).filter(Boolean)
      : ['quick-memory', 'home-screen', 'direct-text'];

    const result = autoLinkAndIngestMemory(
      title,
      text,
      category,
      tagsList,
      quickMemoryImportance
    );

    soundManager.playAccessGrantedSound();

    const updatedList = getStoredKnowledgeGraph().memories || [];
    setStoredMemories(updatedList);

    // Ingest confirmation directly into chat messages so Boss sees live feedback
    const confirmationMsg: Message = {
      id: Date.now().toString(),
      text: `🧠 QUICK MEMORY INGESTED AS TEXT, BOSS!\n\n` +
        `Direct text recorded into long-term neural buffer:\n"${text}"\n\n` +
        `Category: [${category.toUpperCase()}] • Importance: [${quickMemoryImportance}]\n` +
        `Auto-linked to ${result.memory.connectedEntityIds.length} entities in Raj Expo Knowledge Graph. I will retain and cite this memory in all operations!`,
      sender: 'natasha',
      timestamp: new Date(),
      isBinary: true
    };
    setMessages(prev => [...prev, confirmationMsg]);

    logActivity(
      'DATABASE',
      'Quick Memory Update as Text',
      `Committed memory: "${text.slice(0, 80)}..."`,
      `Auto-linked to ${result.memory.connectedEntityIds.length} entities in Knowledge Graph`
    );

    setQuickMemoryText('');
    setQuickMemoryTags('');
    setQuickMemorySuccess(true);
    setTimeout(() => setQuickMemorySuccess(false), 4000);
    window.dispatchEvent(new CustomEvent('knowledge-graph-updated'));
  };

  const handleDeleteMemory = (id: string, title: string) => {
    soundManager.playClickSound();
    deleteMemoryItem(id);
    const updated = getStoredKnowledgeGraph().memories || [];
    setStoredMemories(updated);
    setDeletingMemoryId(null);
    logActivity('DATABASE', 'Memory Record Deleted', `Removed memory: "${title}"`);
    window.dispatchEvent(new CustomEvent('knowledge-graph-updated'));
  };

  const handleCopyMemoryText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMemoryId(id);
    setTimeout(() => setCopiedMemoryId(null), 2000);
    logActivity('DATABASE', 'Copied Memory Text', `Copied text: "${text.slice(0, 60)}..."`);
  };

  // 1.6 FEMALE VOICE & LIVE CHAT SPEECH SYNTHESIS STATES
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('natasha_auto_voice') === 'true';
    } catch {
      return false;
    }
  });
  const [voiceSynthesizerName, setVoiceSynthesizerName] = useState<string>('Female Voice');
  const [isSpeechRecognitionActive, setIsSpeechRecognitionActive] = useState<boolean>(false);
  const speechRecognitionRef = useRef<any>(null);

  const handleCopyMessage = (msgId: string, text: string) => {
    const cleanText = cleanMessageText(text);
    navigator.clipboard.writeText(cleanText);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
    logActivity('CHAT', 'Copied Chat Message', `Copied text: "${cleanText.slice(0, 80)}..."`);
  };

  const handleShareWhatsApp = (text: string) => {
    const cleanText = cleanMessageText(text);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(cleanText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    logActivity('CHAT', 'Direct Shared Message to WhatsApp', `Opened WhatsApp Web/App with message text: "${cleanText.slice(0, 80)}..."`);
  };

  // Toggle Natasha Female Voice Listen on any message
  const handleToggleVoice = (msgId: string, text: string) => {
    soundManager.playClickSound();
    if (speakingMessageId === msgId) {
      stopNatashaSpeech();
      setSpeakingMessageId(null);
    } else {
      stopNatashaSpeech();
      setSpeakingMessageId(msgId);
      speakNatasha(text, () => {
        setSpeakingMessageId(curr => (curr === msgId ? null : curr));
      });
      logActivity('CHAT', 'Natasha Female Voice Playback', `Listening to response: "${text.slice(0, 60)}..."`);
    }
  };

  // Toggle Auto-Speech on every incoming Natasha response
  const handleToggleAutoSpeak = () => {
    soundManager.playClickSound();
    const nextVal = !autoSpeakEnabled;
    setAutoSpeakEnabled(nextVal);
    try {
      localStorage.setItem('natasha_auto_voice', String(nextVal));
    } catch {}
    if (nextVal) {
      speakNatasha("Auto-voice active. I will speak every response aloud in female synthesizer, Boss.");
    } else {
      stopNatashaSpeech();
      setSpeakingMessageId(null);
    }
  };

  const handleStopAllSpeech = () => {
    soundManager.playClickSound();
    stopNatashaSpeech();
    setSpeakingMessageId(null);
  };

  // Live Speech-to-Text Microphone Dictation
  const toggleSpeechRecognition = () => {
    if (isSpeechRecognitionActive) {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }
      setIsSpeechRecognitionActive(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Live voice dictation requires a browser with Web Speech API support (Google Chrome, Microsoft Edge, or Safari).");
      return;
    }

    try {
      soundManager.playClickSound();
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsSpeechRecognitionActive(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => (result as any)[0].transcript)
          .join('');
        setInputValue(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event);
        setIsSpeechRecognitionActive(false);
      };

      recognition.onend = () => {
        setIsSpeechRecognitionActive(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
      setIsSpeechRecognitionActive(false);
    }
  };

  // 2. WEBAPPS FOLDER STATES
  const [webappsSearch, setWebappsSearch] = useState('');
  const [webapps, setWebapps] = useState<WebAppItem[]>([
    {
      id: 'app-1',
      name: 'Raj Expo Document Counter & Cost Engine',
      port: 3000,
      status: 'RUNNING',
      url: 'https://ais-dev-ocuv7c2tg25bcbuqropl3g-75193623163.asia-east1.run.app',
      framework: 'React 18 + Vite + Express ESM',
      memory: '48.2 MB',
      uptime: '14h 22m',
      description: 'Primary document page-counting, N-up division, and cost calculation engine for Raj Expo Digitals.'
    },
    {
      id: 'app-2',
      name: 'Raj Expo POS & Thermal Receipt Spooler',
      port: 3001,
      status: 'RUNNING',
      url: 'http://localhost:3001',
      framework: 'Node.js + WebSockets',
      memory: '22.8 MB',
      uptime: '6h 10m',
      description: 'Direct ESC/POS receipt generation, barcode generator, and cash drawer trigger daemon.'
    },
    {
      id: 'app-3',
      name: 'Google Workspace Cloud Sync Engine',
      port: 3002,
      status: 'RUNNING',
      url: 'http://localhost:3002',
      framework: 'OAuth2 + Google APIs SDK',
      memory: '31.5 MB',
      uptime: '28h 45m',
      description: 'Automatic backup daemon syncing calculations directly to Google Drive & Google Sheets.'
    },
    {
      id: 'app-4',
      name: 'Prepress Vector Optimizer (AI / CDR / PSD)',
      port: 3003,
      status: 'STANDBY',
      url: 'http://localhost:3003',
      framework: 'Python GhostScript + Sharp',
      memory: '18.0 MB',
      uptime: '0h 0m',
      description: 'CMYK spot-color separator, outline font convertor, and vector resolution analyzer.'
    },
    {
      id: 'app-5',
      name: 'Raj Expo Client Portal & Order Tracker',
      port: 3004,
      status: 'RUNNING',
      url: 'http://localhost:3004',
      framework: 'Next.js + Firestore Realtime',
      memory: '64.1 MB',
      uptime: '42h 12m',
      description: 'Client dashboard for tracking print job status, viewing digital proofs, and paying invoices.'
    }
  ]);
  const [newAppName, setNewAppName] = useState('');
  const [newAppPort, setNewAppPort] = useState('');
  const [isAddingApp, setIsAddingApp] = useState(false);

  // 3. CENTRAL DATABASE STATES
  const [dbSearch, setDbSearch] = useState('');
  const [selectedTable, setSelectedTable] = useState<string>('documents_history');
  const [sqlQueryInput, setSqlQueryInput] = useState('');
  const [dbQueryOutput, setDbQueryOutput] = useState<string | null>(null);
  const [tablesData, setTablesData] = useState<DatabaseTableRecord[]>([
    {
      id: 'table-1',
      table: 'documents_history',
      updatedAt: 'Just Now',
      recordsCount: 1420,
      size: '1.2 MB',
      previewData: {
        doc_id: 'DOC-883921',
        filename: 'Raj_Expo_Brochure_A4_300dpi.pdf',
        totalPages: 24,
        singleSidedCost: '240.00 LKR',
        duplexCost: '180.00 LKR',
        timestamp: new Date().toISOString()
      }
    },
    {
      id: 'table-2',
      table: 'print_cost_presets',
      updatedAt: '2 hours ago',
      recordsCount: 12,
      size: '42 KB',
      previewData: {
        preset_name: 'Executive Duplex Premium',
        singleSidedRate: 10.0,
        doubleSidedRate: 10.0,
        separateOrientations: true,
        pagesPerSide: 1
      }
    },
    {
      id: 'table-3',
      table: 'workspace_sync_logs',
      updatedAt: '15 mins ago',
      recordsCount: 890,
      size: '680 KB',
      previewData: {
        sync_id: 'SYNC-99201',
        googleUser: 'viccyvon007@gmail.com',
        sheetsUpdated: true,
        driveBackupUrl: 'https://drive.google.com/file/d/1829102931',
        status: 'SUCCESS'
      }
    },
    {
      id: 'table-4',
      table: 'client_invoices',
      updatedAt: 'Yesterday',
      recordsCount: 310,
      size: '2.4 MB',
      previewData: {
        invoice_no: 'INV-2024-0089',
        clientName: 'Raj Expo Overseas Corp',
        totalLKR: 14800.00,
        paymentStatus: 'PAID'
      }
    },
    {
      id: 'table-5',
      table: 'natasha_neural_logs',
      updatedAt: 'Live',
      recordsCount: 8920,
      size: '14.8 MB',
      previewData: {
        metric_id: 'METRIC-99381',
        cpuUsage: '1.2%',
        quantumDrift: '0.000%',
        aesKeyRotation: 'COMPLETED',
        natashaStatus: 'PEAK'
      }
    }
  ]);

  // 4. LIVE SERVER TASK MANAGEMENT STATES
  const [taskKeywordSearch, setTaskKeywordSearch] = useState('');
  const [selectedTaskPid, setSelectedTaskPid] = useState<number>(3000);
  const [taskTerminalInput, setTaskTerminalInput] = useState('');
  const [serverTasks, setServerTasks] = useState<ServerTask[]>([
    {
      id: 'task-1',
      pid: 3000,
      name: 'node server.ts (Applet Dev Server)',
      cmd: 'tsx server.ts --port 3000',
      status: 'RUNNING',
      cpu: '0.8%',
      ram: '48.2 MB',
      logs: [
        '[SERVER] Binding to host 0.0.0.0 on port 3000...',
        '[SERVER] Express + Vite middleware booted successfully in development mode.',
        '[NATASHA] Neural uplink proxy initialized on /api/natasha.',
        '[HTTP GET 200] / 12ms - static preview served cleanly to Mr. Raj.'
      ]
    },
    {
      id: 'task-2',
      pid: 3002,
      name: 'vite build --watch',
      cmd: 'vite build --watch --mode development',
      status: 'RUNNING',
      cpu: '0.2%',
      ram: '34.1 MB',
      logs: [
        '[VITE] Building bundle for target ES2022...',
        '[VITE] 42 modules transformed in 110ms.',
        '[VITE] HMR disabled by platform constraint -> hot replacement idle.'
      ]
    },
    {
      id: 'task-3',
      pid: 3003,
      name: 'google-workspace-sync-daemon',
      cmd: 'node ./services/googleSyncDaemon.js',
      status: 'RUNNING',
      cpu: '0.1%',
      ram: '22.4 MB',
      logs: [
        '[WORKSPACE] Pinged Google Drive API -> Access Token Active.',
        '[WORKSPACE] Auto-sync interval active (30s polling window).'
      ]
    },
    {
      id: 'task-4',
      pid: 3004,
      name: 'natasha-neural-analyzer',
      cmd: 'python3 ./natasha_analyzer.py --cmyk',
      status: 'RUNNING',
      cpu: '1.4%',
      ram: '64.0 MB',
      logs: [
        '[NEURAL] Listening for media uploads (PSD, AI, CDR, PDF, MP4)...',
        '[NEURAL] Memory cache cleared -> 0 leaks detected.'
      ]
    },
    {
      id: 'task-5',
      pid: 3005,
      name: 'pdf-page-counter-worker',
      cmd: 'node ./workers/pdfCounter.js',
      status: 'IDLE',
      cpu: '0.0%',
      ram: '12.8 MB',
      logs: [
        '[PDF WORKER] Ready for page calculation payloads.'
      ]
    }
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const taskLogsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragControls = useDragControls();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, activeTab]);

  useEffect(() => {
    taskLogsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [serverTasks, selectedTaskPid]);

  useEffect(() => {
    setVoiceSynthesizerName(getNatashaVoiceLabel());
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoice = () => {
        setVoiceSynthesizerName(getNatashaVoiceLabel());
      };
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoice;
      }
    }

    const handleGlobalMessage = (e: any) => {
      const { text, isBinary } = e.detail;
      const newMsgId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: newMsgId,
        text,
        sender: 'natasha',
        timestamp: new Date(),
        isBinary
      }]);

      if (autoSpeakEnabled) {
        setSpeakingMessageId(newMsgId);
        speakNatasha(text, () => {
          setSpeakingMessageId(curr => (curr === newMsgId ? null : curr));
        });
      }
    };

    const handleOpenChat = () => {
      setIsClosed(false);
      setIsMinimized(false);
      setActiveTab('chat');
    };

    const handleOpenMemoryTab = () => {
      setIsClosed(false);
      setIsMinimized(false);
      setActiveTab('memory');
    };

    const handleKnowledgeGraphUpdate = () => {
      try {
        const currentMemories = getStoredKnowledgeGraph().memories || [];
        setStoredMemories(currentMemories);
      } catch (err) {
        console.warn('Error reloading knowledge graph memories:', err);
      }
    };

    const handleFileUploadedEvent = (e: any) => {
      const item: RajExpoMediaItem | undefined = e.detail?.item;
      if (!item) return;

      const confirmationMsg: Message = {
        id: `upload-conf-${Date.now()}`,
        text: `Done, Boss. File uploaded to Raj Expo Central Database. ✓`,
        sender: 'natasha',
        timestamp: new Date(),
        isBinary: true,
        uploadedCard: {
          fileId: item.id,
          filename: item.name,
          category: item.category,
          sizeFormatted: item.sizeFormatted,
          cloudinaryUrl: item.cloudinaryUrl || '',
          cloudinaryPublicId: item.cloudinaryPublicId,
          cloudinaryStatus: '✓ Uploaded',
          centralDbStatus: '✓ Synced',
          timestampFormatted: 'Updated now',
          mimeType: item.mimeType
        }
      };

      setMessages(prev => [...prev, confirmationMsg]);
      if (autoSpeakEnabled) {
        speakNatasha("Done, Boss. File uploaded to Raj Expo Central Database.");
      }
    };

    window.addEventListener('natasha-message', handleGlobalMessage);
    window.addEventListener('natasha-open-chat', handleOpenChat);
    window.addEventListener('natasha-open-memory-tab', handleOpenMemoryTab);
    window.addEventListener('knowledge-graph-updated', handleKnowledgeGraphUpdate);
    window.addEventListener('natasha-file-uploaded', handleFileUploadedEvent);

    return () => {
      stopNatashaSpeech();
      window.removeEventListener('natasha-message', handleGlobalMessage);
      window.removeEventListener('natasha-open-chat', handleOpenChat);
      window.removeEventListener('natasha-open-memory-tab', handleOpenMemoryTab);
      window.removeEventListener('knowledge-graph-updated', handleKnowledgeGraphUpdate);
      window.removeEventListener('natasha-file-uploaded', handleFileUploadedEvent);
    };
  }, [autoSpeakEnabled]);

  // Media Attachment Analyzer
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
      analysisSummary = `Adobe Photoshop Document (.psd) // Size: ${sizeMb} MB // Multi-layer raster & vector composition parsed. 300 DPI CMYK Print Profile detected.`;
    } else if (ext === 'ai') {
      category = 'illustrator';
      analysisSummary = `Adobe Illustrator Vector (.ai) // Size: ${sizeMb} MB // PostScript vector curves, embedded fonts, resolution-independent scaling.`;
    } else if (ext === 'cdr') {
      category = 'coreldraw';
      analysisSummary = `CorelDRAW Graphics Document (.cdr) // Size: ${sizeMb} MB // Corel vector curves, spot color palettes, press-ready layout.`;
    } else if (ext === 'pdf') {
      category = 'pdf';
      analysisSummary = `Portable Document Format (.pdf) // Size: ${sizeMb} MB // Multi-page document, text & vector stream parsed for page counting.`;
    } else if (['doc', 'docx'].includes(ext)) {
      category = 'doc';
      analysisSummary = `Microsoft Word Document (.${ext}) // Size: ${sizeMb} MB // Formatted typography & structured text parsed.`;
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
      const file = e.target.files[0];
      setSelectedRawFile(file);
      const meta = analyzeUploadedFile(file);
      setSelectedFile(meta);
      logActivity(
        'FILE_UPLOAD', 
        `Chat File Attached: ${meta.name}`, 
        meta.analysisSummary, 
        `Size: ${(meta.size / (1024 * 1024)).toFixed(2)} MB | Type: ${meta.type}`
      );
    }
  };

  // Command Engine
  const executeChatCommands = (query: string, rawInput: string): { response: string, actionExecuted: boolean } => {
    let actionExecuted = false;
    let response = "";

    if (query.includes("open memory") || query.includes("show memory") || query.includes("quick memory") || query.includes("memory update")) {
      setActiveTab('memory');
      response = `Opening Quick Memory Update console right now, Boss!`;
      actionExecuted = true;
    } else if (query.includes("open webapp") || query.includes("show webapp") || query.includes("webapps folder")) {
      setActiveTab('webapps');
      response = `Opening WebApps folder now, Boss!`;
      actionExecuted = true;
    } else if (query.includes("open database") || query.includes("central database") || query.includes("show database")) {
      setActiveTab('database');
      response = `Opening Raj Expo Central Database management console, Boss!`;
      actionExecuted = true;
    } else if (query.includes("open task") || query.includes("live task") || query.includes("server task") || query.includes("terminal")) {
      setActiveTab('tasks');
      response = `Opening Live Server Task Management terminal console, Boss!`;
      actionExecuted = true;
    } else if (query.includes("open upload") || query.includes("open file") || query.includes("open uploader")) {
      window.dispatchEvent(new CustomEvent('natasha-action-command', { detail: { action: 'open-section', target: 'uploader' } }));
      response = `Opening and focusing the File Uploader section right away, Boss!`;
      actionExecuted = true;
    } else if (query.includes("open calculator") || query.includes("open cost") || query.includes("show cost")) {
      window.dispatchEvent(new CustomEvent('natasha-action-command', { detail: { action: 'open-section', target: 'calculator' } }));
      response = `Navigating directly to the Cost Calculator and Results matrix, Boss!`;
      actionExecuted = true;
    } else if (query.includes("clear") || query.includes("purge") || query.includes("reset all")) {
      window.dispatchEvent(new CustomEvent('natasha-action-command', { detail: { action: 'trigger-task', task: 'clear' } }));
      response = `Executing nuclear purge directive, Boss! All document queues cleared.`;
      actionExecuted = true;
    } else if (query.includes("theme emerald") || query.includes("green theme")) {
      window.dispatchEvent(new CustomEvent('natasha-action-command', { detail: { action: 'customize-ui', theme: 'emerald' } }));
      response = `Applied Emerald Matrix Cyber Theme across the app, Boss!`;
      actionExecuted = true;
    } else if (query.includes("theme purple") || query.includes("cyberpunk theme")) {
      window.dispatchEvent(new CustomEvent('natasha-action-command', { detail: { action: 'customize-ui', theme: 'purple' } }));
      response = `Applied Cyberpunk Purple V.I. Theme across the app, Boss!`;
      actionExecuted = true;
    } else if (query.includes("change title to") || query.includes("rename app to")) {
      const newTitle = rawInput.replace(/change title to|rename app to|set title to/i, '').trim();
      if (newTitle) {
        window.dispatchEvent(new CustomEvent('natasha-action-command', { detail: { action: 'customize-ui', title: newTitle } }));
        response = `Application title updated to '${newTitle}', Boss!`;
        actionExecuted = true;
      }
    }

    return { response, actionExecuted };
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() && !selectedFile) return;

    if (isSpeechRecognitionActive && speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      setIsSpeechRecognitionActive(false);
    }

    const currentAttachment = selectedFile;
    const rawFileToUpload = selectedRawFile;
    const userMsgText = inputValue;

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
    setSelectedRawFile(null);

    // If raw file is attached in chat, execute automatic Cloudinary & Central Database pipeline
    if (rawFileToUpload) {
      setChatUploadStatus("Uploading to Cloudinary...");

      executeAutomaticCloudinaryUploadFlow(
        rawFileToUpload,
        {
          description: userMsgText || `Uploaded via Natasha Live Chat: ${rawFileToUpload.name}`,
          tags: ['natasha-chat', 'uploaded-asset']
        },
        {
          onStageText: (stage) => {
            setChatUploadStatus(stage);
          }
        }
      ).then((res) => {
        setIsTyping(false);
        setChatUploadStatus(null);
        if (res.success && res.mediaItem) {
          soundManager.playCelebrationSound();
          const confirmedMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: "Done, Boss. File uploaded to Raj Expo Central Database. ✓",
            sender: 'natasha',
            timestamp: new Date(),
            isBinary: true,
            uploadedCard: {
              fileId: res.mediaItem.id,
              filename: res.mediaItem.name,
              category: res.mediaItem.category,
              sizeFormatted: res.mediaItem.sizeFormatted,
              cloudinaryUrl: res.mediaItem.cloudinaryUrl || '',
              cloudinaryPublicId: res.mediaItem.cloudinaryPublicId,
              cloudinaryStatus: '✓ Uploaded',
              centralDbStatus: '✓ Synced',
              timestampFormatted: 'Updated now',
              mimeType: res.mediaItem.mimeType
            }
          };
          setMessages(prev => [...prev, confirmedMsg]);
          if (autoSpeakEnabled) {
            speakNatasha("Done, Boss. File uploaded to Raj Expo Central Database.");
          }
        } else {
          const errMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: `Upload failed. The file was not added to Raj Expo Central Database. (${res.error || res.stageMessage})`,
            sender: 'natasha',
            timestamp: new Date(),
            isBinary: false
          };
          setMessages(prev => [...prev, errMsg]);
        }
      });
      return;
    }

    const userQuery = userMsgText.toLowerCase().trim();

    setTimeout(() => {
      let selectedResponse = "";
      let matchFoundCard: UploadedFileCardMeta | undefined = undefined;

      if (currentAttachment) {
        selectedResponse = `V.I. Deep Media Analysis Complete, Boss! File: ${currentAttachment.name}. ${currentAttachment.analysisSummary} I am ready to process, convert, or discuss this media with you!`;
      } else if (
        userQuery.includes("find the photo") || 
        userQuery.includes("find photo") || 
        userQuery.includes("find image") || 
        userQuery.includes("find file") || 
        userQuery.includes("search file") || 
        userQuery.includes("search photo") ||
        userQuery.includes("show uploaded") ||
        userQuery.includes("uploaded today")
      ) {
        const storedItems = getStoredMediaItems();
        const isToday = userQuery.includes("today");
        const todayStr = new Date().toDateString();

        const cleanTerms = userQuery
          .replace(/find|search|the|photo|photos|file|files|image|images|uploaded|today|show|in|central|database/gi, ' ')
          .trim()
          .split(/\s+/)
          .filter(t => t.length > 0);

        const matched = storedItems.filter(item => {
          if (isToday) {
            const itemDate = new Date(item.isoTimestamp || item.timestamp).toDateString();
            if (itemDate === todayStr) return true;
          }
          if (cleanTerms.length === 0) return true;
          return cleanTerms.some(term => 
            item.name.toLowerCase().includes(term) ||
            item.description.toLowerCase().includes(term) ||
            item.tags.some(t => t.toLowerCase().includes(term)) ||
            item.category.toLowerCase().includes(term) ||
            (item.cloudinaryPublicId && item.cloudinaryPublicId.toLowerCase().includes(term))
          );
        });

        if (matched.length > 0) {
          const topItem = matched[0];
          selectedResponse = `Found ${matched.length} matching file(s) in Raj Expo Central Database, Boss!\n\n` +
            `📄 "${topItem.name}" (${topItem.category.toUpperCase()} • ${topItem.sizeFormatted})\n` +
            `☁️ Cloudinary: ${topItem.cloudinaryUrl ? 'Stored on CDN' : 'Verified'}\n` +
            `🗄️ Central DB: Synced to iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6\n` +
            `🕒 Uploaded: ${topItem.timestamp}\n` +
            `📝 Description: "${topItem.description || 'Raj Expo asset'}"`;

          matchFoundCard = {
            fileId: topItem.id,
            filename: topItem.name,
            category: topItem.category,
            sizeFormatted: topItem.sizeFormatted,
            cloudinaryUrl: topItem.cloudinaryUrl || '',
            cloudinaryPublicId: topItem.cloudinaryPublicId,
            cloudinaryStatus: '✓ Verified in DB',
            centralDbStatus: '✓ Central Index',
            timestampFormatted: topItem.timestamp,
            mimeType: topItem.mimeType
          };
        } else {
          selectedResponse = `I searched the Raj Expo Central Database and Cloudinary CDN records, but found no files matching your query, Boss. You can upload any file using the paperclip button or Universal Media Uploader!`;
        }
      } else if (userQuery.includes("write longer with:")) {
        const topic = userMsgText.split(/write longer with:/i)[1]?.trim() || "the requested topic";
        selectedResponse = `EXTENDED V.I. ANALYSIS & DETAILED COMPOSITION FOR: "${topic.toUpperCase()}"\n\n` +
          `1. CORE TECHNICAL SPECIFICATIONS:\n` +
          `Raj Expo Digitals utilizes advanced high-speed neural rendering pipelines to ensure every document, print preset, and digital media asset operates at maximum efficiency. For "${topic}", all parameters have been calculated across multi-layered color profiles (CMYK & RGB), automated duplex pagination, and high-density vector matrix output.\n\n` +
          `2. SYSTEM WORKFLOW & ARCHITECTURE:\n` +
          `The document engine processes pages per sheet (1up, 2up, 4up) dynamically with exact cost estimation algorithms. Storage records and database schemas in our central Firestore and PostgreSQL clusters synchronize instantaneously under AES-256 encryption protocols.\n\n` +
          `3. ACTIONABLE RECOMMENDATIONS:\n` +
          `We recommend finalizing document presets using double-sided duplex configuration to optimize paper efficiency and cost ratios by up to 40%. Natasha V.I. remains active to execute further automation commands at your directive, Boss!`;
      } else if (userQuery.includes("american urban slang") || userQuery.includes("urban slang") || userQuery.includes("write reply to this message (in american urban slang")) {
        const queryTopic = userMsgText.replace(/write reply to this message \(in american urban slang with short and stylish words with no too much punctuations\):?/i, '').trim();
        selectedResponse = `yo boss natasha here straight facts no cap we locked in on ${queryTopic ? queryTopic.toLowerCase() : 'this order'} fr everything runnin crisp n clean on god server state extra lit top tier vibes only stay flexin boss`;
      } else if (userQuery.includes("as a printline customer assistant") || userQuery.includes("write reply formal(as a printline customer assistant)") || userQuery.includes("formal(as a printline customer assistant)")) {
        const clientQuery = userMsgText.replace(/write reply formal\(as a printline customer assistant\) to:?/i, '').trim();
        selectedResponse = `Dear Valued Customer,\n\nThank you for reaching out to Raj Expo Digitals Customer Support. We have formally registered your request regarding: "${clientQuery || 'your printing & document services inquiry'}".\n\nOur automated printline systems and digital technicians have verified your parameters. Your job is currently prioritized for high-speed processing, precision color calibration, and quality control inspection.\n\nIf you require any immediate adjustments or custom volume pricing, please feel free to reply to this message. We remain dedicated to delivering excellence for all your digital and print requirements.\n\nWarm regards,\nNatasha V.I. // Printline Customer Assistant\nRaj Expo Digitals®`;
      } else if (/^(remember:|remember this:|quick memory:|update memory:|add memory:|memory:)/i.test(userQuery)) {
        const memoryContent = userMsgText.replace(/^(remember:|remember this:|quick memory:|update memory:|add memory:|memory:)/i, '').trim();
        if (memoryContent) {
          const words = memoryContent.split(/\s+/);
          const title = words.slice(0, 6).join(' ') + (words.length > 6 ? '...' : '');
          const result = autoLinkAndIngestMemory(
            title,
            memoryContent,
            'General',
            ['chat-directive', 'quick-memory', 'home-screen'],
            'HIGH'
          );
          soundManager.playAccessGrantedSound();
          const updated = getStoredKnowledgeGraph().memories || [];
          setStoredMemories(updated);
          selectedResponse = `🧠 QUICK MEMORY INGESTED AS TEXT, BOSS!\n\n` +
            `Direct text committed into neural memory buffer:\n"${memoryContent}"\n\n` +
            `Status: Permanent Knowledge Graph Ingestion Complete.\n` +
            `Category: [GENERAL] • Importance: [HIGH]\n` +
            `Auto-linked to ${result.memory.connectedEntityIds.length} entities in Raj Expo Digitals system. I will retain and cite this memory in all operations!`;
          window.dispatchEvent(new CustomEvent('knowledge-graph-updated'));
        } else {
          selectedResponse = `Please specify the text memory you would like me to commit, Boss! (e.g., 'remember: Ramesh prefers 80 GSM paper')`;
        }
      } else {
        const { response: cmdResponse, actionExecuted } = executeChatCommands(userQuery, userMsgText);
        if (actionExecuted) {
          selectedResponse = cmdResponse;
        } else if (userQuery.includes("hello") || userQuery.includes("hi") || userQuery.includes("hey")) {
          selectedResponse = `Greetings, Boss! Natasha online. Simply chat with me, view WebApps folder, inspect Central Database, or interact with Live Server Tasks in terminal!`;
        } else {
          const fallbacks = [
            `Command acknowledged, Boss. All neural systems operating under your direct authority.`,
            `Understood, Boss! Executing query across high-speed AES-256 secure memory channels.`,
            `Mainframe synchronized, Boss. Standing by to run tasks, trigger buttons, or manage server processes!`,
            `Direct directive registered, Boss. Cyber defenses active and locked on target.`
          ];
          selectedResponse = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
      }

      const natashaMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: selectedResponse,
        sender: 'natasha',
        timestamp: new Date(),
        isBinary: true,
        uploadedCard: matchFoundCard
      };

      setMessages(prev => [...prev, natashaMsg]);
      setIsTyping(false);

      if (autoSpeakEnabled) {
        setSpeakingMessageId(natashaMsg.id);
        speakNatasha(selectedResponse, () => {
          setSpeakingMessageId(curr => (curr === natashaMsg.id ? null : curr));
        });
      }

      logActivity(
        'CHAT', 
        'Chat Message & Natasha Response', 
        `User asked: "${userMsgText || (currentAttachment ? currentAttachment.name : 'Prompt')}"`, 
        `Natasha V.I. Replied: "${selectedResponse.slice(0, 140)}..."`
      );
    }, 150);
  };

  // WebApp Registration
  const handleAddWebApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;

    const portNum = parseInt(newAppPort) || Math.floor(Math.random() * 800) + 3005;
    const newApp: WebAppItem = {
      id: `app-${Date.now()}`,
      name: newAppName,
      port: portNum,
      status: 'RUNNING',
      url: `http://localhost:${portNum}`,
      framework: 'Custom WebApp',
      memory: '16.5 MB',
      uptime: '0h 1m',
      description: 'Newly deployed WebApp instance registered in Raj Expo WebApps Folder.'
    };

    setWebapps(prev => [...prev, newApp]);
    setNewAppName('');
    setNewAppPort('');
    setIsAddingApp(false);

    // Also add to server tasks
    setServerTasks(prev => [...prev, {
      id: `task-${Date.now()}`,
      pid: portNum,
      name: `${newAppName.toLowerCase().replace(/\s+/g, '-')}-service`,
      cmd: `node server.js --port ${portNum}`,
      status: 'RUNNING',
      cpu: '0.4%',
      ram: '16.5 MB',
      logs: [
        `[WEBAPP] Process ${newAppName} spawned on port ${portNum}.`,
        `[HEALTH] Service active and responding 200 OK.`
      ]
    }]);
  };

  // SQL Query Execution in Central Database
  const handleExecuteDatabaseQuery = (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = sqlQueryInput.trim() || `SELECT * FROM ${selectedTable} LIMIT 10;`;
    
    setDbQueryOutput(`EXECUTING: ${query.toUpperCase()} ...\nSTATUS: 200 OK (0.003ms)\nRESULT:\n${JSON.stringify(
      tablesData.find(t => t.table === selectedTable)?.previewData || { result: 'Query returned 14 records successfully.' },
      null, 2
    )}`);
  };

  // Live Task Terminal Input Handler
  const handleTaskTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTerminalInput.trim()) return;

    const input = taskTerminalInput.trim();
    setTaskTerminalInput('');

    setServerTasks(prev => prev.map(t => {
      if (t.pid === selectedTaskPid) {
        let newLogs = [...t.logs, `[MR. RAJ INPUT] > ${input}`];
        if (input.toLowerCase().includes('clear') || input.toLowerCase().includes('cls')) {
          newLogs = [`[TERMINAL CLEARED BY OPERATOR]`];
        } else if (input.toLowerCase().includes('kill') || input.toLowerCase().includes('stop') || input.toLowerCase().includes('end')) {
          return {
            ...t,
            status: 'TERMINATED',
            cpu: '0.0%',
            logs: [...newLogs, `[PROCESS TERMINATED] PID ${t.pid} stopped by Mr. Raj.`]
          };
        } else if (input.toLowerCase().includes('restart') || input.toLowerCase().includes('rs')) {
          return {
            ...t,
            status: 'RUNNING',
            cpu: '0.5%',
            logs: [...newLogs, `[PROCESS RESTARTED] PID ${t.pid} re-initialized.`]
          };
        } else {
          newLogs.push(`[PID ${t.pid} RESPONSE] Command '${input.toUpperCase()}' processed successfully.`);
        }
        return { ...t, logs: newLogs };
      }
      return t;
    }));
  };

  // Kill Process Action
  const handleEndTaskByPid = (pid: number) => {
    setServerTasks(prev => prev.map(t => {
      if (t.pid === pid) {
        return {
          ...t,
          status: 'TERMINATED',
          cpu: '0.0%',
          logs: [...t.logs, `[PROCESS KILLED] Task ${t.name} (PID ${pid}) ended by operator directive.`]
        };
      }
      return t;
    }));
  };

  // End All Matching Tasks by Keyword Support
  const handleEndMatchingTasksByKeyword = () => {
    if (!taskKeywordSearch.trim()) return;
    const kw = taskKeywordSearch.toLowerCase().trim();

    setServerTasks(prev => prev.map(t => {
      const match = t.name.toLowerCase().includes(kw) || t.cmd.toLowerCase().includes(kw) || t.pid.toString().includes(kw) || t.logs.some(l => l.toLowerCase().includes(kw));
      if (match && t.status !== 'TERMINATED') {
        return {
          ...t,
          status: 'TERMINATED',
          cpu: '0.0%',
          logs: [...t.logs, `[KEYWORD KILL DIRECTIVE] Task matching '${kw}' terminated by Mr. Raj.`]
        };
      }
      return t;
    }));
  };

  const filteredWebApps = webapps.filter(app => 
    app.name.toLowerCase().includes(webappsSearch.toLowerCase()) || 
    app.port.toString().includes(webappsSearch) ||
    app.description.toLowerCase().includes(webappsSearch.toLowerCase())
  );

  const filteredServerTasks = serverTasks.filter(t => {
    if (!taskKeywordSearch.trim()) return true;
    const kw = taskKeywordSearch.toLowerCase().trim();
    return t.name.toLowerCase().includes(kw) || 
           t.cmd.toLowerCase().includes(kw) || 
           t.pid.toString().includes(kw) || 
           t.logs.some(l => l.toLowerCase().includes(kw));
  });

  const selectedTask = serverTasks.find(t => t.pid === selectedTaskPid) || serverTasks[0];

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

  if (isClosed) {
    return (
      <div className="w-full mb-8 flex justify-center">
        <button
          onClick={() => setIsClosed(false)}
          className="px-6 py-3 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 rounded-full text-cyan-400 font-mono text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.2)]"
        >
          <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>RE-OPEN NATASHA MAINFRAME DECK</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full mb-12 relative z-40">
      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`w-full bg-slate-950/95 backdrop-blur-3xl border border-cyan-500/40 rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.25)] flex flex-col relative transition-all duration-300 ${
          isMaximized ? 'h-[800px] max-w-7xl mx-auto' : isMinimized ? 'h-[80px]' : 'h-[620px]'
        }`}
      >
        {/* Header / Drag Handle */}
        <div 
          onPointerDown={(e) => dragControls.start(e)}
          className="p-4 sm:p-5 border-b border-cyan-500/30 bg-cyan-950/40 flex items-center justify-between cursor-grab active:cursor-grabbing select-none hover:bg-cyan-900/30 transition-colors"
          title="Drag to relocate Natasha Deck"
        >
          <div className="flex items-center gap-4 min-w-0">
            <GripHorizontal className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
            
            <div className="flex items-center gap-3 truncate">
              <div className="relative w-9 h-9 rounded-full border border-cyan-400/60 overflow-hidden flex items-center justify-center bg-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.5)] shrink-0">
                <img 
                  src={natashaLogo} 
                  alt="NATASHA logo" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-0 right-0 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
              </div>
              <div className="truncate">
                <AnimatedNatasha />
                <p className="text-[9px] font-mono font-bold text-cyan-400/70 uppercase tracking-widest hidden sm:block">
                  N.A.T.A.S.H.A 5.6 ASI 916 (ENCRYPTED) // CENTRAL OPERATING SYSTEM
                </p>
              </div>
            </div>
          </div>

          {/* Window Controls */}
          <div className="flex items-center gap-2 shrink-0 ml-4 font-mono">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition-all cursor-pointer"
              title={isMinimized ? "Restore View" : "Minimise"}
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition-all cursor-pointer"
              title={isMaximized ? "Restore Normal Size" : "Maximise View"}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsClosed(true)}
              className="p-2 rounded-xl bg-slate-900/80 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
              title="Close Hub"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TOP NAVIGATION TABS BAR */}
        {!isMinimized && (
          <div className="px-5 py-3 bg-slate-900/80 border-b border-cyan-500/30 flex items-center justify-between gap-3 overflow-x-auto jarvis-scrollbar font-mono text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'chat' 
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.5)] font-black' 
                    : 'bg-slate-950/60 border border-cyan-500/20 text-cyan-300 hover:border-cyan-500/50'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping absolute" />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 relative" />
                </div>
                <span>🔴 NATASHA LIVE CHAT</span>
              </button>

              <button
                onClick={() => setActiveTab('memory')}
                className={`px-4 py-2 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'memory' 
                    ? 'bg-purple-500 text-slate-950 shadow-[0_0_20px_rgba(168,85,247,0.6)] font-black' 
                    : 'bg-slate-950/60 border border-purple-500/30 text-purple-300 hover:border-purple-500/70 hover:bg-purple-950/40'
                }`}
              >
                <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
                <span>🧠 QUICK MEMORY UPDATE</span>
                <span className="px-1.5 py-0.5 text-[9px] bg-purple-950 text-purple-300 border border-purple-400/40 rounded-md font-bold">
                  {storedMemories.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('webapps')}
                className={`px-4 py-2 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'webapps' 
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.5)] font-black' 
                    : 'bg-slate-950/60 border border-cyan-500/20 text-cyan-300 hover:border-cyan-500/50'
                }`}
              >
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span>📁 WEBAPPS FOLDER</span>
                <span className="px-1.5 py-0.5 text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-400/30 rounded-md">
                  {webapps.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('database')}
                className={`px-4 py-2 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'database' 
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.5)] font-black' 
                    : 'bg-slate-950/60 border border-cyan-500/20 text-cyan-300 hover:border-cyan-500/50'
                }`}
              >
                <Database className="w-4 h-4 text-emerald-400" />
                <span>🗄️ CENTRAL DATABASE</span>
              </button>

              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-4 py-2 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'tasks' 
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.5)] font-black' 
                    : 'bg-slate-950/60 border border-cyan-500/20 text-cyan-300 hover:border-cyan-500/50'
                }`}
              >
                <Server className="w-4 h-4 text-purple-400 animate-pulse" />
                <span>⚡ LIVE SERVER TASKS</span>
                <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-md">
                  {serverTasks.filter(t => t.status === 'RUNNING').length} LIVE
                </span>
              </button>

              <button
                onClick={() => setActiveTab('activities')}
                className={`px-4 py-2 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'activities' 
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.5)] font-black' 
                    : 'bg-slate-950/60 border border-cyan-500/20 text-cyan-300 hover:border-cyan-500/50'
                }`}
              >
                <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>📊 ALL SYSTEM ACTIVITIES</span>
              </button>
            </div>

            {/* LIVE VOICE CONTROLS & SYNTHESIZER STATUS */}
            <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
              <button
                type="button"
                onClick={handleToggleAutoSpeak}
                className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer font-bold ${
                  autoSpeakEnabled
                    ? 'bg-purple-600/30 text-purple-200 border-purple-400/80 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse'
                    : 'bg-slate-950/80 text-slate-400 border-slate-700/60 hover:text-purple-300 hover:border-purple-500/40'
                }`}
                title="When ON, Natasha will speak every response aloud automatically in her female voice"
              >
                <Volume2 className={`w-3.5 h-3.5 ${autoSpeakEnabled ? 'text-purple-300' : 'text-slate-400'}`} />
                <span>AUTO-VOICE: {autoSpeakEnabled ? 'ON' : 'OFF'}</span>
              </button>

              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-purple-500/30 text-purple-300">
                <Radio className="w-3 h-3 text-purple-400 animate-pulse" />
                <span className="font-bold text-cyan-400">FEMALE VOICE:</span>
                <span className="text-slate-300 truncate max-w-[120px]" title={voiceSynthesizerName}>{voiceSynthesizerName}</span>
              </div>

              {speakingMessageId && (
                <button
                  type="button"
                  onClick={handleStopAllSpeech}
                  className="px-2.5 py-1.5 rounded-xl bg-red-950/80 text-red-300 border border-red-500/60 hover:bg-red-900 flex items-center gap-1.5 transition-all cursor-pointer font-bold shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse"
                  title="Stop all active voice playback"
                >
                  <Square className="w-3 h-3 fill-red-400 text-red-400" />
                  <span>STOP VOICE</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB CONTENT VIEWPORTS */}
        {!isMinimized && (
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-950/80">
            {/* TAB 1: NATASHA V.I. CHAT */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs jarvis-scrollbar bg-slate-950/80"
                >
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[85%] p-4 rounded-2xl relative overflow-hidden ${
                        msg.sender === 'user' 
                          ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/40 rounded-tr-none shadow-[0_0_15px_rgba(34,211,238,0.15)]' 
                          : 'bg-slate-900/90 text-white/90 rounded-tl-none border border-cyan-500/20 shadow-[0_0_20px_rgba(0,0,0,0.5)]'
                      }`}>
                        {msg.sender === 'natasha' && msg.isBinary && (
                          <div className="absolute inset-0 bg-cyan-500/5 animate-pulse pointer-events-none" />
                        )}

                        {/* Attachment Preview Box */}
                        {msg.attachment && (
                          <div className="mb-3 p-3 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2">
                            <div className="flex items-center gap-2">
                              {renderFileIcon(msg.attachment.category)}
                              <span className="font-bold text-cyan-300 truncate text-xs">{msg.attachment.name}</span>
                              <span className="text-[9px] text-slate-400 font-mono ml-auto">{(msg.attachment.size/(1024*1024)).toFixed(1)} MB</span>
                            </div>
                            {msg.attachment.previewUrl && (
                              <div className="rounded-lg overflow-hidden border border-cyan-500/20 max-h-48 bg-black flex items-center justify-center">
                                {msg.attachment.category === 'video' ? (
                                  <video src={msg.attachment.previewUrl} controls className="max-h-48 w-full object-contain" />
                                ) : (
                                  <img src={msg.attachment.previewUrl} alt="Preview" className="max-h-48 object-contain" />
                                )}
                              </div>
                            )}
                            <p className="text-[10px] text-cyan-400/90 font-mono leading-tight">{msg.attachment.analysisSummary}</p>
                          </div>
                        )}

                        <div className={msg.sender === 'natasha' && msg.isBinary ? "text-cyan-300 font-medium leading-relaxed" : "leading-relaxed"}>
                          {msg.sender === 'natasha' && (
                            <div className="mb-2 text-xs font-black tracking-wider flex items-center justify-between">
                              <div className="flex items-center gap-2 text-cyan-400">
                                <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
                                <span>NATASHA V.I.</span>
                                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30">
                                  FEMALE SYNTH
                                </span>
                              </div>
                              {speakingMessageId === msg.id && (
                                <div className="flex items-center gap-1.5 text-[9px] font-mono text-pink-300 bg-purple-950/90 px-2 py-0.5 rounded-full border border-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.4)] animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
                                  <span>SPEAKING ALOUD</span>
                                </div>
                              )}
                            </div>
                          )}
                          {msg.sender === 'natasha' ? cleanMessageText(msg.text) : msg.text}

                          {/* Natasha Upload Confirmation Compact Card (Requirement 8 & 9) */}
                          {msg.uploadedCard && (
                            <div className="mt-3 p-3.5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.15)] text-xs font-mono space-y-2.5">
                              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                                <div className="flex items-center gap-2 text-white font-bold truncate">
                                  <span>📄</span>
                                  <span className="truncate max-w-[240px]">"{msg.uploadedCard.filename}"</span>
                                </div>
                                <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                                  🕒 {msg.uploadedCard.timestampFormatted || 'Updated now'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                                  <span className="text-slate-400 flex items-center gap-1.5">
                                    <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>Cloudinary:</span>
                                  </span>
                                  <span className="text-emerald-400 font-bold">{msg.uploadedCard.cloudinaryStatus || '✓ Uploaded'}</span>
                                </div>

                                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                                  <span className="text-slate-400 flex items-center gap-1.5">
                                    <Database className="w-3.5 h-3.5 text-blue-400" />
                                    <span>Central DB:</span>
                                  </span>
                                  <span className="text-emerald-400 font-bold">{msg.uploadedCard.centralDbStatus || '✓ Synced'}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                {msg.uploadedCard.cloudinaryUrl && (
                                  <a
                                    href={msg.uploadedCard.cloudinaryUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Preview / Open</span>
                                  </a>
                                )}

                                {msg.uploadedCard.cloudinaryUrl && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(msg.uploadedCard!.cloudinaryUrl);
                                      soundManager.playClickSound();
                                    }}
                                    className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-1.5 cursor-pointer"
                                    title="Copy Cloudinary CDN URL"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>Copy URL</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Toolbar: Listen in Female Voice, Copy & WhatsApp Direct Share */}
                        <div className="mt-3 pt-2 border-t border-cyan-500/20 flex items-center gap-2 justify-end text-[10px] font-mono flex-wrap">
                          {/* LISTEN BUTTON ON EVERY NATASHA RESPONSE */}
                          {msg.sender === 'natasha' && (
                            <button
                              type="button"
                              onClick={() => handleToggleVoice(msg.id, msg.text)}
                              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer font-bold active:scale-95 ${
                                speakingMessageId === msg.id
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-300 shadow-[0_0_15px_rgba(217,70,239,0.5)]'
                                  : 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-purple-100 border-purple-500/40 hover:border-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                              }`}
                              title={speakingMessageId === msg.id ? "Stop female voice playback" : "Listen in Natasha's female voice"}
                            >
                              {speakingMessageId === msg.id ? (
                                <>
                                  <Square className="w-3.5 h-3.5 fill-pink-300 text-pink-300 animate-pulse" />
                                  <span className="text-pink-100">STOP</span>
                                  <span className="flex items-center gap-0.5 ml-0.5">
                                    <span className="w-1 h-2 bg-pink-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1 h-3.5 bg-purple-200 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1 h-2 bg-pink-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                                  <span>LISTEN</span>
                                </>
                              )}
                            </button>
                          )}

                          <button
                            onClick={() => handleCopyMessage(msg.id, msg.text)}
                            className="px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-cyan-950 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 flex items-center gap-1.5 transition-all cursor-pointer font-bold active:scale-95"
                            title="Copy message content"
                          >
                            {copiedMsgId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-300">COPIED!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                                <span>COPY</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleShareWhatsApp(msg.text)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 flex items-center gap-1.5 transition-all cursor-pointer font-bold shadow-[0_0_10px_rgba(16,185,129,0.25)] hover:scale-105 active:scale-95"
                            title="Direct Share via WhatsApp Web or App"
                          >
                            <svg className="w-3.5 h-3.5 fill-emerald-400" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                            </svg>
                            <span>WHATSAPP SHARE</span>
                          </button>
                        </div>
                      </div>
                      <span className="text-[9px] uppercase tracking-widest text-slate-500 mt-1.5 px-1 font-mono">
                        {msg.sender === 'user' ? 'Mr. Raj (Boss)' : 'Natasha // AI Assistant'} // {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-center gap-2.5 text-cyan-400 p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 font-mono text-xs shadow-[0_0_20px_rgba(34,211,238,0.2)] animate-pulse">
                      <Terminal className="w-4 h-4 text-cyan-400 animate-spin" />
                      <span className="uppercase tracking-widest font-bold">
                        {chatUploadStatus || "Natasha Processing Command & Analyzing Request..."}
                      </span>
                    </div>
                  )}
                </div>

                {/* Selected File Attachment Indicator */}
                {selectedFile && (
                  <div className="px-5 py-2.5 bg-slate-900 border-t border-cyan-500/30 flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center gap-2.5 text-cyan-300 truncate">
                      {renderFileIcon(selectedFile.category)}
                      <span className="font-bold truncate">{selectedFile.name}</span>
                      <span className="text-[9px] text-cyan-500 font-mono">({selectedFile.category.toUpperCase()})</span>
                    </div>
                    <button 
                      onClick={() => setSelectedFile(null)}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      title="Remove File"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* QUICK MEMORY UPDATE AS TEXT (HOME SCREEN INLINE DRAWER) */}
                <div className="border-t border-purple-500/30 bg-gradient-to-r from-purple-950/50 via-slate-950/90 to-cyan-950/50">
                  <div className="px-4 py-2 flex items-center justify-between font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => setIsQuickMemoryOpen(!isQuickMemoryOpen)}
                      className="flex items-center gap-2 text-purple-300 hover:text-purple-100 font-bold uppercase tracking-wider cursor-pointer group"
                    >
                      <div className="p-1 rounded-md bg-purple-500/20 border border-purple-400/40 text-purple-300 group-hover:scale-110 transition-transform">
                        <Brain className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <span className="text-[11px] font-black tracking-widest text-purple-200">⚡ QUICK MEMORY UPDATE AS TEXT</span>
                      <span className="text-[10px] text-cyan-400 font-mono">({storedMemories.length} memories)</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-400/30 font-bold">
                        {isQuickMemoryOpen ? '▲ COLLAPSE' : '▼ TYPE MEMORY AS TEXT'}
                      </span>
                    </button>

                    <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                      <span className="hidden md:inline">Or chat: <code className="text-purple-300 bg-purple-950/80 px-1 py-0.5 rounded border border-purple-500/30">remember: [text]</code></span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('memory')}
                        className="text-purple-400 hover:text-purple-300 underline font-bold cursor-pointer"
                      >
                        Memory Hub →
                      </button>
                    </div>
                  </div>

                  {isQuickMemoryOpen && (
                    <div className="px-4 pb-3 pt-1 space-y-2.5 font-mono text-xs border-t border-purple-500/20 bg-slate-950/80">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-purple-300 text-[10px] font-bold">
                          <Zap className="w-3 h-3 text-purple-400" />
                          <span className="uppercase tracking-wider">Direct Neural Buffer Commit</span>
                        </div>
                        {quickMemorySuccess && (
                          <div className="flex items-center gap-1.5 text-emerald-300 text-[10px] font-bold bg-emerald-950/90 px-2 py-0.5 rounded-md border border-emerald-400/40 animate-pulse">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>✓ MEMORY RECORDED & GRAPH-LINKED!</span>
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <textarea
                          value={quickMemoryText}
                          onChange={(e) => setQuickMemoryText(e.target.value)}
                          placeholder="Type quick memory update as text for Natasha (e.g., 'Customer Ramesh prefers 80 GSM bond paper on all double-sided printing orders', 'Office delivery cutoff is strictly 5:30 PM', 'Boss Jonathan birthday is next month')..."
                          rows={2}
                          className="w-full bg-slate-950 border border-purple-500/40 rounded-xl p-2.5 text-xs text-purple-100 placeholder:text-purple-400/40 font-mono focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 jarvis-scrollbar resize-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              e.preventDefault();
                              handleCommitQuickMemory();
                            }
                          }}
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-slate-400 uppercase font-black text-[9px]">CATEGORY:</span>
                          {['General', 'Client / Customer', 'Print Order', 'Business Rule', 'Personal'].map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setQuickMemoryCategory(cat)}
                              className={`px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                quickMemoryCategory === cat 
                                  ? 'bg-purple-600 text-white border-purple-400 font-bold shadow-[0_0_10px_rgba(168,85,247,0.4)]' 
                                  : 'bg-slate-900 text-purple-300/70 border-purple-500/20 hover:border-purple-500/50'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[9px] hidden sm:inline">Ctrl+Enter to save</span>
                          <button
                            type="button"
                            onClick={() => handleCommitQuickMemory()}
                            disabled={!quickMemoryText.trim()}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:pointer-events-none text-white font-black flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all active:scale-95 cursor-pointer uppercase tracking-wider text-[10px]"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>COMMIT TEXT TO NATASHA</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-cyan-500/30 bg-slate-900/90 flex flex-col gap-2.5">
                  {/* Prompt Preset Shortcut Buttons */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 jarvis-scrollbar text-[10px] font-mono">
                    <span className="text-cyan-400/60 font-black uppercase tracking-widest shrink-0">QUICK PROMPTS:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsQuickMemoryOpen(true);
                        setQuickMemoryText("Remember that ");
                      }}
                      className="px-2.5 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-500/40 shrink-0 transition-all hover:scale-105 active:scale-95 text-left font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Brain className="w-3 h-3 text-purple-400" />
                      <span>🧠 "remember this as text:"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputValue("write longer with: ")}
                      className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 shrink-0 transition-all hover:scale-105 active:scale-95 text-left font-bold"
                    >
                      📝 "write longer with:"
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputValue("write reply to this message (in American Urban Slang with short and stylish words with no too much punctuations): ")}
                      className="px-2.5 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/40 shrink-0 transition-all hover:scale-105 active:scale-95 text-left font-bold"
                    >
                      🔥 "write reply to this message (in American Urban Slang with short and stylish words with no too much punctuations):"
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputValue("write reply formal(as a printline customer assistant) to: ")}
                      className="px-2.5 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-500/40 shrink-0 transition-all hover:scale-105 active:scale-95 text-left font-bold"
                    >
                      💼 "write reply formal(as a printline customer assistant) to:"
                    </button>
                  </div>

                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp,.tif,.tiff,.psd,.ai,.cdr,.pdf,.doc,.docx,.pptx,.xlsx,.mp4,.mov,.avi,.mkv,.webm,video/*,image/*"
                  />

                  {/* Live Voice Dictation Status Banner */}
                  {isSpeechRecognitionActive && (
                    <div className="px-3.5 py-2 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs font-mono flex items-center justify-between shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                        <Mic className="w-4 h-4 text-red-400" />
                        <span className="font-black text-white uppercase tracking-wider">LIVE VOICE LISTENING ACTIVE:</span>
                        <span className="text-red-300">Speak your request to Natasha...</span>
                      </div>
                      <button
                        type="button"
                        onClick={toggleSpeechRecognition}
                        className="px-2 py-0.5 rounded bg-red-900/80 hover:bg-red-800 text-[10px] font-bold text-white border border-red-400/50 cursor-pointer"
                      >
                        DONE
                      </button>
                    </div>
                  )}

                  <div className="relative flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 bg-slate-950/80 hover:bg-slate-900 text-cyan-400 border border-cyan-500/30 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(34,211,238,0.1)] cursor-pointer"
                      title="Attach File or Video (JPG, PNG, PSD, AI, CDR, PDF, Word, MP4...)"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>

                    {/* Live Speech-to-Text Microphone Input */}
                    <button
                      type="button"
                      onClick={toggleSpeechRecognition}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSpeechRecognitionActive
                          ? 'bg-red-600 text-white border-red-300 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse scale-105'
                          : 'bg-slate-950/80 hover:bg-purple-950/60 text-purple-400 hover:text-purple-200 border-purple-500/40 hover:scale-105 active:scale-95 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                      }`}
                      title={isSpeechRecognitionActive ? "Listening live to microphone... Click to stop" : "Speak Live to Natasha (Microphone Voice Input)"}
                    >
                      {isSpeechRecognitionActive ? (
                        <Mic className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </button>

                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={isSpeechRecognitionActive ? "LISTENING TO YOUR VOICE... SPEAK NOW..." : "CHAT LIVE WITH NATASHA, SPEAK VIA MIC, OR ISSUE SYSTEM DIRECTIVE..."}
                      className={`flex-1 bg-slate-950/80 border rounded-xl py-3 px-4 text-xs font-bold text-white uppercase tracking-[0.08em] focus:outline-none focus:ring-1 border-l-4 transition-all ${
                        isSpeechRecognitionActive
                          ? 'border-red-500/80 focus:ring-red-500 border-l-red-400 placeholder:text-red-400'
                          : 'border-cyan-500/30 focus:ring-cyan-500/60 border-l-cyan-400 placeholder:text-cyan-500/30'
                      }`}
                    />

                    <button 
                      type="submit"
                      className="p-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] cursor-pointer active:scale-95"
                      title="Send Command"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: QUICK MEMORY UPDATE & NEURAL BUFFER */}
            {activeTab === 'memory' && (
              <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto jarvis-scrollbar font-mono text-xs space-y-6 bg-slate-950">
                {/* Top Header Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900/90 to-cyan-950/60 border border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                      <Brain className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <span>NATASHA DIRECT TEXT MEMORY BUFFER</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                          {storedMemories.length} LOGGED
                        </span>
                      </h3>
                      <p className="text-[10px] text-purple-300/80 mt-0.5 font-mono">
                        Direct text ingestion: Feed customer specs, rules, paper preferences, or system notes directly to Natasha.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>AES-256 GRAPH LINKED</span>
                    </span>
                  </div>
                </div>

                {/* Quick Memory Text Input Card */}
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-purple-500/40 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-300 font-black text-xs uppercase tracking-wider">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span>INPUT QUICK MEMORY UPDATE AS TEXT</span>
                    </div>
                    {quickMemorySuccess && (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-[11px] font-bold animate-pulse">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>✓ MEMORY COMMITTED TO NATASHA!</span>
                      </div>
                    )}
                  </div>

                  {/* Textarea */}
                  <div className="space-y-1.5">
                    <textarea
                      value={quickMemoryText}
                      onChange={(e) => setQuickMemoryText(e.target.value)}
                      placeholder="Type or paste memory text here... (e.g. 'Client Ramesh always requests 80 GSM bond paper for legal billing sheets. Deliver to Galle Road branch before 5:00 PM.')"
                      rows={4}
                      className="w-full bg-slate-950 border border-purple-500/40 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 rounded-xl p-3.5 text-xs text-white placeholder:text-purple-400/40 font-mono resize-none jarvis-scrollbar leading-relaxed"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          handleCommitQuickMemory();
                        }
                      }}
                    />
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono px-1">
                      <span>Press <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">Enter</kbd> to quickly commit</span>
                      <span>{quickMemoryText.length} characters</span>
                    </div>
                  </div>

                  {/* Quick Preset Text Chips */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">FAST TEXT TEMPLATES:</div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Client Ramesh (80 GSM)', text: 'Customer Ramesh always requests 80 GSM bond paper for all legal invoices. Needs delivery before 5:00 PM.', cat: 'Client / Customer' },
                        { label: 'Bulk Printing Schedule', text: 'Raj Expo Digitals bulk offset and duplex runs execute every Tuesday and Thursday morning.', cat: 'Business Rule' },
                        { label: 'Boss Jonathan Note', text: 'Boss Jonathan Raj prefers double-sided duplex proofs printed 2-up for review before final production.', cat: 'Personal' },
                        { label: 'Central DB Backup', text: 'Weekly automated database and file archives are mirrored to Google Drive and GitHub repository.', cat: 'General' },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setQuickMemoryText(preset.text);
                            setQuickMemoryCategory(preset.cat);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-purple-950/70 border border-purple-500/25 hover:border-purple-500/60 text-purple-300 text-[10px] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                        >
                          <Bookmark className="w-3 h-3 text-purple-400" />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Settings Row: Category + Importance + Tags */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] text-purple-300/80 font-bold uppercase tracking-wider block mb-1">
                        Category
                      </label>
                      <select
                        value={quickMemoryCategory}
                        onChange={(e) => setQuickMemoryCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400 font-mono cursor-pointer"
                      >
                        <option value="General">General</option>
                        <option value="Client / Customer">Client / Customer</option>
                        <option value="Print Order">Print Order</option>
                        <option value="Business Rule">Business Rule</option>
                        <option value="Personal">Personal</option>
                        <option value="Technical Spec">Technical Spec</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-purple-300/80 font-bold uppercase tracking-wider block mb-1">
                        Importance
                      </label>
                      <select
                        value={quickMemoryImportance}
                        onChange={(e) => setQuickMemoryImportance(e.target.value as any)}
                        className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400 font-mono cursor-pointer"
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM (Standard)</option>
                        <option value="HIGH">HIGH (Priority Recall)</option>
                        <option value="CRITICAL">CRITICAL (System Core)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-purple-300/80 font-bold uppercase tracking-wider block mb-1">
                        Tags (Comma-Separated)
                      </label>
                      <input
                        type="text"
                        value={quickMemoryTags}
                        onChange={(e) => setQuickMemoryTags(e.target.value)}
                        placeholder="e.g. ramesh, 80gsm, duplex"
                        className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400 font-mono"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => handleCommitQuickMemory()}
                      disabled={!quickMemoryText.trim()}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all cursor-pointer active:scale-95"
                    >
                      <Zap className="w-4 h-4" />
                      <span>COMMIT TEXT TO NATASHA'S MEMORY BUFFER</span>
                    </button>
                  </div>
                </div>

                {/* Stored Memory Explorer & Search */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-purple-500/30">
                    <div className="flex items-center gap-2.5">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-black text-white uppercase tracking-wider">
                        STORED KNOWLEDGE GRAPH MEMORIES ({storedMemories.length})
                      </span>
                    </div>

                    <div className="relative flex-1 sm:max-w-xs">
                      <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={memorySearchQuery}
                        onChange={(e) => setMemorySearchQuery(e.target.value)}
                        placeholder="Search memory text, tags, or entities..."
                        className="w-full bg-slate-950 border border-purple-500/30 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-purple-400/40 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  {/* Filter Categories Chips */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 jarvis-scrollbar text-[10px]">
                    <span className="text-slate-500 uppercase font-black tracking-wider shrink-0">FILTER:</span>
                    {['all', 'General', 'Client / Customer', 'Print Order', 'Business Rule', 'Personal'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedMemoryCategoryFilter(cat)}
                        className={`px-3 py-1 rounded-lg border transition-all cursor-pointer uppercase shrink-0 font-bold ${
                          selectedMemoryCategoryFilter === cat
                            ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                            : 'bg-slate-900/90 text-purple-300/70 border-purple-500/20 hover:border-purple-500/50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Memories Grid / List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {storedMemories
                      .filter(m => {
                        if (selectedMemoryCategoryFilter !== 'all' && m.category !== selectedMemoryCategoryFilter) {
                          return false;
                        }
                        if (memorySearchQuery.trim()) {
                          const q = memorySearchQuery.toLowerCase();
                          const matchesTitle = m.title?.toLowerCase().includes(q);
                          const matchesDesc = m.description?.toLowerCase().includes(q);
                          const matchesCategory = m.category?.toLowerCase().includes(q);
                          const matchesTags = m.tags?.some(t => t.toLowerCase().includes(q));
                          return matchesTitle || matchesDesc || matchesCategory || matchesTags;
                        }
                        return true;
                      })
                      .map((mem) => (
                        <div
                          key={mem.id}
                          className="p-4 rounded-2xl bg-slate-900/80 border border-purple-500/30 hover:border-purple-400/60 transition-all flex flex-col justify-between space-y-3 shadow-lg"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-500/40 text-[9px] font-bold uppercase tracking-wider">
                                {mem.category}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider ${
                                mem.importanceLevel === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-500/40' :
                                mem.importanceLevel === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                                'bg-slate-950 text-cyan-300 border border-cyan-500/30'
                              }`}>
                                {mem.importanceLevel}
                              </span>
                            </div>

                            <h4 className="text-xs font-black text-white leading-tight mb-1">
                              {mem.title}
                            </h4>
                            <p className="text-[11px] text-purple-200/90 leading-relaxed font-mono whitespace-pre-wrap">
                              {mem.description}
                            </p>

                            {/* Tags and Entity Link Badges */}
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                              {mem.connectedEntityIds && mem.connectedEntityIds.length > 0 && (
                                mem.connectedEntityIds.map(eId => (
                                  <span
                                    key={eId}
                                    className="px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-[9px] font-mono"
                                  >
                                    🔗 {eId.replace('ent-', '')}
                                  </span>
                                ))
                              )}
                              {mem.tags && mem.tags.map((tg, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 text-[9px]"
                                >
                                  #{tg}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Action Toolbar */}
                          <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span className="text-[9px] text-slate-500">
                              {mem.lastUpdated ? new Date(mem.lastUpdated).toLocaleDateString() : mem.createdTime || 'Saved'}
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopyMemoryText(mem.id, mem.description)}
                                className="px-2 py-1 rounded bg-slate-950 hover:bg-purple-950 text-purple-300 border border-purple-500/30 hover:border-purple-400 transition-all flex items-center gap-1 cursor-pointer"
                                title="Copy memory text"
                              >
                                {copiedMemoryId === mem.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-300 text-[9px]">COPIED</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span className="text-[9px]">COPY</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteMemory(mem.id, mem.title)}
                                className="px-2 py-1 rounded bg-slate-950 hover:bg-red-950 text-red-400 border border-red-500/30 hover:border-red-400 transition-all flex items-center gap-1 cursor-pointer"
                                title="Delete this memory"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span className="text-[9px]">DELETE</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {storedMemories.length === 0 && (
                    <div className="p-8 rounded-2xl bg-slate-900/50 border border-purple-500/20 text-center space-y-2">
                      <Brain className="w-8 h-8 text-purple-400/50 mx-auto animate-pulse" />
                      <p className="text-xs text-purple-300 font-bold uppercase tracking-wider">No memories logged yet</p>
                      <p className="text-[10px] text-slate-400 max-w-md mx-auto">
                        Type any customer preference, business rule, or note into the box above to immediately update Natasha's long-term neural memory.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: WEBAPPS FOLDER */}
            {activeTab === 'webapps' && (
              <div className="flex-1 flex flex-col p-5 overflow-y-auto jarvis-scrollbar space-y-6 font-mono">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-cyan-500/20">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="w-7 h-7 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">WEBAPPS FOLDER REGISTRY</h3>
                      <p className="text-[10px] text-cyan-400/70">ALL REGISTERED WEBAPP SERVICES IN RAJ EXPO DEPLOYMENT MATRIX</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="w-4 h-4 text-cyan-500 absolute left-3 top-3" />
                      <input 
                        type="text"
                        value={webappsSearch}
                        onChange={(e) => setWebappsSearch(e.target.value)}
                        placeholder="SEARCH WEBAPPS OR PORTS..."
                        className="bg-slate-950 border border-cyan-500/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-cyan-500/40 uppercase tracking-wider focus:outline-none focus:border-cyan-400 w-full"
                      />
                    </div>

                    <button
                      onClick={() => setIsAddingApp(!isAddingApp)}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                    >
                      <Plus className="w-4 h-4" /> ADD WEBAPP
                    </button>
                  </div>
                </div>

                {isAddingApp && (
                  <form onSubmit={handleAddWebApp} className="p-4 bg-cyan-950/30 border border-cyan-500/40 rounded-2xl flex flex-col sm:flex-row gap-3 items-center">
                    <input 
                      type="text"
                      value={newAppName}
                      onChange={(e) => setNewAppName(e.target.value)}
                      placeholder="WEBAPP NAME (E.G. BILLING PORTAL)..."
                      className="bg-slate-950 border border-cyan-500/30 rounded-xl px-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none flex-1 uppercase"
                    />
                    <input 
                      type="number"
                      value={newAppPort}
                      onChange={(e) => setNewAppPort(e.target.value)}
                      placeholder="PORT (E.G. 3006)..."
                      className="bg-slate-950 border border-cyan-500/30 rounded-xl px-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none w-32 uppercase"
                    />
                    <button type="submit" className="px-5 py-2 bg-emerald-500 text-slate-950 font-black text-xs uppercase rounded-xl hover:bg-emerald-400 cursor-pointer">
                      REGISTER
                    </button>
                    <button type="button" onClick={() => setIsAddingApp(false)} className="px-3 py-2 text-red-400 text-xs uppercase hover:text-white cursor-pointer">
                      CANCEL
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredWebApps.map((app) => (
                    <motion.div
                      key={app.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-cyan-400 transition-all shadow-[0_0_25px_rgba(0,0,0,0.5)] relative overflow-hidden group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                            PORT {app.port}
                          </span>
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1 ${
                            app.status === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${app.status === 'RUNNING' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                            {app.status}
                          </span>
                        </div>

                        <h4 className="text-xs font-black text-white uppercase tracking-wider group-hover:text-cyan-300 transition-colors">
                          {app.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                          {app.description}
                        </p>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-cyan-500/10 text-[9px] text-slate-400">
                        <div className="flex justify-between">
                          <span>FRAMEWORK:</span>
                          <span className="text-cyan-300 font-bold">{app.framework}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>MEMORY / UPTIME:</span>
                          <span className="text-emerald-400 font-bold">{app.memory} // {app.uptime}</span>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <a 
                            href={app.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 py-2 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-bold rounded-xl border border-cyan-500/40 text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" /> LAUNCH
                          </a>
                          <button 
                            onClick={() => {
                              setSelectedTaskPid(app.port);
                              setActiveTab('tasks');
                            }}
                            className="py-2 px-3 bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                            title="Inspect Terminal Stream"
                          >
                            <Code className="w-3.5 h-3.5" /> LOGS
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: CENTRAL DATABASE (KNOWLEDGE GRAPH) */}
            {activeTab === 'database' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <KnowledgeGraphDatabase />
              </div>
            )}

            {/* TAB 4: LIVE SERVER TASK MANAGEMENT (WITH KEYWORD SEARCH & END TASK SUPPORT) */}
            {activeTab === 'tasks' && (
              <div className="flex-1 flex flex-col p-5 overflow-hidden font-mono text-xs space-y-4">
                {/* Search Bar & End Tasks Controls */}
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-cyan-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-3" />
                    <input 
                      type="text"
                      value={taskKeywordSearch}
                      onChange={(e) => setTaskKeywordSearch(e.target.value)}
                      placeholder="SEARCH TERMINAL TASKS & CODE LOGS BY KEYWORD (E.G. SERVER, BUILD, PORT 3000)..."
                      className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-cyan-500/40 uppercase tracking-wider focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {taskKeywordSearch.trim() && (
                    <button
                      onClick={handleEndMatchingTasksByKeyword}
                      className="px-4 py-2.5 bg-red-600/30 hover:bg-red-600 text-red-200 border border-red-500/50 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shrink-0 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                      title="End all tasks matching current search keyword"
                    >
                      <StopCircle className="w-4 h-4" /> END MATCHING TASKS
                    </button>
                  )}
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
                  {/* Process List */}
                  <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 overflow-y-auto jarvis-scrollbar space-y-2">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span>RUNNING PROCESSES ({filteredServerTasks.length})</span>
                      <span className="text-[9px] text-cyan-400">CLICK TO INSPECT</span>
                    </h4>

                    {filteredServerTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskPid(task.pid)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          selectedTaskPid === task.pid 
                            ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                            : 'bg-slate-950/80 border-cyan-500/20 hover:border-cyan-500/50'
                        }`}
                      >
                        <div className="space-y-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-cyan-400 bg-cyan-950 px-1.5 rounded">PID {task.pid}</span>
                            <span className="font-bold text-white truncate text-xs">{task.name}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-mono truncate">{task.cmd}</p>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                            task.status === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'
                          }`}>
                            {task.status}
                          </span>
                          
                          {task.status === 'RUNNING' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEndTaskByPid(task.pid);
                              }}
                              className="px-2 py-0.5 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded border border-red-500/40 text-[8px] font-black uppercase transition-all cursor-pointer"
                              title="End task immediately"
                            >
                              END TASK
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Terminal Viewport */}
                  <div className="lg:col-span-2 bg-black/90 border border-cyan-500/40 rounded-2xl p-4 flex flex-col justify-between overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                    <div className="pb-3 border-b border-cyan-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <span className="font-black text-cyan-300 uppercase tracking-widest text-xs">
                          {selectedTask?.name.toUpperCase()} (PID {selectedTask?.pid})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-cyan-500 font-mono">CPU: {selectedTask?.cpu} | RAM: {selectedTask?.ram}</span>
                        {selectedTask?.status === 'RUNNING' && (
                          <button
                            onClick={() => handleEndTaskByPid(selectedTask.pid)}
                            className="px-3 py-1 bg-red-600/30 hover:bg-red-600 text-red-200 border border-red-500/40 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all"
                          >
                            END TASK
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Output Log Lines */}
                    <div className="flex-1 my-3 overflow-y-auto space-y-1.5 font-mono text-[11px] jarvis-scrollbar pr-2">
                      {selectedTask?.logs.map((line, idx) => (
                        <div key={idx} className="flex gap-2 leading-relaxed">
                          <span className="text-slate-600 shrink-0">&gt;</span>
                          <span className={
                            line.includes('ERROR') || line.includes('TERMINATED') || line.includes('KILLED')
                              ? 'text-red-400 font-bold'
                              : line.includes('SUCCESS') || line.includes('OK')
                              ? 'text-emerald-400 font-bold'
                              : line.includes('MR. RAJ INPUT')
                              ? 'text-white bg-cyan-900/60 px-1 rounded font-bold'
                              : 'text-cyan-200'
                          }>
                            {line}
                          </span>
                        </div>
                      ))}
                      <div ref={taskLogsEndRef} />
                    </div>

                    {/* Terminal Input Form */}
                    <form onSubmit={handleTaskTerminalSubmit} className="pt-2 border-t border-cyan-500/30 flex items-center gap-2">
                      <span className="text-cyan-400 font-bold">&gt;</span>
                      <input 
                        type="text"
                        value={taskTerminalInput}
                        onChange={(e) => setTaskTerminalInput(e.target.value)}
                        placeholder="INPUT COMMAND OR KEYWORD TO PROCESS (E.G. 'RESTART', 'KILL', 'CLEAR')..."
                        className="flex-1 bg-slate-950 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-cyan-100 placeholder:text-cyan-600/60 uppercase font-mono focus:outline-none focus:border-cyan-400"
                      />
                      <button 
                        type="submit" 
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs uppercase flex items-center gap-1 cursor-pointer"
                      >
                        <CornerDownLeft className="w-3.5 h-3.5" /> EXEC
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: ALL SYSTEM ACTIVITIES */}
            {activeTab === 'activities' && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <AllSystemActivitiesModal inlineView isOpen={true} onClose={() => {}} />
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

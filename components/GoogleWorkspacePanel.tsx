import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, FileText, ArrowLeft, Plus, Play, Calendar, CheckSquare, 
  Mail, Users, FileSpreadsheet, FileDigit, HelpCircle, RefreshCw, 
  Volume2, Mic, MicOff, Trash2, Check, ExternalLink, Library, Save,
  Layers, ChevronRight, Bookmark, Database, AlertCircle, Info, Send,
  Search, Eye, Inbox
} from 'lucide-react';
import { DriveNode, CartItem, GoogleContact, GoogleTask, GoogleEvent, GmailMessage } from '../types';
import { DraggableResizableWindow } from './DraggableResizableWindow';
import { 
  listFolderContents, 
  createDriveFolder, 
  bootstrapDriveStructure, 
  listCalendarEvents, 
  createCalendarEvent, 
  logToSpreadsheet, 
  listGoogleTasks, 
  createGoogleTask, 
  sendGmailMessage, 
  fetchContacts, 
  createGoogleDoc,
  createKeepNote,
  listUserFeedbackForms,
  listGmailMessages,
  trashGmailMessage
} from '../services/googleService';

interface GoogleWorkspacePanelProps {
  user: any;
  accessToken: string;
  onLogout: () => void;
  singleSidedCost: number;
  doubleSidedCost: number;
  pagesPerSide: number;
}

export const GoogleWorkspacePanel: React.FC<GoogleWorkspacePanelProps> = ({
  user,
  accessToken,
  onLogout,
  singleSidedCost,
  doubleSidedCost,
  pagesPerSide
}) => {
  // Folder core navigation states
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderHistory, setFolderHistory] = useState<{ id: string; name: string }[]>([]);
  const [driveItems, setDriveItems] = useState<DriveNode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(false);
  const [bootstrapProgress, setBootstrapProgress] = useState<string>('');
  
  // Selection/Cart persistence logic
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('natasha_drive_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Action status/logging alerts (Jarvis style telemetry)
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'NATASHA: Google Workspace main telemetry channels live.',
    'NATASHA: Cryptographic authorization certified for ' + user.email
  ]);
  
  // Voice & text directives state
  const [commandInput, setCommandInput] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const speechRecognitionRef = useRef<any>(null);

  // Auxiliary API data integration states
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<GoogleEvent[]>([]);
  const [googleForms, setGoogleForms] = useState<any[]>([]);
  
  // Tab control inside Workspace utility
  const [activeTab, setActiveTab] = useState<'gmail' | 'calendar' | 'sheets' | 'tasks' | 'misc'>('gmail');

  // Rich Gmail Operations State
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
  const [isGmailLoading, setIsGmailLoading] = useState<boolean>(false);
  const [gmailLabelId, setGmailLabelId] = useState<string>('INBOX');
  const [gmailSearchBar, setGmailSearchBar] = useState<string>('');
  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null);
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [viewReceipt, setViewReceipt] = useState<boolean>(false);

  // Form states for workspace APIs
  const [gmailTo, setGmailTo] = useState('');
  const [gmailSubject, setGmailSubject] = useState('Raj Expo Printing Past Papers Invoice');
  const [gmailBody, setGmailBody] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');

  const [calendarTitle, setCalendarTitle] = useState('Study Past Papers print review');
  const [calendarDesc, setCalendarDesc] = useState('Discuss mark schemes and question papers printed via Raj Expo');
  const [calendarDate, setCalendarDate] = useState('2026-05-25T14:30');

  const [taskTitle, setTaskTitle] = useState('Complete Mathematics 2024 QP 1');
  const [taskNotes, setTaskNotes] = useState('Printout produced by Natasha past papers engine');

  const [docTitle, setDocTitle] = useState('Study Guide Planner - O Level 2026');
  const [docContent, setDocContent] = useState('Cambridgeshire dynamic printing syllabus structure logged directly by NATASHA.');

  const [notesTitle, setNotesTitle] = useState('Past Papers Printing Instructions');
  const [notesText, setNotesText] = useState('Print Physics and Chemistry double sided with 2 slides per side.');

  // Save selection cart to storage whenever it updates
  useEffect(() => {
    localStorage.setItem('natasha_drive_cart', JSON.stringify(cart));
  }, [cart]);

  // Terminal telemetry log helper
  const addLog = useCallback((text: string) => {
    setTerminalLogs(prev => [`[${new Date().toLocaleTimeString()}] ${text}`, ...prev.slice(0, 15)]);
  }, []);

  // Sync / Load folder contents
  const loadFolder = useCallback(async (folderId: string) => {
    setIsLoading(true);
    try {
      const items = await listFolderContents(folderId);
      setDriveItems(items);
      addLog(`Drive directory scanned successfully. Loaded ${items.length} nodes.`);
    } catch (err: any) {
      addLog(`ERROR: Drive read failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [addLog]);

  // Trigger loading when id changes
  useEffect(() => {
    loadFolder(currentFolderId);
  }, [currentFolderId, loadFolder]);

  // Fetch adjacent auxiliary assets (Inbox details, Contacts, Calendar event triggers)
  const fetchAuxiliaryData = useCallback(async () => {
    try {
      const grabbedContacts = await fetchContacts();
      setContacts(grabbedContacts);
      
      const grabbedTasks = await listGoogleTasks();
      setTasks(grabbedTasks);

      const grabbedCal = await listCalendarEvents();
      setCalendarEvents(grabbedCal);

      const grabbedForms = await listUserFeedbackForms();
      setGoogleForms(grabbedForms);

      addLog('Auxiliary Workspace resources pre-fetched. Contacts & Calendars ready.');
    } catch (err: any) {
      console.error('Auxiliary download failed: ', err);
    }
  }, [addLog]);

  useEffect(() => {
    fetchAuxiliaryData();
  }, [fetchAuxiliaryData]);

  // Integrated Gmail Email Dispatch & Fetch Operations
  const fetchEmails = useCallback(async (query = '', label = gmailLabelId) => {
    setIsGmailLoading(true);
    addLog(`Scanning Gmail pipeline: ${label}...`);
    try {
      const msgs = await listGmailMessages(query, label);
      setGmailMessages(msgs);
      addLog(`Sync perfect: loaded ${msgs.length} messages from Gmail.`);
    } catch (err: any) {
      addLog(`ERROR: Gmail download failed: ${err.message}`);
    } finally {
      setIsGmailLoading(false);
    }
  }, [gmailLabelId, addLog]);

  useEffect(() => {
    if (activeTab === 'gmail') {
      fetchEmails(gmailSearchBar, gmailLabelId);
    }
  }, [gmailLabelId, activeTab, fetchEmails, gmailSearchBar]);

  const handleTrashEmail = async (id: string) => {
    try {
      const success = await trashGmailMessage(id);
      if (success) {
        addLog('GMAIL DISPATCH: Message successfully moved to trash folder.');
        fetchEmails(gmailSearchBar, gmailLabelId);
      } else {
        addLog('ERROR: Gmail Trash action was rejected.');
      }
    } catch (err: any) {
      addLog(`ERROR: Trash handler crashed: ${err.message}`);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const today = new Date();
      if (d.toDateString() === today.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Double Sided page count engine calculation helper
  // formula: "3 pages => 2 sheets", "1 page => 1 sheet"
  const getSheetsCount = (pagesCount: number) => {
    const adjusted = pagesCount % 2 !== 0 ? pagesCount + 1 : pagesCount;
    return Math.ceil(adjusted / 2);
  };

  // Google Drive folder bootstrapping structure creation
  const handleBootstrapDrive = async () => {
    const confirmed = window.confirm(
      'Proceeding will construct the formal "Cambridge Past Papers" O/A-Levels syllabus tree directly in your Google Drive storage. Run sequence?'
    );
    if (!confirmed) return;

    setIsBootstrapping(true);
    setBootstrapProgress('Initializing secure holographic pipeline...');
    addLog('Bootstrap sequence authorized by CEO.');
    try {
      const rootFolder = await bootstrapDriveStructure((progMsg) => {
        setBootstrapProgress(progMsg);
        addLog(progMsg);
      });
      setCurrentFolderId(rootFolder.id);
      setFolderHistory([]);
      addLog('Cambridge folder database compiled perfectly!');
    } catch (err: any) {
      addLog(`ERROR: Bootstrap mapping aborted: ${err.message}`);
    } finally {
      setIsBootstrapping(false);
    }
  };

  // Folder navigation system functions
  const enterFolder = (id: string, name: string) => {
    setFolderHistory(prev => [...prev, { id: currentFolderId, name }]);
    setCurrentFolderId(id);
    addLog(`Diving deep into folder: ${name}`);
  };

  const goBack = () => {
    if (folderHistory.length === 0) return;
    const historyCopy = [...folderHistory];
    const prev = historyCopy.pop();
    if (prev) {
      setFolderHistory(historyCopy);
      setCurrentFolderId(prev.id);
      addLog(`Ascending back up into: ${prev.name}`);
    }
  };

  const traverseToRoot = () => {
    setCurrentFolderId('root');
    setFolderHistory([]);
    addLog('Mainframe workspace anchor reset to Google Drive root.');
  };

  // Dynamic path generator for files to place in the global print cart
  const getCurrentFolderPathString = () => {
    if (folderHistory.length === 0) return 'Root /';
    return folderHistory.map(f => f.name).join(' / ') + ' / ' + driveItems[0]?.name?.split(' ')[0] || '';
  };

  // CART (Selection System ☑️) logic toggle
  const toggleCartSelection = (item: DriveNode) => {
    const exists = cart.find(c => c.id === item.id);
    if (exists) {
      setCart(prev => prev.filter(c => c.id !== item.id));
      addLog(`REMOVED: "${item.name}" decoupled from global selection queue.`);
    } else {
      const folderPath = folderHistory.map(f => f.name).join('/') || 'Drive Root';
      
      const pageCount = item.pageCount || 10;
      const shCount = getSheetsCount(pageCount);
      const sSPrice = pageCount * singleSidedCost;
      const dSPrice = shCount * doubleSidedCost;

      const newCartItem: CartItem = {
        id: item.id,
        name: item.name,
        folderPath,
        pageCount,
        sheetCount: shCount,
        singleSidedPrice: sSPrice,
        doubleSidedPrice: dSPrice,
        type: item.type,
        checked: true
      };
      setCart(prev => [...prev, newCartItem]);
      addLog(`☑️ SELECTION SUCCESS: "${item.name}" locked into global persistent cart.`);
    }
  };

  const clearGlobalCart = () => {
    const confirmed = window.confirm('Clear all selected past papers from global print cart?');
    if (!confirmed) return;
    setCart([]);
    addLog('Nuke order received. Selection cart purged entirely.');
  };

  // Workspace integration action triggers
  // 1. Gmail citation receipt dispatch
  const handleSendGmailReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailTo.trim()) {
      alert('Recipient Address required.');
      return;
    }
    
    // Auto-generate invoice content if body is blank
    let finalBody = gmailBody;
    if (!finalBody.trim()) {
      const receiptRows = cart.map(item => `
        <tr>
          <td style="border:1px solid #22d3ee; padding:8px">${item.name}</td>
          <td style="border:1px solid #22d3ee; padding:8px; text-align:center">${item.pageCount}</td>
          <td style="border:1px solid #22d3ee; padding:8px; text-align:center">${item.sheetCount}</td>
          <td style="border:1px solid #22d3ee; padding:8px; text-align:right">$${item.doubleSidedPrice.toFixed(2)}</td>
        </tr>
      `).join('');

      const totalSheetsSum = cart.reduce((p, c) => p + c.sheetCount, 0);
      const totalCostSum = cart.reduce((p, c) => p + c.doubleSidedPrice, 0);

      finalBody = `
        <div style="background-color:#0f172a; color:#f1f5f9; padding:24px; font-family:sans-serif; border-radius:12px">
          <h2 style="color:#06b6d4; border-bottom:2px solid #22d3ee; padding-bottom:8px">RAJ EXPO DIGITAL COPIES - INVOICE RECEIPT</h2>
          <p>Greetings, from NATASHA AI Core interface.</p>
          <p>Please review the printing quota details below:</p>
          <table style="width:100%; border-collapse:collapse; margin:16px 0">
            <thead>
              <tr style="background-color:#1e293b; color:#22d3ee">
                <th style="border:1px solid #22d3ee; padding:8px; text-align:left">Document Name</th>
                <th style="border:1px solid #22d3ee; padding:8px; text-align:center">Pages</th>
                <th style="border:1px solid #22d3ee; padding:8px; text-align:center">Sheets (2-sided)</th>
                <th style="border:1px solid #22d3ee; padding:8px; text-align:right">Price</th>
              </tr>
            </thead>
            <tbody>
              ${receiptRows}
            </tbody>
          </table>
          <p style="text-align:right; font-weight:bold; color:#06b6d4; font-size:16px">
            Aggregate Sheets: ${totalSheetsSum} | Overlying Subtotal: $${totalCostSum.toFixed(2)}
          </p>
          <p style="font-size:11px; color:#64748b; margin-top:32px; border-top:1px solid #1e293b; padding-top:8px">
            System dispatch logged by virtual operator Natasha AI // Raj Expo Digitals.
          </p>
        </div>
      `;
    }

    const confirmSend = window.confirm(`Authorize Gmail API to dispatch paper billings quote to: ${gmailTo}?`);
    if (!confirmSend) return;

    try {
      await sendGmailMessage(gmailTo, gmailSubject, finalBody);
      addLog(`GMAIL DELIVERED: Past paper quotas sent to "${gmailTo}".`);
      setGmailTo('');
      setGmailBody('');
    } catch (err: any) {
      addLog(`ERROR: GMAIL dispatch sequence aborted: ${err.message}`);
    }
  };

  const handleSendCustomGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailTo.trim()) {
      alert('Recipient Address required.');
      return;
    }
    const confirmed = window.confirm(`Authorize Gmail API to dispatch custom email to: ${gmailTo}?`);
    if (!confirmed) return;

    try {
      await sendGmailMessage(gmailTo, gmailSubject, gmailBody);
      addLog(`MAIL SENT: Custom email successfully dispatched to "${gmailTo}".`);
      setGmailTo('');
      setGmailSubject('Raj Expo Printing Past Papers Invoice');
      setGmailBody('');
      setIsComposing(false);
      fetchEmails('', gmailLabelId);
    } catch (err: any) {
      addLog(`ERROR: Custom Gmail dispatch sequence aborted: ${err.message}`);
    }
  };

  // 2. Schedule printed calendar review
  const handleScheduleCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendarTitle.trim() || !calendarDate) {
      alert('Event title and scheduling date required.');
      return;
    }

    const formattedDateString = new Date(calendarDate).toLocaleString();
    const confirmed = window.confirm(`Add study scheduling marker on your Calendar for: ${formattedDateString}?`);
    if (!confirmed) return;

    try {
      await createCalendarEvent(calendarTitle, calendarDesc, calendarDate);
      addLog(`CALENDAR MARKED: Study node event "${calendarTitle}" synchronized successfully.`);
      setCalendarTitle('Study Past Papers print review');
      const updatedCal = await listCalendarEvents();
      setCalendarEvents(updatedCal);
    } catch (err: any) {
      addLog(`ERROR: Calendar synchronization failed: ${err.message}`);
    }
  };

  // 3. Append to Sheets log spreadsheet
  const handleSyncToSheets = async () => {
    if (cart.length === 0) {
      alert('Cart is empty. Select documents to export.');
      return;
    }

    const confirmed = window.confirm(`Commit printing records of ${cart.length} files to Google Sheets central accounting ledger?`);
    if (!confirmed) return;

    try {
      const now = new Date().toLocaleString();
      const rows = cart.map(item => [
        now,
        item.name,
        item.folderPath,
        item.pageCount,
        item.sheetCount,
        item.singleSidedPrice,
        item.doubleSidedPrice
      ]);

      await logToSpreadsheet('Raj Expo Printing Logs Database', rows);
      addLog('SHEETS LOGGED: Printing calculations appended to "Raj Expo Printing Logs Database".');
    } catch (err: any) {
      addLog(`ERROR: Spreadsheet serialization failed: ${err.message}`);
    }
  };

  // 4. Create study/printing google tasks
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const confirmed = window.confirm(`Register printing task "${taskTitle}" into Google Tasks?`);
    if (!confirmed) return;

    try {
      await createGoogleTask(taskTitle, taskNotes);
      addLog(`TASK CREATED: Printing queue study card [${taskTitle}] saved in Mainframe tasks.`);
      setTaskTitle('Complete Mathematics 2024 QP 1');
      setTaskNotes('');
      // Refresh task list
      const udTasks = await listGoogleTasks();
      setTasks(udTasks);
    } catch (err: any) {
      addLog(`ERROR: Google Task compilation failed: ${err.message}`);
    }
  };

  // 5. Create doc planner
  const handleCreateDocPlanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;

    const confirmed = window.confirm(`Compose dynamic Google Doc entitled: "${docTitle}"?`);
    if (!confirmed) return;

    try {
      await createGoogleDoc(docTitle, docContent);
      addLog(`DOC SAVED: Google Document [${docTitle}] spawned in Google Drive folder.`);
      setDocTitle('Study Guide Planner - O Level 2026');
      setDocContent('');
    } catch (err: any) {
      addLog(`ERROR: Google Doc publishing failed: ${err.message}`);
    }
  };

  // 6. Save Note details to Google Keep
  const handleSaveKeepNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesTitle.trim()) return;

    const confirmed = window.confirm(`Archive past-paper printing instructions to Google Keep?`);
    if (!confirmed) return;

    try {
      await createKeepNote(notesTitle, notesText);
      addLog(`KEEP LOGGED: Dynamic Note [${notesTitle}] cached successfully.`);
      setNotesTitle('Past Papers Printing Instructions');
      setNotesText('');
    } catch (err: any) {
      addLog(`ERROR: Keep note storage failed: ${err.message}`);
    }
  };

  // Autocomplete and Contact searching routines
  const handleContactSelect = (email: string) => {
    setGmailTo(email);
    setShowContactDropdown(false);
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(contactSearchQuery.toLowerCase())
  );

  /* ==========================================================================
     COMMAND DISPATCH MAIN CLI ENGINE (Voice + Text Directives)
     ========================================================================== */
  const parseActionDirective = useCallback((command: string) => {
    const raw = command.trim();
    const clean = raw.toLowerCase();
    
    addLog(`VOICE EXECUTOR >> parsing instruction: "${raw}"`);

    // Go Back "-"
    if (clean === '-' || clean === 'go back' || clean === 'back' || clean === 'return') {
      goBack();
      return;
    }

    // Go Root "+"
    if (clean === '+' || clean === 'go root' || clean === 'root') {
      traverseToRoot();
      return;
    }

    // Open item by numerical index or name
    // match "open 3", "+ 3", "select 3", "open math"
    const openIndexMatch = clean.match(/^(\+|open|go to)?\s*(\d+)$/);
    if (openIndexMatch) {
      const targetIndex = parseInt(openIndexMatch[2]);
      const matchedNode = driveItems.find(d => d.indexNumber === targetIndex);
      if (matchedNode) {
        if (matchedNode.type === 'folder') {
          enterFolder(matchedNode.id, matchedNode.name);
        } else {
          toggleCartSelection(matchedNode);
        }
      } else {
        addLog(`COMMAND REJECTED: Numerical node indices exceed maximum boundaries [${targetIndex}]`);
      }
      return;
    }

    // Open by exact word matches
    if (clean.startsWith('open ') && !clean.match(/\d+$/)) {
      const nameQuery = raw.substring(5).trim();
      const matchedNode = driveItems.find(d => d.name.toLowerCase().includes(nameQuery.toLowerCase()));
      if (matchedNode) {
        if (matchedNode.type === 'folder') {
          enterFolder(matchedNode.id, matchedNode.name);
        } else {
          toggleCartSelection(matchedNode);
        }
      } else {
        addLog(`COMMAND ERROR: Folder or file matching name query "${nameQuery}" not detected.`);
      }
      return;
    }

    // Tick/Select file specifically
    const selectMatch = clean.match(/^(select|tick|check|choose)\s*(\d+)$/);
    if (selectMatch) {
      const idx = parseInt(selectMatch[2]);
      const node = driveItems.find(d => d.indexNumber === idx);
      if (node) {
        toggleCartSelection(node);
      } else {
        addLog(`TICK ERROR: Numerical Node [${idx}] does not exist.`);
      }
      return;
    }

    // Create folder command: e.g. "create folder Maths 2023"
    const createFolderMatch = clean.match(/^(create|make|add)\s*(folder)?\s*(.+)$/);
    if (createFolderMatch) {
      const folderName = raw.substring(raw.toLowerCase().indexOf(createFolderMatch[3])).trim();
      createDriveFolder(folderName, currentFolderId)
        .then((f) => {
          addLog(`MAIN CREATOR: Folder [${f.name}] dynamically introduced into hierarchy.`);
          loadFolder(currentFolderId);
        })
        .catch(err => {
          addLog(`CREATION PROTOCOL BROKEN: ${err.message}`);
        });
      return;
    }

    // Cost calculations report request: "show page count"
    if (clean.includes('page count') || clean.includes('pricing') || clean.includes('show pages') || clean.includes('calculate')) {
      const totalPagesSum = cart.reduce((p, c) => p + c.pageCount, 0);
      const totalSheetsSum = cart.reduce((p, c) => p + c.sheetCount, 0);
      const subtotalFloat = cart.reduce((p, c) => p + c.doubleSidedPrice, 0);
      
      const detailsMsg = `HOLOGRAPHIC SUMMARY: Selection Cart registered ${cart.length} files. Compiled Total pages: ${totalPagesSum} | Sheets for double-sided printout: ${totalSheetsSum} | Finalized subtotal cost: $${subtotalFloat.toFixed(2)}`;
      
      alert(detailsMsg);
      addLog(detailsMsg);
      return;
    }

    addLog(`VOICE EXECUTOR >> Direct instruction pattern untracked: "${raw}". Refactoring system logic...`);
  }, [driveItems, currentFolderId, cart, loadFolder, singleSidedCost, doubleSidedCost, toggleCartSelection, goBack]);

  // Voice speech synthesis parsing
  const toggleVoiceUplink = () => {
    if (isListening) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsListening(false);
      addLog('Holographic microphone link offline.');
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Speech recognition is unsupported in your frame context.');
        return;
      }

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        addLog('Mic uplink listening for past paper action commands...');
      };

      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setCommandInput(transcript);
        parseActionDirective(transcript);
      };

      rec.onerror = (e: any) => {
        console.error('Speech synthesis failure:', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = rec;
      rec.start();
    }
  };

  // General text CLI submit handler
  const handleCLISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    parseActionDirective(commandInput);
    setCommandInput('');
  };

  return (
    <div className="space-y-10 font-sans p-2 select-none">
      
      {/* 2X COL BENTO GRAPHIC SYSTEM BOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: HOLOGRAPHIC DRY SYLLABUS DIRECTORY AND STORAGE CONTROL (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Main folder hierarchy card UI */}
          <div className="bg-slate-900/60 shadow-[0_0_50px_rgba(34,211,238,0.15)] rounded-[2.5rem] border border-cyan-500/30 backdrop-blur-3xl p-6 sm:p-8 relative">
            
            {/* Structural corner decors */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400 opacity-60 rounded-tl-[2.4rem]" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400 opacity-60 rounded-tr-[2.4rem]" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400 opacity-60 rounded-bl-[2.4rem]" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400 opacity-60 rounded-br-[2.4rem]" />

            {/* Title / Banner header status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-cyan-500/20 pb-5 mb-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-full bg-cyan-500/10 border border-cyan-500/30">
                  <Library className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-[0.25em]">Syllabus Database Mirror</h2>
                  <p className="text-xs text-cyan-500/60 font-bold uppercase">Cambridge O-Level & A-Level Drive Repositories</p>
                </div>
              </div>

              {/* Action utilities */}
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={handleBootstrapDrive}
                  disabled={isBootstrapping}
                  className="px-4 py-2 text-[10px] uppercase font-black tracking-widest text-[#00f3ff] bg-cyan-950/40 border border-cyan-500/40 rounded-xl hover:bg-cyan-500 hover:text-slate-950 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 disabled:opacity-50"
                >
                  {isBootstrapping ? 'Creating Hierarchy...' : '⚡ Bootstrap Folders'}
                </button>
                <button
                  onClick={() => loadFolder(currentFolderId)}
                  className="p-2.5 bg-slate-950 border border-cyan-500/20 rounded-xl text-cyan-400 hover:text-cyan-300 hover:border-cyan-400/50 transition-all active:scale-95"
                  title="Reload Directory"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-950/20 border border-rose-500/30 rounded-xl hover:bg-rose-500 hover:text-white transition-all duration-300"
                >
                  Eject User ↵
                </button>
              </div>
            </div>

            {/* Folder progress loading bar */}
            {isBootstrapping && (
              <div className="mb-6 bg-cyan-950/40 border border-cyan-500/30 p-4 rounded-2xl animate-pulse">
                <p className="text-[10px] font-mono font-black text-cyan-300 uppercase tracking-widest mb-1">Mirror Initialization in Process...</p>
                <p className="text-xs text-white/80 font-bold uppercase">{bootstrapProgress}</p>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-3.5">
                  <motion.div 
                    className="bg-cyan-400 h-full shadow-[0_0_10px_#22d3ee]" 
                    animate={{ width: ['0%', '100%'] }}
                    transition={{ duration: 15 }}
                  />
                </div>
              </div>
            )}

            {/* Path Breadcrumbs navigation banner */}
            <div className="bg-slate-950/90 border border-cyan-500/20 px-6 py-3.5 rounded-2xl flex items-center justify-between text-xs font-mono font-bold tracking-widest uppercase mb-6 shadow-inner">
              <div className="flex items-center gap-3 overflow-x-auto select-all py-1 scrollbar-none max-w-full">
                <span className="text-cyan-500 cursor-pointer hover:text-cyan-300" onClick={traverseToRoot}>DRIVE_ROOT</span>
                {folderHistory.map((hist, i) => (
                  <React.Fragment key={hist.id}>
                    <ChevronRight className="w-3.5 h-3.5 text-cyan-500/40 shrink-0" />
                    <span 
                      className="text-cyan-400/80 cursor-pointer hover:text-cyan-300 truncate max-w-[120px]" 
                      onClick={() => {
                        const idx = folderHistory.findIndex(h => h.id === hist.id);
                        setFolderHistory(folderHistory.slice(0, idx));
                        setCurrentFolderId(hist.id);
                      }}
                    >
                      {hist.name}
                    </span>
                  </React.Fragment>
                ))}
              </div>
              <div className="text-[9px] text-cyan-500/70 py-0.5 px-2 bg-cyan-500/10 border border-cyan-500/20 rounded">
                SEC_SHELL
              </div>
            </div>

            {/* Folder files lists with beautiful visual items */}
            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-4 border border-cyan-500/10 rounded-3xl bg-slate-950/30">
                <div className="w-12 h-12 border-4 border-dashed border-cyan-400 rounded-full animate-spin flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-dotted border-purple-500 rounded-full animate-spin-reverse" />
                </div>
                <p className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-[0.3em] animate-pulse">Scanning Holograms...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 jarvis-scrollbar font-mono">
                
                {/* BACK NAVIGATION FOLDER ROW */}
                {folderHistory.length > 0 && (
                  <motion.div
                    whileHover={{ scale: 1.01, backgroundColor: 'rgba(34,211,238,0.06)' }}
                    onClick={goBack}
                    className="flex items-center gap-4 px-5 py-3.5 rounded-2xl border border-dashed border-cyan-500/20 bg-slate-950/20 cursor-pointer hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all uppercase text-xs text-cyan-300/80 font-black tracking-widest mb-1"
                  >
                    <ArrowLeft className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span>[-] Return to superior directory</span>
                  </motion.div>
                )}

                {driveItems.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center p-6 border border-dashed border-cyan-500/20 bg-slate-950/20 rounded-3xl">
                    <Folder className="w-10 h-10 text-cyan-500/20 mb-3" />
                    <p className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-500/60">Mainframe segment currently vacant.</p>
                    <p className="text-[10px] text-slate-500 uppercase mt-1">Direct NATASHA to create nodes or run bootstrap setup.</p>
                  </div>
                ) : (
                  driveItems.map((item) => {
                    const isChecked = !!cart.find(c => c.id === item.id);
                    const isFolder = item.type === 'folder';

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center justify-between px-5 py-3 rounded-2xl border transition-all ${
                          isFolder 
                            ? 'bg-slate-950/40 border-cyan-500/10 text-white' 
                            : isChecked 
                              ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                              : 'bg-slate-950/70 border-white/5 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          
                          {/* Checked box selector of Cart ☑️ */}
                          {!isFolder ? (
                            <button
                              onClick={() => toggleCartSelection(item)}
                              className={`w-5.5 h-5.5 rounded border flex items-center justify-center transition-all ${
                                isChecked 
                                  ? 'bg-cyan-500 border-cyan-400 text-slate-950' 
                                  : 'border-cyan-500/30 hover:border-cyan-400 bg-slate-900'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                          ) : (
                            <div className="w-5.5 h-5.5 flex items-center justify-center text-[10px] font-black text-cyan-500">
                              [{item.indexNumber}]
                            </div>
                          )}

                          {/* Icon representation */}
                          <div className={`p-2 rounded-xl border ${
                            isFolder 
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                              : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                          }`}>
                            {isFolder ? <Folder className="w-4 h-4 fill-amber-400/10" /> : <FileText className="w-4 h-4" />}
                          </div>

                          {/* Node metrics details info */}
                          <div className="min-w-0 flex-1">
                            <p 
                              className={`text-xs font-black truncate uppercase tracking-wide ${
                                isFolder ? 'hover:text-cyan-400 cursor-pointer' : ''
                              }`}
                              onClick={() => isFolder && enterFolder(item.id, item.name)}
                            >
                              {isFolder ? `+ ${item.name}` : `[${item.indexNumber}] ${item.name}`}
                            </p>
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">
                              {isFolder ? 'Virtual Directory Metadata' : `Pages: ${item.pageCount} | Calculated double-sided sheets: ${item.sheetCount}`}
                            </p>
                          </div>
                        </div>

                        {/* Sizes or External links */}
                        <div className="flex items-center gap-3 shrink-0 font-bold ml-4">
                          <span className="text-[9px] text-cyan-500/45 tracking-wider uppercase">
                            {isFolder ? 'Catalog' : item.size}
                          </span>
                          {item.webViewLink && (
                            <a 
                              href={item.webViewLink} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="p-1.5 bg-slate-950 border border-white/5 rounded-lg text-slate-550 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
                              title="Explore original file on Google Drive Dashboard (No Download Required)"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}

            {/* HUD COMMANDS CLI SHELL PANEL (Voice & Text supported) */}
            <div className="border-t border-cyan-500/10 pt-5 mt-6">
              <p className="text-[9px] font-mono font-black text-cyan-500 uppercase tracking-[0.3em] mb-2">Holographic Speech & Text CLI Mainframe</p>
              
              <form onSubmit={handleCLISubmit} className="flex gap-2.5 items-center bg-slate-950/80 border border-cyan-500/35 rounded-xl p-2 relative overflow-hidden">
                <button
                  type="button"
                  onClick={toggleVoiceUplink}
                  className={`p-2.5 rounded-lg border transition-all shrink-0 ${
                    isListening 
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse' 
                      : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:text-cyan-300'
                  }`}
                  title="Toggle voice speech parsing uplink (NATASHA Voice Command Link)"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder="EXECUTIVE COMMAND (E.g. '+ 1' to go up, 'select 2', '-' to go back, 'create Mathematics 2025')..."
                  className="w-full bg-transparent p-2 text-xs font-mono font-bold text-white placeholder:text-cyan-500/25 uppercase tracking-widest focus:outline-none focus:ring-0"
                />

                <button
                  type="submit"
                  className="p-2 bg-cyan-500 text-slate-950 font-black rounded-lg hover:bg-cyan-400 hover:shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all active:scale-95 text-xs tracking-widest uppercase flex items-center gap-1 shrink-0"
                >
                  <Send className="w-3 h-3" />
                  EXE
                </button>
              </form>
            </div>
          </div>

          {/* TELEMETRY LOGGER OUTPUT LISTS */}
          <div className="bg-slate-900/35 border border-cyan-500/10 p-5 rounded-[2rem] font-mono text-[9px] text-cyan-400/70 space-y-1 backdrop-blur-3xl shadow-inner relative max-h-[140px] overflow-y-auto jarvis-scrollbar">
            <span className="text-cyan-500 font-black tracking-widest uppercase border-b border-cyan-500/20 pb-1 mb-2 block text-[8px]">CORE TELEMETRY LOGS OUTPUT CHANNEL</span>
            {terminalLogs.map((logStr, i) => (
              <div key={i} className="truncate select-text">
                {logStr}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: GALAXY PRINTOUT CART AND WORKSPACE UTILITIES (4 Cols) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Dynamic Selection persistence cart drawer */}
          <div className="bg-slate-900/60 border border-cyan-500/30 rounded-[2.5rem] p-6 backdrop-blur-3xl relative shadow-[0_0_50px_rgba(34,211,238,0.15)] flex flex-col">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400 opacity-60 rounded-tl-[2.4rem]" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400 opacity-60 rounded-tr-[2.4rem]" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400 opacity-60 rounded-bl-[2.4rem]" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400 opacity-60 rounded-br-[2.4rem]" />

            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-4 select-none">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-pulse" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Selection Cart</h3>
              </div>
              <span className="text-[10px] font-mono font-black text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {cart.length} RECORDS
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4">
                <Bookmark className="w-10 h-10 text-slate-500 opacity-20 mb-2.5 animate-pulse" />
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest leading-relaxed">No selected past papers detected. Check items in drive explorer tree.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1 jarvis-scrollbar font-mono text-[10px] border-b border-cyan-500/10 pb-4 mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-slate-950/80 border border-white/5 p-2 rounded-xl relative group">
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-white truncate uppercase tracking-widest">{item.name}</p>
                      <p className="text-[8px] text-cyan-400/60 truncate uppercase tracking-wider">{item.folderPath}</p>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <p className="text-cyan-300 font-bold">{item.pageCount}P → {item.sheetCount}S</p>
                      <p className="text-[8px] text-slate-500 select-all">$QC {item.doubleSidedPrice.toFixed(1)}</p>
                    </div>
                    <button
                      onClick={() => setCart(prev => prev.filter(c => c.id !== item.id))}
                      className="absolute -top-1.5 -right-1.5 p-1 bg-rose-950 border border-rose-500/40 rounded-full text-rose-300 hover:bg-rose-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Calculations telemetry summaries */}
            <div className="bg-slate-955 bg-cyan-950/20 border border-cyan-500/20 p-4 rounded-2xl space-y-2 mb-4 font-mono text-[11px] uppercase select-text">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Aggregate Pages:</span>
                <span className="text-white font-extrabold">{cart.reduce((p, c) => p + c.pageCount, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Total Sheets (2-Sided):</span>
                <span className="text-cyan-400 font-extrabold">{cart.reduce((p, c) => p + c.sheetCount, 0)}</span>
              </div>
              <div className="flex justify-between border-t border-cyan-500/10 pt-2 text-[12px]">
                <span className="text-cyan-500 font-black">Subtotal Cost:</span>
                <span className="text-cyan-400 font-black tracking-wider shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                  ${cart.reduce((p, c) => p + c.doubleSidedPrice, 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 select-none">
              <button
                onClick={handleSyncToSheets}
                className="py-2.5 bg-emerald-500 text-slate-955 hover:bg-emerald-400 hover:shadow-[0_0_10px_rgba(16,185,129,0.3)] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Sheets Sync
              </button>
              <button
                onClick={clearGlobalCart}
                className="py-2.5 bg-rose-600/20 border border-rose-500/30 text-rose-300 hover:bg-rose-600 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Purge Cart
              </button>
            </div>
          </div>

          {/* Auxiliary Workspace services integration toolbox panel */}
          <div className="bg-slate-900/60 border border-cyan-500/30 rounded-[2.5rem] p-6 backdrop-blur-3xl relative shadow-[0_0_50px_rgba(34,211,238,0.15)] select-none">
            
            {/* Tabs definitions */}
            <div className="flex border-b border-cyan-500/20 pb-3 mb-5 overflow-x-auto gap-2.5 scrollbar-none font-mono text-[9px] font-black uppercase tracking-widest">
              <button
                onClick={() => setActiveTab('gmail')}
                className={`py-1.5 px-3 rounded-lg border flex items-center gap-1 ${
                  activeTab === 'gmail' 
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400' 
                    : 'bg-transparent text-cyan-400 border-cyan-500/10 hover:border-cyan-500/35'
                }`}
              >
                <Mail className="w-3 h-3 text-current" />
                GMAIL
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`py-1.5 px-3 rounded-lg border flex items-center gap-1 ${
                  activeTab === 'calendar' 
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400' 
                    : 'bg-transparent text-cyan-400 border-cyan-500/10 hover:border-cyan-500/35'
                }`}
              >
                <Calendar className="w-3 h-3 text-current" />
                CALENDAR
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`py-1.5 px-3 rounded-lg border flex items-center gap-1 ${
                  activeTab === 'tasks' 
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400' 
                    : 'bg-transparent text-cyan-400 border-cyan-500/10 hover:border-cyan-500/35'
                }`}
              >
                <CheckSquare className="w-3 h-3 text-current" />
                TASKS
              </button>
              <button
                onClick={() => setActiveTab('misc')}
                className={`py-1.5 px-3 rounded-lg border flex items-center gap-1 ${
                  activeTab === 'misc' 
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400' 
                    : 'bg-transparent text-cyan-400 border-cyan-500/10 hover:border-cyan-500/35'
                }`}
              >
                <Layers className="w-3 h-3 text-current" />
                DOCK NOTE
              </button>
            </div>

            {/* TAB CORRESPONDENCE FORMS */}
            <AnimatePresence mode="wait">
              
              {/* Tab 1: Interactive Gmail Client (Receive, Search, Filter, Trash, Reply, Compose & Receipts) */}
              {activeTab === 'gmail' && (
                <motion.div
                  key="gmail"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4 text-[11px] font-mono"
                >
                  {/* Mode Selector HUD Bar */}
                  <div className="flex bg-slate-950/85 p-1 border border-cyan-500/20 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => { setIsComposing(false); setViewReceipt(false); }}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                        !isComposing && !viewReceipt
                          ? 'bg-cyan-500 text-slate-950 font-black'
                          : 'text-cyan-400/80 hover:text-white'
                      }`}
                    >
                      Inbox
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsComposing(true); setViewReceipt(false); }}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                        isComposing && !viewReceipt
                          ? 'bg-cyan-500 text-slate-950 font-black'
                          : 'text-cyan-400/80 hover:text-white'
                      }`}
                    >
                      Compose
                    </button>
                    <button
                      type="button"
                      onClick={() => { setViewReceipt(true); }}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                        viewReceipt
                          ? 'bg-cyan-500 text-slate-950 font-black'
                          : 'text-cyan-400/80 hover:text-white'
                      }`}
                    >
                      Receipt
                    </button>
                  </div>

                  {/* SUB-VIEW 1: SEND AUTOMATIC INVOICE RECEIPT */}
                  {viewReceipt && (
                    <form onSubmit={handleSendGmailReceipt} className="space-y-3.5">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-cyan-400" />
                        SEND RECEIPT INVOICE
                      </p>
                      
                      <div className="relative">
                        <label className="text-[9px] text-slate-500 uppercase font-black block mb-1 tracking-widest">To (Autocomplete via Contacts)</label>
                        <input
                          type="text"
                          placeholder="Recipient Email address..."
                          value={gmailTo}
                          onChange={(e) => {
                            setGmailTo(e.target.value);
                            setContactSearchQuery(e.target.value);
                            setShowContactDropdown(true);
                          }}
                          className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2 text-white placeholder:text-slate-500 font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                        />
                        
                        {showContactDropdown && gmailTo && filteredContacts.length > 0 && (
                          <div className="absolute left-0 right-0 max-h-[140px] overflow-y-auto bg-slate-950 border border-cyan-500/40 rounded-xl mt-1 z-50 p-1 space-y-1 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
                            {filteredContacts.map(c => (
                              <div
                                key={c.id}
                                onClick={() => handleContactSelect(c.email)}
                                className="bg-slate-900 border border-white/5 hover:bg-cyan-500 hover:text-slate-950 p-2 rounded-lg cursor-pointer flex items-center justify-between"
                              >
                                <span className="font-extrabold text-[10px] uppercase truncate tracking-wider">{c.name}</span>
                                <span className="text-[8px] text-slate-400">{c.email}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-500 uppercase font-black block mb-1 tracking-widest">MIME Subject</label>
                        <input
                          type="text"
                          placeholder="Email Subject Header..."
                          value={gmailSubject}
                          onChange={(e) => setGmailSubject(e.target.value)}
                          className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2 text-white font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-500 uppercase font-black block mb-1 tracking-widest">Dynamic Quotation Quote body (leave blank for Auto-receipt)</label>
                        <textarea
                          placeholder="Auto invoice detailing selections count and print specifications will be appended..."
                          value={gmailBody}
                          onChange={(e) => setGmailBody(e.target.value)}
                          rows={3}
                          className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-cyan-500 text-slate-950 font-black rounded-xl hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] tracking-widest uppercase transition-all flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Dispatch Quote
                      </button>
                    </form>
                  )}

                  {/* SUB-VIEW 2: GENERAL COMPOSE PANEL */}
                  {isComposing && !viewReceipt && (
                    <form onSubmit={handleSendCustomGmail} className="space-y-3.5">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1">
                        <Send className="w-3.5 h-3.5 text-cyan-400" />
                        COMPOSE GENERAL MESSAGE
                      </p>

                      <div className="relative">
                        <label className="text-[9px] text-slate-500 uppercase font-black block mb-1 tracking-widest">Recipient To Email</label>
                        <input
                          type="text"
                          placeholder="Recipient address..."
                          value={gmailTo}
                          onChange={(e) => {
                            setGmailTo(e.target.value);
                            setContactSearchQuery(e.target.value);
                            setShowContactDropdown(true);
                          }}
                          className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                          required
                        />

                        {showContactDropdown && gmailTo && filteredContacts.length > 0 && (
                          <div className="absolute left-0 right-0 max-h-[140px] overflow-y-auto bg-slate-950 border border-cyan-500/40 rounded-xl mt-1 z-50 p-1 space-y-1 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
                            {filteredContacts.map(c => (
                              <div
                                key={c.id}
                                onClick={() => handleContactSelect(c.email)}
                                className="bg-slate-900 border border-white/5 hover:bg-cyan-500 hover:text-slate-950 p-2 rounded-lg cursor-pointer flex items-center justify-between"
                              >
                                <span className="font-extrabold text-[10px] uppercase truncate tracking-wider">{c.name}</span>
                                <span className="text-[8px] text-slate-400">{c.email}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-500 uppercase font-black block mb-1 tracking-widest">Subject Designation</label>
                        <input
                          type="text"
                          placeholder="Email subject..."
                          value={gmailSubject}
                          onChange={(e) => setGmailSubject(e.target.value)}
                          className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-500 uppercase font-black block mb-1 tracking-widest">Message Content</label>
                        <textarea
                          placeholder="Compose your message body here..."
                          value={gmailBody}
                          onChange={(e) => setGmailBody(e.target.value)}
                          rows={6}
                          className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2 text-white font-sans text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-cyan-500 text-slate-950 font-black rounded-xl hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] tracking-widest uppercase transition-all flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send Message
                      </button>
                    </form>
                  )}

                  {/* SUB-VIEW 3: LIVE INBOX & EMAIL LIST (DEFAULT) */}
                  {!isComposing && !viewReceipt && (
                    <div className="space-y-3.5">
                      
                      {/* Search & Refresh Controls */}
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Search Gmail..."
                            value={gmailSearchBar}
                            onChange={(e) => setGmailSearchBar(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                fetchEmails(gmailSearchBar, gmailLabelId);
                              }
                            }}
                            className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl pl-8 pr-2.5 py-1.5 text-white font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500/40 placeholder:text-slate-600 placeholder:text-[10px]"
                          />
                          <Search className="w-3.5 h-3.5 text-cyan-500/50 absolute left-2.5 top-2.5" />
                        </div>
                        <button
                          type="button"
                          onClick={() => fetchEmails(gmailSearchBar, gmailLabelId)}
                          disabled={isGmailLoading}
                          className="p-2 bg-slate-950 border border-cyan-500/20 rounded-xl text-cyan-400 hover:text-cyan-300 disabled:opacity-40 shrink-0"
                          title="Refresh Inbox"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isGmailLoading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>

                      {/* Inbox / Sent toggle buttons */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setGmailLabelId('INBOX')}
                          className={`py-1 px-3 rounded-lg border font-black text-[9px] uppercase tracking-wider transition-all flex items-center gap-1 ${
                            gmailLabelId === 'INBOX'
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-extrabold shadow-[0_0_10px_rgba(34,211,238,0.1)]'
                              : 'border-white/5 bg-slate-950 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Inbox className="w-3 h-3 text-current" />
                          Inbox
                        </button>
                        <button
                          type="button"
                          onClick={() => setGmailLabelId('SENT')}
                          className={`py-1 px-3 rounded-lg border font-black text-[9px] uppercase tracking-wider transition-all flex items-center gap-1 ${
                            gmailLabelId === 'SENT'
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-extrabold shadow-[0_0_10px_rgba(34,211,238,0.1)]'
                              : 'border-white/5 bg-slate-950 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Send className="w-3 h-3 text-current" />
                          Sent
                        </button>
                      </div>

                      {/* Email Inbox Listings Container */}
                      {isGmailLoading ? (
                        <div className="h-56 flex flex-col items-center justify-center gap-3 border border-cyan-500/10 rounded-2xl bg-slate-950/20">
                          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                          <p className="text-[9px] text-cyan-500/75 uppercase tracking-widest animate-pulse">Syncing GMAIL Servers...</p>
                        </div>
                      ) : gmailMessages.length === 0 ? (
                        <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-cyan-500/10 bg-slate-950/10 rounded-2xl">
                          <Mail className="w-8 h-8 text-cyan-500/10 mb-2" />
                          <p className="text-[10px] text-cyan-500/50 uppercase tracking-widest font-black">Mail envelope queue vacant.</p>
                          <p className="text-[8px] text-slate-600 uppercase mt-0.5">Change parameters or filters above</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1 jarvis-scrollbar">
                          {gmailMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className="p-2.5 bg-slate-950/80 border border-white/5 rounded-2xl hover:border-cyan-500/25 transition-all font-sans relative group cursor-pointer"
                              onClick={() => setSelectedEmail(msg)}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="w-5.5 h-5.5 rounded-full bg-cyan-950 border border-cyan-500/20 flex items-center justify-center font-black text-[9px] text-cyan-400 shrink-0 select-none uppercase">
                                  {msg.from.replace('"', '').charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex justify-between items-center">
                                    <p className="text-[9px] font-black text-slate-300 truncate max-w-[130px]" title={msg.from}>
                                      {msg.from.replace(/<.*>/, '').replace(/"/g, '').trim() || msg.from}
                                    </p>
                                    <span className="text-[7.5px] text-slate-500 tracking-wider">
                                      {formatDate(msg.date)}
                                    </span>
                                  </div>
                                  <p className="text-[10px] font-bold text-white truncate my-0.5" title={msg.subject}>
                                    {msg.subject || '(No Subject)'}
                                  </p>
                                  <p className="text-[8.5px] text-slate-400/85 line-clamp-1 leading-normal font-medium">
                                    {msg.snippet}
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-1.5 justify-end mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEmail(msg);
                                  }}
                                  className="px-2 py-0.5 bg-cyan-500/10 hover:bg-cyan-500 hover:text-slate-950 text-[7px] font-black uppercase border border-cyan-500/20 rounded transition-all tracking-wider"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Delete message?')) {
                                      handleTrashEmail(msg.id);
                                    }
                                  }}
                                  className="p-0.5 hover:text-rose-400 text-slate-500 transition-colors"
                                  title="Dump message"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* RICH READING DIALOG MODAL VIEW OVERLAY */}
                  {selectedEmail && (
                    <DraggableResizableWindow
                      isOpen={!!selectedEmail}
                      onClose={() => setSelectedEmail(null)}
                      title={selectedEmail.subject || "Gmail Message Reader"}
                      subtitle={`From: ${selectedEmail.from} | ${new Date(selectedEmail.date).toLocaleString()}`}
                      icon={<Mail className="w-4 h-4 text-cyan-400" />}
                      initialWidth={560}
                      initialHeight={480}
                    >
                      <div className="p-4 sm:p-5 flex flex-col h-full bg-slate-900/95 overflow-hidden text-xs">
                        <div className="border-b border-cyan-500/20 pb-3 mb-3">
                          <div className="space-y-1 font-mono text-[9px] uppercase text-slate-400">
                            <p><span className="text-cyan-400 font-bold">From:</span> {selectedEmail.from}</p>
                            {selectedEmail.to && <p><span className="text-cyan-400 font-bold">To:</span> {selectedEmail.to}</p>}
                            <p><span className="text-cyan-400 font-bold">Date:</span> {new Date(selectedEmail.date).toLocaleString()}</p>
                          </div>
                        </div>
                        
                        {/* Decoded content message frame */}
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-950/80 border border-cyan-500/20 rounded-xl text-[11px] leading-relaxed text-slate-200 whitespace-pre-wrap font-sans jarvis-scrollbar selection:bg-cyan-500 selection:text-slate-950">
                          {selectedEmail.body || selectedEmail.snippet}
                        </div>
                        
                        {/* Inner interactive tools */}
                        <div className="flex gap-2.5 mt-4 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const emailMatch = selectedEmail.from.match(/<([^>]+)>/);
                              const cleanFrom = emailMatch ? emailMatch[1] : selectedEmail.from;
                              setGmailTo(cleanFrom);
                              setGmailSubject(selectedEmail.subject.toLowerCase().startsWith('re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`);
                              setGmailBody(`\n\nOn ${new Date(selectedEmail.date).toLocaleString()}, wrote:\n> ${selectedEmail.snippet}`);
                              setSelectedEmail(null);
                              setIsComposing(true);
                              setViewReceipt(false);
                              addLog(`Forming direct response channel to sender: ${cleanFrom}`);
                            }}
                            className="flex-1 py-2.5 bg-cyan-500 text-slate-950 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5 text-current" />
                            Compose Reply
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Dump this email permanently?')) {
                                handleTrashEmail(selectedEmail.id);
                                setSelectedEmail(null);
                              }
                            }}
                            className="px-4 py-2.5 bg-rose-950/40 border border-rose-500/40 text-rose-300 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                          >
                            Trash
                          </button>
                        </div>
                      </div>
                    </DraggableResizableWindow>
                  )}
                </motion.div>
              )}

              {/* Tab 2: Calendar exam schedules */}
              {activeTab === 'calendar' && (
                <motion.form
                  key="calendar"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onSubmit={handleScheduleCalendar}
                  className="space-y-3.5 text-[11px] font-mono"
                >
                  <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    STUDY SCHEDULAR PLANNER
                  </p>

                  <div>
                    <label className="text-[9px] text-slate-500 uppercase font-black block mb-1 tracking-widest">Event Summary Designation</label>
                    <input
                      type="text"
                      placeholder="Summary calendar description..."
                      value={calendarTitle}
                      onChange={(e) => setCalendarTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2 text-white font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-500 uppercase font-black block mb-1 tracking-widest">Execution Date-Time</label>
                    <input
                      type="datetime-local"
                      value={calendarDate}
                      onChange={(e) => setCalendarDate(e.target.value)}
                      className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2 text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-cyan-500 text-slate-950 font-black rounded-xl hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] tracking-widest uppercase transition-all flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Commit Event Plan
                  </button>

                  {calendarEvents.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[8px] text-cyan-500/50 uppercase tracking-widest mb-1.5 border-b border-cyan-500/10">Active Upcoming Grid Markers</p>
                      <div className="space-y-1.5 max-h-[80px] overflow-y-auto jarvis-scrollbar text-[8px] text-slate-400 uppercase">
                        {calendarEvents.map(e => (
                          <div key={e.id} className="bg-slate-950/40 p-1.5 border border-white/5 rounded-lg flex justify-between">
                            <span className="font-extrabold text-white truncate max-w-[150px]">{e.summary}</span>
                            <span>{new Date(e.start.dateTime || e.start.date || '').toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.form>
              )}

              {/* Tab 3: Google Tasks creator */}
              {activeTab === 'tasks' && (
                <motion.form
                  key="tasks"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onSubmit={handleCreateTask}
                  className="space-y-3.5 text-[11px] font-mono"
                >
                  <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                    LOG MAIN PRINT TASK
                  </p>

                  <div>
                    <input
                      type="text"
                      placeholder="Title label of Task..."
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2 text-white font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                    />
                  </div>

                  <div>
                    <textarea
                      placeholder="Supplementary notes description..."
                      value={taskNotes}
                      onChange={(e) => setTaskNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2 text-white font-mono focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-cyan-500 text-slate-950 font-black rounded-xl hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] tracking-widest uppercase transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Synthesize Task
                  </button>

                  {tasks.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[8px] text-cyan-500/50 uppercase tracking-widest mb-1.5 border-b border-cyan-500/10">Incomplete Print Queue Jobs</p>
                      <div className="space-y-1.5 max-h-[80px] overflow-y-auto jarvis-scrollbar text-[8px] text-slate-400 uppercase">
                        {tasks.map(t => (
                          <div key={t.id} className="bg-slate-950/40 p-1.5 border border-white/5 rounded-lg">
                            <span className="font-extrabold text-white block truncate">{t.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.form>
              )}

              {/* Tab 4: Docs & Keep Creator */}
              {activeTab === 'misc' && (
                <motion.div
                  key="misc"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-5 text-[11px] font-mono"
                >
                  {/* Google Docs Generation */}
                  <form onSubmit={handleCreateDocPlanner} className="space-y-2 border-b border-cyan-500/10 pb-4">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1">
                      <FileDigit className="w-3.5 h-3.5 text-cyan-400" />
                      CREATE GOOGLE DOC
                    </p>
                    <input
                      type="text"
                      placeholder="Title of Google Doc..."
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2 text-white font-bold uppercase tracking-widest focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-cyan-500 text-slate-950 font-black rounded-xl hover:bg-cyan-400 tracking-widest uppercase transition-all text-[9px]"
                    >
                      Publish Doc Folder
                    </button>
                  </form>

                  {/* Google Keep Notes Archive */}
                  <form onSubmit={handleSaveKeepNote} className="space-y-2">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1">
                      <Save className="w-3.5 h-3.5 text-purple-400" />
                      SAVE TO GOOGLE KEEP
                    </p>
                    <input
                      type="text"
                      placeholder="Note Title..."
                      value={notesTitle}
                      onChange={(e) => setNotesTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2 text-white font-bold uppercase tracking-widest focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-cyan-400 text-slate-950 font-black rounded-xl hover:bg-cyan-300 tracking-widest uppercase transition-all text-[9px]"
                    >
                      Archive Keep Note
                    </button>
                  </form>

                  {/* List User Forms */}
                  {googleForms.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[8px] text-cyan-500/50 uppercase tracking-widest mb-1 border-b border-cyan-500/10">Active Google Forms</p>
                      <div className="space-y-1 text-[8px] text-slate-400 uppercase">
                        {googleForms.slice(0, 3).map(f => (
                          <a 
                            key={f.id} 
                            href={f.webViewLink} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-slate-950/40 p-1.5 border border-white/5 rounded-lg flex items-center justify-between block hover:border-cyan-500/40"
                          >
                            <span className="font-extrabold text-white truncate max-w-[160px]">{f.name}</span>
                            <ExternalLink className="w-3 h-3 text-cyan-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

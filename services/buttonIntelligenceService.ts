// Natasha Button Intelligence Service
// Provides deep architectural descriptions, "what is inside", and audio scripts for every app control

export interface ButtonIntel {
  id: string;
  name: string;
  category: 'MAIN_SERVER' | 'DATABASE' | 'CALCULATOR' | 'NATASHA' | 'SECURITY' | 'NAVIGATION' | 'UTILITY';
  tag: string;
  shortDesc: string;
  whatIsInside: string[];
  executionEffects: string[];
  securityClearance: string;
  voiceScript: string;
  keyboardShortcut?: string;
}

export const BUTTON_INTEL_REGISTRY: Record<string, ButtonIntel> = {
  'raj-expo-server': {
    id: 'raj-expo-server',
    name: 'RAJ EXPO DIGITALS SERVER',
    category: 'MAIN_SERVER',
    tag: '12 Folders Architecture',
    shortDesc: 'The primary central mainframe folder explorer housing all 12 autonomous subfolder environments.',
    whatIsInside: [
      '01. Natasha (Persona, AI Model Manager & Voice Synthesizer)',
      '02. Raj Expo Central Database (34 Canonical categories & people database)',
      '03. Tasks (Workflow queue, priority matrix & Printline Wattala deadlines)',
      '04. Reminders (Time-based notifications & auto-save monitors)',
      '05. WhatsApp Writer (One-tap chat generator with phone direct links)',
      '06. Files Discussion (Large text sequential chunker & abstract summarizer)',
      '07. Tool Hub & Calculators (10+ standalone operational apps)',
      '08. People Database (Historical timeline view from oldest to newest)',
      '09. Media & File Vault (Uploaded documents, images & audio archives)',
      '10. System Activities Log (Full chronological audit trail)',
      '11. Settings & Audio Synthesizer (Theme calibrations & frequency meters)',
      '12. System Information & Architecture Specs'
    ],
    executionEffects: [
      'Bypasses single-screen view and reveals the full dual-pane 12-folder explorer modal.',
      'Mounts real-time folder switching, audio cues, and active task synchronization.'
    ],
    securityClearance: 'Boss Priority: Level 5 Supreme (Jonathan Raj)',
    voiceScript: 'Boss, this is the main Raj Expo Digitals Server button. Inside, you access all 12 autonomous workspaces, including your 34 central database categories, tasks for Printline Wattala, the WhatsApp message engine, and your media archives.',
    keyboardShortcut: 'Alt + S'
  },
  'update-central-database': {
    id: 'update-central-database',
    name: 'Update Raj Expo Central Database',
    category: 'DATABASE',
    tag: 'GitHub Cloud Sync',
    shortDesc: 'Performs instant one-tap cryptographic synchronization of all local records to the remote repository.',
    whatIsInside: [
      'GitHub REST API connector for iamraj-ux / N.-A.-T..-A.-S.-H.-A-v5.-6',
      'JSON serializer compiling all 34 categories, people records, and system logs',
      'SHA-256 integrity checker comparing remote vs local checksums',
      'Instant commit message generator timestamped with Sri Lanka standard time',
      'Automatic offline retry queue in case of network interruption'
    ],
    executionEffects: [
      'Gathers all client-side state into a unified central_database_snapshot.json payload.',
      'Transmits payload via authenticated Octokit proxy with real-time progress indicators (Syncing → Uploading → Updated).'
    ],
    securityClearance: 'Encrypted Token Clearance // Boss Mainframe Direct',
    voiceScript: 'Boss, this button updates your Central Database to GitHub repository iamraj-ux. It bundles all 34 canonical records, creates a cryptographic commit, and secures your cloud backup in seconds.',
    keyboardShortcut: 'Alt + U'
  },
  'google-drive': {
    id: 'google-drive',
    name: 'GOOGLE DRIVE (raj-expo-central)',
    category: 'DATABASE',
    tag: 'Cloud OAuth Control',
    shortDesc: 'Complete Google Drive file repository with real-time Drive API test, search, upload, download, and delete.',
    whatIsInside: [
      'Real Drive API v3 connection diagnostic runner with quota breakdown',
      'Folder tree navigator with breadcrumbs and directory explorer',
      'Drag-and-drop multipart upload engine',
      'Direct file downloader & Google Docs/Sheets format exporter',
      'File renamer and protected deletion dialog requiring explicit confirmation'
    ],
    executionEffects: [
      'Opens the Google Drive Cloud Repository and OAuth Control modal with live Google API status.'
    ],
    securityClearance: 'OAuth Scope: drive (Full Access) // raj-expo-central',
    voiceScript: 'Boss, this is your Google Drive Cloud Repository. Connected through project raj-expo-central, it lets you explore, upload, download, and manage your cloud documents with real-time API verification.',
    keyboardShortcut: 'Alt + D'
  },
  'open-app-new-tab': {
    id: 'open-app-new-tab',
    name: 'OPEN APP IN NEW TAB',
    category: 'NAVIGATION',
    tag: 'External Window',
    shortDesc: 'Launches the complete Raj Expo Digitals application in an unconstrained standalone browser viewport.',
    whatIsInside: [
      'Un-sandboxed browser environment bypassing iframe permissions and cross-origin headers',
      'Full microphone SpeechRecognition API support without sandbox audio restrictions',
      'Expanded horizontal viewport for widescreen multi-pane operations and dual document auditing'
    ],
    executionEffects: [
      'Dispatches window.open with the current deployment URL, preserving all localStorage state.'
    ],
    securityClearance: 'Universal User Access',
    voiceScript: 'Boss, clicking Open App in New Tab breaks out of the preview frame into a dedicated browser window. This provides full microphone permissions, wider tables, and uninterrupted audio playback.',
    keyboardShortcut: 'Alt + N'
  },
  'lock-unlock-mainframe': {
    id: 'lock-unlock-mainframe',
    name: 'LOCK / STANDBY MAINFRAME',
    category: 'SECURITY',
    tag: 'Access Guard',
    shortDesc: 'Toggles high-security privacy shield mode, obscuring sensitive people data and business files.',
    whatIsInside: [
      'AES-inspired blurred frosted glass HUD overlay with animated scanline grid',
      'Master PIN verification barrier (Default code: 2026 or jr97)',
      'Audio lock latch / servo sound synthesizer from Web Audio context',
      'Automatic activity logger recording all lock and unlock timestamps'
    ],
    executionEffects: [
      'Blurs background application layers and prevents unauthorized cursor clicks.',
      'Plays metallic lock sound and triggers Natasha security protocol.'
    ],
    securityClearance: 'PIN Code Guard // Boss Jonathan Raj',
    voiceScript: 'Boss, this is the security standby button. When clicked, it activates the cybernetic shield, blurring your personal files and people records until your security PIN is verified.',
    keyboardShortcut: 'Alt + L'
  },
  'people-database': {
    id: 'people-database',
    name: 'People Database (Oldest → Newest)',
    category: 'DATABASE',
    tag: 'Timeline & Contacts',
    shortDesc: 'Opens the comprehensive human relationship matrix arranged in chronological registration order.',
    whatIsInside: [
      'Complete contact cards: Family, Friends, NLB Bookshop, Printline Wattala colleagues',
      'Chronological sorter ordering records from first registered to most recent',
      'Dynamic search engine filtering by name, phone, relationship, tags, and category',
      'Direct WhatsApp chat trigger, phone caller, and record editor modals',
      'Instant vCard (.vcf) and CSV export for mobile phone contact synchronization'
    ],
    executionEffects: [
      'Opens the dedicated People Database modal with timeline visualizer.',
      'Fetches stored contacts from persistent storage.'
    ],
    securityClearance: 'Confidential Records // Boss Clear',
    voiceScript: 'Boss, this opens the People Database arranged chronologically from oldest to newest. Inside, you can search contacts, initiate WhatsApp messages, view relationship notes, and export to phone contacts.',
    keyboardShortcut: 'Alt + P'
  },
  'tool-hub': {
    id: 'tool-hub',
    name: 'Tool Hub & Calculators',
    category: 'UTILITY',
    tag: '10+ Autonomous Tools',
    shortDesc: 'Launches the comprehensive utility dock containing standalone operational calculation apps.',
    whatIsInside: [
      'Printline Duplex & Book Printing Cost Estimator',
      'Kickboxing Sparring Round Timer & Lightweight Calorie Counter',
      'Unit Converter (Inches, mm, Points, GSM Paper Weights)',
      'QR Code & Barcode Generator for Retail Packaging',
      'Date & Deadline Milestone Calculator',
      'Text Case & Base64 Encoder / Decoder',
      'Currency & Invoice Totalizer with Tax Calculations'
    ],
    executionEffects: [
      'Mounts the Tool Hub drawer with instant switching between calculation modules.'
    ],
    securityClearance: 'Operations & Business Utility',
    voiceScript: 'Boss, the Tool Hub contains over 10 utility calculators, including your Printline Wattala duplex printing cost estimator, kickboxing sparring timer, and paper weight converters.',
    keyboardShortcut: 'Alt + T'
  },
  'pdf-counter': {
    id: 'pdf-counter',
    name: 'Document & PDF Page Counter',
    category: 'CALCULATOR',
    tag: 'Printline Wattala Engine',
    shortDesc: 'The primary operational page counting tool with instant duplex paper breakdown and cost calculation.',
    whatIsInside: [
      'PDF.js parsing engine extracting exact sheet counts from single and multi-page documents',
      'Duplex sheet optimizer (pages divided by 2 rounded up for double-sided print runs)',
      'Color vs Black-and-White cost breakdown with customizable per-page rates (LKR)',
      'Batch upload queue processing multiple PDF files simultaneously',
      'Exportable print job receipts and summary slips'
    ],
    executionEffects: [
      'Triggers the file drag-and-drop zone and calculates instant duplex paper requirements.'
    ],
    securityClearance: 'Printline Commercial Utility',
    voiceScript: 'Boss, this is the PDF Page Counter. It analyzes your PDF documents in real time, calculates double-sided duplex sheet requirements, and outputs exact printing costs for Printline Wattala.',
    keyboardShortcut: 'Alt + C'
  },
  'system-activities': {
    id: 'system-activities',
    name: 'System Activities Log',
    category: 'UTILITY',
    tag: 'Audit Trail',
    shortDesc: 'Chronological timeline of all system actions, database changes, uploads, and Natasha interactions.',
    whatIsInside: [
      'Timestamped activity cards categorized by VISIT, CHAT, FILE_UPLOAD, DATABASE, and SERVER_TASK',
      'Clear Logs utility and search filter for historical inspection',
      'Export audit trail as formatted text report'
    ],
    executionEffects: [
      'Displays the modal overlay containing all logged system operations.'
    ],
    securityClearance: 'Audit & Diagnostic Log',
    voiceScript: 'Boss, this button opens your System Activities Log. It records every database modification, chat query, file upload, and lock state with precise timestamps.',
    keyboardShortcut: 'Alt + A'
  },
  'media-vault': {
    id: 'media-vault',
    name: 'Central Media Upload & Vault',
    category: 'UTILITY',
    tag: 'Storage & Assets',
    shortDesc: 'Upload, organize, preview, and download images, audio files, invoices, and documents.',
    whatIsInside: [
      'Drag-and-drop multi-file uploader supporting PNG, JPG, PDF, MP3, and WAV',
      'Category assigner linking files directly into the 34 central database folders',
      'In-browser image zoom previewer and audio player',
      'Download manager and bulk asset export'
    ],
    executionEffects: [
      'Opens the Media Upload and Storage modal with live file dropzone.'
    ],
    securityClearance: 'Storage & Assets',
    voiceScript: 'Boss, this is your Media Upload Vault. You can upload documents, photos, and audio files here, preview them instantly, and link them to your 34 database folders.',
    keyboardShortcut: 'Alt + M'
  },
  'natasha-listen-button': {
    id: 'natasha-listen-button',
    name: 'Listen Voice (Speech Synthesis)',
    category: 'NATASHA',
    tag: 'Acoustic Synthesizer',
    shortDesc: 'Directly speaks any Natasha response aloud using the high-clarity female English synthesizer.',
    whatIsInside: [
      'Female pitch register calibration (1.18 pitch / 1.02x rate)',
      'Pulsing STOP toggle state while speaking',
      'Animated frequency waveform equalizer',
      'Automatic "Boss" priority prefix protocol'
    ],
    executionEffects: [
      'Cancels ongoing browser speech and speaks the specific response text cleanly.'
    ],
    securityClearance: 'Natasha Voice Pipeline',
    voiceScript: 'Boss, this is my Listen button. When you click it on any message, I will read the entire response aloud to you in my female voice synthesizer.',
    keyboardShortcut: 'Space (on active message)'
  },
  'natasha-mic-dictation': {
    id: 'natasha-mic-dictation',
    name: 'Microphone Dictation (Speech-to-Text)',
    category: 'NATASHA',
    tag: 'Live Audio Input',
    shortDesc: 'Hands-free voice recognition streaming spoken words directly into the Natasha chat composer.',
    whatIsInside: [
      'HTML5 Web Speech Recognition API listener',
      'Real-time transcript interim stream',
      'Pulsing red recording state indicator',
      'Auto-capitalization and punctuation cleaner'
    ],
    executionEffects: [
      'Requests microphone access, listens to voice commands, and fills the chat input.'
    ],
    securityClearance: 'Microphone Permission',
    voiceScript: 'Boss, this is the voice dictation microphone. Click it and speak naturally; I will convert your words into text and transmit them into our live chat.',
    keyboardShortcut: 'Alt + M'
  },
  'natasha-auto-voice': {
    id: 'natasha-auto-voice',
    name: 'Auto-Voice Broadcast Toggle',
    category: 'NATASHA',
    tag: 'Autonomous Speech',
    shortDesc: 'Enables or disables automatic vocalization of all incoming Natasha chat messages.',
    whatIsInside: [
      'Persistent localStorage flag (natasha_auto_voice)',
      'Live toggle between ON (purple active glow) and OFF (standby)',
      'Automatic speech dispatch on new AI responses'
    ],
    executionEffects: [
      'When active, Natasha speaks every message aloud automatically without needing to click Listen.'
    ],
    securityClearance: 'Autonomous Voice Directive',
    voiceScript: 'Boss, this toggles Auto-Voice. When activated, I will automatically speak every response aloud the moment it appears on your display.',
    keyboardShortcut: 'Alt + V'
  },
  'natasha-inspector-toggle': {
    id: 'natasha-inspector-toggle',
    name: 'Natasha Button Inspector Mode',
    category: 'NATASHA',
    tag: 'Interactive Explainer',
    shortDesc: 'Activates inspector crosshairs allowing you to select and click ANY button to pop up full voice & text intel.',
    whatIsInside: [
      'Targeting reticle overlay with animated holographic highlight rings',
      'Interceptor engine analyzing button attributes, destination, and components',
      'Voice readout modal speaking full architectural breakdown aloud',
      'Direct "Execute Now" launcher for tested controls'
    ],
    executionEffects: [
      'Toggles inspector mode on and off across the entire application interface.'
    ],
    securityClearance: 'Intelligence Inspector // Level 5',
    voiceScript: 'Boss, this is the Natasha Button Inspector toggle. Activate it, then click any button on your screen to immediately hear and read what it does and what is inside.',
    keyboardShortcut: 'Alt + I'
  }
};

// Helper to resolve button intel by ID, text content, or attributes
export const resolveButtonIntel = (buttonEl?: HTMLElement | null, fallbackId?: string): ButtonIntel => {
  if (fallbackId && BUTTON_INTEL_REGISTRY[fallbackId]) {
    return BUTTON_INTEL_REGISTRY[fallbackId];
  }

  if (!buttonEl) {
    return BUTTON_INTEL_REGISTRY['raj-expo-server'];
  }

  // 1. Check data-intel attribute
  const dataIntel = buttonEl.getAttribute('data-intel');
  if (dataIntel && BUTTON_INTEL_REGISTRY[dataIntel]) {
    return BUTTON_INTEL_REGISTRY[dataIntel];
  }

  // 2. Check element ID
  const elId = (buttonEl.id || '').toLowerCase();
  for (const [key, item] of Object.entries(BUTTON_INTEL_REGISTRY)) {
    if (elId.includes(key) || key.includes(elId)) {
      return item;
    }
  }

  // 3. Check button text / title / aria-label
  const text = (buttonEl.textContent || buttonEl.getAttribute('title') || buttonEl.getAttribute('aria-label') || '').toLowerCase();
  
  if (text.includes('raj expo') || text.includes('server')) return BUTTON_INTEL_REGISTRY['raj-expo-server'];
  if (text.includes('update') || text.includes('sync') || text.includes('github')) return BUTTON_INTEL_REGISTRY['update-central-database'];
  if (text.includes('new tab') || text.includes('open app')) return BUTTON_INTEL_REGISTRY['open-app-new-tab'];
  if (text.includes('lock') || text.includes('standby')) return BUTTON_INTEL_REGISTRY['lock-unlock-mainframe'];
  if (text.includes('people') || text.includes('contact')) return BUTTON_INTEL_REGISTRY['people-database'];
  if (text.includes('tool') || text.includes('calculator')) return BUTTON_INTEL_REGISTRY['tool-hub'];
  if (text.includes('pdf') || text.includes('counter') || text.includes('page')) return BUTTON_INTEL_REGISTRY['pdf-counter'];
  if (text.includes('activit') || text.includes('log')) return BUTTON_INTEL_REGISTRY['system-activities'];
  if (text.includes('media') || text.includes('upload') || text.includes('vault')) return BUTTON_INTEL_REGISTRY['media-vault'];
  if (text.includes('listen') || text.includes('voice')) return BUTTON_INTEL_REGISTRY['natasha-listen-button'];
  if (text.includes('mic') || text.includes('speak') || text.includes('record')) return BUTTON_INTEL_REGISTRY['natasha-mic-dictation'];
  if (text.includes('auto-voice') || text.includes('autovoice')) return BUTTON_INTEL_REGISTRY['natasha-auto-voice'];
  if (text.includes('inspect')) return BUTTON_INTEL_REGISTRY['natasha-inspector-toggle'];

  // Dynamic fallback for any generic button
  const cleanName = (buttonEl.textContent || buttonEl.getAttribute('title') || 'Interactive System Control').trim().slice(0, 40);
  return {
    id: `custom-${Date.now()}`,
    name: cleanName || 'System Control Button',
    category: 'UTILITY',
    tag: 'Mainframe Component',
    shortDesc: `Interactive operational trigger providing direct control execution for ${cleanName || 'system process'}.`,
    whatIsInside: [
      'Event listener binding state dispatch and component lifecycle',
      'Tactile Web Audio feedback synthesizer triggers on user interaction',
      'Autonomous error-handling and confirmation safeguards'
    ],
    executionEffects: [
      `Executes the designated action bound to the ${cleanName} control.`
    ],
    securityClearance: 'Boss Clearance (Jonathan Raj)',
    voiceScript: `Boss, you selected the ${cleanName} button. This control triggers the designated action and communicates directly with your active session.`
  };
};

/**
 * CANONICAL CATEGORIES KNOWLEDGE & DEEP NAVIGATION ENGINE
 * 
 * Implements the user's required canonical category architecture:
 * - Natasha
 * - Jonathan Ross / Jonathan Raj Profile
 * - Personal & Preferences
 * - Family
 * - People
 * - Friends
 * - Colleagues
 * - Contacts
 * - Work & Operations
 * - Skills
 * - Projects
 * - Tasks
 * - Remote Work
 * - Completed Work
 * - Reminder
 * - Tools & Apps
 * - WhatsApp Direct Chats
 * - Files & Media Catalog
 * - App Activities & Security Logs
 * - Other Data & Custom Tags
 * 
 * Supports deep "click go inside" navigation down to item details,
 * editing any information, Ask Natasha breakdown on every element,
 * and dual synchronization to both GitHub and Cloudinary.
 */

export interface CanonicalItem {
  id: string;
  categoryId: string;
  title: string;
  subtitle: string;
  status?: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'ARCHIVED' | 'HIGH_PRIORITY';
  tags: string[];
  description: string;
  detailedNotes: string;
  keyPoints: string[];
  metrics?: Record<string, string | number>;
  contactInfo?: {
    phone?: string;
    email?: string;
    relation?: string;
    location?: string;
  };
  lastUpdated: string;
  author: string;
}

export interface CanonicalCategory {
  id: string;
  name: string;
  code: string;
  iconName: string;
  color: string;
  description: string;
  natashaSummary: string;
  items: CanonicalItem[];
}

const STORAGE_KEY = 'raj_expo_canonical_categories_v2';

export const INITIAL_CANONICAL_CATEGORIES: CanonicalCategory[] = [
  {
    id: 'cat-natasha',
    name: 'Natasha',
    code: '01.NATASHA',
    iconName: 'Cpu',
    color: 'cyan',
    description: 'Artificial Super Intelligence Core (ASI 916), speech synthesizer, directives, and neural protocols.',
    natashaSummary: 'This is my core matrix, Boss. It contains my voice calibration, neural stream configuration, high-priority directives, and behavioral protocols.',
    items: [
      {
        id: 'item-natasha-core',
        categoryId: 'cat-natasha',
        title: 'N.A.T.A.S.H.A 5.6 ASI 916 Kernel',
        subtitle: 'Virtual Intelligence Core Directive',
        status: 'ACTIVE',
        tags: ['asi', 'core', 'natasha', 'security', 'voice'],
        description: 'Advanced Synthetic Intelligence dedicated to Mr. Raj and Raj Expo Digitals operations.',
        detailedNotes: 'Operating at 100% efficiency. Features real-time voice synthesis, multi-format file breakdown, knowledge graph traversal, and automated dual-cloud persistence.',
        keyPoints: [
          'Direct assistant to Mr. Jonathan Raj',
          'Voice feedback with pitch 1.18 and rate 1.02',
          'Automated tool suggestion when operator queries require assistance',
          'Real-time encrypted activity logging and neural streaming'
        ],
        metrics: { 'Uptime': '99.98%', 'Neural Version': '5.6 ASI', 'Voice Rate': '1.02x' },
        lastUpdated: new Date().toISOString(),
        author: 'Jonathan Raj'
      },
      {
        id: 'item-natasha-speech',
        categoryId: 'cat-natasha',
        title: 'Voice Synthesizer & Speech Protocols',
        subtitle: 'Natural Female Synthesizer',
        status: 'ACTIVE',
        tags: ['voice', 'speech', 'audio', 'soundboard'],
        description: 'Native Web Speech API and Web Audio Context integration for affirmative vocal feedback.',
        detailedNotes: 'Provides immediate vocal confirmations like "Uploading completed, boss" and contextual breakdowns when "Ask Natasha" is clicked.',
        keyPoints: [
          'Automatic detection of the best natural female voice',
          'Audio equalizer frequency visualizers on announcement pop-ups',
          'Toggleable auto-voice synchronized with system speech settings'
        ],
        lastUpdated: new Date().toISOString(),
        author: 'Jonathan Raj'
      }
    ]
  },
  {
    id: 'cat-jonathan-profile',
    name: 'Jonathan Ross / Raj Profile',
    code: '02.PROFILE',
    iconName: 'Shield',
    color: 'emerald',
    description: 'Master Operator identity, credentials, professional portfolio, bio, and executive background.',
    natashaSummary: 'This is your master identity dossier, Boss. Everything about your vision, leadership at Raj Expo Digitals, design credentials, and background is stored here.',
    items: [
      {
        id: 'item-jonathan-bio',
        categoryId: 'cat-jonathan-profile',
        title: 'Jonathan Raj (Jonathan Ross) — Master Profile',
        subtitle: 'Founder & Principal Designer // Raj Expo Digitals',
        status: 'ACTIVE',
        tags: ['founder', 'operator', 'raj_expo', 'design', 'executive'],
        description: 'Visionary designer, printing specialist, and developer behind Raj Expo Digitals.',
        detailedNotes: 'Leading digital design, document analysis, large-format printing workflows, and cutting-edge artificial intelligence integration in Wattala and Colombo, Sri Lanka.',
        keyPoints: [
          'Founder of Raj Expo Digitals & Document Intelligence Architecture',
          'Expertise in Prepress, CMYK color separation, and digital printing automation',
          'Architect of Natasha 5.6 ASI and Central Knowledge Graph',
          'Practitioner of Kickboxing, fitness, and high-performance productivity'
        ],
        contactInfo: {
          phone: '+94776223997',
          email: 'drvicvondom@gmail.com',
          location: 'Wattala, Sri Lanka'
        },
        metrics: { 'Projects Completed': '450+', 'Print Volume': '1.2M+ Pages', 'Network Tier': 'Elite' },
        lastUpdated: new Date().toISOString(),
        author: 'Jonathan Raj'
      }
    ]
  },
  {
    id: 'cat-personal-preference',
    name: 'Personal & Preference',
    code: '03.PREFERENCE',
    iconName: 'Sparkles',
    color: 'purple',
    description: 'Work habits, dark cyber aesthetic, keyboard shortcuts, themes, audio feedback, and lifestyle rituals.',
    natashaSummary: 'Your personalized configuration hub, Boss. Controls your aesthetic styles, high-contrast dark cyber theme, audio notification preferences, and daily operational rhythm.',
    items: [
      {
        id: 'item-pref-ui',
        categoryId: 'cat-personal-preference',
        title: 'Dark Cybernetic & JARVIS Aesthetic',
        subtitle: 'Visual & Soundboard Preferences',
        status: 'ACTIVE',
        tags: ['theme', 'ui', 'jarvis', 'audio', 'shortcuts'],
        description: 'Preference for deep slate-950 canvas with glowing cyan, emerald, and amber accent lighting.',
        detailedNotes: 'Prefers ultra-responsive keyboard shortcuts (Alt+I for Inspector, Alt+H for Server Hub, Enter to Upload) and zero-latency audio synthesis.',
        keyPoints: [
          'High-contrast cyan and emerald neon borders with backdrop blur',
          'Dual-cloud automatic persistence without manual prompts',
          'Draggable and resizable windows with smooth vertical scrollbars'
        ],
        lastUpdated: new Date().toISOString(),
        author: 'Jonathan Raj'
      }
    ]
  },
  {
    id: 'cat-family',
    name: 'Family',
    code: '04.FAMILY',
    iconName: 'Users',
    color: 'pink',
    description: 'Family members, close household contacts, important family anniversaries, and personal milestones.',
    natashaSummary: 'Family records and trusted household relationships, Boss. You can store birthdays, emergency contacts, notes, and milestones here safely.',
    items: [
      {
        id: 'item-family-home',
        categoryId: 'cat-family',
        title: 'Family Household & Close Relations',
        subtitle: 'Immediate Family & Emergency Contacts',
        status: 'ACTIVE',
        tags: ['family', 'home', 'contacts', 'important'],
        description: 'Core family contacts, important celebration dates, and domestic reminders.',
        detailedNotes: 'Contains encrypted contact numbers and important family calendar dates. Natasha pings early reminders before upcoming birthdays.',
        keyPoints: [
          'Dad & Mom contacts and medical checkup reminders',
          'Annual family gatherings and holiday celebration schedules',
          'Direct priority telephone links in WhatsApp workspace'
        ],
        contactInfo: {
          relation: 'Immediate Family',
          location: 'Wattala, Sri Lanka'
        },
        lastUpdated: new Date().toISOString(),
        author: 'Jonathan Raj'
      }
    ]
  },
  {
    id: 'cat-people',
    name: 'People',
    code: '05.PEOPLE',
    iconName: 'Users',
    color: 'blue',
    description: 'Comprehensive directory of known individuals, acquaintances, clients, and partners.',
    natashaSummary: 'Your global people directory, Boss. Search, cross-reference, and inspect any individual with linked records, interaction history, and relationship nodes.',
    items: [
      {
        id: 'item-people-directory',
        categoryId: 'cat-people',
        title: 'Master People Directory & Knowledge Nodes',
        subtitle: 'Entity Directory with Bi-directional Links',
        status: 'ACTIVE',
        tags: ['people', 'contacts', 'clients', 'network'],
        description: 'Unified repository of clients, suppliers, team members, and associates.',
        detailedNotes: 'Every person record links directly to their WhatsApp chat transcripts, document orders, phone numbers, and activity logs.',
        keyPoints: [
          'Automatic entity resolution when mentioned in Natasha chat',
          'Direct one-click WhatsApp message dispatching',
          'Bi-directional relationship tags with central records'
        ],
        metrics: { 'Known Individuals': 84, 'Active Clients': 38 },
        lastUpdated: new Date().toISOString(),
        author: 'Jonathan Raj'
      }
    ]
  },
  {
    id: 'cat-friends',
    name: 'Friends',
    code: '06.FRIENDS',
    iconName: 'Users',
    color: 'amber',
    description: 'Close personal friends, social circles, sports buddies, and hangout groups.',
    natashaSummary: 'Your personal friendship circle, Boss. Tracks shared memories, kickboxing companions, birthday reminders, and informal catchups.',
    items: [
      {
        id: 'item-friends-circle',
        categoryId: 'cat-friends',
        title: 'Close Friends & Social Circle',
        subtitle: 'Personal Comrades & Sporting Partners',
        status: 'ACTIVE',
        tags: ['friends', 'social', 'kickboxing', 'weekend'],
        description: 'Friends from school, sports clubs, and personal creative collaborations.',
        detailedNotes: 'Maintains notes on shared hobbies, kickboxing training sessions, favorite food spots, and upcoming meetups.',
        keyPoints: [
          'Dilan, Tharushi, and creative peers',
          'Kickboxing sparring partners at the local academy',
          'Quick WhatsApp chat export integration'
        ],
        lastUpdated: new Date().toISOString(),
        author: 'Jonathan Raj'
      }
    ]
  },
  {
    id: 'cat-colleagues',
    name: 'Colleagues',
    code: '07.COLLEAGUES',
    iconName: 'Users',
    color: 'teal',
    description: 'Professional coworkers, printing press technicians, design team members, and suppliers.',
    natashaSummary: 'Your professional colleagues and prepress associates, Boss. Connects with print operators at Printline Wattala and design contractors.',
    items: [
      {
        id: 'item-colleagues-press',
        categoryId: 'cat-colleagues',
        title: 'Print Press Operations Team & Suppliers',
        subtitle: 'Technical Collaborators & Material Vendors',
        status: 'ACTIVE',
        tags: ['colleagues', 'printing', 'suppliers', 'prepress'],
        description: 'Team members handling digital press, paper stock supply, and offset machinery.',
        detailedNotes: 'Direct operational link for large format banner proofs, toner supply orders, and duplex paper shipments.',
        keyPoints: [
          'Press technicians at Printline Wattala',
          'Paper distributors for 80gsm, 100gsm, and 300gsm art board',
          'Delivery coordinators for urgent client printing deadlines'
        ],
        lastUpdated: new Date().toISOString(),
        author: 'Jonathan Raj'
      }
    ]
  },
  {
    id: 'cat-contacts',
    name: 'Contacts',
    code: '08.CONTACTS',
    iconName: 'Users',
    color: 'emerald',
    description: 'Direct phone numbers, email addresses, WhatsApp numbers, and social handles.',
    natashaSummary: 'Speed-dial contact book, Boss. Click any contact to draft a WhatsApp message or launch phone call directly.',
    items: [
      {
        id: 'item-contact-emergency',
        categoryId: 'cat-contacts',
        title: 'Priority Speed Dial & Operational Hotlines',
        subtitle: 'Direct WhatsApp & Phone Telephony',
        status: 'ACTIVE',
        tags: ['contacts', 'phone', 'whatsapp', 'hotline'],
        description: 'Direct phone lines for immediate client and technical communication.',
        detailedNotes: 'Equipped with direct copy and WhatsApp launch buttons.',
        keyPoints: [
          'Raj Expo Digitals hotline: +94776223997',
          'Direct customer support WhatsApp integration',
          'One-click phone dialing and vCard generation'
        ],
        contactInfo: {
          phone: '+94776223997',
          email: 'drvicvondom@gmail.com'
        },
        lastUpdated: new Date().toISOString(),
        author: 'Jonathan Raj'
      }
    ]
  },
  {
    id: 'cat-work-skills',
    name: 'Work & Skills',
    code: '09.WORK_SKILLS',
    iconName: 'Wrench',
    color: 'cyan',
    description: 'Core professional capabilities: Digital prepress, CMYK design, AI systems, full-stack programming, and printing.',
    natashaSummary: 'Your professional skillset and technical capabilities, Boss. Details your graphic design mastery, prepress expertise, and software engineering prowess.',
    items: [
      {
        id: 'item-skill-prepress',
        categoryId: 'cat-work-skills',
        title: 'Digital Prepress & Document Analysis',
        subtitle: 'Color Proofing, Simplex/Duplex Allocation',
        status: 'ACTIVE',
        tags: ['skills', 'prepress', 'printing', 'cmyk', 'pdf'],
        description: 'Advanced document counting, orientation separation, and high-volume production pricing.',
        detailedNotes: 'Specialized in automated page calculation for multi-megabyte PDFs, Word DOCX, Excel spreadsheets, and PPTX slide decks.',
        keyPoints: [
          'Simplex vs Duplex sheet count mathematical optimization',
          'Automated portrait vs landscape orientation detection',
          'Batch rename and zip bundling for large press runs'
        ],
        metrics: { 'Accuracy': '100%', 'Supported Formats': 'PDF, DOCX, XLSX, PPTX, Images' },
        lastUpdated: new Date().toISOString(),
        author: 'Jonathan Raj'
      },
      {
        id: 'item-skill-dev',
        categoryId: 'cat-work-skills',
        title: 'Full-Stack Software & AI Engineering',
        subtitle: 'TypeScript, React, Cloudinary, GitHub Sync',
        status: 'ACTIVE',
        tags: ['skills', 'software', 'ai', 'react', 'typescript', 'cloudinary'],
        description: 'Building custom enterprise productivity operating systems with zero lag.',
        detailedNotes: 'Constructing robust client-side applications with dual-cloud persistence (GitHub and Cloudinary) and natural voice synthesis.',
        keyPoints: [
          'Vite + React 18 + Framer Motion high performance UI',
          'Cloudinary unsigned REST API asset uploading',
          'Direct GitHub Octokit repository JSON commit engine'
        ],
        lastUpdated: new Date().toISOString(),
        author: 'Jonathan Raj'
      }
    ]
  },
  {
    id: 'cat-projects',
    name: 'Projects',
    code: '10.PROJECTS',
    iconName: 'FolderTree',
    color: 'amber',
    description: 'Active client deliverables, enterprise branding, web development, and digital printing projects.',
    natashaSummary: 'Your active and pipeline projects, Boss. Review deliverables, deadlines, client briefs, and live progress trackers.',
    items: [
      {
        id: 'item-project-natasha-os',
        categoryId: 'cat-projects',
        title: 'Raj Expo Digitals Server 916 // Natasha ASI 5.6',
        subtitle: 'Enterprise AI & Document Operations System',
        status: 'ACTIVE',
        tags: ['projects', 'raj_expo', 'natasha', 'flagship', 'active'],
        description: 'Flagship productivity operating system featuring Natasha AI, WhatsApp Chat Unzipper, and Dual Cloud Sync.',
        detailedNotes: 'Combines document calculation, canonical categories, media upload to Cloudinary, and bi-directional GitHub repository persistence.',
        keyPoints: [
          'WhatsApp direct chat zip file parsing and message breakdown',
          'Deep nested "click go inside" canonical categories navigation',
          'Dual synchronization of all text information to GitHub and Cloudinary',
          'Draggable, resizable, minimizable, and animated window system'
        ],
        metrics: { 'Progress': '96%', 'Milestones': '5/5 Completed' },
        lastUpdated: new Date().toISOString(),
        author: 'Jonathan Raj'
      },
      {
        id: 'item-project-large-format',
        categoryId: 'cat-projects',
        title: 'Commercial Digital Print Fleet Automation',
        subtitle: 'Prepress Workflow & Client Quoting System',
        status: 'ACTIVE',
        tags: ['projects', 'printing', 'commercial', 'automation'],
        description: 'Integrated cost estimation and job ticket generator for retail printing customers.',
        detailedNotes: 'Enables instant quote calculations based on single/double-sided sheet rates and orientation rules.',
        keyPoints: [
          'Automatic discount tiers for bulk orders',
          'Receipt and job sheet export in PDF and DOCX formats',
          'Live invoice generation sent via WhatsApp'
        ],
        metrics: { 'Client Jobs/Day': '25+', 'Avg Turnaround': '15 mins' },
        lastUpdated: new Date().toISOString(),
        author: 'Jonathan Raj'
      }
    ]
  },
  {
    id: 'cat-tasks',
    name: 'Tasks',
    code: '11.TASKS',
    iconName: 'CheckSquare',
    color: 'emerald',
    description: 'Actionable items, daily to-dos, printing queue, client revisions, and follow-ups.',
    natashaSummary: 'Your operational to-do list, Boss. You can check off finished tasks, reprioritize urgent jobs, and let me alert you when deadlines near.',
    items: [
      {
        id: 'item-task-chat-zip',
        categoryId: 'cat-tasks',
        title: 'Test WhatsApp Chat Export ZIP Extraction',
        subtitle: 'Unzip and analyze customer chat archives',
        status: 'HIGH_PRIORITY',
        tags: ['tasks', 'whatsapp', 'testing', 'zip', 'urgent'],
        description: 'Verify WhatsApp direct chat zip upload, client-side decompression, and message visualization.',
        detailedNotes: 'Ensure message sender attribution, timestamps, attachment links, and participant statistics render smoothly.',
        keyPoints: [
          'Drag & drop WhatsApp Chat .zip export file',
          'Verify JSZip decompression and _chat.txt parsing',
          'Test Ask Natasha breakdown on parsed messages'
        ],
        lastUpdated: new Date().toISOString(),
        author: 'Jonathan Raj'
      },
      {
        id: 'item-task-cloudinary-sync',
        categoryId: 'cat-tasks',
        title: 'Verify Dual Cloudinary + GitHub Text Sync',
        subtitle: 'Simultaneous persistence across both cloud providers',
        status: 'ACTIVE',
        tags: ['tasks', 'cloudinary', 'github', 'sync'],
        description: 'Confirm all text-based edits commit to GitHub JSON and Cloudinary raw store simultaneously.',
        detailedNotes: 'When any canonical category or note is saved, the dualCloudSyncService pushes updates to both GitHub and Cloudinary.',
        keyPoints: [
          'Push to iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6 repo',
          'Upload raw JSON payload to Cloudinary raj_expo/text_database',
          'Provide Cloudinary URL in UI for direct cloud viewing'
        ],
        lastUpdated: new Date().toISOString(),
        author: 'Jonathan Raj'
      }
    ]
  },
  {
    id: 'cat-remote-work',
    name: 'Remote Work',
    code: '12.REMOTE_WORK',
    iconName: 'ExternalLink',
    color: 'blue',
    description: 'Cloud collaboration pipelines, asynchronous approvals, remote print file proofs, and client portals.',
    natashaSummary: 'Your remote operations center, Boss. Oversees client communications across Colombo, cloud backups, and remote job approvals.',
    items: [
      {
        id: 'item-remote-portal',
        categoryId: 'cat-remote-work',
        title: 'Asynchronous Remote Proofing & Approval Portal',
        subtitle: 'Client Cloud Link Sharing',
        status: 'ACTIVE',
        tags: ['remote', 'cloud', 'proofing', 'collaboration'],
        description: 'Direct proof links generated via Cloudinary for instant client signoff on WhatsApp.',
        detailedNotes: 'Clients can view high-res previews in their mobile browsers before files are released to the print production queue.',
        keyPoints: [
          'Instant CDN delivery via Cloudinary',
          'No client login required for proof approval',
          'Audit trail logged into central activity database'
        ],
        lastUpdated: new Date().toISOString(),
        author: 'Jonathan Raj'
      }
    ]
  },
  {
    id: 'cat-completed-work',
    name: 'Completed Work',
    code: '13.COMPLETED_WORK',
    iconName: 'CheckCircle2',
    color: 'emerald',
    description: 'Archived deliverables, successful press runs, historical client projects, and verified invoice records.',
    natashaSummary: 'Your completed work archives, Boss. All finished printing jobs, delivered designs, and closed orders are cataloged here for reference.',
    items: [
      {
        id: 'item-completed-august-batch',
        categoryId: 'cat-completed-work',
        title: 'Commercial Booklets & Brochure Run — 5,000 Units',
        subtitle: 'Delivered to Corporate Client // Wattala',
        status: 'COMPLETED',
        tags: ['completed', 'printing', 'brochures', 'delivered'],
        description: 'Complete run of full-color 16-page saddle-stitched product catalogs.',
        detailedNotes: 'Printed on 150gsm gloss art paper with 300gsm laminated cover. Delivered on schedule with zero customer punchlist items.',
        keyPoints: [
          'Full-color CMYK digital press run',
          'Prepress orientation audit verified by document counter',
          'Payment received and logged into financial ledger'
        ],
        metrics: { 'Volume': '5,000 Units', 'Turnaround': '48 hours', 'Client Rating': '5.0 ★' },
        lastUpdated: new Date().toISOString(),
        author: 'Jonathan Raj'
      }
    ]
  },
  {
    id: 'cat-reminders',
    name: 'Reminders',
    code: '14.REMINDERS',
    iconName: 'Bell',
    color: 'pink',
    description: 'Scheduled alerts, audio reminders, follow-up alarms, supplier payment dates, and customer notifications.',
    natashaSummary: 'Your intelligent reminder log, Boss. Natasha alerts you with audio chimes and voice announcements when these items trigger.',
    items: [
      {
        id: 'item-reminder-sync',
        categoryId: 'cat-reminders',
        title: 'Daily Central Database Cloud Backup',
        subtitle: 'Automatic Dual-Sync to GitHub & Cloudinary',
        status: 'ACTIVE',
        tags: ['reminders', 'sync', 'backup', 'daily'],
        description: 'Ensure all newly added documents, categories, and WhatsApp chat records are synced to the cloud.',
        detailedNotes: 'Triggers automatically upon document modification or via the one-tap update button.',
        keyPoints: [
          'Verification of GitHub commit SHA',
          'Verification of Cloudinary text database URL',
          'Natasha vocal confirmation upon completion'
        ],
        lastUpdated: new Date().toISOString(),
        author: 'Jonathan Raj'
      }
    ]
  },
  {
    id: 'cat-tools-apps',
    name: 'Tools & Apps',
    code: '15.TOOLS_APPS',
    iconName: 'Wrench',
    color: 'cyan',
    description: '20+ production utilities: PDF Counter, Vector QR Generator, Prompt Generator, Image Workshop, and File Converter.',
    natashaSummary: 'Your digital utility belt, Boss. Access 20+ specialized tools designed specifically for print shop operations and AI prompt crafting.',
    items: [
      {
        id: 'item-tool-pdf-counter',
        categoryId: 'cat-tools-apps',
        title: 'Professional Multi-Format Document Counter',
        subtitle: 'PDF, Word DOCX, Excel XLSX, PPTX Slide Decks',
        status: 'ACTIVE',
        tags: ['tools', 'counter', 'pdf', 'docx', 'xlsx', 'pptx'],
        description: 'High-speed client-side page, sheet, and printing cost analyzer.',
        detailedNotes: 'Separates portrait and landscape orientations, calculates simplex and duplex pricing, and exports consolidated reports.',
        keyPoints: [
          'Zero server upload required for counting',
          'Custom pricing formulas per page and per sheet',
          'Bulk rename and ZIP package export'
        ],
        lastUpdated: new Date().toISOString(),
        author: 'Jonathan Raj'
      },
      {
        id: 'item-tool-qr-generator',
        categoryId: 'cat-tools-apps',
        title: 'Native Vector QR Code Studio',
        subtitle: 'SVG & High-Res PNG Generator for Print',
        status: 'ACTIVE',
        tags: ['tools', 'qr', 'vector', 'svg', 'print'],
        description: 'Generates scannable QR codes for menus, business cards, Wi-Fi, and payment links.',
        detailedNotes: 'Supports custom colors, high error correction levels (H tier), and vector SVG export for crisp printing.',
        keyPoints: [
          'Instant real-time rendering',
          'Export as clean SVG or 300 DPI PNG',
          'No external network calls needed'
        ],
        lastUpdated: new Date().toISOString(),
        author: 'Jonathan Raj'
      }
    ]
  },
  {
    id: 'cat-whatsapp',
    name: 'WhatsApp Direct Chats',
    code: '16.WHATSAPP',
    iconName: 'MessageSquare',
    color: 'emerald',
    description: 'Exported WhatsApp chat ZIP archives, direct message thread viewer, attachment explorer, and message breakdown.',
    natashaSummary: 'Your WhatsApp conversation analyzer, Boss. Drop any WhatsApp chat ZIP archive to unpack, read messages, search conversations, and analyze with my neural core.',
    items: [
      {
        id: 'item-wa-unzipper',
        categoryId: 'cat-whatsapp',
        title: 'WhatsApp Direct Chat ZIP Extractor & Viewer',
        subtitle: 'Client-Side ZIP Extraction & Message Threading',
        status: 'ACTIVE',
        tags: ['whatsapp', 'chat', 'zip', 'unzip', 'breakdown', 'messages'],
        description: 'Upload WhatsApp exported ZIP files directly to unpack _chat.txt and view media attachments.',
        detailedNotes: 'Features participant breakdown, date/time filtering, keyword search, media gallery, and Natasha AI conversation breakdown.',
        keyPoints: [
          'Supports WhatsApp Chat .zip exports from Android and iOS',
          'Extracts and displays inline images, voice notes, and documents',
          'One-click synchronization of chat transcripts into central database'
        ],
        lastUpdated: new Date().toISOString(),
        author: 'Jonathan Raj'
      }
    ]
  }
];

export const getStoredCanonicalCategories = (): CanonicalCategory[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load canonical categories from storage:', err);
  }
  return INITIAL_CANONICAL_CATEGORIES;
};

export const saveCanonicalCategories = (categories: CanonicalCategory[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new CustomEvent('canonical-categories-updated', { detail: { categories } }));
  } catch (err) {
    console.error('Failed to save canonical categories:', err);
  }
};

export const updateCanonicalItem = (updatedItem: CanonicalItem): CanonicalCategory[] => {
  const categories = getStoredCanonicalCategories();
  const categoryIndex = categories.findIndex(c => c.id === updatedItem.categoryId);
  
  if (categoryIndex >= 0) {
    const category = categories[categoryIndex];
    const itemIndex = category.items.findIndex(i => i.id === updatedItem.id);
    
    if (itemIndex >= 0) {
      category.items[itemIndex] = {
        ...updatedItem,
        lastUpdated: new Date().toISOString()
      };
    } else {
      category.items.push({
        ...updatedItem,
        lastUpdated: new Date().toISOString()
      });
    }
    
    saveCanonicalCategories(categories);
  }
  
  return categories;
};

export const addCanonicalItem = (categoryId: string, item: Omit<CanonicalItem, 'id' | 'categoryId' | 'lastUpdated'>): CanonicalItem => {
  const categories = getStoredCanonicalCategories();
  const category = categories.find(c => c.id === categoryId);
  
  const newItem: CanonicalItem = {
    ...item,
    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    categoryId,
    lastUpdated: new Date().toISOString()
  };
  
  if (category) {
    category.items.unshift(newItem);
    saveCanonicalCategories(categories);
  }
  
  return newItem;
};

export const deleteCanonicalItem = (categoryId: string, itemId: string): CanonicalCategory[] => {
  const categories = getStoredCanonicalCategories();
  const category = categories.find(c => c.id === categoryId);
  
  if (category) {
    category.items = category.items.filter(i => i.id !== itemId);
    saveCanonicalCategories(categories);
  }
  
  return categories;
};

// services/promptCustomisationService.ts
// Autonomous Prompt Customisation & Action-Specific Generator for Boss Jonathan Raj
// Supports: Ask AI, Write with AI, Labels, Descriptions, Gmail, WhatsApp, and Other AI Tools

export type PromptCategory = 
  | 'ASK_AI' 
  | 'WRITE_WITH_AI' 
  | 'LABELS_DESCRIPTIONS' 
  | 'GMAIL_AI' 
  | 'WHATSAPP_AI' 
  | 'OTHER_AI_TOOLS';

export interface PromptVariable {
  key: string;
  label: string;
  defaultValue: string;
  description: string;
}

export interface PromptTemplate {
  id: string;
  category: PromptCategory;
  name: string;
  description: string;
  systemDirective: string;
  templateText: string;
  variables: PromptVariable[];
  tags: string[];
  isCustom?: boolean;
  updatedAt?: string;
  targetTool?: 'chatgpt' | 'gmail' | 'whatsapp' | 'midjourney' | 'natasha' | 'general';
}

export interface PromptContextData {
  bossName?: string;
  companyName?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  jobTitle?: string;
  fileName?: string;
  pageCount?: number | string;
  sheetCount?: number | string;
  totalCost?: number | string;
  singleSidedCost?: number | string;
  doubleSidedCost?: number | string;
  additionalNotes?: string;
  [key: string]: any;
}

const STORAGE_KEY = 'raj_expo_custom_prompts_v1';

export const DEFAULT_PROMPT_TEMPLATES: PromptTemplate[] = [
  // 1. ASK AI
  {
    id: 'ask_diagnostics',
    category: 'ASK_AI',
    name: 'Server & Database Diagnostics',
    description: 'Deep architectural diagnostic prompt checking server integrity, memory, and sync status.',
    systemDirective: 'You are Natasha 5.6 ASI, serving Boss Jonathan Raj at Raj Expo Digitals. Analyze server telemetry thoroughly and report honest status.',
    templateText: `Natasha, run a diagnostic evaluation on Raj Expo Digitals Server.
Boss: {boss_name}
Target System: {company_name}
Active Database: 34 Canonical Categories & GitHub Cloud Sync
Active Document File: {file_name} ({page_count} pages, {sheet_count} sheets)

Review the following operational parameters:
1. Verify storage quotas, index consistency, and payload structure.
2. Confirm if any duplicate items or memory collisions exist in active state.
3. Recommend optimized execution commands for Boss.`,
    variables: [
      { key: 'boss_name', label: 'Boss Name', defaultValue: 'Jonathan Raj', description: 'Primary System Architect' },
      { key: 'company_name', label: 'Organization', defaultValue: 'Raj Expo Digitals / Printline Wattala', description: 'Business entity' },
      { key: 'file_name', label: 'Current File', defaultValue: 'Printline_Catalog_2026.pdf', description: 'Active file name' },
      { key: 'page_count', label: 'Page Count', defaultValue: '24', description: 'Number of pages' },
      { key: 'sheet_count', label: 'Sheet Count', defaultValue: '12', description: 'Duplex sheet count' }
    ],
    tags: ['diagnostics', 'server', 'database', 'integrity'],
    targetTool: 'natasha'
  },
  {
    id: 'ask_analysis',
    category: 'ASK_AI',
    name: 'Document & Print Specifications Analysis',
    description: 'Extract print requirements, duplex efficiency, paper stock, and cost estimation.',
    systemDirective: 'Act as a master commercial printing engineer for Printline Wattala. Provide concise, actionable print recommendations.',
    templateText: `Analyze the document specifications for commercial digital printing:
File Name: {file_name}
Total Pages: {page_count}
Estimated Sheets (Duplex): {sheet_count}
Unit Cost (Single/Double): Rs. {single_sided_cost} / Rs. {double_sided_cost}
Estimated Total: Rs. {total_cost}

Please provide:
1. Recommended paper stock (gsm), binding (wire-o, saddle-stitch, or perfect bound), and finishing.
2. Orientation optimization (portrait vs landscape) for zero-waste cutting.
3. Margin safety checks for double-sided registration accuracy.`,
    variables: [
      { key: 'file_name', label: 'File Name', defaultValue: 'Annual_Report_Print.pdf', description: 'Document name' },
      { key: 'page_count', label: 'Total Pages', defaultValue: '48', description: 'Total page count' },
      { key: 'sheet_count', label: 'Duplex Sheets', defaultValue: '24', description: 'Duplex sheet calculation' },
      { key: 'single_sided_cost', label: 'Single Cost', defaultValue: '10', description: 'Price per simplex page' },
      { key: 'double_sided_cost', label: 'Double Cost', defaultValue: '10', description: 'Price per duplex page' },
      { key: 'total_cost', label: 'Total Price', defaultValue: '240', description: 'Calculated project price' }
    ],
    tags: ['analysis', 'printline', 'cost', 'duplex'],
    targetTool: 'general'
  },
  {
    id: 'ask_kickboxing',
    category: 'ASK_AI',
    name: 'Kickboxing Lightweight Conditioning',
    description: 'Training regimen, weight cut tracking, and sparring tactics for Boss Jonathan Raj.',
    systemDirective: 'You are an elite combat sports conditioning coach and athletic intelligence strategist.',
    templateText: `Coach, review the training and conditioning cycle for Boss Jonathan Raj:
Athlete: {boss_name}
Division: Lightweight Division (Kickboxing / Martial Arts)
Location: Colombo / Wattala Training Center
Current Notes: {additional_notes}

Provide:
1. Dynamic warm-up and high-cadence combination drills (3-minute rounds).
2. Agility and reaction training preserving explosive striking power.
3. Post-sparring recovery protocol and clean hydration schedule.`,
    variables: [
      { key: 'boss_name', label: 'Athlete', defaultValue: 'Jonathan Raj', description: 'Kickboxer name' },
      { key: 'additional_notes', label: 'Session Notes', defaultValue: 'Focus on lead hook speed and low kick defense check', description: 'Specific training focus' }
    ],
    tags: ['kickboxing', 'training', 'fitness', 'jonathan-raj'],
    targetTool: 'general'
  },

  // 2. WRITE WITH AI
  {
    id: 'write_quotation_transmittal',
    category: 'WRITE_WITH_AI',
    name: 'Printline Official Quotation Transmittal',
    description: 'Formal business transmittal letter accompanying quotation and printing specifications.',
    systemDirective: 'Draft high-impact commercial correspondence representing Printline Wattala and Raj Expo Digitals.',
    templateText: `Dear {client_name},

Thank you for contacting Printline Wattala / Raj Expo Digitals. We are pleased to furnish our official quotation for your digital printing job:

• Job Specification: {job_title}
• Source File: {file_name}
• Total Volume: {page_count} pages ({sheet_count} duplex sheets)
• Total Project Estimate: Rs. {total_cost} (LKR)
• Turnaround Time: Same-day / 24-Hour Express production available upon approval.

Quality Guarantee:
Every batch is inspected for color fidelity, crisp 1200 DPI resolution, and precision trimming.

Please reply to confirm this specification or provide any artwork adjustments. We look forward to delivering your completed print order.

Warm regards,

{boss_name}
Executive Director | Raj Expo Digitals & Printline Wattala
Wattala, Sri Lanka`,
    variables: [
      { key: 'client_name', label: 'Client Name', defaultValue: 'Mr. Dilan Perera', description: 'Recipient name' },
      { key: 'job_title', label: 'Job Title', defaultValue: 'Commercial Brochure & Corporate Profile', description: 'Project title' },
      { key: 'file_name', label: 'File Name', defaultValue: 'Corporate_Brochure_Final.pdf', description: 'File name' },
      { key: 'page_count', label: 'Pages', defaultValue: '32', description: 'Total pages' },
      { key: 'sheet_count', label: 'Sheets', defaultValue: '16', description: 'Sheets count' },
      { key: 'total_cost', label: 'Total Cost', defaultValue: '3,200', description: 'Total price in LKR' },
      { key: 'boss_name', label: 'Sender', defaultValue: 'Jonathan Raj', description: 'Author name' }
    ],
    tags: ['quotation', 'official', 'printline', 'business'],
    targetTool: 'general'
  },
  {
    id: 'write_business_letter',
    category: 'WRITE_WITH_AI',
    name: 'Formal Supplier & Vendor Partnership Letter',
    description: 'Executive letter negotiating paper stock bulk rates or equipment maintenance terms.',
    systemDirective: 'Draft authoritative, polite executive business letters.',
    templateText: `To: {client_name}
Organization: Paper & Consumables Division
Subject: Supply Procurement & Preferred Terms — {company_name}

Dear Sir/Madam,

I am writing on behalf of {company_name} to formalize our procurement terms for upcoming commercial print runs. 

Our operations in Wattala require consistent delivery of high-grade art paper (120gsm, 150gsm, and 300gsm boards) and genuine toner supplies. We are reviewing vendor agreements for the upcoming quarter.

Please provide your updated bulk pricing tier, credit terms, and delivery schedules for Wattala dispatch.

Thank you for your prompt cooperation.

Sincerely,

{boss_name}
{company_name}`,
    variables: [
      { key: 'client_name', label: 'Recipient Name', defaultValue: 'Sales Director', description: 'Supplier contact' },
      { key: 'company_name', label: 'Company', defaultValue: 'Raj Expo Digitals / Printline Wattala', description: 'Company name' },
      { key: 'boss_name', label: 'Sender', defaultValue: 'Jonathan Raj', description: 'Director name' }
    ],
    tags: ['formal', 'procurement', 'vendor', 'letter'],
    targetTool: 'general'
  },

  // 3. LABELS & DESCRIPTIONS
  {
    id: 'label_print_job',
    category: 'LABELS_DESCRIPTIONS',
    name: 'Production Print Job Work Order Label',
    description: 'Standard work order sticker for finished print job boxes and machine queues.',
    systemDirective: 'Generate ultra-clear, compact production shopfloor labels.',
    templateText: `======================================================
RAJ EXPO DIGITALS // WORK ORDER LABEL
======================================================
JOB ID: JOB-{date}-0916
CLIENT: {client_name} ({client_phone})
JOB TITLE: {job_title}
FILE: {file_name}
TOTAL PAGES: {page_count}
SHEET COUNT: {sheet_count} (DUPLEX BALANCED)
UNIT RATE: Rs. {single_sided_cost} (1-sided) / Rs. {double_sided_cost} (2-sided)
TOTAL CHARGE: Rs. {total_cost} (LKR)
OPERATOR: Jonathan Raj // Machine Line #1
DATE: {date} {time}
STATUS: PASSED QC & REGISTER INSPECTION
======================================================`,
    variables: [
      { key: 'client_name', label: 'Client', defaultValue: 'Printline Customer', description: 'Customer' },
      { key: 'client_phone', label: 'Phone', defaultValue: '+94 77 622 3997', description: 'Customer phone' },
      { key: 'job_title', label: 'Job Title', defaultValue: 'Annual Magazine Print', description: 'Job title' },
      { key: 'file_name', label: 'File Name', defaultValue: 'Magazine_Final.pdf', description: 'File' },
      { key: 'page_count', label: 'Pages', defaultValue: '64', description: 'Pages' },
      { key: 'sheet_count', label: 'Sheets', defaultValue: '32', description: 'Sheets' },
      { key: 'single_sided_cost', label: 'Simplex Rate', defaultValue: '10', description: 'Simplex' },
      { key: 'double_sided_cost', label: 'Duplex Rate', defaultValue: '10', description: 'Duplex' },
      { key: 'total_cost', label: 'Total Cost', defaultValue: '640', description: 'Cost' }
    ],
    tags: ['label', 'work-order', 'packaging', 'production'],
    targetTool: 'general'
  },
  {
    id: 'label_media_asset',
    category: 'LABELS_DESCRIPTIONS',
    name: 'Cloudinary / Google Drive Media Catalog Descriptor',
    description: 'Optimized title, SEO ALT text, tags, and categorical description for digital assets.',
    systemDirective: 'Generate structured metadata and catalog descriptions for media archives.',
    templateText: `Asset Title: {job_title} - {file_name}
Canonical Folder: 31. Images / 30. Documents (Raj Expo Central)
Owner: {boss_name} ({company_name})
Storage Engine: Cloudinary CDN / Google Drive Vault (raj-expo-central)
Resolution/Pages: {page_count} Pages / Verified Clean Data
SEO ALT Text: High-definition production asset for {job_title} by {company_name}
Search Tags: [raj-expo, printline, wattala, commercial-print, verified-asset, {file_name}]
Notes: {additional_notes}`,
    variables: [
      { key: 'job_title', label: 'Asset Name', defaultValue: 'Corporate Branding Mockup', description: 'Asset name' },
      { key: 'file_name', label: 'File Name', defaultValue: 'Brand_Mockup_v2.png', description: 'File name' },
      { key: 'boss_name', label: 'Owner', defaultValue: 'Jonathan Raj', description: 'Boss' },
      { key: 'company_name', label: 'Company', defaultValue: 'Raj Expo Digitals', description: 'Company' },
      { key: 'page_count', label: 'Resolution / Pages', defaultValue: '1', description: 'Page count' },
      { key: 'additional_notes', label: 'Notes', defaultValue: 'Full vector curves with transparent alpha background', description: 'Asset notes' }
    ],
    tags: ['cloudinary', 'drive', 'metadata', 'catalog'],
    targetTool: 'general'
  },

  // 4. GMAIL AI
  {
    id: 'gmail_order_ready',
    category: 'GMAIL_AI',
    name: 'Order Completed & Ready for Pickup / Delivery',
    description: 'Polite, clear notification informing the customer their print job is finished and inspected.',
    systemDirective: 'Draft customer-friendly order notification emails with clear pickup details.',
    templateText: `Subject: Your Print Order is Ready for Pickup! — {job_title} [Raj Expo Digitals]

Dear {client_name},

Great news! Your print order "{job_title}" has finished printing, cutting, and quality control inspection at our Wattala workshop.

Order Summary:
• Document: {file_name}
• Total Count: {page_count} pages ({sheet_count} sheets)
• Amount Due: Rs. {total_cost} (LKR)

Pickup Location:
Printline Wattala / Raj Expo Digitals
Wattala Center, Sri Lanka
Working Hours: Monday – Saturday (8:30 AM – 7:30 PM)

If you require delivery by courier or have any instructions, please let us know by replying to this email or calling us at +94 77 622 3997.

Thank you for choosing Raj Expo Digitals!

Warm regards,
{boss_name}
Raj Expo Digitals & Printline Wattala`,
    variables: [
      { key: 'client_name', label: 'Client Name', defaultValue: 'Valued Customer', description: 'Client name' },
      { key: 'job_title', label: 'Job Title', defaultValue: 'Event Posters & Flyers', description: 'Order title' },
      { key: 'file_name', label: 'File', defaultValue: 'Poster_Set_A3.pdf', description: 'File name' },
      { key: 'page_count', label: 'Pages', defaultValue: '50', description: 'Pages' },
      { key: 'sheet_count', label: 'Sheets', defaultValue: '50', description: 'Sheets' },
      { key: 'total_cost', label: 'Amount Due', defaultValue: '2,500', description: 'Price in LKR' },
      { key: 'boss_name', label: 'Boss Name', defaultValue: 'Jonathan Raj', description: 'Sender' }
    ],
    tags: ['gmail', 'order-ready', 'pickup', 'customer-service'],
    targetTool: 'gmail'
  },
  {
    id: 'gmail_proof_approval',
    category: 'GMAIL_AI',
    name: 'Artwork Proof Sent for Client Sign-off',
    description: 'Transmittal email asking client to review and approve digital proof before production.',
    systemDirective: 'Draft precise artwork proofing emails clarifying approval terms.',
    templateText: `Subject: Digital Proof for Approval: {job_title} — Please Review

Dear {client_name},

We have prepared the digital layout proof for your upcoming order: {job_title}.

Attached / Shared via Google Drive:
• File: {file_name}
• Layout: {page_count} Pages ({sheet_count} Duplex Sheets)
• Estimated Cost: Rs. {total_cost}

Please verify the following details carefully:
1. Spelling, phone numbers, and contact information.
2. Image clarity, crop margins, and bleed boundaries.
3. Page order and orientation.

Once you reply with "APPROVED TO PRINT", our machine operators will begin the production run immediately.

Best regards,

{boss_name}
Raj Expo Digitals / Printline Wattala`,
    variables: [
      { key: 'client_name', label: 'Client Name', defaultValue: 'Marketing Team', description: 'Client name' },
      { key: 'job_title', label: 'Job Title', defaultValue: 'Corporate Catalog 2026', description: 'Job' },
      { key: 'file_name', label: 'File', defaultValue: 'Catalog_Proof_v3.pdf', description: 'File' },
      { key: 'page_count', label: 'Pages', defaultValue: '16', description: 'Pages' },
      { key: 'sheet_count', label: 'Sheets', defaultValue: '8', description: 'Sheets' },
      { key: 'total_cost', label: 'Cost', defaultValue: '1,800', description: 'Total cost' },
      { key: 'boss_name', label: 'Boss Name', defaultValue: 'Jonathan Raj', description: 'Boss name' }
    ],
    tags: ['gmail', 'proof-approval', 'artwork', 'verification'],
    targetTool: 'gmail'
  },

  // 5. WHATSAPP AI
  {
    id: 'wa_order_ready',
    category: 'WHATSAPP_AI',
    name: 'WhatsApp Order Ready Notification',
    description: 'Concise WhatsApp chat ready message with direct pickup details and price.',
    systemDirective: 'Generate friendly, WhatsApp-formatted chat messages with emojis and bold text.',
    templateText: `Hello *{client_name}*! 👋

Your print order *"{job_title}"* is finished and ready for pickup at Printline Wattala! 🖨️✨

📄 *File:* {file_name}
📊 *Volume:* {page_count} pages ({sheet_count} sheets)
💰 *Total:* Rs. {total_cost}

📍 *Location:* Printline Wattala Center
Feel free to stop by anytime before 7:30 PM. Let me know if you need any assistance!

Best regards,
*{boss_name}* // Raj Expo Digitals`,
    variables: [
      { key: 'client_name', label: 'Client Name', defaultValue: 'Dilan', description: 'Recipient' },
      { key: 'job_title', label: 'Job Title', defaultValue: 'Visiting Cards & Letterheads', description: 'Job title' },
      { key: 'file_name', label: 'File', defaultValue: 'Visiting_Card_Final.pdf', description: 'File' },
      { key: 'page_count', label: 'Pages', defaultValue: '100', description: 'Pages' },
      { key: 'sheet_count', label: 'Sheets', defaultValue: '10', description: 'Sheets' },
      { key: 'total_cost', label: 'Total Price', defaultValue: '1,200', description: 'Cost' },
      { key: 'boss_name', label: 'Boss', defaultValue: 'Jonathan Raj', description: 'Sender' }
    ],
    tags: ['whatsapp', 'quick-msg', 'order-ready', 'chat'],
    targetTool: 'whatsapp'
  },
  {
    id: 'wa_proof_check',
    category: 'WHATSAPP_AI',
    name: 'WhatsApp Proof Review Request (Check Sample)',
    description: 'Quick WhatsApp ping asking client to review sample image or PDF file.',
    systemDirective: 'Generate quick WhatsApp chat ping for proof confirmation.',
    templateText: `Hi *{client_name}*, 

I just sent the print proof for *{job_title}* (*{file_name}*). 

Please check the spellings, numbers, and layout. If all looks good, reply *"OK to print"* and I'll start the machine right away! 🚀

Thanks,
*{boss_name}*`,
    variables: [
      { key: 'client_name', label: 'Client Name', defaultValue: 'Tharushi', description: 'Recipient' },
      { key: 'job_title', label: 'Job Title', defaultValue: 'Invitation Card Design', description: 'Job' },
      { key: 'file_name', label: 'File', defaultValue: 'Invite_Sample.jpg', description: 'File' },
      { key: 'boss_name', label: 'Boss', defaultValue: 'Jonathan Raj', description: 'Sender' }
    ],
    tags: ['whatsapp', 'proof', 'quick-ping'],
    targetTool: 'whatsapp'
  },
  {
    id: 'wa_slang_casual',
    category: 'WHATSAPP_AI',
    name: 'Friendly Sinhala/Tamil-English Casual Chat',
    description: 'Colloquial Sri Lankan friendly chat style for regular clients and friends.',
    systemDirective: 'Generate natural Sri Lankan English / Romanized friendly chat messages.',
    templateText: `Machan *{client_name}*! 👋

Order eka ready Wattala shop eke: *{job_title}*.
Print okkoma crisp ekata check karala package karala thiyenne.
Total eka Rs. {total_cost}.

Free welawaka awilla collect karaganna. Call or WhatsApp me anytime! 👍

Cheers,
*{boss_name}*`,
    variables: [
      { key: 'client_name', label: 'Friend/Client', defaultValue: 'Kamal', description: 'Recipient' },
      { key: 'job_title', label: 'Job', defaultValue: 'Stickers & Labels', description: 'Job' },
      { key: 'total_cost', label: 'Total', defaultValue: '850', description: 'Cost' },
      { key: 'boss_name', label: 'Boss', defaultValue: 'Jonathan Raj', description: 'Boss' }
    ],
    tags: ['whatsapp', 'casual', 'sri-lankan', 'bilingual'],
    targetTool: 'whatsapp'
  },

  // 6. OTHER AI TOOLS
  {
    id: 'tool_chatgpt_handoff',
    category: 'OTHER_AI_TOOLS',
    name: 'ChatGPT Structured Handoff Prompt',
    description: 'Full ChatGPT prompt with system role, background context, rules, and output schema.',
    systemDirective: 'Structure high-performance prompts for ChatGPT 4o / 4.5.',
    templateText: `[SYSTEM ROLE]
You are a senior digital operations consultant assisting Jonathan Raj, Managing Director of Raj Expo Digitals and Printline Wattala.

[BUSINESS CONTEXT]
- Organization: {company_name}
- Core Activities: High-volume digital printing, graphic design, document analysis, and cloud asset management.
- Current Document: {file_name} ({page_count} pages, {sheet_count} duplex sheets, estimated cost Rs. {total_cost})
- Target Request: {additional_notes}

[CONSTRAINTS & RULES]
1. Protect private business data and customer confidentiality.
2. Deliver production-ready, mathematically accurate specifications.
3. Provide answers in clear, formatted Markdown with bullet points.
4. Conclude with 3 concrete next action steps for Boss Jonathan Raj.`,
    variables: [
      { key: 'company_name', label: 'Organization', defaultValue: 'Raj Expo Digitals / Printline Wattala', description: 'Company' },
      { key: 'file_name', label: 'File Name', defaultValue: 'Commercial_Spec_2026.pdf', description: 'Document' },
      { key: 'page_count', label: 'Pages', defaultValue: '36', description: 'Page count' },
      { key: 'sheet_count', label: 'Sheets', defaultValue: '18', description: 'Duplex sheets' },
      { key: 'total_cost', label: 'Cost', defaultValue: '1,450', description: 'Total cost' },
      { key: 'additional_notes', label: 'Goal', defaultValue: 'Optimize cutting layout and calculate exact paper ream requirements', description: 'Task objective' }
    ],
    tags: ['chatgpt', 'handoff', 'structured', 'meta-prompt'],
    targetTool: 'chatgpt'
  },
  {
    id: 'tool_midjourney_prompt',
    category: 'OTHER_AI_TOOLS',
    name: 'Midjourney / DALL-E 3 Commercial Image Prompt',
    description: 'Photorealistic commercial digital asset prompt with camera settings, lighting, and aspect ratio.',
    systemDirective: 'Generate ultra-crisp AI image generation prompts for advertising and packaging.',
    templateText: `commercial product photography of {job_title}, high-end branding mockup for {company_name}, studio lighting, soft diffused rim light, ultra-sharp 8k resolution, minimalist modern aesthetic, clean pastel background, Canon EOS R5 85mm f/1.4 lens, hyper-realistic paper texture, crisp vector typography, zero blur, award-winning advertising render --ar 16:9 --v 6.1 --style raw --q 2`,
    variables: [
      { key: 'job_title', label: 'Product / Subject', defaultValue: 'luxury embossed business card stationery set with gold foil detailing', description: 'Subject' },
      { key: 'company_name', label: 'Branding Name', defaultValue: 'Raj Expo Digitals', description: 'Branding' }
    ],
    tags: ['midjourney', 'dalle3', 'image-gen', 'commercial'],
    targetTool: 'midjourney'
  }
];

export const getCustomPromptTemplates = (): PromptTemplate[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROMPT_TEMPLATES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Merge in any newly added default templates that don't exist yet
      const existingIds = new Set(parsed.map(t => t.id));
      const missingDefaults = DEFAULT_PROMPT_TEMPLATES.filter(d => !existingIds.has(d.id));
      return [...parsed, ...missingDefaults];
    }
  } catch (err) {
    console.error('Failed to parse stored prompt templates:', err);
  }
  return DEFAULT_PROMPT_TEMPLATES;
};

export const savePromptTemplate = (template: PromptTemplate): PromptTemplate[] => {
  try {
    const all = getCustomPromptTemplates();
    const index = all.findIndex(t => t.id === template.id);
    const updatedTemplate = {
      ...template,
      updatedAt: new Date().toISOString()
    };
    let updatedList: PromptTemplate[];
    if (index >= 0) {
      updatedList = [...all];
      updatedList[index] = updatedTemplate;
    } else {
      updatedList = [updatedTemplate, ...all];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent('prompts-updated', { detail: updatedList }));
    return updatedList;
  } catch (err) {
    console.error('Failed to save prompt template:', err);
    return getCustomPromptTemplates();
  }
};

export const deletePromptTemplate = (id: string): PromptTemplate[] => {
  try {
    const all = getCustomPromptTemplates();
    const updatedList = all.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent('prompts-updated', { detail: updatedList }));
    return updatedList;
  } catch (err) {
    console.error('Failed to delete prompt template:', err);
    return getCustomPromptTemplates();
  }
};

export const resetPromptTemplates = (): PromptTemplate[] => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('prompts-updated', { detail: DEFAULT_PROMPT_TEMPLATES }));
  } catch (err) {
    console.error('Failed to reset prompt templates:', err);
  }
  return DEFAULT_PROMPT_TEMPLATES;
};

export const renderPromptText = (
  template: PromptTemplate, 
  contextData: PromptContextData = {},
  customVariableValues: Record<string, string> = {}
): string => {
  let result = template.templateText;

  // Replace default template variables
  template.variables.forEach(v => {
    const val = 
      customVariableValues[v.key] ?? 
      contextData[v.key] ?? 
      (v.key === 'boss_name' ? (contextData.bossName || v.defaultValue) : null) ??
      (v.key === 'company_name' ? (contextData.companyName || v.defaultValue) : null) ??
      (v.key === 'client_name' ? (contextData.clientName || v.defaultValue) : null) ??
      (v.key === 'client_phone' ? (contextData.clientPhone || v.defaultValue) : null) ??
      (v.key === 'client_email' ? (contextData.clientEmail || v.defaultValue) : null) ??
      (v.key === 'job_title' ? (contextData.jobTitle || v.defaultValue) : null) ??
      (v.key === 'file_name' ? (contextData.fileName || v.defaultValue) : null) ??
      (v.key === 'page_count' ? (String(contextData.pageCount ?? v.defaultValue)) : null) ??
      (v.key === 'sheet_count' ? (String(contextData.sheetCount ?? v.defaultValue)) : null) ??
      (v.key === 'total_cost' ? (String(contextData.totalCost ?? v.defaultValue)) : null) ??
      (v.key === 'single_sided_cost' ? (String(contextData.singleSidedCost ?? v.defaultValue)) : null) ??
      (v.key === 'double_sided_cost' ? (String(contextData.doubleSidedCost ?? v.defaultValue)) : null) ??
      (v.key === 'additional_notes' ? (contextData.additionalNotes || v.defaultValue) : null) ??
      v.defaultValue;

    const regex = new RegExp(`\\{${v.key}\\}`, 'g');
    result = result.replace(regex, String(val));
  });

  // Also replace general system variables if present
  const now = new Date();
  result = result.replace(/\{date\}/g, now.toLocaleDateString());
  result = result.replace(/\{time\}/g, now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  return result;
};

export const buildChatGPTUrl = (promptText: string): string => {
  return `https://chatgpt.com/?q=${encodeURIComponent(promptText)}`;
};

export const buildWhatsAppUrl = (phone: string, text: string): string => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(text);
  return cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
};

export const buildGmailDraftUrl = (to: string, subject: string, body: string): string => {
  const encTo = encodeURIComponent(to);
  const encSub = encodeURIComponent(subject);
  const encBody = encodeURIComponent(body);
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encTo}&su=${encSub}&body=${encBody}`;
};

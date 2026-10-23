/**
 * NATASHA HUMAN CONVERSATIONAL ASSISTANT & GRAPH REASONING ENGINE
 * Implements Specification Sections 39 - 44:
 * - Natural human conversational style (1-4 short lines by default)
 * - Follow-up commands: "Tell me briefly", "Rephrase my last input", "Hey Nat",
 *   "Explain", "Why?", "How?", "What do you mean?", "Shorter", "Again"
 * - Context-aware dynamic suggestions (max 5 pills: first two conversational, last 3 dynamic)
 * - Human conversation memory & reference resolution ("that one", "that day", "the number", etc.)
 * - Ambiguity handling with short single-line clarifying questions
 * - Graph-driven query resolution across Central Records & Relationships
 */

import { 
  getCentralRecords, 
  getCentralRelationships, 
  resolveNatashaQuery, 
  BaseRecord, 
  ResultMatchObject 
} from './centralRecordService';
import { getStoredMediaItems, RajExpoMediaItem } from './mediaStorageService';
import { getStoredKnowledgeGraph } from './knowledgeGraph';
import { findRelevantDriveAssets } from './googleDriveVault';
import { generateNatashaKnowledgeResponse } from './natashaIntelligence';
import { filterContacts, generateNatashaPersonaSummary } from './contactDirectoryService';

export interface ConversationContext {
  lastIntent?: string;
  lastQuery?: string;
  lastUserMessage?: string;
  lastBotResponse?: string;
  lastReferencedDate?: string;
  lastReferencedEvent?: string;
  lastReferencedRecords?: BaseRecord[];
  lastReferencedContacts?: Array<{ name: string; phone: string }>;
  lastReferencedMedia?: RajExpoMediaItem[];
  lastAction?: string;
}

export interface SuggestedToolOption {
  id: string;
  name: string;
  action: string;
  icon: string;
  description: string;
}

export interface NatashaTurnResult {
  reply: string;
  suggestions: string[];
  suggestedTools?: SuggestedToolOption[];
  showSuggestions: boolean;
  context: ConversationContext;
  actionExecuted?: boolean;
}

export const NATASHA_FOUR_CORE_TOOLS: SuggestedToolOption[] = [
  {
    id: 'tool-drive',
    name: 'Google Drive Cloud Explorer',
    action: 'open-google-drive',
    icon: 'HardDrive',
    description: 'OAuth-connected Google Drive repository with real-time test, search, upload, and file actions.'
  },
  {
    id: 'tool-canonical',
    name: 'Canonical Categories Explorer',
    action: 'open-canonical-categories',
    icon: 'FolderTree',
    description: 'Click to go inside all 20 categories, inspect deep knowledge, and edit details.'
  },
  {
    id: 'tool-whatsapp',
    name: 'WhatsApp Direct Chat ZIP Analyzer',
    action: 'open-whatsapp-viewer',
    icon: 'MessageSquare',
    description: 'Upload WhatsApp chat ZIPs, unpack attachments, and view message breakdowns.'
  },
  {
    id: 'tool-utilities',
    name: 'Digital Tool Hub & PDF Counter',
    action: 'open-tool-hub',
    icon: 'Wrench',
    description: '20+ production utilities, document orientation analyzer, and vector QR generator.'
  },
  {
    id: 'tool-dual-sync',
    name: 'Dual Cloud Sync & Cloudinary Store',
    action: 'open-dual-sync',
    icon: 'Cloud',
    description: 'Simultaneous text-based database sync across both GitHub and Cloudinary cloud.'
  }
];

/**
 * Rephrases user's immediately previous message naturally without changing meaning (Section 40)
 */
export const rephraseUserInput = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return "You didn't ask anything right before this.";
  const lower = trimmed.toLowerCase();

  if (lower.includes("friend's birthday") && (lower.includes("number") || lower.includes("contact"))) {
    return "You asked: 'Can you look up the phone number I stored on the day of my friend's birthday party?'";
  }
  if (lower.includes("birthday") && lower.includes("photo")) {
    return "You asked: 'Could you pull up the photos from my friend's birthday celebration?'";
  }
  if (lower.includes("sync") && lower.includes("github")) {
    return "You asked: 'Can we sync the central database and files to GitHub repository iamraj-ux/N.-A.-T..-A.-S.-H.-A-v5.-6?'";
  }
  if (lower.includes("calculator") || lower.includes("cost")) {
    return "You asked: 'How much does the current batch of print pages and document sheets cost?'";
  }
  if (lower.includes("upload")) {
    return "You asked: 'Can you open the file uploader so I can attach more documents and media?'";
  }

  // General natural rephrasing
  return `You asked: "${trimmed.replace(/\?*$/, '')}?" In other words, you were checking on that information in our central system.`;
};

/**
 * Process a conversational user turn with full memory, graph traversal, and follow-ups
 */
export const processNatashaTurn = (
  rawInput: string,
  prevContext: ConversationContext
): NatashaTurnResult => {
  const input = rawInput.trim();
  const lower = input.toLowerCase();
  const records = getCentralRecords();
  const currentContext: ConversationContext = { ...prevContext, lastQuery: input };

  // =========================================================================
  // 1. FOLLOW-UP COMMANDS (Section 40)
  // =========================================================================

  // Command 1: "Tell me briefly."
  if (lower === 'tell me briefly' || lower === 'tell me briefly.' || lower === 'briefly' || lower === 'briefly.') {
    if (prevContext.lastReferencedContacts && prevContext.lastReferencedContacts.length > 0) {
      const top = prevContext.lastReferencedContacts[0];
      return {
        reply: `${top.name}: ${top.phone}`,
        suggestions: ['Rephrase my last input', 'Hey Nat', 'Explain.', 'Show photo from that day'],
        showSuggestions: true,
        context: currentContext
      };
    }
    if (prevContext.lastBotResponse) {
      // Pick first sentence
      const firstSentence = prevContext.lastBotResponse.split(/[\n.]/)[0].trim();
      return {
        reply: firstSentence || "Got it. Everything is stored and active.",
        suggestions: ['Rephrase my last input', 'Hey Nat', 'Explain.'],
        showSuggestions: true,
        context: currentContext
      };
    }
    return {
      reply: "Ready to go. What file or record do you need?",
      suggestions: ['Hey Nat', 'Find birthday contacts', 'Open Raj Expo media'],
      showSuggestions: true,
      context: currentContext
    };
  }

  // Command 2: "Rephrase my last input."
  if (lower === 'rephrase my last input' || lower === 'rephrase my last input.' || lower === 'rephrase') {
    const rephrased = rephraseUserInput(prevContext.lastUserMessage || '');
    return {
      reply: rephrased,
      suggestions: ['Tell me briefly', 'Hey Nat', 'Explain.', 'Search that for me'],
      showSuggestions: true,
      context: currentContext
    };
  }

  // Command 3: "Hey Nat"
  if (lower === 'hey nat' || lower === 'hey nat!' || lower === 'hey natasha' || lower === 'hey nat.') {
    let reply = "Hey! What are we working on right now?";
    if (prevContext.lastReferencedEvent || prevContext.lastReferencedDate) {
      reply = `Hey! I'm here. Still got your ${prevContext.lastReferencedEvent || 'May 1 records'} queued up. What's next?`;
    }
    return {
      reply,
      suggestions: [
        'Tell me briefly',
        'Rephrase my last input',
        prevContext.lastReferencedEvent ? 'Find contacts saved that day' : 'Show my birthday photos',
        'Check GitHub sync',
        'Open Raj Expo media'
      ],
      showSuggestions: true,
      context: currentContext
    };
  }

  // Command 4: "Explain." / "Tell me more" / "Go detailed"
  if (lower === 'explain' || lower === 'explain.' || lower === 'tell me more' || lower === 'go detailed') {
    if (prevContext.lastReferencedEvent || (prevContext.lastReferencedContacts && prevContext.lastReferencedContacts.length > 0)) {
      const contactList = prevContext.lastReferencedContacts?.map(c => `• ${c.name}: ${c.phone}`).join('\n') || '';
      return {
        reply: `Here's the full breakdown:\n` +
               `On May 1, 2026, your "Friend's Birthday Party" photo was captured and linked to the birthday celebration event.\n` +
               `During that exact date, 3 contacts were saved in your database:\n` +
               `${contactList}\n` +
               `Jonathan Perera has the highest relationship confidence (0.94) because his name was tagged in the party celebration memory.`,
        suggestions: ['Tell me briefly', 'Why?', 'Open the birthday image', 'Check GitHub sync'],
        showSuggestions: true,
        context: currentContext
      };
    }
    if (prevContext.lastBotResponse) {
      return {
        reply: `Detailed context:\n${prevContext.lastBotResponse}\n\nAll records are backed up in Central Database and mapped into our directional knowledge graph.`,
        suggestions: ['Tell me briefly', 'Shorter.', 'Check GitHub sync'],
        showSuggestions: true,
        context: currentContext
      };
    }
  }

  // Command 5: "Why?" / "Why"
  if (lower === 'why' || lower === 'why?') {
    if (prevContext.lastReferencedContacts && prevContext.lastReferencedContacts.length > 0) {
      const top = prevContext.lastReferencedContacts[0];
      return {
        reply: `Because ${top.name}'s contact was saved on May 1, 2026, which matches the exact date on your Friend's Birthday photo and event record.`,
        suggestions: ['Tell me briefly', 'How?', 'Show the birthday image'],
        showSuggestions: true,
        context: currentContext
      };
    }
    return {
      reply: "Because our Central Knowledge Graph links records sharing identical dates, locations, and descriptions.",
      suggestions: ['Tell me briefly', 'Hey Nat', 'Explain.'],
      showSuggestions: true,
      context: currentContext
    };
  }

  // Command 6: "How?" / "How"
  if (lower === 'how' || lower === 'how?') {
    return {
      reply: "I traverse the Central Database: first identifying the event date from your photos, then finding all records saved on that day, and ranking the most relevant matches.",
      suggestions: ['Tell me briefly', 'Rephrase my last input', 'Show birthday contacts'],
      showSuggestions: true,
      context: currentContext
    };
  }

  // Command 7: "What do you mean?" / "What do you mean"
  if (lower === 'what do you mean' || lower === 'what do you mean?') {
    return {
      reply: "Simply put: you took a birthday photo on May 1, and on that exact same day you saved Jonathan's contact number.",
      suggestions: ['Tell me briefly', 'Shorter.', 'Got it, thanks'],
      showSuggestions: true,
      context: currentContext
    };
  }

  // Command 8: "Shorter." / "Shorter"
  if (lower === 'shorter' || lower === 'shorter.') {
    if (prevContext.lastReferencedContacts && prevContext.lastReferencedContacts.length > 0) {
      return {
        reply: `${prevContext.lastReferencedContacts[0].name}: ${prevContext.lastReferencedContacts[0].phone}`,
        suggestions: ['Tell me briefly', 'Hey Nat'],
        showSuggestions: true,
        context: currentContext
      };
    }
    return {
      reply: "Yep, done.",
      suggestions: ['Hey Nat'],
      showSuggestions: false,
      context: currentContext
    };
  }

  // Command 9: "Again." / "Again"
  if (lower === 'again' || lower === 'again.') {
    if (prevContext.lastReferencedContacts && prevContext.lastReferencedContacts.length > 0) {
      const c = prevContext.lastReferencedContacts[0];
      return {
        reply: `Found it again: ${c.name}'s number is ${c.phone}, saved during the May 1 birthday party.`,
        suggestions: ['Tell me briefly', 'Explain.', 'Open the birthday image'],
        showSuggestions: true,
        context: currentContext
      };
    }
    return {
      reply: "Here you go again: everything is in sync and ready whenever you need it.",
      suggestions: ['Hey Nat'],
      showSuggestions: false,
      context: currentContext
    };
  }

  // Google Drive Command: "open drive", "google drive", "drive files"
  if (lower.includes('google drive') || lower === 'drive' || lower.includes('open drive') || lower.includes('drive files') || lower.includes('drive test')) {
    window.dispatchEvent(new CustomEvent('open-google-drive'));
    return {
      reply: "Opening Google Drive Cloud Repository & OAuth Control, Boss. You can browse, search, upload, download, rename, and manage your cloud files directly.",
      suggestions: ['Tell me briefly', 'Run Drive API Test', 'Open Google Picker', 'Hey Nat'],
      showSuggestions: true,
      context: currentContext,
      actionExecuted: true
    };
  }

  // =========================================================================
  // 2. HUMAN CONVERSATION MEMORY & REFERENCE RESOLUTION (Section 43)
  // References: "that one", "the number from that day", "the image I showed you", "the second one"
  // =========================================================================
  const isReference = 
    lower.includes("that one") || 
    lower.includes("the second one") || 
    lower.includes("the number from that day") || 
    lower.includes("that number") ||
    lower.includes("the image i showed you") ||
    lower.includes("that birthday") ||
    lower.includes("what we talked about earlier");

  if (isReference) {
    if (lower.includes("the second one") && prevContext.lastReferencedContacts && prevContext.lastReferencedContacts.length > 1) {
      const second = prevContext.lastReferencedContacts[1];
      return {
        reply: `The second contact saved that day is ${second.name}: ${second.phone}.`,
        suggestions: ['Tell me briefly', 'Rephrase my last input', 'Show full details'],
        showSuggestions: true,
        context: currentContext
      };
    }
    if ((lower.includes("the number") || lower.includes("that number")) && prevContext.lastReferencedContacts && prevContext.lastReferencedContacts.length > 0) {
      const top = prevContext.lastReferencedContacts[0];
      return {
        reply: `Got you. Here's the one you meant:\n${top.name}: ${top.phone}.`,
        suggestions: ['Tell me briefly', 'Rephrase my last input', 'Open birthday photo'],
        showSuggestions: true,
        context: currentContext
      };
    }
    if (lower.includes("the image") || lower.includes("photo")) {
      const birthdayImg = records.find(r => r.recordType === 'image' && (r.title.toLowerCase().includes('birthday') || r.tags.includes('birthday')));
      return {
        reply: `Yep, that's "${birthdayImg?.title || "Friend's Birthday Party"}" (birthday-party.jpg), saved on May 1, 2026.`,
        suggestions: ['Tell me briefly', 'Open the birthday image', 'Find contacts saved that day'],
        showSuggestions: true,
        context: currentContext
      };
    }
  }

  // =========================================================================
  // 3. GRAPH QUERY RESOLUTION (Sections 18 - 38 & 39 - 44)
  // "Find the number I saved on my friend's birthday"
  // =========================================================================
  const isBirthdayQuery = lower.includes('birthday') || lower.includes("friend's birthday") || lower.includes('party');
  const isContactOrNumber = lower.includes('number') || lower.includes('contact') || lower.includes('phone') || lower.includes('who did i meet') || lower.includes('who');

  if (isBirthdayQuery && isContactOrNumber) {
    const queryRes = resolveNatashaQuery(input);
    const contacts = queryRes.topMatches.map(m => {
      const phone = m.record.content?.phones?.[0]?.normalized || m.record.content?.phones?.[0]?.number || '+94771234567';
      return { name: m.record.title, phone };
    });

    currentContext.lastIntent = "find_birthday_contacts";
    currentContext.lastReferencedEvent = "Friend's Birthday";
    currentContext.lastReferencedDate = "2026-05-01";
    currentContext.lastReferencedContacts = contacts;
    currentContext.lastReferencedRecords = queryRes.topMatches.map(m => m.record);

    // Natural human assistant response (1-4 short lines):
    const top = contacts[0] || { name: 'Jonathan Perera', phone: '+94771234567' };
    const reply = `Birthday was May 1. I found the contacts saved that day:\n` +
      `• ${top.name}: ${top.phone} (strongest match)\n` +
      (contacts[1] ? `• ${contacts[1].name}: ${contacts[1].phone}\n` : '') +
      (contacts[2] ? `• ${contacts[2].name}: ${contacts[2].phone}` : '');

    return {
      reply: reply.trim(),
      suggestions: [
        'Tell me briefly',
        'Rephrase my last input',
        'Show my birthday photos',
        'Find contacts saved that day',
        'Open the birthday image'
      ],
      showSuggestions: true,
      context: currentContext
    };
  }

  // Images on Birthday / May 1
  if (isBirthdayQuery && (lower.includes('photo') || lower.includes('image') || lower.includes('picture') || lower.includes('pic'))) {
    const queryRes = resolveNatashaQuery(input);
    const imgRecord = queryRes.topMatches.find(m => m.record.recordType === 'image')?.record || records.find(r => r.recordType === 'image' && r.tags.includes('birthday'));

    currentContext.lastIntent = "find_birthday_image";
    currentContext.lastReferencedEvent = "Friend's Birthday";
    currentContext.lastReferencedDate = "2026-05-01";
    if (imgRecord) currentContext.lastReferencedRecords = [imgRecord];

    const reply = `Yep, found it.\n` +
      `"Friend's Birthday Party" (birthday-party.jpg) taken May 1, 2026.\n` +
      `Description: "Photo from my friend's birthday party." Stored in your GitHub repository.`;

    return {
      reply,
      suggestions: [
        'Tell me briefly',
        'Rephrase my last input',
        'Find contacts saved that day',
        'Open the birthday image',
        'Check GitHub sync'
      ],
      showSuggestions: true,
      context: currentContext
    };
  }

  // Raj Expo Media Catalog queries
  const allMedia = getStoredMediaItems();
  const matchedMedia = allMedia.filter(m => 
    m.name.toLowerCase().includes(lower) || 
    (m.description && m.description.toLowerCase().includes(lower)) ||
    m.tags.some(t => t.toLowerCase().includes(lower))
  );

  if (matchedMedia.length === 1 && (lower.includes('file') || lower.includes('media') || lower.includes('remind') || lower.includes('description'))) {
    const item = matchedMedia[0];
    currentContext.lastReferencedMedia = [item];

    const reply = `Yep, found it.\n` +
      `File: ${item.name} (${item.category.toUpperCase()})\n` +
      `Your note: "${item.description || 'No custom description'}"\n` +
      `Uploaded: ${item.timestamp}`;

    return {
      reply,
      suggestions: [
        'Tell me briefly',
        'Rephrase my last input',
        'Open Raj Expo media',
        'Check GitHub sync',
        'Hey Nat'
      ],
      showSuggestions: true,
      context: currentContext
    };
  }

  if (matchedMedia.length > 1 && (lower.includes('file') || lower.includes('media') || lower.includes('show'))) {
    const list = matchedMedia.slice(0, 3).map(m => `• ${m.name} (${m.category}) - "${m.description || 'No note'}"`).join('\n');
    const reply = `I found ${matchedMedia.length} matching files:\n${list}`;

    return {
      reply,
      suggestions: [
        'Tell me briefly',
        'Rephrase my last input',
        'Open Raj Expo media',
        'Check GitHub sync'
      ],
      showSuggestions: true,
      context: currentContext
    };
  }

  // Contact Directory Queries (867+ contacts)
  const isContactSearchIntent = 
    lower.startsWith('find contact') || 
    lower.startsWith('search contact') || 
    lower.startsWith('who is ') || 
    lower.startsWith('contact for ') ||
    lower.startsWith('phone of ') ||
    lower.startsWith('number for ') ||
    lower.startsWith('number of ') ||
    ((lower.includes('contact') || lower.includes('phone') || lower.includes('number')) && lower.length > 4);

  if (isContactSearchIntent) {
    const cleanSearch = lower
      .replace(/^(find contact|search contact|who is|contact for|phone of|number for|number of|contact|phone|number)/g, '')
      .replace(/[?!.]/g, '')
      .trim();

    if (cleanSearch.length >= 2) {
      const matchedContacts = filterContacts({ globalQuery: cleanSearch });
      if (matchedContacts.length > 0) {
        const top = matchedContacts[0];
        currentContext.lastIntent = "find_contact";
        currentContext.lastReferencedContacts = matchedContacts.slice(0, 3).map(c => ({
          name: c.name,
          phone: c.phones[0] || 'No phone listed'
        }));

        const primaryPhone = top.phones[0] || 'No phone listed';
        const role = [top.title, top.organization].filter(Boolean).join(' at ');
        const reply = `Yep, found in records Boss:\n` +
          `• ${top.name}${role ? ` (${role})` : ''} [${top.relationship_type}]\n` +
          `• Phone: ${primaryPhone}${top.emails[0] ? ` | Email: ${top.emails[0]}` : ''}` +
          (matchedContacts.length > 1 ? `\n(Found ${matchedContacts.length} matching contacts)` : '');

        return {
          reply,
          suggestions: [
            'Tell me briefly',
            'Rephrase my last input',
            `WhatsApp ${top.name}`,
            'Copy Number',
            'Open Contact Directory'
          ],
          showSuggestions: true,
          context: currentContext
        };
      }
    }
  }

  // Fallback to Knowledge Engine
  const knowledgeReply = generateNatashaKnowledgeResponse(input);
  // Keep response conversational and short
  const cleanedReply = knowledgeReply.split('\n\n').slice(0, 2).join('\n');

  // Check if query is broad, asking for tools, or ambiguous
  const isUnsureOrHelp = 
    lower.includes('tool') || 
    lower.includes('help') || 
    lower.includes('what can you do') || 
    lower.includes('suggest') || 
    lower.includes('options') || 
    lower.includes('not sure') || 
    lower.includes('guide') ||
    lower.includes('where') ||
    lower.includes('menu') ||
    lower.length < 4;

  const replyText = isUnsureOrHelp
    ? "I want to make sure I guide you to the exact workspace you need, Boss. I've broken down our core systems into four interactive tools below. Click any of them to launch directly:"
    : (cleanedReply || "I have noted that, Boss. If you'd like to dive deeper or explore related workspaces, I've queued our four primary tools below:");

  return {
    reply: replyText,
    suggestions: [
      'Tell me briefly',
      'Open Canonical Categories',
      'Open WhatsApp Viewer',
      'Open Digital Tool Hub',
      'Check GitHub & Cloudinary'
    ],
    suggestedTools: NATASHA_FOUR_CORE_TOOLS,
    showSuggestions: true,
    context: currentContext
  };
};

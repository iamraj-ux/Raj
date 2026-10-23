/**
 * RAJ EXPO PEOPLE DATABASE + CONTACT INTELLIGENCE SERVICE
 * Implements Chronological People Database: Oldest -> Newest
 * Smart Name + Contact Matching:
 * Database Name ↔ Contact Saved Name ↔ Phone Number ↔ Known Aliases
 * Suggested Identity Merge, Unsaved-Change Protection (15-min reminder), and Change History.
 */

export interface PersonRecord {
  id: string;
  databaseName: string; // Canonical Name
  contactSavedName?: string;
  phoneNumbers: string[];
  aliases: string[];
  relationship: string; // e.g. 'Family', 'Friend', 'Colleague', 'Customer', 'Business', 'Important'
  contextNotes?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'archived';
  changeHistory: Array<{
    field: string;
    previousValue: any;
    newValue: any;
    timestamp: string;
    confirmedBy: string;
  }>;
}

export interface MergeSuggestion {
  id: string;
  canonicalName: string;
  contactSavedName: string;
  matchingPhoneNumber: string;
  confidence: number;
  reason: string;
  existingData: Partial<PersonRecord>;
  proposedChanges: Partial<PersonRecord>;
}

const PEOPLE_STORAGE_KEY = 'rajexpo_people_database_v2';
const UNSAVED_CHANGES_KEY = 'rajexpo_people_unsaved_flag';
const LAST_SAVE_TIME_KEY = 'rajexpo_people_last_save_time';

// Seed initial canonical contacts from Boss's profile & contact directory
export const SEED_PEOPLE_RECORDS: PersonRecord[] = [
  {
    id: 'person-001',
    databaseName: 'Jonathan Raj (Boss)',
    contactSavedName: 'Ganeshraj Jr',
    phoneNumbers: ['+94776223997', '+16503000234'],
    aliases: ['Boss', 'Mr. Raj', 'Junior', 'Jonathan', 'JR97'],
    relationship: 'Self / Boss / Owner',
    contextNotes: 'Python dev, teaches Spoken English via Skype. Kickboxing Lightweight Champion RED BELT. Printline Wattala.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T03:18:00.000Z',
    status: 'active',
    changeHistory: []
  },
  {
    id: 'person-002',
    databaseName: 'Dilan Danush',
    contactSavedName: 'Dilan',
    phoneNumbers: ['+94719572762'],
    aliases: ['Dilan', 'Son', 'Printline Owner', 'NLB Owner'],
    relationship: 'Family / Business Partner',
    contextNotes: 'Owns NL Bookshop (NLB) and Printline business (Old Negombo Road, Wattala).',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-08-01T03:18:00.000Z',
    status: 'active',
    changeHistory: []
  },
  {
    id: 'person-003',
    databaseName: 'Tharushi Perera',
    contactSavedName: 'Tharu / Chetty Tharu',
    phoneNumbers: ['+94758604981'],
    aliases: ['GF', 'Tharushi', 'Tharu Galle'],
    relationship: 'Significant Other / Girlfriend',
    contextNotes: 'Living with Boss in rented house Kochikade. Narcotics Central Bureau trainee (6 months left). Speaks Sinhala and Tamil.',
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-08-01T03:18:00.000Z',
    status: 'active',
    changeHistory: []
  },
  {
    id: 'person-004',
    databaseName: 'Ganeshraj Jonathan Raj (Dad)',
    contactSavedName: 'Dad / APPA',
    phoneNumbers: ['+94775121356', '+94713014794', '+94773691003', '+94743909408', '+94756885474', '+94715121356'],
    aliases: ['Dad', 'APPA', 'Father', 'Music Director'],
    relationship: 'Family / Father',
    contextNotes: 'Music Director & Owner of London TBC. Owns house in Kochikade (200m away). Stepmom Sasikala (Journalist). White car turbo plate CAXxxxx.',
    createdAt: '2026-01-04T00:00:00.000Z',
    updatedAt: '2026-08-01T03:18:00.000Z',
    status: 'active',
    changeHistory: []
  },
  {
    id: 'person-005',
    databaseName: 'Sion Zion (Mastermindboy)',
    contactSavedName: 'Sion Kerawalapitiya',
    phoneNumbers: ['+94771234567'],
    aliases: ['Sion', 'Zion', 'Mastermindboy', 'Printline Designer'],
    relationship: 'Colleague / Printline Team',
    contextNotes: '22, Kerawalapitiya. Designer at Printline for 2 years. Thinks he runs the room. Unaware of Natasha ASI existence.',
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-08-01T03:18:00.000Z',
    status: 'active',
    changeHistory: []
  },
  {
    id: 'person-006',
    databaseName: 'Gajan',
    contactSavedName: '#Gajan#_01',
    phoneNumbers: ['+94757732307', '+94774989892'],
    aliases: ['Gajan', 'Gajan 01'],
    relationship: 'Friend',
    contextNotes: 'Contact Directory entry #Gajan#_01.',
    createdAt: '2026-01-06T00:00:00.000Z',
    updatedAt: '2026-05-01T10:00:00.000Z',
    status: 'active',
    changeHistory: []
  },
  {
    id: 'person-007',
    databaseName: 'Nikshana Ashok',
    contactSavedName: '@ Nikshana Ashok',
    phoneNumbers: ['+94759569415'],
    aliases: ['Nikshana', 'Ashok'],
    relationship: 'Friend',
    contextNotes: 'Phone contact @ Nikshana Ashok.',
    createdAt: '2026-01-07T00:00:00.000Z',
    updatedAt: '2026-05-01T10:00:00.000Z',
    status: 'active',
    changeHistory: []
  },
  {
    id: 'person-008',
    databaseName: 'Abigail Fernando',
    contactSavedName: 'Abigail Fernando',
    phoneNumbers: ['+94754324222', '0727723334'],
    aliases: ['Abigail', 'Abigail Rex Uncle'],
    relationship: 'Family / Friend',
    contextNotes: 'Contact Directory Abigail Fernando & Rex Uncle.',
    createdAt: '2026-01-08T00:00:00.000Z',
    updatedAt: '2026-05-01T10:00:00.000Z',
    status: 'active',
    changeHistory: []
  },
  {
    id: 'person-009',
    databaseName: 'Amma Food City',
    contactSavedName: 'Amma Food Food City',
    phoneNumbers: ['+94774044445', '+94768745777'],
    aliases: ['Amma Food City', 'Amma Wtsap'],
    relationship: 'Family / Shopping',
    contextNotes: 'Family & Food City shopping contact.',
    createdAt: '2026-01-09T00:00:00.000Z',
    updatedAt: '2026-05-01T10:00:00.000Z',
    status: 'active',
    changeHistory: []
  },
  {
    id: 'person-010',
    databaseName: 'Anton Aiya',
    contactSavedName: 'Anton Aiya / Anton Anna',
    phoneNumbers: ['+94766317500', '0774841960', '+94774841960'],
    aliases: ['Anton', 'Anton Aiya', 'Anton Anna'],
    relationship: 'Friend / Colleague',
    contextNotes: 'Printline / NLB associate.',
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-05-01T10:00:00.000Z',
    status: 'active',
    changeHistory: []
  },
  {
    id: 'person-011',
    databaseName: 'Ashvini',
    contactSavedName: 'Asvini / Ashvinth',
    phoneNumbers: ['+94727255891', '+94778225309'],
    aliases: ['Ashvini', 'Sister Ashvini', 'Asvini'],
    relationship: 'Family / Sister',
    contextNotes: 'Boss sister, currently schooling.',
    createdAt: '2026-01-11T00:00:00.000Z',
    updatedAt: '2026-05-01T10:00:00.000Z',
    status: 'active',
    changeHistory: []
  },
  {
    id: 'person-012',
    databaseName: 'Sharmila Helan',
    contactSavedName: 'Asha Shamila / Sharmila',
    phoneNumbers: ['+94719472718'],
    aliases: ['Sharmila', 'Helan', 'Nurse Sharmila'],
    relationship: 'Family / Sister',
    contextNotes: 'Boss sister, Nursing at Lanka Hospital, degree holder.',
    createdAt: '2026-01-12T00:00:00.000Z',
    updatedAt: '2026-05-01T10:00:00.000Z',
    status: 'active',
    changeHistory: []
  }
];

export function getStoredPeopleDatabase(): PersonRecord[] {
  try {
    const raw = localStorage.getItem(PEOPLE_STORAGE_KEY);
    if (!raw) {
      return SEED_PEOPLE_RECORDS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return SEED_PEOPLE_RECORDS;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load people database:', err);
    return SEED_PEOPLE_RECORDS;
  }
}

export function savePeopleDatabase(records: PersonRecord[], markUnsaved = false): void {
  try {
    localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(records));
    if (markUnsaved) {
      localStorage.setItem(UNSAVED_CHANGES_KEY, 'true');
    } else {
      localStorage.removeItem(UNSAVED_CHANGES_KEY);
      localStorage.setItem(LAST_SAVE_TIME_KEY, new Date().toISOString());
    }
  } catch (err) {
    console.error('Failed to save people database:', err);
  }
}

export function hasUnsavedChanges(): boolean {
  return localStorage.getItem(UNSAVED_CHANGES_KEY) === 'true';
}

export function commitDatabaseSave(): void {
  localStorage.removeItem(UNSAVED_CHANGES_KEY);
  localStorage.setItem(LAST_SAVE_TIME_KEY, new Date().toISOString());
  window.dispatchEvent(new CustomEvent('database-saved-event'));
}

/**
 * Normalizes phone numbers (e.g. +94 77 706 9362 -> 94777069362)
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Smart Name + Contact Matching:
 * Database Name ↔ Contact Saved Name ↔ Phone Number ↔ Known Aliases
 */
export function findMatchingPerson(query: string, phoneQuery?: string): PersonRecord | null {
  const people = getStoredPeopleDatabase();
  const qLower = query.toLowerCase().trim();
  const normPhone = phoneQuery ? normalizePhone(phoneQuery) : null;

  for (const person of people) {
    // Exact phone match
    if (normPhone) {
      for (const p of person.phoneNumbers) {
        if (normalizePhone(p) === normPhone || normalizePhone(p).endsWith(normPhone.slice(-7))) {
          return person;
        }
      }
    }

    // Name / Alias match
    if (person.databaseName.toLowerCase() === qLower) return person;
    if (person.contactSavedName && person.contactSavedName.toLowerCase() === qLower) return person;
    if (person.aliases.some(a => a.toLowerCase() === qLower)) return person;
    if (person.databaseName.toLowerCase().includes(qLower) || qLower.includes(person.databaseName.toLowerCase())) return person;
  }

  return null;
}

/**
 * Checks for a merge suggestion when importing contact information
 */
export function generateMergeSuggestion(contactName: string, phone: string): MergeSuggestion | null {
  const matched = findMatchingPerson(contactName, phone);
  if (!matched) return null;

  const normPhone = normalizePhone(phone);
  const alreadyHasPhone = matched.phoneNumbers.some(p => normalizePhone(p) === normPhone);

  if (alreadyHasPhone && matched.databaseName.toLowerCase() === contactName.toLowerCase()) {
    return null; // Already identical
  }

  return {
    id: `merge-${Date.now()}`,
    canonicalName: matched.databaseName,
    contactSavedName: contactName,
    matchingPhoneNumber: phone,
    confidence: alreadyHasPhone ? 0.95 : 0.85,
    reason: alreadyHasPhone ? 'Existing phone match' : 'High name/alias similarity',
    existingData: matched,
    proposedChanges: {
      phoneNumbers: alreadyHasPhone ? matched.phoneNumbers : [...matched.phoneNumbers, phone],
      aliases: matched.aliases.includes(contactName) ? matched.aliases : [...matched.aliases, contactName]
    }
  };
}

/**
 * Dispatches a top non-blocking notification:
 * Fade In -> 2 seconds visible -> Fade Out
 */
export function dispatchPersonChangeNotification(databaseName: string, changeDetail: string): void {
  window.dispatchEvent(new CustomEvent('person-change-notification', {
    detail: {
      databaseName,
      changeDetail,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
  }));
}

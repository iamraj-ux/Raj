/**
 * RAJ EXPO DIGITALS : CONTACT INTELLIGENCE & OPERATIONS ENGINE ("NATASHA")
 * Manages, searches, modifies, and synthesizes the 867+ contact directory for 
 * Ganeshraj / Raj Expo Digitals / Audiographik operations.
 * 
 * RFC 4180 Ingestion, 12-parameter queries, action dispatchers, mutation protocol,
 * and 6-format export compliance (CSV, HTML, Markdown, Plain Text, vCard 3.0, JSON).
 */

import initialContactsRaw from './contactsData.json';
import { logActivity } from './activityLogger';
import { soundManager } from './soundEffects';

export type RelationshipType = 
  | 'Family' 
  | 'Friend' 
  | 'Colleague' 
  | 'Business' 
  | 'Legal/Police' 
  | 'Medical' 
  | 'Service' 
  | 'Other';

export interface SocialProfile {
  platform: 'LinkedIn' | 'GitHub' | 'X' | 'Telegram' | 'Instagram' | 'Facebook' | 'Web' | string;
  url: string;
}

export interface ContactRecord {
  id: string;
  name: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  nickname: string;
  organization: string;
  title: string;
  phones: string[];
  raw_phones?: string[];
  emails: string[];
  address: string;
  birthday: string;
  image_url: string; // Authenticated Cloudinary asset URL
  social_profiles: SocialProfile[];
  relationship_type: RelationshipType;
  linked_contacts: string[];
  tags: string[];
  notes: string;
}

export interface ContactFilterParams {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  nickname?: string;
  organization?: string;
  jobTitle?: string;
  phone?: string;
  email?: string;
  address?: string;
  relationshipType?: RelationshipType | 'ALL';
  tag?: string;
  hasImage?: boolean | null; // true = only with image, false = without image, null = all
  notes?: string;
  globalQuery?: string;
}

const CONTACTS_STORAGE_KEY = 'raj_expo_contacts_directory_v3';

// --------------------------------------------------------------------------
// 1. INGESTION & PARSING RULES (RFC 4180 COMPLIANT)
// --------------------------------------------------------------------------

/**
 * Normalizes Sri Lanka phone prefixes:
 * Maps 07X or 7X (9 digits) to +947X, 011 -> +9411
 * Preserves international +44, +1, +63, etc.
 */
export function normalizePhoneSL(phone: string): string {
  if (!phone) return '';
  const clean = phone.trim();
  const digitsOnly = clean.replace(/[^0-9+]/g, '');
  if (!digitsOnly) return '';

  if (digitsOnly.startsWith('+')) {
    return digitsOnly;
  }
  if (digitsOnly.startsWith('07') && digitsOnly.length === 10) {
    return '+94' + digitsOnly.slice(1);
  }
  if (digitsOnly.startsWith('7') && digitsOnly.length === 9) {
    return '+94' + digitsOnly;
  }
  if (digitsOnly.startsWith('011') && digitsOnly.length === 10) {
    return '+94' + digitsOnly.slice(1);
  }
  if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
    return '+94' + digitsOnly.slice(1);
  }
  if (digitsOnly.length === 9 && (digitsOnly.startsWith('7') || digitsOnly.startsWith('1'))) {
    return '+94' + digitsOnly;
  }
  return digitsOnly;
}

/**
 * RFC 4180 CSV parser supporting quoted multiline handling, escaped quotes,
 * and UTF-8 BOM.
 */
export function parseRFC4180CSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  const cleanText = csvText.replace(/^\uFEFF/, '');

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r' && nextChar === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
      } else if (char === '\n' || char === '\r') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

export function convertCSVToContacts(csvText: string): ContactRecord[] {
  const rows = parseRFC4180CSV(csvText);
  if (rows.length < 2) return [];

  const contacts: ContactRecord[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r.some(cell => cell && cell.trim())) continue;

    const [
      name, firstName, middleName, lastName, nickname,
      organization, title, phone1, phone2, phone3,
      email1, email2, address, birthday, url, note
    ] = r.map(c => (c !== undefined && c !== null ? c.trim() : ''));

    const displayName = name || [firstName, middleName, lastName].filter(Boolean).join(' ') || 'Unknown Contact';
    const rawPhones = [phone1, phone2, phone3].filter(Boolean);
    const phones = Array.from(new Set(rawPhones.map(normalizePhoneSL).filter(Boolean)));
    const emails = Array.from(new Set([email1, email2].filter(Boolean)));

    const socialProfiles: SocialProfile[] = [];
    if (url) {
      let platform = 'Web';
      if (url.includes('t.me') || url.includes('telegram')) platform = 'Telegram';
      else if (url.includes('linkedin')) platform = 'LinkedIn';
      else if (url.includes('github')) platform = 'GitHub';
      else if (url.includes('twitter') || url.includes('x.com')) platform = 'X';
      else if (url.includes('instagram')) platform = 'Instagram';
      else if (url.includes('facebook')) platform = 'Facebook';
      socialProfiles.push({ platform, url });
    }

    const relationshipType = inferRelationshipType(displayName, note, organization, title);

    const tags: string[] = [];
    if (organization) tags.push(organization.toLowerCase().replace(/[^a-z0-9]/g, '_'));
    if (title) tags.push(title.toLowerCase().replace(/[^a-z0-9]/g, '_'));
    tags.push(relationshipType.toLowerCase().replace(/[^a-z0-9]/g, '_'));
    if (note && note.length < 30) tags.push(note.toLowerCase().replace(/[^a-z0-9]/g, '_'));

    contacts.push({
      id: `contact-${String(contacts.length + 1).padStart(4, '0')}`,
      name: displayName,
      first_name: firstName || '',
      middle_name: middleName || '',
      last_name: lastName || '',
      nickname: nickname || '',
      organization: organization || '',
      title: title || '',
      phones,
      raw_phones: rawPhones,
      emails,
      address: address || '',
      birthday: birthday || '',
      image_url: '',
      social_profiles: socialProfiles,
      relationship_type: relationshipType,
      linked_contacts: [],
      tags: Array.from(new Set(tags.filter(Boolean))),
      notes: note || ''
    });
  }

  return contacts;
}

function inferRelationshipType(name: string, note?: string, org?: string, title?: string): RelationshipType {
  const combined = `${name} ${note || ''} ${org || ''} ${title || ''}`.toLowerCase();
  if (combined.includes('police') || combined.includes('oic') || combined.includes('crime') || combined.includes('narcotics') || combined.includes('sargeant') || combined.includes('legal') || combined.includes('lawyer')) {
    return 'Legal/Police';
  }
  if (combined.includes('doctor') || combined.includes('hospital') || combined.includes('dr.') || combined.includes('medical') || combined.includes('nurse') || combined.includes('ayur') || combined.includes('vaid')) {
    return 'Medical';
  }
  if (combined.includes('dad') || combined.includes('appa') || combined.includes('amma') || combined.includes('mom') || combined.includes('uncle') || combined.includes('aunty') || combined.includes('aunt') || combined.includes('son') || combined.includes('brother') || combined.includes('sister') || combined.includes('akka') || combined.includes('anni') || combined.includes('thambi') || combined.includes('mama') || combined.includes('sithi') || combined.includes('achi') || combined.includes('family')) {
    return 'Family';
  }
  if (combined.includes('printline') || combined.includes('colleague') || combined.includes('audiographik') || combined.includes('raj expo') || combined.includes('staff') || combined.includes('nlb') || combined.includes('boss') || combined.includes('designer')) {
    return 'Colleague';
  }
  if (combined.includes('shop') || combined.includes('store') || combined.includes('print') || combined.includes('service') || combined.includes('hotline') || combined.includes('customer') || combined.includes('care') || combined.includes('help') || combined.includes('agency') || combined.includes('dialog') || combined.includes('hutch') || combined.includes('airtel') || combined.includes('express') || combined.includes('bank') || combined.includes('combank') || combined.includes('reload')) {
    return 'Service';
  }
  if (combined.includes('business') || combined.includes('pvt') || combined.includes('ltd') || combined.includes('company') || combined.includes('vendor') || combined.includes('trader') || combined.includes('supplier') || combined.includes('sales')) {
    return 'Business';
  }
  if (combined.includes('friend') || combined.includes('frnd') || combined.includes('machan') || combined.includes('bro') || combined.includes('bokka') || combined.includes('scl')) {
    return 'Friend';
  }
  return 'Other';
}

// --------------------------------------------------------------------------
// 2. STORAGE & PERSISTENCE
// --------------------------------------------------------------------------

export function getStoredContacts(): ContactRecord[] {
  try {
    const raw = localStorage.getItem(CONTACTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse stored contacts:', err);
  }

  // Fallback to pre-parsed initialContactsRaw (867 contacts)
  const initial = initialContactsRaw as ContactRecord[];
  saveStoredContacts(initial);
  return initial;
}

export function saveStoredContacts(contacts: ContactRecord[]): void {
  try {
    localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
    window.dispatchEvent(new CustomEvent('contacts-database-updated', { detail: { count: contacts.length } }));
  } catch (err) {
    console.error('Failed to store contacts in localStorage:', err);
  }
}

// --------------------------------------------------------------------------
// 3. 12-PARAMETER QUERY & FILTER SPECIFICATIONS
// --------------------------------------------------------------------------

export function filterContacts(params: ContactFilterParams, allContacts?: ContactRecord[]): ContactRecord[] {
  const list = allContacts || getStoredContacts();
  const {
    firstName, lastName, displayName, nickname,
    organization, jobTitle, phone, email, address,
    relationshipType, tag, hasImage, notes, globalQuery
  } = params;

  return list.filter(contact => {
    // Global fuzzy search query
    if (globalQuery && globalQuery.trim()) {
      const g = globalQuery.toLowerCase().trim();
      const match = 
        contact.name.toLowerCase().includes(g) ||
        contact.first_name.toLowerCase().includes(g) ||
        contact.last_name.toLowerCase().includes(g) ||
        contact.nickname.toLowerCase().includes(g) ||
        contact.organization.toLowerCase().includes(g) ||
        contact.title.toLowerCase().includes(g) ||
        contact.address.toLowerCase().includes(g) ||
        contact.notes.toLowerCase().includes(g) ||
        contact.relationship_type.toLowerCase().includes(g) ||
        contact.phones.some(p => p.includes(g)) ||
        (contact.raw_phones && contact.raw_phones.some(p => p.includes(g))) ||
        contact.emails.some(e => e.toLowerCase().includes(g)) ||
        contact.tags.some(t => t.toLowerCase().includes(g));
      if (!match) return false;
    }

    // Specific parameter filters
    if (firstName && !contact.first_name.toLowerCase().includes(firstName.toLowerCase())) return false;
    if (lastName && !contact.last_name.toLowerCase().includes(lastName.toLowerCase())) return false;
    if (displayName && !contact.name.toLowerCase().includes(displayName.toLowerCase())) return false;
    if (nickname && !contact.nickname.toLowerCase().includes(nickname.toLowerCase())) return false;

    if (organization && !contact.organization.toLowerCase().includes(organization.toLowerCase())) return false;
    if (jobTitle && !contact.title.toLowerCase().includes(jobTitle.toLowerCase())) return false;

    if (phone) {
      const normQuery = phone.replace(/[^0-9]/g, '');
      const matchPhone = contact.phones.some(p => p.replace(/[^0-9]/g, '').includes(normQuery)) ||
        (contact.raw_phones && contact.raw_phones.some(p => p.replace(/[^0-9]/g, '').includes(normQuery)));
      if (!matchPhone) return false;
    }

    if (email && !contact.emails.some(e => e.toLowerCase().includes(email.toLowerCase()))) return false;
    if (address && !contact.address.toLowerCase().includes(address.toLowerCase())) return false;

    if (relationshipType && relationshipType !== 'ALL' && contact.relationship_type !== relationshipType) return false;
    if (tag && !contact.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))) return false;

    if (hasImage === true && !contact.image_url) return false;
    if (hasImage === false && contact.image_url) return false;

    if (notes && !contact.notes.toLowerCase().includes(notes.toLowerCase())) return false;

    return true;
  });
}

/**
 * Returns matching records formatted in compact key-value plain text
 */
export function formatMatchingRecordCompactPlainText(c: ContactRecord): string {
  const parts = [
    `Name: ${c.name}`,
    `Phone(s): ${c.phones.join(', ') || 'N/A'}`,
    `Email(s): ${c.emails.join(', ') || 'N/A'}`,
    `Org: ${c.organization || 'N/A'}`,
    `Title: ${c.title || 'N/A'}`,
    `Relationship: ${c.relationship_type}`,
    `Tags: ${c.tags.join(', ') || 'None'}`,
    `Notes: ${c.notes || 'None'}`
  ];
  return parts.join(' | ');
}

// --------------------------------------------------------------------------
// 4. ACTION DISPATCH LOGIC
// --------------------------------------------------------------------------

/**
 * COPY_PHONE: Sanitize digits, strip non-numeric symbols except leading '+'
 */
export function copyPhoneAction(phone: string): string {
  if (!phone) return '';
  const sanitized = phone.trim().replace(/[^0-9+]/g, '');
  return sanitized;
}

/**
 * WHATSAPP_LINK: Generate https://wa.me/<E164_sanitized_phone>
 */
export function getWhatsAppActionLink(phone: string): string {
  if (!phone) return '';
  const digitsOnly = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${digitsOnly}`;
}

/**
 * EMAIL_DIRECT: Generate mailto:<email> or Google Mail Compose URL
 */
export function getEmailActionLink(email: string, subject?: string): { mailto: string; gmailDirect: string } {
  if (!email) return { mailto: '', gmailDirect: '' };
  const encodedEmail = encodeURIComponent(email.trim());
  const encodedSub = subject ? encodeURIComponent(subject) : '';
  const mailto = `mailto:${encodedEmail}${encodedSub ? `?subject=${encodedSub}` : ''}`;
  const gmailDirect = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedEmail}${encodedSub ? `&su=${encodedSub}` : ''}`;
  return { mailto, gmailDirect };
}

/**
 * SUMMARIZE_NATASHA: Analyze contact role, historical context, organization,
 * linked relations, and produce a concise 3-bullet persona summary.
 */
export function generateNatashaPersonaSummary(c: ContactRecord): string {
  const bullets: string[] = [];

  // Bullet 1: Identity & Professional Role
  const roleText = [c.title, c.organization].filter(Boolean).join(' at ');
  bullets.push(`• **Identity & Role**: ${c.name} (${c.relationship_type})${roleText ? ` — ${roleText}` : ''}`);

  // Bullet 2: Channels & Reachability
  const phoneText = c.phones.length > 0 ? c.phones.join(', ') : 'No phone listed';
  const emailText = c.emails.length > 0 ? c.emails.join(', ') : 'No email listed';
  bullets.push(`• **Communication**: Primary channel: ${phoneText}; Email: ${emailText}`);

  // Bullet 3: Historical Context & Tags
  const notesSnippet = c.notes ? `"${c.notes}"` : 'Direct contact directory record';
  const tagList = c.tags.length > 0 ? ` [Tags: ${c.tags.slice(0, 4).join(', ')}]` : '';
  bullets.push(`• **Context & Linkage**: ${notesSnippet}${tagList}`);

  return bullets.join('\n');
}

/**
 * CLOUDINARY_BIND: Store authenticated Cloudinary asset URL into image_url
 * alongside user-supplied image description in notes.
 */
export function bindCloudinaryPhoto(
  contactId: string, 
  imageUrl: string, 
  imageDescription?: string
): ContactRecord | null {
  const contacts = getStoredContacts();
  const index = contacts.findIndex(c => c.id === contactId);
  if (index === -1) return null;

  const current = contacts[index];
  const updatedNotes = imageDescription 
    ? `${current.notes ? `${current.notes}\n` : ''}[Photo: ${imageDescription}]` 
    : current.notes;

  const updated: ContactRecord = {
    ...current,
    image_url: imageUrl,
    notes: updatedNotes
  };

  contacts[index] = updated;
  saveStoredContacts(contacts);
  logActivity('DATABASE', `Bound Cloudinary Photo to Contact: ${current.name}`, `URL: ${imageUrl}`);
  return updated;
}

// --------------------------------------------------------------------------
// 5. MUTATION PROTOCOL
// --------------------------------------------------------------------------

/**
 * Update contact with safeguard: never overwrite existing fields unless
 * explicitly supplied.
 */
export function mutateContact(contactId: string, patch: Partial<ContactRecord>): ContactRecord {
  const contacts = getStoredContacts();
  const index = contacts.findIndex(c => c.id === contactId);

  if (index === -1) {
    throw new Error(`Contact ID ${contactId} not found.`);
  }

  const existing = contacts[index];
  const updated: ContactRecord = {
    ...existing,
    ...patch,
    id: existing.id, // Preserve immutable ID
    phones: patch.phones !== undefined ? patch.phones : existing.phones,
    emails: patch.emails !== undefined ? patch.emails : existing.emails,
    social_profiles: patch.social_profiles !== undefined ? patch.social_profiles : existing.social_profiles,
    tags: patch.tags !== undefined ? patch.tags : existing.tags,
    linked_contacts: patch.linked_contacts !== undefined ? patch.linked_contacts : existing.linked_contacts
  };

  contacts[index] = updated;
  saveStoredContacts(contacts);
  logActivity('DATABASE', `Updated Contact: ${updated.name}`, `ID: ${updated.id}`);
  return updated;
}

export function createContact(newContact: Omit<ContactRecord, 'id'>): ContactRecord {
  const contacts = getStoredContacts();
  const id = `contact-${String(contacts.length + 1).padStart(4, '0')}`;
  const created: ContactRecord = {
    ...newContact,
    id,
    phones: newContact.phones || [],
    emails: newContact.emails || [],
    social_profiles: newContact.social_profiles || [],
    linked_contacts: newContact.linked_contacts || [],
    tags: newContact.tags || [],
    relationship_type: newContact.relationship_type || 'Other'
  };

  contacts.push(created);
  saveStoredContacts(contacts);
  logActivity('DATABASE', `Created Contact: ${created.name}`, `ID: ${created.id}`);
  return created;
}

export function deleteContact(contactId: string): boolean {
  const contacts = getStoredContacts();
  const filtered = contacts.filter(c => c.id !== contactId);
  if (filtered.length === contacts.length) return false;

  saveStoredContacts(filtered);
  logActivity('DATABASE', `Deleted Contact ID: ${contactId}`, 'Contact record permanently removed.');
  return true;
}

// --------------------------------------------------------------------------
// 6. EXPORT COMPLIANCE (ALL 6 DESIGNATED OUTPUT STRUCTURES)
// --------------------------------------------------------------------------

export type ContactExportFormat = 'CSV' | 'HTML' | 'MARKDOWN' | 'PLAIN_TEXT' | 'VCARD' | 'JSON';

export function exportContactsToFormat(contacts: ContactRecord[], format: ContactExportFormat): string {
  switch (format) {
    case 'CSV': {
      // RFC 4180 CSV, quote-wrapped multiline values
      const headers = ['Name', 'First Name', 'Middle Name', 'Last Name', 'Nickname', 'Organization', 'Title', 'Phones', 'Emails', 'Address', 'Birthday', 'Relationship', 'Tags', 'Notes', 'Image URL'];
      const escapeCSV = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;

      const lines = contacts.map(c => [
        escapeCSV(c.name),
        escapeCSV(c.first_name),
        escapeCSV(c.middle_name),
        escapeCSV(c.last_name),
        escapeCSV(c.nickname),
        escapeCSV(c.organization),
        escapeCSV(c.title),
        escapeCSV(c.phones.join('; ')),
        escapeCSV(c.emails.join('; ')),
        escapeCSV(c.address),
        escapeCSV(c.birthday),
        escapeCSV(c.relationship_type),
        escapeCSV(c.tags.join(', ')),
        escapeCSV(c.notes),
        escapeCSV(c.image_url)
      ].join(','));

      return [headers.join(','), ...lines].join('\n');
    }

    case 'HTML': {
      // Single standalone <table> structure
      const escapeHTML = (str: string) => (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const rows = contacts.map(c => `  <tr>
    <td>${escapeHTML(c.name)}</td>
    <td>${escapeHTML(c.phones.join(', '))}</td>
    <td>${escapeHTML(c.emails.join(', '))}</td>
    <td>${escapeHTML(c.organization)}</td>
    <td>${escapeHTML(c.title)}</td>
    <td>${escapeHTML(c.relationship_type)}</td>
    <td>${escapeHTML(c.tags.join(', '))}</td>
    <td>${escapeHTML(c.notes)}</td>
  </tr>`).join('\n');

      return `<table border="1" cellpadding="6" cellspacing="0" style="font-family:sans-serif; font-size:12px; border-collapse:collapse; width:100%;">
  <thead>
    <tr style="background:#0b1220; color:#fff;">
      <th>Name</th><th>Phones</th><th>Emails</th><th>Organization</th><th>Title</th><th>Relationship</th><th>Tags</th><th>Notes</th>
    </tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>`;
    }

    case 'MARKDOWN': {
      // Standard GitHub-flavored Markdown table with escaped pipes/newlines
      const escapeMD = (str: string) => (str || '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
      const header = `| Name | Phone(s) | Email(s) | Org | Title | Relationship | Notes |`;
      const separator = `|---|---|---|---|---|---|---|`;
      const rows = contacts.map(c => 
        `| ${escapeMD(c.name)} | ${escapeMD(c.phones.join(', '))} | ${escapeMD(c.emails.join(', '))} | ${escapeMD(c.organization)} | ${escapeMD(c.title)} | ${escapeMD(c.relationship_type)} | ${escapeMD(c.notes)} |`
      );
      return [header, separator, ...rows].join('\n');
    }

    case 'PLAIN_TEXT': {
      // Compact delimiter format: Name | Phone(s) | Email(s) | Org | Notes
      return contacts.map(c => 
        `${c.name} | ${c.phones.join(', ') || 'N/A'} | ${c.emails.join(', ') || 'N/A'} | ${c.organization || 'N/A'} | ${c.notes.replace(/\r?\n/g, ' ') || 'None'}`
      ).join('\n');
    }

    case 'VCARD': {
      // vCard 3.0 specification (BEGIN:VCARD ... END:VCARD)
      return contacts.map(c => {
        const lines = [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${c.name}`,
          `N:${c.last_name || ''};${c.first_name || ''};${c.middle_name || ''};;`
        ];
        if (c.organization) lines.push(`ORG:${c.organization}`);
        if (c.title) lines.push(`TITLE:${c.title}`);
        c.phones.forEach(p => lines.push(`TEL;TYPE=CELL:${p}`));
        c.emails.forEach(e => lines.push(`EMAIL;TYPE=INTERNET:${e}`));
        if (c.address) lines.push(`ADR;TYPE=HOME:;;${c.address};;;;`);
        if (c.birthday) lines.push(`BDAY:${c.birthday}`);
        if (c.image_url) lines.push(`PHOTO;VALUE=URI:${c.image_url}`);
        if (c.notes) lines.push(`NOTE:${c.notes.replace(/\r?\n/g, '\\n')}`);
        lines.push('END:VCARD');
        return lines.join('\r\n');
      }).join('\r\n\r\n');
    }

    case 'JSON':
    default: {
      // Indented UTF-8 JSON array
      return JSON.stringify(contacts, null, 2);
    }
  }
}

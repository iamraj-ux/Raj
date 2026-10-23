import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Search, Phone, Mail, Edit3, Trash2, Check, X, 
  GitMerge, Sparkles, ArrowUpDown, Download, MessageCircle, ExternalLink,
  Copy, Image as ImageIcon, Tag, Upload, FileText, Code, Database, 
  Share2, Shield, AlertTriangle, CheckCircle2, ChevronRight, CornerDownRight
} from 'lucide-react';
import { 
  PersonRecord, 
  MergeSuggestion, 
  getStoredPeopleDatabase, 
  savePeopleDatabase, 
  generateMergeSuggestion, 
  dispatchPersonChangeNotification 
} from '../services/peopleDatabaseService';
import { 
  ContactRecord, 
  ContactFilterParams, 
  RelationshipType, 
  SocialProfile,
  getStoredContacts, 
  saveStoredContacts, 
  filterContacts, 
  copyPhoneAction, 
  getWhatsAppActionLink, 
  getEmailActionLink, 
  generateNatashaPersonaSummary, 
  bindCloudinaryPhoto, 
  mutateContact, 
  createContact, 
  deleteContact, 
  exportContactsToFormat, 
  ContactExportFormat, 
  convertCSVToContacts 
} from '../services/contactDirectoryService';
import { soundManager } from '../services/soundEffects';
import { logActivity } from '../services/activityLogger';

interface PeopleDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPersonForWhatsApp?: (phone: string, name: string) => void;
}

export const PeopleDatabaseModal: React.FC<PeopleDatabaseModalProps> = ({
  isOpen,
  onClose,
  onSelectPersonForWhatsApp
}) => {
  // Top-level Navigation Tabs
  const [activeTab, setActiveTab] = useState<'contacts_directory' | 'people_graph'>('contacts_directory');

  // =========================================================================
  // 1. CONTACT DIRECTORY (867+ RECORDS) STATE
  // =========================================================================
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRelationship, setSelectedRelationship] = useState<RelationshipType | 'ALL'>('ALL');
  const [imageFilter, setImageFilter] = useState<'all' | 'with_image' | 'no_image'>('all');
  const [hasPhoneOnly, setHasPhoneOnly] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactRecord | null>(null);

  // Pagination for high-performance viewing of 867+ records
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 40;

  // Contact Create / Edit Form Modal
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formMiddleName, setFormMiddleName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formNickname, setFormNickname] = useState('');
  const [formOrg, setFormOrg] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formPhones, setFormPhones] = useState<string[]>(['']);
  const [formEmails, setFormEmails] = useState<string[]>(['']);
  const [formAddress, setFormAddress] = useState('');
  const [formBirthday, setFormBirthday] = useState('');
  const [formRelType, setFormRelType] = useState<RelationshipType>('Other');
  const [formNotes, setFormNotes] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formSocialProfiles, setFormSocialProfiles] = useState<SocialProfile[]>([]);

  // Natasha AI Summary Modal
  const [summaryModalContact, setSummaryModalContact] = useState<{ contact: ContactRecord; summary: string } | null>(null);

  // Cloudinary Bind Dialog
  const [bindModalContact, setBindModalContact] = useState<ContactRecord | null>(null);
  const [bindImageUrl, setBindImageUrl] = useState('');
  const [bindImageDesc, setBindImageDesc] = useState('');

  // Delete Contact Safety Confirmation
  const [contactToDelete, setContactToDelete] = useState<ContactRecord | null>(null);

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // CSV Import Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // =========================================================================
  // 2. CANONICAL PEOPLE DATABASE STATE
  // =========================================================================
  const [people, setPeople] = useState<PersonRecord[]>([]);
  const [sortOrder, setSortOrder] = useState<'oldest' | 'newest'>('oldest');
  const [activeMerge, setActiveMerge] = useState<MergeSuggestion | null>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredContacts();
      setContacts(stored);
      setPeople(getStoredPeopleDatabase());
      setCurrentPage(1);
    }
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // -------------------------------------------------------------------------
  // Filtering 867 Contacts across 12 parameters
  // -------------------------------------------------------------------------
  const filteredContacts = filterContacts({
    globalQuery: searchQuery,
    relationshipType: selectedRelationship,
    hasImage: imageFilter === 'all' ? null : imageFilter === 'with_image'
  }, contacts).filter(c => {
    if (hasPhoneOnly && c.phones.length === 0) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredContacts.length / pageSize) || 1;
  const paginatedContacts = filteredContacts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // -------------------------------------------------------------------------
  // Action Dispatch Handlers
  // -------------------------------------------------------------------------
  const handleCopyPhone = (phone: string, name: string) => {
    const clean = copyPhoneAction(phone);
    if (!clean) return;
    navigator.clipboard.writeText(clean);
    soundManager.playClickSound();
    showToast(`Copied phone ${clean} for ${name}`);
    logActivity('DATABASE', `Copied Phone: ${clean}`, `Contact: ${name}`);
  };

  const handleOpenWhatsApp = (phone: string, name: string) => {
    soundManager.playClickSound();
    if (onSelectPersonForWhatsApp) {
      onSelectPersonForWhatsApp(phone, name);
    }
    const link = getWhatsAppActionLink(phone);
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenEmail = (email: string) => {
    soundManager.playClickSound();
    const { mailto, gmailDirect } = getEmailActionLink(email);
    try {
      window.open(gmailDirect, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = mailto;
    }
  };

  const handleSummarizeWithNatasha = (contact: ContactRecord) => {
    soundManager.playClickSound();
    const summary = generateNatashaPersonaSummary(contact);
    setSummaryModalContact({ contact, summary });
    logActivity('CHAT', `Generated Natasha Contact Summary: ${contact.name}`, '3-bullet persona analysis');
  };

  const handleConfirmBindCloudinary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bindModalContact || !bindImageUrl.trim()) return;

    soundManager.playAccessGrantedSound();
    const updated = bindCloudinaryPhoto(bindModalContact.id, bindImageUrl.trim(), bindImageDesc.trim());
    if (updated) {
      setContacts(getStoredContacts());
      showToast(`Cloudinary photo bound to ${updated.name}!`);
      setBindModalContact(null);
      setBindImageUrl('');
      setBindImageDesc('');
    }
  };

  // -------------------------------------------------------------------------
  // Mutation Handlers (Add / Edit / Delete)
  // -------------------------------------------------------------------------
  const handleOpenAddContact = () => {
    soundManager.playClickSound();
    setEditingContactId(null);
    setFormName('');
    setFormFirstName('');
    setFormMiddleName('');
    setFormLastName('');
    setFormNickname('');
    setFormOrg('');
    setFormTitle('');
    setFormPhones(['']);
    setFormEmails(['']);
    setFormAddress('');
    setFormBirthday('');
    setFormRelType('Other');
    setFormNotes('');
    setFormTags('');
    setFormImageUrl('');
    setFormSocialProfiles([]);
    setIsContactFormOpen(true);
  };

  const handleOpenEditContact = (c: ContactRecord) => {
    soundManager.playClickSound();
    setEditingContactId(c.id);
    setFormName(c.name);
    setFormFirstName(c.first_name);
    setFormMiddleName(c.middle_name);
    setFormLastName(c.last_name);
    setFormNickname(c.nickname);
    setFormOrg(c.organization);
    setFormTitle(c.title);
    setFormPhones(c.phones.length > 0 ? c.phones : ['']);
    setFormEmails(c.emails.length > 0 ? c.emails : ['']);
    setFormAddress(c.address);
    setFormBirthday(c.birthday);
    setFormRelType(c.relationship_type);
    setFormNotes(c.notes);
    setFormTags(c.tags.join(', '));
    setFormImageUrl(c.image_url);
    setFormSocialProfiles(c.social_profiles || []);
    setIsContactFormOpen(true);
  };

  const handleSaveContactForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Contact name is required.');
      return;
    }

    soundManager.playAccessGrantedSound();
    const cleanPhones = formPhones.map(p => p.trim()).filter(Boolean);
    const cleanEmails = formEmails.map(e => e.trim()).filter(Boolean);
    const cleanTags = formTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

    if (editingContactId) {
      mutateContact(editingContactId, {
        name: formName.trim(),
        first_name: formFirstName.trim(),
        middle_name: formMiddleName.trim(),
        last_name: formLastName.trim(),
        nickname: formNickname.trim(),
        organization: formOrg.trim(),
        title: formTitle.trim(),
        phones: cleanPhones,
        emails: cleanEmails,
        address: formAddress.trim(),
        birthday: formBirthday.trim(),
        relationship_type: formRelType,
        notes: formNotes.trim(),
        tags: cleanTags,
        image_url: formImageUrl.trim(),
        social_profiles: formSocialProfiles
      });
      showToast(`Contact "${formName}" updated.`);
    } else {
      createContact({
        name: formName.trim(),
        first_name: formFirstName.trim(),
        middle_name: formMiddleName.trim(),
        last_name: formLastName.trim(),
        nickname: formNickname.trim(),
        organization: formOrg.trim(),
        title: formTitle.trim(),
        phones: cleanPhones,
        emails: cleanEmails,
        address: formAddress.trim(),
        birthday: formBirthday.trim(),
        relationship_type: formRelType,
        notes: formNotes.trim(),
        tags: cleanTags,
        image_url: formImageUrl.trim(),
        social_profiles: formSocialProfiles,
        linked_contacts: []
      });
      showToast(`New contact "${formName}" added!`);
    }

    setContacts(getStoredContacts());
    setIsContactFormOpen(false);
  };

  const handleConfirmDeleteContact = () => {
    if (!contactToDelete) return;
    soundManager.playAccessGrantedSound();
    deleteContact(contactToDelete.id);
    setContacts(getStoredContacts());
    showToast(`Deleted ${contactToDelete.name}`);
    setContactToDelete(null);
  };

  // -------------------------------------------------------------------------
  // Export Compliance (6 Formats)
  // -------------------------------------------------------------------------
  const handleExport = (format: ContactExportFormat) => {
    soundManager.playClickSound();
    const content = exportContactsToFormat(filteredContacts, format);
    const extensions: Record<ContactExportFormat, string> = {
      CSV: 'csv',
      HTML: 'html',
      MARKDOWN: 'md',
      PLAIN_TEXT: 'txt',
      VCARD: 'vcf',
      JSON: 'json'
    };
    const mimeTypes: Record<ContactExportFormat, string> = {
      CSV: 'text/csv;charset=utf-8;',
      HTML: 'text/html;charset=utf-8;',
      MARKDOWN: 'text/markdown;charset=utf-8;',
      PLAIN_TEXT: 'text/plain;charset=utf-8;',
      VCARD: 'text/vcard;charset=utf-8;',
      JSON: 'application/json;charset=utf-8;'
    };

    const blob = new Blob([content], { type: mimeTypes[format] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raj_expo_contacts_${format.toLowerCase()}_${new Date().toISOString().split('T')[0]}.${extensions[format]}`;
    a.click();
    showToast(`Exported ${filteredContacts.length} contacts as ${format}!`);
    logActivity('DATABASE', `Exported Contacts as ${format}`, `Total: ${filteredContacts.length} records`);
  };

  // -------------------------------------------------------------------------
  // CSV Import (RFC 4180 Ingestion)
  // -------------------------------------------------------------------------
  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundManager.playClickSound();
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        try {
          const parsed = convertCSVToContacts(text);
          if (parsed.length > 0) {
            saveStoredContacts(parsed);
            setContacts(parsed);
            soundManager.playAccessGrantedSound();
            showToast(`Successfully ingested ${parsed.length} contacts from CSV!`);
            logActivity('DATABASE', `Ingested CSV Contacts`, `Loaded ${parsed.length} records`);
          } else {
            alert('No valid contact records found in this CSV.');
          }
        } catch (err: any) {
          alert(`CSV parsing error: ${err.message}`);
        }
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9990] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 md:p-6 select-none font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-6xl h-[94vh] bg-slate-900 border-2 border-cyan-400/70 rounded-3xl shadow-[0_0_80px_rgba(34,211,238,0.4)] flex flex-col overflow-hidden relative text-white"
      >
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-cyan-300 uppercase tracking-wider">
                  RAJ EXPO DIGITALS : CONTACT INTELLIGENCE & OPERATIONS
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/40 text-[10px] font-mono font-bold">
                  {contacts.length} Records
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                RFC 4180 Ingested Directory • 12-Parameter Precision Filtering • 6-Format Compliance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Switcher */}
            <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800">
              <button
                onClick={() => { soundManager.playClickSound(); setActiveTab('contacts_directory'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                  activeTab === 'contacts_directory' 
                    ? 'bg-cyan-500 text-slate-950 shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Directory ({contacts.length})
              </button>
              <button
                onClick={() => { soundManager.playClickSound(); setActiveTab('people_graph'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                  activeTab === 'people_graph' 
                    ? 'bg-cyan-500 text-slate-950 shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Chronological Graph
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Notification Banner */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-cyan-500/20 border-b border-cyan-400/40 px-4 py-2 text-xs font-bold text-cyan-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>{toastMessage}</span>
              </div>
              <button onClick={() => setToastMessage(null)} className="text-cyan-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =================================================================== */}
        {/* TAB 1: 867 CONTACTS DIRECTORY                                       */}
        {/* =================================================================== */}
        {activeTab === 'contacts_directory' && (
          <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 gap-3 bg-slate-950">
            {/* Search & Actions Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-900 border border-slate-800">
              {/* Universal Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Search by Name, First/Last, Nickname, Phone (+94...), Email, Org, Notes..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Hidden CSV File Input */}
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleCSVFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                  title="Ingest RFC 4180 CSV File"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Import CSV</span>
                </button>

                {/* Export Dropdown Menu */}
                <div className="relative group">
                  <button
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export ({filteredContacts.length})</span>
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-44 bg-slate-900 border border-cyan-500/30 rounded-xl p-1.5 shadow-xl hidden group-hover:block z-50">
                    <p className="text-[9px] text-slate-400 font-bold uppercase px-2 py-1">Export Formats</p>
                    {(['CSV', 'HTML', 'MARKDOWN', 'PLAIN_TEXT', 'VCARD', 'JSON'] as ContactExportFormat[]).map(fmt => (
                      <button
                        key={fmt}
                        onClick={() => handleExport(fmt)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 font-mono transition-colors cursor-pointer"
                      >
                        {fmt} Format
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add Contact Button */}
                <button
                  onClick={handleOpenAddContact}
                  className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Contact</span>
                </button>
              </div>
            </div>

            {/* Filter Pills Bar (Relationship Types & Toggles) */}
            <div className="flex items-center gap-2 overflow-x-auto jarvis-scrollbar py-1 text-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Filter By:</span>
              {(['ALL', 'Family', 'Friend', 'Colleague', 'Business', 'Legal/Police', 'Medical', 'Service', 'Other'] as const).map(rel => (
                <button
                  key={rel}
                  onClick={() => { setSelectedRelationship(rel); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase shrink-0 transition-all cursor-pointer border ${
                    selectedRelationship === rel 
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {rel}
                </button>
              ))}

              <div className="h-4 w-[1px] bg-slate-800 shrink-0 mx-1" />

              <button
                onClick={() => setHasPhoneOnly(!hasPhoneOnly)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase shrink-0 cursor-pointer border ${
                  hasPhoneOnly 
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' 
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Has Phone Only
              </button>

              <button
                onClick={() => setImageFilter(imageFilter === 'with_image' ? 'all' : 'with_image')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase shrink-0 cursor-pointer border ${
                  imageFilter === 'with_image' 
                    ? 'bg-purple-500/20 border-purple-400 text-purple-300' 
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                With Cloudinary Image
              </button>
            </div>

            {/* Records List & Inspection View */}
            <div className="flex-1 overflow-y-auto jarvis-scrollbar pr-1">
              {filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-56 text-slate-500 space-y-2">
                  <Users className="w-10 h-10 text-slate-600" />
                  <p className="text-xs font-mono">No contacts found matching filter criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {paginatedContacts.map((c, index) => {
                    const primaryPhone = c.phones[0] || (c.raw_phones && c.raw_phones[0]) || '';
                    const primaryEmail = c.emails[0] || '';
                    const isSelected = selectedContact?.id === c.id;

                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedContact(c)}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 bg-slate-900/90 cursor-pointer group ${
                          isSelected 
                            ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] ring-1 ring-cyan-400' 
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Top: Photo/Icon + Name + Badges */}
                        <div className="flex items-start gap-3">
                          {c.image_url ? (
                            <img
                              src={c.image_url}
                              alt={c.name}
                              className="w-10 h-10 rounded-xl object-cover border border-cyan-400/50 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 font-bold text-sm shrink-0">
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h3 className="font-bold text-xs text-white truncate group-hover:text-cyan-300 transition-colors" title={c.name}>
                                {c.name}
                              </h3>
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-cyan-400 shrink-0">
                                #{c.id.replace('contact-', '')}
                              </span>
                            </div>

                            {(c.title || c.organization) && (
                              <p className="text-[10px] text-slate-400 truncate">
                                {[c.title, c.organization].filter(Boolean).join(' • ')}
                              </p>
                            )}

                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-cyan-500/20 text-cyan-300 text-[9px] font-bold">
                                {c.relationship_type}
                              </span>
                              {c.phones.length > 1 && (
                                <span className="text-[9px] text-slate-500 font-mono">
                                  +{c.phones.length - 1} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Mid: Contact Numbers & Communication */}
                        <div className="space-y-1 text-[11px] font-mono text-slate-300 pt-1 border-t border-slate-800/60">
                          {primaryPhone ? (
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-400 flex items-center gap-1 truncate">
                                <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                                {primaryPhone}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCopyPhone(primaryPhone, c.name); }}
                                className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800"
                                title="Copy sanitized phone"
                              >
                                Copy
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[10px]">No phone listed</span>
                          )}

                          {primaryEmail && (
                            <div className="flex items-center gap-1 truncate text-cyan-400">
                              <Mail className="w-3 h-3 text-cyan-500 shrink-0" />
                              <span className="truncate">{primaryEmail}</span>
                            </div>
                          )}

                          {c.notes && (
                            <p className="text-[10px] text-slate-400 font-sans line-clamp-1 italic pt-0.5">
                              "{c.notes}"
                            </p>
                          )}
                        </div>

                        {/* Bottom: Action Dispatch Buttons */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                          <div className="flex items-center gap-1">
                            {primaryPhone && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenWhatsApp(primaryPhone, c.name); }}
                                className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors cursor-pointer"
                                title="Open WhatsApp Chat (https://wa.me/...)"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {primaryEmail && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenEmail(primaryEmail); }}
                                className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors cursor-pointer"
                                title="Direct Email / Gmail"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={(e) => { e.stopPropagation(); handleSummarizeWithNatasha(c); }}
                              className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-lg transition-colors cursor-pointer"
                              title="Summarize with Natasha (3-bullet persona)"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); setBindModalContact(c); setBindImageUrl(c.image_url); }}
                              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg transition-colors cursor-pointer"
                              title="Bind Cloudinary Photo"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenEditContact(c); }}
                              className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                              title="Edit Contact"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); setContactToDelete(c); }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                              title="Delete Contact"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-3 py-2 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-400">
                <span>
                  Showing {Math.min((currentPage - 1) * pageSize + 1, filteredContacts.length)} - {Math.min(currentPage * pageSize, filteredContacts.length)} of {filteredContacts.length} contacts
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-40 cursor-pointer"
                  >
                    Prev
                  </button>
                  <span className="font-mono text-cyan-400">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: CANONICAL PEOPLE & IDENTITY MERGE GRAPH                      */}
        {/* =================================================================== */}
        {activeTab === 'people_graph' && (
          <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 gap-3 bg-slate-950">
            <div className="p-3 bg-slate-900 border border-cyan-500/30 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-cyan-300 uppercase">
                  Canonical People Database (Chronological Oldest → Newest)
                </h3>
                <p className="text-[10px] text-slate-400">
                  Core identity records with smart matching, aliases, and change history.
                </p>
              </div>
              <button
                onClick={() => setSortOrder(prev => prev === 'oldest' ? 'newest' : 'oldest')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Sort: {sortOrder === 'oldest' ? 'Oldest First' : 'Newest First'}</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 jarvis-scrollbar pr-1">
              {people.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                      <span className="font-bold text-xs text-white">{p.databaseName}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                        {p.relationship}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-400 font-mono">
                      {p.phoneNumbers.join(', ')}
                    </p>
                    {p.contextNotes && (
                      <p className="text-[10px] text-slate-400">{p.contextNotes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODAL 1: ADD / EDIT CONTACT MODAL                                   */}
        {/* =================================================================== */}
        <AnimatePresence>
          {isContactFormOpen && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-slate-950 border-2 border-cyan-400 rounded-3xl p-5 shadow-[0_0_60px_rgba(34,211,238,0.4)] space-y-4 max-h-[92vh] flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-sm font-black text-white uppercase">
                    {editingContactId ? `Edit Contact: ${formName}` : 'Add New Contact'}
                  </span>
                  <button onClick={() => setIsContactFormOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveContactForm} className="flex-1 overflow-y-auto jarvis-scrollbar space-y-3 pr-1 text-xs">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                        Display Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Jonathan Ganeshraj"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                        Nickname
                      </label>
                      <input
                        type="text"
                        value={formNickname}
                        onChange={(e) => setFormNickname(e.target.value)}
                        placeholder="e.g. Boss"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  {/* Organization & Title */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                        Organization
                      </label>
                      <input
                        type="text"
                        value={formOrg}
                        onChange={(e) => setFormOrg(e.target.value)}
                        placeholder="e.g. Raj Expo Digitals"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="e.g. Developer / Teacher"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  {/* Dynamic Phone Numbers */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">
                        Phone Numbers (+94 prefix normalized)
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormPhones([...formPhones, ''])}
                        className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                      >
                        + Add Phone
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {formPhones.map((ph, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={ph}
                            onChange={(e) => {
                              const updated = [...formPhones];
                              updated[idx] = e.target.value;
                              setFormPhones(updated);
                            }}
                            placeholder="+94776223997 or 077..."
                            className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                          />
                          {formPhones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setFormPhones(formPhones.filter((_, i) => i !== idx))}
                              className="px-2 text-rose-400 hover:text-rose-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Emails */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">
                        Email Addresses
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormEmails([...formEmails, ''])}
                        className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                      >
                        + Add Email
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {formEmails.map((em, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="email"
                            value={em}
                            onChange={(e) => {
                              const updated = [...formEmails];
                              updated[idx] = e.target.value;
                              setFormEmails(updated);
                            }}
                            placeholder="user@example.com"
                            className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                          />
                          {formEmails.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setFormEmails(formEmails.filter((_, i) => i !== idx))}
                              className="px-2 text-rose-400 hover:text-rose-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Relationship & Cloudinary Image URL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                        Relationship Type
                      </label>
                      <select
                        value={formRelType}
                        onChange={(e) => setFormRelType(e.target.value as RelationshipType)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                      >
                        {(['Family', 'Friend', 'Colleague', 'Business', 'Legal/Police', 'Medical', 'Service', 'Other'] as RelationshipType[]).map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                        Cloudinary Photo URL
                      </label>
                      <input
                        type="text"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="https://res.cloudinary.com/..."
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Notes & Tags */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      Notes
                    </label>
                    <textarea
                      rows={2}
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Context, history, details..."
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      Tags (Comma-Separated)
                    </label>
                    <input
                      type="text"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      placeholder="printline, official, vip"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsContactFormOpen(false)}
                      className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl uppercase cursor-pointer"
                    >
                      Save Contact
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* =================================================================== */}
        {/* MODAL 2: NATASHA AI PERSONA SUMMARY MODAL                           */}
        {/* =================================================================== */}
        <AnimatePresence>
          {summaryModalContact && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-slate-950 border-2 border-purple-400 rounded-3xl p-5 shadow-[0_0_50px_rgba(168,85,247,0.4)] space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-purple-300">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-black uppercase">
                      Natasha Persona Summary: {summaryModalContact.contact.name}
                    </span>
                  </div>
                  <button onClick={() => setSummaryModalContact(null)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 bg-slate-900 rounded-2xl border border-purple-500/30 text-xs text-purple-200 whitespace-pre-wrap leading-relaxed font-sans">
                  {summaryModalContact.summary}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(summaryModalContact.summary);
                      showToast('Summary copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-xl text-xs uppercase flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Summary</span>
                  </button>

                  <button
                    onClick={() => setSummaryModalContact(null)}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-xs uppercase cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* =================================================================== */}
        {/* MODAL 3: BIND CLOUDINARY PHOTO MODAL                                */}
        {/* =================================================================== */}
        <AnimatePresence>
          {bindModalContact && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-slate-950 border-2 border-amber-400 rounded-3xl p-5 shadow-[0_0_50px_rgba(245,158,11,0.4)] space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-amber-300">
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-sm font-black uppercase">
                      Bind Cloudinary Photo: {bindModalContact.name}
                    </span>
                  </div>
                  <button onClick={() => setBindModalContact(null)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleConfirmBindCloudinary} className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      Cloudinary Image URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={bindImageUrl}
                      onChange={(e) => setBindImageUrl(e.target.value)}
                      placeholder="https://res.cloudinary.com/uhysx6is/image/upload/..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      Image Description (appended to contact notes)
                    </label>
                    <input
                      type="text"
                      value={bindImageDesc}
                      onChange={(e) => setBindImageDesc(e.target.value)}
                      placeholder="e.g. Official headshot at Printline Wattala"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setBindModalContact(null)}
                      className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl uppercase cursor-pointer"
                    >
                      Bind Photo
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* =================================================================== */}
        {/* MODAL 4: DELETE CONFIRMATION MODAL                                  */}
        {/* =================================================================== */}
        <AnimatePresence>
          {contactToDelete && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-slate-950 border-2 border-rose-500 rounded-3xl p-6 shadow-[0_0_50px_rgba(244,63,94,0.4)] space-y-4 text-center font-mono"
              >
                <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>

                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  CONFIRM CONTACT DELETION
                </h3>

                <p className="text-xs text-slate-300">
                  Permanently remove this contact from the Central Database?
                </p>
                <p className="text-xs text-rose-300 font-bold bg-slate-900 p-2 rounded-lg break-all">
                  {contactToDelete.name} ({contactToDelete.phones.join(', ') || 'No phone'})
                </p>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setContactToDelete(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDeleteContact}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs uppercase cursor-pointer shadow-md"
                  >
                    Yes, Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};

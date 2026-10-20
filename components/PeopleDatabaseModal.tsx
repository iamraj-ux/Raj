import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Search, Phone, Mail, Edit3, Trash2, Check, X, 
  GitMerge, ShieldAlert, Sparkles, ArrowUpDown, Download, History, MessageCircle 
} from 'lucide-react';
import { 
  PersonRecord, 
  MergeSuggestion, 
  getStoredPeopleDatabase, 
  savePeopleDatabase, 
  findMatchingPerson, 
  generateMergeSuggestion, 
  dispatchPersonChangeNotification 
} from '../services/peopleDatabaseService';
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
  const [people, setPeople] = useState<PersonRecord[]>(getStoredPeopleDatabase);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'oldest' | 'newest'>('oldest');
  
  // Pending confirmation item for confirmation-first safety
  const [pendingConfirmAction, setPendingConfirmAction] = useState<{
    type: 'ADD' | 'UPDATE' | 'REMOVE';
    person: Partial<PersonRecord>;
    explanation: string;
  } | null>(null);

  // Merge Suggestion dialog state
  const [activeMerge, setActiveMerge] = useState<MergeSuggestion | null>(null);

  // Add / Edit form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formContactSavedName, setFormContactSavedName] = useState('');
  const [formPhones, setFormPhones] = useState('');
  const [formAliases, setFormAliases] = useState('');
  const [formRelationship, setFormRelationship] = useState('Friend');
  const [formNotes, setFormNotes] = useState('');

  // Reload when opened
  useEffect(() => {
    if (isOpen) {
      setPeople(getStoredPeopleDatabase());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter & Sort (Oldest -> Newest or Newest -> Oldest)
  const filteredPeople = people.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.databaseName.toLowerCase().includes(q) ||
      (p.contactSavedName && p.contactSavedName.toLowerCase().includes(q)) ||
      p.phoneNumbers.some(ph => ph.includes(q)) ||
      p.aliases.some(a => a.toLowerCase().includes(q)) ||
      p.relationship.toLowerCase().includes(q)
    );
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'oldest' ? dateA - dateB : dateB - dateA;
  });

  const handleOpenAdd = () => {
    setEditingPersonId(null);
    setFormName('');
    setFormContactSavedName('');
    setFormPhones('');
    setFormAliases('');
    setFormRelationship('Friend');
    setFormNotes('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: PersonRecord) => {
    setEditingPersonId(p.id);
    setFormName(p.databaseName);
    setFormContactSavedName(p.contactSavedName || '');
    setFormPhones(p.phoneNumbers.join(', '));
    setFormAliases(p.aliases.join(', '));
    setFormRelationship(p.relationship);
    setFormNotes(p.contextNotes || '');
    setIsFormOpen(true);
  };

  const handleSaveForm = () => {
    const phones = formPhones.split(',').map(s => s.trim()).filter(Boolean);
    const aliases = formAliases.split(',').map(s => s.trim()).filter(Boolean);

    // Check for merge suggestion if adding new person
    if (!editingPersonId && phones.length > 0) {
      const suggestion = generateMergeSuggestion(formName, phones[0]);
      if (suggestion) {
        setActiveMerge(suggestion);
        return;
      }
    }

    const targetPerson: Partial<PersonRecord> = {
      id: editingPersonId || `person-${Date.now()}`,
      databaseName: formName,
      contactSavedName: formContactSavedName,
      phoneNumbers: phones,
      aliases,
      relationship: formRelationship,
      contextNotes: formNotes,
      createdAt: editingPersonId ? (people.find(p => p.id === editingPersonId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      changeHistory: []
    };

    // Trigger confirmation safety dialog
    setPendingConfirmAction({
      type: editingPersonId ? 'UPDATE' : 'ADD',
      person: targetPerson,
      explanation: editingPersonId 
        ? `Confirm update to canonical database record for "${formName}".` 
        : `Confirm adding new canonical person record for "${formName}".`
    });
  };

  const executeConfirmedAction = () => {
    if (!pendingConfirmAction) return;

    soundManager.playAccessGrantedSound();
    const { type, person } = pendingConfirmAction;

    let updatedList = [...people];
    if (type === 'ADD') {
      updatedList.push(person as PersonRecord);
      dispatchPersonChangeNotification(person.databaseName || 'Person', 'Added to People Database');
    } else if (type === 'UPDATE') {
      updatedList = updatedList.map(p => p.id === person.id ? { ...p, ...person, updatedAt: new Date().toISOString() } : p);
      dispatchPersonChangeNotification(person.databaseName || 'Person', 'Details updated');
    } else if (type === 'REMOVE') {
      updatedList = updatedList.filter(p => p.id !== person.id);
      dispatchPersonChangeNotification(person.databaseName || 'Person', 'Removed from database');
    }

    savePeopleDatabase(updatedList, true);
    setPeople(updatedList);
    setPendingConfirmAction(null);
    setIsFormOpen(false);
    logActivity('DATABASE', `People Database ${type}`, `Record: ${person.databaseName}`);
  };

  const handleExportCSV = () => {
    const headers = ['Database Name', 'Contact Saved Name', 'Phone Numbers', 'Aliases', 'Relationship', 'Context Notes', 'Created At'];
    const rows = people.map(p => [
      `"${p.databaseName}"`,
      `"${p.contactSavedName || ''}"`,
      `"${p.phoneNumbers.join('; ')}"`,
      `"${p.aliases.join('; ')}"`,
      `"${p.relationship}"`,
      `"${(p.contextNotes || '').replace(/"/g, '""')}"`,
      `"${p.createdAt}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rajexpo_people_database_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    soundManager.playClickSound();
  };

  return (
    <div className="fixed inset-0 z-[9990] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 md:p-6 select-none font-mono">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl h-[92vh] bg-slate-900 border-2 border-cyan-400/70 rounded-3xl shadow-[0_0_80px_rgba(34,211,238,0.4)] flex flex-col overflow-hidden relative"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/40">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-cyan-300 uppercase tracking-widest">
                PEOPLE DATABASE + CONTACT INTELLIGENCE
              </h2>
              <p className="text-[9px] text-cyan-500/70 uppercase">
                Chronological Record: Oldest → Newest // Smart Matching & Merging
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortOrder(prev => prev === 'oldest' ? 'newest' : 'oldest')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 rounded-xl text-[10px] uppercase font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort: {sortOrder === 'oldest' ? 'Oldest First' : 'Newest First'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-[10px] uppercase font-bold flex items-center gap-1.5 cursor-pointer"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV Export</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Person</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-cyan-500/20 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Database Name, Contact Name, Phone (+94...), Alias, or Relationship..."
              className="w-full bg-slate-900 border border-cyan-500/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-sans"
            />
          </div>
          <span className="text-[10px] text-cyan-400 font-mono shrink-0">
            {filteredPeople.length} Records Found
          </span>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 jarvis-scrollbar">
          {filteredPeople.map((p, idx) => (
            <div
              key={p.id}
              className="p-4 bg-slate-950/80 hover:bg-slate-900/90 border border-cyan-500/20 hover:border-cyan-400/60 rounded-2xl transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-cyan-500/60">#{idx + 1}</span>
                  <h3 className="text-sm font-black text-cyan-200 uppercase tracking-wide">
                    {p.databaseName}
                  </h3>
                  {p.contactSavedName && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-[9px] font-bold border border-cyan-500/30">
                      Contact: {p.contactSavedName}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 text-[9px] font-bold border border-amber-500/30">
                    {p.relationship}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-300 flex-wrap">
                  {p.phoneNumbers.map((ph, i) => (
                    <span key={i} className="flex items-center gap-1 font-mono text-emerald-400">
                      <Phone className="w-3 h-3 text-emerald-500" /> {ph}
                    </span>
                  ))}
                  {p.aliases.length > 0 && (
                    <span className="text-slate-400 text-[10px]">
                      Aliases: {p.aliases.join(', ')}
                    </span>
                  )}
                </div>

                {p.contextNotes && (
                  <p className="text-[10px] text-slate-400 font-sans line-clamp-2 pt-0.5">
                    {p.contextNotes}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {p.phoneNumbers.length > 0 && onSelectPersonForWhatsApp && (
                  <button
                    onClick={() => {
                      onSelectPersonForWhatsApp(p.phoneNumbers[0], p.databaseName);
                      onClose();
                    }}
                    className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                    title="Write WhatsApp Message"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-[9px] font-bold uppercase">WhatsApp</span>
                  </button>
                )}

                <button
                  onClick={() => handleOpenEdit(p)}
                  className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl cursor-pointer"
                  title="Edit Record"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    setPendingConfirmAction({
                      type: 'REMOVE',
                      person: p,
                      explanation: `Remove "${p.databaseName}" from Central People Database.`
                    });
                  }}
                  className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl cursor-pointer"
                  title="Remove Record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add / Edit Form Modal */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/95 backdrop-blur-md p-6 flex flex-col justify-between z-50 jarvis-scrollbar overflow-y-auto"
            >
              <div className="space-y-4 max-w-2xl mx-auto w-full">
                <h3 className="text-sm font-black text-cyan-300 uppercase">
                  {editingPersonId ? 'EDIT CANONICAL PERSON RECORD' : 'ADD NEW CANONICAL PERSON RECORD'}
                </h3>

                <div>
                  <label className="text-[10px] text-cyan-400 uppercase font-bold">Canonical Database Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Jonathan Raj, Dilan Danush, etc."
                    className="w-full bg-slate-900 border border-cyan-500/30 rounded-xl p-2.5 text-xs text-white mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Contact Saved Name (from Phone)</label>
                  <input
                    type="text"
                    value={formContactSavedName}
                    onChange={(e) => setFormContactSavedName(e.target.value)}
                    placeholder="e.g. Dilan, Tharu, etc."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Phone Numbers (comma separated)</label>
                  <input
                    type="text"
                    value={formPhones}
                    onChange={(e) => setFormPhones(e.target.value)}
                    placeholder="+94776223997, +94719572762"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Known Aliases (comma separated)</label>
                  <input
                    type="text"
                    value={formAliases}
                    onChange={(e) => setFormAliases(e.target.value)}
                    placeholder="Boss, Junior, Son"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Relationship / Category</label>
                  <select
                    value={formRelationship}
                    onChange={(e) => setFormRelationship(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white mt-1"
                  >
                    <option>Family</option>
                    <option>Significant Other</option>
                    <option>Friend</option>
                    <option>Colleague</option>
                    <option>Business Partner</option>
                    <option>Customer</option>
                    <option>Mentor</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Context Notes</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Important background notes, workplace, address, relationship history..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white mt-1 h-20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 max-w-2xl mx-auto w-full pt-4 border-t border-slate-800">
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs uppercase font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveForm}
                  disabled={!formName.trim()}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black uppercase cursor-pointer disabled:opacity-50"
                >
                  Review Changes
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmation-First Safety Dialog */}
        <AnimatePresence>
          {pendingConfirmAction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
            >
              <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-6 h-6 text-amber-400" />
                  <h3 className="text-sm font-black text-amber-300 uppercase">
                    CONFIRM DATABASE CHANGE [{pendingConfirmAction.type}]
                  </h3>
                </div>
                <p className="text-xs text-slate-300">
                  {pendingConfirmAction.explanation}
                </p>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-cyan-300 space-y-1 font-mono">
                  <div>Record: {pendingConfirmAction.person.databaseName}</div>
                  {pendingConfirmAction.person.phoneNumbers && (
                    <div>Phones: {pendingConfirmAction.person.phoneNumbers.join(', ')}</div>
                  )}
                  <div>Category: {pendingConfirmAction.person.relationship}</div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setPendingConfirmAction(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs uppercase font-bold cursor-pointer"
                  >
                    [ CANCEL ]
                  </button>
                  <button
                    onClick={executeConfirmedAction}
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black uppercase cursor-pointer"
                  >
                    [ {pendingConfirmAction.type} ]
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggested Identity Merge Dialog */}
        <AnimatePresence>
          {activeMerge && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
            >
              <div className="bg-slate-900 border-2 border-cyan-400 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <GitMerge className="w-6 h-6 text-cyan-400" />
                  <div>
                    <h3 className="text-sm font-black text-cyan-300 uppercase">
                      SUGGESTED IDENTITY MERGE
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Match Confidence: {Math.round(activeMerge.confidence * 100)}% ({activeMerge.reason})
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-200">
                  A contact for <span className="text-cyan-300 font-bold">"{activeMerge.contactSavedName}"</span> matches existing canonical record <span className="text-amber-300 font-bold">"{activeMerge.canonicalName}"</span>.
                </p>

                <div className="p-3 bg-slate-950 rounded-xl border border-cyan-500/30 text-[11px] space-y-2">
                  <div className="text-cyan-400 font-bold uppercase">Proposed Merge Details:</div>
                  <div className="text-slate-300">
                    • Add Alias: "{activeMerge.contactSavedName}"
                  </div>
                  <div className="text-slate-300">
                    • Confirm Phone: {activeMerge.matchingPhoneNumber}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setActiveMerge(null)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs uppercase cursor-pointer"
                  >
                    [ Reject ]
                  </button>
                  <button
                    onClick={() => {
                      setActiveMerge(null);
                      handleOpenEdit(activeMerge.existingData as PersonRecord);
                    }}
                    className="px-3 py-1.5 bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs uppercase cursor-pointer"
                  >
                    [ Edit ]
                  </button>
                  <button
                    onClick={() => {
                      const updated = people.map(p => {
                        if (p.databaseName === activeMerge.canonicalName) {
                          return {
                            ...p,
                            aliases: Array.from(new Set([...p.aliases, activeMerge.contactSavedName])),
                            phoneNumbers: Array.from(new Set([...p.phoneNumbers, activeMerge.matchingPhoneNumber])),
                            updatedAt: new Date().toISOString()
                          };
                        }
                        return p;
                      });
                      savePeopleDatabase(updated, true);
                      setPeople(updated);
                      dispatchPersonChangeNotification(activeMerge.canonicalName, `Merged identity with "${activeMerge.contactSavedName}"`);
                      soundManager.playAccessGrantedSound();
                      setActiveMerge(null);
                      setIsFormOpen(false);
                    }}
                    className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs uppercase cursor-pointer"
                  >
                    [ Confirm Merge ]
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

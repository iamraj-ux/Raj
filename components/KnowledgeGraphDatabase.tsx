import React, { useState, useEffect, useMemo } from 'react';
import { 
  Network, Database, Search, User, AlertTriangle, MessageSquare, Bell, 
  CheckSquare, FolderGit2, Terminal, Cpu, Globe, Building, Smartphone, 
  FileText, Folder, Sparkles, BookOpen, MapPin, Calendar, Contact, 
  Phone, Mail, CreditCard, Car, Wrench, Code2, Award, Target, Lightbulb, 
  StickyNote, Plus, RefreshCw, ChevronRight, ArrowLeft, ExternalLink, 
  ShieldCheck, Activity, Layers, Tag, Key, Info, Zap, Trash2, Eye, Share2,
  Download, Cloud, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EntityType, 
  Entity, 
  MemoryItem, 
  KnowledgeGraphData, 
  getStoredKnowledgeGraph, 
  saveKnowledgeGraph, 
  autoLinkAndIngestMemory, 
  addOrUpdateEntity, 
  resetKnowledgeGraphToDefault,
  findExistingMemory,
  findExistingEntity,
  updateExistingMemoryWithDirective,
  updateExistingEntityWithDirective
} from '../services/knowledgeGraph';
import { logActivity } from '../services/activityLogger';
import { exportKnowledgeGraphAsImage } from '../services/knowledgeGraphExport';
import { DraggableResizableWindow } from './DraggableResizableWindow';
import { DatabaseExportModal } from './DatabaseExportModal';
import { GoogleDriveAssetModal } from './GoogleDriveAssetModal';
import { NatashaReminderModal, DuplicateReminderPayload } from './NatashaReminderModal';

// Helper icon getter for entity types
export const getEntityIcon = (type: EntityType) => {
  switch (type) {
    case 'Person': return <User className="w-4 h-4 text-cyan-400" />;
    case 'Incident': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    case 'Conversation': return <MessageSquare className="w-4 h-4 text-emerald-400" />;
    case 'Reminder': return <Bell className="w-4 h-4 text-yellow-400" />;
    case 'Task': return <CheckSquare className="w-4 h-4 text-purple-400" />;
    case 'Project': return <FolderGit2 className="w-4 h-4 text-blue-400" />;
    case 'Prompt': return <Terminal className="w-4 h-4 text-pink-400" />;
    case 'App': return <Cpu className="w-4 h-4 text-cyan-300" />;
    case 'Website': return <Globe className="w-4 h-4 text-teal-400" />;
    case 'Company': case 'Business': return <Building className="w-4 h-4 text-indigo-400" />;
    case 'Device': return <Smartphone className="w-4 h-4 text-slate-300" />;
    case 'File': return <FileText className="w-4 h-4 text-sky-400" />;
    case 'Folder': return <Folder className="w-4 h-4 text-amber-300" />;
    case 'AI Model': return <Sparkles className="w-4 h-4 text-emerald-300" />;
    case 'University': return <BookOpen className="w-4 h-4 text-orange-400" />;
    case 'Place': return <MapPin className="w-4 h-4 text-rose-400" />;
    case 'Event': return <Calendar className="w-4 h-4 text-emerald-400" />;
    case 'Contact': return <Contact className="w-4 h-4 text-cyan-400" />;
    case 'PhoneNumber': return <Phone className="w-4 h-4 text-green-400" />;
    case 'Email': return <Mail className="w-4 h-4 text-blue-300" />;
    case 'BankAccount': return <CreditCard className="w-4 h-4 text-yellow-300" />;
    case 'Vehicle': return <Car className="w-4 h-4 text-red-400" />;
    case 'Tool': return <Wrench className="w-4 h-4 text-slate-400" />;
    case 'ProgrammingLanguage': return <Code2 className="w-4 h-4 text-indigo-300" />;
    case 'Skill': return <Award className="w-4 h-4 text-amber-400" />;
    case 'Goal': return <Target className="w-4 h-4 text-emerald-400" />;
    case 'Idea': return <Lightbulb className="w-4 h-4 text-yellow-400" />;
    case 'Note': default: return <StickyNote className="w-4 h-4 text-slate-400" />;
  }
};

const ENTITY_TYPES_LIST: EntityType[] = [
  'Person', 'Incident', 'Conversation', 'Reminder', 'Task', 'Project', 
  'Prompt', 'App', 'Website', 'Company', 'Device', 'File', 'Folder', 
  'AI Model', 'University', 'Business', 'Place', 'Event', 'Contact', 
  'PhoneNumber', 'Email', 'BankAccount', 'Vehicle', 'Tool', 
  'ProgrammingLanguage', 'Skill', 'Goal', 'Idea', 'Note'
];

export const KnowledgeGraphDatabase: React.FC = () => {
  const [graphData, setGraphData] = useState<KnowledgeGraphData>(getStoredKnowledgeGraph);
  const [activeTab, setActiveTab] = useState<'graph' | 'entities' | 'memories'>('graph');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('ALL');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>('ent-jonathan-raj');
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);

  // Modal / Add states
  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false);
  const [newMemTitle, setNewMemTitle] = useState('');
  const [newMemCategory, setNewMemCategory] = useState('Operations');
  const [newMemDesc, setNewMemDesc] = useState('');
  const [newMemTags, setNewMemTags] = useState('');
  const [newMemImportance, setNewMemImportance] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');

  const [isAddEntityOpen, setIsAddEntityOpen] = useState(false);
  const [newEntName, setNewEntName] = useState('');
  const [newEntType, setNewEntType] = useState<EntityType>('Person');
  const [newEntDesc, setNewEntDesc] = useState('');
  const [newEntAliases, setNewEntAliases] = useState('');

  // Export & Drive Vault modal states
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDriveVaultOpen, setIsDriveVaultOpen] = useState(false);
  const [duplicateReminder, setDuplicateReminder] = useState<DuplicateReminderPayload | null>(null);

  const handleExportImage = () => {
    exportKnowledgeGraphAsImage(graphData);
    logActivity('DATABASE', 'Knowledge Graph Topology Exported', 'Snapshot rendered and downloaded as image (.png/.svg)');
  };

  // Sync state changes across windows
  useEffect(() => {
    const handleGraphUpdated = (e: Event) => {
      const customEv = e as CustomEvent<KnowledgeGraphData>;
      if (customEv.detail) {
        setGraphData(customEv.detail);
      }
    };
    const handleOpenDriveVault = () => setIsDriveVaultOpen(true);
    const handleOpenDatabaseExport = () => setIsExportOpen(true);

    window.addEventListener('knowledge-graph-updated', handleGraphUpdated);
    window.addEventListener('open-drive-vault', handleOpenDriveVault);
    window.addEventListener('open-database-export', handleOpenDatabaseExport);

    return () => {
      window.removeEventListener('knowledge-graph-updated', handleGraphUpdated);
      window.removeEventListener('open-drive-vault', handleOpenDriveVault);
      window.removeEventListener('open-database-export', handleOpenDatabaseExport);
    };
  }, []);

  const refreshData = () => {
    setGraphData(getStoredKnowledgeGraph());
  };

  // Filtered entities and memories by search query and type
  const filteredEntities = useMemo(() => {
    return graphData.entities.filter(ent => {
      const matchesType = selectedEntityType === 'ALL' || ent.type === selectedEntityType;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesType;

      const nameMatch = ent.name.toLowerCase().includes(q);
      const descMatch = ent.description.toLowerCase().includes(q);
      const aliasMatch = ent.aliases.some(a => a.toLowerCase().includes(q));
      const typeMatch = ent.type.toLowerCase().includes(q);

      return matchesType && (nameMatch || descMatch || aliasMatch || typeMatch);
    });
  }, [graphData.entities, searchQuery, selectedEntityType]);

  const filteredMemories = useMemo(() => {
    return graphData.memories.filter(mem => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const titleMatch = mem.title.toLowerCase().includes(q);
      const descMatch = mem.description.toLowerCase().includes(q);
      const catMatch = mem.category.toLowerCase().includes(q);
      const tagMatch = mem.tags.some(t => t.toLowerCase().includes(q));
      const keywordMatch = mem.keywords.some(k => k.toLowerCase().includes(q));

      return titleMatch || descMatch || catMatch || tagMatch || keywordMatch;
    });
  }, [graphData.memories, searchQuery]);

  // Selected Active Entity for Inspector
  const activeEntity = useMemo(() => {
    if (!selectedEntityId) return null;
    return graphData.entities.find(e => e.id === selectedEntityId) || null;
  }, [graphData.entities, selectedEntityId]);

  // Connected entities for selected active entity
  const connectedEntitiesList = useMemo(() => {
    if (!activeEntity) return [];
    return graphData.entities.filter(e => activeEntity.connectedEntityIds.includes(e.id));
  }, [activeEntity, graphData.entities]);

  // Connected memories for selected active entity
  const connectedMemoriesList = useMemo(() => {
    if (!activeEntity) return [];
    return graphData.memories.filter(m => 
      activeEntity.connectedMemoryIds.includes(m.id) || 
      m.connectedEntityIds.includes(activeEntity.id)
    );
  }, [activeEntity, graphData.memories]);

  // Handle Add New Memory with Auto Linking
  const executeCreateMemory = (updateExistingId?: string, updateDate: boolean = true) => {
    const tagsArray = newMemTags.split(',').map(t => t.trim()).filter(Boolean);

    if (updateExistingId) {
      updateExistingMemoryWithDirective(
        updateExistingId,
        {
          title: newMemTitle.trim(),
          description: newMemDesc.trim(),
          category: newMemCategory,
          tags: tagsArray,
          importanceLevel: newMemImportance,
          summary: newMemDesc.trim().slice(0, 120)
        },
        updateDate
      );
      logActivity(
        'DATABASE', 
        `Knowledge Graph Memory Updated (${updateDate ? 'New Date' : 'Same Date'})`, 
        `Title: "${newMemTitle}" | Category: ${newMemCategory}`,
        `Action authorized by Boss`
      );
    } else {
      const result = autoLinkAndIngestMemory(
        newMemTitle,
        newMemDesc,
        newMemCategory,
        tagsArray,
        newMemImportance
      );

      logActivity(
        'DATABASE', 
        'Knowledge Graph Memory Created', 
        `Title: "${newMemTitle}" | Category: ${newMemCategory}`, 
        `Auto-linked to ${result.memory.connectedEntityIds.length} entities`
      );
    }

    setNewMemTitle('');
    setNewMemDesc('');
    setNewMemTags('');
    setIsAddMemoryOpen(false);
    refreshData();
  };

  const handleCreateMemorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemTitle.trim() || !newMemDesc.trim()) return;

    // Check duplicate memory
    const existing = findExistingMemory(newMemTitle);
    if (existing) {
      setDuplicateReminder({
        itemType: 'MEMORY',
        existingTitle: existing.title,
        existingDate: existing.dateTime || existing.lastUpdated,
        existingCategory: `${existing.category} [${existing.importanceLevel}]`,
        existingDescription: existing.description,
        newTitle: newMemTitle.trim(),
        newCategory: `${newMemCategory} [${newMemImportance}]`,
        newDescription: newMemDesc.trim(),
        onUpdateWithNewDate: () => {
          executeCreateMemory(existing.id, true);
        },
        onIgnore: () => {
          setIsAddMemoryOpen(false);
          logActivity('DATABASE', 'Duplicate Memory Ignored', `Title: "${newMemTitle}"`);
        },
        onReplaceSameDate: () => {
          executeCreateMemory(existing.id, false);
        }
      });
      return;
    }

    executeCreateMemory();
  };

  // Handle Create New Entity
  const executeCreateEntity = (updateExistingId?: string, updateDate: boolean = true) => {
    const aliasesArr = newEntAliases.split(',').map(a => a.trim()).filter(Boolean);

    if (updateExistingId) {
      updateExistingEntityWithDirective(
        updateExistingId,
        {
          name: newEntName.trim(),
          type: newEntType,
          aliases: aliasesArr,
          description: newEntDesc.trim() || `Entity record for ${newEntName}.`
        },
        updateDate
      );
      logActivity(
        'DATABASE', 
        `Knowledge Graph Entity Updated (${updateDate ? 'New Date' : 'Same Date'})`, 
        `Name: ${newEntName} | Type: ${newEntType}`
      );
    } else {
      const newEntity: Entity = {
        id: `ent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: newEntName,
        type: newEntType,
        aliases: aliasesArr,
        description: newEntDesc || `Entity record for ${newEntName}.`,
        createdDate: new Date().toLocaleString(),
        modifiedDate: new Date().toLocaleString(),
        importanceScore: 75,
        timeline: [{
          id: `tl-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          eventTitle: 'Entity Created in Knowledge Graph',
          eventDescription: `Registered under category ${newEntType}`,
          relatedEntityIds: ['ent-jonathan-raj', 'ent-raj-expo']
        }],
        connectedEntityIds: ['ent-jonathan-raj', 'ent-raj-expo'],
        connectedMemoryIds: []
      };

      addOrUpdateEntity(newEntity);
      logActivity('DATABASE', 'Knowledge Graph Entity Registered', `Name: ${newEntName} | Type: ${newEntType}`);
      setSelectedEntityId(newEntity.id);
    }

    setNewEntName('');
    setNewEntDesc('');
    setNewEntAliases('');
    setIsAddEntityOpen(false);
    refreshData();
  };

  const handleCreateEntitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntName.trim()) return;

    // Check duplicate entity
    const existing = findExistingEntity(newEntName);
    if (existing) {
      setDuplicateReminder({
        itemType: 'ENTITY',
        existingTitle: existing.name,
        existingDate: existing.modifiedDate || existing.createdDate,
        existingCategory: existing.type,
        existingDescription: existing.description,
        newTitle: newEntName.trim(),
        newCategory: newEntType,
        newDescription: newEntDesc.trim() || `Entity record for ${newEntName}.`,
        onUpdateWithNewDate: () => {
          executeCreateEntity(existing.id, true);
        },
        onIgnore: () => {
          setIsAddEntityOpen(false);
          logActivity('DATABASE', 'Duplicate Entity Ignored', `Name: "${newEntName}"`);
        },
        onReplaceSameDate: () => {
          executeCreateEntity(existing.id, false);
        }
      });
      return;
    }

    executeCreateEntity();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-white font-mono text-xs overflow-hidden select-none">
      
      {/* HEADER BAR */}
      <div className="bg-slate-900/90 border-b border-cyan-500/30 p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.3)] text-cyan-400">
            <Network className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                RAJ EXPO CENTRAL DATABASE (KNOWLEDGE GRAPH)
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" /> AUTO-LINKING ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-cyan-400/70 font-sans mt-0.5">
              Relational knowledge neural network with many-to-many cross navigation across entities and memory trees.
            </p>
          </div>
        </div>

        {/* Global Stats & Actions */}
        <div className="flex items-center gap-2.5 text-[10px] font-mono shrink-0 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-cyan-300 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span>ENTITIES: <strong className="text-white text-xs">{graphData.entities.length}</strong></span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-cyan-300 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>MEMORIES: <strong className="text-white text-xs">{graphData.memories.length}</strong></span>
          </div>

          <button
            onClick={() => setIsExportOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-slate-950 border border-purple-500/40 font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.25)] transition-all hover:scale-105 active:scale-95"
            title="Download database datasets in DOCX, TXT, PDF, HTML, or JSON format"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span>EXPORT DATASET</span>
          </button>

          <button
            onClick={handleExportImage}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.25)] transition-all hover:scale-105 active:scale-95"
            title="Export visual knowledge graph topology map as PNG or SVG image"
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>EXPORT IMAGE</span>
          </button>

          <button
            onClick={() => setIsDriveVaultOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-slate-950 border border-sky-500/40 font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(14,165,233,0.25)] transition-all hover:scale-105 active:scale-95"
            title="Open Google Drive vault to store asset links & let Natasha memorize them"
          >
            <Cloud className="w-3.5 h-3.5 text-sky-400" />
            <span>GOOGLE DRIVE VAULT</span>
          </button>

          <button
            onClick={() => setIsAddMemoryOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> ADD MEMORY
          </button>

          <button
            onClick={() => setIsAddEntityOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> ADD ENTITY
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-slate-900/60 p-3 border-b border-cyan-500/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="CROSS-SEARCH ENTITY, NAME, PERSON, INCIDENT, PROMPT, APP, REMINDER, DATE..."
            className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-cyan-500/40 uppercase tracking-wider focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-cyan-500/30">
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'graph' ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'text-cyan-300 hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5" /> GRAPH MAP
          </button>

          <button
            onClick={() => setActiveTab('entities')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'entities' ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'text-cyan-300 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" /> ENTITIES ({filteredEntities.length})
          </button>

          <button
            onClick={() => setActiveTab('memories')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'memories' ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'text-cyan-300 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> MEMORIES ({filteredMemories.length})
          </button>
        </div>
      </div>

      {/* MAIN CONTENT WORKSPACE */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

        {/* LEFT WORKSPACE (GRAPH OR ENTITY LIST OR MEMORIES LIST) */}
        <div className="flex-1 overflow-y-auto jarvis-scrollbar p-4 space-y-4 border-r border-cyan-500/20">

          {/* TAB 1: VISUAL GRAPH TOPOLOGY CANVAS */}
          {activeTab === 'graph' && (
            <div className="flex flex-col h-full space-y-4">
              <div className="p-3 bg-slate-900/80 border border-cyan-500/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-cyan-300 font-mono">
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>INTERACTIVE GRAPH NODES: CLICK ANY NODE TO OPEN FULL INSPECTOR</span>
                </div>
                <button
                  onClick={resetKnowledgeGraphToDefault}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-red-950 border border-cyan-500/30 hover:border-red-500/50 text-[9px] text-cyan-300 hover:text-red-300 rounded-lg flex items-center gap-1 transition-all"
                  title="Reset graph to seed data"
                >
                  <RefreshCw className="w-3 h-3" /> RESET GRAPH
                </button>
              </div>

              {/* Node Grid Layout */}
              <div className="flex-1 bg-slate-950/80 border border-cyan-500/20 rounded-2xl p-6 relative overflow-y-auto jarvis-scrollbar min-h-[400px]">
                {/* SVG Connecting Edges */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                  <defs>
                    <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                  {graphData.entities.map((ent, i) => {
                    return ent.connectedEntityIds.map(targetId => {
                      const targetEnt = graphData.entities.find(e => e.id === targetId);
                      if (!targetEnt) return null;
                      return (
                        <line
                          key={`${ent.id}-${targetId}`}
                          x1={`${((i * 18 + 10) % 90)}%`}
                          y1={`${((i * 24 + 15) % 80)}%`}
                          x2={`${((graphData.entities.indexOf(targetEnt) * 18 + 10) % 90)}%`}
                          y2={`${((graphData.entities.indexOf(targetEnt) * 24 + 15) % 80)}%`}
                          stroke="url(#edgeGrad)"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                        />
                      );
                    });
                  })}
                </svg>

                {/* Nodes render */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 relative z-10">
                  {filteredEntities.map((ent) => {
                    const isSelected = selectedEntityId === ent.id;
                    return (
                      <motion.div
                        key={ent.id}
                        onClick={() => setSelectedEntityId(ent.id)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] ring-1 ring-cyan-400'
                            : 'bg-slate-900/90 border-cyan-500/20 hover:border-cyan-500/50 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-slate-950 border border-cyan-500/30">
                              {getEntityIcon(ent.type)}
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-cyan-400 tracking-wider">
                                {ent.type}
                              </span>
                              <h4 className="text-xs font-black text-white uppercase tracking-wider line-clamp-1">
                                {ent.name}
                              </h4>
                            </div>
                          </div>

                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-950 border border-amber-500/40 text-amber-300">
                            SCORE {ent.importanceScore}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-300 font-sans leading-relaxed line-clamp-2">
                          {ent.description}
                        </p>

                        <div className="pt-2 border-t border-cyan-500/10 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                          <span>EDGES: <strong className="text-cyan-300">{ent.connectedEntityIds.length}</strong></span>
                          <span>MEMORIES: <strong className="text-emerald-400">{ent.connectedMemoryIds.length}</strong></span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ENTITIES LIST & CATEGORY SELECTOR */}
          {activeTab === 'entities' && (
            <div className="space-y-4">
              {/* Category chips filter */}
              <div className="flex gap-2 overflow-x-auto pb-1 jarvis-scrollbar">
                <button
                  onClick={() => setSelectedEntityType('ALL')}
                  className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider shrink-0 transition-all ${
                    selectedEntityType === 'ALL'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                      : 'bg-slate-900 border-cyan-500/20 text-slate-400 hover:text-cyan-300'
                  }`}
                >
                  ALL TYPES
                </button>
                {ENTITY_TYPES_LIST.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedEntityType(t)}
                    className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider shrink-0 transition-all ${
                      selectedEntityType === t
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                        : 'bg-slate-900 border-cyan-500/20 text-slate-400 hover:text-cyan-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Entity cards list */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredEntities.map(ent => (
                  <div
                    key={ent.id}
                    onClick={() => setSelectedEntityId(ent.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      selectedEntityId === ent.id
                        ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                        : 'bg-slate-900/80 border-cyan-500/20 hover:border-cyan-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getEntityIcon(ent.type)}
                        <span className="text-[9px] text-cyan-400 uppercase font-bold">{ent.type}</span>
                      </div>
                      <span className="text-[9px] text-slate-400">{ent.modifiedDate}</span>
                    </div>

                    <h4 className="text-xs font-black text-white uppercase tracking-wider">{ent.name}</h4>
                    <p className="text-[10px] text-slate-300 font-sans leading-relaxed line-clamp-2">{ent.description}</p>

                    {ent.aliases.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {ent.aliases.map(a => (
                          <span key={a} className="text-[9px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded border border-cyan-500/20">
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MEMORIES DATABASE TABLE */}
          {activeTab === 'memories' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMemories.map(mem => (
                  <div
                    key={mem.id}
                    onClick={() => {
                      if (mem.connectedEntityIds.length > 0) {
                        setSelectedEntityId(mem.connectedEntityIds[0]);
                      }
                    }}
                    className="p-4 bg-slate-900/90 border border-cyan-500/20 hover:border-cyan-500/50 rounded-2xl space-y-3 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-[9px] text-cyan-300 uppercase font-bold">
                        {mem.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        mem.importanceLevel === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-500/40' :
                        mem.importanceLevel === 'HIGH' ? 'bg-amber-950 text-amber-400 border border-amber-500/40' : 'bg-slate-950 text-cyan-400 border border-cyan-500/30'
                      }`}>
                        {mem.importanceLevel}
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-white uppercase tracking-wider">{mem.title}</h4>
                    <p className="text-[10px] text-slate-300 font-sans leading-relaxed">{mem.description}</p>

                    <div className="flex flex-wrap gap-1">
                      {mem.tags.map(t => (
                        <span key={t} className="text-[9px] bg-slate-950 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                          #{t}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-cyan-500/10 flex items-center justify-between text-[9px] text-slate-400">
                      <span>LINKED ENTITIES: {mem.connectedEntityIds.length}</span>
                      <span>{mem.dateTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT WORKSPACE: ENTITY & MEMORY CROSS-INSPECTOR DRAWER */}
        <div className="w-full lg:w-[420px] bg-slate-900/90 border-l border-cyan-500/30 p-5 overflow-y-auto jarvis-scrollbar flex flex-col space-y-5 shrink-0">
          {activeEntity ? (
            <>
              {/* Profile Header */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300">
                      {getEntityIcon(activeEntity.type)}
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">
                        {activeEntity.type} ENTITY PROFILE
                      </span>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        {activeEntity.name}
                      </h3>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 text-[10px] font-black">
                    SCORE {activeEntity.importanceScore}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 font-sans leading-relaxed relative z-10">
                  {activeEntity.description}
                </p>

                {activeEntity.aliases.length > 0 && (
                  <div className="flex flex-wrap gap-1 relative z-10">
                    <span className="text-[9px] text-slate-400 uppercase">ALIASES:</span>
                    {activeEntity.aliases.map(a => (
                      <span key={a} className="text-[9px] bg-slate-900 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/20 font-mono">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* CONNECTED ENTITIES (INSTANT CLICKABLE CROSS-NAVIGATION) */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center justify-between">
                  <span>CONNECTED ENTITIES ({connectedEntitiesList.length})</span>
                  <span className="text-[9px] text-cyan-400/80">CLICK TO JUMP</span>
                </h4>

                <div className="flex flex-wrap gap-2">
                  {connectedEntitiesList.map(ent => (
                    <button
                      key={ent.id}
                      onClick={() => setSelectedEntityId(ent.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-cyan-950 border border-cyan-500/30 hover:border-cyan-400 text-cyan-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      {getEntityIcon(ent.type)}
                      <span>{ent.name}</span>
                      <ChevronRight className="w-3 h-3 text-cyan-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* CONNECTED MEMORIES & CONVERSATIONS */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                  <span>RELATED MEMORIES & CONVERSATIONS ({connectedMemoriesList.length})</span>
                </h4>

                {connectedMemoriesList.map(mem => (
                  <div key={mem.id} className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-emerald-300 uppercase">{mem.category}</span>
                      <span className="text-[9px] text-slate-400">{mem.dateTime}</span>
                    </div>
                    <h5 className="text-xs font-bold text-white uppercase">{mem.title}</h5>
                    <p className="text-[10px] text-slate-300 font-sans leading-relaxed">{mem.summary}</p>
                  </div>
                ))}
              </div>

              {/* TIMELINE HISTORY */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  TIMELINE & INCIDENTS ({activeEntity.timeline.length})
                </h4>

                <div className="space-y-2 border-l-2 border-cyan-500/30 pl-3 ml-1">
                  {activeEntity.timeline.map(tl => (
                    <div key={tl.id} className="space-y-1 relative">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 absolute -left-[17px] top-1" />
                      <span className="text-[9px] text-cyan-400 font-mono">{tl.timestamp}</span>
                      <h6 className="text-xs font-bold text-white uppercase">{tl.eventTitle}</h6>
                      <p className="text-[10px] text-slate-300 font-sans">{tl.eventDescription}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-6 space-y-3">
              <Network className="w-10 h-10 text-cyan-500/40 animate-pulse" />
              <p className="text-xs uppercase font-bold text-cyan-300">SELECT ANY NODE OR ENTITY TO INSPECT ITS KNOWLEDGE GRAPH</p>
            </div>
          )}
        </div>

      </div>

      {/* CREATE MEMORY WINDOW (DRAGGABLE & RESIZABLE) */}
      <DraggableResizableWindow
        isOpen={isAddMemoryOpen}
        onClose={() => setIsAddMemoryOpen(false)}
        title="ADD MEMORY (AUTO-LINKING ENGINE)"
        subtitle="Ingests record & connects across people, apps, devices, incidents"
        icon={<Plus className="w-4 h-4 text-cyan-400" />}
        initialWidth={620}
        initialHeight={560}
      >
        <div className="p-5 font-mono text-xs text-white">
          <form onSubmit={handleCreateMemorySubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-cyan-400 uppercase">TITLE</label>
              <input
                type="text"
                required
                value={newMemTitle}
                onChange={(e) => setNewMemTitle(e.target.value)}
                placeholder="E.G. AMAZON ASSESSMENT REVIEW WITH DILAN"
                className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2.5 text-xs text-white uppercase font-mono mt-1 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-cyan-400 uppercase">CATEGORY</label>
                <input
                  type="text"
                  value={newMemCategory}
                  onChange={(e) => setNewMemCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2.5 text-xs text-white uppercase font-mono mt-1 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-cyan-400 uppercase">IMPORTANCE</label>
                <select
                  value={newMemImportance}
                  onChange={(e: any) => setNewMemImportance(e.target.value)}
                  className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2.5 text-xs text-white uppercase font-mono mt-1 focus:border-cyan-400 focus:outline-none"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-cyan-400 uppercase">DESCRIPTION</label>
              <textarea
                rows={4}
                required
                value={newMemDesc}
                onChange={(e) => setNewMemDesc(e.target.value)}
                placeholder="ENTER MEMORY CONTENT... NATASHA WILL AUTOMATICALLY DETECT PEOPLE, APPS, INCIDENTS, AND CREATES CONNECTED EDGES!"
                className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2.5 text-xs text-white uppercase font-mono mt-1 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-cyan-400 uppercase">TAGS (COMMA SEPARATED)</label>
              <input
                type="text"
                value={newMemTags}
                onChange={(e) => setNewMemTags(e.target.value)}
                placeholder="Jonathan Raj, Dilan, Amazon, Python"
                className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2.5 text-xs text-white uppercase font-mono mt-1 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.3)] mt-2"
            >
              INGEST MEMORY & AUTO-LINK GRAPH
            </button>
          </form>
        </div>
      </DraggableResizableWindow>

      {/* CREATE ENTITY WINDOW (DRAGGABLE & RESIZABLE) */}
      <DraggableResizableWindow
        isOpen={isAddEntityOpen}
        onClose={() => setIsAddEntityOpen(false)}
        title="REGISTER NEW ENTITY NODE"
        subtitle="Adds node to neural relational graph with cross-entity links"
        icon={<Plus className="w-4 h-4 text-emerald-400" />}
        initialWidth={620}
        initialHeight={560}
      >
        <div className="p-5 font-mono text-xs text-white">
          <form onSubmit={handleCreateEntitySubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-emerald-400 uppercase">ENTITY NAME</label>
              <input
                type="text"
                required
                value={newEntName}
                onChange={(e) => setNewEntName(e.target.value)}
                placeholder="E.G. JONATHAN RAJ, DILAN, AMAZON ASSESSMENT"
                className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl p-2.5 text-xs text-white uppercase font-mono mt-1 focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-emerald-400 uppercase">ENTITY TYPE</label>
              <select
                value={newEntType}
                onChange={(e: any) => setNewEntType(e.target.value)}
                className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl p-2.5 text-xs text-white uppercase font-mono mt-1 focus:border-emerald-400 focus:outline-none"
              >
                {ENTITY_TYPES_LIST.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-emerald-400 uppercase">DESCRIPTION</label>
              <textarea
                rows={4}
                value={newEntDesc}
                onChange={(e) => setNewEntDesc(e.target.value)}
                placeholder="ENTER ENTITY DETAILS..."
                className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl p-2.5 text-xs text-white uppercase font-mono mt-1 focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-emerald-400 uppercase">ALIASES (COMMA SEPARATED)</label>
              <input
                type="text"
                value={newEntAliases}
                onChange={(e) => setNewEntAliases(e.target.value)}
                placeholder="Boss, Jonathan, Mr. Raj"
                className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl p-2.5 text-xs text-white uppercase font-mono mt-1 focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)] mt-2"
            >
              SAVE ENTITY TO KNOWLEDGE GRAPH
            </button>
          </form>
        </div>
      </DraggableResizableWindow>

      {/* EXPORT DATASET MODAL (DOCX, TXT, PDF, HTML, JSON, IMAGE) */}
      <DatabaseExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        graphData={graphData}
        onOpenDriveVault={() => setIsDriveVaultOpen(true)}
      />

      {/* GOOGLE DRIVE ASSET VAULT & NATASHA MEMORIZER MODAL */}
      <GoogleDriveAssetModal
        isOpen={isDriveVaultOpen}
        onClose={() => setIsDriveVaultOpen(false)}
      />

      {/* NATASHA DUPLICATE REMINDER MODAL WITH 3 ACTION DIRECTIVES */}
      {duplicateReminder && (
        <NatashaReminderModal
          data={duplicateReminder}
          onClose={() => setDuplicateReminder(null)}
        />
      )}

    </div>
  );
};

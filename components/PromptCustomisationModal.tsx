import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, MessageSquare, Mail, MessageCircle, Tag, FileText, 
  Wrench, Copy, Check, ExternalLink, Play, Plus, Trash2, RotateCcw, 
  Save, Edit3, Eye, Search, X, Minimize2, Maximize2, Shield, Volume2
} from 'lucide-react';
import { 
  PromptCategory, 
  PromptTemplate, 
  getCustomPromptTemplates, 
  savePromptTemplate, 
  deletePromptTemplate, 
  resetPromptTemplates, 
  renderPromptText, 
  buildChatGPTUrl, 
  buildWhatsAppUrl, 
  buildGmailDraftUrl 
} from '../services/promptCustomisationService';
import { soundManager, speakNatasha } from '../services/soundEffects';
import { logActivity } from '../services/activityLogger';

interface PromptCustomisationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  activeContext?: {
    fileName?: string;
    pageCount?: number;
    sheetCount?: number;
    totalCost?: number;
    singleSidedCost?: number;
    doubleSidedCost?: number;
  };
}

export const PromptCustomisationModal: React.FC<PromptCustomisationModalProps> = ({
  isOpen,
  onClose,
  onMinimize,
  activeContext
}) => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('ask_diagnostics');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Variable values form state
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // Template editor form state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDirective, setEditDirective] = useState('');
  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] = useState<PromptCategory>('ASK_AI');

  // Load templates on mount and on storage updates
  useEffect(() => {
    const load = () => {
      const list = getCustomPromptTemplates();
      setTemplates(list);
      if (list.length > 0 && !list.find(t => t.id === selectedTemplateId)) {
        setSelectedTemplateId(list[0].id);
      }
    };
    load();

    const handleUpdate = () => load();
    window.addEventListener('prompts-updated', handleUpdate);
    return () => window.removeEventListener('prompts-updated', handleUpdate);
  }, [selectedTemplateId]);

  const activeTemplate = useMemo(() => {
    return templates.find(t => t.id === selectedTemplateId) || templates[0];
  }, [templates, selectedTemplateId]);

  // Sync edit form when activeTemplate changes
  useEffect(() => {
    if (activeTemplate) {
      setEditName(activeTemplate.name);
      setEditDesc(activeTemplate.description);
      setEditDirective(activeTemplate.systemDirective);
      setEditText(activeTemplate.templateText);
      setEditCategory(activeTemplate.category);
      setIsEditingTemplate(false);

      // Pre-fill variable values if active context exists
      const initialVars: Record<string, string> = {};
      activeTemplate.variables.forEach(v => {
        if (v.key === 'file_name' && activeContext?.fileName) {
          initialVars[v.key] = activeContext.fileName;
        } else if (v.key === 'page_count' && activeContext?.pageCount !== undefined) {
          initialVars[v.key] = String(activeContext.pageCount);
        } else if (v.key === 'sheet_count' && activeContext?.sheetCount !== undefined) {
          initialVars[v.key] = String(activeContext.sheetCount);
        } else if (v.key === 'total_cost' && activeContext?.totalCost !== undefined) {
          initialVars[v.key] = String(activeContext.totalCost);
        } else if (v.key === 'single_sided_cost' && activeContext?.singleSidedCost !== undefined) {
          initialVars[v.key] = String(activeContext.singleSidedCost);
        } else if (v.key === 'double_sided_cost' && activeContext?.doubleSidedCost !== undefined) {
          initialVars[v.key] = String(activeContext.doubleSidedCost);
        } else {
          initialVars[v.key] = variableValues[v.key] ?? v.defaultValue;
        }
      });
      setVariableValues(initialVars);
    }
  }, [activeTemplate, activeContext]);

  // Rendered prompt with current variables
  const renderedPrompt = useMemo(() => {
    if (!activeTemplate) return '';
    return renderPromptText(activeTemplate, activeContext || {}, variableValues);
  }, [activeTemplate, activeContext, variableValues]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchCat = selectedCategory === 'ALL' || t.category === selectedCategory;
      const matchQuery = 
        !searchQuery || 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [templates, selectedCategory, searchQuery]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    soundManager.playClickSound();
    logActivity('PROMPT_STUDIO', 'Copied Action Prompt', `Copied prompt: ${activeTemplate?.name}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveEdit = () => {
    if (!activeTemplate) return;
    const updated: PromptTemplate = {
      ...activeTemplate,
      name: editName.trim() || activeTemplate.name,
      description: editDesc.trim() || activeTemplate.description,
      systemDirective: editDirective.trim(),
      templateText: editText.trim() || activeTemplate.templateText,
      category: editCategory,
      isCustom: true
    };
    savePromptTemplate(updated);
    setIsEditingTemplate(false);
    soundManager.playWelcomeSound();
    logActivity('PROMPT_STUDIO', 'Customized Prompt Template', `Updated template: ${updated.name}`);
  };

  const handleCreateNewTemplate = () => {
    const newId = `custom_prompt_${Date.now()}`;
    const newTemplate: PromptTemplate = {
      id: newId,
      category: editCategory,
      name: editName.trim() || 'New Custom Prompt',
      description: editDesc.trim() || 'Custom prompt created by Boss Jonathan Raj',
      systemDirective: editDirective.trim() || 'You are an autonomous assistant serving Boss Jonathan Raj.',
      templateText: editText.trim() || 'Please process this request for {boss_name}: {request}',
      variables: [
        { key: 'boss_name', label: 'Boss Name', defaultValue: 'Jonathan Raj', description: 'Primary System Architect' },
        { key: 'request', label: 'Specific Request', defaultValue: 'Detailed analysis', description: 'Action item' }
      ],
      tags: ['custom', 'boss-special'],
      isCustom: true
    };
    savePromptTemplate(newTemplate);
    setSelectedTemplateId(newId);
    setIsCreatingNew(false);
    setIsEditingTemplate(false);
    soundManager.playWelcomeSound();
    logActivity('PROMPT_STUDIO', 'Created New Custom Prompt', `Created prompt template: ${newTemplate.name}`);
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Boss, are you sure you want to delete this custom prompt template?')) {
      deletePromptTemplate(id);
      soundManager.playClickSound();
      logActivity('PROMPT_STUDIO', 'Deleted Custom Prompt', `Deleted template ID: ${id}`);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Boss, reset all prompt templates back to factory default? Any custom prompts will be restored to presets.')) {
      resetPromptTemplates();
      soundManager.playWelcomeSound();
      logActivity('PROMPT_STUDIO', 'Reset Prompt Templates', 'Restored built-in prompt templates to defaults.');
    }
  };

  const handleSpeakAloud = () => {
    if (!renderedPrompt) return;
    soundManager.playClickSound();
    speakNatasha(renderedPrompt.slice(0, 280));
    logActivity('PROMPT_STUDIO', 'Spoke Prompt Aloud', `Natasha voice read prompt: ${activeTemplate?.name}`);
  };

  if (!isOpen) return null;

  const categories: { id: string; label: string; icon: any }[] = [
    { id: 'ALL', label: 'All Prompts', icon: Sparkles },
    { id: 'ASK_AI', label: 'Ask AI', icon: MessageSquare },
    { id: 'WRITE_WITH_AI', label: 'Write with AI', icon: FileText },
    { id: 'LABELS_DESCRIPTIONS', label: 'Labels & Descriptions', icon: Tag },
    { id: 'GMAIL_AI', label: 'Gmail AI', icon: Mail },
    { id: 'WHATSAPP_AI', label: 'WhatsApp AI', icon: MessageCircle },
    { id: 'OTHER_AI_TOOLS', label: 'Other AI Tools', icon: Wrench },
  ];

  return (
    <div className="fixed inset-0 z-[9990] bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 md:p-6 select-none font-mono">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full bg-slate-900 border-2 border-cyan-400/80 rounded-3xl shadow-[0_0_80px_rgba(34,211,238,0.35)] flex flex-col overflow-hidden transition-all duration-300 ${
          isMaximized ? 'h-[98vh] max-w-[98vw]' : 'h-[92vh] max-w-7xl'
        }`}
      >
        {/* Top Header & Window Controls */}
        <div className="px-5 py-3.5 bg-slate-950/95 border-b border-cyan-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                  PROMPT CUSTOMISATIONS & ACTION GENERATOR
                </h1>
                <span className="px-2 py-0.5 text-[9px] font-black rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  BOSS JONATHAN RAJ
                </span>
              </div>
              <p className="text-[10px] text-cyan-500/70 uppercase">
                Action-specific prompts • Live variable tuning • ChatGPT Handoff & WhatsApp Export
              </p>
            </div>
          </div>

          {/* Window Control Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsCreatingNew(true);
                setIsEditingTemplate(true);
                setEditName('Custom Prompt');
                setEditDesc('');
                setEditDirective('');
                setEditText('Enter your prompt template here with {variable_name} placeholders.');
                setEditCategory('ASK_AI');
                soundManager.playClickSound();
              }}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-all"
              title="Add a brand new prompt template"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Prompt</span>
            </button>

            <button
              onClick={handleResetDefaults}
              className="p-2 text-slate-400 hover:text-cyan-300 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Reset all templates to defaults"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {onMinimize && (
              <button
                onClick={() => {
                  soundManager.playClickSound();
                  onMinimize();
                }}
                className="p-2 text-slate-400 hover:text-amber-300 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                title="Minimize window to taskbar"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                soundManager.playClickSound();
                setIsMaximized(prev => !prev);
              }}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title={isMaximized ? "Restore window" : "Maximize window"}
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                soundManager.playClickSound();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close window"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filter Tabs Bar */}
        <div className="px-4 py-2 bg-slate-950/80 border-b border-cyan-500/20 flex items-center gap-2 overflow-x-auto jarvis-scrollbar shrink-0">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  soundManager.playClickSound();
                  setSelectedCategory(cat.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main 2-Column Split: Template Selector (Left) + Prompt Tuner & Preview (Right) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Column: Search & Template List */}
          <div className="w-full md:w-80 bg-slate-950/90 border-r border-cyan-500/20 flex flex-col overflow-hidden shrink-0">
            {/* Search Input */}
            <div className="p-3 border-b border-cyan-500/20">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search prompts or tags..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            {/* Template Items Scroll List */}
            <div className="flex-1 overflow-y-auto jarvis-scrollbar p-2 space-y-1.5">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No matching prompt templates found.
                </div>
              ) : (
                filteredTemplates.map(item => {
                  const isSelected = item.id === selectedTemplateId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        soundManager.playClickSound();
                        setSelectedTemplateId(item.id);
                        setIsCreatingNew(false);
                      }}
                      className={`p-3 rounded-2xl transition-all cursor-pointer border text-left relative group ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400/80 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.25)]'
                          : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-black uppercase truncate">{item.name}</span>
                        {item.isCustom && (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            CUSTOM
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        {item.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {item.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(item.id);
                          }}
                          className="absolute right-2 top-2 p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete custom template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Prompt Customizer, Variables & Live Preview */}
          <div className="flex-1 bg-slate-900/60 p-4 sm:p-6 overflow-y-auto jarvis-scrollbar flex flex-col space-y-4">
            
            {activeTemplate && !isEditingTemplate ? (
              <>
                {/* Header Information for Selected Prompt */}
                <div className="p-4 bg-slate-950/80 border border-cyan-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-black text-cyan-300 uppercase tracking-wider">
                        {activeTemplate.name}
                      </h2>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase font-mono">
                        {activeTemplate.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 max-w-2xl">
                      {activeTemplate.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setIsEditingTemplate(true)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Edit Template</span>
                    </button>
                    <button
                      onClick={handleSpeakAloud}
                      className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 rounded-xl cursor-pointer"
                      title="Speak prompt with Natasha voice synthesizer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Variable Tuning Form */}
                <div className="p-4 bg-slate-950/80 border border-cyan-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5" />
                      <span>ACTION VARIABLES ({activeTemplate.variables.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Changes update live in preview below
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activeTemplate.variables.map(v => (
                      <div key={v.key} className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                          <span>{v.label}</span>
                          <span className="text-[8px] font-mono text-cyan-500/60">{"{" + v.key + "}"}</span>
                        </label>
                        <input
                          type="text"
                          value={variableValues[v.key] ?? v.defaultValue}
                          onChange={(e) => {
                            setVariableValues(prev => ({
                              ...prev,
                              [v.key]: e.target.value
                            }));
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Formatted Prompt Preview */}
                <div className="p-4 bg-slate-950/90 border border-cyan-400/50 rounded-2xl space-y-3 flex-1 flex flex-col shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-black text-cyan-300 uppercase tracking-wider">
                        LIVE GENERATED PROMPT PREVIEW
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(renderedPrompt, 'main-preview')}
                        className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                      >
                        {copiedKey === 'main-preview' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'main-preview' ? 'Copied!' : 'Copy Prompt'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative flex-1 min-h-[160px]">
                    <textarea
                      readOnly
                      value={renderedPrompt}
                      className="w-full h-full min-h-[180px] bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono leading-relaxed select-text focus:outline-none resize-none"
                    />
                  </div>

                  {/* Multi-Tool Handoff Action Bar */}
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[10px] text-slate-400 font-mono">
                      Export to AI Service:
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* ChatGPT Handoff */}
                      <button
                        onClick={() => {
                          handleCopy(renderedPrompt, 'chatgpt-handoff');
                          window.open(buildChatGPTUrl(renderedPrompt), '_blank');
                        }}
                        className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer transition-all"
                        title="Copy prompt and open ChatGPT"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Send to ChatGPT</span>
                      </button>

                      {/* WhatsApp Export */}
                      <button
                        onClick={() => {
                          const phone = variableValues['client_phone'] || '';
                          window.open(buildWhatsAppUrl(phone, renderedPrompt), '_blank');
                        }}
                        className="px-3.5 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer transition-all"
                        title="Send generated text to WhatsApp chat"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>Open WhatsApp</span>
                      </button>

                      {/* Gmail Draft */}
                      <button
                        onClick={() => {
                          const to = variableValues['client_email'] || '';
                          const sub = activeTemplate.name;
                          window.open(buildGmailDraftUrl(to, sub, renderedPrompt), '_blank');
                        }}
                        className="px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer transition-all"
                        title="Compose email draft in Gmail"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Draft in Gmail</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Template In-Place Editor Mode */
              <div className="p-5 bg-slate-950/90 border border-cyan-400/60 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-black text-cyan-300 uppercase tracking-wider">
                      {isCreatingNew ? 'CREATE NEW PROMPT TEMPLATE' : `EDIT: ${activeTemplate?.name}`}
                    </h3>
                  </div>

                  <button
                    onClick={() => {
                      setIsEditingTemplate(false);
                      setIsCreatingNew(false);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Template Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Urgent Invoice transmittal"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as PromptCategory)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono mt-1"
                    >
                      <option value="ASK_AI">Ask AI</option>
                      <option value="WRITE_WITH_AI">Write with AI</option>
                      <option value="LABELS_DESCRIPTIONS">Labels & Descriptions</option>
                      <option value="GMAIL_AI">Gmail AI</option>
                      <option value="WHATSAPP_AI">WhatsApp AI</option>
                      <option value="OTHER_AI_TOOLS">Other AI Tools</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                  <input
                    type="text"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Brief summary of when to use this prompt..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">System Directive</label>
                  <input
                    type="text"
                    value={editDirective}
                    onChange={(e) => setEditDirective(e.target.value)}
                    placeholder="e.g. You are an expert print operations consultant for Printline Wattala."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                    <span>Prompt Template Text (Use {"{variable_name}"} for placeholders)</span>
                    <span className="text-[9px] text-cyan-400 font-mono">{"e.g. {boss_name}, {file_name}, {total_cost}"}</span>
                  </label>
                  <textarea
                    rows={8}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono mt-1 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setIsEditingTemplate(false);
                      setIsCreatingNew(false);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={isCreatingNew ? handleCreateNewTemplate : handleSaveEdit}
                    className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isCreatingNew ? 'Save New Template' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </motion.div>
    </div>
  );
};

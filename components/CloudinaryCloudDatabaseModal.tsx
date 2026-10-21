import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, RefreshCw, ExternalLink, Download, CheckCircle2, 
  AlertCircle, Copy, Check, FileText, Database, Shield,
  Layers, Search, Eye, Folder, FolderPlus, Trash2, Edit3, 
  Upload, Tag, Sparkles, MessageSquare, Pin, PinOff, Plus, 
  X, CheckSquare, Square, CornerDownRight, ArrowRight,
  Sliders, HardDrive, Play, Music, Video, Image as ImageIcon,
  HelpCircle, ChevronRight, Share2, FolderGit2, AlertTriangle
} from 'lucide-react';
import { DraggableResizableWindow } from './DraggableResizableWindow';
import { 
  getLatestCloudinaryTextUrl, 
  fetchTextDataFromCloudinary, 
  syncAllTextDataToBoth,
  ConsolidatedTextPayload 
} from '../services/dualCloudSyncService';
import { 
  CloudinaryAsset, 
  CloudinaryFolder, 
  CloudinaryUsageData, 
  TagFormat, 
  TAG_FORMAT_OPTIONS,
  EXACT_DESCRIPTION_PROMPT,
  EXACT_AI_TAG_PROMPT,
  MANDATORY_STRICT_AI_RULES,
  getPinnedTags, 
  togglePinTag, 
  getAssetMetadata, 
  saveAssetMetadata, 
  formatTagsToString, 
  parseTagsFromString, 
  validateTagFormat,
  getPromptBuilderSections,
  addSectionToPromptBuilder,
  savePromptBuilderSections,
  assembleCompletePrompt,
  copyToClipboardVerified,
  openChatGPTWithPrompt,
  fetchCloudinaryResources,
  fetchCloudinaryFolders,
  createCloudinaryFolder,
  deleteCloudinaryFolder,
  fetchCloudinaryUsage,
  fetchCloudinaryAccountTags,
  updateAssetTags,
  renameCloudinaryAsset,
  deleteCloudinaryAsset,
  aiImproveDescriptionCall,
  aiGenerateTagsCall,
  syncCloudinaryCatalogToGitHub,
  cleanTag,
  PromptBuilderSection
} from '../services/cloudinaryFileManagerService';
import { uploadFileToCloudinary, resolveFileCategory } from '../services/cloudinaryService';
import { soundManager, speakNatasha } from '../services/soundEffects';
import { logActivity } from '../services/activityLogger';

interface CloudinaryCloudDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudinaryCloudDatabaseModal: React.FC<CloudinaryCloudDatabaseModalProps> = ({
  isOpen,
  onClose
}) => {
  // Top-level Navigation Tabs
  const [activeTab, setActiveTab] = useState<'manager' | 'smart_tags' | 'description' | 'tag_generator' | 'prompt_builder' | 'text_db'>('manager');

  // Cloudinary File Manager State
  const [assets, setAssets] = useState<CloudinaryAsset[]>([]);
  const [folders, setFolders] = useState<CloudinaryFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('raj_expo');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<'all' | 'image' | 'video' | 'raw'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingAssets, setIsLoadingAssets] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [usageData, setUsageData] = useState<CloudinaryUsageData | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Active / Selected Asset for Inspection & Tag Management
  const [selectedAsset, setSelectedAsset] = useState<CloudinaryAsset | null>(null);
  const [previewAsset, setPreviewAsset] = useState<CloudinaryAsset | null>(null);

  // Folder Creation & Management
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Asset Renaming / Moving
  const [renameAssetTarget, setRenameAssetTarget] = useState<CloudinaryAsset | null>(null);
  const [renameNewPublicId, setRenameNewPublicId] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Asset Deletion Confirmation
  const [assetToDelete, setAssetToDelete] = useState<CloudinaryAsset | null>(null);
  const [isDeletingAsset, setIsDeletingAsset] = useState(false);

  // Upload State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tag Management State
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedTagFormat, setSelectedTagFormat] = useState<TagFormat>('Comma-Separated');
  const [customFormatSyntax, setCustomFormatSyntax] = useState('{tag}');
  const [pinnedTags, setPinnedTags] = useState<string[]>([]);
  const [accountTags, setAccountTags] = useState<string[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [isSavingTags, setIsSavingTags] = useState(false);

  // Description Writing State
  const [descriptionInput, setDescriptionInput] = useState('');
  const [descriptionInstructions, setDescriptionInstructions] = useState('');
  const [descriptionOutputFormat, setDescriptionOutputFormat] = useState<'Plain Text' | 'Markdown' | 'HTML' | 'JSON' | 'Custom Format'>('Plain Text');
  const [descriptionCustomFormat, setDescriptionCustomFormat] = useState('');
  const [aiImprovedDescription, setAiImprovedDescription] = useState<string | null>(null);
  const [isImprovingDesc, setIsImprovingDesc] = useState(false);

  // AI Tag Generator State
  const [tagGenLanguage, setTagGenLanguage] = useState('English');
  const [tagGenCandidates, setTagGenCandidates] = useState<string[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [customTagPromptPreview, setCustomTagPromptPreview] = useState<string | null>(null);

  // Shared Prompt Builder State
  const [promptSections, setPromptSections] = useState<PromptBuilderSection[]>([]);
  const [clipboardFeedback, setClipboardFeedback] = useState<string | null>(null);
  const [fallbackModalText, setFallbackModalText] = useState<string | null>(null);

  // GitHub Dual-Sync State
  const [isSyncingToGitHub, setIsSyncingToGitHub] = useState(false);
  const [githubSyncResult, setGithubSyncResult] = useState<{ success: boolean; message: string; sha?: string } | null>(null);

  // Preserved Text Database State
  const [cloudUrl, setCloudUrl] = useState<string | null>(null);
  const [payload, setPayload] = useState<ConsolidatedTextPayload | null>(null);
  const [isLoadingTextDb, setIsLoadingTextDb] = useState(false);
  const [copiedTextUrl, setCopiedTextUrl] = useState(false);

  // ----------------------------------------------------
  // INITIAL DATA LOADING
  // ----------------------------------------------------

  const loadResources = async (folder: string = currentFolder, cursor?: string) => {
    setIsLoadingAssets(true);
    try {
      const res = await fetchCloudinaryResources({
        prefix: folder,
        next_cursor: cursor,
        max_results: 30,
        resource_type: resourceTypeFilter === 'all' ? 'image' : resourceTypeFilter
      });

      if (cursor) {
        setAssets(prev => [...prev, ...res.resources]);
      } else {
        setAssets(res.resources);
      }
      setNextCursor(res.next_cursor);
    } catch (err: any) {
      console.error('Failed to load resources:', err);
    } finally {
      setIsLoadingAssets(false);
    }
  };

  const loadFolders = async (parentFolder?: string) => {
    try {
      const res = await fetchCloudinaryFolders(parentFolder);
      setFolders(res.folders || []);
    } catch (err: any) {
      console.error('Failed to load folders:', err);
    }
  };

  const loadUsage = async () => {
    try {
      const data = await fetchCloudinaryUsage();
      setUsageData(data);
    } catch (err) {
      console.warn('Failed to load usage:', err);
    }
  };

  const loadAccountTags = async () => {
    try {
      const tags = await fetchCloudinaryAccountTags();
      setAccountTags(tags);
    } catch (err) {
      console.warn('Failed to load account tags:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadResources('raj_expo');
      loadFolders('raj_expo');
      loadUsage();
      loadAccountTags();
      setPinnedTags(getPinnedTags());
      setPromptSections(getPromptBuilderSections());

      // Also initialize text database state
      const storedUrl = getLatestCloudinaryTextUrl();
      setCloudUrl(storedUrl);
      if (storedUrl) {
        setIsLoadingTextDb(true);
        fetchTextDataFromCloudinary(storedUrl)
          .then(data => setPayload(data))
          .catch(() => {})
          .finally(() => setIsLoadingTextDb(false));
      }
    }
  }, [isOpen]);

  useEffect(() => {
    loadResources(currentFolder);
    loadFolders(currentFolder);
  }, [currentFolder, resourceTypeFilter]);

  // When selectedAsset changes, sync its tags & metadata
  useEffect(() => {
    if (selectedAsset) {
      const meta = getAssetMetadata(selectedAsset.public_id);
      setActiveTags(selectedAsset.tags || []);
      setSelectedTagFormat(meta.tagFormat || 'Comma-Separated');
      setCustomFormatSyntax(meta.customFormatSyntax || '{tag}');
      if (meta.description) {
        setDescriptionInput(meta.description);
      } else if (selectedAsset.context?.caption) {
        setDescriptionInput(selectedAsset.context.caption);
      }
    }
  }, [selectedAsset]);

  // ----------------------------------------------------
  // FILE ACTIONS: FOLDER NAVIGATION & SEARCH
  // ----------------------------------------------------

  const handleSelectFolder = (path: string) => {
    soundManager.playClickSound();
    setCurrentFolder(path);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      soundManager.playClickSound();
      const targetPath = `${currentFolder}/${newFolderName.trim().replace(/\s+/g, '_')}`;
      await createCloudinaryFolder(targetPath);
      setNewFolderName('');
      setIsCreatingFolder(false);
      loadFolders(currentFolder);
      soundManager.playAccessGrantedSound();
    } catch (err: any) {
      alert(`Error creating folder: ${err.message}`);
    }
  };

  const handleDeleteFolder = async (folderPath: string) => {
    if (!confirm(`Are you sure you want to delete folder "${folderPath}"? This folder must be empty.`)) return;

    try {
      soundManager.playClickSound();
      await deleteCloudinaryFolder(folderPath);
      loadFolders(currentFolder);
    } catch (err: any) {
      alert(`Failed to delete folder: ${err.message}`);
    }
  };

  const filteredAssets = assets.filter(a => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = a.public_id.toLowerCase().includes(q) || (a.display_name && a.display_name.toLowerCase().includes(q));
    const tagMatch = a.tags?.some(t => t.toLowerCase().includes(q));
    const formatMatch = a.format.toLowerCase().includes(q);
    return nameMatch || tagMatch || formatMatch;
  });

  // ----------------------------------------------------
  // ASSET RENAME / MOVE
  // ----------------------------------------------------

  const handleRenameAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameAssetTarget || !renameNewPublicId.trim()) return;

    setIsRenaming(true);
    try {
      await renameCloudinaryAsset(renameAssetTarget.public_id, renameNewPublicId.trim(), renameAssetTarget.resource_type);
      soundManager.playAccessGrantedSound();
      setRenameAssetTarget(null);
      loadResources(currentFolder);
    } catch (err: any) {
      alert(`Rename failed: ${err.message}`);
    } finally {
      setIsRenaming(false);
    }
  };

  // ----------------------------------------------------
  // ASSET DELETE (WITH EXPLICIT WARNING)
  // ----------------------------------------------------

  const handleConfirmDeleteAsset = async () => {
    if (!assetToDelete) return;
    setIsDeletingAsset(true);
    try {
      await deleteCloudinaryAsset(assetToDelete.public_id, assetToDelete.resource_type);
      soundManager.playAccessGrantedSound();
      setAssetToDelete(null);
      setSelectedAsset(null);
      loadResources(currentFolder);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsDeletingAsset(false);
    }
  };

  // ----------------------------------------------------
  // ASSET UPLOAD
  // ----------------------------------------------------

  const handleStartUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadProgress(10);
    soundManager.playClickSound();

    try {
      const category = resolveFileCategory(uploadFile.name, uploadFile.type);
      const parsedInitialTags = uploadTags.split(',').map(t => t.trim()).filter(Boolean);

      const res = await uploadFileToCloudinary(uploadFile, {
        category,
        description: uploadDescription,
        tags: parsedInitialTags,
        onProgress: (p) => setUploadProgress(p)
      });

      // Save custom format metadata
      saveAssetMetadata(res.public_id, {
        description: uploadDescription,
        tagFormat: 'Comma-Separated',
        formattedTagString: parsedInitialTags.join(', ')
      });

      soundManager.playAccessGrantedSound();
      setIsUploadOpen(false);
      setUploadFile(null);
      setUploadDescription('');
      setUploadTags('');
      loadResources(currentFolder);
      loadUsage();
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // ----------------------------------------------------
  // SMART TAGS MANAGEMENT & SAVING
  // ----------------------------------------------------

  const handleAddTag = (rawTag: string) => {
    const clean = cleanTag(rawTag);
    if (!clean) return;
    if (activeTags.includes(clean)) return;

    soundManager.playClickSound();
    setActiveTags(prev => [...prev, clean]);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    soundManager.playClickSound();
    setActiveTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleSaveTagsToAsset = async () => {
    if (!selectedAsset) {
      alert('Please select an asset first.');
      return;
    }

    // Format validation
    const formattedString = formatTagsToString(activeTags, selectedTagFormat, customFormatSyntax);
    const validation = validateTagFormat(formattedString, selectedTagFormat);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setIsSavingTags(true);
    soundManager.playClickSound();

    try {
      // 1. Update native tags on Cloudinary
      await updateAssetTags(selectedAsset.public_id, activeTags, 'set_tags');

      // 2. Preserve format metadata in local database & central storage
      saveAssetMetadata(selectedAsset.public_id, {
        description: descriptionInput,
        tagFormat: selectedTagFormat,
        customFormatSyntax,
        formattedTagString: formattedString
      });

      // Update local asset state
      setSelectedAsset(prev => prev ? { ...prev, tags: activeTags } : null);
      setAssets(prev => prev.map(a => a.public_id === selectedAsset.public_id ? { ...a, tags: activeTags } : a));

      soundManager.playAccessGrantedSound();
      setClipboardFeedback('Tags and format successfully saved to Cloudinary and database!');
      setTimeout(() => setClipboardFeedback(null), 3000);
      loadAccountTags();
    } catch (err: any) {
      alert(`Failed to save tags: ${err.message}`);
    } finally {
      setIsSavingTags(false);
    }
  };

  // ----------------------------------------------------
  // DESCRIPTION WRITING ACTIONS
  // ----------------------------------------------------

  const handleWriteWithAiDescription = async () => {
    if (!descriptionInput.trim()) {
      alert('Please enter a description first.');
      return;
    }

    setIsImprovingDesc(true);
    soundManager.playClickSound();

    try {
      const improved = await aiImproveDescriptionCall(
        descriptionInput,
        descriptionInstructions,
        descriptionOutputFormat,
        descriptionCustomFormat
      );
      setAiImprovedDescription(improved);
      soundManager.playAccessGrantedSound();
    } catch (err: any) {
      alert(`AI improvement error: ${err.message}`);
    } finally {
      setIsImprovingDesc(false);
    }
  };

  const handleApproveImprovedDescription = () => {
    if (!aiImprovedDescription) return;
    soundManager.playAccessGrantedSound();
    setDescriptionInput(aiImprovedDescription);
    setAiImprovedDescription(null);
    if (selectedAsset) {
      saveAssetMetadata(selectedAsset.public_id, {
        description: aiImprovedDescription,
        tagFormat: selectedTagFormat
      });
    }
  };

  const handleAddDescriptionToPrompt = () => {
    if (!descriptionInput.trim()) {
      alert('Please enter a description first.');
      return;
    }

    const added = addSectionToPromptBuilder({
      title: 'Description Writing Task',
      content: `${EXACT_DESCRIPTION_PROMPT}\n\nSelected Output Format: ${descriptionOutputFormat}${descriptionCustomFormat ? ` (${descriptionCustomFormat})` : ''}\n\nSupplied Description:\n${descriptionInput}\n\nInstructions:\n${descriptionInstructions || 'Preserve meaning and factual accuracy.'}`,
      category: 'description'
    });

    if (added) {
      setPromptSections(getPromptBuilderSections());
      soundManager.playAccessGrantedSound();
      setClipboardFeedback('Added description task to shared Prompt Builder!');
      setTimeout(() => setClipboardFeedback(null), 2500);
    } else {
      alert('This exact description content is already in the Prompt Builder.');
    }
  };

  const handleCopyAllDescriptionPrompt = async () => {
    if (!descriptionInput.trim()) {
      alert('Please enter a description first.');
      return;
    }

    const promptText = `[DESCRIPTION TASK]\n${EXACT_DESCRIPTION_PROMPT}\n\nSelected Output Format: ${descriptionOutputFormat}${descriptionCustomFormat ? ` (${descriptionCustomFormat})` : ''}\n\nSupplied Description:\n${descriptionInput}\n\nInstructions:\n${descriptionInstructions || 'Preserve meaning and factual accuracy.'}\n\n[MANDATORY STRICT OUTPUT RULES]\n${MANDATORY_STRICT_AI_RULES}`;

    const res = await copyToClipboardVerified(promptText);
    if (res.fallbackNeeded) {
      setFallbackModalText(promptText);
    } else {
      setClipboardFeedback('Complete Description prompt copied to clipboard!');
      setTimeout(() => setClipboardFeedback(null), 3000);
    }
  };

  const handleGenerateWithAiDescription = async () => {
    if (!descriptionInput.trim()) {
      alert('Please enter a description first.');
      return;
    }

    const promptText = `[DESCRIPTION TASK]\n${EXACT_DESCRIPTION_PROMPT}\n\nSelected Output Format: ${descriptionOutputFormat}${descriptionCustomFormat ? ` (${descriptionCustomFormat})` : ''}\n\nSupplied Description:\n${descriptionInput}\n\nInstructions:\n${descriptionInstructions || 'Preserve meaning and factual accuracy.'}\n\n[MANDATORY STRICT OUTPUT RULES]\n${MANDATORY_STRICT_AI_RULES}`;

    const res = await openChatGPTWithPrompt(promptText);
    if (res.fallbackNeeded) {
      setFallbackModalText(promptText);
    } else {
      setClipboardFeedback('Prompt copied to clipboard! Paste and submit manually in the ChatGPT tab.');
      setTimeout(() => setClipboardFeedback(null), 4000);
    }
  };

  // ----------------------------------------------------
  // AI TAG GENERATOR ACTIONS
  // ----------------------------------------------------

  const handleWriteWithAiTags = async () => {
    if (!descriptionInput.trim()) {
      alert('Please provide a description in the Description field to generate tags.');
      return;
    }

    setIsGeneratingTags(true);
    soundManager.playClickSound();

    try {
      const res = await aiGenerateTagsCall(
        descriptionInput,
        selectedTagFormat,
        customFormatSyntax,
        tagGenLanguage
      );

      const candidates = res.tags.map(cleanTag).filter(Boolean);
      setTagGenCandidates(candidates);
      setSelectedCandidates(new Set(candidates)); // Select all by default
      soundManager.playAccessGrantedSound();
    } catch (err: any) {
      alert(`AI tag generation error: ${err.message}`);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const handleApproveSelectedCandidates = () => {
    const toAdd = Array.from(selectedCandidates);
    if (toAdd.length === 0) return;

    soundManager.playAccessGrantedSound();
    setActiveTags(prev => {
      const set = new Set([...prev, ...toAdd]);
      return Array.from(set);
    });
    setTagGenCandidates([]);
    setSelectedCandidates(new Set());
    setClipboardFeedback(`Added ${toAdd.length} AI generated tags to active tags!`);
    setTimeout(() => setClipboardFeedback(null), 3000);
  };

  const handleAddTagsToPrompt = () => {
    if (!descriptionInput.trim() && activeTags.length === 0) {
      alert('Please enter a description or tags first.');
      return;
    }

    const formattedTags = formatTagsToString(activeTags, selectedTagFormat, customFormatSyntax);

    const added = addSectionToPromptBuilder({
      title: 'AI Tag Generation Task',
      content: `${EXACT_AI_TAG_PROMPT}\n\nTarget Output Format: ${selectedTagFormat}\nLanguage: ${tagGenLanguage}\n\nSupplied Description:\n${descriptionInput}\n\nCurrent Tags (Reference):\n${formattedTags || 'None'}`,
      category: 'tags'
    });

    if (added) {
      setPromptSections(getPromptBuilderSections());
      soundManager.playAccessGrantedSound();
      setClipboardFeedback('Added AI Tag Generation task to shared Prompt Builder!');
      setTimeout(() => setClipboardFeedback(null), 2500);
    } else {
      alert('This exact tag prompt is already in the Prompt Builder.');
    }
  };

  const handleCopyAllTagPrompt = async () => {
    const formattedTags = formatTagsToString(activeTags, selectedTagFormat, customFormatSyntax);
    const promptText = `[TAG GENERATOR TASK]\n${EXACT_AI_TAG_PROMPT}\n\nTarget Output Format: ${selectedTagFormat}\nLanguage: ${tagGenLanguage}\n\nSupplied Description:\n${descriptionInput || 'None provided'}\n\nCurrent Tags:\n${formattedTags || 'None'}\n\n[MANDATORY STRICT OUTPUT RULES]\n${MANDATORY_STRICT_AI_RULES}`;

    const res = await copyToClipboardVerified(promptText);
    if (res.fallbackNeeded) {
      setFallbackModalText(promptText);
    } else {
      setClipboardFeedback('Complete AI Tag prompt copied to clipboard!');
      setTimeout(() => setClipboardFeedback(null), 3000);
    }
  };

  const handleGenerateWithAiTags = async () => {
    const formattedTags = formatTagsToString(activeTags, selectedTagFormat, customFormatSyntax);
    const promptText = `[TAG GENERATOR TASK]\n${EXACT_AI_TAG_PROMPT}\n\nTarget Output Format: ${selectedTagFormat}\nLanguage: ${tagGenLanguage}\n\nSupplied Description:\n${descriptionInput || 'None provided'}\n\nCurrent Tags:\n${formattedTags || 'None'}\n\n[MANDATORY STRICT OUTPUT RULES]\n${MANDATORY_STRICT_AI_RULES}`;

    const res = await openChatGPTWithPrompt(promptText);
    if (res.fallbackNeeded) {
      setFallbackModalText(promptText);
    } else {
      setClipboardFeedback('AI Tag prompt copied! Opening ChatGPT in a new tab for manual pasting and submission.');
      setTimeout(() => setClipboardFeedback(null), 4000);
    }
  };

  // ----------------------------------------------------
  // GITHUB DUAL-SYNC
  // ----------------------------------------------------

  const handleSyncToGitHub = async () => {
    setIsSyncingToGitHub(true);
    soundManager.playClickSound();
    setGithubSyncResult(null);

    try {
      const res = await syncCloudinaryCatalogToGitHub(assets);
      setGithubSyncResult(res);
      soundManager.playAccessGrantedSound();
    } catch (err: any) {
      setGithubSyncResult({
        success: false,
        message: err.message || 'GitHub sync failed'
      });
    } finally {
      setIsSyncingToGitHub(false);
    }
  };

  if (!isOpen) return null;

  return (
    <DraggableResizableWindow
      isOpen={isOpen}
      onClose={onClose}
      title="RAJ EXPO DIGITALS : CLOUDINARY FILE MANAGER, SMART TAGS & AI PROMPT TOOLS"
      subtitle="Cloudinary Admin API • Smart Tags & Format Engine • AI Prompt Tools • Dual-Sync to GitHub"
      icon={<Cloud className="w-4 h-4 text-cyan-400" />}
      initialWidth={1150}
      initialHeight={740}
      headerActions={
        <div className="flex items-center gap-2 mr-2">
          <button
            onClick={handleSyncToGitHub}
            disabled={isSyncingToGitHub || assets.length === 0}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-lg text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
            title="Synchronize all Cloudinary assets, folders, descriptions, and tag formats to GitHub"
          >
            {isSyncingToGitHub ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FolderGit2 className="w-3.5 h-3.5" />}
            <span>Sync to GitHub</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col h-full bg-slate-950 text-white font-sans text-xs select-none">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 bg-slate-900/90 px-4 py-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto jarvis-scrollbar py-0.5">
            <button
              onClick={() => { soundManager.playClickSound(); setActiveTab('manager'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'manager' 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Cloudinary Database</span>
              <span className="text-[10px] opacity-60">({assets.length})</span>
            </button>

            <button
              onClick={() => { soundManager.playClickSound(); setActiveTab('smart_tags'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'smart_tags' 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-400/60 shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Tag Manager & Formats</span>
              {selectedAsset && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
            </button>

            <button
              onClick={() => { soundManager.playClickSound(); setActiveTab('description'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'description' 
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/60 shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Description Writing</span>
            </button>

            <button
              onClick={() => { soundManager.playClickSound(); setActiveTab('tag_generator'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'tag_generator' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Tag Generator</span>
            </button>

            <button
              onClick={() => { soundManager.playClickSound(); setActiveTab('prompt_builder'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'prompt_builder' 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/60 shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Prompt Builder</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/30 text-amber-200 rounded">
                {promptSections.filter(s => s.enabled).length}
              </span>
            </button>

            <button
              onClick={() => { soundManager.playClickSound(); setActiveTab('text_db'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'text_db' 
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-400/60 shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Text Database Viewer</span>
            </button>
          </div>

          {/* Quick Storage Stat Pills */}
          {usageData && (
            <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono text-slate-400">
              <span>Plan: <strong className="text-cyan-300">{usageData.plan}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Storage: <strong className="text-cyan-300">{(usageData.storage.usage / (1024 * 1024)).toFixed(1)} MB</strong></span>
              <span aria-hidden="true">·</span>
              <span>Objects: <strong className="text-cyan-300">{usageData.objects.usage}</strong></span>
            </div>
          )}
        </div>

        {/* Feedback / Alert Banners */}
        <AnimatePresence>
          {clipboardFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-emerald-500/20 border-b border-emerald-400/40 px-4 py-2 text-xs text-emerald-300 font-bold flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{clipboardFeedback}</span>
              </div>
              <button onClick={() => setClipboardFeedback(null)} className="text-emerald-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}

          {githubSyncResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`border-b px-4 py-2 text-xs font-bold flex items-center justify-between ${
                githubSyncResult.success 
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-200' 
                  : 'bg-rose-500/20 border-rose-400/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {githubSyncResult.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{githubSyncResult.message}</span>
                {githubSyncResult.sha && (
                  <span className="font-mono text-[10px] text-amber-300 ml-2">Commit: {githubSyncResult.sha.substring(0, 7)}</span>
                )}
              </div>
              <button onClick={() => setGithubSyncResult(null)} className="hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN BODY PER ACTIVE TAB */}
        <div className="flex-1 overflow-hidden flex flex-col p-3 sm:p-4 bg-slate-950">

          {/* ==================================================== */}
          {/* TAB 1: CLOUDINARY FILE MANAGER & DATABASE            */}
          {/* ==================================================== */}
          {activeTab === 'manager' && (
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              {/* Folder Breadcrumbs & Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Folder:</span>
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <button
                      onClick={() => handleSelectFolder('raj_expo')}
                      className={`px-2 py-0.5 rounded hover:bg-slate-800 cursor-pointer ${currentFolder === 'raj_expo' ? 'text-cyan-400 font-bold' : 'text-slate-300'}`}
                    >
                      raj_expo
                    </button>
                    {currentFolder !== 'raj_expo' && (
                      <>
                        <span className="text-slate-600">/</span>
                        <span className="text-cyan-300 font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                          {currentFolder.replace('raj_expo/', '')}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Resource Type Filter */}
                  <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                    {(['all', 'image', 'video', 'raw'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setResourceTypeFilter(type)}
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md cursor-pointer transition-colors ${
                          resourceTypeFilter === type ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {type === 'all' ? 'All Types' : type}
                      </button>
                    ))}
                  </div>

                  {/* Create Folder Toggle */}
                  <button
                    onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>New Folder</span>
                  </button>

                  {/* Upload Button */}
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-lg text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Asset</span>
                  </button>
                </div>
              </div>

              {/* Folder Creation Input (if open) */}
              <AnimatePresence>
                {isCreatingFolder && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCreateFolder}
                    className="flex items-center gap-2 p-2.5 bg-slate-900 rounded-xl border border-cyan-500/40"
                  >
                    <span className="text-xs text-slate-400">Path: {currentFolder}/</span>
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="subfolder_name"
                      className="px-3 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400 flex-1"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs uppercase cursor-pointer"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingFolder(false)}
                      className="px-2 py-1 text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Subfolders Chips Bar */}
              {folders.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto jarvis-scrollbar py-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">Subfolders:</span>
                  {folders.map(f => (
                    <div
                      key={f.path}
                      onClick={() => handleSelectFolder(f.path)}
                      className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shrink-0 border transition-all ${
                        currentFolder === f.path 
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <Folder className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{f.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.path); }}
                        className="text-slate-500 hover:text-rose-400 ml-1 p-0.5 rounded"
                        title="Delete empty folder"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search & View Controls */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by file name, tag, format..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadResources(currentFolder)}
                    disabled={isLoadingAssets}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 cursor-pointer"
                    title="Refresh Asset List"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAssets ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 text-xs font-bold uppercase cursor-pointer"
                  >
                    {viewMode === 'grid' ? 'List View' : 'Grid View'}
                  </button>
                </div>
              </div>

              {/* Assets Grid / List */}
              <div className="flex-1 overflow-y-auto jarvis-scrollbar pr-1">
                {isLoadingAssets && assets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                    <p className="font-mono text-xs">Accessing Cloudinary Database Assets...</p>
                  </div>
                ) : filteredAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-500">
                    <Cloud className="w-8 h-8 text-slate-600" />
                    <p className="font-mono text-xs">No assets found in folder "{currentFolder}".</p>
                    <button
                      onClick={() => setIsUploadOpen(true)}
                      className="mt-2 px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 rounded-lg text-xs uppercase cursor-pointer"
                    >
                      Upload Asset Here
                    </button>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredAssets.map(asset => {
                      const isSelected = selectedAsset?.public_id === asset.public_id;
                      const isImg = asset.resource_type === 'image' && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(asset.format);
                      const isVid = asset.resource_type === 'video' || ['mp4', 'webm', 'mov'].includes(asset.format);

                      return (
                        <div
                          key={asset.public_id}
                          onClick={() => {
                            soundManager.playClickSound();
                            setSelectedAsset(asset);
                          }}
                          className={`rounded-xl overflow-hidden border transition-all flex flex-col bg-slate-900/80 cursor-pointer group relative ${
                            isSelected 
                              ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.35)] ring-1 ring-cyan-400' 
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Thumbnail Container */}
                          <div className="h-28 bg-slate-950 flex items-center justify-center relative overflow-hidden">
                            {isImg ? (
                              <img
                                src={asset.secure_url}
                                alt={asset.public_id}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                loading="lazy"
                              />
                            ) : isVid ? (
                              <div className="flex flex-col items-center justify-center text-cyan-400 gap-1">
                                <Video className="w-8 h-8" />
                                <span className="text-[9px] uppercase font-bold text-slate-400">Video</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-cyan-400 gap-1">
                                <FileText className="w-8 h-8" />
                                <span className="text-[9px] uppercase font-bold text-slate-400">{asset.format}</span>
                              </div>
                            )}

                            {/* Format Badge */}
                            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-slate-950/80 text-[9px] font-mono font-bold text-cyan-300 uppercase border border-white/10">
                              {asset.format}
                            </span>
                          </div>

                          {/* Info Footer */}
                          <div className="p-2 space-y-1">
                            <p className="font-bold text-white text-xs truncate" title={asset.public_id}>
                              {asset.display_name || asset.public_id.split('/').pop()}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                              <span>{(asset.bytes / 1024).toFixed(0)} KB</span>
                              <span>{asset.tags?.length || 0} tags</span>
                            </div>

                            {/* Quick Actions Hover Overlay */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                              <button
                                onClick={(e) => { e.stopPropagation(); setPreviewAsset(asset); }}
                                className="p-1 hover:text-cyan-400"
                                title="Preview Asset"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameAssetTarget(asset);
                                  setRenameNewPublicId(asset.public_id);
                                }}
                                className="p-1 hover:text-cyan-400"
                                title="Rename / Move Asset"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={asset.secure_url}
                                download
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 hover:text-emerald-400"
                                title="Download Asset"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                              <button
                                onClick={(e) => { e.stopPropagation(); setAssetToDelete(asset); }}
                                className="p-1 hover:text-rose-400"
                                title="Delete Asset"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredAssets.map(asset => {
                      const isSelected = selectedAsset?.public_id === asset.public_id;
                      return (
                        <div
                          key={asset.public_id}
                          onClick={() => {
                            soundManager.playClickSound();
                            setSelectedAsset(asset);
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-cyan-950/40 border-cyan-400 text-white' 
                              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            <span className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400">
                              <FileText className="w-4 h-4" />
                            </span>
                            <div className="truncate">
                              <span className="font-bold text-xs text-white block truncate">
                                {asset.display_name || asset.public_id}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {asset.format.toUpperCase()} · {(asset.bytes / 1024).toFixed(1)} KB · {asset.tags?.join(', ') || 'No tags'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); setPreviewAsset(asset); }}
                              className="p-1.5 hover:text-cyan-400"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenameAssetTarget(asset);
                                setRenameNewPublicId(asset.public_id);
                              }}
                              className="p-1.5 hover:text-cyan-400"
                              title="Rename"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <a
                              href={asset.secure_url}
                              download
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 hover:text-emerald-400"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <button
                              onClick={(e) => { e.stopPropagation(); setAssetToDelete(asset); }}
                              className="p-1.5 hover:text-rose-400"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination Load More */}
                {nextCursor && (
                  <div className="text-center py-3">
                    <button
                      onClick={() => loadResources(currentFolder, nextCursor)}
                      disabled={isLoadingAssets}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold rounded-xl text-xs uppercase cursor-pointer"
                    >
                      {isLoadingAssets ? 'Loading More...' : 'Load More Assets'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: SMART TAGS & TAG FORMAT SELECTOR              */}
          {/* ==================================================== */}
          {activeTab === 'smart_tags' && (
            <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-y-auto jarvis-scrollbar">
              {/* Left Column: Active Asset Tags & Editor */}
              <div className="flex-1 space-y-4">
                <div className="p-3 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white uppercase">
                      Target Asset: {selectedAsset ? (selectedAsset.display_name || selectedAsset.public_id) : 'No Asset Selected'}
                    </span>
                    {selectedAsset && (
                      <span className="text-[10px] text-cyan-400 font-mono">
                        {(selectedAsset.bytes / 1024).toFixed(1)} KB · {selectedAsset.format.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Add, edit, remove tags, and select the output/storage format before saving to Cloudinary and database.
                  </p>
                </div>

                {/* Tag Input Field & Account Suggestions */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">
                    Type New Tag (Press Enter to Add)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(tagInput);
                        }
                      }}
                      placeholder="e.g. catalog, promotion, banner..."
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTag(tagInput)}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs uppercase cursor-pointer"
                    >
                      Add Tag
                    </button>
                  </div>
                </div>

                {/* Pinned / Favourite Tags for Quick Reuse */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
                    <Pin className="w-3 h-3 fill-current" />
                    Pinned & Favourite Tags (Click to Add / Pin)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {pinnedTags.map(pt => {
                      const isAdded = activeTags.includes(pt);
                      return (
                        <button
                          key={pt}
                          onClick={() => isAdded ? handleRemoveTag(pt) : handleAddTag(pt)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer border transition-all ${
                            isAdded 
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{pt}</span>
                          {isAdded ? <Check className="w-3 h-3 text-amber-400" /> : <Plus className="w-3 h-3 text-slate-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Search Account Existing Tags */}
                {accountTags.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Existing Cloudinary Account Tags
                    </span>
                    <input
                      type="text"
                      value={tagSearchQuery}
                      onChange={(e) => setTagSearchQuery(e.target.value)}
                      placeholder="Search existing tags..."
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300"
                    />
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto jarvis-scrollbar">
                      {accountTags
                        .filter(t => !tagSearchQuery || t.toLowerCase().includes(tagSearchQuery.toLowerCase()))
                        .slice(0, 30)
                        .map(at => {
                          const isAdded = activeTags.includes(at);
                          const isPinned = pinnedTags.includes(at);
                          return (
                            <div
                              key={at}
                              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] flex items-center gap-1 font-mono text-slate-300"
                            >
                              <span 
                                onClick={() => isAdded ? handleRemoveTag(at) : handleAddTag(at)}
                                className="cursor-pointer hover:text-cyan-300"
                              >
                                {at}
                              </span>
                              <button
                                onClick={() => {
                                  togglePinTag(at);
                                  setPinnedTags(getPinnedTags());
                                }}
                                className="text-slate-500 hover:text-amber-400"
                                title={isPinned ? 'Unpin tag' : 'Pin tag'}
                              >
                                {isPinned ? <Pin className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> : <Pin className="w-2.5 h-2.5" />}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Active Tags Chips */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase">
                      Active Tags for This Asset ({activeTags.length})
                    </span>
                    {activeTags.length > 0 && (
                      <button
                        onClick={() => setActiveTags([])}
                        className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 min-h-[60px]">
                    {activeTags.length === 0 ? (
                      <span className="text-xs text-slate-500 font-mono">No tags currently applied.</span>
                    ) : (
                      activeTags.map(tag => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs font-mono flex items-center gap-1.5"
                        >
                          <span>{tag}</span>
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="text-cyan-400 hover:text-rose-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Save Tags Button */}
                <button
                  onClick={handleSaveTagsToAsset}
                  disabled={isSavingTags || !selectedAsset}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingTags ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Tags & Format Configuration</span>
                </button>
              </div>

              {/* Right Column: Exact 5-Option Tag Format Selector & Live Representation */}
              <div className="w-full md:w-96 space-y-4">
                <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/30">
                  <span className="text-xs font-black text-purple-200 uppercase block">
                    Tag Output & Storage Format Selector
                  </span>
                  <p className="text-[10px] text-purple-300">
                    Choose how tags will be formatted when copied, exported, and saved in database metadata.
                  </p>
                </div>

                {/* Format Cards with EXACT 3 Concise Lines */}
                <div className="space-y-2">
                  {TAG_FORMAT_OPTIONS.map(opt => {
                    const isSelected = selectedTagFormat === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          soundManager.playClickSound();
                          setSelectedTagFormat(opt.id);
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                          isSelected 
                            ? 'bg-purple-950/50 border-purple-400 shadow-sm ring-1 ring-purple-400' 
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-black uppercase ${isSelected ? 'text-purple-300' : 'text-slate-200'}`}>
                            {opt.title}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                        </div>

                        {/* EXACT 3 Descriptive Lines */}
                        <ul className="text-[10px] text-slate-400 space-y-0.5 list-disc list-inside">
                          <li>{opt.lines[0]}</li>
                          <li>{opt.lines[1]}</li>
                          <li>{opt.lines[2]}</li>
                        </ul>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Format Input (if Custom Format chosen) */}
                {selectedTagFormat === 'Custom Format' && (
                  <div className="p-3 bg-slate-900 rounded-xl border border-purple-500/40 space-y-2">
                    <label className="text-[10px] text-purple-300 font-bold uppercase block">
                      Custom Format Syntax (Use {'{tag}'} placeholder or delimiter)
                    </label>
                    <input
                      type="text"
                      value={customFormatSyntax}
                      onChange={(e) => setCustomFormatSyntax(e.target.value)}
                      placeholder="e.g. tag: '{tag}' or |"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                )}

                {/* Live Formatted Output Preview */}
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Live Presentation Preview ({selectedTagFormat})
                  </span>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-cyan-300 max-h-32 overflow-y-auto jarvis-scrollbar whitespace-pre-wrap">
                    {formatTagsToString(activeTags, selectedTagFormat, customFormatSyntax) || '(No tags to format)'}
                  </div>
                  <p className="text-[9px] text-slate-500">
                    * Cloudinary native tags store normalized string tokens. Your chosen format is preserved in RAJ EXPO DIGITALS metadata and synced to GitHub.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: DESCRIPTION WRITING                           */}
          {/* ==================================================== */}
          {activeTab === 'description' && (
            <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-y-auto jarvis-scrollbar">
              <div className="flex-1 space-y-3">
                <div className="p-3 bg-slate-900 border border-blue-500/30 rounded-2xl space-y-1">
                  <span className="text-xs font-black text-white uppercase block">
                    Description Writing Engine
                  </span>
                  <p className="text-[10px] text-blue-300">
                    Write, improve, format, and generate prompts strictly according to your instructions.
                  </p>
                </div>

                {/* Exact Prompt Box Display */}
                <div className="p-3 bg-blue-950/20 border border-blue-500/40 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-blue-400 uppercase block">
                    Mandatory Description Prompt Directive:
                  </span>
                  <p className="text-xs font-mono text-blue-200 italic">
                    "{EXACT_DESCRIPTION_PROMPT}"
                  </p>
                </div>

                {/* Description Input Field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block">
                    Description Input Field (Exact Source of Truth)
                  </label>
                  <textarea
                    rows={4}
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    placeholder="Enter or paste the file description here..."
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-sans"
                  />
                </div>

                {/* Additional Instructions */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block">
                    Custom Improvement Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={descriptionInstructions}
                    onChange={(e) => setDescriptionInstructions(e.target.value)}
                    placeholder="e.g. Focus on technical printing parameters and client deliverables..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Output Format Selector */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Output Format:</span>
                  {(['Plain Text', 'Markdown', 'HTML', 'JSON', 'Custom Format'] as const).map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setDescriptionOutputFormat(fmt)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-bold cursor-pointer transition-colors ${
                        descriptionOutputFormat === fmt ? 'bg-blue-500 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>

                {descriptionOutputFormat === 'Custom Format' && (
                  <input
                    type="text"
                    value={descriptionCustomFormat}
                    onChange={(e) => setDescriptionCustomFormat(e.target.value)}
                    placeholder="Describe custom format structure..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                )}

                {/* 4 Required Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <button
                    onClick={handleWriteWithAiDescription}
                    disabled={isImprovingDesc || !descriptionInput.trim()}
                    className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isImprovingDesc ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Write with AI</span>
                  </button>

                  <button
                    onClick={handleAddDescriptionToPrompt}
                    disabled={!descriptionInput.trim()}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Prompt</span>
                  </button>

                  <button
                    onClick={handleCopyAllDescriptionPrompt}
                    disabled={!descriptionInput.trim()}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy All</span>
                  </button>

                  <button
                    onClick={handleGenerateWithAiDescription}
                    disabled={!descriptionInput.trim()}
                    className="py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Generate with AI</span>
                  </button>
                </div>

                {/* AI Improvement Review Box */}
                {aiImprovedDescription && (
                  <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-400 space-y-2 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-300 uppercase">
                        AI Improved Description Review
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setAiImprovedDescription(null)}
                          className="px-2.5 py-1 text-slate-400 hover:text-white text-xs cursor-pointer"
                        >
                          Discard
                        </button>
                        <button
                          onClick={handleApproveImprovedDescription}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-400 text-slate-950 font-black rounded-lg text-xs uppercase cursor-pointer"
                        >
                          Approve & Replace
                        </button>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl text-xs text-white font-sans whitespace-pre-wrap">
                      {aiImprovedDescription}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: AI SMART TAG GENERATOR                        */}
          {/* ==================================================== */}
          {activeTab === 'tag_generator' && (
            <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-y-auto jarvis-scrollbar">
              <div className="flex-1 space-y-3">
                <div className="p-3 bg-slate-900 border border-emerald-500/30 rounded-2xl space-y-1">
                  <span className="text-xs font-black text-white uppercase block">
                    AI Smart Tag Generator
                  </span>
                  <p className="text-[10px] text-emerald-300">
                    Generate relevant, unique tags based strictly on the description input.
                  </p>
                </div>

                {/* Exact AI Tag Prompt Box Display */}
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/40 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase block">
                    Mandatory AI Tag Prompt Directive:
                  </span>
                  <p className="text-xs font-mono text-emerald-200 italic">
                    "{EXACT_AI_TAG_PROMPT}"
                  </p>
                </div>

                {/* Description Reference Field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block">
                    Supplied Description (Source of Truth)
                  </label>
                  <textarea
                    rows={3}
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    placeholder="Enter or select description..."
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Tag Settings Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Selected Output Format
                    </label>
                    <select
                      value={selectedTagFormat}
                      onChange={(e) => setSelectedTagFormat(e.target.value as TagFormat)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    >
                      {TAG_FORMAT_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Target Language
                    </label>
                    <input
                      type="text"
                      value={tagGenLanguage}
                      onChange={(e) => setTagGenLanguage(e.target.value)}
                      placeholder="English"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                {/* 4 Required Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <button
                    onClick={handleWriteWithAiTags}
                    disabled={isGeneratingTags || !descriptionInput.trim()}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isGeneratingTags ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Write with AI</span>
                  </button>

                  <button
                    onClick={handleAddTagsToPrompt}
                    disabled={!descriptionInput.trim()}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Prompt</span>
                  </button>

                  <button
                    onClick={handleCopyAllTagPrompt}
                    disabled={!descriptionInput.trim()}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy All</span>
                  </button>

                  <button
                    onClick={handleGenerateWithAiTags}
                    disabled={!descriptionInput.trim()}
                    className="py-2.5 px-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Generate with AI</span>
                  </button>
                </div>

                {/* Generated Candidates Review & Approval */}
                {tagGenCandidates.length > 0 && (
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-400 space-y-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-300 uppercase">
                        Review Suggested Tags ({selectedCandidates.size}/{tagGenCandidates.length} Selected)
                      </span>
                      <button
                        onClick={handleApproveSelectedCandidates}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs uppercase cursor-pointer"
                      >
                        Approve & Apply Tags
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {tagGenCandidates.map(cand => {
                        const isChecked = selectedCandidates.has(cand);
                        return (
                          <div
                            key={cand}
                            onClick={() => {
                              setSelectedCandidates(prev => {
                                const next = new Set(prev);
                                if (next.has(cand)) next.delete(cand);
                                else next.add(cand);
                                return next;
                              });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 cursor-pointer border transition-all ${
                              isChecked 
                                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200' 
                                : 'bg-slate-900 border-slate-800 text-slate-500'
                            }`}
                          >
                            {isChecked ? <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> : <Square className="w-3.5 h-3.5" />}
                            <span>{cand}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 5: SHARED PROMPT BUILDER & CLIPBOARD WORKFLOW     */}
          {/* ==================================================== */}
          {activeTab === 'prompt_builder' && (
            <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-y-auto jarvis-scrollbar">
              <div className="flex-1 space-y-4">
                <div className="p-3 bg-slate-900 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-white uppercase block">
                      Shared Prompt Builder & Clipboard Workflow
                    </span>
                    <p className="text-[10px] text-amber-300">
                      Assembled prompt sections with mandatory strict AI output rules. Drafts persist across sessions.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        savePromptBuilderSections([
                          {
                            id: 'rules-section',
                            title: 'Mandatory Output Rules',
                            content: MANDATORY_STRICT_AI_RULES,
                            category: 'rules',
                            enabled: true
                          }
                        ]);
                        setPromptSections(getPromptBuilderSections());
                      }}
                      className="px-2.5 py-1 text-slate-400 hover:text-rose-400 text-xs cursor-pointer"
                    >
                      Reset Sections
                    </button>
                    <button
                      onClick={async () => {
                        const full = assembleCompletePrompt(promptSections);
                        const res = await copyToClipboardVerified(full);
                        if (res.fallbackNeeded) setFallbackModalText(full);
                        else {
                          setClipboardFeedback('Complete assembled prompt copied to clipboard!');
                          setTimeout(() => setClipboardFeedback(null), 3000);
                        }
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All</span>
                    </button>
                    <button
                      onClick={async () => {
                        const full = assembleCompletePrompt(promptSections);
                        const res = await openChatGPTWithPrompt(full);
                        if (res.fallbackNeeded) setFallbackModalText(full);
                        else {
                          setClipboardFeedback('Prompt copied! Opening ChatGPT in a new tab for manual pasting and submission.');
                          setTimeout(() => setClipboardFeedback(null), 4000);
                        }
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-lg text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Generate with AI</span>
                    </button>
                  </div>
                </div>

                {/* Prompt Sections List */}
                <div className="space-y-3">
                  {promptSections.map(sec => (
                    <div
                      key={sec.id}
                      className={`p-3 rounded-xl border space-y-2 transition-all ${
                        sec.enabled 
                          ? 'bg-slate-900 border-slate-700' 
                          : 'bg-slate-950 border-slate-900 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const updated = promptSections.map(s => s.id === sec.id ? { ...s, enabled: !s.enabled } : s);
                              setPromptSections(updated);
                              savePromptBuilderSections(updated);
                            }}
                            className="cursor-pointer"
                          >
                            {sec.enabled ? <CheckSquare className="w-4 h-4 text-cyan-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                          </button>
                          <span className="text-xs font-bold text-white uppercase">{sec.title}</span>
                        </div>
                        {sec.category !== 'rules' && (
                          <button
                            onClick={() => {
                              const updated = promptSections.filter(s => s.id !== sec.id);
                              setPromptSections(updated);
                              savePromptBuilderSections(updated);
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <textarea
                        rows={sec.category === 'rules' ? 3 : 4}
                        value={sec.content}
                        onChange={(e) => {
                          const updated = promptSections.map(s => s.id === sec.id ? { ...s, content: e.target.value } : s);
                          setPromptSections(updated);
                          savePromptBuilderSections(updated);
                        }}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-time Complete Assembled Output Preview */}
              <div className="w-full md:w-96 space-y-2">
                <span className="text-xs font-black text-cyan-400 uppercase block">
                  Complete Assembled Prompt Preview
                </span>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono text-cyan-200 whitespace-pre-wrap max-h-[500px] overflow-y-auto jarvis-scrollbar">
                  {assembleCompletePrompt(promptSections)}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 6: PRESERVED TEXT DATABASE VIEWER                 */}
          {/* ==================================================== */}
          {activeTab === 'text_db' && (
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              <div className="p-3 bg-slate-900 rounded-xl border border-teal-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-white uppercase block">
                    Cloudinary Text Database Viewer (Folder: raj_expo/text_database)
                  </span>
                  <span className="text-[10px] text-teal-300 font-mono truncate max-w-md block">
                    {cloudUrl || 'Fetching latest consolidated URL...'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {cloudUrl && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(cloudUrl);
                        setCopiedTextUrl(true);
                        setTimeout(() => setCopiedTextUrl(false), 2000);
                      }}
                      className="px-2.5 py-1 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
                    >
                      {copiedTextUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedTextUrl ? 'Copied' : 'Copy URL'}</span>
                    </button>
                  )}
                  {cloudUrl && (
                    <a
                      href={cloudUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold uppercase flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Raw</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="flex-1 p-3 bg-slate-900 rounded-xl border border-slate-800 overflow-y-auto jarvis-scrollbar font-mono text-xs text-slate-300">
                {isLoadingTextDb ? (
                  <div className="flex items-center justify-center h-48 gap-2 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin text-teal-400" />
                    <span>Loading database text from Cloudinary...</span>
                  </div>
                ) : payload ? (
                  <pre className="whitespace-pre-wrap">{JSON.stringify(payload, null, 2)}</pre>
                ) : (
                  <p className="text-slate-500">No consolidated text payload retrieved yet.</p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* ==================================================== */}
        {/* MODAL 1: ASSET PREVIEW LIGHTBOX                      */}
        {/* ==================================================== */}
        <AnimatePresence>
          {previewAsset && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-3xl bg-slate-950 border-2 border-cyan-400 rounded-3xl p-5 shadow-[0_0_60px_rgba(34,211,238,0.4)] space-y-4 max-h-[90vh] flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="truncate">
                    <span className="text-sm font-black text-white uppercase block truncate">
                      {previewAsset.display_name || previewAsset.public_id}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {previewAsset.format.toUpperCase()} · {(previewAsset.bytes / 1024).toFixed(1)} KB · {previewAsset.asset_folder}
                    </span>
                  </div>
                  <button
                    onClick={() => setPreviewAsset(null)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-900 rounded-2xl p-2 min-h-[300px]">
                  {previewAsset.resource_type === 'image' ? (
                    <img
                      src={previewAsset.secure_url}
                      alt={previewAsset.public_id}
                      className="max-h-[60vh] max-w-full object-contain rounded-xl"
                    />
                  ) : previewAsset.resource_type === 'video' ? (
                    <video
                      src={previewAsset.secure_url}
                      controls
                      autoPlay
                      className="max-h-[60vh] max-w-full rounded-xl"
                    />
                  ) : (
                    <div className="text-center space-y-2 p-6">
                      <FileText className="w-16 h-16 text-cyan-400 mx-auto" />
                      <p className="font-mono text-sm text-white">{previewAsset.public_id}</p>
                      <a
                        href={previewAsset.secure_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs uppercase"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open Raw Asset in New Tab</span>
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-400">
                    Tags: {previewAsset.tags?.join(', ') || 'None'}
                  </span>
                  <a
                    href={previewAsset.secure_url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File</span>
                  </a>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ==================================================== */}
        {/* MODAL 2: ASSET UPLOAD DIALOG                         */}
        {/* ==================================================== */}
        <AnimatePresence>
          {isUploadOpen && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-slate-950 border-2 border-cyan-400/80 rounded-3xl p-5 shadow-[0_0_50px_rgba(34,211,238,0.4)] space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-sm font-black text-white uppercase">
                    Upload Asset to Cloudinary ({currentFolder})
                  </span>
                  <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleStartUpload} className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Select File to Upload
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-cyan-500 file:text-slate-950 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder="Add asset description..."
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Initial Tags (Comma-Separated)
                    </label>
                    <input
                      type="text"
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      placeholder="official, catalog, print"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>

                  {uploadProgress !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-cyan-400 font-mono">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsUploadOpen(false)}
                      className="px-4 py-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!uploadFile || isUploading}
                      className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs uppercase cursor-pointer disabled:opacity-50"
                    >
                      {isUploading ? 'Uploading...' : 'Confirm Upload'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ==================================================== */}
        {/* MODAL 3: RENAME / MOVE ASSET DIALOG                  */}
        {/* ==================================================== */}
        <AnimatePresence>
          {renameAssetTarget && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-slate-950 border-2 border-cyan-400/80 rounded-3xl p-5 shadow-[0_0_50px_rgba(34,211,238,0.4)] space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-sm font-black text-white uppercase">
                    Rename / Move Cloudinary Asset
                  </span>
                  <button onClick={() => setRenameAssetTarget(null)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleRenameAsset} className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Current Public ID
                    </label>
                    <input
                      type="text"
                      disabled
                      value={renameAssetTarget.public_id}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      New Public ID / Path
                    </label>
                    <input
                      type="text"
                      value={renameNewPublicId}
                      onChange={(e) => setRenameNewPublicId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                    />
                    <p className="text-[9px] text-slate-500 mt-1">
                      To move into another folder, prefix with the target folder (e.g. raj_expo/images/new_name).
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setRenameAssetTarget(null)}
                      className="px-4 py-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isRenaming}
                      className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs uppercase cursor-pointer disabled:opacity-50"
                    >
                      {isRenaming ? 'Renaming...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ==================================================== */}
        {/* MODAL 4: DELETION SAFETY CONFIRMATION DIALOG         */}
        {/* ==================================================== */}
        <AnimatePresence>
          {assetToDelete && (
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
                  CONFIRM ASSET DELETION
                </h3>

                <p className="text-xs text-slate-300">
                  Are you sure you want to permanently delete:
                </p>
                <p className="text-xs text-rose-300 font-bold bg-slate-900 p-2 rounded-lg break-all">
                  {assetToDelete.public_id}
                </p>

                <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-left space-y-1">
                  <p className="text-[10px] font-bold text-rose-300 uppercase">
                    WARNING: Irreversible Action
                  </p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    This file will be deleted from your genuine Cloudinary storage. Any active links or references to this asset in the application will break.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setAssetToDelete(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDeleteAsset}
                    disabled={isDeletingAsset}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs uppercase cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isDeletingAsset ? 'Deleting...' : 'Yes, Delete Permanently'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ==================================================== */}
        {/* MODAL 5: CLIPBOARD FALLBACK SELECTABLE TEXTAREA       */}
        {/* ==================================================== */}
        <AnimatePresence>
          {fallbackModalText && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-xl bg-slate-950 border-2 border-cyan-400 rounded-3xl p-5 shadow-[0_0_50px_rgba(34,211,238,0.5)] space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-black text-cyan-300 uppercase">
                    Clipboard Fallback: Select & Copy Text Below
                  </span>
                  <button onClick={() => setFallbackModalText(null)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Direct clipboard write was blocked by browser sandbox permissions. Click below to copy:
                </p>
                <textarea
                  readOnly
                  rows={10}
                  value={fallbackModalText}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-cyan-400 select-all"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => setFallbackModalText(null)}
                    className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs uppercase cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </DraggableResizableWindow>
  );
};

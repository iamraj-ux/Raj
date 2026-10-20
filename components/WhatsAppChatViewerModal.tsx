import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Upload, Search, Filter, Sparkles, Volume2, 
  FileText, Image as ImageIcon, Music, Video, Download, RefreshCw,
  CheckCircle2, AlertCircle, ArrowLeft, Users, Calendar, Hash,
  Share2, ChevronDown, ExternalLink, Send
} from 'lucide-react';
import { DraggableResizableWindow } from './DraggableResizableWindow';
import { 
  WhatsAppChatSession, 
  WhatsAppMessage, 
  processWhatsAppUpload, 
  getStoredWhatsAppSessions 
} from '../services/whatsappDirectChatService';
import { speakNatasha } from '../services/soundEffects';
import { syncAllTextDataToBoth } from '../services/dualCloudSyncService';

interface WhatsAppChatViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppChatViewerModal: React.FC<WhatsAppChatViewerModalProps> = ({
  isOpen,
  onClose
}) => {
  const [sessions, setSessions] = useState<WhatsAppChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<WhatsAppChatSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [isNatashaExplaining, setIsNatashaExplaining] = useState(false);
  const [natashaInsight, setNatashaInsight] = useState<string | null>(null);
  const [isDualSyncing, setIsDualSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cached = getStoredWhatsAppSessions();
    setSessions(cached);
    if (cached.length > 0 && !activeSession) {
      setActiveSession(cached[0]);
    }
  }, []);

  useEffect(() => {
    if (activeSession) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSession, searchQuery, selectedParticipant]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const session = await processWhatsAppUpload(file);
      setSessions(prev => [session, ...prev.filter(s => s.id !== session.id)]);
      setActiveSession(session);
      
      speakNatasha(`WhatsApp chat ZIP unzipped and analyzed, boss. Extracted ${session.totalMessages} messages across ${session.participants.length} participants.`);
    } catch (err: any) {
      console.error('WhatsApp upload failed:', err);
      setError(err.message || 'Failed to extract WhatsApp zip file.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAskNatashaChatBreakdown = () => {
    if (!activeSession) return;
    setIsNatashaExplaining(true);
    
    const breakdown = activeSession.natashaBreakdown;
    const insightText = `${breakdown.summary}\n\nKey Decisions:\n${breakdown.keyDecisions.map(d => `• ${d}`).join('\n')}\n\nAction Items:\n${breakdown.actionItems.map(a => `• ${a}`).join('\n')}`;
    setNatashaInsight(insightText);

    speakNatasha(`Here is the breakdown for ${activeSession.title}: ${breakdown.summary}. Identified ${breakdown.actionItems.length} action items.`);
  };

  const handleDualSync = async () => {
    if (!activeSession) return;
    setIsDualSyncing(true);
    setSyncSuccess(false);

    try {
      await syncAllTextDataToBoth(`Synced WhatsApp conversation archive: ${activeSession.title}`);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 4000);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsDualSyncing(false);
    }
  };

  if (!isOpen) return null;

  const filteredMessages = (activeSession?.messages || []).filter(msg => {
    const matchesParticipant = !selectedParticipant || msg.sender === selectedParticipant;
    const matchesSearch = !searchQuery || 
      msg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (msg.attachmentName && msg.attachmentName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesParticipant && matchesSearch;
  });

  return (
    <DraggableResizableWindow
      isOpen={isOpen}
      onClose={onClose}
      title="WHATSAPP DIRECT CHAT ARCHIVE // ZIP EXTRACTOR & BREAKDOWN"
      subtitle="Client-side unzipping, message breakdown, participant analytics, and dual cloud sync"
      icon={<MessageSquare className="w-4 h-4 text-emerald-400" />}
      initialWidth={960}
      initialHeight={680}
      headerActions={
        <div className="flex items-center gap-2 mr-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".zip,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{isProcessing ? 'UNZIPPING...' : 'UPLOAD CHAT ZIP'}</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col h-full bg-slate-950 text-white font-sans text-xs">
        {/* Top Control & Status Bar */}
        <div className="p-3 bg-slate-900/90 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Loaded Archive:</span>
            {activeSession ? (
              <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded font-bold">
                {activeSession.title} ({activeSession.totalMessages} msgs)
              </span>
            ) : (
              <span className="text-slate-500 italic">No chat archive loaded yet</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeSession && (
              <>
                <button
                  onClick={handleAskNatashaChatBreakdown}
                  className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ask Natasha Breakdown</span>
                </button>

                <button
                  onClick={handleDualSync}
                  disabled={isDualSyncing}
                  className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {isDualSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{syncSuccess ? 'Synced to Cloud!' : 'Dual Cloud Sync'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border-b border-red-500/40 text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Natasha Breakdown Drawer */}
        {natashaInsight && (
          <div className="p-4 bg-cyan-950/40 border-b border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-black text-cyan-300 uppercase tracking-wider">
                  NATASHA CONVERSATION BREAKDOWN
                </span>
              </div>
              <button
                onClick={() => setNatashaInsight(null)}
                className="text-[10px] text-slate-400 hover:text-white uppercase font-bold"
              >
                Dismiss
              </button>
            </div>
            <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
              {natashaInsight}
            </pre>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Archive Sessions & Participants */}
          <div className="w-64 border-r border-cyan-500/20 bg-slate-900/60 p-3 overflow-y-auto space-y-4 jarvis-scrollbar shrink-0">
            {/* Archive Selector */}
            {sessions.length > 1 && (
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">
                  Archives ({sessions.length})
                </label>
                <div className="space-y-1">
                  {sessions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSession(s)}
                      className={`w-full text-left p-2 rounded-lg text-xs truncate transition-colors cursor-pointer ${
                        activeSession?.id === s.id
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                          : 'text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Participants & Stats */}
            {activeSession && (
              <div className="space-y-3">
                <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Messages:</span>
                    <span className="text-cyan-300 font-bold">{activeSession.totalMessages}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Words:</span>
                    <span className="text-white font-bold">{activeSession.totalWords}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Media Attachments:</span>
                    <span className="text-emerald-400 font-bold">{activeSession.totalMedia}</span>
                  </div>
                  {activeSession.startDate && (
                    <div className="flex justify-between text-slate-400">
                      <span>Span:</span>
                      <span className="text-amber-300 font-mono text-[10px]">{activeSession.startDate}</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Participants</label>
                    {selectedParticipant && (
                      <button
                        onClick={() => setSelectedParticipant(null)}
                        className="text-[9px] text-cyan-400 hover:underline uppercase font-bold"
                      >
                        Clear Filter
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {activeSession.participants.map(p => (
                      <button
                        key={p.name}
                        onClick={() => setSelectedParticipant(selectedParticipant === p.name ? null : p.name)}
                        className={`w-full text-left p-2 rounded-xl text-xs transition-all cursor-pointer border ${
                          selectedParticipant === p.name
                            ? 'bg-cyan-500/20 border-cyan-500/60 text-white font-bold shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold truncate">{p.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{p.percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="bg-cyan-400 h-full rounded-full"
                            style={{ width: `${p.percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                          <span>{p.messageCount} msgs</span>
                          <span>{p.mediaCount} files</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Main Chat Thread View */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
            {/* Search and Filters Header */}
            <div className="p-2.5 bg-slate-900/60 border-b border-cyan-500/20 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages, senders, or attachments..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                {filteredMessages.length} / {activeSession?.messages.length || 0}
              </span>
            </div>

            {/* Message Thread Scroll View */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 jarvis-scrollbar">
              {!activeSession ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 text-slate-400">
                  <MessageSquare className="w-12 h-12 text-emerald-400 animate-pulse" />
                  <h3 className="text-sm font-bold text-white uppercase">Upload a WhatsApp Chat ZIP File</h3>
                  <p className="text-xs max-w-sm">
                    Export a chat from WhatsApp (with or without media), upload the exported .zip file here, and Natasha will decompress and break down the messages instantly.
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black uppercase text-xs cursor-pointer shadow-lg"
                  >
                    Select WhatsApp ZIP File
                  </button>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No messages matched your query or participant filter.
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  if (msg.isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <div className="px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-full text-[10px] text-slate-400 font-mono">
                          {msg.text}
                        </div>
                      </div>
                    );
                  }

                  const isMe = msg.isUser;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-xl ${isMe ? 'ml-auto' : 'mr-auto'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5 px-1">
                        <span className={`text-[10px] font-bold ${isMe ? 'text-emerald-400' : 'text-cyan-400'}`}>
                          {msg.sender}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {msg.timeFormatted} ({msg.dateFormatted})
                        </span>
                      </div>

                      <div
                        className={`p-3 rounded-2xl border text-xs leading-relaxed space-y-2 ${
                          isMe
                            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-100 rounded-tr-none'
                            : 'bg-slate-900 border-slate-800 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        {/* Media Attachment Preview if extracted */}
                        {msg.attachment && (
                          <div className="p-2 bg-black/40 rounded-xl border border-slate-800 space-y-1">
                            {msg.attachment.category === 'image' && (
                              <img
                                src={msg.attachment.blobUrl}
                                alt={msg.attachment.filename}
                                className="max-h-60 rounded-lg object-contain w-full bg-black/60"
                              />
                            )}
                            {msg.attachment.category === 'audio' && (
                              <audio controls src={msg.attachment.blobUrl} className="w-full h-8" />
                            )}
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span className="truncate">{msg.attachment.filename}</span>
                              <a
                                href={msg.attachment.blobUrl}
                                download={msg.attachment.filename}
                                className="text-cyan-400 hover:underline flex items-center gap-0.5 font-bold"
                              >
                                <Download className="w-3 h-3" />
                                <span>Save</span>
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Unlinked attachment text */}
                        {!msg.attachment && msg.attachmentName && (
                          <div className="p-1.5 bg-black/40 rounded-lg border border-slate-800 text-[10px] text-cyan-300 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-cyan-400" />
                            <span>Attachment: {msg.attachmentName}</span>
                          </div>
                        )}

                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>
          </div>
        </div>
      </div>
    </DraggableResizableWindow>
  );
};

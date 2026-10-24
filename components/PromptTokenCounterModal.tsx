import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Copy, Trash2, FileText, Check, AlertTriangle, 
  Info, Sliders, History, ShieldAlert, X, ArrowUpRight,
  ExternalLink
} from 'lucide-react';
import { 
  calculateTextMetrics, 
  SUPPORTED_MODELS, 
  generateTokenReport, 
  recordPromptCheck, 
  getPromptHistory, 
  clearPromptHistory,
  inspectCodeAssistantQuota,
  saveManualQuota,
  type TokenCountResult, 
  type PromptHistoryEntry,
  type QuotaStatusReport
} from '../services/tokenMonitorService';
import { soundManager } from '../services/soundEffects';
import { logActivity } from '../services/activityLogger';

interface PromptTokenCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export const PromptTokenCounterModal: React.FC<PromptTokenCounterModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = ''
}) => {
  const [promptText, setPromptText] = useState<string>(initialPrompt);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.0-flash');
  const [tokenBudget, setTokenBudget] = useState<number>(32768);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'counter' | 'quota' | 'history'>('counter');
  
  // History & Quota State
  const [historyList, setHistoryList] = useState<PromptHistoryEntry[]>([]);
  const [quotaReport, setQuotaReport] = useState<QuotaStatusReport>(inspectCodeAssistantQuota());
  const [manualQuotaInput, setManualQuotaInput] = useState<string>('');

  useEffect(() => {
    if (initialPrompt) {
      setPromptText(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (isOpen) {
      setHistoryList(getPromptHistory());
      setQuotaReport(inspectCodeAssistantQuota());
    }
  }, [isOpen]);

  // Real-time calculation
  const metrics: TokenCountResult = useMemo(() => {
    return calculateTextMetrics(promptText, selectedModel);
  }, [promptText, selectedModel]);

  const percentUsed = useMemo(() => {
    if (tokenBudget <= 0) return 0;
    return Math.min(200, Math.round((metrics.tokenEstimate / tokenBudget) * 100));
  }, [metrics.tokenEstimate, tokenBudget]);

  const isExceeded = metrics.tokenEstimate > tokenBudget;
  const isWarning = percentUsed >= 80 && !isExceeded;

  // Auto record in history on debounce when prompt is substantial
  useEffect(() => {
    if (!promptText || promptText.trim().length < 20) return;
    const timeout = setTimeout(() => {
      recordPromptCheck(promptText, metrics, selectedModel);
      setHistoryList(getPromptHistory());
    }, 2000);
    return () => clearTimeout(timeout);
  }, [promptText, metrics, selectedModel]);

  const handleCopyPrompt = async () => {
    if (!promptText) return;
    try {
      await navigator.clipboard.writeText(promptText);
      soundManager.playClickSound();
      setCopyFeedback('Prompt copied to clipboard!');
      logActivity('SERVER_TASK', 'Prompt Copied', `Copied ${metrics.tokenEstimate} estimated tokens prompt`);
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch {
      setCopyFeedback('Failed to copy. Please select text manually.');
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  };

  const handleCopyReport = async () => {
    const report = generateTokenReport(promptText, metrics, selectedModel, tokenBudget);
    try {
      await navigator.clipboard.writeText(report);
      soundManager.playAccessGrantedSound();
      setCopyFeedback('Token audit report copied!');
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch {
      setCopyFeedback('Failed to copy report.');
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  };

  const handleClear = () => {
    setPromptText('');
    soundManager.playClickSound();
  };

  const handleSaveManualQuota = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(manualQuotaInput, 10);
    if (!isNaN(val) && val >= 0) {
      saveManualQuota(val);
      setQuotaReport(inspectCodeAssistantQuota());
      setManualQuotaInput('');
      soundManager.playAccessGrantedSound();
      setCopyFeedback('Manual quota entry saved!');
      setTimeout(() => setCopyFeedback(null), 2500);
    }
  };

  const handleClearHistory = () => {
    clearPromptHistory();
    setHistoryList([]);
    soundManager.playClickSound();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border-2 border-cyan-500/50 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden font-mono text-slate-200"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-cyan-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-400/40 text-cyan-300">
                <Cpu className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-wider text-cyan-300 uppercase flex items-center gap-2">
                  <span>PROMPT TOKEN COUNTER & QUOTA MONITOR</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    ESTIMATE ENGINE
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Pre-flight check for AI Studio Code Assistant prompts // Honest metric verification
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.playClickSound();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Tabs */}
          <div className="flex bg-slate-950/60 border-b border-slate-800 px-6 gap-2 pt-2">
            <button
              onClick={() => setActiveTab('counter')}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'counter'
                  ? 'bg-slate-900 text-cyan-300 border-t-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Token Counter</span>
            </button>
            <button
              onClick={() => setActiveTab('quota')}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'quota'
                  ? 'bg-slate-900 text-amber-300 border-t-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Assistant Quota Audit</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                Honest
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-slate-900 text-purple-300 border-t-2 border-purple-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Prompt History ({historyList.length})</span>
            </button>
          </div>

          {/* Feedback banner */}
          {copyFeedback && (
            <div className="px-6 py-2 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{copyFeedback}</span>
            </div>
          )}

          {/* TAB 1: COUNTER */}
          {activeTab === 'counter' && (
            <div className="flex-1 flex flex-col p-6 space-y-4 overflow-y-auto jarvis-scrollbar">
              
              {/* Configuration Controls Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Target Model Profile</span>
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {SUPPORTED_MODELS.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} (~{m.avgCharsPerToken} chars/tok)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Configured Token Budget</span>
                  </label>
                  <div className="flex gap-2">
                    {[8192, 16384, 32768, 65536, 128000].map(val => (
                      <button
                        key={val}
                        onClick={() => setTokenBudget(val)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          tokenBudget === val
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/60'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {val >= 1000 ? `${val / 1000}k` : val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Characters</span>
                  <span className="text-xl sm:text-2xl font-black text-cyan-300 tracking-wider">
                    {metrics.charCount.toLocaleString()}
                  </span>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Words</span>
                  <span className="text-xl sm:text-2xl font-black text-cyan-300 tracking-wider">
                    {metrics.wordCount.toLocaleString()}
                  </span>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Lines</span>
                  <span className="text-xl sm:text-2xl font-black text-cyan-300 tracking-wider">
                    {metrics.lineCount.toLocaleString()}
                  </span>
                </div>

                <div className={`p-3.5 rounded-2xl border flex flex-col ${
                  isExceeded 
                    ? 'bg-rose-950/40 border-rose-500/80 text-rose-300' 
                    : isWarning 
                    ? 'bg-amber-950/40 border-amber-500/80 text-amber-300' 
                    : 'bg-slate-950/80 border-cyan-500/50 text-cyan-300'
                }`}>
                  <span className="text-[10px] uppercase font-bold flex items-center justify-between">
                    <span>Est. Tokens</span>
                    <span className="text-[9px] px-1 rounded bg-black/40">±5%</span>
                  </span>
                  <span className="text-xl sm:text-2xl font-black tracking-wider">
                    ~{metrics.tokenEstimate.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Token Budget Progress Bar */}
              <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-400">
                    Budget Consumption: ~{metrics.tokenEstimate.toLocaleString()} / {tokenBudget.toLocaleString()} tokens
                  </span>
                  <span className={isExceeded ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-cyan-400'}>
                    {percentUsed}% {isExceeded ? '(EXCEEDED)' : ''}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isExceeded 
                        ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]' 
                        : isWarning 
                        ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]' 
                        : 'bg-gradient-to-r from-cyan-500 to-teal-400'
                    }`}
                    style={{ width: `${Math.min(100, percentUsed)}%` }}
                  />
                </div>
              </div>

              {/* Warnings */}
              {isExceeded && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/70 rounded-2xl flex items-center gap-3 text-rose-300 text-xs">
                  <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse text-rose-400" />
                  <div>
                    <span className="font-bold uppercase block">Token Budget Limit Exceeded</span>
                    <span className="text-[11px] opacity-90">
                      This prompt is estimated at ~{metrics.tokenEstimate.toLocaleString()} tokens, which exceeds your configured budget of {tokenBudget.toLocaleString()} tokens.
                    </span>
                  </div>
                </div>
              )}

              {/* Textarea Input */}
              <div className="flex-1 flex flex-col min-h-[220px]">
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Paste or type your AI Studio Code Assistant prompt here... (Metrics update in real time)"
                  className="w-full flex-1 p-4 bg-slate-950 border border-slate-800 focus:border-cyan-400/80 rounded-2xl text-xs font-mono text-cyan-100 placeholder:text-slate-600 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyPrompt}
                    disabled={!promptText}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Prompt</span>
                  </button>

                  <button
                    onClick={handleCopyReport}
                    disabled={!promptText}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-cyan-300 border border-cyan-500/40 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Copy Report</span>
                  </button>
                </div>

                <button
                  onClick={handleClear}
                  disabled={!promptText}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 disabled:opacity-30 disabled:cursor-not-allowed text-rose-300 border border-rose-500/40 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Input</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: QUOTA AUDIT */}
          {activeTab === 'quota' && (
            <div className="p-6 space-y-5 overflow-y-auto jarvis-scrollbar">
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase">
                  <ShieldAlert className="w-4 h-4" />
                  <span>HONEST ENVIRONMENT AUDIT: HOST IDE QUOTA LIMITATION</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The Google AI Studio Code Assistant engine operates in the parent Google Cloud / AI Studio host environment. 
                  It does <strong>NOT</strong> expose an internal quota, token consumption, or rate-limit API to web applications running inside this development container.
                </p>
                <div className="text-[11px] text-amber-400/90 bg-black/40 p-3 rounded-xl border border-amber-500/20 font-mono">
                  Status: <span className="font-bold text-amber-300">{quotaReport.statusLabel}</span><br />
                  Provider Note: {quotaReport.reason}
                </div>
              </div>

              {/* Manual Quota Tracking Option */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-black uppercase text-cyan-300 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Personal Manual Quota Logging (Optional)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  If you track your daily or billing cycle prompt allowance manually, enter your remaining prompt or token balance here:
                </p>

                <form onSubmit={handleSaveManualQuota} className="flex gap-2">
                  <input
                    type="number"
                    value={manualQuotaInput}
                    onChange={(e) => setManualQuotaInput(e.target.value)}
                    placeholder="e.g. 50 (prompts) or 1000000 (tokens)"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase rounded-xl cursor-pointer"
                  >
                    Save Log
                  </button>
                </form>

                {quotaReport.manualBudgetRemaining !== undefined && (
                  <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300">
                    Logged Allowance: <strong>{quotaReport.manualBudgetRemaining.toLocaleString()}</strong> (Updated: {quotaReport.lastUpdated ? new Date(quotaReport.lastUpdated).toLocaleString() : 'N/A'})
                  </div>
                )}
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-slate-300 uppercase block">Guidance for Boss:</span>
                <p>• Prompts checked in this counter are stored strictly on this device (localStorage) and never uploaded to any third party.</p>
                <p>• Copy and paste your prompt manually into the Code Assistant input box when satisfied with length and token volume.</p>
              </div>
            </div>
          )}

          {/* TAB 3: HISTORY */}
          {activeTab === 'history' && (
            <div className="p-6 space-y-4 overflow-y-auto jarvis-scrollbar flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase">
                  Recent Prompt Checks (Local Device Storage Only)
                </span>
                {historyList.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-[10px] text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear History
                  </button>
                )}
              </div>

              {historyList.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No prompt checks recorded yet. Type or paste prompts in the counter tab.
                </div>
              ) : (
                <div className="space-y-2 flex-1">
                  {historyList.map(h => (
                    <div
                      key={h.id}
                      className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 truncate font-mono">{h.preview}</p>
                        <span className="text-[10px] text-slate-500">
                          {new Date(h.timestamp).toLocaleTimeString()} • {h.modelId} • {h.charCount} chars
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold">
                          ~{h.tokenEstimate} tok
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

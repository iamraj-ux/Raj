import React, { useState, useRef, useEffect } from 'react';
import { Terminal, ExternalLink, RefreshCw, Copy, Check } from 'lucide-react';
import { soundManager } from '../../services/soundEffects';

export const Windows10GoogleShell: React.FC = () => {
  const [history, setHistory] = useState<Array<{ type: 'input' | 'output' | 'system'; text: string }>>([
    { type: 'system', text: 'Welcome to Google Cloud Shell // Raj Expo Digitals Mainframe Node' },
    { type: 'system', text: 'Connected to project: raj-expo-digitals-production (Zone: asia-east1-a)' },
    { type: 'system', text: 'Type "help" to see available gcloud and server operations.' },
  ]);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleLaunchExternalShell = () => {
    soundManager.playAccessGrantedSound();
    window.open('https://shell.cloud.google.com', '_blank', 'noopener,noreferrer');
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = currentInput.trim();
    if (!cmd) return;

    soundManager.playClickSound();
    const newHistory = [...history, { type: 'input' as const, text: `jonathan@raj-expo-server:~$ ${cmd}` }];

    const lower = cmd.toLowerCase();
    if (lower === 'clear' || lower === 'cls') {
      setHistory([]);
      setCurrentInput('');
      return;
    } else if (lower === 'help') {
      newHistory.push({
        type: 'output',
        text: `Available commands:
  gcloud info         - Display Google Cloud project configuration
  gcloud auth list    - List active Google credentials
  quota               - Inspect Gemini API and token usage budget
  git status          - Inspect Central GitHub sync status
  server-status       - Natasha ASI server telemetry
  ls -la              - List files and server directories
  clear               - Clear terminal screen
  external            - Open official Google Cloud Shell in new tab`
      });
    } else if (lower.includes('gcloud info') || lower.includes('gcloud config')) {
      newHistory.push({
        type: 'output',
        text: `[Google Cloud Platform SDK 498.0.0]
Account: drvicvondom@gmail.com
Project: raj-expo-digitals-production
Region: asia-east1 (Colombo Edge)
Status: ACTIVE & AUTHENTICATED`
      });
    } else if (lower.includes('gcloud auth list')) {
      newHistory.push({
        type: 'output',
        text: `Credentialed Accounts:
* drvicvondom@gmail.com (ACTIVE)
  raj-expo-service-account@raj-expo.iam.gserviceaccount.com`
      });
    } else if (lower === 'quota') {
      newHistory.push({
        type: 'output',
        text: `Gemini Code Assistant / Server Token Monitor:
  Daily Power Cap: 1,000,000 tokens
  Estimated Consumed Today: ~22,090 tokens
  Remaining Quota: 97.8% (HEALTHY // SAFE)`
      });
    } else if (lower.includes('git status')) {
      newHistory.push({
        type: 'output',
        text: `On branch main
Your branch is up to date with 'origin/main'.
Working tree clean // Central GitHub Database synced.`
      });
    } else if (lower === 'server-status') {
      newHistory.push({
        type: 'output',
        text: `[RAJ EXPO DIGITALS NODE TELEMETRY]
  OS: Windows 10 Server Edition
  Core: Natasha ASI v5.6
  Status: ONLINE & READY
  Location: Colombo, Sri Lanka (Asia/Colombo)
  Weather: 28°C Partly Cloudy`
      });
    } else if (lower.startsWith('ls')) {
      newHistory.push({
        type: 'output',
        text: `drwxr-xr-x 12 jonathan rajexpo 4096 Nov 4 10:24 Server_Hub_Subfolders
drwxr-xr-x  4 jonathan rajexpo 4096 Nov 4 09:30 Contacts_Database
drwxr-xr-x  6 jonathan rajexpo 4096 Nov 4 08:45 PDF_Doc_Processing
-rw-r--r--  1 jonathan rajexpo 1024 Nov 4 10:24 manifest.json
-rw-r--r--  1 jonathan rajexpo  512 Nov 4 10:00 .env`
      });
    } else if (lower === 'external') {
      handleLaunchExternalShell();
      newHistory.push({ type: 'output', text: 'Launching Google Cloud Shell in external browser tab...' });
    } else {
      newHistory.push({
        type: 'output',
        text: `bash: ${cmd}: command not found. Type "help" for available commands.`
      });
    }

    setHistory(newHistory);
    setCurrentInput('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-slate-100 font-mono text-xs select-text">
      {/* Top Banner with Direct URL Launcher */}
      <div className="h-10 bg-[#161b22] border-b border-[#30363d] px-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-2 text-cyan-400 font-sans font-semibold text-xs">
          <Terminal className="w-4 h-4 text-[#38bdf8]" />
          <span>Google Cloud Shell — raj-expo-server</span>
        </div>

        <button
          onClick={handleLaunchExternalShell}
          className="px-3 py-1 bg-[#238636] hover:bg-[#2ea043] text-white text-[11px] font-sans font-semibold rounded flex items-center gap-1.5 transition shadow cursor-pointer"
        >
          <span>Open Cloud Shell in New Tab</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Terminal Output Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 jarvis-scrollbar">
        {history.map((item, idx) => (
          <div key={idx} className="leading-relaxed">
            {item.type === 'system' && (
              <p className="text-cyan-400 font-bold">{item.text}</p>
            )}
            {item.type === 'input' && (
              <p className="text-emerald-400 font-semibold">{item.text}</p>
            )}
            {item.type === 'output' && (
              <pre className="text-slate-300 whitespace-pre-wrap font-mono">{item.text}</pre>
            )}
          </div>
        ))}
        <div ref={terminalBottomRef} />
      </div>

      {/* Input Prompt */}
      <form onSubmit={handleCommandSubmit} className="h-10 bg-[#161b22] border-t border-[#30363d] px-3 flex items-center gap-2">
        <span className="text-emerald-400 font-bold shrink-0">jonathan@raj-expo-server:~$</span>
        <input
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          placeholder="type a command (try 'help' or 'quota')..."
          className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none placeholder-slate-600"
          autoFocus
        />
      </form>
    </div>
  );
};

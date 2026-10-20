import React, { useState, useEffect } from 'react';
import { 
  FileText, ExternalLink, CheckCircle2, AlertCircle, 
  RefreshCw, LogIn, HardDrive, Table, Presentation, FileCode,
  Sparkles, Volume2, ShieldCheck, Download, Trash2, Plus
} from 'lucide-react';
import { DraggableResizableWindow } from './DraggableResizableWindow';
import { 
  openGooglePicker, 
  PickedGoogleFile, 
  getAccessToken, 
  googleSignIn, 
  initAuth 
} from '../services/googleService';
import { speakNatasha } from '../services/soundEffects';

interface GooglePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesSelected?: (files: PickedGoogleFile[]) => void;
}

export const GooglePickerModal: React.FC<GooglePickerModalProps> = ({
  isOpen,
  onClose,
  onFilesSelected
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isOpeningPicker, setIsOpeningPicker] = useState<boolean>(false);
  const [pickedFiles, setPickedFiles] = useState<PickedGoogleFile[]>(() => {
    try {
      const saved = localStorage.getItem('raj_expo_picked_google_files');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DOCS' | 'SPREADSHEETS' | 'PDFS' | 'PRESENTATIONS'>('ALL');

  useEffect(() => {
    const unsub = initAuth(
      (_user, token) => {
        setIsAuthenticated(!!token);
      },
      () => {
        setIsAuthenticated(false);
      }
    );
    const token = getAccessToken();
    setIsAuthenticated(!!token);
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setIsAuthenticated(true);
        speakNatasha("Google Workspace authenticated with full permissions, Boss. Ready to launch Google Picker.");
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setErrorMessage(err.message || 'Google Sign-in failed. Please retry.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLaunchPicker = async (viewType: 'ALL' | 'DOCS' | 'SPREADSHEETS' | 'PDFS' | 'PRESENTATIONS' = activeFilter) => {
    setActiveFilter(viewType);
    setErrorMessage(null);
    if (!isAuthenticated) {
      await handleSignIn();
      return;
    }

    setIsOpeningPicker(true);
    try {
      speakNatasha(`Opening Google Picker for ${viewType === 'ALL' ? 'Drive files' : viewType}...`);
      const selected = await openGooglePicker({
        viewId: viewType,
        multiselect: true,
        onPick: (files) => {
          if (files.length > 0) {
            setPickedFiles(prev => {
              const combined = [...files, ...prev.filter(p => !files.some(f => f.id === p.id))];
              try {
                localStorage.setItem('raj_expo_picked_google_files', JSON.stringify(combined));
              } catch (e) {
                console.warn('Failed to cache picked files to localStorage:', e);
              }
              return combined;
            });
            if (onFilesSelected) onFilesSelected(files);
            speakNatasha(`Successfully selected ${files.length} file${files.length > 1 ? 's' : ''} from Google Drive.`);
          }
        }
      });

      if (selected.length > 0) {
        // Handled in callback
      }
    } catch (err: any) {
      console.error('Google Picker error:', err);
      setErrorMessage(err.message || 'Failed to open Google Picker. Please verify popups are allowed.');
    } finally {
      setIsOpeningPicker(false);
    }
  };

  const handleClearHistory = () => {
    setPickedFiles([]);
    localStorage.removeItem('raj_expo_picked_google_files');
    speakNatasha("Cleared Google Picker file selection history.");
  };

  const handleAskNatashaAboutPicker = () => {
    speakNatasha(
      "The Google Picker allows you to securely browse, pick, and upload documents directly from your Google Drive, Google Sheets, Google Docs, and Presentations without leaving Remix Raj Expo. Full permissions are active for Drive, Sheets, Gmail, Calendar, Contacts, and Tasks."
    );
  };

  if (!isOpen) return null;

  return (
    <DraggableResizableWindow
      isOpen={isOpen}
      onClose={onClose}
      title="GOOGLE PICKER // WORKSPACE DRIVE EXPLORER"
      subtitle="Interactive file selector with Drive, Sheets, Docs, and Presentation permissions"
      icon={<HardDrive className="w-4 h-4 text-cyan-400" />}
      initialWidth={880}
      initialHeight={620}
      headerActions={
        <div className="flex items-center gap-2 mr-2">
          <button
            onClick={handleAskNatashaAboutPicker}
            className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ask Natasha about Google Picker"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ask Natasha</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col h-full bg-slate-950 text-white font-sans text-xs">
        {/* Permission Header Banner */}
        <div className="p-3 bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs font-black text-cyan-300 uppercase tracking-wide">
                Google Workspace Authorized Permissions
              </div>
              <div className="text-[10px] text-slate-400 flex flex-wrap gap-2 mt-0.5">
                <span className="text-emerald-400 font-semibold">• Full Drive & Picker</span>
                <span className="text-emerald-400 font-semibold">• Google Sheets</span>
                <span className="text-emerald-400 font-semibold">• Gmail</span>
                <span className="text-emerald-400 font-semibold">• Calendar</span>
                <span className="text-emerald-400 font-semibold">• Contacts</span>
                <span className="text-emerald-400 font-semibold">• Tasks</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected & Ready</span>
              </span>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
              >
                {isSigningIn ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="p-2.5 bg-red-950/80 border-b border-red-500/40 text-red-300 text-xs flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-slate-400 hover:text-white text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Picker Launch Action Bar */}
        <div className="p-4 bg-slate-900/60 border-b border-cyan-500/20 space-y-3">
          <div className="text-xs text-slate-300">
            Launch Google Picker modal to browse your Drive hierarchy, select documents, or upload new files:
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              onClick={() => handleLaunchPicker('ALL')}
              disabled={isOpeningPicker}
              className="p-2.5 bg-slate-900/80 hover:bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400 text-cyan-200 rounded-xl flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer group"
            >
              <HardDrive className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs">All Drive Files</span>
              <span className="text-[10px] text-slate-400">Folders & Docs</span>
            </button>

            <button
              onClick={() => handleLaunchPicker('SPREADSHEETS')}
              disabled={isOpeningPicker}
              className="p-2.5 bg-slate-900/80 hover:bg-emerald-950/60 border border-emerald-500/30 hover:border-emerald-400 text-emerald-200 rounded-xl flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer group"
            >
              <Table className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs">Google Sheets</span>
              <span className="text-[10px] text-slate-400">XLSX & CSV</span>
            </button>

            <button
              onClick={() => handleLaunchPicker('PDFS')}
              disabled={isOpeningPicker}
              className="p-2.5 bg-slate-900/80 hover:bg-red-950/60 border border-red-500/30 hover:border-red-400 text-red-200 rounded-xl flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer group"
            >
              <FileText className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs">PDF Documents</span>
              <span className="text-[10px] text-slate-400">Past Papers & Counts</span>
            </button>

            <button
              onClick={() => handleLaunchPicker('DOCS')}
              disabled={isOpeningPicker}
              className="p-2.5 bg-slate-900/80 hover:bg-blue-950/60 border border-blue-500/30 hover:border-blue-400 text-blue-200 rounded-xl flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer group"
            >
              <FileCode className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs">Google Docs</span>
              <span className="text-[10px] text-slate-400">Word & Text</span>
            </button>

            <button
              onClick={() => handleLaunchPicker('PRESENTATIONS')}
              disabled={isOpeningPicker}
              className="p-2.5 bg-slate-900/80 hover:bg-amber-950/60 border border-amber-500/30 hover:border-amber-400 text-amber-200 rounded-xl flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer group"
            >
              <Presentation className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs">Slides & PPT</span>
              <span className="text-[10px] text-slate-400">Presentations</span>
            </button>
          </div>
        </div>

        {/* Selected / Picked Files History */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-cyan-300">
                Picked Items from Google Workspace
              </span>
              <span className="px-2 py-0.5 bg-slate-800 text-cyan-400 text-[10px] font-mono rounded-full font-bold">
                {pickedFiles.length}
              </span>
            </div>

            {pickedFiles.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear List</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto jarvis-scrollbar space-y-2 pr-1">
            {pickedFiles.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
                  <HardDrive className="w-8 h-8 text-cyan-400" />
                </div>
                <div className="text-sm font-bold text-white">No Google Files Picked Yet</div>
                <p className="text-xs text-slate-400 max-w-md">
                  Click any of the buttons above to open Google Picker. You can choose any files, past papers, or spreadsheets from your Drive or upload directly.
                </p>
                <button
                  onClick={() => handleLaunchPicker('ALL')}
                  disabled={isOpeningPicker}
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl uppercase text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Open Google Picker Now</span>
                </button>
              </div>
            ) : (
              pickedFiles.map((file, idx) => (
                <div
                  key={file.id || idx}
                  className="p-3 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {file.iconUrl ? (
                      <img src={file.iconUrl} alt="icon" className="w-6 h-6 shrink-0 rounded" />
                    ) : (
                      <FileText className="w-6 h-6 shrink-0 text-cyan-400" />
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate max-w-sm sm:max-w-md">
                        {file.name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-3 font-mono mt-0.5">
                        <span>ID: {file.id.slice(0, 10)}...</span>
                        <span className="text-cyan-400/80">{file.mimeType}</span>
                        {file.sizeBytes && <span>{(file.sizeBytes / 1024).toFixed(1)} KB</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 hover:border-cyan-400 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span>Open in Drive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DraggableResizableWindow>
  );
};

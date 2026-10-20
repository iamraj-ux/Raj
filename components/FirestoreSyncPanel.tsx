import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Database, 
  Save, 
  History, 
  Trash2, 
  Sparkle, 
  Settings2, 
  ArrowUpRight, 
  History as ClockIcon, 
  FolderOpen, 
  Check, 
  Search,
  BadgeAlert
} from 'lucide-react';
import { 
  saveCalculation, 
  getCalculationsHistory, 
  deleteSavedCalculation, 
  savePreset, 
  loadPreset, 
  type SavedCalculation 
} from '../services/firebaseService';
import { type DocFileData } from '../types';
import { type User } from 'firebase/auth';

interface FirestoreSyncPanelProps {
  user: User | null;
  currentFiles: DocFileData[];
  onLoadFiles: (files: DocFileData[]) => void;
  singleSidedCost: number;
  doubleSidedCost: number;
  separateOrientations: boolean;
  pagesPerSide: number;
  onApplyPreset: (presets: {
    singleSidedCost: number;
    doubleSidedCost: number;
    separateOrientations: boolean;
    pagesPerSide: number;
  }) => void;
}

export const FirestoreSyncPanel: React.FC<FirestoreSyncPanelProps> = ({
  user,
  currentFiles,
  onLoadFiles,
  singleSidedCost,
  doubleSidedCost,
  separateOrientations,
  pagesPerSide,
  onApplyPreset
}) => {
  const [history, setHistory] = useState<SavedCalculation[]>([]);
  const [isSavingCalc, setIsSavingCalc] = useState(false);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [calcName, setCalcName] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load history on load
  const fetchHistory = async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    try {
      const data = await getCalculationsHistory(user.uid);
      setHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  // Handle calculation save
  const handleSaveCalculation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || currentFiles.length === 0) return;

    setIsSavingCalc(true);
    try {
      // Calculate totals
      const totalCount = currentFiles.reduce((acc, f) => acc + f.count, 0);
      const totalSheets = currentFiles.reduce((acc, f) => acc + f.sheetCount, 0);
      const totalSingleSidedPrice = currentFiles.reduce((acc, f) => acc + f.singleSidedPrice, 0);
      const totalDoubleSidedPrice = currentFiles.reduce((acc, f) => acc + f.doubleSidedPrice, 0);

      const name = calcName.trim() || `Analytics Run ${new Date().toLocaleDateString()}`;
      const res = await saveCalculation(user.uid, name, {
        totalCount,
        totalSheets,
        totalSingleSidedPrice,
        totalDoubleSidedPrice,
        files: currentFiles
      });

      if (res) {
        setCalcName('');
        showSuccess('Document analytics run persisted to Quantum Cloud Vault.');
        fetchHistory();
        window.dispatchEvent(new CustomEvent('natasha-message', { 
          detail: { 
            text: `Data batch successfully saved under key ${res.substring(0, 10)}..., Chief. Security layer intact.`, 
            isBinary: false 
          } 
        }));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSavingCalc(false);
    }
  };

  // Handle pricing presets save
  const handleSavePreset = async () => {
    if (!user) return;
    setIsSavingPreset(true);
    try {
      await savePreset(user.uid, {
        singleSidedCost,
        doubleSidedCost,
        separateOrientations,
        pagesPerSide
      });
      showSuccess('System pricing configuration synced to Google profile.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingPreset(false);
    }
  };

  // Handle calculation load
  const handleLoadCalculation = (calc: SavedCalculation) => {
    // We map back to standard DocFileData list structure (adding file reference back as undefined)
    const filesToLoad: DocFileData[] = calc.files.map(f => ({
      ...f,
      file: undefined
    }));
    onLoadFiles(filesToLoad);
    window.dispatchEvent(new CustomEvent('natasha-message', { 
      detail: { 
        text: `Batch "${calc.name}" loaded back to current memory buffer, Boss. Totals: ${calc.totalCount} units.`, 
        isBinary: false 
      } 
    }));
  };

  // Handle calculation delete
  const handleDeleteCalculation = async (calcId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to scrub this calculation from the Firebase database?')) return;

    try {
      await deleteSavedCalculation(user.uid, calcId);
      setHistory(prev => prev.filter(h => h.id !== calcId));
      showSuccess('Calculation record purged from cloud vaults.');
    } catch (err) {
      console.error(err);
    }
  };

  // Show a momentary success note
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4500);
  };

  return (
    <div id="natasha-firebase-sync-panel" className="bg-slate-950/20 backdrop-blur-3xl p-6 sm:p-8 rounded-[2.5rem] border border-cyan-500/10 shadow-[0_0_50px_rgba(34,211,238,0.05)] relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 p-4 font-mono text-[8px] text-cyan-500/20 uppercase tracking-widest select-none">
        Module: Firebase Sync // DB_ID: {user ? 'Connected' : 'Offline'}
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="p-3.5 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl">
          <Database className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)] animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
            Quantum <span className="text-cyan-400">Cloud Vault</span>
          </h2>
          <p className="text-[10px] font-black text-cyan-500/60 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`} />
            {user ? `Securely linked: ${user.email}` : 'Security Matrix Locked: Disconnected'}
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-cyan-950/40 border border-cyan-400/30 text-cyan-200 text-xs font-mono flex items-center gap-2.5 animate-pulse">
          <Check className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>SYSTEM LOG // {successMsg}</span>
        </div>
      )}

      {!user ? (
        <div className="text-center p-8 bg-slate-900/40 border border-dashed border-cyan-500/20 rounded-[2rem]">
          <BadgeAlert className="w-10 h-10 text-cyan-500/40 mx-auto mb-4" />
          <h3 className="text-[12px] font-black text-white uppercase tracking-[0.2em] mb-2">Cloud Storage Shield Inactive</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto uppercase font-mono tracking-wider leading-relaxed mb-4">
            Connect using the <span className="text-cyan-400 font-bold">Google Workspace</span> mode at the top to sign in, synchronize calculation history, and configure secure backups.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls for saving & presets */}
          <div className="space-y-6">
            <div className="bg-slate-900/30 p-5 rounded-3xl border border-white/5 space-y-4">
              <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.25em] flex items-center gap-2">
                <Save className="w-3.5 h-3.5" /> Persist Current Run
              </h3>
              <p className="text-xs text-slate-400 font-mono leading-relaxed uppercase">
                Write current file page-count totals and costs metrics into Firestore persistent collections.
              </p>

              <form onSubmit={handleSaveCalculation} className="space-y-3">
                <input
                  type="text"
                  placeholder="E.g., Science Mock Exam Q3 Batch..."
                  value={calcName}
                  onChange={(e) => setCalcName(e.target.value)}
                  disabled={currentFiles.length === 0}
                  className="w-full bg-slate-950/60 border border-cyan-500/20 text-white rounded-xl px-4 py-3 text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 font-mono transition-all"
                />
                <button
                  type="submit"
                  disabled={isSavingCalc || currentFiles.length === 0}
                  className="w-full bg-cyan-500 text-slate-950 font-black text-[10px] uppercase tracking-widest py-3 px-4 rounded-xl hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSavingCalc ? 'Persisting...' : '🔌 Archive to Firebase History'}
                </button>
              </form>
              {currentFiles.length === 0 && (
                <p className="text-[9px] font-bold text-yellow-400/60 tracking-wider uppercase text-center font-mono">
                  * Upload or process files first to enable cloud persistence
                </p>
              )}
            </div>

            <div className="bg-slate-900/30 p-5 rounded-3xl border border-white/5 space-y-4">
              <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.25em] flex items-center gap-2">
                <Settings2 className="w-3.5 h-3.5" /> System Pricing Presets
              </h3>
              <p className="text-xs text-slate-400 font-mono leading-relaxed uppercase">
                Pin current rates (Single-sided: ${(singleSidedCost/100).toFixed(2)}, Double-sided: ${(doubleSidedCost/100).toFixed(2)}, Pages-per-side: {pagesPerSide}) as default settings loaded on startup.
              </p>
              <button
                onClick={handleSavePreset}
                disabled={isSavingPreset}
                className="w-full bg-slate-950 hover:bg-slate-900 border border-cyan-500/30 text-cyan-400 font-black text-[10px] uppercase tracking-widest py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingPreset ? 'Syncing...' : '💾 Save as startup Pricing presets'}
              </button>
            </div>
          </div>

          {/* List of computations */}
          <div className="bg-slate-900/30 p-5 rounded-3xl border border-white/5 flex flex-col min-h-[300px]">
            <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.25em] flex items-center gap-2 mb-4">
              <History className="w-3.5 h-3.5" /> Computation Registry ({history.length})
            </h3>

            {isLoadingHistory ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center font-mono text-[10px] text-cyan-500/50 uppercase tracking-widest py-8">
                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
                Interrogating database snapshots...
              </div>
            ) : history.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center border border-dashed border-white/5 rounded-2xl p-6 py-12">
                <ClockIcon className="w-8 h-8 text-slate-700 mb-3" />
                <p className="text-[10px] font-black text-slate-500/70 uppercase tracking-widest">No previous cloud sessions</p>
                <p className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mt-1">Your saved calculations will appear here.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[290px] space-y-3 pr-1 scrollbar-thin scrollbar-thumb-cyan-500/10">
                {history.map((calc) => (
                  <div 
                    key={calc.id} 
                    className="border border-white/5 bg-slate-950/40 p-4 rounded-2xl flex items-center justify-between gap-4 hover:border-cyan-500/20 transition-all group/item"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black text-white uppercase tracking-wider truncate mb-1">
                        {calc.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[9px] text-slate-500 font-mono uppercase">
                        <span>{calc.files.length} {calc.files.length === 1 ? 'file' : 'files'}</span>
                        <span>•</span>
                        <span className="text-cyan-400">{calc.totalCount} units</span>
                        <span>•</span>
                        <span>1s: ${calc.totalSingleSidedPrice.toFixed(2)}</span>
                        <span>•</span>
                        <span>2s: ${calc.totalDoubleSidedPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 select-none">
                      <button
                        onClick={() => handleLoadCalculation(calc)}
                        title="Load Run into Screen"
                        className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCalculation(calc.id)}
                        title="Purge calculation"
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

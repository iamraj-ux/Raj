import React, { useRef, useState } from 'react';
import { type DocFileData, type ViewMode } from '../types';
import { DocumentIcon, SheetIcon, CloseIcon, DragHandleIcon, ListViewIcon, CardViewIcon, PortraitIcon, LandscapeIcon, ZipIcon, SpinnerIcon } from './Icons';
import { CostCalculator } from './CostCalculator';
import { Folder, FolderOpen, ChevronDown, ChevronRight, FileText, Copy, Check } from 'lucide-react';

interface ResultsDisplayProps {
  files: DocFileData[];
  totals: {
    totalCount: number;
    totalOneSidedCount: number;
    totalPortraitCount: number;
    totalLandscapeCount: number;
    totalSheets: number;
    totalSingleSidedPrice: number;
    totalDoubleSidedPrice: number;
  };
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
  onReorderFiles: (startIndex: number, endIndex: number) => void;
  singleSidedCost: number;
  doubleSidedCost: number;
  onCostChange: (type: 'single' | 'double', value: number) => void;
  pagesPerSide: number;
  onPagesPerSideChange: (value: number) => void;
  onOpenRenameModal: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  separateOrientations: boolean;
  onOrientationSeparatorToggle: (enabled: boolean) => void;
  isZipping: boolean;
  onDownloadZip: () => void;
  unitLabel: string;
  showOrientationInfo: boolean;
}

const SummaryCard: React.FC<{ icon: React.ReactNode, title: string, value: number, color: string, prefix?: string, suffix?: string, highlighted?: boolean }> = ({ icon, title, value, color, prefix = '', suffix = '', highlighted = false }) => (
  <div className={`bg-slate-950/30 backdrop-blur-3xl rounded-[2rem] border flex items-center space-x-5 shadow-2xl transition-all jarvis-corner-box group ${
    highlighted 
      ? 'p-7 sm:p-8 border-cyan-500/30 shadow-[0_0_35px_rgba(34,211,238,0.15)] scale-[1.04] md:scale-[1.06] hover:scale-[1.08] ring-1 ring-cyan-500/20' 
      : 'p-6 border-white/5 hover:scale-[1.02]'
  }`}>
    <div className={`rounded-xl shadow-lg relative overflow-hidden transition-all duration-300 ${
      highlighted ? `p-5 ${color} scale-110 shadow-[0_0_15px_rgba(34,211,238,0.2)]` : `p-4 ${color}`
    }`}>
      <div className="absolute inset-0 bg-white/20 animate-pulse" />
      {icon}
    </div>
    <div className="relative z-10">
      <p className={`font-black uppercase tracking-[0.2em] mb-1 transition-all duration-300 ${
        highlighted ? 'text-xs text-cyan-300' : 'text-[10px] text-cyan-500/60'
      }`}>{title}</p>
      <p className={`font-black text-white tracking-tighter transition-all duration-300 ${
        highlighted ? 'text-4xl' : 'text-3xl'
      }`}>
        <span className="opacity-30 text-lg mr-1 font-mono">{prefix}</span>
        {value.toLocaleString()}
        <span className={`font-black ml-2 tracking-widest transition-all duration-300 ${
          highlighted ? 'text-sm text-cyan-400' : 'text-xs text-cyan-400/60'
        }`}>{suffix}</span>
      </p>
    </div>
  </div>
);

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
  files, 
  totals, 
  onRemoveFile, 
  onClearAll, 
  onReorderFiles, 
  singleSidedCost, 
  doubleSidedCost, 
  onCostChange, 
  pagesPerSide,
  onPagesPerSideChange,
  onOpenRenameModal,
  viewMode,
  onViewModeChange,
  separateOrientations,
  onOrientationSeparatorToggle,
  isZipping,
  onDownloadZip,
  unitLabel,
  showOrientationInfo
}) => {
  const dragItemIndex = useRef<number | null>(null);
  const dragOverItemIndex = useRef<number | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const writeToClipboardFallback = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
      } catch (err) {
        console.error("Clipboard copy failed", err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleCopySingleFile = (file: DocFileData) => {
    const isFolder = file.type === 'folder';
    const oneSidedSides = Math.ceil(file.count / pagesPerSide);
    
    let text = `📄 DOCUMENT DETAILED ANALYSIS
Name: ${file.name}
Type: ${file.type.toUpperCase()}
Total Pages: ${file.count} (${oneSidedSides} 1-Sided)
1-Sided Cost: LKR ${file.singleSidedPrice.toLocaleString()}
2-Sided Cost: LKR ${file.doubleSidedPrice.toLocaleString()} (${file.sheetCount} Sheets)`;

    if (isFolder && file.innerFiles) {
      text += `\n\n📁 Bundle Contents (${file.innerFiles.length} files):`;
      file.innerFiles.forEach((inner) => {
        text += `\n  - [${inner.type.toUpperCase()}] ${inner.name}: ${inner.count} pages`;
      });
    }

    writeToClipboardFallback(text);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllFiles = () => {
    let text = `===========================================
📊 DECODED PRINT MATRIX - AGGREGATED DOSSIER
===========================================\n\n`;

    files.forEach((file, index) => {
      const isFolder = file.type === 'folder';
      const oneSidedSides = Math.ceil(file.count / pagesPerSide);
      
      text += `${index + 1}. [${file.type.toUpperCase()}] ${file.name}
   • Count: ${file.count} pages (${oneSidedSides} 1-sided)
   • 1-Sided Price: LKR ${file.singleSidedPrice.toLocaleString()}
   • 2-Sided Price: LKR ${file.doubleSidedPrice.toLocaleString()} (${file.sheetCount} sheets)`;
      
      if (isFolder && file.innerFiles) {
        text += `\n   • Inner Files:`;
        file.innerFiles.forEach((inner) => {
          text += `\n     - [${inner.type.toUpperCase()}] ${inner.name}: ${inner.count} pages`;
        });
      }
      text += `\n\n`;
    });

    const calculatedTotalSheets = files.reduce((sum, f) => sum + f.sheetCount, 0);

    text += `===========================================
📈 SYSTEM METRICS SUMMARY
===========================================
• Total Units: ${files.length}
• Total Pages: ${totals.totalCount}
• Total 1-Sided Pages: ${totals.totalOneSidedCount} pages
• Total 1-Sided Cost: LKR ${totals.totalSingleSidedPrice.toLocaleString()}
• Total 2-Sided Sheets: ${calculatedTotalSheets} sheets
• Total 2-Sided Cost: LKR ${totals.totalDoubleSidedPrice.toLocaleString()}
===========================================`;

    writeToClipboardFallback(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDragStart = (e: React.DragEvent<HTMLElement>, index: number) => {
    dragItemIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      e.currentTarget.classList.add('opacity-40');
    }, 0);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLElement>, index: number) => {
    if (dragItemIndex.current === index) return;
    dragOverItemIndex.current = index;
    e.currentTarget.classList.add('bg-white/5');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.currentTarget.classList.remove('bg-white/5');
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.currentTarget.classList.remove('bg-white/5');
    if (dragItemIndex.current !== null && dragOverItemIndex.current !== null) {
      onReorderFiles(dragItemIndex.current, dragOverItemIndex.current);
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLElement>) => {
    e.currentTarget.classList.remove('opacity-40');
    dragItemIndex.current = null;
    dragOverItemIndex.current = null;
  };

  if (files.length === 0) {
    return (
       <div className="mt-8 space-y-8">
          <CostCalculator 
            singleSidedCost={singleSidedCost}
            doubleSidedCost={doubleSidedCost}
            onCostChange={onCostChange}
            pagesPerSide={pagesPerSide}
            onPagesPerSideChange={onPagesPerSideChange}
            separateOrientations={separateOrientations}
            onOrientationSeparatorToggle={onOrientationSeparatorToggle}
            unitLabel={unitLabel}
            showOrientationToggle={showOrientationInfo}
          />
       </div>
    )
  }

  const ViewToggleButton: React.FC<{mode: ViewMode, icon: React.ReactNode}> = ({mode, icon}) => (
    <button
      onClick={() => onViewModeChange(mode)}
      className={`p-2.5 rounded-xl transition-all ${viewMode === mode ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
      aria-label={`Switch to ${mode} view`}
    >
      {icon}
    </button>
  );

  return (
    <div className="mt-8 space-y-16">
      <CostCalculator 
        singleSidedCost={singleSidedCost}
        doubleSidedCost={doubleSidedCost}
        onCostChange={onCostChange}
        pagesPerSide={pagesPerSide}
        onPagesPerSideChange={onPagesPerSideChange}
        separateOrientations={separateOrientations}
        onOrientationSeparatorToggle={onOrientationSeparatorToggle}
        unitLabel={unitLabel}
        showOrientationToggle={showOrientationInfo}
      />

      <section className="relative px-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-10 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)] animate-pulse"></div>
            <div>
               <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-1">Intelligence Relay</h2>
               <p className="text-[10px] font-black text-cyan-500/40 uppercase tracking-[0.4em]">Aggregated System Totals</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onDownloadZip}
              disabled={isZipping}
              className="px-8 py-3 bg-cyan-600/10 text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border border-cyan-500/20 hover:bg-cyan-600 hover:text-white transition-all disabled:opacity-30 flex items-center gap-3 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
            >
              {isZipping ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <ZipIcon className="w-4 h-4"/>}
              <span>{isZipping ? 'Encoding...' : 'Export Intel'}</span>
            </button>
            <button
              onClick={handleCopyAllFiles}
              className="px-8 py-3 bg-emerald-600/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
              title="Copy all document processing info to clipboard"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAll ? 'Report Copied' : 'Copy Full Report'}</span>
            </button>
            <button
              onClick={onOpenRenameModal}
              className="px-8 py-3 bg-white/5 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border border-white/10 hover:bg-white/10 transition-all"
            >
              Rename Sequence
            </button>
            <button
              onClick={onClearAll}
              className="px-8 py-3 bg-red-600/5 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border border-red-500/20 hover:bg-red-600 hover:text-white transition-all shadow-[0_0_20px_rgba(220,38,38,0.05)]"
            >
              Purge Database
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <SummaryCard icon={<DocumentIcon className="w-6 h-6 text-white"/>} title="Units Counted" value={files.length} color="bg-blue-600"/>
          <SummaryCard icon={<DocumentIcon className="w-6 h-6 text-white"/>} title={`Total ${unitLabel}s`} value={totals.totalCount} color="bg-cyan-600"/>
          <SummaryCard icon={<SheetIcon className="w-6 h-6 text-white"/>} title="One-Sided Sides" value={totals.totalOneSidedCount} color="bg-cyan-600" highlighted={true}/>
          <SummaryCard icon={<SheetIcon className="w-6 h-6 text-white"/>} title="2-Sided Sheets" value={totals.totalSheets} color="bg-indigo-600" highlighted={true}/>
          <SummaryCard icon={<SheetIcon className="w-6 h-6 text-white"/>} title="2-Sided Total" value={totals.totalDoubleSidedPrice} suffix="LKR" color="bg-purple-600"/>
        </div>

        {showOrientationInfo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
            <SummaryCard icon={<PortraitIcon className="w-6 h-6 text-white"/>} title="Portrait Frequency" value={totals.totalPortraitCount} color="bg-cyan-600/40 border border-cyan-500/30"/>
            <SummaryCard icon={<LandscapeIcon className="w-6 h-6 text-white"/>} title="Landscape Frequency" value={totals.totalLandscapeCount} color="bg-indigo-600/40 border border-indigo-500/30"/>
          </div>
        )}
      </section>

      <section className="relative px-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-10 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)] animate-pulse"></div>
            <div>
               <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-1">Neural Data Feed</h2>
               <p className="text-[10px] font-black text-cyan-500/40 uppercase tracking-[0.4em]">Individual Source Processing</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none py-2 px-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_30px_rgba(34,211,238,0.1)] border-r-4 border-r-cyan-400">
               <p className="text-[11px] font-black text-cyan-300 uppercase tracking-[0.3em] flex items-center gap-3 animate-jarvis-fade whitespace-nowrap justify-end">
                 Processing Latency: <span className="text-white">42ms</span>
                 <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping" />
               </p>
               <p className="text-[7px] font-black text-cyan-600 uppercase tracking-[0.4em] mt-1 text-right">Core Utilization: 14%</p>
            </div>
            
            <div className="bg-cyan-950/40 p-1.5 rounded-2xl border border-white/10 flex gap-2">
              <ViewToggleButton mode="list" icon={<ListViewIcon className="w-5 h-5"/>} />
              <ViewToggleButton mode="card" icon={<CardViewIcon className="w-5 h-5"/>} />
            </div>
          </div>
        </div>
        
        {viewMode === 'list' && (
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            <ul className="divide-y divide-white/5">
              {files.map((file, index) => (
                <li 
                  key={file.id} 
                  className="p-6 group transition-all"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="flex justify-between items-start">
                      <div className="flex items-center gap-5 flex-1 pr-4">
                          <div className="cursor-grab active:cursor-grabbing p-2 bg-white/5 rounded-lg group-hover:bg-cyan-500/20 transition-colors" title="Reorder Record">
                              <DragHandleIcon className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                          </div>
                          <div className="flex-1 flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                file.type === 'pdf' ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30' :
                                file.type === 'docx' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' :
                                file.type === 'pptx' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' :
                                file.type === 'xlsx' ? 'bg-green-600/20 text-green-400 border border-green-500/30' :
                                file.type === 'folder' ? 'bg-amber-600/25 text-amber-400 border border-amber-500/40 font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.1)]' :
                                'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                              }`}>
                                {file.type}
                              </span>
                              {file.type === 'folder' && (
                                expandedFolders[file.id] ? (
                                  <FolderOpen className="w-5 h-5 text-amber-400 shrink-0 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)] animate-pulse" />
                                ) : (
                                  <Folder className="w-5 h-5 text-amber-400 shrink-0 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                                )
                              )}
                              <p className="font-bold text-white text-lg break-all group-hover:text-cyan-300 transition-colors">{file.name}</p>
                          </div>
                      </div>
                      <button
                        onClick={() => handleCopySingleFile(file)}
                        className={`p-3 -mt-2 flex-shrink-0 rounded-xl transition-all mr-1 ${
                          copiedId === file.id ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-500 hover:bg-cyan-500/15 hover:text-cyan-400'
                        }`}
                        title="Copy document details"
                        aria-label={`Copy details of ${file.name}`}
                      >
                        {copiedId === file.id ? (
                          <Check className="w-4 h-4 text-emerald-400 animate-pulse" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => onRemoveFile(file.id)}
                        className="p-3 -mr-2 -mt-2 flex-shrink-0 rounded-xl text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-all"
                        aria-label={`Remove ${file.name}`}
                      >
                        <CloseIcon className="w-5 h-5" />
                      </button>
                  </div>
                  <div className="mt-4 pl-12 flex flex-wrap gap-x-8 gap-y-3">
                      <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">{file.type === 'folder' ? 'Aggregated Pages' : `${unitLabel}s`}</span>
                          <span className="font-bold text-cyan-400">{file.count}</span>
                          <span className="text-slate-600 text-[10px] font-bold">({Math.ceil(file.count / pagesPerSide)} 1-SIDED)</span>
                          {showOrientationInfo && <span className="text-slate-600 text-[10px] font-bold">({file.portraitCount}P / {file.landscapeCount}L)</span>}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">1-Sided</span>
                          <span className="font-bold text-slate-200">LKR {file.singleSidedPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">2-Sided</span>
                          <span className="font-bold text-slate-200">LKR {file.doubleSidedPrice.toLocaleString()}</span>
                          <span className="text-slate-600 text-[10px] font-bold">({file.sheetCount} SHEETS)</span>
                      </div>
                  </div>
                  
                  {/* Stateful nested archive disclosure for directory elements */}
                  {file.type === 'folder' && file.innerFiles && (
                    <div className="mt-5 pl-12">
                      <button 
                        onClick={() => toggleFolder(file.id)}
                        className="flex items-center gap-2 py-1.5 px-3.5 rounded-full border border-cyan-500/20 bg-cyan-950/40 text-cyan-400 font-mono text-[9px] uppercase tracking-widest hover:bg-cyan-500 hover:text-slate-950 hover:border-cyan-400 transition-all active:scale-95 shadow-md font-black"
                      >
                        {expandedFolders[file.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        <span>{expandedFolders[file.id] ? 'Conceal Bundle' : `Disclose Bundle (${file.innerFiles.length} Documents)`}</span>
                      </button>
                      
                      {expandedFolders[file.id] && (
                        <div className="mt-4 pl-4 border-l-2 border-cyan-500/20 space-y-2 font-mono">
                          {file.innerFiles.map((inner, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-xl border border-white/5 bg-slate-950/30 text-xs hover:border-cyan-500/10 transition-colors">
                              <div className="flex items-center gap-3">
                                <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${
                                  inner.type === 'pdf' ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30' :
                                  inner.type === 'docx' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' :
                                  inner.type === 'pptx' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' :
                                  inner.type === 'xlsx' ? 'bg-green-600/20 text-green-400 border border-green-500/30' :
                                  'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                                }`}>
                                  {inner.type}
                                </span>
                                <span className="text-white/95 font-semibold text-[13px]">{inner.name}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-2 sm:mt-0 font-bold">
                                <span className="text-cyan-400 font-black">{inner.count}</span> pages
                                {inner.type === 'pdf' && <span className="opacity-50 ml-2 font-medium">({inner.portraitCount}P / {inner.landscapeCount}L)</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {viewMode === 'card' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {files.map((file, index) => (
              <div
                key={file.id}
                className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 group transition-all border border-white/5 relative hover:scale-[1.05] hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)]"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="absolute top-4 left-4 cursor-grab active:cursor-grabbing p-1 bg-white/5 rounded" title="Reorder">
                  <DragHandleIcon className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </div>
                <button
                  onClick={() => handleCopySingleFile(file)}
                  className={`absolute top-4 right-12 p-2 rounded-xl transition-all ${
                    copiedId === file.id ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-500 hover:bg-cyan-500/15 hover:text-cyan-400'
                  }`}
                  title="Copy document details"
                  aria-label={`Copy details of ${file.name}`}
                >
                  {copiedId === file.id ? (
                    <Check className="w-4 h-4 text-emerald-400 animate-pulse" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => onRemoveFile(file.id)}
                  className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-all"
                  aria-label={`Remove ${file.name}`}
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
                 <div className="pt-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                      file.type === 'pdf' ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30' :
                      file.type === 'docx' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' :
                      file.type === 'pptx' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' :
                      file.type === 'xlsx' ? 'bg-green-600/20 text-green-400 border border-green-500/30' :
                      file.type === 'folder' ? 'bg-amber-600/25 text-amber-400 border border-amber-500/40 font-black shadow-[0_0_8px_rgba(245,158,11,0.15)]' :
                      'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                    }`}>
                      {file.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1 overflow-hidden">
                    {file.type === 'folder' && (
                      expandedFolders[file.id] ? (
                        <FolderOpen className="w-5 h-5 text-amber-400 shrink-0 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)] animate-pulse" />
                      ) : (
                        <Folder className="w-5 h-5 text-amber-400 shrink-0 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                      )
                    )}
                    <p className="font-bold text-white break-words truncate" title={file.name}>
                      {file.name}
                    </p>
                  </div>
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-black uppercase tracking-widest text-[9px]">{file.type === 'folder' ? 'Aggregated Pages' : 'Magnitude'}</span>
                        <span className="font-bold text-cyan-400">{file.count} {file.type === 'folder' ? 'Pgs' : unitLabel+'s'} ({Math.ceil(file.count / pagesPerSide)} 1-up)</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-black uppercase tracking-widest text-[9px]">Total Valuation</span>
                        <span className="font-bold text-white font-mono text-[11px]">LKR {file.doubleSidedPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Nested disclosure inside card */}
                  {file.type === 'folder' && file.innerFiles && (
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <button 
                        onClick={() => toggleFolder(file.id)}
                        className="w-full flex items-center justify-between py-1 px-2 rounded-lg border border-cyan-500/20 bg-cyan-900/10 text-cyan-400 font-mono text-[8px] uppercase tracking-wider hover:bg-cyan-500 hover:text-slate-950 transition-all active:scale-95 shadow-md font-black"
                      >
                        <span className="flex items-center gap-1">
                          {expandedFolders[file.id] ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
                          {expandedFolders[file.id] ? 'Conceal' : 'Disclose'}
                        </span>
                        <span>{file.innerFiles.length} docs</span>
                      </button>
                      
                      {expandedFolders[file.id] && (
                        <div className="mt-3.5 max-h-36 overflow-y-auto pr-1 space-y-1.5 font-mono text-[10px] custom-scrollbar">
                          {file.innerFiles.map((inner, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 rounded bg-slate-950/40 border border-white/5 hover:border-cyan-500/10 transition-colors">
                              <span className="truncate max-w-[130px] text-white/85 font-medium" title={inner.name}>{inner.name}</span>
                              <span className="text-cyan-400 font-bold shrink-0">{inner.count}p</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
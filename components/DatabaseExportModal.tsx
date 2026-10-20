import React, { useState } from 'react';
import { 
  Download, FileText, FileCode, Printer, Image as ImageIcon, 
  Check, Database, Sparkles, ExternalLink, ShieldCheck, Layers 
} from 'lucide-react';
import { DraggableResizableWindow } from './DraggableResizableWindow';
import { KnowledgeGraphData } from '../services/knowledgeGraph';
import { 
  exportKnowledgeGraphAsDocx, 
  exportKnowledgeGraphAsTxt, 
  exportKnowledgeGraphAsPdf, 
  exportKnowledgeGraphAsHtml,
  exportKnowledgeGraphAsImage 
} from '../services/knowledgeGraphExport';

interface DatabaseExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  graphData: KnowledgeGraphData;
  onOpenDriveVault?: () => void;
}

export const DatabaseExportModal: React.FC<DatabaseExportModalProps> = ({
  isOpen,
  onClose,
  graphData,
  onOpenDriveVault
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleExport = (type: 'docx' | 'txt' | 'pdf' | 'html' | 'image') => {
    try {
      if (type === 'docx') {
        exportKnowledgeGraphAsDocx(graphData);
        setDownloadSuccess('Microsoft Word (.docx) dataset export downloaded!');
      } else if (type === 'txt') {
        exportKnowledgeGraphAsTxt(graphData);
        setDownloadSuccess('Plain text audit log (.txt) dataset export downloaded!');
      } else if (type === 'pdf') {
        exportKnowledgeGraphAsPdf(graphData);
        setDownloadSuccess('Print-to-PDF dialogue triggered!');
      } else if (type === 'html') {
        exportKnowledgeGraphAsHtml(graphData);
        setDownloadSuccess('Interactive styled HTML report (.html) downloaded!');
      } else if (type === 'image') {
        exportKnowledgeGraphAsImage(graphData);
        setDownloadSuccess('Knowledge Graph snapshot image (.png/.svg) downloaded!');
      }
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  return (
    <DraggableResizableWindow
      isOpen={isOpen}
      onClose={onClose}
      title="EXPORT CENTRAL DATABASE DATASETS & TOPOLOGY"
      subtitle="Download entire relational knowledge graph as DOCX, TXT, PDF, HTML, or high-res Image"
      icon={<Download className="w-5 h-5 text-cyan-400 animate-pulse" />}
      initialWidth={780}
      initialHeight={620}
    >
      <div className="p-4 sm:p-6 space-y-6">

        {/* STATS OVERVIEW */}
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">DATASET SUMMARY</span>
            <div className="text-white font-bold text-sm mt-0.5">
              {graphData.entities.length} ENTITIES &bull; {graphData.memories.length} MEMORIES &bull; AES-256
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
              100% COMPLETE EXPORT
            </span>
          </div>
        </div>

        {downloadSuccess && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-xs text-emerald-300 font-mono flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* DOWNLOAD OPTIONS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* 1. DOCX Option */}
          <div className="p-4 bg-slate-900/90 border border-cyan-500/30 rounded-2xl flex flex-col justify-between space-y-3 hover:border-cyan-400/80 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-400">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <span className="font-black text-xs text-white uppercase tracking-wider">DOCX (MICROSOFT WORD)</span>
                </div>
                <span className="text-[9px] bg-slate-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/20">.DOCX</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans mt-2">
                Structured Word document with formatted tables, entity registries, timeline events, and memory breakdowns.
              </p>
            </div>
            <button
              onClick={() => handleExport('docx')}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all hover:scale-102"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD AS DOCX</span>
            </button>
          </div>

          {/* 2. TXT Option */}
          <div className="p-4 bg-slate-900/90 border border-cyan-500/30 rounded-2xl flex flex-col justify-between space-y-3 hover:border-cyan-400/80 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <FileCode className="w-5 h-5 text-emerald-400" />
                  <span className="font-black text-xs text-white uppercase tracking-wider">PLAIN TEXT AUDIT (.TXT)</span>
                </div>
                <span className="text-[9px] bg-slate-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">.TXT</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans mt-2">
                Pure plain text file for terminal inspection, AI ingestion, or lightweight archival storage.
              </p>
            </div>
            <button
              onClick={() => handleExport('txt')}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:scale-102"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD AS TXT</span>
            </button>
          </div>

          {/* 3. PDF Option */}
          <div className="p-4 bg-slate-900/90 border border-cyan-500/30 rounded-2xl flex flex-col justify-between space-y-3 hover:border-cyan-400/80 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400">
                  <Printer className="w-5 h-5 text-rose-400" />
                  <span className="font-black text-xs text-white uppercase tracking-wider">PRINTABLE PDF (.PDF)</span>
                </div>
                <span className="text-[9px] bg-slate-950 text-rose-300 px-2 py-0.5 rounded border border-rose-500/20">.PDF</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans mt-2">
                Formatted printable view with page-break protection and clean typography ready to save directly as PDF.
              </p>
            </div>
            <button
              onClick={() => handleExport('pdf')}
              className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all hover:scale-102"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT / PRINT TO PDF</span>
            </button>
          </div>

          {/* 4. HTML Option */}
          <div className="p-4 bg-slate-900/90 border border-cyan-500/30 rounded-2xl flex flex-col justify-between space-y-3 hover:border-cyan-400/80 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400">
                  <FileCode className="w-5 h-5 text-amber-400" />
                  <span className="font-black text-xs text-white uppercase tracking-wider">STANDALONE WEB REPORT (.HTML)</span>
                </div>
                <span className="text-[9px] bg-slate-950 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20">.HTML</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans mt-2">
                Self-contained HTML file with dark theme styling, tags, and cards viewable in any browser without internet.
              </p>
            </div>
            <button
              onClick={() => handleExport('html')}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all hover:scale-102"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD AS HTML</span>
            </button>
          </div>

        </div>

        {/* 5. IMAGE EXPORT + GOOGLE DRIVE UPLINK */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-2 border-cyan-500/50 rounded-2xl space-y-4 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/20 rounded-xl border border-cyan-400/50 text-cyan-400">
                <ImageIcon className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  EXPORT KNOWLEDGE GRAPH TOPOLOGY AS IMAGE
                  <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-[9px] text-cyan-300">
                    PNG / SVG
                  </span>
                </h4>
                <p className="text-[11px] text-slate-300 font-sans mt-0.5">
                  Generates a visual diagram of all connected entities, importance scores, and graph links.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleExport('image')}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105 active:scale-95 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT GRAPH IMAGE</span>
            </button>
          </div>

          {/* Drive Uplink recommendation */}
          <div className="pt-3 border-t border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <span className="text-[11px] text-cyan-300/80 font-sans">
              Want to store this image or any video/audio in Google Drive and have Natasha memorize the link?
            </span>

            {onOpenDriveVault && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDriveVault();
                }}
                className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0 transition-all hover:scale-105"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>OPEN GOOGLE DRIVE VAULT</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </DraggableResizableWindow>
  );
};

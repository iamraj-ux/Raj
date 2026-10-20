import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, X, FileText, ArrowLeft } from 'lucide-react';
import { FileUploader } from './FileUploader';
import { ResultsDisplay } from './ResultsDisplay';
import { DocFileData, TotalsData, ViewMode } from '../types';

interface PdfCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: DocFileData[];
  totals: TotalsData;
  isLoading: boolean;
  isZipping: boolean;
  singleSidedCost: number;
  doubleSidedCost: number;
  pagesPerSide: number;
  separateOrientations: boolean;
  viewMode: ViewMode;
  onFilesSelected: (files: FileList | File[], folderMap?: Map<File, string>) => void;
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
  onReorderFiles: (startIndex: number, endIndex: number) => void;
  onCostChange: (cost: number, isSingle: boolean) => void;
  onPagesPerSideChange: (value: number) => void;
  onOrientationSeparatorToggle: (enabled: boolean) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenRenameModal: () => void;
  onDownloadZip: () => void;
}

export const PdfCounterModal: React.FC<PdfCounterModalProps> = ({
  isOpen,
  onClose,
  files,
  totals,
  isLoading,
  isZipping,
  singleSidedCost,
  doubleSidedCost,
  pagesPerSide,
  separateOrientations,
  viewMode,
  onFilesSelected,
  onRemoveFile,
  onClearAll,
  onReorderFiles,
  onCostChange,
  onPagesPerSideChange,
  onOrientationSeparatorToggle,
  onViewModeChange,
  onOpenRenameModal,
  onDownloadZip
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9988] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 md:p-6 select-none font-mono">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-6xl h-[92vh] bg-slate-900 border-2 border-emerald-400/80 rounded-3xl shadow-[0_0_80px_rgba(16,185,129,0.35)] flex flex-col overflow-hidden relative"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/95 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/40">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-black">
                Raj Expo Digitals Server → Tools & Apps → PDF Counter
              </div>
              <h1 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                PDF & Unified Document Page Counter
              </h1>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto jarvis-scrollbar space-y-6">
          <FileUploader
            onFilesSelected={onFilesSelected}
            isLoading={isLoading}
            accept=".pdf,.docx,.pptx,.xlsx,image/*"
            label="Unified Documents"
          />

          <ResultsDisplay
            files={files}
            totals={totals}
            onRemoveFile={onRemoveFile}
            onClearAll={onClearAll}
            onReorderFiles={onReorderFiles}
            singleSidedCost={singleSidedCost}
            doubleSidedCost={doubleSidedCost}
            onCostChange={onCostChange}
            pagesPerSide={pagesPerSide}
            onPagesPerSideChange={onPagesPerSideChange}
            onOpenRenameModal={onOpenRenameModal}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            separateOrientations={separateOrientations}
            onOrientationSeparatorToggle={onOrientationSeparatorToggle}
            isZipping={isZipping}
            onDownloadZip={onDownloadZip}
            unitLabel="Units"
            showOrientationInfo={files.some(f => f.type === 'pdf')}
          />
        </div>
      </motion.div>
    </div>
  );
};

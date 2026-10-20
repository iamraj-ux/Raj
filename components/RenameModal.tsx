import React, { useState, useMemo } from 'react';
import { type DocFileData } from '../types';
import { Edit3 } from 'lucide-react';
import { DraggableResizableWindow } from './DraggableResizableWindow';

interface RenameModalProps {
  files: DocFileData[];
  onClose: () => void;
  onRename: (prefix: string, suffix: string) => void;
}

const getNewName = (originalName: string, prefix: string, suffix: string): string => {
  const lastDotIndex = originalName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return `${prefix}${originalName}${suffix}`;
  }
  const baseName = originalName.substring(0, lastDotIndex);
  const extension = originalName.substring(lastDotIndex);
  return `${prefix}${baseName}${suffix}${extension}`;
};

export const RenameModal: React.FC<RenameModalProps> = ({ files, onClose, onRename }) => {
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');

  const previewFiles = useMemo(() => files.slice(0, 4), [files]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRename(prefix, suffix);
  };

  return (
    <DraggableResizableWindow
      isOpen={true}
      onClose={onClose}
      title="BATCH RENAME FILES"
      subtitle="Add prefixes and suffixes to active document batch"
      icon={<Edit3 className="w-4 h-4 text-cyan-400" />}
      initialWidth={560}
      initialHeight={480}
    >
      <form onSubmit={handleSubmit} className="p-5 flex flex-col justify-between h-full space-y-5">
        <div className="space-y-4">
          <div>
            <label htmlFor="prefix-input" className="block text-xs font-bold uppercase text-cyan-400 mb-1.5 font-mono">
              Add Prefix
            </label>
            <input
              id="prefix-input"
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g., 'invoice_'"
              className="w-full bg-slate-900 border border-cyan-500/30 text-white rounded-xl py-2.5 px-3 font-mono text-xs focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label htmlFor="suffix-input" className="block text-xs font-bold uppercase text-cyan-400 mb-1.5 font-mono">
              Add Suffix
            </label>
            <input
              id="suffix-input"
              type="text"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              placeholder="e.g., '_final'"
              className="w-full bg-slate-900 border border-cyan-500/30 text-white rounded-xl py-2.5 px-3 font-mono text-xs focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {(prefix || suffix) && previewFiles.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase text-cyan-400 mb-2 font-mono">Rename Preview:</h3>
              <div className="bg-slate-900/90 border border-cyan-500/20 p-3 rounded-xl space-y-2 text-xs font-mono">
                {previewFiles.map(file => (
                  <div key={file.id} className="grid grid-cols-2 gap-2 items-center">
                    <p className="text-slate-400 truncate" title={file.name}>{file.name}</p>
                    <p className="text-emerald-400 font-mono truncate" title={getNewName(file.name, prefix, suffix)}>
                      &rarr; {getNewName(file.name, prefix, suffix)}
                    </p>
                  </div>
                ))}
                {files.length > 4 && <p className="text-slate-500 text-[10px] text-center pt-1">... and {files.length - 4} more files</p>}
              </div>
            </div>
          )}
        </div>
        
        <div className="pt-4 border-t border-cyan-500/20 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!prefix && !suffix}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-black uppercase rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Rename
          </button>
        </div>
      </form>
    </DraggableResizableWindow>
  );
};

import React, { useState } from 'react';
import { Trash2, RefreshCw, FolderX, ShieldCheck, CheckCircle2, RotateCcw } from 'lucide-react';
import { soundManager } from '../../services/soundEffects';

interface RecycleBinProps {
  onRestoreAll?: () => void;
}

export const Windows10RecycleBin: React.FC<RecycleBinProps> = ({ onRestoreAll }) => {
  const [items, setItems] = useState<Array<{ name: string; originalLocation: string; dateDeleted: string; size: string }>>([
    { name: 'old_build_logs_2026.bak', originalLocation: 'C:\\Raj Expo Digitals\\Logs', dateDeleted: '11/03/2026 11:20 PM', size: '2.4 MB' },
    { name: 'temp_pdf_cache_preview.tmp', originalLocation: 'C:\\Users\\Jonathan\\AppData\\Temp', dateDeleted: '11/04/2026 08:15 AM', size: '480 KB' },
    { name: 'archived_tokens_snapshot.json', originalLocation: 'C:\\Raj Expo Digitals\\Backups', dateDeleted: '11/04/2026 09:05 AM', size: '64 KB' }
  ]);

  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const handleEmptyBin = () => {
    if (items.length === 0) return;
    soundManager.playLockSound();
    setItems([]);
    setSelectedItem(null);
  };

  const handleRestoreItem = (name: string) => {
    soundManager.playWelcomeSound();
    setItems(prev => prev.filter(item => item.name !== name));
    setSelectedItem(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#191919] text-slate-100 font-sans select-none">
      {/* 1. RIBBON TOOLBAR */}
      <div className="h-8 bg-[#252526] border-b border-[#333333] flex items-center px-3 text-[11px] text-slate-300 gap-3">
        <button
          onClick={handleEmptyBin}
          disabled={items.length === 0}
          className="px-2 py-1 bg-[#2d2d2d] hover:bg-[#383838] disabled:opacity-40 text-slate-200 rounded flex items-center gap-1.5 transition cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Empty Recycle Bin</span>
        </button>

        <button
          onClick={() => {
            soundManager.playWelcomeSound();
            setItems([]);
            if (onRestoreAll) onRestoreAll();
          }}
          disabled={items.length === 0}
          className="px-2 py-1 bg-[#2d2d2d] hover:bg-[#383838] disabled:opacity-40 text-slate-200 rounded flex items-center gap-1.5 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Restore all items</span>
        </button>
      </div>

      {/* 2. ADDRESS BREADCRUMB */}
      <div className="h-8 bg-[#202020] border-b border-[#333333] flex items-center px-3 text-xs text-slate-300">
        <span className="font-semibold text-slate-100">Recycle Bin</span>
        <span className="mx-2 text-slate-500">/</span>
        <span className="text-slate-400 font-mono text-[11px]">{items.length} deleted items</span>
      </div>

      {/* 3. ITEMS LIST */}
      <div className="flex-1 overflow-y-auto p-3 jarvis-scrollbar">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-2 py-12">
            <Trash2 className="w-12 h-12 text-slate-600 stroke-[1.5]" />
            <p className="text-sm font-medium text-slate-300">This folder is empty.</p>
            <p className="text-xs text-slate-500">No deleted files in Raj Expo Digitals Recycle Bin.</p>
          </div>
        ) : (
          <div className="w-full">
            {/* Headers */}
            <div className="grid grid-cols-12 gap-2 pb-2 text-slate-400 text-[11px] font-semibold border-b border-[#333333] px-2">
              <span className="col-span-5">Name</span>
              <span className="col-span-4">Original Location</span>
              <span className="col-span-2">Date deleted</span>
              <span className="col-span-1 text-right">Size</span>
            </div>

            {/* Rows */}
            {items.map((item, idx) => {
              const isSelected = selectedItem === item.name;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    soundManager.playClickSound();
                    setSelectedItem(item.name);
                  }}
                  onDoubleClick={() => handleRestoreItem(item.name)}
                  className={`grid grid-cols-12 gap-2 py-2 px-2 items-center cursor-pointer rounded transition-colors ${
                    isSelected ? 'bg-[#0078d7]/30 border border-[#0078d7]/60 text-white' : 'hover:bg-white/5 text-slate-200'
                  }`}
                  title="Double-click to restore this file"
                >
                  <div className="col-span-5 flex items-center gap-2 truncate">
                    <Trash2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate font-medium text-xs">{item.name}</span>
                  </div>
                  <div className="col-span-4 text-slate-400 text-[11px] truncate font-mono">{item.originalLocation}</div>
                  <div className="col-span-2 text-slate-400 text-[11px] truncate">{item.dateDeleted}</div>
                  <div className="col-span-1 text-slate-400 text-[11px] text-right font-mono truncate">{item.size}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. STATUS BAR */}
      <div className="h-6 bg-[#202020] border-t border-[#333333] flex items-center justify-between px-3 text-[11px] text-slate-400 select-none">
        <div>{items.length} items</div>
        <div className="flex items-center gap-3">
          {selectedItem && <span>1 item selected</span>}
          <span>Windows 10 Recycle Bin</span>
        </div>
      </div>
    </div>
  );
};

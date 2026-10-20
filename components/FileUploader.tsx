import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon, SpinnerIcon } from './Icons';

const userProfileBg = "/src/assets/images/user_profile_bg_1781777002244.jpg";

interface FileUploaderProps {
  onFilesSelected: (files: FileList | File[], folderNameMap?: Map<File, string>) => void;
  isLoading: boolean;
  accept: string;
  label: string;
}

// Helper to recursively traverse a directory entry and retrieve all files
const traverseDirectoryEntry = async (dirEntry: any): Promise<File[]> => {
  const files: File[] = [];
  const readAllEntries = async (entry: any) => {
    const reader = entry.createReader();
    const readBatch = (): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        reader.readEntries(resolve, reject);
      });
    };

    try {
      let entries = await readBatch();
      while (entries.length > 0) {
        for (const ent of entries) {
          if (ent.isFile) {
            const file = await new Promise<File>((resolve, reject) => {
              ent.file(resolve, reject);
            });
            files.push(file);
          } else if (ent.isDirectory) {
            await readAllEntries(ent);
          }
        }
        entries = await readBatch();
      }
    } catch (err) {
      console.error("Directory reading error:", err);
    }
  };

  await readAllEntries(dirEntry);
  return files;
};

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected, isLoading, accept, label }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      const allFiles: File[] = [];
      const folderNameMap = new Map<File, string>();

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const entry = (item as any).webkitGetAsEntry?.();
          if (entry) {
            if (entry.isDirectory) {
              const folderFiles = await traverseDirectoryEntry(entry);
              for (const file of folderFiles) {
                allFiles.push(file);
                folderNameMap.set(file, entry.name);
              }
            } else {
              const file = item.getAsFile();
              if (file) {
                allFiles.push(file);
              }
            }
          } else {
            const file = item.getAsFile();
            if (file) {
              allFiles.push(file);
            }
          }
        }
      }

      if (allFiles.length > 0) {
        onFilesSelected(allFiles, folderNameMap);
      }
      e.dataTransfer.clearData();
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  }, [onFilesSelected]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files) as File[];
      const folderNameMap = new Map<File, string>();

      for (const file of filesArray) {
        const relativePath = (file as any).webkitRelativePath;
        if (relativePath) {
          const folderName = relativePath.split('/')[0];
          if (folderName) {
            folderNameMap.set(file, folderName);
          }
        }
      }

      onFilesSelected(filesArray, folderNameMap);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const dropzoneClasses = `
    relative flex flex-col items-center justify-center w-full p-16 
    border-2 border-dashed rounded-[2.5rem] transition-all duration-700 ease-out backdrop-blur-3xl jarvis-corner-box
    ${isDragging 
      ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01] shadow-[0_0_60px_rgba(34,211,238,0.1)]' 
      : 'border-white/5 hover:border-cyan-500/30 bg-slate-900/20 shadow-2xl'}
  `;

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={dropzoneClasses}
    >
      {/* Background Image Overlay */}
      <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none z-0">
        <img 
          src={userProfileBg} 
          alt="User Profile Background" 
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 animate-bg-blink"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/60 mix-blend-multiply" />
      </div>

      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-scanline pointer-events-none z-10" />
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={handleInputChange}
        disabled={isLoading}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore: directory is non-standard but supported wide
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
        onChange={handleFolderInputChange}
        disabled={isLoading}
      />
      
      <div className="relative z-10 w-full flex flex-col items-center justify-center">
        {isLoading ? (
          <div className="text-center relative py-10 px-4">
            <div className="relative inline-block mb-10">
              <SpinnerIcon className="w-24 h-24 mx-auto text-cyan-400 animate-spin" />
              <div className="absolute inset-0 animate-ping bg-cyan-500/10 rounded-full" />
              <div className="absolute inset-[-10px] border border-cyan-500/20 rounded-full animate-spin-reverse border-dashed" />
            </div>
            <p className="text-4xl font-black text-white tracking-[0.2em] uppercase animate-jarvis-blink mb-2">Natasha: Decrypting</p>
            <p className="text-cyan-500/40 font-mono text-xs uppercase tracking-[0.4em]">Establishing Secure Neural Uplink...</p>
            
            <div className="absolute top-8 right-8 bg-cyan-500/10 border border-cyan-500/40 px-6 py-4 rounded-2xl backdrop-blur-2xl shadow-[0_0_50px_rgba(34,211,238,0.2)] border-r-4 border-r-cyan-400">
              <p className="text-[12px] font-black text-cyan-300 uppercase tracking-[0.5em] flex items-center gap-4 justify-end">
                Neural Uplink Speed
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
              </p>
              <p className="text-3xl font-black text-white tracking-tighter mt-1 text-right">
                1.2 <span className="text-cyan-500 text-lg uppercase font-mono">GB/s</span>
              </p>
              <p className="text-[9px] font-black text-cyan-600 uppercase tracking-[0.2em] mt-2 text-right">Tunnel Status: Ultra-Secure // Stable</p>
            </div>
          </div>
        ) : (
          <div className="text-center group">
            <div className="bg-slate-800/35 p-8 rounded-full inline-block mb-8 border border-white/5 group-hover:bg-cyan-600/15 group-hover:border-cyan-500/30 transition-all duration-700 shadow-inner">
              <UploadIcon className="w-16 h-16 text-slate-400 group-hover:text-cyan-400 group-hover:scale-110 transition-transform duration-700 drop-shadow-[0_0_10px_rgba(34,211,238,0.2)]" />
            </div>
            <p className="text-3xl font-black text-white tracking-tighter mb-2">
              INITIALIZE <span className="text-cyan-500 uppercase">{label}</span> UPLINK
            </p>
            <p className="text-cyan-500/40 font-mono text-xs uppercase tracking-[0.4em] mb-10">Neural Pulse Transmission Required</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-lg mx-auto">
              <button
                type="button"
                onClick={handleBrowseClick}
                className="px-10 py-4 bg-cyan-600 text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:bg-cyan-400 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-1 focus:ring-cyan-500/50 animate-jarvis-fade w-full sm:w-1/2"
                disabled={isLoading}
              >
                Access Data Stream
              </button>
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="px-10 py-4 bg-slate-950 border border-cyan-500/30 text-cyan-400 font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-cyan-500/10 hover:border-cyan-400 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-1 focus:ring-cyan-500/50 animate-jarvis-fade w-full sm:w-1/2 flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                📂 Import Folder Stacks
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
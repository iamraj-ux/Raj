import React, { useState, useEffect, useRef } from 'react';
import { soundManager } from '../../services/soundEffects';

export const Windows10Notepad: React.FC = () => {
  const [content, setContent] = useState<string>(() => {
    try {
      return localStorage.getItem('win10_notepad_doc') || 
`RAJ EXPO DIGITALS SERVER - System Notepad
Version: Windows 10 Server Edition
Host: raj-expo-server (Sri Lanka)
Virtual Intelligence: Natasha v5.6

Ready for developer notes, prompts, or configuration streams.
Files are preserved in session buffers.`;
    } catch {
      return '';
    }
  });

  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [wordWrap, setWordWrap] = useState<boolean>(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-save
  useEffect(() => {
    try {
      localStorage.setItem('win10_notepad_doc', content);
    } catch {}
  }, [content]);

  // Track line & column
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    updateCursorPos(e.target);
  };

  const updateCursorPos = (target: HTMLTextAreaElement) => {
    const textBeforeCursor = target.value.substring(0, target.selectionStart);
    const lines = textBeforeCursor.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1
    });
  };

  const handleDownload = () => {
    soundManager.playClickSound();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Raj_Expo_Note_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setActiveMenu(null);
  };

  const handleNew = () => {
    soundManager.playClickSound();
    if (content.trim() && !window.confirm('Do you want to clear current note buffer?')) return;
    setContent('');
    setActiveMenu(null);
  };

  const handleInsertTimeDate = () => {
    soundManager.playClickSound();
    const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' });
    setContent(prev => prev + `\n[${now}] `);
    setActiveMenu(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-slate-100 font-sans select-none" onClick={() => setActiveMenu(null)}>
      {/* 1. NOTEPAD CLASSIC MENU BAR */}
      <div className="h-6 bg-[#252526] border-b border-[#333333] flex items-center px-1 text-[11px] text-slate-300 relative z-20">
        {/* File Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === 'file' ? null : 'file');
            }}
            className={`px-2 py-0.5 hover:bg-[#333333] hover:text-white transition cursor-pointer ${
              activeMenu === 'file' ? 'bg-[#333333] text-white' : ''
            }`}
          >
            File
          </button>
          {activeMenu === 'file' && (
            <div className="absolute top-6 left-0 w-44 bg-[#2b2b2b] border border-[#444444] shadow-2xl py-1 text-xs text-slate-200">
              <button onClick={handleNew} className="w-full text-left px-4 py-1 hover:bg-[#0078d7] hover:text-white flex justify-between">
                <span>New</span>
                <span className="text-slate-400 text-[10px]">Ctrl+N</span>
              </button>
              <button onClick={handleDownload} className="w-full text-left px-4 py-1 hover:bg-[#0078d7] hover:text-white flex justify-between">
                <span>Save As...</span>
                <span className="text-slate-400 text-[10px]">Ctrl+S</span>
              </button>
              <div className="h-[1px] bg-[#444444] my-1" />
              <button onClick={handleDownload} className="w-full text-left px-4 py-1 hover:bg-[#0078d7] hover:text-white">
                Download .txt
              </button>
            </div>
          )}
        </div>

        {/* Edit Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === 'edit' ? null : 'edit');
            }}
            className={`px-2 py-0.5 hover:bg-[#333333] hover:text-white transition cursor-pointer ${
              activeMenu === 'edit' ? 'bg-[#333333] text-white' : ''
            }`}
          >
            Edit
          </button>
          {activeMenu === 'edit' && (
            <div className="absolute top-6 left-0 w-44 bg-[#2b2b2b] border border-[#444444] shadow-2xl py-1 text-xs text-slate-200">
              <button onClick={handleInsertTimeDate} className="w-full text-left px-4 py-1 hover:bg-[#0078d7] hover:text-white flex justify-between">
                <span>Time/Date</span>
                <span className="text-slate-400 text-[10px]">F5</span>
              </button>
              <button onClick={() => { setContent(''); setActiveMenu(null); }} className="w-full text-left px-4 py-1 hover:bg-[#0078d7] hover:text-white">
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Format Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === 'format' ? null : 'format');
            }}
            className={`px-2 py-0.5 hover:bg-[#333333] hover:text-white transition cursor-pointer ${
              activeMenu === 'format' ? 'bg-[#333333] text-white' : ''
            }`}
          >
            Format
          </button>
          {activeMenu === 'format' && (
            <div className="absolute top-6 left-0 w-40 bg-[#2b2b2b] border border-[#444444] shadow-2xl py-1 text-xs text-slate-200">
              <button 
                onClick={() => { setWordWrap(!wordWrap); setActiveMenu(null); }} 
                className="w-full text-left px-4 py-1 hover:bg-[#0078d7] hover:text-white flex items-center justify-between"
              >
                <span>Word Wrap</span>
                {wordWrap && <span className="text-cyan-400">✓</span>}
              </button>
            </div>
          )}
        </div>

        {/* Help Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === 'help' ? null : 'help');
            }}
            className={`px-2 py-0.5 hover:bg-[#333333] hover:text-white transition cursor-pointer ${
              activeMenu === 'help' ? 'bg-[#333333] text-white' : ''
            }`}
          >
            Help
          </button>
          {activeMenu === 'help' && (
            <div className="absolute top-6 left-0 w-48 bg-[#2b2b2b] border border-[#444444] shadow-2xl py-1 text-xs text-slate-200">
              <div className="px-4 py-1 font-semibold text-white">About Notepad</div>
              <div className="px-4 py-1 text-[10px] text-slate-400">
                Windows 10 Server Notepad<br />
                Raj Expo Digitals Edition
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. MAIN TEXTAREA */}
      <div className="flex-1 relative bg-[#1e1e1e] p-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onKeyUp={(e) => updateCursorPos(e.currentTarget)}
          onClick={(e) => updateCursorPos(e.currentTarget)}
          wrap={wordWrap ? 'soft' : 'off'}
          spellCheck={false}
          className="w-full h-full bg-transparent text-slate-100 font-mono text-sm leading-relaxed p-1 resize-none focus:outline-none border-none selection:bg-[#0078d7] selection:text-white jarvis-scrollbar"
          placeholder="Start typing notes..."
        />
      </div>

      {/* 3. WINDOWS 10 NOTEPAD STATUS BAR */}
      <div className="h-6 bg-[#252526] border-t border-[#333333] flex items-center justify-end px-4 text-[11px] text-slate-400 gap-6 select-none">
        <div>Ln {cursorPos.line}, Col {cursorPos.col}</div>
        <div>100%</div>
        <div>Windows (CRLF)</div>
        <div>UTF-8</div>
      </div>
    </div>
  );
};

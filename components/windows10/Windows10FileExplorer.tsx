import React, { useState } from 'react';
import { 
  Folder, FileText, HardDrive, Database, Users, UploadCloud, 
  Settings, ChevronRight, ArrowLeft, ArrowRight, ArrowUp, RefreshCw, 
  Search, Shield, Monitor, FileCode, MessageCircle
} from 'lucide-react';
import { soundManager } from '../../services/soundEffects';

interface FileExplorerProps {
  onOpenApp: (appId: string) => void;
}

interface ExplorerItem {
  name: string;
  type: 'folder' | 'file';
  size?: string;
  dateModified: string;
  appId?: string;
  iconType: 'folder' | 'database' | 'people' | 'pdf' | 'prompt' | 'whatsapp' | 'cloudinary' | 'settings' | 'text';
}

export const Windows10FileExplorer: React.FC<FileExplorerProps> = ({ onOpenApp }) => {
  const [currentPath, setCurrentPath] = useState<string>('This PC > Local Disk (C:) > Raj Expo Digitals');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const explorerItems: ExplorerItem[] = [
    { name: 'Server 12-Subfolders Hub', type: 'folder', dateModified: '11/04/2026 10:15 AM', appId: 'server_hub', iconType: 'folder' },
    { name: 'People & Contacts Database', type: 'folder', dateModified: '11/04/2026 09:30 AM', appId: 'people_db', iconType: 'people' },
    { name: 'PDF Counter & Cost Calculator', type: 'folder', dateModified: '11/04/2026 08:45 AM', appId: 'pdf_counter', iconType: 'pdf' },
    { name: 'Prompt Generator Studio', type: 'folder', dateModified: '11/04/2026 07:20 AM', appId: 'prompt_studio', iconType: 'prompt' },
    { name: 'GitHub Central Database', type: 'folder', dateModified: '11/04/2026 06:10 AM', appId: 'github_sync', iconType: 'database' },
    { name: 'WhatsApp Chat Archives', type: 'folder', dateModified: '11/03/2026 11:55 PM', appId: 'whatsapp_viewer', iconType: 'whatsapp' },
    { name: 'Cloudinary Cloud Storage', type: 'folder', dateModified: '11/03/2026 09:12 PM', appId: 'cloudinary_db', iconType: 'cloudinary' },
    { name: 'All System Activities Log', type: 'folder', dateModified: '11/04/2026 10:24 AM', appId: 'activities_log', iconType: 'folder' },
    { name: 'System & Wallpaper Settings', type: 'folder', dateModified: '11/02/2026 04:00 PM', appId: 'wallpaper_settings', iconType: 'settings' },
    { name: 'raj_expo_server_manifest.json', type: 'file', size: '42 KB', dateModified: '11/04/2026 10:00 AM', iconType: 'text' },
    { name: 'colombo_weather_cache.xml', type: 'file', size: '18 KB', dateModified: '11/04/2026 10:20 AM', iconType: 'text' },
    { name: 'natasha_neural_stream.log', type: 'file', size: '128 KB', dateModified: '11/04/2026 10:24 AM', iconType: 'text' },
  ];

  const filteredItems = explorerItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleItemClick = (name: string) => {
    soundManager.playClickSound();
    setSelectedItem(name);
  };

  const handleItemDoubleClick = (item: ExplorerItem) => {
    soundManager.playAccessGrantedSound();
    if (item.appId) {
      onOpenApp(item.appId);
    } else {
      onOpenApp('notepad');
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'database': return <Database className="w-6 h-6 text-cyan-400" />;
      case 'people': return <Users className="w-6 h-6 text-blue-400" />;
      case 'pdf': return <UploadCloud className="w-6 h-6 text-emerald-400" />;
      case 'prompt': return <FileCode className="w-6 h-6 text-purple-400" />;
      case 'whatsapp': return <MessageCircle className="w-6 h-6 text-green-400" />;
      case 'cloudinary': return <UploadCloud className="w-6 h-6 text-sky-400" />;
      case 'settings': return <Settings className="w-6 h-6 text-pink-400" />;
      case 'text': return <FileText className="w-6 h-6 text-slate-300" />;
      default: return <Folder className="w-6 h-6 text-amber-400 fill-amber-400/20" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#191919] text-slate-100 font-sans select-none">
      {/* 1. RIBBON TOOLBAR */}
      <div className="h-7 bg-[#252526] border-b border-[#333333] flex items-center px-2 text-[11px] text-slate-300 gap-4">
        <button className="text-white border-b-2 border-[#0078d7] pb-1 px-1 font-semibold">Home</button>
        <button className="hover:text-white px-1">Share</button>
        <button className="hover:text-white px-1">View</button>
      </div>

      {/* 2. NAVIGATION & ADDRESS BAR */}
      <div className="h-9 bg-[#202020] border-b border-[#333333] flex items-center px-2 gap-2 text-xs">
        {/* Nav arrows */}
        <div className="flex items-center text-slate-400 gap-1">
          <button className="p-1 hover:text-white hover:bg-white/10 rounded cursor-pointer"><ArrowLeft className="w-3.5 h-3.5" /></button>
          <button className="p-1 hover:text-white hover:bg-white/10 rounded cursor-pointer"><ArrowRight className="w-3.5 h-3.5" /></button>
          <button className="p-1 hover:text-white hover:bg-white/10 rounded cursor-pointer"><ArrowUp className="w-3.5 h-3.5" /></button>
        </div>

        {/* Address Breadcrumb */}
        <div className="flex-1 h-6 bg-[#181818] border border-[#3b3b3b] rounded px-2.5 flex items-center text-slate-300 text-[11px] truncate shadow-inner">
          <HardDrive className="w-3 h-3 text-[#0078d7] mr-1.5 shrink-0" />
          <span className="truncate">{currentPath}</span>
        </div>

        <button onClick={() => soundManager.playClickSound()} className="p-1 text-slate-400 hover:text-white cursor-pointer" title="Refresh">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Search Box */}
        <div className="w-52 h-6 bg-[#181818] border border-[#3b3b3b] rounded px-2 flex items-center shadow-inner">
          <Search className="w-3 h-3 text-slate-400 mr-1.5 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Raj Expo Digitals"
            className="w-full bg-transparent text-slate-100 text-[11px] placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 3. MAIN EXPLORER SPLIT VIEW (Sidebar + Content Grid) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tree Sidebar */}
        <div className="w-52 bg-[#1b1b1b] border-r border-[#333333] overflow-y-auto p-2 text-xs text-slate-300 space-y-1 jarvis-scrollbar shrink-0">
          <div className="font-semibold text-slate-400 text-[11px] px-2 py-1 uppercase tracking-wider">Quick access</div>
          <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 cursor-pointer">
            <Monitor className="w-3.5 h-3.5 text-blue-400" />
            <span>Desktop</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 cursor-pointer">
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span>Downloads</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 cursor-pointer">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Documents</span>
          </div>

          <div className="font-semibold text-slate-400 text-[11px] px-2 py-1 uppercase tracking-wider pt-3">This PC</div>
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#0078d7]/20 border border-[#0078d7]/40 text-white cursor-pointer">
            <HardDrive className="w-3.5 h-3.5 text-[#0078d7]" />
            <span className="truncate">Local Disk (C:)</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 cursor-pointer">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate">Data Drive (D:)</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 cursor-pointer">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate">GitHub Repos (E:)</span>
          </div>
        </div>

        {/* Right Content Table / Grid */}
        <div className="flex-1 bg-[#191919] overflow-auto p-3 jarvis-scrollbar">
          <div className="grid grid-cols-1 divide-y divide-[#2a2a2a] text-xs">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 pb-2 text-slate-400 text-[11px] font-semibold border-b border-[#333333] px-2">
              <span className="col-span-6">Name</span>
              <span className="col-span-4">Date modified</span>
              <span className="col-span-2 text-right">Size</span>
            </div>

            {/* Rows */}
            {filteredItems.map((item, idx) => {
              const isSelected = selectedItem === item.name;
              return (
                <div
                  key={idx}
                  onClick={() => handleItemClick(item.name)}
                  onDoubleClick={() => handleItemDoubleClick(item)}
                  className={`grid grid-cols-12 gap-2 py-2 px-2 items-center cursor-pointer rounded transition-colors ${
                    isSelected ? 'bg-[#0078d7]/30 border border-[#0078d7]/60 text-white' : 'hover:bg-white/5 text-slate-200'
                  }`}
                  title={item.appId ? "Double-click to open application window" : ""}
                >
                  <div className="col-span-6 flex items-center gap-2.5 truncate">
                    <div className="shrink-0">{renderIcon(item.iconType)}</div>
                    <span className="truncate font-medium">{item.name}</span>
                  </div>
                  <div className="col-span-4 text-slate-400 text-[11px] truncate">{item.dateModified}</div>
                  <div className="col-span-2 text-slate-400 text-[11px] text-right font-mono truncate">{item.size || '--'}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. EXPLORER STATUS BAR */}
      <div className="h-6 bg-[#202020] border-t border-[#333333] flex items-center justify-between px-3 text-[11px] text-slate-400 select-none">
        <div>{filteredItems.length} items</div>
        <div className="flex items-center gap-3">
          {selectedItem && <span>1 item selected</span>}
          <span>Windows 10 NTFS</span>
        </div>
      </div>
    </div>
  );
};

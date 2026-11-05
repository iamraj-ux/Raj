import React, { useState } from 'react';
import { 
  Laptop, Smartphone, Wifi, Palette, LayoutGrid, User, 
  Clock, Gamepad2, Eye, Search, Lock, RefreshCw, HardDrive, 
  ArrowLeft, Check, Sun, Moon
} from 'lucide-react';
import { soundManager } from '../../services/soundEffects';

interface SettingsProps {
  currentWallpaper: string;
  onSelectWallpaper: (id: string) => void;
  onOpenApp?: (appId: string) => void;
}

export const Windows10Settings: React.FC<SettingsProps> = ({
  currentWallpaper,
  onSelectWallpaper,
  onOpenApp
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'system', name: 'System', desc: 'Display, sound, notifications, power', icon: Laptop },
    { id: 'devices', name: 'Devices', desc: 'Bluetooth, printers, mouse', icon: HardDrive },
    { id: 'phone', name: 'Phone', desc: 'Link your Android, iPhone', icon: Smartphone },
    { id: 'network', name: 'Network & Internet', desc: 'Wi-Fi, airplane mode, VPN', icon: Wifi },
    { id: 'personalization', name: 'Personalization', desc: 'Background, lock screen, colors', icon: Palette },
    { id: 'apps', name: 'Apps', desc: 'Uninstall, defaults, optional features', icon: LayoutGrid },
    { id: 'accounts', name: 'Accounts', desc: 'Your accounts, email, sync, work', icon: User },
    { id: 'time', name: 'Time & Language', desc: 'Speech, region, date', icon: Clock },
    { id: 'gaming', name: 'Gaming', desc: 'Xbox Game Bar, captures', icon: Gamepad2 },
    { id: 'ease', name: 'Ease of Access', desc: 'Narrator, magnifier, high contrast', icon: Eye },
    { id: 'search', name: 'Search', desc: 'Find my files, permissions', icon: Search },
    { id: 'privacy', name: 'Privacy', desc: 'Location, camera, microphone', icon: Lock },
    { id: 'update', name: 'Update & Security', desc: 'Windows Update, recovery, backup', icon: RefreshCw },
  ];

  const handleCategoryClick = (id: string) => {
    soundManager.playClickSound();
    setActiveCategory(id);
  };

  return (
    <div className="flex flex-col h-full bg-[#171717] text-white font-sans select-none overflow-y-auto jarvis-scrollbar p-6">
      {/* Back button when inside category */}
      {activeCategory ? (
        <div className="max-w-3xl mx-auto w-full space-y-6">
          <div className="flex items-center gap-3 border-b border-[#333333] pb-4">
            <button
              onClick={() => {
                soundManager.playClickSound();
                setActiveCategory(null);
              }}
              className="p-1.5 hover:bg-white/10 rounded-full transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-slate-200" />
            </button>
            <h2 className="text-xl font-semibold capitalize text-white">
              {activeCategory} Settings
            </h2>
          </div>

          {/* Sub-view: Personalization */}
          {activeCategory === 'personalization' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">Background Wallpaper</h3>
                <p className="text-xs text-slate-400 mb-4">Choose your desktop background picture</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* Option 1: Official Windows 10 Default Wallpaper */}
                  <div
                    onClick={() => {
                      soundManager.playAccessGrantedSound();
                      onSelectWallpaper('windows-10-hero');
                    }}
                    className={`p-2 rounded border cursor-pointer transition ${
                      currentWallpaper === 'windows-10-hero'
                        ? 'border-[#0078d7] bg-[#0078d7]/20 shadow-md ring-2 ring-[#0078d7]'
                        : 'border-[#333333] hover:border-slate-500 bg-[#202020]'
                    }`}
                  >
                    <div className="aspect-video rounded overflow-hidden bg-blue-950 mb-2 relative">
                      <img
                        src="/src/assets/images/windows_10_hero_wallpaper_1793811131850.jpg"
                        alt="Windows 10 Hero"
                        className="w-full h-full object-cover"
                      />
                      {currentWallpaper === 'windows-10-hero' && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#0078d7] flex items-center justify-center shadow">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-white truncate">Windows 10 Hero (Default)</p>
                    <p className="text-[10px] text-slate-400">Authentic Blue Laser Hero</p>
                  </div>

                  {/* Option 2: Raj Expo Digitals Live Wallpaper */}
                  <div
                    onClick={() => {
                      soundManager.playAccessGrantedSound();
                      onSelectWallpaper('raj-expo-digitals-live');
                    }}
                    className={`p-2 rounded border cursor-pointer transition ${
                      currentWallpaper === 'raj-expo-digitals-live'
                        ? 'border-[#0078d7] bg-[#0078d7]/20 shadow-md ring-2 ring-[#0078d7]'
                        : 'border-[#333333] hover:border-slate-500 bg-[#202020]'
                    }`}
                  >
                    <div className="aspect-video rounded overflow-hidden bg-slate-900 mb-2 relative flex items-center justify-center border border-cyan-500/30">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-lg">
                        <span className="text-white font-black text-xs">R</span>
                      </div>
                      {currentWallpaper === 'raj-expo-digitals-live' && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#0078d7] flex items-center justify-center shadow">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-white truncate">Raj Expo Digitals Live</p>
                    <p className="text-[10px] text-slate-400">Pulsing Cyber Ionization</p>
                  </div>
                </div>
              </div>

              {/* Accent Color */}
              <div className="border-t border-[#333333] pt-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">Windows Accent Color</h3>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded bg-[#0078d7] ring-2 ring-white flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div className="w-7 h-7 rounded bg-[#0063b1] cursor-pointer" />
                  <div className="w-7 h-7 rounded bg-[#8764b8] cursor-pointer" />
                  <div className="w-7 h-7 rounded bg-[#038387] cursor-pointer" />
                  <div className="w-7 h-7 rounded bg-[#e81123] cursor-pointer" />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">Active: Windows 10 Default Blue (#0078d7)</p>
              </div>
            </div>
          )}

          {/* Sub-view: System */}
          {activeCategory === 'system' && (
            <div className="space-y-4">
              <div className="p-4 rounded bg-[#202020] border border-[#333333] space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Device Specifications</h4>
                <div className="text-xs space-y-1.5">
                  <div className="flex justify-between border-b border-[#2b2b2b] pb-1">
                    <span className="text-slate-400">Device name:</span>
                    <span className="text-white font-mono">RAJ-EXPO-SERVER-916</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2b2b2b] pb-1">
                    <span className="text-slate-400">Processor:</span>
                    <span className="text-white">Virtual Intel Core i9 @ 3.80GHz</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2b2b2b] pb-1">
                    <span className="text-slate-400">Installed RAM:</span>
                    <span className="text-white">64.0 GB (Encrypted VRAM)</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2b2b2b] pb-1">
                    <span className="text-slate-400">System type:</span>
                    <span className="text-white">64-bit operating system, x64-based processor</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Virtual Intelligence:</span>
                    <span className="text-cyan-400 font-bold">Natasha ASI v5.6 Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-view: Update & Security */}
          {activeCategory === 'update' && (
            <div className="space-y-4">
              <div className="p-4 rounded bg-[#202020] border border-[#333333] flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Windows Update</h4>
                  <p className="text-xs text-emerald-400 mt-0.5">You're up to date. Last checked today at Colombo.</p>
                </div>
                <button
                  onClick={() => {
                    soundManager.playAccessGrantedSound();
                    if (onOpenApp) onOpenApp('github_sync');
                  }}
                  className="px-4 py-2 bg-[#0078d7] hover:bg-[#1a86db] text-white text-xs font-semibold rounded cursor-pointer"
                >
                  Check GitHub Sync
                </button>
              </div>
            </div>
          )}

          {/* Default for others */}
          {activeCategory !== 'personalization' && activeCategory !== 'system' && activeCategory !== 'update' && (
            <div className="p-6 text-center text-slate-400 text-sm">
              This setting is managed by Raj Expo Digitals Mainframe Administrator.
            </div>
          )}
        </div>
      ) : (
        /* HOME VIEW: Windows Settings Home Grid */
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-light text-white mb-4">Windows Settings</h1>
            <div className="max-w-md mx-auto relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find a setting"
                className="w-full h-9 bg-[#202020] border border-[#444444] rounded px-4 pr-10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#0078d7] shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 13 Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className="p-4 rounded bg-[#202020] hover:bg-[#282828] border border-[#333333] hover:border-[#0078d7] cursor-pointer transition flex items-start gap-4 group"
                >
                  <div className="p-2 rounded bg-white/5 text-[#0078d7] group-hover:scale-110 transition-transform shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white group-hover:text-[#0078d7] transition-colors truncate">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mt-0.5">
                      {cat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

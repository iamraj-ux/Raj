import React from 'react';

// Windows 10 Start Button 4-Pane Angled Logo
export const Win10StartLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 88 88" className={className} fill="currentColor">
    <path d="M0,12.402l35.689-4.859v34.331H0V12.402z M0,46.126h35.689v34.331L0,75.598V46.126z M40.758,39.874V6.848L88,0v39.874H40.758z M88,46.126v39.874l-47.242-6.848V46.126H88z" />
  </svg>
);

// Windows 10 This PC Icon
export const Win10ThisPCIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 48 48" className={className}>
    <defs>
      <linearGradient id="screen-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#1e3a8a" />
      </linearGradient>
      <linearGradient id="body-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
    </defs>
    {/* Monitor */}
    <rect x="4" y="6" width="40" height="26" rx="2" fill="url(#body-grad)" stroke="#1e293b" strokeWidth="1" />
    <rect x="6" y="8" width="36" height="22" rx="1" fill="url(#screen-grad)" />
    {/* Windows logo on monitor screen */}
    <path d="M18,15 l5,-0.7 v4.5 h-5 z M18,19.5 h5 v4.5 l-5,-0.7 z M23.5,14.2 l6.5,-1 v5.6 h-6.5 z M30,19.5 v5.6 l-6.5,-1 v-4.6 z" fill="#67e8f9" opacity="0.9" />
    {/* Stand */}
    <rect x="21" y="32" width="6" height="6" fill="#64748b" />
    <path d="M14,38 h20 a2,2 0 0,1 2,2 h-24 a2,2 0 0,1 2,-2 z" fill="#475569" stroke="#334155" strokeWidth="0.5" />
  </svg>
);

// Windows 10 Recycle Bin Icon
export const Win10RecycleBinIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 48 48" className={className}>
    <defs>
      <linearGradient id="bin-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.9" />
      </linearGradient>
    </defs>
    {/* Bin body */}
    <path d="M12,14 L16,42 A2,2 0 0,0 18,44 L30,44 A2,2 0 0,0 32,42 L36,14 Z" fill="url(#bin-grad)" stroke="#1d4ed8" strokeWidth="1.2" />
    {/* Ribs / stripes */}
    <line x1="18" y1="18" x2="20" y2="38" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <line x1="24" y1="18" x2="24" y2="38" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <line x1="30" y1="18" x2="28" y2="38" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    {/* Lid */}
    <ellipse cx="24" cy="14" rx="14" ry="3" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="1.2" />
    <path d="M21,11 h6 a1,1 0 0,1 1,1 v2 h-8 v-2 a1,1 0 0,1 1,-1 z" fill="#3b82f6" />
    {/* Paper crumbles inside */}
    <circle cx="21" cy="20" r="3" fill="#ffffff" opacity="0.85" />
    <circle cx="27" cy="22" r="2.5" fill="#e2e8f0" opacity="0.9" />
  </svg>
);

// Windows 10 File Explorer Icon
export const Win10FileExplorerIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 48 48" className={className}>
    <defs>
      <linearGradient id="folder-front" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#eab308" />
      </linearGradient>
      <linearGradient id="folder-back" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ca8a04" />
        <stop offset="100%" stopColor="#a16207" />
      </linearGradient>
    </defs>
    {/* Back flap */}
    <path d="M6,12 a2,2 0 0,1 2,-2 h11 l4,4 h17 a2,2 0 0,1 2,2 v6 h-36 z" fill="url(#folder-back)" />
    {/* Blue bracket / binder */}
    <rect x="18" y="14" width="12" height="18" rx="2" fill="#0284c7" />
    <rect x="20" y="16" width="8" height="4" fill="#38bdf8" />
    {/* Front flap */}
    <path d="M4,20 h40 l-3,20 a2,2 0 0,1 -2,2 h-30 a2,2 0 0,1 -2,-2 z" fill="url(#folder-front)" stroke="#ca8a04" strokeWidth="0.8" />
  </svg>
);

// Windows 10 Settings Gear Icon
export const Win10SettingsIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 48 48" className={className}>
    <defs>
      <linearGradient id="gear-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="50%" stopColor="#64748b" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
    </defs>
    <path
      d="M24,15 A9,9 0 1,0 24,33 A9,9 0 1,0 24,15 M24,18 A6,6 0 1,1 24,30 A6,6 0 1,1 24,18"
      fill="#ffffff"
    />
    <path
      d="M44,22.2 l-3.7,-0.6 c-0.3,-1.2 -0.8,-2.4 -1.4,-3.5 l2.3,-2.9 c0.6,-0.8 0.5,-1.9 -0.2,-2.6 l-2.8,-2.8 c-0.7,-0.7 -1.8,-0.8 -2.6,-0.2 l-2.9,2.3 c-1.1,-0.6 -2.3,-1.1 -3.5,-1.4 L28.6,6.8 C28.4,5.8 27.5,5 26.5,5 h-4 c-1,0 -1.9,0.8 -2.1,1.8 l-0.6,3.7 c-1.2,0.3 -2.4,0.8 -3.5,1.4 l-2.9,-2.3 c-0.8,-0.6 -1.9,-0.5 -2.6,0.2 l-2.8,2.8 c-0.7,0.7 -0.8,1.8 -0.2,2.6 l2.3,2.9 c-0.6,1.1 -1.1,2.3 -1.4,3.5 L5,22.4 C4,22.6 3.2,23.5 3.2,24.5 v4 c0,1 0.8,1.9 1.8,2.1 l3.7,0.6 c0.3,1.2 0.8,2.4 1.4,3.5 l-2.3,2.9 c-0.6,0.8 -0.5,1.9 0.2,2.6 l2.8,2.8 c0.7,0.7 1.8,0.8 2.6,0.2 l2.9,-2.3 c1.1,0.6 2.3,1.1 3.5,1.4 l0.6,3.7 c0.2,1 1.1,1.8 2.1,1.8 h4 c1,0 1.9,-0.8 2.1,-1.8 l0.6,-3.7 c1.2,-0.3 2.4,-0.8 3.5,-1.4 l2.9,2.3 c0.8,0.6 1.9,0.5 2.6,-0.2 l2.8,-2.8 c0.7,-0.7 0.8,-1.8 0.2,-2.6 l-2.3,-2.9 c0.6,-1.1 1.1,-2.3 1.4,-3.5 l3.7,-0.6 c1,-0.2 1.8,-1.1 1.8,-2.1 v-4 C45.8,23.3 45,22.4 44,22.2 z M24,31 c-3.9,0 -7,-3.1 -7,-7 s3.1,-7 7,-7 s7,3.1 7,7 S27.9,31 24,31 z"
      fill="url(#gear-grad)"
      stroke="#1e293b"
      strokeWidth="0.8"
    />
  </svg>
);

// Windows 10 Calculator Icon
export const Win10CalculatorIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 48 48" className={className}>
    <rect x="8" y="4" width="32" height="40" rx="4" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
    {/* Screen */}
    <rect x="12" y="8" width="24" height="9" rx="2" fill="#082f49" />
    <text x="33" y="15" fill="#38bdf8" fontSize="6" fontFamily="monospace" textAnchor="end" fontWeight="bold">0</text>
    {/* Keypad Grid */}
    <rect x="12" y="20" width="6" height="5" rx="1" fill="#0369a1" />
    <rect x="19" y="20" width="6" height="5" rx="1" fill="#0369a1" />
    <rect x="26" y="20" width="6" height="5" rx="1" fill="#0369a1" />
    <rect x="33" y="20" width="3" height="5" rx="1" fill="#0284c7" />

    <rect x="12" y="26" width="6" height="5" rx="1" fill="#0c4a6e" />
    <rect x="19" y="26" width="6" height="5" rx="1" fill="#0c4a6e" />
    <rect x="26" y="26" width="6" height="5" rx="1" fill="#0c4a6e" />
    <rect x="33" y="26" width="3" height="5" rx="1" fill="#0284c7" />

    <rect x="12" y="32" width="6" height="5" rx="1" fill="#0c4a6e" />
    <rect x="19" y="32" width="6" height="5" rx="1" fill="#0c4a6e" />
    <rect x="26" y="32" width="6" height="5" rx="1" fill="#0c4a6e" />
    <rect x="33" y="32" width="3" height="11" rx="1" fill="#38bdf8" />

    <rect x="12" y="38" width="13" height="5" rx="1" fill="#0c4a6e" />
    <rect x="26" y="38" width="6" height="5" rx="1" fill="#0c4a6e" />
  </svg>
);

// Windows 10 Notepad Icon
export const Win10NotepadIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 48 48" className={className}>
    {/* Back blue cover */}
    <rect x="8" y="6" width="30" height="36" rx="2" fill="#0284c7" />
    {/* White Paper Pages */}
    <rect x="12" y="8" width="28" height="34" rx="1" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
    {/* Ruled lines */}
    <line x1="16" y1="14" x2="36" y2="14" stroke="#93c5fd" strokeWidth="1" />
    <line x1="16" y1="19" x2="36" y2="19" stroke="#93c5fd" strokeWidth="1" />
    <line x1="16" y1="24" x2="36" y2="24" stroke="#93c5fd" strokeWidth="1" />
    <line x1="16" y1="29" x2="36" y2="29" stroke="#93c5fd" strokeWidth="1" />
    <line x1="16" y1="34" x2="30" y2="34" stroke="#93c5fd" strokeWidth="1" />
    {/* Spiral Binding rings */}
    <circle cx="10" cy="11" r="1.5" fill="#475569" />
    <circle cx="10" cy="17" r="1.5" fill="#475569" />
    <circle cx="10" cy="23" r="1.5" fill="#475569" />
    <circle cx="10" cy="29" r="1.5" fill="#475569" />
    <circle cx="10" cy="35" r="1.5" fill="#475569" />
  </svg>
);

// Firebase Console Icon
export const FirebaseConsoleIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 48 48" className={className}>
    <path d="M9.8,36.5 L20.1,8.4 A1.2,1.2 0 0,1 22.4,8.4 L26.2,16.5 Z" fill="#FFA000" />
    <path d="M9.8,36.5 L17.5,21.8 A1.2,1.2 0 0,1 19.6,21.6 L26.2,16.5 Z" fill="#F57C00" />
    <path d="M38.2,36.5 L9.8,36.5 L24,42.5 A2,2 0 0,0 24.8,42.5 Z" fill="#FFCA28" />
    <path d="M38.2,36.5 L26.2,16.5 L24.4,42.3 Z" fill="#FFA000" />
  </svg>
);

// Google Cloud Console Icon
export const GoogleCloudConsoleIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 48 48" className={className}>
    <path d="M37.3,22.2 C36.5,16.8 31.9,12.7 26.2,12.7 C21.8,12.7 18,15.2 16.1,18.9 C15.2,18.6 14.2,18.5 13.2,18.5 C8.7,18.5 5,22.2 5,26.7 C5,31.2 8.7,34.9 13.2,34.9 L36.7,34.9 C40.4,34.9 43.4,31.9 43.4,28.2 C43.4,24.8 40.7,22.5 37.3,22.2 Z" fill="#ffffff" />
    <path d="M36.7,33.5 L13.2,33.5 C9.5,33.5 6.4,30.4 6.4,26.7 C6.4,23.2 9.1,20.3 12.6,19.9 C13.7,19.9 14.8,20.1 15.7,20.6 L17.3,21.5 L18.1,19.8 C19.6,16.4 22.7,14.1 26.2,14.1 C31,14.1 35,17.6 35.8,22.3 L36.1,23.8 L37.6,24.1 C40,24.6 42,26.2 42,28.2 C42,31.1 39.6,33.5 36.7,33.5 Z" fill="#4285F4" />
    <circle cx="21" cy="24" r="3.5" fill="#EA4335" />
    <circle cx="28" cy="22" r="3" fill="#FBBC05" />
    <circle cx="27" cy="28" r="3" fill="#34A853" />
  </svg>
);

// Google Cloud Shell Terminal Icon
export const GoogleCloudShellIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 48 48" className={className}>
    {/* Terminal Black Box */}
    <rect x="5" y="8" width="38" height="32" rx="3" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1.2" />
    <rect x="5" y="8" width="38" height="7" fill="#0f172a" rx="3" />
    {/* 3 control dots */}
    <circle cx="9" cy="11.5" r="1.5" fill="#ef4444" />
    <circle cx="13" cy="11.5" r="1.5" fill="#f59e0b" />
    <circle cx="17" cy="11.5" r="1.5" fill="#10b981" />
    {/* Prompt */}
    <path d="M12,21 L17,25 L12,29" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="20" y1="29" x2="27" y2="29" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

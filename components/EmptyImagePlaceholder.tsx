import React, { useState } from 'react';
import { Image as ImageIcon, User, Sparkles } from 'lucide-react';

interface EmptyImagePlaceholderProps {
  src?: string;
  alt?: string;
  className?: string;
  type?: 'avatar' | 'icon' | 'wallpaper' | 'generic';
  fallbackText?: string;
  forcePlaceholder?: boolean;
}

export const EmptyImagePlaceholder: React.FC<EmptyImagePlaceholderProps> = ({
  src,
  alt = 'Image placeholder',
  className = '',
  type = 'generic',
  fallbackText,
  forcePlaceholder = false
}) => {
  const [hasError, setHasError] = useState(false);

  // If forcePlaceholder is true, or no valid src, or error occurred:
  if (forcePlaceholder || !src || hasError) {
    if (type === 'avatar') {
      return (
        <div 
          className={`flex items-center justify-center bg-gradient-to-tr from-slate-800 to-slate-700 border border-white/20 text-slate-300 relative overflow-hidden group select-none shadow-inner ${className}`}
          title={alt}
        >
          <User className="w-1/2 h-1/2 text-slate-300/80 group-hover:scale-110 transition-transform" />
          <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      );
    }

    if (type === 'wallpaper') {
      return (
        <div 
          className={`w-full h-full bg-gradient-to-b from-sky-400 via-blue-600 to-slate-900 flex items-center justify-center relative overflow-hidden select-none ${className}`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-300/30 via-transparent to-transparent" />
          <div className="text-center p-4 z-10">
            <ImageIcon className="w-10 h-10 text-white/50 mx-auto mb-2 animate-pulse" />
            <span className="text-xs font-mono text-white/70 uppercase tracking-widest block">
              {fallbackText || 'Scenic Ambient Landscape'}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div 
        className={`flex items-center justify-center bg-slate-800/60 border border-slate-700/60 text-slate-400 rounded-xl select-none ${className}`}
        title={alt}
      >
        <ImageIcon className="w-1/3 h-1/3 text-slate-500" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={className}
      referrerPolicy="no-referrer"
    />
  );
};

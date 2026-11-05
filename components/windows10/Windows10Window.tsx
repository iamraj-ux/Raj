import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, useDragControls } from 'framer-motion';

export interface Windows10WindowProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
  isActive: boolean;
  title: string;
  icon?: ReactNode;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  children: ReactNode;
  className?: string;
  zIndex?: number;
}

export const Windows10Window: React.FC<Windows10WindowProps> = ({
  id,
  isOpen,
  onClose,
  onMinimize,
  onFocus,
  isActive,
  title,
  icon,
  initialWidth = 860,
  initialHeight = 600,
  minWidth = 380,
  minHeight = 260,
  children,
  className = '',
  zIndex = 100
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [size, setSize] = useState({
    width: Math.min(initialWidth, typeof window !== 'undefined' ? window.innerWidth * 0.92 : initialWidth),
    height: Math.min(initialHeight, typeof window !== 'undefined' ? window.innerHeight * 0.82 : initialHeight)
  });
  const [position, setPosition] = useState(() => {
    if (typeof window === 'undefined') return { x: 80, y: 50 };
    // Stagger slightly based on random offset or window size
    const maxX = Math.max(20, window.innerWidth - initialWidth - 40);
    const maxY = Math.max(20, window.innerHeight - initialHeight - 80);
    return {
      x: Math.floor(Math.random() * (maxX * 0.4) + 40),
      y: Math.floor(Math.random() * (maxY * 0.3) + 30)
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number; direction: string } | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  // Resize handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragRef.current && !isMaximized) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 100, dragRef.current.posX + dx)),
          y: Math.max(0, Math.min(window.innerHeight - 80, dragRef.current.posY + dy))
        });
        return;
      }

      if (isResizing && resizeRef.current && !isMaximized) {
        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;
        const dir = resizeRef.current.direction;

        let newW = resizeRef.current.startW;
        let newH = resizeRef.current.startH;

        if (dir.includes('e')) newW = Math.max(minWidth, Math.min(window.innerWidth - position.x, resizeRef.current.startW + dx));
        if (dir.includes('s')) newH = Math.max(minHeight, Math.min(window.innerHeight - position.y - 40, resizeRef.current.startH + dy));

        setSize({ width: newW, height: newH });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      dragRef.current = null;
      resizeRef.current = null;
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, isMaximized, minWidth, minHeight, position]);

  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    // Only drag with left mouse button and not on window controls
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('.win10-control-btn')) return;

    onFocus();
    if (isMaximized) return;

    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y
    };
  };

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    if (e.button !== 0 || isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    onFocus();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: size.width,
      startH: size.height,
      direction
    };
  };

  const toggleMaximize = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onFocus();
    setIsMaximized(prev => !prev);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      key={id}
      ref={windowRef}
      onMouseDown={onFocus}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      style={{
        zIndex,
        position: 'fixed',
        left: isMaximized ? 0 : `${position.x}px`,
        top: isMaximized ? 0 : `${position.y}px`,
        width: isMaximized ? '100vw' : `${size.width}px`,
        height: isMaximized ? 'calc(100vh - 40px)' : `${size.height}px`, // Leave 40px for taskbar
        transition: isDragging || isResizing ? 'none' : 'all 0.15s ease-out'
      }}
      className={`select-none flex flex-col font-sans ${
        isMaximized ? 'rounded-none' : 'rounded-none'
      } ${
        isActive 
          ? 'shadow-[0_10px_35px_rgba(0,0,0,0.65),0_0_0_1px_rgba(0,120,215,0.8)]' 
          : 'shadow-[0_6px_25px_rgba(0,0,0,0.45),0_0_0_1px_rgba(80,80,80,0.5)]'
      } bg-[#1f1f1f] text-slate-100 ${className}`}
    >
      {/* 1. AUTHENTIC WINDOWS 10 TITLE BAR (32px tall) */}
      <div
        onMouseDown={handleTitleBarMouseDown}
        onDoubleClick={toggleMaximize}
        className={`h-8 w-full flex items-center justify-between pl-3 pr-0 cursor-default select-none border-b ${
          isActive 
            ? 'bg-[#181818] border-[#333333]' 
            : 'bg-[#2b2b2b] border-[#383838]'
        }`}
      >
        {/* Title & Icon on Left */}
        <div className="flex items-center gap-2.5 truncate max-w-[calc(100%-140px)] pointer-events-none">
          {icon && (
            <div className="w-4 h-4 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <span className={`text-[12px] truncate leading-none ${isActive ? 'text-slate-100 font-medium' : 'text-slate-400'}`}>
            {title}
          </span>
        </div>

        {/* Windows 10 Control Buttons on Right (Minimize, Maximize/Restore, Close) */}
        <div className="flex items-center h-full shrink-0">
          {/* Minimize Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            className="win10-control-btn w-[46px] h-full flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer text-slate-300 hover:text-white"
            title="Minimize"
          >
            <span className="w-2.5 h-[1px] bg-current inline-block" />
          </button>

          {/* Maximize / Restore Button */}
          <button
            onClick={toggleMaximize}
            className="win10-control-btn w-[46px] h-full flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer text-slate-300 hover:text-white"
            title={isMaximized ? "Restore Down" : "Maximize"}
          >
            {isMaximized ? (
              // Restore icon (overlapping squares)
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="2.5" y="0.5" width="7" height="7" />
                <path d="M0.5,2.5 L0.5,9.5 L7.5,9.5 L7.5,7.5" />
              </svg>
            ) : (
              // Maximize icon (single square)
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="0.5" y="0.5" width="9" height="9" />
              </svg>
            )}
          </button>

          {/* Close Button (Classic Windows 10 Red on Hover) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="win10-control-btn w-[46px] h-full flex items-center justify-center hover:bg-[#e81123] active:bg-[#c4101e] transition-colors cursor-pointer text-slate-300 hover:text-white"
            title="Close"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <line x1="0.5" y1="0.5" x2="9.5" y2="9.5" />
              <line x1="9.5" y1="0.5" x2="0.5" y2="9.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. WINDOW BODY CONTENT */}
      <div className="flex-1 overflow-auto bg-[#191919] text-slate-200 relative">
        {children}
      </div>

      {/* 3. WINDOW RESIZE HANDLERS (Edges & Corners) */}
      {!isMaximized && (
        <>
          {/* East edge */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'e')}
            className="absolute top-0 right-0 w-1.5 h-full cursor-ew-resize hover:bg-transparent"
          />
          {/* South edge */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 's')}
            className="absolute bottom-0 left-0 w-full h-1.5 cursor-ns-resize hover:bg-transparent"
          />
          {/* South-East corner */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'se')}
            className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize hover:bg-transparent z-10"
          />
        </>
      )}
    </motion.div>
  );
};

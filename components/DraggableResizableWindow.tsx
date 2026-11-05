import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Minimize2, Maximize2, X, GripHorizontal, ChevronUp, ChevronDown } from 'lucide-react';

interface DraggableResizableWindowProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  headerActions?: ReactNode;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  children: ReactNode;
  className?: string;
  zIndex?: number;
  defaultMaximized?: boolean;
}

export const DraggableResizableWindow: React.FC<DraggableResizableWindowProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  headerActions,
  initialWidth = 720,
  initialHeight = 580,
  minWidth = 340,
  minHeight = 260,
  children,
  className = '',
  zIndex = 9999,
  defaultMaximized = false
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(defaultMaximized);
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  const dragControls = useDragControls();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Resize handler using mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeRef.current) return;
      const dx = e.clientX - resizeRef.current.startX;
      const dy = e.clientY - resizeRef.current.startY;
      const newW = Math.max(minWidth, Math.min(window.innerWidth * 0.96, resizeRef.current.startW + dx));
      const newH = Math.max(minHeight, Math.min(window.innerHeight * 0.94, resizeRef.current.startH + dy));
      setSize({ width: newW, height: newH });
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        resizeRef.current = null;
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, minHeight]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: size.width,
      startH: size.height
    };
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 pointer-events-none flex items-center justify-center p-2 sm:p-4"
      style={{ zIndex }}
    >
      {/* Background scrim / overlay for focus with deep frosted blur */}
      {!isMinimized && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/60 backdrop-blur-md pointer-events-auto transition-opacity" 
        />
      )}

      {/* Main Window with Blurred Glass Backdrop and Spring Transition */}
      <motion.div
        drag={!isMaximized}
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 24 }}
        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
        style={{
          width: isMaximized ? '100vw' : `${size.width}px`,
          height: isMinimized ? 'auto' : isMaximized ? 'calc(100vh - 40px)' : `${size.height}px`,
          maxWidth: isMaximized ? '100vw' : '98vw',
          maxHeight: isMinimized ? 'auto' : isMaximized ? 'calc(100vh - 40px)' : '94vh',
          top: isMaximized ? 0 : undefined,
          left: isMaximized ? 0 : undefined
        }}
        className={`pointer-events-auto bg-[#191919] border border-[#0078d7] shadow-[0_12px_45px_rgba(0,0,0,0.75),0_0_0_1px_rgba(0,120,215,0.8)] flex flex-col relative overflow-hidden font-sans text-xs select-none ${className}`}
      >
        {/* AUTHENTIC WINDOWS 10 TITLE BAR (32px) */}
        <div
          onPointerDown={(e) => !isMaximized && dragControls.start(e)}
          onDoubleClick={() => setIsMaximized(!isMaximized)}
          className={`h-8 px-3 bg-[#181818] border-b border-[#333333] flex items-center justify-between gap-2 shrink-0 ${
            !isMaximized ? 'cursor-default' : ''
          }`}
          title={!isMaximized ? "Drag to move window" : ""}
        >
          {/* Title & Icon */}
          <div className="flex items-center gap-2.5 truncate max-w-[calc(100%-140px)]">
            {icon && (
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div className="truncate">
              <span className="text-[12px] font-medium text-slate-100 truncate">
                {title}
              </span>
              {subtitle && (
                <span className="text-[10px] text-slate-400 truncate ml-2 hidden sm:inline">
                  — {subtitle}
                </span>
              )}
            </div>
          </div>

          {/* Windows 10 Window Control Buttons (Minimize, Maximize, Close) */}
          <div className="flex items-center h-full shrink-0">
            {headerActions}

            {/* Minimize Button */}
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="w-[46px] h-full flex items-center justify-center hover:bg-white/10 active:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Minimize"
            >
              <span className="w-2.5 h-[1px] bg-current inline-block" />
            </button>

            {/* Maximize / Restore Button */}
            <button
              type="button"
              onClick={() => {
                setIsMaximized(!isMaximized);
                if (isMinimized) setIsMinimized(false);
              }}
              className="w-[46px] h-full flex items-center justify-center hover:bg-white/10 active:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isMaximized ? "Restore Down" : "Maximize"}
            >
              {isMaximized ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="2.5" y="0.5" width="7" height="7" />
                  <path d="M0.5,2.5 L0.5,9.5 L7.5,9.5 L7.5,7.5" />
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="0.5" y="0.5" width="9" height="9" />
                </svg>
              )}
            </button>

            {/* Close Button (Classic Windows 10 Red Hover) */}
            <button
              type="button"
              onClick={onClose}
              className="w-[46px] h-full flex items-center justify-center hover:bg-[#e81123] active:bg-[#c4101e] text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
                <line x1="0.5" y1="0.5" x2="9.5" y2="9.5" />
                <line x1="9.5" y1="0.5" x2="0.5" y2="9.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* CONTENT (SCROLLABLE UP AND DOWN) */}
        {!isMinimized && (
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto jarvis-scrollbar flex flex-col relative select-text"
          >
            {children}
          </div>
        )}

        {/* RESIZE HANDLE AT BOTTOM RIGHT */}
        {!isMinimized && !isMaximized && (
          <div
            onMouseDown={handleResizeStart}
            className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-center justify-center group z-50 select-none"
            title="Drag to resize window"
          >
            <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-cyan-400/80 group-hover:border-cyan-300 transition-all" />
          </div>
        )}
      </motion.div>
    </div>
  );
};

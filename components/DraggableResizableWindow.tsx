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
      {/* Background scrim / overlay for focus (clickable to close if minimized or standard) */}
      {!isMinimized && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" 
        />
      )}

      {/* Main Window */}
      <motion.div
        drag={!isMaximized}
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        style={{
          width: isMaximized ? '96vw' : `${size.width}px`,
          height: isMinimized ? 'auto' : isMaximized ? '92vh' : `${size.height}px`,
          maxWidth: isMaximized ? '96vw' : '96vw',
          maxHeight: isMinimized ? 'auto' : isMaximized ? '92vh' : '92vh'
        }}
        className={`pointer-events-auto bg-slate-950/95 border-2 border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.35)] flex flex-col relative overflow-hidden backdrop-blur-2xl font-mono text-xs select-none transition-all duration-150 ${className}`}
      >
        {/* WINDOW HEADER & DRAG BAR */}
        <div
          onPointerDown={(e) => !isMaximized && dragControls.start(e)}
          className={`px-4 py-3 bg-slate-900/90 border-b border-cyan-500/30 flex items-center justify-between gap-3 shrink-0 ${
            !isMaximized ? 'cursor-grab active:cursor-grabbing hover:bg-slate-900' : ''
          }`}
          title={!isMaximized ? "Drag to relocate window" : ""}
        >
          {/* Title & Icon */}
          <div className="flex items-center gap-2.5 truncate">
            {!isMaximized && (
              <GripHorizontal className="w-4 h-4 text-cyan-400/60 shrink-0" />
            )}
            {icon && (
              <div className="p-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-400 shrink-0">
                {icon}
              </div>
            )}
            <div className="truncate">
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[9px] text-cyan-400/70 truncate hidden sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Header Action Tools & Window Controls */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {headerActions}

            {/* Quick Scroll Buttons */}
            {!isMinimized && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-950 px-1 py-0.5 rounded-lg border border-cyan-500/20">
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="p-1 text-cyan-400 hover:text-white rounded hover:bg-cyan-500/20 transition-all cursor-pointer"
                  title="Scroll to Top"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={scrollToBottom}
                  className="p-1 text-cyan-400 hover:text-white rounded hover:bg-cyan-500/20 transition-all cursor-pointer"
                  title="Scroll to Bottom"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Minimize */}
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 rounded-lg bg-slate-900 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition-all cursor-pointer"
              title={isMinimized ? "Restore Window" : "Minimise Window"}
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>

            {/* Maximize */}
            <button
              type="button"
              onClick={() => {
                setIsMaximized(!isMaximized);
                if (isMinimized) setIsMinimized(false);
              }}
              className="p-1.5 rounded-lg bg-slate-900 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition-all cursor-pointer"
              title={isMaximized ? "Restore Size" : "Maximise Window"}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
              title="Close Window"
            >
              <X className="w-3.5 h-3.5" />
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

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck } from 'lucide-react';

interface ChangeNotification {
  id: string;
  databaseName: string;
  changeDetail: string;
  timestamp: string;
}

export const PersonChangeToast: React.FC = () => {
  const [notifications, setNotifications] = useState<ChangeNotification[]>([]);

  useEffect(() => {
    const handleNotification = (e: any) => {
      const { databaseName, changeDetail, timestamp } = e.detail || {};
      if (!databaseName) return;

      const newNotif: ChangeNotification = {
        id: `notif-${Date.now()}-${Math.random()}`,
        databaseName,
        changeDetail: changeDetail || 'Updated record',
        timestamp: timestamp || 'just now'
      };

      setNotifications(prev => [newNotif, ...prev.slice(0, 2)]);

      // Auto dismiss after 2 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
      }, 2500);
    };

    window.addEventListener('person-change-notification', handleNotification);
    return () => window.removeEventListener('person-change-notification', handleNotification);
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none font-mono text-xs">
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="px-4 py-2 bg-slate-950/95 border-2 border-cyan-400/80 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.4)] backdrop-blur-xl text-cyan-200 flex items-center gap-3 pointer-events-auto"
          >
            <div className="p-1.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                Person Updated // {n.databaseName}
              </p>
              <p className="text-[9px] text-slate-300">
                {n.changeDetail} • <span className="text-cyan-400/70">Updated {n.timestamp}</span>
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Cloud, CloudRain, Sun, Wind, Droplets, RefreshCw, 
  Globe, Newspaper, Bot, CheckCircle2, Circle, Plus, Trash2, 
  ExternalLink, X, Bell, Palette, AlertCircle, ShieldCheck,
  Check, Calendar, MapPin
} from 'lucide-react';
import { 
  fetchColomboWeather, 
  fetchLiveNews, 
  getReminders, 
  addReminder, 
  toggleReminder, 
  deleteReminder, 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  dismissNotification,
  type ColomboWeather, 
  type NewsArticle, 
  type AppReminder, 
  type AppNotification 
} from '../services/liveDashboardService';
import { soundManager } from '../services/soundEffects';
import { logActivity } from '../services/activityLogger';

interface DailyOverviewClockModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  onSelectTheme: (theme: string) => void;
}

export const DailyOverviewClockModal: React.FC<DailyOverviewClockModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'news' | 'reminders' | 'notifications' | 'theme'>('overview');
  
  // Clock state (Asia/Colombo)
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  
  // Weather state
  const [weather, setWeather] = useState<ColomboWeather | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // News state
  const [newsCategory, setNewsCategory] = useState<'world' | 'srilanka' | 'ai'>('srilanka');
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState<boolean>(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [newsLastUpdated, setNewsLastUpdated] = useState<string>('');

  // Reminders state
  const [reminders, setReminders] = useState<AppReminder[]>([]);
  const [newReminderTitle, setNewReminderTitle] = useState<string>('');
  const [newReminderTime, setNewReminderTime] = useState<string>('Today, 05:00 PM');
  const [newReminderPriority, setNewReminderPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isAddingReminder, setIsAddingReminder] = useState<boolean>(false);

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Update clock in Asia/Colombo timezone
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setDateStr(now.toLocaleDateString('en-US', { timeZone: 'Asia/Colombo', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load weather
  const loadWeather = useCallback(async (force = false) => {
    setIsWeatherLoading(true);
    setWeatherError(null);
    try {
      const data = await fetchColomboWeather(force);
      setWeather(data);
    } catch (err: any) {
      setWeatherError(err?.message || 'Failed to load weather data');
    } finally {
      setIsWeatherLoading(false);
    }
  }, []);

  // Load news
  const loadNews = useCallback(async (cat: 'world' | 'srilanka' | 'ai') => {
    setIsNewsLoading(true);
    setNewsError(null);
    try {
      const data = await fetchLiveNews(cat);
      setNewsArticles(data.items);
      setNewsLastUpdated(data.lastUpdated);
    } catch (err: any) {
      setNewsError(err?.message || 'News feeds currently unreachable. Please retry in a moment.');
    } finally {
      setIsNewsLoading(false);
    }
  }, []);

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen) {
      loadWeather(false);
      loadNews(newsCategory);
      setReminders(getReminders());
      setNotifications(getNotifications());
    }
  }, [isOpen, loadWeather, loadNews, newsCategory]);

  // Sync reminders and notifications listeners
  useEffect(() => {
    const handleReminders = (e: any) => setReminders(e.detail || getReminders());
    const handleNotifications = (e: any) => setNotifications(e.detail || getNotifications());
    window.addEventListener('reminders-updated', handleReminders);
    window.addEventListener('notifications-updated', handleNotifications);
    return () => {
      window.removeEventListener('reminders-updated', handleReminders);
      window.removeEventListener('notifications-updated', handleNotifications);
    };
  }, []);

  // Handle Add Reminder
  const handleAddReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;
    addReminder({
      title: newReminderTitle.trim(),
      dueTime: newReminderTime.trim() || 'Today',
      priority: newReminderPriority
    });
    setNewReminderTitle('');
    setIsAddingReminder(false);
    soundManager.playAccessGrantedSound();
    logActivity('SERVER_TASK', 'Created Reminder', `Reminder: ${newReminderTitle.trim()}`);
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;
  const pendingRemindersCount = reminders.filter(r => !r.completed).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border-2 border-cyan-500/50 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.3)] overflow-hidden font-mono text-slate-200"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-cyan-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-950 border border-cyan-400/50 text-cyan-300">
                <Clock className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black tracking-wider text-cyan-300 uppercase flex items-center gap-2">
                  <span>DAILY OVERVIEW // ASIA/COLOMBO MAINFRAME</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    LIVE
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Sri Lanka standard time, meteorological conditions, real-time news & pending workload
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.playClickSound();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap bg-slate-950/60 border-b border-slate-800 px-6 gap-2 pt-2">
            <button
              onClick={() => {
                setActiveTab('overview');
                soundManager.playClickSound();
              }}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'bg-slate-900 text-cyan-300 border-t-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Colombo & Weather</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('news');
                soundManager.playClickSound();
              }}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'news'
                  ? 'bg-slate-900 text-amber-300 border-t-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>Live News</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('reminders');
                soundManager.playClickSound();
              }}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'reminders'
                  ? 'bg-slate-900 text-purple-300 border-t-2 border-purple-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Reminders</span>
              {pendingRemindersCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/30 text-purple-300 font-bold">
                  {pendingRemindersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('notifications');
                soundManager.playClickSound();
              }}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'notifications'
                  ? 'bg-slate-900 text-emerald-300 border-t-2 border-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Notifications</span>
              {unreadNotifsCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/30 text-rose-300 font-bold animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('theme');
                soundManager.playClickSound();
              }}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'theme'
                  ? 'bg-slate-900 text-pink-300 border-t-2 border-pink-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Theme & Style</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW & COLOMBO WEATHER */}
          {activeTab === 'overview' && (
            <div className="flex-1 p-6 space-y-6 overflow-y-auto jarvis-scrollbar">
              
              {/* BIG DIGITAL TIME DISPLAY */}
              <div className="p-6 rounded-3xl bg-slate-950/80 border border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>COLOMBO, SRI LANKA // TIMEZONE: ASIA/COLOMBO (GMT+5:30)</span>
                  </span>
                  <div className="text-4xl sm:text-6xl font-black text-white tracking-widest font-mono drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                    {timeStr || '12:00:00 PM'}
                  </div>
                  <div className="text-xs sm:text-sm text-cyan-300 font-bold uppercase mt-1">
                    {dateStr}
                  </div>
                </div>

                <button
                  onClick={() => loadWeather(true)}
                  disabled={isWeatherLoading}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-300 border border-cyan-500/30 text-xs font-bold uppercase flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isWeatherLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Weather</span>
                </button>
              </div>

              {/* CURRENT WEATHER CARDS */}
              {isWeatherLoading && !weather && (
                <div className="p-8 text-center text-cyan-400 text-xs font-bold animate-pulse">
                  Connecting to Open-Meteo meteorological satellite for Colombo...
                </div>
              )}

              {weatherError && (
                <div className="p-4 bg-rose-950/40 border border-rose-500/50 rounded-2xl text-rose-300 text-xs flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{weatherError}</span>
                </div>
              )}

              {weather && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* Primary Weather Card */}
                    <div className="sm:col-span-2 p-5 rounded-3xl bg-gradient-to-br from-cyan-950/60 to-slate-950 border border-cyan-500/40 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Current Conditions • Western Province
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-black text-cyan-200">
                            {weather.temperature}°C
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            Feels like {weather.apparentTemperature}°C
                          </span>
                        </div>
                        <div className="text-sm font-bold text-cyan-300 mt-2 flex items-center gap-2">
                          {weather.precipitation > 0 ? <CloudRain className="w-4 h-4 text-cyan-400 animate-bounce" /> : <Sun className="w-4 h-4 text-amber-400" />}
                          <span>{weather.weatherDescription}</span>
                        </div>
                      </div>

                      <div className="text-right space-y-1.5 text-xs text-slate-300">
                        <div className="flex items-center gap-2 justify-end">
                          <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Humidity: <strong>{weather.humidity}%</strong></span>
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <Wind className="w-3.5 h-3.5 text-teal-400" />
                          <span>Wind: <strong>{weather.windSpeed} km/h</strong></span>
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                          <span>Precip: <strong>{weather.precipitation} mm</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Meta info card */}
                    <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                          Meteorological Feed
                        </span>
                        <p className="text-slate-300 font-bold">{weather.source}</p>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-3">
                        Last updated: {new Date(weather.lastUpdated).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* 3-DAY FORECAST STRIP */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>3-Day Colombo Forecast</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {weather.forecast.map((f, i) => (
                        <div key={i} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-cyan-500/40 transition-colors text-center">
                          <span className="text-[11px] font-bold text-cyan-300 block">{f.date}</span>
                          <span className="text-lg font-black text-white block my-1">
                            {f.tempMax}° / <span className="text-slate-400 text-sm">{f.tempMin}°</span>
                          </span>
                          <span className="text-[10px] text-slate-300 block truncate">{f.description}</span>
                          {f.rainChance > 0 && (
                            <span className="text-[9px] text-cyan-400 font-bold block mt-1">
                              Rain: {f.rainChance}%
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 2: LIVE NEWS */}
          {activeTab === 'news' && (
            <div className="flex-1 p-6 space-y-4 overflow-y-auto jarvis-scrollbar flex flex-col">
              
              {/* Category selector & Refresh */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setNewsCategory('srilanka');
                      loadNews('srilanka');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                      newsCategory === 'srilanka'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/60'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    🇱🇰 Sri Lanka News
                  </button>

                  <button
                    onClick={() => {
                      setNewsCategory('world');
                      loadNews('world');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                      newsCategory === 'world'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    🌐 World News
                  </button>

                  <button
                    onClick={() => {
                      setNewsCategory('ai');
                      loadNews('ai');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                      newsCategory === 'ai'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-400/60'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    🤖 AI & Gemini
                  </button>
                </div>

                <button
                  onClick={() => loadNews(newsCategory)}
                  disabled={isNewsLoading}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 font-bold uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isNewsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {isNewsLoading && (
                <div className="p-8 text-center text-cyan-400 text-xs font-bold animate-pulse">
                  Fetching live headlines from real feeds...
                </div>
              )}

              {newsError && (
                <div className="p-4 bg-rose-950/40 border border-rose-500/50 rounded-2xl text-rose-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{newsError}</span>
                  </div>
                  <button
                    onClick={() => loadNews(newsCategory)}
                    className="px-3 py-1 bg-rose-800 text-white rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Articles Grid */}
              <div className="space-y-3 flex-1">
                {newsArticles.map((article, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col sm:flex-row justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-cyan-300 font-bold uppercase">
                          {article.source}
                        </span>
                        {article.pubDate && (
                          <span className="text-[10px] text-slate-500">
                            {new Date(article.pubDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white hover:text-cyan-300 transition-colors">
                        {article.title}
                      </h4>
                      {article.snippet && (
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {article.snippet}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center sm:self-center">
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <span>Original Story</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 3: REMINDERS */}
          {activeTab === 'reminders' && (
            <div className="flex-1 p-6 space-y-4 overflow-y-auto jarvis-scrollbar flex flex-col">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-purple-300 uppercase">
                  Pending Task Reminders & Follow-ups
                </span>
                <button
                  onClick={() => setIsAddingReminder(!isAddingReminder)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingReminder ? 'Cancel' : 'Add Reminder'}</span>
                </button>
              </div>

              {/* Add form */}
              {isAddingReminder && (
                <form onSubmit={handleAddReminderSubmit} className="p-4 bg-slate-950/90 rounded-2xl border border-purple-500/40 space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Reminder Title
                    </label>
                    <input
                      type="text"
                      value={newReminderTitle}
                      onChange={(e) => setNewReminderTitle(e.target.value)}
                      placeholder="e.g. Follow up on Printline client order"
                      autoFocus
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Due Date / Time
                      </label>
                      <input
                        type="text"
                        value={newReminderTime}
                        onChange={(e) => setNewReminderTime(e.target.value)}
                        placeholder="Today, 05:00 PM"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Priority
                      </label>
                      <select
                        value={newReminderPriority}
                        onChange={(e) => setNewReminderPriority(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase rounded-xl cursor-pointer"
                  >
                    Save Reminder
                  </button>
                </form>
              )}

              {/* Reminders List */}
              <div className="space-y-2 flex-1">
                {reminders.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No pending reminders scheduled. Click 'Add Reminder' to schedule one.
                  </div>
                ) : (
                  reminders.map(r => (
                    <div
                      key={r.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        r.completed
                          ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                          : 'bg-slate-950/80 border-slate-800 hover:border-purple-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            toggleReminder(r.id);
                            soundManager.playClickSound();
                          }}
                          className="cursor-pointer text-purple-400 hover:text-purple-300"
                        >
                          {r.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5" />}
                        </button>
                        <div>
                          <p className={`text-xs font-bold ${r.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {r.title}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            Due: {r.dueTime} • {r.priority.toUpperCase()} priority
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          deleteReminder(r.id);
                          soundManager.playClickSound();
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete Reminder"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="flex-1 p-6 space-y-4 overflow-y-auto jarvis-scrollbar flex flex-col">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-emerald-300 uppercase">
                  System Notifications ({unreadNotifsCount} Unread)
                </span>
                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      markAllNotificationsAsRead();
                      soundManager.playClickSound();
                    }}
                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    Mark All as Read
                  </button>
                )}
              </div>

              <div className="space-y-2 flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No active notifications.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        n.read
                          ? 'bg-slate-950/40 border-slate-800/60'
                          : 'bg-slate-950/90 border-cyan-500/40 shadow-sm'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{n.title}</span>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                          )}
                          <span className="text-[10px] text-slate-500">{n.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-400">{n.message}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!n.read && (
                          <button
                            onClick={() => {
                              markNotificationAsRead(n.id);
                              soundManager.playClickSound();
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            dismissNotification(n.id);
                            soundManager.playClickSound();
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 cursor-pointer"
                          title="Dismiss"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 5: THEME / APPEARANCE SETTINGS */}
          {activeTab === 'theme' && (
            <div className="flex-1 p-6 space-y-6 overflow-y-auto jarvis-scrollbar">
              <div>
                <h3 className="text-xs font-black uppercase text-pink-300 flex items-center gap-2 mb-1">
                  <Palette className="w-4 h-4" />
                  <span>Mainframe UI Theme & Palette Selector</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select your preferred style. The existing default remains preserved; changes apply immediately and persist.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'cyan', name: 'Cyan Mainframe', desc: 'Default JARVIS / Natasha Cyber Glow', color: 'bg-cyan-500' },
                  { id: 'emerald', name: 'Emerald Matrix', desc: 'Bio-Digital Terminal Green', color: 'bg-emerald-500' },
                  { id: 'purple', name: 'Royal Purple', desc: 'Deep Space Nebula Aesthetics', color: 'bg-purple-500' },
                  { id: 'amber', name: 'Solar Amber', desc: 'Industrial Cybernetic Gold', color: 'bg-amber-500' },
                  { id: 'red', name: 'Crimson Matrix', desc: 'Tactical Red Alert Protocol', color: 'bg-rose-500' },
                  { id: 'titanium', name: 'Titanium Dark', desc: 'Monochrome Stealth Carbon', color: 'bg-slate-400' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSelectTheme(t.id);
                      soundManager.playAccessGrantedSound();
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      currentTheme === t.id
                        ? 'bg-slate-950 border-pink-400/80 shadow-[0_0_25px_rgba(244,114,182,0.3)]'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-4 h-4 rounded-full ${t.color}`} />
                      {currentTheme === t.id && (
                        <Check className="w-4 h-4 text-pink-400" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-white block">{t.name}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/**
 * RAJ EXPO DIGITALS - LIVE DASHBOARD SERVICE
 * 
 * Provides:
 * 1. Colombo, Sri Lanka Weather (real Open-Meteo meteorological feed)
 * 2. Live News (World, Sri Lanka, AI/Gemini) with legitimate sources and original links
 * 3. Local persistent Reminders with add, toggle, delete
 * 4. Local persistent Notifications with unread tracking & dismiss
 * 5. Sri Lanka Timezone (Asia/Colombo, UTC+5:30)
 */

export interface ColomboWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  weatherDescription: string;
  isDay: boolean;
  forecast: Array<{
    date: string;
    weatherCode: number;
    description: string;
    tempMax: number;
    tempMin: number;
    rainChance: number;
  }>;
  lastUpdated: string;
  source: string;
}

export interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  snippet?: string;
}

export interface NewsResponse {
  category: 'world' | 'srilanka' | 'ai';
  lastUpdated: string;
  items: NewsArticle[];
  error?: string;
}

export interface AppReminder {
  id: string;
  title: string;
  dueTime: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: string;
  notes?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warn' | 'system';
  linkTarget?: string;
}

const REMINDERS_KEY = 'raj_expo_reminders_v2';
const NOTIFICATIONS_KEY = 'raj_expo_notifications_v2';
const WEATHER_CACHE_KEY = 'raj_expo_colombo_weather_cache_v1';

// WMO Weather code interpreter
export function decodeWeatherCode(code: number): string {
  switch (code) {
    case 0: return 'Clear Sky';
    case 1: return 'Mainly Clear';
    case 2: return 'Partly Cloudy';
    case 3: return 'Overcast';
    case 45: case 48: return 'Fog / Mist';
    case 51: case 53: case 55: return 'Drizzle';
    case 61: case 63: case 65: return 'Rain Showers';
    case 71: case 73: case 75: return 'Snow / Flurries';
    case 80: case 81: case 82: return 'Tropical Rain Storm';
    case 95: case 96: case 99: return 'Thunderstorm';
    default: return 'Fair / Humid';
  }
}

/**
 * Fetches real weather data for Colombo, Sri Lanka (Coordinates: 6.9271 N, 79.8612 E)
 */
export async function fetchColomboWeather(forceRefresh = false): Promise<ColomboWeather> {
  const cachedRaw = localStorage.getItem(WEATHER_CACHE_KEY);
  if (!forceRefresh && cachedRaw) {
    try {
      const parsed: ColomboWeather = JSON.parse(cachedRaw);
      const ageMs = Date.now() - new Date(parsed.lastUpdated).getTime();
      if (ageMs < 15 * 60 * 1000) { // 15 min cache
        return parsed;
      }
    } catch {}
  }

  // Try direct Open-Meteo first, fallback to server proxy
  let data: any = null;
  const openMeteoUrl = 'https://api.open-meteo.com/v1/forecast?latitude=6.9271&longitude=79.8612&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FColombo';

  try {
    const res = await fetch(openMeteoUrl, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      data = await res.json();
    }
  } catch {
    // Attempt backend proxy
    try {
      const pRes = await fetch('/api/weather/colombo');
      if (pRes.ok) {
        data = await pRes.json();
      }
    } catch {}
  }

  if (!data || !data.current) {
    throw new Error('Unable to connect to weather satellites for Colombo, Sri Lanka.');
  }

  const current = data.current;
  const daily = data.daily || { time: [], weather_code: [], temperature_2m_max: [], temperature_2m_min: [], precipitation_probability_max: [] };

  const forecast = (daily.time || []).slice(0, 4).map((t: string, i: number) => ({
    date: new Date(t).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
    weatherCode: daily.weather_code?.[i] ?? 0,
    description: decodeWeatherCode(daily.weather_code?.[i] ?? 0),
    tempMax: Math.round(daily.temperature_2m_max?.[i] ?? 30),
    tempMin: Math.round(daily.temperature_2m_min?.[i] ?? 24),
    rainChance: daily.precipitation_probability_max?.[i] ?? 0
  }));

  const weatherResult: ColomboWeather = {
    temperature: Math.round(current.temperature_2m),
    apparentTemperature: Math.round(current.apparent_temperature),
    humidity: Math.round(current.relative_humidity_2m),
    windSpeed: Math.round(current.wind_speed_10m),
    precipitation: current.precipitation || 0,
    weatherCode: current.weather_code,
    weatherDescription: decodeWeatherCode(current.weather_code),
    isDay: current.is_day === 1,
    forecast,
    lastUpdated: new Date().toISOString(),
    source: 'Open-Meteo Meteorological Service (Asia/Colombo)'
  };

  localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(weatherResult));
  return weatherResult;
}

/**
 * Fetches live news by category (world | srilanka | ai)
 */
export async function fetchLiveNews(category: 'world' | 'srilanka' | 'ai'): Promise<NewsResponse> {
  const res = await fetch(`/api/news?category=${category}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to fetch news feed for ${category}`);
  }
  return await res.json();
}

/**
 * Loads persistent Reminders
 */
export function getReminders(): AppReminder[] {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  // Initial clean reminders for Boss
  const defaults: AppReminder[] = [
    {
      id: 'rem-1',
      title: 'Review Central Database GitHub commit snapshot',
      dueTime: 'Today, 06:00 PM',
      priority: 'high',
      completed: false,
      createdAt: new Date().toISOString(),
      notes: 'Ensure all 34 categories have clean payload sync.'
    },
    {
      id: 'rem-2',
      title: 'Prepare Spoken English class notes & vocabulary sheet',
      dueTime: 'Tomorrow, 09:30 AM',
      priority: 'medium',
      completed: false,
      createdAt: new Date().toISOString(),
      notes: 'Printline Wattala session materials.'
    }
  ];
  saveReminders(defaults);
  return defaults;
}

export function saveReminders(items: AppReminder[]): void {
  try {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('reminders-updated', { detail: items }));
  } catch (e) {
    console.error('Failed to save reminders:', e);
  }
}

export function addReminder(reminder: Omit<AppReminder, 'id' | 'completed' | 'createdAt'>): AppReminder {
  const list = getReminders();
  const newItem: AppReminder = {
    ...reminder,
    id: 'rem_' + Date.now().toString(36),
    completed: false,
    createdAt: new Date().toISOString()
  };
  saveReminders([newItem, ...list]);
  return newItem;
}

export function toggleReminder(id: string): void {
  const list = getReminders();
  const updated = list.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
  saveReminders(updated);
}

export function deleteReminder(id: string): void {
  const list = getReminders();
  saveReminders(list.filter(item => item.id !== id));
}

/**
 * Loads persistent Notifications
 */
export function getNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  const defaults: AppNotification[] = [
    {
      id: 'notif-1',
      title: 'Mainframe Cyber Security Active',
      message: 'Salted SHA-256 passcode & 10min autolock protection initialized.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: 'success'
    },
    {
      id: 'notif-2',
      title: 'Colombo Weather Satellite Connected',
      message: 'Live meteorological telemetry synchronized for Western Province, Sri Lanka.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: 'info'
    }
  ];
  saveNotifications(defaults);
  return defaults;
}

export function saveNotifications(items: AppNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('notifications-updated', { detail: items }));
  } catch (e) {
    console.error('Failed to save notifications:', e);
  }
}

export function markNotificationAsRead(id: string): void {
  const list = getNotifications();
  saveNotifications(list.map(n => n.id === id ? { ...n, read: true } : n));
}

export function markAllNotificationsAsRead(): void {
  const list = getNotifications();
  saveNotifications(list.map(n => ({ ...n, read: true })));
}

export function dismissNotification(id: string): void {
  const list = getNotifications();
  saveNotifications(list.filter(n => n.id !== id));
}

export function addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
  const list = getNotifications();
  const newItem: AppNotification = {
    ...notif,
    id: 'notif_' + Date.now().toString(36),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: false
  };
  saveNotifications([newItem, ...list]);
  return newItem;
}

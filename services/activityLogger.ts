export interface ActivityItem {
  id: string;
  timestamp: string;
  category: 'VISIT' | 'CHAT' | 'FILE_UPLOAD' | 'PDF_COUNT' | 'WEBAPP' | 'LOCK_UNLOCK' | 'DATABASE' | 'SERVER_TASK' | 'THEME_ANIM' | 'PROMPT_STUDIO' | 'WINDOW_CONTROL' | 'TASKBAR';
  title: string;
  description: string;
  details?: string;
}

const STORAGE_KEY = 'raj_expo_system_activities_v1';
const VISIT_COUNT_KEY = 'raj_expo_visit_count_v1';

export const getVisitCount = (): number => {
  try {
    const countStr = localStorage.getItem(VISIT_COUNT_KEY);
    return countStr ? parseInt(countStr, 10) : 1;
  } catch {
    return 1;
  }
};

export const incrementVisitCount = (): number => {
  try {
    const current = getVisitCount();
    const next = current + 1;
    localStorage.setItem(VISIT_COUNT_KEY, next.toString());
    return next;
  } catch {
    return 1;
  }
};

export const getStoredActivities = (): ActivityItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load system activities:', err);
  }

  return [];
};

export const logActivity = (
  category: ActivityItem['category'],
  title: string,
  description: string,
  details?: string
): ActivityItem => {
  const newItem: ActivityItem = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toLocaleString(),
    category,
    title,
    description,
    details
  };

  try {
    const existing = getStoredActivities();
    const updated = [newItem, ...existing].slice(0, 300); // keep up to 300 entries
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('system-activity-logged', { detail: newItem }));
      }, 0);
    }
  } catch (err) {
    console.error('Failed to save activity:', err);
  }

  return newItem;
};

export const clearAllActivities = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('system-activity-logged', { detail: null }));
      }, 0);
    }
  } catch (err) {
    console.error('Failed to clear activities:', err);
  }
};

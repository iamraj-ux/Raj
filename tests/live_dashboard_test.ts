/**
 * TEST SUITE: LIVE DASHBOARD, WEATHER, NEWS & REMINDERS
 */

import { 
  decodeWeatherCode, 
  getReminders, 
  addReminder, 
  toggleReminder, 
  deleteReminder,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dismissNotification
} from '../services/liveDashboardService';

// Mock localStorage if needed
if (typeof localStorage === 'undefined' || localStorage === null) {
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

if (typeof window === 'undefined') {
  (global as any).window = {
    dispatchEvent: () => true
  };
}

function runLiveDashboardTests() {
  console.log('--- STARTING LIVE DASHBOARD TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  }

  // 1. Weather code decoder
  assert(decodeWeatherCode(0) === 'Clear Sky', 'Code 0 decodes to Clear Sky');
  assert(decodeWeatherCode(2) === 'Partly Cloudy', 'Code 2 decodes to Partly Cloudy');
  assert(decodeWeatherCode(61) === 'Rain Showers', 'Code 61 decodes to Rain Showers');
  assert(decodeWeatherCode(95) === 'Thunderstorm', 'Code 95 decodes to Thunderstorm');

  // 2. Reminders CRUD
  localStorage.clear();
  const initialReminders = getReminders();
  assert(initialReminders.length > 0, 'Default initial reminders created');

  const newRem = addReminder({
    title: 'Printline invoice follow-up',
    dueTime: 'Tomorrow, 11:00 AM',
    priority: 'high',
    notes: 'Confirm payment receipt'
  });
  assert(newRem.title === 'Printline invoice follow-up', 'New reminder created');
  assert(newRem.completed === false, 'New reminder defaults to incomplete');

  toggleReminder(newRem.id);
  const updatedReminders = getReminders();
  const toggled = updatedReminders.find(r => r.id === newRem.id);
  assert(toggled?.completed === true, 'Reminder completed state toggled to true');

  deleteReminder(newRem.id);
  const remainingReminders = getReminders();
  assert(!remainingReminders.some(r => r.id === newRem.id), 'Reminder successfully deleted');

  // 3. Notifications
  const initialNotifs = getNotifications();
  assert(initialNotifs.length > 0, 'Initial notifications loaded');

  markNotificationAsRead(initialNotifs[0].id);
  const readNotifs = getNotifications();
  assert(readNotifs[0].read === true, 'Single notification marked as read');

  markAllNotificationsAsRead();
  const allRead = getNotifications();
  assert(allRead.every(n => n.read), 'All notifications marked as read');

  const initialCount = allRead.length;
  dismissNotification(allRead[0].id);
  const afterDismiss = getNotifications();
  assert(afterDismiss.length === initialCount - 1, 'Notification dismissed successfully');

  // 4. Timezone check
  const now = new Date();
  const colomboTime = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo' });
  assert(colomboTime.length > 0, `Asia/Colombo time computed: ${colomboTime}`);

  console.log(`\nTEST RESULTS: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runLiveDashboardTests();

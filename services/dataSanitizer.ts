/**
 * DATA SANITIZER & ZERO-SEED ENFORCEMENT SERVICE
 * 
 * Enforces Absolute Rule 2: NO FAKE DATA.
 * Erases pre-seeded mock records, simulated NTP data, seed contacts,
 * fake events, and pre-generated server activity logs.
 * 
 * Ensures all databases (Central Records, Knowledge Graph, People DB,
 * Activity Logs) start clean and accept only genuine user actions.
 */

const SEED_STORAGE_KEYS = [
  'raj_expo_central_records_v2',
  'raj_expo_central_relationships_v2',
  'raj_expo_knowledge_graph_v1',
  'rajexpo_people_database_v2',
  'raj_expo_system_activities_v1',
  'raj_expo_cloud_storage_items_v1',
  'raj_expo_github_db_backup_v1',
  'rajexpo_whatsapp_sessions_v1'
];

/**
 * Runs an automatic audit on startup to purge legacy seed data if detected.
 */
export const runStartupDataPurge = (): void => {
  try {
    const isPurged = localStorage.getItem('raj_expo_seed_purged_v5');
    if (!isPurged) {
      // Clean out any old mock data
      SEED_STORAGE_KEYS.forEach(key => {
        try {
          const item = localStorage.getItem(key);
          if (item && (item.includes('birthday-party') || item.includes('rec-img-birthday') || item.includes('ent-jonathan-raj'))) {
            localStorage.removeItem(key);
          }
        } catch {}
      });
      localStorage.setItem('raj_expo_seed_purged_v5', 'true');
    }
  } catch (err) {
    console.error('Data purge check error:', err);
  }
};

/**
 * User-confirmed explicit complete purge of all local database records.
 */
export const purgeAllDatabaseData = (): { success: boolean; clearedKeys: string[] } => {
  const cleared: string[] = [];
  try {
    SEED_STORAGE_KEYS.forEach(key => {
      try {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          cleared.push(key);
        }
      } catch {}
    });

    // Notify components
    window.dispatchEvent(new CustomEvent('central-records-updated'));
    window.dispatchEvent(new CustomEvent('people-database-updated'));
    window.dispatchEvent(new CustomEvent('system-activity-logged', { detail: null }));

    return { success: true, clearedKeys: cleared };
  } catch (err) {
    console.error('Failed to purge database:', err);
    return { success: false, clearedKeys: cleared };
  }
};

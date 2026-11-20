/**
 * Mobile Offline Resilience & Queueing Manager for SahaySetu Android App.
 * Handles offline incident storage in localStorage/IndexedDB during disaster grid failures
 * and automatically flushes queued reports to the Node.js backend when network connection is restored.
 */

const QUEUE_KEY = 'sahaySetu_offline_incidents_queue';

/** Save an incident payload to offline queue when offline */
export const queueOfflineIncident = (incidentData) => {
  const existing = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  const item = {
    id: `offline_${Date.now()}`,
    data: incidentData,
    queuedAt: new Date().toISOString(),
  };
  existing.push(item);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(existing));
  return item;
};

/** Get all currently queued offline reports */
export const getOfflineQueue = () => {
  return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
};

/** Remove a successfully synced incident from queue */
export const dequeueOfflineIncident = (id) => {
  const existing = getOfflineQueue();
  const filtered = existing.filter((item) => item.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
};

/** Clear queue */
export const clearOfflineQueue = () => {
  localStorage.removeItem(QUEUE_KEY);
};

/** Listen for online event and attempt queue sync */
export const initOfflineAutoSync = (syncCallback) => {
  window.addEventListener('online', async () => {
    const queue = getOfflineQueue();
    if (queue.length > 0 && typeof syncCallback === 'function') {
      console.log(`[SahaySetu Mobile] Connection restored. Syncing ${queue.length} offline report(s)…`);
      await syncCallback(queue);
    }
  });
};

/* Browser fallback only. The desktop edition uses the portable Daten folder. */
(function (g) {
  'use strict';

  const key = 'notenblick-workspace-v11';
  let opening,
    chain = Promise.resolve();
  function db() {
    if (!g.indexedDB) return Promise.resolve(null);
    if (!opening) opening = new Promise((resolve, reject) => {
      const request = indexedDB.open('Notenblick', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('state');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return opening;
  }
  async function get() {
    const d = await db();
    if (!d) {
      try {
        return JSON.parse(localStorage.getItem(key) || 'null');
      } catch {
        return null;
      }
    }
    return new Promise((resolve, reject) => {
      const tx = d.transaction('state', 'readonly'),
        r = tx.objectStore('state').get('current');
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => reject(r.error);
    });
  }
  function put(value) {
    return db().then(d => {
      if (!d) {
        localStorage.setItem(key, JSON.stringify({
          data: value.data,workspace:value.workspace
        }));
        return;
      }
      return new Promise((resolve, reject) => {
        const tx = d.transaction('state', 'readwrite');
        tx.objectStore('state').put(value, 'current');
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || Error('Die Änderungen konnten nicht aufbewahrt werden.'));
      });
    });
  }
  function update(fn) {
    const task = chain.catch(() => {}).then(async () => put(fn((await get()) || {})));
    chain = task;
    return task;
  }
  g.NRSession = {
    load: async () => {
      await chain.catch(() => {});
      return get();
    },
    save: data => g.NRDesktop?.available ? Promise.resolve() : update(v => ({
      ...v,
      data: JSON.parse(JSON.stringify(data))
    })),
    protectOral:snapshot=>update(v=>({...v,oralProtection:JSON.parse(JSON.stringify(snapshot))})),
    saveWorkspace:workspace=>g.NRDesktop?.available?Promise.resolve():update(v=>({...v,workspace:JSON.parse(JSON.stringify(workspace))})),
    remember: handle => update(v => ({
      ...v,
      handle
    })),
    clear: () => update(() => ({}))
  };
})(globalThis);

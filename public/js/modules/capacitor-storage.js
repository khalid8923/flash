/**
 * FLASH - Capacitor Preferences Storage Bridge
 * Phase I: Migrating from Web LocalStorage to Native Storage
 * (Per Master Spec Section 12)
 */
(function() {
    if (!window.Capacitor || !window.Capacitor.Plugins || !window.Capacitor.Plugins.Preferences) {
        console.log('[Storage] Web mode detected, using standard LocalStorage');
        return;
    }

    const { Preferences } = window.Capacitor.Plugins;
    console.log('[Storage] Native mode detected, bridging LocalStorage to Capacitor Preferences');

    // Backup original localStorage methods just in case
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;
    const originalRemoveItem = localStorage.removeItem;

    // Since LocalStorage is synchronous and Preferences is async, 
    // we write synchronously to LocalStorage (for immediate reads by games)
    // and asynchronously mirror to Preferences (for permanent native storage).
    
    localStorage.setItem = function(key, value) {
        originalSetItem.call(localStorage, key, value); // keep web working
        Preferences.set({ key: key, value: value }).catch(e => console.warn('Native save failed', e));
    };

    localStorage.removeItem = function(key) {
        originalRemoveItem.call(localStorage, key);
        Preferences.remove({ key: key }).catch(e => console.warn('Native remove failed', e));
    };

    // Hydration: On boot, pull from Preferences and inject into LocalStorage
    // (This handles the case where Android cleared LocalStorage but Preferences survived)
    (async () => {
        try {
            const { keys } = await Preferences.keys();
            if (keys && keys.length > 0) {
                const { values } = await Preferences.get({ keys });
                for (const [key, val] of Object.entries(values)) {
                    if (val !== null && originalGetItem.call(localStorage, key) === null) {
                        originalSetItem.call(localStorage, key, val);
                    }
                }
                console.log('[Storage] Hydrated ' + keys.length + ' keys from Native Preferences');
            }
        } catch (e) {
            console.error('[Storage] Hydration failed', e);
        }
    })();
})();

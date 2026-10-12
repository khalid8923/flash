/* SW cleanup - unregisters any existing SW and clears caches */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
        regs.forEach(function (reg) { reg.unregister(); });
    });
    if (window.caches) {
        caches.keys().then(function (keys) {
            keys.forEach(function (k) { caches.delete(k); });
        });
    }
}
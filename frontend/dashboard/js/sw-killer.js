/* Kill any existing SW + caches on every page load */
(function(){
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(rs){
      rs.forEach(function(r){
        var url = r.active && r.active.scriptURL || (r.installing && r.installing.scriptURL) || '';
        if (url.indexOf('sw.js') >= 0 || url.indexOf('dashboard') >= 0) {
          r.unregister();
          console.warn('[SW-KILLER] unregistered', url);
        }
      });
    });
  }
  if (window.caches) {
    caches.keys().then(function(ks){
      ks.forEach(function(k){
        if (k.indexOf('flash-') === 0) {
          caches.delete(k);
          console.warn('[SW-KILLER] deleted cache', k);
        }
      });
    });
  }
})();
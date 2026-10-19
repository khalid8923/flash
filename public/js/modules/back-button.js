document.addEventListener('DOMContentLoaded', () => {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        const { App } = window.Capacitor.Plugins;
        
        App.addListener('backButton', ({ canGoBack }) => {
            const iframe = document.querySelector('iframe, #game-frame');
            
            // If a game is running
            if (iframe && iframe.style.display !== 'none' && iframe.style.zIndex === '10000') {
                iframe.style.display = 'none';
                iframe.src = 'about:blank'; 
                window.dispatchEvent(new Event('flash:game-exit')); 
                console.log('[FLASH Mobile] Back button: Exited game');
            } else {
                // If on dashboard
                App.minimizeApp();
                console.log('[FLASH Mobile] Back button: Minimized app');
            }
        });
    } else {
        console.warn('[FLASH Mobile] Capacitor App plugin not found.');
    }
});

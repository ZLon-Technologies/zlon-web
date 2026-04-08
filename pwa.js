(function () {
    const namespace = window.ZLon = window.ZLon || {};
    let deferredInstallPrompt = null;

    function isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    }

    function getInstallButtons() {
        return Array.from(document.querySelectorAll('[data-install-app]'));
    }

    function updateInstallControls() {
        const shouldShow = Boolean(deferredInstallPrompt) && !isStandalone();
        getInstallButtons().forEach((button) => {
            button.hidden = !shouldShow;
        });
    }

    async function installApp() {
        if (!deferredInstallPrompt) return false;

        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        updateInstallControls();
        return choice && choice.outcome === 'accepted';
    }

    function bindInstallButtons() {
        getInstallButtons().forEach((button) => {
            button.addEventListener('click', () => {
                installApp();
            });
        });
        updateInstallControls();
    }

    function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) return;
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') return;

        navigator.serviceWorker.register('/sw.js').catch((error) => {
            console.warn('Service worker registration failed:', error.message);
        });
    }

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;
        updateInstallControls();
    });

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        updateInstallControls();
    });

    document.addEventListener('DOMContentLoaded', () => {
        bindInstallButtons();
        registerServiceWorker();
    });

    namespace.pwa = {
        installApp,
        isStandalone,
        updateInstallControls
    };
})();

(function () {
    const namespace = window.ZLon = window.ZLon || {};
    let client = null;

    function storageKeyForHost(hostname) {
        const host = String(hostname || 'local').replace(/[^a-z0-9.-]/gi, '-');
        return `zlon-auth-${host}`;
    }

    namespace.getSupabaseClient = function getSupabaseClient() {
        const config = namespace.supabaseConfig || {};

        if (client) {
            return client;
        }

        if (!window.supabase || !window.supabase.createClient) {
            throw new Error('Supabase SDK failed to load.');
        }

        if (!config.url || !config.anonKey) {
            throw new Error('Missing Supabase config. Set ZLON_SUPABASE_URL and ZLON_SUPABASE_ANON_KEY, then run the build step.');
        }

        client = window.supabase.createClient(config.url, config.anonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                flowType: 'pkce',
                storage: window.localStorage,
                storageKey: storageKeyForHost(window.location.hostname)
            }
        });
        return client;
    };
})();

(function () {
    const namespace = window.ZLon = window.ZLon || {};
    let client = null;

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

        client = window.supabase.createClient(config.url, config.anonKey);
        return client;
    };
})();

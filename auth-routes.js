(function () {
    const namespace = window.ZLon = window.ZLon || {};
    const CUSTOMER_HOST = 'www.zlon.in';
    const LEGACY_CUSTOMER_HOST = 'zlon.in';
    const BUSINESS_HOST = 'mybusiness.zlon.in';

    function isLocalOrigin() {
        return window.location.protocol === 'file:' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';
    }

    function hostUrl(host, path) {
        const nextPath = path || '/';
        if (isLocalOrigin()) {
            return new URL(nextPath.replace(/^\//, '') || 'index.html', window.location.href).href;
        }

        return `https://${host}${nextPath}`;
    }

    function isBusinessPortalHost() {
        return window.location.hostname === BUSINESS_HOST;
    }

    function isCustomerHost() {
        return window.location.hostname === CUSTOMER_HOST || window.location.hostname === LEGACY_CUSTOMER_HOST;
    }

    function isCanonicalCustomerHost() {
        return window.location.hostname === CUSTOMER_HOST;
    }

    function shouldRedirectToCanonicalCustomerHost() {
        return !isLocalOrigin() && window.location.hostname === LEGACY_CUSTOMER_HOST;
    }

    function portalUrl() {
        if (isLocalOrigin()) {
            return new URL('dashboard.html', window.location.href).href;
        }

        return hostUrl(BUSINESS_HOST, '/dashboard.html');
    }

    function homeUrl() {
        if (isLocalOrigin()) {
            return new URL('index.html', window.location.href).href;
        }

        return hostUrl(CUSTOMER_HOST, '/');
    }

    function loginUrl() {
        if (isLocalOrigin()) {
            return new URL('login.html', window.location.href).href;
        }

        return hostUrl(BUSINESS_HOST, '/login.html');
    }

    function shouldUseBusinessLoginHost() {
        return isCustomerHost() && !isBusinessPortalHost();
    }

    function canonicalCustomerUrl(path) {
        if (isLocalOrigin()) {
            return new URL((path || '/').replace(/^\//, '') || 'index.html', window.location.href).href;
        }

        return hostUrl(CUSTOMER_HOST, path || '/');
    }

    function normalizeUserType(value) {
        const type = String(value || '').toLowerCase();
        return type === 'owner' || type === 'customer' ? type : '';
    }

    function getMetadataUserType(user) {
        return normalizeUserType(
            user &&
            ((user.app_metadata && user.app_metadata.user_type) ||
                (user.user_metadata && user.user_metadata.user_type))
        );
    }

    async function getSession(db) {
        if (!db || !db.auth) return null;
        const { data, error } = await db.auth.getSession();
        if (error || !data || !data.session) return null;
        return data.session;
    }

    async function getProfileUserType(db, user) {
        if (!db || !user || !user.id) return '';

        const result = await db
            .from('profiles')
            .select('user_type')
            .eq('id', user.id)
            .limit(1);

        if (!result.error && result.data && result.data.length) {
            return normalizeUserType(result.data[0].user_type);
        }

        return '';
    }

    async function hasLinkedOwnerSalon(db, user) {
        if (!db || !user || !user.id) return false;

        const owned = await db
            .from('salons')
            .select('id')
            .eq('owner_id', user.id)
            .limit(1);

        if (!owned.error && owned.data && owned.data.length) {
            return true;
        }

        if (!user.email) return false;

        for (const column of ['owner_email', 'email']) {
            const matched = await db
                .from('salons')
                .select('id')
                .ilike(column, user.email)
                .limit(1);

            if (!matched.error && matched.data && matched.data.length) {
                return true;
            }
        }

        return false;
    }

    async function resolveUserType(db, session) {
        if (!session || !session.user) return '';

        const profileType = await getProfileUserType(db, session.user);
        if (profileType) return profileType;

        const metadataType = getMetadataUserType(session.user);
        if (metadataType) return metadataType;

        if (await hasLinkedOwnerSalon(db, session.user)) {
            return 'owner';
        }

        return 'customer';
    }

    async function syncProfile(db, user, userType, phone = null) {
        const normalized = normalizeUserType(userType);
        if (!db || !user || !normalized) return;

        const { error } = await db.rpc('sync_current_user_profile', {
            next_user_type: normalized,
            next_phone: phone
        });

        if (error) {
            console.warn('Profile sync skipped:', error.message);
        }
    }

    function routeForUserType(userType) {
        return userType === 'owner' ? portalUrl() : homeUrl();
    }

    async function requireUserType(db, allowedUserTypes, options = {}) {
        const session = await getSession(db);
        if (!session) {
            window.location.replace(options.loginUrl || loginUrl());
            return null;
        }

        const userType = await resolveUserType(db, session);
        if (!allowedUserTypes.includes(userType)) {
            window.location.replace(routeForUserType(userType));
            return null;
        }

        return { session, userType };
    }

    async function redirectOwnersFromPublic(db) {
        const session = await getSession(db);
        if (!session) return;

        const userType = await resolveUserType(db, session);
        if (userType === 'owner' && !isBusinessPortalHost()) {
            window.location.replace(portalUrl());
        }
    }

    namespace.authRoutes = {
        canonicalCustomerUrl,
        getSession,
        homeUrl,
        isCanonicalCustomerHost,
        isBusinessPortalHost,
        isCustomerHost,
        loginUrl,
        portalUrl,
        redirectOwnersFromPublic,
        requireUserType,
        resolveUserType,
        shouldRedirectToCanonicalCustomerHost,
        shouldUseBusinessLoginHost,
        syncProfile
    };
})();

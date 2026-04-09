(function () {
    const namespace = window.ZLon = window.ZLon || {};
    const HISTORY_KEY = 'zlon.consumer.history';
    const WALLET_KEY = 'zlon.consumer.wallet';
    const LOCATION_FALLBACK = 'Location auto select';
    const FALLBACK_SALONS = [
        { id: 's1', name: 'Noir Studio', area: 'Napier Town', city: 'Jabalpur', waitTime: '8 min', queue_status: 'available', type: 'premium', phone: '919876543210' },
        { id: 's2', name: 'Chair Theory', area: 'Civic Centre', city: 'Jabalpur', waitTime: '12 min', queue_status: 'available', type: 'standard', phone: '919812345670' },
        { id: 's3', name: 'Velvet Barber Lab', area: 'Vijay Nagar', city: 'Jabalpur', waitTime: '5 min', queue_status: 'available', type: 'premium', phone: '919845612378' },
        { id: 's4', name: 'Trim Deck', area: 'Madan Mahal', city: 'Jabalpur', waitTime: '14 min', queue_status: 'busy', type: 'standard', phone: '919800112233' },
        { id: 's5', name: 'Sunday Fade Co.', area: 'Wright Town', city: 'Jabalpur', waitTime: '4 min', queue_status: 'available', type: 'standard', phone: '919877700022' }
    ];
    const state = {
        db: null,
        session: null,
        userType: 'customer',
        activeView: 'auth',
        authStep: 'phone-entry',
        emailMode: 'login',
        pendingPhone: '',
        pendingEmail: '',
        salons: FALLBACK_SALONS.slice(),
        userLocation: null,
        locationLabel: LOCATION_FALLBACK,
        filter: 'all',
        carouselIndex: 0,
        carouselTimer: null,
        toastTimer: null,
        history: loadJson(HISTORY_KEY, []),
        walletBalance: Number(loadJson(WALLET_KEY, 0)) || 0,
        authBusy: false,
        splashComplete: false,
        sessionSyncInFlight: false,
        suppressAuthListener: false
    };

    const els = {
        splashScreen: document.getElementById('splashScreen'),
        appFrame: document.getElementById('appFrame'),
        authView: document.getElementById('authView'),
        homeView: document.getElementById('homeView'),
        bookView: document.getElementById('bookView'),
        historyView: document.getElementById('historyView'),
        walletView: document.getElementById('walletView'),
        accountView: document.getElementById('accountView'),
        phoneEntryStep: document.getElementById('phoneEntryStep'),
        phoneOtpStep: document.getElementById('phoneOtpStep'),
        emailEntryStep: document.getElementById('emailEntryStep'),
        emailOtpStep: document.getElementById('emailOtpStep'),
        authStatus: document.getElementById('authStatus'),
        phoneNumberInput: document.getElementById('phoneNumberInput'),
        phoneContinueButton: document.getElementById('phoneContinueButton'),
        phoneOtpPreview: document.getElementById('phoneOtpPreview'),
        phoneOtpInput: document.getElementById('phoneOtpInput'),
        phoneBackButton: document.getElementById('phoneBackButton'),
        phoneResendButton: document.getElementById('phoneResendButton'),
        phoneVerifyButton: document.getElementById('phoneVerifyButton'),
        googleAuthButton: document.getElementById('googleAuthButton'),
        appleAuthButton: document.getElementById('appleAuthButton'),
        showEmailAuthButton: document.getElementById('showEmailAuthButton'),
        emailLoginModeButton: document.getElementById('emailLoginModeButton'),
        emailSignupModeButton: document.getElementById('emailSignupModeButton'),
        emailAddressInput: document.getElementById('emailAddressInput'),
        emailPasswordInput: document.getElementById('emailPasswordInput'),
        emailBackToPhoneButton: document.getElementById('emailBackToPhoneButton'),
        emailContinueButton: document.getElementById('emailContinueButton'),
        emailOtpPreview: document.getElementById('emailOtpPreview'),
        emailOtpInput: document.getElementById('emailOtpInput'),
        emailOtpBackButton: document.getElementById('emailOtpBackButton'),
        emailResendButton: document.getElementById('emailResendButton'),
        emailVerifyButton: document.getElementById('emailVerifyButton'),
        profileButton: document.getElementById('profileButton'),
        historyProfileButton: document.getElementById('historyProfileButton'),
        homeLocationButton: document.getElementById('homeLocationButton'),
        historyLocationButton: document.getElementById('historyLocationButton'),
        homeLocationLabel: document.getElementById('homeLocationLabel'),
        bookLocationLabel: document.getElementById('bookLocationLabel'),
        historyLocationLabel: document.getElementById('historyLocationLabel'),
        carouselTrack: document.getElementById('carouselTrack'),
        carouselDots: document.getElementById('carouselDots'),
        carouselPrevButton: document.getElementById('carouselPrevButton'),
        carouselNextButton: document.getElementById('carouselNextButton'),
        walletShortcutButton: document.getElementById('walletShortcutButton'),
        walletBalancePreview: document.getElementById('walletBalancePreview'),
        bookNowButton: document.getElementById('bookNowButton'),
        seeAllSalonsButton: document.getElementById('seeAllSalonsButton'),
        nearbyRail: document.getElementById('nearbyRail'),
        bookBackButton: document.getElementById('bookBackButton'),
        salonSearchInput: document.getElementById('salonSearchInput'),
        filterToggleButton: document.getElementById('filterToggleButton'),
        filterBar: document.getElementById('filterBar'),
        salonResults: document.getElementById('salonResults'),
        historyList: document.getElementById('historyList'),
        walletBackButton: document.getElementById('walletBackButton'),
        walletBalanceText: document.getElementById('walletBalanceText'),
        walletRechargeButton: document.getElementById('walletRechargeButton'),
        accountBackButton: document.getElementById('accountBackButton'),
        accountNameText: document.getElementById('accountNameText'),
        accountMetaText: document.getElementById('accountMetaText'),
        accountPhoneText: document.getElementById('accountPhoneText'),
        bottomNav: document.getElementById('bottomNav'),
        navButtons: Array.from(document.querySelectorAll('[data-nav]')),
        profileSheet: document.getElementById('profileSheet'),
        profileSheetOverlay: document.getElementById('profileSheetOverlay'),
        sheetButtons: Array.from(document.querySelectorAll('[data-sheet-action]')),
        toast: document.getElementById('toast')
    };

    function loadJson(key, fallback) {
        try {
            const raw = window.localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function saveJson(key, value) {
        window.localStorage.setItem(key, JSON.stringify(value));
    }

    function showToast(message) {
        els.toast.textContent = message;
        els.toast.classList.add('is-visible');
        window.clearTimeout(state.toastTimer);
        state.toastTimer = window.setTimeout(() => {
            els.toast.classList.remove('is-visible');
        }, 3000);
    }

    function setAuthStatus(message, tone) {
        els.authStatus.textContent = message || '';
        els.authStatus.className = 'status-text';
        if (tone === 'error') {
            els.authStatus.classList.add('is-error');
        }
        if (tone === 'success') {
            els.authStatus.classList.add('is-success');
        }
    }

    function setAuthBusy(isBusy) {
        state.authBusy = isBusy;
        [
            els.phoneContinueButton,
            els.phoneBackButton,
            els.phoneResendButton,
            els.phoneVerifyButton,
            els.googleAuthButton,
            els.appleAuthButton,
            els.showEmailAuthButton,
            els.emailLoginModeButton,
            els.emailSignupModeButton,
            els.emailBackToPhoneButton,
            els.emailContinueButton,
            els.emailOtpBackButton,
            els.emailResendButton,
            els.emailVerifyButton
        ].forEach((element) => {
            if (element) element.disabled = isBusy;
        });
    }

    function setEmailMode(mode) {
        state.emailMode = mode === 'signup' ? 'signup' : 'login';
        els.emailLoginModeButton.classList.toggle('is-active', state.emailMode === 'login');
        els.emailSignupModeButton.classList.toggle('is-active', state.emailMode === 'signup');
    }

    function showAuthStep(step) {
        state.authStep = step;
        els.phoneEntryStep.hidden = step !== 'phone-entry';
        els.phoneOtpStep.hidden = step !== 'phone-otp';
        els.emailEntryStep.hidden = step !== 'email-entry';
        els.emailOtpStep.hidden = step !== 'email-otp';
        setAuthStatus('');
    }

    function setActiveView(view) {
        if (!state.session && view !== 'auth') {
            view = 'auth';
        }

        state.activeView = view;
        els.authView.classList.toggle('is-active', view === 'auth');
        els.homeView.classList.toggle('is-active', view === 'home');
        els.bookView.classList.toggle('is-active', view === 'book');
        els.historyView.classList.toggle('is-active', view === 'history');
        els.walletView.classList.toggle('is-active', view === 'wallet');
        els.accountView.classList.toggle('is-active', view === 'account');
        els.bottomNav.hidden = !(view === 'home' || view === 'history');
        els.navButtons.forEach((button) => {
            button.classList.toggle('is-active', button.getAttribute('data-nav') === view);
        });
        closeProfileSheet();

        if (view === 'home') {
            renderHome();
        }
        if (view === 'book') {
            renderSalonList();
        }
        if (view === 'history') {
            renderHistory();
        }
        if (view === 'wallet') {
            renderWallet();
        }
        if (view === 'account') {
            renderAccount();
        }
    }

    function playSplash() {
        return new Promise((resolve) => {
            window.setTimeout(() => {
                els.splashScreen.classList.add('is-exit');
            }, 650);

            window.setTimeout(() => {
                els.splashScreen.classList.add('is-hidden');
                els.appFrame.classList.add('is-ready');
                els.appFrame.setAttribute('aria-hidden', 'false');
                state.splashComplete = true;
                resolve();
            }, 1350);
        });
    }

    function safeSupabaseClient() {
        try {
            return namespace.getSupabaseClient();
        } catch (error) {
            console.warn(error.message);
            return null;
        }
    }

    function isBusinessHost() {
        return namespace.authRoutes && namespace.authRoutes.isBusinessPortalHost
            ? namespace.authRoutes.isBusinessPortalHost()
            : window.location.hostname === 'mybusiness.zlon.in';
    }

    function isCanonicalRedirectNeeded() {
        return namespace.authRoutes && namespace.authRoutes.shouldRedirectToCanonicalCustomerHost
            ? namespace.authRoutes.shouldRedirectToCanonicalCustomerHost()
            : false;
    }

    function iconSvg(name) {
        if (name === 'arrow') {
            return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m15 5-7 7 7 7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        }
        return '';
    }

    function formatPhonePreview(phone) {
        return phone.replace(/(\+91)(\d{5})(\d{5})/, '$1 $2 $3');
    }

    function toIndianPhone(raw) {
        const digits = String(raw || '').replace(/\D/g, '');
        if (!digits) return '';
        const normalized = digits.length > 10 ? digits.slice(-10) : digits;
        if (normalized.length !== 10) return '';
        return `+91${normalized}`;
    }

    function textOrFallback(value, fallback) {
        return value ? String(value) : fallback;
    }

    function getSalonKey(salon) {
        return String(salon.id || salon.salon_id || salon.name || Math.random());
    }

    function getSalonLocation(salon) {
        return salon.location || salon.area || salon.city || salon.pincode || 'Nearby';
    }

    function getSalonWaitTime(salon) {
        return salon.waitTime || salon.wait_time || salon.wait_time_label || 'Check on booking';
    }

    function getSalonPhone(salon) {
        return String(salon.whatsapp || salon.waNumber || salon.phone || salon.phone_number || '').replace(/\D/g, '');
    }

    function isAvailableSalon(salon) {
        return String(salon.queue_status || 'available').toLowerCase() === 'available';
    }

    function getSalonType(salon) {
        return String(salon.type || salon.tier || 'standard').toLowerCase();
    }

    function getSalonCoordinates(salon) {
        const lat = Number(salon.latitude !== undefined ? salon.latitude : salon.lat);
        const lng = Number(salon.longitude !== undefined ? salon.longitude : salon.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { lat, lng };
    }

    function distanceBetweenMeters(from, to) {
        const radius = 6371000;
        const dLat = (to.lat - from.lat) * Math.PI / 180;
        const dLng = (to.lng - from.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180)
            * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function sortedSalons() {
        const copy = state.salons.slice();
        if (!state.userLocation) return copy;
        return copy.sort((a, b) => {
            const aCoords = getSalonCoordinates(a);
            const bCoords = getSalonCoordinates(b);
            const aDistance = aCoords ? distanceBetweenMeters(state.userLocation, aCoords) : Number.MAX_SAFE_INTEGER;
            const bDistance = bCoords ? distanceBetweenMeters(state.userLocation, bCoords) : Number.MAX_SAFE_INTEGER;
            return aDistance - bDistance;
        });
    }

    function formatDistanceLabel(salon) {
        if (!state.userLocation) return getSalonLocation(salon);
        const coords = getSalonCoordinates(salon);
        if (!coords) return getSalonLocation(salon);
        const distance = distanceBetweenMeters(state.userLocation, coords);
        if (distance >= 1000) return `${(distance / 1000).toFixed(1)} km away`;
        return `${Math.round(distance)} m away`;
    }

    function bannerStyle(index, salon) {
        if (salon && salon.banner_url) {
            return `background-image: linear-gradient(rgba(0,0,0,0.18), rgba(0,0,0,0.18)), url('${salon.banner_url}');`;
        }

        const gradients = [
            'linear-gradient(145deg, #050505 0%, #2f2f2f 100%)',
            'linear-gradient(145deg, #111111 0%, #454545 100%)',
            'linear-gradient(145deg, #171717 0%, #636363 100%)',
            'linear-gradient(145deg, #0e0e0e 0%, #3a3a3a 100%)'
        ];
        return `background-image: ${gradients[index % gradients.length]};`;
    }

    function renderCarousel() {
        const featuredSalons = sortedSalons().slice(0, 2);
        const slides = [
            {
                title: 'Here will be the adds.',
                body: 'Premium placements for salons and partner brands rotate here every 4 seconds.'
            },
            {
                title: featuredSalons[0] ? featuredSalons[0].name : 'Nearest chair first',
                body: featuredSalons[0] ? `${getSalonLocation(featuredSalons[0])} • ${getSalonWaitTime(featuredSalons[0])}` : 'Turn on location and ZLon moves the closest salons to the top.'
            },
            {
                title: featuredSalons[1] ? featuredSalons[1].name : 'Salon owners can join here',
                body: featuredSalons[1] ? `${getSalonLocation(featuredSalons[1])} • ${getSalonType(featuredSalons[1])}` : 'Featured salon slots can be used for salon adds and priority discovery.'
            }
        ];

        els.carouselTrack.innerHTML = slides.map((slide, index) => {
            return `<article class="slide" style="${bannerStyle(index)}"><h2>${escapeHtml(slide.title)}</h2><p>${escapeHtml(slide.body)}</p></article>`;
        }).join('');

        els.carouselDots.innerHTML = slides.map((_, index) => {
            const active = index === state.carouselIndex ? 'is-active' : '';
            return `<button class="${active}" data-dot-index="${index}" type="button" aria-label="Slide ${index + 1}"></button>`;
        }).join('');

        moveCarousel();
        resetCarouselTimer();
    }

    function moveCarousel() {
        const slideCount = Math.max(els.carouselTrack.children.length, 1);
        state.carouselIndex = ((state.carouselIndex % slideCount) + slideCount) % slideCount;
        els.carouselTrack.style.transform = `translateX(${-100 * state.carouselIndex}%)`;
        Array.from(els.carouselDots.children).forEach((button, index) => {
            button.classList.toggle('is-active', index === state.carouselIndex);
        });
    }

    function resetCarouselTimer() {
        window.clearInterval(state.carouselTimer);
        state.carouselTimer = window.setInterval(() => {
            state.carouselIndex += 1;
            moveCarousel();
        }, 4000);
    }

    function renderHomeRail() {
        const items = sortedSalons().slice(0, 6);
        els.nearbyRail.innerHTML = items.map((salon, index) => {
            return `<button class="salon-mini-card" data-salon-action="open" data-salon-id="${escapeHtml(getSalonKey(salon))}" type="button"><div class="salon-banner" style="${bannerStyle(index, salon)}"></div><strong>${escapeHtml(salon.name || 'ZLon Salon')}</strong><span>${escapeHtml(formatDistanceLabel(salon))}</span></button>`;
        }).join('');
    }

    function renderSalonList() {
        const search = els.salonSearchInput.value.trim().toLowerCase();
        const results = sortedSalons().filter((salon) => {
            const haystack = `${salon.name || ''} ${getSalonLocation(salon)} ${salon.city || ''}`.toLowerCase();
            if (!haystack.includes(search)) return false;
            if (state.filter === 'premium' && getSalonType(salon) !== 'premium') return false;
            if (state.filter === 'open' && !isAvailableSalon(salon)) return false;
            if (state.filter === 'nearby' && state.userLocation) {
                const coords = getSalonCoordinates(salon);
                return coords ? distanceBetweenMeters(state.userLocation, coords) <= 5000 : false;
            }
            return true;
        });

        if (!results.length) {
            els.salonResults.innerHTML = '<div class="history-empty">No salons matched that search. Try another name, area, or filter.</div>';
            return;
        }

        els.salonResults.innerHTML = results.map((salon, index) => {
            const phone = getSalonPhone(salon);
            const bookLabel = phone ? 'Book on WhatsApp' : 'Request booking';
            return `<article class="salon-list-card"><div class="salon-list-banner" style="${bannerStyle(index, salon)}"></div><strong>${escapeHtml(textOrFallback(salon.name, 'ZLon Salon'))}</strong><p>${escapeHtml(getSalonLocation(salon))}</p><span>${escapeHtml(formatDistanceLabel(salon))} • ${escapeHtml(getSalonWaitTime(salon))}</span><div class="salon-list-footer"><span>${escapeHtml(getSalonType(salon) === 'premium' ? 'Premium partner' : 'Open discovery')}</span><button class="secondary-button" data-salon-action="book" data-salon-id="${escapeHtml(getSalonKey(salon))}" type="button">${bookLabel}</button></div></article>`;
        }).join('');
    }

    function renderHistory() {
        if (!state.history.length) {
            els.historyList.innerHTML = '<div class="history-empty">No bookings yet. Tap Book now and your salon history will appear here.</div>';
            return;
        }

        els.historyList.innerHTML = state.history.slice().reverse().map((entry, index) => {
            return `<article class="salon-list-card"><div class="salon-list-banner" style="${bannerStyle(index)}"></div><strong>${escapeHtml(entry.name)}</strong><p>${escapeHtml(entry.location)}</p><span>${escapeHtml(new Date(entry.bookedAt).toLocaleString())}</span></article>`;
        }).join('');
    }

    function renderWalletPreview() {
        els.walletBalancePreview.textContent = `Balance Rs ${state.walletBalance} • Amazon Pay connection ready for next step.`;
    }

    function renderWallet() {
        els.walletBalanceText.textContent = `Balance: Rs ${state.walletBalance}`;
    }

    function renderAccount() {
        const user = state.session ? state.session.user : null;
        const phone = user && user.phone ? user.phone : textOrFallback(state.pendingPhone, 'Not available');
        const email = user && user.email ? user.email : 'Phone-auth customer';
        els.accountNameText.textContent = user && user.user_metadata && user.user_metadata.full_name
            ? user.user_metadata.full_name
            : 'My Account';
        els.accountMetaText.textContent = email;
        els.accountPhoneText.textContent = phone;
    }

    function renderHome() {
        renderCarousel();
        renderHomeRail();
        renderWalletPreview();
        renderHistory();
        syncLocationLabels();
    }

    function syncLocationLabels() {
        els.homeLocationLabel.textContent = state.locationLabel;
        els.bookLocationLabel.textContent = state.locationLabel;
        els.historyLocationLabel.textContent = state.locationLabel;
    }

    async function refreshLocation() {
        if (!navigator.geolocation) {
            state.locationLabel = LOCATION_FALLBACK;
            syncLocationLabels();
            return;
        }

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition((position) => {
                state.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                const nearest = sortedSalons()[0];
                state.locationLabel = nearest ? getSalonLocation(nearest) : 'Current location';
                syncLocationLabels();
                resolve();
            }, () => {
                state.locationLabel = LOCATION_FALLBACK;
                syncLocationLabels();
                resolve();
            }, {
                enableHighAccuracy: true,
                timeout: 9000,
                maximumAge: 60000
            });
        });
    }

    async function loadSalons() {
        if (!state.db) {
            renderHome();
            return;
        }

        const { data, error } = await state.db
            .from('salons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error || !Array.isArray(data) || !data.length) {
            renderHome();
            return;
        }

        state.salons = data;
        if (state.userLocation) {
            const nearest = sortedSalons()[0];
            state.locationLabel = nearest ? getSalonLocation(nearest) : 'Current location';
            syncLocationLabels();
        }
        renderHome();
        if (state.activeView === 'book') {
            renderSalonList();
        }
    }

    async function completeCustomerSession(session) {
        if (!session || !session.user) {
            setAuthStatus('Session could not be created. Try again.', 'error');
            return;
        }

        state.session = session;
        state.pendingPhone = session.user.phone || state.pendingPhone;
        state.pendingEmail = session.user.email || state.pendingEmail;

        if (namespace.authRoutes) {
            const resolved = await namespace.authRoutes.resolveUserType(state.db, session);
            state.userType = resolved || 'customer';
            if (state.userType === 'owner') {
                window.location.replace(namespace.authRoutes.portalUrl());
                return;
            }
            if (!state.sessionSyncInFlight) {
                state.sessionSyncInFlight = true;
                await namespace.authRoutes.syncProfile(state.db, session.user, 'customer', session.user.phone || state.pendingPhone || null);
                state.sessionSyncInFlight = false;
            }
        }

        await Promise.all([loadSalons(), refreshLocation()]);
        renderAccount();
        setActiveView('home');
    }

    async function startInitialSessionFlow() {
        if (!state.db || !namespace.authRoutes) {
            setActiveView('auth');
            showAuthStep('phone-entry');
            return;
        }

        const session = await namespace.authRoutes.getSession(state.db);
        if (!session) {
            setActiveView('auth');
            showAuthStep('phone-entry');
            return;
        }

        await completeCustomerSession(session);
    }

    async function sendPhoneOtp() {
        const phone = toIndianPhone(els.phoneNumberInput.value);
        if (!phone) {
            setAuthStatus('Enter a valid 10-digit mobile number.', 'error');
            return;
        }
        if (!state.db) {
            setAuthStatus('Supabase is not configured yet.', 'error');
            return;
        }

        setAuthBusy(true);
        const { error } = await state.db.auth.signInWithOtp({
            phone,
            options: {
                shouldCreateUser: true,
                data: { user_type: 'customer' }
            }
        });
        setAuthBusy(false);

        if (error) {
            setAuthStatus(error.message, 'error');
            return;
        }

        state.pendingPhone = phone;
        els.phoneOtpPreview.textContent = formatPhonePreview(phone);
        showAuthStep('phone-otp');
        setAuthStatus('OTP sent. Your number is locked for this step.', 'success');
    }

    async function resendPhoneOtp() {
        if (!state.pendingPhone) return;
        if (!state.db) return;

        setAuthBusy(true);
        const { error } = await state.db.auth.signInWithOtp({
            phone: state.pendingPhone,
            options: {
                shouldCreateUser: true,
                data: { user_type: 'customer' }
            }
        });
        setAuthBusy(false);

        if (error) {
            setAuthStatus(error.message, 'error');
            return;
        }

        setAuthStatus('OTP resent.', 'success');
    }

    async function verifyPhoneOtp() {
        const token = els.phoneOtpInput.value.trim();
        if (token.length !== 6) {
            setAuthStatus('Enter the 6-digit OTP.', 'error');
            return;
        }
        if (!state.db) return;

        setAuthBusy(true);
        const response = await state.db.auth.verifyOtp({
            phone: state.pendingPhone,
            token,
            type: 'sms'
        });
        setAuthBusy(false);

        if (response.error) {
            setAuthStatus(response.error.message, 'error');
            return;
        }

        await completeCustomerSession(response.data ? response.data.session : null);
    }

    async function sendEmailOtpCode(email) {
        return state.db.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: false
            }
        });
    }

    async function beginEmailAccess() {
        const email = els.emailAddressInput.value.trim();
        const password = els.emailPasswordInput.value.trim();
        if (!email || !password) {
            setAuthStatus('Enter email and password to continue.', 'error');
            return;
        }
        if (!state.db) {
            setAuthStatus('Supabase is not configured yet.', 'error');
            return;
        }

        setAuthBusy(true);
        state.suppressAuthListener = true;
        let credentialError = null;

        if (state.emailMode === 'signup') {
            const signUp = await state.db.auth.signUp({
                email,
                password,
                options: {
                    data: { user_type: 'customer' }
                }
            });
            credentialError = signUp.error || null;
        } else {
            const signIn = await state.db.auth.signInWithPassword({
                email,
                password
            });
            credentialError = signIn.error || null;
        }

        if (credentialError) {
            state.suppressAuthListener = false;
            setAuthBusy(false);
            setAuthStatus(credentialError.message, 'error');
            return;
        }

        await state.db.auth.signOut();
        const otp = await sendEmailOtpCode(email);
        state.suppressAuthListener = false;
        setAuthBusy(false);

        if (otp.error) {
            setAuthStatus(otp.error.message, 'error');
            return;
        }

        state.pendingEmail = email;
        els.emailOtpPreview.textContent = email;
        showAuthStep('email-otp');
        setAuthStatus('OTP sent to your email.', 'success');
    }

    async function resendEmailOtp() {
        if (!state.pendingEmail || !state.db) return;
        setAuthBusy(true);
        const otp = await sendEmailOtpCode(state.pendingEmail);
        setAuthBusy(false);
        if (otp.error) {
            setAuthStatus(otp.error.message, 'error');
            return;
        }
        setAuthStatus('OTP resent.', 'success');
    }

    async function verifyEmailOtp() {
        const token = els.emailOtpInput.value.trim();
        if (token.length !== 6) {
            setAuthStatus('Enter the 6-digit OTP.', 'error');
            return;
        }
        if (!state.db) return;

        setAuthBusy(true);
        const response = await state.db.auth.verifyOtp({
            email: state.pendingEmail,
            token,
            type: 'email'
        });
        setAuthBusy(false);

        if (response.error) {
            setAuthStatus(response.error.message, 'error');
            return;
        }

        await completeCustomerSession(response.data ? response.data.session : null);
    }

    async function startOAuth(provider) {
        if (!state.db) {
            setAuthStatus('Supabase is not configured yet.', 'error');
            return;
        }

        setAuthBusy(true);
        const redirectTo = namespace.authRoutes ? namespace.authRoutes.homeUrl() : window.location.href;
        const { error } = await state.db.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo,
                queryParams: {
                    prompt: 'select_account'
                }
            }
        });

        if (error) {
            setAuthBusy(false);
            setAuthStatus(error.message, 'error');
        }
    }

    function buildBookingLink(salon) {
        const phone = getSalonPhone(salon);
        const message = encodeURIComponent(`Hi, I want to book a slot at ${salon.name || 'your salon'} via ZLon.`);
        if (phone) {
            return `https://wa.me/${phone}?text=${message}`;
        }
        return `mailto:support@zlon.in?subject=${encodeURIComponent('ZLon booking request')}&body=${message}`;
    }

    function addHistoryEntry(salon) {
        state.history.push({
            id: getSalonKey(salon),
            name: textOrFallback(salon.name, 'ZLon Salon'),
            location: getSalonLocation(salon),
            bookedAt: new Date().toISOString()
        });
        saveJson(HISTORY_KEY, state.history);
        renderHistory();
    }

    function bookSalonById(salonId) {
        const salon = state.salons.find((item) => getSalonKey(item) === salonId);
        if (!salon) return;
        addHistoryEntry(salon);
        window.open(buildBookingLink(salon), '_blank', 'noopener');
    }

    function openSalonById(salonId) {
        els.salonSearchInput.value = '';
        setActiveView('book');
        const salon = state.salons.find((item) => getSalonKey(item) === salonId);
        if (!salon) return;
        els.salonSearchInput.value = salon.name || '';
        renderSalonList();
    }

    function openProfileSheet() {
        els.profileSheet.hidden = false;
    }

    function closeProfileSheet() {
        els.profileSheet.hidden = true;
    }

    async function logout() {
        if (state.db) {
            await state.db.auth.signOut();
        }
        state.session = null;
        state.userType = 'customer';
        state.pendingPhone = '';
        state.pendingEmail = '';
        els.phoneNumberInput.value = '';
        els.phoneOtpInput.value = '';
        els.emailAddressInput.value = '';
        els.emailPasswordInput.value = '';
        els.emailOtpInput.value = '';
        showAuthStep('phone-entry');
        setActiveView('auth');
        showToast('Signed out.');
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function bindEvents() {
        els.phoneContinueButton.addEventListener('click', sendPhoneOtp);
        els.phoneBackButton.addEventListener('click', () => showAuthStep('phone-entry'));
        els.phoneResendButton.addEventListener('click', resendPhoneOtp);
        els.phoneVerifyButton.addEventListener('click', verifyPhoneOtp);
        els.googleAuthButton.addEventListener('click', () => startOAuth('google'));
        els.appleAuthButton.addEventListener('click', () => startOAuth('apple'));
        els.showEmailAuthButton.addEventListener('click', () => showAuthStep('email-entry'));
        els.emailLoginModeButton.addEventListener('click', () => setEmailMode('login'));
        els.emailSignupModeButton.addEventListener('click', () => setEmailMode('signup'));
        els.emailBackToPhoneButton.addEventListener('click', () => showAuthStep('phone-entry'));
        els.emailContinueButton.addEventListener('click', beginEmailAccess);
        els.emailOtpBackButton.addEventListener('click', () => showAuthStep('email-entry'));
        els.emailResendButton.addEventListener('click', resendEmailOtp);
        els.emailVerifyButton.addEventListener('click', verifyEmailOtp);
        els.profileButton.addEventListener('click', openProfileSheet);
        els.historyProfileButton.addEventListener('click', openProfileSheet);
        els.profileSheetOverlay.addEventListener('click', closeProfileSheet);
        els.walletShortcutButton.addEventListener('click', () => setActiveView('wallet'));
        els.walletRechargeButton.addEventListener('click', () => {
            state.walletBalance += 500;
            saveJson(WALLET_KEY, state.walletBalance);
            renderWalletPreview();
            renderWallet();
            showToast('Wallet recharged with Rs 500.');
        });
        els.bookNowButton.addEventListener('click', () => setActiveView('book'));
        els.seeAllSalonsButton.addEventListener('click', () => setActiveView('book'));
        els.bookBackButton.addEventListener('click', () => setActiveView('home'));
        els.walletBackButton.addEventListener('click', () => setActiveView('home'));
        els.accountBackButton.addEventListener('click', () => setActiveView('home'));
        [els.homeLocationButton, els.historyLocationButton].forEach((button) => {
            button.addEventListener('click', refreshLocation);
        });
        els.salonSearchInput.addEventListener('input', renderSalonList);
        els.filterToggleButton.addEventListener('click', () => {
            els.filterBar.hidden = !els.filterBar.hidden;
        });
        els.filterBar.addEventListener('click', (event) => {
            const button = event.target.closest('[data-filter]');
            if (!button) return;
            state.filter = button.getAttribute('data-filter');
            Array.from(els.filterBar.children).forEach((chip) => {
                chip.classList.toggle('is-active', chip === button);
            });
            renderSalonList();
        });
        els.carouselPrevButton.addEventListener('click', () => {
            state.carouselIndex -= 1;
            moveCarousel();
            resetCarouselTimer();
        });
        els.carouselNextButton.addEventListener('click', () => {
            state.carouselIndex += 1;
            moveCarousel();
            resetCarouselTimer();
        });
        els.carouselDots.addEventListener('click', (event) => {
            const button = event.target.closest('[data-dot-index]');
            if (!button) return;
            state.carouselIndex = Number(button.getAttribute('data-dot-index')) || 0;
            moveCarousel();
            resetCarouselTimer();
        });
        els.nearbyRail.addEventListener('click', (event) => {
            const button = event.target.closest('[data-salon-action="open"]');
            if (!button) return;
            openSalonById(button.getAttribute('data-salon-id'));
        });
        els.salonResults.addEventListener('click', (event) => {
            const button = event.target.closest('[data-salon-action="book"]');
            if (!button) return;
            bookSalonById(button.getAttribute('data-salon-id'));
        });
        els.navButtons.forEach((button) => {
            button.addEventListener('click', () => {
                setActiveView(button.getAttribute('data-nav'));
            });
        });
        els.sheetButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-sheet-action');
                if (action === 'account') setActiveView('account');
                if (action === 'book') setActiveView('book');
                if (action === 'history') setActiveView('history');
                if (action === 'wallet') setActiveView('wallet');
                if (action === 'logout') logout();
            });
        });

        if (state.db) {
            state.db.auth.onAuthStateChange(async (event, session) => {
                if (state.suppressAuthListener) {
                    return;
                }

                if (event === 'SIGNED_OUT' || !session) {
                    state.session = null;
                    setActiveView('auth');
                    showAuthStep('phone-entry');
                    return;
                }

                if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
                    await completeCustomerSession(session);
                }
            });
        }
    }

    async function init() {
        state.db = safeSupabaseClient();
        bindEvents();
        renderWalletPreview();
        renderHome();
        renderWallet();
        renderAccount();

        if (isBusinessHost()) {
            window.location.replace(namespace.authRoutes ? namespace.authRoutes.loginUrl() : '/login.html');
            return;
        }

        if (isCanonicalRedirectNeeded()) {
            window.location.replace(namespace.authRoutes.canonicalCustomerUrl('/'));
            return;
        }

        await playSplash();
        await startInitialSessionFlow();
    }

    document.addEventListener('DOMContentLoaded', init);
})();

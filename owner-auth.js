(function () {
    const namespace = window.ZLon = window.ZLon || {};
    const state = {
        db: null,
        provider: 'phone',
        emailMode: 'login',
        pendingPhone: '',
        pendingEmail: '',
        busy: false,
        suppressAuthListener: false
    };

    const els = {
        ownerPhoneTab: document.getElementById('ownerPhoneTab'),
        ownerGoogleTab: document.getElementById('ownerGoogleTab'),
        ownerEmailTab: document.getElementById('ownerEmailTab'),
        ownerPhoneStep: document.getElementById('ownerPhoneStep'),
        ownerPhoneOtpStep: document.getElementById('ownerPhoneOtpStep'),
        ownerGoogleStep: document.getElementById('ownerGoogleStep'),
        ownerEmailStep: document.getElementById('ownerEmailStep'),
        ownerEmailOtpStep: document.getElementById('ownerEmailOtpStep'),
        ownerPhoneInput: document.getElementById('ownerPhoneInput'),
        ownerPhoneContinueButton: document.getElementById('ownerPhoneContinueButton'),
        ownerPhonePreview: document.getElementById('ownerPhonePreview'),
        ownerPhoneOtpInput: document.getElementById('ownerPhoneOtpInput'),
        ownerPhoneBackButton: document.getElementById('ownerPhoneBackButton'),
        ownerPhoneResendButton: document.getElementById('ownerPhoneResendButton'),
        ownerPhoneVerifyButton: document.getElementById('ownerPhoneVerifyButton'),
        ownerGoogleContinueButton: document.getElementById('ownerGoogleContinueButton'),
        ownerAppleContinueButton: document.getElementById('ownerAppleContinueButton'),
        ownerEmailLoginModeButton: document.getElementById('ownerEmailLoginModeButton'),
        ownerEmailSignupModeButton: document.getElementById('ownerEmailSignupModeButton'),
        ownerEmailInput: document.getElementById('ownerEmailInput'),
        ownerPasswordInput: document.getElementById('ownerPasswordInput'),
        ownerEmailContinueButton: document.getElementById('ownerEmailContinueButton'),
        ownerEmailPreview: document.getElementById('ownerEmailPreview'),
        ownerEmailOtpInput: document.getElementById('ownerEmailOtpInput'),
        ownerEmailBackButton: document.getElementById('ownerEmailBackButton'),
        ownerEmailResendButton: document.getElementById('ownerEmailResendButton'),
        ownerEmailVerifyButton: document.getElementById('ownerEmailVerifyButton'),
        ownerStatus: document.getElementById('ownerStatus')
    };

    function safeSupabaseClient() {
        try {
            return namespace.getSupabaseClient();
        } catch (error) {
            console.warn(error.message);
            return null;
        }
    }

    function ownerPortalUrl() {
        return namespace.authRoutes ? namespace.authRoutes.portalUrl() : '/dashboard.html';
    }

    function setStatus(message, tone) {
        els.ownerStatus.textContent = message || '';
        els.ownerStatus.className = 'status-text';
        if (tone === 'error') {
            els.ownerStatus.classList.add('is-error');
        }
        if (tone === 'success') {
            els.ownerStatus.classList.add('is-success');
        }
    }

    function setBusy(isBusy) {
        state.busy = isBusy;
        [
            els.ownerPhoneTab,
            els.ownerGoogleTab,
            els.ownerEmailTab,
            els.ownerPhoneContinueButton,
            els.ownerPhoneBackButton,
            els.ownerPhoneResendButton,
            els.ownerPhoneVerifyButton,
            els.ownerGoogleContinueButton,
            els.ownerAppleContinueButton,
            els.ownerEmailLoginModeButton,
            els.ownerEmailSignupModeButton,
            els.ownerEmailContinueButton,
            els.ownerEmailBackButton,
            els.ownerEmailResendButton,
            els.ownerEmailVerifyButton
        ].forEach((element) => {
            if (element) element.disabled = isBusy;
        });
    }

    function setProvider(provider) {
        state.provider = provider;
        els.ownerPhoneTab.classList.toggle('is-active', provider === 'phone');
        els.ownerGoogleTab.classList.toggle('is-active', provider === 'google');
        els.ownerEmailTab.classList.toggle('is-active', provider === 'email');

        els.ownerPhoneStep.hidden = provider !== 'phone';
        els.ownerPhoneOtpStep.hidden = true;
        els.ownerGoogleStep.hidden = provider !== 'google';
        els.ownerEmailStep.hidden = provider !== 'email';
        els.ownerEmailOtpStep.hidden = true;
        setStatus('');
    }

    function showOwnerPhoneOtp() {
        els.ownerPhoneStep.hidden = true;
        els.ownerPhoneOtpStep.hidden = false;
        els.ownerGoogleStep.hidden = true;
        els.ownerEmailStep.hidden = true;
        els.ownerEmailOtpStep.hidden = true;
    }

    function showOwnerEmailOtp() {
        els.ownerPhoneStep.hidden = true;
        els.ownerPhoneOtpStep.hidden = true;
        els.ownerGoogleStep.hidden = true;
        els.ownerEmailStep.hidden = true;
        els.ownerEmailOtpStep.hidden = false;
    }

    function showOwnerEmailEntry() {
        setProvider('email');
        els.ownerEmailStep.hidden = false;
        els.ownerEmailOtpStep.hidden = true;
    }

    function setEmailMode(mode) {
        state.emailMode = mode === 'signup' ? 'signup' : 'login';
        els.ownerEmailLoginModeButton.classList.toggle('is-active', state.emailMode === 'login');
        els.ownerEmailSignupModeButton.classList.toggle('is-active', state.emailMode === 'signup');
    }

    function normalizeIndianPhone(raw) {
        const digits = String(raw || '').replace(/\D/g, '');
        if (!digits) return '';
        const normalized = digits.length > 10 ? digits.slice(-10) : digits;
        if (normalized.length !== 10) return '';
        return `+91${normalized}`;
    }

    function normalizeDigits(raw) {
        return String(raw || '').replace(/\D/g, '');
    }

    async function fetchSalonDirectory() {
        const response = await state.db.from('salons').select('*').limit(300);
        if (response.error || !Array.isArray(response.data)) {
            return [];
        }
        return response.data;
    }

    function findSalonCandidate(salons, user) {
        const ownerEmail = String(user.email || '').trim().toLowerCase();
        const ownerPhone = normalizeDigits(user.phone || user.user_metadata && user.user_metadata.phone);

        return salons.find((salon) => {
            const emailMatches = ownerEmail && [
                salon.owner_email,
                salon.email
            ].some((value) => String(value || '').trim().toLowerCase() === ownerEmail);

            const phoneMatches = ownerPhone && [
                salon.owner_phone,
                salon.phone,
                salon.whatsapp,
                salon.waNumber,
                salon.phone_number
            ].some((value) => normalizeDigits(value) === ownerPhone || normalizeDigits(value).slice(-10) === ownerPhone.slice(-10));

            return emailMatches || phoneMatches;
        });
    }

    async function claimOwnerSalon(user) {
        const owned = await state.db
            .from('salons')
            .select('*')
            .eq('owner_id', user.id)
            .limit(1);

        if (!owned.error && owned.data && owned.data.length) {
            return { linked: true, salon: owned.data[0] };
        }

        const salons = await fetchSalonDirectory();
        const candidate = findSalonCandidate(salons, user);

        if (!candidate) {
            return {
                linked: false,
                message: 'No salon matched this owner email or phone yet. Add the same contact to your salon record and try again.'
            };
        }

        if (candidate.owner_id && candidate.owner_id !== user.id) {
            return {
                linked: false,
                message: 'This salon is already linked to another owner account.'
            };
        }

        const claimed = await state.db
            .from('salons')
            .update({ owner_id: user.id })
            .eq('id', candidate.id)
            .select('*')
            .limit(1);

        if (claimed.error || !claimed.data || !claimed.data.length) {
            return {
                linked: false,
                message: claimed.error ? claimed.error.message : 'Salon was found but could not be linked.'
            };
        }

        return { linked: true, salon: claimed.data[0] };
    }

    async function completeOwnerSession(session) {
        if (!session || !session.user) {
            setBusy(false);
            setStatus('Session could not be created. Try again.', 'error');
            return;
        }

        const claim = await claimOwnerSalon(session.user);
        if (!claim.linked) {
            await state.db.auth.signOut();
            setBusy(false);
            setStatus(claim.message, 'error');
            return;
        }

        if (namespace.authRoutes) {
            await namespace.authRoutes.syncProfile(
                state.db,
                session.user,
                'owner',
                session.user.phone || state.pendingPhone || null
            );
        }

        window.location.replace(ownerPortalUrl());
    }

    async function sendOwnerPhoneOtp() {
        const phone = normalizeIndianPhone(els.ownerPhoneInput.value);
        if (!phone) {
            setStatus('Enter a valid 10-digit owner number.', 'error');
            return;
        }
        if (!state.db) {
            setStatus('Supabase is not configured yet.', 'error');
            return;
        }

        setBusy(true);
        const { error } = await state.db.auth.signInWithOtp({
            phone,
            options: {
                shouldCreateUser: true,
                data: { user_type: 'owner' }
            }
        });
        setBusy(false);

        if (error) {
            setStatus(error.message, 'error');
            return;
        }

        state.pendingPhone = phone;
        els.ownerPhonePreview.textContent = phone;
        showOwnerPhoneOtp();
        setStatus('OTP sent to your owner number.', 'success');
    }

    async function resendOwnerPhoneOtp() {
        if (!state.pendingPhone || !state.db) return;
        setBusy(true);
        const { error } = await state.db.auth.signInWithOtp({
            phone: state.pendingPhone,
            options: {
                shouldCreateUser: true,
                data: { user_type: 'owner' }
            }
        });
        setBusy(false);

        if (error) {
            setStatus(error.message, 'error');
            return;
        }

        setStatus('OTP resent.', 'success');
    }

    async function verifyOwnerPhoneOtp() {
        const token = els.ownerPhoneOtpInput.value.trim();
        if (token.length !== 6) {
            setStatus('Enter the 6-digit OTP.', 'error');
            return;
        }
        if (!state.db) return;

        setBusy(true);
        const response = await state.db.auth.verifyOtp({
            phone: state.pendingPhone,
            token,
            type: 'sms'
        });

        if (response.error) {
            setBusy(false);
            setStatus(response.error.message, 'error');
            return;
        }

        await completeOwnerSession(response.data ? response.data.session : null);
    }

    async function sendOwnerEmailCode(email) {
        return state.db.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: false,
                emailRedirectTo: namespace.authRoutes ? namespace.authRoutes.loginUrl() : window.location.href
            }
        });
    }

    async function beginOwnerEmailAccess() {
        const email = els.ownerEmailInput.value.trim();
        const password = els.ownerPasswordInput.value.trim();
        if (!email || !password) {
            setStatus('Enter owner email and password to continue.', 'error');
            return;
        }
        if (!state.db) {
            setStatus('Supabase is not configured yet.', 'error');
            return;
        }

        setBusy(true);
        state.suppressAuthListener = true;
        let credentialError = null;

        if (state.emailMode === 'signup') {
            const signUp = await state.db.auth.signUp({
                email,
                password,
                options: {
                    data: { user_type: 'owner' }
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
            setBusy(false);
            setStatus(credentialError.message, 'error');
            return;
        }

        await state.db.auth.signOut();
        const otp = await sendOwnerEmailCode(email);
        state.suppressAuthListener = false;
        setBusy(false);

        if (otp.error) {
            setStatus(otp.error.message, 'error');
            return;
        }

        state.pendingEmail = email;
        els.ownerEmailPreview.textContent = email;
        showOwnerEmailOtp();
        setStatus('OTP sent to your owner email.', 'success');
    }

    async function resendOwnerEmailOtp() {
        if (!state.pendingEmail || !state.db) return;
        setBusy(true);
        const otp = await sendOwnerEmailCode(state.pendingEmail);
        setBusy(false);
        if (otp.error) {
            setStatus(otp.error.message, 'error');
            return;
        }
        setStatus('OTP resent.', 'success');
    }

    async function verifyOwnerEmailOtp() {
        const token = els.ownerEmailOtpInput.value.trim();
        if (token.length !== 6) {
            setStatus('Enter the 6-digit OTP.', 'error');
            return;
        }
        if (!state.db) return;

        setBusy(true);
        const response = await state.db.auth.verifyOtp({
            email: state.pendingEmail,
            token,
            type: 'email'
        });

        if (response.error) {
            setBusy(false);
            setStatus(response.error.message, 'error');
            return;
        }

        await completeOwnerSession(response.data ? response.data.session : null);
    }

    async function startOwnerOAuth(provider) {
        if (!state.db) {
            setStatus('Supabase is not configured yet.', 'error');
            return;
        }

        setBusy(true);
        const redirectTo = namespace.authRoutes ? namespace.authRoutes.loginUrl() : window.location.href;
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
            setBusy(false);
            setStatus(error.message, 'error');
        }
    }

    function bindEvents() {
        els.ownerPhoneTab.addEventListener('click', () => setProvider('phone'));
        els.ownerGoogleTab.addEventListener('click', () => setProvider('google'));
        els.ownerEmailTab.addEventListener('click', () => showOwnerEmailEntry());
        els.ownerPhoneContinueButton.addEventListener('click', sendOwnerPhoneOtp);
        els.ownerPhoneBackButton.addEventListener('click', () => setProvider('phone'));
        els.ownerPhoneResendButton.addEventListener('click', resendOwnerPhoneOtp);
        els.ownerPhoneVerifyButton.addEventListener('click', verifyOwnerPhoneOtp);
        els.ownerGoogleContinueButton.addEventListener('click', () => startOwnerOAuth('google'));
        els.ownerAppleContinueButton.addEventListener('click', () => startOwnerOAuth('apple'));
        els.ownerEmailLoginModeButton.addEventListener('click', () => setEmailMode('login'));
        els.ownerEmailSignupModeButton.addEventListener('click', () => setEmailMode('signup'));
        els.ownerEmailContinueButton.addEventListener('click', beginOwnerEmailAccess);
        els.ownerEmailBackButton.addEventListener('click', showOwnerEmailEntry);
        els.ownerEmailResendButton.addEventListener('click', resendOwnerEmailOtp);
        els.ownerEmailVerifyButton.addEventListener('click', verifyOwnerEmailOtp);

        if (state.db) {
            state.db.auth.onAuthStateChange(async (event, session) => {
                if (state.suppressAuthListener) {
                    return;
                }

                if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
                    await completeOwnerSession(session);
                }
            });
        }
    }

    async function init() {
        state.db = safeSupabaseClient();
        bindEvents();
        setProvider('phone');
        setEmailMode('login');

        if (
            namespace.authRoutes &&
            namespace.authRoutes.shouldUseBusinessLoginHost &&
            namespace.authRoutes.shouldUseBusinessLoginHost() &&
            !namespace.authRoutes.isBusinessPortalHost()
        ) {
            window.location.replace(namespace.authRoutes.loginUrl());
            return;
        }

        if (!state.db || !namespace.authRoutes) {
            setStatus('Supabase auth is not configured yet.', 'error');
            return;
        }

        const session = await namespace.authRoutes.getSession(state.db);
        if (!session) {
            return;
        }

        setBusy(true);
        await completeOwnerSession(session);
    }

    document.addEventListener('DOMContentLoaded', init);
})();

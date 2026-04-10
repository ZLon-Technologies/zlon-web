// @ts-nocheck
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppleIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  FilterIcon,
  GoogleIcon,
  HistoryIcon,
  HomeIcon,
  MailIcon,
  PinIcon,
  ProfileIcon,
  SearchIcon,
  WalletIcon
} from '@/components/icons';
import { OtpInput } from '@/components/otp-input';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getSession, resolveUserType, syncProfile, toE164Phone } from '@/lib/zlon/auth';
import { AUTH_BOOTSTRAP_TIMEOUT_MS, getErrorMessage, getSafeAuthStep, withTimeout } from '@/lib/zlon/auth-ui';
import { businessUrl } from '@/lib/zlon/hosts';
import {
  FALLBACK_SALONS,
  fetchSalons,
  formatDistanceLabel,
  getSalonKey,
  getSalonLocation,
  getSalonPhone,
  getSalonType,
  getSalonWaitTime,
  isAvailableSalon,
  sortSalonsByDistance
} from '@/lib/zlon/salons';

const HISTORY_KEY = 'zlon.consumer.history';
const WALLET_KEY = 'zlon.consumer.wallet';
const SCREEN_KEY = 'zlon.consumer.screen';
const LOCATION_FALLBACK = 'Location auto select';
const COUNTRY_OPTIONS = [
  { flag: '🇮🇳', code: '+91', label: 'India' },
  { flag: '🇦🇪', code: '+971', label: 'UAE' },
  { flag: '🇺🇸', code: '+1', label: 'USA' }
];

function readStorage(key, fallback) {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeStorage(key, value) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function readLastScreen() {
  if (typeof window === 'undefined') {
    return 'home';
  }

  const stored = window.localStorage.getItem(SCREEN_KEY) || 'home';
  return ['home', 'history', 'wallet', 'profile', 'book'].includes(stored) ? stored : 'home';
}

function formatReadonlyContact(countryCode, rawPhone) {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) {
    return countryCode;
  }

  if (digits.length > 5) {
    return `${countryCode} ${digits.slice(0, 5)} ${digits.slice(5)}`.trim();
  }

  return `${countryCode} ${digits}`.trim();
}

function statusClassName(tone) {
  return tone ? `zlon-status is-${tone}` : 'zlon-status';
}

function isToday(value) {
  if (!value) {
    return false;
  }

  const now = new Date();
  const target = new Date(value);
  return now.toDateString() === target.toDateString();
}

function buildBookingLink(salon) {
  const phone = getSalonPhone(salon);
  const message = encodeURIComponent(`Hi, I want to book a slot at ${salon.name || 'your salon'} via ZLon.`);

  if (phone) {
    return `https://wa.me/${phone}?text=${message}`;
  }

  return `mailto:support@zlon.in?subject=${encodeURIComponent('ZLon booking request')}&body=${message}`;
}

export function ConsumerApp() {
  const [splashLeaving, setSplashLeaving] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [screen, setScreen] = useState('auth');
  const [authStep, setAuthStep] = useState('phone');
  const [emailMode, setEmailMode] = useState('login');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [session, setSession] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState('');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [salons, setSalons] = useState(FALLBACK_SALONS);
  const [locationLabel, setLocationLabel] = useState(LOCATION_FALLBACK);
  const [userLocation, setUserLocation] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [history, setHistory] = useState(() => readStorage(HISTORY_KEY, []));
  const [walletBalance, setWalletBalance] = useState(() => Number(readStorage(WALLET_KEY, 0)) || 0);
  const [authBootstrapState, setAuthBootstrapState] = useState('booting');

  const clientRef = useRef(null);
  const toastTimerRef = useRef(null);
  const authSubscriptionRef = useRef(null);
  const suppressAuthListenerRef = useRef(false);

  const sortedSalons = useMemo(() => sortSalonsByDistance(salons, userLocation), [salons, userLocation]);
  const activeAuthStep = getSafeAuthStep(authStep);
  const featuredSlides = useMemo(() => {
    const primary = sortedSalons[0];
    const secondary = sortedSalons[1];

    return [
      {
        title: 'ZLon.',
        body: 'Minimal salon booking with the feel of a premium native service.'
      },
      {
        title: primary ? primary.name : 'Nearest salon',
        body: primary ? `${getSalonLocation(primary)} · ${getSalonWaitTime(primary)}` : 'Turn on location and the closest salon moves to the front.'
      },
      {
        title: 'Feature dock',
        body: secondary ? `${secondary.name} stays one tap away when you want a second option.` : 'Reserved clean space for future feature icons and quick utilities.'
      }
    ];
  }, [sortedSalons]);

  const filteredSalons = useMemo(() => {
    return sortedSalons.filter((salon) => {
      const haystack = `${salon.name || ''} ${getSalonLocation(salon)} ${salon.city || ''}`.toLowerCase();
      const matchesSearch = haystack.includes(searchValue.trim().toLowerCase());
      if (!matchesSearch) {
        return false;
      }

      if (filterValue === 'premium') {
        return getSalonType(salon) === 'premium';
      }

      if (filterValue === 'open') {
        return isAvailableSalon(salon);
      }

      if (filterValue === 'nearby') {
        return Boolean(userLocation);
      }

      return true;
    });
  }, [filterValue, searchValue, sortedSalons, userLocation]);

  function setStatus(message, tone = '') {
    setStatusMessage(message);
    setStatusTone(tone);
  }

  function showToast(message) {
    setToast(message);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast('');
    }, 2800);
  }

  function rememberScreen(nextScreen) {
    if (typeof window === 'undefined' || nextScreen === 'auth') {
      return;
    }

    window.localStorage.setItem(SCREEN_KEY, nextScreen);
  }

  function navigate(nextScreen) {
    setScreen(nextScreen);
    rememberScreen(nextScreen);
  }

  async function requestLocation({ silent = false } = {}) {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationLabel(LOCATION_FALLBACK);
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nextLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(nextLocation);
          resolve(nextLocation);
        },
        () => {
          setUserLocation(null);
          setLocationLabel(LOCATION_FALLBACK);
          if (!silent) {
            showToast('Location unavailable right now.');
          }
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 9000,
          maximumAge: 60000
        }
      );
    });
  }

  async function loadSalonData(nextLocation = userLocation) {
    const client = clientRef.current;
    const nextSalons = await fetchSalons(client, nextLocation);
    setSalons(nextSalons);

    if (nextLocation) {
      const nearest = sortSalonsByDistance(nextSalons, nextLocation)[0];
      setLocationLabel(nearest ? getSalonLocation(nearest) : 'Current location');
    } else {
      setLocationLabel(LOCATION_FALLBACK);
    }
  }

  async function completeCustomerSession(nextSession, { restoreScreen = false } = {}) {
    if (!nextSession?.user) {
      setStatus('Session could not be created. Try again.', 'error');
      return false;
    }

    try {
      const client = clientRef.current;
      if (client) {
        const resolvedType = await resolveUserType(client, nextSession);
        if (resolvedType === 'owner') {
          window.location.replace(businessUrl());
          return true;
        }

        await syncProfile(client, nextSession.user, 'customer', nextSession.user.phone || pendingPhone || null);
      }

      setSession(nextSession);
      setPendingPhone(nextSession.user.phone || pendingPhone);
      setPendingEmail(nextSession.user.email || pendingEmail);
      const nextLocation = await requestLocation({ silent: true });
      await loadSalonData(nextLocation);
      navigate(restoreScreen ? readLastScreen() : 'home');
      return true;
    } catch (error) {
      setScreen('auth');
      setStatus(getErrorMessage(error, 'Could not open your account. You can still sign in manually.'), 'error');
      return false;
    }
  }

  async function initializeApp() {
    setAuthBootstrapState('booting');

    try {
      clientRef.current = getSupabaseBrowserClient();
      const client = clientRef.current;
      const { data } = client.auth.onAuthStateChange(async (event, nextSession) => {
        if (suppressAuthListenerRef.current) {
          return;
        }

        try {
          if (event === 'SIGNED_OUT' || !nextSession) {
            setSession(null);
            setAuthStep('phone');
            setScreen('auth');
            return;
          }

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await completeCustomerSession(nextSession, { restoreScreen: true });
          }
        } catch (error) {
          setScreen('auth');
          setStatus(getErrorMessage(error, 'Could not refresh your session. You can still sign in manually.'), 'error');
        } finally {
          setAuthBootstrapState('ready');
        }
      });

      authSubscriptionRef.current = data.subscription;

      try {
        const existingSession = await withTimeout(
          getSession(client),
          AUTH_BOOTSTRAP_TIMEOUT_MS,
          'Secure session check timed out. You can still sign in manually.'
        );

        if (existingSession) {
          await withTimeout(
            completeCustomerSession(existingSession, { restoreScreen: true }),
            AUTH_BOOTSTRAP_TIMEOUT_MS,
            'Account loading timed out. You can still continue manually.'
          );
          return;
        }
      } catch (sessionError) {
        console.warn('Session check error:', sessionError);
      }

      setScreen('auth');
      setAuthStep('phone');
      try {
        await withTimeout(
          loadSalonData(null),
          AUTH_BOOTSTRAP_TIMEOUT_MS,
          'Salon data is taking longer than expected. Showing the sign-in form now.'
        );
      } catch (salonError) {
        console.warn('Salon data load error:', salonError);
      }
    } catch (error) {
      setScreen('auth');
      setAuthStep('phone');
      setStatus(getErrorMessage(error, 'Could not finish startup. You can still sign in manually.'), 'error');
    } finally {
      setAuthBootstrapState('ready');
    }
  }

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setSplashLeaving(true), 650);
    const readyTimer = window.setTimeout(() => setAppReady(true), 1350);
    initializeApp();

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(readyTimer);
      window.clearTimeout(toastTimerRef.current);
      authSubscriptionRef.current?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (screen !== 'home') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCarouselIndex((current) => (current + 1) % Math.max(featuredSlides.length, 1));
    }, 4000);

    return () => window.clearInterval(timer);
  }, [featuredSlides.length, screen]);

  useEffect(() => {
    writeStorage(HISTORY_KEY, history);
  }, [history]);

  useEffect(() => {
    writeStorage(WALLET_KEY, walletBalance);
  }, [walletBalance]);

  async function handlePhoneContinue() {
    const client = clientRef.current;
    if (!client) {
      setStatus('Supabase is not configured yet.', 'error');
      return;
    }

    const nextPhone = toE164Phone(countryCode, phoneInput);
    if (!nextPhone || nextPhone.length < 8) {
      setStatus('Enter a valid mobile number.', 'error');
      return;
    }

    setBusy(true);
    const { error } = await client.auth.signInWithOtp({
      phone: nextPhone,
      options: {
        shouldCreateUser: true,
        data: { user_type: 'customer' }
      }
    });
    setBusy(false);

    if (error) {
      setStatus(error.message, 'error');
      return;
    }

    setPendingPhone(nextPhone);
    setPhoneOtp('');
    setAuthStep('phone-otp');
    setStatus('6-digit OTP sent to your number.', 'success');
  }

  async function handlePhoneVerify() {
    const client = clientRef.current;
    if (!client) {
      return;
    }

    if (phoneOtp.length !== 6) {
      setStatus('Enter the 6-digit OTP.', 'error');
      return;
    }

    setBusy(true);
    const response = await client.auth.verifyOtp({
      phone: pendingPhone,
      token: phoneOtp,
      type: 'sms'
    });
    setBusy(false);

    if (response.error) {
      setStatus(response.error.message, 'error');
      return;
    }

    await completeCustomerSession(response.data?.session, { restoreScreen: false });
  }

  async function handlePhoneResend() {
    const client = clientRef.current;
    if (!client || !pendingPhone) {
      return;
    }

    setBusy(true);
    const { error } = await client.auth.signInWithOtp({
      phone: pendingPhone,
      options: {
        shouldCreateUser: true,
        data: { user_type: 'customer' }
      }
    });
    setBusy(false);

    if (error) {
      setStatus(error.message, 'error');
      return;
    }

    setStatus('OTP resent.', 'success');
  }

  async function handleEmailContinue() {
    const client = clientRef.current;
    if (!client) {
      setStatus('Supabase is not configured yet.', 'error');
      return;
    }

    if (!emailInput.trim() || !passwordInput.trim()) {
      setStatus('Enter email and password to continue.', 'error');
      return;
    }

    setBusy(true);
    suppressAuthListenerRef.current = true;
    let credentialError = null;

    if (emailMode === 'create') {
      const signUp = await client.auth.signUp({
        email: emailInput.trim(),
        password: passwordInput,
        options: {
          data: { user_type: 'customer' }
        }
      });
      credentialError = signUp.error || null;
    } else {
      const signIn = await client.auth.signInWithPassword({
        email: emailInput.trim(),
        password: passwordInput
      });
      credentialError = signIn.error || null;
    }

    if (credentialError) {
      suppressAuthListenerRef.current = false;
      setBusy(false);
      setStatus(credentialError.message, 'error');
      return;
    }

    await client.auth.signOut();
    const otp = await client.auth.signInWithOtp({
      email: emailInput.trim(),
      options: {
        shouldCreateUser: false,
        data: { user_type: 'customer' }
      }
    });
    suppressAuthListenerRef.current = false;
    setBusy(false);

    if (otp.error) {
      setStatus(otp.error.message, 'error');
      return;
    }

    setPendingEmail(emailInput.trim());
    setEmailOtp('');
    setAuthStep('email-otp');
    setStatus('6-digit OTP sent to your email.', 'success');
  }

  async function handleEmailVerify() {
    const client = clientRef.current;
    if (!client) {
      return;
    }

    if (emailOtp.length !== 6) {
      setStatus('Enter the 6-digit OTP.', 'error');
      return;
    }

    setBusy(true);
    const response = await client.auth.verifyOtp({
      email: pendingEmail,
      token: emailOtp,
      type: 'email'
    });
    setBusy(false);

    if (response.error) {
      setStatus(response.error.message, 'error');
      return;
    }

    await completeCustomerSession(response.data?.session, { restoreScreen: false });
  }

  async function handleEmailResend() {
    const client = clientRef.current;
    if (!client || !pendingEmail) {
      return;
    }

    setBusy(true);
    const otp = await client.auth.signInWithOtp({
      email: pendingEmail,
      options: {
        shouldCreateUser: false,
        data: { user_type: 'customer' }
      }
    });
    setBusy(false);

    if (otp.error) {
      setStatus(otp.error.message, 'error');
      return;
    }

    setStatus('OTP resent.', 'success');
  }

  async function handleOAuth(provider) {
    const client = clientRef.current;
    if (!client) {
      setStatus('Supabase is not configured yet.', 'error');
      return;
    }

    setBusy(true);
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: typeof window === 'undefined' ? undefined : window.location.origin,
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

  async function handleLogout() {
    const client = clientRef.current;
    if (client) {
      await client.auth.signOut();
    }

    setSession(null);
    setStatusMessage('');
    setStatusTone('');
    setPhoneInput('');
    setPhoneOtp('');
    setEmailInput('');
    setEmailOtp('');
    setPasswordInput('');
    setAuthStep('phone');
    setScreen('auth');
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SCREEN_KEY, 'home');
    }
  }

  async function handleBookOpen() {
    navigate('book');
    const nextLocation = await requestLocation({ silent: false });
    await loadSalonData(nextLocation);
  }

  function handleRecharge() {
    setWalletBalance((current) => current + 500);
    showToast('Wallet recharged with ₹500.');
  }

  function handleBookSalon(salon) {
    setHistory((current) => [
      {
        id: getSalonKey(salon),
        name: salon.name || 'ZLon Salon',
        location: getSalonLocation(salon),
        bookedAt: new Date().toISOString()
      },
      ...current
    ]);
    window.open(buildBookingLink(salon), '_blank', 'noopener');
  }

  function renderAuthBody() {
    const showBootstrapUI = authBootstrapState === 'booting';
    const hasFormStep = ['phone', 'phone-otp', 'email', 'email-otp'].includes(activeAuthStep);

    return (
      <div className="zlon-auth-card zlon-auth-card--consumer">
        <div className="zlon-auth-brand zlon-auth-brand--consumer">
          <div className="zlon-auth-brand__row">
            <span className="zlon-wordmark zlon-wordmark--consumer">ZLon.</span>
            <span className="zlon-consumer-tag">Consumer</span>
          </div>
          <p className="zlon-eyebrow">Aesthetic White</p>
          <h1 className="zlon-auth-title">Salon booking in a cleaner shell.</h1>
          <p className="zlon-auth-copy">Phone OTP, email OTP, or your existing account. Fast entry, pure white surfaces, zero visual noise.</p>
        </div>

        {showBootstrapUI && (
          <div className="zlon-readonly-card zlon-readonly-card--consumer" role="status" aria-live="polite">
            <span className="zlon-readonly-label">Secure Session</span>
            <strong>Connecting to secure server...</strong>
            <span className="zlon-readonly-note">Checking your session now. If Supabase is slow, the sign-in form below stays available.</span>
          </div>
        )}

        {!showBootstrapUI && !hasFormStep && (
          <div className="zlon-readonly-card zlon-readonly-card--consumer" role="status">
            <span className="zlon-readonly-label">Loading</span>
            <strong>Preparing your sign-in options...</strong>
            <span className="zlon-readonly-note">This should only take a moment.</span>
          </div>
        )}

        {activeAuthStep === 'phone' && (
          <>
            <p className="zlon-label">Mobile Number</p>
            <div className="zlon-field-row zlon-field-row--consumer">
              <label className="zlon-select-shell zlon-select-shell--consumer" htmlFor="country-code">
                <span className="zlon-select-shell__label">Country</span>
                <select id="country-code" value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>
                  {COUNTRY_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>{`${option.flag} ${option.code}`}</option>
                  ))}
                </select>
              </label>
              <label className="zlon-input-shell zlon-input-shell--grow zlon-input-shell--consumer" htmlFor="mobile-number">
                <span className="zlon-input-shell__label">Number</span>
                <input
                  id="mobile-number"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="Enter mobile number"
                  value={phoneInput}
                  onChange={(event) => setPhoneInput(event.target.value.replace(/\D/g, ''))}
                />
              </label>
            </div>
            <button className="zlon-button zlon-button--primary zlon-button--full zlon-button--consumer" type="button" onClick={handlePhoneContinue} disabled={busy}>
              Continue
            </button>
          </>
        )}

        {activeAuthStep === 'phone-otp' && (
          <>
            <div className="zlon-readonly-card zlon-readonly-card--consumer">
              <span className="zlon-readonly-label">Mobile Number</span>
              <strong>{formatReadonlyContact(countryCode, pendingPhone.replace(countryCode, ''))}</strong>
              <span className="zlon-readonly-note">(not editable)</span>
            </div>
            <p className="zlon-label">6-digit OTP</p>
            <OtpInput value={phoneOtp} onChange={setPhoneOtp} label="Phone OTP" />
            <div className="zlon-inline-row zlon-inline-row--consumer">
              <button className="zlon-button zlon-button--ghost zlon-button--consumer" type="button" onClick={() => setAuthStep('phone')} disabled={busy}>
                Back
              </button>
              <button className="zlon-link-button" type="button" onClick={handlePhoneResend} disabled={busy}>
                Resend OTP
              </button>
            </div>
            <button className="zlon-button zlon-button--primary zlon-button--full zlon-button--consumer" type="button" onClick={handlePhoneVerify} disabled={busy}>
              Verify OTP
            </button>
          </>
        )}

        {activeAuthStep === 'email' && (
          <>
            <div className="zlon-mode-toggle zlon-mode-toggle--consumer">
              <button type="button" className={emailMode === 'login' ? 'is-active' : ''} onClick={() => setEmailMode('login')}>Log In</button>
              <button type="button" className={emailMode === 'create' ? 'is-active' : ''} onClick={() => setEmailMode('create')}>Create</button>
            </div>
            <p className="zlon-label">Email</p>
            <label className="zlon-input-shell zlon-input-shell--consumer" htmlFor="email-address">
              <span className="zlon-input-shell__label">Email</span>
              <input
                id="email-address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
              />
            </label>
            <p className="zlon-label">Password</p>
            <label className="zlon-input-shell zlon-input-shell--consumer" htmlFor="email-password">
              <span className="zlon-input-shell__label">Password</span>
              <input
                id="email-password"
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                value={passwordInput}
                onChange={(event) => setPasswordInput(event.target.value)}
              />
            </label>
            <div className="zlon-inline-row zlon-inline-row--consumer">
              <button className="zlon-button zlon-button--ghost zlon-button--consumer" type="button" onClick={() => setAuthStep('phone')} disabled={busy}>
                Back
              </button>
              <button className="zlon-button zlon-button--primary zlon-button--consumer" type="button" onClick={handleEmailContinue} disabled={busy}>
                Continue
              </button>
            </div>
          </>
        )}

        {activeAuthStep === 'email-otp' && (
          <>
            <div className="zlon-readonly-card zlon-readonly-card--consumer">
              <span className="zlon-readonly-label">Email</span>
              <strong>{pendingEmail}</strong>
              <span className="zlon-readonly-note">(not editable)</span>
            </div>
            <p className="zlon-label">6-digit OTP</p>
            <OtpInput value={emailOtp} onChange={setEmailOtp} label="Email OTP" />
            <div className="zlon-inline-row zlon-inline-row--consumer">
              <button className="zlon-button zlon-button--ghost zlon-button--consumer" type="button" onClick={() => setAuthStep('email')} disabled={busy}>
                Back
              </button>
              <button className="zlon-link-button" type="button" onClick={handleEmailResend} disabled={busy}>
                Resend OTP
              </button>
            </div>
            <button className="zlon-button zlon-button--primary zlon-button--full zlon-button--consumer" type="button" onClick={handleEmailVerify} disabled={busy}>
              Verify OTP
            </button>
          </>
        )}

        <div className="zlon-auth-divider zlon-auth-divider--consumer" />
        <div className="zlon-provider-row zlon-provider-row--consumer">
          <button className="zlon-provider-button zlon-provider-button--consumer" type="button" onClick={() => handleOAuth('google')} disabled={busy}>
            <GoogleIcon className="zlon-provider-icon zlon-provider-icon--brand" />
            <span>Google</span>
          </button>
          <button className="zlon-provider-button zlon-provider-button--consumer" type="button" onClick={() => handleOAuth('apple')} disabled={busy}>
            <AppleIcon className="zlon-provider-icon zlon-provider-icon--brand" />
            <span>Apple</span>
          </button>
          <button className="zlon-provider-button zlon-provider-button--consumer" type="button" onClick={() => setAuthStep('email')} disabled={busy}>
            <MailIcon className="zlon-provider-icon" />
            <span>Email</span>
          </button>
        </div>
        <p className={statusClassName(statusTone)}>{statusMessage}</p>
      </div>
    );
  }

  function renderConsumerHeader({ onBack, title, subtitle }) {
    return (
      <header className="zlon-topbar zlon-topbar--consumer">
        <div className="zlon-topbar__cluster zlon-topbar__cluster--consumer">
          {onBack && (
            <button className="zlon-icon-button zlon-icon-button--consumer" type="button" onClick={onBack} aria-label="Go back">
              <ChevronLeftIcon className="zlon-icon" />
            </button>
          )}
          <div className="zlon-consumer-heading">
            <span className="zlon-consumer-heading__label">{subtitle}</span>
            {onBack ? (
              <strong className="zlon-consumer-heading__title">{title}</strong>
            ) : (
              <span className="zlon-wordmark zlon-wordmark--consumer">{title}</span>
            )}
          </div>
        </div>
        <div className="zlon-topbar__actions zlon-topbar__actions--consumer">
          <button className="zlon-location-pill zlon-location-pill--consumer" type="button" onClick={() => requestLocation({ silent: false }).then(loadSalonData)}>
            <PinIcon className="zlon-location-pill__icon" />
            <span>{locationLabel}</span>
          </button>
          {!onBack && (
            <>
              <button className="zlon-icon-button zlon-icon-button--consumer" type="button" onClick={() => navigate('wallet')} aria-label="Open wallet">
                <WalletIcon className="zlon-icon" />
              </button>
              <button className="zlon-icon-button zlon-icon-button--consumer" type="button" onClick={() => navigate('profile')} aria-label="Open profile">
                <ProfileIcon className="zlon-icon" />
              </button>
            </>
          )}
        </div>
      </header>
    );
  }

  function renderHome() {
    const primarySalon = sortedSalons[0];

    return (
      <div className="zlon-screen zlon-screen--home zlon-screen--home-consumer">
        {renderConsumerHeader({ onBack: null, title: 'ZLon.', subtitle: 'Aesthetic White' })}
        <main className="zlon-home-grid zlon-home-grid--consumer">
          <section className="zlon-slide-panel zlon-slide-panel--consumer">
            <div className="zlon-slide-track" style={{ transform: `translateX(-${carouselIndex * 100}%)` }}>
              {featuredSlides.map((slide, index) => (
                <article key={slide.title + index} className="zlon-slide-card zlon-slide-card--consumer">
                  <span className="zlon-consumer-slide__index">{`0${index + 1}`}</span>
                  <p className="zlon-eyebrow">{index === 0 ? 'Consumer shell' : index === 1 ? 'Closest salon' : 'Feature placeholder'}</p>
                  <h2>{slide.title}</h2>
                  <p>{slide.body}</p>
                </article>
              ))}
            </div>
            <div className="zlon-slide-dots zlon-slide-dots--consumer">
              {featuredSlides.map((slide, index) => (
                <button
                  key={slide.title + index}
                  type="button"
                  className={carouselIndex === index ? 'is-active' : ''}
                  onClick={() => setCarouselIndex(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </section>

          <section className="zlon-home-panel zlon-home-panel--consumer zlon-home-panel--cta-consumer">
            <div className="zlon-home-panel__copy">
              <span className="zlon-eyebrow">Primary action</span>
              <strong>{primarySalon ? primarySalon.name : 'Open booking'}</strong>
              <p>
                {primarySalon
                  ? `${getSalonLocation(primarySalon)} · ${getSalonWaitTime(primarySalon)}`
                  : 'Search the nearest salons, compare live availability, and jump straight into booking.'}
              </p>
            </div>
            <button className="zlon-button zlon-button--primary zlon-button--consumer" type="button" onClick={handleBookOpen}>
              Book Now
            </button>
          </section>

          <section className="zlon-home-panel zlon-home-panel--consumer zlon-home-panel--placeholder" aria-label="Feature icon placeholder">
            <div className="zlon-consumer-icon-dock" aria-hidden="true">
              <span className="zlon-consumer-icon-dock__cell" />
              <span className="zlon-consumer-icon-dock__cell" />
              <span className="zlon-consumer-icon-dock__cell" />
              <span className="zlon-consumer-icon-dock__cell" />
            </div>
            <div className="zlon-home-panel__copy">
              <span className="zlon-eyebrow">Feature icons</span>
              <strong>Clean placeholder</strong>
              <p>Reserved white space for future micro-features, shortcuts, and partner icons.</p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  function renderBook() {
    return (
      <div className="zlon-screen zlon-screen--stacked zlon-screen--stacked-consumer">
        {renderConsumerHeader({ onBack: () => navigate('home'), title: 'Book', subtitle: 'Nearest salons' })}
        <main className="zlon-scroll-view zlon-scroll-view--consumer">
          <section className="zlon-section-card zlon-section-card--consumer">
            <p className="zlon-eyebrow">Nearest Salons</p>
            <h2 className="zlon-section-title">Find your chair</h2>
            <p className="zlon-helper-copy">Search by salon name or area, then move into a booking flow in one tap.</p>
            <div className="zlon-search-row zlon-search-row--consumer">
              <label className="zlon-search-shell zlon-search-shell--consumer">
                <SearchIcon className="zlon-icon" />
                <input
                  type="search"
                  placeholder="Search salons"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                />
              </label>
              <button className="zlon-icon-button zlon-icon-button--consumer" type="button" onClick={() => setShowFilters((current) => !current)} aria-label="Toggle filters">
                <FilterIcon className="zlon-icon" />
              </button>
            </div>
            {showFilters && (
              <div className="zlon-chip-row zlon-chip-row--consumer">
                {[
                  ['all', 'All'],
                  ['nearby', 'Nearby'],
                  ['premium', 'Premium'],
                  ['open', 'Open now']
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={filterValue === value ? 'zlon-chip zlon-chip--consumer is-active' : 'zlon-chip zlon-chip--consumer'}
                    onClick={() => setFilterValue(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="zlon-list zlon-list--consumer">
            {filteredSalons.length === 0 && <div className="zlon-empty-state">No salons matched that search. Try another name, area, or filter.</div>}
            {filteredSalons.map((salon) => (
              <article key={getSalonKey(salon)} className="zlon-list-card zlon-list-card--consumer">
                <div className="zlon-list-card__header">
                  <div className="zlon-list-card__body">
                    <p className="zlon-eyebrow">{getSalonType(salon) === 'premium' ? 'Premium salon' : 'Salon nearby'}</p>
                    <strong>{salon.name || 'ZLon Salon'}</strong>
                  </div>
                  <span className={isAvailableSalon(salon) ? 'zlon-badge is-success' : 'zlon-badge is-warning'}>
                    {isAvailableSalon(salon) ? 'Available' : 'Busy'}
                  </span>
                </div>
                <p className="zlon-list-card__meta">{getSalonLocation(salon)}</p>
                <div className="zlon-list-card__footer">
                  <span>{`${formatDistanceLabel(salon, userLocation)} · ${getSalonWaitTime(salon)}`}</span>
                  <button className="zlon-button zlon-button--primary zlon-button--consumer" type="button" onClick={() => handleBookSalon(salon)}>
                    Book Now
                  </button>
                </div>
              </article>
            ))}
          </section>
        </main>
      </div>
    );
  }

  function renderHistory() {
    const todayItems = history.filter((entry) => isToday(entry.bookedAt));

    return (
      <div className="zlon-screen zlon-screen--stacked zlon-screen--stacked-consumer">
        {renderConsumerHeader({ onBack: null, title: 'History', subtitle: `${todayItems.length} today` })}
        <main className="zlon-scroll-view zlon-scroll-view--consumer">
          <section className="zlon-section-card zlon-section-card--consumer">
            <p className="zlon-eyebrow">History</p>
            <h2 className="zlon-section-title">Recent bookings</h2>
            <p className="zlon-helper-copy">Today: {todayItems.length} bookings</p>
          </section>
          <section className="zlon-list zlon-list--consumer">
            {history.length === 0 && <div className="zlon-empty-state">No bookings yet. Your salon history will appear here.</div>}
            {history.map((entry) => (
              <article key={`${entry.id}-${entry.bookedAt}`} className="zlon-list-card zlon-list-card--consumer">
                <div className="zlon-list-card__body">
                  <strong>{entry.name}</strong>
                  <p>{entry.location}</p>
                </div>
                <div className="zlon-list-card__footer">
                  <span>{new Date(entry.bookedAt).toLocaleString()}</span>
                </div>
              </article>
            ))}
          </section>
        </main>
      </div>
    );
  }

  function renderWallet() {
    return (
      <div className="zlon-screen zlon-screen--stacked zlon-screen--stacked-consumer">
        {renderConsumerHeader({ onBack: () => navigate('home'), title: 'Wallet', subtitle: 'Internal credits' })}
        <main className="zlon-scroll-view zlon-scroll-view--consumer">
          <section className="zlon-section-card zlon-section-card--consumer zlon-section-card--wallet">
            <p className="zlon-eyebrow">Wallet</p>
            <h2 className="zlon-section-title">Internal credits</h2>
            <strong className="zlon-money">₹{walletBalance}</strong>
            <p className="zlon-helper-copy">Keep your next payment step ready before you reach the chair.</p>
          </section>
          <section className="zlon-home-panel zlon-home-panel--consumer">
            <p className="zlon-helper-copy">Recharge internal credits now, and keep Amazon Pay connection ready for the next payment pass.</p>
            <button className="zlon-button zlon-button--primary zlon-button--consumer" type="button" onClick={handleRecharge}>
              Recharge ₹500
            </button>
          </section>
        </main>
      </div>
    );
  }

  function renderProfile() {
    return (
      <div className="zlon-screen zlon-screen--stacked zlon-screen--stacked-consumer">
        {renderConsumerHeader({ onBack: () => navigate('home'), title: 'Profile', subtitle: 'Signed in customer' })}
        <main className="zlon-scroll-view zlon-scroll-view--consumer">
          <section className="zlon-section-card zlon-section-card--consumer">
            <p className="zlon-eyebrow">Profile</p>
            <h2 className="zlon-section-title">My account</h2>
            <p className="zlon-helper-copy">{session?.user?.email || pendingPhone || 'Signed in customer'}</p>
          </section>
          <section className="zlon-action-list zlon-action-list--consumer">
            <button className="zlon-action-row zlon-action-row--consumer" type="button" onClick={() => navigate('wallet')}>
              <span>Wallet</span>
              <ArrowRightIcon className="zlon-icon" />
            </button>
            <button className="zlon-action-row zlon-action-row--consumer" type="button" onClick={() => navigate('history')}>
              <span>History</span>
              <ArrowRightIcon className="zlon-icon" />
            </button>
            <button className="zlon-action-row zlon-action-row--consumer" type="button" onClick={handleLogout}>
              <span>Sign out</span>
              <ArrowRightIcon className="zlon-icon" />
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="zlon-root zlon-root--consumer">
      <div className="zlon-device zlon-device--consumer">
        {!appReady && (
          <div className={splashLeaving ? 'zlon-splash zlon-splash--consumer is-leaving' : 'zlon-splash zlon-splash--consumer'}>
            <div className="zlon-splash__logo zlon-splash__logo--consumer">ZLon.</div>
          </div>
        )}

        <div className={appReady ? 'zlon-frame zlon-frame--consumer is-ready' : 'zlon-frame zlon-frame--consumer'}>
          {screen === 'auth' && <div className="zlon-screen zlon-screen--auth zlon-screen--auth-consumer">{renderAuthBody()}</div>}
          {screen === 'home' && renderHome()}
          {screen === 'book' && renderBook()}
          {screen === 'history' && renderHistory()}
          {screen === 'wallet' && renderWallet()}
          {screen === 'profile' && renderProfile()}
        </div>

        {session && (screen === 'home' || screen === 'history') && (
          <nav className="zlon-bottom-nav zlon-bottom-nav--consumer">
            <button className={screen === 'home' ? 'zlon-bottom-nav__button is-active' : 'zlon-bottom-nav__button'} type="button" onClick={() => navigate('home')}>
              <HomeIcon className="zlon-icon" />
              <span>Home</span>
            </button>
            <button className={screen === 'history' ? 'zlon-bottom-nav__button is-active' : 'zlon-bottom-nav__button'} type="button" onClick={() => navigate('history')}>
              <HistoryIcon className="zlon-icon" />
              <span>History</span>
            </button>
          </nav>
        )}

        {toast && <div className="zlon-toast zlon-toast--consumer">{toast}</div>}
      </div>
    </div>
  );
}

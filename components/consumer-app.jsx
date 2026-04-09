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
import { businessUrl } from '@/lib/zlon/hosts';
import {
  FALLBACK_SALONS,
  bannerStyle,
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

  const clientRef = useRef(null);
  const toastTimerRef = useRef(null);
  const authSubscriptionRef = useRef(null);
  const suppressAuthListenerRef = useRef(false);

  const sortedSalons = useMemo(() => sortSalonsByDistance(salons, userLocation), [salons, userLocation]);
  const featuredSlides = useMemo(() => {
    const primary = sortedSalons[0];
    const secondary = sortedSalons[1];

    return [
      {
        title: 'ZLon.',
        body: 'A native-feeling booking flow with no landing-page clutter.'
      },
      {
        title: primary ? primary.name : 'book now',
        body: primary ? `${getSalonLocation(primary)} · ${getSalonWaitTime(primary)}` : 'Turn on location and the nearest salon moves to the front.'
      },
      {
        title: 'here will be the adds',
        body: secondary ? `${secondary.name} · ${getSalonLocation(secondary)}` : 'Paid spots, salon promotions, and campaigns fit here.'
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
      return;
    }

    const client = clientRef.current;
    if (client) {
      const resolvedType = await resolveUserType(client, nextSession);
      if (resolvedType === 'owner') {
        window.location.replace(businessUrl());
        return;
      }

      await syncProfile(client, nextSession.user, 'customer', nextSession.user.phone || pendingPhone || null);
    }

    setSession(nextSession);
    setPendingPhone(nextSession.user.phone || pendingPhone);
    setPendingEmail(nextSession.user.email || pendingEmail);
    const nextLocation = await requestLocation({ silent: true });
    await loadSalonData(nextLocation);
    navigate(restoreScreen ? readLastScreen() : 'home');
  }

  async function initializeApp() {
    try {
      clientRef.current = getSupabaseBrowserClient();
    } catch (error) {
      setStatus(error.message, 'error');
      return;
    }

    const client = clientRef.current;
    const { data } = client.auth.onAuthStateChange(async (event, nextSession) => {
      if (suppressAuthListenerRef.current) {
        return;
      }

      if (event === 'SIGNED_OUT' || !nextSession) {
        setSession(null);
        setAuthStep('phone');
        setScreen('auth');
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await completeCustomerSession(nextSession, { restoreScreen: true });
      }
    });

    authSubscriptionRef.current = data.subscription;

    const existingSession = await getSession(client);
    if (existingSession) {
      await completeCustomerSession(existingSession, { restoreScreen: true });
      return;
    }

    setScreen('auth');
    await loadSalonData(null);
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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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
        redirectTo: `${window.location.origin}/auth/callback`,
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
    return (
      <div className="zlon-auth-card">
        <div className="zlon-auth-brand">
          <p className="zlon-eyebrow">Consumer App</p>
          <h1 className="zlon-auth-title">Instant salon access in four clean steps.</h1>
          <p className="zlon-auth-copy">Phone OTP, email OTP, or Google. No menu clutter. No website chrome.</p>
        </div>

        {authStep === 'phone' && (
          <>
            <label className="zlon-label">Mobile Number</label>
            <div className="zlon-field-row">
              <label className="zlon-select-shell" htmlFor="country-code">
                <span className="zlon-select-shell__label">Country</span>
                <select id="country-code" value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>
                  {COUNTRY_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>{`${option.flag} ${option.code}`}</option>
                  ))}
                </select>
              </label>
              <label className="zlon-input-shell zlon-input-shell--grow" htmlFor="mobile-number">
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
            <button className="zlon-button zlon-button--primary" type="button" onClick={handlePhoneContinue} disabled={busy}>
              Continue
            </button>
          </>
        )}

        {authStep === 'phone-otp' && (
          <>
            <div className="zlon-readonly-card">
              <span className="zlon-readonly-label">Mobile Number</span>
              <strong>{formatReadonlyContact(countryCode, pendingPhone.replace(countryCode, ''))}</strong>
              <span className="zlon-readonly-note">(not editable)</span>
            </div>
            <label className="zlon-label">6-digit OTP</label>
            <OtpInput value={phoneOtp} onChange={setPhoneOtp} label="Phone OTP" />
            <div className="zlon-inline-row">
              <button className="zlon-button zlon-button--ghost" type="button" onClick={() => setAuthStep('phone')} disabled={busy}>
                &lt;- Back
              </button>
              <button className="zlon-link-button" type="button" onClick={handlePhoneResend} disabled={busy}>
                Resend otp
              </button>
            </div>
            <button className="zlon-button zlon-button--primary" type="button" onClick={handlePhoneVerify} disabled={busy}>
              Verify OTP
            </button>
          </>
        )}

        {authStep === 'email' && (
          <>
            <div className="zlon-mode-toggle">
              <button type="button" className={emailMode === 'login' ? 'is-active' : ''} onClick={() => setEmailMode('login')}>Log In</button>
              <button type="button" className={emailMode === 'create' ? 'is-active' : ''} onClick={() => setEmailMode('create')}>Create</button>
            </div>
            <label className="zlon-label">Email</label>
            <label className="zlon-input-shell" htmlFor="email-address">
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
            <label className="zlon-label">Password</label>
            <label className="zlon-input-shell" htmlFor="email-password">
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
            <div className="zlon-inline-row">
              <button className="zlon-button zlon-button--ghost" type="button" onClick={() => setAuthStep('phone')} disabled={busy}>
                &lt;- Back
              </button>
              <button className="zlon-button zlon-button--primary" type="button" onClick={handleEmailContinue} disabled={busy}>
                Continue
              </button>
            </div>
          </>
        )}

        {authStep === 'email-otp' && (
          <>
            <div className="zlon-readonly-card">
              <span className="zlon-readonly-label">Email</span>
              <strong>{pendingEmail}</strong>
              <span className="zlon-readonly-note">(not editable)</span>
            </div>
            <label className="zlon-label">6-digit OTP</label>
            <OtpInput value={emailOtp} onChange={setEmailOtp} label="Email OTP" />
            <div className="zlon-inline-row">
              <button className="zlon-button zlon-button--ghost" type="button" onClick={() => setAuthStep('email')} disabled={busy}>
                &lt;- Back
              </button>
              <button className="zlon-link-button" type="button" onClick={handleEmailResend} disabled={busy}>
                Resend otp
              </button>
            </div>
            <button className="zlon-button zlon-button--primary" type="button" onClick={handleEmailVerify} disabled={busy}>
              Verify OTP
            </button>
          </>
        )}

        <div className="zlon-auth-divider" />
        <div className="zlon-provider-row">
          <button className="zlon-provider-button" type="button" onClick={() => handleOAuth('google')} disabled={busy}>
            <GoogleIcon className="zlon-provider-icon" />
            <span>Google</span>
          </button>
          <button className="zlon-provider-button" type="button" onClick={() => handleOAuth('apple')} disabled={busy}>
            <AppleIcon className="zlon-provider-icon" />
            <span>Apple</span>
          </button>
          <button className="zlon-provider-button" type="button" onClick={() => setAuthStep('email')} disabled={busy}>
            <MailIcon className="zlon-provider-icon" />
            <span>Email</span>
          </button>
        </div>
        <p className={statusClassName(statusTone)}>{statusMessage}</p>
      </div>
    );
  }

  function renderConsumerHeader({ onBack }) {
    return (
      <header className="zlon-topbar">
        <div className="zlon-topbar__cluster zlon-topbar__cluster--left">
          {onBack ? (
            <button className="zlon-icon-button" type="button" onClick={onBack} aria-label="Go back">
              <ChevronLeftIcon className="zlon-icon" />
            </button>
          ) : (
            <>
              <button className="zlon-icon-button" type="button" onClick={() => navigate('profile')} aria-label="Open profile">
                <ProfileIcon className="zlon-icon" />
              </button>
              <button className="zlon-icon-button" type="button" onClick={() => navigate('wallet')} aria-label="Open wallet">
                <WalletIcon className="zlon-icon" />
              </button>
            </>
          )}
        </div>
        <div className="zlon-topbar__brand">
          <span className="zlon-wordmark">ZLon.</span>
        </div>
        <button className="zlon-location-pill" type="button" onClick={() => requestLocation({ silent: false }).then(loadSalonData)}>
          <PinIcon className="zlon-location-pill__icon" />
          <span>{locationLabel}</span>
        </button>
      </header>
    );
  }

  function renderHome() {
    return (
      <div className="zlon-screen zlon-screen--home">
        {renderConsumerHeader({ onBack: null })}
        <main className="zlon-home-grid">
          <section className="zlon-slide-panel">
            <div className="zlon-slide-track" style={{ transform: `translateX(-${carouselIndex * 100}%)` }}>
              {featuredSlides.map((slide, index) => (
                <article key={slide.title + index} className="zlon-slide-card" style={bannerStyle(index)}>
                  <p className="zlon-eyebrow">Native App Flow</p>
                  <h2>{slide.title}</h2>
                  <p>{slide.body}</p>
                </article>
              ))}
            </div>
            <div className="zlon-slide-dots">
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

          <button className="zlon-home-panel zlon-home-panel--cta" type="button" onClick={handleBookOpen}>
            <span className="zlon-eyebrow">Instant Access</span>
            <strong>book now</strong>
            <p>Search the nearest salons, compare live availability, and jump straight into booking.</p>
            <span className="zlon-home-panel__arrow"><ArrowRightIcon className="zlon-icon" /></span>
          </button>

          <section className="zlon-home-panel zlon-home-panel--ads" aria-label="Ads container">
            <span className="zlon-eyebrow">Ads</span>
            <strong>here will be the adds</strong>
            <p>Reserved for paid placements, launches, and salon promotions inside the same visual system.</p>
          </section>
        </main>
      </div>
    );
  }

  function renderBook() {
    return (
      <div className="zlon-screen zlon-screen--stacked">
        {renderConsumerHeader({ onBack: () => navigate('home') })}
        <main className="zlon-scroll-view">
          <section className="zlon-section-card">
            <p className="zlon-eyebrow">Nearest Salons</p>
            <h2 className="zlon-section-title">Find your chair</h2>
            <div className="zlon-search-row">
              <label className="zlon-search-shell">
                <SearchIcon className="zlon-icon" />
                <input
                  type="search"
                  placeholder="Search salons"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                />
              </label>
              <button className="zlon-icon-button" type="button" onClick={() => setShowFilters((current) => !current)} aria-label="Toggle filters">
                <FilterIcon className="zlon-icon" />
              </button>
            </div>
            {showFilters && (
              <div className="zlon-chip-row">
                {[
                  ['all', 'All'],
                  ['nearby', 'Nearby'],
                  ['premium', 'Premium'],
                  ['open', 'Open now']
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={filterValue === value ? 'zlon-chip is-active' : 'zlon-chip'}
                    onClick={() => setFilterValue(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="zlon-list">
            {filteredSalons.length === 0 && <div className="zlon-empty-state">No salons matched that search. Try another name, area, or filter.</div>}
            {filteredSalons.map((salon, index) => (
              <article key={getSalonKey(salon)} className="zlon-list-card">
                <div className="zlon-list-card__banner" style={bannerStyle(index, salon)} />
                <div className="zlon-list-card__body">
                  <strong>{salon.name || 'ZLon Salon'}</strong>
                  <p>{getSalonLocation(salon)}</p>
                  <span>{`${formatDistanceLabel(salon, userLocation)} · ${getSalonWaitTime(salon)}`}</span>
                </div>
                <div className="zlon-list-card__footer">
                  <span className={isAvailableSalon(salon) ? 'zlon-badge is-success' : 'zlon-badge is-warning'}>
                    {isAvailableSalon(salon) ? 'Available' : 'Busy'}
                  </span>
                  <button className="zlon-button zlon-button--primary" type="button" onClick={() => handleBookSalon(salon)}>
                    Book
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
      <div className="zlon-screen zlon-screen--stacked">
        {renderConsumerHeader({ onBack: null })}
        <main className="zlon-scroll-view">
          <section className="zlon-section-card">
            <p className="zlon-eyebrow">History</p>
            <h2 className="zlon-section-title">Recent bookings</h2>
            <p className="zlon-helper-copy">Today: {todayItems.length} bookings</p>
          </section>
          <section className="zlon-list">
            {history.length === 0 && <div className="zlon-empty-state">No bookings yet. Your salon history will appear here.</div>}
            {history.map((entry, index) => (
              <article key={`${entry.id}-${entry.bookedAt}`} className="zlon-list-card">
                <div className="zlon-list-card__banner" style={bannerStyle(index)} />
                <div className="zlon-list-card__body">
                  <strong>{entry.name}</strong>
                  <p>{entry.location}</p>
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
      <div className="zlon-screen zlon-screen--stacked">
        {renderConsumerHeader({ onBack: () => navigate('home') })}
        <main className="zlon-scroll-view">
          <section className="zlon-section-card">
            <p className="zlon-eyebrow">Wallet</p>
            <h2 className="zlon-section-title">Internal credits</h2>
            <strong className="zlon-money">₹{walletBalance}</strong>
          </section>
          <section className="zlon-section-card">
            <p className="zlon-helper-copy">Recharge internal credits now, and keep Amazon Pay connection ready for the next payment pass.</p>
            <button className="zlon-button zlon-button--primary" type="button" onClick={handleRecharge}>
              Recharge ₹500
            </button>
          </section>
        </main>
      </div>
    );
  }

  function renderProfile() {
    return (
      <div className="zlon-screen zlon-screen--stacked">
        {renderConsumerHeader({ onBack: () => navigate('home') })}
        <main className="zlon-scroll-view">
          <section className="zlon-section-card">
            <p className="zlon-eyebrow">Profile</p>
            <h2 className="zlon-section-title">My account</h2>
            <p className="zlon-helper-copy">{session?.user?.email || pendingPhone || 'Signed in customer'}</p>
          </section>
          <section className="zlon-action-list">
            <button className="zlon-action-row" type="button" onClick={() => navigate('wallet')}>
              <span>Wallet</span>
              <ArrowRightIcon className="zlon-icon" />
            </button>
            <button className="zlon-action-row" type="button" onClick={() => navigate('history')}>
              <span>History</span>
              <ArrowRightIcon className="zlon-icon" />
            </button>
            <button className="zlon-action-row" type="button" onClick={handleLogout}>
              <span>Sign out</span>
              <ArrowRightIcon className="zlon-icon" />
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="zlon-root">
      <div className="zlon-device zlon-device--consumer">
        <div className={splashLeaving ? 'zlon-splash is-leaving' : 'zlon-splash'} hidden={appReady}>
          <span className="zlon-splash__logo">ZLon.</span>
        </div>

        <div className={appReady ? 'zlon-frame is-ready' : 'zlon-frame'}>
          {screen === 'auth' && <div className="zlon-screen zlon-screen--auth">{renderAuthBody()}</div>}
          {screen === 'home' && renderHome()}
          {screen === 'book' && renderBook()}
          {screen === 'history' && renderHistory()}
          {screen === 'wallet' && renderWallet()}
          {screen === 'profile' && renderProfile()}
        </div>

        {session && (screen === 'home' || screen === 'history') && (
          <nav className="zlon-bottom-nav">
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

        {toast && <div className="zlon-toast">{toast}</div>}
      </div>
    </div>
  );
}

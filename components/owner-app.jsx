'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppleIcon,
  ChevronLeftIcon,
  GoogleIcon,
  MailIcon,
  ProfileIcon,
  RefreshIcon
} from '@/components/icons';
import { OtpInput } from '@/components/otp-input';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { claimOwnerSalon, getSession, resolveUserType, syncProfile, toE164Phone } from '@/lib/zlon/auth';
import { AUTH_BOOTSTRAP_TIMEOUT_MS, getErrorMessage, getSafeAuthStep, withTimeout } from '@/lib/zlon/auth-ui';
import { customerUrl } from '@/lib/zlon/hosts';

const COUNTRY_OPTIONS = [
  { flag: '🇮🇳', code: '+91', label: 'India' },
  { flag: '🇦🇪', code: '+971', label: 'UAE' },
  { flag: '🇺🇸', code: '+1', label: 'USA' }
];

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

function readAmount(entry) {
  const raw = Number(entry.amount || entry.total || entry.price || entry.service_total || 0);
  return Number.isFinite(raw) ? raw : 0;
}

function isToday(value) {
  if (!value) {
    return false;
  }

  const now = new Date();
  const target = new Date(value);
  return now.toDateString() === target.toDateString();
}

function appointmentTitle(entry) {
  return entry.customer_name || entry.name || entry.customer || entry.client_name || 'Walk-in customer';
}

function appointmentMeta(entry) {
  const timeValue = entry.start_time || entry.appointment_time || entry.created_at || entry.updated_at || new Date().toISOString();
  const statusValue = entry.status || entry.queue_status || entry.state || 'scheduled';
  return `${new Date(timeValue).toLocaleString()} · ${String(statusValue).replace(/_/g, ' ')}`;
}

async function loadAppointments(client, salonId, ownerId) {
  const tables = ['appointments', 'bookings', 'queue'];

  for (const table of tables) {
    let response = await client
      .from(table)
      .select('*')
      .eq('salon_id', salonId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (response.error && /salon_id/i.test(response.error.message || '')) {
      response = await client
        .from(table)
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })
        .limit(50);
    }

    if (response.error && /owner_id/i.test(response.error.message || '')) {
      response = await client
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
    }

    if (!response.error && Array.isArray(response.data)) {
      return response.data.filter((entry) => {
        if (!entry.salon_id) {
          return true;
        }
        return String(entry.salon_id) === String(salonId);
      });
    }
  }

  return [];
}

export function OwnerApp() {
  const [splashLeaving, setSplashLeaving] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [view, setView] = useState('auth');
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
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState('');
  const [session, setSession] = useState(null);
  const [salon, setSalon] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [assetType, setAssetType] = useState('logo');
  const [assetFile, setAssetFile] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [authBootstrapState, setAuthBootstrapState] = useState('booting');

  const clientRef = useRef(null);
  const authSubscriptionRef = useRef(null);
  const suppressAuthListenerRef = useRef(false);
  const toastTimerRef = useRef(null);

  const todaysAppointments = useMemo(() => appointments.filter((entry) => isToday(entry.created_at || entry.appointment_time || entry.start_time)), [appointments]);
  const activeAuthStep = getSafeAuthStep(authStep);
  const earningsToday = useMemo(() => {
    const direct = todaysAppointments.reduce((sum, entry) => sum + readAmount(entry), 0);
    if (direct > 0) {
      return direct;
    }
    return todaysAppointments.length * 300;
  }, [todaysAppointments]);

  function setStatus(message, tone = '') {
    setStatusMessage(message);
    setStatusTone(tone);
  }

  function showToast(message) {
    setToast(message);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 2800);
  }

  async function refreshDashboard(currentSalon = salon, currentSession = session) {
    const client = clientRef.current;
    if (!client || !currentSalon || !currentSession?.user) {
      return;
    }

    const latestSalon = await client.from('salons').select('*').eq('id', currentSalon.id).maybeSingle();
    if (!latestSalon.error && latestSalon.data) {
      setSalon(latestSalon.data);
    }

    const nextAppointments = await loadAppointments(client, currentSalon.id, currentSession.user.id);
    setAppointments(nextAppointments);
  }

  async function completeOwnerSession(nextSession) {
    if (!nextSession?.user) {
      setStatus('Session could not be created. Try again.', 'error');
      return false;
    }

    try {
      const client = clientRef.current;
      const resolvedType = await resolveUserType(client, nextSession);
      if (resolvedType === 'customer') {
        window.location.replace(customerUrl('/'));
        return true;
      }

      const linkedSalon = await claimOwnerSalon(client, nextSession.user, pendingPhone);
      if (!linkedSalon.linked) {
        await client.auth.signOut();
        setStatus(linkedSalon.message, 'error');
        return false;
      }

      await syncProfile(client, nextSession.user, 'owner', nextSession.user.phone || pendingPhone || null);
      setSession(nextSession);
      setSalon(linkedSalon.salon);
      setView('dashboard');
      await refreshDashboard(linkedSalon.salon, nextSession);
      return true;
    } catch (error) {
      setView('auth');
      setStatus(getErrorMessage(error, 'Could not open the owner dashboard. You can still sign in manually.'), 'error');
      return false;
    }
  }

  async function initializeOwnerApp() {
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
            setSalon(null);
            setView('auth');
            setAuthStep('phone');
            return;
          }

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await completeOwnerSession(nextSession);
          }
        } catch (error) {
          setView('auth');
          setStatus(getErrorMessage(error, 'Could not refresh your owner session. You can still sign in manually.'), 'error');
        } finally {
          setAuthBootstrapState('ready');
        }
      });

      authSubscriptionRef.current = data.subscription;

      try {
        const existingSession = await withTimeout(
          getSession(client),
          AUTH_BOOTSTRAP_TIMEOUT_MS,
          'Secure owner session check timed out. You can still sign in manually.'
        );

        if (existingSession) {
          await withTimeout(
            completeOwnerSession(existingSession),
            AUTH_BOOTSTRAP_TIMEOUT_MS,
            'Owner dashboard loading timed out. You can still continue manually.'
          );
          return;
        }
      } catch (sessionError) {
        console.warn('Session check error:', sessionError);
      }

      setView('auth');
      setAuthStep('phone');
    } catch (error) {
      setView('auth');
      setAuthStep('phone');
      setStatus(getErrorMessage(error, 'Could not finish owner startup. You can still sign in manually.'), 'error');
    } finally {
      setAuthBootstrapState('ready');
    }
  }

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setSplashLeaving(true), 650);
    const readyTimer = window.setTimeout(() => setAppReady(true), 1350);
    initializeOwnerApp();

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(readyTimer);
      window.clearTimeout(toastTimerRef.current);
      authSubscriptionRef.current?.unsubscribe();
    };
  }, []);

  async function handlePhoneContinue() {
    const client = clientRef.current;
    if (!client) {
      setStatus('Supabase is not configured yet.', 'error');
      return;
    }

    const nextPhone = toE164Phone(countryCode, phoneInput);
    if (!nextPhone || nextPhone.length < 8) {
      setStatus('Enter a valid owner number.', 'error');
      return;
    }

    setBusy(true);
    const { error } = await client.auth.signInWithOtp({
      phone: nextPhone,
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

    setPendingPhone(nextPhone);
    setPhoneOtp('');
    setAuthStep('phone-otp');
    setStatus('6-digit OTP sent to your owner number.', 'success');
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

    await completeOwnerSession(response.data?.session);
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
          data: { user_type: 'owner' }
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
        data: { user_type: 'owner' }
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

    await completeOwnerSession(response.data?.session);
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
        data: { user_type: 'owner' }
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

  async function handleOwnerLogout() {
    const client = clientRef.current;
    if (client) {
      await client.auth.signOut();
    }

    setSession(null);
    setSalon(null);
    setView('auth');
    setAuthStep('phone');
  }

  async function updateAvailability(nextStatus) {
    const client = clientRef.current;
    if (!client || !salon) {
      return;
    }

    setStatusUpdating(true);
    const waitTime = nextStatus === 'busy' ? '15 min' : '0 min';
    const { data, error } = await client
      .from('salons')
      .update({ queue_status: nextStatus, waitTime })
      .eq('id', salon.id)
      .select('*')
      .maybeSingle();
    setStatusUpdating(false);

    if (error) {
      showToast(error.message);
      return;
    }

    if (data) {
      setSalon(data);
      showToast(`Salon marked ${nextStatus}.`);
    }
  }

  async function handleAssetUpload(event) {
    event.preventDefault();
    const client = clientRef.current;
    if (!client || !salon || !assetFile) {
      showToast('Choose a file before uploading.');
      return;
    }

    setBusy(true);
    const safeName = assetFile.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
    const objectPath = `${salon.id}/${assetType}-${Date.now()}-${safeName}`;
    const upload = await client.storage
      .from('salon-assets')
      .upload(objectPath, assetFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (upload.error) {
      setBusy(false);
      showToast(upload.error.message);
      return;
    }

    const { data: publicData } = client.storage.from('salon-assets').getPublicUrl(objectPath);
    const patch = assetType === 'banner' ? { banner_url: publicData.publicUrl } : { logo_url: publicData.publicUrl };
    const updated = await client
      .from('salons')
      .update(patch)
      .eq('id', salon.id)
      .select('*')
      .maybeSingle();

    setBusy(false);

    if (updated.error) {
      showToast(updated.error.message);
      return;
    }

    if (updated.data) {
      setSalon(updated.data);
      setAssetFile(null);
      showToast(`${assetType === 'banner' ? 'Banner' : 'Logo'} uploaded successfully.`);
    }
  }

  function renderAuthBody() {
    const showBootstrapUI = authBootstrapState === 'booting';
    const hasFormStep = ['phone', 'phone-otp', 'email', 'email-otp'].includes(activeAuthStep);

    return (
      <div className="zlon-auth-card">
        <div className="zlon-auth-brand">
          <p className="zlon-eyebrow">Owner App</p>
          <h1 className="zlon-auth-title">Live shop control without leaving the app shell.</h1>
          <p className="zlon-auth-copy">Same 6-digit OTP flow, but routed straight into the business dashboard.</p>
        </div>

        {showBootstrapUI && (
          <div className="zlon-readonly-card" role="status" aria-live="polite">
            <span className="zlon-readonly-label">Secure Session</span>
            <strong>Connecting to secure server...</strong>
            <span className="zlon-readonly-note">Checking the owner session now. If Supabase is slow, the sign-in form below will stay available.</span>
          </div>
        )}

        {!showBootstrapUI && !hasFormStep && (
          <div className="zlon-readonly-card" role="status">
            <span className="zlon-readonly-label">Loading</span>
            <strong>Preparing your sign-in options...</strong>
            <span className="zlon-readonly-note">This should only take a moment.</span>
          </div>
        )}

        {activeAuthStep === 'phone' && (
          <>
            <p className="zlon-label">Owner Mobile Number</p>
            <div className="zlon-field-row">
              <label className="zlon-select-shell" htmlFor="owner-country-code">
                <span className="zlon-select-shell__label">Country</span>
                <select id="owner-country-code" value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>
                  {COUNTRY_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>{`${option.flag} ${option.code}`}</option>
                  ))}
                </select>
              </label>
              <label className="zlon-input-shell zlon-input-shell--grow" htmlFor="owner-mobile-number">
                <span className="zlon-input-shell__label">Number</span>
                <input
                  id="owner-mobile-number"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="Enter owner number"
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

        {activeAuthStep === 'phone-otp' && (
          <>
            <div className="zlon-readonly-card">
              <span className="zlon-readonly-label">Owner Number</span>
              <strong>{formatReadonlyContact(countryCode, pendingPhone.replace(countryCode, ''))}</strong>
              <span className="zlon-readonly-note">(not editable)</span>
            </div>
            <p className="zlon-label">6-digit OTP</p>
            <OtpInput value={phoneOtp} onChange={setPhoneOtp} label="Owner phone OTP" />
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

        {activeAuthStep === 'email' && (
          <>
            <div className="zlon-mode-toggle">
              <button type="button" className={emailMode === 'login' ? 'is-active' : ''} onClick={() => setEmailMode('login')}>Log In</button>
              <button type="button" className={emailMode === 'create' ? 'is-active' : ''} onClick={() => setEmailMode('create')}>Create</button>
            </div>
            <p className="zlon-label">Owner Email</p>
            <label className="zlon-input-shell" htmlFor="owner-email-address">
              <span className="zlon-input-shell__label">Email</span>
              <input
                id="owner-email-address"
                type="email"
                autoComplete="email"
                placeholder="owner@example.com"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
              />
            </label>
            <p className="zlon-label">Password</p>
            <label className="zlon-input-shell" htmlFor="owner-email-password">
              <span className="zlon-input-shell__label">Password</span>
              <input
                id="owner-email-password"
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

        {activeAuthStep === 'email-otp' && (
          <>
            <div className="zlon-readonly-card">
              <span className="zlon-readonly-label">Email</span>
              <strong>{pendingEmail}</strong>
              <span className="zlon-readonly-note">(not editable)</span>
            </div>
            <p className="zlon-label">6-digit OTP</p>
            <OtpInput value={emailOtp} onChange={setEmailOtp} label="Owner email OTP" />
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

  function renderDashboard() {
    return (
      <div className="zlon-screen zlon-screen--owner">
        <header className="zlon-topbar zlon-topbar--owner">
          <div className="zlon-topbar__cluster zlon-topbar__cluster--left">
            <button className="zlon-icon-button" type="button" onClick={handleOwnerLogout} aria-label="Sign out owner">
              <ChevronLeftIcon className="zlon-icon" />
            </button>
            <button className="zlon-icon-button" type="button" onClick={() => refreshDashboard()} aria-label="Refresh dashboard">
              <RefreshIcon className="zlon-icon" />
            </button>
          </div>
          <div className="zlon-topbar__brand">
            <span className="zlon-wordmark">ZLon.</span>
          </div>
          <div className="zlon-owner-chip">
            <ProfileIcon className="zlon-icon" />
            <span>{salon?.name || 'Owner'}</span>
          </div>
        </header>

        <main className="zlon-scroll-view zlon-scroll-view--owner">
          <section className="zlon-section-card zlon-section-card--hero">
            <p className="zlon-eyebrow">Business Dashboard</p>
            <h1 className="zlon-section-title">{salon?.name || 'My Salon'}</h1>
            <p className="zlon-helper-copy">Appointments, earnings, live availability, and storage uploads from one screen.</p>
          </section>

          <section className="zlon-owner-metrics">
            <article className="zlon-metric-card">
              <span>Daily Appointments</span>
              <strong>{todaysAppointments.length}</strong>
            </article>
            <article className="zlon-metric-card">
              <span>Earnings</span>
              <strong>₹{earningsToday}</strong>
            </article>
            <article className="zlon-metric-card">
              <span>Status</span>
              <strong>{String(salon?.queue_status || 'available').toLowerCase() === 'busy' ? 'Busy' : 'Available'}</strong>
            </article>
          </section>

          <section className="zlon-section-card zlon-section-card--status">
            <p className="zlon-eyebrow">Live Visibility</p>
            <h2 className="zlon-section-title">Busy / Available</h2>
            <div className="zlon-status-toggle">
              <button
                type="button"
                className={String(salon?.queue_status || 'available').toLowerCase() === 'available' ? 'zlon-status-toggle__button is-active' : 'zlon-status-toggle__button'}
                onClick={() => updateAvailability('available')}
                disabled={statusUpdating}
              >
                Available
              </button>
              <button
                type="button"
                className={String(salon?.queue_status || 'available').toLowerCase() === 'busy' ? 'zlon-status-toggle__button is-active is-warning' : 'zlon-status-toggle__button'}
                onClick={() => updateAvailability('busy')}
                disabled={statusUpdating}
              >
                Busy
              </button>
            </div>
            <p className="zlon-helper-copy">This updates the `salons.queue_status` value used by customer discovery immediately.</p>
          </section>

          <section className="zlon-section-card">
            <div className="zlon-section-row">
              <div>
                <p className="zlon-eyebrow">Appointments</p>
                <h2 className="zlon-section-title">Daily list</h2>
              </div>
              <span className="zlon-badge is-neutral">{appointments.length} total</span>
            </div>
            <div className="zlon-appointment-list">
              {appointments.length === 0 && <div className="zlon-empty-state">No appointments yet. New bookings will appear here.</div>}
              {appointments.map((entry, index) => (
                <article key={`${entry.id || appointmentTitle(entry)}-${index}`} className="zlon-appointment-card">
                  <div>
                    <strong>{appointmentTitle(entry)}</strong>
                    <p>{appointmentMeta(entry)}</p>
                  </div>
                  <span className="zlon-badge is-neutral">₹{readAmount(entry) || 300}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="zlon-section-card">
            <p className="zlon-eyebrow">Supabase Storage</p>
            <h2 className="zlon-section-title">Upload logo or banner</h2>
            <form className="zlon-upload-form" onSubmit={handleAssetUpload}>
              <label className="zlon-input-shell">
                <span className="zlon-input-shell__label">Asset Type</span>
                <select value={assetType} onChange={(event) => setAssetType(event.target.value)}>
                  <option value="logo">Logo</option>
                  <option value="banner">Banner</option>
                </select>
              </label>
              <label className="zlon-input-shell">
                <span className="zlon-input-shell__label">Image File</span>
                <input type="file" accept="image/*" onChange={(event) => setAssetFile(event.target.files?.[0] || null)} />
              </label>
              <button className="zlon-button zlon-button--primary" type="submit" disabled={busy}>
                Upload Asset
              </button>
            </form>
            <p className="zlon-helper-copy">Assets go to the public `salon-assets` bucket and save their public URL back to the salon row.</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="zlon-root">
      <div className="zlon-device zlon-device--business">
        <div className={splashLeaving ? 'zlon-splash is-leaving' : 'zlon-splash'} hidden={appReady}>
          <span className="zlon-splash__logo">ZLon.</span>
        </div>
        <div className={appReady ? 'zlon-frame is-ready' : 'zlon-frame'}>
          {view === 'auth' && <div className="zlon-screen zlon-screen--auth">{renderAuthBody()}</div>}
          {view === 'dashboard' && renderDashboard()}
        </div>
        {toast && <div className="zlon-toast">{toast}</div>}
      </div>
    </div>
  );
}

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
const WALLET_PROVIDER_KEY = 'zlon.consumer.wallet.amazon-pay';
const SCREEN_KEY = 'zlon.consumer.screen';
const AUTH_STATE_KEY = 'zlon.consumer.auth';
const LOCATION_FALLBACK = 'Location auto select';
const COUNTRY_OPTIONS = [
  { flag: '🇮🇳', code: '+91', label: 'India' },
  { flag: '🇦🇪', code: '+971', label: 'UAE' },
  { flag: '🇺🇸', code: '+1', label: 'USA' },
  { flag: '🇬🇧', code: '+44', label: 'UK'},
  { flag: '🇸🇬', code: '+65', label: 'Singapore'},
  { flag: '🇦🇺', code: '+61', label: 'Australia'},
  { flag: '🇨🇦', code: '+1', label: 'Canada' },
  { flag: '🇭🇰', code: '+852', label: 'Hong Kong' },
  { flag: '🇸🇦', code: '+966', label: 'Saudi Arabia'},
  { flag: '🇶🇦', code: '+974', label: 'Qatar'},
  { flag: '🇧🇭', code: '+973', label: 'Bahrain'},
  { flag: '🇪🇬', code: '+20', label: 'Egypt'},
  { flag: '🇹🇷', code: '+90', label: 'Turkey'},
  { flag: '🇮🇩', code: '+62', label: 'Indonesia'},
  { flag: '🇲🇾', code: '+60', label: 'Malaysia'},
  { flag: '🇻🇳', code: '+84', label: 'Vietnam'},
  { flag: '🇹🇭', code: '+66', label: 'Thailand'},  
  { flag: '🇵🇭', code: '+63', label: 'Philippines'},
  { flag: '🇱🇰', code: '+94', label: 'Sri Lanka'},
  { flag: '🇳🇵', code: '+977', label: 'Nepal'},
  { flag: '🇧🇩', code: '+880', label: 'Bangladesh'},
  { flag: '🇲🇳', code: '+976', label: 'Mongolia'},
  { flag: '🇷🇺', code: '+7', label: 'Russia'},
  { flag: '🇿🇦', code: '+27', label: 'South Africa'},
  { flag: '🇧🇷', code: '+55', label: 'Brazil'},
  { flag: '🇲🇽', code: '+52', label: 'Mexico'},
  { flag: '🇨🇱', code: '+56', label: 'Chile'},
  { flag: '🇨🇴', code: '+57', label: 'Colombia'},
  { flag: '🇦🇷', code: '+54', label: 'Argentina'},
  { flag: '🇵🇪', code: '+51', label: 'Peru'},
  { flag: '🇻🇪', code: '+58', label: 'Venezuela'},
  { flag: '🇨🇺', code: '+53', label: 'Cuba'},
  { flag: '🇬🇹', code: '+502', label: 'Guatemala'},
  { flag: '🇪🇨', code: '+593', label: 'Ecuador'},
  { flag: '🇧🇴', code: '+591', label: 'Bolivia'},
  { flag: '🇨🇷', code: '+506', label: 'Costa Rica'},
  { flag: '🇵🇾', code: '+595', label: 'Paraguay'},
  { flag: '🇸🇻', code: '+503', label: 'El Salvador'},
  { flag: '🇭🇳', code: '+504', label: 'Honduras'},
  { flag: '🇳🇮', code: '+505', label: 'Nicaragua'},
  { flag: '🇨🇷', code: '+506', label: 'Costa Rica'},
  { flag: '🇺🇾', code: '+598', label: 'Uruguay'},
  { flag: '🇬🇾', code: '+592', label: 'Guyana'},
  { flag: '🇸🇷', code: '+597', label: 'Suriname'},
  { flag: '🇫🇷', code: '+33', label: 'France'},
  { flag: '🇩🇪', code: '+49', label: 'Germany'},
  { flag: '🇪🇸', code: '+34', label: 'Spain'},
  { flag: '🇮🇹', code: '+39', label: 'Italy'},
  { flag: '🇳🇱', code: '+31', label: 'Netherlands'},
  { flag: '🇧🇪', code: '+32', label: 'Belgium'},
  { flag: '🇨🇭', code: '+41', label: 'Switzerland'},
  { flag: '🇸🇪', code: '+46', label: 'Sweden'},
  { flag: '🇳🇴', code: '+47', label: 'Norway'},
  { flag: '🇩🇰', code: '+45', label: 'Denmark'},
  { flag: '🇫🇮', code: '+358', label: 'Finland'},
  { flag: '🇵🇱', code: '+48', label: 'Poland'},
  { flag: '🇨🇿', code: '+420', label: 'Czech Republic'},
  { flag: '🇭🇺', code: '+36', label: 'Hungary'},
  { flag: '🇷🇴', code: '+40', label: 'Romania'},
  { flag: '🇸🇰', code: '+421', label: 'Slovakia'},
  { flag: '🇸🇮', code: '+386', label: 'Slovenia'},
  { flag: '🇧🇬', code: '+359', label: 'Bulgaria'},
  { flag: '🇱🇹', code: '+370', label: 'Lithuania'},
  { flag: '🇱🇻', code: '+371', label: 'Latvia'},
  { flag: '🇪🇪', code: '+372', label: 'Estonia'},
  { flag: '🇨🇾', code: '+357', label: 'Cyprus'},
  { flag: '🇲🇹', code: '+356', label: 'Malta'},
  { flag: '🇬🇷', code: '+30', label: 'Greece'},
  { flag: '🇵🇹', code: '+351', label: 'Portugal'},
  { flag: '🇮🇸', code: '+354', label: 'Iceland'},
  { flag: '🇱🇺', code: '+352', label: 'Luxembourg'},
  { flag: '🇦🇹', code: '+43', label: 'Austria'},
  { flag: '🇭🇷', code: '+385', label: 'Croatia'},
  { flag: '🇷🇸', code: '+381', label: 'Serbia'},
  { flag: '🇧🇦', code: '+387', label: 'Bosnia and Herzegovina'},
  { flag: '🇲🇰', code: '+389', label: 'North Macedonia'},
  { flag: '🇸🇪', code: '+46', label: 'Sweden'},
  { flag: '🇳🇿', code: '+64', label: 'New Zealand'},
  { flag: '🇯🇵', code: '+81', label: 'Japan'},
  { flag: '🇰🇷', code: '+82', label: 'South Korea'},
  { flag: '🇨🇳', code: '+86', label: 'China'},
  { flag: '🇹🇼', code: '+886', label: 'Taiwan'},
  { flag: '🇭🇰', code: '+852', label: 'Hong Kong'},
  { flag: '🇸🇬', code: '+65', label: 'Singapore'},
  { flag: '🇮🇩', code: '+62', label: 'Indonesia'},
  { flag: '🇲🇾', code: '+60', label: 'Malaysia'},
  { flag: '🇵🇰', code: '+92', label: 'Pakistan'},
  { flag: '🇧🇩', code: '+880', label: 'Bangladesh'},
  { flag: '🇨🇳', code: '+86', label: 'China'},
];

const DEFAULT_PROFILE_FORM = {
  name: '',
  email: '',
  phone: '',
  gender: 'prefer_not_to_say',
  newPassword: ''
};

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

function readAuthState() {
  const stored = readStorage(AUTH_STATE_KEY, {});
  return {
    authStep: getSafeAuthStep(stored.authStep),
    emailMode: stored.emailMode === 'create' ? 'create' : 'login',
    countryCode: COUNTRY_OPTIONS.some((option) => option.code === stored.countryCode) ? stored.countryCode : '+91',
    pendingPhone: typeof stored.pendingPhone === 'string' ? stored.pendingPhone : '',
    pendingEmail: typeof stored.pendingEmail === 'string' ? stored.pendingEmail : ''
  };
}

function clearStorageKey(key) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(key);
}

function toPhoneAttribute(countryCode, rawValue) {
  const trimmed = String(rawValue || '').trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D/g, '');
    return digits ? `+${digits}` : '';
  }

  return toE164Phone(countryCode, trimmed);
}

async function requestPhoneOtp(client, phone, userType = 'customer') {
  const sharedOptions = {
    shouldCreateUser: true,
    data: { user_type: userType }
  };

  const whatsappAttempt = await client.auth.signInWithOtp({
    phone,
    options: {
      ...sharedOptions,
      channel: 'whatsapp'
    }
  });

  if (!whatsappAttempt.error) {
    return { error: null, channel: 'whatsapp' };
  }

  const message = String(whatsappAttempt.error.message || '').toLowerCase();
  const shouldFallbackToSms = ['whatsapp', 'twilio', 'channel', 'unsupported', 'provider'].some((fragment) => message.includes(fragment));
  if (!shouldFallbackToSms) {
    return { error: whatsappAttempt.error, channel: 'whatsapp' };
  }

  const smsAttempt = await client.auth.signInWithOtp({
    phone,
    options: {
      ...sharedOptions,
      channel: 'sms'
    }
  });

  return {
    error: smsAttempt.error || null,
    channel: smsAttempt.error ? 'whatsapp' : 'sms'
  };
}

function buildProfileFormState(user, fallbackPhone = '') {
  const metadata = user?.user_metadata || {};
  return {
    name: metadata.full_name || metadata.name || '',
    email: user?.email || '',
    phone: user?.phone || metadata.phone || fallbackPhone || '',
    gender: metadata.gender || 'prefer_not_to_say',
    newPassword: ''
  };
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
  const initialAuthState = useMemo(() => readAuthState(), []);
  const [appReady, setAppReady] = useState(false);
  const [skipAuthReveal, setSkipAuthReveal] = useState(false);
  const [screen, setScreen] = useState('loading');

  const handleGoogleLogin = async () => {
    console.log('Google login clicked');

    // later connect Supabase here
  };

  const handleAppleLogin = async () => {
    console.log('Apple login clicked');
  };

  const handleEmailLogin = () => {
    console.log('Email login clicked');
    setAuthStep('email');
  };

  const [authStep, setAuthStep] = useState(initialAuthState.authStep);
  const [emailMode, setEmailMode] = useState(initialAuthState.emailMode);
  const [countryCode, setCountryCode] = useState(initialAuthState.countryCode);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [pendingPhone, setPendingPhone] = useState(initialAuthState.pendingPhone);
  const [pendingEmail, setPendingEmail] = useState(initialAuthState.pendingEmail);
  const [phoneChannel, setPhoneChannel] = useState('sms');
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
  const [amazonPayConnected, setAmazonPayConnected] = useState(() => Boolean(readStorage(WALLET_PROVIDER_KEY, false)));
  const [profileForm, setProfileForm] = useState(DEFAULT_PROFILE_FORM);
  const [profileBusy, setProfileBusy] = useState(false);
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

      clearStorageKey(AUTH_STATE_KEY);
      setSkipAuthReveal(true);
      setSession(nextSession);
      setPendingPhone(nextSession.user.phone || pendingPhone);
      setPendingEmail(nextSession.user.email || pendingEmail);
      setStatus('', '');
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
            setSkipAuthReveal(false);
            setAuthStep(readAuthState().authStep);
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

      setSession(null);
      setSkipAuthReveal(false);
      setScreen('auth');

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
      setSkipAuthReveal(false);
      setStatus(getErrorMessage(error, 'Could not finish startup. You can still sign in manually.'), 'error');
    } finally {
      setAuthBootstrapState('ready');
      setAppReady(true);
    }
  }

  useEffect(() => {
    initializeApp();

    return () => {
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

  useEffect(() => {
    writeStorage(WALLET_PROVIDER_KEY, amazonPayConnected);
  }, [amazonPayConnected]);

  useEffect(() => {
    if (session) {
      clearStorageKey(AUTH_STATE_KEY);
      return;
    }

    writeStorage(AUTH_STATE_KEY, {
      authStep: activeAuthStep,
      emailMode,
      countryCode,
      pendingPhone,
      pendingEmail
    });
  }, [activeAuthStep, countryCode, emailMode, pendingEmail, pendingPhone, session]);

  useEffect(() => {
    setProfileForm(buildProfileFormState(session?.user, pendingPhone));
  }, [pendingPhone, session]);

  async function handlePhoneContinue() {
    const client = clientRef.current;
    if (!client) {
      setStatus('6-digit OTP sent to your WhatsApp.', 'success');
      return;
    }

    const nextPhone = toE164Phone(countryCode, phoneInput);
    if (!nextPhone || nextPhone.length < 8) {
      setStatus('Enter a valid mobile number.', 'error');
      return;
    }

    try {
      setBusy(true);
      const { error, channel } = await requestPhoneOtp(client, nextPhone, 'customer');

      if (error) {
        setStatus(error.message, 'error');
        return;
      }

      setPendingPhone(nextPhone);
      setPhoneChannel(channel);
      setPhoneOtp('');
      setAuthStep('phone-otp');
      setStatus(channel === 'whatsapp' ? '6-digit OTP sent on WhatsApp.' : '6-digit OTP sent to your number.', 'success');
    } catch (error) {
      setStatus(getErrorMessage(error, 'Could not send the OTP right now.'), 'error');
    } finally {
      setBusy(false);
    }
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

    try {
      setBusy(true);
      const response = await client.auth.verifyOtp({
        phone: pendingPhone,
        token: phoneOtp,
        type: 'sms'
      });

      if (response.error) {
        setStatus(response.error.message, 'error');
        return;
      }

      await completeCustomerSession(response.data?.session, { restoreScreen: false });
    } catch (error) {
      setStatus(getErrorMessage(error, 'Could not verify this OTP.'), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handlePhoneResend() {
    const client = clientRef.current;
    if (!client || !pendingPhone) {
      return;
    }

    try {
      setBusy(true);
      const { error, channel } = await requestPhoneOtp(client, pendingPhone, 'customer');

      if (error) {
        setStatus(error.message, 'error');
        return;
      }

      setPhoneChannel(channel);
      setStatus(channel === 'whatsapp' ? 'OTP resent on WhatsApp.' : 'OTP resent.', 'success');
    } catch (error) {
      setStatus(getErrorMessage(error, 'Could not resend the OTP.'), 'error');
    } finally {
      setBusy(false);
    }
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

    const nextEmail = emailInput.trim().toLowerCase();

    try {
      setBusy(true);
      suppressAuthListenerRef.current = true;
      let credentialError = null;

      if (emailMode === 'create') {
        const signUp = await client.auth.signUp({
          email: nextEmail,
          password: passwordInput,
          options: {
            data: { user_type: 'customer' }
          }
        });
        credentialError = signUp.error || null;
      } else {
        const signIn = await client.auth.signInWithPassword({
          email: nextEmail,
          password: passwordInput
        });
        credentialError = signIn.error || null;
      }

      if (credentialError) {
        setStatus(credentialError.message, 'error');
        return;
      }

      await client.auth.signOut();
      const otp = await client.auth.signInWithOtp({
        email: nextEmail,
        options: {
          shouldCreateUser: false,
          data: { user_type: 'customer' }
        }
      });

      if (otp.error) {
        setStatus(otp.error.message, 'error');
        return;
      }

      setPendingEmail(nextEmail);
      setEmailOtp('');
      setAuthStep('email-otp');
      setStatus('6-digit OTP sent to your email.', 'success');
    } catch (error) {
      setStatus(getErrorMessage(error, 'Could not start email sign-in right now.'), 'error');
    } finally {
      suppressAuthListenerRef.current = false;
      setBusy(false);
    }
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

    try {
      setBusy(true);
      const response = await client.auth.verifyOtp({
        email: pendingEmail,
        token: emailOtp,
        type: 'email'
      });

      if (response.error) {
        setStatus(response.error.message, 'error');
        return;
      }

      await completeCustomerSession(response.data?.session, { restoreScreen: false });
    } catch (error) {
      setStatus(getErrorMessage(error, 'Could not verify this email OTP.'), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailResend() {
    const client = clientRef.current;
    if (!client || !pendingEmail) {
      return;
    }

    try {
      setBusy(true);
      const otp = await client.auth.signInWithOtp({
        email: pendingEmail,
        options: {
          shouldCreateUser: false,
          data: { user_type: 'customer' }
        }
      });

      if (otp.error) {
        setStatus(otp.error.message, 'error');
        return;
      }

      setStatus('OTP resent.', 'success');
    } catch (error) {
      setStatus(getErrorMessage(error, 'Could not resend the email OTP.'), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleOAuth(provider) {
    const client = clientRef.current;
    if (!client) {
      setStatus('Supabase is not configured yet.', 'error');
      return;
    }

    setBusy(true);
    const redirectTo = typeof window === 'undefined' ? undefined : new URL('/auth/callback', window.location.origin).toString();
    const options = {
      redirectTo
    };

    if (provider === 'google') {
      options.queryParams = {
        prompt: 'select_account',
        access_type: 'offline'
      };
    }

    if (provider === 'apple') {
      options.scopes = 'name email';
    }

    const { error } = await client.auth.signInWithOAuth({
      provider,
      options
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

    clearStorageKey(AUTH_STATE_KEY);
    setSkipAuthReveal(false);
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

  function handleAmazonPayConnect() {
    setAmazonPayConnected(true);
    showToast('Amazon Pay wallet marked as connected. Add provider credentials to activate real payments.');
  }

  function updateProfileField(field, value) {
    setProfileForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleProfileSave() {
    const client = clientRef.current;
    if (!client || !session?.user) {
      return;
    }

    const nextEmail = profileForm.email.trim().toLowerCase();
    const nextPhone = toPhoneAttribute(countryCode, profileForm.phone);
    const nextName = profileForm.name.trim();
    const nextGender = profileForm.gender || 'prefer_not_to_say';

    try {
      setProfileBusy(true);
      const attributes = {
        data: {
          ...(session.user.user_metadata || {}),
          full_name: nextName,
          gender: nextGender,
          phone: nextPhone || null
        }
      };

      if (nextEmail && nextEmail !== session.user.email) {
        attributes.email = nextEmail;
      }

      if (nextPhone && nextPhone !== session.user.phone) {
        attributes.phone = nextPhone;
      }

      const response = await client.auth.updateUser(attributes);
      if (response.error) {
        setStatus(response.error.message, 'error');
        return;
      }

      const nextUser = response.data?.user || session.user;
      await syncProfile(client, nextUser, 'customer', nextPhone || null);
      setSession((current) => (current ? { ...current, user: nextUser } : current));
      setProfileForm(buildProfileFormState(nextUser, nextPhone));
      setStatus(
        nextEmail !== session.user.email || nextPhone !== session.user.phone
          ? 'Profile saved. Confirm any verification message from Supabase to finish contact changes.'
          : 'Profile updated.',
        'success'
      );
      showToast('Profile saved.');
    } catch (error) {
      setStatus(getErrorMessage(error, 'Could not save your profile right now.'), 'error');
    } finally {
      setProfileBusy(false);
    }
  }

  async function handlePasswordUpdate() {
    const client = clientRef.current;
    if (!client) {
      return;
    }

    if (profileForm.newPassword.trim().length < 8) {
      setStatus('Use at least 8 characters for the new password.', 'error');
      return;
    }

    try {
      setProfileBusy(true);
      const response = await client.auth.updateUser({
        password: profileForm.newPassword
      });

      if (response.error) {
        setStatus(response.error.message, 'error');
        return;
      }

      setProfileForm((current) => ({
        ...current,
        newPassword: ''
      }));
      setStatus('Password updated.', 'success');
      showToast('Password updated.');
    } catch (error) {
      setStatus(getErrorMessage(error, 'Could not update the password right now.'), 'error');
    } finally {
      setProfileBusy(false);
    }
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
    const panelStyle = {
      background: '#000',
      color: '#fff',
      borderRadius: '34px 34px 0 0',
      padding: '28px 20px 30px',
      marginTop: '18px'
    };

    const pillShellStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      background: '#fff',
      borderRadius: '999px',
      padding: '6px',
      color: '#000'
    };

    const countryPillStyle = {
      border: 'none',
      borderRadius: '999px',
      background: '#efefef',
      padding: '10px 12px',
      fontWeight: 700,
      fontSize: '18px',
      minWidth: '94px'
    };

    const phoneInputStyle = {
      width: '100%',
      border: 'none',
      outline: 'none',
      fontSize: '28px',
      fontWeight: 600,
      color: '#000',
      background: 'transparent'
    };

    return (
      <div className="zlon-screen zlon-screen--auth zlon-screen--auth-consumer">
        <div className="zlon-auth-template-bg">
          <h1 className="zlon-splash__logo" style={{ fontSize: '70px', marginBottom: '6px', textAlign: 'center' }}>ZLon.</h1>
          <div style={panelStyle}>
            {(activeAuthStep === 'phone' || activeAuthStep === 'phone-otp') && (
              <>
                <p style={{ textAlign: 'center', fontSize: '34px', fontWeight: 800, marginBottom: '18px' }}>
                  Login or sign up
                </p>
                <div style={pillShellStyle}>
                  <select
                    id="country-code"
                    value={countryCode}
                    onChange={(event) => setCountryCode(event.target.value)}
                    style={countryPillStyle}
                  >
                    {COUNTRY_OPTIONS.map((option) => (
                      <option key={option.code} value={option.code}>{`${option.flag} ${option.code}`}</option>
                    ))}
                  </select>
                  <input
                    id="mobile-number"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="Enter Number"
                    value={phoneInput}
                    onChange={(event) => setPhoneInput(event.target.value.replace(/\D/g, ''))}
                    style={phoneInputStyle}
                  />
                </div>
                {activeAuthStep === 'phone-otp' && (
                  <div className="zlon-otp-row" style={{ margin: '20px 0' }}>
                    <OtpInput
                      value={phoneOtp}
                      onChange={setPhoneOtp}
                      numInputs={6}
                      label="Phone OTP"
                      className="zlon-otp-row__group"
                      renderInput={(props) => <input {...props} className="zlon-otp-input" />}
                    />
                  </div>
                )}
                <button className="zlon-auth-continue" type="button" onClick={activeAuthStep === 'phone' ? handlePhoneContinue : handlePhoneVerify} disabled={busy}>
                  Continue
                </button>
                <div className="zlon-social-row">
                  <button className="zlon-social-btn" type="button" onClick={handleGoogleLogin} aria-label="Continue with Google">
                    <GoogleIcon />
                  </button>
                  <button className="zlon-social-btn" type="button" onClick={handleAppleLogin} aria-label="Continue with Apple">
                    <AppleIcon />
                  </button>
                  <button className="zlon-social-btn" type="button" onClick={handleEmailLogin} aria-label="Continue with Email">
                    <MailIcon />
                  </button>
                </div>
              </>
            )}

            {activeAuthStep === 'email' && (
              <>
                <p style={{ textAlign: 'center', fontSize: '30px', fontWeight: 800, marginBottom: '16px' }}>
                  Continue with Email
                </p>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  style={{ ...phoneInputStyle, fontSize: '20px', background: '#fff', borderRadius: '999px', padding: '12px 18px' }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={passwordInput}
                  onChange={(event) => setPasswordInput(event.target.value)}
                  style={{ ...phoneInputStyle, fontSize: '20px', background: '#fff', borderRadius: '999px', padding: '12px 18px', marginTop: '10px' }}
                />
                <button className="zlon-auth-continue" type="button" onClick={handleEmailContinue} disabled={busy}>
                  Continue
                </button>
              </>
            )}

            {activeAuthStep === 'email-otp' && (
              <>
                <p style={{ textAlign: 'center', fontSize: '28px', fontWeight: 800, marginBottom: '16px' }}>
                  Email OTP
                </p>
                <div className="zlon-otp-row" style={{ margin: '20px 0' }}>
                  <OtpInput
                    value={emailOtp}
                    onChange={setEmailOtp}
                    numInputs={6}
                    label="Email OTP"
                    className="zlon-otp-row__group"
                    renderInput={(props) => <input {...props} className="zlon-otp-input" />}
                  />
                </div>
                <button className="zlon-auth-continue" type="button" onClick={handleEmailVerify} disabled={busy}>
                  Verify OTP
                </button>
              </>
            )}

            <div className="zlon-auth-meta-row">
              <button className="zlon-auth-link" type="button" onClick={() => window.open('mailto:support@zlon.in')}>
                Need help?
              </button>
              <button className="zlon-auth-link" type="button" onClick={() => window.location.replace(businessUrl())}>
                For Business log in
              </button>
            </div>
          </div>
          <p className={statusClassName(statusTone)} style={{ marginTop: '12px', textAlign: 'center' }}>{statusMessage}</p>
          <p style={{ fontSize: '12px', marginTop: '14px', color: '#777', textAlign: 'center' }}>
            By continuing, you agree to the ZLon. Infrastructure Terms.
          </p>
        </div>
      </div>
    );
  }

  function renderConsumerHeader({ onBack, title, subtitle }) {
    if (!onBack) {
      return (
        <header className="zlon-topbar zlon-topbar--consumer zlon-topbar--consumer-home">
          <button className="zlon-icon-button zlon-icon-button--consumer" type="button" onClick={() => navigate('profile')} aria-label="Open profile">
            <ProfileIcon className="zlon-icon" />
          </button>
          <div className="zlon-topbar__brand zlon-topbar__brand--consumer-home">
            <span className="zlon-wordmark zlon-wordmark--consumer">{title}</span>
            <span className="zlon-consumer-heading__label">{subtitle}</span>
          </div>
          <button className="zlon-location-pill zlon-location-pill--consumer" type="button" onClick={() => requestLocation({ silent: false }).then(loadSalonData)}>
            <PinIcon className="zlon-location-pill__icon" />
            <span>{locationLabel}</span>
          </button>
        </header>
      );
    }

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
        </div>
      </header>
    );
  }

  function renderHome() {
    const primarySalon = sortedSalons[0];

    return (
      <div className="zlon-screen zlon-screen--home zlon-screen--home-consumer">
        {renderConsumerHeader({ onBack: null, title: 'ZLon.', subtitle: 'Instant Grooming' })}
        
        <main className="zlon-home-grid zlon-home-grid--consumer hide-scrollbar">
          {/* --- Premium Carousel --- */}
          <section className="zlon-slide-panel zlon-slide-panel--consumer">
            <div className="zlon-slide-track" style={{ transform: `translateX(-${carouselIndex * 100}%)` }}>
              {featuredSlides.map((slide, index) => (
                <article key={slide.title + index} className="zlon-slide-card zlon-slide-card--consumer">
                  <span className="zlon-consumer-slide__index">{`0${index + 1}`}</span>
                  <p className="zlon-eyebrow">Featured Service</p>
                  <h2>{slide.title}</h2>
                  <p>{slide.body}</p>
                </article>
              ))}
            </div>
            <div className="zlon-slide-dots zlon-slide-dots--consumer">
              {featuredSlides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={carouselIndex === index ? 'is-active' : ''}
                  onClick={() => setCarouselIndex(index)}
                />
              ))}
            </div>
          </section>

          {/* --- Main Booking Card --- */}
          <section className="zlon-home-panel zlon-home-panel--consumer zlon-home-panel--cta-consumer">
            <div className="zlon-home-panel__copy">
              <span className="zlon-eyebrow">Available Nearby</span>
              <strong>{primarySalon ? primarySalon.name : 'Find a Stylist'}</strong>
              <p>
                {primarySalon
                  ? `${getSalonLocation(primarySalon)} · ${getSalonWaitTime(primarySalon)}`
                  : 'Search the nearest salons and book your chair in one tap.'}
              </p>
            </div>
            <button className="zlon-button zlon-button--primary zlon-button--consumer" type="button" onClick={handleBookOpen}>
              Book Now
            </button>
          </section>

          {/* --- Quick Actions (Replaced empty cells) --- */}
          <section className="zlon-quick-actions">
            <div className="zlon-action-grid">
              <button className="zlon-action-tile" onClick={() => navigate('wallet')}>
                <WalletIcon />
                <span>Add Money</span>
              </button>
              <button className="zlon-action-tile" onClick={() => navigate('history')}>
                <HistoryIcon />
                <span>My Bookings</span>
              </button>
              <button className="zlon-action-tile" onClick={() => navigate('profile')}>
                <SearchIcon />
                <span>Categories</span>
              </button>
              <button className="zlon-action-tile" onClick={() => window.open('https://wa.me/YOUR_NUM', '_blank')}>
                <PinIcon />
                <span>Support</span>
              </button>
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
        <main className="zlon-scroll-view zlon-scroll-view--consumer hide-scrollbar">
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
        <main className="zlon-scroll-view zlon-scroll-view--consumer hide-scrollbar">
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
        <main className="zlon-scroll-view zlon-scroll-view--consumer hide-scrollbar">
          <section className="zlon-section-card zlon-section-card--consumer zlon-section-card--wallet">
            <p className="zlon-eyebrow">Wallet</p>
            <h2 className="zlon-section-title">Internal credits</h2>
            <strong className="zlon-money">₹{walletBalance}</strong>
            <p className="zlon-helper-copy">Keep your next payment step ready before you reach the chair.</p>
          </section>
          <section className="zlon-home-panel zlon-home-panel--consumer">
            <p className="zlon-helper-copy">Recharge internal credits now, and keep Amazon Pay connection ready for the next payment pass.</p>
            <div className="zlon-inline-row zlon-inline-row--consumer">
              <button className="zlon-button zlon-button--primary zlon-button--consumer" type="button" onClick={handleRecharge}>
                Recharge ₹500
              </button>
              <button className="zlon-button zlon-button--ghost zlon-button--consumer" type="button" onClick={handleAmazonPayConnect}>
                {amazonPayConnected ? 'Amazon Pay Linked' : 'Connect Amazon Pay'}
              </button>
            </div>
            <p className="zlon-helper-copy">
              {amazonPayConnected
                ? 'Amazon Pay is marked as linked for this shell. Add provider credentials and callbacks to activate live wallet payments.'
                : 'Amazon Pay connection stays ready here so the wallet area can grow without changing the core layout.'}
            </p>
          </section>
        </main>
      </div>
    );
  }

  function renderProfile() {
    return (
      <div className="zlon-screen zlon-screen--stacked zlon-screen--stacked-consumer">
        {renderConsumerHeader({ onBack: () => navigate('home'), title: 'Profile', subtitle: 'Signed in customer' })}
        <main className="zlon-scroll-view zlon-scroll-view--consumer hide-scrollbar">
          <section className="zlon-section-card zlon-section-card--consumer">
            <p className="zlon-eyebrow">My account</p>
            <h2 className="zlon-section-title">Profile</h2>
            <p className="zlon-helper-copy">Edit the customer details that travel with your consumer shell.</p>
            <div className="zlon-settings-grid">
              <label className="zlon-input-shell zlon-input-shell--consumer-field">
                <span className="zlon-input-shell__label">Name</span>
                <input
                  type="text"
                  autoComplete="name"
                  value={profileForm.name}
                  onChange={(event) => updateProfileField('name', event.target.value)}
                />
              </label>
              <label className="zlon-input-shell zlon-input-shell--consumer-field">
                <span className="zlon-input-shell__label">Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={profileForm.email}
                  onChange={(event) => updateProfileField('email', event.target.value)}
                />
              </label>
              <label className="zlon-input-shell zlon-input-shell--consumer-field">
                <span className="zlon-input-shell__label">Phone number</span>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={profileForm.phone}
                  onChange={(event) => updateProfileField('phone', event.target.value.replace(/[^\d+]/g, ''))}
                />
              </label>
              <label className="zlon-input-shell zlon-input-shell--consumer-field">
                <span className="zlon-input-shell__label">Gender</span>
                <select value={profileForm.gender} onChange={(event) => updateProfileField('gender', event.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </label>
            </div>
            <button className="zlon-button zlon-button--primary zlon-button--consumer zlon-button--full" type="button" onClick={handleProfileSave} disabled={profileBusy}>
              Save profile
            </button>
          </section>
          <section className="zlon-section-card zlon-section-card--consumer">
            <p className="zlon-eyebrow">Change password</p>
            <h2 className="zlon-section-title">Security</h2>
            <label className="zlon-input-shell zlon-input-shell--consumer-field">
              <span className="zlon-input-shell__label">New password</span>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                value={profileForm.newPassword}
                onChange={(event) => updateProfileField('newPassword', event.target.value)}
              />
            </label>
            <button className="zlon-button zlon-button--ghost zlon-button--consumer zlon-button--full" type="button" onClick={handlePasswordUpdate} disabled={profileBusy}>
              Change password
            </button>
          </section>
          <section className="zlon-action-list zlon-action-list--consumer">
            <button className="zlon-action-row zlon-action-row--consumer" type="button" onClick={() => navigate('wallet')}>
              <span>Wallet</span>
              <ArrowRightIcon className="zlon-icon" />
            </button>
            <button className="zlon-action-row zlon-action-row--consumer" type="button" onClick={() => navigate('wallet')}>
              <span>{amazonPayConnected ? 'Amazon Pay connected' : 'Connect Amazon Pay'}</span>
              <ArrowRightIcon className="zlon-icon" />
            </button>
            <button className="zlon-action-row zlon-action-row--consumer" type="button" onClick={() => navigate('history')}>
              <span>History</span>
              <ArrowRightIcon className="zlon-icon" />
            </button>
            <button className="zlon-action-row zlon-action-row--consumer" type="button" onClick={handleLogout}>
              <span>Log out</span>
              <ArrowRightIcon className="zlon-icon" />
            </button>
          </section>
          <p className={statusClassName(statusTone)}>{statusMessage}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="zlon-root zlon-root--consumer">
      <div className={appReady ? 'zlon-splash zlon-splash--consumer is-leaving' : 'zlon-splash zlon-splash--consumer'}>
        <span className="zlon-splash__logo zlon-splash__logo--consumer">ZLon.</span>
      </div>

      <div
        className={`${appReady ? 'zlon-frame is-ready' : 'zlon-frame'} zlon-device zlon-device--consumer zlon-frame--consumer`}
        style={{ opacity: appReady ? 1 : 0 }}
      >
        {screen === 'auth' && renderAuthBody()}
        {screen === 'home' && renderHome()}
        {screen === 'book' && renderBook()}
        {screen === 'history' && renderHistory()}
        {screen === 'wallet' && renderWallet()}
        {screen === 'profile' && renderProfile()}

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

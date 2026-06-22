'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

// Refresh interval for the auth cookie (50 minutes).
// Firebase ID tokens expire after 1 hour, so we refresh well before that
// to keep the middleware cookie valid.
const TOKEN_REFRESH_INTERVAL_MS = 50 * 60 * 1000;

function setAuthCookie(token: string) {
  Cookies.set('firebase-auth-token', token, {
    expires: 7,
    path: '/',
    sameSite: 'Lax',
    secure: window.location.protocol === 'https:',
  });
}

function clearAuthCookie() {
  Cookies.remove('firebase-auth-token', { path: '/' });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Start as true — the app must NOT render authenticated/unauthenticated UI
  // until onAuthStateChanged has fired at least once.
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTokenRefresh = useCallback((currentUser: User) => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    refreshTimerRef.current = setInterval(async () => {
      try {
        const token = await currentUser.getIdToken(true);
        setAuthCookie(token);
      } catch (err) {
        console.error('Token refresh failed:', err);
      }
    }, TOKEN_REFRESH_INTERVAL_MS);
  }, []);

  const stopTokenRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      // Server-side or auth not available — nothing to wait for
      setLoading(false);
      return;
    }

    // onAuthStateChanged fires ONCE synchronously on subscribe with the
    // current auth state (which may be null if still resolving from IndexedDB),
    // then again once the persisted session is recovered.
    // With browserLocalPersistence, the SDK reads IndexedDB before the first
    // callback, so the first call already has the correct user.
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          setAuthCookie(token);
          startTokenRefresh(currentUser);
        } catch (err) {
          console.error('Failed to get initial token:', err);
        }
      } else {
        clearAuthCookie();
        stopTokenRefresh();
      }

      // Mark loading as done after the first auth state resolution.
      // This is critical — without this guard, pages that check `!user`
      // would redirect to the landing page before the SDK has had a chance
      // to recover the session from IndexedDB.
      setLoading(false);
    });

    return () => {
      unsubscribe();
      stopTokenRefresh();
    };
  }, [startTokenRefresh, stopTokenRefresh]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
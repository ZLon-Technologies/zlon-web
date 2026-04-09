"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

async function resolveUserType(db, user) {
  const { data } = await db.from("profiles").select("user_type").eq("id", user.id).maybeSingle();
  return data?.user_type === "owner" ? "owner" : "customer";
}

function hostRole() {
  if (typeof window === "undefined") return "consumer";
  return window.location.hostname === "mybusiness.zlon.in" ? "owner" : "consumer";
}

function redirectByRole(role) {
  if (typeof window === "undefined") return;
  if (role === "owner" && window.location.hostname !== "mybusiness.zlon.in") {
    window.location.href = "https://mybusiness.zlon.in";
  }
  if (role === "customer" && window.location.hostname === "mybusiness.zlon.in") {
    window.location.href = "https://www.zlon.in";
  }
}

export default function AppPage() {
  const db = useMemo(() => getSupabaseBrowserClient(), []);
  const [phase, setPhase] = useState("splash");
  const [authMode, setAuthMode] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lockedTarget, setLockedTarget] = useState("");
  const [message, setMessage] = useState("");
  const [userType, setUserType] = useState("customer");
  const [tab, setTab] = useState("home");
  const [locationName, setLocationName] = useState("Current Location");
  const [ownerSalon, setOwnerSalon] = useState(null);
  const [ownerQueue, setOwnerQueue] = useState([]);
  const [ownerStatus, setOwnerStatus] = useState("available");

  useEffect(() => {
    registerServiceWorker();
    const t1 = setTimeout(() => setPhase("splash-shift"), 700);
    const t2 = setTimeout(async () => {
      const { data } = await db.auth.getSession();
      if (data.session?.user) {
        const type = await resolveUserType(db, data.session.user);
        setUserType(type);
        redirectByRole(type);
        setPhase(type === "owner" && hostRole() === "owner" ? "owner-dashboard" : "home");
      } else {
        setPhase(hostRole() === "owner" ? "owner-auth" : "auth");
      }
    }, 1400);
    navigator.geolocation?.getCurrentPosition(() => setLocationName("Near You"));
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [db]);

  useEffect(() => {
    if (phase === "owner-dashboard") {
      loadOwnerData();
    }
  }, [phase]);

  async function sendPhoneOtp() {
    setMessage("");
    const value = phone.trim();
    if (!value) return setMessage("Enter mobile number.");
    const { error } = await db.auth.signInWithOtp({ phone: value });
    if (error) return setMessage(error.message);
    setLockedTarget(value);
    setAuthMode("phone");
    setPhase(hostRole() === "owner" ? "owner-otp" : "otp");
  }

  async function verifyPhoneOtp() {
    const { data, error } = await db.auth.verifyOtp({ phone: lockedTarget, token: otp, type: "sms" });
    if (error) return setMessage(error.message);
    const type = await resolveUserType(db, data.user);
    setUserType(type);
    redirectByRole(type);
    setPhase(type === "owner" && hostRole() === "owner" ? "owner-dashboard" : "home");
  }

  async function continueWithGoogle() {
    const target = hostRole() === "owner" ? "https://mybusiness.zlon.in" : "https://www.zlon.in";
    const { error } = await db.auth.signInWithOAuth({ provider: "google", options: { redirectTo: target } });
    if (error) setMessage(error.message);
  }

  function openEmailCapture() {
    setAuthMode("email");
    setPhase(hostRole() === "owner" ? "owner-email" : "email");
  }

  async function sendEmailOtpAfterPassword() {
    let authError = null;
    if (hostRole() === "owner") {
      const { error } = await db.auth.signInWithPassword({ email, password });
      authError = error;
    } else {
      const { error } = await db.auth.signUp({ email, password });
      authError = error;
    }
    if (authError && !authError.message.toLowerCase().includes("already")) return setMessage(authError.message);
    const { error } = await db.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) return setMessage(error.message);
    setLockedTarget(email);
    setPhase(hostRole() === "owner" ? "owner-otp" : "otp");
  }

  async function verifyEmailOtp() {
    const { data, error } = await db.auth.verifyOtp({ email: lockedTarget, token: otp, type: "email" });
    if (error) return setMessage(error.message);
    const type = await resolveUserType(db, data.user);
    setUserType(type);
    redirectByRole(type);
    setPhase(type === "owner" && hostRole() === "owner" ? "owner-dashboard" : "home");
  }

  async function signOut() {
    await db.auth.signOut();
    setPhase(hostRole() === "owner" ? "owner-auth" : "auth");
  }

  async function loadOwnerData() {
    const { data: sessionData } = await db.auth.getSession();
    if (!sessionData.session?.user) return;
    const user = sessionData.session.user;
    const { data: salon } = await db.from("salons").select("*").eq("owner_id", user.id).maybeSingle();
    if (!salon) return;
    setOwnerSalon(salon);
    setOwnerStatus(salon.queue_status || "available");
    const { data: queue } = await db.from("queue").select("*").eq("salon_id", salon.id).order("created_at", { ascending: true });
    setOwnerQueue(queue || []);
  }

  async function updateOwnerStatus(nextStatus) {
    if (!ownerSalon) return;
    const { data } = await db
      .from("salons")
      .update({
        queue_status: nextStatus,
        waitTime: nextStatus === "busy" ? "15 Mins" : "No Wait",
      })
      .eq("id", ownerSalon.id)
      .select("*")
      .maybeSingle();
    if (data) {
      setOwnerSalon(data);
      setOwnerStatus(nextStatus);
    }
  }

  if (phase === "splash" || phase === "splash-shift") {
    return (
      <div className="app-shell">
        <div className="center-screen" style={{ background: "#fff" }}>
          <div
            className="zlon-logo"
            style={{ color: "#000", transform: phase === "splash-shift" ? "translateY(-90px)" : "translateY(0)", transition: "transform .55s ease" }}
          >
            ZLon.
          </div>
        </div>
      </div>
    );
  }

  if (phase === "auth" || phase === "owner-auth") {
    return (
      <div className="app-shell">
        <div className="center-screen">
          <div className="card" style={{ display: "grid", gap: 12 }}>
            <div className="zlon-logo" style={{ fontSize: 32 }}>ZLon.</div>
            <div style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: 8 }}>
              <select className="input" defaultValue="+91"><option value="+91">🇮🇳 +91</option></select>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile Number" />
            </div>
            <button className="btn-primary" onClick={sendPhoneOtp}>Continue</button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <button className="btn-secondary" onClick={continueWithGoogle}>Google</button>
              <button className="btn-secondary" disabled>Apple</button>
              <button className="btn-secondary" onClick={openEmailCapture}>Email</button>
            </div>
            {message ? <div className="muted">{message}</div> : null}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "email" || phase === "owner-email") {
    return (
      <div className="app-shell">
        <div className="center-screen">
          <div className="card" style={{ display: "grid", gap: 10 }}>
            <div className="zlon-logo" style={{ fontSize: 28 }}>Email Login</div>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input className="input" value={password} type="password" onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            <button className="btn-primary" onClick={sendEmailOtpAfterPassword}>Continue</button>
            <button className="btn-secondary" onClick={() => setPhase(hostRole() === "owner" ? "owner-auth" : "auth")}>Back</button>
            {message ? <div className="muted">{message}</div> : null}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "otp" || phase === "owner-otp") {
    return (
      <div className="app-shell">
        <div className="center-screen">
          <div className="card" style={{ display: "grid", gap: 10 }}>
            <div className="zlon-logo" style={{ fontSize: 28 }}>Verify OTP</div>
            <div className="muted">To: {lockedTarget}</div>
            <input className="input" value={otp} onChange={(e) => setOtp(e.target.value.slice(0, 6))} placeholder="6 digit OTP" />
            <button className="btn-primary" onClick={authMode === "email" ? verifyEmailOtp : verifyPhoneOtp}>Verify</button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button className="btn-secondary" onClick={authMode === "email" ? sendEmailOtpAfterPassword : sendPhoneOtp}>Resend OTP</button>
              <button className="btn-secondary" onClick={() => setPhase(hostRole() === "owner" ? "owner-auth" : "auth")}>Back</button>
            </div>
            {message ? <div className="muted">{message}</div> : null}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "owner-dashboard") {
    const servedCount = ownerQueue.filter((q) => q.status === "served").length;
    const earnings = servedCount * 250;
    const waiting = ownerQueue.filter((q) => (q.status || "waiting") === "waiting");
    return (
      <div className="app-shell">
        <div className="top-header">
          <div className="muted">Owner</div>
          <div style={{ textAlign: "center", fontWeight: 900 }}>ZLon.</div>
          <button className="btn-secondary" style={{ minHeight: 34 }} onClick={signOut}>Logout</button>
        </div>
        <div className="home-body">
          <div className="home-content">
            <div className="card">
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Daily Appointments</div>
              {waiting.length ? waiting.map((q) => (
                <div key={q.id} className="muted" style={{ marginBottom: 6 }}>
                  {(q.name || q.customer_name || "Customer")} - {(q.phone || q.customer_phone || "No phone")}
                </div>
              )) : <div className="muted">No active appointments</div>}
            </div>
            <div className="card">
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Earnings</div>
              <div style={{ fontSize: 28, fontWeight: 900 }}>₹{earnings}</div>
            </div>
            <div className="card">
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Busy / Available</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button className={ownerStatus === "available" ? "btn-primary" : "btn-secondary"} onClick={() => updateOwnerStatus("available")}>Available</button>
                <button className={ownerStatus === "busy" ? "btn-primary" : "btn-secondary"} onClick={() => updateOwnerStatus("busy")}>Busy</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="top-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="profile-dot" />
          <span style={{ fontSize: 12 }} className="muted">Profile</span>
        </div>
        <div style={{ textAlign: "center", fontWeight: 900, fontSize: 28 }}>ZLon.</div>
        <div style={{ textAlign: "right", fontSize: 12 }}>📍 {locationName}</div>
      </div>
      <div className="home-body">
        <div className="home-content">
          <div className="book-now">[ book now ]</div>
          <div className="ads-box">[ here will be the adds ]</div>
          <button className="btn-secondary gold" onClick={() => window.location.href = "/wallet"}>Wallet</button>
          {userType === "owner" ? <div className="muted">Redirecting owner account...</div> : null}
        </div>
      </div>
      <div className="bottom-nav">
        <button className="nav-item" onClick={() => setTab("home")}>🏠 Home</button>
        <button className="nav-item" onClick={() => setTab("history")}>🕘 History</button>
      </div>
      {tab === "history" ? (
        <div style={{ position: "absolute", inset: "72px 20px 92px", background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: 16 }}>
          <strong>History</strong>
          <div className="muted" style={{ marginTop: 6 }}>Your appointment history appears here.</div>
        </div>
      ) : null}
    </div>
  );
}

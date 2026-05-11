"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import TradingDashboard from "@/components/dashboard";
import Link from "next/link";
import { Lock, CreditCard, ChevronRight, Shield, LogIn, X, Clock, Zap, TrendingUp, BarChart3, CheckCircle, AlertCircle } from "lucide-react";

const T = {
  bg: "#0a0e17", bg2: "#111827", bg3: "#1a2235",
  border: "#1e2d45", borderL: "#2a3f5f",
  text: "#e2e8f0", textM: "#94a3b8", textD: "#64748b",
  green: "#10b981", greenBg: "rgba(16,185,129,0.1)", greenBd: "rgba(16,185,129,0.25)",
  red: "#ef4444",
  amber: "#f59e0b", amberBg: "rgba(245,158,11,0.1)", amberBd: "rgba(245,158,11,0.25)",
  accent: "#8b5cf6", accentBg: "rgba(139,92,246,0.1)", accentBd: "rgba(139,92,246,0.25)",
  cyan: "#06b6d4",
};

const PACKAGES = [
  { id: "daily",   name: "24-Hour Pass",   price: "KES 500",   period: "/ day",  desc: "Full access for one day — perfect for event trading", badge: null, color: T.cyan },
  { id: "weekly",  name: "Weekly Pro",     price: "KES 2,500", period: "/ week", desc: "Best for swing traders. All signals + COT analysis", badge: "Popular", color: T.accent },
  { id: "monthly", name: "Monthly Elite",  price: "KES 8,000", period: "/ mo",   desc: "Save 20% — unlimited signals, AI analysis, full access", badge: "Best Value", color: T.green },
];

const PREVIEW_SECONDS = 5;

// ── Subscription modal ────────────────────────────────────────────────────────
function SubscribeModal({ onClose, isGuest, countdown }) {
  const [selected, setSelected] = useState("weekly");
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/paystack/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: selected }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        alert(data.error || "Payment initiation failed. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(7,11,19,0.92)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", fontFamily: "var(--font-geist-mono),monospace" }}
      onClick={isGuest ? undefined : onClose}>
      <div style={{ width: "100%", maxWidth: 520, background: T.bg2, borderRadius: 20, border: `1px solid ${T.borderL}`, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "24px 24px 0", position: "relative" }}>
          {!isGuest && (
            <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: T.textD, cursor: "pointer", padding: 4 }}><X size={18}/></button>
          )}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#8b5cf6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Zap size={26} color="#fff"/>
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.5px" }}>
              {isGuest ? "Your preview ended" : "Unlock Full Access"}
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: T.textM, lineHeight: 1.6, maxWidth: 380 }}>
              {isGuest
                ? "Subscribe to get live signals, AI analysis, COT data, and real-time order flow — all in one place."
                : "Your current plan doesn't include this feature. Upgrade to continue."}
            </p>
          </div>

          {/* Feature pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 20 }}>
            {[
              { icon: <TrendingUp size={11}/>, label: "Live Signals" },
              { icon: <BarChart3 size={11}/>, label: "COT Analysis" },
              { icon: <Zap size={11}/>, label: "AI Strategy" },
              { icon: <BarChart3 size={11}/>, label: "Order Flow" },
            ].map(f => (
              <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 20, background: T.accentBg, border: `1px solid ${T.accentBd}`, fontSize: 11, color: T.accent }}>
                {f.icon}{f.label}
              </div>
            ))}
          </div>
        </div>

        {/* Packages */}
        <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 8 }}>
          {PACKAGES.map(pkg => {
            const isSelected = selected === pkg.id;
            return (
              <div key={pkg.id} onClick={() => setSelected(pkg.id)}
                style={{ padding: "14px 16px", borderRadius: 12, border: `2px solid ${isSelected ? pkg.color : T.border}`, background: isSelected ? `${pkg.color}08` : T.bg, cursor: "pointer", transition: "all 0.15s", position: "relative" }}>
                {pkg.badge && (
                  <div style={{ position: "absolute", top: -9, right: 12, fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 10, background: pkg.color, color: "#fff", letterSpacing: 0.5, textTransform: "uppercase" }}>{pkg.badge}</div>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${isSelected ? pkg.color : T.border}`, background: isSelected ? pkg.color : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {isSelected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }}/>}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: isSelected ? T.text : T.textM }}>{pkg.name}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textD, marginLeft: 24 }}>{pkg.desc}</div>
                  </div>
                  <div style={{ textAlign: "right", marginLeft: 12 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: isSelected ? pkg.color : T.textM }}>{pkg.price}</div>
                    <div style={{ fontSize: 10, color: T.textD }}>{pkg.period}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{ padding: "20px 24px 24px" }}>
          <button onClick={handlePay} disabled={loading}
            style={{ width: "100%", padding: "14px", borderRadius: 12, background: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <CreditCard size={18}/>{loading ? "Initiating payment…" : `Subscribe — ${PACKAGES.find(p=>p.id===selected)?.price}`}
          </button>
          <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: T.textD }}>
            Payments via Paystack · M-Pesa / Card / Bank · Instant activation
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
            <div style={{ flex: 1, height: 1, background: T.border }}/>
            <span style={{ fontSize: 11, color: T.textD }}>already have an account?</span>
            <div style={{ flex: 1, height: 1, background: T.border }}/>
          </div>

          <Link href="/login"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 12, border: `1px solid ${T.border}`, color: T.textM, fontSize: 14, fontWeight: 600, textDecoration: "none", transition: "all 0.15s" }}
            onMouseOver={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textM; }}>
            <LogIn size={16}/> Sign In to your account
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Countdown banner ──────────────────────────────────────────────────────────
function CountdownBanner({ seconds }) {
  const pct = (seconds / PREVIEW_SECONDS) * 100;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 500, background: "rgba(10,14,23,0.95)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${T.borderL}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, fontFamily: "var(--font-geist-mono),monospace" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.accentBg, border: `1px solid ${T.accentBd}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Clock size={15} style={{ color: T.accent }}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>
          Free preview — {seconds} second{seconds !== 1 ? "s" : ""} remaining
        </div>
        <div style={{ height: 3, background: T.bg3, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${T.accent},${T.cyan})`, borderRadius: 2, transition: "width 1s linear" }}/>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <Link href="/login" style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, background: T.bg3, border: `1px solid ${T.border}`, color: T.textM, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
          <LogIn size={12}/> Sign In
        </Link>
        <Link href="/register" style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, background: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#fff", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
          <Zap size={12}/> Subscribe
        </Link>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [hasSubscription, setHasSubscription] = useState(false);
  const [subChecked, setSubChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [paymentBanner, setPaymentBanner] = useState(null);

  // Guest preview state
  const [guestCountdown, setGuestCountdown] = useState(PREVIEW_SECONDS);
  const [guestPreviewDone, setGuestPreviewDone] = useState(false);
  const timerRef = useRef(null);

  const isGuest = status === "unauthenticated";
  const isLoading = status === "loading";

  // Show payment result banner from Paystack callback
  useEffect(() => {
    const p = searchParams.get("payment");
    if (!p) return;
    setPaymentBanner(p);
    if (p === "success") {
      setHasSubscription(true);
      setSubChecked(true);
    }
    const t = setTimeout(() => setPaymentBanner(null), 6000);
    router.replace("/dashboard");
    return () => clearTimeout(t);
  }, [searchParams, router]);

  // ── Subscription check for logged-in users ────────────────────────────────
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/subscription/status")
      .then(r => r.json())
      .then(data => {
        if (data.active) setHasSubscription(true);
        if (data.role === "ADMIN") { setIsAdmin(true); setHasSubscription(true); }
      })
      .catch(() => {})
      .finally(() => setSubChecked(true));
  }, [status]);

  // ── Guest preview countdown ───────────────────────────────────────────────
  useEffect(() => {
    if (!isGuest) return;
    timerRef.current = setInterval(() => {
      setGuestCountdown(n => {
        if (n <= 1) {
          clearInterval(timerRef.current);
          setGuestPreviewDone(true);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [isGuest]);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, fontFamily: "var(--font-geist-mono),monospace" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#8b5cf6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <TrendingUp size={22} color="#fff"/>
        </div>
        <div style={{ fontSize: 13, color: T.textD }}>Loading TradingIntel…</div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      </div>
    );
  }

  // ── Handle subscription modal trigger for logged-in users ─────────────────
  const handleDashboardClick = (e) => {
    if (status === "authenticated" && subChecked && !hasSubscription) {
      e.stopPropagation();
      e.preventDefault();
      setShowModal(true);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Admin badge */}
      {isAdmin && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999 }}>
          <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, background: T.amber, color: "#000", fontWeight: 700, fontSize: 13, boxShadow: "0 4px 20px rgba(245,158,11,0.4)", textDecoration: "none" }}>
            <Shield size={15}/> Admin Panel
          </Link>
        </div>
      )}

      {/* Payment result banner */}
      {paymentBanner && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 600, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "var(--font-geist-mono),monospace", fontSize: 13, fontWeight: 600, background: paymentBanner === "success" ? "rgba(16,185,129,0.95)" : "rgba(239,68,68,0.95)", color: "#fff", backdropFilter: "blur(8px)" }}>
          {paymentBanner === "success" ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
          {paymentBanner === "success" ? "Payment successful — your subscription is now active!" : "Payment was not completed. Please try again."}
          <button onClick={() => setPaymentBanner(null)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", marginLeft: 8, opacity: 0.8 }}><X size={14}/></button>
        </div>
      )}

      {/* Guest countdown banner */}
      {isGuest && !guestPreviewDone && (
        <CountdownBanner seconds={guestCountdown} />
      )}

      {/* Dashboard (blurred when guest preview ended) */}
      <div
        onClickCapture={handleDashboardClick}
        style={{
          filter: guestPreviewDone ? "blur(4px) brightness(0.5)" : "none",
          transition: "filter 0.4s",
          pointerEvents: guestPreviewDone ? "none" : "auto",
          paddingTop: (isGuest && !guestPreviewDone) ? 60 : 0,
        }}
      >
        <TradingDashboard />
      </div>

      {/* Logged-in user subscribe modal (when no subscription) */}
      {status === "authenticated" && subChecked && !hasSubscription && showModal && (
        <SubscribeModal onClose={() => setShowModal(false)} isGuest={false} />
      )}

      {/* Guest preview-ended modal (non-dismissible) */}
      {isGuest && guestPreviewDone && (
        <SubscribeModal onClose={() => {}} isGuest={true} />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}

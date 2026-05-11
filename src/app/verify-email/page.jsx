"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const T = {
  bg: "#070b13", card: "#0d1321", border: "#1a2840",
  text: "#f1f5f9", textM: "#94a3b8", textD: "#64748b",
  green: "#10b981", greenBg: "rgba(16,185,129,0.1)", greenBd: "rgba(16,185,129,0.25)",
  red: "#ef4444", redBg: "rgba(239,68,68,0.1)", redBd: "rgba(239,68,68,0.25)",
  amber: "#f59e0b", amberBg: "rgba(245,158,11,0.1)", amberBd: "rgba(245,158,11,0.25)",
  accent: "#8b5cf6", accentBg: "rgba(139,92,246,0.1)", accentBd: "rgba(139,92,246,0.25)",
};

function VerifyEmailContent() {
  const params = useSearchParams();
  const status = params.get("status");
  const error = params.get("error");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resentError, setResentError] = useState("");

  const isSuccess = status === "success" || status === "already";
  const isExpired = error === "expired";
  const isInvalid = error === "invalid" || error === "missing";

  const resend = async () => {
    if (!email) return;
    setResending(true); setResentError("");
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResent(true);
    } catch { setResentError("Failed to resend. Please try again."); }
    setResending(false);
  };

  const states = {
    success: {
      icon: "✓", iconColor: T.green, iconBg: T.greenBg, iconBd: T.greenBd,
      title: "Email Verified!",
      message: "Your account is now active. Welcome to TradingIntel — your institutional-grade trading intelligence suite is ready.",
      cta: { label: "Open Dashboard →", href: "/dashboard", color: T.accent },
    },
    already: {
      icon: "✓", iconColor: T.green, iconBg: T.greenBg, iconBd: T.greenBd,
      title: "Already Verified",
      message: "Your email has already been verified. You can sign in to access your dashboard.",
      cta: { label: "Sign In →", href: "/login", color: T.accent },
    },
    expired: {
      icon: "⏱", iconColor: T.amber, iconBg: T.amberBg, iconBd: T.amberBd,
      title: "Link Expired",
      message: "This verification link has expired. Enter your email below to receive a new one.",
    },
    invalid: {
      icon: "✕", iconColor: T.red, iconBg: T.redBg, iconBd: T.redBd,
      title: "Invalid Link",
      message: "This verification link is invalid or has already been used. Enter your email below to get a new link.",
    },
    waiting: {
      icon: "✉", iconColor: T.accent, iconBg: T.accentBg, iconBd: T.accentBd,
      title: "Check Your Email",
      message: "We've sent a verification link to your email address. Click the link to activate your account.",
    },
  };

  const state = isSuccess && status === "already" ? states.already
    : isSuccess ? states.success
    : isExpired ? states.expired
    : isInvalid ? states.invalid
    : states.waiting;

  const showResendForm = isExpired || isInvalid;

  const inp = {
    width: "100%", padding: "12px 16px", borderRadius: 10, fontSize: 14,
    background: "#0a0f1c", border: `1px solid ${T.border}`, color: T.text,
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "var(--font-geist-mono), monospace" }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", marginBottom: 36, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: "linear-gradient(135deg,#8b5cf6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📈</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: "-0.5px" }}>TradingIntel</div>
          <div style={{ fontSize: 10, color: T.textD, textTransform: "uppercase", letterSpacing: "0.5px" }}>Forex Intelligence</div>
        </div>
      </Link>

      {/* Card */}
      <div style={{ width: "100%", maxWidth: 440, background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, overflow: "hidden" }}>
        {/* Top accent bar */}
        <div style={{ height: 3, background: "linear-gradient(90deg,#8b5cf6,#6366f1,#06b6d4,#10b981)" }} />

        <div style={{ padding: "36px 36px 32px" }}>
          {/* Icon */}
          <div style={{ width: 64, height: 64, borderRadius: 18, background: state.iconBg, border: `1px solid ${state.iconBd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 20, color: state.iconColor }}>
            {state.icon}
          </div>

          <h1 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: "-0.5px" }}>{state.title}</h1>
          <p style={{ margin: "0 0 24px", fontSize: 14, lineHeight: 1.7, color: T.textM }}>{state.message}</p>

          {/* Success CTA */}
          {state.cta && (
            <Link href={state.cta.href} style={{ display: "inline-flex", alignItems: "center", padding: "13px 28px", borderRadius: 11, background: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none", marginBottom: 16 }}>
              {state.cta.label}
            </Link>
          )}

          {/* Resend form */}
          {showResendForm && !resent && (
            <div style={{ marginTop: 8 }}>
              <div style={{ height: 1, background: T.border, marginBottom: 24 }} />
              <label style={{ fontSize: 12, fontWeight: 600, color: T.textD, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Your email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inp} />
              {resentError && <p style={{ margin: "8px 0 0", fontSize: 12, color: T.red }}>{resentError}</p>}
              <button onClick={resend} disabled={resending || !email} style={{ marginTop: 12, width: "100%", padding: "13px", borderRadius: 11, background: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", opacity: resending || !email ? 0.6 : 1 }}>
                {resending ? "Sending…" : "Send New Verification Link"}
              </button>
            </div>
          )}

          {resent && (
            <div style={{ marginTop: 16, padding: "14px 18px", borderRadius: 10, background: T.greenBg, border: `1px solid ${T.greenBd}` }}>
              <p style={{ margin: 0, fontSize: 13, color: T.green, fontWeight: 600 }}>✓ Verification email sent — check your inbox.</p>
            </div>
          )}

          {/* Waiting state resend option */}
          {!showResendForm && !isSuccess && (
            <div style={{ marginTop: 16 }}>
              <div style={{ height: 1, background: T.border, marginBottom: 16 }} />
              {!resent ? (
                <>
                  <p style={{ margin: "0 0 12px", fontSize: 13, color: T.textD }}>Didn't receive it? Check your spam folder, or request a new link:</p>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" style={{ ...inp, marginBottom: 10 }} />
                  <button onClick={resend} disabled={resending || !email} style={{ padding: "10px 20px", borderRadius: 9, background: T.accentBg, color: T.accent, border: `1px solid ${T.accentBd}`, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: resending || !email ? 0.6 : 1 }}>
                    {resending ? "Sending…" : "Resend verification email"}
                  </button>
                </>
              ) : (
                <div style={{ padding: "12px 16px", borderRadius: 10, background: T.greenBg, border: `1px solid ${T.greenBd}` }}>
                  <p style={{ margin: 0, fontSize: 13, color: T.green, fontWeight: 600 }}>✓ New verification link sent — check your inbox.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 36px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "center", gap: 20 }}>
          <Link href="/login" style={{ fontSize: 13, color: T.textD, textDecoration: "none" }}>Sign in</Link>
          <Link href="/register" style={{ fontSize: 13, color: T.textD, textDecoration: "none" }}>Create account</Link>
          <a href="mailto:support@tradeintel.live" style={{ fontSize: 13, color: T.textD, textDecoration: "none" }}>Support</a>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

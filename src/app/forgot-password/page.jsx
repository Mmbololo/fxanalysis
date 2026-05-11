"use client";
import { useState } from "react";
import Link from "next/link";

const T = {
  bg: "#070b13", card: "#0d1321", border: "#1a2840",
  text: "#f1f5f9", textM: "#94a3b8", textD: "#64748b",
  green: "#10b981", greenBg: "rgba(16,185,129,0.1)", greenBd: "rgba(16,185,129,0.25)",
  red: "#ef4444", redBg: "rgba(239,68,68,0.1)", redBd: "rgba(239,68,68,0.25)",
  accent: "#8b5cf6", accentBg: "rgba(139,92,246,0.1)", accentBd: "rgba(139,92,246,0.25)",
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const inp = {
    width: "100%", padding: "12px 16px", borderRadius: 10, fontSize: 14,
    background: "#0a0f1c", border: `1px solid ${T.border}`, color: T.text,
    outline: "none", boxSizing: "border-box",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch { setError("Something went wrong. Please try again."); }
    setLoading(false);
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

      <div style={{ width: "100%", maxWidth: 440, background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, overflow: "hidden" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg,#8b5cf6,#6366f1,#06b6d4,#10b981)" }} />
        <div style={{ padding: "36px 36px 32px" }}>
          {sent ? (
            <>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: T.greenBg, border: `1px solid ${T.greenBd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 20 }}>✉</div>
              <h1 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 800, color: T.text }}>Check your inbox</h1>
              <p style={{ margin: "0 0 24px", fontSize: 14, lineHeight: 1.7, color: T.textM }}>
                If an account with <strong style={{ color: T.text }}>{email}</strong> exists, we sent a password reset link. It expires in 1 hour.
              </p>
              <div style={{ padding: "12px 16px", borderRadius: 10, background: T.accentBg, border: `1px solid ${T.accentBd}`, marginBottom: 24 }}>
                <p style={{ margin: 0, fontSize: 13, color: T.accent }}>Check your spam folder if you don't see it within a few minutes.</p>
              </div>
              <Link href="/login" style={{ display: "inline-flex", alignItems: "center", padding: "13px 28px", borderRadius: 11, background: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                Back to Sign In →
              </Link>
            </>
          ) : (
            <>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: T.accentBg, border: `1px solid ${T.accentBd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 20 }}>🔑</div>
              <h1 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 800, color: T.text }}>Reset password</h1>
              <p style={{ margin: "0 0 28px", fontSize: 14, lineHeight: 1.7, color: T.textM }}>
                Enter the email address for your account and we'll send you a reset link.
              </p>

              {error && (
                <div style={{ padding: "12px 16px", borderRadius: 10, background: T.redBg, border: `1px solid ${T.redBd}`, marginBottom: 20 }}>
                  <p style={{ margin: 0, fontSize: 13, color: T.red }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.textD, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Email address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inp} />
                </div>
                <button type="submit" disabled={loading} style={{ padding: "13px", borderRadius: 11, background: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Sending…" : "Send Reset Link →"}
                </button>
              </form>
            </>
          )}
        </div>

        <div style={{ padding: "16px 36px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "center", gap: 20 }}>
          <Link href="/login" style={{ fontSize: 13, color: T.textD, textDecoration: "none" }}>Sign in</Link>
          <Link href="/register" style={{ fontSize: 13, color: T.textD, textDecoration: "none" }}>Create account</Link>
          <a href="mailto:support@tradeintel.live" style={{ fontSize: 13, color: T.textD, textDecoration: "none" }}>Support</a>
        </div>
      </div>
    </div>
  );
}

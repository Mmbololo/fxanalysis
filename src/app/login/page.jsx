"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const T = {
  bg: "#070b13", card: "#0d1321", border: "#1a2840",
  text: "#f1f5f9", textM: "#94a3b8", textD: "#64748b",
  green: "#10b981", greenBg: "rgba(16,185,129,0.1)", greenBd: "rgba(16,185,129,0.25)",
  red: "#ef4444", redBg: "rgba(239,68,68,0.1)", redBd: "rgba(239,68,68,0.25)",
  amber: "#f59e0b", amberBg: "rgba(245,158,11,0.1)", amberBd: "rgba(245,158,11,0.25)",
  accent: "#8b5cf6", accentBg: "rgba(139,92,246,0.1)", accentBd: "rgba(139,92,246,0.25)",
};

function LoginContent() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const router = useRouter();

  const registered = params.get("registered");
  const manualVerified = params.get("verified");

  const inp = {
    width: "100%", padding: "12px 16px", borderRadius: 10, fontSize: 14,
    background: "#0a0f1c", border: `1px solid ${T.border}`, color: T.text,
    outline: "none", boxSizing: "border-box",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setUnverified(false); setLoading(true);
    const res = await signIn("credentials", { redirect: false, email, password });
    if (res?.error) {
      if (res.error === "EMAIL_NOT_VERIFIED") {
        setUnverified(true);
      } else {
        setError(res.error === "CredentialsSignin" ? "Invalid email or password." : res.error === "No account found with that email address" ? "No account found with that email." : res.error === "Invalid email or password" ? "Invalid email or password." : "Sign in failed. Please try again.");
      }
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  const resendVerification = async () => {
    if (!email) { setError("Enter your email above first."); return; }
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      let data = {};
      try { data = await res.json(); } catch { /* empty body */ }
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      setResent(true);
    } catch (err) { setError("Email send failed: " + err.message); }
    setResending(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", fontFamily: "var(--font-geist-mono), monospace" }}>
      {/* Left branding panel */}
      <div className="login-left" style={{ flex: "0 0 420px", background: "linear-gradient(160deg,#0d1321 0%,#0a0f1c 100%)", borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 40px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(139,92,246,0.08)", filter: "blur(60px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(6,182,212,0.06)", filter: "blur(50px)", pointerEvents: "none" }} />

        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: "linear-gradient(135deg,#8b5cf6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📈</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: "-0.5px" }}>TradingIntel</div>
            <div style={{ fontSize: 10, color: T.textD, textTransform: "uppercase", letterSpacing: "0.5px" }}>Forex Intelligence</div>
          </div>
        </Link>

        <div>
          <h2 style={{ margin: "0 0 16px", fontSize: 28, fontWeight: 800, color: T.text, lineHeight: 1.3, letterSpacing: "-0.5px" }}>
            Welcome back<br /><span style={{ background: "linear-gradient(90deg,#8b5cf6,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>to the edge</span>
          </h2>
          <p style={{ margin: "0 0 32px", fontSize: 14, lineHeight: 1.8, color: T.textM }}>
            Your markets are moving. Sign in to check live signals, A-setups, and today's intelligence brief.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: "📡", label: "Live price feeds across all pairs" },
              { icon: "🎯", label: "A-grade setup notifications" },
              { icon: "📅", label: "Economic calendar & COT analysis" },
            ].map(f => (
              <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: T.accentBg, border: `1px solid ${T.accentBd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{f.icon}</div>
                <span style={{ fontSize: 13, color: T.textM }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ margin: 0, fontSize: 11, color: T.textD }}>© {new Date().getFullYear()} TradingIntel. All rights reserved.</p>
      </div>

      <style>{`
        @media(max-width:768px){
          .login-left{display:none!important}
          .login-right{padding:32px 20px!important}
        }
      `}</style>
      {/* Right form panel */}
      <div className="login-right" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: "-0.5px" }}>Sign in</h1>
          <p style={{ margin: "0 0 28px", fontSize: 14, color: T.textM }}>Enter your credentials to access your dashboard.</p>

          {/* Post-registration banner */}
          {registered && (
            <div style={{ padding: "12px 16px", borderRadius: 10, background: T.greenBg, border: `1px solid ${T.greenBd}`, marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 13, color: T.green, fontWeight: 600 }}>✓ Account created — verify your email to sign in.</p>
            </div>
          )}
          {manualVerified && (
            <div style={{ padding: "12px 16px", borderRadius: 10, background: T.greenBg, border: `1px solid ${T.greenBd}`, marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 13, color: T.green, fontWeight: 600 }}>✓ Email verified — you can now sign in.</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: "12px 16px", borderRadius: 10, background: T.redBg, border: `1px solid ${T.redBd}`, marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 13, color: T.red }}>{error}</p>
            </div>
          )}

          {/* Email not verified */}
          {unverified && (
            <div style={{ padding: "14px 16px", borderRadius: 10, background: T.amberBg, border: `1px solid ${T.amberBd}`, marginBottom: 20 }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: T.amber, fontWeight: 600 }}>⚠ Email not verified</p>
              <p style={{ margin: "0 0 10px", fontSize: 12, color: T.textM }}>Check your inbox for the verification link, or request a new one.</p>
              {!resent ? (
                <button onClick={resendVerification} disabled={resending} style={{ padding: "8px 16px", borderRadius: 8, background: T.amberBg, color: T.amber, border: `1px solid ${T.amberBd}`, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {resending ? "Sending…" : "Resend verification email"}
                </button>
              ) : (
                <p style={{ margin: 0, fontSize: 12, color: T.green, fontWeight: 600 }}>✓ Sent — check your inbox.</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.textD, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Email address</label>
              <input suppressHydrationWarning type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inp} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.textD, textTransform: "uppercase", letterSpacing: "0.5px" }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: 12, color: T.accent, textDecoration: "none" }}>Forgot password?</Link>
              </div>
              <div style={{ position: "relative" }}>
                <input suppressHydrationWarning type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" style={{ ...inp, paddingRight: 48 }} />
                <button suppressHydrationWarning type="button" onClick={() => setShowPass(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.textD, cursor: "pointer", fontSize: 13 }}>
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button suppressHydrationWarning type="submit" disabled={loading} style={{ padding: "14px", borderRadius: 11, background: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: 4 }}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          <p style={{ margin: "24px 0 0", fontSize: 13, color: T.textD, textAlign: "center" }}>
            Don't have an account?{" "}
            <Link href="/register" style={{ color: T.accent, fontWeight: 600, textDecoration: "none" }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

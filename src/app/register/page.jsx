"use client";
import { useState } from "react";
import Link from "next/link";

const T = {
  bg: "#070b13", card: "#0d1321", border: "#1a2840",
  text: "#f1f5f9", textM: "#94a3b8", textD: "#64748b",
  green: "#10b981", greenBg: "rgba(16,185,129,0.1)", greenBd: "rgba(16,185,129,0.25)",
  red: "#ef4444", redBg: "rgba(239,68,68,0.1)", redBd: "rgba(239,68,68,0.25)",
  accent: "#8b5cf6", accentBg: "rgba(139,92,246,0.1)", accentBd: "rgba(139,92,246,0.25)",
  cyan: "#06b6d4",
};

function PasswordStrength({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ["#ef4444", "#f59e0b", "#10b981", "#10b981"];
  const labels = ["Weak", "Fair", "Good", "Strong"];
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? colors[score - 1] : "#1a2840", transition: "background 0.3s" }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: score > 0 ? colors[score - 1] : T.textD }}>{labels[score - 1] || ""}</div>
    </div>
  );
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const inp = {
    width: "100%", padding: "12px 16px", borderRadius: 10, fontSize: 14,
    background: "#0a0f1c", border: `1px solid ${T.border}`, color: T.text,
    outline: "none", boxSizing: "border-box",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      setDone(true);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "var(--font-geist-mono), monospace" }}>
        <div style={{ width: "100%", maxWidth: 440, background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, overflow: "hidden", textAlign: "center" }}>
          <div style={{ height: 3, background: "linear-gradient(90deg,#8b5cf6,#6366f1,#06b6d4,#10b981)" }} />
          <div style={{ padding: "40px 36px" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: T.greenBg, border: `1px solid ${T.greenBd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px" }}>✉</div>
            <h1 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 800, color: T.text }}>Check your inbox</h1>
            <p style={{ margin: "0 0 24px", fontSize: 14, lineHeight: 1.7, color: T.textM }}>
              We sent a verification link to <strong style={{ color: T.text }}>{email}</strong>. Click the link to activate your account and get started.
            </p>
            <div style={{ padding: "14px 18px", borderRadius: 10, background: T.accentBg, border: `1px solid ${T.accentBd}`, marginBottom: 24 }}>
              <p style={{ margin: 0, fontSize: 13, color: T.accent }}>The link expires in 24 hours. Check your spam folder if you don't see it.</p>
            </div>
            <Link href="/login" style={{ display: "inline-flex", alignItems: "center", padding: "13px 28px", borderRadius: 11, background: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
              Go to Sign In →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", fontFamily: "var(--font-geist-mono), monospace" }}>
      {/* Left panel — branding */}
      <div className="register-left" style={{ flex: "0 0 420px", background: "linear-gradient(160deg,#0d1321 0%,#0a0f1c 100%)", borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 40px", position: "relative", overflow: "hidden" }}>
        {/* Glow orbs */}
        <div style={{ position: "absolute", top: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(139,92,246,0.08)", filter: "blur(60px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(6,182,212,0.06)", filter: "blur(50px)", pointerEvents: "none" }} />

        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: "linear-gradient(135deg,#8b5cf6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📈</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: "-0.5px" }}>TradingIntel</div>
            <div style={{ fontSize: 10, color: T.textD, textTransform: "uppercase", letterSpacing: "0.5px" }}>Forex Intelligence</div>
          </div>
        </Link>

        {/* Pitch */}
        <div>
          <h2 style={{ margin: "0 0 16px", fontSize: 28, fontWeight: 800, color: T.text, lineHeight: 1.3, letterSpacing: "-0.5px" }}>
            Institutional-grade<br /><span style={{ background: "linear-gradient(90deg,#8b5cf6,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>trading intelligence</span>
          </h2>
          <p style={{ margin: "0 0 32px", fontSize: 14, lineHeight: 1.8, color: T.textM }}>
            Join traders who rely on real-time market analysis, A-grade setups, and COT data to make smarter decisions.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: "⚡", label: "Real-time signals & A-setup alerts" },
              { icon: "📊", label: "COT data & institutional positioning" },
              { icon: "🛡", label: "Smart risk management built in" },
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

      {/* Right panel — form */}
      <div className="register-right" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: "-0.5px" }}>Create your account</h1>
          <p style={{ margin: "0 0 32px", fontSize: 14, color: T.textM }}>Start your journey to smarter trading today.</p>

          {error && (
            <div style={{ padding: "12px 16px", borderRadius: 10, background: T.redBg, border: `1px solid ${T.redBd}`, marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 13, color: T.red }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.textD, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Full name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.textD, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Email address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.textD, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" style={{ ...inp, paddingRight: 48 }} />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.textD, cursor: "pointer", fontSize: 13 }}>
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <button type="submit" disabled={loading} style={{ padding: "14px", borderRadius: 11, background: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: 4 }}>
              {loading ? "Creating account…" : "Create Account →"}
            </button>
          </form>

          <p style={{ margin: "24px 0 0", fontSize: 13, color: T.textD, textAlign: "center" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: T.accent, fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
          </p>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          .register-left{display:none!important}
          .register-right{padding:32px 20px!important}
        }
      `}</style>
    </div>
  );
}

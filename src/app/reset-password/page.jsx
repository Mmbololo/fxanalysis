"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const T = {
  bg: "#070b13", card: "#0d1321", border: "#1a2840",
  text: "#f1f5f9", textM: "#94a3b8", textD: "#64748b",
  green: "#10b981", greenBg: "rgba(16,185,129,0.1)", greenBd: "rgba(16,185,129,0.25)",
  red: "#ef4444", redBg: "rgba(239,68,68,0.1)", redBd: "rgba(239,68,68,0.25)",
  accent: "#8b5cf6", accentBg: "rgba(139,92,246,0.1)", accentBd: "rgba(139,92,246,0.25)",
};

function PasswordStrength({ password }) {
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
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

function ResetPasswordContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const inp = {
    width: "100%", padding: "12px 16px", borderRadius: 10, fontSize: 14,
    background: "#0a0f1c", border: `1px solid ${T.border}`, color: T.text,
    outline: "none", boxSizing: "border-box",
  };

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "var(--font-geist-mono), monospace" }}>
        <div style={{ width: "100%", maxWidth: 440, background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, overflow: "hidden" }}>
          <div style={{ height: 3, background: "linear-gradient(90deg,#8b5cf6,#6366f1,#06b6d4,#10b981)" }} />
          <div style={{ padding: "40px 36px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: T.redBg, border: `1px solid ${T.redBd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 20px" }}>✕</div>
            <h1 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 800, color: T.text }}>Invalid Link</h1>
            <p style={{ margin: "0 0 24px", fontSize: 14, lineHeight: 1.7, color: T.textM }}>This reset link is missing or invalid. Request a new one from the forgot password page.</p>
            <Link href="/forgot-password" style={{ display: "inline-flex", alignItems: "center", padding: "13px 28px", borderRadius: 11, background: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
              Request New Link →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setDone(true);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "var(--font-geist-mono), monospace" }}>
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
          {done ? (
            <>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: T.greenBg, border: `1px solid ${T.greenBd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 20 }}>✓</div>
              <h1 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 800, color: T.text }}>Password Updated!</h1>
              <p style={{ margin: "0 0 24px", fontSize: 14, lineHeight: 1.7, color: T.textM }}>Your password has been successfully updated. You can now sign in with your new password.</p>
              <Link href="/login" style={{ display: "inline-flex", alignItems: "center", padding: "13px 28px", borderRadius: 11, background: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                Sign In →
              </Link>
            </>
          ) : (
            <>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: T.accentBg, border: `1px solid ${T.accentBd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 20 }}>🔐</div>
              <h1 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 800, color: T.text }}>Set new password</h1>
              <p style={{ margin: "0 0 28px", fontSize: 14, lineHeight: 1.7, color: T.textM }}>Choose a strong password for your TradingIntel account.</p>

              {error && (
                <div style={{ padding: "12px 16px", borderRadius: 10, background: T.redBg, border: `1px solid ${T.redBd}`, marginBottom: 20 }}>
                  <p style={{ margin: 0, fontSize: 13, color: T.red }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.textD, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>New password</label>
                  <div style={{ position: "relative" }}>
                    <input type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" style={{ ...inp, paddingRight: 48 }} />
                    <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.textD, cursor: "pointer", fontSize: 13 }}>
                      {showPass ? "Hide" : "Show"}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.textD, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Confirm password</label>
                  <input type={showPass ? "text" : "password"} required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password" style={{ ...inp, borderColor: confirm && confirm !== password ? T.red : T.border }} />
                  {confirm && confirm !== password && <p style={{ margin: "6px 0 0", fontSize: 12, color: T.red }}>Passwords don't match</p>}
                </div>
                <button type="submit" disabled={loading} style={{ padding: "13px", borderRadius: 11, background: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Updating…" : "Update Password →"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

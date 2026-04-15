"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", { redirect: false, email, password });
    if (res?.error) {
      setError(res.error);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ marginBottom: 30, display: "flex", gap: 8, alignItems: "center", fontWeight: 700, fontSize: 20 }}>
        <TrendingUp color="var(--accent)" />
        <span>Trading Intel</span>
      </div>
      <div className="modal-content" style={{ width: "100%", maxWidth: 400 }}>
        <h2 style={{ marginBottom: 20, textAlign: "center" }}>Login to your account</h2>
        {error && <div style={{ color: "var(--red)", background: "var(--redBg)", padding: 10, borderRadius: 8, marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-m)", marginBottom: 4 }}>Email</label>
            <input suppressHydrationWarning type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-m)", marginBottom: 4 }}>Password</label>
            <input suppressHydrationWarning type="password" required value={password} onChange={e => setPassword(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
          </div>
          <button suppressHydrationWarning type="submit" className="btn-primary" style={{ marginTop: 10 }}>Sign In</button>
        </form>
        <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "var(--text-m)" }}>
          Don't have an account? <Link href="/register" style={{ color: "var(--accent)" }}>Register</Link>
        </div>
      </div>
    </div>
  );
}

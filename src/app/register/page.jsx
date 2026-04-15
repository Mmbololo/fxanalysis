"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to register");
      router.push("/login?registered=true");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ marginBottom: 30, display: "flex", gap: 8, alignItems: "center", fontWeight: 700, fontSize: 20 }}>
        <TrendingUp color="var(--accent)" />
        <span>Trading Intel</span>
      </div>
      <div className="modal-content" style={{ width: "100%", maxWidth: 400 }}>
        <h2 style={{ marginBottom: 20, textAlign: "center" }}>Create your account</h2>
        {error && <div style={{ color: "var(--red)", background: "var(--redBg)", padding: 10, borderRadius: 8, marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-m)", marginBottom: 4 }}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-m)", marginBottom: 4 }}>Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 10 }}>{loading ? "Registering..." : "Register"}</button>
        </form>
        <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "var(--text-m)" }}>
          Already have an account? <Link href="/login" style={{ color: "var(--accent)" }}>Login</Link>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";

export default function ChangePasswordForm() {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPass !== form.confirm) {
      setStatus("error");
      setMessage("New passwords do not match.");
      return;
    }
    if (form.newPass.length < 8) {
      setStatus("error");
      setMessage("New password must be at least 8 characters.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: form.current, newPass: form.newPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to update password.");
      } else {
        setStatus("success");
        setMessage("Password updated successfully.");
        setForm({ current: "", newPass: "", confirm: "" });
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  const inputStyle = {
    width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
    borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "var(--text)",
    outline: "none",
  };
  const labelStyle = { fontSize: 11, color: "var(--text-d)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 5, display: "block" };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={labelStyle}>Current Password</label>
        <div style={{ position: "relative" }}>
          <Lock size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-d)" }} />
          <input
            type="password"
            value={form.current}
            onChange={e => setForm(f => ({ ...f, current: e.target.value }))}
            style={{ ...inputStyle, paddingLeft: 30 }}
            placeholder="Enter current password"
            required
          />
        </div>
      </div>
      <div>
        <label style={labelStyle}>New Password</label>
        <div style={{ position: "relative" }}>
          <Lock size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-d)" }} />
          <input
            type="password"
            value={form.newPass}
            onChange={e => setForm(f => ({ ...f, newPass: e.target.value }))}
            style={{ ...inputStyle, paddingLeft: 30 }}
            placeholder="At least 8 characters"
            required
          />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Confirm New Password</label>
        <div style={{ position: "relative" }}>
          <Lock size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-d)" }} />
          <input
            type="password"
            value={form.confirm}
            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
            style={{ ...inputStyle, paddingLeft: 30 }}
            placeholder="Repeat new password"
            required
          />
        </div>
      </div>

      {status === "success" && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--green)", background: "var(--green-bg)", border: "1px solid var(--green-bd)", borderRadius: 8, padding: "9px 12px" }}>
          <CheckCircle size={14} /> {message}
        </div>
      )}
      {status === "error" && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--red)", background: "var(--red-bg)", border: "1px solid var(--red-bd)", borderRadius: 8, padding: "9px 12px" }}>
          <AlertCircle size={14} /> {message}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          padding: "10px 20px", borderRadius: 8, border: "none", cursor: status === "loading" ? "not-allowed" : "pointer",
          background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600,
          opacity: status === "loading" ? 0.7 : 1, alignSelf: "flex-start",
        }}
      >
        {status === "loading" ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}

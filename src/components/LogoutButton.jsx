"use client";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton({ style }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
        cursor: "pointer", background: "transparent",
        border: "1px solid var(--border)", color: "var(--text-m)",
        transition: "all 0.15s",
        ...style,
      }}
      onMouseOver={e => { e.currentTarget.style.borderColor = "var(--red)"; e.currentTarget.style.color = "var(--red)"; }}
      onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-m)"; }}
    >
      <LogOut size={13} />
      Logout
    </button>
  );
}

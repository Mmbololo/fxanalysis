import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { User, CreditCard, Calendar, Shield, ArrowLeft } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscriptions: {
        include: { plan: true },
        orderBy: { startDate: "desc" },
      },
      signals: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const activeSub = user.subscriptions.find(
    s => s.status === "ACTIVE" && new Date(s.endDate) > new Date()
  );

  const closedSignals = user.signals.filter(s => s.status === "CLOSED");
  const wins = closedSignals.filter(s => {
    const pnl = ((s.exitPrice - s.entryPrice) / s.entryPrice) * 100 * (s.direction === "Long" ? 1 : -1);
    return pnl > 0;
  }).length;
  const winRate = closedSignals.length > 0 ? ((wins / closedSignals.length) * 100).toFixed(0) : null;

  const s = {
    root: { minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'Geist','SF Pro Display',-apple-system,sans-serif" },
    header: { display: "flex", alignItems: "center", gap: 12, padding: "16px 32px", borderBottom: "1px solid var(--border)", background: "var(--bg2)" },
    main: { maxWidth: 720, margin: "0 auto", padding: "32px 24px" },
    card: { background: "var(--bg2)", borderRadius: 12, padding: 24, border: "1px solid var(--border)", marginBottom: 20 },
    label: { fontSize: 11, color: "var(--text-d)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 4 },
    value: { fontSize: 15, fontWeight: 600 },
    row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" },
  };

  return (
    <div style={s.root}>
      <header style={s.header}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-m)", padding: "5px 10px", borderRadius: 7, border: "1px solid var(--border)" }}>
          <ArrowLeft size={13} /> Dashboard
        </Link>
        {user.role === "ADMIN" && (
          <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--amber)", padding: "5px 10px", borderRadius: 7, border: "1px solid var(--amber-bd)" }}>
            <Shield size={13} /> Admin Panel
          </Link>
        )}
        <span style={{ fontSize: 16, fontWeight: 700 }}>My Profile</span>
        <div style={{ marginLeft: "auto" }}>
          <LogoutButton />
        </div>
      </header>

      <main style={s.main}>

        {/* Account Info */}
        <div style={s.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--purple-bg)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
              <User size={24} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{user.email}</div>
              <div style={{ fontSize: 12, color: "var(--text-d)", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
                <Shield size={11} />
                {user.role} · Member since {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div style={{ background: "var(--bg)", borderRadius: 10, padding: "12px 16px", border: "1px solid var(--border)" }}>
              <div style={s.label}>Total Signals</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--accent)" }}>{user.signals.length}</div>
            </div>
            <div style={{ background: "var(--bg)", borderRadius: 10, padding: "12px 16px", border: "1px solid var(--border)" }}>
              <div style={s.label}>Win Rate</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: winRate >= 50 ? "var(--green)" : winRate !== null ? "var(--red)" : "var(--text-d)" }}>
                {winRate !== null ? winRate + "%" : "—"}
              </div>
            </div>
            <div style={{ background: "var(--bg)", borderRadius: 10, padding: "12px 16px", border: "1px solid var(--border)" }}>
              <div style={s.label}>Open Signals</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--cyan)" }}>{user.signals.filter(s => s.status === "OPEN").length}</div>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div style={s.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 13, fontWeight: 600, color: "var(--text-m)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
            <CreditCard size={14} color="var(--green)" /> Subscription
          </div>
          {activeSub ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>{activeSub.plan.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-m)", marginTop: 3 }}>KES {activeSub.plan.price.toLocaleString()} / {activeSub.plan.durationDiv.toLowerCase()}</div>
                </div>
                <span style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green-bd)" }}>
                  ACTIVE
                </span>
              </div>
              <div style={{ display: "flex", gap: 20, fontSize: 12, color: "var(--text-m)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Calendar size={12} />
                  Started: {new Date(activeSub.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Calendar size={12} />
                  Expires: {new Date(activeSub.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ color: "var(--text-d)", fontSize: 13, marginBottom: 12 }}>No active subscription</div>
              <Link href="/dashboard" style={{ padding: "8px 20px", borderRadius: 8, background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600 }}>
                View Plans
              </Link>
            </div>
          )}

          {/* Subscription history */}
          {user.subscriptions.length > 1 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, color: "var(--text-d)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.6px" }}>History</div>
              {user.subscriptions.slice(1).map(sub => (
                <div key={sub.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-m)", marginBottom: 6 }}>
                  <span>{sub.plan?.name}</span>
                  <span style={{ color: sub.status === "ACTIVE" ? "var(--green)" : "var(--text-d)" }}>{sub.status} · {new Date(sub.endDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Change Password */}
        <div style={s.card}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-m)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 16 }}>
            Change Password
          </div>
          <ChangePasswordForm />
        </div>

      </main>
    </div>
  );
}

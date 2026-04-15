import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Shield, CreditCard, CheckCircle, User } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import AdminManager from "./AdminManager";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    include: {
      subscriptions: { include: { plan: true }, orderBy: { startDate: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const payments = await prisma.payment.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  const plans = await prisma.plan.findMany({ orderBy: { price: "asc" } });

  const signals = await prisma.signal.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const activeSubscriptions = users.filter(u => u.subscriptions[0]?.status === "ACTIVE").length;

  const s = {
    root: { minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'Geist','SF Pro Display',-apple-system,sans-serif" },
    header: { display: "flex", alignItems: "center", gap: 12, padding: "20px 32px", borderBottom: "1px solid var(--border)", background: "var(--bg2)" },
    main: { maxWidth: 1200, margin: "0 auto", padding: "28px 32px" },
    card: { background: "var(--bg2)", borderRadius: 12, padding: 20, border: "1px solid var(--border)" },
    statCard: { background: "var(--bg2)", borderRadius: 12, padding: 20, border: "1px solid var(--border)", textAlign: "center" },
    sectionTitle: { fontSize: 13, fontWeight: 600, color: "var(--text-m)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 },
    row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--bg)", borderRadius: 8, border: "1px solid var(--border)", marginBottom: 8 },
    tag: (color, bg) => ({ fontSize: 11, padding: "3px 8px", borderRadius: 4, fontWeight: 600, color, background: bg }),
    th: { textAlign: "left", color: "var(--text-d)", fontWeight: 400, padding: "5px 10px", fontSize: 11, borderBottom: "1px solid var(--border)", textTransform: "uppercase", letterSpacing: "0.4px" },
    td: { padding: "9px 10px", borderBottom: "1px solid var(--border)", fontSize: 12 },
  };

  return (
    <div style={s.root}>
      <header style={s.header}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--purple-bg)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-l)" }}>
          <Shield size={18} color="var(--accent)" />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.5 }}>Admin Dashboard</div>
          <div style={{ fontSize: 11, color: "var(--text-d)" }}>Digipedia Trading Intel</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "var(--text-d)" }}>{session.user.email}</span>
          <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, border: "1px solid var(--border)", color: "var(--text-m)" }}>
            <User size={13} />Profile
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main style={s.main}>

        {/* Summary stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total Users", value: users.length, color: "var(--blue)" },
            { label: "Active Subscriptions", value: activeSubscriptions, color: "var(--green)" },
            { label: "Total Payments", value: payments.length, color: "var(--amber)" },
            { label: "Signals Logged", value: signals.length, color: "var(--accent)" },
          ].map(stat => (
            <div key={stat.label} style={s.statCard}>
              <div style={{ fontSize: 11, color: "var(--text-d)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>{stat.label}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <AdminManager users={JSON.parse(JSON.stringify(users))} plans={JSON.parse(JSON.stringify(plans))} />

        {/* Payments */}
        <div style={{ ...s.card, marginBottom: 20 }}>
          <div style={s.sectionTitle}><CreditCard size={14} color="var(--green)" />Payments ({payments.length})</div>
          {payments.length === 0 ? (
            <div style={{ color: "var(--text-d)", fontSize: 12, padding: "20px 0", textAlign: "center" }}>No payments recorded yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr>
                  {["User", "Amount (KES)", "Status", "Pesapal Tx ID", "Date"].map(h => <th key={h} style={s.th}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td style={s.td}>{p.user?.email}</td>
                      <td style={{ ...s.td, fontWeight: 600 }}>{p.amount.toLocaleString()}</td>
                      <td style={s.td}>
                        <span style={s.tag(p.status === "COMPLETED" ? "var(--green)" : p.status === "FAILED" ? "var(--red)" : "var(--amber)", p.status === "COMPLETED" ? "var(--green-bg)" : p.status === "FAILED" ? "var(--red-bg)" : "var(--amber-bg)")}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ ...s.td, color: "var(--text-d)", fontFamily: "monospace" }}>{p.pesapalTxId || "—"}</td>
                      <td style={{ ...s.td, color: "var(--text-d)" }}>{new Date(p.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Signals */}
        <div style={s.card}>
          <div style={s.sectionTitle}><CheckCircle size={14} color="var(--accent)" />Recent Signals (last 20)</div>
          {signals.length === 0 ? (
            <div style={{ color: "var(--text-d)", fontSize: 12, padding: "20px 0", textAlign: "center" }}>No signals logged yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr>
                  {["User", "Pair", "Direction", "Entry", "Target", "Stop", "Status", "P&L", "Date"].map(h => <th key={h} style={s.th}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {signals.map(sig => {
                    const exitP = sig.exitPrice || sig.entryPrice;
                    const rawPnl = ((exitP - sig.entryPrice) / sig.entryPrice) * 100;
                    const pnl = sig.direction === "Long" ? rawPnl : -rawPnl;
                    return (
                      <tr key={sig.id}>
                        <td style={{ ...s.td, color: "var(--text-m)" }}>{sig.user?.email}</td>
                        <td style={{ ...s.td, fontWeight: 700 }}>{sig.instrument}</td>
                        <td style={{ ...s.td, color: sig.direction === "Long" ? "var(--green)" : "var(--red)", fontWeight: 600 }}>{sig.direction}</td>
                        <td style={s.td}>{sig.entryPrice}</td>
                        <td style={{ ...s.td, color: "var(--green)" }}>{sig.targetPrice || "—"}</td>
                        <td style={{ ...s.td, color: "var(--red)" }}>{sig.stopLoss || "—"}</td>
                        <td style={s.td}>
                          <span style={s.tag(sig.status === "OPEN" ? "var(--cyan)" : sig.status === "CLOSED" ? "var(--green)" : "var(--text-d)", sig.status === "OPEN" ? "var(--cyan-bg)" : sig.status === "CLOSED" ? "var(--green-bg)" : "var(--bg3)")}>
                            {sig.status}
                          </span>
                        </td>
                        <td style={{ ...s.td, fontWeight: sig.status === "CLOSED" ? 700 : 400, color: sig.status === "CLOSED" ? (pnl >= 0 ? "var(--green)" : "var(--red)") : "var(--text-d)" }}>
                          {sig.status === "CLOSED" ? `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%` : "—"}
                        </td>
                        <td style={{ ...s.td, color: "var(--text-d)" }}>{new Date(sig.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

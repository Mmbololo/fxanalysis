import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Users, CreditCard, Package } from "lucide-react";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    // Basic protection: redirect non-admins or unauthenticated users to home
    redirect("/");
  }

  const subscribers = await prisma.user.findMany({
    include: { subscriptions: true }
  });

  const payments = await prisma.payment.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: 40 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 40, fontSize: 32, display: "flex", alignItems: "center", gap: 12 }}>
          <Shield size={32} color="var(--accent)" />
          Admin Dashboard
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Subscribers Section */}
          <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 24, border: "1px solid var(--border)" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Users size={20} color="var(--blue)" />
              Registered Users
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {subscribers.map(user => (
                <div key={user.id} style={{ display: "flex", justifyContent: "space-between", padding: 12, background: "var(--bg)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{user.email}</div>
                    <div style={{ fontSize: 12, color: "var(--text-m)", marginTop: 4 }}>Role: {user.role}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, padding: "4px 8px", borderRadius: 4, background: user.subscriptions.length > 0 ? "var(--greenBg)" : "var(--bg3)", color: user.subscriptions.length > 0 ? "var(--green)" : "var(--text-d)" }}>
                      {user.subscriptions.length > 0 ? "Active Sub" : "Free"}
                    </span>
                  </div>
                </div>
              ))}
              {subscribers.length === 0 && <div style={{ color: "var(--text-d)", fontSize: 13 }}>No users registered yet.</div>}
            </div>
          </div>

          {/* Payments Section */}
          <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 24, border: "1px solid var(--border)" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <CreditCard size={20} color="var(--green)" />
              Recent Payments
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {payments.map(payment => (
                <div key={payment.id} style={{ display: "flex", justifyContent: "space-between", padding: 12, background: "var(--bg)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>KES {payment.amount}</div>
                    <div style={{ fontSize: 12, color: "var(--text-m)", marginTop: 4 }}>{payment.user.email}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--text-m)", marginBottom: 4 }}>{new Date(payment.createdAt).toLocaleDateString()}</div>
                    <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: payment.status === "COMPLETED" ? "var(--greenBg)" : "var(--amberBg)", color: payment.status === "COMPLETED" ? "var(--green)" : "var(--amber)" }}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
              {payments.length === 0 && <div style={{ color: "var(--text-d)", fontSize: 13 }}>No payments recorded.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ensure Shield icon is available
import { Shield } from "lucide-react";

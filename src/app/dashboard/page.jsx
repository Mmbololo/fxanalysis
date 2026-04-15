"use client";

import { useState, useEffect } from "react";
import TradingDashboard from "@/components/dashboard";
import { Lock, CreditCard, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const [hasSubscription, setHasSubscription] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch("/api/subscription/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.active) setHasSubscription(true);
      })
      .catch(() => {});
  }, []);

  // Intercept clicks on the dashboard if no subscription
  const handleDashboardClick = (e) => {
    if (!hasSubscription) {
      e.stopPropagation();
      e.preventDefault();
      setShowModal(true);
    }
  };

  const handleSubscribe = async (packageId) => {
    // Here we will call our Pesapal API endpoint
    alert(`Initiating Pesapal payment for ${packageId} package... (Integration pending)`);
    // After payment success, this would be updated or handled via redirect
  };

  return (
    <div style={{ position: "relative" }}>
      {/* 
        We use onClickCapture to intercept event bubbling before inner elements
        can process it, allowing us to effectively 'paywall' interactions.
      */}
      <div onClickCapture={handleDashboardClick} style={{ filter: (!hasSubscription && showModal) ? "blur(3px)" : "none", transition: "filter 0.3s" }}>
        <TradingDashboard />
      </div>

      {!hasSubscription && showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: "rgba(139, 92, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Lock size={24} style={{ color: "var(--accent)" }} />
              </div>
              <h2 style={{ fontSize: 24, marginBottom: 8 }}>Unlock Institutional Intel</h2>
              <p style={{ color: "var(--text-m)", fontSize: 14 }}>
                You are viewing the free tier. To interact with charts, run AI analysis, and see order flow strikes, please select a subscription package.
              </p>
            </div>

            <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
              {[
                { id: "daily", name: "24-Hour Pass", price: "KES 500", desc: "Full access for one day" },
                { id: "weekly", name: "Weekly Pro", price: "KES 2,500", desc: "Best for swing traders" },
                { id: "monthly", name: "Monthly Elite", price: "KES 8,000", desc: "Save 20% on monthly access" }
              ].map(pkg => (
                <div key={pkg.id} onClick={() => handleSubscribe(pkg.id)} style={{ padding: 16, borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "border-color 0.2s" }} onMouseOver={e => e.currentTarget.style.borderColor = "var(--accent)"} onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{pkg.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-m)" }}>{pkg.desc}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontWeight: 700, color: "var(--green)" }}>{pkg.price}</div>
                    <ChevronRight size={16} color="var(--text-d)" />
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <CreditCard size={18} /> Pay Securely via Pesapal
            </button>
            <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "var(--text-d)" }}>
              Payments are processed instantly. M-Pesa supported.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

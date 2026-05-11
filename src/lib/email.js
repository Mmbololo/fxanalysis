import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM    = "TradingIntel <no_reply@tradeintel.live>";
const SUPPORT = "support@tradeintel.live";
const BASE    = process.env.NEXTAUTH_URL || "https://tradeintel.live";
const YEAR    = new Date().getFullYear();

// ─────────────────────────────────────────────────────────────────────────────
// SEND HELPER
// ─────────────────────────────────────────────────────────────────────────────
async function send({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping to", to);
    return { skipped: true };
  }
  console.log("[email] Sending to:", to, "from:", FROM, "key prefix:", process.env.RESEND_API_KEY?.slice(0, 8));
  const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) {
    console.error("[email] Resend error:", JSON.stringify(error));
    throw new Error(`Resend: ${error.message || error.name || JSON.stringify(error)}`);
  }
  console.log("[email] Sent OK, id:", data?.id);
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTER LAYOUT
// ─────────────────────────────────────────────────────────────────────────────
function layout({ body, preheader = "" }) {
  const navLinks = [
    { label: "Overview",      href: `${BASE}/dashboard` },
    { label: "Chart Terminal",href: `${BASE}/dashboard?view=intelligence` },
    { label: "Intelligence",  href: `${BASE}/dashboard?view=intel-hub` },
    { label: "Trade Lab",     href: `${BASE}/dashboard?view=tradelab` },
    { label: "Calendar",      href: `${BASE}/dashboard?view=calendar` },
  ];

  const navHtml = navLinks.map(l =>
    `<a href="${l.href}" style="color:rgba(255,255,255,0.75);text-decoration:none;font-size:11px;font-weight:500;letter-spacing:0.3px;white-space:nowrap;">${l.label}</a>`
  ).join(`<span style="color:rgba(255,255,255,0.2);margin:0 10px;">|</span>`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="dark"/>
  <title>TradingIntel</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700;800&display=swap');
    body { margin:0; padding:0; background:#070b13; }
    * { box-sizing:border-box; }
    @media(max-width:600px){
      .email-wrapper { padding:0 !important; }
      .email-card    { border-radius:0 !important; }
      .email-body    { padding:28px 20px !important; }
      .nav-bar       { display:none !important; }
      .quick-links   { grid-template-columns:1fr 1fr !important; }
      .signal-grid   { grid-template-columns:1fr !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#070b13;font-family:'Geist Mono', 'Courier New', monospace;">

  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>` : ""}

  <!-- Outer wrapper -->
  <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" style="background:#070b13;padding:32px 16px 48px;">
    <tr><td align="center">

      <!-- Card -->
      <table class="email-card" width="100%" style="max-width:600px;background:#0d1321;border-radius:20px;overflow:hidden;border:1px solid #1a2840;">
        <tr><td>

          <!-- ═══ HEADER ═══════════════════════════════════════════════ -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:linear-gradient(135deg,#0f0624 0%,#0d1b3e 50%,#071a2e 100%);padding:0;">

                <!-- Gradient top accent bar -->
                <div style="height:3px;background:linear-gradient(90deg,#8b5cf6,#6366f1,#06b6d4,#10b981);"></div>

                <!-- Logo row -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:28px 32px 20px;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <!-- Icon mark -->
                          <td style="padding-right:12px;vertical-align:middle;">
                            <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#8b5cf6,#06b6d4);display:flex;align-items:center;justify-content:center;">
                              <table cellpadding="0" cellspacing="0"><tr><td align="center" valign="middle" style="width:42px;height:42px;">
                                <!-- Chart bars icon (SVG as data URI via table cell) -->
                                <span style="display:block;width:42px;height:42px;background:linear-gradient(135deg,#8b5cf6,#06b6d4);border-radius:12px;font-size:20px;line-height:42px;text-align:center;">📈</span>
                              </td></tr></table>
                            </div>
                          </td>
                          <!-- Brand name -->
                          <td style="vertical-align:middle;">
                            <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.8px;line-height:1;">TradingIntel</div>
                            <div style="font-size:11px;color:rgba(255,255,255,0.45);margin-top:3px;letter-spacing:0.5px;text-transform:uppercase;">Institutional Forex Intelligence</div>
                          </td>
                          <!-- Live badge -->
                          <td style="vertical-align:middle;" align="right">
                            <span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700;color:#10b981;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);letter-spacing:0.8px;">● LIVE</span>
                          </td>
                        </tr>
                      </table>

                      <!-- Nav bar -->
                      <div class="nav-bar" style="margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.07);">
                        ${navHtml}
                      </div>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>
          <!-- ═══ END HEADER ══════════════════════════════════════════ -->

          <!-- ═══ BODY ════════════════════════════════════════════════ -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td class="email-body" style="padding:36px 36px 28px;">
                ${body}
              </td>
            </tr>
          </table>
          <!-- ═══ END BODY ════════════════════════════════════════════ -->

          <!-- ═══ QUICK LINKS BAR ═════════════════════════════════════ -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:0 36px 28px;">
                <div style="background:#111827;border-radius:14px;padding:18px 20px;border:1px solid #1a2840;">
                  <div style="font-size:10px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">Quick Access</div>
                  <table class="quick-links" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      ${[
                        { icon:"📊", label:"Overview",       href:`${BASE}/dashboard`,                       color:"#8b5cf6" },
                        { icon:"📈", label:"Chart Terminal", href:`${BASE}/dashboard?view=intelligence`,     color:"#06b6d4" },
                        { icon:"🧠", label:"Intelligence",   href:`${BASE}/dashboard?view=intel-hub`,        color:"#6366f1" },
                        { icon:"🎯", label:"Trade Lab",      href:`${BASE}/dashboard?view=tradelab`,         color:"#10b981" },
                        { icon:"📅", label:"Calendar",       href:`${BASE}/dashboard?view=calendar`,         color:"#f59e0b" },
                      ].map(l => `
                        <td align="center" style="padding:0 4px;">
                          <a href="${l.href}" style="display:block;text-decoration:none;padding:10px 8px;border-radius:10px;background:#0d1321;border:1px solid #1a2840;transition:border-color 0.2s;">
                            <div style="font-size:18px;margin-bottom:4px;">${l.icon}</div>
                            <div style="font-size:10px;font-weight:600;color:${l.color};letter-spacing:0.3px;">${l.label}</div>
                          </a>
                        </td>
                      `).join("")}
                    </tr>
                  </table>
                </div>
              </td>
            </tr>
          </table>
          <!-- ═══ END QUICK LINKS ════════════════════════════════════ -->

          <!-- ═══ FOOTER ══════════════════════════════════════════════ -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#080d18;padding:20px 36px 28px;border-top:1px solid #1a2840;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#e2e8f0;">TradingIntel</p>
                      <p style="margin:0;font-size:11px;color:#374151;line-height:1.6;">
                        This email was sent from <a href="mailto:no_reply@tradeintel.live" style="color:#4b5563;text-decoration:none;">no_reply@tradeintel.live</a>.<br/>
                        For help, contact <a href="mailto:${SUPPORT}" style="color:#8b5cf6;text-decoration:none;">${SUPPORT}</a>
                      </p>
                    </td>
                    <td align="right" style="vertical-align:top;">
                      <p style="margin:0;font-size:10px;color:#374151;">© ${YEAR} TradingIntel</p>
                    </td>
                  </tr>
                </table>
                <p style="margin:14px 0 0;font-size:10px;color:#1f2937;line-height:1.6;border-top:1px solid #111827;padding-top:14px;">
                  ⚠️ <strong style="color:#374151;">Not financial advice.</strong> TradingIntel provides analytical tools and data for educational purposes only. Trading forex and cryptocurrencies carries significant risk of loss. Past performance is not indicative of future results. Always conduct your own due diligence.
                </p>
              </td>
            </tr>
          </table>
          <!-- ═══ END FOOTER ══════════════════════════════════════════ -->

        </td></tr>
      </table>
      <!-- End card -->

    </td></tr>
  </table>
  <!-- End outer wrapper -->

</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const heading = (text, sub) => `
  <h1 style="margin:0 0 ${sub ? "6px" : "20px"};font-size:26px;font-weight:800;color:#f1f5f9;letter-spacing:-0.5px;line-height:1.2;">${text}</h1>
  ${sub ? `<p style="margin:0 0 20px;font-size:14px;color:#64748b;">${sub}</p>` : ""}
`;

const para = (html) =>
  `<p style="margin:0 0 16px;font-size:14px;line-height:1.75;color:#94a3b8;">${html}</p>`;

const divider = (margin = "24px 0") =>
  `<div style="height:1px;background:linear-gradient(90deg,transparent,#1e2d45,transparent);margin:${margin};"></div>`;

const primaryBtn = (label, href) => `
  <table cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
    <tr>
      <td style="border-radius:12px;background:linear-gradient(135deg,#8b5cf6,#6366f1);">
        <a href="${href}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">
          ${label} →
        </a>
      </td>
    </tr>
  </table>
`;

const secondaryBtn = (label, href, color = "#1e2d45", textColor = "#94a3b8") => `
  <a href="${href}" style="display:inline-block;margin:4px 6px 4px 0;padding:9px 18px;font-size:12px;font-weight:600;color:${textColor};text-decoration:none;border:1px solid ${color};border-radius:8px;background:#0d1321;">
    ${label}
  </a>
`;

const statBox = (items) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr>
      ${items.map(item => `
        <td style="padding:0 6px 0 0;">
          <div style="background:#111827;border-radius:12px;padding:16px;border:1px solid #1a2840;text-align:center;">
            <div style="font-size:10px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;">${item.label}</div>
            <div style="font-size:20px;font-weight:800;color:${item.color || "#f1f5f9"};letter-spacing:-0.5px;">${item.value}</div>
            ${item.sub ? `<div style="font-size:10px;color:#4b5563;margin-top:4px;">${item.sub}</div>` : ""}
          </div>
        </td>
      `).join("")}
    </tr>
  </table>
`;

const featureRow = (icon, title, desc) => `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #0f1929;vertical-align:top;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:14px;vertical-align:top;">
          <div style="width:34px;height:34px;border-radius:9px;background:#111827;border:1px solid #1a2840;text-align:center;line-height:34px;font-size:16px;">${icon}</div>
        </td>
        <td style="vertical-align:top;">
          <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:2px;">${title}</div>
          <div style="font-size:12px;color:#64748b;line-height:1.5;">${desc}</div>
        </td>
      </tr></table>
    </td>
  </tr>
`;

const alertBanner = (text, color, bg, borderColor) => `
  <div style="background:${bg};border:1px solid ${borderColor};border-left:3px solid ${color};border-radius:10px;padding:14px 18px;margin:20px 0;">
    <p style="margin:0;font-size:13px;color:${color};font-weight:600;">${text}</p>
  </div>
`;

// ─────────────────────────────────────────────────────────────────────────────
// 1. WELCOME EMAIL
// ─────────────────────────────────────────────────────────────────────────────
export async function sendWelcomeEmail({ to, name }) {
  const displayName = name || "Trader";
  const body = `
    ${heading("Welcome to TradingIntel 🎯", "Your institutional-grade intelligence suite is ready.")}

    ${para(`Hi <strong style="color:#e2e8f0;">${displayName}</strong>, your account has been created and verified. You now have full access to the trading intelligence platform built for serious forex traders.`)}

    ${primaryBtn("Open Your Dashboard", `${BASE}/dashboard`)}

    ${divider()}

    <p style="margin:0 0 14px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#4b5563;">What's inside your account</p>

    <table width="100%" cellpadding="0" cellspacing="0">
      ${featureRow("📈", "TradingView Chart Terminal", "Professional-grade charts with RSI, MACD, Bollinger Bands — same engine as institutional desks.")}
      ${featureRow("🧠", "5-Pillar Intelligence Engine", "TA · SMC · COT · Retail Sentiment · Options Flow combined into a master score.")}
      ${featureRow("🎯", "Auto A-Setup Generator", "Scans all instruments for high-confidence setups. Auto TP/SL calculation with 2:1 R:R.")}
      ${featureRow("📊", "CFTC COT Data", "Weekly commitment of traders positioning with net spec charts and divergence alerts.")}
      ${featureRow("📅", "Economic Calendar", "High-impact events only for XAUUSD, GBPUSD, GBPJPY, BTCUSD, EURUSD.")}
      ${featureRow("⚡", "Signal Alerts", "Real-time email notifications whenever an A-grade setup is detected.")}
    </table>

    ${divider("20px 0")}

    <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#4b5563;">Jump straight in</p>
    ${secondaryBtn("📊 Overview", `${BASE}/dashboard`, "#1a2840", "#8b5cf6")}
    ${secondaryBtn("📈 Charts", `${BASE}/dashboard?view=intelligence`, "#1a2840", "#06b6d4")}
    ${secondaryBtn("🎯 Trade Lab", `${BASE}/dashboard?view=tradelab`, "#1a2840", "#10b981")}
    ${secondaryBtn("🧠 Intelligence", `${BASE}/dashboard?view=intel-hub`, "#1a2840", "#6366f1")}
  `;
  return send({
    to,
    subject: "Welcome to TradingIntel — your account is ready 🎯",
    html: layout({ body, preheader: "Your institutional-grade forex intelligence suite is now active." }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PAYMENT CONFIRMATION
// ─────────────────────────────────────────────────────────────────────────────
export async function sendPaymentConfirmationEmail({ to, name, plan, amount, currency = "USD", endDate, txId }) {
  const expiry = endDate
    ? new Date(endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    : "—";
  const displayName = name || "Trader";

  const body = `
    ${heading("Payment Confirmed ✓", "Your subscription is now active.")}

    ${alertBanner("✅ Payment successful — all features unlocked", "#10b981", "rgba(16,185,129,0.08)", "rgba(16,185,129,0.25)")}

    ${para(`Hi <strong style="color:#e2e8f0;">${displayName}</strong>, thank you for your payment. Your <strong style="color:#8b5cf6;">${plan || "Pro"}</strong> subscription is active and all features are unlocked.`)}

    ${statBox([
      { label: "Plan",      value: plan || "Pro",           color: "#8b5cf6" },
      { label: "Amount",    value: `${currency} ${amount}`, color: "#10b981" },
      { label: "Expires",   value: expiry,                  color: "#f1f5f9" },
    ])}

    <div style="background:#111827;border-radius:12px;padding:16px 20px;border:1px solid #1a2840;margin-bottom:24px;">
      <div style="font-size:10px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">Transaction Reference</div>
      <code style="font-size:12px;color:#94a3b8;font-family:'Geist Mono', 'Courier New', monospace;">${txId || "—"}</code>
    </div>

    ${primaryBtn("Access Your Dashboard", `${BASE}/dashboard`)}

    ${divider()}

    ${para(`Your subscription renews on <strong style="color:#f59e0b;">${expiry}</strong>. Questions? Reply to this email or contact <a href="mailto:${SUPPORT}" style="color:#8b5cf6;text-decoration:none;">${SUPPORT}</a>.`)}
  `;
  return send({
    to,
    subject: `Payment confirmed — ${plan} subscription is active ✓`,
    html: layout({ body, preheader: `Your ${plan} subscription is now active. Amount: ${currency} ${amount}.` }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SUBSCRIPTION EXPIRY REMINDER
// ─────────────────────────────────────────────────────────────────────────────
export async function sendExpiryReminderEmail({ to, name, plan, endDate }) {
  const expiry = endDate
    ? new Date(endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    : "—";
  const displayName = name || "Trader";

  const body = `
    ${heading("Your subscription expires soon ⚠️", `${plan} · Expires ${expiry}`)}

    ${alertBanner(`⏳ Your ${plan} plan expires on ${expiry} — renew to keep access`, "#f59e0b", "rgba(245,158,11,0.08)", "rgba(245,158,11,0.3)")}

    ${para(`Hi <strong style="color:#e2e8f0;">${displayName}</strong>, your <strong style="color:#8b5cf6;">${plan}</strong> subscription is expiring in 3 days. Renew now to avoid interruption to your live signals, intelligence dashboard, and A-setup alerts.`)}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <td style="background:#111827;border-radius:12px;padding:20px;border:1px solid rgba(245,158,11,0.3);">
          <p style="margin:0 0 12px;font-size:13px;color:#94a3b8;">Without an active subscription you will lose access to:</p>
          <table cellpadding="0" cellspacing="0">
            ${["Live A-Setup signal generation & email alerts",
               "Intelligence Hub — 5-pillar master scoring",
               "COT data, retail sentiment & options flow",
               "Chart Terminal with SMC analysis",
               "Economic calendar — high-impact events"].map(item =>
              `<tr><td style="padding:4px 0;font-size:13px;color:#64748b;">❌ &nbsp;${item}</td></tr>`
            ).join("")}
          </table>
        </td>
      </tr>
    </table>

    ${primaryBtn("Renew My Subscription", `${BASE}/dashboard?tab=billing`)}

    ${divider()}

    ${para(`Need help? Contact us at <a href="mailto:${SUPPORT}" style="color:#8b5cf6;text-decoration:none;">${SUPPORT}</a>.`)}
  `;
  return send({
    to,
    subject: `⚠️ Action needed — your ${plan} subscription expires ${expiry}`,
    html: layout({ body, preheader: `Your ${plan} subscription expires on ${expiry}. Renew now to keep access.` }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. A-SETUP SIGNAL ALERT
// ─────────────────────────────────────────────────────────────────────────────
export async function sendSignalAlertEmail({ to, name, signals }) {
  const count = signals.length;
  const displayName = name || "Trader";
  const now = new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });

  const signalCards = signals.map(s => {
    const isLong = s.direction === "Long";
    const dirColor  = isLong ? "#10b981" : "#ef4444";
    const dirBg     = isLong ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)";
    const dirBorder = isLong ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)";
    const scoreColor = (s.masterScore || 0) >= 80 ? "#10b981" : (s.masterScore || 0) >= 68 ? "#8b5cf6" : "#f59e0b";
    return `
      <div style="background:#111827;border-radius:14px;padding:20px;border:1px solid #1a2840;margin-bottom:12px;border-left:3px solid ${dirColor};">
        <!-- Pair + direction header -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:middle;">
              <span style="font-size:18px;font-weight:800;color:#f1f5f9;letter-spacing:-0.5px;">${s.instrument}</span>
              &nbsp;
              <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;color:${dirColor};background:${dirBg};border:1px solid ${dirBorder};">${s.direction.toUpperCase()}</span>
              &nbsp;
              <span style="display:inline-block;padding:3px 9px;border-radius:20px;font-size:10px;font-weight:800;color:#8b5cf6;background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.3);letter-spacing:0.5px;">A SETUP</span>
            </td>
            <td align="right" style="vertical-align:middle;">
              <span style="font-size:13px;font-weight:700;color:${scoreColor};">${s.masterScore || "—"}<span style="font-size:10px;color:#4b5563;font-weight:400;">/100</span></span>
            </td>
          </tr>
        </table>

        <!-- Price levels -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
          <tr>
            <td style="padding-right:8px;">
              <div style="background:#0d1321;border-radius:9px;padding:10px 12px;border:1px solid #1a2840;">
                <div style="font-size:9px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">Entry</div>
                <div style="font-size:14px;font-weight:700;color:#f1f5f9;font-family:'Geist Mono', 'Courier New', monospace;">${s.entryPrice ?? "—"}</div>
              </div>
            </td>
            <td style="padding-right:8px;">
              <div style="background:rgba(16,185,129,0.06);border-radius:9px;padding:10px 12px;border:1px solid rgba(16,185,129,0.2);">
                <div style="font-size:9px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">Take Profit</div>
                <div style="font-size:14px;font-weight:700;color:#10b981;font-family:'Geist Mono', 'Courier New', monospace;">${s.targetPrice ?? "—"}</div>
              </div>
            </td>
            <td>
              <div style="background:rgba(239,68,68,0.06);border-radius:9px;padding:10px 12px;border:1px solid rgba(239,68,68,0.2);">
                <div style="font-size:9px;font-weight:700;color:#ef4444;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">Stop Loss</div>
                <div style="font-size:14px;font-weight:700;color:#ef4444;font-family:'Geist Mono', 'Courier New', monospace;">${s.stopLoss ?? "—"}</div>
              </div>
            </td>
          </tr>
        </table>

        <!-- R:R row -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
          <tr>
            <td style="font-size:11px;color:#4b5563;">
              R:R <strong style="color:#94a3b8;">${s.riskReward || "1:2"}</strong>
              &nbsp;·&nbsp; Confidence <strong style="color:#94a3b8;">${s.confidence || "—"}/10</strong>
            </td>
            <td align="right">
              <a href="${BASE}/dashboard?view=tradelab" style="font-size:11px;color:#8b5cf6;text-decoration:none;font-weight:600;">View in Trade Lab →</a>
            </td>
          </tr>
        </table>
      </div>
    `;
  }).join("");

  const body = `
    ${heading(
      `${count} A-Setup Signal${count > 1 ? "s" : ""} Detected 🎯`,
      `Scanned at ${now}`
    )}

    ${alertBanner(
      `🚀 High-confidence setup${count > 1 ? "s" : ""} identified by the 5-pillar intelligence engine`,
      "#8b5cf6", "rgba(139,92,246,0.08)", "rgba(139,92,246,0.3)"
    )}

    ${para(`Hi <strong style="color:#e2e8f0;">${displayName}</strong>, the TradingIntel scanner has detected ${count > 1 ? `<strong style="color:#8b5cf6;">${count} A-grade setups</strong>` : "an <strong style=\"color:#8b5cf6;\">A-grade setup</strong>"} with master scores ≥ 68, full SMC/TA alignment, and no conflicting signals.`)}

    ${signalCards}

    ${primaryBtn("Open Trade Lab", `${BASE}/dashboard?view=tradelab`)}

    <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        ${secondaryBtn("📊 Overview", `${BASE}/dashboard`, "#1a2840", "#94a3b8")}
        ${secondaryBtn("📈 Charts", `${BASE}/dashboard?view=intelligence`, "#1a2840", "#06b6d4")}
        ${secondaryBtn("🧠 Intelligence", `${BASE}/dashboard?view=intel-hub`, "#1a2840", "#6366f1")}
        ${secondaryBtn("📅 Calendar", `${BASE}/dashboard?view=calendar`, "#1a2840", "#f59e0b")}
      </tr>
    </table>

    ${divider()}

    ${para(`<em style="font-size:12px;color:#374151;">⚠️ This is not financial advice. A-setups indicate high statistical confluence — always use proper risk management and never risk more than you can afford to lose.</em>`)}
  `;
  return send({
    to,
    subject: `🎯 ${count} A-Setup signal${count > 1 ? "s" : ""} detected — ${signals.map(s => s.instrument).join(", ")}`,
    html: layout({ body, preheader: `${count} high-confidence A-grade setup${count > 1 ? "s" : ""} detected: ${signals.map(s => `${s.instrument} ${s.direction}`).join(" · ")}` }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. EMAIL VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────
export async function sendVerificationEmail({ to, name, verifyUrl }) {
  const displayName = name || "Trader";
  const body = `
    ${heading("Verify your email address ✉️", "One quick step to activate your account.")}

    ${para(`Hi <strong style="color:#e2e8f0;">${displayName}</strong>, thanks for signing up to TradingIntel. Click the button below to verify your email address and unlock full access to your intelligence dashboard.`)}

    <table cellpadding="0" cellspacing="0" style="margin:8px 0 8px;">
      <tr><td style="border-radius:12px;background:linear-gradient(135deg,#8b5cf6,#6366f1);">
        <a href="${verifyUrl}" style="display:inline-block;padding:16px 40px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">
          ✓ &nbsp;Verify My Email Address
        </a>
      </td></tr>
    </table>

    ${alertBanner("⏱️ This link expires in <strong>24 hours</strong>. If it expires, you can request a new one from the login page.", "#f59e0b", "rgba(245,158,11,0.08)", "rgba(245,158,11,0.25)")}

    ${divider()}

    <p style="margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#4b5563;">What you'll get after verification</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${featureRow("🎯", "Auto A-Setup Generator", "Scans all instruments for high-confidence setups with TP/SL auto-calculation.")}
      ${featureRow("🧠", "5-Pillar Intelligence Engine", "TA · SMC · COT · Retail Sentiment · Options Flow master score.")}
      ${featureRow("📈", "TradingView Chart Terminal", "Professional charts with full drawing tools and indicators.")}
      ${featureRow("⚡", "Real-Time Signal Alerts", "Email notifications whenever an A-grade setup is detected.")}
    </table>

    ${divider("20px 0")}

    <div style="background:#111827;border-radius:12px;padding:14px 18px;border:1px solid #1a2840;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:0.8px;">Or copy this link</p>
      <p style="margin:0;font-size:11px;color:#64748b;word-break:break-all;font-family:'Geist Mono', 'Courier New', monospace;">
        <a href="${verifyUrl}" style="color:#8b5cf6;text-decoration:none;">${verifyUrl}</a>
      </p>
    </div>

    ${divider("20px 0")}
    ${para(`Didn't create an account? You can safely ignore this email — no account will be activated.`)}
  `;
  return send({
    to,
    subject: "Verify your TradingIntel email address ✉️",
    html: layout({ body, preheader: "Click to verify your email and activate your TradingIntel account." }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. PASSWORD RESET (overrides placeholder above with full template)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const displayName = name || "Trader";
  const body = `
    ${heading("Reset your password 🔐", "This link expires in 1 hour.")}

    ${para(`Hi <strong style="color:#e2e8f0;">${displayName}</strong>, we received a request to reset your TradingIntel password.`)}

    <table cellpadding="0" cellspacing="0" style="margin:8px 0 8px;">
      <tr><td style="border-radius:12px;background:linear-gradient(135deg,#8b5cf6,#6366f1);">
        <a href="${resetUrl}" style="display:inline-block;padding:16px 40px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">
          🔐 &nbsp;Reset My Password
        </a>
      </td></tr>
    </table>

    ${alertBanner("🔒 Didn't request this? Your account is safe — simply ignore this email. Your password will not change.", "#64748b", "rgba(100,116,139,0.08)", "rgba(100,116,139,0.2)")}

    ${divider()}

    <div style="background:#111827;border-radius:12px;padding:14px 18px;border:1px solid #1a2840;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:0.8px;">Or copy this link</p>
      <p style="margin:0;font-size:11px;color:#64748b;word-break:break-all;font-family:'Geist Mono', 'Courier New', monospace;">
        <a href="${resetUrl}" style="color:#8b5cf6;text-decoration:none;">${resetUrl}</a>
      </p>
    </div>
  `;
  return send({
    to,
    subject: "Reset your TradingIntel password 🔐",
    html: layout({ body, preheader: "Click to reset your password. This link expires in 1 hour." }),
  });
}

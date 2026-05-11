"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  RefreshCw, TrendingUp, TrendingDown, Minus, Zap, AlertTriangle,
  Target, BarChart2, Newspaper, Activity, ArrowUpRight, ArrowDownRight, Clock,
  Layers
} from "lucide-react";

// ── Palette ──────────────────────────────────────────────────────────
const C = {
  green: "#10b981", greenBg: "rgba(16,185,129,0.1)", greenBd: "rgba(16,185,129,0.25)",
  red: "#ef4444", redBg: "rgba(239,68,68,0.1)", redBd: "rgba(239,68,68,0.25)",
  amber: "#f59e0b", amberBg: "rgba(245,158,11,0.1)", amberBd: "rgba(245,158,11,0.25)",
  blue: "#3b82f6", blueBg: "rgba(59,130,246,0.1)", blueBd: "rgba(59,130,246,0.25)",
  purple: "#8b5cf6", purpleBg: "rgba(139,92,246,0.1)",
  cyan: "#06b6d4", cyanBg: "rgba(6,182,212,0.1)",
  text: "#e2e8f0", textM: "#94a3b8", textD: "#64748b",
  bg: "#0a0e17", bg2: "#111827", bg3: "#1a2235", bg4: "#243049",
  border: "#1e2d45", borderL: "#2a3f5f",
  accent: "#8b5cf6",
};

const INSTRUMENTS = {
  XAUUSD: { label: "XAU/USD", sub: "Gold" },
  GBPUSD: { label: "GBP/USD", sub: "Cable" },
  GBPJPY: { label: "GBP/JPY", sub: "Guppy" },
  BTCUSD: { label: "BTC/USD", sub: "Bitcoin" },
  EURUSD: { label: "EUR/USD", sub: "Fiber" },
};

const TIMEFRAMES = [
  { label: "1M",  interval: "1m",   range: "1d"  },
  { label: "15M", interval: "15m",  range: "5d"  },
  { label: "30M", interval: "30m",  range: "5d"  },
  { label: "1H",  interval: "60m",  range: "1mo" },
  { label: "4H",  interval: "60m",  range: "3mo" },
  { label: "1D",  interval: "1d",   range: "6mo" },
  { label: "1W",  interval: "1wk",  range: "2y"  },
];

// ── Formatters ───────────────────────────────────────────────────────
const fmtPrice = (key, v) => {
  if (v == null) return "—";
  if (key === "BTCUSD") return "$" + Math.round(v).toLocaleString();
  if (key === "XAUUSD") return v.toFixed(2);
  return v.toFixed(key?.includes("JPY") ? 3 : 5);
};
const fmtPct = (n) => n == null ? "—" : (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

// ── TradingView symbol + interval maps ───────────────────────────────
const TV_SYMBOLS = {
  XAUUSD: "OANDA:XAUUSD",
  GBPUSD: "OANDA:GBPUSD",
  GBPJPY: "OANDA:GBPJPY",
  BTCUSD: "BITSTAMP:BTCUSD",
  EURUSD: "OANDA:EURUSD",
};

const TV_INTERVALS = {
  "1M": "1", "15M": "15", "30M": "30",
  "1H": "60", "4H": "240", "1D": "D", "1W": "W",
};

// ── TradingView Advanced Chart ────────────────────────────────────────
function TradingViewChart({ instrumentKey, tfLabel }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";

    const widgetId = `tv_${instrumentKey}_${Date.now()}`;
    const inner = document.createElement("div");
    inner.id = widgetId;
    inner.style.cssText = "width:100%;height:100%;";
    el.appendChild(inner);

    const init = () => {
      if (!window.TradingView || !document.getElementById(widgetId)) return;
      new window.TradingView.widget({
        container_id: widgetId,
        autosize: true,
        symbol: TV_SYMBOLS[instrumentKey] || "OANDA:XAUUSD",
        interval: TV_INTERVALS[tfLabel] || "D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        backgroundColor: "#0a0e17",
        gridColor: "rgba(30,45,69,0.5)",
        toolbar_bg: "#111827",
        withdateranges: true,
        hide_side_toolbar: false,
        allow_symbol_change: false,
        save_image: true,
        studies: [
          "RSI@tv-basicstudies",
          "BB@tv-basicstudies",
        ],
        disabled_features: [
          "header_symbol_search",
          "header_compare",
          "go_to_date",
        ],
        enabled_features: [
          "study_templates",
          "side_toolbar_in_fullscreen_mode",
          "hide_left_toolbar_by_default",
        ],
        overrides: {
          "mainSeriesProperties.candleStyle.upColor": "#10b981",
          "mainSeriesProperties.candleStyle.downColor": "#ef4444",
          "mainSeriesProperties.candleStyle.borderUpColor": "#10b981",
          "mainSeriesProperties.candleStyle.borderDownColor": "#ef4444",
          "mainSeriesProperties.candleStyle.wickUpColor": "#10b981",
          "mainSeriesProperties.candleStyle.wickDownColor": "#ef4444",
          "paneProperties.background": "#0a0e17",
          "paneProperties.vertGridProperties.color": "rgba(30,45,69,0.4)",
          "paneProperties.horzGridProperties.color": "rgba(30,45,69,0.4)",
          "scalesProperties.textColor": "#64748b",
          "scalesProperties.lineColor": "#1e2d45",
        },
      });
    };

    if (window.TradingView) {
      init();
    } else {
      const existing = document.getElementById("tv-script");
      if (!existing) {
        const s = document.createElement("script");
        s.id = "tv-script";
        s.src = "https://s3.tradingview.com/tv.js";
        s.async = true;
        s.onload = init;
        document.head.appendChild(s);
      } else {
        // script tag exists but TradingView not ready yet — poll briefly
        let tries = 0;
        const poll = setInterval(() => {
          if (window.TradingView || ++tries > 20) {
            clearInterval(poll);
            init();
          }
        }, 150);
      }
    }

    return () => { if (el) el.innerHTML = ""; };
  }, [instrumentKey, tfLabel]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

// ── Unified scoring engine (TA + SMC blended) ────────────────────────
function scoreInstrument(d) {
  if (!d) return { score: 0, direction: "NEUTRAL", factors: [], cautions: [] };
  const { trend, rsi, macd, sma, structure, bb, current, smc } = d;

  let taScore = 50;
  const factors = [];
  const cautions = [];

  // ── Classical TA factors ──────────────────────────────────────────
  if (trend === "BULLISH") { taScore += 12; factors.push({ label: "Trend", text: "Bullish — price above key MAs", delta: +12, color: C.green }); }
  else if (trend === "BEARISH") { taScore -= 12; factors.push({ label: "Trend", text: "Bearish — price below key MAs", delta: -12, color: C.red }); }
  else { factors.push({ label: "Trend", text: "Ranging — no clear direction", delta: 0, color: C.textM }); }

  if (rsi != null) {
    if (rsi > 70) { taScore -= 10; factors.push({ label: "RSI", text: `${rsi.toFixed(1)} — Overbought`, delta: -10, color: C.red }); cautions.push("RSI overbought — potential pullback"); }
    else if (rsi < 30) { taScore += 10; factors.push({ label: "RSI", text: `${rsi.toFixed(1)} — Oversold`, delta: +10, color: C.green }); cautions.push("RSI oversold — watch for reversal"); }
    else if (rsi > 55) { taScore += 6; factors.push({ label: "RSI", text: `${rsi.toFixed(1)} — Mild bullish`, delta: +6, color: C.green }); }
    else if (rsi < 45) { taScore -= 6; factors.push({ label: "RSI", text: `${rsi.toFixed(1)} — Mild bearish`, delta: -6, color: C.red }); }
    else { factors.push({ label: "RSI", text: `${rsi.toFixed(1)} — Neutral`, delta: 0, color: C.textM }); }
  }

  if (macd) {
    if (macd.cross === "bullish") { taScore += 10; factors.push({ label: "MACD", text: "Bullish crossover confirmed", delta: +10, color: C.green }); }
    else if (macd.cross === "bearish") { taScore -= 10; factors.push({ label: "MACD", text: "Bearish crossover confirmed", delta: -10, color: C.red }); }
    else if (macd.histogram > 0) { taScore += 5; factors.push({ label: "MACD", text: "Positive histogram", delta: +5, color: C.green }); }
    else if (macd.histogram < 0) { taScore -= 5; factors.push({ label: "MACD", text: "Negative histogram", delta: -5, color: C.red }); }
    else { factors.push({ label: "MACD", text: "Neutral", delta: 0, color: C.textM }); }
  }

  if (structure === "BREAKOUT") { taScore += 12; factors.push({ label: "Structure", text: "Breakout above resistance", delta: +12, color: C.green }); }
  else if (structure === "BREAKDOWN") { taScore -= 12; factors.push({ label: "Structure", text: "Breakdown below support", delta: -12, color: C.red }); }
  else if (structure === "TRENDING") { taScore += 6; factors.push({ label: "Structure", text: "Trending — follow momentum", delta: +6, color: C.green }); }
  else if (structure === "RANGING") { cautions.push("Price ranging — avoid trend entries"); factors.push({ label: "Structure", text: "Consolidation — low conviction", delta: 0, color: C.amber }); }
  else { factors.push({ label: "Structure", text: "Consolidating", delta: 0, color: C.textM }); }

  if (bb && current) {
    if (current > bb.upper) { taScore -= 8; cautions.push("Price above upper BB — extended"); factors.push({ label: "BB", text: "Above upper band — overextended", delta: -8, color: C.red }); }
    else if (current < bb.lower) { taScore += 8; cautions.push("Price below lower BB — possible bounce"); factors.push({ label: "BB", text: "Below lower band — possible bounce", delta: +8, color: C.green }); }
    else if (bb.upper && bb.lower && bb.middle && ((bb.upper - bb.lower) / bb.middle) < 0.01) { cautions.push("BB squeeze — breakout imminent"); factors.push({ label: "BB", text: "Bands squeezing — expect volatility", delta: 0, color: C.amber }); }
    else { factors.push({ label: "BB", text: "Price within bands — normal range", delta: 0, color: C.textM }); }
  }

  if (sma && current) {
    const a200 = current > sma.sma200, a50 = current > sma.sma50, a20 = current > sma.sma20;
    if (a200 && a50 && a20) { taScore += 8; factors.push({ label: "MA Stack", text: "Above SMA20/50/200 — strong bull", delta: +8, color: C.green }); }
    else if (!a200 && !a50 && !a20) { taScore -= 8; factors.push({ label: "MA Stack", text: "Below SMA20/50/200 — strong bear", delta: -8, color: C.red }); }
  }

  taScore = Math.min(100, Math.max(0, taScore));

  // ── SMC factors ───────────────────────────────────────────────────
  let smcDelta = 0;
  if (smc) {
    if (smc.structureTrend === "BULLISH") { smcDelta += 10; factors.push({ label: "SMC Structure", text: "Bullish market structure (HH/HL)", delta: +10, color: C.green }); }
    else if (smc.structureTrend === "BEARISH") { smcDelta -= 10; factors.push({ label: "SMC Structure", text: "Bearish market structure (LH/LL)", delta: -10, color: C.red }); }

    if (smc.bos) {
      const d = smc.bos.type === "bullish" ? +8 : -8;
      smcDelta += d;
      factors.push({ label: "BOS", text: `${smc.bos.type === "bullish" ? "Bullish" : "Bearish"} Break of Structure`, delta: d, color: d > 0 ? C.green : C.red });
    }

    if (smc.choch) {
      const d = smc.choch.type === "bullish" ? +5 : -5;
      smcDelta += d;
      factors.push({ label: "CHoCH", text: `${smc.choch.type === "bullish" ? "Bullish" : "Bearish"} Change of Character`, delta: d, color: d > 0 ? C.cyan : C.amber });
    }

    const inZoneBull = (smc.bullishOBs || []).filter(o => o.inZone).length;
    const inZoneBear = (smc.bearishOBs || []).filter(o => o.inZone).length;
    if (inZoneBull > 0) { const d = Math.min(inZoneBull * 6, 12); smcDelta += d; factors.push({ label: "Order Block", text: `${inZoneBull} bullish OB in zone`, delta: d, color: C.green }); }
    if (inZoneBear > 0) { const d = -Math.min(inZoneBear * 6, 12); smcDelta += d; factors.push({ label: "Order Block", text: `${inZoneBear} bearish OB in zone`, delta: d, color: C.red }); }

    const lastSweep = smc.liquiditySweeps?.slice(-1)[0];
    if (lastSweep) {
      const d = lastSweep.type === "bullish" ? +5 : -5;
      smcDelta += d;
      factors.push({ label: "Liq. Sweep", text: `${lastSweep.type === "bullish" ? "Bullish" : "Bearish"} liquidity sweep`, delta: d, color: d > 0 ? C.cyan : C.amber });
    }
  }

  // ── Blend TA (60%) + SMC (40%) ────────────────────────────────────
  const hasSmc = !!smc;
  let score;
  if (hasSmc) {
    const smcScore = Math.min(100, Math.max(0, 50 + smcDelta));
    score = Math.round(taScore * 0.6 + smcScore * 0.4);
  } else {
    score = Math.round(taScore);
  }
  score = Math.min(100, Math.max(0, score));

  // ── Conflict detection ────────────────────────────────────────────
  const taDir = taScore >= 60 ? "BULL" : taScore <= 40 ? "BEAR" : "NEUTRAL";
  const smcDir = hasSmc ? (50 + smcDelta >= 60 ? "BULL" : 50 + smcDelta <= 40 ? "BEAR" : "NEUTRAL") : taDir;

  if (hasSmc && taDir !== "NEUTRAL" && smcDir !== "NEUTRAL" && taDir !== smcDir) {
    cautions.push("⚡ TA and SMC signals conflict — wait for alignment before entering");
    // Conflict: pull score back toward neutral
    score = Math.round(score * 0.7 + 50 * 0.3);
  }

  const direction = score >= 60 ? "BUY" : score <= 40 ? "SELL" : "NEUTRAL";
  return { score, direction, factors, cautions };
}

// ── ScoreMeter ────────────────────────────────────────────────────────
function ScoreMeter({ score }) {
  const color = score >= 65 ? C.green : score >= 45 ? C.amber : C.red;
  const label = score >= 65 ? "BUY" : score >= 45 ? "NEUTRAL" : "SELL";
  const r = 38, circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: 96, height: 96 }}>
        <svg width={96} height={96} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={48} cy={48} r={r} fill="none" stroke={C.bg3} strokeWidth={7} />
          <circle cx={48} cy={48} r={r} fill="none" stroke={color} strokeWidth={7}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease" }} />
        </svg>
<div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 9, color: C.textD, textTransform: "uppercase" }}>/ 100</div>
        </div>
      </div>
      <div style={{ padding: "3px 14px", borderRadius: 5, fontSize: 12, fontWeight: 700, background: score >= 65 ? C.greenBg : score >= 45 ? C.amberBg : C.redBg, color, border: `1px solid ${score >= 65 ? C.greenBd : score >= 45 ? C.amberBd : C.redBd}` }}>
        {label}
      </div>
    </div>
  );
}

// ── RsiGauge ──────────────────────────────────────────────────────────
function RsiGauge({ value }) {
  if (!value) return null;
  const color = value > 70 ? C.red : value < 30 ? C.green : C.amber;
  const zone = value > 70 ? "Overbought" : value < 30 ? "Oversold" : value > 55 ? "Bullish" : value < 45 ? "Bearish" : "Neutral";
  return (
    <div style={{ background: C.bg3, borderRadius: 8, padding: "10px 14px", border: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: C.textD, textTransform: "uppercase", letterSpacing: "0.5px" }}>RSI (14)</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{value.toFixed(1)} <span style={{ fontSize: 10, fontWeight: 400 }}>— {zone}</span></span>
      </div>
      <div style={{ position: "relative", height: 6, borderRadius: 3, overflow: "hidden", background: `linear-gradient(to right, ${C.green}, ${C.amber}, ${C.red})` }}>
        <div style={{ position: "absolute", top: -1, left: `${value}%`, width: 3, height: 8, background: "#fff", borderRadius: 1, transform: "translateX(-50%)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.textD, marginTop: 3 }}>
        <span>0 — OS</span><span>30</span><span>70</span><span>OB — 100</span>
      </div>
    </div>
  );
}

// ── Unified Chart (lightweight-charts) ────────────────────────────────
function UnifiedChart({ instrumentKey, tfLabel }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: C.bg }}>
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        <TradingViewChart instrumentKey={instrumentKey} tfLabel={tfLabel} />
      </div>
    </div>
  );
}

// ── Analysis Cards ────────────────────────────────────────────────────
function AnalysisCards({ data, instrumentKey, scoring }) {
  const { trend, structure, rsi, sma } = data;
  const sc = scoring || {};
  const sigDir  = sc.direction || "WAIT";
  const sigCol  = sigDir === "BUY" ? C.green : sigDir === "SELL" ? C.red : C.amber;
  const cards = [
    {
      label: "Signal", icon: <Zap size={13}/>,
      value: sigDir, sub: `Score ${sc.score ?? "—"}/100`,
      color: sigCol, highlight: true,
    },
    {
      label: "Trend", icon: trend === "BULLISH" ? <TrendingUp size={13}/> : trend === "BEARISH" ? <TrendingDown size={13}/> : <Minus size={13}/>,
      value: trend || "—", sub: sma ? `SMA20: ${fmtPrice(instrumentKey, sma.sma20)}` : null,
      color: trend === "BULLISH" ? C.green : trend === "BEARISH" ? C.red : C.textM,
    },
    {
      label: "RSI (14)", icon: <Activity size={13}/>,
      value: rsi ? rsi.toFixed(1) : "—",
      sub: rsi > 70 ? "Overbought" : rsi < 30 ? "Oversold" : rsi > 55 ? "Bullish" : rsi < 45 ? "Bearish" : "Neutral",
      color: rsi > 70 ? C.red : rsi < 30 ? C.green : C.amber,
    },
    {
      label: "Structure", icon: <Target size={13}/>,
      value: structure || "—", sub: sc.conflicted ? "⚠ Conflicted" : null,
      color: structure === "BREAKOUT" ? C.green : structure === "BREAKDOWN" ? C.red : structure === "RANGING" ? C.amber : C.textM,
    },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 8 }}>
      {cards.map(c => (
        <div key={c.label} style={{ background: c.highlight ? `${sigCol}10` : C.bg3, borderRadius: 8, padding: "9px 12px", border: `1px solid ${c.highlight ? sigCol + "40" : C.border}`, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.textD, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.4px" }}>
            <span style={{ color: c.color }}>{c.icon}</span>{c.label}
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: c.color }}>{c.value}</div>
          <div style={{ fontSize: 9, color: C.textD, minHeight: 12 }}>{c.sub || ""}</div>
        </div>
      ))}
    </div>
  );
}

// ── Key Levels ────────────────────────────────────────────────────────
function KeyLevels({ data, instrumentKey }) {
  const { support = [], resistance = [] } = data;
  const MAX = 3;
  const rows = [0, 1, 2];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {[
        { title: "Support", levels: support, color: C.green, prefix: "S" },
        { title: "Resistance", levels: resistance, color: C.red, prefix: "R" },
      ].map(side => (
        <div key={side.title} style={{ background: C.bg3, borderRadius: 8, padding: "10px 12px", border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 9, color: C.textD, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>{side.title}</div>
          {rows.map(i => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 24, borderBottom: i < MAX - 1 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 9, color: C.textD }}>{side.levels[i] != null ? `${side.prefix}${i+1}` : ""}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: side.color }}>{side.levels[i] != null ? fmtPrice(instrumentKey, side.levels[i]) : "—"}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Curated insight engine — no external API ─────────────────────────
function buildInsight(instrumentKey, data, scoring, instStatic) {
  const { direction, score, conflicted, cautions } = scoring;
  const { trend, structure, rsi, sma, bb, current } = data;
  const inst = instStatic || {};
  const cot  = inst.cot || {};
  const sent = inst.sentiment || {};

  const lines = [];

  // 1. Master signal sentence
  if (direction === "BUY") {
    lines.push(`Price action and smart money structure both favour longs with a composite score of ${score}/100.`);
  } else if (direction === "SELL") {
    lines.push(`Technical and SMC confluence points short — composite score ${score}/100 — favour selling into strength.`);
  } else if (conflicted) {
    lines.push(`TA and SMC are pointing in opposite directions (score ${score}/100). Hold off until they realign.`);
  } else {
    lines.push(`No clear directional edge (score ${score}/100). Market is ranging — wait for a breakout trigger.`);
  }

  // 2. COT positioning
  if (cot.netSpec != null) {
    const netK = Math.round(cot.netSpec / 1000);
    const cotBias = cot.netSpec > 30000 ? "spec longs are crowded" : cot.netSpec < -30000 ? "spec shorts are elevated" : "spec positioning is neutral";
    lines.push(`COT (${cot.date || "latest"}): net specs ${netK > 0 ? "+" : ""}${netK}K — ${cotBias}.`);
  } else if (inst.label?.includes("JPY") || instrumentKey === "GBPJPY") {
    lines.push(`GBPJPY is a synthetic cross — read via GBP (${cot.gbpNet ? (cot.gbpNet/1000).toFixed(0)+"K" : "n/a"}) and JPY (${cot.jpyNet ? (cot.jpyNet/1000).toFixed(0)+"K" : "n/a"}) positioning.`);
  }

  // 3. Retail sentiment contrarian
  if (sent.retailLong != null) {
    const rl = sent.retailLong;
    if (rl >= 70) lines.push(`Retail is ${rl}% long — crowded long, expect smart money to lean short.`);
    else if (rl <= 30) lines.push(`Retail is ${rl}% long — crowded short, contrarian bias favours longs.`);
    else lines.push(`Retail sentiment is split ${rl}/${100 - rl} — no strong contrarian edge at this time.`);
  }

  // 4. RSI context
  if (rsi != null) {
    if (rsi > 70) lines.push(`RSI at ${rsi.toFixed(1)} is overbought — pullback or consolidation likely before continuation.`);
    else if (rsi < 30) lines.push(`RSI at ${rsi.toFixed(1)} is oversold — watch for a bounce or reversal signal.`);
    else lines.push(`RSI ${rsi.toFixed(1)} is in neutral territory, leaving room to move in either direction.`);
  }

  // 5. Structure
  if (structure === "BREAKOUT") lines.push(`Price is breaking structure to the upside — momentum favours continuation longs.`);
  else if (structure === "BREAKDOWN") lines.push(`Market structure is breaking down — shorts have the structural edge.`);
  else if (structure === "RANGING") lines.push(`Price is ranging — trade the extremes of the range, avoid trend entries.`);

  // 6. BB squeeze
  if (bb && current) {
    const bandWidth = bb.upper - bb.lower;
    const pctB = bandWidth > 0 ? ((current - bb.lower) / bandWidth) * 100 : 50;
    if (pctB > 85) lines.push(`Price is hugging the upper Bollinger Band — statistically stretched to the upside.`);
    else if (pctB < 15) lines.push(`Price is pressing the lower Bollinger Band — mean-reversion setup possible.`);
  }

  // 7. Cautions
  if (cautions.length > 0) {
    lines.push(`Key caution: ${cautions[0].replace(/^[⚡⚠️·\s]+/, "")}.`);
  }

  return lines.slice(0, 4).join(" ");
}

// ── Verdict Panel ─────────────────────────────────────────────────────
function VerdictPanel({ instrumentKey, data, scoring, instStatic }) {
  const { signal } = data;
  const { score, direction, factors, cautions } = scoring;
  const isBuy  = direction === "BUY";
  const isSell = direction === "SELL";
  const insight = buildInsight(instrumentKey, data, scoring, instStatic);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Score + headline */}
      <div style={{ background: C.bg3, borderRadius: 10, padding: 14, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 14 }}>
        <ScoreMeter score={score} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
            {isBuy ? "Bullish Setup" : isSell ? "Bearish Setup" : "No Clear Signal"}
          </div>
          <div style={{ fontSize: 11, color: C.textM, lineHeight: 1.5 }}>
            {isBuy ? "TA and SMC agree bullish. Consider long positions at key levels."
              : isSell ? "TA and SMC agree bearish. Consider short positions at key levels."
              : scoring.conflicted
                ? "TA and SMC conflict — stand aside until both align."
                : "Mixed signals. Wait for clearer confirmation before entering."}
          </div>
          {signal && (
            <div style={{ marginTop: 6, fontSize: 10, color: C.textD }}>
              Confidence: <span style={{ color: signal.confidence >= 70 ? C.green : signal.confidence >= 50 ? C.amber : C.red, fontWeight: 700 }}>{signal.confidence}%</span>
              {" · "}R:R <span style={{ color: C.amber, fontWeight: 700 }}>{signal.rr}</span>
            </div>
          )}
        </div>
      </div>

      {/* Trade setup grid */}
      {signal && (
        <div style={{ background: C.bg3, borderRadius: 10, padding: 12, border: `1px solid ${isBuy ? C.greenBd : C.redBd}` }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.textM, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
            <Target size={11} color={isBuy ? C.green : C.red} />Trade Setup · <span style={{ color: isBuy ? C.green : C.red }}>{signal.direction}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            {[
              { label: "Entry",    value: fmtPrice(instrumentKey, signal.entry), color: C.cyan  },
              { label: "Stop Loss",value: fmtPrice(instrumentKey, signal.sl),    color: C.red   },
              { label: "TP 1",     value: fmtPrice(instrumentKey, signal.tp1),   color: C.green },
              { label: "TP 2",     value: fmtPrice(instrumentKey, signal.tp2),   color: C.green },
              { label: "TP 3",     value: signal.tp3 ? fmtPrice(instrumentKey, signal.tp3) : "—", color: C.green },
              { label: "R:R Ratio",value: signal.rr,                             color: C.amber },
            ].map(row => (
              <div key={row.label} style={{ background: C.bg2, borderRadius: 5, padding: "6px 8px", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 9, color: C.textD, textTransform: "uppercase" }}>{row.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: row.color, marginTop: 1 }}>{row.value}</div>
              </div>
            ))}
          </div>
          {signal.reason && (
            <div style={{ marginTop: 8, fontSize: 10, color: C.textM, padding: "7px 8px", background: C.bg2, borderRadius: 5, border: `1px solid ${C.border}`, lineHeight: 1.5 }}>
              {signal.reason}
            </div>
          )}
        </div>
      )}

      {/* Cautions */}
      {cautions.length > 0 && (
        <div style={{ background: C.amberBg, borderRadius: 8, padding: 10, border: `1px solid ${C.amberBd}` }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.amber, display: "flex", alignItems: "center", gap: 5, marginBottom: 6, textTransform: "uppercase" }}>
            <AlertTriangle size={11} /> Cautions
          </div>
          {cautions.map((c, i) => (
            <div key={i} style={{ fontSize: 11, color: C.textM, padding: "3px 0", borderBottom: i < cautions.length - 1 ? `1px solid ${C.amberBd}` : "none" }}>· {c}</div>
          ))}
        </div>
      )}

      {/* AI Insight — generated from curated data */}
      <div style={{ background: C.bg3, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ padding: "9px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6 }}>
          <Zap size={11} color={C.purple} />
          <span style={{ fontSize: 10, fontWeight: 700, color: C.purple, textTransform: "uppercase", letterSpacing: 0.6 }}>Intelligence Summary</span>
        </div>
        <div style={{ padding: "10px 12px" }}>
          <p style={{ margin: 0, fontSize: 11, color: C.textM, lineHeight: 1.75 }}>{insight || "Load chart data to generate insight."}</p>
        </div>
      </div>
    </div>
  );
}

// ── Breakdown Panel ───────────────────────────────────────────────────
function BreakdownPanel({ data, instrumentKey, scoring }) {
  const { bb, sma, current } = data;
  const { score, factors } = scoring;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ background: C.bg3, borderRadius: 10, padding: 12, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: C.textM, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>Score Breakdown</div>
        {factors.map((f, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "6px 0", borderBottom: i < factors.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: f.color }}>{f.label}</div>
              <div style={{ fontSize: 10, color: C.textD, marginTop: 1 }}>{f.text}</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: f.delta > 0 ? C.green : f.delta < 0 ? C.red : C.textD, minWidth: 30, textAlign: "right" }}>
              {f.delta > 0 ? "+" : ""}{f.delta}
            </div>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: `1px solid ${C.borderL}` }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>Final Score</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: score >= 65 ? C.green : score >= 45 ? C.amber : C.red }}>{score} / 100</span>
        </div>
      </div>
      <RsiGauge value={data.rsi} />
      {bb && (
        <div style={{ background: C.bg3, borderRadius: 10, padding: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.textM, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>Bollinger Bands (20,2)</div>
          {[
            { label: "Upper Band", value: bb.upper, color: C.red },
            { label: "Middle (SMA20)", value: bb.middle, color: C.amber },
            { label: "Lower Band", value: bb.lower, color: C.green },
            { label: "Band Width", value: (bb.upper && bb.lower && bb.middle) ? (((bb.upper - bb.lower) / bb.middle) * 100).toFixed(3) + "%" : "—", color: C.textM },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 10, color: C.textD }}>{r.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: r.color }}>{typeof r.value === "number" ? fmtPrice(instrumentKey, r.value) : r.value}</span>
            </div>
          ))}
          {current && (
            <div style={{ marginTop: 6, fontSize: 10, color: C.textD }}>
              Price {current > bb.upper ? <span style={{ color: C.red }}>above upper ⚠</span> : current < bb.lower ? <span style={{ color: C.green }}>below lower ↑</span> : <span style={{ color: C.green }}>within bands ✓</span>}
            </div>
          )}
        </div>
      )}
      {sma && (
        <div style={{ background: C.bg3, borderRadius: 10, padding: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.textM, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>Moving Averages</div>
          {[
            { label: "SMA 20", value: sma.sma20, color: C.amber },
            { label: "SMA 50", value: sma.sma50, color: C.purple },
            { label: "SMA 200", value: sma.sma200, color: C.blue },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 10, color: C.textD }}>{r.label}</span>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: r.color }}>{fmtPrice(instrumentKey, r.value)}</span>
                {current && r.value && <span style={{ fontSize: 9, color: current > r.value ? C.green : C.red, marginLeft: 5 }}>{current > r.value ? "↑ Above" : "↓ Below"}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── News Panel ────────────────────────────────────────────────────────
function NewsPanel({ news, instrumentKey }) {
  const relevant = news.filter(n => {
    const a = n.instruments || n.affected || [];
    return a.length === 0 || a.includes(instrumentKey);
  }).slice(0, 15);
  const ic = { HIGH: C.red, MEDIUM: C.amber, LOW: C.green };
  const ib = { HIGH: C.redBg, MEDIUM: C.amberBg, LOW: C.greenBg };
  const sc = { BULLISH: C.green, BEARISH: C.red, NEUTRAL: C.textM };
  if (!relevant.length) return (
    <div style={{ padding: 20, textAlign: "center", color: C.textD, fontSize: 12 }}>
      No news for {INSTRUMENTS[instrumentKey]?.label}
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {relevant.map((n, i) => (
        <a key={i} href={n.link} target="_blank" rel="noopener noreferrer"
          style={{ background: C.bg3, borderRadius: 8, padding: "9px 11px", border: `1px solid ${C.border}`, textDecoration: "none", display: "block" }}>
          <div style={{ display: "flex", gap: 5, marginBottom: 5 }}>
            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 3, background: ib[n.impact], color: ic[n.impact] }}>{n.impact}</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: sc[n.sentiment] }}>{n.sentiment}</span>
            <span style={{ fontSize: 9, color: C.textD, marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}>
              <Clock size={9} />{n.pubDate ? new Date(n.pubDate).toLocaleDateString() : ""}
            </span>
          </div>
          <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>{n.title}</div>
        </a>
      ))}
    </div>
  );
}

// ── SMC Panel ─────────────────────────────────────────────────────────
function SMCPanel({ data, instrumentKey }) {
  const smc = data?.smc;
  if (!smc) return (
    <div style={{ padding: 20, textAlign: "center", color: C.textD, fontSize: 12 }}>
      No SMC data available
    </div>
  );

  const score = smc.score ?? 0;
  const scoreColor = score >= 65 ? C.green : score >= 45 ? C.amber : C.red;
  const scoreLabel = score >= 72 ? "Strong Setup" : score >= 58 ? "Good Setup" : score >= 42 ? "Weak Setup" : "No Setup";

  const structColor = smc.structureTrend === "BULLISH" ? C.green : smc.structureTrend === "BEARISH" ? C.red : C.amber;

  const inZoneOBs = [
    ...(smc.bullishOBs || []).filter(ob => ob.inZone),
    ...(smc.bearishOBs || []).filter(ob => ob.inZone),
    ...(smc.breakerBlocks || []).filter(ob => ob.inZone),
  ];

  const allOBs = [
    ...(smc.bullishOBs || []).map(ob => ({ ...ob, type: "Bullish OB" })),
    ...(smc.bearishOBs || []).map(ob => ({ ...ob, type: "Bearish OB" })),
    ...(smc.breakerBlocks || []).map(ob => ({ ...ob, type: "Breaker" })),
  ];

  const allFVGs = [
    ...(smc.bullishFVGs || []).map(f => ({ ...f, type: "Bull FVG" })),
    ...(smc.bearishFVGs || []).map(f => ({ ...f, type: "Bear FVG" })),
  ];

  const lastSweep = smc.liquiditySweeps?.slice(-1)[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* Score Header */}
      <div style={{ background: C.bg3, borderRadius: 10, padding: 12, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", border: `3px solid ${scoreColor}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: scoreColor }}>{score}</span>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{scoreLabel}</div>
          <div style={{ fontSize: 10, color: C.textM, marginTop: 2 }}>
            Structure: <span style={{ color: structColor, fontWeight: 600 }}>{smc.structureTrend || "—"}</span>
          </div>
          <div style={{ fontSize: 10, color: C.textD, marginTop: 1 }}>
            {inZoneOBs.length > 0 && `${inZoneOBs.length} OB in zone · `}
            {allFVGs.length > 0 && `${allFVGs.length} FVG open · `}
            {(smc.liquiditySweeps?.length || 0) > 0 && `${smc.liquiditySweeps.length} sweep`}
          </div>
        </div>
      </div>

      {/* BOS / CHoCH */}
      {(smc.bos || smc.choch) && (
        <div style={{ background: C.bg3, borderRadius: 8, padding: 10, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 9, color: C.textD, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 7, fontWeight: 600 }}>Structure Breaks</div>
          {smc.bos && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: smc.choch ? `1px solid ${C.border}` : "none" }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: smc.bos.type === "bullish" ? C.green : C.red }}>BOS</span>
                <span style={{ fontSize: 9, color: C.textM, marginLeft: 5 }}>{smc.bos.type?.toUpperCase()}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--font-geist-mono), monospace", color: C.text }}>{fmtPrice(instrumentKey, smc.bos.level)}</span>
            </div>
          )}
          {smc.choch && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0" }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.purple }}>CHoCH</span>
                <span style={{ fontSize: 9, color: C.textM, marginLeft: 5 }}>{smc.choch.type?.toUpperCase()}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--font-geist-mono), monospace", color: C.text }}>{fmtPrice(instrumentKey, smc.choch.level)}</span>
            </div>
          )}
        </div>
      )}

      {/* Swing Levels */}
      {(smc.lastSwingHigh || smc.lastSwingLow) && (
        <div style={{ background: C.bg3, borderRadius: 8, padding: 10, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 9, color: C.textD, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 7, fontWeight: 600 }}>Swing Levels</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {smc.lastSwingHigh && (
              <div style={{ background: C.bg2, borderRadius: 5, padding: "6px 8px" }}>
                <div style={{ fontSize: 9, color: C.textD }}>Last Swing High</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.red, fontFamily: "var(--font-geist-mono), monospace" }}>{fmtPrice(instrumentKey, smc.lastSwingHigh)}</div>
              </div>
            )}
            {smc.lastSwingLow && (
              <div style={{ background: C.bg2, borderRadius: 5, padding: "6px 8px" }}>
                <div style={{ fontSize: 9, color: C.textD }}>Last Swing Low</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.green, fontFamily: "var(--font-geist-mono), monospace" }}>{fmtPrice(instrumentKey, smc.lastSwingLow)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Blocks */}
      {allOBs.length > 0 && (
        <div style={{ background: C.bg3, borderRadius: 8, padding: 10, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 9, color: C.textD, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 7, fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
            <span>Order Blocks</span>
            <span style={{ color: inZoneOBs.length > 0 ? C.amber : C.textD }}>{inZoneOBs.length} active</span>
          </div>
          {allOBs.map((ob, i) => {
            const isBull = ob.type === "Bullish OB";
            const isBreaker = ob.type === "Breaker";
            const col = isBreaker ? C.purple : isBull ? C.green : C.red;
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < allOBs.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 1, background: col }} />
                  <div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: col }}>{ob.type}</span>
                    {ob.inZone && <span style={{ fontSize: 8, marginLeft: 4, padding: "1px 4px", borderRadius: 2, background: C.amberBg, color: C.amber }}>IN ZONE</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: 10, fontFamily: "var(--font-geist-mono), monospace" }}>
                  <div style={{ color: C.red, fontSize: 9 }}>{fmtPrice(instrumentKey, ob.high)}</div>
                  <div style={{ color: C.green, fontSize: 9 }}>{fmtPrice(instrumentKey, ob.low)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fair Value Gaps */}
      {allFVGs.length > 0 && (
        <div style={{ background: C.bg3, borderRadius: 8, padding: 10, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 9, color: C.textD, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 7, fontWeight: 600 }}>Fair Value Gaps</div>
          {allFVGs.map((f, i) => {
            const isBull = f.type === "Bull FVG";
            const col = isBull ? C.green : C.red;
            const size = f.high - f.low;
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < allFVGs.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 1, background: col, opacity: 0.7 }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: col }}>{f.type}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, fontFamily: "var(--font-geist-mono), monospace", color: C.textM }}>
                    {fmtPrice(instrumentKey, f.low)} – {fmtPrice(instrumentKey, f.high)}
                  </div>
                  <div style={{ fontSize: 9, color: C.textD }}>Gap: {fmtPrice(instrumentKey, size)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Liquidity Sweeps */}
      {(smc.liquiditySweeps?.length || 0) > 0 && (
        <div style={{ background: C.bg3, borderRadius: 8, padding: 10, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 9, color: C.textD, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 7, fontWeight: 600 }}>Liquidity Sweeps</div>
          {smc.liquiditySweeps.slice(-4).reverse().map((s, i) => {
            const isBull = s.type === "bullish";
            const col = isBull ? C.green : C.red;
            return (
              <div key={i} style={{ padding: "6px 0", borderBottom: i < Math.min(smc.liquiditySweeps.length, 4) - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 10 }}>{isBull ? "↑" : "↓"}</span>
                    <div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: col }}>{isBull ? "Bullish" : "Bearish"} Sweep</span>
                      {s.magnitude && <span style={{ fontSize: 8, color: C.textD, marginLeft: 4 }}>×{s.magnitude.toFixed(1)} ATR</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontFamily: "var(--font-geist-mono), monospace", color: C.textM }}>{fmtPrice(instrumentKey, s.level)}</span>
                </div>
                {s.note && <div style={{ fontSize: 9, color: C.textD, marginTop: 2, marginLeft: 17 }}>{s.note}</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!smc.bos && !smc.choch && allOBs.length === 0 && allFVGs.length === 0 && !(smc.liquiditySweeps?.length) && (
        <div style={{ padding: "20px 0", textAlign: "center", color: C.textD, fontSize: 12 }}>
          No active SMC patterns detected
        </div>
      )}
    </div>
  );
}

// ── Instrument Sidebar Item ───────────────────────────────────────────
function InstrumentItem({ ikey, data, livePrice, scoring, selected, onClick }) {
  const inst = INSTRUMENTS[ikey];
  const { score, direction } = scoring;
  const price = livePrice?.price ?? data.current;
  const change = livePrice?.change ?? data.change;
  const isUp = (change ?? 0) >= 0;
  return (
    <button onClick={() => onClick(ikey)}
      style={{ width: "100%", minWidth: 120, textAlign: "left", background: selected ? C.bg3 : "transparent", border: `1px solid ${selected ? C.borderL : "transparent"}`, borderRadius: 8, padding: "9px 10px", cursor: "pointer", transition: "all 0.15s", marginBottom: 3 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: selected ? C.text : C.textM }}>{inst.label}</div>
          <div style={{ fontSize: 9, color: C.textD }}>{inst.sub}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: isUp ? C.green : C.red, display: "flex", alignItems: "center", gap: 1 }}>
            {isUp ? <ArrowUpRight size={9}/> : <ArrowDownRight size={9}/>}{fmtPct(change)}
          </div>
          <div style={{ fontSize: 9, color: C.textD, fontFamily: "var(--font-geist-mono), monospace" }}>{fmtPrice(ikey, price)}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 3, marginTop: 5 }}>
        <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 4px", borderRadius: 3, background: data.trend === "BULLISH" ? C.greenBg : data.trend === "BEARISH" ? C.redBg : C.bg4, color: data.trend === "BULLISH" ? C.green : data.trend === "BEARISH" ? C.red : C.textD }}>
          {data.trend?.slice(0, 4) || "—"}
        </span>
        <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 4px", borderRadius: 3, background: direction === "BUY" ? C.greenBg : direction === "SELL" ? C.redBg : C.bg4, color: direction === "BUY" ? C.green : direction === "SELL" ? C.red : C.textD }}>
          {direction}
        </span>
        <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 4px", borderRadius: 3, background: score >= 65 ? C.greenBg : score >= 45 ? C.amberBg : C.redBg, color: score >= 65 ? C.green : score >= 45 ? C.amber : C.red, marginLeft: "auto" }}>
          {score}
        </span>
      </div>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────
// ── Signal Tracking Panel ────────────────────────────────────────────
function SignalPanel({ openSignals, instrumentKey, liveData }) {
  const sigs = (openSignals || []).filter(s => s.instrument === instrumentKey);
  const fmtP = (key, v) => {
    if (v == null) return "—";
    if (key === "BTCUSD") return "$" + Math.round(v).toLocaleString();
    if (key === "XAUUSD") return v.toFixed(2);
    return Number(v).toFixed(key?.includes("JPY") ? 3 : 5);
  };
  if (sigs.length === 0) return (
    <div style={{ textAlign: "center", padding: "32px 12px", color: C.textD }}>
      <Target size={28} style={{ marginBottom: 10, opacity: 0.4 }} />
      <div style={{ fontSize: 12 }}>No open signals for {instrumentKey}</div>
      <div style={{ fontSize: 11, marginTop: 6, color: C.textD }}>Go to Trade Lab → Signals to create one</div>
    </div>
  );
  return (
    <div>
      <div style={{ fontSize: 11, color: C.textD, marginBottom: 10 }}>{sigs.length} active signal{sigs.length > 1 ? "s" : ""} · auto-closes when TP/SL hit</div>
      {sigs.map(sg => {
        const cur = liveData?.[instrumentKey]?.price ?? null;
        const entry = Number(sg.entryPrice);
        const tp = sg.targetPrice ? Number(sg.targetPrice) : null;
        const sl = sg.stopLoss ? Number(sg.stopLoss) : null;
        const isLong = sg.direction === "Long";
        const slBreached = cur && sl && (isLong ? cur <= sl : cur >= sl);
        const tpBreached = cur && tp && (isLong ? cur >= tp : cur <= tp);
        const pnlPct = cur ? (((cur - entry) / entry) * 100 * (isLong ? 1 : -1)).toFixed(2) : null;
        const tpProgress = (tp && cur) ? Math.min(100, Math.max(0, Math.abs(cur - entry) / Math.abs(tp - entry) * 100)) : 0;
        const dirColor = isLong ? C.green : C.red;
        const dirBg = isLong ? C.greenBg : C.redBg;
        const dirBd = isLong ? C.greenBd : C.redBd;
        return (
          <div key={sg.id} style={{ background: C.bg3, borderRadius: 10, padding: 12, marginBottom: 10, border: `1px solid ${slBreached ? C.red : tpBreached ? C.green : sg.grade === "A" ? "#8b5cf660" : C.border}`, opacity: slBreached ? 0.7 : 1 }}>
            {(slBreached || tpBreached) && (
              <div style={{ padding: "5px 10px", borderRadius: 6, background: slBreached ? C.redBg : C.greenBg, border: `1px solid ${slBreached ? C.redBd : C.greenBd}`, marginBottom: 8, fontSize: 11, fontWeight: 700, color: slBreached ? C.red : C.green }}>
                {slBreached ? "⚠ SL HIT — closing…" : "✓ TP HIT — closing…"}
              </div>
            )}
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: dirBg, color: dirColor, border: `1px solid ${dirBd}` }}>{sg.direction.toUpperCase()}</span>
                {sg.grade && <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 5px", borderRadius: 4, background: "#8b5cf620", color: C.accent, border: "1px solid #8b5cf640" }}>{sg.grade}</span>}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: pnlPct === null ? C.textD : Number(pnlPct) >= 0 ? C.green : C.red }}>{pnlPct === null ? "—" : `${pnlPct >= 0 ? "+" : ""}${pnlPct}%`}</span>
            </div>
            {/* Price levels */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
              <div style={{ background: C.bg, borderRadius: 6, padding: "5px 7px" }}>
                <div style={{ fontSize: 9, color: C.textD, marginBottom: 2 }}>ENTRY</div>
                <div style={{ fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", color: C.text, fontWeight: 600 }}>{fmtP(instrumentKey, entry)}</div>
              </div>
              <div style={{ background: `${C.green}10`, borderRadius: 6, padding: "5px 7px", border: `1px solid ${C.greenBd}` }}>
                <div style={{ fontSize: 9, color: C.green, marginBottom: 2 }}>TP</div>
                <div style={{ fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", color: C.green, fontWeight: 600 }}>{fmtP(instrumentKey, tp)}</div>
              </div>
              <div style={{ background: `${C.red}10`, borderRadius: 6, padding: "5px 7px", border: `1px solid ${C.redBd}` }}>
                <div style={{ fontSize: 9, color: C.red, marginBottom: 2 }}>SL</div>
                <div style={{ fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", color: C.red, fontWeight: 600 }}>{fmtP(instrumentKey, sl)}</div>
              </div>
            </div>
            {/* Current price */}
            {cur && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textD, marginBottom: 4 }}>
                  <span>Current {fmtP(instrumentKey, cur)}</span><span style={{ color: C.green }}>{tpProgress.toFixed(0)}% to TP</span>
                </div>
                <div style={{ height: 4, background: C.bg, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${tpProgress}%`, background: `linear-gradient(90deg, ${dirColor}, ${C.green})`, borderRadius: 2, transition: "width 0.5s" }} />
                </div>
              </div>
            )}
            {/* R:R + Conf */}
            <div style={{ display: "flex", gap: 8, fontSize: 10, color: C.textD }}>
              {sg.riskReward && <span>R:R {sg.riskReward}</span>}
              <span>Conf {sg.confidence}/10</span>
              <span style={{ marginLeft: "auto" }}>{new Date(sg.createdAt).toLocaleDateString()}</span>
            </div>
            {sg.notes && <div style={{ fontSize: 10, color: C.textD, marginTop: 6, lineHeight: 1.5, borderTop: `1px solid ${C.border}`, paddingTop: 6 }}>{sg.notes.slice(0, 120)}{sg.notes.length > 120 ? "…" : ""}</div>}
          </div>
        );
      })}
    </div>
  );
}

export default function TradingIntelligence({ openSignals, liveData: externalLiveData, onSignalClosed }) {
  const [instruments, setInstruments] = useState({});
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tfLoading, setTfLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState("XAUUSD");
  const [activeTab, setActiveTab] = useState("signal");
  const [aiResults, setAiResults] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [timeframe, setTimeframe] = useState(() => {
    try {
      const saved = typeof window !== "undefined" && localStorage.getItem("chart_tf");
      return TIMEFRAMES.find(t => t.label === saved) || TIMEFRAMES[3]; // default 1H
    } catch { return TIMEFRAMES[3]; }
  });
  const [livePrices, setLivePrices] = useState({});
  const [nextRefresh, setNextRefresh] = useState(300); // seconds countdown

  const load = useCallback(async (tf = null) => {
    // tf=null means initial load (shows sidebar skeleton)
    // tf=<timeframe> means user switched timeframe (shows subtle loading dot)
    const activeTf = tf || timeframe;
    const isInitial = tf === null;
    if (isInitial) setLoading(true); else setTfLoading(true);
    setError(null);
    try {
      const url = `/api/intelligence?interval=${activeTf.interval}&range=${activeTf.range}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setInstruments(data.instruments || {});
      setNews(data.news || []);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      if (isInitial) setLoading(false); else setTfLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Auto-refresh intelligence data every 5 min (silent — no skeleton) ──
  useEffect(() => {
    setNextRefresh(300);
    const chart = setInterval(() => {
      load(timeframe); // passes timeframe → uses tfLoading, not loading
      setNextRefresh(300);
    }, 5 * 60 * 1000);
    // Countdown ticker
    const tick = setInterval(() => setNextRefresh(n => Math.max(0, n - 1)), 1000);
    return () => { clearInterval(chart); clearInterval(tick); };
  }, [timeframe, load]);

  // ── Live price updates every 15s from /api/prices ──
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch("/api/prices");
        const json = await res.json();
        if (json.data) setLivePrices(json.data);
      } catch {}
    };
    fetchPrices();
    const id = setInterval(fetchPrices, 15_000);
    return () => clearInterval(id);
  }, []);

  // Auto-close signals whose TP or SL has been breached by live price
  useEffect(() => {
    if (!openSignals?.length || !Object.keys(livePrices).length) return;
    openSignals.filter(sg => sg.stopLoss || sg.targetPrice).forEach(sg => {
      const price = livePrices[sg.instrument]?.price;
      if (!price) return;
      const isLong = sg.direction === "Long";
      const tpHit = sg.targetPrice && (isLong ? price >= Number(sg.targetPrice) : price <= Number(sg.targetPrice));
      const slHit = sg.stopLoss && (isLong ? price <= Number(sg.stopLoss) : price >= Number(sg.stopLoss));
      if (!tpHit && !slHit) return;
      const result = tpHit ? "WIN" : "LOSS";
      fetch(`/api/signals/${sg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED", exitPrice: price, result }),
      }).then(() => { onSignalClosed?.(); }).catch(() => {});
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livePrices]);

  const handleTimeframeChange = (tf) => {
    setTimeframe(tf);
    try { localStorage.setItem("chart_tf", tf.label); } catch {}
    load(tf);
  };

  const handleAiAnalyze = async () => {
    const data = instruments[selected];
    if (!data) return;
    setAiLoading(true);
    const scoring = scoreInstrument(data);
    const prompt = `You are a professional forex and crypto trading analyst. Analyze this instrument and provide concise actionable insights.

Instrument: ${INSTRUMENTS[selected]?.label} (${selected})
Current Price: ${fmtPrice(selected, data.current)}
24h Change: ${fmtPct(data.change)}
Trend: ${data.trend}
RSI(14): ${data.rsi?.toFixed(1)}
MACD: ${data.macd?.cross || (data.macd?.histogram > 0 ? "positive histogram" : "negative histogram")}
Market Structure: ${data.structure}
Composite Score: ${scoring.score}/100 → ${scoring.direction}
Signal: ${data.signal ? `${data.signal.direction} at ${fmtPrice(selected, data.signal.entry)}, SL ${fmtPrice(selected, data.signal.sl)}, TP1 ${fmtPrice(selected, data.signal.tp1)}, Confidence ${data.signal.confidence}%` : "None"}
Cautions: ${scoring.cautions.join("; ") || "None"}

Provide: 1) Market context (2 sentences), 2) Key risk factors, 3) Recommended action with rationale. Keep it under 150 words, professional tone.`;

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const result = await res.json();
      setAiResults(prev => ({ ...prev, [selected]: result.text || "Analysis unavailable." }));
    } catch {
      setAiResults(prev => ({ ...prev, [selected]: "Failed to get AI analysis." }));
    } finally {
      setAiLoading(false);
    }
  };

  const selectedData = instruments[selected] || {};
  const scoring = scoreInstrument(selectedData);
  const keys = Object.keys(INSTRUMENTS);

  const tabStyle = (t) => ({
    padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
    border: "none", transition: "all 0.15s",
    background: activeTab === t ? C.bg3 : "transparent",
    color: activeTab === t ? C.text : C.textD,
    borderBottom: activeTab === t ? `2px solid ${C.purple}` : "2px solid transparent",
  });

  return (
    <div className="ti-wrap" style={{ display: "flex", flex: 1, minHeight: 0, background: C.bg, color: C.text, fontFamily: "var(--font-geist-mono), monospace", overflow: "hidden" }}>
      <style>{`
        @media(max-width:900px){
          .ti-wrap{flex-direction:column!important;height:100%!important;overflow:hidden!important}
          /* Instrument bar — horizontal scroll strip */
          .ti-left{width:100%!important;height:auto!important;flex-direction:row!important;border-right:none!important;border-bottom:1px solid #1e2d45!important;flex-shrink:0!important;overflow:hidden!important}
          .ti-left-inner{display:flex!important;flex-direction:row!important;overflow-x:auto!important;padding:6px 8px!important;gap:5px!important;scrollbar-width:none!important;-webkit-overflow-scrolling:touch!important}
          .ti-left-header,.ti-left-footer{display:none!important}
          /* Chart takes 50% of remaining height */
          .ti-center{flex:1!important;min-height:220px!important;overflow:hidden!important}
          /* Analysis panel — scrollable below chart */
          .ti-right{width:100%!important;border-left:none!important;border-top:1px solid #1e2d45!important;height:45vh!important;min-height:260px!important;flex-shrink:0!important;overflow:hidden!important}
          /* Compact timeframe bar */
          .tf-bar{overflow-x:auto!important;scrollbar-width:none!important}
          .tf-bar button{padding:3px 5px!important;font-size:9px!important}
          /* InstrumentItem in horizontal mode */
          .ti-left-inner button{min-width:90px!important;flex-shrink:0!important;padding:6px 8px!important}
        }
        @media(max-width:480px){
          .ti-right{height:50vh!important}
          .ti-center{min-height:180px!important}
        }
      `}</style>

      {/* ── Left Sidebar ── */}
      <div className="ti-left" style={{ width: 196, flexShrink: 0, background: C.bg2, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div className="ti-left-header" style={{ padding: "10px 12px 8px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: C.textD, textTransform: "uppercase", letterSpacing: "0.6px" }}>Instruments</div>
        </div>
        <div className="ti-left-inner" style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ height: 60, borderRadius: 8, background: C.bg3, marginBottom: 4, opacity: 0.5 }} />
              ))
            : keys.map(k => (
                <InstrumentItem
                  key={k} ikey={k}
                  data={instruments[k] || { current: null, change: null, trend: "—" }}
                  livePrice={livePrices[k]}
                  scoring={instruments[k] ? scoreInstrument(instruments[k]) : { score: 0, direction: "—" }}
                  selected={selected === k}
                  onClick={(key) => { setSelected(key); setActiveTab("signal"); }}
                />
              ))
          }
        </div>
        <div className="ti-left-footer" style={{ padding: "8px 10px", borderTop: `1px solid ${C.border}` }}>
          {/* Auto-refresh status — no manual button needed */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: tfLoading ? C.amber : C.green, animation: tfLoading ? "none" : "pulse 2s infinite" }} />
              <span style={{ fontSize: 9, color: tfLoading ? C.amber : C.green, fontWeight: 600 }}>{tfLoading ? "Updating…" : "Auto"}</span>
            </div>
            <span style={{ fontSize: 9, color: C.textD }}>
              {tfLoading ? "" : `↻ ${Math.floor(nextRefresh / 60)}:${String(nextRefresh % 60).padStart(2, "0")}`}
            </span>
          </div>
          {lastUpdated && (
            <div style={{ fontSize: 9, color: C.textD, marginTop: 3 }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* ── Center Panel ── */}
      <div className="ti-center" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Center header — single unified row */}
        <div style={{ padding: "8px 14px", borderBottom: `1px solid ${C.border}`, background: C.bg2, display: "flex", alignItems: "center", gap: 10, flexShrink: 0, flexWrap: "nowrap", overflow: "hidden" }}>
          {/* Instrument + price */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: -0.3 }}>{INSTRUMENTS[selected]?.label}</span>
            {(() => {
              const lp = livePrices[selected];
              const displayPrice = lp?.price ?? selectedData.current;
              const displayChange = lp?.change ?? selectedData.change;
              const up = (displayChange ?? 0) >= 0;
              if (!displayPrice) return null;
              return (
                <>
                  <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--font-geist-mono), monospace", color: C.text }}>{fmtPrice(selected, displayPrice)}</span>
                  <span style={{ fontSize: 10, color: up ? C.green : C.red, display: "flex", alignItems: "center", gap: 1, fontWeight: 600 }}>
                    {up ? <ArrowUpRight size={9}/> : <ArrowDownRight size={9}/>}{fmtPct(displayChange)}
                  </span>
                  {lp && <span style={{ fontSize: 8, color: C.green, fontWeight: 700 }}>● LIVE</span>}
                </>
              );
            })()}
          </div>

          <div style={{ width: 1, height: 16, background: C.border, flexShrink: 0 }} />

          {/* Timeframe selector */}
          <div className="tf-bar" style={{ display: "flex", gap: 2, background: C.bg3, borderRadius: 6, padding: 2, border: `1px solid ${C.border}`, flexShrink: 0 }}>
            {TIMEFRAMES.map(tf => (
              <button key={tf.label} onClick={() => handleTimeframeChange(tf)}
                style={{ padding: "3px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: timeframe.label === tf.label ? C.purple : "transparent", color: timeframe.label === tf.label ? "#fff" : C.textM, border: "none", cursor: "pointer", transition: "all 0.2s", position: "relative" }}>
                {tf.label}
                {tfLoading && timeframe.label === tf.label && (
                  <span style={{ position: "absolute", top: -2, right: -2, width: 5, height: 5, borderRadius: "50%", background: C.cyan }} />
                )}
              </button>
            ))}
          </div>

          {/* Active signals inline */}
          {(() => {
            const sigs = (openSignals || []).filter(s => s.instrument === selected);
            if (!sigs.length) return null;
            return (
              <>
                <div style={{ width: 1, height: 16, background: C.border, flexShrink: 0 }} />
                <div style={{ display: "flex", gap: 6, alignItems: "center", overflow: "hidden", flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: C.purple, textTransform: "uppercase", letterSpacing: 0.8, flexShrink: 0 }}>{sigs.length}×</span>
                  {sigs.map(sig => {
                    const isLong = sig.direction === "Long";
                    const dirColor = isLong ? C.green : C.red;
                    return (
                      <div key={sig.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 6, background: C.bg3, border: `1px solid ${C.border}`, flexShrink: 0, fontSize: 10, fontFamily: "monospace" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: dirColor, flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, color: dirColor }}>{isLong ? "▲" : "▼"} {sig.direction.toUpperCase()}</span>
                        <span style={{ color: C.textD }}>E</span><strong style={{ color: C.text }}>{sig.entryPrice}</strong>
                        {sig.targetPrice && <><span style={{ color: C.green }}>TP</span><strong style={{ color: C.green }}>{sig.targetPrice}</strong></>}
                        {sig.stopLoss && <><span style={{ color: C.red }}>SL</span><strong style={{ color: C.red }}>{sig.stopLoss}</strong></>}
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}

          {/* Signal verdict pill */}
          {(() => {
            const sc = scoring;
            const col = sc.direction === "BUY" ? C.green : sc.direction === "SELL" ? C.red : C.amber;
            const bg  = sc.direction === "BUY" ? C.greenBg : sc.direction === "SELL" ? C.redBg : C.amberBg;
            const bd  = sc.direction === "BUY" ? C.greenBd : sc.direction === "SELL" ? C.redBd : C.amberBd;
            return (
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 800, background: bg, color: col, border: `1px solid ${bd}`, letterSpacing: 0.5 }}>
                  {sc.direction}
                </span>
                <span style={{ fontSize: 10, color: C.textD, fontWeight: 600 }}>{sc.score}/100</span>
              </div>
            );
          })()}
        </div>

        {/* Chart + Cards (scrollable below chart) */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
          {error ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: C.red, fontSize: 13 }}>
              <AlertTriangle size={28} />
              <div>{error}</div>
              <button onClick={() => load(timeframe)} style={{ padding: "6px 14px", borderRadius: 6, background: C.bg3, color: C.text, border: `1px solid ${C.border}`, cursor: "pointer", fontSize: 12 }}>
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Chart fills available space */}
              <UnifiedChart
                instrumentKey={selected}
                tfLabel={timeframe.label}
              />

              {/* Cards below chart — scrollable strip */}
              <div style={{ flexShrink: 0, padding: "10px 14px", borderTop: `1px solid ${C.border}`, background: C.bg2, display: "flex", flexDirection: "column", gap: 8 }}>
                <AnalysisCards data={selectedData} instrumentKey={selected} scoring={scoring} />
                <KeyLevels data={{ support: selectedData.support || [], resistance: selectedData.resistance || [] }} instrumentKey={selected} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="ti-right" style={{ width: 290, flexShrink: 0, background: C.bg2, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, padding: "3px 6px 0", flexShrink: 0 }}>
          {[
            { id: "signal",   label: `Signal${(openSignals||[]).filter(s=>s.instrument===selected).length ? ` (${(openSignals||[]).filter(s=>s.instrument===selected).length})` : ""}`, icon: <Zap size={10}/> },
            { id: "analysis", label: "Analysis", icon: <BarChart2 size={10}/> },
            { id: "news",     label: "News",     icon: <Newspaper size={10}/> },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabStyle(t.id)}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{t.icon}{t.label}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: 60 + i * 8, borderRadius: 8, background: C.bg3, marginBottom: 8, opacity: 0.5 }} />
            ))
          ) : activeTab === "signal" ? (
            <>
              <VerdictPanel
                instrumentKey={selected}
                data={selectedData}
                scoring={scoring}
                aiResult={aiResults[selected]}
                aiLoading={aiLoading}
                onAiAnalyze={handleAiAnalyze}
              />
              {(openSignals||[]).filter(s=>s.instrument===selected).length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.textD, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Active Signals</div>
                  <SignalPanel openSignals={openSignals} instrumentKey={selected} liveData={Object.keys(livePrices).length ? livePrices : externalLiveData} />
                </div>
              )}
            </>
          ) : activeTab === "analysis" ? (
            <>
              <BreakdownPanel data={selectedData} instrumentKey={selected} scoring={scoring} />
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.textD, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>SMC Structure</div>
                <SMCPanel data={selectedData} instrumentKey={selected} />
              </div>
            </>
          ) : (
            <NewsPanel news={news} instrumentKey={selected} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  );
}

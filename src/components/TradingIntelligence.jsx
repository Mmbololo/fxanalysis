"use client";
import { useState, useEffect, useCallback } from "react";
import {
  ComposedChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceArea, CartesianGrid
} from "recharts";
import {
  RefreshCw, TrendingUp, TrendingDown, Minus, Zap, AlertTriangle,
  Target, Shield, BarChart2, Newspaper, Star, ChevronRight,
  Activity, Clock, ArrowUpRight, ArrowDownRight
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
};

const INSTRUMENTS = {
  XAUUSD: { label: "XAU/USD", sub: "Gold" },
  GBPUSD: { label: "GBP/USD", sub: "Cable" },
  GBPJPY: { label: "GBP/JPY", sub: "Guppy" },
  BTCUSD: { label: "BTC/USD", sub: "Bitcoin" },
  EURUSD: { label: "EUR/USD", sub: "Fiber" },
};

// ── Formatters ───────────────────────────────────────────────────────
const fmtPrice = (key, v) => {
  if (v == null) return "—";
  if (key === "BTCUSD") return "$" + Math.round(v).toLocaleString();
  if (key === "XAUUSD") return v.toFixed(2);
  return v.toFixed(key?.includes("JPY") ? 3 : 5);
};
const fmtPct = (n) => n == null ? "—" : (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

// ── Scoring engine ───────────────────────────────────────────────────
function scoreInstrument(d) {
  if (!d) return { score: 0, direction: "NEUTRAL", factors: [], cautions: [] };
  const { trend, rsi, macd, sma, structure, bb, current, signal } = d;
  let score = 50;
  const factors = [];
  const cautions = [];

  // Trend
  if (trend === "BULLISH") { score += 12; factors.push({ label: "Trend", text: "Bullish — price above key MAs", delta: +12, color: C.green }); }
  else if (trend === "BEARISH") { score -= 12; factors.push({ label: "Trend", text: "Bearish — price below key MAs", delta: -12, color: C.red }); }
  else { factors.push({ label: "Trend", text: "Ranging — no clear direction", delta: 0, color: C.textM }); }

  // RSI
  if (rsi != null) {
    if (rsi > 70) { score -= 10; factors.push({ label: "RSI", text: `${rsi.toFixed(1)} — Overbought zone`, delta: -10, color: C.red }); cautions.push("RSI overbought — potential pullback"); }
    else if (rsi < 30) { score += 10; factors.push({ label: "RSI", text: `${rsi.toFixed(1)} — Oversold zone`, delta: +10, color: C.green }); cautions.push("RSI oversold — watch for reversal"); }
    else if (rsi > 55) { score += 6; factors.push({ label: "RSI", text: `${rsi.toFixed(1)} — Mild bullish momentum`, delta: +6, color: C.green }); }
    else if (rsi < 45) { score -= 6; factors.push({ label: "RSI", text: `${rsi.toFixed(1)} — Mild bearish pressure`, delta: -6, color: C.red }); }
    else { factors.push({ label: "RSI", text: `${rsi.toFixed(1)} — Neutral zone`, delta: 0, color: C.textM }); }
  }

  // MACD
  if (macd) {
    if (macd.cross === "bullish") { score += 10; factors.push({ label: "MACD", text: "Bullish crossover confirmed", delta: +10, color: C.green }); }
    else if (macd.cross === "bearish") { score -= 10; factors.push({ label: "MACD", text: "Bearish crossover confirmed", delta: -10, color: C.red }); }
    else if (macd.histogram > 0) { score += 5; factors.push({ label: "MACD", text: "Positive histogram — bullish", delta: +5, color: C.green }); }
    else if (macd.histogram < 0) { score -= 5; factors.push({ label: "MACD", text: "Negative histogram — bearish", delta: -5, color: C.red }); }
    else { factors.push({ label: "MACD", text: "Neutral — no clear signal", delta: 0, color: C.textM }); }
  }

  // Structure
  if (structure === "BREAKOUT") { score += 12; factors.push({ label: "Structure", text: "Confirmed breakout above resistance", delta: +12, color: C.green }); }
  else if (structure === "BREAKDOWN") { score -= 12; factors.push({ label: "Structure", text: "Confirmed breakdown below support", delta: -12, color: C.red }); }
  else if (structure === "TRENDING") { score += 6; factors.push({ label: "Structure", text: "Trending — follow the momentum", delta: +6, color: C.green }); }
  else if (structure === "RANGING") { cautions.push("Price ranging — avoid trend entries"); factors.push({ label: "Structure", text: "Consolidation zone — low conviction", delta: 0, color: C.amber }); }
  else { factors.push({ label: "Structure", text: "Consolidating", delta: 0, color: C.textM }); }

  // Bollinger Bands
  if (bb && current) {
    if (current > bb.upper) { score -= 8; cautions.push("Price outside upper Bollinger Band — extended"); factors.push({ label: "BB", text: "Price above upper band — overextended", delta: -8, color: C.red }); }
    else if (current < bb.lower) { score += 8; cautions.push("Price outside lower Bollinger Band — possible bounce"); factors.push({ label: "BB", text: "Price below lower band — possible bounce", delta: +8, color: C.green }); }
    else if (bb.upper && bb.lower && bb.middle && ((bb.upper - bb.lower) / bb.middle) < 0.01) { cautions.push("BB squeeze — breakout imminent, direction unclear"); factors.push({ label: "BB", text: "Bands squeezing — expect volatility", delta: 0, color: C.amber }); }
    else { factors.push({ label: "BB", text: "Price within bands — normal range", delta: 0, color: C.textM }); }
  }

  // MA alignment bonus
  if (sma && current) {
    const above200 = current > sma.sma200;
    const above50 = current > sma.sma50;
    const above20 = current > sma.sma20;
    if (above200 && above50 && above20) { score += 8; factors.push({ label: "MA Stack", text: "Price above SMA20/50/200 — strong bull", delta: +8, color: C.green }); }
    else if (!above200 && !above50 && !above20) { score -= 8; factors.push({ label: "MA Stack", text: "Price below SMA20/50/200 — strong bear", delta: -8, color: C.red }); }
  }

  score = Math.min(100, Math.max(0, Math.round(score)));
  const direction = score >= 60 ? "BUY" : score <= 40 ? "SELL" : "NEUTRAL";
  return { score, direction, factors, cautions };
}

// ── ScoreMeter (SVG ring) ────────────────────────────────────────────
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
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 9, color: C.textD, textTransform: "uppercase", letterSpacing: "0.5px" }}>/ 100</div>
        </div>
      </div>
      <div style={{ padding: "3px 14px", borderRadius: 5, fontSize: 12, fontWeight: 700, background: score >= 65 ? C.greenBg : score >= 45 ? C.amberBg : C.redBg, color, border: `1px solid ${score >= 65 ? C.greenBd : score >= 45 ? C.amberBd : C.redBd}` }}>
        {label}
      </div>
    </div>
  );
}

// ── RsiGauge ─────────────────────────────────────────────────────────
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

// ── Main Chart ────────────────────────────────────────────────────────
function MainChart({ chartData, signal, instrumentKey, sma }) {
  if (!chartData?.length) return (
    <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: C.textD, fontSize: 13 }}>
      No chart data
    </div>
  );

  // API returns chartData with "time" field (YYYY-MM-DD), normalize to "date"
  const last50 = chartData.slice(-50).map(d => ({ ...d, date: d.date || d.time }));
  const prices = last50.map(d => d.close).filter(Boolean);
  if (!prices.length) return null;

  const allLevels = [
    signal?.sl, signal?.entry, signal?.tp1, signal?.tp2, signal?.tp3,
  ].filter(Boolean);
  const minP = Math.min(...prices, ...allLevels) * 0.998;
  const maxP = Math.max(...prices, ...allLevels) * 1.002;
  const isBuy = signal?.direction === "BUY";

  const chartWithSma = last50;

  return (
    <div style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartWithSma} margin={{ top: 8, right: 60, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`cg-${instrumentKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={C.blue} stopOpacity={0.2} />
              <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke={C.border} opacity={0.4} />
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: C.textD }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis domain={[minP, maxP]} tick={{ fontSize: 9, fill: C.textD }} tickLine={false} axisLine={false} width={50}
            tickFormatter={v => fmtPrice(instrumentKey, v)} />
          <Tooltip
            contentStyle={{ background: C.bg2, border: `1px solid ${C.borderL}`, borderRadius: 8, fontSize: 10 }}
            formatter={(v, name) => [fmtPrice(instrumentKey, v), name]}
            labelFormatter={l => l}
          />

          {/* Signal reference areas */}
          {signal && (
            <>
              {isBuy ? (
                <>
                  <ReferenceArea y1={Math.max(minP, signal.sl * 0.999)} y2={signal.entry} fill="rgba(239,68,68,0.08)" />
                  <ReferenceArea y1={signal.entry} y2={signal.tp1} fill="rgba(16,185,129,0.07)" />
                  {signal.tp2 && <ReferenceArea y1={signal.tp1} y2={signal.tp2} fill="rgba(16,185,129,0.11)" />}
                  {signal.tp3 && <ReferenceArea y1={signal.tp2} y2={signal.tp3} fill="rgba(16,185,129,0.15)" />}
                </>
              ) : (
                <>
                  <ReferenceArea y1={signal.entry} y2={Math.min(maxP, signal.sl * 1.001)} fill="rgba(239,68,68,0.08)" />
                  <ReferenceArea y1={signal.tp1} y2={signal.entry} fill="rgba(16,185,129,0.07)" />
                  {signal.tp2 && <ReferenceArea y1={signal.tp2} y2={signal.tp1} fill="rgba(16,185,129,0.11)" />}
                  {signal.tp3 && <ReferenceArea y1={signal.tp3} y2={signal.tp2} fill="rgba(16,185,129,0.15)" />}
                </>
              )}
              <ReferenceLine y={signal.entry} stroke={C.blue} strokeWidth={1.5} strokeDasharray="5 3"
                label={{ value: `Entry ${fmtPrice(instrumentKey, signal.entry)}`, position: "right", fontSize: 9, fill: C.blue }} />
              <ReferenceLine y={signal.sl} stroke={C.red} strokeWidth={1.5}
                label={{ value: `SL ${fmtPrice(instrumentKey, signal.sl)}`, position: "right", fontSize: 9, fill: C.red }} />
              <ReferenceLine y={signal.tp1} stroke={C.green} strokeWidth={1} strokeDasharray="3 3"
                label={{ value: `TP1 ${fmtPrice(instrumentKey, signal.tp1)}`, position: "right", fontSize: 9, fill: C.green }} />
              {signal.tp2 && <ReferenceLine y={signal.tp2} stroke={C.green} strokeWidth={1} strokeDasharray="3 3"
                label={{ value: `TP2 ${fmtPrice(instrumentKey, signal.tp2)}`, position: "right", fontSize: 9, fill: C.green }} />}
              {signal.tp3 && <ReferenceLine y={signal.tp3} stroke={C.green} strokeWidth={1} strokeDasharray="3 3"
                label={{ value: `TP3 ${fmtPrice(instrumentKey, signal.tp3)}`, position: "right", fontSize: 9, fill: C.green }} />}
            </>
          )}

          {/* SMA reference lines */}
          {sma?.sma20 && <ReferenceLine y={sma.sma20} stroke={C.amber} strokeWidth={1} strokeDasharray="6 3"
            label={{ value: `SMA20`, position: "insideTopLeft", fontSize: 8, fill: C.amber }} />}
          {sma?.sma50 && <ReferenceLine y={sma.sma50} stroke={C.purple} strokeWidth={1} strokeDasharray="6 3"
            label={{ value: `SMA50`, position: "insideTopLeft", fontSize: 8, fill: C.purple }} />}

          {/* Price area */}
          <Area type="monotone" dataKey="close" stroke={C.blue} strokeWidth={2} fill={`url(#cg-${instrumentKey})`} dot={false} name="Price" />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Chart legend */}
      <div style={{ display: "flex", gap: 12, padding: "4px 8px", fontSize: 10, color: C.textD }}>
        <span style={{ color: C.blue }}>— Price</span>
        <span style={{ color: C.amber }}>— SMA20</span>
        <span style={{ color: C.purple }}>— SMA50</span>
        {signal && <>
          <span style={{ color: C.blue }}>╌ Entry</span>
          <span style={{ color: C.red }}>— SL</span>
          <span style={{ color: C.green }}>╌ TP</span>
        </>}
      </div>
    </div>
  );
}

// ── Analysis Cards row ────────────────────────────────────────────────
function AnalysisCards({ data, instrumentKey }) {
  const { trend, structure, rsi, macd, bb, current, change, sma } = data;
  const cards = [
    {
      label: "Trend",
      icon: trend === "BULLISH" ? <TrendingUp size={14} /> : trend === "BEARISH" ? <TrendingDown size={14} /> : <Minus size={14} />,
      value: trend || "—",
      sub: sma ? `SMA20: ${fmtPrice(instrumentKey, sma.sma20)}` : null,
      color: trend === "BULLISH" ? C.green : trend === "BEARISH" ? C.red : C.textM,
    },
    {
      label: "RSI (14)",
      icon: <Activity size={14} />,
      value: rsi ? rsi.toFixed(1) : "—",
      sub: rsi > 70 ? "Overbought" : rsi < 30 ? "Oversold" : rsi > 55 ? "Bullish" : rsi < 45 ? "Bearish" : "Neutral",
      color: rsi > 70 ? C.red : rsi < 30 ? C.green : C.amber,
    },
    {
      label: "MACD",
      icon: <BarChart2 size={14} />,
      value: macd?.cross === "bullish" ? "Bull Cross" : macd?.cross === "bearish" ? "Bear Cross" : macd?.histogram > 0 ? "Positive" : "Negative",
      sub: macd ? `Hist: ${macd.histogram?.toFixed(4)}` : null,
      color: macd?.cross === "bullish" || macd?.histogram > 0 ? C.green : C.red,
    },
    {
      label: "Structure",
      icon: <Target size={14} />,
      value: structure || "—",
      sub: null,
      color: structure === "BREAKOUT" ? C.green : structure === "BREAKDOWN" ? C.red : structure === "RANGING" ? C.amber : C.textM,
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, alignItems: "stretch" }}>
      {cards.map(c => (
        <div key={c.label} style={{ background: C.bg3, borderRadius: 8, padding: "10px 12px", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: C.textD, fontSize: 10, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" }}>
            <span style={{ color: c.color }}>{c.icon}</span>
            {c.label}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: c.color, lineHeight: 1.2 }}>{c.value}</div>
          <div style={{ fontSize: 10, color: C.textD, marginTop: 4, minHeight: 14 }}>{c.sub || ""}</div>
        </div>
      ))}
    </div>
  );
}

// ── Key Levels ────────────────────────────────────────────────────────
function KeyLevels({ data, instrumentKey }) {
  const { support = [], resistance = [] } = data;
  if (!support.length && !resistance.length) return null;
  const MAX = 3;
  const rows = Array.from({ length: MAX }, (_, i) => i);
  const cellStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", height: 26, borderBottom: `1px solid ${C.border}` };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      <div style={{ background: C.bg3, borderRadius: 8, padding: "10px 12px", border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 10, color: C.textD, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Support Levels</div>
        {rows.map(i => (
          <div key={i} style={{ ...cellStyle, borderBottom: i < MAX - 1 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ fontSize: 10, color: C.textD }}>{support[i] != null ? `S${i + 1}` : ""}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.green }}>{support[i] != null ? fmtPrice(instrumentKey, support[i]) : "—"}</span>
          </div>
        ))}
      </div>
      <div style={{ background: C.bg3, borderRadius: 8, padding: "10px 12px", border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 10, color: C.textD, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Resistance Levels</div>
        {rows.map(i => (
          <div key={i} style={{ ...cellStyle, borderBottom: i < MAX - 1 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ fontSize: 10, color: C.textD }}>{resistance[i] != null ? `R${i + 1}` : ""}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.red }}>{resistance[i] != null ? fmtPrice(instrumentKey, resistance[i]) : "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Verdict Panel ─────────────────────────────────────────────────────
function VerdictPanel({ instrumentKey, data, scoring, aiResult, aiLoading, onAiAnalyze }) {
  const { signal } = data;
  const { score, direction, factors, cautions } = scoring;
  const isBuy = direction === "BUY";
  const isSell = direction === "SELL";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Score meter */}
      <div style={{ background: C.bg3, borderRadius: 10, padding: 16, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 16 }}>
        <ScoreMeter score={score} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
            {isBuy ? "Bullish Setup" : isSell ? "Bearish Setup" : "No Clear Signal"}
          </div>
          <div style={{ fontSize: 11, color: C.textM, lineHeight: 1.5 }}>
            {isBuy ? "Majority of indicators align bullish. Consider long positions at key levels."
              : isSell ? "Majority of indicators align bearish. Consider short positions at key levels."
              : "Mixed signals. Wait for clearer confirmation before entering a trade."}
          </div>
          {signal && (
            <div style={{ marginTop: 8, fontSize: 10, color: C.textD }}>
              Confidence: <span style={{ color: signal.confidence >= 70 ? C.green : signal.confidence >= 50 ? C.amber : C.red, fontWeight: 700 }}>{signal.confidence}%</span>
              {" · "}R:R <span style={{ color: C.amber, fontWeight: 700 }}>{signal.rr}</span>
            </div>
          )}
        </div>
      </div>

      {/* Trade setup */}
      {signal && (
        <div style={{ background: C.bg3, borderRadius: 10, padding: 14, border: `1px solid ${isBuy ? C.greenBd : C.redBd}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.textM, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <Target size={12} color={isBuy ? C.green : C.red} />
            Trade Setup · <span style={{ color: isBuy ? C.green : C.red }}>{signal.direction}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              { label: "Entry", value: fmtPrice(instrumentKey, signal.entry), color: C.blue },
              { label: "Stop Loss", value: fmtPrice(instrumentKey, signal.sl), color: C.red },
              { label: "TP 1", value: fmtPrice(instrumentKey, signal.tp1), color: C.green },
              { label: "TP 2", value: fmtPrice(instrumentKey, signal.tp2), color: C.green },
              { label: "TP 3", value: signal.tp3 ? fmtPrice(instrumentKey, signal.tp3) : "—", color: C.green },
              { label: "R:R Ratio", value: signal.rr, color: C.amber },
            ].map(row => (
              <div key={row.label} style={{ background: C.bg2, borderRadius: 6, padding: "7px 10px", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 9, color: C.textD, textTransform: "uppercase", letterSpacing: "0.4px" }}>{row.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: row.color, marginTop: 1 }}>{row.value}</div>
              </div>
            ))}
          </div>
          {signal.reason && (
            <div style={{ marginTop: 10, fontSize: 11, color: C.textM, padding: "8px 10px", background: C.bg2, borderRadius: 6, border: `1px solid ${C.border}`, lineHeight: 1.5 }}>
              {signal.reason}
            </div>
          )}
        </div>
      )}

      {/* Cautions */}
      {cautions.length > 0 && (
        <div style={{ background: C.amberBg, borderRadius: 10, padding: 12, border: `1px solid ${C.amberBd}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.amber, display: "flex", alignItems: "center", gap: 6, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.6px" }}>
            <AlertTriangle size={12} /> Cautions
          </div>
          {cautions.map((c, i) => (
            <div key={i} style={{ fontSize: 11, color: C.textM, padding: "4px 0", borderBottom: i < cautions.length - 1 ? `1px solid ${C.amberBd}` : "none", display: "flex", gap: 6 }}>
              <span style={{ color: C.amber, marginTop: 1 }}>·</span> {c}
            </div>
          ))}
        </div>
      )}

      {/* AI Analysis */}
      <div style={{ background: C.purpleBg, borderRadius: 10, border: `1px solid rgba(139,92,246,0.25)`, overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid rgba(139,92,246,0.15)` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.purple, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: "0.6px" }}>
            <Zap size={12} /> Gemini AI Analysis
          </div>
          <button onClick={onAiAnalyze} disabled={aiLoading}
            style={{ padding: "4px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, background: aiLoading ? C.bg3 : C.purple, color: aiLoading ? C.textD : "#fff", border: "none", cursor: aiLoading ? "default" : "pointer" }}>
            {aiLoading ? "Analyzing…" : aiResult ? "Refresh" : "Analyze"}
          </button>
        </div>
        <div style={{ padding: "12px 14px", minHeight: 60 }}>
          {aiResult ? (
            <div style={{ fontSize: 11, color: C.textM, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{aiResult}</div>
          ) : (
            <div style={{ fontSize: 11, color: C.textD, textAlign: "center", padding: "12px 0" }}>
              Click Analyze for AI-powered market insights
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Breakdown Panel ───────────────────────────────────────────────────
function BreakdownPanel({ data, instrumentKey, scoring }) {
  const { bb, rsi, sma, current } = data;
  const { score, factors } = scoring;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Score factors */}
      <div style={{ background: C.bg3, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.textM, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>Score Breakdown</div>
        {factors.map((f, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "7px 0", borderBottom: i < factors.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: f.color }}>{f.label}</div>
              <div style={{ fontSize: 10, color: C.textD, marginTop: 1 }}>{f.text}</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: f.delta > 0 ? C.green : f.delta < 0 ? C.red : C.textD, minWidth: 32, textAlign: "right" }}>
              {f.delta > 0 ? "+" : ""}{f.delta}
            </div>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.borderL}` }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.textM }}>Base Score</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.textM }}>50</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Final Score</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: score >= 65 ? C.green : score >= 45 ? C.amber : C.red }}>{score} / 100</span>
        </div>
      </div>

      {/* RSI Gauge */}
      <RsiGauge value={data.rsi} />

      {/* Bollinger Bands */}
      {bb && (
        <div style={{ background: C.bg3, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.textM, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>Bollinger Bands (20,2)</div>
          {[
            { label: "Upper Band", value: bb.upper, color: C.red },
            { label: "Middle (SMA20)", value: bb.middle, color: C.amber },
            { label: "Lower Band", value: bb.lower, color: C.green },
            { label: "Band Width", value: (bb.upper && bb.lower && bb.middle) ? (((bb.upper - bb.lower) / bb.middle) * 100).toFixed(3) + "%" : "—", color: C.textM },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 11, color: C.textD }}>{r.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: r.color }}>{typeof r.value === "number" ? fmtPrice(instrumentKey, r.value) : r.value}</span>
            </div>
          ))}
          {current && (
            <div style={{ marginTop: 8, fontSize: 10, color: C.textD }}>
              Current price {current > bb.upper ? <span style={{ color: C.red }}>above upper band ⚠</span> : current < bb.lower ? <span style={{ color: C.green }}>below lower band ↑</span> : <span style={{ color: C.green }}>within bands ✓</span>}
            </div>
          )}
        </div>
      )}

      {/* MA Table */}
      {sma && (
        <div style={{ background: C.bg3, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.textM, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>Moving Averages</div>
          {[
            { label: "SMA 20", value: sma.sma20, color: C.amber },
            { label: "SMA 50", value: sma.sma50, color: C.purple },
            { label: "SMA 200", value: sma.sma200, color: C.blue },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 11, color: C.textD }}>{r.label}</span>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: r.color }}>{fmtPrice(instrumentKey, r.value)}</span>
                {current && <span style={{ fontSize: 9, color: current > r.value ? C.green : C.red, marginLeft: 6 }}>{current > r.value ? "↑ Above" : "↓ Below"}</span>}
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
    const affectedList = n.instruments || n.affected || [];
    return affectedList.length === 0 || affectedList.includes(instrumentKey);
  }).slice(0, 15);

  const impactColor = { HIGH: C.red, MEDIUM: C.amber, LOW: C.green };
  const impactBg = { HIGH: C.redBg, MEDIUM: C.amberBg, LOW: C.greenBg };
  const sentColor = { BULLISH: C.green, BEARISH: C.red, NEUTRAL: C.textM };

  if (!relevant.length) return (
    <div style={{ padding: 24, textAlign: "center", color: C.textD, fontSize: 12 }}>
      No news available for {INSTRUMENTS[instrumentKey]?.label}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {relevant.map((n, i) => (
        <a key={i} href={n.link} target="_blank" rel="noopener noreferrer"
          style={{ background: C.bg3, borderRadius: 8, padding: "10px 12px", border: `1px solid ${C.border}`, textDecoration: "none", display: "block", transition: "border-color 0.2s" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: impactBg[n.impact], color: impactColor[n.impact] }}>{n.impact}</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: sentColor[n.sentiment] }}>{n.sentiment}</span>
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

// ── Instrument Sidebar Item ───────────────────────────────────────────
function InstrumentItem({ ikey, data, scoring, selected, onClick }) {
  const inst = INSTRUMENTS[ikey];
  const { score, direction } = scoring;
  const isUp = data.change >= 0;

  return (
    <button onClick={() => onClick(ikey)}
      style={{ width: "100%", textAlign: "left", background: selected ? C.bg3 : "transparent", border: `1px solid ${selected ? C.borderL : "transparent"}`, borderRadius: 8, padding: "10px 12px", cursor: "pointer", transition: "all 0.15s", marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: selected ? C.text : C.textM }}>{inst.label}</div>
          <div style={{ fontSize: 10, color: C.textD }}>{inst.sub}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: isUp ? C.green : C.red, display: "flex", alignItems: "center", gap: 2 }}>
            {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {fmtPct(data.change)}
          </div>
          <div style={{ fontSize: 9, color: C.textD }}>{fmtPrice(ikey, data.current)}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 3,
          background: data.trend === "BULLISH" ? C.greenBg : data.trend === "BEARISH" ? C.redBg : C.bg4,
          color: data.trend === "BULLISH" ? C.green : data.trend === "BEARISH" ? C.red : C.textD }}>
          {data.trend?.slice(0, 4) || "—"}
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 3,
          background: direction === "BUY" ? C.greenBg : direction === "SELL" ? C.redBg : C.bg4,
          color: direction === "BUY" ? C.green : direction === "SELL" ? C.red : C.textD }}>
          {direction}
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 3,
          background: score >= 65 ? C.greenBg : score >= 45 ? C.amberBg : C.redBg,
          color: score >= 65 ? C.green : score >= 45 ? C.amber : C.red, marginLeft: "auto" }}>
          {score}
        </span>
      </div>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function TradingIntelligence() {
  const [instruments, setInstruments] = useState({});
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState("XAUUSD");
  const [activeTab, setActiveTab] = useState("verdict");
  const [aiResults, setAiResults] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/intelligence");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setInstruments(data.instruments || {});
      setNews(data.news || []);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
      setAiResults(prev => ({ ...prev, [selected]: "Failed to get AI analysis. Check your API key." }));
    } finally {
      setAiLoading(false);
    }
  };

  const selectedData = instruments[selected] || {};
  const scoring = scoreInstrument(selectedData);
  const keys = Object.keys(INSTRUMENTS);

  const tabStyle = (t) => ({
    padding: "7px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
    border: "none", transition: "all 0.15s",
    background: activeTab === t ? C.bg3 : "transparent",
    color: activeTab === t ? C.text : C.textD,
    borderBottom: activeTab === t ? `2px solid ${C.purple}` : "2px solid transparent",
  });

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, background: C.bg, color: C.text, fontFamily: "var(--font-maven-pro), sans-serif", overflow: "hidden" }}>

      {/* ── Left Sidebar ── */}
      <div style={{ width: 200, flexShrink: 0, background: C.bg2, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "12px 12px 8px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.textD, textTransform: "uppercase", letterSpacing: "0.6px" }}>Instruments</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ height: 64, borderRadius: 8, background: C.bg3, marginBottom: 4, animation: "pulse 1.5s infinite" }} />
            ))
          ) : (
            keys.map(k => (
              <InstrumentItem
                key={k}
                ikey={k}
                data={instruments[k] || { current: null, change: null, trend: "—" }}
                scoring={instruments[k] ? scoreInstrument(instruments[k]) : { score: 0, direction: "—" }}
                selected={selected === k}
                onClick={setSelected}
              />
            ))
          )}
        </div>
        <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.border}` }}>
          <button onClick={load} disabled={loading}
            style={{ width: "100%", padding: "7px 0", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "transparent", color: loading ? C.textD : C.accent, border: `1px solid ${C.border}`, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <RefreshCw size={11} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            {loading ? "Loading…" : "Refresh"}
          </button>
          {lastUpdated && <div style={{ fontSize: 9, color: C.textD, textAlign: "center", marginTop: 5 }}>
            {lastUpdated.toLocaleTimeString()}
          </div>}
        </div>
      </div>

      {/* ── Center Panel ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {/* Center header */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, background: C.bg2, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>{INSTRUMENTS[selected]?.label}</div>
            <div style={{ fontSize: 10, color: C.textD }}>{INSTRUMENTS[selected]?.sub}</div>
          </div>
          {selectedData.current && (
            <div style={{ marginLeft: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{fmtPrice(selected, selectedData.current)}</div>
              <div style={{ fontSize: 11, color: selectedData.change >= 0 ? C.green : C.red, display: "flex", alignItems: "center", gap: 3 }}>
                {selectedData.change >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                {fmtPct(selectedData.change)}
              </div>
            </div>
          )}
          {selectedData.signal && (
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <span style={{ padding: "4px 10px", borderRadius: 5, fontSize: 11, fontWeight: 700,
                background: selectedData.signal.direction === "BUY" ? C.greenBg : C.redBg,
                color: selectedData.signal.direction === "BUY" ? C.green : C.red,
                border: `1px solid ${selectedData.signal.direction === "BUY" ? C.greenBd : C.redBd}` }}>
                {selectedData.signal.direction}
              </span>
              <span style={{ padding: "4px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600, background: C.bg3, color: C.amber, border: `1px solid ${C.border}` }}>
                {selectedData.signal.confidence}% conf
              </span>
            </div>
          )}
        </div>

        {/* Chart area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
          {error ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 40, color: C.red, fontSize: 13 }}>
              <AlertTriangle size={28} />
              <div>{error}</div>
              <button onClick={load} style={{ padding: "7px 16px", borderRadius: 7, background: C.bg3, color: C.text, border: `1px solid ${C.border}`, cursor: "pointer", fontSize: 12 }}>
                Retry
              </button>
            </div>
          ) : (
            <>
              <div style={{ flexShrink: 0 }}>
                <MainChart
                  chartData={selectedData.chartData || []}
                  signal={selectedData.signal}
                  instrumentKey={selected}
                  sma={selectedData.sma}
                />
              </div>
              <div style={{ flexShrink: 0 }}>
                <AnalysisCards data={selectedData} instrumentKey={selected} />
              </div>
              <div style={{ flexShrink: 0 }}>
                <KeyLevels data={{ support: selectedData.support || [], resistance: selectedData.resistance || [] }} instrumentKey={selected} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div style={{ width: 300, flexShrink: 0, background: C.bg2, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, padding: "4px 8px 0", flexShrink: 0 }}>
          {[
            { id: "verdict", label: "Verdict", icon: <Zap size={11} /> },
            { id: "breakdown", label: "Analysis", icon: <BarChart2 size={11} /> },
            { id: "news", label: "News", icon: <Newspaper size={11} /> },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabStyle(t.id)}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{t.icon}{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ height: 60 + i * 10, borderRadius: 8, background: C.bg3 }} />
              ))}
            </div>
          ) : activeTab === "verdict" ? (
            <VerdictPanel
              instrumentKey={selected}
              data={selectedData}
              scoring={scoring}
              aiResult={aiResults[selected]}
              aiLoading={aiLoading}
              onAiAnalyze={handleAiAnalyze}
            />
          ) : activeTab === "breakdown" ? (
            <BreakdownPanel
              data={selectedData}
              instrumentKey={selected}
              scoring={scoring}
            />
          ) : (
            <NewsPanel news={news} instrumentKey={selected} />
          )}
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";
import { RefreshCw, TrendingUp, TrendingDown, Minus, Zap, AlertTriangle, Target, Shield, BarChart2, Filter, Newspaper, Star } from "lucide-react";

// ── Palette ─────────────────────────────────────────────────────────
const C = {
  green: "#10b981", red: "#ef4444", amber: "#f59e0b", blue: "#3b82f6",
  purple: "#8b5cf6", cyan: "#06b6d4", text: "#e2e8f0", textM: "#94a3b8",
  textD: "#64748b", bg: "#0a0e17", bg2: "#111827", bg3: "#1a2235",
  border: "#1e2d45",
};

const impactColor = { HIGH: C.red, MEDIUM: C.amber, LOW: C.green };
const impactBg = { HIGH: "rgba(239,68,68,0.1)", MEDIUM: "rgba(245,158,11,0.1)", LOW: "rgba(16,185,129,0.1)" };
const sentimentColor = { BULLISH: C.green, BEARISH: C.red, NEUTRAL: C.textM };

const trendIcon = (t) => t === "BULLISH" ? <TrendingUp size={12} /> : t === "BEARISH" ? <TrendingDown size={12} /> : <Minus size={12} />;
const trendColor = (t) => t === "BULLISH" ? C.green : t === "BEARISH" ? C.red : C.textM;

const fmt = (n, dp = 4) => n == null ? "—" : parseFloat(n).toFixed(dp);
const fmtPct = (n) => n == null ? "—" : (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
const fmtPrice = (key, v) => {
  if (v == null) return "—";
  if (key === "BTCUSD") return "$" + Math.round(v).toLocaleString();
  if (key === "XAUUSD") return "$" + v.toFixed(2);
  return v.toFixed(key?.includes("JPY") ? 3 : 5);
};

// ── Mini Signal Chart ─────────────────────────────────────────────
function SignalChart({ chartData, signal, instrumentKey }) {
  if (!chartData?.length || !signal) return null;
  const prices = chartData.map(d => d.close);
  const minP = Math.min(...prices, signal.sl) * 0.999;
  const maxP = Math.max(...prices, signal.tp3 || signal.tp2) * 1.001;

  return (
    <div style={{ height: 120, marginTop: 8 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${instrumentKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={C.blue} stopOpacity={0.3} />
              <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis domain={[minP, maxP]} hide />
          <Tooltip
            contentStyle={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 10 }}
            formatter={(v) => [fmtPrice(instrumentKey, v), "Price"]}
            labelFormatter={l => l}
          />
          {/* SL zone */}
          <ReferenceArea y1={minP} y2={signal.sl} fill="rgba(239,68,68,0.12)" />
          {/* TP zones */}
          <ReferenceArea y1={signal.entry} y2={signal.tp1} fill="rgba(16,185,129,0.08)" />
          <ReferenceArea y1={signal.tp1} y2={signal.tp2} fill="rgba(16,185,129,0.13)" />
          {signal.tp3 && <ReferenceArea y1={signal.tp2} y2={signal.tp3} fill="rgba(16,185,129,0.18)" />}
          {/* Key lines */}
          <ReferenceLine y={signal.entry} stroke={C.blue} strokeWidth={1.5} strokeDasharray="4 2" label={{ value: "Entry", position: "right", fontSize: 9, fill: C.blue }} />
          <ReferenceLine y={signal.sl} stroke={C.red} strokeWidth={1.5} label={{ value: "SL", position: "right", fontSize: 9, fill: C.red }} />
          <ReferenceLine y={signal.tp1} stroke={C.green} strokeWidth={1} strokeDasharray="3 2" label={{ value: "TP1", position: "right", fontSize: 9, fill: C.green }} />
          <ReferenceLine y={signal.tp2} stroke={C.green} strokeWidth={1} strokeDasharray="3 2" label={{ value: "TP2", position: "right", fontSize: 9, fill: C.green }} />
          {signal.tp3 && <ReferenceLine y={signal.tp3} stroke={C.green} strokeWidth={1} strokeDasharray="3 2" label={{ value: "TP3", position: "right", fontSize: 9, fill: C.green }} />}
          <Area type="monotone" dataKey="close" stroke={C.blue} strokeWidth={1.5} fill={`url(#grad-${instrumentKey})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── RSI Bar ───────────────────────────────────────────────────────
function RsiBar({ value }) {
  if (!value) return null;
  const color = value > 70 ? C.red : value < 30 ? C.green : C.amber;
  const label = value > 70 ? "OB" : value < 30 ? "OS" : value > 55 ? "Mild Bull" : value < 45 ? "Mild Bear" : "Neutral";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textD, marginBottom: 3 }}>
        <span>RSI(14)</span>
        <span style={{ color, fontWeight: 700 }}>{value.toFixed(1)} · {label}</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: C.bg3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 2, transition: "width 0.5s" }} />
      </div>
    </div>
  );
}

// ── Confidence Ring ───────────────────────────────────────────────
function ConfidenceRing({ value }) {
  const color = value >= 75 ? C.green : value >= 55 ? C.amber : C.red;
  const r = 22, circ = 2 * Math.PI * r;
  const stroke = circ * (1 - value / 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <svg width={54} height={54} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={27} cy={27} r={r} fill="none" stroke={C.bg3} strokeWidth={4} />
        <circle cx={27} cy={27} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circ} strokeDashoffset={stroke} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s" }}
        />
      </svg>
      <div style={{ marginTop: -42, fontSize: 13, fontWeight: 700, color, zIndex: 1 }}>{value}%</div>
      <div style={{ marginTop: 22, fontSize: 9, color: C.textD, textTransform: "uppercase" }}>Confidence</div>
    </div>
  );
}

// ── Signal Card ───────────────────────────────────────────────────
function SignalCard({ instrumentKey, data, onAiAnalyze, aiResult, aiLoading }) {
  const { signal, label, trend, structure, rsi: rsiVal, macd, sma, current, change, support, resistance, chartData } = data;
  const [saved, setSaved] = useState(false);

  if (!signal) return null;

  const isBuy = signal.direction === "BUY";
  const dirColor = isBuy ? C.green : C.red;

  return (
    <div style={{ background: "rgba(17,24,39,0.85)", backdropFilter: "blur(12px)", borderRadius: 14, border: `1px solid ${isBuy ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, padding: 16, boxShadow: `0 4px 24px ${isBuy ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)"}` }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.3 }}>{label}</span>
            <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: isBuy ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: dirColor, border: `1px solid ${dirColor}40` }}>
              {signal.direction}
            </span>
          </div>
          <div style={{ fontSize: 11, color: C.textD, marginTop: 3 }}>
            {fmtPrice(instrumentKey, current)} · <span style={{ color: change >= 0 ? C.green : C.red }}>{fmtPct(change)}</span>
          </div>
        </div>
        <ConfidenceRing value={signal.confidence} />
      </div>

      {/* Mini chart */}
      <SignalChart chartData={chartData} signal={signal} instrumentKey={instrumentKey} />

      {/* Price levels */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, margin: "12px 0 8px" }}>
        {[
          { label: "Entry", value: fmtPrice(instrumentKey, signal.entry), color: C.blue },
          { label: "Stop Loss", value: fmtPrice(instrumentKey, signal.sl), color: C.red },
          { label: "R:R", value: signal.rr, color: C.amber },
          { label: "TP 1", value: fmtPrice(instrumentKey, signal.tp1), color: C.green },
          { label: "TP 2", value: fmtPrice(instrumentKey, signal.tp2), color: C.green },
          { label: "TP 3", value: fmtPrice(instrumentKey, signal.tp3), color: C.green },
        ].map(item => (
          <div key={item.label} style={{ background: C.bg3, borderRadius: 7, padding: "6px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: C.textD, textTransform: "uppercase", marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Indicators row */}
      <div style={{ marginBottom: 10 }}>
        <RsiBar value={rsiVal} />
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {[
            { label: "Trend", value: trend, color: trendColor(trend) },
            { label: "Structure", value: structure, color: structure === "BREAKOUT" ? C.amber : structure === "TRENDING" ? C.green : C.textM },
            { label: "MACD", value: macd ? (macd.cross !== "none" ? `${macd.cross} ✕` : macd.bullish ? "Bull" : "Bear") : "—", color: macd?.bullish ? C.green : C.red },
          ].map(b => (
            <span key={b.label} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: C.bg3, color: b.color, fontWeight: 600 }}>
              {b.label}: {b.value}
            </span>
          ))}
        </div>
      </div>

      {/* Key levels */}
      <div style={{ display: "flex", gap: 10, fontSize: 10, color: C.textD, marginBottom: 10 }}>
        <span>S: <b style={{ color: C.green }}>{fmtPrice(instrumentKey, support?.[0])}</b></span>
        <span>R: <b style={{ color: C.red }}>{fmtPrice(instrumentKey, resistance?.[0])}</b></span>
        {sma?.sma20 && <span>MA20: <b style={{ color: C.textM }}>{fmtPrice(instrumentKey, sma.sma20)}</b></span>}
      </div>

      {/* AI analysis result */}
      {aiResult && (
        <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8, padding: "8px 10px", marginBottom: 10, fontSize: 11, color: C.textM, lineHeight: 1.5 }}>
          <div style={{ fontSize: 10, color: C.purple, fontWeight: 700, marginBottom: 4 }}>⚡ AI ANALYSIS</div>
          {aiResult.summary || aiResult}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => onAiAnalyze(instrumentKey, data)} disabled={aiLoading === instrumentKey} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 0", borderRadius: 7, border: "none", background: aiLoading === instrumentKey ? C.bg3 : "rgba(139,92,246,0.2)", color: C.purple, fontSize: 11, fontWeight: 600, cursor: aiLoading === instrumentKey ? "not-allowed" : "pointer" }}>
          <Zap size={11} /> {aiLoading === instrumentKey ? "Analyzing…" : "AI Enhance"}
        </button>
        <button onClick={() => setSaved(s => !s)} style={{ padding: "7px 12px", borderRadius: 7, border: "none", background: saved ? "rgba(245,158,11,0.2)" : C.bg3, color: saved ? C.amber : C.textD, cursor: "pointer" }}>
          <Star size={13} fill={saved ? C.amber : "none"} />
        </button>
      </div>
    </div>
  );
}

// ── Instrument Analysis Card ──────────────────────────────────────
function AnalysisCard({ instrumentKey, data }) {
  if (!data || data.error) return null;
  const { label, category, current, change, trend, structure, rsi: rsiVal, macd, sma, bb, atr, support, resistance, chartData } = data;
  const prices = chartData?.map(d => d.close) || [];

  return (
    <div style={{ background: C.bg2, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
            <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: C.bg3, color: C.textD }}>{category}</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{fmtPrice(instrumentKey, current)}</div>
          <div style={{ fontSize: 11, color: change >= 0 ? C.green : C.red }}>{fmtPct(change)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: trendColor(trend), fontWeight: 700, fontSize: 12, justifyContent: "flex-end" }}>
            {trendIcon(trend)} {trend}
          </div>
          <div style={{ fontSize: 10, color: structure === "BREAKOUT" ? C.amber : structure === "TRENDING" ? C.green : C.textD, marginTop: 4 }}>{structure}</div>
        </div>
      </div>

      {/* Mini sparkline */}
      {chartData?.length > 0 && (
        <div style={{ height: 60, marginBottom: 10 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData.slice(-14)} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`sp-${instrumentKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={trendColor(trend)} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={trendColor(trend)} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="close" stroke={trendColor(trend)} strokeWidth={1.5} fill={`url(#sp-${instrumentKey})`} dot={false} />
              <YAxis domain={["auto", "auto"]} hide />
              <XAxis hide />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* RSI */}
      {rsiVal && <div style={{ marginBottom: 8 }}><RsiBar value={rsiVal} /></div>}

      {/* MAs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 8 }}>
        {[
          { label: "SMA 20", value: sma?.sma20, ref: current },
          { label: "SMA 50", value: sma?.sma50, ref: current },
          { label: "BB Upper", value: bb?.upper, ref: current },
          { label: "BB Lower", value: bb?.lower, ref: current },
        ].map(item => item.value && (
          <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textD, padding: "3px 0" }}>
            <span>{item.label}</span>
            <span style={{ color: item.ref > item.value ? C.green : C.red, fontWeight: 600 }}>{fmtPrice(instrumentKey, item.value)}</span>
          </div>
        ))}
      </div>

      {/* S/R */}
      <div style={{ display: "flex", gap: 8, fontSize: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.textD, marginBottom: 2 }}>Support</div>
          {support?.slice(0, 2).map((s, i) => <div key={i} style={{ color: C.green, fontWeight: 600 }}>{fmtPrice(instrumentKey, s)}</div>)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.textD, marginBottom: 2 }}>Resistance</div>
          {resistance?.slice(0, 2).map((r, i) => <div key={i} style={{ color: C.red, fontWeight: 600 }}>{fmtPrice(instrumentKey, r)}</div>)}
        </div>
        {atr && (
          <div style={{ flex: 1 }}>
            <div style={{ color: C.textD, marginBottom: 2 }}>ATR(14)</div>
            <div style={{ color: C.textM, fontWeight: 600 }}>{instrumentKey === "BTCUSD" ? Math.round(atr) : atr.toFixed(4)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── News Card ─────────────────────────────────────────────────────
function NewsCard({ item }) {
  const ic = impactColor[item.impact];
  const ib = impactBg[item.impact];
  const sc = sentimentColor[item.sentiment];
  const elapsed = item.pubDate ? Math.round((Date.now() - new Date(item.pubDate)) / 60000) : null;

  return (
    <div style={{ background: C.bg2, borderRadius: 10, border: `1px solid ${C.border}`, padding: "10px 12px", borderLeft: `3px solid ${ic}` }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "flex-start" }}>
        <span style={{ padding: "2px 7px", borderRadius: 3, fontSize: 9, fontWeight: 700, color: ic, background: ib, whiteSpace: "nowrap", flexShrink: 0 }}>
          {item.impact}
        </span>
        <span style={{ fontSize: 12, color: C.text, lineHeight: 1.4 }}>{item.title}</span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, color: sc, fontWeight: 600 }}>{item.sentiment}</span>
        {elapsed != null && <span style={{ fontSize: 10, color: C.textD }}>{elapsed < 60 ? `${elapsed}m ago` : `${Math.round(elapsed / 60)}h ago`}</span>}
        {item.affected?.map(sym => (
          <span key={sym} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: C.bg3, color: C.textD }}>{sym}</span>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function TradingIntelligence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(null);
  const [aiResults, setAiResults] = useState({});
  const [activeTab, setActiveTab] = useState("signals"); // signals | analysis | news
  const [filters, setFilters] = useState({ category: "all", impact: "all", minConf: 0 });
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/intelligence");
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date());
    } catch (e) {
      console.error("Intelligence fetch error:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAiAnalyze = async (key, instrData) => {
    setAiLoading(key);
    try {
      const { label, current, trend, structure, rsi: rsiVal, macd, sma, support, resistance, signal } = instrData;
      const prompt = `You are a senior institutional trading analyst. Analyze ${label} and provide a concise, actionable trade briefing.

TECHNICAL DATA:
- Current Price: ${fmtPrice(key, current)}
- Trend: ${trend}, Structure: ${structure}
- RSI(14): ${rsiVal}
- MACD: ${macd?.bullish ? "Bullish" : "Bearish"} (${macd?.cross !== "none" ? macd?.cross + " cross" : "no cross"})
- SMA20: ${sma?.sma20}, SMA50: ${sma?.sma50}
- Support: ${support?.join(", ")}, Resistance: ${resistance?.join(", ")}
${signal ? `
GENERATED SIGNAL:
- Direction: ${signal.direction}
- Entry: ${signal.entry}, SL: ${signal.sl}
- TP1: ${signal.tp1}, TP2: ${signal.tp2}, TP3: ${signal.tp3}
- R:R: ${signal.rr}, Confidence: ${signal.confidence}%` : ""}

Search for today's latest news and data on ${label}. Return ONLY JSON:
{"summary":"2-3 sentence trade rationale including technicals + news","catalysts":["event1","event2"],"risk":"main risk to this trade","timeframe":"recommended holding period","enhancedConfidence":50-95}`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 600, tools: [{ type: "web_search_20250305", name: "web_search" }], messages: [{ role: "user", content: prompt }] }),
      });
      const json = await res.json();
      const text = json.content?.filter(c => c.type === "text").map(c => c.text).join(" ") || "";
      let parsed;
      try { parsed = JSON.parse(text.replace(/```json|```/g, "").trim()); }
      catch { parsed = { summary: text.slice(0, 300) }; }
      setAiResults(prev => ({ ...prev, [key]: parsed }));
    } catch (e) {
      setAiResults(prev => ({ ...prev, [key]: { summary: "AI analysis unavailable: " + e.message } }));
    }
    setAiLoading(null);
  };

  const instruments = data?.instruments || {};
  const news = data?.news || [];

  // Filter instruments for signals
  const signalInstruments = Object.entries(instruments).filter(([key, d]) => {
    if (d?.error || !d?.signal) return false;
    if (filters.category !== "all" && d.category !== filters.category) return false;
    if (d.signal.confidence < filters.minConf) return false;
    return true;
  }).sort((a, b) => b[1].signal.confidence - a[1].signal.confidence);

  const filteredNews = news.filter(n => filters.impact === "all" || n.impact === filters.impact);

  // Stats
  const totalSignals = Object.values(instruments).filter(d => d?.signal).length;
  const buySignals = Object.values(instruments).filter(d => d?.signal?.direction === "BUY").length;
  const highImpactNews = news.filter(n => n.impact === "HIGH").length;

  const T = {
    card: { background: C.bg2, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 },
    tab: (active) => ({ padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: active ? C.purple : "transparent", color: active ? "#fff" : C.textM }),
    filterBtn: (active) => ({ padding: "4px 10px", borderRadius: 5, fontSize: 11, cursor: "pointer", border: `1px solid ${active ? C.purple : C.border}`, background: active ? "rgba(139,92,246,0.15)" : "transparent", color: active ? C.purple : C.textD }),
  };

  return (
    <div style={{ fontFamily: "var(--font-maven-pro), sans-serif", color: C.text }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5, display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={18} color={C.purple} /> Trading Intelligence
          </div>
          <div style={{ fontSize: 11, color: C.textD, marginTop: 2 }}>
            Real-time analysis · {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : "Loading…"}
          </div>
        </div>
        <button onClick={fetchData} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: C.bg2, color: C.textM, cursor: loading ? "not-allowed" : "pointer", fontSize: 12 }}>
          <RefreshCw size={13} style={loading ? { animation: "spin 1s linear infinite" } : {}} /> Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Active Signals", value: totalSignals, color: C.purple, icon: <Target size={14} /> },
          { label: "Buy Setups", value: buySignals, color: C.green, icon: <TrendingUp size={14} /> },
          { label: "Sell Setups", value: totalSignals - buySignals, color: C.red, icon: <TrendingDown size={14} /> },
          { label: "High Impact News", value: highImpactNews, color: C.amber, icon: <AlertTriangle size={14} /> },
        ].map(s => (
          <div key={s.label} style={{ ...T.card, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{loading ? "–" : s.value}</div>
              <div style={{ fontSize: 10, color: C.textD }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, background: C.bg2, borderRadius: 10, padding: 5, width: "fit-content", border: `1px solid ${C.border}` }}>
        {[
          { id: "signals", label: "Trade Signals", icon: <Target size={12} /> },
          { id: "analysis", label: "Market Analysis", icon: <BarChart2 size={12} /> },
          { id: "news", label: "News Impact", icon: <Newspaper size={12} /> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ ...T.tab(activeTab === tab.id), display: "flex", alignItems: "center", gap: 5 }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, color: C.textD, fontSize: 11 }}>
          <Filter size={11} /> Filters:
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["all", "Forex", "Commodities", "Crypto"].map(cat => (
            <button key={cat} onClick={() => setFilters(f => ({ ...f, category: cat }))} style={T.filterBtn(filters.category === cat)}>
              {cat === "all" ? "All Assets" : cat}
            </button>
          ))}
        </div>
        {activeTab === "news" && (
          <div style={{ display: "flex", gap: 4 }}>
            {["all", "HIGH", "MEDIUM", "LOW"].map(imp => (
              <button key={imp} onClick={() => setFilters(f => ({ ...f, impact: imp }))} style={{ ...T.filterBtn(filters.impact === imp), color: imp !== "all" ? impactColor[imp] : (filters.impact === imp ? C.purple : C.textD), borderColor: imp !== "all" && filters.impact === imp ? impactColor[imp] : (filters.impact === imp ? C.purple : C.border) }}>
                {imp === "all" ? "All Impact" : imp}
              </button>
            ))}
          </div>
        )}
        {activeTab === "signals" && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textD }}>
            Min confidence:
            {[0, 50, 65, 75].map(v => (
              <button key={v} onClick={() => setFilters(f => ({ ...f, minConf: v }))} style={T.filterBtn(filters.minConf === v)}>
                {v === 0 ? "Any" : `${v}%+`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ background: C.bg2, borderRadius: 14, border: `1px solid ${C.border}`, padding: 16, height: 380, animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      )}

      {/* ── Trade Signals Tab ── */}
      {!loading && activeTab === "signals" && (
        <>
          {signalInstruments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: C.textD }}>
              <Target size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
              <div>No signals match the current filters</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {signalInstruments.map(([key, instrData]) => (
                <SignalCard
                  key={key}
                  instrumentKey={key}
                  data={instrData}
                  onAiAnalyze={handleAiAnalyze}
                  aiResult={aiResults[key]}
                  aiLoading={aiLoading}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Market Analysis Tab ── */}
      {!loading && activeTab === "analysis" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {Object.entries(instruments).filter(([key, d]) => {
            if (d?.error) return false;
            if (filters.category !== "all" && d.category !== filters.category) return false;
            return true;
          }).map(([key, d]) => (
            <AnalysisCard key={key} instrumentKey={key} data={d} />
          ))}
        </div>
      )}

      {/* ── News Tab ── */}
      {!loading && activeTab === "news" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {filteredNews.length === 0 ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: C.textD }}>
              <Newspaper size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
              <div>No news available right now</div>
            </div>
          ) : filteredNews.map((item, i) => (
            <NewsCard key={i} item={item} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}

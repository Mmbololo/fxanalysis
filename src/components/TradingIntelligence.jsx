"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createChart, ColorType, CandlestickSeries, HistogramSeries, LineSeries, createSeriesMarkers } from "lightweight-charts";
import {
  RefreshCw, TrendingUp, TrendingDown, Minus, Zap, AlertTriangle,
  Target, BarChart2, Newspaper, Activity, ArrowUpRight, ArrowDownRight, Clock
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

// ── Chart helpers ─────────────────────────────────────────────────────
function calcSMA(series, period) {
  const result = [];
  for (let i = period - 1; i < series.length; i++) {
    const sum = series.slice(i - period + 1, i + 1).reduce((a, d) => a + d.close, 0);
    result.push({ time: series[i].time, value: parseFloat((sum / period).toFixed(6)) });
  }
  return result;
}

function calcWVPPP(series) {
  let wSum = 0, vSum = 0;
  for (const b of series) {
    const pivot = (b.high + b.low + b.close) / 3;
    const vol = b.volume || 1;
    wSum += pivot * vol;
    vSum += vol;
  }
  return vSum > 0 ? wSum / vSum : null;
}

// RSI array from closes
function calcRSIArray(closes, period = 14) {
  if (closes.length < period + 1) return [];
  const result = [];
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) avgGain += d; else avgLoss -= d;
  }
  avgGain /= period; avgLoss /= period;
  result.push({ index: period, value: avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss) });
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(0, d)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -d)) / period;
    result.push({ index: i, value: avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss) });
  }
  return result;
}

// Detect RSI divergence — returns markers array for lightweight-charts
function detectRSIDivergence(series) {
  if (series.length < 40) return [];
  const closes = series.map(d => d.close);
  const rsiArr = calcRSIArray(closes);
  if (!rsiArr.length) return [];

  // Build index→rsi map
  const rsiMap = {};
  for (const r of rsiArr) rsiMap[r.index] = r.value;

  const LB = 5; // lookback bars each side to qualify as a swing
  const swingHighs = [], swingLows = [];

  for (let i = LB; i < series.length - LB; i++) {
    if (rsiMap[i] == null) continue;
    const hi = series[i].high, lo = series[i].low;
    let isH = true, isL = true;
    for (let j = i - LB; j <= i + LB; j++) {
      if (j === i) continue;
      if (series[j].high >= hi) isH = false;
      if (series[j].low  <= lo) isL = false;
    }
    if (isH) swingHighs.push({ i, price: hi, rsi: rsiMap[i], time: series[i].time });
    if (isL) swingLows.push({ i, price: lo, rsi: rsiMap[i], time: series[i].time });
  }

  const markers = [];

  // Bearish divergence: price higher-high + RSI lower-high
  for (let k = 1; k < swingHighs.length; k++) {
    const prev = swingHighs[k - 1], curr = swingHighs[k];
    const gap = curr.i - prev.i;
    if (gap < 8 || gap > 80) continue;
    if (curr.price > prev.price * 1.001 && curr.rsi < prev.rsi - 1) {
      markers.push({ time: curr.time, position: "aboveBar", color: "#ef4444", shape: "arrowDown", text: "RSI Bear Div" });
    }
  }

  // Bullish divergence: price lower-low + RSI higher-low
  for (let k = 1; k < swingLows.length; k++) {
    const prev = swingLows[k - 1], curr = swingLows[k];
    const gap = curr.i - prev.i;
    if (gap < 8 || gap > 80) continue;
    if (curr.price < prev.price * 0.999 && curr.rsi > prev.rsi + 1) {
      markers.push({ time: curr.time, position: "belowBar", color: "#10b981", shape: "arrowUp", text: "RSI Bull Div" });
    }
  }

  return markers;
}

// ── Scoring engine ───────────────────────────────────────────────────
function scoreInstrument(d) {
  if (!d) return { score: 0, direction: "NEUTRAL", factors: [], cautions: [] };
  const { trend, rsi, macd, sma, structure, bb, current } = d;
  let score = 50;
  const factors = [];
  const cautions = [];

  if (trend === "BULLISH") { score += 12; factors.push({ label: "Trend", text: "Bullish — price above key MAs", delta: +12, color: C.green }); }
  else if (trend === "BEARISH") { score -= 12; factors.push({ label: "Trend", text: "Bearish — price below key MAs", delta: -12, color: C.red }); }
  else { factors.push({ label: "Trend", text: "Ranging — no clear direction", delta: 0, color: C.textM }); }

  if (rsi != null) {
    if (rsi > 70) { score -= 10; factors.push({ label: "RSI", text: `${rsi.toFixed(1)} — Overbought`, delta: -10, color: C.red }); cautions.push("RSI overbought — potential pullback"); }
    else if (rsi < 30) { score += 10; factors.push({ label: "RSI", text: `${rsi.toFixed(1)} — Oversold`, delta: +10, color: C.green }); cautions.push("RSI oversold — watch for reversal"); }
    else if (rsi > 55) { score += 6; factors.push({ label: "RSI", text: `${rsi.toFixed(1)} — Mild bullish`, delta: +6, color: C.green }); }
    else if (rsi < 45) { score -= 6; factors.push({ label: "RSI", text: `${rsi.toFixed(1)} — Mild bearish`, delta: -6, color: C.red }); }
    else { factors.push({ label: "RSI", text: `${rsi.toFixed(1)} — Neutral`, delta: 0, color: C.textM }); }
  }

  if (macd) {
    if (macd.cross === "bullish") { score += 10; factors.push({ label: "MACD", text: "Bullish crossover confirmed", delta: +10, color: C.green }); }
    else if (macd.cross === "bearish") { score -= 10; factors.push({ label: "MACD", text: "Bearish crossover confirmed", delta: -10, color: C.red }); }
    else if (macd.histogram > 0) { score += 5; factors.push({ label: "MACD", text: "Positive histogram", delta: +5, color: C.green }); }
    else if (macd.histogram < 0) { score -= 5; factors.push({ label: "MACD", text: "Negative histogram", delta: -5, color: C.red }); }
    else { factors.push({ label: "MACD", text: "Neutral", delta: 0, color: C.textM }); }
  }

  if (structure === "BREAKOUT") { score += 12; factors.push({ label: "Structure", text: "Breakout above resistance", delta: +12, color: C.green }); }
  else if (structure === "BREAKDOWN") { score -= 12; factors.push({ label: "Structure", text: "Breakdown below support", delta: -12, color: C.red }); }
  else if (structure === "TRENDING") { score += 6; factors.push({ label: "Structure", text: "Trending — follow momentum", delta: +6, color: C.green }); }
  else if (structure === "RANGING") { cautions.push("Price ranging — avoid trend entries"); factors.push({ label: "Structure", text: "Consolidation — low conviction", delta: 0, color: C.amber }); }
  else { factors.push({ label: "Structure", text: "Consolidating", delta: 0, color: C.textM }); }

  if (bb && current) {
    if (current > bb.upper) { score -= 8; cautions.push("Price above upper BB — extended"); factors.push({ label: "BB", text: "Above upper band — overextended", delta: -8, color: C.red }); }
    else if (current < bb.lower) { score += 8; cautions.push("Price below lower BB — possible bounce"); factors.push({ label: "BB", text: "Below lower band — possible bounce", delta: +8, color: C.green }); }
    else if (bb.upper && bb.lower && bb.middle && ((bb.upper - bb.lower) / bb.middle) < 0.01) { cautions.push("BB squeeze — breakout imminent"); factors.push({ label: "BB", text: "Bands squeezing — expect volatility", delta: 0, color: C.amber }); }
    else { factors.push({ label: "BB", text: "Price within bands — normal range", delta: 0, color: C.textM }); }
  }

  if (sma && current) {
    const a200 = current > sma.sma200, a50 = current > sma.sma50, a20 = current > sma.sma20;
    if (a200 && a50 && a20) { score += 8; factors.push({ label: "MA Stack", text: "Above SMA20/50/200 — strong bull", delta: +8, color: C.green }); }
    else if (!a200 && !a50 && !a20) { score -= 8; factors.push({ label: "MA Stack", text: "Below SMA20/50/200 — strong bear", delta: -8, color: C.red }); }
  }

  score = Math.min(100, Math.max(0, Math.round(score)));
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
function UnifiedChart({ instrumentKey, data, news, chartType, onChartTypeChange }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Destroy previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const series = data?.fullSeries;
    if (!series?.length) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: C.bg },
        textColor: C.textM,
        fontSize: 11,
        fontFamily: "'Maven Pro', sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(30,45,69,0.4)" },
        horzLines: { color: "rgba(30,45,69,0.4)" },
      },
      crosshair: {
        mode: 0,
        vertLine: { labelBackgroundColor: C.purple },
        horzLine: { labelBackgroundColor: C.purple },
      },
      rightPriceScale: { borderColor: C.border, autoScale: true },
      timeScale: { borderColor: C.border, timeVisible: true, secondsVisible: false },
      handleScroll: true,
      handleScale: true,
    });
    chartRef.current = chart;

    // ── Main price series ──
    let mainSeries;
    if (chartType === "candle") {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: C.green, downColor: C.red,
        borderVisible: false,
        wickUpColor: C.green, wickDownColor: C.red,
      });
      mainSeries.setData(series);
    } else {
      mainSeries = chart.addSeries(LineSeries, {
        color: C.blue, lineWidth: 2,
      });
      mainSeries.setData(series.map(d => ({ time: d.time, value: d.close })));
    }

    // ── Volume histogram (overlay) ──
    const volSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volSeries.setData(series.map(d => ({
      time: d.time,
      value: d.volume || 0,
      color: d.close >= d.open ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)",
    })));

    // ── SMA20 ──
    const sma20Data = calcSMA(series, Math.min(20, series.length - 1));
    if (sma20Data.length > 1) {
      const sma20S = chart.addSeries(LineSeries, { color: C.amber, lineWidth: 1, lastValueVisible: false, priceLineVisible: false });
      sma20S.setData(sma20Data);
    }

    // ── SMA50 ──
    const sma50Data = calcSMA(series, Math.min(50, series.length - 1));
    if (sma50Data.length > 1) {
      const sma50S = chart.addSeries(LineSeries, { color: C.purple, lineWidth: 1, lastValueVisible: false, priceLineVisible: false });
      sma50S.setData(sma50Data);
    }

    // ── Signal price lines ──
    if (data?.signal) {
      const s = data.signal;
      mainSeries.createPriceLine({ price: s.entry, color: C.cyan, lineWidth: 2, lineStyle: 2, axisLabelVisible: true, title: "ENTRY" });
      mainSeries.createPriceLine({ price: s.sl, color: C.red, lineWidth: 1, lineStyle: 0, axisLabelVisible: true, title: "SL" });
      [[s.tp1, "TP1"], [s.tp2, "TP2"], [s.tp3, "TP3"]].forEach(([tp, lbl]) => {
        if (tp) mainSeries.createPriceLine({ price: tp, color: C.green, lineWidth: 1, lineStyle: 1, axisLabelVisible: true, title: lbl });
      });
    }

    // ── Support / Resistance ──
    (data?.support || []).slice(0, 3).forEach((lvl, i) => {
      if (lvl) mainSeries.createPriceLine({ price: lvl, color: "rgba(16,185,129,0.6)", lineWidth: 1, lineStyle: 3, axisLabelVisible: true, title: `S${i + 1}` });
    });
    (data?.resistance || []).slice(0, 3).forEach((lvl, i) => {
      if (lvl) mainSeries.createPriceLine({ price: lvl, color: "rgba(239,68,68,0.6)", lineWidth: 1, lineStyle: 3, axisLabelVisible: true, title: `R${i + 1}` });
    });

    // ── WVPPP ──
    const wvppp = calcWVPPP(series);
    if (wvppp) {
      mainSeries.createPriceLine({
        price: wvppp,
        color: C.cyan,
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: "WVPPP",
      });
    }

    // ── RSI divergence markers ──
    const divMarkers = detectRSIDivergence(series);

    // ── News markers ──
    let newsMarkers = [];
    if (news?.length && chartType === "candle") {
      newsMarkers = news
        .filter(n => n.affected?.includes(instrumentKey))
        .map(n => ({
          time: Math.floor(new Date(n.pubDate).getTime() / 1000),
          position: "belowBar",
          color: n.impact === "HIGH" ? C.red : n.impact === "MEDIUM" ? C.amber : C.green,
          shape: "circle",
          text: n.impact === "HIGH" ? "!" : "N",
        }))
        .filter(m => series.some(d => {
          const t = typeof d.time === "number" ? d.time : Math.floor(new Date(d.time + "T00:00:00Z").getTime() / 1000);
          return Math.abs(t - m.time) < 86400 * 7;
        }));
    }

    // Merge + deduplicate by time, then set once
    const allMarkers = [...divMarkers, ...newsMarkers]
      .sort((a, b) => (typeof a.time === "number" ? a.time : 0) - (typeof b.time === "number" ? b.time : 0));
    if (allMarkers.length) {
      try {
        const mp = createSeriesMarkers(mainSeries);
        mp.setMarkers(allMarkers);
      } catch (_) {}
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (container && chartRef.current) {
        chartRef.current.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, instrumentKey, news, chartType]);

  const hasData = data?.fullSeries?.length > 0;

  return (
    <div style={{ flex: 1, minHeight: 0, position: "relative", background: C.bg }}>
      {!hasData && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, color: C.textD }}>
          <RefreshCw size={24} style={{ animation: "spin 1.5s linear infinite" }} />
          <span style={{ fontSize: 12 }}>Loading chart data…</span>
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

// ── Analysis Cards ────────────────────────────────────────────────────
function AnalysisCards({ data, instrumentKey }) {
  const { trend, structure, rsi, macd, bb, sma } = data;
  const cards = [
    { label: "Trend", icon: trend === "BULLISH" ? <TrendingUp size={13}/> : trend === "BEARISH" ? <TrendingDown size={13}/> : <Minus size={13}/>, value: trend || "—", sub: sma ? `SMA20: ${fmtPrice(instrumentKey, sma.sma20)}` : null, color: trend === "BULLISH" ? C.green : trend === "BEARISH" ? C.red : C.textM },
    { label: "RSI (14)", icon: <Activity size={13}/>, value: rsi ? rsi.toFixed(1) : "—", sub: rsi > 70 ? "Overbought" : rsi < 30 ? "Oversold" : rsi > 55 ? "Bullish" : rsi < 45 ? "Bearish" : "Neutral", color: rsi > 70 ? C.red : rsi < 30 ? C.green : C.amber },
    { label: "MACD", icon: <BarChart2 size={13}/>, value: macd?.cross === "bullish" ? "Bull Cross" : macd?.cross === "bearish" ? "Bear Cross" : macd?.histogram > 0 ? "Positive" : "Negative", sub: macd ? `Hist: ${macd.histogram?.toFixed(4)}` : null, color: macd?.cross === "bullish" || macd?.histogram > 0 ? C.green : C.red },
    { label: "Structure", icon: <Target size={13}/>, value: structure || "—", sub: null, color: structure === "BREAKOUT" ? C.green : structure === "BREAKDOWN" ? C.red : structure === "RANGING" ? C.amber : C.textM },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
      {cards.map(c => (
        <div key={c.label} style={{ background: C.bg3, borderRadius: 8, padding: "9px 12px", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.textD, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.4px" }}>
            <span style={{ color: c.color }}>{c.icon}</span>{c.label}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.value}</div>
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

// ── Verdict Panel ─────────────────────────────────────────────────────
function VerdictPanel({ instrumentKey, data, scoring, aiResult, aiLoading, onAiAnalyze }) {
  const { signal } = data;
  const { score, direction, factors, cautions } = scoring;
  const isBuy = direction === "BUY";
  const isSell = direction === "SELL";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: C.bg3, borderRadius: 10, padding: 14, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 14 }}>
        <ScoreMeter score={score} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
            {isBuy ? "Bullish Setup" : isSell ? "Bearish Setup" : "No Clear Signal"}
          </div>
          <div style={{ fontSize: 11, color: C.textM, lineHeight: 1.5 }}>
            {isBuy ? "Majority of indicators align bullish. Consider long positions at key levels."
              : isSell ? "Majority of indicators align bearish. Consider short positions at key levels."
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

      {signal && (
        <div style={{ background: C.bg3, borderRadius: 10, padding: 12, border: `1px solid ${isBuy ? C.greenBd : C.redBd}` }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.textM, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
            <Target size={11} color={isBuy ? C.green : C.red} />Trade Setup · <span style={{ color: isBuy ? C.green : C.red }}>{signal.direction}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            {[
              { label: "Entry", value: fmtPrice(instrumentKey, signal.entry), color: C.cyan },
              { label: "Stop Loss", value: fmtPrice(instrumentKey, signal.sl), color: C.red },
              { label: "TP 1", value: fmtPrice(instrumentKey, signal.tp1), color: C.green },
              { label: "TP 2", value: fmtPrice(instrumentKey, signal.tp2), color: C.green },
              { label: "TP 3", value: signal.tp3 ? fmtPrice(instrumentKey, signal.tp3) : "—", color: C.green },
              { label: "R:R Ratio", value: signal.rr, color: C.amber },
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

      {cautions.length > 0 && (
        <div style={{ background: C.amberBg, borderRadius: 8, padding: 10, border: `1px solid ${C.amberBd}` }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.amber, display: "flex", alignItems: "center", gap: 5, marginBottom: 6, textTransform: "uppercase" }}>
            <AlertTriangle size={11} /> Cautions
          </div>
          {cautions.map((c, i) => (
            <div key={i} style={{ fontSize: 11, color: C.textM, padding: "3px 0", borderBottom: i < cautions.length - 1 ? `1px solid ${C.amberBd}` : "none" }}>
              · {c}
            </div>
          ))}
        </div>
      )}

      <div style={{ background: C.purpleBg, borderRadius: 10, border: `1px solid rgba(139,92,246,0.25)`, overflow: "hidden" }}>
        <div style={{ padding: "9px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid rgba(139,92,246,0.15)` }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.purple, display: "flex", alignItems: "center", gap: 5, textTransform: "uppercase" }}>
            <Zap size={11} /> Gemini AI Analysis
          </div>
          <button onClick={onAiAnalyze} disabled={aiLoading}
            style={{ padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: aiLoading ? C.bg3 : C.purple, color: aiLoading ? C.textD : "#fff", border: "none", cursor: aiLoading ? "default" : "pointer" }}>
            {aiLoading ? "Analyzing…" : aiResult ? "Refresh" : "Analyze"}
          </button>
        </div>
        <div style={{ padding: "10px 12px", minHeight: 50 }}>
          {aiResult
            ? <div style={{ fontSize: 11, color: C.textM, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{aiResult}</div>
            : <div style={{ fontSize: 11, color: C.textD, textAlign: "center", padding: "10px 0" }}>Click Analyze for AI-powered insights</div>
          }
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

// ── Instrument Sidebar Item ───────────────────────────────────────────
function InstrumentItem({ ikey, data, livePrice, scoring, selected, onClick }) {
  const inst = INSTRUMENTS[ikey];
  const { score, direction } = scoring;
  const price = livePrice?.price ?? data.current;
  const change = livePrice?.change ?? data.change;
  const isUp = (change ?? 0) >= 0;
  return (
    <button onClick={() => onClick(ikey)}
      style={{ width: "100%", textAlign: "left", background: selected ? C.bg3 : "transparent", border: `1px solid ${selected ? C.borderL : "transparent"}`, borderRadius: 8, padding: "9px 10px", cursor: "pointer", transition: "all 0.15s", marginBottom: 3 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: selected ? C.text : C.textM }}>{inst.label}</div>
          <div style={{ fontSize: 9, color: C.textD }}>{inst.sub}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: isUp ? C.green : C.red, display: "flex", alignItems: "center", gap: 1 }}>
            {isUp ? <ArrowUpRight size={9}/> : <ArrowDownRight size={9}/>}{fmtPct(change)}
          </div>
          <div style={{ fontSize: 9, color: C.textD, fontFamily: "monospace" }}>{fmtPrice(ikey, price)}</div>
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
export default function TradingIntelligence() {
  const [instruments, setInstruments] = useState({});
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tfLoading, setTfLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState("XAUUSD");
  const [activeTab, setActiveTab] = useState("verdict");
  const [aiResults, setAiResults] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[5]); // default 1D
  const [chartType, setChartType] = useState("candle");
  const [livePrices, setLivePrices] = useState({});
  const [nextRefresh, setNextRefresh] = useState(300); // seconds countdown

  const load = useCallback(async (tf = null) => {
    // tf=null means initial load (shows sidebar skeleton)
    // tf=<timeframe> means user switched timeframe (shows subtle loading dot)
    const activeTf = tf || TIMEFRAMES[5];
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

  const handleTimeframeChange = (tf) => {
    setTimeframe(tf);
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
    <div style={{ display: "flex", flex: 1, minHeight: 0, background: C.bg, color: C.text, fontFamily: "var(--font-maven-pro), sans-serif", overflow: "hidden" }}>

      {/* ── Left Sidebar ── */}
      <div style={{ width: 196, flexShrink: 0, background: C.bg2, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "10px 12px 8px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: C.textD, textTransform: "uppercase", letterSpacing: "0.6px" }}>Instruments</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
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
                  onClick={(key) => { setSelected(key); setActiveTab("verdict"); }}
                />
              ))
          }
        </div>
        <div style={{ padding: "8px 10px", borderTop: `1px solid ${C.border}` }}>
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Center header */}
        <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, background: C.bg2, display: "flex", alignItems: "center", gap: 12, flexShrink: 0, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.3 }}>{INSTRUMENTS[selected]?.label}</div>
            <div style={{ fontSize: 9, color: C.textD }}>{INSTRUMENTS[selected]?.sub}</div>
          </div>
          {(livePrices[selected]?.price || selectedData.current) && (() => {
            const lp = livePrices[selected];
            const displayPrice = lp?.price ?? selectedData.current;
            const displayChange = lp?.change ?? selectedData.change;
            const up = (displayChange ?? 0) >= 0;
            return (
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "monospace" }}>{fmtPrice(selected, displayPrice)}</div>
                <div style={{ fontSize: 10, color: up ? C.green : C.red, display: "flex", alignItems: "center", gap: 2 }}>
                  {up ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}{fmtPct(displayChange)}
                  {lp && <span style={{ fontSize: 8, color: C.green, marginLeft: 4, fontWeight: 600 }}>● LIVE</span>}
                </div>
              </div>
            );
          })()}

          {/* Chart type toggle */}
          <div style={{ display: "flex", gap: 2, background: C.bg3, borderRadius: 6, padding: 2, border: `1px solid ${C.border}` }}>
            {[["candle", "Candles"], ["area", "Area"]].map(([t, lbl]) => (
              <button key={t} onClick={() => setChartType(t)}
                style={{ padding: "4px 10px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: chartType === t ? C.purple : "transparent", color: chartType === t ? "#fff" : C.textM, border: "none", cursor: "pointer", transition: "all 0.2s" }}>
                {lbl}
              </button>
            ))}
          </div>

          {/* Timeframe selector */}
          <div style={{ display: "flex", gap: 2, background: C.bg3, borderRadius: 6, padding: 2, border: `1px solid ${C.border}` }}>
            {TIMEFRAMES.map(tf => (
              <button key={tf.label} onClick={() => handleTimeframeChange(tf)}
                style={{ padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: timeframe.label === tf.label ? C.purple : "transparent", color: timeframe.label === tf.label ? "#fff" : C.textM, border: "none", cursor: "pointer", transition: "all 0.2s", position: "relative" }}>
                {tf.label}
                {tfLoading && timeframe.label === tf.label && (
                  <span style={{ position: "absolute", top: -2, right: -2, width: 5, height: 5, borderRadius: "50%", background: C.cyan }} />
                )}
              </button>
            ))}
          </div>

          {/* Signal badge */}
          {selectedData.signal && (
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: selectedData.signal.direction === "BUY" ? C.greenBg : C.redBg, color: selectedData.signal.direction === "BUY" ? C.green : C.red, border: `1px solid ${selectedData.signal.direction === "BUY" ? C.greenBd : C.redBd}` }}>
                {selectedData.signal.direction}
              </span>
              <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: C.bg3, color: C.amber, border: `1px solid ${C.border}` }}>
                {selectedData.signal.confidence}% conf
              </span>
            </div>
          )}
        </div>

        {/* Chart legend bar */}
        <div style={{ padding: "4px 14px", background: "rgba(0,0,0,0.2)", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 14, flexShrink: 0, flexWrap: "wrap" }}>
          <span style={{ fontSize: 9, color: C.textD, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ display: "inline-block", width: 20, height: 2, background: C.amber, verticalAlign: "middle" }} /> SMA20
          </span>
          <span style={{ fontSize: 9, color: C.textD, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ display: "inline-block", width: 20, height: 2, background: C.purple, verticalAlign: "middle" }} /> SMA50
          </span>
          <span style={{ fontSize: 9, color: C.textD, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ display: "inline-block", width: 20, height: 2, background: C.cyan, verticalAlign: "middle" }} /> WVPPP
          </span>
          {selectedData.signal && <>
            <span style={{ fontSize: 9, color: C.cyan }}>╌ Entry</span>
            <span style={{ fontSize: 9, color: C.red }}>— SL</span>
            <span style={{ fontSize: 9, color: C.green }}>· TP1/2/3</span>
          </>}
          <span style={{ fontSize: 9, color: C.green }}>╌ S1-3</span>
          <span style={{ fontSize: 9, color: C.red }}>╌ R1-3</span>
          <span style={{ fontSize: 9, color: C.green, display: "flex", alignItems: "center", gap: 3 }}>↑ RSI Bull Div</span>
          <span style={{ fontSize: 9, color: C.red, display: "flex", alignItems: "center", gap: 3 }}>↓ RSI Bear Div</span>
          <span style={{ fontSize: 9, color: C.textD, marginLeft: "auto" }}>Vol below · divergence arrows on bars</span>
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
                data={selectedData}
                news={news}
                chartType={chartType}
                onChartTypeChange={setChartType}
              />

              {/* Cards below chart — scrollable strip */}
              <div style={{ flexShrink: 0, padding: "10px 14px", borderTop: `1px solid ${C.border}`, background: C.bg2, display: "flex", flexDirection: "column", gap: 8 }}>
                <AnalysisCards data={selectedData} instrumentKey={selected} />
                <KeyLevels data={{ support: selectedData.support || [], resistance: selectedData.resistance || [] }} instrumentKey={selected} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div style={{ width: 290, flexShrink: 0, background: C.bg2, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, padding: "3px 6px 0", flexShrink: 0 }}>
          {[
            { id: "verdict", label: "Verdict", icon: <Zap size={10}/> },
            { id: "breakdown", label: "Analysis", icon: <BarChart2 size={10}/> },
            { id: "news", label: "News", icon: <Newspaper size={10}/> },
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
            <BreakdownPanel data={selectedData} instrumentKey={selected} scoring={scoring} />
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

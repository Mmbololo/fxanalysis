"use client";
import React, { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries, HistogramSeries, LineSeries, createSeriesMarkers } from "lightweight-charts";
import { 
  Zap, AlertTriangle, Target, Shield, 
  Maximize2, Minimize2, Settings, Download, Camera
} from "lucide-react";

const T = {
  purple: "#8b5cf6",
  cyan: "#06b6d4",
  green: "#10b981",
  red: "#ef4444",
  amber: "#f59e0b",
  bg: "#0a0e17",
  bg2: "#111827",
  border: "#1e2d45",
  text: "#e2e8f0",
  textM: "#94a3b8",
};

export default function AdvancedChart({ instrumentKey, data, news }) {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const candlestickSeriesRef = useRef();
  const volumeSeriesRef = useRef();
  const [timeframe, setTimeframe] = useState("1d");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!data?.fullSeries) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: T.bg },
        textColor: T.textM,
        fontSize: 11,
        fontFamily: "'Geist', sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(30, 45, 69, 0.4)" },
        horzLines: { color: "rgba(30, 45, 69, 0.4)" },
      },
      crosshair: {
        mode: 0, // CrosshairMode.Normal
        vertLine: { labelBackgroundColor: T.purple },
        horzLine: { labelBackgroundColor: T.purple },
      },
      rightPriceScale: {
        borderColor: T.border,
        autoScale: true,
      },
      timeScale: {
        borderColor: T.border,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    // Candlesticks
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: T.green,
      downColor: T.red,
      borderVisible: false,
      wickUpColor: T.green,
      wickDownColor: T.red,
    });
    candlestickSeriesRef.current = candlestickSeries;

    // Volume
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "rgba(139, 92, 246, 0.2)",
      priceFormat: { type: "volume" },
      priceScaleId: "", // overlay
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    // Load Initial Data
    const formattedData = data.fullSeries.map(d => ({
      ...d,
      time: typeof d.time === "number" ? d.time : d.time, // Handle both ISO and unix
    }));
    candlestickSeries.setData(formattedData);
    volumeSeries.setData(formattedData.map(d => ({
      time: d.time,
      value: d.volume,
      color: d.close >= d.open ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
    })));

    // Indicators: EMA 20, 50, 200 (Mocked for now since lib/technicals provides scalars)
    // In a real app, I'd calculate the series on the fly or receive it from API
    if (data.sma?.sma20) {
      const ema20Line = chart.addSeries(LineSeries, { color: T.cyan, lineWidth: 1, title: "EMA 20" });
      // For demo, we just draw a slightly offset line or actual calculation
      // For precision, I'll just use the system's SMA as a horizontal reference or partial series if available
    }

    // Signals Overlays (Horizontal Lines)
    if (data.signal) {
      const s = data.signal;
      // Entry
      candlestickSeries.createPriceLine({
        price: s.entry,
        color: T.cyan,
        lineWidth: 2,
        lineStyle: 2, // Dash
        axisLabelVisible: true,
        title: "ENTRY",
      });
      // SL
      candlestickSeries.createPriceLine({
        price: s.sl,
        color: T.red,
        lineWidth: 1,
        axisLabelVisible: true,
        title: "SL",
      });
      // TP 1-3
      [s.tp1, s.tp2, s.tp3].forEach((tp, i) => {
        if (tp) {
          candlestickSeries.createPriceLine({
            price: tp,
            color: T.green,
            lineWidth: 1,
            lineStyle: 1, // Dotted
            axisLabelVisible: true,
            title: `TP${i+1}`,
          });
        }
      });
    }

    // News Markers (v5 uses plugins)
    if (news && news.length > 0) {
      const markers = news
        .filter(n => n.affected?.includes(instrumentKey))
        .map(n => {
          const timestamp = Math.floor(new Date(n.pubDate).getTime() / 1000);
          return {
            time: timestamp,
            position: "belowBar",
            color: n.impact === "HIGH" ? T.red : n.impact === "MEDIUM" ? T.amber : T.green,
            shape: "circle",
            text: n.impact === "HIGH" ? "!" : "N",
          };
        })
        .filter(m => formattedData.some(d => d.time >= m.time - 86400 && d.time <= m.time + 86400));
      
      const markersPlugin = createSeriesMarkers(candlestickSeries);
      markersPlugin.setMarkers(markers);
    }

    // Handle resize
    const handleResize = () => {
      chart.applyOptions({ 
        width: chartContainerRef.current.clientWidth,
        height: isExpanded ? 700 : 450
      });
    };
    window.addEventListener("resize", handleResize);

    chart.timeScale().fitContent();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, instrumentKey, news, isExpanded]);

  return (
    <div style={{ 
      background: T.bg2, borderRadius: 16, border: `1px solid ${T.border}`, 
      overflow: "hidden", position: "relative",
      boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
    }}>
      {/* Chart Toolbar */}
      <div style={{ 
        padding: "10px 16px", borderBottom: `1px solid ${T.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "rgba(0,0,0,0.2)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800 }}>{instrumentKey}</span>
            <span style={{ fontSize: 11, color: data?.change >= 0 ? T.green : T.red, fontWeight: 700 }}>
              {data?.change >= 0 ? "+" : ""}{data?.change?.toFixed(2)}%
            </span>
          </div>
          <div style={{ width: 1, height: 16, background: T.border }} />
          <div style={{ display: "flex", gap: 4 }}>
            {["15m", "1h", "4h", "1d", "1w"].map(tf => (
              <button 
                key={tf} 
                onClick={() => setTimeframe(tf)}
                style={{
                  padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                  background: timeframe === tf ? T.purple : "transparent",
                  color: timeframe === tf ? "#fff" : T.textM,
                  border: "none", cursor: "pointer", transition: "all 0.2s"
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ p: 6, color: T.textM, background: "none", border: "none", cursor: "pointer" }} title="Chart Settings"><Settings size={16} /></button>
          <button style={{ p: 6, color: T.textM, background: "none", border: "none", cursor: "pointer" }} title="Snapshot"><Camera size={16} /></button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ p: 6, color: T.textM, background: "none", border: "none", cursor: "pointer" }}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Main Chart Area */}
      <div 
        ref={chartContainerRef} 
        style={{ width: "100%", height: isExpanded ? 700 : 450, position: "relative" }} 
      />

      {/* Dynamic Overlays (Floating Legends) */}
      <div style={{ 
        position: "absolute", top: 60, left: 16, zIndex: 10,
        pointerEvents: "none", display: "flex", flexDirection: "column", gap: 4
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: 1, background: T.purple }} />
          <span style={{ fontSize: 10, color: T.textD, fontWeight: 700 }}>SYSTEM: {data?.signal?.direction || "NEUTRAL"}</span>
        </div>
        {data?.signal && (
          <div style={{ fontSize: 10, color: T.textM }}>
            R:R {data.signal.rr} · Conf: {data.signal.confidence}%
          </div>
        )}
      </div>

      {/* Intelligence Layer Commentary */}
      {data?.signal && !isExpanded && (
        <div style={{ 
          position: "absolute", bottom: 16, left: 16, right: 16, zIndex: 10,
          background: "rgba(17, 24, 39, 0.7)", backdropFilter: "blur(8px)",
          padding: "10px 14px", borderRadius: 12, border: `1px solid ${T.purple}40`,
          display: "flex", alignItems: "center", gap: 12
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${T.purple}20`, display: "flex", alignItems: "center", justifyContent: "center", color: T.purple }}>
            <Zap size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.purple, fontWeight: 800, textTransform: "uppercase" }}>AI Commentary</div>
            <div style={{ fontSize: 12, color: T.text, fontWeight: 500, lineHeight: 1.4 }}>
              The system identifies a strong {data.signal.direction} bias. 
              {data.trend === "BULLISH" ? " Momentum is accelerating above SMA50." : " Price is facing overhead resistance."} 
              Risk-reward ratio of {data.signal.rr} is highly favorable.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useState, useEffect } from "react";
import { 
  Target, Shield, Zap, Info, 
  ArrowRight, Calculator, CheckCircle2, 
  ChevronRight, Settings2, Lock
} from "lucide-react";

const T = {
  purple: "#8b5cf6",
  cyan: "#06b6d4",
  green: "#10b981",
  red: "#ef4444",
  amber: "#f59e0b",
  bg: "#0a0e17",
  bg2: "#111827",
  bg3: "#1a2235",
  border: "#1e2d45",
  text: "#e2e8f0",
  textM: "#94a3b8",
  textD: "#64748b",
};

export default function TradePanel({ selectedInstrument, instrumentData }) {
  const [balance, setBalance] = useState(10000);
  const [riskPct, setRiskPct] = useState(1);
  const [levels, setLevels] = useState({ entry: 0, sl: 0, tp: 0 });
  const [lotSize, setLotSize] = useState(0);
  const [riskAmount, setRiskAmount] = useState(0);
  const [rrRatio, setRrRatio] = useState(0);

  useEffect(() => {
    if (instrumentData?.signal) {
      const s = instrumentData.signal;
      setLevels({
        entry: s.entry,
        sl: s.sl,
        tp: s.tp2 || s.tp1
      });
    } else if (instrumentData?.current) {
      const p = instrumentData.current;
      setLevels({
        entry: p,
        sl: p * 0.99,
        tp: p * 1.02
      });
    }
  }, [instrumentData, selectedInstrument]);

  useEffect(() => {
    if (!levels.entry || !levels.sl || !levels.tp) return;

    // Lot Size calculation logic
    // Lot = (Balance * Risk%) / (SL Pips * Pip Value)
    const riskVal = balance * (riskPct / 100);
    const slPips = Math.abs(levels.entry - levels.sl);
    
    // Simple pip value approximation for major pairs
    let pipValue = 0.0001;
    if (selectedInstrument.includes("JPY")) pipValue = 0.01;
    if (selectedInstrument.includes("XAU")) pipValue = 0.01;
    if (selectedInstrument.includes("BTC")) pipValue = 1;

    const pips = slPips / pipValue;
    const calculatedLotSize = pips > 0 ? (riskVal / (pips * 10)) : 0; // Standard lot assumes $10/pip for 1 lot on most majors

    setLotSize(parseFloat(calculatedLotSize.toFixed(2)));
    setRiskAmount(riskVal);
    
    const tpDistance = Math.abs(levels.tp - levels.entry);
    setRrRatio(slPips > 0 ? (tpDistance / slPips).toFixed(2) : 0);
  }, [balance, riskPct, levels, selectedInstrument]);

  return (
    <div style={{ 
      width: 340, background: T.bg2, borderRadius: 16, 
      border: `1px solid ${T.border}`, padding: 20,
      display: "flex", flexDirection: "column", gap: 20,
      boxShadow: "0 20px 50px rgba(0,0,0,0.4)"
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${T.cyan}20`, display: "flex", alignItems: "center", justifyContent: "center", color: T.cyan }}>
            <Calculator size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>Lot Size Calculator</div>
            <div style={{ fontSize: 10, color: T.textD }}>Institutional Risk Management</div>
          </div>
        </div>
        <Settings2 size={16} color={T.textD} />
      </div>

      {/* Account Settings */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 10, color: T.textD, fontWeight: 700, textTransform: "uppercase" }}>Balance (USD)</label>
          <input 
            type="number" 
            value={balance}
            onChange={e => setBalance(Number(e.target.value))}
            style={{ 
              background: T.bg3, border: `1px solid ${T.border}`, 
              borderRadius: 8, padding: "8px 12px", color: T.text, fontSize: 13,
              outline: "none"
            }} 
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 10, color: T.textD, fontWeight: 700, textTransform: "uppercase" }}>Risk %</label>
          <div style={{ position: "relative" }}>
            <input 
              type="number" 
              value={riskPct}
              onChange={e => setRiskPct(Number(e.target.value))}
              style={{ 
                width: "100%", background: T.bg3, border: `1px solid ${T.border}`, 
                borderRadius: 8, padding: "8px 12px", color: T.text, fontSize: 13,
                outline: "none"
              }} 
            />
            <span style={{ position: "absolute", right: 12, top: 10, fontSize: 11, color: T.textD }}>%</span>
          </div>
        </div>
      </div>

      {/* Levels Adjustment */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { label: "Entry", key: "entry", color: T.cyan },
          { label: "Stop Loss", key: "sl", color: T.red },
          { label: "Take Profit", key: "tp", color: T.green }
        ].map(item => (
          <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.15)", padding: "8px 12px", borderRadius: 10, border: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 4, height: 4, borderRadius: 2, background: item.color }} />
              <span style={{ fontSize: 11, color: T.textM, fontWeight: 600 }}>{item.label}</span>
            </div>
            <input 
              type="number" 
              value={levels[item.key]}
              step="0.0001"
              onChange={e => setLevels({...levels, [item.key]: Number(e.target.value)})}
              style={{ 
                background: "none", border: "none", textAlign: "right",
                color: item.color, fontSize: 13, fontWeight: 700, width: "50%",
                outline: "none"
              }} 
            />
          </div>
        ))}
      </div>

      {/* Calculation Output */}
      <div style={{ 
        background: `linear-gradient(135deg, ${T.purple}15, ${T.cyan}15)`, 
        borderRadius: 12, border: `1px solid ${T.purple}30`, padding: 16
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: T.textM, marginBottom: 2 }}>Recommended Lot Size</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: T.purple }}>{lotSize} <span style={{ fontSize: 14 }}>Standard</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: T.textM, marginBottom: 2 }}>Risk/Reward</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.green }}>1 : {rrRatio}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
          <span style={{ color: T.textD }}>Risk Amount: <b style={{ color: T.red }}>${riskAmount.toLocaleString()}</b></span>
          <span style={{ color: T.textD }}>Potential Gain: <b style={{ color: T.green }}>${(riskAmount * rrRatio).toLocaleString()}</b></span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button style={{ 
          background: T.purple, color: "#fff", border: "none", 
          padding: "12px", borderRadius: 10, fontWeight: 800, fontSize: 14,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: `0 4px 15px ${T.purple}40`
        }}>
          Execute Trade <ArrowRight size={16} />
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ flex: 1, background: T.bg3, color: T.textM, border: `1px solid ${T.border}`, padding: "10px", borderRadius: 10, fontSize: 12, cursor: "pointer" }}>Save Plan</button>
          <button style={{ flex: 1, background: T.bg3, color: T.textM, border: `1px solid ${T.border}`, padding: "10px", borderRadius: 10, fontSize: 12, cursor: "pointer" }}>Ask AI</button>
        </div>
      </div>

      {/* Risk Disclaimer */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 9, color: T.textD, lineHeight: 1.4 }}>
        <Shield size={12} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>Ensure your execution broker supports this lot size. Risk management is the most critical component of profitability.</span>
      </div>
    </div>
  );
}

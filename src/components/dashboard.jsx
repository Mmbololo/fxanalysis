"use client";
import { useState, useEffect, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ComposedChart, Cell } from "recharts";
import { TrendingUp, TrendingDown, Activity, BarChart3, Brain, BookOpen, RefreshCw, AlertTriangle, Target, Shield, Zap, Plus, Trash2, ArrowUpRight, ArrowDownRight, Clock, Database, Crosshair, Layers, Radio, ExternalLink, LogOut, User } from "lucide-react";
import ChatAssistant from "./chat-assistant";
import AdvancedChart from "./AdvancedChart";
import TradePanel from "./TradePanel";
import TradingIntelligence from "./TradingIntelligence";


const T = {
  bg: "#0a0e17", bg2: "#111827", bg3: "#1a2235", bg4: "#243049",
  border: "#1e2d45", borderL: "#2a3f5f",
  text: "#e2e8f0", textM: "#94a3b8", textD: "#64748b",
  green: "#10b981", greenBg: "rgba(16,185,129,0.1)", greenBd: "rgba(16,185,129,0.25)",
  red: "#ef4444", redBg: "rgba(239,68,68,0.1)", redBd: "rgba(239,68,68,0.25)",
  amber: "#f59e0b", amberBg: "rgba(245,158,11,0.1)", amberBd: "rgba(245,158,11,0.25)",
  blue: "#3b82f6", blueBg: "rgba(59,130,246,0.1)", blueBd: "rgba(59,130,246,0.25)",
  purple: "#8b5cf6", purpleBg: "rgba(139,92,246,0.1)", purpleBd: "rgba(139,92,246,0.25)",
  cyan: "#06b6d4", cyanBg: "rgba(6,182,212,0.1)", cyanBd: "rgba(6,182,212,0.25)",
  accent: "#8b5cf6",
};

const INSTRUMENTS = {
  XAUUSD: {
    name: "XAUUSD", label: "Gold", price: 4749, change: 2.3,
    cot: { date: "Apr 7, 2026", oi: 354877, nonComm: { long: 205368, short: 49063, spread: 42663 }, comm: { long: 57729, short: 251480 }, nonRep: { long: 49117, short: 11671 }, netSpec: 156305, prevNet: 163200, managedMoney: 92775 },
    sentiment: { retailLong: 72, retailShort: 28 },
    history: [
      { w: "Feb 18", net: 178.2, price: 4210 }, { w: "Feb 25", net: 175.4, price: 4285 },
      { w: "Mar 4", net: 170.1, price: 4350 }, { w: "Mar 11", net: 168.3, price: 4420 },
      { w: "Mar 18", net: 165.8, price: 4510 }, { w: "Mar 25", net: 163.2, price: 4585 },
      { w: "Apr 1", net: 163.2, price: 4680 }, { w: "Apr 7", net: 156.3, price: 4749 },
    ],
    signals: [
      { type: "warn", text: "COT divergence: price rising while specs trim longs — classic distribution pattern" },
      { type: "bear", text: "Retail 72% long — crowded. Liquidity grab below $4,700 support likely" },
      { type: "bull", text: "Commercial hedging normal in strong uptrend. Macro backdrop intact" },
      { type: "info", text: "Managed money at 92.8K net long — moderate, not extreme" },
    ],
    composite: "Cautious Long", compositeColor: T.amber,
  },
  GBPUSD: {
    name: "GBPUSD", label: "Cable", price: 1.312, change: 0.8,
    cot: { date: "Apr 7, 2026", oi: 244191, assetMgr: { long: 25841, short: 125301 }, leveraged: { long: 55779, short: 29246 }, dealer: { long: 133276, short: 53508 }, netSpec: -56400, prevNet: -52700 },
    sentiment: { retailLong: 47, retailShort: 53 },
    history: [
      { w: "Feb 18", net: -42.1, price: 1.258 }, { w: "Feb 25", net: -44.3, price: 1.264 },
      { w: "Mar 4", net: -46.8, price: 1.271 }, { w: "Mar 11", net: -48.5, price: 1.278 },
      { w: "Mar 18", net: -50.2, price: 1.289 }, { w: "Mar 25", net: -52.7, price: 1.295 },
      { w: "Apr 1", net: -52.7, price: 1.304 }, { w: "Apr 7", net: -56.4, price: 1.312 },
    ],
    signals: [
      { type: "bear", text: "Asset managers heavily net-short (-99.5K) — institutional bearish conviction" },
      { type: "bull", text: "Leveraged funds net-long (+26.5K) — potential for short squeeze" },
      { type: "info", text: "Price rising despite growing net shorts — divergence developing" },
      { type: "warn", text: "Retail near 50/50 — no contrarian edge from sentiment" },
    ],
    composite: "Bearish Lean", compositeColor: T.red,
  },
  GBPJPY: {
    name: "GBPJPY", label: "Geppy", price: 190.45, change: 1.2,
    cot: { date: "Apr 7, 2026", oi: null, gbpNet: -56400, jpyNet: -112000, crossBias: "Mildly Bullish" },
    sentiment: { retailLong: 58, retailShort: 42 },
    history: [
      { w: "Feb 18", net: 18, price: 185.2 }, { w: "Feb 25", net: 22, price: 186.1 },
      { w: "Mar 4", net: 25, price: 186.8 }, { w: "Mar 11", net: 28, price: 187.5 },
      { w: "Mar 18", net: 32, price: 188.4 }, { w: "Mar 25", net: 36, price: 189.2 },
      { w: "Apr 1", net: 42, price: 189.8 }, { w: "Apr 7", net: 56, price: 190.45 },
    ],
    signals: [
      { type: "bull", text: "JPY more aggressively shorted than GBP — net bullish cross-pair bias" },
      { type: "warn", text: "Both legs bearish = choppy. Better as carry trade than momentum play" },
      { type: "bear", text: "BoJ intervention risk elevated if JPY weakens past 155 on USDJPY" },
    ],
    composite: "Range / Carry", compositeColor: T.amber,
  },
  BTCUSD: {
    name: "BTCUSD", label: "Bitcoin", price: 84250, change: 5.1,
    cot: { date: "Apr 7, 2026", oi: 32400, assetMgr: "Net Long", leveraged: "Net Short", dealer: "Neutral" },
    sentiment: { retailLong: 65, retailShort: 35 },
    history: [
      { w: "Feb 18", net: 8.2, price: 72400 }, { w: "Feb 25", net: 9.1, price: 74800 },
      { w: "Mar 4", net: 7.8, price: 76200 }, { w: "Mar 11", net: 6.4, price: 78100 },
      { w: "Mar 18", net: 5.9, price: 79500 }, { w: "Mar 25", net: 7.2, price: 81200 },
      { w: "Apr 1", net: 8.8, price: 82700 }, { w: "Apr 7", net: 10.2, price: 84250 },
    ],
    signals: [
      { type: "bull", text: "Asset managers net-long on CME — institutional confidence building" },
      { type: "bear", text: "Leveraged funds net-short — basis trade / hedging, not directional" },
      { type: "info", text: "Fear & Greed at 62 (Greed) — not extreme, room to run" },
    ],
    composite: "Bullish w/ Caution", compositeColor: T.green,
  }
};

const OPTION_EXPIRIES = {
  date: "April 13, 2026",
  nyCut: "10:00 AM ET / 5:00 PM EAT",
  source: "InvestingLive (formerly ForexLive)",
  sourceUrl: "https://investinglive.com/Orders",
  entries: [
    { pair: "EURUSD", strike: "1.1650", notional: "EUR 812M", significance: "high", notes: "Near 100-HMA at 1.1661. Acts as downside floor in European session.", proximity: "close", techLevel: "100-HMA 1.1661" },
    { pair: "EURUSD", strike: "1.1700", notional: "EUR 645M", significance: "high", notes: "Caps upside near daily MA confluence at 1.1672-86. Ceiling while US-Iran negative.", proximity: "close", techLevel: "100/200-DMA 1.1672-86" },
    { pair: "USDCAD", strike: "1.3900", notional: "USD 420M", significance: "medium", notes: "Near 200-HMA at 1.3885. Bounce-back zone after last week's losses.", proximity: "moderate", techLevel: "200-HMA 1.3885" },
  ],
  historicalExpiries: [
    { date: "Apr 10", entries: [{ pair: "Various", note: "No major expiries. US-Iran Islamabad talks in focus." }] },
    { date: "Apr 9", entries: [{ pair: "EURUSD", strike: "1.1600-10", note: "Larger expiries slightly away from spot. Ceasefire fragility drove price." }, { pair: "EURUSD", strike: "1.1635", note: "Smaller expiry near spot." }] },
    { date: "Apr 8", entries: [{ pair: "EURUSD", strike: "1.1700", note: "Near 100/200-DMA confluence at 1.1672-85. Ceasefire rally hit resistance here." }] },
    { date: "Apr 6", entries: [{ pair: "Various", note: "Easter Monday — no major expiries. Quiet session expected." }] },
  ],
  context: "US-Iran talks collapsed over the weekend. Dollar gapped higher at open. Oil prices jumping. Risk-off flows dominate. Expiry impact muted in high-vol geopolitical regime but levels remain valid as magnets when volatility settles."
};

const OPTIONS_OI = {
  source: "Investing.com Forex Options + CME Group",
  sourceUrls: ["https://www.investing.com/currencies/forex-options", "https://www.cmegroup.com/tools-information/quikstrike/open-interest-heatmap.html"],
  lastUpdate: "Apr 11, 2026",
  instruments: {
    XAUUSD: {
      futuresOI: 354877, optionsOI: 128450, totalOI: 483327,
      putCallRatio: 0.62, putCallOIRatio: 0.58,
      putVol: 18420, callVol: 29680, totalVol: 48100,
      iv30d: 28.4, ivChange: +2.1,
      maxPainStrike: "$4,700",
      topStrikes: [
        { strike: "$4,500", callOI: 12400, putOI: 3200, type: "support" },
        { strike: "$4,700", callOI: 8900, putOI: 15600, type: "maxpain" },
        { strike: "$4,800", callOI: 6200, putOI: 8100, type: "resistance" },
        { strike: "$5,000", callOI: 22100, putOI: 1800, type: "target" },
        { strike: "$5,200", callOI: 14300, putOI: 900, type: "target" },
      ],
      signal: "Put/call ratio at 0.62 is below 1.0 — bullish skew. Heavy call OI at $5,000 shows institutional upside targets. Max pain at $4,700 = magnet for near-term expiry."
    },
    GBPUSD: {
      futuresOI: 244191, optionsOI: 89200, totalOI: 333391,
      putCallRatio: 1.24, putCallOIRatio: 1.18,
      putVol: 8950, callVol: 7220, totalVol: 16170,
      iv30d: 12.8, ivChange: +0.6,
      maxPainStrike: "1.3000",
      topStrikes: [
        { strike: "1.2800", callOI: 1200, putOI: 9800, type: "support" },
        { strike: "1.3000", callOI: 5400, putOI: 6100, type: "maxpain" },
        { strike: "1.3100", callOI: 4800, putOI: 3200, type: "neutral" },
        { strike: "1.3200", callOI: 7600, putOI: 1500, type: "resistance" },
        { strike: "1.3500", callOI: 11200, putOI: 800, type: "target" },
      ],
      signal: "Put/call ratio at 1.24 — bearish skew. Heavy put OI at 1.2800 = downside target. Max pain at 1.3000 pulls price lower from current 1.3120."
    },
    GBPJPY: {
      futuresOI: null, optionsOI: null, totalOI: null,
      putCallRatio: null, putCallOIRatio: null,
      putVol: null, callVol: null, totalVol: null,
      iv30d: null, ivChange: null,
      maxPainStrike: null,
      topStrikes: [],
      signal: "No direct GBPJPY options — derived from GBP and JPY legs. See GBPUSD and USDJPY options data."
    },
    BTCUSD: {
      futuresOI: 32400, optionsOI: 185000, totalOI: 217400,
      putCallRatio: 0.48, putCallOIRatio: 0.52,
      putVol: 12800, callVol: 26700, totalVol: 39500,
      iv30d: 62.5, ivChange: -3.2,
      maxPainStrike: "$82,000",
      topStrikes: [
        { strike: "$75,000", callOI: 2100, putOI: 18400, type: "support" },
        { strike: "$80,000", callOI: 8200, putOI: 12600, type: "neutral" },
        { strike: "$85,000", callOI: 14800, putOI: 5200, type: "resistance" },
        { strike: "$90,000", callOI: 21300, putOI: 2100, type: "target" },
        { strike: "$100,000", callOI: 38500, putOI: 800, type: "target" },
      ],
      signal: "Put/call ratio at 0.48 — strong bullish skew. Massive call OI at $100K = institutional upside bet. Max pain at $82K suggests near-term pullback risk."
    }
  },
  pcRatioHistory: [
    { w: "Mar 4", xau: 0.71, gbp: 1.15, btc: 0.55 },
    { w: "Mar 11", xau: 0.68, gbp: 1.18, btc: 0.51 },
    { w: "Mar 18", xau: 0.65, gbp: 1.20, btc: 0.49 },
    { w: "Mar 25", xau: 0.64, gbp: 1.21, btc: 0.50 },
    { w: "Apr 1", xau: 0.63, gbp: 1.22, btc: 0.48 },
    { w: "Apr 7", xau: 0.62, gbp: 1.24, btc: 0.48 },
  ]
};

const ANALYSIS = {
  XAUUSD: {
    verdict: "Cautious Long",
    verdictColor: T.amber,
    summary: "Gold is in a strong macro uptrend but showing early signs of near-term exhaustion. The smart money is quietly trimming while retail piles in.",
    layers: [
      { title: "What the big players are doing", icon: "cot", color: T.purple,
        explain: "The COT report tells us how hedge funds, banks, and commercial hedgers are positioned in futures markets. It's like seeing the poker hands of the biggest players at the table.",
        finding: "Large speculators cut their net-long positions by 6,900 contracts last week to 156.3K — the fifth straight week of reductions. However, they're still overwhelmingly bullish. Commercials (miners, refiners) added shorts, which is normal hedging behavior when price is rising and they want to lock in profits.",
        signal: "warn" },
      { title: "What retail traders are doing", icon: "sentiment", color: T.amber,
        explain: "Retail sentiment shows the ratio of everyday traders who are buying vs selling. Since most retail traders lose money, extreme readings often work as contrarian signals — when everyone's bullish, the market often turns.",
        finding: "72% of retail traders are long gold. This is firmly in 'crowded' territory. When the crowd is this one-sided, market makers and institutions often engineer stop-hunts below obvious support levels to collect cheap liquidity before the next move up.",
        signal: "bear" },
      { title: "What the options market is saying", icon: "options", color: T.blue,
        explain: "Options open interest reveals where traders have placed their bets at specific price levels. A put/call ratio below 1.0 means more bullish bets (calls) than bearish bets (puts). 'Max pain' is the price where most option contracts expire worthless.",
        finding: "Put/call ratio at 0.62 confirms the bullish lean. Huge call open interest clusters at $5,000 and $5,200 show institutions are targeting those levels. But max pain sits at $4,700 — expect a gravitational pull toward this level before the next monthly expiry.",
        signal: "bull" },
      { title: "Today's order flow levels", icon: "flow", color: T.cyan,
        explain: "FX option expiries from InvestingLive tell us where large option contracts expire at 10AM New York time. These strikes act as price magnets in the hours before the cut, especially when they align with technical support or resistance.",
        finding: "No direct gold expiries today, but the broader risk-off context from the US-Iran collapse is the dominant driver. Gold benefits as a safe haven — any dips toward $4,700 (max pain) represent buying opportunities in the larger uptrend.",
        signal: "bull" },
    ],
    bottomLine: "The big picture remains bullish — central bank buying, de-dollarization, and geopolitical risk all support gold. But the near-term is tricky: specs are trimming, retail is overcrowded at 72% long, and max pain at $4,700 suggests a dip before the next leg up. The play is to buy dips toward $4,700 rather than chase at current levels. Watch for a liquidity sweep below $4,700 as your entry signal.",
    riskLevel: 3,
  },
  GBPUSD: {
    verdict: "Bearish Lean",
    verdictColor: T.red,
    summary: "Institutional money is firmly bearish on the pound, but price keeps grinding higher — a dangerous divergence that typically resolves with a sharp reversal.",
    layers: [
      { title: "What the big players are doing", icon: "cot", color: T.purple,
        explain: "For currencies, the COT breaks down into asset managers (pension funds, sovereign wealth), leveraged funds (hedge funds), and dealers (banks). Each group trades for different reasons.",
        finding: "Asset managers are massively net-short at -99,500 contracts — that's conviction-level bearish positioning from the biggest, slowest-moving money. However, leveraged funds are net-long at +26,500, likely playing a short-term squeeze. This tug-of-war between smart money groups creates choppy, whipsaw conditions.",
        signal: "bear" },
      { title: "What retail traders are doing", icon: "sentiment", color: T.amber,
        explain: "When retail sentiment sits near 50/50, there's no strong contrarian signal. The crowd isn't leaning hard enough in either direction to create a reliable fade opportunity.",
        finding: "Retail is split 47% long / 53% short — almost perfectly balanced. This tells us the crowd has no strong conviction either way, which means we can't rely on sentiment as a directional input here. Other tools need to carry the weight.",
        signal: "info" },
      { title: "What the options market is saying", icon: "options", color: T.blue,
        explain: "A put/call ratio above 1.0 means more bearish bets are being placed than bullish ones. When combined with where the open interest clusters, it paints a picture of where institutional money expects price to go.",
        finding: "Put/call ratio at 1.24 confirms the bearish skew from the options side. Heavy put open interest at 1.2800 marks the institutional downside target. Max pain at 1.3000 — below the current price of 1.3120 — means option market dynamics are pulling price lower. Call OI at 1.3500 suggests that's the upside cap if bulls manage a breakout.",
        signal: "bear" },
      { title: "Today's order flow levels", icon: "flow", color: T.cyan,
        explain: "While today's listed expiries are for EUR/USD and USD/CAD, the dollar dynamics from those pairs spill over into GBP/USD. A stronger dollar from EUR/USD selling also weighs on cable.",
        finding: "EUR/USD expiries at 1.1650 and 1.1700 are creating a defined range for the euro. If the dollar strengthens to push EUR/USD toward 1.1650, expect GBP/USD to face sympathetic selling pressure. The US-Iran collapse is generally dollar-positive, adding headwinds for GBP/USD.",
        signal: "bear" },
    ],
    bottomLine: "Three out of four tools point bearish — COT (asset manager shorts), options (1.24 PCR, put walls at 1.2800, max pain below spot), and order flow context. The only wildcard is leveraged funds playing a short-term squeeze. The smart trade is to sell rallies toward 1.3200 resistance rather than buy dips. If price breaks below 1.3000 (max pain), the move toward 1.2800 (put wall) accelerates. Stop above 1.3250.",
    riskLevel: 4,
  },
  GBPJPY: {
    verdict: "Range / Carry",
    verdictColor: T.amber,
    summary: "A conflicted cross where both currencies are under pressure. JPY is weaker, giving GBPJPY a mild upside tilt — but this is a carry trade, not a trend trade.",
    layers: [
      { title: "What the big players are doing", icon: "cot", color: T.purple,
        explain: "For a cross like GBP/JPY, there's no direct futures contract. We analyze it by reading the COT data for both legs — GBP futures and JPY futures — and comparing which side is more heavily positioned.",
        finding: "GBP speculators are net-short -56.4K, while JPY speculators are net-short -112K. Since JPY is more heavily sold, the net effect is mildly bullish for GBP/JPY. But both legs being bearish means the cross is in a low-conviction, choppy regime — not a trending one.",
        signal: "warn" },
      { title: "What retail traders are doing", icon: "sentiment", color: T.amber,
        explain: "A 58/42 split is a mild lean, not an extreme. The contrarian signal is weak — you'd need 65%+ on one side for it to be actionable on its own.",
        finding: "Retail is 58% long — a slight bullish lean that generates a mild contrarian bearish signal. But it's not extreme enough to trade on. The carry trade yield (buying GBP/JPY earns interest rate differential) likely explains why retail leans long.",
        signal: "info" },
      { title: "What the options market is saying", icon: "options", color: T.blue,
        explain: "GBP/JPY doesn't have its own listed options on CME, so we derive insights from GBP and JPY options separately. The net picture combines both legs.",
        finding: "GBP options show bearish skew (PCR 1.24). JPY options typically show even more bearish skew as institutions hedge against yen weakness. The combined effect is that options markets expect continued JPY weakness but also GBP softness — a net neutral to mildly bullish read for the cross.",
        signal: "info" },
      { title: "Today's order flow levels", icon: "flow", color: T.cyan,
        explain: "Without direct GBP/JPY expiries, we monitor USD/JPY and GBP/USD order flow as proxies. A BoJ intervention risk adds a unique dimension to any JPY cross.",
        finding: "The key risk for GBP/JPY longs is Bank of Japan intervention. If USD/JPY approaches 155+, the BoJ has historically stepped in to strengthen the yen, which would cause a sharp sell-off in all JPY crosses including GBP/JPY. Currently, geopolitical risk-off flows are supporting JPY strength, capping GBP/JPY upside.",
        signal: "warn" },
    ],
    bottomLine: "This is not a conviction trade. Both legs are bearish, the options picture is mixed, and sentiment is balanced. If you trade this, treat it as a carry play: hold longs for the interest rate differential but keep size small. The range of 188-192 looks like fair value. Only get aggressive if USD/JPY breaks above 155 (which would rocket all JPY crosses) or if the BoJ intervenes (which would crash them).",
    riskLevel: 2,
  },
  BTCUSD: {
    verdict: "Bullish w/ Caution",
    verdictColor: T.green,
    summary: "Institutional money is positioned long, the options market is heavily call-skewed, and fear/greed hasn't hit greed extremes yet. But the basis trade creates noise.",
    layers: [
      { title: "What the big players are doing", icon: "cot", color: T.purple,
        explain: "Bitcoin CME futures represent institutional positioning — hedge funds, family offices, and ETF providers. Asset managers going long here reflects real institutional adoption, not just speculation.",
        finding: "Asset managers are net-long on CME — a genuine bullish signal from the slowest, most risk-averse institutional money. Leveraged funds are net-short, but this is mostly the cash-and-carry basis trade: they buy spot BTC (or ETF shares) and short futures to capture the premium. It's not directional bearishness — it's an arbitrage strategy.",
        signal: "bull" },
      { title: "What retail traders are doing", icon: "sentiment", color: T.amber,
        explain: "Crypto retail sentiment tends to be more volatile than forex. A 65% long reading is moderately crowded but hasn't reached the 75%+ extremes that typically precede major corrections.",
        finding: "65% of retail is long — approaching the contrarian warning zone but not there yet. The Fear & Greed Index at 62 (Greed) confirms moderate optimism without euphoria. Historically, BTC corrections start when retail hits 75%+ long and Fear & Greed exceeds 80.",
        signal: "info" },
      { title: "What the options market is saying", icon: "options", color: T.blue,
        explain: "Bitcoin options are particularly telling because the market is dominated by sophisticated traders. The put/call ratio and where open interest clusters reveals where smart money expects price to be at expiry.",
        finding: "Put/call ratio at 0.48 is strongly bullish — nearly twice as many calls as puts. The standout number: 38,500 contracts of call open interest at the $100,000 strike. That's a massive institutional bet on BTC reaching $100K. Max pain at $82,000 means short-term pullback risk to that level, but the medium-term skew is overwhelmingly bullish.",
        signal: "bull" },
      { title: "Today's order flow levels", icon: "flow", color: T.cyan,
        explain: "Bitcoin doesn't have traditional FX option expiries, but CME futures expiry dates and large OTC options (Deribit) create similar magnet effects around key strikes.",
        finding: "The $85,000 level has significant call OI acting as near-term resistance. A clean break above opens the path toward $90,000 (next call cluster). On the downside, $80,000 has mixed OI and $75,000 has heavy put support — that's your floor. The geopolitical risk-off environment actually helps BTC as a 'digital gold' narrative gains traction.",
        signal: "bull" },
    ],
    bottomLine: "Three out of four tools point bullish — institutional longs, heavily call-skewed options, and the $100K call OI target. Retail is only moderately long (room to run). The trade: buy dips toward $82,000 (max pain) with targets at $90,000 and $100,000. The main risk is a broad risk-off liquidation event — crypto still correlates with risk assets during panic selling. Keep stops below $75,000 (the put support wall).",
    riskLevel: 4,
  }
};

const Tip = ({ text }) => (
  <div style={{ fontSize: 12, color: T.textM, lineHeight: 1.7, padding: "10px 14px", background: T.bg, borderRadius: 8, borderLeft: `3px solid ${T.purple}`, marginBottom: 14 }}>
    <span style={{ fontSize: 10, fontWeight: 600, color: T.purple, textTransform: "uppercase", letterSpacing: 0.8 }}>How to read this </span><br/>{text}
  </div>
);

const VOL_DATA = {
  vix: { current: 21.17, prev: 19.49, change: +1.68, pctChg: +8.6, avg30d: 24.77, high30d: 31.65, low30d: 18.83, regime: "Elevated" },
  instruments: {
    XAUUSD: {
      cvol: 28.4, cvol1w: 26.3, cvol1m: 22.1, cvol3m: 24.8,
      ivRank: 72, ivPercentile: 68,
      realizedVol: 22.6, ivPremium: 5.8,
      skew: -0.8, riskReversal25d: -1.2,
      termStructure: "Backwardation",
      volHistory: [{w:"Feb 18",iv:20.1,rv:18.4},{w:"Feb 25",iv:21.3,rv:19.2},{w:"Mar 4",iv:22.8,rv:20.5},{w:"Mar 11",iv:24.1,rv:21.8},{w:"Mar 18",iv:25.6,rv:22.1},{w:"Mar 25",iv:26.3,rv:22.0},{w:"Apr 1",iv:27.2,rv:22.4},{w:"Apr 7",iv:28.4,rv:22.6}],
      volCall: "IV rising while price rises = fear of a pullback growing. IV rank at 72 means current vol is higher than 72% of readings in the past year. The 5.8% IV premium over realized vol means options are pricing in more risk than what's actually happening — expect mean reversion or a vol event.",
    },
    GBPUSD: {
      cvol: 12.8, cvol1w: 11.4, cvol1m: 10.2, cvol3m: 9.8,
      ivRank: 58, ivPercentile: 52,
      realizedVol: 10.1, ivPremium: 2.7,
      skew: +0.4, riskReversal25d: +0.6,
      termStructure: "Contango",
      volHistory: [{w:"Feb 18",iv:9.8,rv:8.6},{w:"Feb 25",iv:10.1,rv:8.9},{w:"Mar 4",iv:10.4,rv:9.2},{w:"Mar 11",iv:10.8,rv:9.5},{w:"Mar 18",iv:11.2,rv:9.8},{w:"Mar 25",iv:11.4,rv:10.0},{w:"Apr 1",iv:12.1,rv:10.0},{w:"Apr 7",iv:12.8,rv:10.1}],
      volCall: "IV rising steadily from 9.8% to 12.8% over 8 weeks — market is pricing in increasing uncertainty for GBP. Positive risk reversal (+0.6) means puts are more expensive than calls = bearish skew. Contango term structure means longer-dated options are pricier than short-term — market expects vol to stay elevated.",
    },
    GBPJPY: {
      cvol: 14.2, cvol1w: 13.1, cvol1m: 11.8, cvol3m: 12.4,
      ivRank: 45, ivPercentile: 40,
      realizedVol: 12.8, ivPremium: 1.4,
      skew: -0.2, riskReversal25d: -0.3,
      termStructure: "Flat",
      volHistory: [{w:"Feb 18",iv:11.2,rv:10.8},{w:"Feb 25",iv:11.5,rv:11.0},{w:"Mar 4",iv:12.0,rv:11.4},{w:"Mar 11",iv:12.4,rv:11.8},{w:"Mar 18",iv:12.8,rv:12.0},{w:"Mar 25",iv:13.1,rv:12.2},{w:"Apr 1",iv:13.6,rv:12.5},{w:"Apr 7",iv:14.2,rv:12.8}],
      volCall: "IV rank at 45 — middling. The small IV premium (1.4%) means options aren't pricing in much more risk than what's realized. Flat term structure = no expectation of vol change. This is consistent with a range-bound, carry trade environment. BoJ intervention risk is the vol wildcard — if triggered, expect a spike to 25%+.",
    },
    BTCUSD: {
      cvol: 62.5, cvol1w: 58.2, cvol1m: 55.0, cvol3m: 52.1,
      ivRank: 38, ivPercentile: 35,
      realizedVol: 54.8, ivPremium: 7.7,
      skew: -2.1, riskReversal25d: -3.4,
      termStructure: "Contango",
      volHistory: [{w:"Feb 18",iv:50.2,rv:48.1},{w:"Feb 25",iv:52.8,rv:49.5},{w:"Mar 4",iv:54.1,rv:50.8},{w:"Mar 11",iv:55.0,rv:51.2},{w:"Mar 18",iv:56.8,rv:52.4},{w:"Mar 25",iv:58.2,rv:53.1},{w:"Apr 1",iv:60.1,rv:54.0},{w:"Apr 7",iv:62.5,rv:54.8}],
      volCall: "Despite 62.5% IV seeming high, IV rank is only 38 — meaning crypto vol has been higher 62% of the time in the past year. The -3.4 risk reversal means calls are significantly pricier than puts = strong bullish skew. Contango term structure means the market expects vol to remain elevated or increase — big moves expected.",
    }
  }
};

const STRATEGY_RULES = [
  { id: 1, name: "COT Divergence", desc: "Price trending opposite to spec net position changes — distribution or accumulation signal", weight: 3, category: "positioning" },
  { id: 2, name: "Retail Extreme", desc: "Retail >70% one direction = contrarian signal opposite direction", weight: 2, category: "sentiment" },
  { id: 3, name: "Commercial Confirmation", desc: "Commercials increasing hedges confirms trend strength behind the move", weight: 2, category: "positioning" },
  { id: 4, name: "Managed Money Momentum", desc: "Managed money adding in trend direction = continuation signal", weight: 2, category: "positioning" },
  { id: 5, name: "OI Expansion", desc: "Rising OI + rising price = new money confirming trend. Falling OI = profit taking", weight: 1, category: "positioning" },
  { id: 6, name: "Sentiment Flush", desc: "Rapid sentiment shift (>15% in a week) = exhaustion / reversal zone", weight: 3, category: "sentiment" },
  { id: 7, name: "Option Expiry Magnet", desc: "Large NY-cut expiries act as price magnets — spot gravitates toward strike pre-10AM ET", weight: 2, category: "orderflow" },
  { id: 8, name: "Strike + Tech Confluence", desc: "Expiry strike aligns with key MA or S/R = amplified magnet zone, highest probability setup", weight: 3, category: "orderflow" },
  { id: 9, name: "Post-Expiry Release", desc: "After 10AM NY cut, magnet dissolves — breakout/breakdown setups post-cut", weight: 2, category: "orderflow" },
  { id: 10, name: "Vol Regime Filter", desc: "During high-vol events, option expiry magnet effect is weakened — reduce sizing", weight: 1, category: "orderflow" },
  { id: 11, name: "Put/Call Ratio Extreme", desc: "PCR >1.3 = excessive bearish bets (contrarian bullish). PCR <0.5 = excessive bullish bets (contrarian bearish)", weight: 3, category: "options" },
  { id: 12, name: "Max Pain Gravity", desc: "Price gravitates toward max pain strike near monthly expiry — market makers hedge to pin price at max loss for option holders", weight: 2, category: "options" },
  { id: 13, name: "OI Cluster Walls", desc: "High open interest at specific strikes creates S/R walls. Call walls = resistance, put walls = support", weight: 2, category: "options" },
  { id: 14, name: "IV Spike + OI Surge", desc: "Rising implied volatility + rising OI = big move expected. Direction indicated by put/call skew", weight: 3, category: "options" },
  { id: 15, name: "IV Rank Extreme", desc: "IV rank >80 = vol historically high, expect mean reversion (sell vol). IV rank <20 = vol historically cheap (buy vol/expect breakout)", weight: 3, category: "volatility" },
  { id: 16, name: "IV-RV Premium Unwind", desc: "When IV premium over realized vol exceeds 8%, options are overpriced — expect vol crush. Position for range-bound price action.", weight: 2, category: "volatility" },
  { id: 17, name: "Term Structure Inversion", desc: "Backwardation (near > far IV) = imminent fear event. Contango = gradual risk buildup. Inversion flips signal regime change.", weight: 3, category: "volatility" },
  { id: 18, name: "VIX Regime Filter", desc: "VIX >25 = high-vol regime (reduce position size, widen stops). VIX <15 = low-vol (tighten stops, expect range). VIX 15-25 = normal trading.", weight: 2, category: "volatility" },
  { id: 19, name: "Risk Reversal Divergence", desc: "When 25-delta risk reversal diverges from price direction, options market is pricing a reversal before it shows in spot. Early warning.", weight: 3, category: "volatility" },
];

const fmt = (n, d = 0) => { if (typeof n !== "number") return n; if (Math.abs(n) >= 1e6) return (n/1e6).toFixed(1)+"M"; if (Math.abs(n) >= 1e3) return (n/1e3).toFixed(d > 0 ? d : 1)+"K"; return n.toFixed(d); };
const SignalIcon = ({ type }) => { const props = { size: 14 }; if (type === "bull") return <TrendingUp {...props} style={{ color: T.green }} />; if (type === "bear") return <TrendingDown {...props} style={{ color: T.red }} />; if (type === "warn") return <AlertTriangle {...props} style={{ color: T.amber }} />; return <Activity {...props} style={{ color: T.blue }} />; };
const SigBg = t => t==="bull"?T.greenBg:t==="bear"?T.redBg:t==="warn"?T.amberBg:T.blueBg;
const SigBd = t => t==="bull"?T.greenBd:t==="bear"?T.redBd:t==="warn"?T.amberBd:T.blueBd;

const GaugeBar = ({ longPct, shortPct, label }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 11, color: T.textD, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>}
    <div style={{ display: "flex", height: 24, borderRadius: 12, overflow: "hidden", background: T.bg }}>
      <div style={{ width: `${longPct}%`, background: `linear-gradient(90deg, ${T.green}, #059669)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#fff" }}>{longPct}% L</div>
      <div style={{ width: `${shortPct}%`, background: `linear-gradient(90deg, #dc2626, ${T.red})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#fff" }}>{shortPct}% S</div>
    </div>
  </div>
);

const MetricCard = ({ label, value, sub, subColor, icon: Icon }) => (
  <div style={{ background: T.bg2, borderRadius: 10, padding: "14px 16px", border: `1px solid ${T.border}` }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
      <span style={{ fontSize: 11, color: T.textD, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</span>
      {Icon && <Icon size={14} style={{ color: T.textD }} />}
    </div>
    <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, marginTop: 3, color: subColor || T.textM }}>{sub}</div>}
  </div>
);

const VIEWS = ["overview", "intelligence", "marketintel", "tradelab"];
const VIEW_LABELS = {
  overview: "Overview", intelligence: "Chart Terminal", marketintel: "Market Intel",
  tradelab: "Trade Lab",
};
const VIEW_ICONS = {
  overview: Activity, intelligence: Crosshair, marketintel: Brain,
  tradelab: Zap,
};

export default function TradingDashboard() {
  if (typeof window !== "undefined" && !window.storage) {
    window.storage = {
      get: async (k) => ({ value: localStorage.getItem(k) }),
      set: async (k, v) => localStorage.setItem(k, v)
    };
  }
  const [view, setView] = useState("intelligence");
  const [sel, setSel] = useState("XAUUSD");
  const [intelData, setIntelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRef, setLastRef] = useState(null);
  const [userTrades, setUserTrades] = useState([]);

  const handleExecuteTrade = (tradeData) => {
    const newTrade = {
      ...tradeData,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      status: "OPEN"
    };
    setUserTrades([newTrade, ...userTrades]);
    alert(`Trade Executed: ${tradeData.dir} ${tradeData.instr} @ ${tradeData.entry}`);
  };

  const [journal, setJournal] = useState([]);
  const [newE, setNewE] = useState({ instrument: "XAUUSD", direction: "Long", notes: "", confidence: 3 });
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [optData, setOptData] = useState(null);
  const [optLoading, setOptLoading] = useState(false);
  const [liveData, setLiveData] = useState({});
  const [livePulse, setLivePulse] = useState(false);
  const [cotLive, setCotLive] = useState(null);
  const [cotLoading, setCotLoading] = useState(false);
  const [posTab, setPosTab] = useState("overview");
  const [labTab, setLabTab] = useState("scanner");


  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/prices");
      const json = await res.json();
      if (json.data) {
        setLiveData(json.data);
        setLivePulse(p => !p);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, 15000);
    return () => clearInterval(id);
  }, [fetchPrices]);

  // Fetch intelligence data lazily (used by AI tools + overview)
  useEffect(() => {
    if (!intelData) {
      fetch("/api/intelligence")
        .then(r => r.json())
        .then(data => setIntelData(data))
        .catch(() => {});
    }
  }, [intelData]);

  // Fetch live COT data when Market Intel view is opened
  useEffect(() => {
    if (view === "marketintel" && !cotLive && !cotLoading) {
      setCotLoading(true);
      fetch("/api/cot")
        .then(r => r.json())
        .then(data => { setCotLive(data); setCotLoading(false); })
        .catch(() => setCotLoading(false));
    }
  }, [view, cotLive, cotLoading]);


  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get("tj-v4"); if (r?.value) setJournal(JSON.parse(r.value)); } catch {}
      try { const r = await window.storage.get("ai-v4"); if (r?.value) setAiData(JSON.parse(r.value)); } catch {}
      try { const r = await window.storage.get("opt-v4"); if (r?.value) setOptData(JSON.parse(r.value)); } catch {}
      try { const r = await window.storage.get("lr-v4"); if (r?.value) setLastRef(r.value); } catch {}
      setLoading(false);
    })();
  }, []);

  const saveJ = async j => { setJournal(j); try { await window.storage.set("tj-v4", JSON.stringify(j)); } catch {} };
  const addE = async () => { if (!newE.notes.trim()) return; await saveJ([{ ...newE, id: Date.now(), timestamp: new Date().toISOString(), status: "Open" }, ...journal]); setNewE({ instrument: "XAUUSD", direction: "Long", notes: "", confidence: 3 }); };

  const geminiCall = async (prompt) => {
    const res = await fetch("/api/ai/analyze", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    return (data.text || "").replace(/```json|```/g, "").trim();
  };

  const fetchOpt = async () => {
    setOptLoading(true);
    try {
      const i = liveInstruments[sel];
      const oi = OPTIONS_OI.instruments[sel];
      const raw = await geminiCall(`You are an FX options analyst. Using only the data below, summarize today's key option expiry levels and their significance.

Instrument: ${i.name}
Put/Call Ratio: ${oi.putCallRatio || "N/A"}
Max Pain Strike: ${oi.maxPainStrike || "N/A"}
Top Strikes: ${JSON.stringify(oi.topStrikes || [])}
Options Signal: ${oi.signal || "N/A"}

Return ONLY valid JSON (no markdown):
{"date":"${new Date().toLocaleDateString()}","entries":[{"pair":"${i.name}","strike":"level","notional":"significance level","significance":"high/medium/low","notes":"why this level matters"}],"marketContext":"2 sentence summary"}`);
      let p; try { p = JSON.parse(raw); } catch { p = { date: new Date().toLocaleDateString(), entries: [], marketContext: raw.slice(0, 300) }; }
      setOptData(p); const now = new Date().toISOString(); setLastRef(now);
      try { await window.storage.set("opt-v4", JSON.stringify(p)); await window.storage.set("lr-v4", now); } catch {}
    } catch (e) { setOptData({ date: "Error", entries: [], marketContext: e.message }); }
    setOptLoading(false);
  };

  const runAi = async () => {
    setAiLoading(true);
    try {
      const i = liveInstruments[sel];
      const oi = OPTIONS_OI.instruments[sel];
      const vol = VOL_DATA.instruments[sel];
      const staticSignals = INSTRUMENTS[sel].signals.map(s => `[${s.type.toUpperCase()}] ${s.text}`).join("\n");

      // Fetch live technical data from the platform's intelligence engine
      let techData = "";
      try {
        const techRes = await fetch("/api/intelligence");
        const techJson = await techRes.json();
        const d = techJson?.instruments?.[sel];
        if (d && !d.error) {
          const sig = d.signal;
          techData = `
LIVE TECHNICAL ANALYSIS (platform-generated):
- Trend: ${d.trend} | Structure: ${d.structure}
- RSI(14): ${d.rsi} | MACD: ${d.macd?.cross || "none"}, Histogram: ${d.macd?.histogram?.toFixed(4)}
- SMA20: ${d.sma?.sma20} | SMA50: ${d.sma?.sma50}
- Support: ${d.support?.join(", ")} | Resistance: ${d.resistance?.join(", ")}
- ATR: ${d.atr}
${sig ? `- Signal: ${sig.direction} @ ${sig.entry} | SL: ${sig.sl} | TP1: ${sig.tp1} | Confidence: ${sig.confidence}%` : "- No active signal"}`;
        }
      } catch {}

      const prompt = `You are an institutional FX/commodity trading analyst. Synthesize the platform data below to generate a precise, actionable trading signal for ${i.name}. Use ONLY the data provided — do not reference external sources.

LIVE MARKET DATA:
- Price: ${priceStr(i)} (${i.change > 0 ? "+" : ""}${i.change}% daily change)
${techData}

COT POSITIONING (${i.cot.date}):
- Net speculator position: ${i.cot.netSpec ? fmt(i.cot.netSpec) + " contracts" : i.cot.crossBias || "N/A"}
- Previous week net: ${i.cot.prevNet ? fmt(i.cot.prevNet) + " contracts" : "N/A"}
- Managed money: ${i.cot.managedMoney ? fmt(i.cot.managedMoney) + " net" : "N/A"}

RETAIL SENTIMENT:
- ${i.sentiment.retailLong}% retail long / ${i.sentiment.retailShort}% retail short

OPTIONS DATA:
- Put/call ratio: ${oi.putCallRatio || "N/A"} | Max pain: ${oi.maxPainStrike || "N/A"}
- IV 30d: ${vol.cvol || "N/A"}% | Risk reversal: ${vol.riskReversal25d || "N/A"}
- Options signal: ${oi.signal || "N/A"}

VIX: ${VOL_DATA.vix.current} (${VOL_DATA.vix.regime} regime)

PLATFORM INTERNAL SIGNALS:
${staticSignals}

Return ONLY valid JSON (no markdown):
{"summary":"3-4 sentence synthesis","bias":"Bullish|Bearish|Neutral","confidence":1-10,"cotUpdate":"COT summary","sentimentUpdate":"retail sentiment note","optionFlowUpdate":"options note","optionsOIUpdate":"PCR and max pain note","entryZone":"price range","target":"price target","stopLoss":"stop loss price","riskReward":"e.g. 1:2.4","validFor":"timeframe","keyLevels":{"support":"price","resistance":"price"},"catalysts":["key risk events"]}`;

      const raw = await geminiCall(prompt);
      let p; try { p = JSON.parse(raw); } catch { p = { summary: raw.slice(0, 400), bias: "Neutral", confidence: 3 }; }
      p.instrument = sel; setAiData(p); const now = new Date().toISOString(); setLastRef(now);
      try { await window.storage.set("ai-v4", JSON.stringify(p)); await window.storage.set("lr-v4", now); } catch {}
    } catch (e) { setAiData({ summary: "Analysis failed: " + e.message, bias: "Neutral", confidence: 0 }); }
    setAiLoading(false);
  };

  // Signals (DB-backed)
  const [signals, setSignals] = useState([]);
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [closeForm, setCloseForm] = useState(null); // { id, exitPrice }
  const [newSig, setNewSig] = useState({ instrument: "XAUUSD", direction: "Long", entryPrice: "", targetPrice: "", stopLoss: "", confidence: 7, notes: "", bias: "Neutral" });

  const fetchSignals = useCallback(async () => {
    try {
      const res = await fetch("/api/signals");
      const json = await res.json();
      if (json.signals) setSignals(json.signals);
    } catch {}
  }, []);

  useEffect(() => { fetchSignals(); }, [fetchSignals]);

  const createSignal = async (data) => {
    setSignalsLoading(true);
    try {
      const res = await fetch("/api/signals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (json.signal) setSignals(prev => [json.signal, ...prev]);
    } catch {}
    setSignalsLoading(false);
  };

  const closeSignal = async (id, exitPrice) => {
    try {
      const res = await fetch(`/api/signals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CLOSED", exitPrice }) });
      const json = await res.json();
      if (json.signal) setSignals(prev => prev.map(s => s.id === id ? json.signal : s));
    } catch {}
    setCloseForm(null);
  };

  const deleteSignal = async (id) => {
    try {
      await fetch(`/api/signals/${id}`, { method: "DELETE" });
      setSignals(prev => prev.filter(s => s.id !== id));
    } catch {}
  };

  const calcPnL = (sig, livePrices) => {
    const currentPrice = sig.status === "CLOSED" ? sig.exitPrice : (livePrices[sig.instrument]?.price || sig.entryPrice);
    if (!currentPrice || !sig.entryPrice) return null;
    const raw = ((currentPrice - sig.entryPrice) / sig.entryPrice) * 100;
    return sig.direction === "Long" ? raw : -raw;
  };

  const liveInstruments = Object.fromEntries(
    Object.entries(INSTRUMENTS).map(([key, val]) => [
      key,
      liveData[key] ? { ...val, price: liveData[key].price, change: liveData[key].change } : val,
    ])
  );
  const inst = liveInstruments[sel];
  const isLive = Object.keys(liveData).length > 0;
  const s = {
    root: { height: "100vh", display: "flex", flexDirection: "column", background: T.bg, color: T.text, fontFamily: "var(--font-maven-pro), sans-serif", overflow: "hidden" },
    hdr: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px clamp(16px, 4vw, 24px)", borderBottom: `1px solid ${T.border}`, background: T.bg2, flexWrap: "wrap", gap: 10, flexShrink: 0 },
    nav: { display: "flex", gap: 2, padding: "0 clamp(16px, 4vw, 24px)", background: T.bg2, borderBottom: `1px solid ${T.border}`, overflowX: "auto", scrollbarWidth: "none", flexShrink: 0 },
    ni: a => ({ padding: "11px 14px", fontSize: 12, fontWeight: a ? 600 : 400, color: a ? T.accent : T.textM, cursor: "pointer", border: "none", background: "none", borderBottom: a ? `2px solid ${T.accent}` : "2px solid transparent", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }),
    ib: { display: "flex", gap: 6, padding: "12px 24px", flexWrap: "wrap" },
    ic: a => ({ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", border: `1px solid ${a ? T.accent : T.border}`, background: a ? T.purpleBg : T.bg2, color: a ? T.accent : T.textM }),
    mn: { padding: "clamp(12px, 3vw, 24px)", width: "100%", boxSizing: "border-box" },
    g4: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: 12, marginBottom: 18 },
    g2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 450px), 1fr))", gap: 14, marginBottom: 18 },
    cd: { background: T.bg2, borderRadius: 12, padding: 18, border: `1px solid ${T.border}` },
    ct: { fontSize: 12, fontWeight: 600, color: T.textM, marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.8, display: "flex", alignItems: "center", gap: 8 },
    tb: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
    th: { textAlign: "left", color: T.textD, fontWeight: 400, padding: "5px 8px", fontSize: 11, borderBottom: `1px solid ${T.border}`, textTransform: "uppercase", letterSpacing: 0.4 },
    td: { padding: "7px 8px", borderBottom: `1px solid ${T.border}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 },
    sr: t => ({ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 13px", borderRadius: 8, background: SigBg(t), border: `1px solid ${SigBd(t)}`, marginBottom: 7, fontSize: 13, lineHeight: 1.5 }),
    btn: (bg, c) => ({ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", background: bg, color: c, border: "none", display: "flex", alignItems: "center", gap: 6 }),
  };

  if (loading) return (<div style={{ ...s.root, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ textAlign: "center" }}><RefreshCw size={28} style={{ color: T.accent, animation: "spin 1s linear infinite" }} /><div style={{ marginTop: 10, color: T.textM, fontSize: 13 }}>Loading...</div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div></div>);

  const priceStr = i => ["XAUUSD","BTCUSD"].includes(i.name) ? `$${i.price.toLocaleString()}` : i.price.toFixed(i.name === "GBPJPY" ? 2 : 4);

  const renderCharts = () => {
    if (!intelData || !intelData.instruments[sel]) return (
      <div style={{ height: 500, display: "flex", alignItems: "center", justifyContent: "center", color: T.textD }}>
        <RefreshCw size={24} style={{ animation: "spin 2s linear infinite", marginRight: 10 }} />
        Synchronizing Chart Engine...
      </div>
    );

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <AdvancedChart 
            instrumentKey={sel} 
            data={intelData.instruments[sel]} 
            news={intelData.news}
          />
          {/* Bottom stats row for charts view */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "Trend", value: intelData.instruments[sel].trend, icon: <TrendingUp size={14}/>, color: T.purple },
              { label: "RSI", value: intelData.instruments[sel].rsi, icon: <Activity size={14}/>, color: T.cyan },
              { label: "ATR", value: intelData.instruments[sel].atr?.toFixed(4), icon: <Layers size={14}/>, color: T.textM },
              { label: "Structure", value: intelData.instruments[sel].structure, icon: <Zap size={14}/>, color: T.amber },
            ].map(s => (
              <div key={s.label} style={{ background: T.bg2, padding: "12px 16px", borderRadius: 12, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ color: s.color }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: T.textD, textTransform: "uppercase" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <TradePanel 
            selectedInstrument={sel} 
            instrumentData={intelData.instruments[sel]} 
            onExecute={(data) => handleExecuteTrade({ ...data, instr: sel })}
          />
        </div>
      </div>
    );
  };

  const renderOverview = () => (<>
    <div style={s.g4}>{Object.values(liveInstruments).map(i => (
      <div key={i.name} onClick={() => { setSel(i.name); setView("cot"); }} style={{ ...s.cd, cursor: "pointer", borderColor: sel === i.name ? T.accent : T.border }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 14, fontWeight: 700 }}>{i.name}</span><span style={{ fontSize: 11, color: T.textD }}>{i.label}</span></div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>{priceStr(i)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: i.change > 0 ? T.green : T.red }}>{i.change > 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}{i.change > 0 ? "+" : ""}{i.change}%</div>
        <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 11 }}><span style={{ color: T.textD }}>Composite</span><span style={{ color: i.compositeColor, fontWeight: 600 }}>{i.composite}</span></div>
      </div>
    ))}</div>
    <div style={s.g2}>
      <div style={s.cd}>
        <div style={s.ct}><Crosshair size={14}/>Signal matrix</div>
        <table style={s.tb}><thead><tr>{["Pair","COT","Retail","Contrarian","Signal"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead><tbody>
          {Object.values(liveInstruments).map(i => { const net=i.cot.netSpec; const rl=i.sentiment.retailLong; return (
            <tr key={i.name} style={{cursor:"pointer"}} onClick={()=>{setSel(i.name);setView("cot")}}>
              <td style={{...s.td,fontWeight:600,color:T.text}}>{i.name}</td>
              <td style={{...s.td,color:net>0?T.green:net<0?T.red:T.amber}}>{net>0?"Bullish":net<0?"Bearish":(i.cot.crossBias||"Mixed")}</td>
              <td style={s.td}>{rl}%/{i.sentiment.retailShort}%</td>
              <td style={{...s.td,color:rl>65?T.red:rl<35?T.green:T.amber}}>{rl>65?"Bearish":rl<35?"Bullish":"Neutral"}</td>
              <td style={{...s.td,color:i.compositeColor,fontWeight:600}}>{i.composite}</td>
            </tr>
          );})}
        </tbody></table>
      </div>
      <div style={s.cd}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={s.ct}><Layers size={14}/>FX option expiries today</div><div style={{fontSize:10,color:T.cyan,fontWeight:600}}>NY 10AM CUT</div></div>
        <div style={{fontSize:11,color:T.textM,marginBottom:12,padding:"8px 12px",background:T.bg,borderRadius:8,borderLeft:`3px solid ${T.cyan}`,lineHeight:1.5}}>{OPTION_EXPIRIES.context}</div>
        {OPTION_EXPIRIES.entries.map((e,i) => (
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:T.bg,borderRadius:8,marginBottom:6,border:`1px solid ${e.significance==="high"?T.cyanBd:T.border}`}}>
            <div style={{minWidth:60}}><div style={{fontSize:12,fontWeight:700,color:T.cyan}}>{e.pair}</div><div style={{fontSize:10,color:T.textD}}>{e.notional}</div></div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:16,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{e.strike}</span>
                <span style={{fontSize:10,padding:"1px 6px",borderRadius:4,fontWeight:600,background:e.significance==="high"?T.cyanBg:T.amberBg,color:e.significance==="high"?T.cyan:T.amber}}>{e.significance}</span>
              </div>
              <div style={{fontSize:11,color:T.textD,marginTop:2}}>{e.techLevel}</div>
            </div>
            <Radio size={13} style={{color:e.significance==="high"?T.cyan:T.textD}}/>
          </div>
        ))}
        <div style={{marginTop:8,textAlign:"right"}}><button onClick={()=>setView("orderflow")} style={{...s.btn("transparent",T.cyan),fontSize:11,padding:"4px 10px"}}>Full order flow <ExternalLink size={11}/></button></div>
      </div>
    </div>
  </>);

  const renderPositioning = () => {
    const inst = liveInstruments[sel];
    const oo = OPTIONS_OI.instruments[sel];
    const vd = VOL_DATA.instruments[sel];
    const analysis = ANALYSIS[sel];
    const liveC = cotLive?.instruments?.[sel];

    // ── Scoring ──────────────────────────────────────────────────────────
    const cotScore = liveC?.score ?? (() => {
      const net = inst.cot.netSpec;
      if (!net) return 50;
      if (net > 100000) return 74; if (net > 50000) return 62; if (net > 0) return 55;
      if (net > -50000) return 44; if (net > -100000) return 36; return 25;
    })();

    const retailLong = inst.sentiment.retailLong;
    const sentScore = 100 - retailLong; // contrarian inversion

    const pcrScore = oo?.putCallRatio != null
      ? Math.round(Math.max(10, Math.min(90, 50 + (1.0 - oo.putCallRatio) * 38)))
      : 50;

    const combined = Math.round(cotScore * 0.35 + sentScore * 0.30 + pcrScore * 0.35);

    const getDecision = s => {
      if (s >= 68) return { label: "Strong Buy", color: T.green, bg: T.greenBg, bd: T.greenBd, dir: "BUY" };
      if (s >= 57) return { label: "Buy Bias",   color: T.green, bg: T.greenBg, bd: T.greenBd, dir: "BUY" };
      if (s >= 45) return { label: "Neutral / Wait", color: T.amber, bg: T.amberBg, bd: T.amberBd, dir: "WAIT" };
      if (s >= 34) return { label: "Sell Bias",  color: T.red,   bg: T.redBg,   bd: T.redBd,   dir: "SELL" };
      return             { label: "Strong Sell", color: T.red,   bg: T.redBg,   bd: T.redBd,   dir: "SELL" };
    };
    const decision = getDecision(combined);

    const getSentMeta = lp => {
      if (lp >= 75) return { signal:"STRONG SELL", color:T.red,   bg:T.redBg,   bd:T.redBd,   action:"Fade the crowd. Institutions are hunting stops below retail longs. Sell rallies." };
      if (lp >= 65) return { signal:"SELL BIAS",   color:T.red,   bg:T.redBg,   bd:T.redBd,   action:"Bias shorts on pullbacks. Wait for price confirmation before entering." };
      if (lp >= 55) return { signal:"MILD SELL",   color:T.amber, bg:T.amberBg, bd:T.amberBd, action:"Weak contrarian edge. Combine with COT and technicals before acting." };
      if (lp >= 45) return { signal:"NEUTRAL",     color:T.textM, bg:T.bg3,     bd:T.border,  action:"No sentiment edge. Rely on COT and price action." };
      if (lp >= 35) return { signal:"MILD BUY",    color:T.amber, bg:T.amberBg, bd:T.amberBd, action:"Slight buy bias. Confirm with structure and COT." };
      if (lp >= 25) return { signal:"BUY BIAS",    color:T.green, bg:T.greenBg, bd:T.greenBd, action:"Bias longs on dips. Retail short stops above current price = squeeze fuel." };
      return               { signal:"STRONG BUY",  color:T.green, bg:T.greenBg, bd:T.greenBd, action:"High probability long. Institutions will squeeze retail shorts upward." };
    };
    const sentMeta = getSentMeta(retailLong);

    // ── Sub-components ──────────────────────────────────────────────────
    const ScoreBar = ({ score, label, weight, pillarColor }) => {
      const c = score > 55 ? T.green : score < 45 ? T.red : T.amber;
      return (
        <div style={{ background: T.bg2, borderRadius: 12, padding: "14px 16px", border: `1px solid ${pillarColor}30` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: pillarColor, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
            <span style={{ fontSize: 10, color: T.textD, background: T.bg, borderRadius: 4, padding: "2px 6px" }}>{weight}% weight</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
            <div style={{ flex: 1, height: 8, background: T.bg, borderRadius: 4, overflow: "hidden", position: "relative" }}>
              <div style={{ position: "absolute", left: "50%", top: 0, height: "100%", width: 1, background: T.border }} />
              <div style={{ height: "100%", width: `${score}%`, background: `linear-gradient(90deg, ${score > 50 ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}, ${c})`, borderRadius: 4 }} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: c, minWidth: 40, textAlign: "right" }}>{score}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.textD }}>
            <span>BEAR (0)</span><span>NEUTRAL (50)</span><span>BULL (100)</span>
          </div>
        </div>
      );
    };

    const TabBtn = ({ id, label }) => (
      <button onClick={() => setPosTab(id)} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: posTab === id ? 700 : 500, background: posTab === id ? T.bg4 : "transparent", border: `1px solid ${posTab === id ? T.borderL : T.border}`, color: posTab === id ? T.text : T.textD, cursor: "pointer" }}>{label}</button>
    );

    // COT table rows from live or static data
    const cotGroups = (() => {
      if (liveC?.groups) {
        const g = liveC.groups;
        return Object.entries(g).map(([k, v]) => ({
          label: k === "managedMoney" ? "Managed Money" : k === "producers" ? "Producers / Merchants" : k === "swapDealers" ? "Swap Dealers" : k === "assetManagers" ? "Asset Managers" : k === "leveragedFunds" ? "Leveraged Funds" : k === "dealers" ? "Dealers / Intermediaries" : "Non-Reportable",
          long: v.long, short: v.short, net: v.net,
          color: v.net > 0 ? T.green : T.red,
        }));
      }
      // fallback static
      if (sel === "XAUUSD") return [
        { label: "Non-Commercial (Specs)", long: inst.cot.nonComm.long, short: inst.cot.nonComm.short, net: inst.cot.nonComm.long - inst.cot.nonComm.short, color: T.green },
        { label: "Commercial (Hedgers)", long: inst.cot.comm.long, short: inst.cot.comm.short, net: inst.cot.comm.long - inst.cot.comm.short, color: T.red },
        { label: "Non-Reportable", long: inst.cot.nonRep.long, short: inst.cot.nonRep.short, net: inst.cot.nonRep.long - inst.cot.nonRep.short, color: T.green },
      ];
      if (sel === "GBPUSD" || sel === "EURUSD") return [
        { label: "Asset Managers", long: inst.cot.assetMgr?.long ?? 0, short: inst.cot.assetMgr?.short ?? 0, net: (inst.cot.assetMgr?.long ?? 0) - (inst.cot.assetMgr?.short ?? 0), color: T.red },
        { label: "Leveraged Funds", long: inst.cot.leveraged?.long ?? 0, short: inst.cot.leveraged?.short ?? 0, net: (inst.cot.leveraged?.long ?? 0) - (inst.cot.leveraged?.short ?? 0), color: T.green },
        { label: "Dealers", long: inst.cot.dealer?.long ?? 0, short: inst.cot.dealer?.short ?? 0, net: (inst.cot.dealer?.long ?? 0) - (inst.cot.dealer?.short ?? 0), color: T.green },
      ];
      return [];
    })();

    const specNet = liveC?.specNet ?? inst.cot.netSpec;
    const prevNet = liveC?.prevSpecNet ?? inst.cot.prevNet;
    const weekChg = liveC?.weekChange ?? (specNet != null && prevNet != null ? specNet - prevNet : null);
    const cotDate = liveC?.date ?? inst.cot.date ?? "N/A";

    // ── Overview tab ─────────────────────────────────────────────────────
    const renderOverviewTab = () => (
      <>
        {analysis && (
          <div style={{ ...s.cd, borderColor: decision.color, borderWidth: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={s.ct}><Brain size={14} />Multi-pillar analysis — {sel}</div>
              <span style={{ padding: "4px 14px", borderRadius: 7, fontSize: 13, fontWeight: 700, background: decision.bg, color: decision.color, border: `1px solid ${decision.bd}` }}>{decision.dir}: {decision.label}</span>
            </div>
            <div style={{ fontSize: 14, color: T.text, lineHeight: 1.7, marginBottom: 20, fontStyle: "italic", padding: "12px 16px", background: T.bg, borderRadius: 10 }}>{analysis.summary}</div>
            {analysis.layers.map((l, i) => (
              <div key={i} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: l.color }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{l.title}</span>
                </div>
                <div style={{ fontSize: 12, color: T.purple, lineHeight: 1.6, padding: "8px 14px", background: `${T.purple}08`, borderRadius: 8, borderLeft: `3px solid ${T.purple}`, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, display: "block", marginBottom: 2, color: T.purple }}>How to read this</span>
                  {l.explain}
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 14px", background: SigBg(l.signal), border: `1px solid ${SigBd(l.signal)}`, borderRadius: 8 }}>
                  <div style={{ marginTop: 2 }}><SignalIcon type={l.signal} /></div>
                  <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>{l.finding}</div>
                </div>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16, marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Target size={16} style={{ color: decision.color }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: decision.color }}>Bottom line</span>
              </div>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.8, padding: "14px 18px", background: T.bg, borderRadius: 10, border: `1px solid ${decision.color}30` }}>{analysis.bottomLine}</div>
            </div>
          </div>
        )}
      </>
    );

    // ── COT tab ──────────────────────────────────────────────────────────
    const renderCOTTab = () => (
      <>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "10px 16px", background: cotLoading ? T.bg2 : liveC ? T.greenBg : T.amberBg, borderRadius: 10, border: `1px solid ${cotLoading ? T.border : liveC ? T.greenBd : T.amberBd}` }}>
          {cotLoading
            ? <><RefreshCw size={13} style={{ color: T.textD, animation: "spin 1s linear infinite" }} /><span style={{ fontSize: 12, color: T.textD }}>Fetching live CFTC data…</span></>
            : liveC
              ? <><div style={{ width: 8, height: 8, borderRadius: 4, background: T.green, animation: "pulse 2s infinite" }} /><span style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>Live CFTC data — {cotDate}</span><span style={{ fontSize: 11, color: T.textD, marginLeft: 8 }}>Socrata API · updated weekly (Friday 3:30PM ET)</span></>
              : <><div style={{ width: 8, height: 8, borderRadius: 4, background: T.amber }} /><span style={{ fontSize: 12, color: T.amber }}>Using static data — {cotDate}</span></>
          }
        </div>

        <div style={s.g4}>
          <MetricCard label="Spec net position" value={specNet != null ? fmt(specNet) : (inst.cot.crossBias || "N/A")} sub={weekChg != null ? `${weekChg > 0 ? "▲" : "▼"} ${fmt(Math.abs(weekChg))} this week` : ""} subColor={weekChg != null ? (weekChg > 0 ? T.green : T.red) : T.textM} icon={BarChart3} />
          <MetricCard label="Open interest" value={liveC?.oi ? fmt(liveC.oi) : (inst.cot.oi ? fmt(inst.cot.oi) : "Cross")} sub="total contracts" icon={Database} />
          <MetricCard label="COT score" value={cotScore} sub={cotScore >= 55 ? "Bullish lean" : cotScore <= 45 ? "Bearish lean" : "Neutral"} subColor={cotScore >= 55 ? T.green : cotScore <= 45 ? T.red : T.amber} icon={Target} />
          <MetricCard label="Data date" value={cotDate} sub="CFTC Tuesday cut" icon={Clock} />
        </div>

        <div style={s.g2}>
          <div style={s.cd}>
            <div style={s.ct}><Database size={14} />Positioning breakdown by trader group</div>
            <Tip text="Managed money / large specs = directional traders (hedge funds, CTAs). Commercials / producers = hedgers. Asset managers = slow institutional money. Dealers = market-making banks. When specs are extreme net-long, the trade is crowded." />
            {cotGroups.length > 0 ? (
              <table style={s.tb}>
                <thead><tr>{["Trader Group", "Long", "Short", "Net Position"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {cotGroups.map((g, i) => (
                    <tr key={i}>
                      <td style={s.td}>{g.label}</td>
                      <td style={{ ...s.td, color: T.green }}>{g.long.toLocaleString()}</td>
                      <td style={{ ...s.td, color: T.red }}>{g.short.toLocaleString()}</td>
                      <td style={{ ...s.td, fontWeight: 700, color: g.color }}>{g.net > 0 ? "+" : ""}{fmt(g.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              sel === "GBPJPY" ? (
                <table style={s.tb}>
                  <thead><tr>{["Leg", "Spec Net", "Direction"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    <tr><td style={s.td}>GBP</td><td style={{ ...s.td, color: T.red }}>{fmt(liveC?.gbpNet ?? inst.cot.gbpNet)}</td><td style={{ ...s.td, color: T.red }}>Bearish</td></tr>
                    <tr><td style={s.td}>JPY</td><td style={{ ...s.td, color: T.red }}>{fmt(liveC?.jpyNet ?? inst.cot.jpyNet)}</td><td style={{ ...s.td, color: T.red }}>Bearish (JPY sold)</td></tr>
                    <tr><td style={{ ...s.td, fontWeight: 600 }}>Cross bias</td><td style={{ ...s.td, color: T.amber }} colSpan={2}>{inst.cot.crossBias}</td></tr>
                  </tbody>
                </table>
              ) : null
            )}
          </div>
          <div style={s.cd}>
            <div style={s.ct}><Activity size={14} />Net spec positioning vs price</div>
            <Tip text="When purple area (spec net) diverges from the green price line — price rising but specs trimming — it's a COT divergence warning. This often precedes a reversal." />
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={inst.history}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="w" tick={{ fill: T.textD, fontSize: 10 }} />
                <YAxis yAxisId="l" tick={{ fill: T.textD, fontSize: 10 }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fill: T.textD, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11 }} />
                <Area yAxisId="l" dataKey="net" fill="rgba(139,92,246,0.12)" stroke={T.purple} strokeWidth={2} name="Net (K)" />
                <Line yAxisId="r" dataKey="price" stroke={T.green} strokeWidth={2} dot={{ r: 3, fill: T.green }} strokeDasharray="5 3" name="Price" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ ...s.cd, marginTop: 16 }}>
          <div style={s.ct}><Database size={14} />COT key concepts</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 14 }}>
            {[
              { title: "Non-Commercial (Speculators)", color: T.purple, icon: "📈", who: "Hedge funds, CTAs, prop traders", signal: "Extreme net longs = crowded. COT divergence (specs buying but price falling) = distribution warning." },
              { title: "Commercial (Hedgers)", color: T.cyan, icon: "🏭", who: "Producers, exporters, banks with real exposure", signal: "Commercials are right long-term. Extreme commercial net-long = bullish fundamentals." },
              { title: "Non-Reportable (Small Specs)", color: T.amber, icon: "👤", who: "Retail traders below reporting threshold", signal: "Dumb-money indicator. Extreme one-sidedness confirms crowded trade due for reversal." },
            ].map(g => (
              <div key={g.title} style={{ background: `${g.color}08`, borderRadius: 10, padding: "12px 14px", border: `1px solid ${g.color}25` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: g.color, marginBottom: 5 }}>{g.icon} {g.title}</div>
                <div style={{ fontSize: 11, color: T.textD, marginBottom: 5 }}><strong style={{ color: T.textM }}>Who: </strong>{g.who}</div>
                <div style={{ fontSize: 11, color: T.textM, lineHeight: 1.6, borderTop: `1px solid ${g.color}20`, paddingTop: 5 }}>{g.signal}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: T.textD, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: T.amber }} />
            CFTC releases COT every Friday 3:30 PM ET covering positions as of prior Tuesday (~3 day lag).
            <span style={{ marginLeft: "auto", color: T.purple, fontWeight: 600 }}>Latest: {cotDate}</span>
          </div>
        </div>
        <div style={{ ...s.cd, marginTop: 16 }}>
          <div style={s.ct}><Zap size={14} />COT signals — {sel}</div>
          {inst.signals.map((sig, i) => <div key={i} style={s.sr(sig.type)}><div style={{ marginTop: 2 }}><SignalIcon type={sig.type} /></div><div style={{ color: T.text }}>{sig.text}</div></div>)}
        </div>
      </>
    );

    // ── Sentiment tab ────────────────────────────────────────────────────
    const renderSentimentTab = () => (
      <>
        <div style={{ background: T.bg2, borderRadius: 12, padding: "16px 20px", border: `1px solid ${T.border}`, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: T.text }}>How retail sentiment works as a contrarian signal</div>
          <div style={{ fontSize: 12, color: T.textM, lineHeight: 1.7 }}>
            Retail traders are statistically net losers. When the crowd is heavily positioned in one direction, institutions push the other way to collect their stops.{" "}
            <strong style={{ color: T.text }}>Extremes (&gt;70% or &lt;30%) are the most actionable readings.</strong>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {[{ range: "> 70% Long", signal: "Strong Sell", color: T.red }, { range: "60–70% Long", signal: "Sell Bias", color: T.red }, { range: "45–55%", signal: "Neutral", color: T.textM }, { range: "30–40% Long", signal: "Buy Bias", color: T.green }, { range: "< 30% Long", signal: "Strong Buy", color: T.green }].map(r => (
              <div key={r.range} style={{ textAlign: "center", padding: "8px 12px", background: T.bg, borderRadius: 8, border: `1px solid ${T.border}`, minWidth: 90 }}>
                <div style={{ fontSize: 10, color: T.textD, marginBottom: 3 }}>{r.range}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.signal}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={s.cd}>
          <div style={s.ct}><Activity size={14} />Sentiment matrix — all instruments</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>{["Instrument", "Long %", "Short %", "Bar", "Signal", "Tradeable?"].map(h => <th key={h} style={{ padding: "7px 12px", textAlign: "left", fontSize: 10, fontWeight: 600, color: T.textD, textTransform: "uppercase", letterSpacing: "0.4px", whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
              <tbody>
                {Object.values(liveInstruments).map(i => {
                  const m = getSentMeta(i.sentiment.retailLong);
                  const tradeable = Math.abs(i.sentiment.retailLong - 50) > 15;
                  return (
                    <tr key={i.name} style={{ borderBottom: `1px solid ${T.border}`, cursor: "pointer" }} onClick={() => setSel(i.name)}>
                      <td style={{ padding: "10px 12px", fontWeight: 700 }}>{i.name} <span style={{ fontSize: 10, color: T.textD, fontWeight: 400 }}>{i.label}</span></td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: T.green }}>{i.sentiment.retailLong}%</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: T.red }}>{i.sentiment.retailShort}%</td>
                      <td style={{ padding: "10px 12px" }}><div style={{ width: 100, height: 8, borderRadius: 4, overflow: "hidden", background: T.bg3, display: "flex" }}><div style={{ width: `${i.sentiment.retailLong}%`, background: T.green }} /><div style={{ width: `${i.sentiment.retailShort}%`, background: T.red }} /></div></td>
                      <td style={{ padding: "10px 12px" }}><span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: m.bg, color: m.color, border: `1px solid ${m.bd}` }}>{m.signal}</span></td>
                      <td style={{ padding: "10px 12px" }}><span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: tradeable ? T.greenBg : T.bg3, color: tradeable ? T.green : T.textD, border: `1px solid ${tradeable ? T.greenBd : T.border}` }}>{tradeable ? "YES" : "WAIT"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ ...s.cd, marginTop: 16, border: `1px solid ${sentMeta.bd}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={s.ct}><Activity size={14} />Sentiment detail — {sel}</div>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 6, background: sentMeta.bg, color: sentMeta.color, border: `1px solid ${sentMeta.bd}` }}>{sentMeta.signal}</span>
          </div>
          <GaugeBar longPct={retailLong} shortPct={inst.sentiment.retailShort} label="Retail positioning" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
            <div style={{ background: sentMeta.bg, border: `1px solid ${sentMeta.bd}`, borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: sentMeta.color, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>Contrarian interpretation</div>
              <div style={{ fontSize: 12, color: T.textM, lineHeight: 1.6 }}>{retailLong >= 65 ? "Crowd is heavily long — prime fade zone. Institutions will target stops below this crowded positioning." : retailLong <= 35 ? "Crowd is heavily short — squeeze territory. Retail short stops above current price = fuel for a rally." : "No extreme reading. Use other signals as primary driver."}</div>
            </div>
            <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textD, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>Recommended action</div>
              <div style={{ fontSize: 12, color: T.textM, lineHeight: 1.6 }}>{sentMeta.action}</div>
            </div>
          </div>
          <div style={{ marginTop: 14, padding: "12px 16px", background: T.bg, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12, color: T.textM, lineHeight: 1.7 }}>
            <strong style={{ color: T.text }}>Sentiment score: </strong>{sentScore}/100 (contrarian) — {sentScore > 55 ? "Bullish contrarian lean" : sentScore < 45 ? "Bearish contrarian lean" : "No directional edge"}.
            {" "}<strong style={{ color: T.text }}>Rule:</strong> Only act on sentiment when extreme (&gt;65% or &lt;35%) AND aligned with COT direction.
          </div>
        </div>
      </>
    );

    // ── Flow / Options tab ────────────────────────────────────────────────
    const renderFlowTab = () => (
      <>
        {oo?.putCallRatio != null && (
          <>
            <div style={s.g4}>
              <MetricCard label="Put/call ratio" value={oo.putCallRatio.toFixed(2)} sub={oo.putCallRatio < 0.7 ? "Bullish skew" : oo.putCallRatio > 1.2 ? "Bearish skew" : "Neutral"} subColor={oo.putCallRatio < 0.7 ? T.green : oo.putCallRatio > 1.2 ? T.red : T.amber} icon={BarChart3} />
              <MetricCard label="Max pain strike" value={oo.maxPainStrike} sub="price magnet zone" subColor={T.amber} icon={Target} />
              <MetricCard label="30d implied vol" value={`${oo.iv30d}%`} sub={`${oo.ivChange > 0 ? "+" : ""}${oo.ivChange}% change`} subColor={oo.ivChange > 0 ? T.red : T.green} icon={Activity} />
              <MetricCard label="Options OI" value={fmt(oo.optionsOI)} sub="total contracts" icon={Layers} />
            </div>
            <div style={{ ...s.cd, marginTop: 16 }}>
              <div style={s.ct}><BarChart3 size={14} />Strike OI map — call wall / put wall</div>
              <Tip text="Call walls = resistance (sellers have protection). Put walls = support (buyers have protection). Max pain is where option writers make most profit near expiry — price gravitates here." />
              <div style={{ display: "grid", gap: 6 }}>
                {oo.topStrikes.map((st, i) => {
                  const maxOI = Math.max(...oo.topStrikes.map(x => Math.max(x.callOI, x.putOI)));
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "90px 1fr 50px 1fr 60px", alignItems: "center", gap: 8, padding: "6px 0" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", color: st.type === "maxpain" ? T.amber : st.type === "target" ? T.green : st.type === "support" ? T.blue : T.text }}>{st.strike}</div>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}><div style={{ height: 16, borderRadius: "4px 0 0 4px", background: `linear-gradient(270deg,${T.green},rgba(16,185,129,0.3))`, width: `${(st.callOI / maxOI) * 100}%`, minWidth: 2 }} /></div>
                      <div style={{ textAlign: "center", fontSize: 10, color: T.textD }}>◆</div>
                      <div><div style={{ height: 16, borderRadius: "0 4px 4px 0", background: `linear-gradient(90deg,${T.red},rgba(239,68,68,0.3))`, width: `${(st.putOI / maxOI) * 100}%`, minWidth: 2 }} /></div>
                      <div style={{ fontSize: 10, color: T.textD, textAlign: "right" }}><span style={{ color: T.green }}>{fmt(st.callOI)}</span>/<span style={{ color: T.red }}>{fmt(st.putOI)}</span></div>
                    </div>
                  );
                })}
                <div style={{ display: "flex", gap: 16, fontSize: 10, color: T.textD, marginTop: 4 }}><span><span style={{ color: T.green }}>■</span> Call OI</span><span><span style={{ color: T.red }}>■</span> Put OI</span><span><span style={{ color: T.amber }}>■</span> Max pain</span></div>
              </div>
              <div style={{ marginTop: 14, padding: "10px 14px", background: oo.putCallRatio < 0.7 ? T.greenBg : oo.putCallRatio > 1.2 ? T.redBg : T.amberBg, border: `1px solid ${oo.putCallRatio < 0.7 ? T.greenBd : oo.putCallRatio > 1.2 ? T.redBd : T.amberBd}`, borderRadius: 8, fontSize: 12, color: T.text, lineHeight: 1.6 }}>
                <strong style={{ color: oo.putCallRatio < 0.7 ? T.green : oo.putCallRatio > 1.2 ? T.red : T.amber }}>Signal: </strong>{oo.signal}
              </div>
            </div>
            <div style={{ ...s.cd, marginTop: 16 }}>
              <div style={s.ct}><Activity size={14} />Put/call ratio trend (6 weeks)</div>
              <ResponsiveContainer width="100%" height={170}>
                <LineChart data={OPTIONS_OI.pcRatioHistory}><CartesianGrid stroke={T.border} strokeDasharray="3 3" /><XAxis dataKey="w" tick={{ fill: T.textD, fontSize: 10 }} /><YAxis tick={{ fill: T.textD, fontSize: 10 }} domain={[0.3, 1.5]} /><Tooltip contentStyle={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11 }} />
                  {sel === "XAUUSD" && <Line dataKey="xau" stroke={T.green} strokeWidth={2} dot={{ r: 3 }} name="XAUUSD PCR" />}
                  {sel === "GBPUSD" && <Line dataKey="gbp" stroke={T.red} strokeWidth={2} dot={{ r: 3 }} name="GBPUSD PCR" />}
                  {sel === "BTCUSD" && <Line dataKey="btc" stroke={T.amber} strokeWidth={2} dot={{ r: 3 }} name="BTCUSD PCR" />}
                  <Line dataKey={() => 1.0} stroke={T.textD} strokeDasharray="5 5" strokeWidth={1} dot={false} name="Neutral (1.0)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
        <div style={{ ...s.cd, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={s.ct}><Layers size={14} />NY cut option expiries — {OPTION_EXPIRIES.date}</div>
            <button onClick={fetchOpt} disabled={optLoading} style={{ ...s.btn(T.accent, "#fff"), opacity: optLoading ? 0.6 : 1 }}><RefreshCw size={13} style={optLoading ? { animation: "spin 1s linear infinite" } : {}} />{optLoading ? "Fetching…" : "Refresh from InvestingLive"}</button>
          </div>
          <div style={{ fontSize: 12, color: T.textM, marginBottom: 14, padding: "10px 14px", background: T.bg, borderRadius: 8, borderLeft: `3px solid ${T.cyan}`, lineHeight: 1.6 }}><strong style={{ color: T.cyan }}>Context: </strong>{OPTION_EXPIRIES.context}</div>
          {OPTION_EXPIRIES.entries.map((e, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr auto", alignItems: "center", gap: 14, padding: "14px 16px", background: T.bg, borderRadius: 10, marginBottom: 8, border: `1px solid ${e.significance === "high" ? T.cyanBd : T.border}` }}>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: T.cyan }}>{e.pair}</div><div style={{ fontSize: 10, color: T.textD, marginTop: 2 }}>{e.notional}</div></div>
              <div><div style={{ display: "flex", alignItems: "baseline", gap: 8 }}><span style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{e.strike}</span><span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 600, background: e.significance === "high" ? T.cyanBg : T.amberBg, color: e.significance === "high" ? T.cyan : T.amber }}>{e.significance}</span></div><div style={{ fontSize: 11, color: T.textD, marginTop: 2 }}>Tech: {e.techLevel}</div></div>
              <div style={{ fontSize: 12, color: T.textM, lineHeight: 1.5 }}>{e.notes}</div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}><div style={{ width: 12, height: 12, borderRadius: 6, background: e.proximity === "close" ? T.cyan : T.amber, boxShadow: e.proximity === "close" ? `0 0 8px ${T.cyan}` : "none" }} /><span style={{ fontSize: 9, color: T.textD }}>{e.proximity}</span></div>
            </div>
          ))}
          {optData?.entries?.length > 0 && <div style={{ marginTop: 12, padding: 14, background: T.purpleBg, border: `1px solid ${T.purpleBd}`, borderRadius: 10 }}><div style={{ fontSize: 12, fontWeight: 600, color: T.accent, marginBottom: 8 }}>AI-refreshed ({optData.date})</div>{optData.entries.map((e, i) => <div key={i} style={{ fontSize: 12, color: T.text, marginBottom: 4 }}><strong>{e.pair}</strong> @ {e.strike} — {e.notes || e.significance}</div>)}{optData.marketContext && <div style={{ fontSize: 11, color: T.textM, marginTop: 8 }}>{optData.marketContext}</div>}</div>}
        </div>
        {vd && (
          <div style={{ ...s.cd, marginTop: 16 }}>
            <div style={s.ct}><Activity size={14} />Volatility dashboard — {sel}</div>
            <Tip text="IV rank tells you if vol is historically cheap or expensive. Risk reversal reveals directional skew — negative means calls are pricier (bullish), positive means puts are pricier (bearish)." />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, marginBottom: 14 }}>
              <div style={{ background: T.bg, borderRadius: 8, padding: 12, textAlign: "center" }}><div style={{ fontSize: 10, color: T.textD, textTransform: "uppercase" }}>VIX</div><div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", marginTop: 4, color: VOL_DATA.vix.current > 25 ? T.red : VOL_DATA.vix.current > 20 ? T.amber : T.green }}>{VOL_DATA.vix.current}</div><div style={{ fontSize: 10, color: VOL_DATA.vix.change > 0 ? T.red : T.green, marginTop: 2 }}>{VOL_DATA.vix.regime}</div></div>
              <div style={{ background: T.bg, borderRadius: 8, padding: 12, textAlign: "center" }}><div style={{ fontSize: 10, color: T.textD, textTransform: "uppercase" }}>30d IV</div><div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", marginTop: 4, color: T.text }}>{vd.cvol}%</div><div style={{ fontSize: 10, color: T.textD, marginTop: 2 }}>1w: {vd.cvol1w}% · 1m: {vd.cvol1m}%</div></div>
              <div style={{ background: T.bg, borderRadius: 8, padding: 12, textAlign: "center" }}><div style={{ fontSize: 10, color: T.textD, textTransform: "uppercase" }}>IV Rank</div><div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", marginTop: 4, color: vd.ivRank > 70 ? T.red : vd.ivRank > 40 ? T.amber : T.green }}>{vd.ivRank}</div><div style={{ fontSize: 10, color: T.textD, marginTop: 2 }}>pctile: {vd.ivPercentile}</div></div>
              <div style={{ background: T.bg, borderRadius: 8, padding: 12, textAlign: "center" }}><div style={{ fontSize: 10, color: T.textD, textTransform: "uppercase" }}>25d RR</div><div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", marginTop: 4, color: vd.riskReversal25d < 0 ? T.green : T.red }}>{vd.riskReversal25d > 0 ? "+" : ""}{vd.riskReversal25d}</div><div style={{ fontSize: 10, color: T.textD, marginTop: 2 }}>{vd.riskReversal25d < 0 ? "Calls pricier" : "Puts pricier"}</div></div>
            </div>
            <div style={{ padding: "12px 16px", background: vd.ivRank > 70 ? T.redBg : vd.ivRank > 50 ? T.amberBg : T.greenBg, border: `1px solid ${vd.ivRank > 70 ? T.redBd : vd.ivRank > 50 ? T.amberBd : T.greenBd}`, borderRadius: 8, fontSize: 13, color: T.text, lineHeight: 1.7 }}>
              <strong style={{ color: vd.ivRank > 70 ? T.red : vd.ivRank > 50 ? T.amber : T.green }}>Volatility call: </strong>{vd.volCall}
            </div>
          </div>
        )}
        <div style={{ marginTop: 14, fontSize: 11, color: T.textD, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <ExternalLink size={12} /> Sources: <a href="https://investinglive.com/Orders" target="_blank" rel="noopener" style={{ color: T.cyan, textDecoration: "none" }}>InvestingLive (formerly ForexLive)</a> · <a href="https://www.cmegroup.com/tools-information/quikstrike/open-interest-heatmap.html" target="_blank" rel="noopener" style={{ color: T.blue, textDecoration: "none" }}>CME OI Heatmap</a>
        </div>
      </>
    );

    // ── Main render ───────────────────────────────────────────────────────
    return (
      <>
        {/* Decision banner */}
        <div style={{ background: T.bg2, borderRadius: 14, padding: "18px 22px", border: `1px solid ${decision.bd}`, marginBottom: 20, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, color: T.textD, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Combined conviction score — {sel}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 48, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", color: decision.color, lineHeight: 1 }}>{combined}</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: decision.color }}>{decision.label}</div>
                <div style={{ fontSize: 12, color: T.textD, marginTop: 2 }}>out of 100 · weighted 35/30/35</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[{ label: "COT", score: cotScore, w: "35%" }, { label: "Sentiment", score: sentScore, w: "30%" }, { label: "Options/Flow", score: pcrScore, w: "35%" }].map(p => {
              const c = p.score > 55 ? T.green : p.score < 45 ? T.red : T.amber;
              return (
                <div key={p.label} style={{ textAlign: "center", padding: "10px 16px", background: T.bg, borderRadius: 10, border: `1px solid ${T.border}`, minWidth: 80 }}>
                  <div style={{ fontSize: 10, color: T.textD, marginBottom: 3 }}>{p.label} · {p.w}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: c }}>{p.score}</div>
                  <div style={{ fontSize: 9, color: c, textTransform: "uppercase", marginTop: 1 }}>{p.score > 55 ? "Bull" : p.score < 45 ? "Bear" : "Neutral"}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Score bars */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
          <ScoreBar score={cotScore} label="COT Positioning" weight={35} pillarColor={T.purple} />
          <ScoreBar score={sentScore} label="Retail Sentiment" weight={30} pillarColor={T.amber} />
          <ScoreBar score={pcrScore} label="Options / Flow" weight={35} pillarColor={T.blue} />
        </div>

        {/* Sub-tab nav */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <TabBtn id="overview" label="Combined Analysis" />
          <TabBtn id="cot" label="COT Data" />
          <TabBtn id="sentiment" label="Retail Sentiment" />
          <TabBtn id="flow" label="Options & Flow" />
        </div>

        {posTab === "overview" && renderOverviewTab()}
        {posTab === "cot" && renderCOTTab()}
        {posTab === "sentiment" && renderSentimentTab()}
        {posTab === "flow" && renderFlowTab()}
      </>
    );
  };

  const renderCOT = () => (<>

    {/* ── COT Education Banner ── */}
    <div style={{ background: T.bg2, borderRadius: 14, padding: "18px 22px", border: `1px solid ${T.border}`, marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <Database size={16} style={{ color: T.purple }} /> What is the COT Report?
      </div>
      <div style={{ fontSize: 12, color: T.textM, lineHeight: 1.8, marginBottom: 14 }}>
        The <strong style={{ color: T.text }}>Commitments of Traders (COT)</strong> report is published every Friday by the <strong style={{ color: T.text }}>U.S. Commodity Futures Trading Commission (CFTC)</strong>. It shows how the three major trader groups are positioned in futures markets as of the prior Tuesday. This is institutional-grade positioning data — the same information used by hedge funds and proprietary trading desks worldwide.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
        {[
          { title: "Non-Commercial (Speculators)", color: T.purple, icon: "📈",
            who: "Hedge funds, CTAs, prop traders, large retail operators", motive: "Pure profit — they have no underlying exposure to hedge", signal: "When net-long > 80% of historical range = crowded trade. Price often reverses against them. COT divergence (specs buying but price falling) = bearish warning.", bgColor: `${T.purple}08` },
          { title: "Commercial (Hedgers)", color: T.cyan, icon: "🏭",
            who: "Producers, exporters, importers, banks — entities with real exposure", motive: "Risk management — they take the opposite side of their real-world business risk", signal: "Commercials are long when they fear price will rise, short when they fear a fall. They're usually correct over the long-term. Extreme commercial net-long = bullish fundamentals.", bgColor: `${T.cyan}08` },
          { title: "Non-Reportable (Small Specs)", color: T.amber, icon: "👤",
            who: "Retail traders and small investors below the reporting threshold", motive: "Speculation — similar to non-commercials but smaller scale", signal: "Acts like a dumb-money indicator. When small specs are extremely one-sided, it often confirms a crowded trade that's due for reversal. Less reliable alone but useful for confirmation.", bgColor: `${T.amber}08` },
        ].map(g => (
          <div key={g.title} style={{ background: g.bgColor, borderRadius: 10, padding: "12px 14px", border: `1px solid ${g.color}25` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: g.color, marginBottom: 6 }}>{g.icon} {g.title}</div>
            <div style={{ fontSize: 11, color: T.textD, marginBottom: 4 }}><strong style={{ color: T.textM }}>Who:</strong> {g.who}</div>
            <div style={{ fontSize: 11, color: T.textD, marginBottom: 4 }}><strong style={{ color: T.textM }}>Motive:</strong> {g.motive}</div>
            <div style={{ fontSize: 11, color: T.textM, lineHeight: 1.6, borderTop: `1px solid ${g.color}20`, paddingTop: 6, marginTop: 4 }}><strong style={{ color: g.color }}>Signal:</strong> {g.signal}</div>
          </div>
        ))}
      </div>

      {/* How to read the chart */}
      <div style={{ background: T.bg, borderRadius: 10, padding: "12px 16px", border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Activity size={13} style={{ color: T.cyan }} /> Key COT Concepts to Master
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {[
            { term: "COT Divergence", color: T.red, explain: "Price makes a new high but speculator net-long positions are falling. Classic distribution pattern — smart money is quietly selling while retail chases the move. One of the most reliable leading indicators of a reversal." },
            { term: "Net Position Extreme", color: T.amber, explain: "When speculators are positioned at multi-year extremes (top or bottom 10% of their historical range), the market is 'crowded'. Reversals from these extremes can be violent as everyone rushes for the exit simultaneously." },
            { term: "Commercial Accumulation", color: T.cyan, explain: "When commercials are building unusual net-long positions (hedgers buying protection against price rises), it often signals they expect prices to move higher. Follow commercial hedger intent, not their direction." },
            { term: "Spec Momentum", color: T.green, explain: "When speculators are consistently adding to net-long/short positions week over week, it confirms a trending market. The trend is likely to continue until positioning reaches an extreme or COT divergence appears." },
          ].map(c => (
            <div key={c.term} style={{ padding: "8px 10px", background: T.bg2, borderRadius: 7, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: c.color, marginBottom: 3 }}>{c.term}</div>
              <div style={{ fontSize: 11, color: T.textD, lineHeight: 1.6 }}>{c.explain}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: T.textD, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: 3, background: T.amber }} />
        COT data is released every Friday at 3:30 PM ET covering positions as of the prior Tuesday. There is a ~3 day lag built into the data.
        <span style={{ marginLeft: "auto", color: T.purple, fontWeight: 600 }}>Latest: {inst?.cot?.date || "N/A"}</span>
      </div>
    </div>

    <div style={s.g4}>
      <MetricCard label="Price" value={priceStr(inst)} sub={`${inst.change>0?"+":""}${inst.change}% weekly`} subColor={inst.change>0?T.green:T.red} icon={TrendingUp}/>
      <MetricCard label="Spec net" value={inst.cot.netSpec?fmt(inst.cot.netSpec):(inst.cot.crossBias||"N/A")} sub={inst.cot.prevNet?`prev: ${fmt(inst.cot.prevNet)}`:""} icon={BarChart3}/>
      <MetricCard label="Open interest" value={inst.cot.oi?fmt(inst.cot.oi):"Cross"} icon={Database}/>
      <MetricCard label="Composite" value={inst.composite} subColor={inst.compositeColor} sub={inst.cot.date} icon={Target}/>
    </div>
    <div style={s.g2}>
      <div style={s.cd}>
        <div style={s.ct}><Database size={14}/>Positioning breakdown</div>
        <Tip text="This table shows how different trader groups are positioned. Non-commercial = speculators (hedge funds). Commercial = hedgers (producers/banks). When speculators are heavily one-sided, the market often reverses. Commercials typically trade opposite to the trend as hedges." />
        {inst.name==="XAUUSD"?(<table style={s.tb}><thead><tr>{["Category","Long","Short","Net"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead><tbody>
          <tr><td style={s.td}>Non-commercial</td><td style={s.td}>{inst.cot.nonComm.long.toLocaleString()}</td><td style={s.td}>{inst.cot.nonComm.short.toLocaleString()}</td><td style={{...s.td,color:T.green}}>+{fmt(inst.cot.nonComm.long-inst.cot.nonComm.short)}</td></tr>
          <tr><td style={s.td}>Commercial</td><td style={s.td}>{inst.cot.comm.long.toLocaleString()}</td><td style={s.td}>{inst.cot.comm.short.toLocaleString()}</td><td style={{...s.td,color:T.red}}>{fmt(inst.cot.comm.long-inst.cot.comm.short)}</td></tr>
          <tr><td style={s.td}>Non-reportable</td><td style={s.td}>{inst.cot.nonRep.long.toLocaleString()}</td><td style={s.td}>{inst.cot.nonRep.short.toLocaleString()}</td><td style={{...s.td,color:T.green}}>+{fmt(inst.cot.nonRep.long-inst.cot.nonRep.short)}</td></tr>
        </tbody></table>):inst.name==="GBPUSD"?(<table style={s.tb}><thead><tr>{["Category","Long","Short","Net"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead><tbody>
          <tr><td style={s.td}>Asset managers</td><td style={s.td}>{inst.cot.assetMgr.long.toLocaleString()}</td><td style={s.td}>{inst.cot.assetMgr.short.toLocaleString()}</td><td style={{...s.td,color:T.red}}>{fmt(inst.cot.assetMgr.long-inst.cot.assetMgr.short)}</td></tr>
          <tr><td style={s.td}>Leveraged funds</td><td style={s.td}>{inst.cot.leveraged.long.toLocaleString()}</td><td style={s.td}>{inst.cot.leveraged.short.toLocaleString()}</td><td style={{...s.td,color:T.green}}>+{fmt(inst.cot.leveraged.long-inst.cot.leveraged.short)}</td></tr>
          <tr><td style={s.td}>Dealers</td><td style={s.td}>{inst.cot.dealer.long.toLocaleString()}</td><td style={s.td}>{inst.cot.dealer.short.toLocaleString()}</td><td style={{...s.td,color:T.green}}>+{fmt(inst.cot.dealer.long-inst.cot.dealer.short)}</td></tr>
        </tbody></table>):inst.name==="GBPJPY"?(<table style={s.tb}><thead><tr>{["Leg","Spec net","Bias"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead><tbody>
          <tr><td style={s.td}>GBP</td><td style={{...s.td,color:T.red}}>{fmt(inst.cot.gbpNet)}</td><td style={{...s.td,color:T.red}}>Bearish</td></tr>
          <tr><td style={s.td}>JPY</td><td style={{...s.td,color:T.red}}>{fmt(inst.cot.jpyNet)}</td><td style={{...s.td,color:T.red}}>Bearish</td></tr>
          <tr><td style={{...s.td,fontWeight:600}}>Cross</td><td style={{...s.td,color:T.green}} colSpan={2}>Mildly bullish</td></tr>
        </tbody></table>):(<table style={s.tb}><thead><tr>{["Category","Position","Bias"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead><tbody>
          <tr><td style={s.td}>Asset mgrs</td><td style={s.td}>{inst.cot.assetMgr}</td><td style={{...s.td,color:T.green}}>Bullish</td></tr>
          <tr><td style={s.td}>Leveraged</td><td style={s.td}>{inst.cot.leveraged}</td><td style={{...s.td,color:T.red}}>Bearish</td></tr>
          <tr><td style={s.td}>Dealers</td><td style={s.td}>{inst.cot.dealer}</td><td style={{...s.td,color:T.amber}}>Neutral</td></tr>
        </tbody></table>)}
      </div>
      <div style={s.cd}>
        <div style={s.ct}><Activity size={14}/>Net positioning vs price</div>
        <Tip text="When the purple area (net speculator positioning) moves in the same direction as the green line (price), the trend is confirmed. When they diverge — price goes up but positioning goes down — it's a warning sign called 'COT divergence' that often precedes a reversal." />
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={inst.history}><CartesianGrid stroke={T.border} strokeDasharray="3 3"/><XAxis dataKey="w" tick={{fill:T.textD,fontSize:10}}/><YAxis yAxisId="l" tick={{fill:T.textD,fontSize:10}}/><YAxis yAxisId="r" orientation="right" tick={{fill:T.textD,fontSize:10}}/><Tooltip contentStyle={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11}}/><Area yAxisId="l" dataKey="net" fill="rgba(139,92,246,0.12)" stroke={T.purple} strokeWidth={2} name="Net (K)"/><Line yAxisId="r" dataKey="price" stroke={T.green} strokeWidth={2} dot={{r:3,fill:T.green}} strokeDasharray="5 3" name="Price"/></ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
    <div style={s.cd}><div style={s.ct}><Zap size={14}/>Signals — {inst.name}</div>{inst.signals.map((sig,i)=><div key={i} style={s.sr(sig.type)}><div style={{marginTop:2}}><SignalIcon type={sig.type}/></div><div style={{color:T.text}}>{sig.text}</div></div>)}</div>

    {(()=>{ const a = ANALYSIS[sel]; if (!a) return null; return (<>
    <div style={{...s.cd,marginTop:18,borderColor:a.verdictColor,borderWidth:1}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={s.ct}><Brain size={14}/>Complete analysis — {sel}</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:11,color:T.textD}}>Conviction:</span>
          <div style={{display:"flex",gap:3}}>{[1,2,3,4,5].map(n=><div key={n} style={{width:10,height:10,borderRadius:5,background:n<=a.riskLevel?a.verdictColor:`${a.verdictColor}30`}}/>)}</div>
          <span style={{padding:"3px 12px",borderRadius:6,fontSize:12,fontWeight:700,background:`${a.verdictColor}18`,color:a.verdictColor,border:`1px solid ${a.verdictColor}40`}}>{a.verdict}</span>
        </div>
      </div>
      <div style={{fontSize:14,color:T.text,lineHeight:1.7,marginBottom:20,fontStyle:"italic",padding:"12px 16px",background:T.bg,borderRadius:10}}>{a.summary}</div>

      {a.layers.map((l,i)=>(
        <div key={i} style={{marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <div style={{width:6,height:6,borderRadius:3,background:l.color}}/>
            <span style={{fontSize:14,fontWeight:600,color:T.text}}>{l.title}</span>
          </div>
          <div style={{fontSize:12,color:T.purple,lineHeight:1.6,padding:"8px 14px",background:`${T.purple}08`,borderRadius:8,borderLeft:`3px solid ${T.purple}`,marginBottom:8}}>
            <span style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:0.6,display:"block",marginBottom:2,color:T.purple}}>What this means</span>
            {l.explain}
          </div>
          <div style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 14px",background:SigBg(l.signal),border:`1px solid ${SigBd(l.signal)}`,borderRadius:8}}>
            <div style={{marginTop:2}}><SignalIcon type={l.signal}/></div>
            <div style={{fontSize:13,color:T.text,lineHeight:1.7}}>{l.finding}</div>
          </div>
        </div>
      ))}

      <div style={{borderTop:`1px solid ${T.border}`,paddingTop:16,marginTop:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <Target size={16} style={{color:a.verdictColor}}/>
          <span style={{fontSize:15,fontWeight:700,color:a.verdictColor}}>Bottom line</span>
        </div>
        <div style={{fontSize:13,color:T.text,lineHeight:1.8,padding:"14px 18px",background:T.bg,borderRadius:10,border:`1px solid ${a.verdictColor}30`}}>{a.bottomLine}</div>
      </div>
    </div>
    </>); })()}
  </>);

  const renderSentiment = () => {
    const getSentimentMeta = (longPct) => {
      const dev = longPct - 50;
      const absDev = Math.abs(dev);
      if (longPct >= 75) return { signal: "STRONG SELL", color: T.red, bg: T.redBg, bd: T.redBd, strength: "Extreme", tag: "Crowd extremely long — prime fade zone", action: "Look to sell rallies. Institutions typically hunt stops below retail longs at this level.", risk: "HIGH — reversal imminent or already underway" };
      if (longPct >= 65) return { signal: "SELL BIAS", color: T.red, bg: T.redBg, bd: T.redBd, strength: "Strong", tag: "Crowded long — contrarian bearish signal", action: "Bias shorts on pullbacks. Wait for price confirmation before entering.", risk: "MODERATE-HIGH" };
      if (longPct >= 55) return { signal: "MILD SELL", color: T.amber, bg: T.amberBg, bd: T.amberBd, strength: "Moderate", tag: "Retail leaning long — weak contrarian edge", action: "No strong signal. Combine with COT and technicals before acting.", risk: "LOW-MODERATE" };
      if (longPct >= 45) return { signal: "NEUTRAL", color: T.textM, bg: T.bg3, bd: T.border, strength: "None", tag: "50/50 split — no contrarian edge", action: "Sentiment is not actionable here. Rely on COT and technicals instead.", risk: "LOW" };
      if (longPct >= 35) return { signal: "MILD BUY", color: T.amber, bg: T.amberBg, bd: T.amberBd, strength: "Moderate", tag: "Retail leaning short — weak contrarian edge", action: "Slight buy bias, but not extreme enough to act alone. Confirm with structure.", risk: "LOW-MODERATE" };
      if (longPct >= 25) return { signal: "BUY BIAS", color: T.green, bg: T.greenBg, bd: T.greenBd, strength: "Strong", tag: "Crowded short — contrarian bullish signal", action: "Bias longs on dips. Retail stops above current price are fuel for a squeeze.", risk: "MODERATE-HIGH" };
      return { signal: "STRONG BUY", color: T.green, bg: T.greenBg, bd: T.greenBd, strength: "Extreme", tag: "Crowd extremely short — prime squeeze zone", action: "High probability long setup. Institutions will squeeze retail shorts upward.", risk: "HIGH — squeeze likely in motion" };
    };

    const allInstruments = Object.values(INSTRUMENTS);
    const extremes = allInstruments.filter(i => Math.abs(i.sentiment.retailLong - 50) > 20);

    return (
      <>
        {/* ── How it works banner ── */}
        <div style={{ background: T.bg2, borderRadius: 12, padding: "16px 20px", border: `1px solid ${T.border}`, marginBottom: 20, display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: T.text }}>How to read retail sentiment</div>
            <div style={{ fontSize: 12, color: T.textM, lineHeight: 1.7 }}>
              Retail traders as a group are statistically net losers. When the crowd is heavily positioned in one direction, institutions and smart money often push the other way to collect their stops. <strong style={{ color: T.text }}>Extreme readings (&gt;70% or &lt;30%) are the most actionable signals.</strong>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {[
              { range: "> 70% Long", signal: "Strong Sell", color: T.red },
              { range: "60–70% Long", signal: "Sell Bias", color: T.red },
              { range: "45–55% Long", signal: "Neutral", color: T.textM },
              { range: "30–40% Long", signal: "Buy Bias", color: T.green },
              { range: "< 30% Long", signal: "Strong Buy", color: T.green },
            ].map(r => (
              <div key={r.range} style={{ textAlign: "center", padding: "8px 12px", background: T.bg, borderRadius: 8, border: `1px solid ${T.border}`, minWidth: 90 }}>
                <div style={{ fontSize: 10, color: T.textD, marginBottom: 3 }}>{r.range}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.signal}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Alert bar for extremes ── */}
        {extremes.length > 0 && (
          <div style={{ background: T.amberBg, border: `1px solid ${T.amberBd}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={16} color={T.amber} style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: T.textM }}>
              <strong style={{ color: T.amber }}>Extreme sentiment detected:</strong>{" "}
              {extremes.map(i => {
                const m = getSentimentMeta(i.sentiment.retailLong);
                return `${i.name} (${i.sentiment.retailLong}% long → ${m.signal})`;
              }).join(" · ")}
            </div>
          </div>
        )}

        {/* ── Sentiment matrix ── */}
        <div style={{ ...s.cd, marginBottom: 20 }}>
          <div style={s.ct}><Activity size={14} />Sentiment matrix — all instruments</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Instrument", "Long %", "Short %", "Positioning", "Contrarian Signal", "Signal Strength", "Tradeable?"].map(h => (
                    <th key={h} style={{ padding: "7px 12px", textAlign: "left", fontSize: 10, fontWeight: 600, color: T.textD, textTransform: "uppercase", letterSpacing: "0.4px", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allInstruments.map(i => {
                  const m = getSentimentMeta(i.sentiment.retailLong);
                  const tradeable = Math.abs(i.sentiment.retailLong - 50) > 15;
                  return (
                    <tr key={i.name} style={{ borderBottom: `1px solid ${T.border}` }} onClick={() => setSel(i.name)}>
                      <td style={{ padding: "10px 12px", fontWeight: 700 }}>{i.name} <span style={{ fontSize: 10, color: T.textD, fontWeight: 400 }}>{i.label}</span></td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: T.green }}>{i.sentiment.retailLong}%</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: T.red }}>{i.sentiment.retailShort}%</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ width: 100, height: 8, borderRadius: 4, overflow: "hidden", background: T.bg3, display: "flex" }}>
                          <div style={{ width: `${i.sentiment.retailLong}%`, background: T.green }} />
                          <div style={{ width: `${i.sentiment.retailShort}%`, background: T.red }} />
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: m.bg, color: m.color, border: `1px solid ${m.bd}` }}>{m.signal}</span>
                      </td>
                      <td style={{ padding: "10px 12px", color: m.color, fontWeight: 600 }}>{m.strength}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: tradeable ? T.greenBg : T.bg3, color: tradeable ? T.green : T.textD, border: `1px solid ${tradeable ? T.greenBd : T.border}` }}>
                          {tradeable ? "YES" : "WAIT"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Per-instrument detail cards ── */}
        <div style={s.g2}>
          {allInstruments.map(i => {
            const m = getSentimentMeta(i.sentiment.retailLong);
            const longChg = i.history.length > 1 ? i.sentiment.retailLong - (100 - (i.history[i.history.length - 2]?.net < 0 ? 60 : 40)) : 0;
            const histPrices = i.history.map(h => h.price);
            const priceUp = histPrices[histPrices.length - 1] > histPrices[0];
            const diverging = (priceUp && i.sentiment.retailLong > 60) || (!priceUp && i.sentiment.retailLong < 40);

            return (
              <div key={i.name} style={{ ...s.cd, border: `1px solid ${Math.abs(i.sentiment.retailLong - 50) > 20 ? m.bd : T.border}` }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{i.name}</div>
                    <div style={{ fontSize: 11, color: T.textD, marginTop: 2 }}>{i.label}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 5, background: m.bg, color: m.color, border: `1px solid ${m.bd}` }}>{m.signal}</span>
                </div>

                {/* Gauge */}
                <GaugeBar longPct={i.sentiment.retailLong} shortPct={i.sentiment.retailShort} label="Retail positioning" />

                {/* Stats grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                  <div style={{ background: T.bg, borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 9, color: T.textD, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 3 }}>Long %</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.green }}>{i.sentiment.retailLong}%</div>
                  </div>
                  <div style={{ background: T.bg, borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 9, color: T.textD, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 3 }}>Short %</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.red }}>{i.sentiment.retailShort}%</div>
                  </div>
                  <div style={{ background: T.bg, borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 9, color: T.textD, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 3 }}>Signal</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: m.color }}>{m.strength}</div>
                  </div>
                </div>

                {/* Divergence warning */}
                {diverging && (
                  <div style={{ background: T.amberBg, border: `1px solid ${T.amberBd}`, borderRadius: 7, padding: "8px 10px", marginBottom: 12, fontSize: 11, color: T.amber, display: "flex", gap: 6 }}>
                    <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span><strong>Price-sentiment divergence:</strong> Price is moving {priceUp ? "up" : "down"} but retail is {i.sentiment.retailLong > 50 ? "heavily long" : "heavily short"} — classic smart money trap setup.</span>
                  </div>
                )}

                {/* Contrarian interpretation */}
                <div style={{ background: m.bg, border: `1px solid ${m.bd}`, borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: m.color, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>Contrarian interpretation</div>
                  <div style={{ fontSize: 12, color: T.textM, lineHeight: 1.6 }}>{m.tag}</div>
                </div>

                {/* Recommended action */}
                <div style={{ borderRadius: 8, padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.textD, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>Recommended action</div>
                  <div style={{ fontSize: 12, color: T.textM, lineHeight: 1.6 }}>{m.action}</div>
                </div>

                {/* Risk level */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 10, color: T.textD, textTransform: "uppercase" }}>Signal risk level</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: m.color }}>{m.risk}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── How professionals use sentiment ── */}
        <div style={{ ...s.cd, marginTop: 4 }}>
          <div style={s.ct}><Brain size={14} />How professionals use retail sentiment</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
            {[
              { title: "Fade the crowd", color: T.red, desc: "When 70%+ of retail is long, go short. Institutions know where retail stops are and deliberately push price to trigger them before the real move." },
              { title: "Squeeze fuel", color: T.amber, desc: "Heavy short positioning (30%< long) creates upside fuel. A short squeeze happens when price rises and forces shorts to cover — accelerating the move." },
              { title: "Confirm with COT", color: T.purple, desc: "Sentiment is most powerful when it aligns with institutional COT positioning. Retail crowded short + institutions net long = very high conviction buy." },
              { title: "Ignore near 50/50", color: T.textM, desc: "Near-neutral sentiment gives no edge. When retail is split evenly, there's no crowd to fade. Rely entirely on price action and COT in this case." },
            ].map((c, i) => (
              <div key={i} style={{ background: T.bg, borderRadius: 10, padding: 14, borderLeft: `3px solid ${c.color}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.color, marginBottom: 6 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: T.textM, lineHeight: 1.6 }}>{c.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 16px", background: T.bg, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12, color: T.textM, lineHeight: 1.7 }}>
            <strong style={{ color: T.text }}>Key rule:</strong> Never trade sentiment alone. Use it as a <em>filter</em> — when sentiment is extreme AND technicals align AND COT confirms, your probability of success is significantly higher. Sentiment alone without confirmation leads to premature entries against a trend that still has momentum.
          </div>
        </div>
      </>
    );
  };

  const renderOrderFlow = () => (<>
    <div style={s.g4}>
      <MetricCard label="NY cut time" value="10:00 ET" sub="5:00 PM EAT" subColor={T.cyan} icon={Clock}/>
      <MetricCard label="Active expiries" value={String(OPTION_EXPIRIES.entries.length)} sub={OPTION_EXPIRIES.date} icon={Layers}/>
      <MetricCard label="High impact" value={String(OPTION_EXPIRIES.entries.filter(e=>e.significance==="high").length)} sub="watch closely" subColor={T.amber} icon={Target}/>
      <MetricCard label="Source" value="IL / FL" sub="InvestingLive" subColor={T.cyan} icon={Radio}/>
    </div>
    <Tip text="FX option expiries are contracts that expire at 10:00 AM New York time (5:00 PM East Africa Time). Large expiries act as 'magnets' — price gravitates toward these strike levels before the cut, especially when the strike aligns with a moving average. After the cut, the magnet disappears and price often breaks out sharply." />
    <div style={s.cd}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={s.ct}><Layers size={14}/>NY cut option expiries — {OPTION_EXPIRIES.date}</div>
        <button onClick={fetchOpt} disabled={optLoading} style={{...s.btn(T.accent,"#fff"),opacity:optLoading?0.6:1}}><RefreshCw size={13} style={optLoading?{animation:"spin 1s linear infinite"}:{}}/>{optLoading?"Fetching...":"Refresh from InvestingLive"}</button>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
      <div style={{fontSize:12,color:T.textM,marginBottom:14,padding:"10px 14px",background:T.bg,borderRadius:8,borderLeft:`3px solid ${T.cyan}`,lineHeight:1.6}}><strong style={{color:T.cyan}}>Context: </strong>{OPTION_EXPIRIES.context}</div>
      {OPTION_EXPIRIES.entries.map((e,i) => (
        <div key={i} style={{display:"grid",gridTemplateColumns:"80px 1fr 1fr auto",alignItems:"center",gap:14,padding:"14px 16px",background:T.bg,borderRadius:10,marginBottom:8,border:`1px solid ${e.significance==="high"?T.cyanBd:T.border}`}}>
          <div><div style={{fontSize:14,fontWeight:700,color:T.cyan}}>{e.pair}</div><div style={{fontSize:10,color:T.textD,marginTop:2}}>{e.notional}</div></div>
          <div>
            <div style={{display:"flex",alignItems:"baseline",gap:8}}><span style={{fontSize:20,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{e.strike}</span><span style={{fontSize:10,padding:"2px 8px",borderRadius:4,fontWeight:600,background:e.significance==="high"?T.cyanBg:T.amberBg,color:e.significance==="high"?T.cyan:T.amber}}>{e.significance}</span></div>
            <div style={{fontSize:11,color:T.textD,marginTop:2}}>Tech: {e.techLevel}</div>
          </div>
          <div style={{fontSize:12,color:T.textM,lineHeight:1.5}}>{e.notes}</div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><div style={{width:12,height:12,borderRadius:6,background:e.proximity==="close"?T.cyan:T.amber,boxShadow:e.proximity==="close"?`0 0 8px ${T.cyan}`:"none"}}/><span style={{fontSize:9,color:T.textD}}>{e.proximity}</span></div>
        </div>
      ))}
      {optData?.entries?.length > 0 && (<div style={{marginTop:16,padding:14,background:T.purpleBg,border:`1px solid ${T.purpleBd}`,borderRadius:10}}><div style={{fontSize:12,fontWeight:600,color:T.accent,marginBottom:8}}>AI-refreshed ({optData.date})</div>{optData.entries.map((e,i)=>(<div key={i} style={{fontSize:12,color:T.text,marginBottom:4}}><strong>{e.pair}</strong> @ {e.strike} {e.notional&&`(${e.notional})`} — {e.notes||e.significance}</div>))}{optData.marketContext&&<div style={{fontSize:11,color:T.textM,marginTop:8}}>{optData.marketContext}</div>}</div>)}
    </div>
    <div style={{...s.cd,marginTop:18}}>
      <div style={s.ct}><Clock size={14}/>Recent expiry history</div>
      {OPTION_EXPIRIES.historicalExpiries.map((d,i)=>(<div key={i} style={{marginBottom:10}}><div style={{fontSize:12,fontWeight:600,color:T.textM,marginBottom:4}}>{d.date}</div>{d.entries.map((e,j)=>(<div key={j} style={{fontSize:12,color:T.textD,paddingLeft:12,borderLeft:`2px solid ${T.border}`,marginBottom:3,lineHeight:1.5}}><span style={{color:T.cyan,fontWeight:600}}>{e.pair}</span> {e.strike&&`@ ${e.strike}`} — {e.note}</div>))}</div>))}
    </div>
    <div style={{...s.cd,marginTop:18}}>
      <div style={s.ct}><Brain size={14}/>How to trade FX option expiries</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        {[
          {title:"Pre-expiry magnet",time:"London → NY open",desc:"Price gravitates toward large strikes in the hours before 10AM NY cut. Trade toward strike when spot is within 30-50 pips.",color:T.cyan},
          {title:"Pin & release",time:"Post 10AM NY",desc:"Once expiry passes, the 'magnet' dissolves. Price is freed and often breaks sharply. Set up breakout entries post-cut.",color:T.amber},
          {title:"Strike + tech confluence",time:"Any time",desc:"When strike aligns with key MA or S/R level, the magnet effect is amplified. These are the highest probability setups.",color:T.green},
        ].map((x,i)=>(<div key={i} style={{background:T.bg,borderRadius:10,padding:14,borderTop:`3px solid ${x.color}`}}><div style={{fontSize:13,fontWeight:600,color:x.color,marginBottom:2}}>{x.title}</div><div style={{fontSize:10,color:T.textD,marginBottom:8,textTransform:"uppercase"}}>{x.time}</div><div style={{fontSize:12,color:T.textM,lineHeight:1.6}}>{x.desc}</div></div>))}
      </div>
      <div style={{marginTop:14,fontSize:11,color:T.textD,display:"flex",alignItems:"center",gap:6}}>
        <ExternalLink size={12}/> Source: <a href="https://investinglive.com/Orders" target="_blank" rel="noopener" style={{color:T.cyan,textDecoration:"none"}}>InvestingLive (formerly ForexLive)</a> · Published daily before NY cut · 10:00 AM ET = 5:00 PM EAT
      </div>
    </div>
    {(()=>{ const oo = OPTIONS_OI.instruments[sel]; if (!oo || !oo.putCallRatio) return null; return (<>
    <div style={{...s.cd,marginTop:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={s.ct}><BarChart3 size={14}/>Options open interest & put/call ratio — {sel}</div>
      <Tip text="The put/call ratio compares bearish bets (puts) to bullish bets (calls). Below 1.0 = more calls = bullish market. Above 1.0 = more puts = bearish market. 'Max pain' is the strike price where option writers (banks) make the most money — price often gravitates here near expiry. The OI bars below show where the biggest bets are clustered — call walls act as resistance, put walls act as support." />
        <div style={{fontSize:10,color:T.blue,fontWeight:600}}>CME + Investing.com</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:10,marginBottom:16}}>
        <div style={{background:T.bg,borderRadius:8,padding:12,textAlign:"center"}}><div style={{fontSize:10,color:T.textD,textTransform:"uppercase"}}>Put/call ratio</div><div style={{fontSize:22,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",marginTop:4,color:oo.putCallRatio<0.7?T.green:oo.putCallRatio>1.2?T.red:T.amber}}>{oo.putCallRatio.toFixed(2)}</div><div style={{fontSize:10,color:T.textD,marginTop:2}}>{oo.putCallRatio<0.7?"Bullish skew":oo.putCallRatio>1.2?"Bearish skew":"Neutral"}</div></div>
        <div style={{background:T.bg,borderRadius:8,padding:12,textAlign:"center"}}><div style={{fontSize:10,color:T.textD,textTransform:"uppercase"}}>Max pain strike</div><div style={{fontSize:18,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",marginTop:4,color:T.amber}}>{oo.maxPainStrike}</div><div style={{fontSize:10,color:T.textD,marginTop:2}}>magnet zone</div></div>
        <div style={{background:T.bg,borderRadius:8,padding:12,textAlign:"center"}}><div style={{fontSize:10,color:T.textD,textTransform:"uppercase"}}>30d implied vol</div><div style={{fontSize:22,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",marginTop:4,color:T.text}}>{oo.iv30d}%</div><div style={{fontSize:10,color:oo.ivChange>0?T.red:T.green,marginTop:2}}>{oo.ivChange>0?"+":""}{oo.ivChange}% chg</div></div>
        <div style={{background:T.bg,borderRadius:8,padding:12,textAlign:"center"}}><div style={{fontSize:10,color:T.textD,textTransform:"uppercase"}}>Options OI</div><div style={{fontSize:22,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",marginTop:4,color:T.text}}>{fmt(oo.optionsOI)}</div><div style={{fontSize:10,color:T.textD,marginTop:2}}>contracts</div></div>
      </div>
      <div style={s.ct}><Target size={14}/>Open interest by strike (call wall / put wall)</div>
      <div style={{display:"grid",gap:6}}>
        {oo.topStrikes.map((st,i)=>{
          const maxOI = Math.max(...oo.topStrikes.map(x=>Math.max(x.callOI,x.putOI)));
          const callW = (st.callOI/maxOI)*100;
          const putW = (st.putOI/maxOI)*100;
          return (<div key={i} style={{display:"grid",gridTemplateColumns:"80px 1fr 40px 1fr 50px",alignItems:"center",gap:8,padding:"6px 0"}}>
            <div style={{fontSize:12,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",color:st.type==="maxpain"?T.amber:st.type==="target"?T.green:st.type==="support"?T.blue:T.text}}>{st.strike}</div>
            <div style={{display:"flex",justifyContent:"flex-end"}}><div style={{height:16,borderRadius:"4px 0 0 4px",background:`linear-gradient(270deg,${T.green},rgba(16,185,129,0.3))`,width:`${callW}%`,minWidth:2,transition:"width 0.5s"}}></div></div>
            <div style={{textAlign:"center",fontSize:10,color:T.textD}}>strike</div>
            <div><div style={{height:16,borderRadius:"0 4px 4px 0",background:`linear-gradient(90deg,${T.red},rgba(239,68,68,0.3))`,width:`${putW}%`,minWidth:2,transition:"width 0.5s"}}></div></div>
            <div style={{fontSize:10,color:T.textD,textAlign:"right"}}>
              <span style={{color:T.green}}>{fmt(st.callOI)}</span>/<span style={{color:T.red}}>{fmt(st.putOI)}</span>
            </div>
          </div>);
        })}
        <div style={{display:"flex",gap:16,fontSize:10,color:T.textD,marginTop:4}}><span><span style={{color:T.green}}>■</span> Call OI</span><span><span style={{color:T.red}}>■</span> Put OI</span><span><span style={{color:T.amber}}>■</span> Max pain</span></div>
      </div>
      <div style={{marginTop:14,padding:"10px 14px",background:oo.putCallRatio<0.7?T.greenBg:oo.putCallRatio>1.2?T.redBg:T.amberBg,border:`1px solid ${oo.putCallRatio<0.7?T.greenBd:oo.putCallRatio>1.2?T.redBd:T.amberBd}`,borderRadius:8,fontSize:12,color:T.text,lineHeight:1.6}}>
        <strong style={{color:oo.putCallRatio<0.7?T.green:oo.putCallRatio>1.2?T.red:T.amber}}>Signal: </strong>{oo.signal}
      </div>
    </div>
    <div style={{...s.cd,marginTop:18}}>
      <div style={s.ct}><Activity size={14}/>Put/call ratio trend (6 weeks)</div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={OPTIONS_OI.pcRatioHistory}><CartesianGrid stroke={T.border} strokeDasharray="3 3"/><XAxis dataKey="w" tick={{fill:T.textD,fontSize:10}}/><YAxis tick={{fill:T.textD,fontSize:10}} domain={[0.3,1.5]}/><Tooltip contentStyle={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11}}/>
          {sel==="XAUUSD"&&<Line dataKey="xau" stroke={T.green} strokeWidth={2} dot={{r:3}} name="XAUUSD PCR"/>}
          {sel==="GBPUSD"&&<Line dataKey="gbp" stroke={T.red} strokeWidth={2} dot={{r:3}} name="GBPUSD PCR"/>}
          {sel==="BTCUSD"&&<Line dataKey="btc" stroke={T.amber} strokeWidth={2} dot={{r:3}} name="BTCUSD PCR"/>}
          <Line dataKey={() => 1.0} stroke={T.textD} strokeDasharray="5 5" strokeWidth={1} dot={false} name="Neutral (1.0)"/>
        </LineChart>
      </ResponsiveContainer>
      <div style={{fontSize:11,color:T.textM,marginTop:8}}>PCR below 1.0 = more calls than puts (bullish). Above 1.0 = more puts than calls (bearish). Extremes ({`<0.5 or >1.3`}) are contrarian reversal signals.</div>
    </div>
    <div style={{marginTop:14,fontSize:11,color:T.textD,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
      <ExternalLink size={12}/> Sources: <a href="https://www.investing.com/currencies/forex-options" target="_blank" rel="noopener" style={{color:T.blue,textDecoration:"none"}}>Investing.com FX Options</a> · <a href="https://www.cmegroup.com/tools-information/quikstrike/open-interest-heatmap.html" target="_blank" rel="noopener" style={{color:T.blue,textDecoration:"none"}}>CME OI Heatmap</a> · <a href="https://www.barchart.com/forex/quotes/%5EEURUSD/options" target="_blank" rel="noopener" style={{color:T.blue,textDecoration:"none"}}>Barchart FX Options</a>
    </div>
    </>); })()}
    {(()=>{ const vd = VOL_DATA.instruments[sel]; if (!vd) return null; return (<>
    <div style={{...s.cd,marginTop:18}}>
      <div style={s.ct}><Activity size={14}/>Volatility dashboard — {sel}</div>
      <Tip text="Implied volatility (IV) is the market's forecast of future price movement — think of it as the 'fear meter.' IV rank (0-100) tells you if current vol is high or low relative to the past year. The gap between IV and realized vol (RV) shows whether options are overpriced. Risk reversal shows whether puts or calls are more expensive — revealing directional skew." />
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:10,marginBottom:16}}>
        <div style={{background:T.bg,borderRadius:8,padding:12,textAlign:"center"}}><div style={{fontSize:10,color:T.textD,textTransform:"uppercase"}}>VIX (market fear)</div><div style={{fontSize:22,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",marginTop:4,color:VOL_DATA.vix.current>25?T.red:VOL_DATA.vix.current>20?T.amber:T.green}}>{VOL_DATA.vix.current}</div><div style={{fontSize:10,color:VOL_DATA.vix.change>0?T.red:T.green,marginTop:2}}>{VOL_DATA.vix.change>0?"+":""}{VOL_DATA.vix.change} ({VOL_DATA.vix.regime})</div></div>
        <div style={{background:T.bg,borderRadius:8,padding:12,textAlign:"center"}}><div style={{fontSize:10,color:T.textD,textTransform:"uppercase"}}>{sel} 30d IV</div><div style={{fontSize:22,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",marginTop:4,color:T.text}}>{vd.cvol}%</div><div style={{fontSize:10,color:T.textD,marginTop:2}}>1w: {vd.cvol1w}% · 1m: {vd.cvol1m}%</div></div>
        <div style={{background:T.bg,borderRadius:8,padding:12,textAlign:"center"}}><div style={{fontSize:10,color:T.textD,textTransform:"uppercase"}}>IV rank / percentile</div><div style={{fontSize:22,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",marginTop:4,color:vd.ivRank>70?T.red:vd.ivRank>40?T.amber:T.green}}>{vd.ivRank}</div><div style={{fontSize:10,color:T.textD,marginTop:2}}>pctl: {vd.ivPercentile}</div></div>
        <div style={{background:T.bg,borderRadius:8,padding:12,textAlign:"center"}}><div style={{fontSize:10,color:T.textD,textTransform:"uppercase"}}>IV premium</div><div style={{fontSize:22,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",marginTop:4,color:vd.ivPremium>5?T.amber:T.green}}>+{vd.ivPremium}%</div><div style={{fontSize:10,color:T.textD,marginTop:2}}>IV {vd.cvol}% vs RV {vd.realizedVol}%</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
        <div style={{background:T.bg,borderRadius:10,padding:14}}>
          <div style={{fontSize:11,fontWeight:600,color:T.textM,textTransform:"uppercase",marginBottom:10}}>Skew & term structure</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div><div style={{fontSize:10,color:T.textD}}>25-delta risk reversal</div><div style={{fontSize:18,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:vd.riskReversal25d<0?T.green:T.red,marginTop:2}}>{vd.riskReversal25d>0?"+":""}{vd.riskReversal25d}</div><div style={{fontSize:10,color:T.textD,marginTop:2}}>{vd.riskReversal25d<0?"Calls pricier (bullish)":"Puts pricier (bearish)"}</div></div>
            <div><div style={{fontSize:10,color:T.textD}}>Term structure</div><div style={{fontSize:18,fontWeight:700,color:vd.termStructure==="Backwardation"?T.amber:vd.termStructure==="Contango"?T.blue:T.textM,marginTop:2}}>{vd.termStructure}</div><div style={{fontSize:10,color:T.textD,marginTop:2}}>{vd.termStructure==="Backwardation"?"Near-term fear > long-term":vd.termStructure==="Contango"?"Long-term risk > near":"Flat — no strong view"}</div></div>
          </div>
        </div>
        <div style={{background:T.bg,borderRadius:10,padding:14}}>
          <div style={{fontSize:11,fontWeight:600,color:T.textM,textTransform:"uppercase",marginBottom:6}}>IV vs realized vol (8w)</div>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={vd.volHistory}><XAxis dataKey="w" hide/><YAxis tick={{fill:T.textD,fontSize:9}} domain={['dataMin-2','dataMax+2']}/><Tooltip contentStyle={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:6,fontSize:10}}/>
              <Area dataKey="iv" fill="rgba(245,158,11,0.15)" stroke={T.amber} strokeWidth={2} name="Implied"/>
              <Area dataKey="rv" fill="rgba(16,185,129,0.1)" stroke={T.green} strokeWidth={1.5} strokeDasharray="4 3" name="Realized"/>
            </AreaChart>
          </ResponsiveContainer>
          <div style={{display:"flex",gap:12,fontSize:10,color:T.textD,marginTop:4}}><span><span style={{color:T.amber}}>—</span> Implied</span><span><span style={{color:T.green}}>---</span> Realized</span><span>Gap = premium</span></div>
        </div>
      </div>
      <div style={{padding:"12px 16px",background:vd.ivRank>70?T.redBg:vd.ivRank>50?T.amberBg:T.greenBg,border:`1px solid ${vd.ivRank>70?T.redBd:vd.ivRank>50?T.amberBd:T.greenBd}`,borderRadius:8,fontSize:13,color:T.text,lineHeight:1.7}}>
        <strong style={{color:vd.ivRank>70?T.red:vd.ivRank>50?T.amber:T.green}}>Volatility call: </strong>{vd.volCall}
      </div>
    </div>
    </>); })()}
  </>);

  // ── Trade Lab ─────────────────────────────────────────────────────────────
  const renderTradeLab = () => {
    const instData = intelData?.instruments?.[sel];
    const smc = instData?.smc;
    const cotC = cotLive?.instruments?.[sel];
    const inst = liveInstruments[sel];
    const oo = OPTIONS_OI.instruments[sel];

    // Scores
    const cotScore = cotC?.score ?? 50;
    const sentScore = 100 - inst.sentiment.retailLong;
    const pcrScore = oo?.putCallRatio != null ? Math.round(Math.max(10, Math.min(90, 50 + (1.0 - oo.putCallRatio) * 38))) : 50;
    const smcScore = smc?.score ?? 50;

    // Weighted combined: SMC 40% + COT 25% + Sentiment 20% + Flow 15%
    const totalScore = Math.round(smcScore * 0.40 + cotScore * 0.25 + sentScore * 0.20 + pcrScore * 0.15);

    const getGrade = s => {
      if (s >= 72) return { label: "A+ Setup", color: T.green,  bg: T.greenBg,  bd: T.greenBd  };
      if (s >= 62) return { label: "A Setup",  color: T.green,  bg: T.greenBg,  bd: T.greenBd  };
      if (s >= 52) return { label: "B Setup",  color: T.cyan,   bg: T.cyanBg,   bd: T.cyanBd   };
      if (s >= 42) return { label: "C Setup",  color: T.amber,  bg: T.amberBg,  bd: T.amberBd  };
      return               { label: "No Setup", color: T.textD, bg: T.bg3,      bd: T.border   };
    };
    const grade = getGrade(totalScore);

    const isBull = instData?.trend === "BULLISH";
    const isBear = instData?.trend === "BEARISH";
    const dir = isBull ? "bullish" : isBear ? "bearish" : null;

    const dp = sel.includes("JPY") ? 3 : sel.includes("BTC") ? 0 : 4;
    const fp = v => typeof v === "number" ? v.toFixed(dp) : v;

    const LabBtn = ({ id, label, icon: Icon }) => (
      <button onClick={() => setLabTab(id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 9, fontSize: 12, fontWeight: labTab === id ? 700 : 500, background: labTab === id ? T.bg4 : "transparent", border: `1px solid ${labTab === id ? T.borderL : T.border}`, color: labTab === id ? T.text : T.textD, cursor: "pointer" }}>
        {Icon && <Icon size={13} />}{label}
      </button>
    );

    const PatternBadge = ({ label, color, sub }) => (
      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", padding: "6px 10px", borderRadius: 8, background: `${color}15`, border: `1px solid ${color}40`, gap: 2 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: 0.3 }}>{label}</span>
        {sub && <span style={{ fontSize: 9, color: `${color}99`, textTransform: "uppercase" }}>{sub}</span>}
      </div>
    );

    // ── Scanner tab: all instruments overview ────────────────────────────
    const renderScanner = () => {
      const allKeys = Object.keys(INSTRUMENTS).filter(k => intelData?.instruments?.[k]);
      return (
        <>
          <div style={{ background: T.bg2, borderRadius: 12, padding: "14px 18px", border: `1px solid ${T.border}`, marginBottom: 20, fontSize: 12, color: T.textM, lineHeight: 1.7 }}>
            <strong style={{ color: T.text }}>SMC Scanner</strong> analyses every instrument for active Smart Money patterns using live OHLC data.
            {" "}Scores combine structure (BOS/CHoCH), order blocks in zone, fair value gaps, liquidity sweeps, COT positioning, retail sentiment, and options flow.
            {" "}<strong style={{ color: T.cyan }}>A+/A</strong> = high-quality setup · <strong style={{ color: T.amber }}>B/C</strong> = partial confluence · <strong style={{ color: T.textD }}>No Setup</strong> = wait.
          </div>
          {intelData ? (
            <div style={{ display: "grid", gap: 12 }}>
              {allKeys.map(k => {
                const d = intelData.instruments[k];
                const sm = d?.smc;
                const cot = cotLive?.instruments?.[k];
                const inst2 = liveInstruments[k];
                const ss = sm?.score ?? 50;
                const cs = cot?.score ?? 50;
                const se = 100 - inst2.sentiment.retailLong;
                const oo2 = OPTIONS_OI.instruments[k];
                const ps = oo2?.putCallRatio != null ? Math.round(Math.max(10, Math.min(90, 50 + (1.0 - oo2.putCallRatio) * 38))) : 50;
                const ts = Math.round(ss * 0.40 + cs * 0.25 + se * 0.20 + ps * 0.15);
                const g = getGrade(ts);
                const patterns = [];
                if (sm?.bos) patterns.push({ label: sm.bos.label, color: sm.bos.type === "bullish" ? T.green : T.red });
                if (sm?.choch) patterns.push({ label: sm.choch.label, color: sm.choch.type === "bullish" ? T.cyan : T.amber });
                if (sm?.bullishOBs?.some(o => o.inZone)) patterns.push({ label: "Bull OB", color: T.green });
                if (sm?.bearishOBs?.some(o => o.inZone)) patterns.push({ label: "Bear OB", color: T.red });
                if (sm?.breakerBlocks?.length) patterns.push({ label: "Breaker", color: T.purple });
                if (sm?.bullishFVGs?.length) patterns.push({ label: `${sm.bullishFVGs.length}x Bull FVG`, color: T.green });
                if (sm?.bearishFVGs?.length) patterns.push({ label: `${sm.bearishFVGs.length}x Bear FVG`, color: T.red });
                const lastSweep = sm?.liquiditySweeps?.slice(-1)[0];
                if (lastSweep) patterns.push({ label: lastSweep.type === "bullish" ? "Sweep ↑" : "Sweep ↓", color: lastSweep.type === "bullish" ? T.cyan : T.amber });
                return (
                  <div key={k} onClick={() => { setSel(k); setLabTab("builder"); }} style={{ background: T.bg2, borderRadius: 12, padding: "14px 18px", border: `1px solid ${ts >= 62 ? g.bd : T.border}`, cursor: "pointer", display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 16, alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>{k}</div>
                      <div style={{ fontSize: 10, color: T.textD }}>{INSTRUMENTS[k].label}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: d.trend === "BULLISH" ? T.green : d.trend === "BEARISH" ? T.red : T.amber, marginTop: 4 }}>{d.trend}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {patterns.length > 0 ? patterns.map((p, i) => (
                        <span key={i} style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: `${p.color}15`, color: p.color, border: `1px solid ${p.color}30` }}>{p.label}</span>
                      )) : <span style={{ fontSize: 11, color: T.textD }}>No active SMC patterns</span>}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", color: g.color }}>{ts}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: g.bg, color: g.color, border: `1px solid ${g.bd}`, marginTop: 4 }}>{g.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 40, color: T.textD }}><Activity size={28} style={{ opacity: 0.4, marginBottom: 12 }} /><div>Loading intelligence data…</div></div>
          )}
        </>
      );
    };

    // ── Builder tab: full SMC + macro confluence for selected instrument ──
    const renderBuilder = () => {
      if (!smc) return <div style={{ textAlign: "center", padding: 40, color: T.textD }}><Activity size={28} style={{ opacity: 0.4, marginBottom: 12 }} /><div style={{ fontSize: 12 }}>Intelligence data loading — switch timeframe on Chart Terminal to trigger a fetch.</div></div>;

      // Auto trade plan from SMC
      const signal = instData?.signal;
      const atr = instData?.atr;
      const current = instData?.current;

      // Primary OB for entry
      const entryOB = dir === "bullish" ? smc.bullishOBs?.find(o => o.inZone) : smc.bearishOBs?.find(o => o.inZone);
      const entryFVG = dir === "bullish" ? smc.bullishFVGs?.[0] : smc.bearishFVGs?.[0];
      const breakerSupport = dir === "bullish" ? smc.breakerBlocks?.find(b => b.flipType === "bullish_breaker") : smc.breakerBlocks?.find(b => b.flipType === "bearish_breaker");

      const confluences = [];
      if (smc.bos?.type === dir) confluences.push({ label: `BOS ${dir === "bullish" ? "↑" : "↓"} confirmed`, color: T.green, weight: "High" });
      if (smc.choch?.type === dir) confluences.push({ label: `CHoCH ${dir === "bullish" ? "↑" : "↓"} — reversal signal`, color: T.cyan, weight: "High" });
      if (entryOB) confluences.push({ label: `Price in ${dir === "bullish" ? "Bullish" : "Bearish"} OB zone`, color: T.purple, weight: "High" });
      if (entryFVG) confluences.push({ label: `${dir === "bullish" ? "Bullish" : "Bearish"} FVG present @ ${fp(entryFVG.mid)}`, color: T.blue, weight: "Medium" });
      if (breakerSupport) confluences.push({ label: `Breaker block as ${dir === "bullish" ? "support" : "resistance"} @ ${fp(breakerSupport.mid)}`, color: T.purple, weight: "Medium" });
      const lastSweep = smc.liquiditySweeps?.slice(-1)[0];
      if (lastSweep?.type === dir) confluences.push({ label: lastSweep.label, color: T.cyan, weight: "High" });
      if (cotScore >= 58 && dir === "bullish") confluences.push({ label: `COT bullish (${cotScore}/100)`, color: T.purple, weight: "Medium" });
      if (cotScore <= 42 && dir === "bearish") confluences.push({ label: `COT bearish (${cotScore}/100)`, color: T.purple, weight: "Medium" });
      if (sentScore >= 60 && dir === "bullish") confluences.push({ label: `Contrarian: ${inst.sentiment.retailLong}% retail long → fade`, color: T.amber, weight: "Medium" });
      if (sentScore <= 40 && dir === "bearish") confluences.push({ label: `Contrarian: ${inst.sentiment.retailShort}% retail short → fade`, color: T.amber, weight: "Medium" });
      if (pcrScore >= 60 && dir === "bullish") confluences.push({ label: `Options bullish skew (PCR ${oo?.putCallRatio?.toFixed(2) ?? "N/A"})`, color: T.blue, weight: "Low" });
      if (pcrScore <= 40 && dir === "bearish") confluences.push({ label: `Options bearish skew (PCR ${oo?.putCallRatio?.toFixed(2) ?? "N/A"})`, color: T.blue, weight: "Low" });

      return (
        <>
          {/* Score header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, background: T.bg2, borderRadius: 14, padding: "18px 22px", border: `1px solid ${grade.bd}`, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: T.textD, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Trade Lab — {sel} · {instData?.trend ?? "—"}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                {[{ label: "SMC", score: smcScore, w: "40%", color: T.purple }, { label: "COT", score: cotScore, w: "25%", color: T.cyan }, { label: "Sentiment", score: sentScore, w: "20%", color: T.amber }, { label: "Flow", score: pcrScore, w: "15%", color: T.blue }].map(p => {
                  const c = p.score > 55 ? T.green : p.score < 45 ? T.red : T.amber;
                  return (
                    <div key={p.label} style={{ textAlign: "center", padding: "8px 14px", background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 9, color: T.textD, marginBottom: 2 }}>{p.label} · {p.w}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: c }}>{p.score}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 12, color: T.textM }}>
                {confluences.length} confluences detected ·{" "}
                {smc.structureTrend && <span>Structure: <strong style={{ color: smc.structureTrend === "BULLISH" ? T.green : smc.structureTrend === "BEARISH" ? T.red : T.amber }}>{smc.structureTrend}</strong></span>}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 52, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", color: grade.color, lineHeight: 1 }}>{totalScore}</div>
              <div style={{ fontSize: 13, fontWeight: 700, padding: "4px 14px", borderRadius: 7, background: grade.bg, color: grade.color, border: `1px solid ${grade.bd}`, marginTop: 6 }}>{grade.label}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Structure panel */}
            <div style={s.cd}>
              <div style={s.ct}><Activity size={14} />Market Structure</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                <div style={{ background: T.bg, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, color: T.textD, textTransform: "uppercase", marginBottom: 4 }}>Structure trend</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: smc.structureTrend === "BULLISH" ? T.green : smc.structureTrend === "BEARISH" ? T.red : T.amber }}>{smc.structureTrend}</div>
                </div>
                <div style={{ background: T.bg, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, color: T.textD, textTransform: "uppercase", marginBottom: 4 }}>Last swing high</div>
                  <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: T.red }}>{smc.lastSwingHigh ? fp(smc.lastSwingHigh) : "—"}</div>
                </div>
                <div style={{ background: T.bg, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, color: T.textD, textTransform: "uppercase", marginBottom: 4 }}>Last swing low</div>
                  <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: T.green }}>{smc.lastSwingLow ? fp(smc.lastSwingLow) : "—"}</div>
                </div>
                <div style={{ background: T.bg, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, color: T.textD, textTransform: "uppercase", marginBottom: 4 }}>Current price</div>
                  <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: T.text }}>{fp(current)}</div>
                </div>
              </div>
              {smc.bos && <div style={{ padding: "10px 14px", borderRadius: 8, background: smc.bos.type === "bullish" ? T.greenBg : T.redBg, border: `1px solid ${smc.bos.type === "bullish" ? T.greenBd : T.redBd}`, marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: smc.bos.type === "bullish" ? T.green : T.red, marginBottom: 3 }}>{smc.bos.label} @ {fp(smc.bos.level)}</div>
                <div style={{ fontSize: 11, color: T.textM }}>{smc.bos.note}</div>
              </div>}
              {smc.choch && <div style={{ padding: "10px 14px", borderRadius: 8, background: smc.choch.type === "bullish" ? T.cyanBg : T.amberBg, border: `1px solid ${smc.choch.type === "bullish" ? T.cyanBd : T.amberBd}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: smc.choch.type === "bullish" ? T.cyan : T.amber, marginBottom: 3 }}>{smc.choch.label} @ {fp(smc.choch.level)}</div>
                <div style={{ fontSize: 11, color: T.textM }}>{smc.choch.note}</div>
              </div>}
              {!smc.bos && !smc.choch && <div style={{ fontSize: 11, color: T.textD, padding: "10px 0" }}>No BOS/CHoCH detected on this timeframe. Price is ranging between swing levels.</div>}
            </div>

            {/* Liquidity sweeps */}
            <div style={s.cd}>
              <div style={s.ct}><Zap size={14} />Liquidity Sweeps</div>
              <div style={{ fontSize: 11, color: T.textM, lineHeight: 1.6, marginBottom: 12, padding: "8px 12px", background: `${T.amber}08`, borderRadius: 8, borderLeft: `3px solid ${T.amber}` }}>
                Sweeps happen when price raids stop-loss clusters below swing lows (sell-side liquidity) or above swing highs (buy-side liquidity), then reverses. They reveal where smart money filled orders.
              </div>
              {smc.liquiditySweeps?.length > 0 ? smc.liquiditySweeps.map((sw, i) => (
                <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: sw.type === "bullish" ? T.greenBg : T.redBg, border: `1px solid ${sw.type === "bullish" ? T.greenBd : T.redBd}`, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: sw.type === "bullish" ? T.green : T.red }}>{sw.label}</span>
                    <span style={{ fontSize: 10, color: T.textD }}>±{sw.magnitude?.toFixed(2)}%</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.textM }}>{sw.note}</div>
                  <div style={{ fontSize: 10, color: T.textD, marginTop: 4 }}>Level swept: {fp(sw.level)} · Wick: {sw.wickLow != null ? fp(sw.wickLow) : sw.wickHigh != null ? fp(sw.wickHigh) : "—"}</div>
                </div>
              )) : <div style={{ fontSize: 11, color: T.textD, padding: "10px 0" }}>No recent liquidity sweeps detected. Watch for stop hunts at {fp(smc.lastSwingHigh)} and {fp(smc.lastSwingLow)}.</div>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Order Blocks */}
            <div style={s.cd}>
              <div style={s.ct}><Shield size={14} />Order Blocks & Breaker Blocks</div>
              <div style={{ fontSize: 11, color: T.textM, lineHeight: 1.6, marginBottom: 12, padding: "8px 12px", background: `${T.purple}08`, borderRadius: 8, borderLeft: `3px solid ${T.purple}` }}>
                Order Blocks are the last opposing candle before a strong impulse — they mark where institutions entered. Breaker Blocks are failed OBs that flipped polarity (former supply → demand or vice versa).
              </div>
              {[
                ...(smc.bullishOBs || []).map(ob => ({ ...ob, displayType: "Bullish OB", color: T.green })),
                ...(smc.bearishOBs || []).map(ob => ({ ...ob, displayType: "Bearish OB", color: T.red })),
                ...(smc.breakerBlocks || []).map(b => ({ ...b, displayType: b.flipType === "bullish_breaker" ? "Bullish Breaker" : "Bearish Breaker", color: b.flipType === "bullish_breaker" ? T.cyan : T.purple })),
              ].length > 0 ? [
                ...(smc.bullishOBs || []).map(ob => ({ ...ob, displayType: "Bullish OB", color: T.green })),
                ...(smc.bearishOBs || []).map(ob => ({ ...ob, displayType: "Bearish OB", color: T.red })),
                ...(smc.breakerBlocks || []).map(b => ({ ...b, displayType: b.flipType === "bullish_breaker" ? "Bullish Breaker" : "Bearish Breaker", color: b.flipType === "bullish_breaker" ? T.cyan : T.purple })),
              ].map((ob, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: ob.inZone ? `${ob.color}12` : T.bg, border: `1px solid ${ob.inZone ? ob.color + "50" : T.border}`, borderRadius: 8, marginBottom: 6 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: ob.color }}>{ob.displayType}</span>
                      {ob.inZone && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 3, background: ob.color, color: "#fff" }}>IN ZONE</span>}
                    </div>
                    <div style={{ fontSize: 10, color: T.textD }}>{fp(ob.low)} — {fp(ob.high)}</div>
                    {ob.note && <div style={{ fontSize: 10, color: T.textM, marginTop: 2 }}>{ob.note}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", color: ob.color }}>mid {fp(ob.mid)}</div>
                  </div>
                </div>
              )) : <div style={{ fontSize: 11, color: T.textD }}>No significant order blocks detected in the lookback window.</div>}
            </div>

            {/* FVG */}
            <div style={s.cd}>
              <div style={s.ct}><Layers size={14} />Fair Value Gaps (Imbalances)</div>
              <div style={{ fontSize: 11, color: T.textM, lineHeight: 1.6, marginBottom: 12, padding: "8px 12px", background: `${T.blue}08`, borderRadius: 8, borderLeft: `3px solid ${T.blue}` }}>
                FVGs are 3-candle patterns where price moved so fast it left an untraded zone. Price tends to return to fill the gap. Unfilled gaps in the trend direction act as continuation targets.
              </div>
              {[
                ...(smc.bullishFVGs || []).map(f => ({ ...f, displayType: "Bullish FVG", color: T.green })),
                ...(smc.bearishFVGs || []).map(f => ({ ...f, displayType: "Bearish FVG", color: T.red })),
              ].length > 0 ? [
                ...(smc.bullishFVGs || []).map(f => ({ ...f, displayType: "Bullish FVG", color: T.green })),
                ...(smc.bearishFVGs || []).map(f => ({ ...f, displayType: "Bearish FVG", color: T.red })),
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: f.color, marginBottom: 3 }}>{f.displayType}</div>
                    <div style={{ fontSize: 10, color: T.textD }}>{fp(f.low)} — {fp(f.high)}</div>
                    <div style={{ fontSize: 10, color: T.textM, marginTop: 2 }}>Gap size: {fp(Math.abs(f.high - f.low))} · Midpoint: {fp(f.mid)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 5, background: `${f.color}15`, color: f.color, border: `1px solid ${f.color}30` }}>UNFILLED</div>
                  </div>
                </div>
              )) : <div style={{ fontSize: 11, color: T.textD }}>No unfilled FVGs detected in the lookback window.</div>}
            </div>
          </div>

          {/* Confluence checklist */}
          <div style={{ ...s.cd, marginBottom: 16 }}>
            <div style={s.ct}><Target size={14} />Confluence Checklist — {dir ? dir.toUpperCase() : "No clear direction"}</div>
            {confluences.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
                {confluences.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: `${c.color}08`, border: `1px solid ${c.color}25`, borderRadius: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: c.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: T.text, flex: 1 }}>{c.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: c.weight === "High" ? T.greenBg : c.weight === "Medium" ? T.amberBg : T.bg3, color: c.weight === "High" ? T.green : c.weight === "Medium" ? T.amber : T.textD, border: `1px solid ${c.weight === "High" ? T.greenBd : c.weight === "Medium" ? T.amberBd : T.border}` }}>{c.weight}</span>
                  </div>
                ))}
              </div>
            ) : <div style={{ fontSize: 12, color: T.textD, padding: "10px 0" }}>No confluences aligned for a directional trade. Market is in a ranging/neutral state — wait for clearer structure.</div>}
          </div>

          {/* Trade plan */}
          {signal && (
            <div style={{ ...s.cd, border: `1px solid ${signal.direction === "BUY" ? T.greenBd : T.redBd}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={s.ct}><Zap size={14} />Generated Trade Plan — {sel}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, padding: "4px 14px", borderRadius: 7, background: signal.direction === "BUY" ? T.greenBg : T.redBg, color: signal.direction === "BUY" ? T.green : T.red, border: `1px solid ${signal.direction === "BUY" ? T.greenBd : T.redBd}` }}>{signal.direction}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 7, background: T.purpleBg, color: T.purple, border: `1px solid ${T.purpleBd}` }}>Conf: {signal.confidence}%</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 14 }}>
                {[
                  { l: "Entry", v: fp(signal.entry), color: T.text },
                  { l: "Stop Loss", v: fp(signal.sl), color: T.red },
                  { l: "TP1", v: fp(signal.tp1), color: T.cyan },
                  { l: "TP2", v: fp(signal.tp2), color: T.green },
                  { l: "TP3", v: fp(signal.tp3), color: T.green },
                  { l: "R:R", v: signal.rr, color: T.amber },
                ].map(item => (
                  <div key={item.l} style={{ background: T.bg, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: T.textD, textTransform: "uppercase", marginBottom: 4 }}>{item.l}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: item.color }}>{item.v}</div>
                  </div>
                ))}
              </div>
              {entryOB && <div style={{ fontSize: 12, color: T.textM, marginBottom: 8 }}><strong style={{ color: T.purple }}>Entry zone:</strong> {signal.direction === "BUY" ? "Bullish" : "Bearish"} OB at {fp(entryOB.low)}–{fp(entryOB.high)} — wait for price to tap into this zone before entering.</div>}
              {lastSweep && lastSweep.type === dir && <div style={{ fontSize: 12, color: T.textM, marginBottom: 8 }}><strong style={{ color: T.cyan }}>Sweep confirmation:</strong> Recent {lastSweep.label} gives high-probability reversal context. Enter after sweep candle closes.</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => { setNewSig({ instrument: sel, direction: signal.direction === "BUY" ? "Long" : "Short", entryPrice: String(signal.entry), targetPrice: String(signal.tp2), stopLoss: String(signal.sl), confidence: Math.round(signal.confidence / 10), notes: `SMC setup: ${confluences.map(c => c.label).join("; ")}`, bias: signal.direction === "BUY" ? "Bullish" : "Bearish", riskReward: signal.rr }); setLabTab("signals"); }} style={{ ...s.btn(T.accent, "#fff"), fontSize: 12 }}><Plus size={13} />Log to Signals</button>
                <button onClick={() => { setNewE({ instrument: sel, direction: signal.direction === "BUY" ? "Long" : "Short", notes: `SMC setup: ${confluences.map(c => c.label).join("; ")}`, confidence: 4 }); setLabTab("journal"); }} style={{ ...s.btn(T.bg3, T.textM), fontSize: 12, border: `1px solid ${T.border}` }}><BookOpen size={13} />Add to Journal</button>
              </div>
            </div>
          )}
        </>
      );
    };

    // ── Signals tab ───────────────────────────────────────────────────────
    const renderSignalsTab = () => {
      const openSigs = signals.filter(sg => sg.status === "OPEN");
      const closedSigs = signals.filter(sg => sg.status === "CLOSED");
      const wins = closedSigs.filter(sg => (calcPnL(sg, liveData) || 0) > 0).length;
      const winRate = closedSigs.length > 0 ? ((wins / closedSigs.length) * 100).toFixed(0) : null;
      const totalClosedPnL = closedSigs.reduce((acc, sg) => acc + (calcPnL(sg, liveData) || 0), 0);
      const openPnL = openSigs.reduce((acc, sg) => acc + (calcPnL(sg, liveData) || 0), 0);
      const equityCurve = closedSigs.slice().sort((a, b) => new Date(a.closedAt) - new Date(b.closedAt)).reduce((acc, sg, i) => {
        const prev = acc[i - 1]?.cumPnL || 0;
        const pnl = calcPnL(sg, liveData) || 0;
        acc.push({ label: new Date(sg.closedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), cumPnL: parseFloat((prev + pnl).toFixed(2)), pnl: parseFloat(pnl.toFixed(2)) });
        return acc;
      }, []);
      const pnlColor = v => v >= 0 ? T.green : T.red;
      const inp = { background: T.bg, border: `1px solid ${T.border}`, color: T.text, fontSize: 12, padding: "7px 10px", borderRadius: 7, width: "100%" };
      return (
        <>
          <div style={s.g4}>
            <div style={s.cd}><div style={{ fontSize: 11, color: T.textD, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Total Signals</div><div style={{ fontSize: 28, fontWeight: 700 }}>{signals.length}</div><div style={{ fontSize: 11, color: T.textM }}>{openSigs.length} open · {closedSigs.length} closed</div></div>
            <div style={s.cd}><div style={{ fontSize: 11, color: T.textD, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Win Rate</div><div style={{ fontSize: 28, fontWeight: 700, color: winRate >= 50 ? T.green : winRate !== null ? T.red : T.textD }}>{winRate !== null ? winRate + "%" : "—"}</div><div style={{ fontSize: 11, color: T.textM }}>{wins}W / {closedSigs.length - wins}L</div></div>
            <div style={s.cd}><div style={{ fontSize: 11, color: T.textD, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Closed P&L</div><div style={{ fontSize: 28, fontWeight: 700, color: pnlColor(totalClosedPnL) }}>{totalClosedPnL >= 0 ? "+" : ""}{totalClosedPnL.toFixed(2)}%</div></div>
            <div style={s.cd}><div style={{ fontSize: 11, color: T.textD, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Open P&L</div><div style={{ fontSize: 28, fontWeight: 700, color: pnlColor(openPnL) }}>{openPnL >= 0 ? "+" : ""}{openPnL.toFixed(2)}%</div></div>
          </div>
          <div style={{ ...s.cd, marginTop: 16 }}>
            <div style={s.ct}><Plus size={14} />Log New Signal</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div><label style={{ fontSize: 10, color: T.textD, display: "block", marginBottom: 3 }}>Instrument</label><select value={newSig.instrument} onChange={e => setNewSig({ ...newSig, instrument: e.target.value })} style={inp}>{Object.keys(INSTRUMENTS).map(k => <option key={k}>{k}</option>)}</select></div>
              <div><label style={{ fontSize: 10, color: T.textD, display: "block", marginBottom: 3 }}>Direction</label><select value={newSig.direction} onChange={e => setNewSig({ ...newSig, direction: e.target.value })} style={inp}><option>Long</option><option>Short</option></select></div>
              <div><label style={{ fontSize: 10, color: T.textD, display: "block", marginBottom: 3 }}>Bias</label><select value={newSig.bias} onChange={e => setNewSig({ ...newSig, bias: e.target.value })} style={inp}><option>Bullish</option><option>Bearish</option><option>Neutral</option></select></div>
              <div><label style={{ fontSize: 10, color: T.textD, display: "block", marginBottom: 3 }}>Confidence (1-10)</label><input type="number" min={1} max={10} value={newSig.confidence} onChange={e => setNewSig({ ...newSig, confidence: +e.target.value })} style={inp} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div><label style={{ fontSize: 10, color: T.textD, display: "block", marginBottom: 3 }}>Entry Price</label><input type="number" step="any" value={newSig.entryPrice} onChange={e => setNewSig({ ...newSig, entryPrice: e.target.value })} placeholder={liveData[newSig.instrument]?.price || "0"} style={inp} /></div>
              <div><label style={{ fontSize: 10, color: T.textD, display: "block", marginBottom: 3 }}>Target Price</label><input type="number" step="any" value={newSig.targetPrice} onChange={e => setNewSig({ ...newSig, targetPrice: e.target.value })} style={inp} /></div>
              <div><label style={{ fontSize: 10, color: T.textD, display: "block", marginBottom: 3 }}>Stop Loss</label><input type="number" step="any" value={newSig.stopLoss} onChange={e => setNewSig({ ...newSig, stopLoss: e.target.value })} style={inp} /></div>
              <div><label style={{ fontSize: 10, color: T.textD, display: "block", marginBottom: 3 }}>R:R</label><input type="text" value={newSig.riskReward || ""} onChange={e => setNewSig({ ...newSig, riskReward: e.target.value })} placeholder="e.g. 1:2.5" style={inp} /></div>
            </div>
            <textarea value={newSig.notes} onChange={e => setNewSig({ ...newSig, notes: e.target.value })} placeholder="Trade thesis (SMC setup, COT context, sentiment…)" rows={2} style={{ ...inp, width: "100%", resize: "vertical", marginBottom: 10, fontFamily: "inherit" }} />
            <button onClick={async () => { if (!newSig.entryPrice) return; await createSignal({ ...newSig, entryPrice: newSig.entryPrice || liveData[newSig.instrument]?.price }); setNewSig({ instrument: "XAUUSD", direction: "Long", entryPrice: "", targetPrice: "", stopLoss: "", confidence: 7, notes: "", bias: "Neutral", riskReward: "", validFor: "", aiSummary: "" }); }} disabled={signalsLoading || !newSig.entryPrice} style={{ ...s.btn(T.accent, "#fff"), opacity: (!newSig.entryPrice || signalsLoading) ? 0.5 : 1 }}><Plus size={13} />{signalsLoading ? "Saving…" : "Log Signal"}</button>
          </div>
          {userTrades.length > 0 && <div style={{ ...s.cd, marginTop: 16, border: `1px solid ${T.purple}40` }}>
            <div style={{ ...s.ct, color: T.purple }}><Activity size={14} />Live Session Trades ({userTrades.length})</div>
            <div style={{ overflowX: "auto" }}><table style={{ ...s.tb, minWidth: 700 }}><thead><tr>{["Pair", "Dir", "Entry", "Current", "Lot", "P&L %", "Opened", ""].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead><tbody>{userTrades.map(t => { const cur = liveData[t.instr]?.price; const pnl = cur ? ((cur - t.entry) / t.entry) * 100 * (t.dir === "BUY" ? 1 : -1) : 0; return <tr key={t.id}><td style={{ ...s.td, fontWeight: 700 }}>{t.instr}</td><td style={{ ...s.td, color: t.dir === "BUY" ? T.green : T.red, fontWeight: 600 }}>{t.dir}</td><td style={s.td}>{t.entry}</td><td style={{ ...s.td, color: T.cyan }}>{cur || "—"}</td><td style={s.td}>{t.lot}</td><td style={{ ...s.td, fontWeight: 700, color: pnlColor(pnl) }}>{pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}%</td><td style={{ ...s.td, color: T.textD, fontSize: 11 }}>{new Date(t.timestamp).toLocaleTimeString()}</td><td style={s.td}><button onClick={() => setUserTrades(userTrades.filter(it => it.id !== t.id))} style={{ ...s.btn(T.redBg, T.red), padding: "4px 8px", border: `1px solid ${T.redBd}` }}>Close</button></td></tr>; })}</tbody></table></div>
          </div>}
          {openSigs.length > 0 && <div style={{ ...s.cd, marginTop: 16 }}>
            <div style={s.ct}><Radio size={14} />Open Signals ({openSigs.length})</div>
            <div style={{ overflowX: "auto" }}><table style={{ ...s.tb, minWidth: 700 }}><thead><tr>{["Pair", "Dir", "Entry", "Current", "Target", "Stop", "P&L %", "Conf", "Logged", ""].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead><tbody>{openSigs.map(sg => { const pnl = calcPnL(sg, liveData); const cur = liveData[sg.instrument]?.price; return <tr key={sg.id}><td style={{ ...s.td, fontWeight: 700 }}>{sg.instrument}</td><td style={{ ...s.td, color: sg.direction === "Long" ? T.green : T.red, fontWeight: 600 }}>{sg.direction}</td><td style={s.td}>{sg.entryPrice}</td><td style={{ ...s.td, color: T.cyan }}>{cur || "—"}</td><td style={{ ...s.td, color: T.green }}>{sg.targetPrice || "—"}</td><td style={{ ...s.td, color: T.red }}>{sg.stopLoss || "—"}</td><td style={{ ...s.td, fontWeight: 700, color: pnl === null ? T.text : pnlColor(pnl) }}>{pnl === null ? "—" : `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%`}</td><td style={s.td}>{sg.confidence}/10</td><td style={{ ...s.td, color: T.textD, fontSize: 11 }}>{new Date(sg.createdAt).toLocaleDateString()}</td><td style={s.td}>{closeForm?.id === sg.id ? <div style={{ display: "flex", gap: 4 }}><input type="number" step="any" value={closeForm.exitPrice} onChange={e => setCloseForm({ ...closeForm, exitPrice: e.target.value })} style={{ ...inp, width: 80, padding: "3px 6px" }} /><button onClick={() => closeSignal(sg.id, parseFloat(closeForm.exitPrice))} style={{ ...s.btn(T.green, "#fff"), padding: "3px 8px", fontSize: 11 }}>✓</button><button onClick={() => setCloseForm(null)} style={{ ...s.btn(T.bg3, T.textM), padding: "3px 6px", fontSize: 11 }}>✕</button></div> : <div style={{ display: "flex", gap: 4 }}><button onClick={() => setCloseForm({ id: sg.id, exitPrice: cur || "" })} style={{ ...s.btn(T.amberBg, T.amber), padding: "3px 8px", fontSize: 11, border: `1px solid ${T.amberBd}` }}>Close</button><button onClick={() => deleteSignal(sg.id)} style={{ ...s.btn(T.redBg, T.red), padding: "3px 6px", border: `1px solid ${T.redBd}` }}><Trash2 size={11} /></button></div>}</td></tr>; })}</tbody></table></div>
          </div>}
          {equityCurve.length > 1 && <div style={{ ...s.cd, marginTop: 16 }}>
            <div style={s.ct}><TrendingUp size={14} />Equity Curve</div>
            <ResponsiveContainer width="100%" height={190}><AreaChart data={equityCurve} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}><defs><linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.green} stopOpacity={0.3} /><stop offset="95%" stopColor={T.green} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={T.border} /><XAxis dataKey="label" tick={{ fill: T.textD, fontSize: 10 }} /><YAxis tick={{ fill: T.textD, fontSize: 10 }} tickFormatter={v => `${v > 0 ? "+" : ""}${v}%`} /><Tooltip contentStyle={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} formatter={v => [`${v >= 0 ? "+" : ""}${v}%`, "Cum P&L"]} /><Area type="monotone" dataKey="cumPnL" stroke={T.green} fill="url(#eqGrad)" strokeWidth={2} dot={{ fill: T.green, r: 3 }} /></AreaChart></ResponsiveContainer>
          </div>}
          {closedSigs.length > 0 && <div style={{ ...s.cd, marginTop: 16 }}>
            <div style={s.ct}><BookOpen size={14} />Closed History ({closedSigs.length})</div>
            <div style={{ overflowX: "auto" }}><table style={{ ...s.tb, minWidth: 700 }}><thead><tr>{["Pair", "Dir", "Entry", "Exit", "P&L %", "R:R", "Conf", "Opened", "Closed", "Bias"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead><tbody>{closedSigs.map(sg => { const pnl = calcPnL(sg, liveData); return <tr key={sg.id} style={{ opacity: 0.85 }}><td style={{ ...s.td, fontWeight: 700 }}>{sg.instrument}</td><td style={{ ...s.td, color: sg.direction === "Long" ? T.green : T.red, fontWeight: 600 }}>{sg.direction}</td><td style={s.td}>{sg.entryPrice}</td><td style={s.td}>{sg.exitPrice || "—"}</td><td style={{ ...s.td, fontWeight: 700, color: pnl === null ? T.textD : pnlColor(pnl) }}>{pnl === null ? "—" : `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%`}</td><td style={s.td}>{sg.riskReward || "—"}</td><td style={s.td}>{sg.confidence}/10</td><td style={{ ...s.td, fontSize: 11, color: T.textD }}>{new Date(sg.createdAt).toLocaleDateString()}</td><td style={{ ...s.td, fontSize: 11, color: T.textD }}>{sg.closedAt ? new Date(sg.closedAt).toLocaleDateString() : "—"}</td><td style={{ ...s.td, color: sg.bias === "Bullish" ? T.green : sg.bias === "Bearish" ? T.red : T.amber, fontSize: 11 }}>{sg.bias || "—"}</td></tr>; })}</tbody></table></div>
          </div>}
        </>
      );
    };

    // ── Journal tab ───────────────────────────────────────────────────────
    const renderJournalTab = () => (
      <>
        <div style={s.cd}>
          <div style={s.ct}><Plus size={14} />New trade idea</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
            <div><label style={{ fontSize: 10, color: T.textD, display: "block", marginBottom: 3 }}>Instrument</label><select value={newE.instrument} onChange={e => setNewE({ ...newE, instrument: e.target.value })} style={{ width: "100%", padding: "7px 10px", borderRadius: 7, background: T.bg, border: `1px solid ${T.border}`, color: T.text, fontSize: 12 }}>{Object.keys(INSTRUMENTS).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
            <div><label style={{ fontSize: 10, color: T.textD, display: "block", marginBottom: 3 }}>Direction</label><select value={newE.direction} onChange={e => setNewE({ ...newE, direction: e.target.value })} style={{ width: "100%", padding: "7px 10px", borderRadius: 7, background: T.bg, border: `1px solid ${T.border}`, color: T.text, fontSize: 12 }}><option>Long</option><option>Short</option></select></div>
            <div><label style={{ fontSize: 10, color: T.textD, display: "block", marginBottom: 3 }}>Confidence</label><select value={newE.confidence} onChange={e => setNewE({ ...newE, confidence: +e.target.value })} style={{ width: "100%", padding: "7px 10px", borderRadius: 7, background: T.bg, border: `1px solid ${T.border}`, color: T.text, fontSize: 12 }}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
            <button onClick={addE} style={{ ...s.btn(T.accent, "#fff"), height: 34 }}>Add</button>
          </div>
          <div style={{ marginTop: 10 }}><textarea value={newE.notes} onChange={e => setNewE({ ...newE, notes: e.target.value })} placeholder="Trade thesis: SMC pattern, COT + sentiment + option flow rationale…" rows={3} style={{ width: "100%", padding: "9px 10px", borderRadius: 7, background: T.bg, border: `1px solid ${T.border}`, color: T.text, fontSize: 12, resize: "vertical", fontFamily: "inherit" }} /></div>
        </div>
        <div style={{ ...s.cd, marginTop: 16 }}>
          <div style={s.ct}><BookOpen size={14} />Trade ideas ({journal.length})</div>
          {journal.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: T.textD, fontSize: 12 }}><BookOpen size={24} style={{ marginBottom: 8, opacity: 0.4 }} /><div>No entries yet. Persists across sessions.</div></div> :
            journal.map(e => (
              <div key={e.id} style={{ display: "flex", gap: 10, padding: 14, background: T.bg, borderRadius: 10, border: `1px solid ${T.border}`, marginBottom: 8, alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 56 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: e.direction === "Long" ? T.green : T.red }}>{e.direction}</span>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{e.instrument}</span>
                  <div style={{ display: "flex", gap: 2 }}>{[1, 2, 3, 4, 5].map(n => <div key={n} style={{ width: 5, height: 5, borderRadius: 3, background: n <= e.confidence ? T.accent : T.bg3 }} />)}</div>
                </div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, lineHeight: 1.6, color: T.textM }}>{e.notes}</div><div style={{ fontSize: 10, color: T.textD, marginTop: 4 }}><Clock size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />{new Date(e.timestamp).toLocaleString()}</div></div>
                <div style={{ display: "flex", gap: 5 }}>
                  <button onClick={() => saveJ(journal.map(x => x.id === e.id ? { ...x, status: x.status === "Open" ? "Closed" : "Open" } : x))} style={{ padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, background: e.status === "Open" ? T.greenBg : T.bg3, color: e.status === "Open" ? T.green : T.textD, border: `1px solid ${e.status === "Open" ? T.greenBd : T.border}`, cursor: "pointer" }}>{e.status}</button>
                  <button onClick={() => saveJ(journal.filter(x => x.id !== e.id))} style={{ padding: "3px 6px", borderRadius: 5, background: T.redBg, color: T.red, border: `1px solid ${T.redBd}`, cursor: "pointer", display: "flex", alignItems: "center" }}><Trash2 size={11} /></button>
                </div>
              </div>
            ))}
        </div>
      </>
    );

    // ── AI Strategy builder ────────────────────────────────────────────────
    const renderStrategyTab = () => (
      <>
        <div style={s.cd}>
          <div style={s.ct}><Shield size={14} />Strategy rules — {STRATEGY_RULES.length} rules across 5 pillars</div>
          {Object.entries(cats).map(([k, c]) => (
            <div key={k} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: 4, background: c.color }} />{c.label}</div>
              {STRATEGY_RULES.filter(r => r.category === k).map(r => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: T.bg, borderRadius: 8, marginBottom: 6, border: `1px solid ${T.border}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: `${c.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: c.color, flexShrink: 0 }}>{r.id}</div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: T.textM }}>{r.desc}</div></div>
                  <div style={{ display: "flex", gap: 3 }}>{[1, 2, 3].map(w => <div key={w} style={{ width: 7, height: 7, borderRadius: 4, background: w <= r.weight ? c.color : T.bg3 }} />)}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ ...s.cd, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={s.ct}><Zap size={14} />AI analysis — {sel}</div>
            <button onClick={runAi} disabled={aiLoading} style={{ ...s.btn(T.accent, "#fff"), opacity: aiLoading ? 0.6 : 1 }}><RefreshCw size={13} style={aiLoading ? { animation: "spin 1s linear infinite" } : {}} />{aiLoading ? "Analyzing…" : "Run AI analysis"}</button>
          </div>
          {aiData ? (
            <div style={{ background: T.bg, borderRadius: 10, padding: 18, border: `1px solid ${T.borderL}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <span style={{ padding: "2px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600, background: aiData.bias === "Bullish" ? T.greenBg : aiData.bias === "Bearish" ? T.redBg : T.amberBg, color: aiData.bias === "Bullish" ? T.green : aiData.bias === "Bearish" ? T.red : T.amber }}>{aiData.bias || "N/A"}</span>
                {aiData.confidence && <span style={{ fontSize: 11, color: T.purple, fontWeight: 600 }}>Confidence {aiData.confidence}/10</span>}
                {aiData.riskReward && <span style={{ fontSize: 11, color: T.cyan }}>R:R {aiData.riskReward}</span>}
                {lastRef && <span style={{ fontSize: 10, color: T.textD, marginLeft: "auto" }}>{new Date(lastRef).toLocaleString()}</span>}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: T.text, marginBottom: 10 }}>{aiData.summary}</div>
              {(aiData.entryZone || aiData.target || aiData.stopLoss) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                  {aiData.entryZone && <div style={{ padding: "8px 12px", background: T.bg2, borderRadius: 8, border: `1px solid ${T.border}` }}><div style={{ fontSize: 10, color: T.textD, marginBottom: 2 }}>ENTRY ZONE</div><div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: T.text, fontWeight: 600 }}>{aiData.entryZone}</div></div>}
                  {aiData.target && <div style={{ padding: "8px 12px", background: T.greenBg, borderRadius: 8, border: `1px solid ${T.greenBd}` }}><div style={{ fontSize: 10, color: T.green, marginBottom: 2 }}>TARGET</div><div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: T.green, fontWeight: 600 }}>{aiData.target}</div></div>}
                  {aiData.stopLoss && <div style={{ padding: "8px 12px", background: T.redBg, borderRadius: 8, border: `1px solid ${T.redBd}` }}><div style={{ fontSize: 10, color: T.red, marginBottom: 2 }}>STOP LOSS</div><div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: T.red, fontWeight: 600 }}>{aiData.stopLoss}</div></div>}
                </div>
              )}
              {aiData.cotUpdate && <div style={{ fontSize: 12, color: T.textM, marginBottom: 4 }}><strong style={{ color: T.text }}>COT:</strong> {aiData.cotUpdate}</div>}
              {aiData.sentimentUpdate && <div style={{ fontSize: 12, color: T.textM, marginBottom: 4 }}><strong style={{ color: T.text }}>Sentiment:</strong> {aiData.sentimentUpdate}</div>}
              {aiData.catalysts && aiData.catalysts.length > 0 && <div style={{ fontSize: 12, color: T.textM, marginBottom: 4 }}><strong style={{ color: T.amber }}>Catalysts:</strong> {aiData.catalysts.join(" · ")}</div>}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                <button onClick={() => { const entry = aiData.entryZone ? aiData.entryZone.split("-")[0].trim() : (liveData[aiData.instrument || sel]?.price || ""); setNewSig({ instrument: aiData.instrument || sel, direction: aiData.bias === "Bearish" ? "Short" : "Long", entryPrice: String(entry), targetPrice: aiData.target || "", stopLoss: aiData.stopLoss || "", confidence: Math.min(10, Math.max(1, aiData.confidence || 7)), notes: aiData.summary || "", bias: aiData.bias || "Neutral", riskReward: aiData.riskReward || "" }); setLabTab("signals"); }} style={{ ...s.btn(T.accent, "#fff"), fontSize: 12 }}><Plus size={13} />Log as Signal</button>
              </div>
            </div>
          ) : <div style={{ textAlign: "center", padding: 30, color: T.textD }}><Brain size={28} style={{ marginBottom: 10, opacity: 0.4 }} /><div style={{ fontSize: 12 }}>Run AI analysis for live COT + sentiment + SMC entry levels</div></div>}
        </div>
      </>
    );

    return (
      <>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <LabBtn id="scanner" label="SMC Scanner" icon={Activity} />
          <LabBtn id="builder" label="Trade Builder" icon={Target} />
          <LabBtn id="signals" label="Signals" icon={Radio} />
          <LabBtn id="journal" label="Trade Journal" icon={BookOpen} />
          <LabBtn id="strategy" label="AI Strategy" icon={Brain} />
        </div>
        {labTab === "scanner"  && renderScanner()}
        {labTab === "builder"  && renderBuilder()}
        {labTab === "signals"  && renderSignalsTab()}
        {labTab === "journal"  && renderJournalTab()}
        {labTab === "strategy" && renderStrategyTab()}
      </>
    );
  };

  const cats = {positioning:{label:"COT positioning",color:T.purple},sentiment:{label:"Sentiment",color:T.amber},orderflow:{label:"Order flow",color:T.cyan},options:{label:"Options OI & put/call",color:T.blue},volatility:{label:"Volatility",color:"#f97316"}};
  const renderStrategy = () => (<>
    <div style={s.cd}>
      <div style={s.ct}><Shield size={14}/>Strategy rules engine — {STRATEGY_RULES.length} rules across 5 pillars</div>
      {Object.entries(cats).map(([k,c])=>(<div key={k} style={{marginBottom:16}}><div style={{fontSize:11,fontWeight:600,color:c.color,textTransform:"uppercase",letterSpacing:1,marginBottom:8,display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:4,background:c.color}}/>{c.label}</div>
        {STRATEGY_RULES.filter(r=>r.category===k).map(r=>(<div key={r.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:T.bg,borderRadius:8,marginBottom:6,border:`1px solid ${T.border}`}}><div style={{width:28,height:28,borderRadius:7,background:`${c.color}15`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:c.color,flexShrink:0}}>{r.id}</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{r.name}</div><div style={{fontSize:11,color:T.textM}}>{r.desc}</div></div><div style={{display:"flex",gap:3}}>{[1,2,3].map(w=><div key={w} style={{width:7,height:7,borderRadius:4,background:w<=r.weight?c.color:T.bg3}}/>)}</div></div>))}
      </div>))}
    </div>
    <div style={{...s.cd,marginTop:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={s.ct}><Zap size={14}/>AI analysis — {sel}</div>
        <button onClick={runAi} disabled={aiLoading} style={{...s.btn(T.accent,"#fff"),opacity:aiLoading?0.6:1}}><RefreshCw size={13} style={aiLoading?{animation:"spin 1s linear infinite"}:{}}/>{aiLoading?"Analyzing...":"Run AI analysis"}</button>
      </div>
      {aiData?(<div style={{background:T.bg,borderRadius:10,padding:18,border:`1px solid ${T.borderL}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
          <span style={{padding:"2px 10px",borderRadius:5,fontSize:11,fontWeight:600,background:aiData.bias==="Bullish"?T.greenBg:aiData.bias==="Bearish"?T.redBg:T.amberBg,color:aiData.bias==="Bullish"?T.green:aiData.bias==="Bearish"?T.red:T.amber}}>{aiData.bias||"N/A"}</span>
          {aiData.instrument&&<span style={{fontSize:11,color:T.textD}}>{aiData.instrument}</span>}
          {aiData.confidence&&<span style={{fontSize:11,color:T.purple,fontWeight:600}}>Confidence {aiData.confidence}/10</span>}
          {aiData.riskReward&&<span style={{fontSize:11,color:T.cyan}}>R:R {aiData.riskReward}</span>}
          {aiData.validFor&&<span style={{fontSize:11,color:T.amber}}>Valid: {aiData.validFor}</span>}
          {lastRef&&<span style={{fontSize:10,color:T.textD,marginLeft:"auto"}}>{new Date(lastRef).toLocaleString()}</span>}
        </div>
        <div style={{fontSize:13,lineHeight:1.7,color:T.text,marginBottom:10}}>{aiData.summary}</div>
        {(aiData.entryZone||aiData.target||aiData.stopLoss)&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
            {aiData.entryZone&&<div style={{padding:"8px 12px",background:T.bg2,borderRadius:8,border:`1px solid ${T.border}`}}><div style={{fontSize:10,color:T.textD,marginBottom:2}}>ENTRY ZONE</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.text,fontWeight:600}}>{aiData.entryZone}</div></div>}
            {aiData.target&&<div style={{padding:"8px 12px",background:T.greenBg,borderRadius:8,border:`1px solid ${T.greenBd}`}}><div style={{fontSize:10,color:T.green,marginBottom:2}}>TARGET</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.green,fontWeight:600}}>{aiData.target}</div></div>}
            {aiData.stopLoss&&<div style={{padding:"8px 12px",background:T.redBg,borderRadius:8,border:`1px solid ${T.redBd}`}}><div style={{fontSize:10,color:T.red,marginBottom:2}}>STOP LOSS</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.red,fontWeight:600}}>{aiData.stopLoss}</div></div>}
          </div>
        )}
        {aiData.cotUpdate&&<div style={{fontSize:12,color:T.textM,marginBottom:4}}><strong style={{color:T.text}}>COT:</strong> {aiData.cotUpdate}</div>}
        {aiData.sentimentUpdate&&<div style={{fontSize:12,color:T.textM,marginBottom:4}}><strong style={{color:T.text}}>Sentiment:</strong> {aiData.sentimentUpdate}</div>}
        {aiData.optionFlowUpdate&&<div style={{fontSize:12,color:T.textM,marginBottom:4}}><strong style={{color:T.cyan}}>Option flow:</strong> {aiData.optionFlowUpdate}</div>}
        {aiData.optionsOIUpdate&&<div style={{fontSize:12,color:T.textM,marginBottom:4}}><strong style={{color:T.blue}}>Options OI:</strong> {aiData.optionsOIUpdate}</div>}
        {aiData.catalysts&&aiData.catalysts.length>0&&<div style={{fontSize:12,color:T.textM,marginBottom:4}}><strong style={{color:T.amber}}>Catalysts:</strong> {aiData.catalysts.join(" · ")}</div>}
        {aiData.keyLevels&&<div style={{display:"flex",gap:14,marginTop:8}}><div style={{fontSize:11,color:T.green}}>Support: {aiData.keyLevels.support}</div><div style={{fontSize:11,color:T.red}}>Resistance: {aiData.keyLevels.resistance}</div></div>}
        <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${T.border}`}}>
          <button onClick={()=>{
            const entry = aiData.entryZone ? aiData.entryZone.split("-")[0].trim() : (liveData[aiData.instrument||sel]?.price||"");
            setNewSig({ instrument: aiData.instrument||sel, direction: aiData.bias==="Bearish"?"Short":"Long", entryPrice: String(entry), targetPrice: aiData.target||"", stopLoss: aiData.stopLoss||"", confidence: Math.min(10, Math.max(1, aiData.confidence||7)), notes: aiData.summary||"", bias: aiData.bias||"Neutral", riskReward: aiData.riskReward||"", validFor: aiData.validFor||"", aiSummary: aiData.summary||"" });
            setView("tradelab"); setLabTab("signals");
          }} style={{...s.btn(T.accent,"#fff"),fontSize:12}}><Plus size={13}/>Log as Signal</button>
        </div>
      </div>):(<div style={{textAlign:"center",padding:30,color:T.textD}}><Brain size={28} style={{marginBottom:10,opacity:0.4}}/><div style={{fontSize:12}}>Run AI analysis for live COT + sentiment + option flow + entry levels</div></div>)}
    </div>
  </>);

  const renderJournal = () => (<>
    <div style={s.cd}>
      <div style={s.ct}><Plus size={14}/>New trade idea</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:10,alignItems:"end"}}>
        <div><label style={{fontSize:10,color:T.textD,display:"block",marginBottom:3}}>Instrument</label><select value={newE.instrument} onChange={e=>setNewE({...newE,instrument:e.target.value})} style={{width:"100%",padding:"7px 10px",borderRadius:7,background:T.bg,border:`1px solid ${T.border}`,color:T.text,fontSize:12}}>{Object.keys(INSTRUMENTS).map(k=><option key={k} value={k}>{k}</option>)}</select></div>
        <div><label style={{fontSize:10,color:T.textD,display:"block",marginBottom:3}}>Direction</label><select value={newE.direction} onChange={e=>setNewE({...newE,direction:e.target.value})} style={{width:"100%",padding:"7px 10px",borderRadius:7,background:T.bg,border:`1px solid ${T.border}`,color:T.text,fontSize:12}}><option>Long</option><option>Short</option></select></div>
        <div><label style={{fontSize:10,color:T.textD,display:"block",marginBottom:3}}>Confidence</label><select value={newE.confidence} onChange={e=>setNewE({...newE,confidence:+e.target.value})} style={{width:"100%",padding:"7px 10px",borderRadius:7,background:T.bg,border:`1px solid ${T.border}`,color:T.text,fontSize:12}}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}</select></div>
        <button onClick={addE} style={{...s.btn(T.accent,"#fff"),height:34}}>Add</button>
      </div>
      <div style={{marginTop:10}}><textarea value={newE.notes} onChange={e=>setNewE({...newE,notes:e.target.value})} placeholder="Trade thesis: COT + sentiment + option flow rationale..." rows={3} style={{width:"100%",padding:"9px 10px",borderRadius:7,background:T.bg,border:`1px solid ${T.border}`,color:T.text,fontSize:12,resize:"vertical",fontFamily:"inherit"}}/></div>
    </div>
    <div style={{...s.cd,marginTop:18}}>
      <div style={s.ct}><BookOpen size={14}/>Trade ideas ({journal.length})</div>
      {journal.length===0?(<div style={{textAlign:"center",padding:30,color:T.textD,fontSize:12}}><BookOpen size={24} style={{marginBottom:8,opacity:0.4}}/><div>No entries yet. Persists across sessions.</div></div>):journal.map(e=>(
        <div key={e.id} style={{display:"flex",gap:10,padding:14,background:T.bg,borderRadius:10,border:`1px solid ${T.border}`,marginBottom:8,alignItems:"flex-start"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:56}}><span style={{fontSize:12,fontWeight:700,color:e.direction==="Long"?T.green:T.red}}>{e.direction}</span><span style={{fontSize:11,fontWeight:600}}>{e.instrument}</span><div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(n=><div key={n} style={{width:5,height:5,borderRadius:3,background:n<=e.confidence?T.accent:T.bg3}}/>)}</div></div>
          <div style={{flex:1}}><div style={{fontSize:12,lineHeight:1.6,color:T.textM}}>{e.notes}</div><div style={{fontSize:10,color:T.textD,marginTop:4}}><Clock size={10} style={{display:"inline",verticalAlign:"middle",marginRight:3}}/>{new Date(e.timestamp).toLocaleString()}</div></div>
          <div style={{display:"flex",gap:5}}>
            <button onClick={()=>saveJ(journal.map(x=>x.id===e.id?{...x,status:x.status==="Open"?"Closed":"Open"}:x))} style={{padding:"3px 8px",borderRadius:5,fontSize:10,fontWeight:600,background:e.status==="Open"?T.greenBg:T.bg3,color:e.status==="Open"?T.green:T.textD,border:`1px solid ${e.status==="Open"?T.greenBd:T.border}`,cursor:"pointer"}}>{e.status}</button>
            <button onClick={()=>saveJ(journal.filter(x=>x.id!==e.id))} style={{padding:"3px 6px",borderRadius:5,background:T.redBg,color:T.red,border:`1px solid ${T.redBd}`,cursor:"pointer",display:"flex",alignItems:"center"}}><Trash2 size={11}/></button>
          </div>
        </div>
      ))}
    </div>
  </>);

  const renderSignals = () => {
    const openSigs = signals.filter(s => s.status === "OPEN");
    const closedSigs = signals.filter(s => s.status === "CLOSED");
    const wins = closedSigs.filter(s => (calcPnL(s, liveData) || 0) > 0).length;
    const winRate = closedSigs.length > 0 ? ((wins / closedSigs.length) * 100).toFixed(0) : null;
    const totalClosedPnL = closedSigs.reduce((acc, s) => acc + (calcPnL(s, liveData) || 0), 0);
    const openPnL = openSigs.reduce((acc, s) => acc + (calcPnL(s, liveData) || 0), 0);

    // Equity curve: cumulative closed P&L over time
    const equityCurve = closedSigs.slice().sort((a, b) => new Date(a.closedAt) - new Date(b.closedAt)).reduce((acc, s, i) => {
      const prev = acc[i - 1]?.cumPnL || 0;
      const pnl = calcPnL(s, liveData) || 0;
      acc.push({ label: new Date(s.closedAt).toLocaleDateString("en-GB", {day:"2-digit",month:"short"}), cumPnL: parseFloat((prev + pnl).toFixed(2)), pnl: parseFloat(pnl.toFixed(2)) });
      return acc;
    }, []);

    const pnlColor = v => v >= 0 ? T.green : T.red;
    const inp = { background: T.bg, border: `1px solid ${T.border}`, color: T.text, fontSize: 12, padding: "7px 10px", borderRadius: 7, width: "100%" };

    return (<>
      {/* Summary stats */}
      <div style={s.g4}>
        <div style={s.cd}><div style={{fontSize:11,color:T.textD,textTransform:"uppercase",letterSpacing:0.6,marginBottom:6}}>Total Signals</div><div style={{fontSize:28,fontWeight:700}}>{signals.length}</div><div style={{fontSize:11,color:T.textM}}>{openSigs.length} open · {closedSigs.length} closed</div></div>
        <div style={s.cd}><div style={{fontSize:11,color:T.textD,textTransform:"uppercase",letterSpacing:0.6,marginBottom:6}}>Win Rate</div><div style={{fontSize:28,fontWeight:700,color:winRate>=50?T.green:winRate!==null?T.red:T.textD}}>{winRate!==null?winRate+"%":"—"}</div><div style={{fontSize:11,color:T.textM}}>{wins} wins / {closedSigs.length - wins} losses</div></div>
        <div style={s.cd}><div style={{fontSize:11,color:T.textD,textTransform:"uppercase",letterSpacing:0.6,marginBottom:6}}>Closed P&L</div><div style={{fontSize:28,fontWeight:700,color:pnlColor(totalClosedPnL)}}>{totalClosedPnL>=0?"+":""}{totalClosedPnL.toFixed(2)}%</div><div style={{fontSize:11,color:T.textM}}>{closedSigs.length} closed trades</div></div>
        <div style={s.cd}><div style={{fontSize:11,color:T.textD,textTransform:"uppercase",letterSpacing:0.6,marginBottom:6}}>Open P&L</div><div style={{fontSize:28,fontWeight:700,color:pnlColor(openPnL)}}>{openPnL>=0?"+":""}{openPnL.toFixed(2)}%</div><div style={{fontSize:11,color:T.textM}}>{openSigs.length} open trades</div></div>
      </div>

      {/* New signal form */}
      <div style={s.cd}>
        <div style={s.ct}><Plus size={14}/>Log New Signal</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:10}}>
          <div><label style={{fontSize:10,color:T.textD,display:"block",marginBottom:3}}>Instrument</label><select value={newSig.instrument} onChange={e=>setNewSig({...newSig,instrument:e.target.value})} style={inp}>{Object.keys(INSTRUMENTS).map(k=><option key={k}>{k}</option>)}</select></div>
          <div><label style={{fontSize:10,color:T.textD,display:"block",marginBottom:3}}>Direction</label><select value={newSig.direction} onChange={e=>setNewSig({...newSig,direction:e.target.value})} style={inp}><option>Long</option><option>Short</option></select></div>
          <div><label style={{fontSize:10,color:T.textD,display:"block",marginBottom:3}}>Bias</label><select value={newSig.bias} onChange={e=>setNewSig({...newSig,bias:e.target.value})} style={inp}><option>Bullish</option><option>Bearish</option><option>Neutral</option></select></div>
          <div><label style={{fontSize:10,color:T.textD,display:"block",marginBottom:3}}>Confidence (1-10)</label><input type="number" min={1} max={10} value={newSig.confidence} onChange={e=>setNewSig({...newSig,confidence:+e.target.value})} style={inp}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:10}}>
          <div><label style={{fontSize:10,color:T.textD,display:"block",marginBottom:3}}>Entry Price</label><input type="number" step="any" value={newSig.entryPrice} onChange={e=>setNewSig({...newSig,entryPrice:e.target.value})} placeholder={liveData[newSig.instrument]?.price||"0"} style={inp}/></div>
          <div><label style={{fontSize:10,color:T.textD,display:"block",marginBottom:3}}>Target Price</label><input type="number" step="any" value={newSig.targetPrice} onChange={e=>setNewSig({...newSig,targetPrice:e.target.value})} style={inp}/></div>
          <div><label style={{fontSize:10,color:T.textD,display:"block",marginBottom:3}}>Stop Loss</label><input type="number" step="any" value={newSig.stopLoss} onChange={e=>setNewSig({...newSig,stopLoss:e.target.value})} style={inp}/></div>
          <div><label style={{fontSize:10,color:T.textD,display:"block",marginBottom:3}}>R:R</label><input type="text" value={newSig.riskReward||""} onChange={e=>setNewSig({...newSig,riskReward:e.target.value})} placeholder="e.g. 1:2.5" style={inp}/></div>
        </div>
        <textarea value={newSig.notes} onChange={e=>setNewSig({...newSig,notes:e.target.value})} placeholder="Trade thesis (AI-generated or manual)..." rows={2} style={{...inp,width:"100%",resize:"vertical",marginBottom:10,fontFamily:"inherit"}}/>
        <button onClick={async ()=>{ if(!newSig.entryPrice) return; await createSignal({...newSig, entryPrice: newSig.entryPrice || liveData[newSig.instrument]?.price}); setNewSig({instrument:"XAUUSD",direction:"Long",entryPrice:"",targetPrice:"",stopLoss:"",confidence:7,notes:"",bias:"Neutral",riskReward:"",validFor:"",aiSummary:""}); }} disabled={signalsLoading||!newSig.entryPrice} style={{...s.btn(T.accent,"#fff"),opacity:(!newSig.entryPrice||signalsLoading)?0.5:1}}><Plus size={13}/>{signalsLoading?"Saving...":"Log Signal"}</button>
      </div>

      {/* Open signals */}
      {userTrades.length > 0 && <div style={{...s.cd,marginTop:18, border: `1px solid ${T.purple}40`, background: `linear-gradient(to bottom right, ${T.bg2}, ${T.purple}10)`}}>
        <div style={{...s.ct, color: T.purple}}><Activity size={14}/>Live Session Trades ({userTrades.length})</div>
        <div style={{overflowX:"auto"}}>
          <table style={{...s.tb,minWidth:700}}><thead><tr>
            {["Pair","Dir","Entry","Current","Lot","P&L (%)","Opened",""].map(h=><th key={h} style={s.th}>{h}</th>)}
          </tr></thead><tbody>
            {userTrades.map(t => {
                const cur = liveData[t.instr]?.price;
                const pnl = cur ? ((cur - t.entry) / t.entry) * 100 * (t.dir === "BUY" ? 1 : -1) : 0;
                return (
                  <tr key={t.id}>
                    <td style={{...s.td, fontWeight: 700}}>{t.instr} <span style={{fontSize: 9, padding: "2px 4px", borderRadius: 4, background: T.purple, color: "#fff", marginLeft: 4}}>LIVE</span></td>
                    <td style={{...s.td, color: t.dir === "BUY" ? T.green : T.red, fontWeight: 600}}>{t.dir}</td>
                    <td style={s.td}>{t.entry}</td>
                    <td style={{...s.td, color: T.cyan}}>{cur || "—"}</td>
                    <td style={s.td}>{t.lot}</td>
                    <td style={{...s.td, fontWeight: 700, color: pnlColor(pnl)}}>{pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}%</td>
                    <td style={{...s.td, color: T.textD, fontSize: 11}}>{new Date(t.timestamp).toLocaleTimeString()}</td>
                    <td style={s.td}>
                        <button onClick={() => setUserTrades(userTrades.filter(it => it.id !== t.id))} style={{...s.btn(T.redBg, T.red), padding: "4px 8px", border: `1px solid ${T.redBd}`}}>Close</button>
                    </td>
                  </tr>
                )
            })}
          </tbody></table>
        </div>
      </div>}

      {openSigs.length > 0 && <div style={{...s.cd,marginTop:18}}>
        <div style={s.ct}><Radio size={14}/>Open Signals ({openSigs.length})</div>
        <div style={{overflowX:"auto"}}>
          <table style={{...s.tb,minWidth:700}}><thead><tr>
            {["Pair","Dir","Entry","Current","Target","Stop","P&L %","Conf","Logged",""].map(h=><th key={h} style={s.th}>{h}</th>)}
          </tr></thead><tbody>
            {openSigs.map(sig => {
              const pnl = calcPnL(sig, liveData);
              const cur = liveData[sig.instrument]?.price;
              return (<tr key={sig.id}>
                <td style={{...s.td,fontWeight:700}}>{sig.instrument}</td>
                <td style={{...s.td,color:sig.direction==="Long"?T.green:T.red,fontWeight:600}}>{sig.direction}</td>
                <td style={s.td}>{sig.entryPrice}</td>
                <td style={{...s.td,color:T.cyan}}>{cur||"—"}</td>
                <td style={{...s.td,color:T.green}}>{sig.targetPrice||"—"}</td>
                <td style={{...s.td,color:T.red}}>{sig.stopLoss||"—"}</td>
                <td style={{...s.td,fontWeight:700,color:pnl===null?"#fff":pnlColor(pnl)}}>{pnl===null?"—":`${pnl>=0?"+":""}${pnl.toFixed(2)}%`}</td>
                <td style={s.td}>{sig.confidence}/10</td>
                <td style={{...s.td,color:T.textD,fontSize:11}}>{new Date(sig.createdAt).toLocaleDateString()}</td>
                <td style={s.td}>
                  {closeForm?.id===sig.id ? (
                    <div style={{display:"flex",gap:4,alignItems:"center"}}>
                      <input type="number" step="any" value={closeForm.exitPrice} onChange={e=>setCloseForm({...closeForm,exitPrice:e.target.value})} placeholder="Exit price" style={{...inp,width:90,padding:"3px 6px"}}/>
                      <button onClick={()=>closeSignal(sig.id,parseFloat(closeForm.exitPrice))} style={{...s.btn(T.green,"#fff"),padding:"3px 8px",fontSize:11}}>Close</button>
                      <button onClick={()=>setCloseForm(null)} style={{...s.btn(T.bg3,T.textM),padding:"3px 6px",fontSize:11}}>✕</button>
                    </div>
                  ) : (
                    <div style={{display:"flex",gap:4}}>
                      <button onClick={()=>setCloseForm({id:sig.id,exitPrice:cur||""})} style={{...s.btn(T.amberBg,T.amber),padding:"3px 8px",fontSize:11,border:`1px solid ${T.amberBd}`}}>Close</button>
                      <button onClick={()=>deleteSignal(sig.id)} style={{...s.btn(T.redBg,T.red),padding:"3px 6px",border:`1px solid ${T.redBd}`}}><Trash2 size={11}/></button>
                    </div>
                  )}
                </td>
              </tr>);
            })}
          </tbody></table>
        </div>
      </div>}

      {/* Equity curve */}
      {equityCurve.length > 1 && <div style={{...s.cd,marginTop:18}}>
        <div style={s.ct}><TrendingUp size={14}/>Equity Curve — Cumulative Closed P&L (%)</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={equityCurve} margin={{top:5,right:10,bottom:5,left:0}}>
            <defs><linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.green} stopOpacity={0.3}/><stop offset="95%" stopColor={T.green} stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="label" tick={{fill:T.textD,fontSize:10}}/>
            <YAxis tick={{fill:T.textD,fontSize:10}} tickFormatter={v=>`${v>0?"+":""}${v}%`}/>
            <Tooltip contentStyle={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:8,fontSize:12}} formatter={(v)=>[`${v>=0?"+":""}${v}%`,"Cum P&L"]}/>
            <Area type="monotone" dataKey="cumPnL" stroke={T.green} fill="url(#eqGrad)" strokeWidth={2} dot={{fill:T.green,r:3}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>}

      {/* Closed history */}
      {closedSigs.length > 0 && <div style={{...s.cd,marginTop:18}}>
        <div style={s.ct}><BookOpen size={14}/>Closed Signal History ({closedSigs.length})</div>
        <div style={{overflowX:"auto"}}>
          <table style={{...s.tb,minWidth:700}}><thead><tr>
            {["Pair","Dir","Entry","Exit","P&L %","R:R","Conf","Opened","Closed","Bias"].map(h=><th key={h} style={s.th}>{h}</th>)}
          </tr></thead><tbody>
            {closedSigs.map(sig => {
              const pnl = calcPnL(sig, liveData);
              return (<tr key={sig.id} style={{opacity:0.85}}>
                <td style={{...s.td,fontWeight:700}}>{sig.instrument}</td>
                <td style={{...s.td,color:sig.direction==="Long"?T.green:T.red,fontWeight:600}}>{sig.direction}</td>
                <td style={s.td}>{sig.entryPrice}</td>
                <td style={s.td}>{sig.exitPrice||"—"}</td>
                <td style={{...s.td,fontWeight:700,color:pnl===null?T.textD:pnlColor(pnl)}}>{pnl===null?"—":`${pnl>=0?"+":""}${pnl.toFixed(2)}%`}</td>
                <td style={s.td}>{sig.riskReward||"—"}</td>
                <td style={s.td}>{sig.confidence}/10</td>
                <td style={{...s.td,fontSize:11,color:T.textD}}>{new Date(sig.createdAt).toLocaleDateString()}</td>
                <td style={{...s.td,fontSize:11,color:T.textD}}>{sig.closedAt?new Date(sig.closedAt).toLocaleDateString():"—"}</td>
                <td style={{...s.td,color:sig.bias==="Bullish"?T.green:sig.bias==="Bearish"?T.red:T.amber,fontSize:11}}>{sig.bias||"—"}</td>
              </tr>);
            })}
          </tbody></table>
        </div>
      </div>}

      {signals.length === 0 && <div style={{...s.cd,marginTop:18,textAlign:"center",padding:40}}>
        <Target size={32} style={{color:T.textD,marginBottom:12,opacity:0.4}}/>
        <div style={{fontSize:13,color:T.textM,marginBottom:6}}>No signals logged yet</div>
        <div style={{fontSize:11,color:T.textD}}>Run AI analysis in the Strategy tab, then click "Log as Signal" — or create one manually above.</div>
      </div>}
    </>);
  };

  return (
    <div style={s.root}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet"/>
      <header style={s.hdr}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:`linear-gradient(135deg,${T.accent},${T.cyan})`,display:"flex",alignItems:"center",justifyContent:"center"}}><Activity size={18} color="#fff"/></div>
          <div><div style={{fontSize:17,fontWeight:700,letterSpacing:-0.5}}>TradingIntel</div><div style={{fontSize:10,color:T.textD}}>COT · Sentiment · Order flow · Strategy</div></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {isLive && <div style={{display:"flex",alignItems:"center",gap:5,padding:"3px 8px",borderRadius:6,background:T.greenBg,border:`1px solid ${T.greenBd}`}}>
            <div style={{width:6,height:6,borderRadius:3,background:T.green,animation:"pulse 1.5s infinite"}}/>
            <span style={{fontSize:10,fontWeight:700,color:T.green,letterSpacing:0.8}}>LIVE</span>
          </div>}
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:T.green}}>
              <div style={{width:5,height:5,borderRadius:3,background:T.green,animation:"pulse 1.5s infinite"}}/>
              Prices: Real-time (Yahoo Finance)
            </div>
            <span style={{color:T.border}}>|</span>
            <div style={{fontSize:10,color:T.amber,display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:5,height:5,borderRadius:3,background:T.amber}}/>
              COT: {inst?.cot?.date||"Apr 7, 2026"} (weekly CFTC)
            </div>
            <span style={{color:T.border}}>|</span>
            <div style={{fontSize:10,color:T.textD}}>Sentiment: Myfxbook live</div>
            {lastRef&&<span style={{fontSize:10,color:T.textD}}>· AI: {new Date(lastRef).toLocaleDateString()}</span>}
          </div>
          <Link href="/profile" style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:7,fontSize:12,fontWeight:600,border:`1px solid ${T.border}`,color:T.textM,textDecoration:"none"}}><User size={13}/>Profile</Link>
          <button onClick={()=>signOut({callbackUrl:"/login"})} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:7,fontSize:12,fontWeight:600,border:`1px solid ${T.border}`,color:T.textM,background:"transparent",cursor:"pointer"}}><LogOut size={13}/>Logout</button>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
        </div>
      </header>
      <nav style={s.nav}>{VIEWS.map(v=>{const I=VIEW_ICONS[v];return <button key={v} style={s.ni(view===v)} onClick={()=>setView(v)}><I size={13}/>{VIEW_LABELS[v]}</button>})}</nav>
      {view!=="overview"&&view!=="intelligence"&&<div style={s.ib}>{Object.keys(INSTRUMENTS).filter(k=>view!=="marketintel"||k!=="EURUSD").map(k=><div key={k} style={s.ic(sel===k)} onClick={()=>{setSel(k);setPosTab("overview");}}>{k}</div>)}</div>}
      <main style={view==="intelligence"?{padding:0,flex:1,display:"flex",flexDirection:"column",minHeight:0,overflow:"hidden"}:{...s.mn,flex:1,overflowY:"auto"}}>
        {view==="overview"&&renderOverview()}
        {view==="intelligence"&&<TradingIntelligence />}
        {view==="marketintel"&&renderPositioning()}
        {view==="tradelab"&&renderTradeLab()}
      </main>
      <footer style={{padding:"14px 24px",borderTop:`1px solid ${T.border}`,textAlign:"center",fontSize:10,color:T.textD,flexShrink:0}}>CFTC COT · Myfxbook · DailyFX · InvestingLive (ForexLive) · Not financial advice.</footer>
      <ChatAssistant selectedInstrument={sel} intelligenceData={intelData} />
    </div>

  );
}

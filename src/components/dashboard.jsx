"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ComposedChart, Cell } from "recharts";
import { TrendingUp, TrendingDown, Activity, BarChart3, Brain, BookOpen, RefreshCw, AlertTriangle, Target, Shield, Zap, Plus, Trash2, ArrowUpRight, ArrowDownRight, Clock, Database, Crosshair, Layers, Radio, ExternalLink, LogOut, User, Menu, X } from "lucide-react";
import ChatAssistant from "./chat-assistant";
import AdvancedChart from "./AdvancedChart";
import TradePanel from "./TradePanel";
import TradingIntelligence from "./TradingIntelligence";
import { TVCalendar, TVTechnicalAnalysis } from "./TradingViewWidgets";


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

const VIEWS = ["overview", "intelligence", "intel-hub", "calendar", "tradelab"];
const VIEW_LABELS = {
  overview: "Overview",
  intelligence: "Chart Terminal",
  "intel-hub": "Intelligence Hub",
  calendar: "Economic Calendar",
  tradelab: "Trade Lab",
};
const VIEW_ICONS = {
  overview: Activity,
  intelligence: Crosshair,
  "intel-hub": Brain,
  calendar: Clock,
  tradelab: Zap,
};

// ── Economic Calendar ─────────────────────────────────────────────────
function EconomicCalendar() {
  return (
    <div className="cal-wrap" style={{ maxWidth: 1000, margin: "0 auto", padding: "0 4px", height: "calc(100vh - 200px)" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text, fontFamily: "var(--font-geist-mono), monospace" }}>Economic Calendar</div>
        <div style={{ fontSize: 12, color: T.textD, marginTop: 2, fontFamily: "var(--font-geist-mono), monospace" }}>Real-time global macro events · Powered by TradingView</div>
      </div>
      <TVCalendar height="calc(100% - 56px)" />
    </div>
  );
}


export default function TradingDashboard() {
  if (typeof window !== "undefined" && !window.storage) {
    window.storage = {
      get: async (k) => ({ value: localStorage.getItem(k) }),
      set: async (k, v) => localStorage.setItem(k, v)
    };
  }
  const [view, setView] = useState("overview");
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
  const [cotLive, setCotLive] = useState(null);
  const [cotLoading, setCotLoading] = useState(false);
  const [posTab, setPosTab] = useState("signal");
  const [labTab, setLabTab] = useState("scanner");
  const [menuOpen, setMenuOpen] = useState(false);


  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/prices");
      const json = await res.json();
      if (json.data) {
        setLiveData(json.data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, 3000);
    return () => clearInterval(id);
  }, [fetchPrices]);

  const fetchIntelligence = useCallback(async () => {
    try {
      const r = await fetch("/api/intelligence");
      const data = await r.json();
      setIntelData(data);

      // Process RSI Alerts from the master data stream
      if (data.instruments) {
        const newAlerts = [];
        Object.entries(data.instruments).forEach(([key, inst]) => {
          if (inst.rsiDivergence) {
            newAlerts.push({
              instrument: key,
              timeframe: data.interval === "1d" ? "D" : data.interval,
              type: inst.rsiDivergence.type,
              msg: inst.rsiDivergence.msg,
              timestamp: Date.now()
            });
          }
        });

        if (newAlerts.length > 0) {
          setRsiAlerts(prev => {
            // Only add if not already in the last 5 alerts for this instrument/type
            const filtered = newAlerts.filter(na => 
              !prev.some(pa => pa.instrument === na.instrument && pa.type === na.type && (Date.now() - pa.timestamp < 300000))
            );
            return [...filtered, ...prev].slice(0, 10);
          });
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchIntelligence();
    const id = setInterval(fetchIntelligence, 30000);
    return () => clearInterval(id);
  }, [fetchIntelligence]);

  const [rsiAlerts, setRsiAlerts] = useState([]);
  const [sigToasts, setSigToasts] = useState([]);
  const [mtfRsi, setMtfRsi] = useState({});

  const fetchMtfRsi = useCallback(async () => {
    try {
      const [r15, r1h, r4h] = await Promise.all([
        fetch("/api/intelligence?interval=15m&range=5d"),
        fetch("/api/intelligence?interval=60m&range=1mo"),
        fetch("/api/intelligence?interval=60m&range=3mo"),
      ]);
      const [d15, d1h, d4h] = await Promise.all([r15.json(), r1h.json(), r4h.json()]);
      const keys = ["XAUUSD", "GBPUSD", "GBPJPY", "BTCUSD", "EURUSD"];
      const mtf = {};
      for (const k of keys) {
        mtf[k] = {
          "15M": d15?.instruments?.[k]?.rsi ?? null,
          "1H":  d1h?.instruments?.[k]?.rsi ?? null,
          "4H":  d4h?.instruments?.[k]?.rsi ?? null,
        };
      }
      setMtfRsi(mtf);
    } catch {}
  }, []);

  useEffect(() => {
    fetchMtfRsi();
    const id = setInterval(fetchMtfRsi, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchMtfRsi]);

  // Fetch live COT data on mount and when Intel Hub is opened
  useEffect(() => {
    if (!cotLive && !cotLoading) {
      setCotLoading(true);
      fetch("/api/cot")
        .then(r => r.json())
        .then(data => { setCotLive(data); setCotLoading(false); })
        .catch(() => setCotLoading(false));
    }
  }, [cotLive, cotLoading]);


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

  const closingRef = useRef(new Set());

  const closeSignal = async (id, exitPrice, result) => {
    try {
      const res = await fetch(`/api/signals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CLOSED", exitPrice, result: result || null }) });
      const json = await res.json();
      if (json.signal) setSignals(prev => prev.map(s => s.id === id ? json.signal : s));
    } catch {}
    setCloseForm(null);
  };

  // Auto-close: fires whenever liveData OR signals changes — no stale closure
  useEffect(() => {
    if (!liveData || Object.keys(liveData).length === 0) return;
    signals.filter(sg => sg.status === "OPEN" && !closingRef.current.has(sg.id)).forEach(sg => {
      const price = liveData[sg.instrument]?.price;
      if (!price) return;
      const isLong = sg.direction === "Long";
      const tpHit = sg.targetPrice && (isLong ? price >= Number(sg.targetPrice) : price <= Number(sg.targetPrice));
      const slHit = sg.stopLoss  && (isLong ? price <= Number(sg.stopLoss)  : price >= Number(sg.stopLoss));
      if (!tpHit && !slHit) return;
      closingRef.current.add(sg.id);
      const result = tpHit ? "WIN" : "LOSS";
      fetch(`/api/signals/${sg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED", exitPrice: price, result }),
      }).then(r => {
        if (!r.ok) { closingRef.current.delete(sg.id); fetchSignals(); return null; }
        return r.json();
      }).then(data => {
        if (!data) return;
        if (data.signal) setSignals(prev => prev.map(s => s.id === sg.id ? data.signal : s));
        else fetchSignals();
        const toast = { id: sg.id + Date.now(), instrument: sg.instrument, direction: sg.direction, result, price, ts: Date.now() };
        setSigToasts(prev => [toast, ...prev.slice(0, 4)]);
        setTimeout(() => setSigToasts(prev => prev.filter(t => t.id !== toast.id)), 6000);
      }).catch(() => { closingRef.current.delete(sg.id); });
    });
  }, [liveData, signals, fetchSignals]);

  // ── Signal auto-generator ─────────────────────────────────────────────────
  const [autoGenLoading, setAutoGenLoading] = useState(false);
  const [lastAutoGen, setLastAutoGen] = useState(null);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  // Request notification permission on mount
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().then(p => setNotifPermission(p));
    }
  }, []);

  const sendNotification = (title, body, tag) => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try { new Notification(title, { body, tag, icon: "/favicon.ico", requireInteraction: false }); } catch {}
  };

  const generateASetups = useCallback(async (silent = false) => {
    if (!silent) setAutoGenLoading(true);

    // Build COT / sentiment / options payloads from static INSTRUMENTS data
    const cot = {}, sentiment = {}, options = {};
    for (const [key, inst] of Object.entries(INSTRUMENTS)) {
      if (inst.cot) cot[key] = inst.cot;
      if (inst.sentiment) sentiment[key] = inst.sentiment;
      if (OPTIONS_OI.instruments[key]) options[key] = OPTIONS_OI.instruments[key];
    }

    try {
      const res = await fetch("/api/signals/autogen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ livePrices: liveData, cot, sentiment, options }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.created?.length > 0) {
        fetchSignals(); // refresh signal list
        setLastAutoGen({ ts: Date.now(), created: data.created.map(s => s.instrument), errors: data.errors });

        // Send browser notification for each new signal
        data.created.forEach(sig => {
          const pattern = sig.notes?.match(/\[AUTO\] ([^|]+)/)?.[1]?.trim() || "Signal";
          sendNotification(
            `📊 New ${sig.grade}-Grade Signal: ${sig.instrument}`,
            `${sig.direction} | ${pattern} | Entry ${sig.entryPrice} | SL ${sig.stopLoss} | TP ${sig.targetPrice}`,
            `signal-${sig.id}`
          );
        });
      } else {
        setLastAutoGen({ ts: Date.now(), created: [], errors: data.errors, skipped: data.skipped });
      }
    } catch (e) {
      setLastAutoGen({ ts: Date.now(), created: [], errors: [e.message] });
    }

    if (!silent) setAutoGenLoading(false);
  }, [liveData, fetchSignals]);

  // Auto-scan every 10 minutes (silent, no loading spinner)
  useEffect(() => {
    const id = setInterval(() => generateASetups(true), 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [generateASetups]);

  const deleteSignal = async (id) => {
    try {
      await fetch(`/api/signals/${id}`, { method: "DELETE" });
      setSignals(prev => prev.filter(s => s.id !== id));
    } catch {}
  };

  const getLivePrice = (instrument) =>
    liveData[instrument]?.price ?? liveInstruments[instrument]?.price ?? null;

  const calcPnL = (sig, livePrices) => {
    const currentPrice = sig.status === "CLOSED"
      ? sig.exitPrice
      : (livePrices[sig.instrument]?.price ?? getLivePrice(sig.instrument));
    if (!currentPrice || !sig.entryPrice || currentPrice === sig.entryPrice) return null;
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
    root: { height: "100vh", display: "flex", flexDirection: "column", background: T.bg, color: T.text, fontFamily: "var(--font-geist-mono), monospace", overflow: "hidden" },
    hdr: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px clamp(16px, 4vw, 24px)", borderBottom: `1px solid ${T.border}`, background: T.bg2, flexWrap: "wrap", gap: 10, flexShrink: 0 },
    nav: { display: "flex", gap: 2, padding: "0 clamp(16px, 4vw, 24px)", background: T.bg2, borderBottom: `1px solid ${T.border}`, overflowX: "auto", scrollbarWidth: "none", flexShrink: 0 },
    ni: a => ({ padding: "11px 14px", fontSize: 12, fontWeight: a ? 600 : 400, color: a ? T.accent : T.textM, cursor: "pointer", border: "none", background: "none", borderBottom: a ? `2px solid ${T.accent}` : "2px solid transparent", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }),
    ib: { display: "flex", gap: 6, padding: "12px 24px", flexWrap: "wrap" },
    ic: a => ({ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", border: `1px solid ${a ? T.accent : T.border}`, background: a ? T.purpleBg : T.bg2, color: a ? T.accent : T.textM }),
    mn: { padding: "clamp(12px, 3vw, 24px)", width: "100%", boxSizing: "border-box" },
    g4: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 12, marginBottom: 18 },
    g2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", gap: 14, marginBottom: 18 },
    cd: { background: T.bg2, borderRadius: 12, padding: 18, border: `1px solid ${T.border}` },
    ct: { fontSize: 12, fontWeight: 600, color: T.textM, marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.8, display: "flex", alignItems: "center", gap: 8 },
    tb: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
    th: { textAlign: "left", color: T.textD, fontWeight: 400, padding: "5px 8px", fontSize: 11, borderBottom: `1px solid ${T.border}`, textTransform: "uppercase", letterSpacing: 0.4 },
    td: { padding: "7px 8px", borderBottom: `1px solid ${T.border}`, fontFamily: "var(--font-geist-mono), monospace", fontSize: 12 },
    sr: t => ({ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 13px", borderRadius: 8, background: SigBg(t), border: `1px solid ${SigBd(t)}`, marginBottom: 7, fontSize: 13, lineHeight: 1.5 }),
    btn: (bg, c) => ({ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", background: bg, color: c, border: "none", display: "flex", alignItems: "center", gap: 6 }),
  };

  if (loading) return (<div style={{ ...s.root, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ textAlign: "center" }}><RefreshCw size={28} style={{ color: T.accent, animation: "spin 1s linear infinite" }} /><div style={{ marginTop: 10, color: T.textM, fontSize: 13 }}>Loading...</div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div></div>);

  const priceStr = i => ["XAUUSD","BTCUSD"].includes(i.name) ? `$${i.price.toLocaleString()}` : i.price.toFixed(i.name === "GBPJPY" ? 2 : 4);

  // ── Per-instrument master score helper (used by overview) ────────────
  const computeInstrumentScore = (key) => {
    const inst = liveInstruments[key];
    const d = intelData?.instruments?.[key];
    if (!inst) return { master: 50, dir: "WAIT", taScore: 50, smcScore: 50, cotScore: 50, tfLabel: "—", color: T.amber, conflicted: false };

    const cotScore = (() => {
      const net = inst.cot.netSpec;
      if (!net) return 50;
      if (net > 100000) return 74; if (net > 50000) return 62; if (net > 0) return 55;
      if (net > -50000) return 44; if (net > -100000) return 36; return 25;
    })();
    const sentScore = 100 - inst.sentiment.retailLong;
    const oo = OPTIONS_OI.instruments[key];
    const pcrScore = oo?.putCallRatio != null ? Math.round(Math.max(10, Math.min(90, 50 + (1 - oo.putCallRatio) * 38))) : 50;

    const livePrice = liveData[key]?.price;
    const taScore = d ? (() => {
      let s = 50;
      if (d.trend === "BULLISH") s += 14; else if (d.trend === "BEARISH") s -= 14;
      if (d.rsi > 55) s += 8; else if (d.rsi < 45) s -= 8;
      if (d.rsi > 70) s -= 6; else if (d.rsi < 30) s += 6;
      if (d.macd?.cross === "bullish") s += 10; else if (d.macd?.cross === "bearish") s -= 10;
      else if (d.macd?.histogram > 0) s += 5; else if (d.macd?.histogram < 0) s -= 5;
      if (d.structure === "BREAKOUT") s += 12; else if (d.structure === "BREAKDOWN") s -= 12;
      else if (d.structure === "TRENDING") s += 6;
      if (d.sma) {
        const c = livePrice ?? d.current;
        if (c) {
          if (c > d.sma.sma20 && c > d.sma.sma50 && c > d.sma.sma200) s += 8;
          else if (c < d.sma.sma20 && c < d.sma.sma50 && c < d.sma.sma200) s -= 8;
        }
      }
      return Math.min(100, Math.max(0, Math.round(s)));
    })() : 50;

    const smcScore = d?.smc?.score ?? 50;
    const taDir = taScore >= 58 ? "BULL" : taScore <= 42 ? "BEAR" : "NEUTRAL";
    const smcDir = smcScore >= 58 ? "BULL" : smcScore <= 42 ? "BEAR" : "NEUTRAL";
    const conflicted = taDir !== "NEUTRAL" && smcDir !== "NEUTRAL" && taDir !== smcDir;
    const raw = Math.round(taScore*0.28 + smcScore*0.27 + cotScore*0.20 + sentScore*0.13 + pcrScore*0.12);
    const master = conflicted ? Math.round(raw * 0.7 + 50 * 0.3) : raw;
    const dir = master >= 58 ? "BUY" : master <= 42 ? "SELL" : "WAIT";
    const color = dir === "BUY" ? T.green : dir === "SELL" ? T.red : T.amber;
    const tfLabel = master >= 68 && !conflicted ? "4H" : master >= 58 && !conflicted ? "1H" : master >= 48 && !conflicted ? "15M" : "Wait";
    return { master, dir, taScore, smcScore, cotScore, sentScore, pcrScore, tfLabel, color, conflicted, signal: d?.signal, trend: d?.trend, structure: d?.structure, rsi: d?.rsi, price: livePrice ?? d?.current ?? inst.price, change: liveData[key]?.change ?? d?.change ?? inst.change };
  };

  const renderOverview = () => {
    const allScores = Object.keys(liveInstruments).reduce((acc, k) => { acc[k] = computeInstrumentScore(k); return acc; }, {});
    const activeSigs = Object.entries(allScores).filter(([, s]) => s.dir !== "WAIT" && s.signal);
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" });

    // ── Derived stats ──────────────────────────────────────────────────────────
    const openSigsAll = signals.filter(s => s.status === "OPEN");
    const closedSigsAll = signals.filter(s => s.status === "CLOSED");
    const wins = closedSigsAll.filter(s => s.result === "WIN").length;
    const losses = closedSigsAll.filter(s => s.result === "LOSS").length;
    const winRate = closedSigsAll.length > 0 ? Math.round((wins / closedSigsAll.length) * 100) : null;
    const sessionPnL = openSigsAll.reduce((acc, sg) => {
      const cur = liveData[sg.instrument]?.price;
      if (!cur || !sg.entryPrice) return acc;
      const raw = ((cur - sg.entryPrice) / sg.entryPrice) * 100;
      return acc + (sg.direction === "Long" ? raw : -raw);
    }, 0);
    const bullCount = Object.values(allScores).filter(s => s.dir === "BUY").length;
    const bearCount = Object.values(allScores).filter(s => s.dir === "SELL").length;
    const topSetup = Object.entries(allScores).filter(([, s]) => s.dir !== "WAIT").sort((a, b) => b[1].master - a[1].master)[0];

    const fmtPrice = (key, v) => {
      if (v == null) return "—";
      if (key === "BTCUSD") return "$" + Math.round(v).toLocaleString();
      if (v > 100) return v.toFixed(2);
      return v.toFixed(5);
    };

    return (
      <>
        {/* ── Page header ─────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: T.text, letterSpacing: "-0.5px" }}>Market Overview</div>
            <div style={{ fontSize: 11, color: T.textD, marginTop: 3 }}>Live intelligence · {timeStr} · {Object.keys(liveInstruments).length} instruments tracked</div>
          </div>
          <div className="overview-actions" style={{ display: "flex", gap: 8 }}>
            <button onClick={() => generateASetups(false)} disabled={autoGenLoading} style={{ ...s.btn(T.purpleBg, T.accent), fontSize: 11, border: `1px solid ${T.purpleBd}`, display: "flex", alignItems: "center", gap: 5 }}>
              <Zap size={12} />{autoGenLoading ? "Scanning…" : "Scan Signals"}
            </button>
            <button onClick={() => setView("intelligence")} style={{ ...s.btn(T.bg3, T.cyan), fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}><Crosshair size={12}/><span className="hdr-meta" style={{display:"flex"}}>Chart Terminal</span></button>
            <button onClick={() => setView("intel-hub")} style={{ ...s.btn(T.bg3, T.text), fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}><Brain size={12}/><span className="hdr-meta" style={{display:"flex"}}>Intel Hub</span></button>
          </div>
        </div>

        {/* ── Session stat pills ───────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 24 }}>
          {[
            {
              label: "Session P&L", icon: <TrendingUp size={15} />,
              value: openSigsAll.length ? `${sessionPnL >= 0 ? "+" : ""}${sessionPnL.toFixed(2)}%` : "—",
              sub: `${openSigsAll.length} open position${openSigsAll.length !== 1 ? "s" : ""}`,
              color: sessionPnL >= 0 ? T.green : T.red,
            },
            {
              label: "Win Rate", icon: <Target size={15} />,
              value: winRate != null ? `${winRate}%` : "—",
              sub: `${wins}W / ${losses}L from ${closedSigsAll.length} closed`,
              color: winRate >= 50 ? T.green : winRate != null ? T.red : T.textD,
            },
            {
              label: "Market Bias", icon: <Activity size={15} />,
              value: bullCount > bearCount ? `${bullCount} BULL` : bearCount > bullCount ? `${bearCount} BEAR` : "MIXED",
              sub: `${bullCount} bull · ${bearCount} bear · ${5 - bullCount - bearCount} neutral`,
              color: bullCount > bearCount ? T.green : bearCount > bullCount ? T.red : T.amber,
            },
            {
              label: "Top Setup", icon: <Zap size={15} />,
              value: topSetup ? topSetup[0] : "None",
              sub: topSetup ? `${topSetup[1].dir} · Score ${topSetup[1].master}/100` : "No active signals",
              color: topSetup ? topSetup[1].color : T.textD,
            },
            {
              label: "Last Signal Scan", icon: <Radio size={15} />,
              value: lastAutoGen ? (lastAutoGen.created.length > 0 ? `${lastAutoGen.created.length} fired` : "None") : "Not run",
              sub: lastAutoGen ? new Date(lastAutoGen.ts).toLocaleTimeString() : "Click Scan Signals",
              color: lastAutoGen?.created?.length > 0 ? T.green : T.textD,
            },
          ].map((stat, i) => (
            <div key={i} style={{ background: T.bg2, borderRadius: 12, padding: "14px 16px", border: `1px solid ${T.border}`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${stat.color}, transparent)` }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: 10, color: T.textD, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>{stat.label}</div>
                <div style={{ color: stat.color, opacity: 0.7 }}>{stat.icon}</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: stat.color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.5px" }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: T.textD, marginTop: 5 }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Instrument cards ─────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
          {Object.keys(liveInstruments).map(key => {
            const sc = allScores[key];
            const inst = liveInstruments[key];
            const isUp = (sc.change ?? 0) >= 0;
            const price = fmtPrice(key, sc.price);
            const isBuy = sc.dir === "BUY", isSell = sc.dir === "SELL";
            const pillars = [
              { l: "TA", v: sc.taScore }, { l: "SMC", v: sc.smcScore },
              { l: "COT", v: sc.cotScore }, { l: "Sent", v: sc.sentScore },
            ];

            return (
              <div key={key} onClick={() => { setSel(key); setView("intel-hub"); setPosTab("signal"); }}
                style={{ background: T.bg2, borderRadius: 16, padding: "18px", border: `1px solid ${sel === key ? sc.color + "50" : T.border}`, cursor: "pointer", transition: "all 0.2s", position: "relative", overflow: "hidden" }}>

                {/* Gradient glow top */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${sc.color}cc, ${sc.color}22)`, borderRadius: "16px 16px 0 0" }} />
                {/* Subtle bg gradient */}
                <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle, ${sc.color}12, transparent 70%)`, pointerEvents: "none" }} />

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: T.text, letterSpacing: "0.3px" }}>{key}</div>
                    <div style={{ fontSize: 10, color: T.textD, marginTop: 1 }}>{inst.label}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: isBuy ? T.greenBg : isSell ? T.redBg : T.amberBg, color: isBuy ? T.green : isSell ? T.red : T.amber, border: `1px solid ${isBuy ? T.greenBd : isSell ? T.redBd : T.amberBd}` }}>
                      {sc.dir}
                    </span>
                    {sc.conflicted && <span style={{ fontSize: 8, color: T.amber, fontWeight: 700 }}>⚡ CONFLICT</span>}
                  </div>
                </div>

                {/* Price */}
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-geist-mono), monospace", color: T.text, letterSpacing: "-1px", marginBottom: 4 }}>{price}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: isUp ? T.green : T.red, display: "flex", alignItems: "center", gap: 3 }}>
                    {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {sc.change != null ? `${sc.change >= 0 ? "+" : ""}${sc.change.toFixed(2)}%` : "—"}
                  </div>
                  {inst.rsiDivergence && (
                    <span style={{ fontSize: 8, fontWeight: 800, color: inst.rsiDivergence.type.includes("BULLISH") ? T.green : T.red, background: inst.rsiDivergence.type.includes("BULLISH") ? T.greenBg : T.redBg, padding: "2px 6px", borderRadius: 4, border: `1px solid ${inst.rsiDivergence.type.includes("BULLISH") ? T.greenBd : T.redBd}` }}>
                      {inst.rsiDivergence.type.includes("BULLISH") ? "CONVERGENCE ↑" : "DIVERGENCE ↓"}
                    </span>
                  )}
                </div>

                {/* Master score */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontSize: 9, color: T.textD, textTransform: "uppercase", letterSpacing: 0.5 }}>Master Score</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: sc.color }}>{sc.master}<span style={{ fontSize: 9, color: T.textD, fontWeight: 400 }}>/100</span></span>
                  </div>
                  <div style={{ height: 6, background: T.bg, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${sc.master}%`, background: `linear-gradient(90deg, ${sc.color}99, ${sc.color})`, borderRadius: 4, transition: "width 0.8s ease" }} />
                  </div>
                </div>

                {/* Pillar bars */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                  {pillars.map(p => {
                    const c = p.v >= 58 ? T.green : p.v <= 42 ? T.red : T.amber;
                    return (
                      <div key={p.l} style={{ background: T.bg, borderRadius: 6, padding: "5px 7px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 8, color: T.textD, textTransform: "uppercase" }}>{p.l}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, color: c }}>{p.v}</span>
                        </div>
                        <div style={{ height: 3, background: T.bg2, borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${p.v}%`, background: c, borderRadius: 2 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Best TF */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 9, color: T.textD }}>Best entry TF</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: sc.tfLabel === "Wait" ? T.red : sc.color }}>{sc.tfLabel}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Active signals banner ────────────────────────────────────────────── */}
        {activeSigs.length > 0 && (
          <div style={{ marginBottom: 24, borderRadius: 16, overflow: "hidden", border: `1px solid ${T.purpleBd}`, background: T.bg2 }}>
            <div style={{ background: `linear-gradient(135deg, ${T.bg3}, ${T.bg2})`, padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: T.green, boxShadow: `0 0 8px ${T.green}` }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Active System Signals</span>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: T.purpleBg, color: T.accent, border: `1px solid ${T.purpleBd}`, fontWeight: 600 }}>{activeSigs.length} live</span>
              </div>
              <button onClick={() => setView("intel-hub")} style={{ fontSize: 10, color: T.textD, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                View all <ExternalLink size={10} />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 0 }}>
              {activeSigs.map(([key, sc], idx) => {
                const sig = sc.signal;
                const isBuy = sc.dir === "BUY";
                const liveP = liveData[key]?.price;
                const pnlFromSig = liveP && sig?.entry ? ((liveP - sig.entry) / sig.entry * 100 * (isBuy ? 1 : -1)) : null;
                return (
                  <div key={key} onClick={() => { setSel(key); setView("intelligence"); }}
                    style={{ padding: "16px 20px", borderRight: idx < activeSigs.length - 1 ? `1px solid ${T.border}` : "none", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg3}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{key}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: isBuy ? T.greenBg : T.redBg, color: isBuy ? T.green : T.red, border: `1px solid ${isBuy ? T.greenBd : T.redBd}` }}>{sig.direction}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {pnlFromSig != null && <span style={{ fontSize: 11, fontWeight: 700, color: pnlFromSig >= 0 ? T.green : T.red }}>{pnlFromSig >= 0 ? "+" : ""}{pnlFromSig.toFixed(2)}%</span>}
                        <span style={{ fontSize: 9, color: T.amber, fontWeight: 700 }}>{sig.confidence}%</span>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                      {[
                        { l: "Entry", v: fmtPrice(key, sig.entry), c: T.cyan },
                        { l: "Stop", v: fmtPrice(key, sig.sl), c: T.red },
                        { l: "TP1", v: fmtPrice(key, sig.tp1), c: T.green },
                        { l: "R:R", v: sig.rr, c: T.amber },
                      ].map(r => (
                        <div key={r.l} style={{ textAlign: "center", padding: "6px 4px", background: T.bg, borderRadius: 6 }}>
                          <div style={{ fontSize: 8, color: T.textD, textTransform: "uppercase", marginBottom: 2 }}>{r.l}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: r.c, fontFamily: "monospace" }}>{r.v ?? "—"}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 9, color: T.textD }}>
                      Score <span style={{ color: sc.color, fontWeight: 700 }}>{sc.master}/100</span>
                      <span style={{ margin: "0 6px" }}>·</span>
                      Best TF <span style={{ color: sc.color, fontWeight: 700 }}>{sc.tfLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Intelligence Matrix ──────────────────────────────────────────────── */}
        <div style={{ ...s.cd, marginBottom: 20 }}>
          <div style={{ ...s.ct, marginBottom: 16 }}><Brain size={14} />Intelligence Matrix</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 60px 60px 60px 60px 80px 70px 90px", gap: 8, padding: "0 8px", marginBottom: 4 }}>
              {["Instrument", "Bias Bars", "TA", "SMC", "COT", "Sent", "Master", "TF", "Signal"].map(h => (
                <div key={h} style={{ fontSize: 9, color: T.textD, textTransform: "uppercase", letterSpacing: 0.5, textAlign: h === "Bias Bars" ? "left" : "center" }}>{h}</div>
              ))}
            </div>
            {Object.keys(liveInstruments).map(key => {
              const sc = allScores[key];
              const inst = liveInstruments[key];
              const price = fmtPrice(key, sc.price);
              const isUp = (sc.change ?? 0) >= 0;
              const isBuy = sc.dir === "BUY", isSell = sc.dir === "SELL";
              const pillars = [
                { l: "TA", v: sc.taScore, c: sc.taScore >= 58 ? T.green : sc.taScore <= 42 ? T.red : T.amber },
                { l: "SMC", v: sc.smcScore, c: sc.smcScore >= 58 ? T.green : sc.smcScore <= 42 ? T.red : T.amber },
                { l: "COT", v: sc.cotScore, c: sc.cotScore >= 58 ? T.green : sc.cotScore <= 42 ? T.red : T.amber },
                { l: "Sent", v: sc.sentScore, c: sc.sentScore >= 58 ? T.green : sc.sentScore <= 42 ? T.red : T.amber },
              ];

              return (
                <div key={key} onClick={() => { setSel(key); setView("intel-hub"); setPosTab("signal"); }}
                  style={{ display: "grid", gridTemplateColumns: "140px 1fr 60px 60px 60px 60px 80px 70px 90px", gap: 8, alignItems: "center", padding: "12px 8px", borderRadius: 10, cursor: "pointer", background: sel === key ? T.bg3 : T.bg, border: `1px solid ${sel === key ? T.borderL : "transparent"}`, transition: "all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bg3}
                  onMouseLeave={e => e.currentTarget.style.background = sel === key ? T.bg3 : T.bg}>
                  {/* Instrument */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{key}</div>
                    <div style={{ fontSize: 11, fontFamily: "monospace", color: isUp ? T.green : T.red, marginTop: 1 }}>{price} <span style={{ fontSize: 9 }}>{sc.change != null ? `${sc.change >= 0 ? "+" : ""}${sc.change.toFixed(2)}%` : ""}</span></div>
                  </div>
                  {/* Visual bars */}
                  <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                    {pillars.map(p => (
                      <div key={p.l} style={{ flex: 1, position: "relative" }}>
                        <div style={{ height: 20, background: T.bg2, borderRadius: 4, overflow: "hidden", position: "relative" }}>
                          <div style={{ position: "absolute", bottom: 0, left: 0, width: `${p.v}%`, height: "100%", background: `${p.c}33`, borderRadius: 4 }} />
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: p.c }}>{p.v}</div>
                        </div>
                        <div style={{ fontSize: 7, color: T.textD, textAlign: "center", marginTop: 2 }}>{p.l}</div>
                      </div>
                    ))}
                  </div>
                  {/* Individual scores */}
                  {pillars.map(p => (
                    <div key={p.l} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: p.c }}>{p.v}</div>
                  ))}
                  {/* Master */}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: sc.color }}>{sc.master}</div>
                    <div style={{ height: 3, background: T.bg2, borderRadius: 2, overflow: "hidden", marginTop: 3 }}>
                      <div style={{ height: "100%", width: `${sc.master}%`, background: sc.color, borderRadius: 2 }} />
                    </div>
                  </div>
                  {/* TF */}
                  <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: sc.tfLabel === "Wait" ? T.red : sc.color }}>{sc.tfLabel}</div>
                  {/* Signal badge */}
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: isBuy ? T.greenBg : isSell ? T.redBg : T.amberBg, color: isBuy ? T.green : isSell ? T.red : T.amber, border: `1px solid ${isBuy ? T.greenBd : isSell ? T.redBd : T.amberBd}` }}>
                      {sc.dir}{sc.conflicted ? " ⚡" : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Bottom row: RSI Convergence + Open Signals Summary ──────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

          {/* RSI Multi-TF */}
          <div style={s.cd}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={s.ct}><Activity size={14} />RSI Multi-TF Convergence</div>
              {rsiAlerts.length > 0 && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: T.amberBg, color: T.amber, border: `1px solid ${T.amberBd}` }}>⚡ {rsiAlerts.length} alert{rsiAlerts.length > 1 ? "s" : ""}</span>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr 90px", gap: 6, marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>
              {["Pair", "15M", "1H", "Daily", "Signal"].map(h => <div key={h} style={{ fontSize: 8, color: T.textD, textTransform: "uppercase", letterSpacing: 0.4, textAlign: "center" }}>{h}</div>)}
            </div>
            {Object.keys(liveInstruments).map(key => {
              const d = intelData?.instruments?.[key];
              const rsi1d = d?.rsi ?? null;
              const rsi1h = mtfRsi[key]?.["1H"] ?? null;
              const rsi15m = mtfRsi[key]?.["15M"] ?? null;
              const zone = r => r == null ? null : r > 70 ? "OB" : r > 55 ? "BULL" : r < 30 ? "OS" : r < 45 ? "BEAR" : "NEUT";
              const rsiColor = r => r == null ? T.textD : r > 70 ? T.red : r < 30 ? T.green : r > 55 ? T.green : r < 45 ? T.red : T.amber;
              const zones = [zone(rsi15m), zone(rsi1h), zone(rsi1d)].filter(Boolean);
              const bulls = zones.filter(z => z === "BULL" || z === "OB").length;
              const bears = zones.filter(z => z === "BEAR" || z === "OS").length;
              let conv = null, convColor = T.textD, validTf = null;
              if (bulls >= 2) { conv = bulls === 3 ? "STRONG ↑" : "BULL ↑"; convColor = T.green; validTf = rsi1h != null && zone(rsi1h) === "BULL" ? "1H" : "15M"; }
              else if (bears >= 2) { conv = bears === 3 ? "STRONG ↓" : "BEAR ↓"; convColor = T.red; validTf = rsi1h != null && zone(rsi1h) === "BEAR" ? "1H" : "15M"; }
              else if (zones.length >= 2) { conv = "MIXED"; convColor = T.amber; }
              const divAlert = rsiAlerts.find(a => a.instrument === key);
              const RsiPill = ({ val }) => {
                if (val == null) return <div style={{ textAlign: "center", fontSize: 10, color: T.textD }}>—</div>;
                const c = rsiColor(val);
                const lbl = zone(val);
                return (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: c, fontFamily: "monospace" }}>{val.toFixed(0)}</div>
                    <div style={{ height: 3, background: T.bg, borderRadius: 2, margin: "3px auto", width: "70%", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${val}%`, background: c }} />
                    </div>
                    <div style={{ fontSize: 8, color: c }}>{lbl}</div>
                  </div>
                );
              };
              return (
                <div key={key} style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr 90px", gap: 6, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{key}</div>
                    {divAlert && <div style={{ fontSize: 8, color: T.amber }}>⚡ div · {divAlert.timeframe}</div>}
                  </div>
                  <RsiPill val={rsi15m} />
                  <RsiPill val={rsi1h} />
                  <RsiPill val={rsi1d} />
                  <div style={{ textAlign: "center" }}>
                    {conv ? (
                      <>
                        <div style={{ fontSize: 9, fontWeight: 700, color: convColor, padding: "2px 6px", borderRadius: 4, background: `${convColor}18`, border: `1px solid ${convColor}30`, marginBottom: 2 }}>{conv}</div>
                        {validTf && <div style={{ fontSize: 8, color: T.textD }}>TF: <span style={{ color: convColor, fontWeight: 700 }}>{validTf}</span></div>}
                      </>
                    ) : <span style={{ fontSize: 9, color: T.textD }}>—</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Open signals + option expiries stacked */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Open positions quick view */}
            {openSigsAll.length > 0 && (
              <div style={{ ...s.cd, flex: "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={s.ct}><Radio size={14} />Open Positions</div>
                  <button onClick={() => { setView("intel-hub"); setPosTab("signals"); }} style={{ fontSize: 10, color: T.accent, background: "none", border: "none", cursor: "pointer" }}>Manage all →</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {openSigsAll.slice(0, 4).map(sg => {
                    const cur = liveData[sg.instrument]?.price;
                    const pnl = cur && sg.entryPrice ? ((cur - sg.entryPrice) / sg.entryPrice * 100 * (sg.direction === "Long" ? 1 : -1)) : null;
                    const isPos = (pnl ?? 0) >= 0;
                    return (
                      <div key={sg.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: T.bg, border: `1px solid ${isPos ? T.greenBd : T.redBd}` }}>
                        <div style={{ width: 3, height: 28, borderRadius: 2, background: sg.direction === "Long" ? T.green : T.red }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{sg.instrument} <span style={{ fontSize: 10, color: sg.direction === "Long" ? T.green : T.red }}>{sg.direction}</span></div>
                          <div style={{ fontSize: 10, color: T.textD }}>Entry {sg.entryPrice} · SL {sg.stopLoss || "—"}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: isPos ? T.green : T.red }}>{pnl != null ? `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%` : "—"}</div>
                          {cur && <div style={{ fontSize: 9, color: T.textD, fontFamily: "monospace" }}>{fmtPrice(sg.instrument, cur)}</div>}
                        </div>
                      </div>
                    );
                  })}
                  {openSigsAll.length > 4 && <div style={{ fontSize: 10, color: T.textD, textAlign: "center", padding: 4 }}>+{openSigsAll.length - 4} more positions</div>}
                </div>
              </div>
            )}

            {/* Option expiries */}
            <div style={{ ...s.cd, flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={s.ct}><Layers size={14} />FX Option Expiries</div>
                <span style={{ fontSize: 10, color: T.cyan, fontWeight: 600 }}>NY 10AM CUT</span>
              </div>
              <div style={{ fontSize: 11, color: T.textM, marginBottom: 12, padding: "8px 12px", background: T.bg, borderRadius: 8, borderLeft: `3px solid ${T.cyan}`, lineHeight: 1.5 }}>{OPTION_EXPIRIES.context}</div>
              {OPTION_EXPIRIES.entries.map((e, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: T.bg, borderRadius: 8, marginBottom: 6, border: `1px solid ${e.significance === "high" ? T.cyanBd : T.border}` }}>
                  <div style={{ minWidth: 56 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.cyan }}>{e.pair}</div>
                    <div style={{ fontSize: 9, color: T.textD }}>{e.notional}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>{e.strike}</span>
                      <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, fontWeight: 600, background: e.significance === "high" ? T.cyanBg : T.amberBg, color: e.significance === "high" ? T.cyan : T.amber }}>{e.significance}</span>
                    </div>
                    <div style={{ fontSize: 10, color: T.textD }}>{e.techLevel}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderPositioning = () => {
    const inst = liveInstruments[sel];
    const oo = OPTIONS_OI.instruments[sel];
    const vd = VOL_DATA.instruments[sel];
    const analysis = ANALYSIS[sel];
    const liveC = cotLive?.instruments?.[sel];
    const instData = intelData?.instruments?.[sel]; // live TA + SMC from /api/intelligence

    // ── 5-Pillar Scoring ─────────────────────────────────────────────────
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

    // ── TA Score (from live intelligence data) ────────────────────────
    const taScore = instData ? (() => {
      let s = 50;
      if (instData.trend === "BULLISH") s += 14; else if (instData.trend === "BEARISH") s -= 14;
      if (instData.rsi > 55) s += 8; else if (instData.rsi < 45) s -= 8;
      if (instData.rsi > 70) s -= 6; else if (instData.rsi < 30) s += 6;
      if (instData.macd?.cross === "bullish") s += 10; else if (instData.macd?.cross === "bearish") s -= 10;
      else if (instData.macd?.histogram > 0) s += 5; else if (instData.macd?.histogram < 0) s -= 5;
      if (instData.structure === "BREAKOUT") s += 12; else if (instData.structure === "BREAKDOWN") s -= 12;
      else if (instData.structure === "TRENDING") s += 6;
      if (instData.sma && instData.current) {
        const { sma20, sma50, sma200 } = instData.sma;
        const c = instData.current;
        if (c > sma20 && c > sma50 && c > sma200) s += 8;
        else if (c < sma20 && c < sma50 && c < sma200) s -= 8;
      }
      return Math.min(100, Math.max(0, Math.round(s)));
    })() : 50;

    // ── SMC Score (from live intelligence data) ───────────────────────
    const smcScore = instData?.smc?.score ?? 50;

    // ── 5-Pillar Master Score ─────────────────────────────────────────
    // Weights: TA 28% · SMC 27% · COT 20% · Sentiment 13% · Flow 12%
    const master = Math.round(taScore*0.28 + smcScore*0.27 + cotScore*0.20 + sentScore*0.13 + pcrScore*0.12);

    // Conflict check: if TA and SMC strongly disagree, pull toward neutral
    const taDir  = taScore  >= 58 ? "BULL" : taScore  <= 42 ? "BEAR" : "NEUTRAL";
    const smcDir = smcScore >= 58 ? "BULL" : smcScore <= 42 ? "BEAR" : "NEUTRAL";
    const conflicted = taDir !== "NEUTRAL" && smcDir !== "NEUTRAL" && taDir !== smcDir;
    const combined = conflicted ? Math.round(master * 0.7 + 50 * 0.3) : master;

    // ── Timeframe Recommendation ──────────────────────────────────────
    const tfRec = (() => {
      const allBull = taScore > 56 && smcScore > 56 && cotScore > 53;
      const allBear = taScore < 44 && smcScore < 44 && cotScore < 47;
      if (combined >= 68 && (allBull || allBear)) return { tf: "Daily → 4H", entry: "4H entry", trend: "Weekly/Daily trend", label: "Strong Multi-TF Alignment", note: "All pillars agree. Enter on 4H pullback/OB retest with Daily in same direction.", color: T.green };
      if (combined >= 58 && !conflicted) return { tf: "4H → 1H", entry: "1H entry", trend: "4H trend", label: "Good Setup", note: "TA and SMC aligned. Wait for 1H structure confirmation before entry.", color: T.green };
      if (combined >= 48 && !conflicted) return { tf: "1H → 15M", entry: "15M scalp", trend: "1H trend", label: "Moderate — reduce size", note: "Partial alignment. Use tight SL. Avoid holding overnight without strong COT backing.", color: T.amber };
      if (conflicted) return { tf: "Wait", entry: "No trade", trend: "Monitor Daily", label: "TA ↔ SMC Conflict", note: "Technical and SMC signals oppose each other. Stand aside until one resolves.", color: T.red };
      return { tf: "Wait", entry: "No trade", trend: "Monitor Daily", label: "Insufficient Conviction", note: "Score too low for a directional trade. Wait for a pillar to shift.", color: T.red };
    })();

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

    // ── Signal Tab ────────────────────────────────────────────────────────
    const renderSignalTab = () => {
      const sig = instData?.signal;
      const smc = instData?.smc;
      const isBuy = decision.dir === "BUY";
      const isSell = decision.dir === "SELL";

      // Confluence checklist
      const checks = [
        { label: "COT Positioning",       pass: cotScore  >= 58 ? isBuy : cotScore <= 42 ? isSell : null, weight: "HIGH",   desc: cotScore >= 58 ? "Institutions net-long" : cotScore <= 42 ? "Institutions net-short" : "Neutral — no edge" },
        { label: "Retail Sentiment",       pass: sentScore >= 58 ? isBuy : sentScore <= 42 ? isSell : null, weight: "MED",    desc: sentScore >= 58 ? "Crowd short — squeeze fuel" : sentScore <= 42 ? "Crowd long — fade zone" : "No extreme reading" },
        { label: "Options Flow",           pass: pcrScore  >= 56 ? isBuy : pcrScore  <= 44 ? isSell : null, weight: "MED",    desc: oo?.putCallRatio != null ? `PCR ${oo.putCallRatio.toFixed(2)} — ${pcrScore >= 56 ? "bullish skew" : pcrScore <= 44 ? "bearish skew" : "neutral"}` : "No options data" },
        { label: "Technical Analysis",     pass: taScore   >= 58 ? isBuy : taScore   <= 42 ? isSell : null, weight: "HIGH",   desc: instData ? `${instData.trend} · RSI ${instData.rsi?.toFixed(1)} · ${instData.structure}` : "Loading…" },
        { label: "SMC Structure",          pass: smcScore  >= 58 ? isBuy : smcScore  <= 42 ? isSell : null, weight: "HIGH",   desc: smc ? `${smc.structureTrend} · ${smc.bos ? "BOS confirmed" : "No BOS"} · Score ${smcScore}` : "Loading…" },
        { label: "Multi-TF Alignment",     pass: !conflicted && combined >= 55 ? isBuy : !conflicted && combined <= 45 ? isSell : null, weight: "HIGH", desc: tfRec.label },
      ];
      const passing = checks.filter(c => c.pass === true).length;
      const failing = checks.filter(c => c.pass === false).length;
      const neutral = checks.filter(c => c.pass === null).length;

      return (
        <>
          {/* Timeframe Recommendation Card */}
          <div style={{ background: T.bg2, borderRadius: 14, padding: "18px 22px", border: `2px solid ${tfRec.color}40`, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 10, color: T.textD, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Best Timeframe to Trade</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: tfRec.color, letterSpacing: "-0.5px" }}>{tfRec.tf}</div>
                <div style={{ fontSize: 13, color: T.textM, marginTop: 4 }}>
                  <span style={{ color: tfRec.color, fontWeight: 700 }}>{tfRec.entry}</span>
                  <span style={{ color: T.textD }}> · Trend: {tfRec.trend}</span>
                </div>
              </div>
              <div style={{ maxWidth: 340, fontSize: 12, color: T.textM, lineHeight: 1.7, padding: "10px 14px", background: `${tfRec.color}10`, borderRadius: 10, border: `1px solid ${tfRec.color}25` }}>
                {tfRec.note}
              </div>
            </div>
          </div>

          {/* Confluence Checklist */}
          <div style={{ ...s.cd, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={s.ct}><Target size={14} />Confluence Checklist — {sel}</div>
              <div style={{ display: "flex", gap: 8, fontSize: 11, fontWeight: 700 }}>
                <span style={{ color: T.green }}>{passing} ✓</span>
                <span style={{ color: T.red }}>{failing} ✗</span>
                <span style={{ color: T.textD }}>{neutral} —</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {checks.map((c, i) => {
                const col = c.pass === true ? T.green : c.pass === false ? T.red : T.textD;
                const icon = c.pass === true ? "✓" : c.pass === false ? "✗" : "—";
                const wCol = c.weight === "HIGH" ? T.red : c.weight === "MED" ? T.amber : T.textD;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 8, background: c.pass === true ? T.greenBg : c.pass === false ? T.redBg : T.bg, border: `1px solid ${c.pass === true ? T.greenBd : c.pass === false ? T.redBd : T.border}` }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: col, width: 18, textAlign: "center" }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{c.label}</div>
                      <div style={{ fontSize: 11, color: T.textM, marginTop: 1 }}>{c.desc}</div>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: `${wCol}18`, color: wCol, border: `1px solid ${wCol}30` }}>{c.weight}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Trade Signal */}
          {sig ? (
            <div style={{ ...s.cd, border: `1px solid ${isBuy ? T.greenBd : isSell ? T.redBd : T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={s.ct}><Zap size={14} />Live Trade Signal · {sel}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: isBuy ? T.greenBg : T.redBg, color: isBuy ? T.green : T.red, border: `1px solid ${isBuy ? T.greenBd : T.redBd}` }}>{sig.direction}</span>
                  <span style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: T.bg, color: T.amber, border: `1px solid ${T.border}` }}>{sig.confidence}% conf</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 }}>
                {[
                  { label: "Entry Zone", value: instData ? (instData.current?.toFixed(instData.current > 1000 ? 2 : 5)) : "—", color: T.cyan },
                  { label: "Stop Loss", value: sig.sl?.toFixed(sig.sl > 1000 ? 2 : 5), color: T.red },
                  { label: "R:R Ratio", value: sig.rr, color: T.amber },
                  { label: "TP 1", value: sig.tp1?.toFixed(sig.tp1 > 1000 ? 2 : 5), color: T.green },
                  { label: "TP 2", value: sig.tp2?.toFixed(sig.tp2 > 1000 ? 2 : 5), color: T.green },
                  { label: "TP 3", value: sig.tp3 ? sig.tp3.toFixed(sig.tp3 > 1000 ? 2 : 5) : "—", color: T.green },
                ].map(row => (
                  <div key={row.label} style={{ background: T.bg, borderRadius: 8, padding: "10px 12px", border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 9, color: T.textD, textTransform: "uppercase", letterSpacing: "0.5px" }}>{row.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: row.color, marginTop: 3, fontFamily: "monospace" }}>{row.value}</div>
                  </div>
                ))}
              </div>
              {sig.reason && <div style={{ fontSize: 12, color: T.textM, lineHeight: 1.6, padding: "10px 14px", background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>{sig.reason}</div>}
              {conflicted && (
                <div style={{ marginTop: 10, padding: "10px 14px", background: T.amberBg, border: `1px solid ${T.amberBd}`, borderRadius: 8, fontSize: 12, color: T.amber, display: "flex", gap: 8, alignItems: "center" }}>
                  <AlertTriangle size={14} /> TA and SMC signals conflict — treat this signal as low confidence. Wait for alignment before executing.
                </div>
              )}
            </div>
          ) : (
            <div style={{ ...s.cd, textAlign: "center", color: T.textD, fontSize: 13, padding: 30 }}>
              {intelData ? "No signal generated — insufficient conviction or conflicting data." : "Loading intelligence data…"}
            </div>
          )}
        </>
      );
    };

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
          <div className="cot-concepts" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 14 }}>
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
        {/* ── Intelligence Hub Header ── */}
        <div style={{ background: T.bg2, borderRadius: 14, padding: "16px 20px", border: `1px solid ${decision.bd}`, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            {/* Master score */}
            <div style={{ minWidth: 140 }}>
              <div style={{ fontSize: 10, color: T.textD, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Master Score — {sel}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <div style={{ fontSize: 52, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", color: decision.color, lineHeight: 1 }}>{combined}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: decision.color }}>{decision.label}</div>
                  <div style={{ fontSize: 10, color: T.textD }}>5 pillars · out of 100</div>
                  {conflicted && <div style={{ fontSize: 10, color: T.amber, marginTop: 2 }}>⚡ TA ↔ SMC conflict</div>}
                </div>
              </div>
            </div>

            {/* 5 pillar scores */}
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, minWidth: 0 }}>
              {[
                { label: "TA", score: taScore, color: T.cyan, w: "28%" },
                { label: "SMC", score: smcScore, color: T.purple, w: "27%" },
                { label: "COT", score: cotScore, color: T.blue, w: "20%" },
                { label: "Sentiment", score: sentScore, color: T.amber, w: "13%" },
                { label: "Flow", score: pcrScore, color: T.green, w: "12%" },
              ].map(p => {
                const c = p.score >= 58 ? T.green : p.score <= 42 ? T.red : T.amber;
                return (
                  <div key={p.label} style={{ textAlign: "center", padding: "10px 8px", background: T.bg, borderRadius: 10, border: `1px solid ${p.color}30` }}>
                    <div style={{ fontSize: 9, color: p.color, fontWeight: 700, marginBottom: 1 }}>{p.label}</div>
                    <div style={{ fontSize: 9, color: T.textD, marginBottom: 6 }}>{p.w}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: c }}>{p.score}</div>
                    <div style={{ fontSize: 9, color: c, textTransform: "uppercase", marginTop: 2 }}>{p.score >= 58 ? "Bull" : p.score <= 42 ? "Bear" : "Neutral"}</div>
                  </div>
                );
              })}
            </div>

            {/* Timeframe badge */}
            <div style={{ textAlign: "center", padding: "12px 18px", background: `${tfRec.color}10`, borderRadius: 12, border: `1px solid ${tfRec.color}30`, minWidth: 120 }}>
              <div style={{ fontSize: 9, color: T.textD, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Best Timeframe</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: tfRec.color }}>{tfRec.tf}</div>
              <div style={{ fontSize: 10, color: T.textM, marginTop: 3 }}>{tfRec.entry}</div>
            </div>
          </div>
        </div>

        {/* Sub-tab nav */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <TabBtn id="signal"    label="🎯 Signal" />
          <TabBtn id="overview"  label="Combined Analysis" />
          <TabBtn id="cot"       label="COT Data" />
          <TabBtn id="sentiment" label="Retail Sentiment" />
          <TabBtn id="flow"      label="Options & Flow" />
        </div>

        {posTab === "signal"    && renderSignalTab()}
        {posTab === "overview"  && renderOverviewTab()}
        {posTab === "cot"       && renderCOTTab()}
        {posTab === "sentiment" && renderSentimentTab()}
        {posTab === "flow"      && renderFlowTab()}
      </>
    );
  };


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
                  <div key={k} onClick={() => { setSel(k); setLabTab("builder"); }} className="scanner-card" style={{ background: T.bg2, borderRadius: 12, padding: "14px 18px", border: `1px solid ${ts >= 62 ? g.bd : T.border}`, cursor: "pointer", display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 16, alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>{k}</div>
                      <div style={{ fontSize: 10, color: T.textD }}>{INSTRUMENTS[k].label}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: d.trend === "BULLISH" ? T.green : d.trend === "BEARISH" ? T.red : T.amber, marginTop: 4 }}>{d.trend}</div>
                    </div>
                    <div className="scanner-patterns" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
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
                  <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-geist-mono), monospace", color: T.green }}>{smc.lastSwingLow ? fp(smc.lastSwingLow) : "—"}</div>
                </div>
                <div style={{ background: T.bg, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, color: T.textD, textTransform: "uppercase", marginBottom: 4 }}>Current price</div>
                  <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-geist-mono), monospace", color: T.text }}>{fp(current)}</div>
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
                    <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--font-geist-mono), monospace", color: ob.color }}>mid {fp(ob.mid)}</div>
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
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-geist-mono), monospace", color: item.color }}>{item.v}</div>
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
      const aClosedSigs = closedSigs.filter(sg => sg.grade === "A");
      const wins = closedSigs.filter(sg => sg.result === "WIN").length;
      const aWins = aClosedSigs.filter(sg => sg.result === "WIN").length;
      const winRate = closedSigs.length > 0 ? Math.round((wins / closedSigs.length) * 100) : null;
      const aWinRate = aClosedSigs.length > 0 ? Math.round((aWins / aClosedSigs.length) * 100) : null;
      const totalClosedPnL = closedSigs.reduce((acc, sg) => acc + (calcPnL(sg, liveData) || 0), 0);
      const openPnL = openSigs.reduce((acc, sg) => acc + (calcPnL(sg, liveData) || 0), 0);
      const equityCurve = closedSigs.slice().sort((a, b) => new Date(a.closedAt) - new Date(b.closedAt)).reduce((acc, sg, i) => {
        const prev = acc[i - 1]?.cumPnL || 0;
        const pnl = calcPnL(sg, liveData) || 0;
        acc.push({ label: new Date(sg.closedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), cumPnL: parseFloat((prev + pnl).toFixed(2)), pnl: parseFloat(pnl.toFixed(2)), result: sg.result });
        return acc;
      }, []);
      const pc = v => v >= 0 ? T.green : T.red;
      const inp = { background: T.bg, border: `1px solid ${T.border}`, color: T.text, fontSize: 12, padding: "8px 10px", borderRadius: 8, width: "100%", outline: "none" };
      const lbl = { fontSize: 10, color: T.textD, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 };

      const fmtPrice = (sg, v) => v == null ? "—" : sg.instrument === "BTCUSD" ? Math.round(v).toLocaleString() : sg.instrument.includes("JPY") ? Number(v).toFixed(3) : Number(v).toFixed(5);

      const GradePill = ({ grade, auto }) => {
        if (!grade) return auto ? <span style={{ fontSize: 9, color: T.textD, padding: "2px 5px", borderRadius: 3, background: T.bg3 }}>auto</span> : null;
        const gc = grade === "A" ? { bg: T.purpleBg, c: T.purple, bd: T.purpleBd } : { bg: T.cyanBg, c: T.cyan, bd: T.cyanBd };
        return <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 4, background: gc.bg, color: gc.c, border: `1px solid ${gc.bd}`, letterSpacing: 0.5 }}>{grade}{auto ? " auto" : ""}</span>;
      };

      const StatCard = ({ label, value, sub, color }) => (
        <div style={{ background: T.bg2, borderRadius: 14, padding: "16px 18px", border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10, color: T.textD, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6, fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: color || T.text, lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: T.textM, marginTop: 5 }}>{sub}</div>}
        </div>
      );

      return (
        <>
          {/* ── Stats ── */}
          <div className="lab-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
            <StatCard label="Total Signals" value={signals.length} sub={`${openSigs.length} open · ${closedSigs.length} closed`} />
            <StatCard label="Win Rate" value={winRate != null ? `${winRate}%` : "—"} sub={`${wins}W / ${closedSigs.length - wins}L`} color={winRate != null ? (winRate >= 50 ? T.green : T.red) : T.textD} />
            <StatCard label="Closed P&L" value={`${totalClosedPnL >= 0 ? "+" : ""}${totalClosedPnL.toFixed(2)}%`} color={pc(totalClosedPnL)} />
            <StatCard label="Open P&L" value={`${openPnL >= 0 ? "+" : ""}${openPnL.toFixed(2)}%`} color={pc(openPnL)} />
          </div>

          {/* ── A-Setup Performance ── */}
          {aClosedSigs.length > 0 && (
            <div style={{ background: T.purpleBg, border: `1px solid ${T.purpleBd}`, borderRadius: 14, padding: "14px 18px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.purple, marginBottom: 10, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: 0.7 }}><Zap size={13} />A-Setup Performance</div>
              <div className="asetup-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                {[["Closed", aClosedSigs.length, T.purple], ["Win Rate", aWinRate != null ? `${aWinRate}%` : "—", aWinRate >= 60 ? T.green : T.amber], ["Open A", openSigs.filter(s => s.grade === "A").length, T.cyan]].map(([l, v, c]) => (
                  <div key={l}><div style={{ fontSize: 10, color: T.textD, marginBottom: 3 }}>{l}</div><div style={{ fontSize: 22, fontWeight: 700, color: c }}>{v}</div></div>
                ))}
                <div><div style={{ fontSize: 10, color: T.textD, marginBottom: 3 }}>W / L</div><div style={{ fontSize: 22, fontWeight: 700 }}><span style={{ color: T.green }}>{aWins}</span><span style={{ color: T.textD, fontSize: 14 }}>/</span><span style={{ color: T.red }}>{aClosedSigs.length - aWins}</span></div></div>
              </div>
            </div>
          )}

          {/* ── Auto Generator ── */}
          <div style={{ background: T.bg2, border: `1px solid ${T.purpleBd}`, borderRadius: 14, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4, display: "flex", alignItems: "center", gap: 7 }}>
                <Zap size={14} style={{ color: T.purple }} />Auto A-Setup Generator
              </div>
              <div style={{ fontSize: 11, color: T.textM, marginBottom: 4 }}>Turtle Soup · CRT · CHoCH · BOS · SMC OBs · RSI/MACD · COT · Retail Sentiment · Options Flow · auto-scans every 10 min</div>
              {lastAutoGen && (
                <div style={{ fontSize: 10, color: lastAutoGen.created.length > 0 ? T.green : T.textD }}>
                  {lastAutoGen.created.length > 0 ? `✓ ${lastAutoGen.created.length} signal(s): ${lastAutoGen.created.join(", ")}` : "No signals passed quality threshold"}
                  {lastAutoGen.skipped?.length > 0 && ` · skipped: ${lastAutoGen.skipped.join(", ")}`}
                  {` · ${new Date(lastAutoGen.ts).toLocaleTimeString()}`}
                </div>
              )}
              <div style={{ fontSize: 10, color: notifPermission === "granted" ? T.green : T.amber, marginTop: 3 }}>
                {notifPermission === "granted" ? "🔔 Notifications on" : notifPermission === "denied" ? "🔕 Blocked — allow in browser settings" : "🔔 Allow notifications when prompted"}
              </div>
            </div>
            <button onClick={() => generateASetups(false)} disabled={autoGenLoading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: autoGenLoading ? "not-allowed" : "pointer", opacity: autoGenLoading ? 0.6 : 1, flexShrink: 0 }}>
              <Zap size={13} />{autoGenLoading ? "Scanning…" : "Scan Now"}
            </button>
          </div>

          {/* ── Log New Signal ── */}
          <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 7, textTransform: "uppercase", letterSpacing: 0.6 }}><Plus size={13} style={{ color: T.accent }} />Log New Signal</div>
            <div className="lab-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div><label style={lbl}>Instrument</label><select value={newSig.instrument} onChange={e => setNewSig({ ...newSig, instrument: e.target.value })} style={inp}>{Object.keys(INSTRUMENTS).map(k => <option key={k}>{k}</option>)}</select></div>
              <div><label style={lbl}>Direction</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {["Long","Short"].map(d => <button key={d} onClick={() => setNewSig({ ...newSig, direction: d })} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${newSig.direction === d ? (d === "Long" ? T.green : T.red) : T.border}`, background: newSig.direction === d ? (d === "Long" ? T.greenBg : T.redBg) : T.bg, color: newSig.direction === d ? (d === "Long" ? T.green : T.red) : T.textD, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{d === "Long" ? "▲ Long" : "▼ Short"}</button>)}
                </div>
              </div>
              <div><label style={lbl}>Bias</label><select value={newSig.bias} onChange={e => setNewSig({ ...newSig, bias: e.target.value })} style={inp}><option>Bullish</option><option>Bearish</option><option>Neutral</option></select></div>
              <div><label style={lbl}>Confidence (1-10)</label><input type="number" min={1} max={10} value={newSig.confidence} onChange={e => setNewSig({ ...newSig, confidence: +e.target.value })} style={inp} /></div>
            </div>
            <div className="lab-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div><label style={lbl}>Entry Price</label><input type="number" step="any" value={newSig.entryPrice} onChange={e => setNewSig({ ...newSig, entryPrice: e.target.value })} placeholder={liveData[newSig.instrument]?.price?.toFixed(2) || "0"} style={inp} /></div>
              <div><label style={lbl}>Target (TP)</label><input type="number" step="any" value={newSig.targetPrice} onChange={e => setNewSig({ ...newSig, targetPrice: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Stop Loss (SL)</label><input type="number" step="any" value={newSig.stopLoss} onChange={e => setNewSig({ ...newSig, stopLoss: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>R:R Ratio</label><input type="text" value={newSig.riskReward || ""} onChange={e => setNewSig({ ...newSig, riskReward: e.target.value })} placeholder="e.g. 1:2.5" style={inp} /></div>
            </div>
            <textarea value={newSig.notes} onChange={e => setNewSig({ ...newSig, notes: e.target.value })} placeholder="Trade thesis — SMC setup, COT context, sentiment confluence…" rows={2} style={{ ...inp, resize: "vertical", marginBottom: 12, fontFamily: "inherit" }} />
            <button
              onClick={async () => { if (!newSig.entryPrice) return; await createSignal({ ...newSig, entryPrice: newSig.entryPrice || liveData[newSig.instrument]?.price }); setNewSig({ instrument: "XAUUSD", direction: "Long", entryPrice: "", targetPrice: "", stopLoss: "", confidence: 7, notes: "", bias: "Neutral", riskReward: "", validFor: "", aiSummary: "" }); }}
              disabled={signalsLoading || !newSig.entryPrice}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 22px", borderRadius: 10, background: !newSig.entryPrice || signalsLoading ? T.bg3 : "linear-gradient(135deg,#8b5cf6,#6366f1)", color: !newSig.entryPrice || signalsLoading ? T.textD : "#fff", fontSize: 13, fontWeight: 700, border: `1px solid ${T.border}`, cursor: !newSig.entryPrice || signalsLoading ? "not-allowed" : "pointer" }}>
              <Plus size={13} />{signalsLoading ? "Saving…" : "Log Signal"}
            </button>
          </div>

          {/* ── Open Signals ── */}
          {openSigs.length > 0 && (
            <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: T.green, animation: "pulse 1.5s infinite" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Open Signals</span>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: T.bg3, color: T.textM }}>{openSigs.length}</span>
                  <span style={{ fontSize: 10, color: T.textD }}>· auto-closes on TP/SL hit</span>
                </div>
              </div>

              {/* Desktop table */}
              <div className="sig-table-wrap" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["","Pair","Dir","Entry","Live","Target TP","Stop SL","P&L","Conf","Date",""].map((h,i) => (
                      <th key={i} style={{ padding: "7px 10px", textAlign: "left", color: T.textD, fontWeight: 500, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{openSigs.map(sg => {
                    const cur = getLivePrice(sg.instrument);
                    const pnl = calcPnL(sg, liveData);
                    const isLong = sg.direction === "Long";
                    const slHit = cur && sg.stopLoss && (isLong ? cur <= Number(sg.stopLoss) : cur >= Number(sg.stopLoss));
                    const tpHit = cur && sg.targetPrice && (isLong ? cur >= Number(sg.targetPrice) : cur <= Number(sg.targetPrice));
                    const isClosing = closingRef.current.has(sg.id);
                    const progressToTp = (sg.targetPrice && cur) ? Math.min(100, Math.max(0, Math.abs(cur - sg.entryPrice) / Math.abs(Number(sg.targetPrice) - sg.entryPrice) * 100)) : 0;
                    const accentColor = slHit ? T.red : tpHit ? T.green : sg.grade === "A" ? T.purple : T.border;
                    return (
                      <tr key={sg.id} style={{ borderLeft: `3px solid ${accentColor}`, background: slHit ? "rgba(239,68,68,0.04)" : tpHit ? "rgba(16,185,129,0.04)" : "transparent", opacity: isClosing ? 0.6 : 1 }}>
                        <td style={{ padding: "10px 10px" }}>
                          {isClosing ? <span style={{ fontSize: 9, color: T.amber, fontWeight: 700 }}>⏳</span>
                            : slHit ? <span style={{ fontSize: 9, color: T.red, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: T.redBg, border: `1px solid ${T.redBd}` }}>✗ SL</span>
                            : tpHit ? <span style={{ fontSize: 9, color: T.green, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: T.greenBg, border: `1px solid ${T.greenBd}` }}>✓ TP</span>
                            : <GradePill grade={sg.grade} auto={sg.autoGenerated} />}
                        </td>
                        <td style={{ padding: "10px 10px", fontWeight: 700, color: T.text }}>{sg.instrument}</td>
                        <td style={{ padding: "10px 10px", fontWeight: 700, color: isLong ? T.green : T.red }}>{isLong ? "▲ Long" : "▼ Short"}</td>
                        <td style={{ padding: "10px 10px", color: T.textM, fontFamily: "monospace" }}>{fmtPrice(sg, sg.entryPrice)}</td>
                        <td style={{ padding: "10px 10px", color: T.cyan }}>
                          {cur != null ? <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 5, height: 5, borderRadius: 3, background: T.green, display: "inline-block" }} />
                            {fmtPrice(sg, cur)}
                          </span> : <span style={{ color: T.textD }}>—</span>}
                        </td>
                        <td style={{ padding: "10px 10px" }}>
                          <div style={{ color: tpHit ? T.green : T.textM, fontWeight: tpHit ? 700 : 400 }}>{fmtPrice(sg, sg.targetPrice)}</div>
                          {progressToTp > 0 && <div style={{ height: 3, background: T.bg, borderRadius: 2, marginTop: 4, overflow: "hidden", width: 60 }}><div style={{ height: "100%", width: `${progressToTp}%`, background: `linear-gradient(90deg,${T.accent},${T.green})`, borderRadius: 2 }} /></div>}
                        </td>
                        <td style={{ padding: "10px 10px", color: slHit ? T.red : T.textM, fontWeight: slHit ? 700 : 400 }}>{fmtPrice(sg, sg.stopLoss)}</td>
                        <td style={{ padding: "10px 10px", fontWeight: 700, color: pnl == null ? T.textD : pc(pnl) }}>{pnl == null ? "—" : `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%`}</td>
                        <td style={{ padding: "10px 10px", color: T.textM }}>{sg.confidence}/10</td>
                        <td style={{ padding: "10px 10px", color: T.textD, fontSize: 11 }}>{new Date(sg.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: "10px 10px" }}>
                          {closeForm?.id === sg.id
                            ? <div style={{ display: "flex", gap: 4 }}>
                                <input type="number" step="any" value={closeForm.exitPrice} onChange={e => setCloseForm({ ...closeForm, exitPrice: e.target.value })} style={{ ...inp, width: 80, padding: "3px 6px", fontSize: 11 }} />
                                <button onClick={() => closeSignal(sg.id, parseFloat(closeForm.exitPrice), parseFloat(closeForm.exitPrice) >= sg.targetPrice ? "WIN" : "LOSS")} style={{ padding: "3px 8px", borderRadius: 6, background: T.greenBg, color: T.green, border: `1px solid ${T.greenBd}`, cursor: "pointer", fontSize: 12 }}>✓</button>
                                <button onClick={() => setCloseForm(null)} style={{ padding: "3px 6px", borderRadius: 6, background: T.bg3, color: T.textM, border: `1px solid ${T.border}`, cursor: "pointer", fontSize: 12 }}>✕</button>
                              </div>
                            : <div style={{ display: "flex", gap: 5 }}>
                                <button onClick={() => setCloseForm({ id: sg.id, exitPrice: cur || "" })} style={{ padding: "4px 10px", borderRadius: 6, background: T.amberBg, color: T.amber, border: `1px solid ${T.amberBd}`, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Close</button>
                                <button onClick={() => deleteSignal(sg.id)} style={{ padding: "4px 7px", borderRadius: 6, background: T.redBg, color: T.red, border: `1px solid ${T.redBd}`, cursor: "pointer", display: "flex", alignItems: "center" }}><Trash2 size={11} /></button>
                              </div>}
                        </td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sig-cards">
                {openSigs.map(sg => {
                  const cur = getLivePrice(sg.instrument);
                  const pnl = calcPnL(sg, liveData);
                  const isLong = sg.direction === "Long";
                  const slHit = cur && sg.stopLoss && (isLong ? cur <= Number(sg.stopLoss) : cur >= Number(sg.stopLoss));
                  const tpHit = cur && sg.targetPrice && (isLong ? cur >= Number(sg.targetPrice) : cur <= Number(sg.targetPrice));
                  const isClosing = closingRef.current.has(sg.id);
                  const progressToTp = (sg.targetPrice && cur) ? Math.min(100, Math.max(0, Math.abs(cur - sg.entryPrice) / Math.abs(Number(sg.targetPrice) - sg.entryPrice) * 100)) : 0;
                  const accentColor = slHit ? T.red : tpHit ? T.green : sg.grade === "A" ? T.purple : T.borderL;
                  return (
                    <div key={sg.id} style={{ background: T.bg, border: `1px solid ${accentColor}`, borderRadius: 12, padding: "14px 16px", marginBottom: 10, opacity: isClosing ? 0.6 : 1 }}>
                      {/* Card header */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{sg.instrument}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: isLong ? T.greenBg : T.redBg, color: isLong ? T.green : T.red, border: `1px solid ${isLong ? T.greenBd : T.redBd}` }}>{isLong ? "▲ Long" : "▼ Short"}</span>
                          <GradePill grade={sg.grade} auto={sg.autoGenerated} />
                        </div>
                        <div style={{ textAlign: "right" }}>
                          {isClosing ? <span style={{ fontSize: 11, color: T.amber, fontWeight: 700 }}>⏳ Closing…</span>
                            : slHit ? <span style={{ fontSize: 11, fontWeight: 800, color: T.red, padding: "3px 8px", borderRadius: 5, background: T.redBg }}>✗ SL HIT</span>
                            : tpHit ? <span style={{ fontSize: 11, fontWeight: 800, color: T.green, padding: "3px 8px", borderRadius: 5, background: T.greenBg }}>✓ TP HIT</span>
                            : <span style={{ fontSize: 18, fontWeight: 800, color: pnl == null ? T.textD : pc(pnl) }}>{pnl == null ? "—" : `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%`}</span>}
                        </div>
                      </div>
                      {/* Price row */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                        {[["Entry", fmtPrice(sg, sg.entryPrice), T.textM], ["Live", fmtPrice(sg, cur), T.cyan], ["P&L", pnl == null ? "—" : `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%`, pnl == null ? T.textD : pc(pnl)]].map(([label, val, color]) => (
                          <div key={label} style={{ background: T.bg2, borderRadius: 8, padding: "8px 10px" }}>
                            <div style={{ fontSize: 9, color: T.textD, marginBottom: 3, textTransform: "uppercase" }}>{label}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color }}>{val}</div>
                          </div>
                        ))}
                      </div>
                      {/* TP / SL row */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                        <div style={{ background: T.bg2, borderRadius: 8, padding: "8px 10px" }}>
                          <div style={{ fontSize: 9, color: T.textD, marginBottom: 3 }}>TARGET TP</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: tpHit ? T.green : T.textM }}>{fmtPrice(sg, sg.targetPrice)}</div>
                          {progressToTp > 0 && <div style={{ height: 3, background: T.bg, borderRadius: 2, marginTop: 5, overflow: "hidden" }}><div style={{ height: "100%", width: `${progressToTp}%`, background: `linear-gradient(90deg,${T.accent},${T.green})` }} /></div>}
                        </div>
                        <div style={{ background: T.bg2, borderRadius: 8, padding: "8px 10px" }}>
                          <div style={{ fontSize: 9, color: T.textD, marginBottom: 3 }}>STOP SL</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: slHit ? T.red : T.textM }}>{fmtPrice(sg, sg.stopLoss)}</div>
                        </div>
                      </div>
                      {/* Actions */}
                      {closeForm?.id === sg.id
                        ? <div style={{ display: "flex", gap: 6 }}>
                            <input type="number" step="any" value={closeForm.exitPrice} onChange={e => setCloseForm({ ...closeForm, exitPrice: e.target.value })} style={{ ...inp, flex: 1, fontSize: 13 }} placeholder="Exit price" />
                            <button onClick={() => closeSignal(sg.id, parseFloat(closeForm.exitPrice), parseFloat(closeForm.exitPrice) >= sg.targetPrice ? "WIN" : "LOSS")} style={{ padding: "8px 14px", borderRadius: 8, background: T.greenBg, color: T.green, border: `1px solid ${T.greenBd}`, fontWeight: 700, cursor: "pointer" }}>✓</button>
                            <button onClick={() => setCloseForm(null)} style={{ padding: "8px 10px", borderRadius: 8, background: T.bg3, color: T.textM, border: `1px solid ${T.border}`, cursor: "pointer" }}>✕</button>
                          </div>
                        : <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => setCloseForm({ id: sg.id, exitPrice: cur || "" })} style={{ flex: 1, padding: "9px 0", borderRadius: 9, background: T.amberBg, color: T.amber, border: `1px solid ${T.amberBd}`, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Close Manually</button>
                            <button onClick={() => deleteSignal(sg.id)} style={{ padding: "9px 12px", borderRadius: 9, background: T.redBg, color: T.red, border: `1px solid ${T.redBd}`, cursor: "pointer", display: "flex", alignItems: "center" }}><Trash2 size={14} /></button>
                          </div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {openSigs.length === 0 && (
            <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 14, padding: "32px 20px", marginBottom: 16, textAlign: "center" }}>
              <Radio size={28} style={{ color: T.textD, marginBottom: 10 }} />
              <div style={{ fontSize: 13, color: T.textD }}>No open signals. Log one above or run a scan.</div>
            </div>
          )}

          {/* ── Equity Curve ── */}
          {equityCurve.length > 1 && (
            <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 7, textTransform: "uppercase", letterSpacing: 0.6 }}><TrendingUp size={13} style={{ color: T.green }} />Equity Curve</div>
              <ResponsiveContainer width="100%" height={180}><AreaChart data={equityCurve} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}><defs><linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.green} stopOpacity={0.3} /><stop offset="95%" stopColor={T.green} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={T.border} /><XAxis dataKey="label" tick={{ fill: T.textD, fontSize: 10 }} /><YAxis tick={{ fill: T.textD, fontSize: 10 }} tickFormatter={v => `${v > 0 ? "+" : ""}${v}%`} /><Tooltip contentStyle={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} formatter={(v, _n, p) => [`${v >= 0 ? "+" : ""}${v}% ${p.payload.result === "WIN" ? "✓" : p.payload.result === "LOSS" ? "✗" : ""}`, "Cum P&L"]} /><Area type="monotone" dataKey="cumPnL" stroke={T.green} fill="url(#eqGrad)" strokeWidth={2} dot={({ cx, cy, payload }) => <circle key={cx} cx={cx} cy={cy} r={4} fill={payload.result === "WIN" ? T.green : payload.result === "LOSS" ? T.red : T.cyan} stroke="none" />} /></AreaChart></ResponsiveContainer>
            </div>
          )}

          {/* ── Closed History ── */}
          {closedSigs.length > 0 && (
            <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 7, textTransform: "uppercase", letterSpacing: 0.6 }}>
                <BookOpen size={13} style={{ color: T.cyan }} />Closed History
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: T.bg3, color: T.textM, textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>{closedSigs.length}</span>
              </div>
              {/* Desktop */}
              <div className="sig-table-wrap" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["","Pair","Dir","Entry","Exit","P&L","Outcome","R:R","Duration","Closed"].map((h,i) => (
                      <th key={i} style={{ padding: "7px 10px", textAlign: "left", color: T.textD, fontWeight: 500, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{closedSigs.map(sg => {
                    const pnl = calcPnL(sg, liveData);
                    const isWin = sg.result === "WIN";
                    const isLoss = sg.result === "LOSS";
                    const openedAt = new Date(sg.createdAt);
                    const closedAt = sg.closedAt ? new Date(sg.closedAt) : null;
                    const durationMs = closedAt ? closedAt - openedAt : null;
                    const dur = durationMs == null ? "—" : durationMs < 3600000 ? `${Math.round(durationMs/60000)}m` : durationMs < 86400000 ? `${Math.round(durationMs/3600000)}h` : `${Math.round(durationMs/86400000)}d`;
                    return (
                      <tr key={sg.id} style={{ borderLeft: `3px solid ${isWin ? T.green : isLoss ? T.red : T.border}`, background: isWin ? "rgba(16,185,129,0.03)" : isLoss ? "rgba(239,68,68,0.03)" : "transparent" }}>
                        <td style={{ padding: "10px 10px" }}><GradePill grade={sg.grade} /></td>
                        <td style={{ padding: "10px 10px", fontWeight: 700 }}>{sg.instrument}</td>
                        <td style={{ padding: "10px 10px", fontWeight: 700, color: sg.direction === "Long" ? T.green : T.red }}>{sg.direction === "Long" ? "▲ Long" : "▼ Short"}</td>
                        <td style={{ padding: "10px 10px", color: T.textM, fontFamily: "monospace" }}>{fmtPrice(sg, sg.entryPrice)}</td>
                        <td style={{ padding: "10px 10px", color: T.textM, fontFamily: "monospace" }}>{fmtPrice(sg, sg.exitPrice)}</td>
                        <td style={{ padding: "10px 10px", fontWeight: 700, color: pnl == null ? T.textD : pc(pnl) }}>{pnl == null ? "—" : `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%`}</td>
                        <td style={{ padding: "10px 10px" }}>
                          {isWin && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: T.greenBg, color: T.green, border: `1px solid ${T.greenBd}` }}>✓ TP HIT</span>}
                          {isLoss && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: T.redBg, color: T.red, border: `1px solid ${T.redBd}` }}>✗ SL HIT</span>}
                          {!sg.result && <span style={{ fontSize: 10, color: T.textD }}>Manual</span>}
                        </td>
                        <td style={{ padding: "10px 10px", color: T.textM }}>{sg.riskReward || "—"}</td>
                        <td style={{ padding: "10px 10px", color: T.textD, fontSize: 11 }}>{dur}</td>
                        <td style={{ padding: "10px 10px", color: T.textD, fontSize: 11 }}>{closedAt ? closedAt.toLocaleDateString() : "—"}</td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="sig-cards">
                {closedSigs.map(sg => {
                  const pnl = calcPnL(sg, liveData);
                  const isWin = sg.result === "WIN";
                  const isLoss = sg.result === "LOSS";
                  const openedAt = new Date(sg.createdAt);
                  const closedAt2 = sg.closedAt ? new Date(sg.closedAt) : null;
                  const durationMs = closedAt2 ? closedAt2 - openedAt : null;
                  const dur = durationMs == null ? "—" : durationMs < 3600000 ? `${Math.round(durationMs/60000)}m` : durationMs < 86400000 ? `${Math.round(durationMs/3600000)}h` : `${Math.round(durationMs/86400000)}d`;
                  return (
                    <div key={sg.id} style={{ background: T.bg, border: `1px solid ${isWin ? T.greenBd : isLoss ? T.redBd : T.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 800, color: T.text }}>{sg.instrument}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: sg.direction === "Long" ? T.green : T.red }}>{sg.direction === "Long" ? "▲" : "▼"}</span>
                          <GradePill grade={sg.grade} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {isWin && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: T.greenBg, color: T.green, border: `1px solid ${T.greenBd}` }}>✓ TP HIT</span>}
                          {isLoss && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: T.redBg, color: T.red, border: `1px solid ${T.redBd}` }}>✗ SL HIT</span>}
                          {!sg.result && <span style={{ fontSize: 10, color: T.textD }}>Manual</span>}
                          <span style={{ fontSize: 16, fontWeight: 800, color: pnl == null ? T.textD : pc(pnl) }}>{pnl == null ? "—" : `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%`}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, fontSize: 11, color: T.textD }}>
                        <span>Entry: <span style={{ color: T.textM }}>{fmtPrice(sg, sg.entryPrice)}</span></span>
                        <span>Exit: <span style={{ color: T.textM }}>{fmtPrice(sg, sg.exitPrice)}</span></span>
                        <span>R:R: <span style={{ color: T.textM }}>{sg.riskReward || "—"}</span></span>
                        <span>Held: <span style={{ color: T.textM }}>{dur}</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
    const renderStrategyTab = () => {
      const cats = {
        positioning: { label: "COT & Positioning", color: T.cyan },
        sentiment:   { label: "Retail Sentiment",  color: T.purple },
        orderflow:   { label: "Order Flow",         color: T.amber },
        options:     { label: "Options",            color: T.blue },
        volatility:  { label: "Volatility",         color: T.green },
      };
      return (
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
    };

    return (
      <>
        <div className="lab-tabs" style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", scrollbarWidth: "none", flexWrap: "nowrap" }}>
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


  return (
    <div style={s.root}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes drawerIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}

        /* ── Default (desktop) ── */
        .mob-only{display:none!important}
        .desk-nav{display:flex}
        .hdr-meta{display:flex}
        .hamburger-btn{display:none!important}
        .drawer-overlay{display:none!important}

        /* ── Tablet / Mobile ── */
        @media(max-width:900px){
          .desk-nav{display:none!important}
          .hamburger-btn{display:flex!important;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;background:#1a2235;border:1px solid #1e2d45;cursor:pointer;color:#e2e8f0;flex-shrink:0}
          .mob-only{display:flex!important}
          .hdr-meta{display:none!important}
          .ti-root{padding-bottom:0!important}
          .inst-bar{padding:8px 12px!important;gap:6px!important}
          .inst-chip{padding:6px 10px!important;font-size:11px!important}
          .g4-grid{grid-template-columns:repeat(2,1fr)!important}
          .g2-grid{grid-template-columns:1fr!important}
          .hdr-right{gap:6px!important}
          .tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
          .lab-tabs{gap:4px!important;flex-wrap:nowrap!important;overflow-x:auto!important;scrollbar-width:none!important}
          .overview-actions{flex-wrap:wrap!important;gap:6px!important}
          .cot-concepts{grid-template-columns:repeat(2,1fr)!important}
          .asetup-grid{grid-template-columns:repeat(2,1fr)!important}
          .lab-form-row{grid-template-columns:1fr 1fr!important}
          .scanner-card{grid-template-columns:1fr auto!important;gap:10px!important}
          .scanner-patterns{display:none!important}
          .cal-wrap{height:calc(100vh - 160px)!important;padding:0!important}
        }
        @media(max-width:480px){
          .g4-grid{grid-template-columns:1fr!important}
          .hdr-title{font-size:14px!important}
          .cot-concepts{grid-template-columns:1fr!important}
          .asetup-grid{grid-template-columns:repeat(2,1fr)!important}
          .lab-form-row{grid-template-columns:1fr!important}
        }

        /* ── Drawer ── */
        .drawer-overlay{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0.6);animation:fadeIn 0.2s}
        .drawer-panel{position:fixed;top:0;left:0;bottom:0;width:min(300px,85vw);background:#111827;border-right:1px solid #1e2d45;z-index:501;animation:drawerIn 0.25s ease-out;display:flex;flex-direction:column;overflow:hidden}
        .drawer-item{display:flex;align-items:center;gap:12px;padding:14px 20px;font-size:14px;font-weight:600;border:none;background:none;cursor:pointer;width:100%;text-align:left;border-radius:0;transition:background 0.15s}
        .drawer-item:hover,.drawer-item.active{background:#1a2235}
        .drawer-divider{height:1px;background:#1e2d45;margin:6px 16px}
      `}</style>
      

      {/* ── Header ── */}
      <header style={s.hdr}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:`linear-gradient(135deg,${T.accent},${T.cyan})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Activity size={18} color="#fff"/></div>
          <div>
            <div className="hdr-title" style={{fontSize:17,fontWeight:700,letterSpacing:-0.5}}>TradingIntel</div>
            <div className="hdr-meta" style={{fontSize:10,color:T.textD,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
              {isLive&&<><div style={{width:5,height:5,borderRadius:3,background:T.green,animation:"pulse 1.5s infinite"}}/>
              <span style={{color:T.green}}>Live</span><span style={{color:T.border}}>·</span></>}
              <span>COT {inst?.cot?.date||"Apr 7"}</span>
              <span style={{color:T.border}}>·</span>
              <span>Sentiment live</span>
            </div>
          </div>
        </div>
        <div className="hdr-right" style={{display:"flex",alignItems:"center",gap:8}}>
          <Link href="/profile" style={{display:"flex",alignItems:"center",gap:5,padding:"6px 10px",borderRadius:7,fontSize:12,fontWeight:600,border:`1px solid ${T.border}`,color:T.textM,textDecoration:"none"}}><User size={13}/><span className="hdr-meta" style={{display:"flex"}}>Profile</span></Link>
          <button onClick={()=>signOut({callbackUrl:"/login"})} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 10px",borderRadius:7,fontSize:12,fontWeight:600,border:`1px solid ${T.border}`,color:T.textM,background:"transparent",cursor:"pointer"}}><LogOut size={13}/><span className="hdr-meta" style={{display:"flex"}}>Logout</span></button>
          <button className="hamburger-btn" onClick={()=>setMenuOpen(o=>!o)} aria-label="Menu">
            {menuOpen ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </div>
      </header>

      {/* ── Mobile drawer overlay ── */}
      {menuOpen && (
        <div className="drawer-overlay" onClick={()=>setMenuOpen(false)}>
          <div className="drawer-panel" onClick={e=>e.stopPropagation()}>
            {/* Drawer header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${T.accent},${T.cyan})`,display:"flex",alignItems:"center",justifyContent:"center"}}><Activity size={15} color="#fff"/></div>
                <span style={{fontSize:15,fontWeight:700,color:T.text}}>TradingIntel</span>
              </div>
              <button onClick={()=>setMenuOpen(false)} style={{background:"none",border:"none",color:T.textD,cursor:"pointer",padding:4}}><X size={18}/></button>
            </div>
            {/* Nav items */}
            <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
              <div style={{padding:"8px 20px 4px",fontSize:9,fontWeight:700,color:T.textD,textTransform:"uppercase",letterSpacing:1}}>Navigation</div>
              {VIEWS.map(v=>{const I=VIEW_ICONS[v];const active=view===v;return(
                <button key={v} className={`drawer-item${active?" active":""}`}
                  style={{color:active?T.accent:T.textM,fontFamily:"var(--font-geist-mono),monospace"}}
                  onClick={()=>{setView(v);setMenuOpen(false);}}>
                  <I size={16} style={{color:active?T.accent:T.textD}}/>{VIEW_LABELS[v]}
                  {active&&<div style={{marginLeft:"auto",width:6,height:6,borderRadius:3,background:T.accent}}/>}
                </button>
              )})}
              <div className="drawer-divider"/>
              <div style={{padding:"8px 20px 4px",fontSize:9,fontWeight:700,color:T.textD,textTransform:"uppercase",letterSpacing:1}}>Account</div>
              <Link href="/profile" onClick={()=>setMenuOpen(false)} className="drawer-item" style={{color:T.textM,fontFamily:"var(--font-geist-mono),monospace",display:"flex",alignItems:"center",gap:12,padding:"14px 20px",textDecoration:"none"}}>
                <User size={16} style={{color:T.textD}}/> Profile
              </Link>
              <button className="drawer-item" style={{color:T.red,fontFamily:"var(--font-geist-mono),monospace"}}
                onClick={()=>{setMenuOpen(false);signOut({callbackUrl:"/login"});}}>
                <LogOut size={16} style={{color:T.red}}/> Sign Out
              </button>
            </div>
            {/* Drawer footer */}
            <div style={{padding:"12px 20px",borderTop:`1px solid ${T.border}`,flexShrink:0}}>
              {isLive&&<div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:T.green}}><div style={{width:6,height:6,borderRadius:3,background:T.green,animation:"pulse 1.5s infinite"}}/> Live Data Active</div>}
              <div style={{fontSize:10,color:T.textD,marginTop:4}}>COT: {inst?.cot?.date||"Apr 7"}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop top nav ── */}
      <nav className="desk-nav" style={s.nav}>
        {VIEWS.map(v=>{const I=VIEW_ICONS[v];return <button key={v} style={s.ni(view===v)} onClick={()=>setView(v)}><I size={13}/>{VIEW_LABELS[v]}</button>})}
      </nav>

      {/* ── Instrument bar ── */}
      {view!=="overview"&&view!=="intelligence"&&(
        <div className="inst-bar" style={{...s.ib,overflowX:"auto",flexWrap:"nowrap",scrollbarWidth:"none"}}>
          {Object.keys(INSTRUMENTS).map(k=><div key={k} className="inst-chip" style={{...s.ic(sel===k),whiteSpace:"nowrap",flexShrink:0}} onClick={()=>{setSel(k);setPosTab("signal");}}>{k}</div>)}
        </div>
      )}

      {/* ── Main content ── */}
      <main className="ti-root" style={view==="intelligence"?{padding:0,flex:1,display:"flex",flexDirection:"column",minHeight:0,overflow:"hidden",paddingBottom:"env(safe-area-inset-bottom,0)"}:{...s.mn,flex:1,overflowY:"auto",paddingBottom:"calc(64px + env(safe-area-inset-bottom,0))"}}>
        {view==="overview"&&renderOverview()}
        {view==="intelligence"&&<TradingIntelligence openSignals={signals.filter(s=>s.status==="OPEN")} liveData={liveData} onSignalClosed={fetchSignals} />}
        {view==="intel-hub"&&renderPositioning()}
        {view==="calendar"&&<div style={{...s.mn}}><EconomicCalendar /></div>}
        {view==="tradelab"&&renderTradeLab()}
      </main>

      {/* ── Mobile quick-nav bar (bottom strip) ── */}
      <nav className="mob-only" style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:T.bg2,borderTop:`1px solid ${T.border}`,padding:`6px 0 env(safe-area-inset-bottom,6px)`}}>
        {VIEWS.map(v=>{const I=VIEW_ICONS[v];const active=view===v;return(
          <button key={v} onClick={()=>setView(v)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"5px 2px",background:"none",border:"none",cursor:"pointer",color:active?T.accent:T.textD}}>
            <I size={active?20:17} style={{transition:"transform 0.15s",transform:active?"scale(1.1)":"scale(1)"}}/>
            <span style={{fontSize:8,fontWeight:active?700:400,letterSpacing:0.3,textTransform:"uppercase",whiteSpace:"nowrap"}}>{VIEW_LABELS[v].split(" ")[0]}</span>
          </button>
        )})}
      </nav>

      <ChatAssistant selectedInstrument={sel} intelligenceData={intelData} />

      {/* ── Signal auto-close toasts ── */}
      <div style={{ position: "fixed", bottom: 80, right: 20, zIndex: 9998, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
        {sigToasts.map(t => (
          <div key={t.id} style={{ pointerEvents: "auto", background: "rgba(17,24,39,0.97)", backdropFilter: "blur(12px)", borderLeft: `4px solid ${t.result === "WIN" ? T.green : T.red}`, padding: "10px 14px", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", border: `1px solid ${T.border}`, width: 270, animation: "slideIn 0.3s ease-out forwards" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 14 }}>{t.result === "WIN" ? "✅" : "🛑"}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{t.instrument}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: t.direction === "Long" ? T.green : T.red }}>{t.direction === "Long" ? "▲ Long" : "▼ Short"}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.result === "WIN" ? T.green : T.red }}>{t.result === "WIN" ? "✓ TP Hit — Trade Won" : "✗ SL Hit — Trade Closed"}</div>
            <div style={{ fontSize: 10, color: T.textD, marginTop: 3 }}>Exit @ {t.price?.toFixed?.(2) ?? t.price}</div>
          </div>
        ))}
      </div>

      {/* ── RSI Alerts Notifications (Toasts) ── */}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
        {rsiAlerts.map((alert, idx) => (
          <div key={`${alert.instrument}-${alert.type}-${idx}`} style={{ 
            pointerEvents: "auto",
            background: "rgba(17, 24, 39, 0.95)", backdropFilter: "blur(12px)", 
            borderLeft: `4px solid ${alert.type.includes("BULLISH") ? T.green : T.red}`,
            padding: "12px 16px", borderRadius: 10, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
            border: `1px solid ${T.border}`, width: 300, 
            animation: "slideIn 0.3s ease-out forwards"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: alert.type.includes("BULLISH") ? T.green : T.red }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{alert.instrument}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: T.bg3, color: T.textD }}>{alert.timeframe}</span>
              </div>
              <button onClick={() => setRsiAlerts(prev => prev.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: T.textD, cursor: "pointer", padding: 0 }}><Trash2 size={12} /></button>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: alert.type.includes("BULLISH") ? T.green : T.red, marginBottom: 2 }}>{alert.type.replace(/_/g, " ")}</div>
            <div style={{ fontSize: 11, color: T.textM, lineHeight: 1.4 }}>{alert.msg}</div>
            <div style={{ fontSize: 9, color: T.textD, marginTop: 8, textAlign: "right" }}>{new Date(alert.timestamp).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        /* Trade Lab responsive */
        .lab-stats { grid-template-columns: repeat(4,1fr) !important; }
        .sig-table-wrap { display: block; }
        .sig-cards { display: none; }
        @media(max-width:900px){
          .lab-stats { grid-template-columns: repeat(2,1fr) !important; }
          .lab-form-row { grid-template-columns: 1fr 1fr !important; }
        }
        @media(max-width:640px){
          .lab-stats { grid-template-columns: repeat(2,1fr) !important; }
          .lab-form-row { grid-template-columns: 1fr 1fr !important; }
          .sig-table-wrap { display: none !important; }
          .sig-cards { display: block !important; }
          .asetup-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  );
}

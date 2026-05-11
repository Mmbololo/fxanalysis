import { NextResponse } from "next/server";

const SYMBOLS = { XAUUSD: "GC=F", GBPUSD: "GBPUSD=X", GBPJPY: "GBPJPY=X", BTCUSD: "BTC-USD", EURUSD: "EURUSD=X" };

async function getLivePrices() {
  try {
    const list = Object.values(SYMBOLS).join(",");
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(list)}&fields=regularMarketPrice,regularMarketChangePercent`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" });
    if (!res.ok) return {};
    const json = await res.json();
    const quotes = json?.quoteResponse?.result || [];
    const inv = Object.fromEntries(Object.entries(SYMBOLS).map(([k, v]) => [v, k]));
    const out = {};
    for (const q of quotes) {
      const key = inv[q.symbol];
      if (key) out[key] = { price: q.regularMarketPrice, change: parseFloat((q.regularMarketChangePercent || 0).toFixed(2)) };
    }
    return out;
  } catch { return {}; }
}

async function getIntelligence() {
  try {
    const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/intelligence`, { cache: "no-store" });
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

function fmtP(key, v) {
  if (v == null) return "—";
  if (key === "BTCUSD") return "$" + Math.round(v).toLocaleString();
  if (key === "XAUUSD") return v.toFixed(2);
  return Number(v).toFixed(key?.includes("JPY") ? 3 : 5);
}
function fmtPct(n) { return n == null ? "—" : (n >= 0 ? "+" : "") + n.toFixed(2) + "%"; }

// random pick helper
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ─────────────────────────────────────────────────────────────────
//  Intent detection
// ─────────────────────────────────────────────────────────────────
function detectIntent(msg) {
  const m = msg.toLowerCase().trim();
  if (/^(hi|hey|hello|sup|yo|good morning|gm|morning|good evening|howdy|what'?s up|wsg)\b/.test(m)) return "greet";
  if (/\b(thank|thanks|great|nice|good job|perfect|got it|understood|appreciate)\b/.test(m)) return "ack";
  if (/\b(risk|safe|danger|should i enter|is.*good.*time|enter now|risky)\b/.test(m)) return "risk";
  if (/\b(signal|setup|trade|entry|buy|sell|long|short|direction)\b/.test(m)) return "signal";
  if (/\b(smc|order block|ob|fvg|bos|choch|liquidity|sweep)\b/.test(m)) return "smc";
  if (/\b(rsi|momentum|overbought|oversold|divergen)\b/.test(m)) return "rsi";
  if (/\b(support|resistance|level|key price|s.r)\b/.test(m)) return "levels";
  if (/\b(news|fundamenta|event|catalyst|macro)\b/.test(m)) return "news";
  if (/\b(compare|versus|\bvs\b|all pair|best pair|which.*better|strongest)\b/.test(m)) return "compare";
  if (/\b(tp|target|take profit|profit target)\b/.test(m)) return "tp";
  if (/\b(sl|stop loss|stop|invalidat|stoploss)\b/.test(m)) return "sl";
  if (/\b(analyz|overview|summary|how.*look|what.*think|tell me about|brief|what.*doing|where.*headed|outlook)\b/.test(m)) return "analyze";
  return "analyze";
}

function extractInstrument(msg, def) {
  const m = msg.toUpperCase();
  if (m.includes("XAUUSD") || m.includes("GOLD") || m.includes("XAU")) return "XAUUSD";
  if (m.includes("BTCUSD") || m.includes("BITCOIN") || m.includes("BTC")) return "BTCUSD";
  if (m.includes("GBPJPY") || m.includes("GEPPY") || m.includes("GUPPY")) return "GBPJPY";
  if (m.includes("GBPUSD") || m.includes("CABLE") || m.includes("GBP")) return "GBPUSD";
  if (m.includes("EURUSD") || m.includes("FIBER") || m.includes("EUR")) return "EURUSD";
  return def;
}

// ─────────────────────────────────────────────────────────────────
//  Human-style response generators
// ─────────────────────────────────────────────────────────────────

function genGreet() {
  return pick([
    `Hey, good to see you. I've got live data loaded across all pairs — Gold, Cable, Geppy, BTC and Euro. What are you looking at today?`,
    `Hey! Markets are moving, data's live. Which instrument do you want to dig into first?`,
    `What's up. Ready when you are — just tell me which pair you're watching or what you want to know.`,
    `Morning! Got all instruments live. Are you looking for a specific setup, or do you want a quick read on what's moving?`,
  ]);
}

function genAck() {
  return pick([
    `Anytime. Let me know what else you need.`,
    `Got it. Anything else you want me to look at?`,
    `Sure. What's next?`,
    `No problem. I'm here if you want to dig deeper into anything.`,
  ]);
}

function genAnalyze(key, d, live) {
  if (!d || d.error) return `Hmm, I'm not getting data back for ${key} right now. Give it a second and try again — it might just be a feed hiccup.`;

  const price = live?.[key]?.price ?? d.current;
  const change = live?.[key]?.change ?? d.change;
  const sig = d.signal;

  const rsiZone = d.rsi > 70 ? "overbought — that's a red flag for new longs right now"
    : d.rsi < 30 ? "oversold — interesting for a bounce play but don't force it"
    : d.rsi > 55 ? "bullish momentum, nice sweet spot for trend trades"
    : d.rsi < 45 ? "building bearish pressure"
    : "neutral, not giving a strong lean either way";

  const structComment = d.structure === "BREAKOUT"
    ? `Structure's broken out — price cleared resistance and that's a meaningful move. Breakout is confirmed on this timeframe.`
    : d.structure === "BREAKDOWN"
    ? `We've got a breakdown — support didn't hold and price is now below it. Bears have the momentum here.`
    : d.structure === "TRENDING"
    ? `Market's in trend mode. Clean directional flow, which makes it easier to trade with confluence.`
    : `It's consolidating right now. I'd be careful about trend entries in this — wait for a clean break one way.`;

  const opener = pick([
    `Alright, here's where ${key} stands:`,
    `Let me break down ${key} for you.`,
    `Okay, pulled the live data on ${key}. Here's the picture:`,
    `Right, so ${key} right now —`,
  ]);

  let text = `${opener}\n\n`;
  text += `Price is sitting at **${fmtP(key, price)}** (${fmtPct(change)} on the day). `;
  text += `The overall trend is **${d.trend?.toLowerCase() ?? "unclear"}** and RSI is at **${d.rsi?.toFixed(1) ?? "—"}** — ${rsiZone}.\n\n`;
  text += `${structComment}\n\n`;

  if (d.sma && price) {
    const aboveAll = price > d.sma.sma20 && price > d.sma.sma50 && price > d.sma.sma200;
    const belowAll = price < d.sma.sma20 && price < d.sma.sma50 && price < d.sma.sma200;
    if (aboveAll) text += `MA stack is fully aligned to the upside — price is above the 20, 50, and 200. That's about as clean a bull alignment as you'll see.\n\n`;
    else if (belowAll) text += `Price is under all three major MAs (20/50/200) — bears have full stack control right now.\n\n`;
    else text += `MAs are mixed — 20 at ${fmtP(key, d.sma.sma20)}, 50 at ${fmtP(key, d.sma.sma50)}, 200 at ${fmtP(key, d.sma.sma200)}. Not a clean stack, so I'd treat it as a ranging environment until that clears up.\n\n`;
  }

  if (sig) {
    text += `The platform's got an active **${sig.direction === "Long" ? "LONG ▲" : "SHORT ▼"}** signal. Entry zone around ${fmtP(key, sig.entry)}, SL at ${fmtP(key, sig.sl)}, TP1 at ${fmtP(key, sig.tp1)} — that's a ${sig.rr} R:R with ${sig.confidence}% confidence. `;
    text += sig.confidence >= 70 ? `That's a solid confidence level, worth paying attention to.` : `It's a moderate conviction signal, so keep your size reasonable.`;
  } else {
    text += `No active signal from the system right now — the conditions aren't there yet for a high-conviction entry. Better to wait than force it.`;
  }

  text += `\n\nWant me to go deeper on the risk, levels, or SMC structure?`;
  return text;
}

function genRisk(key, d, live) {
  if (!d || d.error) return `Can't pull risk data for ${key} at the moment. Try again in a second.`;

  const price = live?.[key]?.price ?? d.current;
  const atr = d.atr;
  const sig = d.signal;

  let riskScore = 0;
  if (d.rsi > 70 || d.rsi < 30) riskScore++;
  if (d.structure === "RANGING") riskScore++;
  if (d.structure === "BREAKDOWN" && d.trend === "BEARISH") riskScore += 2;
  if (d.structure === "BREAKOUT" && d.trend === "BULLISH") riskScore = Math.max(0, riskScore - 1);
  if (sig && sig.confidence > 70) riskScore = Math.max(0, riskScore - 1);

  const riskLabel = riskScore <= 0 ? "LOW — conditions are favourable" : riskScore === 1 ? "MODERATE — manageable but keep size in check" : riskScore === 2 ? "HIGH — I'd be cautious here" : "VERY HIGH — this is not a good time to be putting on new positions";
  const riskColor = riskScore <= 0 ? "🟢" : riskScore === 1 ? "🟡" : "🔴";

  const opener = pick([
    `Here's my risk read on ${key}:`,
    `Let me walk you through the risk picture on ${key}.`,
    `Right, risk assessment on ${key}:`,
  ]);

  let text = `${opener}\n\n`;
  text += `Price is at **${fmtP(key, price)}** with an ATR of **${fmtP(key, atr)}** — that tells you how much this thing normally moves in a day, which is your baseline for stop sizing.\n\n`;
  text += `RSI is **${d.rsi?.toFixed(1) ?? "—"}** — ${d.rsi > 70 ? "overbought. Chasing longs here is risky, you'd be buying into a crowded move." : d.rsi < 30 ? "oversold. Shorting here is pressing into low fuel territory for bears." : "sitting in a healthy range."}\n\n`;
  text += `**Overall risk: ${riskColor} ${riskLabel}**\n\n`;

  if (d.structure === "RANGING") text += `The market's ranging — trend entries in consolidation are traps more often than not. If you're going to trade it, stick to the boundaries and keep it tight.\n\n`;
  if (d.structure === "BREAKDOWN" && d.trend === "BEARISH") text += `Trend and structure are both bearish — a breakdown in a downtrend is one of the higher-risk environments for longs. Don't get caught trying to catch bottoms here.\n\n`;

  if (sig) {
    const slDist = Math.abs(price - sig.sl);
    const slPct = ((slDist / price) * 100).toFixed(2);
    const atrRatio = (slDist / atr).toFixed(1);
    text += `If you're thinking about entering now — your SL would be ${fmtP(key, slDist)} (${slPct}%) away from current price. That's ${atrRatio}× ATR. `;
    text += parseFloat(atrRatio) < 1 ? `That's actually a tight, clean stop — within one ATR, which is where I like it.\n\n` : `That's wider than one ATR, so size down accordingly. Don't let the stop dictate more than 1–2% of your account.\n\n`;
  }

  if (d.support?.length) text += `Key support nearby: **${d.support.slice(0, 2).map(s => fmtP(key, s)).join(" / ")}**`;
  if (d.resistance?.length) text += ` | Key resistance: **${d.resistance.slice(0, 2).map(r => fmtP(key, r)).join(" / ")}**`;
  if (d.support?.length || d.resistance?.length) text += `\n\n`;

  text += `Rule of thumb: never risk more than 1–2% of capital on a single trade, no matter how good the setup looks.`;
  return text;
}

function genSignal(key, d, live) {
  const sig = d?.signal;
  const price = live?.[key]?.price ?? d?.current;

  if (!sig) {
    return `Honestly? No active signal on ${key} right now. Here's what I'm seeing:\n\nTrend is **${d?.trend ?? "unclear"}**, RSI at **${d?.rsi?.toFixed(1) ?? "—"}**, structure is **${d?.structure ?? "—"}**.\n\nThe system needs a bit more confluence before it'll generate a trade — specifically RSI alignment with the trend, a clear structural break or order block test, and a master score above 65. It's not there yet.\n\nBetter to wait for a cleaner setup than force an entry. What else can I help you with?`;
  }

  const isLong = sig.direction === "Long";
  const distFromEntry = price != null ? Math.abs(price - sig.entry) : null;
  const pricedBeyond = price != null && (isLong ? price > sig.entry : price < sig.entry);

  let text = `${pick(["Alright, here's the active signal on", "Got a platform signal on", "So the system has flagged a setup on"])} **${key}**:\n\n`;
  text += `**${isLong ? "LONG ▲" : "SHORT ▼"}** — ${sig.confidence}% confidence\n\n`;
  text += `| Level | Price |\n|-------|-------|\n`;
  text += `| Entry | ${fmtP(key, sig.entry)} |\n`;
  text += `| Stop Loss | ${fmtP(key, sig.sl)} |\n`;
  text += `| TP1 | ${fmtP(key, sig.tp1)} |\n`;
  text += `| TP2 | ${fmtP(key, sig.tp2)} |\n`;
  text += `| R:R | ${sig.rr} |\n\n`;

  if (price != null && distFromEntry != null) {
    text += `Live price is **${fmtP(key, price)}** — that's ${fmtP(key, distFromEntry)} ${pricedBeyond ? `past the entry zone. If you missed the initial entry, don't chase it — wait for a pullback toward ${fmtP(key, sig.entry)} or a retest.` : `away from entry. Still in a valid zone.`}\n\n`;
  }

  text += `**Why the signal fires:**\n`;
  text += `• Trend is **${d?.trend}** — directional alignment is there\n`;
  text += `• Structure: **${d?.structure}**\n`;
  text += `• RSI at ${d?.rsi?.toFixed(1)} — ${d?.rsi > 55 ? "bullish momentum zone" : d?.rsi < 45 ? "bearish momentum zone" : "neutral, not ideal but acceptable with other confluence"}\n`;
  if (sig.reason) text += `• ${sig.reason}\n`;

  text += `\nWant me to break down the SL placement or TP targets further?`;
  return text;
}

function genSMC(key, d) {
  const smc = d?.smc;
  if (!smc) return `I'm not getting SMC data for ${key} at the moment. This usually means there's not enough price history loaded yet — try again shortly.`;

  let text = `SMC breakdown on **${key}** (Score: ${smc.score ?? "—"}/100):\n\n`;

  if (smc.bos) text += `**BOS (Break of Structure):** ${smc.bos.type?.toUpperCase()} break @ ${fmtP(key, smc.bos.level)} — structure has shifted, this matters for direction bias.\n\n`;
  if (smc.choch) text += `**CHoCH (Change of Character):** ${smc.choch.type?.toUpperCase()} @ ${fmtP(key, smc.choch.level)} — early warning of a potential trend flip. Watch closely.\n\n`;

  const inZoneBull = (smc.bullishOBs || []).filter(o => o.inZone);
  const inZoneBear = (smc.bearishOBs || []).filter(o => o.inZone);
  if (inZoneBull.length) text += `**Bullish OBs in Zone:** ${inZoneBull.length} — price is currently testing a demand block. If we see rejection from here, that's your long entry trigger.\n\n`;
  if (inZoneBear.length) text += `**Bearish OBs in Zone:** ${inZoneBear.length} — we're sitting inside supply. Smart money could push it back down from here.\n\n`;
  if (!inZoneBull.length && !inZoneBear.length) text += `No order blocks in zone right now — price is trading between key areas. I'd wait for a test of the nearest OB before committing.\n\n`;

  const fvgs = [...(smc.bullishFVGs || []).map(f => ({ ...f, type: "bull" })), ...(smc.bearishFVGs || []).map(f => ({ ...f, type: "bear" }))];
  if (fvgs.length) text += `**Fair Value Gaps:** ${fvgs.length} open FVG${fvgs.length > 1 ? "s" : ""} — price has a tendency to come back and fill these before making its next leg. Could be a magnet for a pullback.\n\n`;

  const lastSweep = smc.liquiditySweeps?.slice(-1)[0];
  if (lastSweep) text += `**Last Liquidity Sweep:** ${lastSweep.type?.toUpperCase()} @ ${fmtP(key, lastSweep.level)} — smart money ran stops here. After a sweep like this, watch for a reversal move.`;

  if (!smc.bos && !smc.choch && !inZoneBull.length && !inZoneBear.length && !lastSweep) text += `Structure is relatively clean right now — no major SMC events in play. Good time to just watch and wait.`;

  return text;
}

function genLevels(key, d, live) {
  const price = live?.[key]?.price ?? d?.current;

  let text = `Key levels on **${key}** — current price ${fmtP(key, price)}:\n\n`;

  if (d?.support?.length) {
    text += `**Support zones below:**\n`;
    d.support.slice(0, 4).forEach((s, i) => {
      const dist = price ? ` — ${((Math.abs(price - s) / price) * 100).toFixed(2)}% away` : "";
      text += `  S${i + 1}: **${fmtP(key, s)}**${dist}\n`;
    });
    text += `\n`;
  }
  if (d?.resistance?.length) {
    text += `**Resistance zones above:**\n`;
    d.resistance.slice(0, 4).forEach((r, i) => {
      const dist = price ? ` — ${((Math.abs(price - r) / price) * 100).toFixed(2)}% away` : "";
      text += `  R${i + 1}: **${fmtP(key, r)}**${dist}\n`;
    });
    text += `\n`;
  }
  if (d?.bb) {
    text += `**Bollinger Bands (20,2):** Upper ${fmtP(key, d.bb.upper)} | Mid ${fmtP(key, d.bb.middle)} | Lower ${fmtP(key, d.bb.lower)}\n`;
    if (price) {
      if (price > d.bb.upper) text += `Price is above the upper band — it's overextended. Momentum trades can keep going but mean-reversion risk is elevated.\n`;
      else if (price < d.bb.lower) text += `Price is below the lower band — potential bounce play, but wait for a confirmation candle before entering.\n`;
      else text += `Price is within the bands — normal range, no extreme readings from Bollinger.\n`;
    }
  }

  text += `\nThe levels nearest to current price are usually the most relevant for your immediate trade management.`;
  return text;
}

function genRSI(key, d) {
  const rsi = d?.rsi;
  if (rsi == null) return `RSI isn't loading for ${key} right now. The intelligence feed might be updating — try again in a moment.`;

  const zone = rsi > 70 ? "OVERBOUGHT" : rsi < 30 ? "OVERSOLD" : rsi > 55 ? "BULLISH RANGE" : rsi < 45 ? "BEARISH RANGE" : "NEUTRAL";

  let text = `RSI on **${key}**: **${rsi.toFixed(1)}** — ${zone}\n\n`;

  if (rsi > 70) {
    text += `It's in overbought territory. That doesn't mean it'll drop immediately — overbought can stay overbought in a strong trend — but it does mean the risk/reward for new longs isn't great right now. If you're already in profit, think about whether your target is realistic from here. Watch for bearish divergence or a momentum shift before considering a counter-trade.\n\n`;
  } else if (rsi < 30) {
    text += `Oversold. Tempting to buy, but in a real downtrend RSI can sit below 30 for a while. I'd want to see a bullish divergence — price making a lower low but RSI making a higher low — before I'd commit to a long. Without that, you're catching a falling knife.\n\n`;
  } else if (rsi > 55) {
    text += `Bullish momentum zone. This is actually the best range for trend-following longs — strong enough to show momentum, not so extended that you're buying the top. Room to run.\n\n`;
  } else if (rsi < 45) {
    text += `Building bearish pressure. Good range for shorts if the trend aligns — there's room for continuation downward without being oversold. Clean area for trend-following shorts.\n\n`;
  } else {
    text += `Neutral — sitting in the 45–55 dead zone where RSI doesn't give you a strong lean. Honestly, on its own it's not telling you much. I'd wait for it to commit above 55 or below 45 before using it as a signal.\n\n`;
  }

  if (d?.macd) {
    const hist = d.macd.histogram;
    text += `**MACD check:** `;
    if (d.macd.cross) text += `${d.macd.cross} crossover detected. `;
    else text += `Histogram is ${hist > 0 ? "positive" : "negative"} at ${hist?.toFixed(4)}. `;

    const aligned = (rsi > 55 && hist > 0) || (rsi < 45 && hist < 0);
    text += aligned ? `RSI and MACD are both pointing the same way — that's good momentum confluence, adds weight to the directional bias.` : `RSI and MACD are giving mixed signals here. Lower confidence — I wouldn't size up in this environment.`;
  }

  return text;
}

function genTP(key, d, live) {
  const sig = d?.signal;
  const price = live?.[key]?.price ?? d?.current;
  if (!sig) return `No active signal on ${key} so there's no system-generated TP to reference. If you have your own entry in mind, share the details and I can help you think through target placement based on the current structure and ATR.`;

  const dist1 = sig.tp1 ? Math.abs(sig.tp1 - sig.entry) : null;
  const dist2 = sig.tp2 ? Math.abs(sig.tp2 - sig.entry) : null;

  let text = `TP targets for the **${sig.direction === "Long" ? "LONG ▲" : "SHORT ▼"}** signal on **${key}**:\n\n`;
  text += `**TP1:** ${fmtP(key, sig.tp1)}`;
  if (dist1 && price) text += ` — ${fmtP(key, Math.abs(price - sig.tp1))} from current price`;
  text += `\n`;
  if (sig.tp2) {
    text += `**TP2:** ${fmtP(key, sig.tp2)}`;
    if (dist2 && price) text += ` — ${fmtP(key, Math.abs(price - sig.tp2))} from current price`;
    text += `\n`;
  }
  text += `\n`;
  text += `The way I'd manage this: lock in partials at TP1, move stop to breakeven, and let the rest run toward TP2. That way you're never giving back a winner.\n\n`;
  text += d?.resistance?.length ? `Nearest resistance above: **${fmtP(key, d.resistance[0])}** — worth watching, it could slow momentum before TP1.` : ``;
  return text;
}

function genSL(key, d, live) {
  const sig = d?.signal;
  const price = live?.[key]?.price ?? d?.current;
  const atr = d?.atr;
  if (!sig) return `No active signal on ${key} right now. If you want help sizing a stop for your own trade, tell me your entry and direction and I'll work through it with you using the current ATR.`;

  const slDist = price ? Math.abs(price - sig.sl) : null;
  const slPct = slDist && price ? ((slDist / price) * 100).toFixed(2) : null;
  const atrRatio = slDist && atr ? (slDist / atr).toFixed(1) : null;

  let text = `Stop loss for the **${sig.direction === "Long" ? "LONG ▲" : "SHORT ▼"}** signal on **${key}**:\n\n`;
  text += `**SL:** ${fmtP(key, sig.sl)}`;
  if (slDist && price) text += ` — ${fmtP(key, slDist)} (${slPct}%) from current price`;
  text += `\n`;
  if (atrRatio) text += `That's **${atrRatio}× ATR** — `;
  if (atrRatio) text += parseFloat(atrRatio) < 1 ? `a tight, clean stop. Low noise, high conviction placement.\n\n` : parseFloat(atrRatio) < 2 ? `reasonable. Within 2 ATR, which is standard for this type of setup.\n\n` : `wider than 2 ATR. If you use this stop, size down to keep your dollar risk in check.\n\n`;

  const isLong = sig.direction === "Long";
  text += `The SL is placed ${isLong ? "below" : "above"} the ${isLong ? "support" : "resistance"} level. If price closes ${isLong ? "below" : "above"} ${fmtP(key, sig.sl)}, the setup is invalidated — that's the line.\n\n`;
  text += `Position sizing tip: work backwards from your max dollar risk, not from the trade. If you're risking 1% of a $5,000 account ($50), divide $50 by the SL distance in pips/points to get your lot size.`;
  return text;
}

function genCompare(intel, live) {
  if (!intel?.instruments) return "The intelligence feed is still loading. Give it a second and try again.";

  const keys = ["XAUUSD", "GBPUSD", "GBPJPY", "BTCUSD", "EURUSD"];
  const rows = keys.map(k => {
    const d = intel.instruments[k];
    const price = live?.[k]?.price ?? d?.current;
    const change = live?.[k]?.change ?? d?.change;
    const rsi = d?.rsi?.toFixed(0) ?? "—";
    const trend = d?.trend ?? "—";
    const sig = d?.signal;
    return { k, price, change, rsi, trend, sig, d };
  });

  const withSignals = rows.filter(r => r.sig);
  const best = withSignals.sort((a, b) => (b.sig?.confidence ?? 0) - (a.sig?.confidence ?? 0));

  let text = `Here's a quick snapshot across all instruments:\n\n`;
  for (const r of rows) {
    const arrow = r.change > 0 ? "▲" : r.change < 0 ? "▼" : "—";
    text += `**${r.k}** ${arrow} ${fmtP(r.k, r.price)} (${fmtPct(r.change)}) | Trend: ${r.trend} | RSI: ${r.rsi} | ${r.sig ? `Signal: **${r.sig.direction === "Long" ? "LONG ▲" : "SHORT ▼"}** (${r.sig.confidence}%)` : "No signal"}\n`;
  }
  text += `\n`;

  if (best.length >= 1) {
    text += `**Highest conviction right now:** ${best[0].k} — ${best[0].sig.direction} setup at ${best[0].sig.confidence}% confidence.`;
    if (best.length > 1) text += ` ${best[1].k} is also showing a setup worth watching.`;
  } else {
    text += `No high-conviction signals are firing across any of the pairs right now. Looks like a transitional period — better to wait for clarity than force a trade.`;
  }

  return text;
}

function genNews(key, intel) {
  const news = (intel?.news || []).filter(n => !n.affected?.length || n.affected.includes(key)).slice(0, 6);
  if (!news.length) return `Nothing in the news feed specifically tagged to ${key} right now. For the latest macro headlines, check the News tab in the Chart Terminal — it updates in real time.`;

  let text = `Here's what's in the news affecting **${key}**:\n\n`;
  for (const n of news) {
    const imp = n.impact === "HIGH" ? "🔴 HIGH" : n.impact === "MEDIUM" ? "🟡 MED" : "🟢 LOW";
    const sent = n.sentiment === "BULLISH" ? "↑ bullish" : n.sentiment === "BEARISH" ? "↓ bearish" : "neutral";
    text += `${imp} | ${sent} — **${n.title}**\n`;
    if (n.pubDate) text += `   ${new Date(n.pubDate).toLocaleDateString()}\n`;
    text += `\n`;
  }
  text += `High-impact news can override technical setups fast. If there's a red-folder event coming up, I'd reduce size or stay out until after the release.`;
  return text;
}

// ─────────────────────────────────────────────────────────────────
//  Main route
// ─────────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const { messages, context } = await req.json();
    const selectedInstrument = context?.selectedInstrument || "XAUUSD";
    const lastUser = messages.filter(m => m.role === "user").slice(-1)[0]?.content || "";

    const intent = detectIntent(lastUser);

    if (intent === "greet") return NextResponse.json({ message: genGreet() });
    if (intent === "ack") return NextResponse.json({ message: genAck() });

    const key = intent === "compare" ? null : extractInstrument(lastUser, selectedInstrument);
    const passedIntel = context?.intelligenceData || null;
    const [fetchedIntel, live] = await Promise.all([
      passedIntel ? Promise.resolve(null) : getIntelligence(),
      getLivePrices(),
    ]);
    const intel = passedIntel || fetchedIntel;
    const d = key ? intel?.instruments?.[key] : null;

    let response;
    switch (intent) {
      case "risk":    response = genRisk(key, d, live); break;
      case "signal":  response = genSignal(key, d, live); break;
      case "smc":     response = genSMC(key, d); break;
      case "rsi":     response = genRSI(key, d); break;
      case "levels":  response = genLevels(key, d, live); break;
      case "news":    response = genNews(key, intel); break;
      case "compare": response = genCompare(intel, live); break;
      case "tp":      response = genTP(key, d, live); break;
      case "sl":      response = genSL(key, d, live); break;
      default:        response = genAnalyze(key, d, live);
    }

    return NextResponse.json({ message: response });
  } catch (err) {
    console.error("[chat] Error:", err.message);
    return NextResponse.json({ message: "Hit a snag on my end. Give it a second and try again." }, { status: 500 });
  }
}

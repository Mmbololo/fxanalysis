import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  sma, rsi, macd, bollingerBands, atr, supportResistance,
  marketStructure, trendDirection, detectOrderBlocks, detectFVG,
  detectStructure, detectLiquiditySweeps,
} from "@/lib/technicals";

const INSTRUMENTS = {
  XAUUSD: { symbol: "GC=F" },
  GBPUSD: { symbol: "GBPUSD=X" },
  GBPJPY: { symbol: "GBPJPY=X" },
  BTCUSD: { symbol: "BTC-USD" },
  EURUSD: { symbol: "EURUSD=X" },
};

// Decimal precision per instrument
const DP = { XAUUSD: 2, BTCUSD: 0, GBPJPY: 3 };
const dp = (key) => DP[key] ?? 5;
const rp = (key, v) => parseFloat(v.toFixed(dp(key)));

async function fetchOHLC(symbol, interval, range) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json.chart?.result?.[0];
    if (!result) return null;
    const q = result.indicators?.quote?.[0];
    if (!q) return null;
    const closes = [], highs = [], lows = [], opens = [];
    for (let i = 0; i < q.close.length; i++) {
      if (q.close[i] != null && q.high[i] != null && q.low[i] != null) {
        closes.push(q.close[i]);
        highs.push(q.high[i]);
        lows.push(q.low[i]);
        opens.push(q.open?.[i] ?? q.close[i]);
      }
    }
    return closes.length >= 25 ? { closes, highs, lows, opens } : null;
  } catch { return null; }
}

// ── Pattern detection ─────────────────────────────────────────────────────────

/**
 * Turtle Soup: price wicks through a swing high/low then closes back inside.
 */
function detectTurtleSoup(highs, lows, closes) {
  const len = closes.length;
  if (len < 12) return null;
  const lastHigh = highs[len - 1];
  const lastLow = lows[len - 1];
  const lastClose = closes[len - 1];

  for (let lookback = 4; lookback <= 20; lookback++) {
    const wStart = len - 2 - lookback;
    if (wStart < 2) continue;
    const wLow = Math.min(...lows.slice(wStart, wStart + 3));
    const wHigh = Math.max(...highs.slice(wStart, wStart + 3));

    if (lastLow < wLow && lastClose > wLow) {
      const depth = ((wLow - lastLow) / wLow) * 100;
      if (depth < 0.02) continue;
      return { type: "bullish", sweepLevel: wLow, wickLevel: lastLow, barsAgo: lookback, depth };
    }
    if (lastHigh > wHigh && lastClose < wHigh) {
      const depth = ((lastHigh - wHigh) / wHigh) * 100;
      if (depth < 0.02) continue;
      return { type: "bearish", sweepLevel: wHigh, wickLevel: lastHigh, barsAgo: lookback, depth };
    }
  }
  return null;
}

/**
 * CRT (Candle Range Theory): accumulation → manipulation → distribution
 */
function detectCRT(_opens, highs, lows, closes, atrVal) {
  const len = closes.length;
  if (len < 5) return null;

  for (let offset = 0; offset <= 2; offset++) {
    const aIdx = len - 4 - offset;
    const bIdx = len - 3 - offset;
    const cIdx = len - 1;
    if (aIdx < 0 || bIdx < 0) continue;

    const aLow = lows[aIdx], aHigh = highs[aIdx];
    const aRange = aHigh - aLow;
    if (aRange < atrVal * 0.25) continue;

    const bLow = lows[bIdx], bHigh = highs[bIdx];
    const cClose = closes[cIdx];

    if (bLow < aLow && cClose > aLow && cClose < aHigh) {
      return { type: "bullish", accumRange: [aLow, aHigh], manipLow: bLow, sweepDepth: ((aLow - bLow) / aLow) * 100 };
    }
    if (bHigh > aHigh && cClose < aHigh && cClose > aLow) {
      return { type: "bearish", accumRange: [aLow, aHigh], manipHigh: bHigh, sweepDepth: ((bHigh - aHigh) / aHigh) * 100 };
    }
  }
  return null;
}

// ── Macro scoring ─────────────────────────────────────────────────────────────

function scoreCOT(cotData, isLong, reasons) {
  if (!cotData) return 0;
  let score = 0;
  const { netSpec, prevNet, managedMoney, netSpecGBP, netSpecJPY } = cotData;
  const effNet = netSpec ?? (netSpecGBP != null && netSpecJPY != null ? netSpecGBP - netSpecJPY : null);

  if (effNet != null) {
    const isSpecLong = effNet > 0;
    const isReducing = prevNet != null && Math.abs(effNet) < Math.abs(prevNet);
    if (isLong && isSpecLong) { score += 8; reasons.push("COT: specs net long"); }
    else if (!isLong && !isSpecLong) { score += 8; reasons.push("COT: specs net short"); }
    else { score -= 6; reasons.push("⚠ COT opposes direction"); }
    if (isReducing && isLong && isSpecLong) { score -= 4; reasons.push("⚠ Specs trimming"); }
    else if (isReducing && !isLong && !isSpecLong) { score -= 4; reasons.push("⚠ Specs covering"); }
  }
  if (managedMoney != null) {
    if (isLong && managedMoney > 0) score += 4;
    else if (!isLong && managedMoney < 0) score += 4;
  }
  return score;
}

function scoreSentiment(sentiment, isLong, reasons) {
  if (!sentiment) return 0;
  const { retailLong, retailShort } = sentiment;
  let score = 0;
  if (isLong) {
    if (retailShort >= 65) { score += 10; reasons.push(`Sentiment: ${retailShort}% retail short — contrarian long`); }
    else if (retailShort >= 55) { score += 5; }
    else if (retailLong >= 70) { score -= 8; reasons.push(`⚠ Sentiment: ${retailLong}% retail long — crowded`); }
    else if (retailLong >= 60) { score -= 4; }
  } else {
    if (retailLong >= 65) { score += 10; reasons.push(`Sentiment: ${retailLong}% retail long — contrarian short`); }
    else if (retailLong >= 55) { score += 5; }
    else if (retailShort >= 70) { score -= 8; reasons.push(`⚠ Sentiment: ${retailShort}% retail short — crowded`); }
    else if (retailShort >= 60) { score -= 4; }
  }
  return score;
}

function scoreOptions(optData, isLong, currentPrice, reasons) {
  if (!optData || optData.putCallRatio == null) return 0;
  let score = 0;
  const { putCallRatio, maxPainStrike } = optData;
  if (isLong && putCallRatio < 0.7) { score += 8; reasons.push(`Options: P/C ${putCallRatio} — bullish`); }
  else if (isLong && putCallRatio > 1.2) { score -= 6; reasons.push(`⚠ Options: P/C ${putCallRatio} — bearish skew`); }
  else if (!isLong && putCallRatio > 1.2) { score += 8; reasons.push(`Options: P/C ${putCallRatio} — bearish`); }
  else if (!isLong && putCallRatio < 0.7) { score -= 6; }
  if (maxPainStrike && currentPrice) {
    const mpNum = parseFloat(String(maxPainStrike).replace(/[$,]/g, ""));
    if (!isNaN(mpNum)) {
      if (isLong && mpNum > currentPrice) { score += 5; reasons.push(`Max pain ${maxPainStrike} above — upward pull`); }
      else if (!isLong && mpNum < currentPrice) { score += 5; reasons.push(`Max pain ${maxPainStrike} below — downward pull`); }
    }
  }
  return score;
}

// ── Core signal engine ────────────────────────────────────────────────────────

function buildSignal(key, primary, htf, meta, livePrice) {
  const { closes, highs, lows, opens } = primary;
  const len = closes.length;
  if (len < 30) return null;

  // ── Use live price as anchor ─────────────────────────────────────────────────
  // If live price is provided, inject it as the current close AND verify
  // the OHLC data is fresh (last bar within 5% of live price).
  const historicClose = closes[len - 1];
  const anchor = livePrice ?? historicClose;

  if (livePrice) {
    // Reject if OHLC data is too stale relative to live price
    const stalePct = Math.abs(historicClose - livePrice) / livePrice * 100;
    if (stalePct > 3) {
      // Data is stale — replace last close with live price for indicators
      closes[len - 1] = livePrice;
    }
  }

  const atrVal = atr(highs, lows, closes);
  if (!atrVal || atrVal === 0) return null;

  const rsiVal = rsi(closes);
  const macdData = macd(closes);
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, Math.min(50, len));
  const sma200 = sma(closes, Math.min(200, len));
  const bb = bollingerBands(closes);
  const sr = supportResistance(highs, lows, closes);
  const structure = marketStructure(closes, highs, lows);
  const trend = trendDirection(closes, sma20, sma50, sma200);

  const smcOB = detectOrderBlocks(opens, highs, lows, closes, atrVal);
  const smcFVG = detectFVG(highs, lows, closes);
  const smcStruct = detectStructure(highs, lows, closes);
  const smcSweeps = detectLiquiditySweeps(highs, lows, closes);

  const turtleSoup = detectTurtleSoup(highs, lows, closes);
  const crtPattern = detectCRT(opens, highs, lows, closes, atrVal);

  let htfTrend = null;
  if (htf?.closes?.length >= 20) {
    const h20 = sma(htf.closes, 20);
    const h50 = sma(htf.closes, Math.min(50, htf.closes.length));
    const h200 = sma(htf.closes, Math.min(200, htf.closes.length));
    htfTrend = trendDirection(htf.closes, h20, h50, h200);
  }

  // ── Direction from patterns / structure / trend ──────────────────────────────
  let direction = null, entryType = "market", patternLabel = "", patternNote = "";

  if (turtleSoup) {
    direction = turtleSoup.type === "bullish" ? "Long" : "Short";
    entryType = "turtle_soup";
    patternLabel = "Turtle Soup";
    patternNote = `Stop hunt @ ${rp(key, turtleSoup.sweepLevel)}, wick ${rp(key, turtleSoup.wickLevel)}`;
  } else if (crtPattern) {
    direction = crtPattern.type === "bullish" ? "Long" : "Short";
    entryType = "crt";
    patternLabel = "CRT";
    patternNote = `CRT ${crtPattern.type}: ${crtPattern.type === "bullish" ? `swept to ${rp(key, crtPattern.manipLow)}` : `swept to ${rp(key, crtPattern.manipHigh)}`}`;
  } else if (smcStruct.choch) {
    direction = smcStruct.choch.type === "bullish" ? "Long" : "Short";
    entryType = "choch";
    patternLabel = "CHoCH Reversal";
    patternNote = `CHoCH ${smcStruct.choch.type} @ ${rp(key, smcStruct.choch.level)}`;
  } else if (smcStruct.bos?.type) {
    direction = smcStruct.bos.type === "bullish" ? "Long" : "Short";
    entryType = "bos";
    patternLabel = "BOS Continuation";
    patternNote = `BOS ${smcStruct.bos.type} @ ${rp(key, smcStruct.bos.level)}`;
  } else if (trend !== "RANGING") {
    direction = trend === "BULLISH" ? "Long" : "Short";
    entryType = "trend";
    patternLabel = "Trend Continuation";
    patternNote = `${trend} trend, structure ${structure}`;
  } else {
    return null;
  }

  const isLong = direction === "Long";

  // Hard RSI filter
  if ((entryType === "trend" || entryType === "bos") && rsiVal != null) {
    if (isLong && rsiVal > 74) return null;
    if (!isLong && rsiVal < 26) return null;
  }

  // ── Price proximity filter: entry must be within 0.8% of live price ──────────
  // This prevents signals with entries far from current market
  if (livePrice) {
    const entryDrift = Math.abs(anchor - livePrice) / livePrice * 100;
    if (entryDrift > 0.8) return null; // entry too far from current price
  }

  // ── Scoring ──────────────────────────────────────────────────────────────────
  let score = 28;
  const reasons = [];

  if (htfTrend === (isLong ? "BULLISH" : "BEARISH")) { score += 20; reasons.push("HTF aligned"); }
  else if (htfTrend === "RANGING") { score += 6; }
  else if (htfTrend) { score -= 12; reasons.push("⚠ HTF opposes"); }

  if (smcStruct.structureTrend === (isLong ? "BULLISH" : "BEARISH")) { score += 14; reasons.push("LTF structure confirmed"); }
  if (smcStruct.bos?.type === (isLong ? "bullish" : "bearish")) { score += 10; reasons.push("BOS ✓"); }
  if (smcStruct.choch?.type === (isLong ? "bullish" : "bearish")) { score += 8; reasons.push("CHoCH ✓"); }

  const obsInZone = isLong ? smcOB.bullishOBs.filter(o => o.inZone) : smcOB.bearishOBs.filter(o => o.inZone);
  const obsAny = isLong ? smcOB.bullishOBs : smcOB.bearishOBs;
  if (obsInZone.length > 0) { score += 14; reasons.push(`${obsInZone.length} OB in zone`); }
  else if (obsAny.length > 0) { score += 5; }

  const fvgsAligned = isLong ? smcFVG.bullishFVGs : smcFVG.bearishFVGs;
  if (fvgsAligned.length > 0) { score += 8; reasons.push(`${fvgsAligned.length} FVG aligned`); }

  const recentSweep = smcSweeps.slice(-3).find(s => s.type === (isLong ? "bullish" : "bearish"));
  if (recentSweep) { score += 12; reasons.push("Liquidity sweep ✓"); }

  if (rsiVal != null) {
    const sweetSpot = isLong ? (rsiVal >= 45 && rsiVal <= 66) : (rsiVal <= 55 && rsiVal >= 34);
    const ok = isLong ? (rsiVal >= 36 && rsiVal < 45) : (rsiVal > 55 && rsiVal <= 64);
    if (sweetSpot) { score += 10; reasons.push(`RSI ${rsiVal.toFixed(0)} — sweet spot`); }
    else if (ok) { score += 4; }
    else if (isLong && rsiVal > 66 && rsiVal <= 74) { score -= 3; }
    else if (!isLong && rsiVal < 34 && rsiVal >= 26) { score -= 3; }
  }
  if (macdData) {
    const aligned = isLong ? macdData.bullish : !macdData.bullish;
    if (aligned) { score += 8; reasons.push("MACD aligned"); }
    if (macdData.cross === (isLong ? "bullish" : "bearish")) { score += 5; reasons.push("MACD cross"); }
    if (!aligned) score -= 4;
  }
  if (bb) {
    if (isLong && anchor < bb.lower) { score += 6; reasons.push("Below BB lower"); }
    if (!isLong && anchor > bb.upper) { score += 6; reasons.push("Above BB upper"); }
    if (bb.width < 0.01) score -= 5;
  }

  score += scoreCOT(meta?.cot, isLong, reasons);
  score += scoreSentiment(meta?.sentiment, isLong, reasons);
  score += scoreOptions(meta?.options, isLong, anchor, reasons);

  if (entryType === "turtle_soup") score += 16;
  else if (entryType === "crt") score += 13;

  const finalScore = Math.min(Math.round(score), 98);

  // Raised quality bar: require 68+ for practical tradeable signals
  if (finalScore < 68) return null;

  // ── Entry at live price, SL/TP from structure ─────────────────────────────
  // Always use the live price as entry — not a stale candle close
  const entry = anchor;
  let sl, tp1, tp2;

  if (isLong) {
    if (entryType === "turtle_soup" && turtleSoup) {
      sl = turtleSoup.wickLevel - atrVal * 0.3;
    } else if (obsInZone.length > 0) {
      sl = obsInZone[0].low - atrVal * 0.2;
    } else if (recentSweep?.wickLow != null) {
      sl = recentSweep.wickLow - atrVal * 0.2;
    } else if (sr.supports.length > 0) {
      sl = Math.max(sr.supports[0] - atrVal * 0.3, entry - atrVal * 2);
    } else {
      sl = entry - atrVal * 1.5;
    }
    if (sl >= entry) sl = entry - atrVal;

    const risk = entry - sl;
    tp1 = entry + risk * 1.5;
    tp2 = entry + risk * 2.5;

    // Snap TP to nearby resistance levels if they're in range
    const r1 = sr.resistances[0], r2 = sr.resistances[1];
    if (r1 && r1 > entry + risk * 0.8 && r1 < tp1 * 1.05) tp1 = r1;
    if (r2 && r2 > tp1 && r2 < entry + risk * 4) tp2 = r2;

  } else {
    if (entryType === "turtle_soup" && turtleSoup) {
      sl = turtleSoup.wickLevel + atrVal * 0.3;
    } else if (obsInZone.length > 0) {
      sl = obsInZone[0].high + atrVal * 0.2;
    } else if (recentSweep?.wickHigh != null) {
      sl = recentSweep.wickHigh + atrVal * 0.2;
    } else if (sr.resistances.length > 0) {
      sl = Math.min(sr.resistances[0] + atrVal * 0.3, entry + atrVal * 2);
    } else {
      sl = entry + atrVal * 1.5;
    }
    if (sl <= entry) sl = entry + atrVal;

    const risk = sl - entry;
    tp1 = entry - risk * 1.5;
    tp2 = entry - risk * 2.5;

    const s1 = sr.supports[0], s2 = sr.supports[1];
    if (s1 && s1 < entry - risk * 0.8 && s1 > tp1 * 0.95) tp1 = s1;
    if (s2 && s2 < tp1 && s2 > entry - risk * 4) tp2 = s2;
  }

  if (isLong && (tp1 <= entry || sl >= entry)) return null;
  if (!isLong && (tp1 >= entry || sl <= entry)) return null;

  // Minimum R:R of 1.2 — no signal is worth less than this
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp2 - entry);
  if (risk === 0 || reward / risk < 1.2) return null;

  const rrRatio = (reward / risk).toFixed(1);

  const allReasons = [patternNote, ...reasons.slice(0, 5)].filter(Boolean);
  const cotLine = meta?.cot?.netSpec != null ? `COT net ${meta.cot.netSpec > 0 ? "long" : "short"} ${Math.abs(meta.cot.netSpec).toLocaleString()}` : null;
  const sentLine = meta?.sentiment ? `Retail ${meta.sentiment.retailLong}% long` : null;
  const optLine = meta?.options?.putCallRatio != null ? `P/C ${meta.options.putCallRatio}, max pain ${meta.options.maxPainStrike || "—"}` : null;
  const metaLine = [cotLine, sentLine, optLine].filter(Boolean).join(" | ");

  return {
    direction,
    entryPrice: rp(key, entry),
    stopLoss: rp(key, sl),
    targetPrice: rp(key, tp1),
    tp2: rp(key, tp2),
    riskReward: `1:${rrRatio}`,
    confidence: Math.max(1, Math.min(10, Math.round(finalScore / 10))),
    grade: finalScore >= 80 ? "A" : "B",
    masterScore: finalScore,
    bias: isLong ? "Bullish" : "Bearish",
    patternLabel,
    notes: `[AUTO] ${patternLabel} | Score: ${finalScore}/100 | ${allReasons.join(" · ")}${metaLine ? ` | ${metaLine}` : ""}`,
    autoGenerated: true,
  };
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const livePrices = body.livePrices || {};
  const cotData = body.cot || {};
  const sentData = body.sentiment || {};
  const optData = body.options || {};

  // Auto-close stale open signals whose SL has been breached by the live price
  const staleToClose = [];
  try {
    const openSigs = await prisma.signal.findMany({
      where: { userId: session.user.id, status: "OPEN" },
      select: { id: true, instrument: true, direction: true, stopLoss: true, targetPrice: true, entryPrice: true, createdAt: true },
    });

    for (const sig of openSigs) {
      const livePrice = livePrices[sig.instrument]?.price;
      if (!livePrice || !sig.stopLoss) continue;
      const isLong = sig.direction === "Long";
      const sl = Number(sig.stopLoss);
      const tp = sig.targetPrice ? Number(sig.targetPrice) : null;
      const slBreached = isLong ? livePrice <= sl : livePrice >= sl;
      const tpBreached = tp ? (isLong ? livePrice >= tp : livePrice <= tp) : false;

      // Also auto-close if signal is >48h old and significantly underwater (>1.5x ATR from entry)
      const ageHours = (Date.now() - new Date(sig.createdAt).getTime()) / 3600000;
      const entryDrift = Math.abs(livePrice - Number(sig.entryPrice)) / Number(sig.entryPrice) * 100;
      const stale = ageHours > 48 && entryDrift > 1.5 && ((isLong && livePrice < Number(sig.entryPrice)) || (!isLong && livePrice > Number(sig.entryPrice)));

      if (slBreached || tpBreached || stale) {
        staleToClose.push({ id: sig.id, exitPrice: livePrice, result: tpBreached ? "WIN" : "LOSS" });
      }
    }

    if (staleToClose.length > 0) {
      await prisma.$transaction(
        staleToClose.map(({ id, exitPrice, result }) =>
          prisma.signal.update({
            where: { id },
            data: { status: "CLOSED", exitPrice, result, closedAt: new Date() },
          })
        )
      );
    }
  } catch (_) { /* non-blocking */ }

  // Instruments that still have an OPEN signal — skip them
  const existing = await prisma.signal.findMany({
    where: { userId: session.user.id, status: "OPEN" },
    select: { instrument: true },
  });
  const openInstruments = new Set(existing.map(s => s.instrument));

  const created = [], skipped = [], errors = [];

  await Promise.all(
    Object.entries(INSTRUMENTS).map(async ([key, info]) => {
      if (openInstruments.has(key)) { skipped.push(key); return; }

      try {
        // Use 4H as primary (more reliable signals) and Daily as HTF bias
        const [primary, htf] = await Promise.all([
          fetchOHLC(info.symbol, "60m", "3mo"),   // 4H equivalent via 1H over 3mo
          fetchOHLC(info.symbol, "1d", "1y"),      // Daily for HTF trend
        ]);

        if (!primary) { errors.push(`${key}: no OHLC data`); return; }

        const currentLivePrice = livePrices[key]?.price ?? null;

        const meta = {
          cot: cotData[key] || null,
          sentiment: sentData[key] || null,
          options: optData[key] || null,
        };

        const sig = buildSignal(key, primary, htf, meta, currentLivePrice);
        if (!sig) return;

        const saved = await prisma.signal.create({
          data: {
            userId: session.user.id,
            instrument: key,
            direction: sig.direction,
            entryPrice: sig.entryPrice,
            stopLoss: sig.stopLoss,
            targetPrice: sig.targetPrice,
            riskReward: sig.riskReward,
            confidence: sig.confidence,
            grade: sig.grade,
            bias: sig.bias,
            notes: sig.notes,
            autoGenerated: true,
            status: "OPEN",
          },
        });

        created.push({ ...saved, patternLabel: sig.patternLabel, masterScore: sig.masterScore, tp2: sig.tp2 });
      } catch (e) {
        errors.push(`${key}: ${e.message}`);
      }
    })
  );

  return NextResponse.json({
    created,
    skipped,
    errors,
    autoclosed: staleToClose.length,
    ts: Date.now(),
  });
}

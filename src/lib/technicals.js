// Technical indicator calculations from OHLC arrays

export function sma(closes, period) {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function ema(closes, period) {
  if (closes.length < period) return null;
  const k = 2 / (period + 1);
  let emaVal = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    emaVal = closes[i] * k + emaVal * (1 - k);
  }
  return emaVal;
}

export function emaArray(closes, period) {
  if (closes.length < period) return [];
  const k = 2 / (period + 1);
  const result = [];
  let emaVal = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(emaVal);
  for (let i = period; i < closes.length; i++) {
    emaVal = closes[i] * k + emaVal * (1 - k);
    result.push(emaVal);
  }
  return result;
}

export function rsi(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function macd(closes) {
  const ema12 = emaArray(closes, 12);
  const ema26 = emaArray(closes, 26);
  if (!ema12.length || !ema26.length) return null;
  const offset = ema12.length - ema26.length;
  const macdLine = ema26.map((v, i) => ema12[i + offset] - v);
  const signal = emaArray(macdLine, 9);
  if (!signal.length) return null;
  const macdLast = macdLine[macdLine.length - 1];
  const sigLast = signal[signal.length - 1];
  const hist = macdLast - sigLast;
  const prevMacd = macdLine[macdLine.length - 2];
  const prevSig = signal[signal.length - 2];
  let cross = "none";
  if (prevMacd < prevSig && macdLast > sigLast) cross = "bullish";
  if (prevMacd > prevSig && macdLast < sigLast) cross = "bearish";
  return { macd: macdLast, signal: sigLast, histogram: hist, cross, bullish: macdLast > sigLast };
}

export function bollingerBands(closes, period = 20, stdDevMult = 2) {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const mid = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + Math.pow(b - mid, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  return { upper: mid + stdDevMult * stdDev, middle: mid, lower: mid - stdDevMult * stdDev, width: (stdDev * 2 * stdDevMult) / mid };
}

export function atr(highs, lows, closes, period = 14) {
  if (closes.length < period + 1) return null;
  const trs = [];
  for (let i = 1; i < closes.length; i++) {
    const hl = highs[i] - lows[i];
    const hc = Math.abs(highs[i] - closes[i - 1]);
    const lc = Math.abs(lows[i] - closes[i - 1]);
    trs.push(Math.max(hl, hc, lc));
  }
  return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
}

export function supportResistance(highs, lows, closes, lookback = 30) {
  const recentH = highs.slice(-lookback);
  const recentL = lows.slice(-lookback);
  const current = closes[closes.length - 1];

  // Find significant pivots
  const pivotHighs = [];
  const pivotLows = [];
  for (let i = 2; i < recentH.length - 2; i++) {
    if (recentH[i] > recentH[i - 1] && recentH[i] > recentH[i - 2] &&
        recentH[i] > recentH[i + 1] && recentH[i] > recentH[i + 2]) {
      pivotHighs.push(recentH[i]);
    }
    if (recentL[i] < recentL[i - 1] && recentL[i] < recentL[i - 2] &&
        recentL[i] < recentL[i + 1] && recentL[i] < recentL[i + 2]) {
      pivotLows.push(recentL[i]);
    }
  }

  const resistances = pivotHighs.filter(h => h > current).sort((a, b) => a - b).slice(0, 3);
  const supports = pivotLows.filter(l => l < current).sort((a, b) => b - a).slice(0, 3);

  // Fallback if no pivots
  if (!resistances.length) resistances.push(Math.max(...recentH));
  if (!supports.length) supports.push(Math.min(...recentL));

  return { supports, resistances };
}

export function marketStructure(closes, highs, lows) {
  const last = closes[closes.length - 1];
  const sma20val = sma(closes, 20);
  const sma50val = sma(closes, 50);
  const rsiVal = rsi(closes);

  // Check for breakout: price > 20d high
  const recent20High = Math.max(...highs.slice(-20));
  const recent20Low = Math.min(...lows.slice(-20));
  const range = recent20High - recent20Low;
  const breakoutThreshold = range * 0.02;

  if (last > recent20High - breakoutThreshold) return "BREAKOUT";
  if (last < recent20Low + breakoutThreshold) return "BREAKDOWN";
  if (range / last < 0.015) return "CONSOLIDATION";
  if (sma20val && sma50val) {
    if (last < sma20val && sma20val < sma50val) return "REVERSAL_UP";
    if (last > sma20val && sma20val > sma50val) return "TRENDING";
  }
  return "RANGING";
}

export function trendDirection(closes, sma20val, sma50val, sma200val) {
  const last = closes[closes.length - 1];
  let bullPoints = 0, bearPoints = 0;
  if (sma20val && last > sma20val) bullPoints++; else bearPoints++;
  if (sma50val && last > sma50val) bullPoints++; else bearPoints++;
  if (sma200val && last > sma200val) bullPoints++; else bearPoints++;
  if (sma20val && sma50val && sma20val > sma50val) bullPoints++; else bearPoints++;

  if (bullPoints >= 3) return "BULLISH";
  if (bearPoints >= 3) return "BEARISH";
  return "RANGING";
}

// ── Smart Money Concepts (SMC) ────────────────────────────────────────────────

/**
 * Detect Order Blocks (OB) and Breaker Blocks (BB).
 * Bullish OB: last bearish candle before a strong up-impulse.
 * Bearish OB: last bullish candle before a strong down-impulse.
 * Breaker: an OB whose range was subsequently violated by price.
 */
export function detectOrderBlocks(opens, highs, lows, closes, atrVal, lookback = 60) {
  const len = closes.length;
  const start = Math.max(2, len - lookback);
  const current = closes[len - 1];
  const threshold = atrVal ? atrVal * 1.2 : (highs[len - 1] - lows[len - 1]) * 1.5;

  const bullishOBs = [], bearishOBs = [], breakerBlocks = [];

  for (let i = start; i < len - 2; i++) {
    const nextMove = Math.abs(closes[i + 1] - opens[i + 1]);
    if (nextMove < threshold) continue; // not an impulse

    // Bullish OB: bearish candle → next candle is strongly bullish
    if (closes[i] < opens[i] && closes[i + 1] > opens[i + 1]) {
      const ob = { type: "bullish", high: highs[i], low: lows[i], mid: (highs[i] + lows[i]) / 2, index: i };
      // Breaker: price later broke below the OB low (OB failed, now acts as resistance)
      const violated = closes.slice(i + 2).some(c => c < ob.low);
      if (violated) breakerBlocks.push({ ...ob, flipType: "bearish_breaker", note: "Failed bull OB → now bearish resistance" });
      else if (ob.low <= current && current <= ob.high * 1.005) bullishOBs.push({ ...ob, inZone: true });
      else if (ob.low > current) bullishOBs.push({ ...ob, inZone: false }); // still below price — valid demand
    }

    // Bearish OB: bullish candle → next candle is strongly bearish
    if (closes[i] > opens[i] && closes[i + 1] < opens[i + 1]) {
      const ob = { type: "bearish", high: highs[i], low: lows[i], mid: (highs[i] + lows[i]) / 2, index: i };
      const violated = closes.slice(i + 2).some(c => c > ob.high);
      if (violated) breakerBlocks.push({ ...ob, flipType: "bullish_breaker", note: "Failed bear OB → now bullish support" });
      else if (ob.low * 0.995 <= current && current <= ob.high) bearishOBs.push({ ...ob, inZone: true });
      else if (ob.high < current) bearishOBs.push({ ...ob, inZone: false }); // still above price — valid supply
    }
  }

  // Return most recent 3 of each, prioritising those in zone
  const sort = (arr) => [...arr].sort((a, b) => (b.inZone ? 1 : 0) - (a.inZone ? 1 : 0) || b.index - a.index).slice(0, 3);
  return { bullishOBs: sort(bullishOBs), bearishOBs: sort(bearishOBs), breakerBlocks: sort(breakerBlocks) };
}

/**
 * Detect Fair Value Gaps (FVG / Imbalances).
 * Bullish FVG: gap where candle[i+1].low > candle[i-1].high — price left space going up.
 * Bearish FVG: gap where candle[i+1].high < candle[i-1].low — price left space going down.
 */
export function detectFVG(highs, lows, closes, lookback = 80) {
  const len = closes.length;
  const start = Math.max(1, len - lookback);
  const current = closes[len - 1];
  const minGap = (highs[len - 1] - lows[len - 1]) * 0.1; // gap must be > 10% of current range

  const bullishFVGs = [], bearishFVGs = [];

  for (let i = start; i < len - 1; i++) {
    // Bullish FVG
    const gapLow = highs[i - 1], gapHigh = lows[i + 1];
    if (gapHigh > gapLow && (gapHigh - gapLow) > minGap) {
      const filled = current < gapHigh; // price came back into / through
      bullishFVGs.push({ high: gapHigh, low: gapLow, mid: (gapHigh + gapLow) / 2, index: i, filled, type: "bullish" });
    }

    // Bearish FVG
    const gapHigh2 = lows[i - 1], gapLow2 = highs[i + 1];
    if (gapHigh2 > gapLow2 && (gapHigh2 - gapLow2) > minGap) {
      const filled = current > gapLow2;
      bearishFVGs.push({ high: gapHigh2, low: gapLow2, mid: (gapHigh2 + gapLow2) / 2, index: i, filled, type: "bearish" });
    }
  }

  return {
    bullishFVGs: bullishFVGs.filter(f => !f.filled).slice(-4),
    bearishFVGs: bearishFVGs.filter(f => !f.filled).slice(-4),
    allFVGs: [...bullishFVGs, ...bearishFVGs].sort((a, b) => b.index - a.index).slice(0, 6),
  };
}

/**
 * Detect swing structure: BOS (Break of Structure) and CHoCH (Change of Character).
 * Tracks the last 5 swing highs/lows with a 3-bar pivot rule.
 */
export function detectStructure(highs, lows, closes, lookback = 100) {
  const len = closes.length;
  const start = Math.max(3, len - lookback);
  const current = closes[len - 1];

  const swingHighs = [], swingLows = [];

  for (let i = start; i < len - 2; i++) {
    if (highs[i] > highs[i - 1] && highs[i] > highs[i - 2] && highs[i] > highs[i + 1] && highs[i] > highs[i + 2])
      swingHighs.push({ price: highs[i], index: i });
    if (lows[i] < lows[i - 1] && lows[i] < lows[i - 2] && lows[i] < lows[i + 1] && lows[i] < lows[i + 2])
      swingLows.push({ price: lows[i], index: i });
  }

  const lastSH = swingHighs[swingHighs.length - 1];
  const prevSH = swingHighs[swingHighs.length - 2];
  const lastSL = swingLows[swingLows.length - 1];
  const prevSL = swingLows[swingLows.length - 2];

  // Trend direction from swing structure
  const higherHighs = lastSH && prevSH && lastSH.price > prevSH.price;
  const higherLows  = lastSL && prevSL && lastSL.price > prevSL.price;
  const lowerHighs  = lastSH && prevSH && lastSH.price < prevSH.price;
  const lowerLows   = lastSL && prevSL && lastSL.price < prevSL.price;

  const structureTrend = (higherHighs && higherLows) ? "BULLISH" : (lowerHighs && lowerLows) ? "BEARISH" : "RANGING";

  // BOS: price breaks the most recent swing in the direction of the trend
  let bos = null;
  if (lastSH && current > lastSH.price) {
    bos = { type: "bullish", level: lastSH.price, label: "BOS ↑", note: higherHighs ? "Continuation — HH confirmed" : "Potential CHoCH — first break above structure" };
    if (!higherHighs) bos = null; // This is actually a CHoCH, not BOS
  }
  if (lastSL && current < lastSL.price) {
    bos = { type: "bearish", level: lastSL.price, label: "BOS ↓", note: lowerLows ? "Continuation — LL confirmed" : "Potential CHoCH — first break below structure" };
    if (!lowerLows) bos = null;
  }

  // CHoCH: price breaks structure AGAINST the prevailing trend (first sign of reversal)
  let choch = null;
  if (structureTrend === "BEARISH" && lastSH && current > lastSH.price)
    choch = { type: "bullish", level: lastSH.price, label: "CHoCH ↑", note: "First bullish break in a downtrend — possible reversal" };
  if (structureTrend === "BULLISH" && lastSL && current < lastSL.price)
    choch = { type: "bearish", level: lastSL.price, label: "CHoCH ↓", note: "First bearish break in an uptrend — possible reversal" };

  return {
    bos, choch,
    structureTrend,
    swingHighs: swingHighs.slice(-5),
    swingLows: swingLows.slice(-5),
    lastSwingHigh: lastSH || null,
    lastSwingLow: lastSL || null,
  };
}

/**
 * Detect liquidity sweeps: price wicks below a swing low / above a swing high then closes back.
 * These are stop hunts — after the sweep, the real move begins in the opposite direction.
 */
export function detectLiquiditySweeps(highs, lows, closes, lookback = 50) {
  const len = closes.length;
  const start = Math.max(5, len - lookback);
  const sweeps = [];

  for (let i = start; i < len; i++) {
    const recentHighs = highs.slice(Math.max(0, i - 6), i);
    const recentLows  = lows.slice(Math.max(0, i - 6), i);
    const prevSwingHigh = Math.max(...recentHighs);
    const prevSwingLow  = Math.min(...recentLows);

    // Bullish sweep: wick below swing low, close back above it
    if (lows[i] < prevSwingLow && closes[i] > prevSwingLow) {
      sweeps.push({
        type: "bullish", index: i,
        level: prevSwingLow, wickLow: lows[i],
        label: "Liquidity Sweep (Sell-side)",
        note: "Stop hunt below swing lows — smart money filled, expect push up",
        magnitude: ((prevSwingLow - lows[i]) / prevSwingLow) * 100,
      });
    }

    // Bearish sweep: wick above swing high, close back below it
    if (highs[i] > prevSwingHigh && closes[i] < prevSwingHigh) {
      sweeps.push({
        type: "bearish", index: i,
        level: prevSwingHigh, wickHigh: highs[i],
        label: "Liquidity Sweep (Buy-side)",
        note: "Stop hunt above swing highs — smart money distributed, expect push down",
        magnitude: ((highs[i] - prevSwingHigh) / prevSwingHigh) * 100,
      });
    }
  }

  return sweeps.slice(-4);
}

/**
 * Score an SMC setup 0–100 combining all structural signals.
 */
export function smcSetupScore(trend, structure, orderBlocks, fvg, sweeps, rsiVal) {
  let score = 40; // base
  const isBull = trend === "BULLISH";
  const isBear = trend === "BEARISH";
  const dir = isBull ? "bullish" : "bearish";

  // Structure alignment
  if (structure.structureTrend === trend) score += 12;
  if (structure.bos?.type === dir) score += 14;
  if (structure.choch?.type === dir) score += 10;

  // Order blocks in zone
  const obsInZone = isBull ? orderBlocks.bullishOBs.filter(o => o.inZone) : orderBlocks.bearishOBs.filter(o => o.inZone);
  if (obsInZone.length > 0) score += 14;
  else if ((isBull ? orderBlocks.bullishOBs : orderBlocks.bearishOBs).length > 0) score += 6;

  // Breaker blocks as support/resistance
  const relevantBreakers = orderBlocks.breakerBlocks.filter(b =>
    isBull ? b.flipType === "bullish_breaker" : b.flipType === "bearish_breaker"
  );
  if (relevantBreakers.length > 0) score += 8;

  // FVG confluence
  const alignedFVGs = isBull ? fvg.bullishFVGs : fvg.bearishFVGs;
  if (alignedFVGs.length > 0) score += 10;

  // Liquidity sweep in our direction (smart money filled)
  const recentSweep = sweeps.slice(-2).find(s => s.type === dir);
  if (recentSweep) score += 14;

  // RSI alignment
  if (rsiVal) {
    if (isBull && rsiVal > 45 && rsiVal < 70) score += 6;
    if (isBear && rsiVal < 55 && rsiVal > 30) score += 6;
  }

  return Math.min(Math.round(score), 98);
}

/**
 * Generate a trade signal.
 * @param {string} instrument
 * @param {number} current      - latest close
 * @param {string} trend        - from trendDirection(): BULLISH | BEARISH | RANGING
 * @param {number|null} rsiVal
 * @param {object|null} macdData
 * @param {{supports:number[], resistances:number[]}} srLevels
 * @param {number|null} atrVal
 * @param {string} [structure]  - from marketStructure(): BREAKOUT|BREAKDOWN|TRENDING|etc.
 */
export function generateSignal(instrument, current, trend, rsiVal, macdData, srLevels, atrVal, structure = "") {
  const { supports, resistances } = srLevels;
  const s1 = supports[0];
  const r1 = resistances[0];

  if (!s1 || !r1 || !atrVal) return null;

  // ── Direction: use trend + structure so RANGING markets aren't silenced ──
  // BREAKOUT / TRENDING / REVERSAL_UP → BUY candidate
  // BREAKDOWN → SELL candidate
  const structureBull = ["BREAKOUT", "TRENDING", "REVERSAL_UP"].includes(structure);
  const structureBear = structure === "BREAKDOWN";

  const isBull = trend === "BULLISH" || (trend === "RANGING" && structureBull);
  const isBear = trend === "BEARISH" || (trend === "RANGING" && structureBear);

  if (!isBull && !isBear) return null;

  // ── RSI guard: only block genuinely extreme readings to avoid chasing ──
  // Overbought threshold raised to 82 so strong bull trends (gold, BTC) are not silenced.
  // Oversold threshold lowered to 18 for the same reason.
  if (rsiVal != null) {
    if (isBull && rsiVal > 82) return null;
    if (isBear && rsiVal < 18) return null;
  }

  const direction = isBull ? "BUY" : "SELL";
  const dp = instrument.includes("JPY") ? 3 : instrument.includes("BTC") ? 0 : 4;
  const rp = v => parseFloat(v.toFixed(dp));

  // ── Build entry / SL / TP levels ─────────────────────────────────────
  let entry, sl, tp1, tp2, tp3;

  if (isBull) {
    entry = current;
    sl = Math.max(s1, current - atrVal * 1.5);
    // Guard: ensure SL is below entry
    if (sl >= entry) sl = entry - atrVal;
    const risk = entry - sl;
    const candidates = [entry + risk * 1.5, entry + risk * 2.5, entry + risk * 4.0];
    if (r1 > entry + risk * 2 && r1 < entry + risk * 6) candidates[2] = r1;
    candidates.sort((a, b) => a - b);
    [tp1, tp2, tp3] = candidates;
  } else {
    entry = current;
    sl = Math.min(r1, current + atrVal * 1.5);
    if (sl <= entry) sl = entry + atrVal;
    const risk = sl - entry;
    const candidates = [entry - risk * 1.5, entry - risk * 2.5, entry - risk * 4.0];
    if (s1 < entry - risk * 2 && s1 > entry - risk * 6) candidates[2] = s1;
    candidates.sort((a, b) => b - a);
    [tp1, tp2, tp3] = candidates;
  }

  // Guard: verify TPs are on the correct side of entry
  if (isBull && (tp1 <= entry || tp2 <= entry || tp3 <= entry)) return null;
  if (isBear && (tp1 >= entry || tp2 >= entry || tp3 >= entry)) return null;

  const riskAmt  = Math.abs(entry - sl);
  const rewardAmt = Math.abs(tp2 - entry);
  const rr = riskAmt > 0 ? (rewardAmt / riskAmt).toFixed(1) : "N/A";

  // ── Confidence scoring (starts at 45, not 50 — easier to reach meaningful levels) ──
  let confidence = 45;

  // Primary trend alignment
  if (trend === "BULLISH" && isBull) confidence += 14;
  else if (trend === "BEARISH" && isBear) confidence += 14;
  else if (structureBull && isBull) confidence += 8;
  else if (structureBear && isBear) confidence += 8;

  // MACD: modifier only — no longer a hard blocker
  if (macdData) {
    const macdAligned = isBull ? macdData.bullish : !macdData.bullish;
    if (macdAligned)  confidence += 12;
    else              confidence -= 6; // penalise but don't veto
    if (macdData.cross === (isBull ? "bullish" : "bearish")) confidence += 10;
  }

  // RSI positioning
  if (rsiVal != null) {
    if (isBull && rsiVal >= 50 && rsiVal <= 70)  confidence += 10;
    if (isBull && rsiVal >= 40 && rsiVal < 50)   confidence += 5;
    if (isBull && rsiVal > 70 && rsiVal <= 82)   confidence -= 5;  // overbought but not blocked
    if (isBear && rsiVal <= 50 && rsiVal >= 30)  confidence += 10;
    if (isBear && rsiVal > 50  && rsiVal <= 60)  confidence += 5;
    if (isBear && rsiVal < 30  && rsiVal >= 18)  confidence -= 5;
  }

  // Structure bonus
  if (structure === "BREAKOUT" && isBull) confidence += 8;
  if (structure === "BREAKDOWN" && isBear) confidence += 8;
  if (structure === "TRENDING"  && isBull) confidence += 5;

  return {
    direction,
    entry: rp(entry),
    sl:    rp(sl),
    tp1:   rp(tp1),
    tp2:   rp(tp2),
    tp3:   rp(tp3),
    rr: `1:${rr}`,
    confidence: Math.min(Math.max(Math.round(confidence), 25), 95),
  };
}

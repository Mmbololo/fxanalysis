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

export function generateSignal(instrument, current, trend, rsiVal, macdData, srLevels, atrVal) {
  const { supports, resistances } = srLevels;
  const s1 = supports[0];
  const r1 = resistances[0];

  if (!s1 || !r1 || !atrVal) return null;

  const isBull = trend === "BULLISH";
  const isBear = trend === "BEARISH";

  // RSI confirmation
  const rsiOk = isBull ? rsiVal < 70 : rsiVal > 30;
  const macdOk = macdData ? (isBull ? macdData.bullish : !macdData.bullish) : true;

  if (!rsiOk || !macdOk) return null;

  const direction = isBull ? "BUY" : "SELL";

  let entry, sl, tp1, tp2, tp3;

  if (isBull) {
    entry = current;
    sl = Math.max(s1, current - atrVal * 1.5);
    const risk = entry - sl;
    // Collect candidates: ATR multiples + nearest resistance
    // Sort ascending so tp1 is the closest target above entry
    const candidates = [
      entry + risk * 1.5,
      entry + risk * 2.5,
      entry + risk * 4.0,
    ];
    // Replace 4R with r1 only if r1 is a valid 3rd target (beyond 2R and within 6R)
    if (r1 > entry + risk * 2 && r1 < entry + risk * 6) {
      candidates[2] = r1;
    }
    candidates.sort((a, b) => a - b); // ascending: tp1 closest, tp3 furthest
    [tp1, tp2, tp3] = candidates;
  } else if (isBear) {
    entry = current;
    sl = Math.min(r1, current + atrVal * 1.5);
    const risk = sl - entry;
    // Sort descending so tp1 is the closest target below entry
    const candidates = [
      entry - risk * 1.5,
      entry - risk * 2.5,
      entry - risk * 4.0,
    ];
    // Replace 4R with s1 only if s1 is a valid 3rd target (beyond 2R and within 6R)
    if (s1 < entry - risk * 2 && s1 > entry - risk * 6) {
      candidates[2] = s1;
    }
    candidates.sort((a, b) => b - a); // descending: tp1 closest, tp3 furthest
    [tp1, tp2, tp3] = candidates;
  } else {
    return null;
  }

  const riskAmt = Math.abs(entry - sl);
  const rewardAmt = Math.abs(tp2 - entry);
  const rr = riskAmt > 0 ? (rewardAmt / riskAmt).toFixed(1) : "N/A";

  let confidence = 50;
  if (macdData?.cross === (isBull ? "bullish" : "bearish")) confidence += 15;
  if (rsiVal > 40 && rsiVal < 60) confidence += 5;
  if (isBull && rsiVal > 50) confidence += 10;
  if (isBear && rsiVal < 50) confidence += 10;
  if (trend === direction.replace("BUY", "BULLISH").replace("SELL", "BEARISH")) confidence += 15;

  return {
    direction,
    entry: parseFloat(entry.toFixed(instrument.includes("JPY") ? 3 : instrument.includes("BTC") ? 0 : 4)),
    sl: parseFloat(sl.toFixed(instrument.includes("JPY") ? 3 : instrument.includes("BTC") ? 0 : 4)),
    tp1: parseFloat(tp1.toFixed(instrument.includes("JPY") ? 3 : instrument.includes("BTC") ? 0 : 4)),
    tp2: parseFloat(tp2.toFixed(instrument.includes("JPY") ? 3 : instrument.includes("BTC") ? 0 : 4)),
    tp3: parseFloat(tp3.toFixed(instrument.includes("JPY") ? 3 : instrument.includes("BTC") ? 0 : 4)),
    rr: `1:${rr}`,
    confidence: Math.min(confidence, 95),
  };
}

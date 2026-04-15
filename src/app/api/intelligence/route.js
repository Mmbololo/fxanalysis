import { NextResponse } from "next/server";
import { sma, ema, rsi, macd, bollingerBands, atr, supportResistance, marketStructure, trendDirection, generateSignal } from "@/lib/technicals";

const INSTRUMENTS = {
  XAUUSD: { symbol: "GC=F", label: "XAU/USD", category: "Commodities", pip: 0.01 },
  GBPUSD: { symbol: "GBPUSD=X", label: "GBP/USD", category: "Forex", pip: 0.0001 },
  GBPJPY: { symbol: "GBPJPY=X", label: "GBP/JPY", category: "Forex", pip: 0.01 },
  BTCUSD: { symbol: "BTC-USD", label: "BTC/USD", category: "Crypto", pip: 1 },
  EURUSD: { symbol: "EURUSD=X", label: "EUR/USD", category: "Forex", pip: 0.0001 },
};

async function fetchOHLC(symbol, interval = "1d", range = "200d") {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json.chart?.result?.[0];
    if (!result) return null;
    const timestamps = result.timestamp || [];
    const q = result.indicators?.quote?.[0];
    if (!q) return null;
    const closes = [], highs = [], lows = [], opens = [], volumes = [], dates = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (q.close[i] != null && q.high[i] != null && q.low[i] != null) {
        closes.push(q.close[i]);
        highs.push(q.high[i]);
        lows.push(q.low[i]);
        opens.push(q.open[i]);
        volumes.push(q.volume[i] || 0);
        
        // Format date based on interval
        const dateObj = new Date(timestamps[i] * 1000);
        if (interval.includes("d") || interval.includes("wk") || interval.includes("mo")) {
          dates.push(dateObj.toISOString().split("T")[0]);
        } else {
          // For intraday, use ISO string or a format that lightweight-charts can parse (timestamp)
          dates.push(timestamps[i]); 
        }
      }
    }
    return { closes, highs, lows, opens, volumes, dates, interval };
  } catch { return null; }
}

async function fetchNews(symbol) {
  try {
    const rssUrl = `https://finance.yahoo.com/rss/headline?s=${encodeURIComponent(symbol)}`;
    const res = await fetch(rssUrl, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 600 } });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    return items.slice(0, 5).map(item => {
      const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/))?.[1] || "";
      const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/))?.[1] || "";
      const link = (item.match(/<link>(.*?)<\/link>/))?.[1] || "";
      return { title: title.trim(), pubDate, link };
    }).filter(n => n.title);
  } catch { return []; }
}

function classifyNewsImpact(title) {
  const HIGH = /rate decision|fed|fomc|nfp|cpi|inflation|gdp|recession|central bank|boe|ecb|boj|war|crisis|emergency|geopolitical|sanctions/i;
  const MED = /pmi|retail sales|employment|jobless|trade balance|manufacturing|housing|consumer confidence|earnings|ipo/i;
  if (HIGH.test(title)) return "HIGH";
  if (MED.test(title)) return "MEDIUM";
  return "LOW";
}

function classifyNewsSentiment(title) {
  const BULL = /rise|rally|surge|gain|climb|bullish|strong|beat|exceed|optimism|growth|recover|jump|soar/i;
  const BEAR = /fall|drop|decline|slump|bearish|weak|miss|disappoint|concern|fear|contract|plunge|crash|sink/i;
  if (BULL.test(title)) return "BULLISH";
  if (BEAR.test(title)) return "BEARISH";
  return "NEUTRAL";
}

function getAffectedInstruments(title) {
  const affected = [];
  if (/gold|xau|commodity|safe.haven|inflation/i.test(title)) affected.push("XAUUSD");
  if (/bitcoin|btc|crypto|digital.asset/i.test(title)) affected.push("BTCUSD");
  if (/gbp|pound|sterling|boe|uk|britain/i.test(title)) { affected.push("GBPUSD"); affected.push("GBPJPY"); }
  if (/eur|euro|ecb|eurozone/i.test(title)) affected.push("EURUSD");
  if (/jpy|yen|boj|japan/i.test(title)) affected.push("GBPJPY");
  if (/usd|dollar|fed|fomc|nfp|cpi/i.test(title)) { affected.push("XAUUSD"); affected.push("GBPUSD"); affected.push("EURUSD"); }
  return [...new Set(affected)].slice(0, 4);
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const interval = searchParams.get("interval") || "1d";
    const range = searchParams.get("range") || "200d";

    // Fetch all OHLC data in parallel
    const ohlcData = await Promise.all(
      Object.entries(INSTRUMENTS).map(async ([key, info]) => {
        const data = await fetchOHLC(info.symbol, interval, range);
        return [key, data];
      })
    );

    const results = {};

    for (const [key, data] of ohlcData) {
      if (!data || data.closes.length < 5) {
        results[key] = { error: "Insufficient data" };
        continue;
      }

      const { closes, highs, lows, opens, volumes, dates } = data;
      const current = closes[closes.length - 1];
      const prev = closes[closes.length - 2];
      const change = ((current - prev) / prev) * 100;

      const sma20 = sma(closes, 20);
      const sma50 = sma(closes, Math.min(50, closes.length));
      const sma200 = sma(closes, Math.min(200, closes.length));
      const rsiVal = rsi(closes);
      const macdData = macd(closes);
      const bb = bollingerBands(closes);
      const atrVal = atr(highs, lows, closes);
      const srLevels = supportResistance(highs, lows, closes);
      const structure = marketStructure(closes, highs, lows);
      const trend = trendDirection(closes, sma20, sma50, sma200);
      const signal = generateSignal(key, current, trend, rsiVal, macdData, srLevels, atrVal);

      // Full chart data for AdvancedChart (lightweight-charts format)
      const fullSeries = dates.map((time, i) => ({
        time,
        open: opens[i],
        high: highs[i],
        low: lows[i],
        close: closes[i],
        volume: volumes[i]
      }));

      results[key] = {
        label: INSTRUMENTS[key].label,
        category: INSTRUMENTS[key].category,
        current,
        change,
        trend,
        structure,
        rsi: rsiVal ? parseFloat(rsiVal.toFixed(1)) : null,
        macd: macdData ? {
          bullish: macdData.bullish,
          cross: macdData.cross,
          histogram: parseFloat(macdData.histogram.toFixed(5)),
        } : null,
        sma: {
          sma20: sma20 ? parseFloat(sma20.toFixed(4)) : null,
          sma50: sma50 ? parseFloat(sma50.toFixed(4)) : null,
          sma200: sma200 ? parseFloat(sma200.toFixed(4)) : null,
        },
        bb: bb ? {
          upper: parseFloat(bb.upper.toFixed(4)),
          middle: parseFloat(bb.middle.toFixed(4)),
          lower: parseFloat(bb.lower.toFixed(4)),
        } : null,
        atr: atrVal ? parseFloat(atrVal.toFixed(5)) : null,
        support: srLevels.supports.map(v => parseFloat(v.toFixed(4))),
        resistance: srLevels.resistances.map(v => parseFloat(v.toFixed(4))),
        signal,
        fullSeries,
        chartData: fullSeries.slice(-30), // backward compatibility for mini charts
      };
    }

    // Fetch news for all instruments
    const newsFeeds = await Promise.all([
      fetchNews("EURUSD=X"),
      fetchNews("GC=F"),
      fetchNews("BTC-USD"),
      fetchNews("GBPUSD=X"),
    ]);

    const allNews = [];
    const seen = new Set();
    for (const feed of newsFeeds) {
      for (const item of feed) {
        if (!seen.has(item.title)) {
          seen.add(item.title);
          allNews.push({
            ...item,
            impact: classifyNewsImpact(item.title),
            sentiment: classifyNewsSentiment(item.title),
            affected: getAffectedInstruments(item.title),
          });
        }
      }
    }

    // Sort: HIGH first, then by date
    allNews.sort((a, b) => {
      const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return (order[a.impact] - order[b.impact]) || (new Date(b.pubDate) - new Date(a.pubDate));
    });

    return NextResponse.json({ instruments: results, news: allNews.slice(0, 20), ts: Date.now() });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

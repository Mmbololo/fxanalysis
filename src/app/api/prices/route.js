import { NextResponse } from "next/server";

const SYMBOLS = {
  XAUUSD: "GC=F",
  GBPUSD: "GBPUSD=X",
  GBPJPY: "GBPJPY=X",
  BTCUSD: "BTC-USD",
  EURUSD: "EURUSD=X",
};

// Server-side cache — 15 sec TTL for near-real-time prices
const priceCache = { data: null, ts: 0 };
const PRICE_TTL = 15_000;

export async function GET() {
  if (priceCache.data && Date.now() - priceCache.ts < PRICE_TTL) {
    return NextResponse.json({ data: priceCache.data, ts: priceCache.ts, cached: true });
  }

  try {
    const symbolList = Object.values(SYMBOLS).join(",");
    // v7 quote endpoint — single batched request, returns real-time prices
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbolList)}&fields=regularMarketPrice,regularMarketPreviousClose,regularMarketChangePercent`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Yahoo Finance: ${res.status}`);
    const json = await res.json();
    const quotes = json?.quoteResponse?.result || [];

    // Map back from Yahoo symbol → our instrument key
    const symbolToKey = Object.fromEntries(
      Object.entries(SYMBOLS).map(([k, v]) => [v, k])
    );

    const data = {};
    for (const q of quotes) {
      const key = symbolToKey[q.symbol];
      if (!key) continue;
      data[key] = {
        price: q.regularMarketPrice,
        change: parseFloat((q.regularMarketChangePercent || 0).toFixed(2)),
      };
    }

    priceCache.data = data;
    priceCache.ts = Date.now();
    return NextResponse.json({ data, ts: Date.now() });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}

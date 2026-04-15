import { NextResponse } from "next/server";

const SYMBOLS = {
  XAUUSD: "GC=F",
  GBPUSD: "GBPUSD=X",
  GBPJPY: "GBPJPY=X",
  BTCUSD: "BTC-USD",
};

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "application/json",
};

async function fetchQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`${symbol}: ${res.status}`);
  const json = await res.json();
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error(`${symbol}: no meta`);
  const price = meta.regularMarketPrice;
  const prevClose = meta.previousClose || meta.chartPreviousClose;
  const change = prevClose ? parseFloat((((price - prevClose) / prevClose) * 100).toFixed(2)) : 0;
  return { price, change };
}

export async function GET() {
  try {
    const entries = await Promise.all(
      Object.entries(SYMBOLS).map(async ([key, sym]) => {
        try {
          const quote = await fetchQuote(sym);
          return [key, quote];
        } catch {
          return [key, null];
        }
      })
    );

    const data = Object.fromEntries(entries.filter(([, v]) => v !== null));
    return NextResponse.json({ data, ts: Date.now() });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}

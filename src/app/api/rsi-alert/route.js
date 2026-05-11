import { NextResponse } from "next/server";
import { rsiArray, detectRSIDivergence } from "@/lib/technicals";

const INSTRUMENTS = {
  XAUUSD: { symbol: "GC=F" },
  GBPUSD: { symbol: "GBPUSD=X" },
  GBPJPY: { symbol: "GBPJPY=X" },
  BTCUSD: { symbol: "BTC-USD" },
  EURUSD: { symbol: "EURUSD=X" },
};

async function fetchOHLC(symbol, interval = "1d", range = "1mo") {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json.chart?.result?.[0];
    if (!result) return null;
    
    // We only need closes, highs, lows
    const q = result.indicators?.quote?.[0];
    if (!q || !q.close || !q.high || !q.low) return null;
    
    // Filter out nulls
    const closes = [], highs = [], lows = [];
    for (let i = 0; i < q.close.length; i++) {
        if (q.close[i] != null && q.high[i] != null && q.low[i] != null) {
            closes.push(q.close[i]);
            highs.push(q.high[i]);
            lows.push(q.low[i]);
        }
    }
    return { closes, highs, lows };
  } catch { return null; }
}

export async function GET() {
  try {
    const timeframes = [
      { interval: "15m", range: "5d" },
      { interval: "1h", range: "1mo" },
    ];
    
    const alerts = [];

    // Check across all instruments and requested timeframes
    for (const [key, info] of Object.entries(INSTRUMENTS)) {
        for (const tf of timeframes) {
            const data = await fetchOHLC(info.symbol, tf.interval, tf.range);
            if (!data) continue;
            
            const { closes, highs, lows } = data;
            if (closes.length < 50) continue;

            const rsiVals = rsiArray(closes, 14);
            const divergence = detectRSIDivergence(closes, highs, lows, rsiVals, 30);
            
            if (divergence) {
                alerts.push({
                    instrument: key,
                    timeframe: tf.interval,
                    type: divergence.type,
                    msg: divergence.msg,
                    timestamp: Date.now()
                });
            }
        }
    }

    return NextResponse.json({ alerts }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

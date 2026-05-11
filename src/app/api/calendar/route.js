import { NextResponse } from "next/server";

// 1-hour server-side cache
const cache = { data: null, ts: 0 };
const CACHE_TTL = 60 * 60 * 1000;

// Currencies that affect our tracked instruments
const TRACKED_CURRENCIES = new Set(["USD", "GBP", "EUR", "JPY"]);

// Which instruments are affected by each currency
const CURRENCY_TO_INSTRUMENTS = {
  USD:  ["XAUUSD", "GBPUSD", "EURUSD", "BTCUSD"],
  GBP:  ["GBPUSD", "GBPJPY"],
  EUR:  ["EURUSD"],
  JPY:  ["GBPJPY"],
};

async function fetchWeek(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function normalizeEvent(ev) {
  // ForexFactory fields: title, country, date, impact, forecast, previous, actual
  const currency = (ev.country || "").toUpperCase();
  const impact = (ev.impact || "").toLowerCase();

  if (!TRACKED_CURRENCIES.has(currency)) return null;
  if (impact !== "high") return null;

  // Parse date — FF uses ISO with timezone offset e.g. "2024-01-05T13:30:00-05:00"
  let dateObj;
  try { dateObj = new Date(ev.date); } catch { return null; }
  if (isNaN(dateObj)) return null;

  return {
    id: `${ev.title}_${ev.date}`,
    title: ev.title || "Unknown Event",
    currency,
    date: dateObj.toISOString().split("T")[0],         // YYYY-MM-DD UTC date
    timestamp: dateObj.getTime(),
    time: ev.time || "All Day",
    impact: "HIGH",
    forecast: ev.forecast || null,
    previous: ev.previous || null,
    actual: ev.actual ?? null,
    instruments: CURRENCY_TO_INSTRUMENTS[currency] || [],
  };
}

export async function GET() {
  if (cache.data && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data, {
      headers: { "X-Cache": "HIT", "Cache-Control": "public, max-age=3600" },
    });
  }

  try {
    const [thisWeek, nextWeek] = await Promise.all([
      fetchWeek("https://nfs.faireconomy.media/ff_calendar_thisweek.json"),
      fetchWeek("https://nfs.faireconomy.media/ff_calendar_nextweek.json"),
    ]);

    const raw = [...thisWeek, ...nextWeek];
    const events = raw
      .map(normalizeEvent)
      .filter(Boolean)
      .sort((a, b) => a.timestamp - b.timestamp);

    // Deduplicate by id
    const seen = new Set();
    const unique = events.filter(e => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

    const payload = { events: unique, fetchedAt: new Date().toISOString(), ts: Date.now() };
    cache.data = payload;
    cache.ts = Date.now();

    return NextResponse.json(payload, {
      headers: { "X-Cache": "MISS", "Cache-Control": "public, max-age=3600" },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message, events: [] }, { status: 500 });
  }
}

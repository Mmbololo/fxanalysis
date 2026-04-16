import { NextResponse } from "next/server";

// ── 6-hour server-side cache ─────────────────────────────────────────────────
const cache = { data: null, ts: 0 };
const CACHE_TTL = 6 * 60 * 60 * 1000;

const SODA = "https://publicreporting.cftc.gov/resource";

// Each instrument: which Socrata dataset + search term + report type
const CFG = {
  XAUUSD: { ds: "72hh-3qpy", search: "GOLD", type: "disagg", label: "Gold" },
  GBPUSD: { ds: "yw9f-hn96", search: "BRITISH POUND STERLING", type: "tff", label: "GBP/USD" },
  EURUSD: { ds: "yw9f-hn96", search: "EURO FX", type: "tff", label: "EUR/USD" },
  BTCUSD: { ds: "yw9f-hn96", search: "BITCOIN", type: "tff", label: "BTC/USD" },
  GBPJPY: { ds: "yw9f-hn96", search: "BRITISH POUND STERLING", type: "tff", label: "GBP/JPY" },
};

// JPY config needed for cross-pair derivation
const JPY_CFG = { ds: "yw9f-hn96", search: "JAPANESE YEN", type: "tff" };

async function sodaQuery(ds, search, limit = 2) {
  try {
    const url = `${SODA}/${ds}.json?$where=upper(market_and_exchange_names) like '%25${encodeURIComponent(search.toUpperCase())}%25'&$order=report_date_as_yyyy_mm_dd DESC&$limit=${limit}`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 21600 },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length > 0 ? rows : null;
  } catch {
    return null;
  }
}

function n(val) { return parseFloat(val) || 0; }

function parseDisagg(rows) {
  if (!rows || !rows[0]) return null;
  const r = rows[0];
  const prev = rows[1];

  const prodLong = n(r.prod_merc_positions_long_all);
  const prodShort = n(r.prod_merc_positions_short_all);
  const swapLong = n(r.swap_positions_long_all);
  const swapShort = n(r.swap_positions_short_all);
  const mmLong = n(r.m_money_positions_long_all);
  const mmShort = n(r.m_money_positions_short_all);
  const otherLong = n(r.other_rept_positions_long_all);
  const otherShort = n(r.other_rept_positions_short_all);
  const nrLong = n(r.nonrept_positions_long_all);
  const nrShort = n(r.nonrept_positions_short_all);

  const specNet = (mmLong - mmShort) + (otherLong - otherShort);
  const commNet = (prodLong - prodShort) + (swapLong - swapShort);
  const nrNet = nrLong - nrShort;

  const prevSpecNet = prev
    ? (n(prev.m_money_positions_long_all) - n(prev.m_money_positions_short_all)) +
      (n(prev.other_rept_positions_long_all) - n(prev.other_rept_positions_short_all))
    : null;

  const oi = n(r.open_interest_all);
  const mmNetPct = oi > 0 ? ((mmLong - mmShort) / oi) * 100 : 0;
  const weekChange = prevSpecNet !== null ? specNet - prevSpecNet : null;

  // Score: 0-100 where 50=neutral, >50=bullish, <50=bearish
  // Based on managed money net as % of OI + week direction
  let score = 50 + Math.max(-40, Math.min(40, mmNetPct * 1.2));
  if (weekChange !== null) {
    if (weekChange > 0) score = Math.min(score + 5, 95);
    else if (weekChange < 0) score = Math.max(score - 5, 5);
  }

  return {
    date: r.report_date_as_yyyy_mm_dd?.split("T")[0] || "N/A",
    oi: Math.round(oi),
    groups: {
      managedMoney: { long: Math.round(mmLong), short: Math.round(mmShort), net: Math.round(mmLong - mmShort) },
      producers:    { long: Math.round(prodLong), short: Math.round(prodShort), net: Math.round(prodLong - prodShort) },
      swapDealers:  { long: Math.round(swapLong), short: Math.round(swapShort), net: Math.round(swapLong - swapShort) },
      nonReportable: { long: Math.round(nrLong), short: Math.round(nrShort), net: Math.round(nrNet) },
    },
    specNet: Math.round(specNet),
    commNet: Math.round(commNet),
    nrNet: Math.round(nrNet),
    prevSpecNet: prevSpecNet !== null ? Math.round(prevSpecNet) : null,
    weekChange: weekChange !== null ? Math.round(weekChange) : null,
    mmNetPct: parseFloat(mmNetPct.toFixed(1)),
    score: Math.round(score),
    reportType: "disagg",
  };
}

function parseTFF(rows) {
  if (!rows || !rows[0]) return null;
  const r = rows[0];
  const prev = rows[1];

  const dealerLong = n(r.dealer_positions_long_all);
  const dealerShort = n(r.dealer_positions_short_all);
  const assetLong = n(r.asset_mgr_positions_long_all);
  const assetShort = n(r.asset_mgr_positions_short_all);
  const levLong = n(r.lev_money_positions_long_all);
  const levShort = n(r.lev_money_positions_short_all);
  const otherLong = n(r.other_rept_positions_long_all);
  const otherShort = n(r.other_rept_positions_short_all);
  const nrLong = n(r.nonrept_positions_long_all);
  const nrShort = n(r.nonrept_positions_short_all);

  const assetNet = assetLong - assetShort;
  const levNet = levLong - levShort;
  const dealerNet = dealerLong - dealerShort;
  const specNet = assetNet + levNet;

  const prevSpecNet = prev
    ? (n(prev.asset_mgr_positions_long_all) - n(prev.asset_mgr_positions_short_all)) +
      (n(prev.lev_money_positions_long_all) - n(prev.lev_money_positions_short_all))
    : null;

  const oi = n(r.open_interest_all);
  const specNetPct = oi > 0 ? (specNet / oi) * 100 : 0;
  const weekChange = prevSpecNet !== null ? specNet - prevSpecNet : null;

  // Asset managers = slow money conviction. Their direction weighs more.
  const assetNetPct = oi > 0 ? (assetNet / oi) * 100 : 0;
  let score = 50 + Math.max(-40, Math.min(40, assetNetPct * 1.5 + specNetPct * 0.5));
  if (weekChange !== null) {
    if (weekChange > 2000) score = Math.min(score + 5, 95);
    else if (weekChange < -2000) score = Math.max(score - 5, 5);
  }

  return {
    date: r.report_date_as_yyyy_mm_dd?.split("T")[0] || "N/A",
    oi: Math.round(oi),
    groups: {
      assetManagers: { long: Math.round(assetLong), short: Math.round(assetShort), net: Math.round(assetNet) },
      leveragedFunds: { long: Math.round(levLong), short: Math.round(levShort), net: Math.round(levNet) },
      dealers:       { long: Math.round(dealerLong), short: Math.round(dealerShort), net: Math.round(dealerNet) },
      nonReportable: { long: Math.round(nrLong), short: Math.round(nrShort), net: Math.round(nrLong - nrShort) },
    },
    specNet: Math.round(specNet),
    assetNet: Math.round(assetNet),
    levNet: Math.round(levNet),
    dealerNet: Math.round(dealerNet),
    prevSpecNet: prevSpecNet !== null ? Math.round(prevSpecNet) : null,
    weekChange: weekChange !== null ? Math.round(weekChange) : null,
    specNetPct: parseFloat(specNetPct.toFixed(1)),
    score: Math.round(score),
    reportType: "tff",
  };
}

function deriveCrossCOT(gbpData, jpyData) {
  if (!gbpData || !jpyData) return null;
  // For a cross, when base (GBP) is more bullish than counter (JPY is shorted = bullish cross)
  // gbpScore > 50 = bullish GBP, jpyScore < 50 = JPY bearish = bullish GBPJPY
  // Combined: gbpScore contribution + (100 - jpyScore) contribution averaged
  const gbpBias = gbpData.score;
  const jpyBias = 100 - jpyData.score; // invert: JPY bearish = GBPJPY bullish
  const crossScore = Math.round((gbpBias + jpyBias) / 2);

  return {
    ...gbpData,
    jpyData,
    gbpNet: gbpData.specNet,
    jpyNet: jpyData.specNet,
    score: crossScore,
    isCross: true,
  };
}

function interpretScore(score) {
  if (score >= 70) return { label: "Strongly Bullish", color: "green", short: "BULL" };
  if (score >= 58) return { label: "Bullish", color: "green", short: "BULL" };
  if (score >= 45) return { label: "Neutral", color: "amber", short: "NEUTRAL" };
  if (score >= 32) return { label: "Bearish", color: "red", short: "BEAR" };
  return { label: "Strongly Bearish", color: "red", short: "BEAR" };
}

export async function GET() {
  // Return cached response if fresh
  if (cache.data && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data, {
      headers: { "X-Cache": "HIT", "Cache-Control": "public, max-age=21600" },
    });
  }

  try {
    // Fetch all instruments in parallel (GBP twice: once for GBPUSD/GBPJPY, JPY for GBPJPY)
    const [xauRows, gbpRows, eurRows, btcRows, jpyRows] = await Promise.all([
      sodaQuery(CFG.XAUUSD.ds, CFG.XAUUSD.search),
      sodaQuery(CFG.GBPUSD.ds, CFG.GBPUSD.search),
      sodaQuery(CFG.EURUSD.ds, CFG.EURUSD.search),
      sodaQuery(CFG.BTCUSD.ds, CFG.BTCUSD.search),
      sodaQuery(JPY_CFG.ds, JPY_CFG.search),
    ]);

    const xauData = parseDisagg(xauRows);
    const gbpData = parseTFF(gbpRows);
    const eurData = parseTFF(eurRows);
    const btcData = parseTFF(btcRows);
    const jpyData = parseTFF(jpyRows);
    const gbpjpyData = deriveCrossCOT(gbpData, jpyData);

    const results = {};

    const parsed = { XAUUSD: xauData, GBPUSD: gbpData, EURUSD: eurData, BTCUSD: btcData, GBPJPY: gbpjpyData };

    for (const [key, data] of Object.entries(parsed)) {
      if (!data) {
        results[key] = { error: "No data available", live: false };
        continue;
      }
      results[key] = {
        ...data,
        label: CFG[key].label,
        interpretation: interpretScore(data.score),
        live: true,
      };
    }

    const payload = {
      instruments: results,
      ts: Date.now(),
      fetchedAt: new Date().toISOString(),
      live: true,
    };

    cache.data = payload;
    cache.ts = Date.now();

    return NextResponse.json(payload, {
      headers: { "X-Cache": "MISS", "Cache-Control": "public, max-age=21600" },
    });
  } catch (e) {
    // Return error — dashboard will fall back to static data
    return NextResponse.json({ error: e.message, live: false }, { status: 500 });
  }
}

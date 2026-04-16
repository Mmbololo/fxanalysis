import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Fetch platform intelligence data server-side (uses the 5-min cache in /api/intelligence)
async function getPlatformData() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/intelligence`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function formatInstrumentContext(instrumentKey, intel) {
  if (!intel?.instruments) return "No platform data available.";
  const d = intel.instruments[instrumentKey];
  if (!d || d.error) return `No data available for ${instrumentKey}.`;

  const news = (intel.news || [])
    .filter(n => !n.affected?.length || n.affected.includes(instrumentKey))
    .slice(0, 5);

  const sig = d.signal;
  return `
INSTRUMENT: ${d.label} (${instrumentKey})
CURRENT PRICE: ${d.current} | 24H CHANGE: ${d.change >= 0 ? "+" : ""}${d.change?.toFixed(2)}%
TREND: ${d.trend} | STRUCTURE: ${d.structure}
RSI(14): ${d.rsi} | MACD Cross: ${d.macd?.cross || "none"} | MACD Histogram: ${d.macd?.histogram?.toFixed(4) || "N/A"}
SMA20: ${d.sma?.sma20} | SMA50: ${d.sma?.sma50} | SMA200: ${d.sma?.sma200 || "N/A"}
BB Upper: ${d.bb?.upper} | BB Middle: ${d.bb?.middle} | BB Lower: ${d.bb?.lower}
ATR(14): ${d.atr}
SUPPORT LEVELS: ${d.support?.join(", ") || "N/A"}
RESISTANCE LEVELS: ${d.resistance?.join(", ") || "N/A"}

PLATFORM SIGNAL:
${sig ? `Direction: ${sig.direction} | Entry: ${sig.entry} | Stop Loss: ${sig.sl}
TP1: ${sig.tp1} | TP2: ${sig.tp2} | TP3: ${sig.tp3 || "N/A"}
Risk/Reward: ${sig.rr} | Confidence: ${sig.confidence}%
Reasoning: ${sig.reason || "N/A"}` : "No active signal generated."}

RELEVANT NEWS (platform-classified):
${news.length ? news.map(n => `- [${n.impact}/${n.sentiment}] ${n.title}`).join("\n") : "No relevant news."}
`.trim();
}

function buildSystemPrompt(instrumentKey, intelContext) {
  return `You are the TradingIntel AI — an expert institutional trading analyst embedded in the TradingIntel platform.

IMPORTANT RULES:
- You ONLY use the platform-generated data provided below. Do NOT search external sources, make up prices, or reference data not in this context.
- When you don't have data for something, say so clearly.
- Never guarantee profit. Always note that this is analysis, not financial advice.
- Be concise and analytical. Format trade summaries clearly.

PLATFORM DATA (live, system-generated as of this session):
${intelContext}

YOUR CAPABILITIES:
1. Explain the platform's signals — break down why the system generated a BUY/SELL with the given entry, SL, and TPs.
2. Risk evaluation — assess trade risk using ATR, S/R proximity, RSI, and structure.
3. Scenario analysis — answer "what if price reaches X" based on the levels above.
4. News impact — explain how the classified news items above may affect ${instrumentKey}.
5. Multi-instrument comparison — if asked, you can reference the platform data for other instruments too.

When giving a trade summary, always use this format:
Direction | Entry | SL | TP1 / TP2 / TP3 | R:R | Confidence | Risk Level

End trade summaries with: "Do you want to adjust any levels or wait for additional confirmation?"`;
}

export async function POST(req) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        message: "Gemini API key not configured. Add GEMINI_API_KEY to your .env file."
      });
    }

    const { messages, context } = await req.json();
    const selectedInstrument = context?.selectedInstrument || "XAUUSD";

    // Fetch live platform data server-side — no external queries
    const intel = await getPlatformData();
    const intelContext = formatInstrumentContext(selectedInstrument, intel);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { temperature: 0.3, maxOutputTokens: 600 },
    });

    const systemPrompt = buildSystemPrompt(selectedInstrument, intelContext);

    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: `Understood. I have loaded the live TradingIntel platform data for ${selectedInstrument}. Ready to analyze.` }] },
      ...messages.map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
    ];

    const result = await model.generateContent({ contents });
    const text = result.response.text();
    return NextResponse.json({ message: text });

  } catch (error) {
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      return NextResponse.json({
        message: "Rate limit reached. Please wait 60 seconds before trying again."
      }, { status: 429 });
    }
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}

"use client";
import React from "react";

const T = {
  bg: "#0a0e17",
  border: "#1e2d45",
};

/**
 * Maps system keys to TradingView exchange:symbol strings
 */
const mapSymbol = (symbol) => {
  const mapping = {
    "XAUUSD": "OANDA:XAUUSD",
    "GBPUSD": "FX:GBPUSD",
    "GBPJPY": "FX:GBPJPY",
    "BTCUSD": "BITSTAMP:BTCUSD",
    "EURUSD": "FX:EURUSD",
  };
  return mapping[symbol] || symbol;
};

export const TVChart = ({ symbol = "XAUUSD", height = "700px" }) => {
  const tvSymbol = mapSymbol(symbol);
  const src = `https://s.tradingview.com/widgetembed/?symbol=${tvSymbol}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=${tvSymbol}`;
  
  return (
    <div style={{ width: "100%", height, background: T.bg, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}` }}>
      <iframe 
        src={src} 
        width="100%" 
        height="100%" 
        frameBorder="0" 
        allowFullScreen
        title="TradingView Advanced Chart"
        style={{ border: "none" }}
      />
    </div>
  );
};

export const TVTechnicalAnalysis = ({ symbol = "XAUUSD", height = "450px" }) => {
  const tvSymbol = mapSymbol(symbol);
  // URL encoded config object
  const config = JSON.stringify({
    symbol: tvSymbol,
    showIntervalTabs: true,
    displayMode: "single",
    width: "100%",
    height: "100%",
    colorTheme: "dark"
  });
  const src = `https://www.tradingview-widget.com/embed-widget/technical-analysis/?locale=en#${encodeURIComponent(config)}`;

  return (
    <div style={{ width: "100%", height, background: T.bg, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}` }}>
      <iframe 
        src={src} 
        width="100%" 
        height="100%" 
        frameBorder="0" 
        title="TradingView Technical Analysis"
        style={{ border: "none" }}
      />
    </div>
  );
};

export const TVCalendar = ({ height = "800px" }) => {
  const config = JSON.stringify({
    colorTheme: "dark",
    isTransparent: false,
    width: "100%",
    height: "100%",
    importanceFilter: "-1,0,1"
  });
  const src = `https://www.tradingview-widget.com/embed-widget/events/?locale=en#${encodeURIComponent(config)}`;

  return (
    <div style={{ width: "100%", height, background: T.bg, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}` }}>
      <iframe 
        src={src} 
        width="100%" 
        height="100%" 
        frameBorder="0" 
        title="TradingView Economic Calendar"
        style={{ border: "none" }}
      />
    </div>
  );
};

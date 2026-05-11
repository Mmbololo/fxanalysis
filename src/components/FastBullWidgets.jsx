"use client";
import React from "react";

const T = {
  bg: "#0a0e17",
  border: "#1e2d45",
};

export const FastBullChart = ({ symbol = "XAUUSD", height = "700px" }) => {
  // Use the standard tools subdomain which is more permissive for iframes
  const src = `https://tool.fastbull.com/market?theme=black&lang=en&symbol=${symbol}&ftToken=123abc`;
  
  return (
    <div style={{ width: "100%", height, background: T.bg, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}` }}>
      <iframe 
        src={src} 
        width="100%" 
        height="100%" 
        frameBorder="0" 
        allowFullScreen
        title="FastBull Advanced Chart"
        style={{ border: "none" }}
      />
    </div>
  );
};

export const FastBullCalendar = ({ height = "800px" }) => {
  return (
    <div style={{ width: "100%", height, background: T.bg, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}` }}>
      <iframe 
        src="https://tool.fastbull.com/calendar?theme=black&lang=en&ftToken=123abc" 
        width="100%" 
        height="100%" 
        frameBorder="0" 
        title="FastBull Economic Calendar"
        style={{ border: "none" }}
      />
    </div>
  );
};

export const FastBullPro = ({ height = "958px" }) => {
  return (
    <div style={{ width: "100%", height, background: T.bg, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}` }}>
      <iframe 
        src="https://tool.fastbull.com/pro?theme=black&lang=en&ftToken=123abc#technicalAnalysis" 
        width="100%" 
        height="100%" 
        frameBorder="0" 
        title="FastBull Pro Intelligence"
        style={{ border: "none" }}
      />
    </div>
  );
};

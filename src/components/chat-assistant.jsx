"use client";
import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, X, Send, Zap, Shield, 
  AlertTriangle, Target, ChevronDown, 
  RefreshCw, Bot, User, Maximize2, Minimize2
} from "lucide-react";

const T = {
  purple: "#8b5cf6",
  purpleBg: "rgba(139,92,246,0.1)",
  purpleBd: "rgba(139,92,246,0.25)",
  cyan: "#06b6d4",
  cyanBg: "rgba(6,182,212,0.1)",
  amber: "#f59e0b",
  amberBg: "rgba(245,158,11,0.1)",
  green: "#10b981",
  red: "#ef4444",
  bg: "#0a0e17",
  bg2: "#111827",
  bg3: "#1a2235",
  border: "#1e2d45",
  text: "#e2e8f0",
  textM: "#94a3b8",
  textD: "#64748b",
};

export default function ChatAssistant({ selectedInstrument, intelligenceData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am your institutional trading analyst. How can I help you with your trades today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text = input) => {
    if (!text.trim() || loading) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          context: { selectedInstrument },
        })
      });

      const data = await res.json();
      if (data.message) {
        setMessages([...newMessages, { role: "assistant", content: data.message }]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (err) {
      // If our API returned a friendly message (like the 429 handler), use it.
      // Otherwise, show a generic error.
      const errorMsg = err.message || "I encountered an issue while analyzing the markets. Please try again.";
      setMessages([...newMessages, { role: "assistant", content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: "Analyze " + selectedInstrument, icon: Zap, prompt: "Analyze " + selectedInstrument + " based on current technicals and news." },
    { label: "Is It Safe?", icon: Shield, prompt: "Evaluate the current risk level for " + selectedInstrument + ". Is it safe to enter now?" },
    { label: "Explain Signal", icon: Target, prompt: "Break down the latest signal for " + selectedInstrument + ". What are the technical and fundamental justifications?" },
    { label: "Optimize Setup", icon: RefreshCw, prompt: "Suggest better entry, SL, and TP levels for " + selectedInstrument + " based on market structure." }
  ];

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed", bottom: 24, right: isMinimized ? 24 : 80,
          width: 56, height: 56, borderRadius: 28,
          background: "linear-gradient(135deg, " + T.purple + ", " + T.cyan + ")",
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px rgba(139, 92, 246, 0.4)",
          border: "none", cursor: "pointer", zIndex: 1000,
          transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
        }}
        onMouseOver={e => e.currentTarget.style.transform = "scale(1.1) rotate(5deg)"}
        onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24,
      width: isMinimized ? 320 : 400,
      height: isMinimized ? 48 : 600,
      background: "rgba(17, 24, 39, 0.85)",
      backdropFilter: "blur(16px)",
      borderRadius: 16, border: "1px solid " + T.border,
      display: "flex", flexDirection: "column",
      boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      zIndex: 1000, overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px", background: "rgba(139, 92, 246, 0.1)",
        borderBottom: "1px solid " + T.border,
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 16,
            background: "linear-gradient(135deg, " + T.purple + ", " + T.cyan + ")",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Bot size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Trade Assistant</div>
            <div style={{ fontSize: 10, color: T.green, display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: T.green, animation: "pulse 1.5s infinite" }} />
              Analyst Online
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setIsMinimized(!isMinimized)} style={{ background: "none", border: "none", color: T.textM, cursor: "pointer" }}>
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: T.textM, cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat Body */}
          <div 
            ref={scrollRef}
            className="chat-scrollbar"
            style={{
              flex: 1, overflowY: "auto", padding: 16,
              display: "flex", flexDirection: "column", gap: 16
            }}
          >
            {messages.map((m, i) => (
              <div 
                key={i} 
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  display: "flex", flexDirection: "column",
                  gap: 4
                }}
              >
                <div style={{ 
                  display: "flex", alignItems: "center", gap: 6, 
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  fontSize: 10, color: T.textD, fontWeight: 600, textTransform: "uppercase"
                }}>
                  {m.role === "user" ? <><User size={10} /> You</> : <><Bot size={10} /> Analyst</>}
                </div>
                <div style={{
                  padding: "10px 14px",
                  borderRadius: m.role === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                  background: m.role === "user" ? T.purple : T.bg3,
                  color: T.text, fontSize: 13, lineHeight: 1.5,
                  boxShadow: m.role === "user" ? "0 4px 12px rgba(139, 92, 246, 0.2)" : "none",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere"
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 8, padding: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: T.textD, animation: "bounce 1s infinite", animationDelay: "0s" }} />
                <div style={{ width: 8, height: 8, borderRadius: 4, background: T.textD, animation: "bounce 1s infinite", animationDelay: "0.2s" }} />
                <div style={{ width: 8, height: 8, borderRadius: 4, background: T.textD, animation: "bounce 1s infinite", animationDelay: "0.4s" }} />
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ padding: "0 16px 8px", display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10 }}>
            {quickActions.map((action, i) => (
              <button 
                key={i} 
                onClick={() => handleSend(action.prompt)}
                style={{
                  whiteSpace: "nowrap", flexShrink: 0,
                  padding: "6px 10px", borderRadius: 8,
                  background: T.bg3, border: "1px solid " + T.border,
                  color: T.textM, fontSize: 11, display: "flex", alignItems: "center", gap: 5,
                  cursor: "pointer", transition: "all 0.2s"
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = T.purple;
                  e.currentTarget.style.color = T.text;
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = T.border;
                  e.currentTarget.style.color = T.textM;
                }}
              >
                <action.icon size={12} style={{ color: T.purple }} />
                {action.label}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div style={{ padding: 16, borderTop: "1px solid " + T.border, background: "rgba(0,0,0,0.2)" }}>
            <div style={{
              display: "flex", gap: 8, background: T.bg,
              borderRadius: 10, border: "1px solid " + T.border,
              padding: "4px 4px 4px 12px", alignItems: "center"
            }}>
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === "Enter" && handleSend()}
                placeholder="Ask about signals, risk, or news..."
                style={{
                  flex: 1, background: "none", border: "none",
                  color: T.text, fontSize: 13, outline: "none",
                  padding: "8px 0"
                }}
              />
              <button 
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: input.trim() ? T.purple : T.bg2,
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  border: "none", cursor: input.trim() ? "pointer" : "default",
                  transition: "all 0.2s"
                }}
              >
                {loading ? <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        
        .chat-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .chat-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-scrollbar::-webkit-scrollbar-thumb {
          background: ${T.border};
          border-radius: 10px;
        }
        .chat-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${T.textD};
        }
      `}</style>
    </div>
  );
}

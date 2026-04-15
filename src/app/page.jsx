import Link from "next/link";
import { TrendingUp, Shield, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="landing-container">
      <nav className="navbar">
        <div className="brand">
          <TrendingUp className="icon-accent" size={24} />
          <span>Digipedia Trading Intel</span>
        </div>
        <div className="nav-links">
          <Link href="/login" className="btn-secondary">Login</Link>
          <Link href="/register" className="btn-primary-slim">Register</Link>
        </div>
      </nav>

      <main className="hero">
        <div className="hero-content">
          <h1>Institutional-Grade <br/><span className="text-gradient">Forex Analysis</span></h1>
          <p>COT Data, Options Order Flow, Retail Sentiment, and AI-Driven Insights combined into one robust platform. Stop gambling and start trading with an edge.</p>
          <div className="cta-group">
            <Link href="/register" className="btn-primary-lg">Get Started Now</Link>
            <Link href="/dashboard" className="btn-outline-lg">View Dashboard</Link>
          </div>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <Zap className="icon-accent" size={32} />
            <h3>AI Volatility Tracking</h3>
            <p>Know exactly when markets are shifting with real-time IV and VIX monitoring.</p>
          </div>
          <div className="feature-card">
            <Shield className="icon-accent" size={32} />
            <h3> Institutional Flow</h3>
            <p>See exactly what the smart money is doing through advanced COT and options heatmaps.</p>
          </div>
        </div>
      </main>

      <style>{`
        .landing-container {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
        }
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px clamp(16px, 5vw, 40px);
          border-bottom: 1px solid var(--border);
          background: var(--bg2);
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: clamp(16px, 4vw, 20px);
          letter-spacing: -0.5px;
        }
        .icon-accent { color: var(--accent); }
        .text-gradient {
          background: linear-gradient(135deg, var(--accent), var(--green));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .nav-links {
          display: flex;
          gap: 15px;
          align-items: center;
        }
        .btn-secondary {
          color: var(--text-m);
          font-weight: 600;
          transition: color 0.2s;
        }
        .btn-secondary:hover { color: var(--text); }
        .btn-primary-slim {
          background: var(--accent);
          color: #fff;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
        }
        .hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: clamp(60px, 12vh, 120px) clamp(16px, 5vw, 40px);
        }
        .hero h1 {
          font-size: clamp(32px, 8vw, 56px);
          line-height: 1.1;
          margin-bottom: 24px;
        }
        .hero p {
          font-size: clamp(14px, 4vw, 18px);
          color: var(--text-m);
          max-width: 600px;
          margin: 0 auto 40px;
          line-height: 1.6;
        }
        .cta-group {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 80px;
          flex-wrap: wrap;
        }
        .btn-primary-lg, .btn-outline-lg {
          padding: 14px 28px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 16px;
          min-width: 160px;
        }
        .btn-primary-lg {
          background: linear-gradient(135deg, var(--accent), #7c3aed);
          color: #fff;
        }
        .btn-outline-lg {
          background: transparent;
          color: var(--text);
          border: 1px solid var(--border);
          font-weight: 600;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
          gap: 24px;
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
        }
        @media (max-width: 640px) {
          .nav-links { gap: 10px; }
          .cta-group { flex-direction: column; width: 100%; max-width: 300px; }
          .btn-primary-lg, .btn-outline-lg { width: 100%; }
        }
        .feature-card {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: clamp(20px, 5vw, 32px);
          text-align: left;
        }
        .feature-card h3 {
          margin: 16px 0 8px;
          font-size: 20px;
        }
        .feature-card p {
          color: var(--text-m);
          font-size: 14px;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

"use client";

export default function WalletPage() {
  return (
    <div className="app-shell">
      <div className="top-header">
        <a href="/">← Back</a>
        <div style={{ textAlign: "center", fontWeight: 900 }}>Wallet</div>
        <div />
      </div>
      <div className="home-body">
        <div className="home-content">
          <div className="card">
            <div style={{ fontWeight: 900, marginBottom: 8 }}>ZLon Wallet</div>
            <div className="muted">Recharge and pay from wallet balance.</div>
          </div>
          <div className="card">
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Amazon Pay</div>
            <div className="muted">Integration endpoint placeholder for Amazon Pay linking.</div>
          </div>
          <button className="btn-primary">Recharge ₹500</button>
        </div>
      </div>
    </div>
  );
}

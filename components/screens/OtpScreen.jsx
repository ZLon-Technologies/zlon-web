'use client'

export default function OtpScreen({ phone, onVerify, onBack }) {
  return (
    <div style={{
      height: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: '#fff',
      color: '#000',
      padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '320px', display: 'grid', gap: '16px' }}>

        <button onClick={onBack} style={{ border: 'none', background: 'none' }}>
          ← Back
        </button>

        <h2>Enter OTP</h2>
        <p style={{ opacity: 0.6 }}>{phone}</p>

        <input
          placeholder="------"
          maxLength={6}
          style={{
            height: '56px',
            textAlign: 'center',
            fontSize: '24px',
            letterSpacing: '10px',
            borderRadius: '12px',
            border: '1px solid #ddd'
          }}
        />

        <button
          onClick={onVerify}
          style={{
            height: '52px',
            borderRadius: '14px',
            background: '#000',
            color: '#fff',
            fontWeight: 'bold'
          }}
        >
          Verify
        </button>

      </div>
    </div>
  )
}
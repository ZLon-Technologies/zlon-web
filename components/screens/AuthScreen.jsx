'use client'

export default function AuthScreen({ onContinue, onGoogle }) {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      background: '#ffffff',
      color: '#000'
    }}>

      {/* LOGO */}
      <div style={{
        flex: 1,
        display: 'grid',
        placeItems: 'center'
      }}>
        <h1 style={{ fontSize: '32px' }}>ZLon.</h1>
      </div>

      {/* BOTTOM SHEET */}
      <div style={{
        padding: '24px',
        borderTop: '1px solid #eee',
        display: 'grid',
        gap: '16px'
      }}>
        <input
          placeholder="+91 Enter mobile number"
          style={{
            height: '52px',
            borderRadius: '14px',
            border: '1px solid #ddd',
            padding: '0 16px',
            fontSize: '16px'
          }}
        />

        <button
          onClick={onContinue}
          style={{
            height: '52px',
            borderRadius: '14px',
            background: '#000',
            color: '#fff',
            fontWeight: 'bold'
          }}
        >
          Continue
        </button>

        {/* Divider */}
        <div style={{ textAlign: 'center', opacity: 0.5 }}>or</div>

        <button
          onClick={onGoogle}
          style={{
            height: '48px',
            borderRadius: '14px',
            border: '1px solid #ddd',
            background: '#fff'
          }}
        >
          Continue with Google
        </button>
      </div>
    </div>
  )
}
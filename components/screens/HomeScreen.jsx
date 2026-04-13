'use client'

function ProfileIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 12a4.4 4.4 0 1 0-4.4-4.4A4.4 4.4 0 0 0 12 12Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.5 20.2c0-3.1 3.4-5.6 7.5-5.6s7.5 2.5 7.5 5.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function PinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.8a1 1 0 0 1-1-1v-4.2a1 1 0 0 0-1-1h-.4a1 1 0 0 0-1 1V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  )
}

function HistoryIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4.8 10A7.5 7.5 0 1 1 4.5 12H2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function HomeScreen() {
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#080808',
      color: '#ffffff',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
      WebkitFontSmoothing: 'antialiased',
    }}>

      {/* HEADER */}
      <header style={{
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Profile Avatar */}
        <button style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          cursor: 'pointer',
          flexShrink: 0,
        }} aria-label="Open profile">
          <ProfileIcon style={{ width: 20, height: 20 }} />
        </button>

        {/* Wordmark */}
        <span style={{
          fontSize: '26px',
          fontWeight: 900,
          letterSpacing: '-1.2px',
          color: '#ffffff',
          lineHeight: 1,
        }}>
          ZLon.
        </span>

        {/* Location pill */}
        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '6px 12px',
          color: 'rgba(255,255,255,0.75)',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>
          <PinIcon style={{ width: 13, height: 13 }} />
          <span>Dubai</span>
        </button>
      </header>

      {/* MAIN SECTION */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px 100px',
        gap: '20px',
      }}>

        {/* BIG BOOK NOW BUTTON */}
        <button style={{
          width: '220px',
          height: '220px',
          borderRadius: '40px',
          background: '#ffffff',
          color: '#000000',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 20px 60px rgba(0,0,0,0.7)',
          WebkitTapHighlightColor: 'transparent',
        }}>
          <span style={{
            fontSize: '24px',
            fontWeight: 800,
            letterSpacing: '-0.8px',
            color: '#000000',
            lineHeight: 1,
          }}>
            Book Now
          </span>
          <span style={{
            fontSize: '11px',
            fontWeight: 500,
            color: 'rgba(0,0,0,0.45)',
            textAlign: 'center',
            maxWidth: '150px',
            lineHeight: 1.3,
          }}>
            Tap to find your nearest salon
          </span>
        </button>

        {/* PROMO CARD */}
        <div style={{
          width: '100%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          padding: '20px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#57e6ff',
            }}>
              Offer
            </span>
            <p style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
            }}>
              Premium Grooming
            </p>
            <p style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.4,
              margin: 0,
            }}>
              First visit discount &mdash; up to 20% off your next session.
            </p>
          </div>
          <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>→</span>
        </div>
      </main>

      {/* PILL BOTTOM NAV */}
      <nav style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 20px 24px',
        zIndex: 100,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '50px',
          padding: '6px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '10px 22px',
            borderRadius: '44px',
            border: 'none',
            background: '#ffffff',
            color: '#000000',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            <HomeIcon style={{ width: 18, height: 18 }} />
            <span>Home</span>
          </button>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '10px 22px',
            borderRadius: '44px',
            border: 'none',
            background: 'transparent',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            <HistoryIcon style={{ width: 18, height: 18 }} />
            <span>History</span>
          </button>
        </div>
      </nav>

    </div>
  )
}

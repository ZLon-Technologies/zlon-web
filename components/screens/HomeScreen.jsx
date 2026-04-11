'use client'

export default function HomeScreen() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#050505',
      color: '#fff'
    }}>

      {/* HEADER */}
      <div style={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h2>ZLon.</h2>
      </div>

      {/* CENTER BUTTON */}
      <div style={{
        flex: 1,
        display: 'grid',
        placeItems: 'center'
      }}>
        <button style={{
          width: '240px',
          height: '240px',
          borderRadius: '40px',
          background: '#57e6ff',
          color: '#000',
          fontSize: '22px',
          fontWeight: 'bold',
          border: 'none'
        }}>
          Book Now
        </button>
      </div>

      {/* ADS */}
      <div style={{
        padding: '16px',
        textAlign: 'center',
        opacity: 0.5
      }}>
        here will be the ads
      </div>

      {/* NAV */}
      <div style={{
        height: '70px',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTop: '1px solid #222'
      }}>
        <span>Home</span>
        <span>History</span>
      </div>
    </div>
  )
}
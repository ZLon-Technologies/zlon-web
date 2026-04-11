export default function AppShell({ children }) {
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
        justifyContent: 'center',
        borderBottom: '1px solid #222'
      }}>
        <h2>ZLon.</h2>
      </div>

      {/* MAIN */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {children}
      </div>

      {/* BOTTOM NAV */}
      <div style={{
        height: '70px',
        borderTop: '1px solid #222',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center'
      }}>
        <span>Home</span>
        <span>History</span>
      </div>
    </div>
  )
}
'use client';

import { useEffect } from 'react';

const shellStyle = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: '24px',
  background: 'linear-gradient(180deg, #070708 0%, #050505 46%, #0a0b0f 100%)',
  color: '#f7f7f8',
  fontFamily: '"Avenir Next", "Helvetica Neue", "Segoe UI", sans-serif'
};

const cardStyle = {
  width: 'min(100%, 460px)',
  padding: '24px',
  display: 'grid',
  gap: '14px',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '28px',
  background: 'rgba(12, 12, 15, 0.97)',
  boxShadow: '0 28px 72px rgba(0, 0, 0, 0.52)'
};

const buttonRowStyle = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap'
};

const buttonStyle = {
  minHeight: '48px',
  padding: '0 18px',
  border: 0,
  borderRadius: '16px',
  background: '#57e6ff',
  color: '#050505',
  cursor: 'pointer',
  fontWeight: 800
};

const ghostButtonStyle = {
  ...buttonStyle,
  background: 'transparent',
  color: '#f7f7f8',
  border: '1px solid rgba(255, 255, 255, 0.16)'
};

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <div style={shellStyle}>
          <div style={cardStyle}>
            <p style={{ margin: 0, color: '#57e6ff', fontSize: '12px', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              Global Error
            </p>
            <h1 style={{ margin: 0, fontSize: '32px', lineHeight: 1 }}>The app hit a fatal render error.</h1>
            <p style={{ margin: 0, color: 'rgba(247, 247, 248, 0.72)', lineHeight: 1.6 }}>
              {error?.message || 'Unknown application error.'}
            </p>
            <div style={buttonRowStyle}>
              <button type="button" style={buttonStyle} onClick={() => reset()}>
                Try again
              </button>
              <button type="button" style={ghostButtonStyle} onClick={() => window.location.reload()}>
                Reload page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

'use client';

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an analytics service here
    console.error("ZLon Render Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="zlon-root" style={{ padding: '20px', textAlign: 'center' }}>
          <div className="zlon-auth-card">
            <h2>Something went wrong.</h2>
            <p style={{ color: 'red', margin: '10px 0' }}>{this.state.error?.message}</p>
            <button 
              className="zlon-button zlon-button--primary"
              onClick={() => window.location.reload()}
            >
              Reload ZLon
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
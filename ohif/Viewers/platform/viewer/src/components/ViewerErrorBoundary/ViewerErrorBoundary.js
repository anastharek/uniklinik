import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { saveLastError, saveSession, getLastSession, STORAGE } from '../../utils/crashRecovery';
import './ViewerErrorBoundary.css';

/**
 * ViewerErrorBoundary wraps the main viewer (Viewer.js).
 * On render error, shows fallback UI with reload + session restore.
 */
class ViewerErrorBoundary extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    onSaveSession: PropTypes.func, // external session snapshot callback
    onRecoverSession: PropTypes.func, // external session restore callback
  };

  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Save error details
    saveLastError(error.message || String(error));

    // Save current session snapshot if available
    if (this.props.onSaveSession) {
      try {
        const snapshot = this.props.onSaveSession();
        if (snapshot) {
          saveSession(snapshot);
        }
      } catch (e) {
        // ignore
      }
    }

    console.error('[OHIF] ViewerErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    // Reload without crash detection
    try {
      sessionStorage.removeItem(STORAGE.CRASH_DETECTED);
      // Also clean old keys for backward compat
      localStorage.removeItem('ohif_recovery_mode');
    } catch (e) { /* ignore */ }
    window.location.reload();
  };

  handleReloadWithRecovery = () => {
    // Save current state and reload with crash detection
    if (this.props.onSaveSession) {
      try {
        const snapshot = this.props.onSaveSession();
        if (snapshot) {
          saveSession(snapshot);
        }
      } catch (e) { /* ignore */ }
    }
    try {
      sessionStorage.setItem(STORAGE.CRASH_DETECTED, 'true');
    } catch (e) { /* ignore */ }
    window.location.reload();
  };

  handleClearAndReload = () => {
    try {
      localStorage.removeItem(STORAGE.LAST_SESSION);
      localStorage.removeItem(STORAGE.LAST_ERROR);
      localStorage.removeItem(STORAGE.LAST_PROMISE_ERROR);
      localStorage.removeItem(STORAGE.HEARTBEAT);
      // Backward compat
      localStorage.removeItem('ohif_recovery_mode');
      localStorage.removeItem('ohif_large_study');
      sessionStorage.removeItem(STORAGE.CRASH_DETECTED);
    } catch (e) { /* ignore */ }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error
        ? this.state.error.message || String(this.state.error)
        : 'Unknown error';

      return (
        <div className="viewer-error-boundary">
          <div className="veb-card">
            <div className="veb-icon">⚠</div>
            <h2 className="veb-title">Viewer Error</h2>
            <p className="veb-message">
              The viewer encountered an unexpected error. Your session has been
              saved for recovery.
            </p>
            <div className="veb-error-details">
              <code>{errorMsg}</code>
            </div>
            <div className="veb-actions">
              <button
                className="veb-btn veb-btn-primary"
                onClick={this.handleReloadWithRecovery}
              >
                Reload & Recover Session
              </button>
              <button
                className="veb-btn veb-btn-secondary"
                onClick={this.handleReload}
              >
                Reload Viewer
              </button>
              <button
                className="veb-btn veb-btn-danger"
                onClick={this.handleClearAndReload}
              >
                Clear Data & Reload
              </button>
            </div>
            {this.state.errorInfo && (
              <details className="veb-stack">
                <summary>Stack Trace</summary>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ViewerErrorBoundary;

import { Component } from 'react';
import { Link } from 'react-router-dom';

/**
 * Catches render errors in the routed page so a single broken component
 * shows a recoverable message instead of blanking the whole app.
 * Keyed by pathname in App.jsx, so navigating to another page resets it.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep the real error visible in the console for debugging.
    console.error('Page crashed:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="container-page grid min-h-[70vh] place-items-center pt-24 text-center">
        <div>
          <p className="text-lg font-semibold">Something went wrong on this page</p>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-white/40">
            The rest of Priva is fine — jump back home or reload and try again.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link to="/" className="btn-primary">
              Go home
            </Link>
            <button onClick={() => window.location.reload()} className="btn-ghost">
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

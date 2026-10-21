import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center lg:pl-[108px]">
          <p className="text-[12px] font-bold uppercase tracking-widest text-blue-400">
            Something went sideways
          </p>
          <h1 className="mt-2 font-display text-[28px] font-extrabold text-white">
            Could not load this view
          </h1>
          <p className="mt-2 max-w-md text-[14px] text-[#8f98b2]">
            {this.state.error?.message || 'An unexpected error occurred while rendering.'}
          </p>
          <Link
            to="/home"
            onClick={() => this.setState({ error: null })}
            className="btn-priva-blue mt-6 rounded-xl px-6 py-3 text-[14px] font-bold text-white"
          >
            Back to Home
          </Link>
        </div>
      );
    }
    return this.props.children;
  }
}

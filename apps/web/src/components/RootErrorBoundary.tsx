import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Dr. Plant render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f7f6f2] px-6 text-center">
          <h1 className="text-xl font-semibold text-emerald-900">Something went wrong</h1>
          <p className="max-w-md text-sm text-gray-600">{this.state.error.message}</p>
          <button
            type="button"
            className="rounded-full bg-emerald-800 px-5 py-2 text-sm font-medium text-white"
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
          >
            Clear session and reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

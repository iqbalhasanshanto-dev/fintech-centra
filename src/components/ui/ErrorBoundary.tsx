import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Centra Global Uncaught Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.removeItem('centra_db_auth_token_v2');
      localStorage.removeItem('centra_is_guest_v2');
    } catch {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#FAFAFA] dark:bg-[#0A0E1A] text-gray-900 dark:text-white transition-colors">
          <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-[#0D1220] border border-gray-200 dark:border-[#1e263c] shadow-2xl text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-md">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight mb-2 font-display">
              Something went wrong
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Centra encountered an unexpected error. Your local data has been left untouched. Try reloading.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3.5 rounded-2xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5 text-left overflow-auto max-h-32 text-[11px] font-mono text-rose-600 dark:text-rose-400">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload App</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-[#232c44] text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Go to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

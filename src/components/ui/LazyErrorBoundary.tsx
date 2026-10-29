import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { logger } from '../../utils/logger';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class LazyErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.warn('Lazy chunk load failed:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          data-testid="lazy-error-boundary"
          className="flex flex-col items-center justify-center p-8 text-center min-h-[320px] w-full bg-white dark:bg-[#1D1D1D] rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] shadow-xs my-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
            {this.props.fallbackTitle || 'Failed to load content'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mb-4">
            A network glitch prevented this screen from loading. Tap below to retry.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#C6FF3D] hover:bg-[#B2E830] active:bg-[#9ECC27] text-[#0A0E1A] text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ScreenLoadingFallback: React.FC = () => (
  <div
    data-testid="screen-loading-fallback"
    className="flex flex-col items-center justify-center min-h-[320px] w-full py-12"
  >
    <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mb-3" />
    <span className="text-xs text-gray-400 font-medium tracking-wide">Loading...</span>
  </div>
);

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LazyErrorBoundary } from '../components/ui/LazyErrorBoundary';

// Mock component that fails on first attempt and succeeds on second
let shouldFail = true;
const FlakyComponent: React.FC = () => {
  if (shouldFail) {
    throw new Error('Failed to fetch dynamically imported module');
  }
  return <div data-testid="flaky-content">Dynamically loaded content successfully!</div>;
};

describe('Code Splitting Retry Boundary (Task 8)', () => {
  beforeEach(() => {
    shouldFail = true;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('displays user-friendly error UI with Retry button when dynamic import fails', () => {
    render(
      <LazyErrorBoundary fallbackTitle="Failed to load screen">
        <FlakyComponent />
      </LazyErrorBoundary>
    );

    expect(screen.getByTestId('lazy-error-boundary')).toBeInTheDocument();
    expect(screen.getByText('Failed to load screen')).toBeInTheDocument();
    expect(screen.getByText(/A network glitch prevented this screen from loading/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    expect(screen.queryByTestId('flaky-content')).not.toBeInTheDocument();
  });

  it('re-attempts dynamic render and succeeds when Retry is clicked', () => {
    const onRetry = vi.fn();

    render(
      <LazyErrorBoundary fallbackTitle="Failed to load screen" onRetry={onRetry}>
        <FlakyComponent />
      </LazyErrorBoundary>
    );

    // Initial attempt failed
    expect(screen.getByTestId('lazy-error-boundary')).toBeInTheDocument();
    expect(screen.queryByTestId('flaky-content')).not.toBeInTheDocument();

    // Recover network connection
    shouldFail = false;

    // Click Retry
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);

    // Second render attempt succeeds
    expect(screen.queryByTestId('lazy-error-boundary')).not.toBeInTheDocument();
    expect(screen.getByTestId('flaky-content')).toBeInTheDocument();
    expect(screen.getByText('Dynamically loaded content successfully!')).toBeInTheDocument();
  });
});

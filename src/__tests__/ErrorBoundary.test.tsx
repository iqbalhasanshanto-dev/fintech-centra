import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test explosion');
};

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>All good</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('renders fallback UI when an error is caught and displays updated copy', () => {
    // Suppress console.error during expected error boundary test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText(/Your local data has been left untouched\. Try reloading\./i)
    ).toBeInTheDocument();
    expect(screen.getByText('Test explosion')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});

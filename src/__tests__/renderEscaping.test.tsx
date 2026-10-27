import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { sanitizeText } from '../utils/sanitize';

describe('React Output Escaping Verification', () => {
  it('renders a transaction note containing <script> as literal text and creates NO script element', () => {
    const rawNote = '<script>alert(1)</script>';
    const sanitizedNote = sanitizeText(rawNote);

    // Render note in standard React paragraph element matching TransactionDetailModal
    const { container } = render(
      <div data-testid="note-container">
        <p className="note-text">{sanitizedNote}</p>
      </div>
    );

    // 1. Must be rendered as literal text in the DOM
    const noteEl = screen.getByText('<script>alert(1)</script>');
    expect(noteEl).toBeInTheDocument();
    expect(noteEl.textContent).toBe('<script>alert(1)</script>');

    // 2. Must NOT create any <script> DOM element
    expect(container.querySelector('script')).toBeNull();
    expect(document.querySelector('script[src]')).toBeNull();
  });

  it('renders a transaction note containing <img onerror> as literal text and creates NO img element', () => {
    const rawNote = '<img src=x onerror=alert(1)>';
    const sanitizedNote = sanitizeText(rawNote);

    const { container } = render(
      <div data-testid="note-container">
        <p className="note-text">{sanitizedNote}</p>
      </div>
    );

    // 1. Must be rendered as literal text
    const noteEl = screen.getByText('<img src=x onerror=alert(1)>');
    expect(noteEl).toBeInTheDocument();
    expect(noteEl.textContent).toBe('<img src=x onerror=alert(1)>');

    // 2. Must NOT create an <img> element or fire onerror handler
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders notes with complex characters (<, >, &, ", \', *) as literal text nodes', () => {
    const note = 'Balance < $100 and > $50 & "special" *';
    const sanitized = sanitizeText(note);

    const { container } = render(<span data-testid="complex-note">{sanitized}</span>);
    const span = screen.getByTestId('complex-note');

    expect(span.textContent).toBe('Balance < $100 and > $50 & "special" *');
    expect(container.children.length).toBe(1);
    expect(container.firstChild?.childNodes.length).toBe(1);
    expect(container.firstChild?.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
  });
});

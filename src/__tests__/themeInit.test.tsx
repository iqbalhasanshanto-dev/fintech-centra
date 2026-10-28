import fs from 'fs';
import path from 'path';
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

const themeInitScript = fs.readFileSync(
  path.resolve(__dirname, '../../public/theme-init.js'),
  'utf-8'
);

function runThemeInitScript() {
  const fn = new Function(themeInitScript);
  fn();
}

describe('Theme Init Script (public/theme-init.js) - Phase 7 Task 7', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.style.colorScheme = '';
  });

  it('adds dark class and dark color-scheme when centra_theme_hint is dark', () => {
    localStorage.setItem('centra_theme_hint', 'dark');
    runThemeInitScript();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('removes dark class and sets light color-scheme when centra_theme_hint is light', () => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('centra_theme_hint', 'light');
    runThemeInitScript();

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('defaults to light theme when no hint is present in localStorage', () => {
    document.documentElement.classList.add('dark');
    localStorage.removeItem('centra_theme_hint');
    runThemeInitScript();

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('never throws even if localStorage access throws an error', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: localStorage is blocked');
    });

    expect(() => runThemeInitScript()).not.toThrow();

    getItemSpy.mockRestore();
  });
});

describe('ThemeContext Runtime Hint & Meta Synchronization', () => {
  let metaTags: HTMLMetaElement[] = [];

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.head.querySelectorAll('meta[name="theme-color"]').forEach(el => el.remove());

    const metaLight = document.createElement('meta');
    metaLight.name = 'theme-color';
    metaLight.setAttribute('media', '(prefers-color-scheme: light)');
    metaLight.content = '#F7F8FA';
    document.head.appendChild(metaLight);

    const metaDark = document.createElement('meta');
    metaDark.name = 'theme-color';
    metaDark.setAttribute('media', '(prefers-color-scheme: dark)');
    metaDark.content = '#000000';
    document.head.appendChild(metaDark);

    metaTags = [metaLight, metaDark];
  });

  it('writes theme hint to localStorage and updates theme-color meta at runtime', () => {
    let capturedTheme!: ReturnType<typeof useTheme>;

    const TestComponent = () => {
      capturedTheme = useTheme();
      return <div>Theme Test</div>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Initial theme is light
    expect(localStorage.getItem('centra_theme_hint')).toBe('light');
    metaTags.forEach(meta => {
      expect(meta.getAttribute('content')).toBe('#F7F8FA');
    });

    // Switch to dark
    act(() => {
      capturedTheme.setTheme('dark');
    });

    expect(localStorage.getItem('centra_theme_hint')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    metaTags.forEach(meta => {
      expect(meta.getAttribute('content')).toBe('#000000');
    });

    // Switch back to light
    act(() => {
      capturedTheme.setTheme('light');
    });

    expect(localStorage.getItem('centra_theme_hint')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    metaTags.forEach(meta => {
      expect(meta.getAttribute('content')).toBe('#F7F8FA');
    });
  });
});

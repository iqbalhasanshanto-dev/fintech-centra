import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

describe('Honest Security Copy & Data Protection - Phase 7 Task 9', () => {
  it('ensures secureStorage.ts has been deleted', () => {
    const secureStoragePath = path.resolve(__dirname, '../utils/secureStorage.ts');
    expect(fs.existsSync(secureStoragePath)).toBe(false);
  });

  it('verifies IntroScreen.tsx has no false Encrypted claims and uses Secure sync', () => {
    const introPath = path.resolve(__dirname, '../components/onboarding/IntroScreen.tsx');
    const content = fs.readFileSync(introPath, 'utf-8');
    expect(content).not.toContain('> Encrypted');
    expect(content).toContain('> Secure sync');
  });

  it('verifies SettingsScreen.tsx has no false encryption claims', () => {
    const settingsPath = path.resolve(__dirname, '../components/settings/SettingsScreen.tsx');
    const content = fs.readFileSync(settingsPath, 'utf-8');
    expect(content.toLowerCase()).not.toContain('encrypted cloud backup');
    expect(content.toLowerCase()).not.toContain('encrypted local database');
  });

  it('verifies no source code files in src contain false encryption claims', () => {
    const srcDir = path.resolve(__dirname, '..');
    
    function scanDir(dir: string): string[] {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const found: string[] = [];
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== '__tests__' && entry.name !== 'node_modules') {
            found.push(...scanDir(fullPath));
          }
        } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
          const fileContent = fs.readFileSync(fullPath, 'utf-8');
          if (/encrypt/i.test(fileContent)) {
            found.push(fullPath);
          }
        }
      }
      return found;
    }

    const matches = scanDir(srcDir);
    expect(matches).toEqual([]);
  });
});

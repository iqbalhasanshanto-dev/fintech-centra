import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { CentraDB, getUserStorageKey } from '../db/storage';
import { OnboardingFlow, getOnboardingDraftKey } from '../components/onboarding/OnboardingFlow';
import { FinanceProvider, useFinance } from '../context/FinanceContext';

const mockCompleteOnboarding = vi.fn();
const mockLogout = vi.fn();

let mockCurrentUser = {
  id: 'test_user_onboarding',
  name: '',
  email: 'test@example.com',
  isPro: false,
  onboardingCompleted: false,
  createdAt: '2026-01-01T00:00:00Z',
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockCurrentUser,
    isAuthenticated: true,
    isGuest: false,
    authView: 'onboarding',
    logout: mockLogout,
    completeOnboarding: mockCompleteOnboarding,
    setAuthView: vi.fn(),
    saveOnboardingProfile: vi.fn(),
  }),
}));

describe('1. Android Icons Verification', () => {
  function inspectPng(filePath: string) {
    const buf = fs.readFileSync(filePath);
    let pos = 8;
    let width = 0, height = 0;
    const idatChunks: Buffer[] = [];
    while (pos < buf.length) {
      const len = buf.readUInt32BE(pos);
      const type = buf.toString('ascii', pos + 4, pos + 8);
      if (type === 'IHDR') {
        width = buf.readUInt32BE(pos + 8);
        height = buf.readUInt32BE(pos + 12);
      } else if (type === 'IDAT') {
        idatChunks.push(buf.slice(pos + 8, pos + 8 + len));
      }
      pos += 12 + len;
    }
    const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
    let transparent = 0;
    let pureBlack = 0;
    let other = 0;

    for (let y = 0; y < height; y++) {
      const rowOffset = y * (width * 4 + 1) + 1;
      for (let x = 0; x < width; x++) {
        const idx = rowOffset + x * 4;
        const r = decompressed[idx];
        const g = decompressed[idx + 1];
        const b = decompressed[idx + 2];
        const a = decompressed[idx + 3];
        if (a === 0) transparent++;
        else if (r === 0 && g === 0 && b === 0 && a === 255) pureBlack++;
        else other++;
      }
    }
    return { width, height, transparent, pureBlack, other };
  }

  const densities = [
    { name: 'mdpi', size: 48, fgSize: 108 },
    { name: 'hdpi', size: 72, fgSize: 162 },
    { name: 'xhdpi', size: 96, fgSize: 216 },
    { name: 'xxhdpi', size: 144, fgSize: 324 },
    { name: 'xxxhdpi', size: 192, fgSize: 432 }
  ];

  for (const d of densities) {
    it(`mipmap-${d.name}: ic_launcher.png and ic_launcher_round.png have solid #000000 black background`, () => {
      const launcherPath = path.resolve(__dirname, `../../android/app/src/main/res/mipmap-${d.name}/ic_launcher.png`);
      const roundPath = path.resolve(__dirname, `../../android/app/src/main/res/mipmap-${d.name}/ic_launcher_round.png`);

      const launcherInfo = inspectPng(launcherPath);
      const roundInfo = inspectPng(roundPath);

      expect(launcherInfo.width).toBe(d.size);
      expect(launcherInfo.height).toBe(d.size);
      // No transparent pixels on standard launcher icons
      expect(launcherInfo.transparent).toBe(0);
      expect(launcherInfo.pureBlack).toBeGreaterThan(0);

      expect(roundInfo.width).toBe(d.size);
      expect(roundInfo.height).toBe(d.size);
      expect(roundInfo.transparent).toBe(0);
      expect(roundInfo.pureBlack).toBeGreaterThan(0);
    });

    it(`mipmap-${d.name}: ic_launcher_foreground.png has transparent background without baked opaque white`, () => {
      const fgPath = path.resolve(__dirname, `../../android/app/src/main/res/mipmap-${d.name}/ic_launcher_foreground.png`);
      const fgInfo = inspectPng(fgPath);

      expect(fgInfo.width).toBe(d.fgSize);
      expect(fgInfo.height).toBe(d.fgSize);
      // Foreground must have a transparent background so background drawable #000000 shows through
      expect(fgInfo.transparent).toBeGreaterThan((d.fgSize * d.fgSize) * 0.7);
    });
  }
});

describe('2. Month-End Balance Carryover (FinanceContext)', () => {
  const Consumer: React.FC = () => {
    const { periodIncome, periodExpenses } = useFinance();
    return (
      <div>
        <div data-testid="period-income">{periodIncome}</div>
        <div data-testid="period-expenses">{periodExpenses}</div>
        <div data-testid="net-balance">{periodIncome - periodExpenses}</div>
      </div>
    );
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('carries over leftover balance from prior transactions into periodIncome when periodFilter !== "all"', async () => {
    const testUserId = 'test_carryover_user';
    CentraDB.setActiveUser(testUserId);

    // Prior month: Income ৳1000, Expenses ৳750 -> Net leftover ৳250
    // Current month: Expenses ৳50 -> Total income ৳250, Total expenses ৳50, Balance ৳200
    const now = new Date();
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 5).toISOString();
    const priorMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString();

    const transactions = [
      {
        id: 'tx_prior_inc',
        type: 'income' as const,
        amount: 1000,
        currency: 'USD' as const,
        categoryId: 'cat_1',
        categoryName: 'Income',
        categoryIcon: 'DollarSign',
        categoryColor: '#10B981',
        accountId: 'acc_1',
        accountName: 'Main',
        date: priorMonthDate,
      },
      {
        id: 'tx_prior_exp',
        type: 'expense' as const,
        amount: 750,
        currency: 'USD' as const,
        categoryId: 'cat_2',
        categoryName: 'Bills',
        categoryIcon: 'FileText',
        categoryColor: '#EF4444',
        accountId: 'acc_1',
        accountName: 'Main',
        date: priorMonthDate,
      },
      {
        id: 'tx_curr_exp',
        type: 'expense' as const,
        amount: 50,
        currency: 'USD' as const,
        categoryId: 'cat_2',
        categoryName: 'Food',
        categoryIcon: 'ShoppingBag',
        categoryColor: '#F59E0B',
        accountId: 'acc_1',
        accountName: 'Main',
        date: currentMonthDate,
      },
    ];

    await CentraDB.saveTransactions(transactions);

    render(
      <FinanceProvider>
        <Consumer />
      </FinanceProvider>
    );

    // Current period income includes prior net leftover: 0 + 250 = 250
    expect(screen.getByTestId('period-income').textContent).toBe('250');
    // Current period expenses: 50
    expect(screen.getByTestId('period-expenses').textContent).toBe('50');
    // Net: 250 - 50 = 200
    expect(screen.getByTestId('net-balance').textContent).toBe('200');
  });
});

describe('3. Onboarding Gating & Draft Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('createBlankUserData does NOT set last_synced_at, and hasCachedData returns false for onboardingCompleted: false', async () => {
    const uid = 'user_new_signup';
    await CentraDB.createBlankUserData(uid, 'new@test.com', 'New User');

    const lastSynced = localStorage.getItem(getUserStorageKey(uid, 'last_synced_at'));
    expect(lastSynced).toBeNull();

    // hasCachedData must return false so cold-start or app-switch does not bypass onboarding
    expect(CentraDB.hasCachedData(uid)).toBe(false);
  });

  it('saves in-progress draft to localStorage and restores it upon re-mount', () => {
    const draftKey = getOnboardingDraftKey(mockCurrentUser.id);

    // Initial render
    const { unmount } = render(<OnboardingFlow />);

    // Type name in full name input
    const nameInput = screen.getByPlaceholderText(/full name/i);
    fireEvent.change(nameInput, { target: { value: 'Alex Mercer' } });

    // Check localStorage was updated with the in-progress draft
    const savedDraft = JSON.parse(localStorage.getItem(draftKey)!);
    expect(savedDraft).toBeDefined();
    expect(savedDraft.fullName).toBe('Alex Mercer');

    // Simulate minimizing or unmounting and reopening the screen
    unmount();

    // Re-mount
    render(<OnboardingFlow />);

    // Input must be pre-populated from localStorage draft
    const restoredNameInput = screen.getByPlaceholderText(/full name/i) as HTMLInputElement;
    expect(restoredNameInput.value).toBe('Alex Mercer');
  });

  it('clears draft when onboarding completes', async () => {
    const draftKey = getOnboardingDraftKey(mockCurrentUser.id);
    localStorage.setItem(draftKey, JSON.stringify({ step: 'categories', fullName: 'Alex Mercer' }));

    render(<OnboardingFlow />);

    // In categories step, click finish
    // Select a category
    const catBtn = screen.getByRole('button', { name: /Groceries/i });
    fireEvent.click(catBtn);

    const finishBtn = screen.getByRole('button', { name: /Finish Setup/i });
    fireEvent.click(finishBtn);

    await vi.waitFor(() => {
      expect(mockCompleteOnboarding).toHaveBeenCalled();
      expect(localStorage.getItem(draftKey)).toBeNull();
    });
  });
});

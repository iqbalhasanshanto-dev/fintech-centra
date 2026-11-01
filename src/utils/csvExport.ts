import { Account, Budget, Category, Goal, GoalHistoryEntry, Transaction, UserProfile } from '../types';
import { isNative } from './platform';

/**
 * Escapes a cell value for standard CSV compatibility and neutralizes CSV formula injection.
 * Formula triggers (=, +, -, @, \t, \r) are neutralized by prefixing with a single quote.
 */
export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export interface ExportResult {
  success: boolean;
  savedToDownloads: boolean;
  filename: string;
}

/**
 * Cross-platform file saver.
 * 1. Native Android bridge: saves to MediaStore / Downloads folder and fires a system notification.
 * 2. Mobile Web Share: shares file/text if supported.
 * 3. Browser Blob download: triggers standard browser download.
 */
export async function downloadOrShareCSV(csvContent: string, filename: string): Promise<boolean> {
  const res = await saveCsvFile(csvContent, filename);
  return res.success;
}

export async function saveCsvFile(csvContent: string, filename: string): Promise<ExportResult> {
  const trimmed = csvContent.trim();
  if (!trimmed || trimmed.split('\n').length <= 1) {
    return { success: false, savedToDownloads: false, filename };
  }

  const contentWithBom = csvContent.startsWith('\uFEFF') ? csvContent : '\uFEFF' + csvContent;

  // 1. Android Native Bridge: Write to Downloads folder + show status bar notification
  if (typeof (window as unknown as { CentraAndroid?: { saveFileToDownloads: (f: string, m: string, c: string) => boolean } }).CentraAndroid?.saveFileToDownloads === 'function') {
    try {
      const saved = (window as unknown as { CentraAndroid: { saveFileToDownloads: (f: string, m: string, c: string) => boolean } }).CentraAndroid.saveFileToDownloads(
        filename,
        'text/csv',
        contentWithBom
      );
      if (saved) {
        return { success: true, savedToDownloads: true, filename };
      }
    } catch (bridgeErr) {
      console.warn('CentraAndroid.saveFileToDownloads failed, falling back to web download:', bridgeErr);
    }
  }

  // 2. Try Web Share API with File (modern mobile WebViews and browsers)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    if (typeof File !== 'undefined') {
      try {
        const file = new File([contentWithBom], filename, { type: 'text/csv;charset=utf-8;' });
        await navigator.share({
          files: [file],
          title: filename,
          text: 'Centra export',
        });
        return { success: true, savedToDownloads: false, filename };
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return { success: true, savedToDownloads: false, filename };
        }
      }
    }

    if (isNative()) {
      try {
        await navigator.share({
          title: filename,
          text: contentWithBom,
        });
        return { success: true, savedToDownloads: false, filename };
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return { success: true, savedToDownloads: false, filename };
        }
      }
    }
  }

  // 3. Native fallback: Data URI download trigger
  if (isNative() && typeof document !== 'undefined') {
    try {
      const octetUri = 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(contentWithBom);
      const link = document.createElement('a');
      link.href = octetUri;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 200);
      return { success: true, savedToDownloads: false, filename };
    } catch {
      // Proceed to standard blob download
    }
  }

  // 4. Standard Browser Blob ObjectURL download
  if (typeof document !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
    try {
      const blob = new Blob([contentWithBom], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 200);
      return { success: true, savedToDownloads: false, filename };
    } catch {
      // Proceed to data URI fallback
    }

    try {
      const encodedUri = 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(contentWithBom);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', filename);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 200);
      return { success: true, savedToDownloads: false, filename };
    } catch (fallbackErr) {
      console.error('CSV export failed:', fallbackErr);
      return { success: false, savedToDownloads: false, filename };
    }
  }

  return { success: false, savedToDownloads: false, filename };
}

/**
 * Exports transaction history to CSV for Recent Activities (TransactionDrawer).
 * Generates centra_transactions_YYYY-MM-DD.csv.
 */
export async function exportTransactionsToCSV(
  transactions: Transaction[] = [],
  categories: Category[] = [],
  accounts: Account[] = []
): Promise<ExportResult> {
  const categoryMap = new Map<string, string>();
  categories.forEach(c => categoryMap.set(c.id, c.name));

  const accountMap = new Map<string, string>();
  accounts.forEach(a => accountMap.set(a.id, a.name));

  const headers = [
    'Transaction ID',
    'Date',
    'Type',
    'Merchant / Payee',
    'Category',
    'Account',
    'Amount',
    'Currency',
    'Note',
    'Tags',
    'Is Pinned',
  ];

  const rows = transactions.map(t => [
    escapeCsvField(t.id),
    escapeCsvField(t.date),
    escapeCsvField(t.type),
    escapeCsvField(t.merchant || ''),
    escapeCsvField(t.categoryName || categoryMap.get(t.categoryId) || 'Uncategorized'),
    escapeCsvField(t.accountName || accountMap.get(t.accountId) || 'Account'),
    escapeCsvField(t.amount),
    escapeCsvField(t.currency),
    escapeCsvField(t.note || ''),
    escapeCsvField((t.tags || []).join('; ')),
    escapeCsvField(t.isPinned ? 'Yes' : 'No'),
  ]);

  const csvContent = [
    headers.map(escapeCsvField).join(','),
    ...rows.map(r => r.join(',')),
  ].join('\n');

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `centra_transactions_${dateStr}.csv`;

  return saveCsvFile(csvContent, filename);
}

export interface AllDataExportPayload {
  accounts?: Account[];
  transactions?: Transaction[];
  categories?: Category[];
  goals?: Goal[];
  goalHistory?: Record<string, GoalHistoryEntry[]>;
  budgets?: Budget[];
  userProfile?: UserProfile | null;
}

/**
 * Generates and downloads a comprehensive multi-section CSV backup for Settings -> "Download your data".
 * Sections included:
 * 1. Centra Backup Metadata
 * 2. Accounts
 * 3. Summary Financial Totals
 * 4. Transactions
 * 5. Savings Goals
 * 6. Per-Goal Deposit/Withdrawal History Log
 * 7. Monthly Budgets
 */
export async function exportAllDataToCSV(payload: AllDataExportPayload): Promise<ExportResult> {
  const {
    accounts = [],
    transactions = [],
    categories = [],
    goals = [],
    goalHistory = {},
    budgets = [],
    userProfile = null,
  } = payload;

  const categoryMap = new Map<string, string>();
  categories.forEach(c => categoryMap.set(c.id, c.name));

  const accountMap = new Map<string, string>();
  accounts.forEach(a => accountMap.set(a.id, a.name));

  const goalMap = new Map<string, string>();
  goals.forEach(g => goalMap.set(g.id, g.name));

  const lines: string[] = [];
  const addBlankLine = () => lines.push('');
  const addSectionHeader = (title: string) => {
    lines.push(`=== ${title} ===`);
  };

  // 1. Metadata
  addSectionHeader('CENTRA COMPLETE DATA BACKUP');
  lines.push(['Field', 'Value'].map(escapeCsvField).join(','));
  lines.push([escapeCsvField('Export Date'), escapeCsvField(new Date().toISOString())].join(','));
  lines.push([escapeCsvField('App Version'), escapeCsvField('4.1.0')].join(','));
  lines.push([escapeCsvField('User Name'), escapeCsvField(userProfile?.name || 'Centra User')].join(','));
  lines.push([escapeCsvField('User Email'), escapeCsvField(userProfile?.email || 'N/A')].join(','));
  lines.push([escapeCsvField('Total Accounts'), escapeCsvField(accounts.length)].join(','));
  lines.push([escapeCsvField('Total Transactions'), escapeCsvField(transactions.length)].join(','));
  lines.push([escapeCsvField('Total Savings Goals'), escapeCsvField(goals.length)].join(','));
  lines.push([escapeCsvField('Total Budgets'), escapeCsvField(budgets.length)].join(','));
  addBlankLine();

  // 2. Accounts
  addSectionHeader('ACCOUNTS');
  const accountHeaders = [
    'Account ID',
    'Account Name',
    'Type',
    'Bank Name',
    'Account Number (Masked)',
    'Current Balance',
    'Currency',
    'Card Brand',
    'Is Primary',
    'Credit Limit',
  ];
  lines.push(accountHeaders.map(escapeCsvField).join(','));
  accounts.forEach(acc => {
    lines.push(
      [
        escapeCsvField(acc.id),
        escapeCsvField(acc.name),
        escapeCsvField(acc.type),
        escapeCsvField(acc.bankName || ''),
        escapeCsvField(acc.accountNumberMasked || ''),
        escapeCsvField(acc.balance),
        escapeCsvField(acc.currency),
        escapeCsvField(acc.cardBrand || ''),
        escapeCsvField(acc.isPrimary ? 'Yes' : 'No'),
        escapeCsvField(acc.creditLimit !== undefined ? acc.creditLimit : ''),
      ].join(',')
    );
  });
  addBlankLine();

  // 3. Financial Summary
  addSectionHeader('SUMMARY TOTALS');
  lines.push(['Summary Metric', 'Value'].map(escapeCsvField).join(','));
  let totalIncome = 0;
  let totalExpenses = 0;
  transactions.forEach(t => {
    if (t.type === 'income') totalIncome += t.amount;
    else if (t.type === 'expense') totalExpenses += t.amount;
  });
  lines.push([escapeCsvField('Total Income Recorded'), escapeCsvField(totalIncome.toFixed(2))].join(','));
  lines.push([escapeCsvField('Total Expenses Recorded'), escapeCsvField(totalExpenses.toFixed(2))].join(','));
  lines.push([escapeCsvField('Net Savings Difference'), escapeCsvField((totalIncome - totalExpenses).toFixed(2))].join(','));
  addBlankLine();

  // 4. Transactions
  addSectionHeader('TRANSACTIONS');
  const txHeaders = [
    'Transaction ID',
    'Date',
    'Type',
    'Merchant / Payee',
    'Category',
    'Account',
    'Amount',
    'Currency',
    'Note',
    'Tags',
    'Is Pinned',
  ];
  lines.push(txHeaders.map(escapeCsvField).join(','));
  transactions.forEach(t => {
    lines.push(
      [
        escapeCsvField(t.id),
        escapeCsvField(t.date),
        escapeCsvField(t.type),
        escapeCsvField(t.merchant || ''),
        escapeCsvField(t.categoryName || categoryMap.get(t.categoryId) || 'Uncategorized'),
        escapeCsvField(t.accountName || accountMap.get(t.accountId) || 'Account'),
        escapeCsvField(t.amount),
        escapeCsvField(t.currency),
        escapeCsvField(t.note || ''),
        escapeCsvField((t.tags || []).join('; ')),
        escapeCsvField(t.isPinned ? 'Yes' : 'No'),
      ].join(',')
    );
  });
  addBlankLine();

  // 5. Savings Goals
  addSectionHeader('SAVINGS GOALS');
  const goalHeaders = [
    'Goal ID',
    'Goal Name',
    'Target Amount',
    'Current Amount',
    'Progress (%)',
    'Start Date',
    'Target Date',
    'Is Completed',
  ];
  lines.push(goalHeaders.map(escapeCsvField).join(','));
  goals.forEach(g => {
    const progress = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
    lines.push(
      [
        escapeCsvField(g.id),
        escapeCsvField(g.name),
        escapeCsvField(g.targetAmount),
        escapeCsvField(g.currentAmount),
        escapeCsvField(progress.toFixed(1) + '%'),
        escapeCsvField(g.startDate || ''),
        escapeCsvField(g.targetDate || ''),
        escapeCsvField(g.isCompleted ? 'Yes' : 'No'),
      ].join(',')
    );
  });
  addBlankLine();

  // 6. Savings Goal History Log
  addSectionHeader('SAVINGS GOAL HISTORY LOG');
  const historyHeaders = [
    'Goal ID',
    'Goal Name',
    'History Entry ID',
    'Date',
    'Action Type',
    'Amount',
    'Balance After Action',
    'Note',
  ];
  lines.push(historyHeaders.map(escapeCsvField).join(','));

  // Flatten all history entries
  const allHistoryEntries: GoalHistoryEntry[] = [];
  Object.keys(goalHistory).forEach(gId => {
    const list = goalHistory[gId] || [];
    allHistoryEntries.push(...list);
  });

  // Sort chronological descending
  allHistoryEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  allHistoryEntries.forEach(entry => {
    lines.push(
      [
        escapeCsvField(entry.goalId),
        escapeCsvField(goalMap.get(entry.goalId) || entry.goalId),
        escapeCsvField(entry.id),
        escapeCsvField(entry.date),
        escapeCsvField(entry.type),
        escapeCsvField(entry.amount),
        escapeCsvField(entry.balanceAfter),
        escapeCsvField(entry.note || ''),
      ].join(',')
    );
  });
  addBlankLine();

  // 7. Budgets
  addSectionHeader('BUDGETS');
  const budgetHeaders = [
    'Budget ID',
    'Category Name',
    'Period',
    'Limit Amount',
    'Spent Amount',
    'Alert Threshold (%)',
    'Currency',
  ];
  lines.push(budgetHeaders.map(escapeCsvField).join(','));
  budgets.forEach(b => {
    lines.push(
      [
        escapeCsvField(b.id),
        escapeCsvField(b.categoryName || categoryMap.get(b.categoryId) || 'Category'),
        escapeCsvField(b.period),
        escapeCsvField(b.limitAmount),
        escapeCsvField(b.spentAmount || 0),
        escapeCsvField(b.alertThreshold + '%'),
        escapeCsvField(b.currency || ''),
      ].join(',')
    );
  });

  const fullContent = lines.join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `centra_all_data_${dateStr}.csv`;

  return saveCsvFile(fullContent, filename);
}

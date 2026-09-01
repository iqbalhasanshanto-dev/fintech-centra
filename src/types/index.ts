export type CurrencyCode = 'BDT' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD';

export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'cash';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: CurrencyCode;
  accountNumberMasked: string; // e.g. "•••• 4242"
  bankName: string;
  color: string;
  cardBrand?: 'visa' | 'mastercard' | 'amex' | 'generic';
  isPrimary?: boolean;
  creditLimit?: number;
}

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  accountId: string;
  accountName: string;
  toAccountId?: string; // For transfers
  recipient?: string;
  date: string; // ISO String (YYYY-MM-DD or full ISO)
  note?: string;
  tags?: string[];
  isPinned?: boolean;
  isRecurring?: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  resultingBalance?: number;
  merchant?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  budgetLimit?: number;
}

export interface Goal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // ISO date YYYY-MM-DD
  startDate: string;
  linkedAccountId?: string;
  isCompleted?: boolean;
  monthlyContribution?: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  limitAmount: number;
  spentAmount: number;
  alertThreshold: number; // percentage, e.g. 80
  period: 'monthly' | 'weekly';
}

export type NotificationType = 'budget' | 'security' | 'transaction' | 'goal' | 'system';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  severity?: 'info' | 'warning' | 'alert' | 'success';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  baseCurrency: CurrencyCode;
  createdAt: string;
}

export interface SecuritySettings {
  biometricEnabled: boolean;
  pinLockEnabled: boolean;
  pinCode?: string;
  twoFactorEnabled: boolean;
  twoFactorType: 'authenticator' | 'sms' | 'email';
  twoFactorContact?: string;
  lastLogin?: string;
}

export interface NotificationPreferences {
  transactionAlerts: boolean;
  budgetOverruns: boolean;
  securityAlerts: boolean;
  billReminders: boolean;
  weeklyDigest: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  baseCurrency: CurrencyCode;
  privacyMode: boolean; // Masks sensitive numbers with dots
  security: SecuritySettings;
  notifications: NotificationPreferences;
}

export type PeriodFilter = 'this_month' | 'last_month' | 'last_90_days' | 'this_year' | 'all';

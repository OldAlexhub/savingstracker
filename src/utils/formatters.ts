import { Currency, DebtType, SavingsStrategyId, DebtStrategyId } from '../types/index';
import { getCurrencyMetadata } from '../data/currencies';

// ─── Currency Formatting ──────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency: Currency): string {
  const safe = isFinite(amount) && !isNaN(amount) ? amount : 0;
  const meta = getCurrencyMetadata(currency);
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals,
    }).format(safe);
  } catch {
    return `${currency} ${safe.toFixed(meta.decimals)}`;
  }
}

export function formatCurrencyCompact(amount: number, currency: Currency): string {
  const safe = isFinite(amount) && !isNaN(amount) ? Math.abs(amount) : 0;
  const sign = amount < 0 ? '-' : '';
  const meta = getCurrencyMetadata(currency);

  try {
    if (safe >= 1_000_000) {
      const formatted = new Intl.NumberFormat(meta.locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
        notation: 'compact',
      }).format(amount);
      return formatted;
    }
    if (safe >= 1_000) {
      const value = safe / 1_000;
      const symbol = getCurrencySymbol(currency, meta.locale);
      return `${sign}${symbol}${value.toFixed(1)}K`;
    }
    return formatCurrency(amount, currency);
  } catch {
    return formatCurrency(amount, currency);
  }
}

function getCurrencySymbol(currency: Currency, locale: string): string {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).formatToParts(0);
    const symbolPart = parts.find(p => p.type === 'currency');
    return symbolPart?.value ?? currency;
  } catch {
    return currency;
  }
}

// ─── Percent ─────────────────────────────────────────────────────────────────

export function formatPercent(value: number, decimals = 1): string {
  const safe = isFinite(value) && !isNaN(value) ? value : 0;
  return `${safe.toFixed(decimals)}%`;
}

// ─── Date Formatting ──────────────────────────────────────────────────────────

function parseLocalDate(dateString: string): Date | null {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }
  // Handle YYYY-MM-DD without timezone shift
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? `${dateString}T00:00:00`
    : dateString;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(dateString: string): string {
  const d = parseLocalDate(dateString);
  if (!d) {
    return dateString ?? '';
  }
  try {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateShort(dateString: string): string {
  const d = parseLocalDate(dateString);
  if (!d) {
    return dateString ?? '';
  }
  try {
    return d.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function formatDateFull(dateString: string): string {
  const d = parseLocalDate(dateString);
  if (!d) {
    return dateString ?? '';
  }
  try {
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatRelativeDate(dateString: string): string {
  const d = parseLocalDate(dateString);
  if (!d) {
    return dateString ?? '';
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffMs = today.getTime() - target.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays === -1) {
    return 'Tomorrow';
  }
  if (diffDays > 1 && diffDays <= 6) {
    return `${diffDays} days ago`;
  }
  if (diffDays < -1 && diffDays >= -6) {
    return `In ${Math.abs(diffDays)} days`;
  }

  try {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
}

// ─── APR ─────────────────────────────────────────────────────────────────────

export function formatAPR(apr: number | null): string {
  if (apr === null || apr === undefined || isNaN(apr) || !isFinite(apr)) {
    return 'N/A';
  }
  return `${apr.toFixed(2)}%`;
}

// ─── Debt Type ────────────────────────────────────────────────────────────────

const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  credit_card: 'Credit Card',
  student_loan: 'Student Loan',
  auto_loan: 'Auto Loan',
  mortgage: 'Mortgage',
  personal_loan: 'Personal Loan',
  medical: 'Medical',
  other: 'Other',
};

export function formatDebtType(debtType: DebtType): string {
  return DEBT_TYPE_LABELS[debtType] ?? debtType;
}

// ─── Strategy Names ───────────────────────────────────────────────────────────

const SAVINGS_STRATEGY_LABELS: Record<SavingsStrategyId, string> = {
  fixed_weekly: 'Fixed Weekly',
  fixed_monthly: 'Fixed Monthly',
  pay_yourself_first: 'Pay Yourself First',
  emergency_fund: 'Emergency Fund',
  sinking_fund: 'Sinking Fund',
  challenge_52week: '52-Week Challenge',
  reverse_52week: 'Reverse 52-Week',
  envelope_buckets: 'Envelope Buckets',
  no_spend_day: 'No-Spend Days',
  custom: 'Custom Plan',
};

export function formatStrategyName(strategyId: SavingsStrategyId): string {
  return SAVINGS_STRATEGY_LABELS[strategyId] ?? strategyId;
}

const DEBT_STRATEGY_LABELS: Record<DebtStrategyId, string> = {
  avalanche: 'Debt Avalanche',
  snowball: 'Debt Snowball',
  hybrid: 'Hybrid Method',
  equal_extra: 'Equal Extra Payment',
  custom_order: 'Custom Order',
};

export function formatDebtStrategyName(strategyId: DebtStrategyId): string {
  return DEBT_STRATEGY_LABELS[strategyId] ?? strategyId;
}

// ─── Number Parsing ───────────────────────────────────────────────────────────

export function parseNumberSafe(value: string): number {
  if (!value || typeof value !== 'string') {
    return 0;
  }
  const cleaned = value.trim().replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || !isFinite(parsed)) {
    return 0;
  }
  return parsed;
}

export function parseCurrency(value: string): number {
  if (!value || typeof value !== 'string') {
    return 0;
  }
  // Remove currency symbols, letters, and whitespace except digits, dot, minus, comma
  const cleaned = value.replace(/[^\d.,-]/g, '').replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || !isFinite(parsed)) {
    return 0;
  }
  return parsed;
}

// ─── Months ───────────────────────────────────────────────────────────────────

export function formatMonths(months: number | null): string {
  if (months === null || months === undefined || isNaN(months) || !isFinite(months)) {
    return 'N/A';
  }
  const m = Math.ceil(Math.abs(months));
  if (m === 0) {
    return '0 months';
  }
  const years = Math.floor(m / 12);
  const remainingMonths = m % 12;

  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  }
  if (remainingMonths > 0) {
    parts.push(`${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`);
  }
  return parts.join(' ') || '0 months';
}

// ─── File Size ────────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  const safe = isFinite(bytes) && !isNaN(bytes) ? Math.abs(bytes) : 0;
  if (safe < 1024) {
    return `${safe} B`;
  }
  if (safe < 1024 * 1024) {
    return `${(safe / 1024).toFixed(1)} KB`;
  }
  if (safe < 1024 * 1024 * 1024) {
    return `${(safe / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(safe / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

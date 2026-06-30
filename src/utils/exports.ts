import { Share } from 'react-native';
import RNFS from 'react-native-fs';
import {
  AppData,
  SavingsGoal,
  SavingsContribution,
  DebtAccount,
  DebtPayment,
  UserPreferences,
} from '../types/index';
import {
  formatCurrency,
  formatDate,
  formatDebtType,
  formatStrategyName,
  formatAPR,
} from './formatters';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimestampString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  return `${y}${mo}${d}_${h}${mi}`;
}

function escapeCSVField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCSVRow(fields: (string | number | null | undefined)[]): string {
  return fields.map(escapeCSVField).join(',');
}

async function writeAndShare(
  content: string,
  filename: string,
  shareTitle: string,
): Promise<void> {
  const filePath = `${RNFS.DownloadDirectoryPath}/${filename}`;
  await RNFS.writeFile(filePath, content, 'utf8');
  await Share.share(
    {
      title: shareTitle,
      url: `file://${filePath}`,
      message: `${shareTitle} — saved to Downloads/${filename}`,
    },
    { dialogTitle: shareTitle },
  );
}

// ─── JSON Export ──────────────────────────────────────────────────────────────

export async function exportAllDataJSON(
  data: AppData,
  preferences: UserPreferences,
): Promise<void> {
  try {
    const timestamp = getTimestampString();
    const filename = `savings_tracker_backup_${timestamp}.json`;
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0',
      currency: preferences.currency,
      data,
    };
    const content = JSON.stringify(exportPayload, null, 2);
    await writeAndShare(content, filename, 'Savings Tracker Backup');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to export JSON backup: ${message}`);
  }
}

// ─── Savings CSV Export ───────────────────────────────────────────────────────

export async function exportSavingsCSV(
  goals: SavingsGoal[],
  contributions: SavingsContribution[],
  preferences: UserPreferences,
): Promise<void> {
  try {
    const timestamp = getTimestampString();
    const filename = `savings_goals_${timestamp}.csv`;
    const { currency } = preferences;
    const lines: string[] = [];

    lines.push('SAVINGS GOALS');
    lines.push(
      buildCSVRow([
        'ID', 'Name', 'Status', 'Strategy', 'Target Amount',
        'Starting Amount', 'Saved Amount', 'Remaining', 'Progress %',
        'Target Date', 'Created', 'Updated', 'Notes',
      ]),
    );

    for (const goal of goals) {
      const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
      const progress =
        goal.targetAmount > 0
          ? ((goal.savedAmount / goal.targetAmount) * 100).toFixed(1)
          : '0.0';
      lines.push(
        buildCSVRow([
          goal.id, goal.name, goal.status, formatStrategyName(goal.strategyId),
          formatCurrency(goal.targetAmount, currency),
          formatCurrency(goal.startingAmount, currency),
          formatCurrency(goal.savedAmount, currency),
          formatCurrency(remaining, currency),
          `${progress}%`,
          formatDate(goal.targetDate), formatDate(goal.createdAt),
          formatDate(goal.updatedAt), goal.notes,
        ]),
      );
    }

    lines.push('');
    lines.push('CONTRIBUTIONS');
    lines.push(
      buildCSVRow(['ID', 'Goal ID', 'Goal Name', 'Amount', 'Date', 'Notes', 'Created']),
    );

    for (const c of contributions) {
      const goal = goals.find(g => g.id === c.goalId);
      lines.push(
        buildCSVRow([
          c.id, c.goalId, goal?.name ?? 'Unknown Goal',
          formatCurrency(c.amount, currency),
          formatDate(c.date), c.notes, formatDate(c.createdAt),
        ]),
      );
    }

    const content = lines.join('\r\n');
    await writeAndShare(content, filename, 'Savings Goals Export');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to export savings CSV: ${message}`);
  }
}

// ─── Debts CSV Export ─────────────────────────────────────────────────────────

export async function exportDebtsCSV(
  debts: DebtAccount[],
  payments: DebtPayment[],
  preferences: UserPreferences,
): Promise<void> {
  try {
    const timestamp = getTimestampString();
    const filename = `debt_accounts_${timestamp}.csv`;
    const { currency } = preferences;
    const lines: string[] = [];

    lines.push('DEBT ACCOUNTS');
    lines.push(
      buildCSVRow([
        'ID', 'Name', 'Type', 'Status', 'Original Balance', 'Current Balance',
        'APR', 'Minimum Payment', 'Due Day', 'Created', 'Updated', 'Notes',
      ]),
    );

    for (const debt of debts) {
      lines.push(
        buildCSVRow([
          debt.id, debt.name, formatDebtType(debt.debtType), debt.status,
          formatCurrency(debt.originalBalance, currency),
          formatCurrency(debt.currentBalance, currency),
          formatAPR(debt.apr),
          debt.minimumPayment !== null
            ? formatCurrency(debt.minimumPayment, currency)
            : 'N/A',
          debt.dueDayOfMonth !== null ? String(debt.dueDayOfMonth) : 'N/A',
          formatDate(debt.createdAt), formatDate(debt.updatedAt), debt.notes,
        ]),
      );
    }

    lines.push('');
    lines.push('DEBT PAYMENTS');
    lines.push(
      buildCSVRow([
        'ID', 'Debt ID', 'Debt Name', 'Amount', 'Date',
        'Is Minimum Payment', 'Notes', 'Created',
      ]),
    );

    for (const p of payments) {
      const debt = debts.find(d => d.id === p.debtId);
      lines.push(
        buildCSVRow([
          p.id, p.debtId, debt?.name ?? 'Unknown Debt',
          formatCurrency(p.amount, currency),
          formatDate(p.date), p.isMinimumPayment ? 'Yes' : 'No',
          p.notes, formatDate(p.createdAt),
        ]),
      );
    }

    const content = lines.join('\r\n');
    await writeAndShare(content, filename, 'Debt Accounts Export');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to export debts CSV: ${message}`);
  }
}

// ─── Text Summary Export ──────────────────────────────────────────────────────

export async function exportTextSummary(
  data: AppData,
  preferences: UserPreferences,
): Promise<void> {
  try {
    const timestamp = getTimestampString();
    const filename = `savings_tracker_summary_${timestamp}.txt`;
    const { currency } = preferences;
    const now = new Date();
    const sep = '━'.repeat(50);
    const thinSep = '─'.repeat(50);
    const lines: string[] = [];

    lines.push(sep);
    lines.push('  SAVINGS TRACKER — SUMMARY REPORT');
    lines.push(`  Generated: ${now.toLocaleString()}`);
    lines.push(sep);
    lines.push('');

    const activeGoals = data.savingsGoals.filter(g => g.status === 'active');
    const completedGoals = data.savingsGoals.filter(g => g.status === 'completed');
    const activeDebts = data.debtAccounts.filter(d => d.status === 'active');

    const totalSaved = activeGoals.reduce((s, g) => s + g.savedAmount, 0);
    const totalTarget = activeGoals.reduce((s, g) => s + g.targetAmount, 0);
    const totalDebt = activeDebts.reduce((s, d) => s + d.currentBalance, 0);
    const totalOriginal = activeDebts.reduce((s, d) => s + d.originalBalance, 0);
    const totalDebtPaid = Math.max(0, totalOriginal - totalDebt);

    lines.push('OVERVIEW');
    lines.push(thinSep);
    lines.push(`  Active Savings Goals  : ${activeGoals.length}`);
    lines.push(`  Completed Goals       : ${completedGoals.length}`);
    lines.push(`  Total Saved           : ${formatCurrency(totalSaved, currency)}`);
    lines.push(`  Total Target          : ${formatCurrency(totalTarget, currency)}`);
    lines.push(`  Active Debts          : ${activeDebts.length}`);
    lines.push(`  Total Debt Remaining  : ${formatCurrency(totalDebt, currency)}`);
    lines.push(`  Total Debt Paid       : ${formatCurrency(totalDebtPaid, currency)}`);
    lines.push('');

    if (data.savingsGoals.length > 0) {
      lines.push('SAVINGS GOALS');
      lines.push(thinSep);
      for (const goal of data.savingsGoals) {
        const progress =
          goal.targetAmount > 0
            ? ((goal.savedAmount / goal.targetAmount) * 100).toFixed(1)
            : '0.0';
        const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
        lines.push(`  ${goal.name} [${goal.status.toUpperCase()}]`);
        lines.push(`    Strategy    : ${formatStrategyName(goal.strategyId)}`);
        lines.push(`    Target      : ${formatCurrency(goal.targetAmount, currency)}`);
        lines.push(`    Saved       : ${formatCurrency(goal.savedAmount, currency)} (${progress}%)`);
        lines.push(`    Remaining   : ${formatCurrency(remaining, currency)}`);
        lines.push(`    Target Date : ${formatDate(goal.targetDate)}`);
        if (goal.notes) {
          lines.push(`    Notes       : ${goal.notes}`);
        }
        lines.push('');
      }
    }

    if (data.contributions.length > 0) {
      lines.push('CONTRIBUTIONS');
      lines.push(thinSep);
      const sorted = [...data.contributions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      for (const c of sorted) {
        const goal = data.savingsGoals.find(g => g.id === c.goalId);
        lines.push(
          `  ${formatDate(c.date)}  ${formatCurrency(c.amount, currency).padStart(12)}  ${goal?.name ?? 'Unknown Goal'}${c.notes ? `  — ${c.notes}` : ''}`,
        );
      }
      lines.push('');
    }

    if (data.debtAccounts.length > 0) {
      lines.push('DEBT ACCOUNTS');
      lines.push(thinSep);
      for (const debt of data.debtAccounts) {
        const paidDown = Math.max(0, debt.originalBalance - debt.currentBalance);
        lines.push(`  ${debt.name} [${debt.status.toUpperCase()}]`);
        lines.push(`    Type            : ${formatDebtType(debt.debtType)}`);
        lines.push(`    Original Balance: ${formatCurrency(debt.originalBalance, currency)}`);
        lines.push(`    Current Balance : ${formatCurrency(debt.currentBalance, currency)}`);
        lines.push(`    Paid Down       : ${formatCurrency(paidDown, currency)}`);
        lines.push(`    APR             : ${formatAPR(debt.apr)}`);
        lines.push(
          `    Min. Payment    : ${debt.minimumPayment !== null ? formatCurrency(debt.minimumPayment, currency) : 'N/A'}`,
        );
        if (debt.notes) {
          lines.push(`    Notes           : ${debt.notes}`);
        }
        lines.push('');
      }
    }

    if (data.debtPayments.length > 0) {
      lines.push('DEBT PAYMENTS');
      lines.push(thinSep);
      const sorted = [...data.debtPayments].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      for (const p of sorted) {
        const debt = data.debtAccounts.find(d => d.id === p.debtId);
        lines.push(
          `  ${formatDate(p.date)}  ${formatCurrency(p.amount, currency).padStart(12)}  ${debt?.name ?? 'Unknown Debt'}${p.isMinimumPayment ? ' (min payment)' : ''}${p.notes ? `  — ${p.notes}` : ''}`,
        );
      }
      lines.push('');
    }

    lines.push(sep);
    lines.push('  End of Report — Savings Tracker by Old Alex Hub');
    lines.push(sep);

    const content = lines.join('\n');
    await writeAndShare(content, filename, 'Savings Tracker Summary');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to export text summary: ${message}`);
  }
}

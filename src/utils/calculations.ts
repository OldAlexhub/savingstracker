import {
  SavingsGoal,
  SavingsContribution,
  SavingsCalculation,
  DebtAccount,
  DebtPayment,
  DebtStrategyResult,
  WeeklyChallenge,
  DashboardStats,
  ActivityItem,
} from '../types/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeNumber(value: number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined || !isFinite(value) || isNaN(value)) {
    return fallback;
  }
  return value;
}

function daysBetween(dateA: Date, dateB: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((dateB.getTime() - dateA.getTime()) / msPerDay);
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ─── Required Contribution ────────────────────────────────────────────────────

export function calculateRequiredContribution(
  remaining: number,
  targetDate: string,
): { daily: number; weekly: number; biweekly: number; monthly: number } {
  const safe = safeNumber(remaining);
  if (safe <= 0) {
    return { daily: 0, weekly: 0, biweekly: 0, monthly: 0 };
  }

  const target = parseDate(targetDate);
  const now = new Date();
  if (!target || target <= now) {
    return { daily: 0, weekly: 0, biweekly: 0, monthly: 0 };
  }

  const daysLeft = daysBetween(now, target);
  if (daysLeft <= 0) {
    return { daily: 0, weekly: 0, biweekly: 0, monthly: 0 };
  }

  const weeksLeft = daysLeft / 7;
  const biweeksLeft = daysLeft / 14;
  const monthsLeft = daysLeft / 30.4375;

  return {
    daily: safe / daysLeft,
    weekly: safe / Math.max(weeksLeft, 0.001),
    biweekly: safe / Math.max(biweeksLeft, 0.001),
    monthly: safe / Math.max(monthsLeft, 0.001),
  };
}

// ─── Savings Progress ─────────────────────────────────────────────────────────

export function calculateSavingsProgress(goal: SavingsGoal): SavingsCalculation {
  const targetAmount = safeNumber(goal.targetAmount);
  const savedAmount = safeNumber(goal.savedAmount);

  const progressPercent =
    targetAmount > 0 ? Math.min(100, (savedAmount / targetAmount) * 100) : 0;
  const remainingAmount = Math.max(0, targetAmount - savedAmount);

  const targetDate = parseDate(goal.targetDate);
  const createdAt = parseDate(goal.createdAt) ?? new Date();
  const now = new Date();

  let daysRemaining: number | null = null;
  let estimatedCompletionDate: string | null = null;
  let isOnTrack = false;
  let requiredDaily = 0;
  let requiredWeekly = 0;
  let requiredBiweekly = 0;
  let requiredMonthly = 0;

  if (targetDate) {
    const totalDays = Math.max(1, daysBetween(createdAt, targetDate));
    const daysPassed = Math.max(0, daysBetween(createdAt, now));
    daysRemaining = Math.max(0, daysBetween(now, targetDate));

    // isOnTrack: ratio of saved vs target should be >= ratio of time elapsed
    const timeRatio = daysPassed / totalDays;
    const progressRatio = targetAmount > 0 ? savedAmount / targetAmount : 0;
    isOnTrack = progressRatio >= timeRatio;

    if (daysRemaining > 0 && remainingAmount > 0) {
      const contributions = calculateRequiredContribution(remainingAmount, goal.targetDate);
      requiredDaily = contributions.daily;
      requiredWeekly = contributions.weekly;
      requiredBiweekly = contributions.biweekly;
      requiredMonthly = contributions.monthly;
    }

    // Estimate completion date based on recent save rate
    if (savedAmount > 0 && daysPassed > 0 && remainingAmount > 0) {
      const dailyRate = savedAmount / Math.max(daysPassed, 1);
      if (dailyRate > 0) {
        const daysToComplete = remainingAmount / dailyRate;
        const completion = new Date(now);
        completion.setDate(completion.getDate() + Math.ceil(daysToComplete));
        estimatedCompletionDate = toISODateString(completion);
      }
    } else if (remainingAmount <= 0) {
      estimatedCompletionDate = toISODateString(now);
    }
  }

  return {
    progressPercent,
    remainingAmount,
    requiredDailyContribution: requiredDaily,
    requiredWeeklyContribution: requiredWeekly,
    requiredBiweeklyContribution: requiredBiweekly,
    requiredMonthlyContribution: requiredMonthly,
    estimatedCompletionDate,
    daysRemaining,
    isOnTrack,
  };
}

// ─── 52-Week Challenge ────────────────────────────────────────────────────────

export function calculate52WeekChallenge(
  startDate: string,
  reverse = false,
): WeeklyChallenge[] {
  const challenges: WeeklyChallenge[] = [];
  let cumulative = 0;

  for (let week = 1; week <= 52; week++) {
    const amount = reverse ? 53 - week : week;
    cumulative += amount;
    challenges.push({ week, amount, cumulativeAmount: cumulative });
  }

  return challenges;
}

// ─── Emergency Fund Target ────────────────────────────────────────────────────

export function calculateEmergencyFundTarget(
  monthlyExpenses: number,
  months = 6,
): number {
  const safe = safeNumber(monthlyExpenses);
  const safeMonths = safeNumber(months, 6);
  if (safe <= 0 || safeMonths <= 0) {
    return 0;
  }
  return safe * safeMonths;
}

// ─── Sinking Fund Target ──────────────────────────────────────────────────────

export function calculateSinkingFundTarget(
  targetAmount: number,
  targetDate: string,
): { requiredMonthly: number; requiredWeekly: number; monthsRemaining: number } {
  const safe = safeNumber(targetAmount);
  const target = parseDate(targetDate);
  const now = new Date();

  if (!target || target <= now || safe <= 0) {
    return { requiredMonthly: 0, requiredWeekly: 0, monthsRemaining: 0 };
  }

  const daysLeft = daysBetween(now, target);
  const monthsRemaining = daysLeft / 30.4375;
  const weeksRemaining = daysLeft / 7;

  return {
    requiredMonthly: monthsRemaining > 0 ? safe / monthsRemaining : 0,
    requiredWeekly: weeksRemaining > 0 ? safe / weeksRemaining : 0,
    monthsRemaining: Math.max(0, monthsRemaining),
  };
}

// ─── Debt: Payoff Months ──────────────────────────────────────────────────────

export function calculateDebtPayoffMonths(
  balance: number,
  apr: number,
  monthlyPayment: number,
): number | null {
  const b = safeNumber(balance);
  const p = safeNumber(monthlyPayment);

  if (b <= 0) {
    return 0;
  }
  if (p <= 0) {
    return null;
  }

  const annualRate = safeNumber(apr);
  if (annualRate <= 0) {
    // No interest — simple division
    return Math.ceil(b / p);
  }

  const monthlyRate = annualRate / 100 / 12;
  // Guard: if payment doesn't exceed monthly interest, payoff is impossible
  const monthlyInterest = b * monthlyRate;
  if (p <= monthlyInterest) {
    return null;
  }

  // Amortization formula: n = -ln(1 - (r*B)/P) / ln(1+r)
  const n = -Math.log(1 - (monthlyRate * b) / p) / Math.log(1 + monthlyRate);

  if (!isFinite(n) || isNaN(n) || n < 0) {
    return null;
  }

  return Math.min(Math.ceil(n), 600);
}

// ─── Debt: Total Interest ─────────────────────────────────────────────────────

export function calculateTotalInterest(
  balance: number,
  apr: number,
  monthlyPayment: number,
): number {
  const b = safeNumber(balance);
  const p = safeNumber(monthlyPayment);
  const annualRate = safeNumber(apr);

  if (b <= 0 || p <= 0) {
    return 0;
  }

  if (annualRate <= 0) {
    return 0;
  }

  const months = calculateDebtPayoffMonths(b, annualRate, p);
  if (months === null) {
    return 0;
  }

  const totalPaid = p * months;
  return Math.max(0, totalPaid - b);
}

// ─── Estimate Payoff Date ─────────────────────────────────────────────────────

export function estimatePayoffDate(monthsToPayoff: number | null): string | null {
  if (monthsToPayoff === null || monthsToPayoff <= 0) {
    return null;
  }
  const result = addMonths(new Date(), Math.ceil(monthsToPayoff));
  return toISODateString(result);
}

// ─── Debt Strategy Builder ────────────────────────────────────────────────────

interface DebtWithCalc extends DebtAccount {
  _monthsToPayoff: number | null;
  _totalInterest: number;
  _totalPaid: number;
}

function enrichDebt(debt: DebtAccount, extraShare: number): DebtWithCalc {
  const minPayment = safeNumber(debt.minimumPayment, 0);
  const monthlyPayment = minPayment + extraShare;
  const apr = debt.apr ?? 0;
  const months = calculateDebtPayoffMonths(debt.currentBalance, apr, monthlyPayment);
  const interest = calculateTotalInterest(debt.currentBalance, apr, monthlyPayment);
  return {
    ...debt,
    _monthsToPayoff: months,
    _totalInterest: interest,
    _totalPaid: safeNumber(debt.currentBalance) + interest,
  };
}

function buildStrategyResult(
  strategyId: DebtStrategyResult['strategyId'],
  strategyName: string,
  orderedDebts: DebtAccount[],
  extraPayment: number,
): DebtStrategyResult {
  const warnings: string[] = [];
  const activeDebts = orderedDebts.filter(d => d.status === 'active');

  let maxMonths = 0;
  let totalInterest = 0;
  let totalPaid = 0;

  const enriched: DebtWithCalc[] = activeDebts.map((debt, idx) => {
    // For the focus debt (first in order), apply all extra payment
    const extra = idx === 0 ? extraPayment : 0;
    const e = enrichDebt(debt, extra);

    if (e.minimumPayment === null) {
      warnings.push(`"${debt.name}" has no minimum payment set — interest may still accrue.`);
    }

    totalInterest += e._totalInterest;
    totalPaid += e._totalPaid;

    if (e._monthsToPayoff !== null && e._monthsToPayoff > maxMonths) {
      maxMonths = e._monthsToPayoff;
    } else if (e._monthsToPayoff === null) {
      warnings.push(`"${debt.name}": payment may not cover monthly interest. Increase payment amount.`);
    }

    return e;
  });

  const payoffDate = maxMonths > 0 ? estimatePayoffDate(maxMonths) : null;
  const nextTarget = enriched.length > 0 ? enriched[0] : null;

  return {
    strategyId,
    strategyName,
    debtOrder: activeDebts,
    totalInterest,
    totalPaid,
    estimatedPayoffDate: payoffDate,
    nextTargetDebt: nextTarget,
    warnings,
  };
}

// ─── Debt: Avalanche (Highest APR First) ─────────────────────────────────────

export function calculateDebtAvalanche(
  debts: DebtAccount[],
  extraPayment = 0,
): DebtStrategyResult {
  const active = debts
    .filter(d => d.status === 'active' && safeNumber(d.currentBalance) > 0)
    .sort((a, b) => safeNumber(b.apr) - safeNumber(a.apr));

  return buildStrategyResult('avalanche', 'Debt Avalanche', active, safeNumber(extraPayment));
}

// ─── Debt: Snowball (Lowest Balance First) ────────────────────────────────────

export function calculateDebtSnowball(
  debts: DebtAccount[],
  extraPayment = 0,
): DebtStrategyResult {
  const active = debts
    .filter(d => d.status === 'active' && safeNumber(d.currentBalance) > 0)
    .sort((a, b) => safeNumber(a.currentBalance) - safeNumber(b.currentBalance));

  return buildStrategyResult('snowball', 'Debt Snowball', active, safeNumber(extraPayment));
}

// ─── Debt: Hybrid (Lowest balance quick win, then avalanche) ─────────────────

export function calculateDebtHybrid(
  debts: DebtAccount[],
  extraPayment = 0,
): DebtStrategyResult {
  const active = debts.filter(
    d => d.status === 'active' && safeNumber(d.currentBalance) > 0,
  );

  if (active.length === 0) {
    return buildStrategyResult('hybrid', 'Hybrid Method', [], safeNumber(extraPayment));
  }

  // Sort by balance ascending to find quick wins, take the first as priority
  const byBalance = [...active].sort(
    (a, b) => safeNumber(a.currentBalance) - safeNumber(b.currentBalance),
  );
  const quickWin = byBalance[0];
  const rest = byBalance
    .slice(1)
    .sort((a, b) => safeNumber(b.apr) - safeNumber(a.apr));

  const ordered = [quickWin, ...rest];
  return buildStrategyResult('hybrid', 'Hybrid Method', ordered, safeNumber(extraPayment));
}

// ─── Debt: Equal Extra Payment ────────────────────────────────────────────────

export function calculateEqualExtraPayment(
  debts: DebtAccount[],
  extraPayment = 0,
): DebtStrategyResult {
  const active = debts.filter(
    d => d.status === 'active' && safeNumber(d.currentBalance) > 0,
  );

  const warnings: string[] = [];
  const extra = safeNumber(extraPayment);
  const perDebtExtra = active.length > 0 ? extra / active.length : 0;

  let maxMonths = 0;
  let totalInterest = 0;
  let totalPaid = 0;

  const enriched = active.map(debt => {
    const e = enrichDebt(debt, perDebtExtra);
    if (debt.minimumPayment === null) {
      warnings.push(`"${debt.name}" has no minimum payment set.`);
    }
    if (e._monthsToPayoff === null) {
      warnings.push(`"${debt.name}": payment may not cover monthly interest.`);
    }
    totalInterest += e._totalInterest;
    totalPaid += e._totalPaid;
    if (e._monthsToPayoff !== null && e._monthsToPayoff > maxMonths) {
      maxMonths = e._monthsToPayoff;
    }
    return e;
  });

  const payoffDate = maxMonths > 0 ? estimatePayoffDate(maxMonths) : null;
  const nextTarget = enriched.length > 0 ? enriched[0] : null;

  return {
    strategyId: 'equal_extra',
    strategyName: 'Equal Extra Payment',
    debtOrder: active,
    totalInterest,
    totalPaid,
    estimatedPayoffDate: payoffDate,
    nextTargetDebt: nextTarget,
    warnings,
  };
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export function computeDashboardStats(
  goals: SavingsGoal[],
  contributions: SavingsContribution[],
  debts: DebtAccount[],
  payments: DebtPayment[],
): DashboardStats {
  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const activeDebts = debts.filter(d => d.status === 'active');

  const totalSaved = activeGoals.reduce((sum, g) => sum + safeNumber(g.savedAmount), 0);
  const totalTarget = activeGoals.reduce((sum, g) => sum + safeNumber(g.targetAmount), 0);
  const totalDebt = activeDebts.reduce((sum, d) => sum + safeNumber(d.currentBalance), 0);
  const totalOriginalDebt = activeDebts.reduce(
    (sum, d) => sum + safeNumber(d.originalBalance),
    0,
  );
  const totalDebtPaid = activeDebts.reduce(
    (sum, d) =>
      sum + Math.max(0, safeNumber(d.originalBalance) - safeNumber(d.currentBalance)),
    0,
  );

  // Build activity items
  const activityItems: ActivityItem[] = [];

  // Contributions
  for (const c of contributions) {
    const goal = goals.find(g => g.id === c.goalId);
    activityItems.push({
      id: `contrib-${c.id}`,
      type: 'contribution',
      description: `Added ${goal ? `to "${goal.name}"` : 'to a goal'}`,
      amount: c.amount,
      date: c.date,
    });
  }

  // Debt payments
  for (const p of payments) {
    const debt = debts.find(d => d.id === p.debtId);
    activityItems.push({
      id: `payment-${p.id}`,
      type: 'debt_payment',
      description: `Payment on ${debt ? `"${debt.name}"` : 'a debt'}`,
      amount: p.amount,
      date: p.date,
    });
  }

  // Goal creations
  for (const g of goals) {
    activityItems.push({
      id: `goal-created-${g.id}`,
      type: 'goal_created',
      description: `Created goal "${g.name}"`,
      amount: null,
      date: g.createdAt,
    });
  }

  // Debt creations
  for (const d of debts) {
    activityItems.push({
      id: `debt-created-${d.id}`,
      type: 'debt_created',
      description: `Added debt "${d.name}"`,
      amount: null,
      date: d.createdAt,
    });
  }

  // Completed goals
  for (const g of completedGoals) {
    activityItems.push({
      id: `goal-completed-${g.id}`,
      type: 'goal_completed',
      description: `Completed goal "${g.name}"`,
      amount: g.targetAmount,
      date: g.updatedAt,
    });
  }

  // Paid off debts
  for (const d of debts.filter(x => x.status === 'paid_off')) {
    activityItems.push({
      id: `debt-paid-${d.id}`,
      type: 'debt_paid_off',
      description: `Paid off "${d.name}"`,
      amount: d.originalBalance,
      date: d.updatedAt,
    });
  }

  // Sort by date descending and take last 10
  activityItems.sort((a, b) => {
    const da = parseDate(a.date)?.getTime() ?? 0;
    const db = parseDate(b.date)?.getTime() ?? 0;
    return db - da;
  });
  const recentActivity = activityItems.slice(0, 10);

  return {
    totalSaved,
    totalTarget,
    activeGoalsCount: activeGoals.length,
    totalDebt,
    totalOriginalDebt,
    totalDebtPaid,
    completedGoalsCount: completedGoals.length,
    recentActivity,
  };
}

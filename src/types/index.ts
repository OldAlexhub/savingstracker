import type { Currency } from '../data/currencies';

export type { Currency };

export type SavingsStrategyId =
  | 'fixed_weekly'
  | 'fixed_monthly'
  | 'pay_yourself_first'
  | 'emergency_fund'
  | 'sinking_fund'
  | 'challenge_52week'
  | 'reverse_52week'
  | 'envelope_buckets'
  | 'no_spend_day'
  | 'custom';

export type DebtStrategyId =
  | 'avalanche'
  | 'snowball'
  | 'hybrid'
  | 'equal_extra'
  | 'custom_order';

export type DebtType =
  | 'credit_card'
  | 'student_loan'
  | 'auto_loan'
  | 'mortgage'
  | 'personal_loan'
  | 'medical'
  | 'other';

export type GoalStatus = 'active' | 'completed' | 'archived';
export type DebtStatus = 'active' | 'paid_off' | 'archived';
export type SavingsReminderFrequency = 'daily' | 'weekly' | 'monthly';

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  startingAmount: number;
  savedAmount: number;
  targetDate: string;
  strategyId: SavingsStrategyId;
  notes: string;
  status: GoalStatus;
  reminderEnabled?: boolean;
  reminderFrequency?: SavingsReminderFrequency;
  reminderTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  notes: string;
  createdAt: string;
}

export interface DebtAccount {
  id: string;
  name: string;
  debtType: DebtType;
  originalBalance: number;
  currentBalance: number;
  apr: number | null;
  minimumPayment: number | null;
  dueDayOfMonth: number | null;
  notes: string;
  status: DebtStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  date: string;
  notes: string;
  isMinimumPayment: boolean;
  createdAt: string;
}

export interface StrategyDefinition {
  id: SavingsStrategyId;
  name: string;
  description: string;
  requiredInputs: string[];
  calculationDescription: string;
  limitations: string;
  disclaimer: string;
}

export interface UserPreferences {
  currency: Currency;
  defaultSavingsStrategy: SavingsStrategyId;
  defaultDebtStrategy: DebtStrategyId;
  lastExportDate: string | null;
}

export interface ExportRecord {
  id: string;
  exportType: 'json' | 'csv_savings' | 'csv_debts' | 'text_summary';
  createdAt: string;
  filename: string;
}

export interface AdState {
  lastInterstitialShownAt: number | null;
  interstitialShowCount: number;
  appOpenCount: number;
}

export interface ActivityItem {
  id: string;
  type:
    | 'contribution'
    | 'debt_payment'
    | 'goal_created'
    | 'debt_created'
    | 'goal_completed'
    | 'debt_paid_off';
  description: string;
  amount: number | null;
  date: string;
}

export interface DashboardStats {
  totalSaved: number;
  totalTarget: number;
  activeGoalsCount: number;
  totalDebt: number;
  totalOriginalDebt: number;
  totalDebtPaid: number;
  completedGoalsCount: number;
  recentActivity: ActivityItem[];
}

export interface SavingsCalculation {
  progressPercent: number;
  remainingAmount: number;
  requiredDailyContribution: number;
  requiredWeeklyContribution: number;
  requiredBiweeklyContribution: number;
  requiredMonthlyContribution: number;
  estimatedCompletionDate: string | null;
  daysRemaining: number | null;
  isOnTrack: boolean;
}

export interface DebtPayoffCalculation {
  debtId: string;
  estimatedPayoffDate: string | null;
  estimatedTotalInterest: number;
  estimatedTotalPaid: number;
  monthsToPayoff: number | null;
  payoffOrder: number;
}

export interface DebtStrategyResult {
  strategyId: DebtStrategyId;
  strategyName: string;
  debtOrder: DebtAccount[];
  totalInterest: number;
  totalPaid: number;
  estimatedPayoffDate: string | null;
  nextTargetDebt: DebtAccount | null;
  warnings: string[];
}

export interface WeeklyChallenge {
  week: number;
  amount: number;
  cumulativeAmount: number;
}

export type RootStackParamList = {
  MainTabs: undefined;
  AddSavingsGoal: undefined;
  EditSavingsGoal: { goalId: string };
  SavingsGoalDetail: { goalId: string };
  SavingsStrategy: undefined;
  AddDebt: undefined;
  EditDebt: { debtId: string };
  DebtDetail: { debtId: string };
  DebtStrategy: undefined;
  LogContribution: { goalId?: string };
  LogDebtPayment: { debtId?: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Savings: undefined;
  Debt: undefined;
  Insights: undefined;
  Settings: undefined;
};

export interface AppData {
  savingsGoals: SavingsGoal[];
  contributions: SavingsContribution[];
  debtAccounts: DebtAccount[];
  debtPayments: DebtPayment[];
  preferences: UserPreferences;
  adState: AdState;
  exportRecords: ExportRecord[];
}

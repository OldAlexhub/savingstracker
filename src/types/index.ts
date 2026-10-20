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
  themeMode: 'system' | 'light' | 'dark';
  dataCollectionAcceptedAt: string | null;
  dataDisclosureVersion: string | null;
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
  dailyInterstitialCount: number;
  dailyInterstitialDate: string | null;
}

export type AnalyticsEventName =
  | 'app_opened'
  | 'session_started'
  | 'screen_viewed'
  | 'onboarding_completed'
  | 'goal_created'
  | 'goal_updated'
  | 'goal_completed'
  | 'goal_archived'
  | 'goal_deleted'
  | 'contribution_logged'
  | 'contribution_deleted'
  | 'debt_created'
  | 'debt_updated'
  | 'debt_paid_off'
  | 'debt_archived'
  | 'debt_deleted'
  | 'payment_logged'
  | 'payment_deleted'
  | 'insight_viewed'
  | 'recommendation_accepted'
  | 'reminder_enabled'
  | 'ad_requested'
  | 'ad_impression'
  | 'ad_clicked'
  | 'ad_failed'
  | 'sync_failed'
  | 'export_completed';

export interface AnalyticsEvent {
  eventId: string;
  name: AnalyticsEventName;
  clientTimestamp: string;
  appVersion: string;
  screen?: string;
  properties?: Record<string, string | number | boolean | null>;
}

export interface SyncOutboxItem {
  id: string;
  kind: 'snapshot' | 'events';
  createdAt: string;
  attempts: number;
  nextAttemptAt: string;
  payload: Record<string, unknown>;
}

export interface GoalInsight {
  goalId: string;
  label: string;
  progressPercent: number;
  onTrackProbability: number;
  estimatedCompletionDate: string | null;
  estimatedRangeDays: number | null;
  risk: 'low' | 'medium' | 'high';
  explanation: string;
}

export interface DebtInsight {
  debtId: string;
  label: string;
  estimatedMonths: number | null;
  paymentConsistency: number;
  risk: 'low' | 'medium' | 'high';
  explanation: string;
}

export interface ServerInsights {
  generatedAt: string;
  estimated: true;
  engine: string;
  modelVersion: string;
  goals: GoalInsight[];
  debts: DebtInsight[];
  nextActions: Array<{
    id: string;
    title: string;
    reason: string;
    priority: number;
    recordId?: string;
  }>;
}

export interface RemoteConfig {
  configVersion: number;
  android: {
    latestVersionCode: number;
    minSupportedVersionCode: number;
    playStoreUrl: string;
  };
  ads: {
    minInterstitialGapMs: number;
    maxPerSession: number;
    maxPerDay: number;
    rewardedScenariosEnabled: boolean;
  };
  features: {
    serverInsights: boolean;
    whatIf: boolean;
    mlShadowMode: boolean;
  };
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

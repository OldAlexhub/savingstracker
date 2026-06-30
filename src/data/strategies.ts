import { StrategyDefinition, SavingsStrategyId } from '../types/index';

const DISCLAIMER =
  'This is an educational planning tool, not financial advice. Estimated results are based on your manual entries only.';

export const SAVINGS_STRATEGIES: StrategyDefinition[] = [
  {
    id: 'fixed_weekly' as SavingsStrategyId,
    name: 'Fixed Weekly Saving',
    description:
      'Save a consistent, predetermined amount every week. This strategy works well if you receive weekly income or want a simple, predictable routine. You decide the weekly amount and commit to depositing it on the same day each week.',
    requiredInputs: ['Goal name', 'Target amount', 'Weekly contribution amount', 'Target date'],
    calculationDescription:
      'Progress is tracked by comparing your logged contributions against your weekly target. The app calculates how many weeks remain to your target date and shows whether your current save rate is on track. Required weekly contribution = Remaining amount ÷ Weeks remaining.',
    limitations:
      'This strategy does not account for missed weeks, variable income, or interest earned on saved funds. All projections assume you contribute the same fixed amount every single week without interruption.',
    disclaimer: DISCLAIMER,
  },
  {
    id: 'fixed_monthly' as SavingsStrategyId,
    name: 'Fixed Monthly Saving',
    description:
      'Set aside a fixed dollar amount every month — on payday, the first of the month, or any recurring date that suits your schedule. This is one of the most straightforward saving strategies and is ideal for people paid monthly or bi-monthly.',
    requiredInputs: ['Goal name', 'Target amount', 'Monthly contribution amount', 'Target date'],
    calculationDescription:
      'The app calculates how many calendar months remain until your target date and divides the remaining balance by that number to show the required monthly contribution. Progress percent = (Amount saved ÷ Target amount) × 100.',
    limitations:
      'Assumes uniform 30-day months for calculations. Does not account for earned interest, fees, or months with varying numbers of days. All projections assume the same amount is saved every month.',
    disclaimer: DISCLAIMER,
  },
  {
    id: 'pay_yourself_first' as SavingsStrategyId,
    name: 'Pay Yourself First',
    description:
      'Before paying bills or discretionary spending, transfer a portion of your income directly to savings the moment you get paid. This "reverse budget" approach treats saving as a non-negotiable expense rather than what is left over at the end of the month.',
    requiredInputs: [
      'Goal name',
      'Target amount',
      'Estimated income amount',
      'Savings percentage or fixed amount per pay period',
      'Target date',
    ],
    calculationDescription:
      'You manually log each contribution after transferring it. The app tracks cumulative contributions against your target. Because contribution amounts may vary by pay period, the app uses the average of your logged contributions to project future progress.',
    limitations:
      'Manual tracking only — the app does not connect to bank accounts. Projections are based on the average of your past contributions. If income varies significantly, projections may be inaccurate.',
    disclaimer: DISCLAIMER,
  },
  {
    id: 'emergency_fund' as SavingsStrategyId,
    name: 'Emergency Fund Builder',
    description:
      'Build a financial safety net covering 3 to 6 months of essential living expenses. An emergency fund is the foundation of financial resilience, protecting you from unexpected events such as job loss, medical bills, or urgent car repairs without resorting to high-interest debt.',
    requiredInputs: [
      'Goal name',
      'Monthly essential expenses',
      'Number of months to cover (3–6 recommended)',
      'Current savings toward the fund',
      'Target date',
    ],
    calculationDescription:
      'Target amount = Monthly essential expenses × Number of months. The app then tracks your contributions against this target and shows daily, weekly, and monthly amounts required to reach it by your chosen date.',
    limitations:
      'Monthly expense figure must be entered manually and kept up to date. The app does not adjust automatically for inflation or changes in expenses. "Essential expenses" are self-defined by the user.',
    disclaimer: DISCLAIMER,
  },
  {
    id: 'sinking_fund' as SavingsStrategyId,
    name: 'Sinking Fund Planner',
    description:
      'Save incrementally for a specific, known future expense — such as a car, holiday, home appliance, or insurance premium — so that when the bill arrives, you already have the money set aside. A sinking fund eliminates the need to go into debt for predictable large expenses.',
    requiredInputs: [
      'Goal name',
      'Total cost of the future expense',
      'Target date (when the money is needed)',
      'Current amount already saved toward this expense',
    ],
    calculationDescription:
      'Remaining amount = Target amount − Amount already saved. Monthly contribution required = Remaining amount ÷ Months remaining. Weekly contribution = Remaining ÷ Weeks remaining. The app updates these figures as you log contributions.',
    limitations:
      'Does not account for price changes in the target expense over time. Assumes a fixed target amount. All calculations are linear and do not include savings account interest.',
    disclaimer: DISCLAIMER,
  },
  {
    id: 'challenge_52week' as SavingsStrategyId,
    name: '52-Week Savings Challenge',
    description:
      'A popular, graduated savings challenge: in Week 1 you save $1, in Week 2 you save $2, and so on up to $52 in Week 52. By the end of the year you will have accumulated $1,378. The gradually increasing amounts make it easier to build the habit in early weeks.',
    requiredInputs: ['Start date (to track which week you are on)', 'Currency (optional)'],
    calculationDescription:
      "Each week's target contribution equals the week number (Week n = $n). Cumulative total after n weeks = n × (n + 1) ÷ 2. The app displays the full 52-week schedule, highlights the current week, and tracks your logged contributions against the expected cumulative amount.",
    limitations:
      'The dollar amounts are fixed in the original challenge design (Week 1 = $1 through Week 52 = $52). If you use a different currency or want different amounts, use the Custom Plan strategy instead. The challenge does not generate interest earnings.',
    disclaimer: DISCLAIMER,
  },
  {
    id: 'reverse_52week' as SavingsStrategyId,
    name: 'Reverse 52-Week Challenge',
    description:
      'The same challenge as the standard 52-week version, but starting with $52 in Week 1 and descending to $1 in Week 52. This is easier to sustain because the hardest contributions come first, when motivation is highest, and the amounts decrease as the year progresses.',
    requiredInputs: ['Start date (to track which week you are on)', 'Currency (optional)'],
    calculationDescription:
      "Each week's contribution = 53 − week number (Week 1 = $52, Week 2 = $51, ..., Week 52 = $1). Total saved = $1,378. The app shows the full reverse schedule, the current week's target, and cumulative progress against logged contributions.",
    limitations:
      'Requires larger contributions early in the year. Total savings is the same as the standard challenge ($1,378). Does not account for interest. Best started at the beginning of a calendar year for easy tracking.',
    disclaimer: DISCLAIMER,
  },
  {
    id: 'envelope_buckets' as SavingsStrategyId,
    name: 'Envelope-Style Goal Buckets',
    description:
      'Divide your savings into labeled "envelopes" or buckets, each representing a different purpose — such as Vacation, New Phone, or Home Repairs. Each bucket is a separate savings goal within the app, giving you a clear picture of exactly what your money is earmarked for.',
    requiredInputs: [
      'Name and target amount for each bucket/envelope',
      'Individual target dates per bucket',
      'Contributions logged separately per bucket',
    ],
    calculationDescription:
      'Each envelope is tracked as an independent savings goal. The app shows individual progress for every bucket, the overall total saved across all buckets, and contribution history per bucket. No money is actually moved — this is a manual labeling and tracking system.',
    limitations:
      'Purely a local tracking and labeling tool. The app does not create real bank sub-accounts or move funds. All allocation is virtual. Users must manage the actual bank transfers themselves.',
    disclaimer: DISCLAIMER,
  },
  {
    id: 'no_spend_day' as SavingsStrategyId,
    name: 'No-Spend Day Tracker',
    description:
      'Commit to days where you make no non-essential purchases. Each no-spend day, log the amount you estimate you would have spent. Over time, these avoided expenses accumulate into real savings that you can transfer to a savings goal of your choice.',
    requiredInputs: [
      'Estimated daily spending amount you are avoiding',
      'No-spend days logged manually by date',
      'Target savings goal to apply the savings toward (optional)',
    ],
    calculationDescription:
      'Each logged no-spend day adds your estimated avoided spending to the cumulative total. The app tracks the number of no-spend days per week and month, total estimated savings, and a streak of consecutive no-spend days. Contributions must be manually transferred and logged.',
    limitations:
      'Savings figures are estimates based on self-reported avoided spending — they are not verified against actual bank transactions. The app does not deduct real purchases. Requires honest, consistent self-reporting for meaningful results.',
    disclaimer: DISCLAIMER,
  },
  {
    id: 'custom' as SavingsStrategyId,
    name: 'Custom Savings Plan',
    description:
      'Define your own savings schedule with any contribution frequency, amounts, and timeline that fit your unique situation. Use this strategy when the other presets do not match how you want to save — for example, irregular contributions, multiple income streams, or non-standard intervals.',
    requiredInputs: [
      'Goal name',
      'Target amount',
      'Target date',
      'Your own contribution schedule (you define frequency and amounts)',
      'Notes describing your plan',
    ],
    calculationDescription:
      'The app calculates progress based entirely on contributions you manually log. Required daily, weekly, bi-weekly, and monthly contributions are shown based on the remaining balance and days until your target date. No formula is imposed — you design the plan.',
    limitations:
      'No automated enforcement of a contribution schedule. Progress projections are based only on logged entries and remaining time. Users are responsible for defining and sticking to their own plan.',
    disclaimer: DISCLAIMER,
  },
];

export const DEBT_STRATEGY_NAMES: Record<string, string> = {
  avalanche: 'Debt Avalanche',
  snowball: 'Debt Snowball',
  hybrid: 'Hybrid (Quick Win + Avalanche)',
  equal_extra: 'Equal Extra Payment',
  custom_order: 'Custom Order',
};

export const DEBT_STRATEGY_DESCRIPTIONS: Record<string, string> = {
  avalanche:
    'Pay off the debt with the highest APR first while making minimum payments on all others. Estimated to minimize total interest paid over time.',
  snowball:
    'Pay off the smallest balance first while making minimum payments on all others. Provides quick wins to build momentum.',
  hybrid:
    'Pay off the smallest balance first for one quick win, then switch to the highest APR debt. Combines psychological motivation with interest efficiency.',
  equal_extra:
    'Distribute any extra payment equally across all active debts in addition to minimum payments.',
  custom_order:
    'Choose your own payoff order based on your priorities — due dates, emotional factors, or any other criteria.',
};

export function getStrategyById(id: SavingsStrategyId): StrategyDefinition | undefined {
  return SAVINGS_STRATEGIES.find(s => s.id === id);
}

export function getStrategyName(id: SavingsStrategyId): string {
  const strategy = getStrategyById(id);
  return strategy ? strategy.name : id;
}

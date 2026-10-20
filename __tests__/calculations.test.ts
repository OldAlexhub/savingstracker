import {
  calculate52WeekChallenge,
  calculateDebtAvalanche,
  calculateDebtPayoffMonths,
  calculateDebtSnowball,
  calculateEmergencyFundTarget,
  calculateTotalInterest,
} from '../src/utils/calculations';
import type {DebtAccount} from '../src/types';

function debt(id: string, balance: number, apr: number): DebtAccount {
  return {
    id,
    name: id,
    debtType: 'credit_card',
    originalBalance: balance,
    currentBalance: balance,
    apr,
    minimumPayment: 100,
    dueDayOfMonth: null,
    notes: '',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('deterministic financial calculations', () => {
  test('handles zero-interest payoff and impossible interest payments', () => {
    expect(calculateDebtPayoffMonths(1_000, 0, 100)).toBe(10);
    expect(calculateDebtPayoffMonths(10_000, 24, 100)).toBeNull();
    expect(calculateTotalInterest(1_000, 0, 100)).toBe(0);
  });

  test('orders snowball and avalanche strategies predictably', () => {
    const debts = [debt('large-high', 8_000, 22), debt('small-low', 500, 4)];
    expect(calculateDebtSnowball(debts).debtOrder[0].id).toBe('small-low');
    expect(calculateDebtAvalanche(debts).debtOrder[0].id).toBe('large-high');
  });

  test('keeps challenge and emergency-fund totals exact', () => {
    const challenge = calculate52WeekChallenge('2026-01-01');
    expect(challenge).toHaveLength(52);
    expect(challenge[51].cumulativeAmount).toBe(1_378);
    expect(calculateEmergencyFundTarget(2_500, 6)).toBe(15_000);
  });
});

import {
  validateAPR,
  validateDateString,
  validatePaymentAmount,
  validateTargetAmount,
} from '../src/utils/validators';

describe('finance input validation', () => {
  test('rejects impossible calendar dates', () => {
    expect(validateDateString('2026-02-31').valid).toBe(false);
    expect(validateDateString('2028-02-29').valid).toBe(true);
  });

  test('guards target amounts, APR, and implausible overpayments', () => {
    expect(validateTargetAmount('0').valid).toBe(false);
    expect(validateTargetAmount('12,500.50').valid).toBe(true);
    expect(validateAPR('100').valid).toBe(false);
    expect(validatePaymentAmount('2,000', 1_000).valid).toBe(false);
  });
});

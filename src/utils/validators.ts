export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ok(): ValidationResult {
  return { valid: true, error: null };
}

function fail(error: string): ValidationResult {
  return { valid: false, error };
}

function parsePositiveFloat(value: string): number | null {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const cleaned = value.trim().replace(/,/g, '');
  const n = parseFloat(cleaned);
  if (isNaN(n) || !isFinite(n)) {
    return null;
  }
  return n;
}

// ─── Goal Validators ──────────────────────────────────────────────────────────

export function validateGoalName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return fail('Goal name is required.');
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return fail('Goal name cannot be empty.');
  }
  if (trimmed.length < 2) {
    return fail('Goal name must be at least 2 characters.');
  }
  if (trimmed.length > 100) {
    return fail('Goal name cannot exceed 100 characters.');
  }
  return ok();
}

export function validateAmount(value: string, fieldName = 'Amount'): ValidationResult {
  if (!value || value.trim() === '') {
    return fail(`${fieldName} is required.`);
  }
  const n = parsePositiveFloat(value);
  if (n === null) {
    return fail(`${fieldName} must be a valid number.`);
  }
  if (n < 0) {
    return fail(`${fieldName} cannot be negative.`);
  }
  if (n > 999_999_999) {
    return fail(`${fieldName} seems too large. Please enter a realistic value.`);
  }
  return ok();
}

export function validateTargetAmount(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return fail('Target amount is required.');
  }
  const n = parsePositiveFloat(value);
  if (n === null) {
    return fail('Target amount must be a valid number.');
  }
  if (n <= 0) {
    return fail('Target amount must be greater than zero.');
  }
  if (n > 999_999_999) {
    return fail('Target amount seems too large. Please enter a realistic value.');
  }
  return ok();
}

export function validateStartingAmount(value: string, targetAmount: number): ValidationResult {
  if (!value || value.trim() === '') {
    return fail('Starting amount is required.');
  }
  const n = parsePositiveFloat(value);
  if (n === null) {
    return fail('Starting amount must be a valid number.');
  }
  if (n < 0) {
    return fail('Starting amount cannot be negative.');
  }
  if (isFinite(targetAmount) && targetAmount > 0 && n > targetAmount) {
    return fail('Starting amount cannot exceed the target amount.');
  }
  return ok();
}

export function validateSavedAmount(value: string, targetAmount: number): ValidationResult {
  if (!value || value.trim() === '') {
    return fail('Saved amount is required.');
  }
  const n = parsePositiveFloat(value);
  if (n === null) {
    return fail('Saved amount must be a valid number.');
  }
  if (n < 0) {
    return fail('Saved amount cannot be negative.');
  }
  if (isFinite(targetAmount) && targetAmount > 0 && n > targetAmount) {
    return fail('Saved amount cannot exceed the target amount.');
  }
  return ok();
}

export function validateTargetDate(dateStr: string): ValidationResult {
  if (!dateStr || dateStr.trim() === '') {
    return fail('Target date is required.');
  }
  const dateResult = validateDateString(dateStr);
  if (!dateResult.valid) {
    return dateResult;
  }
  const parsed = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsed <= today) {
    return fail('Target date must be a future date.');
  }
  return ok();
}

// ─── Debt Validators ──────────────────────────────────────────────────────────

export function validateDebtName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return fail('Debt name is required.');
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return fail('Debt name cannot be empty.');
  }
  if (trimmed.length < 2) {
    return fail('Debt name must be at least 2 characters.');
  }
  if (trimmed.length > 100) {
    return fail('Debt name cannot exceed 100 characters.');
  }
  return ok();
}

export function validateAPR(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return ok(); // APR is optional
  }
  const n = parsePositiveFloat(value);
  if (n === null) {
    return fail('APR must be a valid number.');
  }
  if (n < 0) {
    return fail('APR cannot be negative.');
  }
  if (n > 99.99) {
    return fail('APR cannot exceed 99.99%.');
  }
  return ok();
}

export function validateMinimumPayment(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return ok(); // Minimum payment is optional
  }
  const n = parsePositiveFloat(value);
  if (n === null) {
    return fail('Minimum payment must be a valid number.');
  }
  if (n < 0) {
    return fail('Minimum payment cannot be negative.');
  }
  if (n > 999_999_999) {
    return fail('Minimum payment seems too large.');
  }
  return ok();
}

export function validateBalance(value: string, fieldName = 'Balance'): ValidationResult {
  if (!value || value.trim() === '') {
    return fail(`${fieldName} is required.`);
  }
  const n = parsePositiveFloat(value);
  if (n === null) {
    return fail(`${fieldName} must be a valid number.`);
  }
  if (n < 0) {
    return fail(`${fieldName} cannot be negative.`);
  }
  if (n > 999_999_999) {
    return fail(`${fieldName} seems too large. Please enter a realistic value.`);
  }
  return ok();
}

export function validateDueDayOfMonth(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return ok(); // Due day is optional
  }
  const n = parsePositiveFloat(value);
  if (n === null || !Number.isInteger(n)) {
    return fail('Due day must be a whole number.');
  }
  if (n < 1 || n > 31) {
    return fail('Due day must be between 1 and 31.');
  }
  return ok();
}

// ─── Contribution / Payment Validators ───────────────────────────────────────

export function validateContributionAmount(
  value: string,
  goalRemaining: number,
): ValidationResult {
  if (!value || value.trim() === '') {
    return fail('Contribution amount is required.');
  }
  const n = parsePositiveFloat(value);
  if (n === null) {
    return fail('Contribution amount must be a valid number.');
  }
  if (n <= 0) {
    return fail('Contribution amount must be greater than zero.');
  }
  if (n > 999_999_999) {
    return fail('Contribution amount seems too large.');
  }
  // Warn if exceeds remaining — still allow it (overpayment/overshoot)
  if (isFinite(goalRemaining) && goalRemaining > 0 && n > goalRemaining * 2) {
    return fail(
      `Contribution of ${n.toFixed(2)} seems much larger than the remaining balance (${goalRemaining.toFixed(2)}). Please verify.`,
    );
  }
  return ok();
}

export function validatePaymentAmount(
  value: string,
  currentBalance: number,
): ValidationResult {
  if (!value || value.trim() === '') {
    return fail('Payment amount is required.');
  }
  const n = parsePositiveFloat(value);
  if (n === null) {
    return fail('Payment amount must be a valid number.');
  }
  if (n <= 0) {
    return fail('Payment amount must be greater than zero.');
  }
  if (n > 999_999_999) {
    return fail('Payment amount seems too large.');
  }
  // Warn if exceeds balance — still allow (might be final payoff with interest)
  if (isFinite(currentBalance) && currentBalance > 0 && n > currentBalance * 1.5) {
    return fail(
      `Payment of ${n.toFixed(2)} significantly exceeds the current balance (${currentBalance.toFixed(2)}). Please verify.`,
    );
  }
  return ok();
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export function validateNotes(notes: string): ValidationResult {
  if (!notes || typeof notes !== 'string') {
    return ok(); // Notes are optional
  }
  if (notes.length > 500) {
    return fail('Notes cannot exceed 500 characters.');
  }
  return ok();
}

// ─── Date ────────────────────────────────────────────────────────────────────

export function validateDateString(dateStr: string): ValidationResult {
  if (!dateStr || typeof dateStr !== 'string') {
    return fail('Date is required.');
  }
  const trimmed = dateStr.trim();
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(trimmed)) {
    return fail('Date must be in YYYY-MM-DD format.');
  }
  const d = new Date(`${trimmed}T00:00:00`);
  if (isNaN(d.getTime())) {
    return fail('Please enter a valid date.');
  }
  const [inputYear, inputMonth, inputDay] = trimmed.split('-').map(Number);
  if (
    d.getFullYear() !== inputYear ||
    d.getMonth() + 1 !== inputMonth ||
    d.getDate() !== inputDay
  ) {
    return fail('Please enter a valid date.');
  }
  const year = d.getFullYear();
  if (year < 2000 || year > 2200) {
    return fail('Please enter a realistic date.');
  }
  return ok();
}

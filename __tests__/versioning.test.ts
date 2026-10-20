import {isAndroidUpdateRequired} from '../src/utils/versioning';

describe('Android update gate', () => {
  it('opens only after the supported threshold moves past the installed build', () => {
    expect(isAndroidUpdateRequired(1, 1)).toBe(false);
    expect(isAndroidUpdateRequired(1, 2)).toBe(true);
    expect(isAndroidUpdateRequired(2, 2)).toBe(false);
  });

  it('fails open for malformed version metadata', () => {
    expect(isAndroidUpdateRequired(Number.NaN, 2)).toBe(false);
    expect(isAndroidUpdateRequired(2, Number.NaN)).toBe(false);
  });
});

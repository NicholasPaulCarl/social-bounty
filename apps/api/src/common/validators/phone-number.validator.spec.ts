import { isValidPhoneE164 } from './phone-number.validator';

describe('isValidPhoneE164', () => {
  // ── valid numbers ─────────────────────────────────────────────────────────

  it('accepts a valid ZA number with default region', () => {
    expect(isValidPhoneE164('+27814871705')).toBe(true);
  });

  it('accepts a valid ZA number with explicit region ZA', () => {
    expect(isValidPhoneE164('+27814871705', 'ZA')).toBe(true);
  });

  it('accepts a valid GB number with region GB', () => {
    expect(isValidPhoneE164('+447911123456', 'GB')).toBe(true);
  });

  it('accepts a formatted number with spaces (libphonenumber normalises)', () => {
    // libphonenumber-js accepts formatted input and normalises internally
    expect(isValidPhoneE164('+27 81 487 1705')).toBe(true);
  });

  // ── invalid / edge-case inputs ────────────────────────────────────────────

  it('rejects a non-phone string', () => {
    expect(isValidPhoneE164('not-a-phone')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidPhoneE164('')).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidPhoneE164(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isValidPhoneE164(undefined)).toBe(false);
  });

  it('rejects a number that is too short and has no country code', () => {
    expect(isValidPhoneE164('12345')).toBe(false);
  });

  it('rejects a numeric (non-string) input', () => {
    expect(isValidPhoneE164(27814871705)).toBe(false);
  });
});

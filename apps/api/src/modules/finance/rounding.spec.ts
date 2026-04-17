import { feeCents, halfEven } from './rounding';

describe('halfEven (banker\'s rounding)', () => {
  it('rounds exact halves to the nearest even integer', () => {
    expect(halfEven(1n, 2n)).toBe(0n); // 0.5 -> 0
    expect(halfEven(3n, 2n)).toBe(2n); // 1.5 -> 2
    expect(halfEven(5n, 2n)).toBe(2n); // 2.5 -> 2
    expect(halfEven(7n, 2n)).toBe(4n); // 3.5 -> 4
    expect(halfEven(9n, 2n)).toBe(4n); // 4.5 -> 4
  });

  it('rounds non-halves normally (down if <0.5, up if >0.5)', () => {
    expect(halfEven(1n, 4n)).toBe(0n); // 0.25 -> 0
    expect(halfEven(3n, 4n)).toBe(1n); // 0.75 -> 1
    expect(halfEven(5n, 4n)).toBe(1n); // 1.25 -> 1
    expect(halfEven(7n, 4n)).toBe(2n); // 1.75 -> 2
  });

  it('handles exact divisions without rounding', () => {
    expect(halfEven(100n, 10n)).toBe(10n);
    expect(halfEven(0n, 1n)).toBe(0n);
  });

  it('rejects non-positive denominator', () => {
    expect(() => halfEven(10n, 0n)).toThrow('denominator must be positive');
    expect(() => halfEven(10n, -1n)).toThrow('denominator must be positive');
  });

  it('rejects negative numerator (signs carry on ledger type, not amount)', () => {
    expect(() => halfEven(-1n, 2n)).toThrow('numerator must be non-negative');
  });
});

describe('feeCents', () => {
  it('computes bps fees with banker\'s rounding', () => {
    // 100 cents * 150 bps = 1.5 cents -> 2 (banker's: rounds to even)
    expect(feeCents(100n, 150)).toBe(2n);
    // 100 cents * 250 bps = 2.5 cents -> 2 (banker's)
    expect(feeCents(100n, 250)).toBe(2n);
    // 100 cents * 350 bps = 3.5 cents -> 4 (banker's)
    expect(feeCents(100n, 350)).toBe(4n);
  });

  it('computes the canonical tier fees on a round amount', () => {
    // R500 = 50_000 cents
    expect(feeCents(50_000n, 1500)).toBe(7_500n); // Brand Free admin 15%
    expect(feeCents(50_000n, 500)).toBe(2_500n); // Brand Pro admin 5%
    expect(feeCents(50_000n, 2000)).toBe(10_000n); // Hunter Free commission 20%
    expect(feeCents(50_000n, 1000)).toBe(5_000n); // Hunter Pro commission 10%
    expect(feeCents(50_000n, 350)).toBe(1_750n); // Global fee 3.5%
  });

  it('rejects invalid rates', () => {
    expect(() => feeCents(100n, -1)).toThrow('non-negative integer');
    expect(() => feeCents(100n, 1.5)).toThrow('non-negative integer');
  });
});

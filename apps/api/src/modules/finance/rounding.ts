// Integer banker's rounding (IEEE 754 round-half-to-even) for ledger arithmetic.
// All amounts are integer minor units (cents); no floats anywhere in the fee path.

export function halfEven(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) {
    throw new Error('halfEven: denominator must be positive');
  }
  if (numerator < 0n) {
    throw new Error('halfEven: numerator must be non-negative (signs carry on type, not amount)');
  }
  const quotient = numerator / denominator;
  const remainderX2 = (numerator % denominator) * 2n;
  if (remainderX2 < denominator) return quotient;
  if (remainderX2 > denominator) return quotient + 1n;
  // exact half — round to even
  return quotient % 2n === 0n ? quotient : quotient + 1n;
}

export function feeCents(amountCents: bigint, rateBps: number): bigint {
  if (!Number.isInteger(rateBps) || rateBps < 0) {
    throw new Error('feeCents: rateBps must be a non-negative integer');
  }
  return halfEven(amountCents * BigInt(rateBps), 10_000n);
}

// Fixed-point decimal helpers for monetary calculations.
// Values are kept at six decimal places internally and are only rounded at
// display/export boundaries. This avoids using binary floating point for the
// arithmetic that determines estimate totals.

export const INTERNAL_SCALE = 1_000_000n;

function divRound(numerator, denominator) {
  if (denominator === 0n) throw new Error("Cannot divide by zero");
  const sign = numerator < 0n === denominator < 0n ? 1n : -1n;
  const n = numerator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  const quotient = n / d;
  const remainder = n % d;
  const rounded = remainder * 2n >= d ? quotient + 1n : quotient;
  return sign * rounded;
}

function parseScaled(value) {
  if (value instanceof FixedDecimal) return value.units;
  const text = String(value ?? "0").trim().replace(/,/g, "");
  if (!text) return 0n;
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) return 0n;
  const [mantissa, exponentText] = text.toLowerCase().split("e");
  const exponent = Number(exponentText || 0);
  const negative = mantissa.startsWith("-");
  const unsigned = mantissa.replace(/^[+-]/, "");
  const [whole, fraction = ""] = unsigned.split(".");
  const digits = BigInt(`${whole || "0"}${fraction}` || "0");
  const decimalPlaces = fraction.length - exponent;
  let scaled;
  if (decimalPlaces <= 6) scaled = digits * 10n ** BigInt(6 - decimalPlaces);
  else scaled = divRound(digits, 10n ** BigInt(decimalPlaces - 6));
  return negative ? -scaled : scaled;
}

export class FixedDecimal {
  constructor(units) { this.units = BigInt(units); }
  static from(value) { return new FixedDecimal(parseScaled(value)); }
  add(value) { return new FixedDecimal(this.units + FixedDecimal.from(value).units); }
  sub(value) { return new FixedDecimal(this.units - FixedDecimal.from(value).units); }
  mul(value) { return new FixedDecimal(divRound(this.units * FixedDecimal.from(value).units, INTERNAL_SCALE)); }
  div(value) { return new FixedDecimal(divRound(this.units * INTERNAL_SCALE, FixedDecimal.from(value).units)); }
  abs() { return new FixedDecimal(this.units < 0n ? -this.units : this.units); }
  isZero() { return this.units === 0n; }
  toNumber() { return Number(this.units) / Number(INTERNAL_SCALE); }
  toString(digits = 6) {
    const negative = this.units < 0n;
    const absolute = negative ? -this.units : this.units;
    const whole = absolute / INTERNAL_SCALE;
    const fraction = (absolute % INTERNAL_SCALE).toString().padStart(6, "0").slice(0, digits).replace(/0+$/, "");
    return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
  }
}

export function moneyAdd(...values) { return values.reduce((sum, value) => sum.add(value), FixedDecimal.from(0)); }
export function moneyRound(value, digits = 2) {
  const decimal = FixedDecimal.from(value);
  const places = Math.max(0, Math.min(6, Number(digits) || 0));
  const unit = 10n ** BigInt(6 - places);
  return new FixedDecimal(divRound(decimal.units, unit) * unit);
}
export function moneyString(value, digits = 2) { return moneyRound(value, digits).toString(digits); }


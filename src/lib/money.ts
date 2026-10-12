/**
 * Money utilities for FOCUS OS.
 * Money is stored as whole rupees as integers.
 * Displayed with Intl.NumberFormat en-IN.
 */

const rupeeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatRupees(amountInRupees: number): string {
  return rupeeFormatter.format(Math.round(amountInRupees));
}

import { describe, it, expect } from 'vitest';
import { formatRupees } from '@/lib/money';

describe('money utility', () => {
  it('formats whole rupees according to en-IN locale', () => {
    const formatted = formatRupees(1500);
    // en-IN format includes rupee symbol and Indian numbering formatting
    expect(formatted).toContain('1,500');
    expect(formatted).toMatch(/₹|Rs/);
  });

  it('rounds amounts to whole rupees', () => {
    const formatted = formatRupees(2999.8);
    expect(formatted).toContain('3,000');
  });
});

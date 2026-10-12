import { describe, it, expect } from 'vitest';

describe('P0 Baseline Unit Test', () => {
  it('runs unit tests in strict TypeScript environment', () => {
    const sum = (a: number, b: number): number => a + b;
    expect(sum(2, 3)).toBe(5);
  });
});

import { describe, it, expect } from 'vitest';

function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return [r, g, b];
}

function sRgbLuminance(c: number): number {
  const norm = c / 255;
  return norm <= 0.04045 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * sRgbLuminance(r) + 0.7152 * sRgbLuminance(g) + 0.0722 * sRgbLuminance(b);
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Design Tokens Contrast Verification', () => {
  const bg = '#000000';
  const surface = '#0E0E10';
  const surface2 = '#161618';

  const text1 = '#F5F5F7';
  const text2 = '#B4B4B8';
  const text3 = '#8E8E93';

  it('verifies text tokens against pure black background have WCAG AA contrast (>= 4.5)', () => {
    const ratio1 = getContrastRatio(text1, bg);
    const ratio2 = getContrastRatio(text2, bg);
    const ratio3 = getContrastRatio(text3, bg);

    expect(ratio1).toBeGreaterThanOrEqual(15);
    expect(ratio2).toBeGreaterThanOrEqual(8.5);
    // Spec states: --text-3 is lowest allowed, about 6.4 to 1 contrast
    expect(ratio3).toBeGreaterThanOrEqual(6.0);
  });

  it('verifies text tokens against surface (#0E0E10) have WCAG AA contrast (>= 4.5)', () => {
    const ratio1 = getContrastRatio(text1, surface);
    const ratio2 = getContrastRatio(text2, surface);
    const ratio3 = getContrastRatio(text3, surface);

    expect(ratio1).toBeGreaterThanOrEqual(14);
    expect(ratio2).toBeGreaterThanOrEqual(8);
    expect(ratio3).toBeGreaterThanOrEqual(5.8);
  });

  it('verifies text tokens against surface-2 (#161618) have WCAG AA contrast (>= 4.5)', () => {
    const ratio1 = getContrastRatio(text1, surface2);
    const ratio2 = getContrastRatio(text2, surface2);
    const ratio3 = getContrastRatio(text3, surface2);

    expect(ratio1).toBeGreaterThanOrEqual(13);
    expect(ratio2).toBeGreaterThanOrEqual(7.5);
    expect(ratio3).toBeGreaterThanOrEqual(5.5);
  });
});

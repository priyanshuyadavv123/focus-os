import { describe, it, expect } from 'vitest';
import { validateImportJson } from '@/lib/validate';
import { INITIAL_DATA } from '@/lib/storage';

describe('validate utility', () => {
  it('accepts valid schemaVersion 1 data', () => {
    const raw = JSON.stringify(INITIAL_DATA);
    const result = validateImportJson(raw);
    expect(result.valid).toBe(true);
    expect(result.counts?.tasks).toBe(0);
  });

  it('rejects malformed JSON', () => {
    const result = validateImportJson('{ broken json');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Malformed JSON syntax');
  });

  it('rejects payload exceeding 2 MB', () => {
    const hugeString = 'a'.repeat(2 * 1024 * 1024 + 10);
    const result = validateImportJson(hugeString);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('File size exceeds 2 MB limit');
  });

  it('rejects prototype pollution keys', () => {
    const maliciousJson = '{"schemaVersion": 1, "__proto__": { "polluted": true }}';
    const result = validateImportJson(maliciousJson);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Forbidden key detected: __proto__');
  });

  it('rejects unknown top-level keys', () => {
    const unknownKeyJson = JSON.stringify({
      ...INITIAL_DATA,
      unknownKey: 'surprise',
    });
    const result = validateImportJson(unknownKeyJson);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Unknown top-level key: unknownKey');
  });

  it('rejects unknown schema version', () => {
    const oldVersionJson = JSON.stringify({
      ...INITIAL_DATA,
      schemaVersion: 2,
    });
    const result = validateImportJson(oldVersionJson);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Unsupported schema version: 2');
  });
});

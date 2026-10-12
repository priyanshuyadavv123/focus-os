import { describe, it, expect } from 'vitest';
import { parseHash } from '@/app/routes';

describe('hash route parser', () => {
  it('parses empty, root hash, and #/overview as overview', () => {
    expect(parseHash('')).toBe('overview');
    expect(parseHash('#')).toBe('overview');
    expect(parseHash('#/')).toBe('overview');
    expect(parseHash('#/overview')).toBe('overview');
  });

  it('parses each of the 8 canonical routes correctly', () => {
    expect(parseHash('#/timer')).toBe('timer');
    expect(parseHash('#/roadmap')).toBe('roadmap');
    expect(parseHash('#/projects')).toBe('projects');
    expect(parseHash('#/revenue')).toBe('revenue');
    expect(parseHash('#/research')).toBe('research');
    expect(parseHash('#/analytics')).toBe('analytics');
    expect(parseHash('#/settings')).toBe('settings');
  });

  it('returns 404 for unknown routes', () => {
    expect(parseHash('#/unknown')).toBe('404');
    expect(parseHash('#/dashboard/tasks')).toBe('404');
    expect(parseHash('#random')).toBe('404');
  });
});

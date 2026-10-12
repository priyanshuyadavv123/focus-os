import { describe, it, expect } from 'vitest';
import { calculateOpportunityScore } from '@/features/revenue/score';
import { Prospect } from '@/lib/storage';

describe('pure opportunity score calculation', () => {
  it('returns 0 with No evidence yet when prospect is empty', () => {
    const emptyProspect: Prospect = {
      id: 'p-1',
      businessName: 'Local Shop',
      websiteUrl: '',
      stage: 'research',
      observations: [],
      proposedSolution: '',
      effortHours: 0,
      priceRupees: 2000,
      notes: '',
    };

    const res = calculateOpportunityScore(emptyProspect);
    expect(res.score).toBe(0);
    expect(res.evidenceText).toBe('No evidence yet');
  });

  it('awards points according to criteria weighting', () => {
    const qualifiedProspect: Prospect = {
      id: 'p-2',
      businessName: 'City Clinic',
      websiteUrl: 'https://example.com', // +15
      stage: 'research',
      observations: [
        {
          text: 'Slow mobile load time and broken contact form',
          tag: 'fact',
          source: 'User manual check on Safari iOS',
        }, // +35
      ],
      proposedSolution: 'Fix contact form and optimize hero image', // +30
      effortHours: 4, // <= 6 -> +20
      priceRupees: 2500,
      notes: '',
    };

    const res = calculateOpportunityScore(qualifiedProspect);
    expect(res.score).toBe(100);
    expect(res.evidenceText).toBe('Evidence recorded');
    expect(res.reasons.length).toBe(4);
  });
});

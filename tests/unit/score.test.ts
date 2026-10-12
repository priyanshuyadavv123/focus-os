import { describe, it, expect } from 'vitest';
import { calculateOpportunityScore } from '@/features/revenue/score';
import { Prospect } from '@/lib/storage';

describe('Pure Revenue Opportunity Scoring', () => {
  const baseProspect: Prospect = {
    id: 'p-1',
    businessName: 'Local Bakery',
    websiteUrl: '',
    stage: 'research',
    observations: [],
    proposedSolution: '',
    effortHours: 0,
    priceRupees: 2000,
    notes: '',
  };

  it('returns 0 points and displays "No evidence yet" when observations are empty', () => {
    const result = calculateOpportunityScore(baseProspect);
    expect(result.totalScore).toBe(0);
    expect(result.evidenceSummary).toBe('No evidence yet');
    expect(result.reasons).toEqual([]);
  });

  it('calculates score breakdown correctly as evidence criteria are added', () => {
    const prospectWithEvidence: Prospect = {
      ...baseProspect,
      websiteUrl: 'https://localbakery.in', // +15
      observations: [
        {
          text: 'Hero image unoptimized (6MB download) causing 7s initial load',
          tag: 'fact',
          source: 'Manual check via Chrome Network DevTools on mobile throttled',
        }, // +35
      ],
      proposedSolution: 'Compress images to WebP and add modern responsive srcset', // +30
      effortHours: 3.5, // <= 6h -> +20
    };

    const result = calculateOpportunityScore(prospectWithEvidence);
    expect(result.totalScore).toBe(100);
    expect(result.evidenceSummary).toBe('Evidence recorded');
    expect(result.reasons.length).toBe(4);
  });

  it('supports custom weights if weights are edited by user', () => {
    const prospect: Prospect = {
      ...baseProspect,
      websiteUrl: 'https://example.com',
    };

    const customWeights = {
      evidenceWithSource: 40,
      clearContactRoute: 20,
      fitsInitialOffer: 25,
      effortWithinSixHours: 15,
    };

    const result = calculateOpportunityScore(prospect, customWeights);
    expect(result.totalScore).toBe(20);
  });
});

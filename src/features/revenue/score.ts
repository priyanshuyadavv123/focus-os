/**
 * Pure Opportunity Score logic for FOCUS OS Revenue Lab.
 * Must NOT import React.
 * Calculates score from 0 to 100 based on verified user inputs.
 */

import { Prospect } from '@/lib/storage';

export interface ScoreBreakdown {
  score: number;
  reasons: string[];
  evidenceText: string;
}

export function calculateOpportunityScore(prospect: Prospect): ScoreBreakdown {
  let score = 0;
  const reasons: string[] = [];

  const hasEvidence = prospect.observations.some(
    (obs) => obs.text.trim().length > 0 && obs.source.trim().length > 0
  );

  if (hasEvidence) {
    score += 35;
    reasons.push('Problem evidence with recorded source (+35)');
  }

  // Clear contact route
  if (prospect.websiteUrl.trim().length > 0) {
    score += 15;
    reasons.push('Clear public contact route (+15)');
  }

  // Small local business fit
  if (prospect.proposedSolution.trim().length > 0) {
    score += 30;
    reasons.push('Fits core initial service scope (+30)');
  }

  // Effort within 6 hours
  if (prospect.effortHours > 0 && prospect.effortHours <= 6) {
    score += 20;
    reasons.push('Estimated effort within 6 hours (+20)');
  }

  return {
    score,
    reasons,
    evidenceText: hasEvidence ? 'Evidence recorded' : 'No evidence yet',
  };
}

/**
 * Pure Opportunity Score logic for FOCUS OS Revenue Lab.
 * Must NOT import React.
 * Calculates score from 0 to 100 based strictly on user-recorded evidence.
 * A score is a prioritization aid, never proof of demand.
 */

import { Prospect } from '@/lib/storage';

export interface ScoreWeights {
  evidenceWithSource: number; // default 35
  clearContactRoute: number; // default 15
  fitsInitialOffer: number; // default 30
  effortWithinSixHours: number; // default 20
}

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  evidenceWithSource: 35,
  clearContactRoute: 15,
  fitsInitialOffer: 30,
  effortWithinSixHours: 20,
};

export interface ScoreBreakdown {
  totalScore: number;
  reasons: string[];
  evidenceSummary: string;
}

export function calculateOpportunityScore(
  prospect: Prospect,
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS
): ScoreBreakdown {
  let score = 0;
  const reasons: string[] = [];

  // 1. Written problem evidence with recorded source
  const validObservations = prospect.observations.filter(
    (obs) => obs.text.trim().length > 0 && obs.source.trim().length > 0
  );

  if (validObservations.length > 0) {
    score += weights.evidenceWithSource;
    reasons.push(
      `Written problem evidence with source recorded (+${weights.evidenceWithSource} pts)`
    );
  }

  // 2. Clear public contact route
  if (prospect.websiteUrl.trim().length > 0) {
    score += weights.clearContactRoute;
    reasons.push(
      `Clear public website / contact route (+${weights.clearContactRoute} pts)`
    );
  }

  // 3. Small local business whose site fits first offer
  if (prospect.proposedSolution.trim().length > 0) {
    score += weights.fitsInitialOffer;
    reasons.push(
      `Identified fit for initial website fix offer (+${weights.fitsInitialOffer} pts)`
    );
  }

  // 4. Estimated effort within six hours
  if (prospect.effortHours > 0 && prospect.effortHours <= 6) {
    score += weights.effortWithinSixHours;
    reasons.push(
      `Estimated effort within 6 hours (${prospect.effortHours}h) (+${weights.effortWithinSixHours} pts)`
    );
  }

  return {
    totalScore: score,
    reasons,
    evidenceSummary: validObservations.length > 0 ? 'Evidence recorded' : 'No evidence yet',
  };
}

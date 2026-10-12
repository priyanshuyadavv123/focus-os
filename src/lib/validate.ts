/**
 * Validation utilities for FOCUS OS imports and data integrity.
 * Strictly hand-written, rejecting prototype pollution keys and unknown top-level keys.
 */

import { FocusOSData } from './storage';

export const MAX_IMPORT_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const ALLOWED_ROOT_KEYS = new Set([
  'schemaVersion',
  'tasks',
  'sessions',
  'projects',
  'prospects',
  'revenueEntries',
  'milestones',
  'researchNotes',
  'hermesItems',
  'weeklyReviews',
  'settings',
]);

export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: FocusOSData;
  counts?: {
    tasks: number;
    sessions: number;
    projects: number;
    prospects: number;
    revenueEntries: number;
    milestones: number;
    researchNotes: number;
    hermesItems: number;
    weeklyReviews: number;
  };
}

export function validateImportJson(rawText: string): ValidationResult {
  if (rawText.length > MAX_IMPORT_SIZE_BYTES) {
    return { valid: false, error: 'File size exceeds 2 MB limit' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { valid: false, error: 'Malformed JSON syntax' };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { valid: false, error: 'Root element must be an object' };
  }

  const obj = parsed as Record<string, unknown>;

  // Check for forbidden prototype pollution keys & unknown top-level keys
  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_KEYS.has(key)) {
      return { valid: false, error: `Forbidden key detected: ${key}` };
    }
    if (!ALLOWED_ROOT_KEYS.has(key)) {
      return { valid: false, error: `Unknown top-level key: ${key}` };
    }
  }

  if (obj['schemaVersion'] !== 1) {
    return { valid: false, error: `Unsupported schema version: ${String(obj['schemaVersion'])}` };
  }

  // Validate presence and types of top-level collections
  const arrayKeys = [
    'tasks',
    'sessions',
    'projects',
    'prospects',
    'revenueEntries',
    'milestones',
    'researchNotes',
    'hermesItems',
    'weeklyReviews',
  ] as const;

  for (const k of arrayKeys) {
    if (!Array.isArray(obj[k])) {
      return { valid: false, error: `Field '${k}' must be an array` };
    }
  }

  if (typeof obj['settings'] !== 'object' || obj['settings'] === null) {
    return { valid: false, error: "Field 'settings' must be an object" };
  }

  const data = parsed as FocusOSData;
  return {
    valid: true,
    data,
    counts: {
      tasks: data.tasks.length,
      sessions: data.sessions.length,
      projects: data.projects.length,
      prospects: data.prospects.length,
      revenueEntries: data.revenueEntries.length,
      milestones: data.milestones.length,
      researchNotes: data.researchNotes.length,
      hermesItems: data.hermesItems.length,
      weeklyReviews: data.weeklyReviews.length,
    },
  };
}

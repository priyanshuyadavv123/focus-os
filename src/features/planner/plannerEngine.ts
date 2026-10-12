/**
 * Pure Daily Planner Engine for FOCUS OS.
 * Must NOT import React.
 * Calculates back-to-back block schedules, templates, and budget constraints.
 */

export type PlannerTemplateType = 'default' | 'exam' | 'weekend';

export interface PlannerBlock {
  id: string;
  name: string;
  area: 'engineering' | 'business' | 'research' | 'health' | 'protected';
  minutes: number;
  isProtected?: boolean; // Protected time sits outside 180m budget
  startMinutesFromMidnight?: number;
  endMinutesFromMidnight?: number;
}

export const TEMPLATES: Record<PlannerTemplateType, PlannerBlock[]> = {
  default: [
    { id: 'b-eng', name: 'Engineering Fundamentals', area: 'engineering', minutes: 50 },
    { id: 'b-proj', name: 'Core Project Build', area: 'engineering', minutes: 70 },
    { id: 'b-biz', name: 'Business & Customer Outreach', area: 'business', minutes: 30 },
    { id: 'b-res', name: 'Research Notebook', area: 'research', minutes: 20 },
    { id: 'b-rev', name: 'Daily Review & Log', area: 'engineering', minutes: 10 },
  ],
  exam: [
    { id: 'b-exam-prep', name: 'Exam & Academic Prep', area: 'engineering', minutes: 120 },
    { id: 'b-exam-rev', name: 'Engineering Practice', area: 'engineering', minutes: 40 },
    { id: 'b-exam-rest', name: 'Review & Synthesis', area: 'engineering', minutes: 20 },
  ],
  weekend: [
    { id: 'b-wknd-proj', name: 'Deep Project Sprint', area: 'engineering', minutes: 90 },
    { id: 'b-wknd-res', name: 'Research & Exploration', area: 'research', minutes: 60 },
    { id: 'b-wknd-syn', name: 'Weekly Synthesis', area: 'engineering', minutes: 30 },
  ],
};

export const PROTECTED_TIME_DEFAULTS: PlannerBlock[] = [
  { id: 'prot-sleep', name: 'Sleep & Recovery', area: 'protected', minutes: 480, isProtected: true },
  { id: 'prot-classes', name: 'University Classes & Labs', area: 'protected', minutes: 360, isProtected: true },
  { id: 'prot-personal', name: 'Personal, Meals & Commute', area: 'protected', minutes: 180, isProtected: true },
];

export function calculateBackToBackTimeline(
  blocks: PlannerBlock[],
  startMinutesFromMidnight: number = 9 * 60 // 09:00 AM default
): PlannerBlock[] {
  let currentCursor = startMinutesFromMidnight;

  return blocks.map((block) => {
    const start = currentCursor;
    const end = currentCursor + block.minutes;
    currentCursor = end; // Runs back to back, preventing any overlaps

    return {
      ...block,
      startMinutesFromMidnight: start,
      endMinutesFromMidnight: end,
    };
  });
}

export function formatTimeFromMinutes(minutesFromMidnight: number): string {
  const normalized = minutesFromMidnight % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function calculateBudgetMinutes(blocks: PlannerBlock[]): number {
  return blocks
    .filter((b) => !b.isProtected)
    .reduce((sum, b) => sum + b.minutes, 0);
}

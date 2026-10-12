/**
 * Pure Roadmap logic for FOCUS OS.
 * Must NOT import React.
 * A milestone completes only when all its criteria are checked.
 */

export interface RoadmapCriterion {
  id: string;
  text: string;
  done: boolean;
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  targetDate: string;
  criteria: RoadmapCriterion[];
}

export interface RoadmapSemester {
  id: string;
  number: number;
  year: number;
  title: string;
  focus: string;
  goals: string[];
  milestones: RoadmapMilestone[];
  summerTarget: string;
}

export function isMilestoneComplete(criteria: RoadmapCriterion[]): boolean {
  if (criteria.length === 0) return false;
  return criteria.every((c) => c.done === true);
}

export function calculateSemesterProgress(semester: RoadmapSemester): {
  completedMilestones: number;
  totalMilestones: number;
  percentage: number;
} {
  const total = semester.milestones.length;
  if (total === 0) return { completedMilestones: 0, totalMilestones: 0, percentage: 0 };

  const completed = semester.milestones.filter((m) => isMilestoneComplete(m.criteria)).length;
  return {
    completedMilestones: completed,
    totalMilestones: total,
    percentage: Math.round((completed / total) * 100),
  };
}

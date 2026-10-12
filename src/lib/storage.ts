/**
 * Storage module for FOCUS OS.
 * Reads and writes localStorage. Data is JSON with schemaVersion 1.
 * If data is corrupted, moves it to a timestamped backup key, starts clean, and reports.
 */

export const STORAGE_KEY = 'focus_os_data';
export const CURRENT_SCHEMA_VERSION = 1;

export interface Task {
  id: string;
  title: string;
  area: 'engineering' | 'business' | 'research' | 'health';
  plannedMinutes: number;
  scheduledDate: string; // YYYY-MM-DD
  priority: 1 | 2 | 3;
  status: 'todo' | 'done' | 'deferred';
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FocusSegment {
  startMs: number;
  endMs: number;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  kind: 'focus' | 'shortBreak' | 'longBreak';
  plannedSeconds: number;
  segments: FocusSegment[];
  status: 'running' | 'paused' | 'completed' | 'ended_early' | 'interrupted' | 'restarted';
  lastSeenAt: number;
  completedAt?: number;
}

export interface Project {
  id: string;
  name: string;
  purpose: string;
  status: string;
  priority: number;
  deadline?: string;
  nextAction: string;
  githubUrl?: string;
  deployUrl?: string;
  notes: string;
}

export interface ProspectObservation {
  text: string;
  tag: 'fact' | 'inference' | 'hypothesis' | 'unknown';
  source: string;
}

export interface Prospect {
  id: string;
  businessName: string;
  websiteUrl: string;
  stage: string;
  observations: ProspectObservation[];
  proposedSolution: string;
  effortHours: number;
  priceRupees: number;
  nextFollowUp?: string;
  outcome?: string;
  notes: string;
}

export interface RevenueEntry {
  id: string;
  date: string;
  prospectId?: string;
  amountRupees: number;
  costRupees: number;
  note: string;
}

export interface Milestone {
  id: string;
  semester: string;
  title: string;
  criteria: { id: string; text: string; done: boolean }[];
  completed: boolean;
  targetDate: string;
  completedAt?: string;
}

export interface ResearchNote {
  id: string;
  question: string;
  status: 'idea' | 'planned' | 'running' | 'done' | 'abandoned';
  sources: { title: string; url: string }[];
  hypothesis: string;
  method: string;
  datasetAndPermissions: string;
  baseline: string;
  metrics: string;
  results: string;
  limitations: string;
  nextExperiment: string;
}

export interface HermesItem {
  id: string;
  title: string;
  observedProblem: string;
  evidence: string;
  proposedChange: string;
  acceptanceCriteria: string;
  testsRequired: string;
  status: 'idea' | 'approved' | 'in_progress' | 'done' | 'rejected';
  outcome?: string;
}

export interface WeeklyReview {
  id: string;
  weekStartDate: string;
  completed: string;
  learned: string;
  shipped: string;
  customerEvidence: string;
  didNotWork: string;
  shouldStop: string;
  outcomesNextWeek: [string, string, string];
  createdAt: string;
}

export interface Settings {
  dailyBudgetMinutes: number;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakEvery: number;
  soundOn: boolean;
  notificationsOn: boolean;
  showClock: boolean;
}

export interface FocusOSData {
  schemaVersion: 1;
  tasks: Task[];
  sessions: FocusSession[];
  projects: Project[];
  prospects: Prospect[];
  revenueEntries: RevenueEntry[];
  milestones: Milestone[];
  researchNotes: ResearchNote[];
  hermesItems: HermesItem[];
  weeklyReviews: WeeklyReview[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  dailyBudgetMinutes: 180,
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
  soundOn: false,
  notificationsOn: false,
  showClock: false,
};

export const INITIAL_DATA: FocusOSData = {
  schemaVersion: 1,
  tasks: [],
  sessions: [],
  projects: [],
  prospects: [],
  revenueEntries: [],
  milestones: [],
  researchNotes: [],
  hermesItems: [],
  weeklyReviews: [],
  settings: DEFAULT_SETTINGS,
};

export function loadData(): { data: FocusOSData; recoveredFromCorrupt: boolean } {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { data: INITIAL_DATA, recoveredFromCorrupt: false };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { data: INITIAL_DATA, recoveredFromCorrupt: false };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || parsed.schemaVersion !== 1) {
      throw new Error('Invalid schema or data');
    }
    return { data: parsed as FocusOSData, recoveredFromCorrupt: false };
  } catch (err) {
    console.error('Corrupted storage encountered:', err);
    const backupKey = `${STORAGE_KEY}_corrupt_${Date.now()}`;
    window.localStorage.setItem(backupKey, raw);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
    return { data: INITIAL_DATA, recoveredFromCorrupt: true };
  }
}

export function saveData(data: FocusOSData): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

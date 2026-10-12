/**
 * Pure Analytics Aggregation Engine for FOCUS OS.
 * Must NOT import React.
 * Uses recorded sessions only.
 * Under 3 days of recorded session dates: reports hasEnoughData = false.
 * Every percentage explicitly includes its denominator.
 */

import { FocusOSData } from '@/lib/storage';

export interface DailyFocusSummary {
  date: string; // YYYY-MM-DD
  focusMinutes: number;
  completedSessions: number;
}

export interface AnalyticsAggregate {
  hasEnoughData: boolean;
  distinctDaysCount: number;
  totalFocusedMinutes: number;
  completedSessionsCount: number;
  tasksDoneCount: number;
  tasksPlannedCount: number;
  tasksCompletionFormatted: string; // e.g. "80.0% (4 of 5 tasks)"
  milestonesCompletedCount: number;
  milestonesTotalCount: number;
  milestonesFormatted: string; // e.g. "25.0% (2 of 8 milestones)"
  prospectsByStage: Record<string, number>;
  paidClientsCount: number;
  totalRevenueRupees: number;
  totalCostRupees: number;
  netProfitRupees: number;
  experimentsCompletedCount: number;
  dailyTrend: DailyFocusSummary[];
}

export function formatRatioWithDenominator(
  numerator: number,
  denominator: number,
  unitLabel: string
): string {
  if (denominator <= 0) {
    return `0.0% (0 of 0 ${unitLabel})`;
  }
  const pct = ((numerator / denominator) * 100).toFixed(1);
  return `${pct}% (${numerator} of ${denominator} ${unitLabel})`;
}

export function getKolkataDateStringFromMs(ms: number): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date(ms));
  } catch {
    const d = new Date(ms);
    return d.toISOString().slice(0, 10);
  }
}

export function aggregateAnalytics(data: FocusOSData): AnalyticsAggregate {
  // 1. Calculate focused minutes & group sessions by date
  let totalFocusedSeconds = 0;
  let completedSessionsCount = 0;
  const dailyMap = new Map<string, { seconds: number; completed: number }>();

  for (const session of data.sessions) {
    if (session.kind !== 'focus') continue;

    // Sum focus segments only (paused time never inside segments)
    let sessionSeconds = 0;
    for (const seg of session.segments) {
      if (seg.endMs > seg.startMs) {
        sessionSeconds += Math.floor((seg.endMs - seg.startMs) / 1000);
      }
    }

    if (sessionSeconds > 0) {
      totalFocusedSeconds += sessionSeconds;
      const refMs =
        typeof session.completedAt === 'number'
          ? session.completedAt
          : session.completedAt
            ? new Date(session.completedAt).getTime()
            : session.segments[0]?.startMs || Date.now();
      const dateKey = getKolkataDateStringFromMs(refMs);

      const existing = dailyMap.get(dateKey) || { seconds: 0, completed: 0 };
      existing.seconds += sessionSeconds;
      if (session.status === 'completed') {
        existing.completed += 1;
      }
      dailyMap.set(dateKey, existing);
    }

    if (session.status === 'completed') {
      completedSessionsCount += 1;
    }
  }

  const distinctDaysCount = dailyMap.size;
  const hasEnoughData = distinctDaysCount >= 3;
  const totalFocusedMinutes = Math.round(totalFocusedSeconds / 60);

  // Daily trend sorted chronologically
  const sortedDates = Array.from(dailyMap.keys()).sort();
  const dailyTrend: DailyFocusSummary[] = sortedDates.map((date) => {
    const item = dailyMap.get(date)!;
    return {
      date,
      focusMinutes: Math.round(item.seconds / 60),
      completedSessions: item.completed,
    };
  });

  // 2. Tasks completion
  const tasksDoneCount = data.tasks.filter((t) => t.status === 'done').length;
  const tasksPlannedCount = data.tasks.length;
  const tasksCompletionFormatted = formatRatioWithDenominator(
    tasksDoneCount,
    tasksPlannedCount,
    'tasks'
  );

  // 3. Milestones completion
  const milestonesCompletedCount = data.milestones.filter((m) => m.completed).length;
  const milestonesTotalCount = data.milestones.length;
  const milestonesFormatted = formatRatioWithDenominator(
    milestonesCompletedCount,
    milestonesTotalCount,
    'milestones'
  );

  // 4. Prospects by stage
  const prospectsByStage: Record<string, number> = {};
  for (const p of data.prospects) {
    prospectsByStage[p.stage] = (prospectsByStage[p.stage] || 0) + 1;
  }

  // 5. Financials & Paid clients
  let totalRevenueRupees = 0;
  let totalCostRupees = 0;
  const uniqueClients = new Set<string>();

  for (const entry of data.revenueEntries) {
    totalRevenueRupees += entry.amountRupees;
    totalCostRupees += entry.costRupees;
    if (entry.note) {
      uniqueClients.add(entry.note);
    }
  }
  const netProfitRupees = totalRevenueRupees - totalCostRupees;
  const paidClientsCount = uniqueClients.size;

  // 6. Experiments completed
  const experimentsCompletedCount = data.researchNotes.filter(
    (n) => n.status === 'done'
  ).length;

  return {
    hasEnoughData,
    distinctDaysCount,
    totalFocusedMinutes,
    completedSessionsCount,
    tasksDoneCount,
    tasksPlannedCount,
    tasksCompletionFormatted,
    milestonesCompletedCount,
    milestonesTotalCount,
    milestonesFormatted,
    prospectsByStage,
    paidClientsCount,
    totalRevenueRupees,
    totalCostRupees,
    netProfitRupees,
    experimentsCompletedCount,
    dailyTrend,
  };
}

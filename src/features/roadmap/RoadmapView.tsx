import { useState, useEffect } from 'react';
import initialRoadmapData from './roadmap.json';
import {
  RoadmapSemester,
  RoadmapMilestone,
  isMilestoneComplete,
  calculateSemesterProgress,
} from './roadmapLogic';

const ROADMAP_STORAGE_KEY = 'focus_os_roadmap_data';

export function RoadmapView() {
  const [semesters, setSemesters] = useState<RoadmapSemester[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(ROADMAP_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed?.semesters)) {
            return parsed.semesters;
          }
        }
      } catch (e) {
        console.warn('Could not restore roadmap data:', e);
      }
    }
    return initialRoadmapData.semesters as RoadmapSemester[];
  });

  const [activeSemesterId, setActiveSemesterId] = useState<string>('y1s1');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        ROADMAP_STORAGE_KEY,
        JSON.stringify({ semesters })
      );
    }
  }, [semesters]);

  const activeSemester =
    semesters.find((s) => s.id === activeSemesterId) ?? semesters[0]!;

  const progress = calculateSemesterProgress(activeSemester);

  const toggleCriterion = (milestoneId: string, criterionId: string) => {
    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== activeSemester.id) return sem;
        return {
          ...sem,
          milestones: sem.milestones.map((m) => {
            if (m.id !== milestoneId) return m;
            return {
              ...m,
              criteria: m.criteria.map((c) => {
                if (c.id !== criterionId) return c;
                return { ...c, done: !c.done };
              }),
            };
          }),
        };
      })
    );
  };

  return (
    <main role="main" className="view-container">
      <header className="view-header">
        <h1 className="view-title">Learning Roadmap</h1>
        <p className="view-subtitle">
          Four-year CSE curriculum targets (2026–2030). A milestone completes only when all criteria are checked.
        </p>
      </header>

      {/* Semester navigation pills */}
      <nav aria-label="Semester Selection" style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
        {semesters.map((sem) => {
          const semProgress = calculateSemesterProgress(sem);
          const isActive = sem.id === activeSemester.id;
          return (
            <button
              key={sem.id}
              type="button"
              onClick={() => setActiveSemesterId(sem.id)}
              className={isActive ? 'btn-primary' : 'btn-secondary'}
              style={{
                minHeight: '36px',
                padding: '4px 12px',
                fontSize: 'var(--font-size-12)',
              }}
            >
              Sem {sem.number} ({semProgress.completedMilestones}/{semProgress.totalMilestones})
            </button>
          );
        })}
      </nav>

      {/* Active Semester Overview Card */}
      <section className="card" aria-label="Active Semester Details">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-12)' }}>
          <div>
            <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--accent)', fontWeight: 600 }}>
              YEAR {activeSemester.year} · SEMESTER {activeSemester.number}
            </span>
            <h2 style={{ fontSize: 'var(--font-size-20)', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
              {activeSemester.title}
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: 'var(--font-size-14)', marginTop: '4px' }}>
              Core focus: {activeSemester.focus}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 'var(--font-size-20)', fontWeight: 600, color: 'var(--text)' }}>
              {progress.completedMilestones} of {progress.totalMilestones}
            </span>
            <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
              Milestones completed ({progress.percentage}%)
            </p>
          </div>
        </div>

        {/* Goals List */}
        <div style={{ marginTop: 'var(--space-20)', paddingTop: 'var(--space-16)', borderTop: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 'var(--font-size-14)', color: 'var(--text-2)', marginBottom: 'var(--space-8)' }}>
            Semester Goals
          </h3>
          <ul style={{ paddingLeft: 'var(--space-20)', color: 'var(--text)', fontSize: 'var(--font-size-14)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {activeSemester.goals.map((goal, idx) => (
              <li key={idx}>{goal}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Milestones & Checkbox Criteria List */}
      <section aria-label="Semester Milestones">
        <h2 style={{ fontSize: 'var(--font-size-20)', fontFamily: 'var(--font-display)', marginBottom: 'var(--space-16)' }}>
          Milestones & Completion Criteria
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
          {activeSemester.milestones.map((milestone: RoadmapMilestone) => {
            const isComplete = isMilestoneComplete(milestone.criteria);
            const checkedCount = milestone.criteria.filter((c) => c.done).length;

            return (
              <article
                key={milestone.id}
                className="card"
                style={{
                  borderLeft: isComplete ? '4px solid var(--success)' : '4px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-12)', flexWrap: 'wrap', gap: 'var(--space-8)' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--font-size-16)', fontWeight: 600 }}>
                      {milestone.title}
                    </h3>
                    <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
                      Target: {milestone.targetDate} (target date, not a guarantee)
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: 'var(--font-size-12)',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: isComplete ? 'rgba(123, 199, 154, 0.15)' : 'var(--surface-2)',
                      color: isComplete ? 'var(--success)' : 'var(--text-3)',
                    }}
                  >
                    {isComplete ? 'Completed' : `${checkedCount} / ${milestone.criteria.length} criteria`}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
                  {milestone.criteria.map((criterion) => (
                    <label
                      key={criterion.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-12)',
                        padding: 'var(--space-8) var(--space-12)',
                        backgroundColor: 'var(--surface-2)',
                        borderRadius: 'var(--radius-control)',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-14)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={criterion.done}
                        onChange={() => toggleCriterion(milestone.id, criterion.id)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span
                        style={{
                          textDecoration: criterion.done ? 'line-through' : 'none',
                          color: criterion.done ? 'var(--text-3)' : 'var(--text)',
                        }}
                      >
                        {criterion.text}
                      </span>
                    </label>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Summer target banner */}
      <aside
        className="card"
        style={{
          backgroundColor: 'var(--surface-2)',
          borderColor: 'var(--border-strong)',
        }}
        aria-label="Summer Target"
      >
        <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--accent)', fontWeight: 600 }}>
          SUMMER TARGET
        </span>
        <p style={{ fontSize: 'var(--font-size-14)', color: 'var(--text)', marginTop: '4px' }}>
          {activeSemester.summerTarget}
        </p>
      </aside>
    </main>
  );
}

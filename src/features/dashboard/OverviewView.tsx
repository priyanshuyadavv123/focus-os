import { useState, useMemo } from 'react';
import { loadData, saveData, Task } from '@/lib/storage';
import { pickNextBestAction, enforceDailyBudget, TaskWithFlags } from './nextAction';
import {
  TEMPLATES,
  calculateBackToBackTimeline,
  formatTimeFromMinutes,
  PlannerTemplateType,
} from '@/features/planner/plannerEngine';
import { useTimer } from '@/features/timer/timerContext';
import { getTodayDateString } from '@/lib/dates';

export function OverviewView() {
  const { start } = useTimer();
  const [data, setData] = useState(() => loadData().data);
  const [plannerTemplate, setPlannerTemplate] = useState<PlannerTemplateType>('default');
  const [showAddTask, setShowAddTask] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskArea, setNewTaskArea] = useState<'engineering' | 'business' | 'research' | 'health'>('engineering');
  const [newTaskMinutes, setNewTaskMinutes] = useState(50);
  const [newTaskPriority, setNewTaskPriority] = useState<1 | 2 | 3>(1);

  const todayStr = useMemo(() => getTodayDateString(), []);

  // Today's tasks
  const todayTasks = useMemo(() => {
    return data.tasks.filter((t) => t.scheduledDate === todayStr || !t.scheduledDate);
  }, [data.tasks, todayStr]);

  const nextAction = useMemo(() => {
    return pickNextBestAction(todayTasks as TaskWithFlags[]);
  }, [todayTasks]);

  const { totalPlannedMinutes } = useMemo(() => {
    return enforceDailyBudget(todayTasks, data.settings.dailyBudgetMinutes);
  }, [todayTasks, data.settings.dailyBudgetMinutes]);

  // Timeline blocks
  const scheduledBlocks = useMemo(() => {
    return calculateBackToBackTimeline(TEMPLATES[plannerTemplate], 9 * 60);
  }, [plannerTemplate]);

  // Seven-day session aggregation
  const sevenDayMetrics = useMemo(() => {
    const days: { dateStr: string; dayName: string; focusMinutes: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = getTodayDateString(d);
      const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d);

      let focusedMins = 0;
      for (const s of data.sessions) {
        if (s.kind === 'focus' && s.completedAt) {
          const sDate = getTodayDateString(new Date(s.completedAt));
          if (sDate === dStr) {
            for (const seg of s.segments) {
              if (seg.endMs > seg.startMs) {
                focusedMins += Math.floor((seg.endMs - seg.startMs) / 60000);
              }
            }
          }
        }
      }
      days.push({ dateStr: dStr, dayName, focusMinutes: focusedMins });
    }
    return days;
  }, [data.sessions]);

  const weeklyFocusTotalMinutes = useMemo(() => {
    return sevenDayMetrics.reduce((sum, d) => sum + d.focusMinutes, 0);
  }, [sevenDayMetrics]);

  // Four separate progress metrics (strictly never combined)
  const engineeringDone = todayTasks.filter((t) => t.area === 'engineering' && t.status === 'done').length;
  const engineeringTotal = todayTasks.filter((t) => t.area === 'engineering').length;

  const businessDone = todayTasks.filter((t) => t.area === 'business' && t.status === 'done').length;
  const businessTotal = todayTasks.filter((t) => t.area === 'business').length;

  const researchDone = todayTasks.filter((t) => t.area === 'research' && t.status === 'done').length;
  const researchTotal = todayTasks.filter((t) => t.area === 'research').length;

  const healthDone = todayTasks.filter((t) => t.area === 'health' && t.status === 'done').length;
  const healthTotal = todayTasks.filter((t) => t.area === 'health').length;

  // Friendly date string without emoji
  const formattedTodayDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, []);

  const handleToggleTask = (taskId: string) => {
    const updatedTasks: Task[] = data.tasks.map((t) => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'done' ? 'todo' : 'done';
        return { ...t, status: nextStatus, updatedAt: todayStr };
      }
      return t;
    });
    const nextData = { ...data, tasks: updatedTasks };
    setData(nextData);
    saveData(nextData);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: newTaskTitle.trim(),
      area: newTaskArea,
      plannedMinutes: newTaskMinutes,
      scheduledDate: todayStr,
      priority: newTaskPriority,
      status: 'todo',
      createdAt: todayStr,
      updatedAt: todayStr,
    };

    const nextData = { ...data, tasks: [...data.tasks, newTask] };
    setData(nextData);
    saveData(nextData);

    setNewTaskTitle('');
    setShowAddTask(false);
  };

  return (
    <main role="main" className="view-container">
      {/* Greeting and date (no emoji) */}
      <header className="view-header">
        <h1 className="view-title">Overview</h1>
        <p className="view-subtitle">{formattedTodayDate}</p>
      </header>

      {/* Daily budget constraint progress bar */}
      <section className="card" aria-label="Daily Work Budget">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-8)' }}>
          <span style={{ fontSize: 'var(--font-size-14)', fontWeight: 600 }}>Daily Work Budget</span>
          <span style={{ fontSize: 'var(--font-size-14)', color: 'var(--text-2)' }}>
            {totalPlannedMinutes} / {data.settings.dailyBudgetMinutes} minutes planned
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={totalPlannedMinutes}
          aria-valuemin={0}
          aria-valuemax={data.settings.dailyBudgetMinutes}
          aria-label="Planned focus minutes against daily budget"
          style={{
            height: '8px',
            backgroundColor: 'var(--surface-2)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, (totalPlannedMinutes / data.settings.dailyBudgetMinutes) * 100)}%`,
              backgroundColor: 'var(--accent)',
              transition: 'width var(--motion-interactive)',
            }}
          />
        </div>
      </section>

      {/* Next Best Action Card */}
      <section className="card" aria-label="Next Best Action">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span
              style={{
                fontSize: 'var(--font-size-12)',
                color: 'var(--accent)',
                fontWeight: 600,
                letterSpacing: '0.08em',
              }}
            >
              NEXT BEST ACTION
            </span>
            <h2
              style={{
                fontSize: 'var(--font-size-20)',
                fontFamily: 'var(--font-display)',
                marginTop: 'var(--space-4)',
                color: 'var(--text)',
              }}
            >
              {nextAction.task ? nextAction.task.title : 'All planned tasks finished'}
            </h2>
            <p style={{ fontSize: 'var(--font-size-14)', color: 'var(--text-2)', marginTop: 'var(--space-4)' }}>
              {nextAction.explanation}
            </p>
          </div>

          {nextAction.task && (
            <button
              type="button"
              onClick={() => {
                if (nextAction.task) {
                  start(
                    nextAction.task.plannedMinutes * 60,
                    'focus',
                    nextAction.task.id,
                    nextAction.task.title
                  );
                  window.location.hash = '#/timer';
                }
              }}
              className="btn-primary"
            >
              Start Session ({nextAction.task.plannedMinutes}m)
            </button>
          )}
        </div>
      </section>

      {/* Today's Tasks Section */}
      <section className="card" aria-label="Today's Tasks">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-16)' }}>
          <h2 style={{ fontSize: 'var(--font-size-20)', fontFamily: 'var(--font-display)' }}>
            Today's Tasks
          </h2>
          <button
            type="button"
            onClick={() => setShowAddTask(!showAddTask)}
            className="btn-secondary"
          >
            {showAddTask ? 'Cancel' : 'Add Task'}
          </button>
        </div>

        {showAddTask && (
          <form
            onSubmit={handleCreateTask}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-12)',
              padding: 'var(--space-16)',
              backgroundColor: 'var(--surface-2)',
              borderRadius: 'var(--radius-control)',
              marginBottom: 'var(--space-16)',
            }}
          >
            <input
              type="text"
              placeholder="Task title (e.g. Learn Python while loops)"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              required
              aria-label="New task title"
              style={{
                height: '44px',
                padding: '0 var(--space-12)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-control)',
              }}
            />

            <div style={{ display: 'flex', gap: 'var(--space-12)', flexWrap: 'wrap' }}>
              <select
                value={newTaskArea}
                onChange={(e) =>
                  setNewTaskArea(
                    e.target.value as 'engineering' | 'business' | 'research' | 'health'
                  )
                }
                aria-label="Task Area"
                style={{
                  height: '44px',
                  padding: '0 var(--space-12)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                }}
              >
                <option value="engineering">Engineering</option>
                <option value="business">Business</option>
                <option value="research">Research</option>
                <option value="health">Health</option>
              </select>

              <input
                type="number"
                min="5"
                max="180"
                value={newTaskMinutes}
                onChange={(e) => setNewTaskMinutes(parseInt(e.target.value, 10) || 25)}
                aria-label="Planned Minutes"
                style={{
                  width: '100px',
                  height: '44px',
                  padding: '0 var(--space-12)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                }}
              />

              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(Number(e.target.value) as 1 | 2 | 3)}
                aria-label="Priority"
                style={{
                  height: '44px',
                  padding: '0 var(--space-12)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                }}
              >
                <option value={1}>Priority 1 (Highest)</option>
                <option value={2}>Priority 2 (Medium)</option>
                <option value={3}>Priority 3 (Lowest)</option>
              </select>

              <button type="submit" className="btn-primary">
                Save Task
              </button>
            </div>
          </form>
        )}

        {todayTasks.length === 0 ? (
          <p style={{ color: 'var(--text-2)', fontSize: 'var(--font-size-14)' }}>
            No tasks scheduled for today. Add a task to begin.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            {[...todayTasks]
              .sort((a, b) => a.priority - b.priority)
              .map((task) => {
                const isDone = task.status === 'done';
                return (
                  <li
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-12)',
                      backgroundColor: 'var(--surface-2)',
                      borderRadius: 'var(--radius-control)',
                      gap: 'var(--space-12)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)' }}>
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => handleToggleTask(task.id)}
                        aria-label={`Mark ${task.title} as ${isDone ? 'incomplete' : 'done'}`}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <span
                        style={{
                          textDecoration: isDone ? 'line-through' : 'none',
                          color: isDone ? 'var(--text-3)' : 'var(--text)',
                          fontWeight: 500,
                        }}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
                      <span
                        style={{
                          fontSize: 'var(--font-size-12)',
                          color: 'var(--text-3)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {task.area} · P{task.priority} · {task.plannedMinutes}m
                      </span>
                      {!isDone && (
                        <button
                          type="button"
                          onClick={() => {
                            start(
                              task.plannedMinutes * 60,
                              'focus',
                              task.id,
                              task.title
                            );
                            window.location.hash = '#/timer';
                          }}
                          className="btn-secondary"
                          style={{ minHeight: '32px', padding: '2px 8px', fontSize: 'var(--font-size-12)' }}
                        >
                          Start
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      {/* Daily Planner & Back-to-Back Timeline */}
      <section className="card" aria-label="Daily Planner Timeline">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-16)', flexWrap: 'wrap', gap: 'var(--space-8)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-20)', fontFamily: 'var(--font-display)' }}>
              Daily Planner
            </h2>
            <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
              Back-to-back blocks preventing overlap (180m budget).
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
            {(['default', 'exam', 'weekend'] as PlannerTemplateType[]).map((tmpl) => (
              <button
                key={tmpl}
                type="button"
                onClick={() => setPlannerTemplate(tmpl)}
                className={plannerTemplate === tmpl ? 'btn-primary' : 'btn-secondary'}
                style={{ minHeight: '32px', padding: '2px 10px', fontSize: 'var(--font-size-12)', textTransform: 'capitalize' }}
              >
                {tmpl}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline block sequence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          {scheduledBlocks.map((block) => (
            <div
              key={block.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-12)',
                backgroundColor: 'var(--surface-2)',
                borderRadius: 'var(--radius-control)',
                borderLeft: '4px solid var(--accent)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)' }}>
                <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 'var(--font-size-12)', color: 'var(--text-2)' }}>
                  {formatTimeFromMinutes(block.startMinutesFromMidnight!)} - {formatTimeFromMinutes(block.endMinutesFromMidnight!)}
                </span>
                <span style={{ fontWeight: 500 }}>{block.name}</span>
              </div>
              <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
                {block.minutes}m
              </span>
            </div>
          ))}
        </div>

        {/* Protected time notice */}
        <div style={{ marginTop: 'var(--space-16)', paddingTop: 'var(--space-12)', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
            Protected time (Sleep 480m, Classes 360m, Personal 180m) sits outside the 180-minute focus budget.
          </p>
        </div>
      </section>

      {/* Four Separate Progress Indicators (Never combined into one score) */}
      <section aria-label="Progress Areas">
        <h2 style={{ fontSize: 'var(--font-size-20)', fontFamily: 'var(--font-display)', marginBottom: 'var(--space-16)' }}>
          Progress Indicators
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-16)',
          }}
        >
          <div className="card">
            <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>ENGINEERING & ACADEMICS</span>
            <p style={{ fontSize: 'var(--font-size-28)', fontWeight: 600, color: 'var(--text)', marginTop: '4px' }}>
              {engineeringDone} / {engineeringTotal || 0}
            </p>
            <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-2)' }}>Tasks completed today</p>
          </div>

          <div className="card">
            <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>BUSINESS & REVENUE</span>
            <p style={{ fontSize: 'var(--font-size-28)', fontWeight: 600, color: 'var(--text)', marginTop: '4px' }}>
              {businessDone} / {businessTotal || 0}
            </p>
            <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-2)' }}>Outreach & proposals</p>
          </div>

          <div className="card">
            <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>RESEARCH & EXPERIMENTS</span>
            <p style={{ fontSize: 'var(--font-size-28)', fontWeight: 600, color: 'var(--text)', marginTop: '4px' }}>
              {researchDone} / {researchTotal || 0}
            </p>
            <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-2)' }}>Experiments reviewed</p>
          </div>

          <div className="card">
            <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>HEALTH & HABITS</span>
            <p style={{ fontSize: 'var(--font-size-28)', fontWeight: 600, color: 'var(--text)', marginTop: '4px' }}>
              {healthDone} / {healthTotal || 0}
            </p>
            <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-2)' }}>Recovery & habits</p>
          </div>
        </div>
      </section>

      {/* Seven-Day Bar Chart & Focus Total */}
      <section className="card" aria-label="Weekly Focus Activity">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-16)' }}>
          <h2 style={{ fontSize: 'var(--font-size-20)', fontFamily: 'var(--font-display)' }}>
            Weekly Focus Activity
          </h2>
          <span style={{ fontSize: 'var(--font-size-14)', color: 'var(--accent)', fontWeight: 600 }}>
            {weeklyFocusTotalMinutes} min total this week
          </span>
        </div>

        {/* Visual Bar Chart */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 'var(--space-12)',
            height: '120px',
            paddingTop: 'var(--space-16)',
            marginBottom: 'var(--space-16)',
          }}
          aria-hidden="true"
        >
          {sevenDayMetrics.map((day) => {
            const barHeight = Math.min(100, (day.focusMinutes / 180) * 100);
            return (
              <div
                key={day.dateStr}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: '36px',
                    height: `${Math.max(4, barHeight)}%`,
                    backgroundColor: 'var(--accent)',
                    borderRadius: '4px',
                  }}
                />
                <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
                  {day.dayName}
                </span>
              </div>
            );
          })}
        </div>

        {/* Accessible Table Alternative */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-12)', color: 'var(--text-2)' }}>
          <caption className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}>
            Seven-day focused minutes data table
          </caption>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '4px' }}>Day</th>
              <th style={{ textAlign: 'right', padding: '4px' }}>Focus Minutes</th>
            </tr>
          </thead>
          <tbody>
            {sevenDayMetrics.map((day) => (
              <tr key={day.dateStr} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '4px' }}>{day.dayName} ({day.dateStr})</td>
                <td style={{ textAlign: 'right', padding: '4px' }}>{day.focusMinutes}m</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

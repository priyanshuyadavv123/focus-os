import { useState, useMemo } from 'react';
import { loadData, saveData, WeeklyReview } from '@/lib/storage';
import { aggregateAnalytics } from './aggregate';
import { formatRupees } from '@/lib/money';
import { getTodayDateString } from '@/lib/dates';

export function AnalyticsView() {
  const [data, setData] = useState(() => loadData().data);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Weekly review form state
  const [completedText, setCompletedText] = useState('');
  const [learnedText, setLearnedText] = useState('');
  const [shippedText, setShippedText] = useState('');
  const [evidenceText, setEvidenceText] = useState('');
  const [didNotWorkText, setDidNotWorkText] = useState('');
  const [shouldStopText, setShouldStopText] = useState('');
  const [outcome1, setOutcome1] = useState('');
  const [outcome2, setOutcome2] = useState('');
  const [outcome3, setOutcome3] = useState('');

  const analytics = useMemo(() => {
    return aggregateAnalytics(data);
  }, [data]);

  const handleSaveWeeklyReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completedText.trim()) return;

    const newReview: WeeklyReview = {
      id: `review_${Date.now()}`,
      weekStartDate: getTodayDateString(),
      completed: completedText.trim(),
      learned: learnedText.trim(),
      shipped: shippedText.trim(),
      customerEvidence: evidenceText.trim(),
      didNotWork: didNotWorkText.trim(),
      shouldStop: shouldStopText.trim(),
      outcomesNextWeek: [outcome1.trim(), outcome2.trim(), outcome3.trim()],
      createdAt: new Date().toISOString(),
    };

    const nextData = { ...data, weeklyReviews: [newReview, ...data.weeklyReviews] };
    setData(nextData);
    saveData(nextData);

    // Reset form
    setCompletedText('');
    setLearnedText('');
    setShippedText('');
    setEvidenceText('');
    setDidNotWorkText('');
    setShouldStopText('');
    setOutcome1('');
    setOutcome2('');
    setOutcome3('');
    setShowReviewForm(false);
  };

  const maxDailyMinutes = useMemo(() => {
    if (analytics.dailyTrend.length === 0) return 60;
    return Math.max(...analytics.dailyTrend.map((d) => d.focusMinutes), 60);
  }, [analytics.dailyTrend]);

  return (
    <main role="main" className="view-container">
      <header className="view-header">
        <h1 className="view-title">Analytics</h1>
        <p className="view-subtitle">
          Recorded focus metrics, goal completion, and weekly operational review.
        </p>
      </header>

      {/* Threshold Status Banner */}
      {!analytics.hasEnoughData ? (
        <section
          className="card"
          aria-label="Data Threshold Warning"
          style={{
            borderLeft: '4px solid var(--warning)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-8)',
          }}
        >
          <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--warning)', fontWeight: 600 }}>
            BASELINE THRESHOLD
          </span>
          <p style={{ fontSize: 'var(--font-size-16)', color: 'var(--text)', fontWeight: 600 }}>
            Not enough data yet. Under three days of data.
          </p>
          <p style={{ fontSize: 'var(--font-size-14)', color: 'var(--text-2)' }}>
            Recorded sessions exist on {analytics.distinctDaysCount} of 3 required days (
            {analytics.totalFocusedMinutes} focus minutes recorded across{' '}
            {analytics.completedSessionsCount} completed sessions). Complete sessions across at least
            3 calendar days to unlock full statistical trends.
          </p>
          <div style={{ marginTop: 'var(--space-8)' }}>
            <a
              href="#/timer"
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
                minHeight: '40px',
                padding: '0 var(--space-16)',
                fontSize: 'var(--font-size-14)',
              }}
            >
              Start Focus Session
            </a>
          </div>
        </section>
      ) : null}

      {/* Metrics Grid */}
      <section aria-label="Summary Metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-12)' }}>
        <div className="card">
          <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)', fontWeight: 600 }}>
            FOCUS TIME RECORDED
          </span>
          <p style={{ fontSize: 'var(--font-size-28)', fontWeight: 600, color: 'var(--accent)', marginTop: '4px', fontFamily: 'var(--font-display)' }}>
            {analytics.totalFocusedMinutes} min
          </p>
          <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
            Across {analytics.completedSessionsCount} completed sessions
          </p>
        </div>

        <div className="card">
          <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)', fontWeight: 600 }}>
            TASKS COMPLETED
          </span>
          <p style={{ fontSize: 'var(--font-size-20)', fontWeight: 600, color: 'var(--text)', marginTop: '6px' }}>
            {analytics.tasksCompletionFormatted}
          </p>
          <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
            Explicit ratio against all scheduled tasks
          </p>
        </div>

        <div className="card">
          <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)', fontWeight: 600 }}>
            MILESTONES ACHIEVED
          </span>
          <p style={{ fontSize: 'var(--font-size-20)', fontWeight: 600, color: 'var(--text)', marginTop: '6px' }}>
            {analytics.milestonesFormatted}
          </p>
          <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
            All criteria verified and checked
          </p>
        </div>

        <div className="card">
          <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)', fontWeight: 600 }}>
            FINANCIAL NET PROFIT
          </span>
          <p style={{ fontSize: 'var(--font-size-24)', fontWeight: 600, color: 'var(--success)', marginTop: '4px', fontFamily: 'var(--font-display)' }}>
            {formatRupees(analytics.netProfitRupees)}
          </p>
          <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
            Revenue {formatRupees(analytics.totalRevenueRupees)} · Costs {formatRupees(analytics.totalCostRupees)}
          </p>
        </div>
      </section>

      {/* Daily Trend with Table Alternative */}
      <section className="card" aria-label="Daily Focus Trend" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-16)', fontWeight: 600 }}>Daily Focus Trend</h2>
          <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
            Recorded focus minutes by date with an accessible tabular alternative.
          </p>
        </div>

        {analytics.dailyTrend.length === 0 ? (
          <p style={{ color: 'var(--text-3)', fontSize: 'var(--font-size-14)' }}>
            No daily sessions recorded yet.
          </p>
        ) : (
          <>
            {/* Visual Bar Chart */}
            <div
              role="img"
              aria-label="Bar chart showing focus minutes recorded by calendar date"
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 'var(--space-12)',
                height: '140px',
                padding: 'var(--space-12) 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {analytics.dailyTrend.map((d) => {
                const heightPct = Math.round((d.focusMinutes / maxDailyMinutes) * 100);
                return (
                  <div
                    key={d.date}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 'var(--space-4)',
                    }}
                  >
                    <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
                      {d.focusMinutes}m
                    </span>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '40px',
                        height: `${Math.max(heightPct, 6)}%`,
                        backgroundColor: 'var(--accent)',
                        borderRadius: '4px 4px 0 0',
                      }}
                    />
                    <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-2)' }}>
                      {d.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Table Alternative */}
            <div style={{ marginTop: 'var(--space-8)' }}>
              <h3 style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)', fontWeight: 600, marginBottom: 'var(--space-6)' }}>
                TABLE ALTERNATIVE FOR DAILY FOCUS TREND:
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-12)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-3)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-8)' }}>Date</th>
                    <th style={{ padding: 'var(--space-8)', textAlign: 'right' }}>Focus Minutes</th>
                    <th style={{ padding: 'var(--space-8)', textAlign: 'right' }}>Completed Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.dailyTrend.map((d) => (
                    <tr key={d.date} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: 'var(--space-8)', color: 'var(--text)' }}>{d.date}</td>
                      <td style={{ padding: 'var(--space-8)', textAlign: 'right', color: 'var(--accent)', fontWeight: 600 }}>
                        {d.focusMinutes} min
                      </td>
                      <td style={{ padding: 'var(--space-8)', textAlign: 'right', color: 'var(--text-2)' }}>
                        {d.completedSessions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Weekly Review Section */}
      <section className="card" aria-label="Weekly Review" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-8)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-16)', fontWeight: 600 }}>Weekly Review</h2>
            <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
              Evaluate completed work, customer feedback, what to stop, and 3 outcomes for next week.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="btn-primary"
            style={{ minHeight: '44px', padding: '0 var(--space-16)' }}
          >
            {showReviewForm ? 'Cancel Review' : 'New Weekly Review'}
          </button>
        </div>

        {/* Backup Reminder Banner */}
        <div
          style={{
            padding: 'var(--space-12)',
            backgroundColor: 'var(--surface-2)',
            borderRadius: 'var(--radius-control)',
            border: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-8)',
          }}
        >
          <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-2)' }}>
            Backup Reminder: Export a fresh JSON backup after closing each weekly review.
          </span>
          <a
            href="#/settings"
            className="btn-secondary"
            style={{
              textDecoration: 'none',
              minHeight: '36px',
              padding: '0 var(--space-12)',
              fontSize: 'var(--font-size-12)',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Go to Settings & Export
          </a>
        </div>

        {/* Weekly Review Form */}
        {showReviewForm && (
          <form
            onSubmit={handleSaveWeeklyReview}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)', padding: 'var(--space-16)', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-control)' }}
          >
            <h3 style={{ fontSize: 'var(--font-size-14)', fontWeight: 600 }}>Conduct Weekly Review</h3>

            <label style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
              1. What was completed?
              <textarea
                value={completedText}
                onChange={(e) => setCompletedText(e.target.value)}
                required
                rows={2}
                placeholder="List completed coursework algorithms, client fixes, or reading..."
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: '4px',
                  padding: 'var(--space-8)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                  fontSize: 'var(--font-size-14)',
                  fontFamily: 'inherit',
                }}
              />
            </label>

            <label style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
              2. What was learned?
              <textarea
                value={learnedText}
                onChange={(e) => setLearnedText(e.target.value)}
                rows={2}
                placeholder="Core programming concepts or experimental insights..."
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: '4px',
                  padding: 'var(--space-8)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                  fontSize: 'var(--font-size-14)',
                  fontFamily: 'inherit',
                }}
              />
            </label>

            <label style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
              3. What was shipped?
              <textarea
                value={shippedText}
                onChange={(e) => setShippedText(e.target.value)}
                rows={2}
                placeholder="Landing page deployed, CLI pushed to git, etc..."
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: '4px',
                  padding: 'var(--space-8)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                  fontSize: 'var(--font-size-14)',
                  fontFamily: 'inherit',
                }}
              />
            </label>

            <label style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
              4. What customer evidence came in?
              <textarea
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
                rows={2}
                placeholder="Client feedback, response to outreach draft, or observed refusal..."
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: '4px',
                  padding: 'var(--space-8)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                  fontSize: 'var(--font-size-14)',
                  fontFamily: 'inherit',
                }}
              />
            </label>

            <label style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
              5. What did not work?
              <textarea
                value={didNotWorkText}
                onChange={(e) => setDidNotWorkText(e.target.value)}
                rows={2}
                placeholder="Distractions, unrealistic estimates, or stalled tasks..."
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: '4px',
                  padding: 'var(--space-8)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                  fontSize: 'var(--font-size-14)',
                  fontFamily: 'inherit',
                }}
              />
            </label>

            <label style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
              6. What should stop?
              <textarea
                value={shouldStopText}
                onChange={(e) => setShouldStopText(e.target.value)}
                rows={2}
                placeholder="Habits or non-converting activities to discontinue..."
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: '4px',
                  padding: 'var(--space-8)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                  fontSize: 'var(--font-size-14)',
                  fontFamily: 'inherit',
                }}
              />
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
              <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)', fontWeight: 600 }}>
                7. Three outcomes for next week:
              </span>
              <input
                type="text"
                placeholder="Outcome 1 (e.g. Finish Python chapter 4 CLI exercise)"
                value={outcome1}
                onChange={(e) => setOutcome1(e.target.value)}
                required
                style={{
                  height: '44px',
                  padding: '0 var(--space-12)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                }}
              />
              <input
                type="text"
                placeholder="Outcome 2 (e.g. Audit 3 local clinic websites and draft outreach)"
                value={outcome2}
                onChange={(e) => setOutcome2(e.target.value)}
                required
                style={{
                  height: '44px',
                  padding: '0 var(--space-12)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                }}
              />
              <input
                type="text"
                placeholder="Outcome 3 (e.g. Test keyboard accessibility on 5 landing pages)"
                value={outcome3}
                onChange={(e) => setOutcome3(e.target.value)}
                required
                style={{
                  height: '44px',
                  padding: '0 var(--space-12)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', minHeight: '44px', padding: '0 var(--space-16)', marginTop: 'var(--space-8)' }}>
              Save Weekly Review
            </button>
          </form>
        )}

        {/* Past Reviews List */}
        {data.weeklyReviews.length === 0 ? (
          <p style={{ color: 'var(--text-3)', fontSize: 'var(--font-size-14)' }}>
            No past weekly reviews recorded.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
            {data.weeklyReviews.map((rev) => (
              <article
                key={rev.id}
                style={{
                  padding: 'var(--space-16)',
                  backgroundColor: 'var(--surface-2)',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-8)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: 'var(--font-size-14)', color: 'var(--text)' }}>
                    Week of {rev.weekStartDate}
                  </strong>
                  <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
                    {rev.createdAt.slice(0, 10)}
                  </span>
                </div>

                <div style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-2)' }}>
                  <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>COMPLETED: </span>
                  {rev.completed}
                </div>

                {rev.shipped && (
                  <div style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-2)' }}>
                    <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>SHIPPED: </span>
                    {rev.shipped}
                  </div>
                )}

                {rev.customerEvidence && (
                  <div style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-2)' }}>
                    <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>CUSTOMER EVIDENCE: </span>
                    {rev.customerEvidence}
                  </div>
                )}

                <div style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-2)' }}>
                  <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>NEXT WEEK OUTCOMES: </span>
                  <ol style={{ paddingLeft: 'var(--space-16)', margin: '4px 0 0 0' }}>
                    {rev.outcomesNextWeek.map((o, idx) => (
                      <li key={idx}>{o}</li>
                    ))}
                  </ol>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

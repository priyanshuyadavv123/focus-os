import { useState, useMemo } from 'react';
import { loadData, saveData, Prospect, RevenueEntry } from '@/lib/storage';
import { calculateOpportunityScore } from './score';
import { formatRupees } from '@/lib/money';
import { getTodayDateString } from '@/lib/dates';

const STAGES = [
  'research',
  'qualified',
  'problem hypothesis',
  'preview prepared',
  'outreach drafted',
  'approved by me',
  'contacted',
  'conversation',
  'proposal',
  'won',
  'delivery',
  'completed',
  'paused',
  'lost',
] as const;

export function RevenueView() {
  const [data, setData] = useState(() => loadData().data);
  const [showAddProspect, setShowAddProspect] = useState(false);
  const [showUnvalidatedPackages, setShowUnvalidatedPackages] = useState(false);
  const [copiedProspectId, setCopiedProspectId] = useState<string | null>(null);

  // New prospect form state
  const [newBizName, setNewBizName] = useState('');
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('');
  const [newProposedSolution, setNewProposedSolution] = useState('');
  const [newEffortHours, setNewEffortHours] = useState(3);
  const [newPriceRupees, setNewPriceRupees] = useState(2000);
  const [newObsText, setNewObsText] = useState('');
  const [newObsTag, setNewObsTag] = useState<'fact' | 'inference' | 'hypothesis' | 'unknown'>('fact');
  const [newObsSource, setNewObsSource] = useState('');

  // Revenue ledger state
  const [showAddRevenue, setShowAddRevenue] = useState(false);
  const [revClientName, setRevClientName] = useState('');
  const [revAmount, setRevAmount] = useState(2500);
  const [revCost, setRevCost] = useState(0);
  const [revService, setRevService] = useState('Website audit and mobile fix');
  const [revDate, setRevDate] = useState(() => getTodayDateString());

  // Active prospects count (stages other than 'completed' and 'lost')
  const activeProspects = useMemo(() => {
    return data.prospects.filter((p) => p.stage !== 'completed' && p.stage !== 'lost');
  }, [data.prospects]);

  const totalRealizedRevenue = useMemo(() => {
    return data.revenueEntries.reduce((acc, entry) => acc + entry.amountRupees, 0);
  }, [data.revenueEntries]);

  const totalCost = useMemo(() => {
    return data.revenueEntries.reduce((acc, entry) => acc + entry.costRupees, 0);
  }, [data.revenueEntries]);

  const netProfit = totalRealizedRevenue - totalCost;

  const canAddMore = activeProspects.length < 10;

  const handleStageChange = (prospectId: string, newStage: string) => {
    const updated = data.prospects.map((p) => {
      if (p.id === prospectId) {
        return { ...p, stage: newStage };
      }
      return p;
    });
    const nextData = { ...data, prospects: updated };
    setData(nextData);
    saveData(nextData);
  };

  const handleCreateProspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) return;

    if (!canAddMore) {
      alert('Maximum of 10 active prospects allowed. Complete or archive an existing prospect first.');
      return;
    }

    const newProspect: Prospect = {
      id: `prospect_${Date.now()}`,
      businessName: newBizName.trim(),
      websiteUrl: newWebsiteUrl.trim(),
      stage: 'research',
      observations: newObsText.trim()
        ? [
            {
              text: newObsText.trim(),
              tag: newObsTag,
              source: newObsSource.trim(),
            },
          ]
        : [],
      proposedSolution: newProposedSolution.trim(),
      effortHours: newEffortHours,
      priceRupees: newPriceRupees,
      notes: '',
    };

    const nextData = { ...data, prospects: [...data.prospects, newProspect] };
    setData(nextData);
    saveData(nextData);

    setNewBizName('');
    setNewWebsiteUrl('');
    setNewProposedSolution('');
    setNewObsText('');
    setNewObsSource('');
    setShowAddProspect(false);
  };

  const handleCopyOutreach = (prospect: Prospect) => {
    const draftText = `Hi ${prospect.businessName} team,\n\nI was looking at ${prospect.websiteUrl || 'your website'} and noticed ${prospect.observations[0]?.text || 'a quick mobile speed issue'}. I prepared a lightweight fix to address this (${prospect.proposedSolution || 'optimize assets'}).\n\nWould you like me to send over a 2-minute preview?\n\nBest,\nFOCUS OS User`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(draftText).catch(() => {});
    }
    setCopiedProspectId(prospect.id);
    setTimeout(() => setCopiedProspectId(null), 2500);
  };

  const handleMarkContacted = (prospectId: string) => {
    handleStageChange(prospectId, 'contacted');
  };

  const handleAddRevenueEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revClientName.trim()) return;

    const entry: RevenueEntry = {
      id: `rev_${Date.now()}`,
      date: revDate || getTodayDateString(),
      amountRupees: revAmount,
      costRupees: revCost,
      note: `${revClientName.trim()} - ${revService.trim()}`,
    };

    const nextData = { ...data, revenueEntries: [...data.revenueEntries, entry] };
    setData(nextData);
    saveData(nextData);

    setRevClientName('');
    setRevAmount(2500);
    setRevCost(0);
    setShowAddRevenue(false);
  };

  return (
    <main role="main" className="view-container">
      <header className="view-header">
        <h1 className="view-title">Revenue Lab</h1>
        <p className="view-subtitle">
          Manual pipeline tracking. At most 10 active prospects. No scraping or automated checks.
        </p>
      </header>

      {/* Pipeline Status Summary Card */}
      <section className="card" aria-label="Pipeline Capacity">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-12)' }}>
          <div>
            <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--accent)', fontWeight: 600 }}>
              ACTIVE PIPELINE CAPACITY
            </span>
            <p style={{ fontSize: 'var(--font-size-20)', fontWeight: 600, color: 'var(--text)', marginTop: '4px' }}>
              {activeProspects.length} / 10 Active Prospects
            </p>
            <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
              A score is a prioritization aid, never proof of demand.
            </p>
          </div>

          <button
            type="button"
            disabled={!canAddMore}
            onClick={() => setShowAddProspect(!showAddProspect)}
            className="btn-primary"
            style={{ opacity: canAddMore ? 1 : 0.5, cursor: canAddMore ? 'pointer' : 'not-allowed' }}
          >
            {showAddProspect ? 'Cancel' : 'Add Prospect'}
          </button>
        </div>
      </section>

      {/* Add Prospect Form */}
      {showAddProspect && (
        <form
          onSubmit={handleCreateProspect}
          className="card"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}
        >
          <h2 style={{ fontSize: 'var(--font-size-16)', fontWeight: 600 }}>New Prospect Record</h2>

          <input
            type="text"
            placeholder="Business Name (e.g. Model Town Clinic)"
            value={newBizName}
            onChange={(e) => setNewBizName(e.target.value)}
            required
            aria-label="Business Name"
            style={{
              height: '44px',
              padding: '0 var(--space-12)',
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
            }}
          />

          <input
            type="url"
            placeholder="Website URL (e.g. https://example.com)"
            value={newWebsiteUrl}
            onChange={(e) => setNewWebsiteUrl(e.target.value)}
            aria-label="Website URL"
            style={{
              height: '44px',
              padding: '0 var(--space-12)',
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
            }}
          />

          <input
            type="text"
            placeholder="Proposed Solution (e.g. Fix mobile viewport and hero load time)"
            value={newProposedSolution}
            onChange={(e) => setNewProposedSolution(e.target.value)}
            aria-label="Proposed Solution"
            style={{
              height: '44px',
              padding: '0 var(--space-12)',
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
            }}
          />

          <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
            <select
              value={newObsTag}
              onChange={(e) =>
                setNewObsTag(e.target.value as 'fact' | 'inference' | 'hypothesis' | 'unknown')
              }
              aria-label="Observation Tag"
              style={{
                height: '44px',
                padding: '0 var(--space-12)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-control)',
              }}
            >
              <option value="fact">Tag: Fact</option>
              <option value="inference">Tag: Inference</option>
              <option value="hypothesis">Tag: Hypothesis</option>
              <option value="unknown">Tag: Unknown</option>
            </select>

            <input
              type="text"
              placeholder="Observed problem statement"
              value={newObsText}
              onChange={(e) => setNewObsText(e.target.value)}
              aria-label="Observation Statement"
              style={{
                flex: 1,
                height: '44px',
                padding: '0 var(--space-12)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-control)',
              }}
            />
          </div>

          <input
            type="text"
            placeholder="Observation Source (e.g. User manual check on Chrome Mobile DevTools)"
            value={newObsSource}
            onChange={(e) => setNewObsSource(e.target.value)}
            aria-label="Observation Source"
            style={{
              height: '44px',
              padding: '0 var(--space-12)',
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
            }}
          />

          <div style={{ display: 'flex', gap: 'var(--space-12)' }}>
            <label style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-2)' }}>
              Estimated Effort (hours)
              <input
                type="number"
                min="1"
                max="20"
                value={newEffortHours}
                onChange={(e) => setNewEffortHours(Number(e.target.value))}
                style={{
                  display: 'block',
                  height: '44px',
                  width: '120px',
                  padding: '0 var(--space-12)',
                  backgroundColor: 'var(--surface-2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                  marginTop: '4px',
                }}
              />
            </label>

            <label style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-2)' }}>
              Price Hypothesis (₹1,500 - ₹3,000)
              <input
                type="number"
                min="500"
                max="5000"
                step="100"
                value={newPriceRupees}
                onChange={(e) => setNewPriceRupees(Number(e.target.value))}
                style={{
                  display: 'block',
                  height: '44px',
                  width: '180px',
                  padding: '0 var(--space-12)',
                  backgroundColor: 'var(--surface-2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                  marginTop: '4px',
                }}
              />
            </label>
          </div>

          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: 'var(--space-8)' }}>
            Save Prospect
          </button>
        </form>
      )}

      {/* Prospects List */}
      <section aria-label="Prospects List" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
        {data.prospects.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-32)' }}>
            <p style={{ color: 'var(--text-2)', fontSize: 'var(--font-size-14)' }}>
              No active prospects in pipeline. Add a prospect to begin research.
            </p>
          </div>
        ) : (
          data.prospects.map((prospect) => {
            const scoreData = calculateOpportunityScore(prospect);

            return (
              <article key={prospect.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-8)' }}>
                  <div>
                    <h2 style={{ fontSize: 'var(--font-size-20)', fontFamily: 'var(--font-display)' }}>
                      {prospect.businessName}
                    </h2>
                    {prospect.websiteUrl && (
                      <a
                        href={prospect.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent)', fontSize: 'var(--font-size-12)', textDecoration: 'none' }}
                      >
                        {prospect.websiteUrl} ↗
                      </a>
                    )}
                  </div>

                  {/* Opportunity Score Pill */}
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        backgroundColor: 'var(--surface-2)',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>Opportunity:</span>
                      <strong style={{ fontSize: 'var(--font-size-16)', color: 'var(--accent)' }}>
                        {scoreData.totalScore}/100
                      </strong>
                    </div>
                    <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)', marginTop: '2px' }}>
                      {scoreData.evidenceSummary}
                    </p>
                  </div>
                </div>

                {/* Score Breakdown Reasons */}
                {scoreData.reasons.length > 0 && (
                  <div style={{ padding: 'var(--space-8) var(--space-12)', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-control)' }}>
                    <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)', fontWeight: 600 }}>
                      SCORE FACTORS:
                    </span>
                    <ul style={{ paddingLeft: 'var(--space-16)', fontSize: 'var(--font-size-12)', color: 'var(--text-2)', marginTop: '4px' }}>
                      {scoreData.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Observations */}
                {prospect.observations.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
                      OBSERVATIONS:
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                      {prospect.observations.map((obs, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: 'var(--space-8)',
                            backgroundColor: 'var(--surface-2)',
                            borderRadius: 'var(--radius-control)',
                            fontSize: 'var(--font-size-12)',
                          }}
                        >
                          <span
                            style={{
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(140, 132, 245, 0.2)',
                              color: 'var(--accent)',
                              fontWeight: 600,
                              marginRight: 'var(--space-8)',
                              textTransform: 'uppercase',
                            }}
                          >
                            {obs.tag}
                          </span>
                          <span style={{ color: 'var(--text)' }}>{obs.text}</span>
                          <p style={{ color: 'var(--text-3)', marginTop: '2px', fontStyle: 'italic' }}>
                            Source: {obs.source}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stage Progression Selector & Manual Outreach Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-12)', paddingTop: 'var(--space-12)', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
                    <label style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>Stage:</label>
                    <select
                      value={prospect.stage}
                      onChange={(e) => handleStageChange(prospect.id, e.target.value)}
                      aria-label="Prospect stage"
                      style={{
                        height: '36px',
                        padding: '0 var(--space-8)',
                        backgroundColor: 'var(--surface-2)',
                        color: 'var(--text)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-control)',
                        fontSize: 'var(--font-size-12)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-2)' }}>
                      Price hypothesis: {formatRupees(prospect.priceRupees)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
                    <button
                      type="button"
                      onClick={() => handleCopyOutreach(prospect)}
                      className="btn-secondary"
                      style={{ minHeight: '36px', padding: '4px 12px', fontSize: 'var(--font-size-12)' }}
                    >
                      {copiedProspectId === prospect.id ? 'Copied Draft!' : 'Copy Outreach Draft'}
                    </button>
                    {prospect.stage !== 'contacted' && (
                      <button
                        type="button"
                        onClick={() => handleMarkContacted(prospect.id)}
                        className="btn-primary"
                        style={{ minHeight: '36px', padding: '4px 12px', fontSize: 'var(--font-size-12)' }}
                      >
                        Mark as Sent
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* Unvalidated Packaging Options (Hidden by default) */}
      <section className="card" aria-label="Package Hypotheses">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-16)', fontWeight: 600 }}>
              Future Tier Packaging Hypotheses
            </h2>
            <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
              Unvalidated packages (₹1,999; ₹4,999; ₹14,999) stay hidden until baseline demand is validated.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUnvalidatedPackages(!showUnvalidatedPackages)}
            className="btn-secondary"
            style={{ minHeight: '36px', padding: '4px 12px', fontSize: 'var(--font-size-12)' }}
          >
            {showUnvalidatedPackages ? 'Hide Options' : 'View Options'}
          </button>
        </div>

        {showUnvalidatedPackages && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-12)', marginTop: 'var(--space-16)' }}>
            <div style={{ padding: 'var(--space-12)', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-control)' }}>
              <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--warning)', fontWeight: 600 }}>TIER 1 (HYPOTHESIS)</span>
              <p style={{ fontSize: 'var(--font-size-20)', fontWeight: 600, marginTop: '2px' }}>₹1,999</p>
              <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-2)' }}>Single-page performance & accessibility cleanup.</p>
            </div>
            <div style={{ padding: 'var(--space-12)', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-control)' }}>
              <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--warning)', fontWeight: 600 }}>TIER 2 (HYPOTHESIS)</span>
              <p style={{ fontSize: 'var(--font-size-20)', fontWeight: 600, marginTop: '2px' }}>₹4,999</p>
              <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-2)' }}>Full website responsive rebuild with contact route.</p>
            </div>
            <div style={{ padding: 'var(--space-12)', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-control)' }}>
              <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--warning)', fontWeight: 600 }}>TIER 3 (HYPOTHESIS)</span>
              <p style={{ fontSize: 'var(--font-size-20)', fontWeight: 600, marginTop: '2px' }}>₹14,999</p>
              <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-2)' }}>Custom interactive web app with lead capture database.</p>
            </div>
          </div>
        )}
      </section>

      {/* Realized Revenue Ledger */}
      <section className="card" aria-label="Realized Revenue Ledger" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-8)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-16)', fontWeight: 600 }}>Realized Revenue Ledger</h2>
            <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
              Recorded client receipts, delivery costs, and net earnings.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddRevenue(!showAddRevenue)}
            className="btn-secondary"
            style={{ minHeight: '36px', padding: '4px 12px', fontSize: 'var(--font-size-12)' }}
          >
            {showAddRevenue ? 'Cancel' : 'Record Payment'}
          </button>
        </div>

        {/* Financial Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-12)' }}>
          <div style={{ padding: 'var(--space-12)', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-control)' }}>
            <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>TOTAL REVENUE</span>
            <p style={{ fontSize: 'var(--font-size-20)', fontWeight: 600, color: 'var(--accent)', marginTop: '2px' }}>
              {formatRupees(totalRealizedRevenue)}
            </p>
          </div>
          <div style={{ padding: 'var(--space-12)', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-control)' }}>
            <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>TOTAL COSTS</span>
            <p style={{ fontSize: 'var(--font-size-20)', fontWeight: 600, color: 'var(--danger)', marginTop: '2px' }}>
              {formatRupees(totalCost)}
            </p>
          </div>
          <div style={{ padding: 'var(--space-12)', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-control)' }}>
            <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>NET PROFIT</span>
            <p style={{ fontSize: 'var(--font-size-20)', fontWeight: 600, color: 'var(--success)', marginTop: '2px' }}>
              {formatRupees(netProfit)}
            </p>
          </div>
        </div>

        {/* Add Payment Form */}
        {showAddRevenue && (
          <form
            onSubmit={handleAddRevenueEntry}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)', padding: 'var(--space-16)', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-control)' }}
          >
            <h3 style={{ fontSize: 'var(--font-size-14)', fontWeight: 600 }}>Record Realized Payment</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-12)' }}>
              <input
                type="text"
                placeholder="Client Name"
                value={revClientName}
                onChange={(e) => setRevClientName(e.target.value)}
                required
                aria-label="Client Name"
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
                placeholder="Service Rendered"
                value={revService}
                onChange={(e) => setRevService(e.target.value)}
                required
                aria-label="Service Rendered"
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
                type="number"
                placeholder="Amount in Rupees"
                value={revAmount}
                onChange={(e) => setRevAmount(Number(e.target.value))}
                required
                aria-label="Amount in Rupees"
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
                type="number"
                placeholder="Cost in Rupees"
                value={revCost}
                onChange={(e) => setRevCost(Number(e.target.value))}
                aria-label="Cost in Rupees"
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
                type="date"
                value={revDate}
                onChange={(e) => setRevDate(e.target.value)}
                aria-label="Date"
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
            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
              Save Payment
            </button>
          </form>
        )}

        {/* Recorded Payments Table */}
        {data.revenueEntries.length === 0 ? (
          <p style={{ color: 'var(--text-3)', fontSize: 'var(--font-size-12)' }}>
            No realized payments recorded yet.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-12)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-3)', textAlign: 'left' }}>
                  <th style={{ padding: 'var(--space-8)' }}>Date</th>
                  <th style={{ padding: 'var(--space-8)' }}>Client & Service Note</th>
                  <th style={{ padding: 'var(--space-8)', textAlign: 'right' }}>Revenue</th>
                  <th style={{ padding: 'var(--space-8)', textAlign: 'right' }}>Cost</th>
                  <th style={{ padding: 'var(--space-8)', textAlign: 'right' }}>Profit</th>
                </tr>
              </thead>
              <tbody>
                {data.revenueEntries.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 'var(--space-8)', color: 'var(--text-2)' }}>{entry.date}</td>
                    <td style={{ padding: 'var(--space-8)', fontWeight: 600 }}>{entry.note}</td>
                    <td style={{ padding: 'var(--space-8)', textAlign: 'right', color: 'var(--accent)' }}>
                      {formatRupees(entry.amountRupees)}
                    </td>
                    <td style={{ padding: 'var(--space-8)', textAlign: 'right', color: 'var(--text-3)' }}>
                      {formatRupees(entry.costRupees)}
                    </td>
                    <td style={{ padding: 'var(--space-8)', textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>
                      {formatRupees(entry.amountRupees - entry.costRupees)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

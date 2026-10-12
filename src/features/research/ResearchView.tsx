import { useState, useMemo } from 'react';
import { loadData, saveData, ResearchNote } from '@/lib/storage';

export const DEMO_RESEARCH_NOTE: ResearchNote = {
  id: 'demo-research-audit-eval',
  question: 'AI-assisted website audits compared with human reviewers',
  status: 'idea',
  sources: [
    {
      title: 'W3C Web Content Accessibility Guidelines (WCAG) 2.2',
      url: 'https://www.w3.org/WAI/test-evaluate/',
    },
  ],
  hypothesis:
    'Automated rule scanners identify syntax violations faster, while human reviewers detect semantic and contextual usability issues that automated heuristics miss.',
  method:
    'Evaluate 5 public landing pages manually against 10 specific WCAG criteria, then run automated audits on the same pages and compare overlap, false positives, and missed issues.',
  datasetAndPermissions:
    'Public domain sample web pages; no private or copyrighted data required.',
  baseline: 'Manual human review accuracy and time taken (estimated 45 minutes per page).',
  metrics: 'Precision, recall of true accessibility defects, time to complete audit.',
  results: 'Not started. (Results entered only by user after manual trial)',
  limitations: 'Limited sample size of 5 pages; evaluator familiarity with WCAG rules.',
  nextExperiment: 'Measure repeatability across multiple human reviewers.',
};

export function ResearchView() {
  const [data, setData] = useState(() => {
    const loaded = loadData().data;
    // If no research notes exist, initialize with the demo sample note
    if (loaded.researchNotes.length === 0) {
      const initialized = { ...loaded, researchNotes: [DEMO_RESEARCH_NOTE] };
      saveData(initialized);
      return initialized;
    }
    return loaded;
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [editingResultText, setEditingResultText] = useState('');

  // Form state
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState<ResearchNote['status']>('idea');
  const [hypothesis, setHypothesis] = useState('');
  const [method, setMethod] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [datasetAndPermissions, setDatasetAndPermissions] = useState('');
  const [baseline, setBaseline] = useState('');
  const [metrics, setMetrics] = useState('');
  const [results, setResults] = useState('');
  const [limitations, setLimitations] = useState('');
  const [nextExperiment, setNextExperiment] = useState('');

  // Two separate lists: Ideas (untested) vs Experiments (planned, running, done, abandoned)
  const ideasList = useMemo(() => {
    return data.researchNotes.filter((note) => note.status === 'idea');
  }, [data.researchNotes]);

  const experimentsList = useMemo(() => {
    return data.researchNotes.filter((note) => note.status !== 'idea');
  }, [data.researchNotes]);

  const hasDemoNote = useMemo(() => {
    return data.researchNotes.some((n) => n.id === DEMO_RESEARCH_NOTE.id);
  }, [data.researchNotes]);

  const handleClearDemoNote = () => {
    const filtered = data.researchNotes.filter((n) => n.id !== DEMO_RESEARCH_NOTE.id);
    const nextData = { ...data, researchNotes: filtered };
    setData(nextData);
    saveData(nextData);
  };

  const handleStatusChange = (noteId: string, newStatus: ResearchNote['status']) => {
    const updated = data.researchNotes.map((note) => {
      if (note.id === noteId) {
        return { ...note, status: newStatus };
      }
      return note;
    });
    const nextData = { ...data, researchNotes: updated };
    setData(nextData);
    saveData(nextData);
  };

  const handleDeleteNote = (noteId: string) => {
    const filtered = data.researchNotes.filter((n) => n.id !== noteId);
    const nextData = { ...data, researchNotes: filtered };
    setData(nextData);
    saveData(nextData);
  };

  const handleSaveResult = (noteId: string) => {
    const updated = data.researchNotes.map((note) => {
      if (note.id === noteId) {
        return { ...note, results: editingResultText };
      }
      return note;
    });
    const nextData = { ...data, researchNotes: updated };
    setData(nextData);
    saveData(nextData);
    setEditingResultId(null);
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const sources =
      sourceTitle.trim() && sourceUrl.trim()
        ? [{ title: sourceTitle.trim(), url: sourceUrl.trim() }]
        : [];

    const newNote: ResearchNote = {
      id: `research_${Date.now()}`,
      question: question.trim(),
      status,
      sources,
      hypothesis: hypothesis.trim(),
      method: method.trim(),
      datasetAndPermissions: datasetAndPermissions.trim(),
      baseline: baseline.trim(),
      metrics: metrics.trim(),
      results: results.trim(),
      limitations: limitations.trim(),
      nextExperiment: nextExperiment.trim(),
    };

    const nextData = { ...data, researchNotes: [...data.researchNotes, newNote] };
    setData(nextData);
    saveData(nextData);

    // Reset form
    setQuestion('');
    setStatus('idea');
    setHypothesis('');
    setMethod('');
    setSourceTitle('');
    setSourceUrl('');
    setDatasetAndPermissions('');
    setBaseline('');
    setMetrics('');
    setResults('');
    setLimitations('');
    setNextExperiment('');
    setShowAddForm(false);
  };

  const renderNoteCard = (note: ResearchNote) => {
    const isDemo = note.id === DEMO_RESEARCH_NOTE.id;
    const isEditingResult = editingResultId === note.id;

    const statusColors: Record<ResearchNote['status'], { bg: string; text: string }> = {
      idea: { bg: 'var(--surface-2)', text: 'var(--text-3)' },
      planned: { bg: 'rgba(224, 178, 92, 0.15)', text: 'var(--warning)' },
      running: { bg: 'rgba(140, 132, 245, 0.15)', text: 'var(--accent)' },
      done: { bg: 'rgba(123, 199, 154, 0.15)', text: 'var(--success)' },
      abandoned: { bg: 'rgba(224, 105, 107, 0.15)', text: 'var(--danger)' },
    };

    return (
      <article
        key={note.id}
        className="card"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}
      >
        {/* Card Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 'var(--space-8)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-control)',
                  fontSize: 'var(--font-size-12)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  backgroundColor: statusColors[note.status].bg,
                  color: statusColors[note.status].text,
                }}
              >
                Status: {note.status}
              </span>
              {isDemo && (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-control)',
                    fontSize: 'var(--font-size-12)',
                    fontWeight: 600,
                    backgroundColor: 'rgba(224, 178, 92, 0.15)',
                    color: 'var(--warning)',
                  }}
                >
                  DEMO (SAMPLE)
                </span>
              )}
            </div>
            <h2
              style={{
                fontSize: 'var(--font-size-16)',
                fontWeight: 600,
                marginTop: 'var(--space-6)',
                color: 'var(--text)',
              }}
            >
              {note.question}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
            <label style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
              Change Status:
              <select
                value={note.status}
                onChange={(e) => handleStatusChange(note.id, e.target.value as ResearchNote['status'])}
                aria-label={`Change status for ${note.question}`}
                style={{
                  display: 'block',
                  height: '36px',
                  padding: '0 var(--space-8)',
                  backgroundColor: 'var(--surface-2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                  fontSize: 'var(--font-size-12)',
                  marginTop: '2px',
                }}
              >
                <option value="idea">Idea (Untested)</option>
                <option value="planned">Planned</option>
                <option value="running">Running</option>
                <option value="done">Done</option>
                <option value="abandoned">Abandoned</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => handleDeleteNote(note.id)}
              className="btn-ghost"
              style={{ minHeight: '36px', padding: '4px 8px', color: 'var(--danger)', fontSize: 'var(--font-size-12)' }}
            >
              Delete
            </button>
          </div>
        </div>

        {/* Hypothesis & Method */}
        {note.hypothesis && (
          <div style={{ fontSize: 'var(--font-size-12)' }}>
            <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>HYPOTHESIS: </span>
            <span style={{ color: 'var(--text-2)' }}>{note.hypothesis}</span>
          </div>
        )}

        {note.method && (
          <div style={{ fontSize: 'var(--font-size-12)' }}>
            <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>METHOD: </span>
            <span style={{ color: 'var(--text-2)' }}>{note.method}</span>
          </div>
        )}

        {/* Dataset & Baseline */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-8)' }}>
          {note.datasetAndPermissions && (
            <div style={{ fontSize: 'var(--font-size-12)', padding: 'var(--space-8)', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-control)' }}>
              <span style={{ color: 'var(--text-3)', fontWeight: 600, display: 'block' }}>DATASET & PERMISSIONS</span>
              <span style={{ color: 'var(--text-2)' }}>{note.datasetAndPermissions}</span>
            </div>
          )}
          {note.baseline && (
            <div style={{ fontSize: 'var(--font-size-12)', padding: 'var(--space-8)', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-control)' }}>
              <span style={{ color: 'var(--text-3)', fontWeight: 600, display: 'block' }}>BASELINE</span>
              <span style={{ color: 'var(--text-2)' }}>{note.baseline}</span>
            </div>
          )}
          {note.metrics && (
            <div style={{ fontSize: 'var(--font-size-12)', padding: 'var(--space-8)', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-control)' }}>
              <span style={{ color: 'var(--text-3)', fontWeight: 600, display: 'block' }}>METRICS</span>
              <span style={{ color: 'var(--text-2)' }}>{note.metrics}</span>
            </div>
          )}
        </div>

        {/* Sources */}
        {note.sources && note.sources.length > 0 && (
          <div style={{ fontSize: 'var(--font-size-12)' }}>
            <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>SOURCES: </span>
            {note.sources.map((src, i) => {
              const isSafe = src.url.startsWith('https://') || src.url.startsWith('http://');
              return (
                <span key={i} style={{ marginRight: 'var(--space-8)' }}>
                  {isSafe ? (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent)', textDecoration: 'none' }}
                    >
                      {src.title || src.url} ↗
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-2)' }}>{src.title || src.url}</span>
                  )}
                </span>
              );
            })}
          </div>
        )}

        {/* Observed Results (Entered only by user) */}
        <div style={{ padding: 'var(--space-12)', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)', fontWeight: 600 }}>
              OBSERVED RESULTS (User Entered Only)
            </span>
            {!isEditingResult && (
              <button
                type="button"
                onClick={() => {
                  setEditingResultId(note.id);
                  setEditingResultText(note.results || '');
                }}
                className="btn-ghost"
                style={{ minHeight: '30px', padding: '2px 8px', fontSize: 'var(--font-size-12)' }}
              >
                Edit Results
              </button>
            )}
          </div>

          {isEditingResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
              <textarea
                value={editingResultText}
                onChange={(e) => setEditingResultText(e.target.value)}
                placeholder="Enter observed reproducible results..."
                rows={3}
                style={{
                  padding: 'var(--space-8)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                  fontSize: 'var(--font-size-12)',
                  fontFamily: 'inherit',
                }}
              />
              <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
                <button
                  type="button"
                  onClick={() => handleSaveResult(note.id)}
                  className="btn-primary"
                  style={{ minHeight: '32px', padding: '2px 10px', fontSize: 'var(--font-size-12)' }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingResultId(null)}
                  className="btn-secondary"
                  style={{ minHeight: '32px', padding: '2px 10px', fontSize: 'var(--font-size-12)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 'var(--font-size-12)', color: note.results ? 'var(--text)' : 'var(--text-3)' }}>
              {note.results || 'No results recorded yet.'}
            </p>
          )}
        </div>

        {/* Limitations & Next Experiment */}
        {(note.limitations || note.nextExperiment) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', fontSize: 'var(--font-size-12)' }}>
            {note.limitations && (
              <div>
                <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>LIMITATIONS: </span>
                <span style={{ color: 'var(--text-2)' }}>{note.limitations}</span>
              </div>
            )}
            {note.nextExperiment && (
              <div>
                <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>NEXT EXPERIMENT: </span>
                <span style={{ color: 'var(--text-2)' }}>{note.nextExperiment}</span>
              </div>
            )}
          </div>
        )}
      </article>
    );
  };

  return (
    <main role="main" className="view-container">
      <header className="view-header">
        <h1 className="view-title">Research Lab</h1>
        <p className="view-subtitle">
          Hypotheses, reproducible methods, and user-entered observed findings.
        </p>
      </header>

      {/* Control Banner */}
      <section className="card" aria-label="Research Lab Controls">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-12)',
          }}
        >
          <div>
            <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--accent)', fontWeight: 600 }}>
              RESEARCH NOTEBOOK
            </span>
            <p style={{ fontSize: 'var(--font-size-20)', fontWeight: 600, color: 'var(--text)', marginTop: '4px' }}>
              {ideasList.length} Ideas · {experimentsList.length} Experiments
            </p>
            <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
              Findings are entered only by you. The app never generates citations or data.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
            {hasDemoNote && (
              <button
                type="button"
                onClick={handleClearDemoNote}
                className="btn-secondary"
                style={{ minHeight: '44px', padding: '0 var(--space-16)' }}
              >
                Clear Demo Note
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary"
              style={{ minHeight: '44px', padding: '0 var(--space-16)' }}
            >
              {showAddForm ? 'Cancel' : 'New Research Note'}
            </button>
          </div>
        </div>
      </section>

      {/* Add Research Note Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateNote}
          className="card"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}
        >
          <h2 style={{ fontSize: 'var(--font-size-16)', fontWeight: 600 }}>Create Research Note</h2>

          <input
            type="text"
            placeholder="Research Question (e.g. Does manual keyboard testing uncover issues axe misses?)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            aria-label="Research Question"
            style={{
              height: '44px',
              padding: '0 var(--space-12)',
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-12)' }}>
            <label style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ResearchNote['status'])}
                aria-label="Status"
                style={{
                  display: 'block',
                  height: '44px',
                  width: '100%',
                  padding: '0 var(--space-12)',
                  backgroundColor: 'var(--surface-2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                  marginTop: '4px',
                }}
              >
                <option value="idea">Idea (Untested)</option>
                <option value="planned">Planned Experiment</option>
                <option value="running">Running Experiment</option>
                <option value="done">Completed Experiment</option>
                <option value="abandoned">Abandoned Experiment</option>
              </select>
            </label>

            <label style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
              Source Reference Title
              <input
                type="text"
                placeholder="e.g. W3C WCAG 2.2 Guidelines"
                value={sourceTitle}
                onChange={(e) => setSourceTitle(e.target.value)}
                style={{
                  display: 'block',
                  height: '44px',
                  width: '100%',
                  padding: '0 var(--space-12)',
                  backgroundColor: 'var(--surface-2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                  marginTop: '4px',
                }}
              />
            </label>

            <label style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
              Source URL (https://)
              <input
                type="url"
                placeholder="https://..."
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                style={{
                  display: 'block',
                  height: '44px',
                  width: '100%',
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

          <textarea
            placeholder="Hypothesis: What do you expect will happen and why?"
            value={hypothesis}
            onChange={(e) => setHypothesis(e.target.value)}
            rows={2}
            aria-label="Hypothesis"
            style={{
              padding: 'var(--space-12)',
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
              fontSize: 'var(--font-size-14)',
              fontFamily: 'inherit',
            }}
          />

          <textarea
            placeholder="Method: Step-by-step reproducible process"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            rows={2}
            aria-label="Method"
            style={{
              padding: 'var(--space-12)',
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
              fontSize: 'var(--font-size-14)',
              fontFamily: 'inherit',
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-12)' }}>
            <input
              type="text"
              placeholder="Dataset & Permissions"
              value={datasetAndPermissions}
              onChange={(e) => setDatasetAndPermissions(e.target.value)}
              aria-label="Dataset and Permissions"
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
              placeholder="Baseline to compare against"
              value={baseline}
              onChange={(e) => setBaseline(e.target.value)}
              aria-label="Baseline"
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
              placeholder="Metrics (e.g. precision, seconds)"
              value={metrics}
              onChange={(e) => setMetrics(e.target.value)}
              aria-label="Metrics"
              style={{
                height: '44px',
                padding: '0 var(--space-12)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-control)',
              }}
            />
          </div>

          <textarea
            placeholder="Observed Results (Entered only by user after testing)"
            value={results}
            onChange={(e) => setResults(e.target.value)}
            rows={2}
            aria-label="Observed Results"
            style={{
              padding: 'var(--space-12)',
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
              fontSize: 'var(--font-size-14)',
              fontFamily: 'inherit',
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-12)' }}>
            <input
              type="text"
              placeholder="Limitations of this test"
              value={limitations}
              onChange={(e) => setLimitations(e.target.value)}
              aria-label="Limitations"
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
              placeholder="Next Experiment based on results"
              value={nextExperiment}
              onChange={(e) => setNextExperiment(e.target.value)}
              aria-label="Next Experiment"
              style={{
                height: '44px',
                padding: '0 var(--space-12)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-control)',
              }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', minHeight: '44px', padding: '0 var(--space-16)' }}>
            Save Research Note
          </button>
        </form>
      )}

      {/* List 1: Ideas (Untested) */}
      <section aria-labelledby="ideas-heading" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
        <div>
          <h2 id="ideas-heading" style={{ fontSize: 'var(--font-size-16)', fontWeight: 600, color: 'var(--text)' }}>
            Ideas (Untested)
          </h2>
          <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
            Early research questions awaiting experimental formulation or planning.
          </p>
        </div>

        {ideasList.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-24)' }}>
            <p style={{ color: 'var(--text-2)', fontSize: 'var(--font-size-14)' }}>
              No untested ideas recorded.
            </p>
          </div>
        ) : (
          ideasList.map(renderNoteCard)
        )}
      </section>

      {/* List 2: Experiments (Planned or Run) */}
      <section aria-labelledby="experiments-heading" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
        <div>
          <h2 id="experiments-heading" style={{ fontSize: 'var(--font-size-16)', fontWeight: 600, color: 'var(--text)' }}>
            Experiments (Planned or Run)
          </h2>
          <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
            Active, completed, or abandoned experimental evaluations with reproducible methods.
          </p>
        </div>

        {experimentsList.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-24)' }}>
            <p style={{ color: 'var(--text-2)', fontSize: 'var(--font-size-14)' }}>
              No active or completed experiments recorded yet.
            </p>
          </div>
        ) : (
          experimentsList.map(renderNoteCard)
        )}
      </section>
    </main>
  );
}

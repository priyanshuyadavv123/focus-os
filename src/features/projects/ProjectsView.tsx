import { useState, useMemo } from 'react';
import { loadData, saveData, Project, HermesItem } from '@/lib/storage';

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-nova',
    name: 'NOVA',
    purpose: 'Website-services landing page (separate repository, not modified by this app).',
    status: 'in_progress',
    priority: 1,
    deadline: '2026-12-20',
    nextAction: 'Deploy static responsive landing page and verify contact route.',
    githubUrl: 'https://github.com/star-boyyy143/nova',
    deployUrl: 'https://nova-preview.vercel.app',
    notes: 'Independent landing page project.',
  },
  {
    id: 'proj-hermes',
    name: 'Hermes',
    purpose: 'Autonomous operational agent (existing agent, separate codebase).',
    status: 'in_progress',
    priority: 2,
    deadline: '2027-01-15',
    nextAction: 'Review tool reliability telemetry on test harness.',
    notes: 'No automated integration in v1; tracked via Hermes Improvement Board.',
  },
  {
    id: 'proj-python',
    name: 'Python Fundamentals',
    purpose: 'Core computer science foundational programming and problem solving.',
    status: 'in_progress',
    priority: 1,
    deadline: '2026-11-30',
    nextAction: 'Complete nested loop algorithms and practice terminal CLI scripts.',
    notes: 'Curriculum semester 1 requirement.',
  },
  {
    id: 'proj-lead-tracker',
    name: 'Lead Tracker',
    purpose: 'Planned local CRM database for tracking client discovery interactions.',
    status: 'planned',
    priority: 3,
    deadline: '2027-05-15',
    nextAction: 'Draft relational table schema for prospects and follow-ups.',
    notes: 'Planned for Semester 2.',
  },
  {
    id: 'proj-research-notebook',
    name: 'Research Notebook',
    purpose: 'Structured laboratory notebook for testing website audit methodologies.',
    status: 'in_progress',
    priority: 2,
    deadline: '2027-02-28',
    nextAction: 'Formulate testable hypothesis for human vs automated audit speed.',
    notes: 'Academic and applied experimentation.',
  },
];

const INITIAL_HERMES_ITEMS: HermesItem[] = [
  {
    id: 'hermes-1',
    title: 'Tool call timeout handling',
    observedProblem: 'Process hangs indefinitely when network socket fails to respond.',
    evidence: '[fact] Observed 3 hang events in log file transcript.',
    proposedChange: 'Introduce an explicit 10-second timeout with fallback error handler.',
    acceptanceCriteria: 'Exits with error code 1 within 10.5 seconds upon simulated packet drop.',
    testsRequired: 'Unit test with simulated delayed stream and network disconnection.',
    status: 'idea',
  },
  {
    id: 'hermes-2',
    title: 'Context window preservation',
    observedProblem: 'Token limits reached prematurely during recursive exploration.',
    evidence: '[inference] Likely caused by preserving full raw DOM trees.',
    proposedChange: 'Filter HTML trees down to interactive nodes before context injection.',
    acceptanceCriteria: 'Reduces token usage by at least 40% on benchmarks.',
    testsRequired: 'Snapshot test against 5 representative static sites.',
    status: 'approved',
  },
];

export function ProjectsView() {
  const [data, setData] = useState(() => {
    const loaded = loadData().data;
    if (loaded.projects.length === 0) {
      loaded.projects = INITIAL_PROJECTS;
      if (loaded.hermesItems.length === 0) {
        loaded.hermesItems = INITIAL_HERMES_ITEMS;
      }
      saveData(loaded);
    }
    return loaded;
  });

  const [activeTab, setActiveTab] = useState<'projects' | 'hermes'>('projects');
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddHermes, setShowAddHermes] = useState(false);

  // New project state
  const [newProjName, setNewProjName] = useState('');
  const [newProjPurpose, setNewProjPurpose] = useState('');
  const [newProjNextAction, setNewProjNextAction] = useState('');

  // New Hermes item state
  const [newHermesTitle, setNewHermesTitle] = useState('');
  const [newHermesProblem, setNewHermesProblem] = useState('');
  const [newHermesEvidence, setNewHermesEvidence] = useState('');
  const [newHermesTag, setNewHermesTag] = useState<'fact' | 'inference' | 'hypothesis' | 'unknown'>('fact');
  const [newHermesChange, setNewHermesChange] = useState('');

  // Calculate focus minutes per project from recorded sessions
  const projectFocusMinutes = useMemo(() => {
    const map: Record<string, number> = {};
    for (const session of data.sessions) {
      if (session.kind === 'focus' && session.taskId) {
        const task = data.tasks.find((t) => t.id === session.taskId);
        if (task?.projectId) {
          let mins = 0;
          for (const seg of session.segments) {
            mins += Math.floor((seg.endMs - seg.startMs) / 60000);
          }
          map[task.projectId] = (map[task.projectId] || 0) + mins;
        }
      }
    }
    return map;
  }, [data.sessions, data.tasks]);

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: newProjName.trim(),
      purpose: newProjPurpose.trim(),
      status: 'in_progress',
      priority: 2,
      nextAction: newProjNextAction.trim(),
      notes: '',
    };

    const nextData = { ...data, projects: [...data.projects, newProject] };
    setData(nextData);
    saveData(nextData);

    setNewProjName('');
    setNewProjPurpose('');
    setNewProjNextAction('');
    setShowAddProject(false);
  };

  const handleAddHermes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHermesTitle.trim()) return;

    const newItem: HermesItem = {
      id: `hermes-${Date.now()}`,
      title: newHermesTitle.trim(),
      observedProblem: newHermesProblem.trim(),
      evidence: `[${newHermesTag}] ${newHermesEvidence.trim()}`,
      proposedChange: newHermesChange.trim(),
      acceptanceCriteria: 'To be verified through automated tests.',
      testsRequired: 'Integration test suite run.',
      status: 'idea',
    };

    const nextData = { ...data, hermesItems: [...data.hermesItems, newItem] };
    setData(nextData);
    saveData(nextData);

    setNewHermesTitle('');
    setNewHermesProblem('');
    setNewHermesEvidence('');
    setNewHermesChange('');
    setShowAddHermes(false);
  };

  return (
    <main role="main" className="view-container">
      <header className="view-header">
        <h1 className="view-title">Projects</h1>
        <p className="view-subtitle">
          Recorded projects and Hermes improvement backlog. Nothing changes status automatically.
        </p>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={activeTab === 'projects' ? 'btn-primary' : 'btn-secondary'}
          style={{ minHeight: '36px', padding: '4px 16px', fontSize: 'var(--font-size-14)' }}
        >
          Projects ({data.projects.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('hermes')}
          className={activeTab === 'hermes' ? 'btn-primary' : 'btn-secondary'}
          style={{ minHeight: '36px', padding: '4px 16px', fontSize: 'var(--font-size-14)' }}
        >
          Hermes Board ({data.hermesItems.length})
        </button>
      </div>

      {activeTab === 'projects' ? (
        <section aria-label="Projects List" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 'var(--font-size-20)', fontFamily: 'var(--font-display)' }}>
              Active Projects
            </h2>
            <button
              type="button"
              onClick={() => setShowAddProject(!showAddProject)}
              className="btn-secondary"
            >
              {showAddProject ? 'Cancel' : 'Add Project'}
            </button>
          </div>

          {showAddProject && (
            <form
              onSubmit={handleAddProject}
              className="card"
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}
            >
              <input
                type="text"
                placeholder="Project name"
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
                required
                aria-label="Project name"
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
                placeholder="Project purpose"
                value={newProjPurpose}
                onChange={(e) => setNewProjPurpose(e.target.value)}
                required
                aria-label="Project purpose"
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
                placeholder="Next action"
                value={newProjNextAction}
                onChange={(e) => setNewProjNextAction(e.target.value)}
                required
                aria-label="Next action"
                style={{
                  height: '44px',
                  padding: '0 var(--space-12)',
                  backgroundColor: 'var(--surface-2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                }}
              />
              <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                Save Project
              </button>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
            {data.projects.map((proj) => {
              const focusMins = projectFocusMinutes[proj.id] || 0;
              return (
                <article key={proj.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-8)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
                        <h3 style={{ fontSize: 'var(--font-size-20)', fontFamily: 'var(--font-display)' }}>
                          {proj.name}
                        </h3>
                        <span
                          style={{
                            fontSize: 'var(--font-size-12)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--surface-2)',
                            color: 'var(--text-2)',
                            textTransform: 'capitalize',
                          }}
                        >
                          {proj.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-2)', fontSize: 'var(--font-size-14)', marginTop: '4px' }}>
                        {proj.purpose}
                      </p>
                    </div>

                    <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--accent)', fontWeight: 600 }}>
                      {focusMins} min recorded focus
                    </span>
                  </div>

                  <div style={{ marginTop: 'var(--space-16)', padding: 'var(--space-12)', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-control)' }}>
                    <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--accent)', fontWeight: 600 }}>
                      NEXT ACTION
                    </span>
                    <p style={{ fontSize: 'var(--font-size-14)', color: 'var(--text)', marginTop: '2px' }}>
                      {proj.nextAction}
                    </p>
                  </div>

                  {(proj.githubUrl || proj.deployUrl) && (
                    <div style={{ display: 'flex', gap: 'var(--space-16)', marginTop: 'var(--space-12)', fontSize: 'var(--font-size-12)' }}>
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--accent)', textDecoration: 'none' }}
                        >
                          GitHub Repository ↗
                        </a>
                      )}
                      {proj.deployUrl && (
                        <a
                          href={proj.deployUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--accent)', textDecoration: 'none' }}
                        >
                          Live Deployment ↗
                        </a>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <section aria-label="Hermes Improvement Board" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 'var(--font-size-20)', fontFamily: 'var(--font-display)' }}>
                Hermes Improvement Board
              </h2>
              <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
                Statements tagged fact, inference, hypothesis, or unknown.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddHermes(!showAddHermes)}
              className="btn-secondary"
            >
              {showAddHermes ? 'Cancel' : 'Add Item'}
            </button>
          </div>

          {showAddHermes && (
            <form
              onSubmit={handleAddHermes}
              className="card"
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}
            >
              <input
                type="text"
                placeholder="Title"
                value={newHermesTitle}
                onChange={(e) => setNewHermesTitle(e.target.value)}
                required
                aria-label="Hermes item title"
                style={{
                  height: '44px',
                  padding: '0 var(--space-12)',
                  backgroundColor: 'var(--surface-2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                }}
              />
              <textarea
                placeholder="Observed problem"
                value={newHermesProblem}
                onChange={(e) => setNewHermesProblem(e.target.value)}
                required
                rows={2}
                aria-label="Observed problem"
                style={{
                  padding: 'var(--space-8) var(--space-12)',
                  backgroundColor: 'var(--surface-2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
                <select
                  value={newHermesTag}
                  onChange={(e) =>
                    setNewHermesTag(
                      e.target.value as 'fact' | 'inference' | 'hypothesis' | 'unknown'
                    )
                  }
                  aria-label="Evidence tag"
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
                  placeholder="Evidence text"
                  value={newHermesEvidence}
                  onChange={(e) => setNewHermesEvidence(e.target.value)}
                  required
                  aria-label="Evidence description"
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
                placeholder="Proposed change"
                value={newHermesChange}
                onChange={(e) => setNewHermesChange(e.target.value)}
                required
                aria-label="Proposed change"
                style={{
                  height: '44px',
                  padding: '0 var(--space-12)',
                  backgroundColor: 'var(--surface-2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-control)',
                }}
              />
              <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                Save Improvement
              </button>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
            {data.hermesItems.map((item) => (
              <article key={item.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                  <h3 style={{ fontSize: 'var(--font-size-16)', fontWeight: 600 }}>{item.title}</h3>
                  <span
                    style={{
                      fontSize: 'var(--font-size-12)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--surface-2)',
                      color: 'var(--text-2)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {item.status}
                  </span>
                </div>
                <p style={{ color: 'var(--text-2)', fontSize: 'var(--font-size-14)', marginBottom: 'var(--space-8)' }}>
                  <strong>Observed Problem:</strong> {item.observedProblem}
                </p>
                <p style={{ color: 'var(--accent)', fontSize: 'var(--font-size-12)', marginBottom: 'var(--space-8)' }}>
                  <strong>Evidence:</strong> {item.evidence}
                </p>
                <p style={{ color: 'var(--text)', fontSize: 'var(--font-size-14)' }}>
                  <strong>Proposed Change:</strong> {item.proposedChange}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

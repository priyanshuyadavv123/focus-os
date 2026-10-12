# FOCUS OS

A private, local-first mission control designed for one student. FOCUS OS manages a strict 180-minute daily work budget, prioritizes the Next Best Action, tracks college coursework milestones across eight semesters, and records verified, reproducible progress—never claimed progress.

---

## 1. Principles & Decisions

- **Strictly Local-First**: Runs entirely in the browser. Zero backend servers, zero cloud synchronization, zero user tracking, and zero artificial intelligence APIs.
- **Runtime Simplicity**: Built using Vite, React 19, TypeScript (strict mode), and plain CSS design tokens. Contains **only two runtime dependencies**: `react` and `react-dom`.
- **Recorded, Not Claimed**: Progress metrics reflect only completed focus timer sessions and user-verified outcomes. Analytics displays "Not enough data yet" until at least 3 distinct days of focus sessions are recorded.
- **Hash-Based Routing**: Uses hash routing (`#/overview`, `#/timer`, `#/roadmap`, `#/projects`, `#/revenue`, `#/research`, `#/analytics`, `#/settings`) for reliable reloading on any static file host.
- **Time & Currency Standards**: All daily calendar boundaries evaluate strictly in the `Asia/Kolkata` time zone using `YYYY-MM-DD` strings. Financial values represent whole integer rupees formatted with `Intl.NumberFormat('en-IN')`.
- **Private Boundaries**: Never interacts with external agents (such as Hermes or Project Ultron) or third-party web crawlers. Dev server binds strictly to `127.0.0.1`.

---

## 2. Requirements & Installation

- **Environment**: Node 22 LTS (`node -v` >= 22.0.0)
- **Package Manager**: npm

```bash
# Clone or navigate to the project directory
cd ~/Projects/focus-os

# Clean install dependencies
npm install
```

---

## 3. Running Locally

Start the local development server (binds to loopback `127.0.0.1` only):

```bash
npm run dev
```

Open your browser at `http://127.0.0.1:5173`.

---

## 4. Quality Gates & Testing

FOCUS OS enforces strict quality gates with zero warnings and zero accessibility violations:

```bash
# Typecheck (strict TypeScript)
npm run typecheck

# Lint (ESLint strict flat config, 0 warnings)
npm run lint

# Unit Tests (Vitest: timer engine, scoring, Next Best Action, aggregation, validators)
npm test

# Build production bundle
npm run build

# Preview production build locally
npm run preview

# End-to-End Tests & Accessibility Audits (Playwright + AxeBuilder across viewports)
npm run test:e2e
```

---

## 5. Directory Structure

```text
focus-os/
├── index.html                 # Strict Content Security Policy (CSP) & entry point
├── package.json               # Locked dependencies and verification scripts
├── tsconfig.json              # Strict TypeScript configuration
├── vite.config.ts             # Vite configuration with loopback server binding
├── src/
│   ├── main.tsx               # React application mounting point
│   ├── app/
│   │   ├── Shell.tsx          # 232px desktop sidebar, mobile bottom navigation (<1024px)
│   │   ├── routes.ts          # Central route registry and hash parser
│   │   ├── ErrorBoundary.tsx  # Graceful UI recovery with backup export link
│   │   ├── EmptyState.tsx     # One-sentence, one-action empty state component
│   │   └── NotFound.tsx       # 404 fallback page
│   ├── design/
│   │   ├── tokens.css         # Dark instrument design tokens, 4px grid, WCAG AA contrasts
│   │   └── icons.tsx          # Standalone, accessible Lucide SVG icons (no external library)
│   ├── features/
│   │   ├── timer/
│   │   │   ├── engine.ts      # Pure timer math: timestamp deltas, drift immunity, session lifecycle
│   │   │   ├── sound.ts       # Web Audio API chime (synthesized, user-gesture initialized)
│   │   │   ├── timerContext.tsx # React timer store, heartbeat persistence, reload recovery
│   │   │   ├── FocusScreen.tsx # Tabular countdown, progress ring, fullscreen CSS fallback
│   │   │   └── MiniTimerBar.tsx # Persistent active timer bar on non-timer routes
│   │   ├── dashboard/
│   │   │   ├── nextAction.ts  # Pure 6-rule Next Best Action priority algorithm
│   │   │   └── OverviewView.tsx # Date greeting, 180m budget bar, tasks CRUD, 4 progress cards
│   │   ├── planner/
│   │   │   └── plannerEngine.ts # Non-overlapping Default, Exam, and Weekend budget blocks
│   │   ├── roadmap/
│   │   │   ├── roadmap.json   # 8-semester curriculum milestones and target dates
│   │   │   ├── roadmapLogic.ts # Checkbox criteria evaluator (milestone done only when all checked)
│   │   │   └── RoadmapView.tsx # Semester tabs, milestone status, and criteria checkboxes
│   │   ├── projects/
│   │   │   └── ProjectsView.tsx # 5 core projects & Hermes Improvement Board with observation tags
│   │   ├── revenue/
│   │   │   ├── score.ts       # Pure 0–100 opportunity score logic (weights: 35/15/30/20)
│   │   │   └── RevenueView.tsx # 14-stage pipeline (<=10 active), outreach drafts, realized ledger
│   │   ├── research/
│   │   │   └── ResearchView.tsx # Ideas (untested) vs Experiments (active/done), user-only findings
│   │   ├── analytics/
│   │   │   ├── aggregate.ts   # Pure aggregation logic, 3-day data threshold, explicit denominators
│   │   │   └── AnalyticsView.tsx # Summary metrics, trend bar chart with table alternative, Weekly Review
│   │   └── settings/
│   │       └── SettingsView.tsx # Work budget preferences, export disclosure, 2 MB validated restore
│   └── lib/
│       ├── storage.ts         # Single point of localStorage I/O with corrupt data backup
│       ├── validate.ts        # Hand-written validators rejecting prototype keys & oversized payloads
│       ├── dates.ts           # Asia/Kolkata date calculations and string formatters
│       └── money.ts           # Integer rupee formatter using Intl.NumberFormat
└── tests/
    ├── unit/                  # Vitest unit test suites (pure logic isolation)
    └── e2e/                   # Playwright integration & Axe accessibility suites
```

---

## 6. Data Model & Backup Format

All user data is stored as a single JSON object under the `focus_os_v1` key in `localStorage`:

```json
{
  "schemaVersion": 1,
  "tasks": [],
  "sessions": [],
  "projects": [],
  "prospects": [],
  "revenueEntries": [],
  "milestones": [],
  "researchNotes": [],
  "hermesItems": [],
  "weeklyReviews": [],
  "settings": {
    "dailyBudgetMinutes": 180,
    "focusMinutes": 25,
    "shortBreakMinutes": 5,
    "longBreakMinutes": 15,
    "longBreakEvery": 4,
    "soundOn": false,
    "notificationsOn": false,
    "showClock": false
  }
}
```

### Security & Import Protection

- **File Size Limit**: Files larger than 2 MB are rejected immediately.
- **Prototype Pollution Defense**: Payloads containing `__proto__`, `constructor`, or `prototype` keys are rejected.
- **Pre-Import Auto-Backup**: Before any import overwrites data, current state is automatically copied to a timestamped backup key (`focus_os_v1_pre_import_<timestamp>`).
- **Export Warning**: Warns the user that the file contains sensitive personal tasks and financial records before initiating download.

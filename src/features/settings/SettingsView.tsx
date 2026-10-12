import { useState, useRef } from 'react';
import { loadData, saveData, Settings, FocusOSData, STORAGE_KEY } from '@/lib/storage';
import { validateImportJson, ValidationResult } from '@/lib/validate';
import { getTodayDateString } from '@/lib/dates';

export function SettingsView() {
  const [data, setData] = useState(() => loadData().data);
  const [settings, setSettings] = useState<Settings>(() => loadData().data.settings);
  const [settingsSavedNotice, setSettingsSavedNotice] = useState(false);

  // Export state
  const [showExportWarning, setShowExportWarning] = useState(false);

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ValidationResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessNotice, setImportSuccessNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const nextData = { ...data, settings };
    setData(nextData);
    saveData(nextData);
    setSettingsSavedNotice(true);
    setTimeout(() => setSettingsSavedNotice(false), 3000);
  };

  const handleExportBackup = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `focus-os-backup-${getTodayDateString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportWarning(false);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImportError(null);
    setImportResult(null);
    setImportSuccessNotice(null);

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setImportError('File size exceeds 2 MB limit');
      return;
    }

    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text !== 'string') {
        setImportError('Failed to read file content');
        return;
      }

      const result = validateImportJson(text);
      if (!result.valid) {
        setImportError(result.error || 'Invalid backup file structure');
      } else {
        setImportResult(result);
      }
    };
    reader.onerror = () => {
      setImportError('Error reading file from disk');
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!importResult || !importResult.data) return;

    // Automatic backup of current data before overwriting
    try {
      const backupKey = `${STORAGE_KEY}_pre_import_${Date.now()}`;
      window.localStorage.setItem(backupKey, JSON.stringify(data));
    } catch (err) {
      console.warn('Could not store pre-import backup:', err);
    }

    const newData: FocusOSData = importResult.data;
    setData(newData);
    setSettings(newData.settings);
    saveData(newData);

    setImportSuccessNotice(
      `Successfully restored ${importResult.counts?.tasks ?? 0} tasks, ${importResult.counts?.sessions ?? 0} sessions, and ${importResult.counts?.projects ?? 0} projects.`
    );
    setImportResult(null);
    setImportFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <main role="main" className="view-container">
      <header className="view-header">
        <h1 className="view-title">Settings</h1>
        <p className="view-subtitle">
          Local application preferences, privacy boundaries, and verified backup/restore.
        </p>
      </header>

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-16)', fontWeight: 600 }}>Preferences & Budgets</h2>
            <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
              Configure daily work budget (180-min default) and timer preset intervals.
            </p>
          </div>
          {settingsSavedNotice && (
            <span style={{ fontSize: 'var(--font-size-12)', color: 'var(--success)', fontWeight: 600 }}>
              Settings saved.
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-12)' }}>
          <label style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
            Daily Work Budget (minutes)
            <input
              type="number"
              min="30"
              max="480"
              value={settings.dailyBudgetMinutes}
              onChange={(e) => setSettings({ ...settings, dailyBudgetMinutes: Number(e.target.value) })}
              required
              aria-label="Daily Work Budget"
              style={{
                display: 'block',
                width: '100%',
                height: '44px',
                marginTop: '4px',
                padding: '0 var(--space-12)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-control)',
              }}
            />
          </label>

          <label style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
            Default Focus Interval (minutes)
            <input
              type="number"
              min="5"
              max="180"
              value={settings.focusMinutes}
              onChange={(e) => setSettings({ ...settings, focusMinutes: Number(e.target.value) })}
              required
              aria-label="Default Focus Interval"
              style={{
                display: 'block',
                width: '100%',
                height: '44px',
                marginTop: '4px',
                padding: '0 var(--space-12)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-control)',
              }}
            />
          </label>

          <label style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
            Short Break Duration (minutes)
            <input
              type="number"
              min="1"
              max="30"
              value={settings.shortBreakMinutes}
              onChange={(e) => setSettings({ ...settings, shortBreakMinutes: Number(e.target.value) })}
              required
              aria-label="Short Break Duration"
              style={{
                display: 'block',
                width: '100%',
                height: '44px',
                marginTop: '4px',
                padding: '0 var(--space-12)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-control)',
              }}
            />
          </label>

          <label style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
            Long Break Duration (minutes)
            <input
              type="number"
              min="5"
              max="60"
              value={settings.longBreakMinutes}
              onChange={(e) => setSettings({ ...settings, longBreakMinutes: Number(e.target.value) })}
              required
              aria-label="Long Break Duration"
              style={{
                display: 'block',
                width: '100%',
                height: '44px',
                marginTop: '4px',
                padding: '0 var(--space-12)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-control)',
              }}
            />
          </label>

          <label style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
            Long Break Every (sessions)
            <input
              type="number"
              min="2"
              max="12"
              value={settings.longBreakEvery}
              onChange={(e) => setSettings({ ...settings, longBreakEvery: Number(e.target.value) })}
              required
              aria-label="Long Break Interval"
              style={{
                display: 'block',
                width: '100%',
                height: '44px',
                marginTop: '4px',
                padding: '0 var(--space-12)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-control)',
              }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-24)', flexWrap: 'wrap', paddingTop: 'var(--space-8)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', cursor: 'pointer', fontSize: 'var(--font-size-14)', color: 'var(--text)' }}>
            <input
              type="checkbox"
              checked={settings.soundOn}
              onChange={(e) => setSettings({ ...settings, soundOn: e.target.checked })}
              style={{ width: '20px', height: '20px' }}
            />
            Web Audio Completion Chime
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', cursor: 'pointer', fontSize: 'var(--font-size-14)', color: 'var(--text)' }}>
            <input
              type="checkbox"
              checked={settings.notificationsOn}
              onChange={(e) => setSettings({ ...settings, notificationsOn: e.target.checked })}
              style={{ width: '20px', height: '20px' }}
            />
            Browser System Notifications
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', cursor: 'pointer', fontSize: 'var(--font-size-14)', color: 'var(--text)' }}>
            <input
              type="checkbox"
              checked={settings.showClock}
              onChange={(e) => setSettings({ ...settings, showClock: e.target.checked })}
              style={{ width: '20px', height: '20px' }}
            />
            Show Clock in Sidebar
          </label>
        </div>

        <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', minHeight: '44px', padding: '0 var(--space-16)' }}>
          Save Preferences
        </button>
      </form>

      {/* Export Section with Personal Data Warning */}
      <section className="card" aria-label="Export Backup" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-16)', fontWeight: 600 }}>Export Data Backup</h2>
          <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
            Generate a full portable snapshot of your FOCUS OS data in schemaVersion 1 format.
          </p>
        </div>

        {!showExportWarning ? (
          <button
            type="button"
            onClick={() => setShowExportWarning(true)}
            className="btn-secondary"
            style={{ alignSelf: 'flex-start', minHeight: '44px', padding: '0 var(--space-16)' }}
          >
            Export Backup File
          </button>
        ) : (
          <div
            style={{
              padding: 'var(--space-16)',
              backgroundColor: 'var(--surface-2)',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--warning)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-12)',
            }}
          >
            <div>
              <strong style={{ fontSize: 'var(--font-size-14)', color: 'var(--warning)' }}>
                Warning: Personal Data Disclosure
              </strong>
              <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-2)', marginTop: '4px' }}>
                The exported backup file contains your personal tasks, recorded focus timestamps,
                coursework milestones, prospective client notes, outreach drafts, and realized financial
                ledgers. Store this file in a secure location and do not upload it to untrusted devices.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
              <button
                type="button"
                onClick={handleExportBackup}
                className="btn-primary"
                style={{ minHeight: '44px', padding: '0 var(--space-16)' }}
              >
                Confirm & Download Backup JSON
              </button>
              <button
                type="button"
                onClick={() => setShowExportWarning(false)}
                className="btn-ghost"
                style={{ minHeight: '44px', padding: '0 var(--space-16)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Import Section with 2MB limit, Hand-Written Validation, and Record Counts */}
      <section className="card" aria-label="Import Backup" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-16)', fontWeight: 600 }}>Restore from Backup</h2>
          <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)' }}>
            Import a schemaVersion 1 backup file (maximum 2 MB). Hand-written validators check every
            field and reject prototype pollution keys before overwriting. An automatic backup is
            preserved.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelected}
          aria-label="Upload Backup JSON File"
          style={{
            fontSize: 'var(--font-size-14)',
            color: 'var(--text-2)',
          }}
        />

        {importError && (
          <div
            style={{
              padding: 'var(--space-12)',
              backgroundColor: 'rgba(224, 105, 107, 0.15)',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              fontSize: 'var(--font-size-12)',
            }}
          >
            <strong>Import Rejected:</strong> {importError}
          </div>
        )}

        {importSuccessNotice && (
          <div
            style={{
              padding: 'var(--space-12)',
              backgroundColor: 'rgba(123, 199, 154, 0.15)',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--success)',
              color: 'var(--success)',
              fontSize: 'var(--font-size-12)',
            }}
          >
            <strong>Import Succeeded:</strong> {importSuccessNotice}
          </div>
        )}

        {importResult && importResult.counts && (
          <div
            style={{
              padding: 'var(--space-16)',
              backgroundColor: 'var(--surface-2)',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-12)',
            }}
          >
            <div>
              <strong style={{ fontSize: 'var(--font-size-14)', color: 'var(--text)' }}>
                Backup File Verified
              </strong>
              <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--text-3)', marginTop: '2px' }}>
                File: {importFile?.name} ({(importFile?.size ? importFile.size / 1024 : 0).toFixed(1)} KB)
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-8)', fontSize: 'var(--font-size-12)' }}>
              <div>Tasks: <strong>{importResult.counts.tasks}</strong></div>
              <div>Sessions: <strong>{importResult.counts.sessions}</strong></div>
              <div>Projects: <strong>{importResult.counts.projects}</strong></div>
              <div>Prospects: <strong>{importResult.counts.prospects}</strong></div>
              <div>Revenue: <strong>{importResult.counts.revenueEntries}</strong></div>
              <div>Milestones: <strong>{importResult.counts.milestones}</strong></div>
              <div>Research: <strong>{importResult.counts.researchNotes}</strong></div>
              <div>Hermes items: <strong>{importResult.counts.hermesItems}</strong></div>
              <div>Reviews: <strong>{importResult.counts.weeklyReviews}</strong></div>
            </div>

            <p style={{ fontSize: 'var(--font-size-12)', color: 'var(--warning)' }}>
              Overwriting current data will replace active workspace records. An automatic backup of
              your current state will be preserved.
            </p>

            <button
              type="button"
              onClick={handleConfirmImport}
              className="btn-primary"
              style={{ alignSelf: 'flex-start', minHeight: '44px', padding: '0 var(--space-16)' }}
            >
              Confirm Import & Overwrite
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

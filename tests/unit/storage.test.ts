import { describe, it, expect, beforeEach } from 'vitest';
import { loadData, saveData, STORAGE_KEY, INITIAL_DATA } from '@/lib/storage';

// In-memory localStorage mock for node environment
const store: Record<string, string> = {};

const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
  },
};

describe('storage module', () => {
  beforeEach(() => {
    localStorageMock.clear();
    global.window = { localStorage: localStorageMock } as unknown as Window & typeof globalThis;
  });

  it('loads initial data when storage is empty', () => {
    const { data, recoveredFromCorrupt } = loadData();
    expect(data.schemaVersion).toBe(1);
    expect(recoveredFromCorrupt).toBe(false);
  });

  it('saves and reloads valid data', () => {
    const customData = {
      ...INITIAL_DATA,
      tasks: [
        {
          id: 'task-1',
          title: 'Learn Python loops',
          area: 'engineering' as const,
          plannedMinutes: 50,
          scheduledDate: '2026-10-12',
          priority: 1 as const,
          status: 'todo' as const,
          createdAt: '2026-10-12',
          updatedAt: '2026-10-12',
        },
      ],
    };
    saveData(customData);
    const { data, recoveredFromCorrupt } = loadData();
    expect(data.tasks.length).toBe(1);
    expect(data.tasks[0]?.title).toBe('Learn Python loops');
    expect(recoveredFromCorrupt).toBe(false);
  });

  it('backs up corrupted storage and starts clean', () => {
    localStorageMock.setItem(STORAGE_KEY, '{ invalid corrupted json');
    const { data, recoveredFromCorrupt } = loadData();
    expect(recoveredFromCorrupt).toBe(true);
    expect(data.schemaVersion).toBe(1);

    // Verify backup key was created
    const keys = Object.keys(store);
    const backupKey = keys.find((k) => k.startsWith(`${STORAGE_KEY}_corrupt_`));
    expect(backupKey).toBeDefined();
    expect(store[backupKey!]).toBe('{ invalid corrupted json');
  });
});

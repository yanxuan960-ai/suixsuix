import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../constants';
import { Task, Note, Settings } from '../types';

const safeParse = <T>(json: string | null, fallback: T): T => {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch (e) {
    console.error('Failed to parse storage data:', e);
    return fallback;
  }
};

export const storage = {
  getTasks: (): Task[] => {
    return safeParse(localStorage.getItem(STORAGE_KEYS.TASKS), []);
  },
  saveTasks: (tasks: Task[]) => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },
  getNotes: (): Note[] => {
    return safeParse(localStorage.getItem(STORAGE_KEYS.NOTES), []);
  },
  saveNotes: (notes: Note[]) => {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  },
  getSettings: (): Settings => {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!stored) return DEFAULT_SETTINGS;
    
    try {
      const parsed = JSON.parse(stored);
      // Merge with default to ensure new fields (like if we add new settings later) exist
      // And prioritize env key if local key is empty
      return { 
        ...DEFAULT_SETTINGS, 
        ...parsed,
        apiKey: parsed.apiKey || DEFAULT_SETTINGS.apiKey 
      };
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },
  saveSettings: (settings: Settings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }
};
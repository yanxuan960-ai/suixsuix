export interface Task {
  id: string;
  content: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  location?: string;
  completed: boolean;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string; // The refined AI content
  raw: string; // Original input
  createdAt: number;
}

export interface Settings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export type Tab = 'todo' | 'inspiration' | 'settings';

export interface AIResponseTask {
  task: string;
  date: string;
  time?: string;
  location?: string;
}

export interface AIResponseNote {
  title: string;
  content: string;
}
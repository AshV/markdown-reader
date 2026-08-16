export interface SavedDoc {
  id: string;
  name: string;
  content: string;
  savedAt: number;
  wordCount: number;
}

const LIBRARY_KEY = 'md-reader-library';

export function loadLibrary(): SavedDoc[] {
  try {
    return JSON.parse(localStorage.getItem(LIBRARY_KEY) ?? '[]') as SavedDoc[];
  } catch {
    return [];
  }
}

export function persistLibrary(docs: SavedDoc[]): void {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(docs));
}

export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

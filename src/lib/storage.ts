import { VocabWord, VocabSet } from "@/types/vocab";

declare global {
  interface Window {
    electronStore?: {
      get: (key: string) => string | null;
      set: (key: string, value: string) => boolean;
      remove: (key: string) => boolean;
      getAll: () => Record<string, string>;
    };
  }
}

const STORAGE_KEY = "english-vocab-sets";
const ACTIVE_SET_KEY = "english-vocab-active-set";

// Unified storage: use electronStore (file-based) if available, otherwise localStorage
function storageGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  if (window.electronStore) {
    return window.electronStore.get(key);
  }
  return localStorage.getItem(key);
}

function storageSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  if (window.electronStore) {
    window.electronStore.set(key, value);
  } else {
    localStorage.setItem(key, value);
  }
}

function storageRemove(key: string): void {
  if (typeof window === "undefined") return;
  if (window.electronStore) {
    window.electronStore.remove(key);
  } else {
    localStorage.removeItem(key);
  }
}

export function getAllSets(): VocabSet[] {
  const data = storageGet(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function getActiveSetId(): string | null {
  return storageGet(ACTIVE_SET_KEY);
}

export function setActiveSetId(id: string): void {
  storageSet(ACTIVE_SET_KEY, id);
}

export function getActiveSet(): VocabSet | null {
  const sets = getAllSets();
  const activeId = getActiveSetId();
  if (!activeId) return sets[0] || null;
  return sets.find((s) => s.id === activeId) || sets[0] || null;
}

export function saveSet(vocabSet: VocabSet): void {
  const sets = getAllSets();
  const index = sets.findIndex((s) => s.id === vocabSet.id);
  if (index >= 0) {
    sets[index] = vocabSet;
  } else {
    sets.push(vocabSet);
  }
  storageSet(STORAGE_KEY, JSON.stringify(sets));
}

export function deleteSet(id: string): void {
  const sets = getAllSets().filter((s) => s.id !== id);
  storageSet(STORAGE_KEY, JSON.stringify(sets));
}

export function updateWordFamiliarity(
  setId: string,
  wordId: string,
  familiarity: 0 | 1 | 2 | 3
): void {
  const sets = getAllSets();
  const set = sets.find((s) => s.id === setId);
  if (!set) return;
  const word = set.words.find((w) => w.id === wordId);
  if (!word) return;
  word.familiarity = familiarity;
  storageSet(STORAGE_KEY, JSON.stringify(sets));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

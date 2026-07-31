import { VocabWord, VocabSet } from "@/types/vocab";

const STORAGE_KEY = "english-vocab-sets";
const ACTIVE_SET_KEY = "english-vocab-active-set";

export function getAllSets(): VocabSet[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function getActiveSetId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_SET_KEY);
}

export function setActiveSetId(id: string): void {
  localStorage.setItem(ACTIVE_SET_KEY, id);
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

export function deleteSet(id: string): void {
  const sets = getAllSets().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

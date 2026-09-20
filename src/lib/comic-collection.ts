import {selfChecks, unlockKey} from './self-check';

export function questionForCode(raw: string) {
  const code = raw.trim().toUpperCase();
  return selfChecks.find(q => q.code === code);
}

// Shared with quizzes: discovering a code there also makes its card available.
// Persist only per-card unlock flags, never quiz answers, scores or preview state.
export function readCollection(storage: Pick<Storage, 'getItem'>): Set<string> {
  return new Set(selfChecks.filter(q => storage.getItem(unlockKey(q.id)) === 'unlocked').map(q => q.id));
}
export function saveCard(storage: Pick<Storage, 'setItem'>, id: string) {
  if (!selfChecks.some(q => q.id === id)) throw new Error('Unknown teaching card');
  storage.setItem(unlockKey(id), 'unlocked');
}

export function resetCollection(storage: Pick<Storage, 'removeItem'>): void {
  // Only the current course's 17 unlock flags, never preferences or lab work.
  for (const question of selfChecks) storage.removeItem(unlockKey(question.id));
}

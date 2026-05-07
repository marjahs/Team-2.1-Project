import type { SavedEvent } from "./save.repo.js";

const store: SavedEvent[] = [];

export function getSavedByUser(userId: string): SavedEvent[] {
  return store.filter(s => s.userId === userId);
}

export function getSavedByUserAndEvent(userId: string, eventId: string): SavedEvent | undefined {
  return store.find(s => s.userId === userId && s.eventId === eventId);
}

export function createSaved(userId: string, eventId: string): SavedEvent {
  const saved: SavedEvent = {
    id: crypto.randomUUID(),
    userId,
    eventId,
    createdAt: new Date(),
  };
  store.push(saved);
  return saved;
}

export function deleteSaved(id: string): boolean {
  const idx = store.findIndex(s => s.id === id);
  if (idx === -1) return false;
  store.splice(idx, 1);
  return true;
}
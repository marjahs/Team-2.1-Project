import { randomUUID } from "crypto";

export interface SavedEvent {
  id: string;
  eventId: string;
  userId: string;
  createdAt: Date;
}

const savedEvents: SavedEvent[] = [];

export function getSavedByUser(userId: string): SavedEvent[] {
  return savedEvents.filter((s) => s.userId === userId);
}

export function getSavedByUserAndEvent(
  userId: string,
  eventId: string
): SavedEvent | undefined {
  return savedEvents.find((s) => s.userId === userId && s.eventId === eventId);
}

export function createSaved(userId: string, eventId: string): SavedEvent {
  const saved: SavedEvent = {
    id: randomUUID(),
    eventId,
    userId,
    createdAt: new Date(),
  };
  savedEvents.push(saved);
  return saved;
}

export function deleteSaved(id: string): boolean {
  const index = savedEvents.findIndex((s) => s.id === id);
  if (index === -1) return false;
  savedEvents.splice(index, 1);
  return true;
}
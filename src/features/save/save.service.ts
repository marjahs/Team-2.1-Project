import {
  createSaved,
  deleteSaved,
  getSavedByUser,
  getSavedByUserAndEvent,
  type SavedEvent,
} from "./save.repo.js";

// Error types
export class UnauthorizedError extends Error {
  constructor() {
    super("You do not have permission to do that");
    this.name = "UnauthorizedError";
  }
}

export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInputError";
  }
}

// Result type
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

// Toggle save/unsave
export function toggleSave(
  eventId: string,
  userId: string,
  userRole: string
): Result<{ id: string; eventId: string; userId: string; saved: boolean }, UnauthorizedError> {
  if (userRole === "organizer" || userRole === "admin") {
    return { ok: false, error: new UnauthorizedError() };
  }

  const existing = getSavedByUserAndEvent(userId, eventId);

  if (existing) {
    deleteSaved(existing.id);
    return { ok: true, value: { id: existing.id, eventId, userId, saved: false } };
  }

  const saved = createSaved(userId, eventId);
  return { ok: true, value: { id: saved.id, eventId, userId, saved: true } };
}

// Get all saved events for a user
export function getSavedEvents(
  userId: string,
  userRole: string
): Result<SavedEvent[], UnauthorizedError> {
  if (userRole === "organizer" || userRole === "admin") {
    return { ok: false, error: new UnauthorizedError() };
  }

  const saved = getSavedByUser(userId);
  return { ok: true, value: saved };
}

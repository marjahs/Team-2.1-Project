import { inMemoryEventRepository } from "../../events/InMemoryEventRepository.js";
import {
  createSaved,
  deleteSaved,
  getSavedByUser,
  getSavedByUserAndEvent,
  type SavedEvent,
} from "./save.repo.js";
import { type Result, Ok, Err } from "../../lib/result.js";

export class UnauthorizedError extends Error {
  constructor() {
    super("You do not have permission to do that");
    this.name = "UnauthorizedError";
  }
}

export class InvalidSaveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSaveError";
  }
}
export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInputError";
  }
}

export async function toggleSave(
  eventId: string,
  userId: string,
  userRole: string
): Promise<Result<{ id: string; eventId: string; userId: string; saved: boolean }, UnauthorizedError | InvalidSaveError>> {
  if (userRole === "organizer" || userRole === "admin") {
    return Err(new UnauthorizedError());
  }
  const event = await inMemoryEventRepository.findById(eventId);
  if (!event) return Err(new InvalidSaveError("Event not found."));
  if (event.status === "cancelled") {
    return Err(new InvalidSaveError("Cannot save a cancelled event."));
  }
  const existing = getSavedByUserAndEvent(userId, eventId);
  if (existing) {
    deleteSaved(existing.id);
    return Ok({ id: existing.id, eventId, userId, saved: false });
  }
  const saved = createSaved(userId, eventId);
  return Ok({ id: saved.id, eventId, userId, saved: true });
}

export function getSavedEvents(
  userId: string,
  userRole: string
): Result<SavedEvent[], UnauthorizedError> {
  if (userRole === "organizer" || userRole === "admin") {
    return Err(new UnauthorizedError());
  }
  const saved = getSavedByUser(userId);
  return Ok(saved);
}
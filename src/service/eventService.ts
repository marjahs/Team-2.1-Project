import { EventRepository, Event } from "../repositories/eventRepository";

// Result type (temporary if not imported yet)
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Errors
class InvalidInputError extends Error {}
class InvalidDateError extends Error {}

export const EventService = {
  createEvent(
    data: {
      title: string;
      description: string;
      location: string;
      category: string;
      capacity?: number;
      startDatetime: Date;
      endDatetime: Date;
    },
    userId: string
  ): Result<Event, Error> {
    // ✅ validation
    if (!data.title || !data.description || !data.location || !data.category) {
      return { ok: false, error: new InvalidInputError("Missing required fields") };
    }

    if (data.endDatetime <= data.startDatetime) {
      return { ok: false, error: new InvalidDateError("End must be after start") };
    }

  
    const event: Event = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      location: data.location,
      category: data.category,
      status: "draft",
      capacity: data.capacity,
      startDatetime: data.startDatetime,
      endDatetime: data.endDatetime,
      organizerId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const created = EventRepository.create(event);

    return { ok: true, value: created };
  },
};
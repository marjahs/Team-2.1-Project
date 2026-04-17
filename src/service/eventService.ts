import { Event } from "../events/Event";
import { inMemoryEventRepository } from "../events/InMemoryEventRepository";
import { Ok, Err, type Result } from "../lib/result";

class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInputError";
  }
}

class InvalidDateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidDateError";
  }
}

export const EventService = {
  async createEvent(
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
  ): Promise<Result<Event, Error>> {

    if (!data.title || !data.description || !data.location || !data.category) {
      return Err(new InvalidInputError("Missing required fields"));
    }

    if (data.endDatetime <= data.startDatetime) {
      return Err(new InvalidDateError("End must be after start"));
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

    const created = await inMemoryEventRepository.save(event);
    return Ok(created);
  },
};
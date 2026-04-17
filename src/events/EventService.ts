import crypto from "node:crypto";
import { Err, Ok, type Result } from '../lib/result'
import type { Event } from './Event'
import type { EventRepository } from './EventRepository'

export type FilterEventsInput = {
  category?: string
  startDatetime?: Date
  endDatetime?: Date
}

export type SearchEventsInput = {
  query?: string
}

export class InvalidDateRangeError extends Error {
  constructor() {
    super('Start date must be before or equal to end date.')
    this.name = 'InvalidDateRangeError'
  }
}

export class EventNotFoundError extends Error {
  constructor() {
    super("Event not found.");
    this.name = "EventNotFoundError";
  }
}

export class EventService {
  constructor(private readonly eventRepository: EventRepository) {}

  async filterPublishedEvents(
    input: FilterEventsInput
  ): Promise<Result<Event[], InvalidDateRangeError>> {
    if (
      input.startDatetime &&
      input.endDatetime &&
      input.startDatetime > input.endDatetime
    ) {
      return Err(new InvalidDateRangeError())
    }
  

    const events = await this.eventRepository.findPublishedByFilter({
      category: input.category,
      startDatetime: input.startDatetime,
      endDatetime: input.endDatetime,
    })

    return Ok(events)
  }
  async searchPublishedEvents(
    input: SearchEventsInput
  ): Promise<Result<Event[], never>> {
    const query = input.query?.trim() ?? ""
    const events = await this.eventRepository.searchPublished(query)
    return Ok(events)
  }

  async getEventById(eventId: string): Promise<Result<Event, EventNotFoundError>> {
    const event = await this.eventRepository.findById(eventId)
    if (!event) return Err(new EventNotFoundError())
    return Ok(event)
  }
}

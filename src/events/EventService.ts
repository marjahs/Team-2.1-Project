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

  async getEventById(eventId: string, userId?: string): Promise<Result<Event, Error>> {
    const event = await this.eventRepository.findById(eventId)
    if (!event) {
      return Err(new EventNotFoundError())
    
    }
    if (event.status === "draft" && event.organizerId !== userId) {
      return Err(new Error("Not authorized to view this event"))
    }
  
    return Ok(event)
  }
  async createEvent(
    data: {
      title: string
      description: string
      location: string
      category: string
      capacity?: number
      startDatetime: Date
      endDatetime: Date
    },
    organizerId: string
  ): Promise<Result<Event, Error>> {
    
    
    if (!data.title || !data.startDatetime || !data.endDatetime) {
      return Err(new Error("Missing required fields"))
    }
  
    if (data.endDatetime <= data.startDatetime) {
      return Err(new Error("End time must be after start time"))
    }
  
    
    const event: Event = {
      id: crypto.randomUUID(), // works in Node 18+
      title: data.title,
      description: data.description,
      location: data.location,
      category: data.category,
      status: "draft",
      capacity: data.capacity,
      startDatetime: data.startDatetime,
      endDatetime: data.endDatetime,
      organizerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  
    const created = await this.eventRepository.save(event)
  
    return Ok(created)
  }
}

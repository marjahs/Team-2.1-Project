import { Err, Ok, type Result } from '../lib/result'
import type { Event } from './Event'
import type { EventRepository } from './EventRepository'

export type FilterEventsInput = {
  category?: string
  startDatetime?: Date
  endDatetime?: Date
}

export class InvalidDateRangeError extends Error {
  constructor() {
    super('Start date must be before or equal to end date.')
    this.name = 'InvalidDateRangeError'
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
}
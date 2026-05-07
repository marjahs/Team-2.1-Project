import { Ok, Err, type Result } from "../lib/result"
import { inMemoryEventRepository } from "../events/InMemoryEventRepository"
import type { EventRepository } from "../events/EventRepository"
import type { Event } from "../events/Event"

export class EventNotFoundError extends Error {
  constructor() {
    super('Event not found.')
    this.name = 'EventNotFoundError'
  }
}

export class UnauthorizedError extends Error {
  constructor() {
    super('You do not have permission to perform this action.')
    this.name = 'UnauthorizedError'
  }
}

export class InvalidStateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidStateError'
  }
}

export type PublishError = EventNotFoundError | UnauthorizedError | InvalidStateError
export type CancelError  = EventNotFoundError | UnauthorizedError | InvalidStateError

// Default to inMemory so tests work without calling setEventRepository
let _eventRepo: EventRepository = inMemoryEventRepository

export function setEventRepository(repo: EventRepository): void {
  _eventRepo = repo
}

export async function publishEvent(
  eventId: string,
  userId: string
): Promise<Result<Event, PublishError>> {
  const event = await _eventRepo.findById(eventId)
  if (!event) return Err(new EventNotFoundError())
  if (event.organizerId !== userId) return Err(new UnauthorizedError())
  if (event.status !== 'draft') {
    return Err(new InvalidStateError(
      `Cannot publish an event with status "${event.status}". Event must be draft.`
    ))
  }
  const updated = await _eventRepo.update(eventId, { status: 'published' })
  return Ok(updated!)
}

export async function cancelEvent(
  eventId: string,
  userId: string,
  userRole: string
): Promise<Result<Event, CancelError>> {
  const event = await _eventRepo.findById(eventId)
  if (!event) return Err(new EventNotFoundError())
  const isOrganizer = event.organizerId === userId
  const isAdmin = userRole === 'admin'
  if (!isOrganizer && !isAdmin) return Err(new UnauthorizedError())
  if (event.status === 'cancelled') {
    return Err(new InvalidStateError('This event is already cancelled.'))
  }
  if (event.status === 'past') {
    return Err(new InvalidStateError('Past events cannot be cancelled.'))
  }
  const updated = await _eventRepo.update(eventId, { status: 'cancelled' })
  return Ok(updated!)
}
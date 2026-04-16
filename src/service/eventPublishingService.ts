import { Ok, Err, type Result } from '../lib/result'
import { inMemoryEventRepository } from '../events/InMemoryEventRepository'
import type { Event } from '../events/Event'

// Error classes
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

/**
 * Transitions an event from draft → published.
 * Rules:
 *  1. Event must exist
 *  2. Requesting user must be the organizer
 *  3. Event must currently be in 'draft' status
 */
export async function publishEvent(
  eventId: string,
  userId: string
): Promise<Result<Event, PublishError>> {

  // Rule 1: Event must exist
  const event = await inMemoryEventRepository.findById(eventId)
  if (!event) return Err(new EventNotFoundError())

  // Rule 2: Only the organizer can publish
  if (event.organizerId !== userId) return Err(new UnauthorizedError())

  // Rule 3: Must be in draft status
  if (event.status !== 'draft') {
    return Err(new InvalidStateError(
      `Cannot publish an event with status "${event.status}". Event must be draft.`
    ))
  }

  const updated = await inMemoryEventRepository.update(eventId, { status: 'published' })
  return Ok(updated!)
}

/**
 * Transitions an event from draft or published → cancelled.
 * Rules:
 *  1. Event must exist
 *  2. Requesting user must be the organizer
 *  3. Event must not already be cancelled or past
 */
export async function cancelEvent(
  eventId: string,
  userId: string
): Promise<Result<Event, CancelError>> {

  // Rule 1: Event must exist
  const event = await inMemoryEventRepository.findById(eventId)
  if (!event) return Err(new EventNotFoundError())

  // Rule 2: Only the organizer can cancel
  if (event.organizerId !== userId) return Err(new UnauthorizedError())

  // Rule 3: Can't cancel what's already cancelled or past
  if (event.status === 'cancelled') {
    return Err(new InvalidStateError('This event is already cancelled.'))
  }
  if (event.status === 'past') {
    return Err(new InvalidStateError('Past events cannot be cancelled.'))
  }

  const updated = await inMemoryEventRepository.update(eventId, { status: 'cancelled' })
  return Ok(updated!)
}
import { Ok, Err, type Result } from '../lib/result'
import { inMemoryEventRepository } from '../events/InMemoryEventRepository'
import { InMemoryRsvpRepository } from '../repository/InMemoryRsvpRepository'
import type { EventRepository } from '../events/EventRepository'
import type { IRsvpRepository } from '../repository/RsvpRepository'

export interface AttendeeInfo {
  userId: string
  displayName: string
  status: string
  createdAt: Date
}

export class AttendeeEventNotFoundError extends Error {
  constructor() {
    super('Event not found.')
    this.name = 'AttendeeEventNotFoundError'
  }
}

export class AttendeeUnauthorizedError extends Error {
  constructor() {
    super('Only the organizer or an admin can view the attendee list.')
    this.name = 'AttendeeUnauthorizedError'
  }
}

export type GetAttendeesError = AttendeeEventNotFoundError | AttendeeUnauthorizedError

// Default to inMemory so tests work without calling setEventRepository
let _eventRepo: EventRepository = inMemoryEventRepository
let _rsvpRepo: IRsvpRepository = new InMemoryRsvpRepository()

export function setEventRepository(repo: EventRepository): void {
  _eventRepo = repo
}

export function setRsvpRepository(repo: IRsvpRepository): void {
  _rsvpRepo = repo
}

export async function getAttendeesForEvent(
  eventId: string,
  requestingUserId: string,
  requestingUserRole: string
): Promise<Result<AttendeeInfo[], GetAttendeesError>> {
  const event = await _eventRepo.findById(eventId)
  if (!event) return Err(new AttendeeEventNotFoundError())

  const isOrganizer = event.organizerId === requestingUserId
  const isAdmin = requestingUserRole === 'admin'
  if (!isOrganizer && !isAdmin) return Err(new AttendeeUnauthorizedError())

  const rsvps = await _rsvpRepo.listByEvent(eventId)

  const attendees: AttendeeInfo[] = rsvps.map(rsvp => ({
    userId: rsvp.userId,
    displayName: rsvp.userId,
    status: rsvp.status,
    createdAt: rsvp.createdAt,
  }))

  return Ok(attendees)
}
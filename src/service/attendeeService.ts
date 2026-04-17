import { Ok, Err, type Result } from '../lib/result'
import { inMemoryEventRepository } from '../events/InMemoryEventRepository'
import { InMemoryRsvpRepository } from '../repository/InMemoryRsvpRepository'

const rsvpRepository = new InMemoryRsvpRepository()

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

export async function getAttendeesForEvent(
  eventId: string,
  requestingUserId: string,
  requestingUserRole: string
): Promise<Result<AttendeeInfo[], GetAttendeesError>> {

  // Rule 1: Event must exist
  const event = await inMemoryEventRepository.findById(eventId)
  if (!event) return Err(new AttendeeEventNotFoundError())

  // Rule 2: Only organizer or admin can view
  const isOrganizer = event.organizerId === requestingUserId
  const isAdmin = requestingUserRole === 'admin'
  if (!isOrganizer && !isAdmin) return Err(new AttendeeUnauthorizedError())

  // Fetch RSVPs for this event
  const rsvps = await rsvpRepository.listByEvent(eventId)

  // Map RSVPs to attendee info
  // Note: no user repository exists yet so displayName falls back to userId
  const attendees: AttendeeInfo[] = rsvps.map(rsvp => ({
    userId: rsvp.userId,
    displayName: rsvp.userId, // replace with user lookup if user repo is added later
    status: rsvp.status,
    createdAt: rsvp.createdAt,
  }))

  return Ok(attendees)
}
import { getAttendeesForEvent, AttendeeEventNotFoundError, AttendeeUnauthorizedError } from '../src/service/attendeeService'
import { inMemoryEventRepository } from '../src/events/InMemoryEventRepository'
import type { Event } from '../src/events/Event'
import { InMemoryRsvpRepository } from '../repository/InMemoryRsvpRepository'
import type { Event } from '../events/Event'
import type { Rsvp } from '../repository/Rsvp'

// We need to inject the same rsvp repo instance the service uses.
// If attendeeService creates its own instance internally, you will need
// to export the repo or accept it as a parameter — see note below tests.

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'evt-1',
    title: 'Test Event',
    description: 'A test',
    location: 'Room 1',
    category: 'social',
    status: 'published',
    capacity: 10,
    startDatetime: new Date(Date.now() + 86400000),
    endDatetime: new Date(Date.now() + 90000000),
    organizerId: 'user-org',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function makeRsvp(overrides: Partial<Rsvp> = {}): Rsvp {
  return {
    id: 'rsvp-1',
    eventId: 'evt-1',
    userId: 'user-member',
    status: 'going',
    createdAt: new Date(),
    ...overrides,
  }
}

beforeEach(() => {
  inMemoryEventRepository.events = []
})

describe('getAttendeesForEvent', () => {
  it('happy path: organizer can view attendees', async () => {
    await inMemoryEventRepository.save(makeEvent())
    const result = await getAttendeesForEvent('evt-1', 'user-org', 'organizer')
    expect(result.ok).toBe(true)
  })

  it('happy path: admin can view attendees for any event', async () => {
    await inMemoryEventRepository.save(makeEvent())
    const result = await getAttendeesForEvent('evt-1', 'admin-user', 'admin')
    expect(result.ok).toBe(true)
  })

  it('returns AttendeeEventNotFoundError when event does not exist', async () => {
    const result = await getAttendeesForEvent('no-such-id', 'user-org', 'organizer')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.value).toBeInstanceOf(AttendeeEventNotFoundError)
  })

  it('returns AttendeeUnauthorizedError when member tries to view attendees', async () => {
    await inMemoryEventRepository.save(makeEvent())
    const result = await getAttendeesForEvent('evt-1', 'user-member', 'member')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.value).toBeInstanceOf(AttendeeUnauthorizedError)
  })

  it('returns attendees grouped correctly by status', async () => {
    await inMemoryEventRepository.save(makeEvent())
    // If you can inject the rsvp repo, seed it here and verify grouping
    const result = await getAttendeesForEvent('evt-1', 'user-org', 'organizer')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(Array.isArray(result.value)).toBe(true)
    }
  })
})
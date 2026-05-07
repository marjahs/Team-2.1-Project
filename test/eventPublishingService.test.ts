import { publishEvent, cancelEvent, EventNotFoundError, UnauthorizedError, InvalidStateError } from '../src/service/eventPublishingService'
import { inMemoryEventRepository } from '../src/events/InMemoryEventRepository'
import type { Event } from '../src/events/Event'

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'evt-1',
    title: 'Test Event',
    description: 'A test',
    location: 'Room 1',
    category: 'social',
    status: 'draft',
    capacity: 10,
    startDatetime: new Date(Date.now() + 86400000),
    endDatetime: new Date(Date.now() + 90000000),
    organizerId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

beforeEach(() => {
  inMemoryEventRepository.events = []
})

// ── publishEvent ──────────────────────────────────────────

describe('publishEvent', () => {
  it('happy path: transitions draft → published', async () => {
    await inMemoryEventRepository.save(makeEvent())
    const result = await publishEvent('evt-1', 'user-1')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.status).toBe('published')
  })

  it('returns EventNotFoundError when event does not exist', async () => {
    const result = await publishEvent('no-such-id', 'user-1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.value).toBeInstanceOf(EventNotFoundError)
  })

  it('returns UnauthorizedError when user is not the organizer', async () => {
    await inMemoryEventRepository.save(makeEvent())
    const result = await publishEvent('evt-1', 'other-user')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.value).toBeInstanceOf(UnauthorizedError)
  })

  it('returns InvalidStateError when event is already published', async () => {
    await inMemoryEventRepository.save(makeEvent({ status: 'published' }))
    const result = await publishEvent('evt-1', 'user-1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.value).toBeInstanceOf(InvalidStateError)
  })

  it('returns InvalidStateError when event is cancelled', async () => {
    await inMemoryEventRepository.save(makeEvent({ status: 'cancelled' }))
    const result = await publishEvent('evt-1', 'user-1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.value).toBeInstanceOf(InvalidStateError)
  })
})

// ── cancelEvent ───────────────────────────────────────────

describe('cancelEvent', () => {
  it('happy path: organizer cancels a published event', async () => {
    await inMemoryEventRepository.save(makeEvent({ status: 'published' }))
    const result = await cancelEvent('evt-1', 'user-1', 'organizer')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.status).toBe('cancelled')
  })

  it('happy path: admin can cancel any event', async () => {
    await inMemoryEventRepository.save(makeEvent({ status: 'published', organizerId: 'user-1' }))
    const result = await cancelEvent('evt-1', 'admin-user', 'admin')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.status).toBe('cancelled')
  })

  it('returns EventNotFoundError when event does not exist', async () => {
    const result = await cancelEvent('no-such-id', 'user-1', 'organizer')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.value).toBeInstanceOf(EventNotFoundError)
  })

  it('returns UnauthorizedError when member tries to cancel', async () => {
    await inMemoryEventRepository.save(makeEvent({ status: 'published' }))
    const result = await cancelEvent('evt-1', 'other-user', 'member')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.value).toBeInstanceOf(UnauthorizedError)
  })

  it('returns InvalidStateError when event is already cancelled', async () => {
    await inMemoryEventRepository.save(makeEvent({ status: 'cancelled' }))
    const result = await cancelEvent('evt-1', 'user-1', 'organizer')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.value).toBeInstanceOf(InvalidStateError)
  })

  it('returns InvalidStateError when event is past', async () => {
    await inMemoryEventRepository.save(makeEvent({ status: 'past' }))
    const result = await cancelEvent('evt-1', 'user-1', 'organizer')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.value).toBeInstanceOf(InvalidStateError)
  })
})
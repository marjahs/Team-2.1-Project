import { Event } from './Event'
import { EventFilter, EventRepository } from './EventRepository'

export class InMemoryEventRepository implements EventRepository {
  private events: Event[] = []

  async getAll(): Promise<Event[]> {
    return this.events
  }

  async getPublished(): Promise<Event[]> {
    return this.events.filter((event) => event.status === 'published')
  }

  async save(event: Event): Promise<Event> {
    this.events.push(event)
    return event
  }

  async findPublishedByFilter(filter: EventFilter): Promise<Event[]> {
    return this.events.filter((event) => {
      if (event.status !== 'published') return false
      if (filter.category && event.category !== filter.category) return false
      if (filter.startDatetime && event.startDatetime < filter.startDatetime) return false
      if (filter.endDatetime && event.startDatetime > filter.endDatetime) return false
      return true
    })
  }

  async findById(id: string): Promise<Event | null> {
    return this.events.find((event) => event.id === id) ?? null
  }

  async update(
    id: string,
    fields: Partial<Omit<Event, 'id' | 'createdAt'>>
  ): Promise<Event | null> {
    const index = this.events.findIndex((event) => event.id === id)
    if (index === -1) return null

    const updated: Event = {
      ...this.events[index],
      ...fields,
      updatedAt: new Date(),
    }

    this.events[index] = updated
    return updated
  }
} 


export const inMemoryEventRepository = new InMemoryEventRepository()
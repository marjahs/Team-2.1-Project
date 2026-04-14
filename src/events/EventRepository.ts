import { Event } from './Event'

export type EventFilter = {
  category?: string
  startDatetime?: Date
  endDatetime?: Date
}

export interface EventRepository {
  getAll(): Promise<Event[]>
  getPublished(): Promise<Event[]>
  save(event: Event): Promise<Event>
  findPublishedByFilter(filter: EventFilter): Promise<Event[]>
}
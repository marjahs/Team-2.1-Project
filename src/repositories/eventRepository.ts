type EventStatus = "draft" | "published" | "cancelled" | "past";

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  status: EventStatus;
  capacity?: number;
  startDatetime: Date;
  endDatetime: Date;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
}

const events = new Map<string, Event>();

export const EventRepository = {
  create(event: Event): Event {
    events.set(event.id, event);
    return event;
  },

  findById(id: string): Event | undefined {
    return events.get(id);
  },
};
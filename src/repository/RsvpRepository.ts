import type { Rsvp } from "./Rsvp";

export interface IRsvpRepository {
  findByEventAndUser(eventId: string, userId: string): Promise<Rsvp | null>;
  listByUser(userId: string): Promise<Rsvp[]>;
  listByEvent(eventId: string): Promise<Rsvp[]>;
  create(rsvp: Rsvp): Promise<Rsvp>;
  update(rsvp: Rsvp): Promise<Rsvp>;
}
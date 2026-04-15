import crypto from "node:crypto";
import type { IRsvpRepository } from "./RsvpRepository";
import type { Rsvp } from "./Rsvp";

export class InMemoryRsvpRepository implements IRsvpRepository {
  private readonly rsvpsById = new Map<string, Rsvp>();

  async findByEventAndUser(eventId: string, userId: string): Promise<Rsvp | null> {
    for (const rsvp of this.rsvpsById.values()) {
      if (rsvp.eventId === eventId && rsvp.userId === userId) return rsvp;
    }
    return null;
  }

  async listByUser(userId: string): Promise<Rsvp[]> {
    return [...this.rsvpsById.values()].filter(r => r.userId === userId);
  }

  async listByEvent(eventId: string): Promise<Rsvp[]> {
    return [...this.rsvpsById.values()].filter(r => r.eventId === eventId);
  }

  async create(rsvp: Rsvp): Promise<Rsvp> {
    const created: Rsvp = { ...rsvp, id: rsvp.id?.length ? rsvp.id : crypto.randomUUID() };
    this.rsvpsById.set(created.id, created);
    return created;
  }

  async update(rsvp: Rsvp): Promise<Rsvp> {
    this.rsvpsById.set(rsvp.id, rsvp);
    return rsvp;
  }
}
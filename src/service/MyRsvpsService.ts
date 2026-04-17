import { Ok, type Result } from "../lib/result";
import type { Event } from "../events/Event";
import type { EventRepository } from "../events/EventRepository";
import type { IRsvpRepository } from "../repository/RsvpRepository";
import type { Rsvp } from "../repository/Rsvp";

export type MyRsvpItem = {
  rsvp: Rsvp;
  event: Event;
};

export type MyRsvpsView = {
  going: MyRsvpItem[];
  waitlisted: MyRsvpItem[];
  cancelled: MyRsvpItem[];
};

export class MyRsvpsService {
  constructor(
    private readonly events: EventRepository,
    private readonly rsvps: IRsvpRepository,
  ) {}

  async getMyRsvps(userId: string): Promise<Result<MyRsvpsView, never>> {
    const myRsvps = await this.rsvps.listByUser(userId);

    // Join RSVPs to events
    const joined: MyRsvpItem[] = [];
    for (const rsvp of myRsvps) {
      const event = await this.events.findById(rsvp.eventId);
      if (!event) continue; // Sprint 1: skip missing events
      joined.push({ rsvp, event });
    }

    const byStartAsc = (a: MyRsvpItem, b: MyRsvpItem) =>
      a.event.startDatetime.getTime() - b.event.startDatetime.getTime();

    const byCreatedDesc = (a: MyRsvpItem, b: MyRsvpItem) =>
      b.rsvp.createdAt.getTime() - a.rsvp.createdAt.getTime();

    const going = joined.filter(x => x.rsvp.status === "going").sort(byStartAsc);
    const waitlisted = joined.filter(x => x.rsvp.status === "waitlisted").sort(byStartAsc);
    const cancelled = joined.filter(x => x.rsvp.status === "cancelled").sort(byCreatedDesc);

    return Ok({ going, waitlisted, cancelled });
  }
}
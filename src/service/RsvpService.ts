import { Err, Ok, type Result } from "../lib/result";
import type { EventRepository } from "../events/EventRepository";
import type { IRsvpRepository } from "../repository/RsvpRepository";
import type { Rsvp, RsvpStatus } from "../repository/Rsvp";
import { RsvpEventNotFoundError, RsvpEventNotRsvpableError, type RsvpToggleError } from "./RsvpErrors";

export interface RsvpService {
  toggleRsvp(params: { eventId: string; actingUserId: string }): Promise<Result<Rsvp, RsvpToggleError>>;
}

export function CreateRsvpService(events: EventRepository, rsvps: IRsvpRepository): RsvpService {
  return {
    async toggleRsvp({ eventId, actingUserId }) {
      // Find event (no getById available, so scan)
      const allEvents = await events.getAll();
      const event = allEvents.find(e => e.id === eventId);
      if (!event) return Err(new RsvpEventNotFoundError());

      if (event.status !== "published") {
        return Err(new RsvpEventNotRsvpableError("You can only RSVP to published events."));
      }

      const decideActiveStatus = async (): Promise<RsvpStatus> => {
        // If no capacity => always going
        if (event.capacity === undefined) return "going";

        const allForEvent = await rsvps.listByEvent(eventId);
        const goingCount = allForEvent.filter(r => r.status === "going").length;
        return goingCount < event.capacity ? "going" : "waitlisted";
      };

      const existing = await rsvps.findByEventAndUser(eventId, actingUserId);

      // 1) new RSVP
      if (!existing) {
        const status = await decideActiveStatus();
        const created: Rsvp = {
          id: "",
          eventId,
          userId: actingUserId,
          status,
          createdAt: new Date(),
        };
        return Ok(await rsvps.create(created));
      }

      // 2) active -> cancelled
      if (existing.status === "going" || existing.status === "waitlisted") {
        return Ok(await rsvps.update({ ...existing, status: "cancelled" }));
      }

      // 3) cancelled -> reactivated
      const status = await decideActiveStatus();
      return Ok(await rsvps.update({ ...existing, status }));
    },
  };
}
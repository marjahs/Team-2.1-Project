import { Err, Ok, type Result } from "../lib/result";
import type { UserRole } from "../auth/User";
import type { EventRepository } from "../events/EventRepository";
import type { IRsvpRepository } from "../repository/RsvpRepository";
import type { Rsvp, RsvpStatus } from "../repository/Rsvp";
import {
  RsvpEventNotFoundError,
  RsvpEventNotRsvpableError,
  RsvpInvalidInputError,
  type RsvpToggleError,
} from "./RsvpErrors";

export interface RsvpService {
  toggleRsvp(params: {
    eventId: string;
    actingUserId: string;
    actingUserRole?: UserRole;
  }): Promise<Result<Rsvp, RsvpToggleError>>;
}

export function CreateRsvpService(
  events: EventRepository,
  rsvps: IRsvpRepository,
): RsvpService {
  return {
    async toggleRsvp({ eventId, actingUserId, actingUserRole }) {
      const trimmedEventId = eventId.trim();
      const trimmedUserId = actingUserId.trim();

      if (!trimmedEventId || !trimmedUserId) {
        return Err(new RsvpInvalidInputError("Missing RSVP information."));
      }

      const event = await events.findById(trimmedEventId);
      if (!event) return Err(new RsvpEventNotFoundError());

      if (event.status !== "published") {
        return Err(
          new RsvpEventNotRsvpableError("You can only RSVP to published events."),
        );
      }

      if (actingUserRole === "admin") {
        return Err(
          new RsvpEventNotRsvpableError("Admins cannot RSVP to events."),
        );
      }

      if (event.organizerId === trimmedUserId) {
        return Err(
          new RsvpEventNotRsvpableError(
            "Organizers cannot RSVP to their own events.",
          ),
        );
      }

      const decideActiveStatus = async (): Promise<RsvpStatus> => {
        if (event.capacity === undefined) return "going";

        const allForEvent = await rsvps.listByEvent(trimmedEventId);
        const goingCount = allForEvent.filter((rsvp) => rsvp.status === "going").length;

        return goingCount < event.capacity ? "going" : "waitlisted";
      };

      const existing = await rsvps.findByEventAndUser(trimmedEventId, trimmedUserId);

      if (!existing) {
        const status = await decideActiveStatus();
        return Ok(
          await rsvps.create({
            id: "",
            eventId: trimmedEventId,
            userId: trimmedUserId,
            status,
            createdAt: new Date(),
          }),
        );
      }

      if (existing.status === "going" || existing.status === "waitlisted") {
        return Ok(await rsvps.update({ ...existing, status: "cancelled" }));
      }

      const status = await decideActiveStatus();
      return Ok(await rsvps.update({ ...existing, status }));
    },
  };
}
import type { Request, Response } from "express";
import type { AppSessionStore } from "../../session/AppSession";
import { getAuthenticatedUser } from "../../session/AppSession";
import type { RsvpService } from "../../service/RsvpService";
import {
  RsvpEventNotFoundError,
  RsvpEventNotRsvpableError,
  RsvpInvalidInputError,
} from "../../service/RsvpErrors";

export class RsvpController {
  constructor(private readonly rsvpService: RsvpService) {}

  private isHtmxRequest(req: Request): boolean {
    return req.get("HX-Request") === "true";
  }

  private statusForError(error: unknown): number {
    if (error instanceof RsvpInvalidInputError) return 400;
    if (error instanceof RsvpEventNotFoundError) return 404;
    if (error instanceof RsvpEventNotRsvpableError) return 403;
    return 400;
  }

  async toggleFromForm(
    req: Request,
    res: Response,
    store: AppSessionStore,
  ): Promise<void> {
    const currentUser = getAuthenticatedUser(store);
    if (!currentUser) {
      res.status(401).render("partials/error", {
        message: "Please log in to continue.",
        layout: false,
      });
      return;
    }

    const eventId = typeof req.params.eventId === "string" ? req.params.eventId : "";

    const result = await this.rsvpService.toggleRsvp({
      eventId,
      actingUserId: currentUser.userId,
      actingUserRole: currentUser.role,
    });

    if (result.ok === false) {
      const error = result.value;
    
      res.status(this.statusForError(error)).render("partials/error", {
        message: error instanceof Error ? error.message : "Unable to toggle RSVP.",

        layout: false,
      });
      return;
    }

    if (this.isHtmxRequest(req)) {
      res.status(200).render("partials/rsvp-widget", {
        event: { id: result.value.eventId },
        rsvp: result.value,
        layout: false,
      });
      return;
    }

    res.redirect("back");
  }
}
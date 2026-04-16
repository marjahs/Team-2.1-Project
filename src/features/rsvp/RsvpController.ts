import type { Request, Response } from "express";
import type { AppSessionStore } from "../../session/AppSession";
import { getAuthenticatedUser } from "../../session/AppSession";
import type { RsvpService } from "../../service/RsvpService";

export class RsvpController {
  constructor(private readonly rsvpService: RsvpService) {}

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
    });

    if (result.ok === false) {
      const err = result.value;
      res.status(400).render("partials/error", {
        message: err instanceof Error ? err.message : "Unable to toggle RSVP.",
        layout: false,
      });
      return;
    }

    res.redirect("back");
  }
}
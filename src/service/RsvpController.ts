import type { Request, Response } from "express";
import type { AppSessionStore } from "../session/AppSession";
import { getAuthenticatedUser } from "../session/AppSession";
import type { RsvpService } from "./RsvpService";

export class RsvpController {
  constructor(private readonly rsvpService: RsvpService) {}

  async toggleFromForm(req: Request, res: Response, store: AppSessionStore): Promise<void> {
    const currentUser = getAuthenticatedUser(store);
    if (!currentUser) {
      res.status(401).render("partials/error", { message: "Please log in to continue.", layout: false });
      return;
    }

    const eventId = typeof req.params.eventId === "string" ? req.params.eventId : "";
    const result = await this.rsvpService.toggleRsvp({
      eventId,
      actingUserId: currentUser.userId,
    });

    if (!result.ok) {
      res.status(400).render("partials/error", {
        message: result.value.message,
        layout: false,
      });
      return;
    }

    // simplest Sprint 1 behavior: go back to where user came from
    res.redirect("back");
  }
}
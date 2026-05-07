import { Request, Response } from "express";
import { EventService } from "../service/eventService";
import { getAuthenticatedUser } from "../session/AppSession";

export const EventController = {
  showCreateForm(req: Request, res: Response) {
    return res.render("events/create");
  },

  createEvent(req: Request, res: Response) {
    const user = getAuthenticatedUser(req.session as any);
    if (!user) return;

    const result = EventService.createEvent(
      {
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        category: req.body.category,
        capacity: req.body.capacity ? Number(req.body.capacity) : undefined,
        startDatetime: new Date(req.body.startDatetime),
        endDatetime: new Date(req.body.endDatetime),
      },
      user.userId
    );

    if (result.ok === false) {
      return res.status(400).render("partials/error", {
        message: result.error.message,
        layout: false,
      });
    }

    return res.redirect(`/events/${result.value.id}`);
  },
};
import { recordPageView, getAuthenticatedUser } from "../session/AppSession";
import type { Request, Response } from "express";
import { EventService, InvalidDateRangeError } from "./EventService";

export interface IEventController {
  filterEvents(req: Request, res: Response): Promise<void>;
  searchEvents(req: Request, res: Response): Promise<void>;
  showEventDetail(req: Request, res: Response): Promise<void>;
  createEvent(req: Request, res: Response): Promise<void>;
}

class EventController implements IEventController {
  constructor(private readonly eventService: EventService) {}

  async filterEvents(req: Request, res: Response): Promise<void> {
    const { category, startDatetime, endDatetime } = req.query;

    const result = await this.eventService.filterPublishedEvents({
      category: typeof category === "string" ? category : undefined,
      startDatetime:
        typeof startDatetime === "string" && startDatetime.length > 0
          ? new Date(startDatetime)
          : undefined,
      endDatetime:
        typeof endDatetime === "string" && endDatetime.length > 0
          ? new Date(endDatetime)
          : undefined,
    });

    if (!result.ok) {
      if (result.value instanceof InvalidDateRangeError) {
        res.status(400).render("partials/error", {
          message: result.value.message,
          layout: false,
        });
        return;
      }

      res.status(500).render("partials/error", {
        message: "Unexpected server error.",
        layout: false,
      });
      return;
    }

    res.status(200).json(result.value);
  }

  async searchEvents(req: Request, res: Response): Promise<void> {
  
    const { q } = req.query;

    const result = await this.eventService.searchPublishedEvents({
      query: typeof q === "string" ? q : undefined,
    });

    const browserSession = recordPageView(req.session as any);

    if (req.get("HX-Request") === "true") {
      return res.render("partials/search-results", {
        events: result.value,
        layout: false,
      });
    }

    return res.status(200).render("events/search", {
      query: typeof q === "string" ? q : "",
      events: result.value,
      pageError: null,
      session: browserSession,
    });
  }

  async showEventDetail(req: Request, res: Response): Promise<void> {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const user = getAuthenticatedUser(req.session as any);

    const result = await this.eventService.getEventById(
      id,
      user?.userId
    );

    if (!result.ok) {
      return res.status(404).render("partials/error", {
        message: (result.value as Error).message,
        layout: false,
      });
    }

    const browserSession = recordPageView(req.session as any);

    return res.render("events/detail", {
      event: result.value,
      session: browserSession,
      pageError: null,
    });
  }

  async createEvent(req: Request, res: Response): Promise<void> {
    const user = getAuthenticatedUser(req.session as any);
    if (!user) return;

    const result = await this.eventService.createEvent(
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

    if (!result.ok) {
      return res.status(400).render("partials/error", {
        message: (result.value as Error).message,
        layout: false,
      });
    }

    if (req.get("HX-Request") === "true") {
      return res.render("partials/success", {
        message: "Event created successfully!",
        layout: false,
      });
    }
    
    return res.redirect(`/events/${result.value.id}`);
  }
}

export function CreateEventController(
  eventService: EventService,
): IEventController {
  return new EventController(eventService);
}
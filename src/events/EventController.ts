import type { Request, Response } from "express";
import { EventService, InvalidDateRangeError } from "./EventService";

export interface IEventController {
  filterEvents(req: Request, res: Response): Promise<void>;
  searchEvents(req: Request, res: Response): Promise<void>;
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
    const { q } = req.query

    const result = await this.eventService.searchPublishedEvents({
      query: typeof q === "string" ? q : undefined,
    })

    res.status(200).render("events/search", {
      query: typeof q === "string" ? q : "",
      events: result.value,
      pageError: null,
    })
  }
}

export function CreateEventController(
  eventService: EventService,
): IEventController {
  return new EventController(eventService);
}
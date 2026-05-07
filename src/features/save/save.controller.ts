// Save controller: handles toggle save and get saved events requests
import type { Request, Response } from "express";
import { toggleSave, getSavedEvents } from "./save.service.js";
import { getAuthenticatedUser } from "../../session/AppSession.js";

export async function handleToggleSave(req: Request, res: Response) {
  const eventId = typeof req.params.eventId === 'string' ? req.params.eventId : req.params.eventId[0];
  const user = getAuthenticatedUser(req.session as any);
  if (!user) return res.status(401).send("Not authenticated");
  if (!eventId) return res.status(400).send("Event ID is required");

  const result = await toggleSave(eventId, user.userId, user.role);
  if (result.ok === false) {
    const status = result.value.name === "UnauthorizedError" ? 403 : 400;
    return res.status(status).send(
      `<p class="text-red-600 text-sm">${result.value.message}</p>`
    );
  }
  const { saved } = result.value;
  return res.status(200).send(`
    <button id="save-btn"
            hx-post="/events/${eventId}/save"
            hx-target="#save-btn"
            hx-swap="outerHTML"
            class="px-4 py-2 rounded-lg border font-medium text-sm cursor-pointer">
      ${saved ? "★ Saved" : "☆ Save for Later"}
    </button>
  `);
}

export async function handleGetSavedEvents(req: Request, res: Response) {
  const user = getAuthenticatedUser(req.session as any);
  if (!user) return res.status(401).send("Not authenticated");

  const result = await getSavedEvents(user.userId, user.role);
  if (result.ok === false) {
    return res.status(403).send(result.value.message);
  }
  return res.render("partials/save", {
    savedEvents: result.value,
    layout: false,
  });
}
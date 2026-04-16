// ensure eventId is always a string regardless of route param type
// Save controller: handles toggle save and get saved events requests
import type { Request, Response } from "express";
import { toggleSave, getSavedEvents } from "./save.service.js";
import { getAuthenticatedUser } from "../../session/AppSession.js";

export async function handleToggleSave(req: Request, res: Response) {
  const eventId = typeof req.params.eventId === 'string' ? req.params.eventId : req.params.eventId[0];
  const user = getAuthenticatedUser(req.session as any);
  if (!user) return res.status(401).send("Not authenticated");
  if (!eventId) return res.status(400).send("Event ID is required");

  const result = toggleSave(eventId, user.userId, user.role);
  if (result.ok === false) {
    return res.status(403).send(result.error.message);
  }
  return res.status(200).send(result.value);
}

export async function handleGetSavedEvents(req: Request, res: Response) {
  const user = getAuthenticatedUser(req.session as any);
  if (!user) return res.status(401).send("Not authenticated");

  const result = getSavedEvents(user.userId, user.role);
  if (result.ok === false) {
    return res.status(403).send(result.error.message);
  }
  return res.render("partials/save", {
    savedEvents: result.value,
  });
}
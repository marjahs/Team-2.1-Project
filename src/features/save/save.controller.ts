import type { Request, Response } from "express";
import { toggleSave, getSavedEvents } from "./save.service.js";
import { getAuthenticatedUser } from "../../session/AppSession.js";

export async function handleToggleSave(req: Request, res: Response) {
  const { eventId } = req.params;
  const user = getAuthenticatedUser(req.session as any);
  if (!user) return res.status(401).send("Not authenticated");

  const result = toggleSave(eventId, user.userId, user.role);
  if (result.ok === false) {
    return res.status(403).send(result.error.message);
  }
  return res.status(200).send(result.value);
}

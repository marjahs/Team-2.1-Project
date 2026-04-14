import type { Request, Response } from "express";
import { toggleSave, getSavedEvents } from "./save.service.js";

export async function handleToggleSave(req: Request, res: Response) {
  const { eventId } = req.params;
  const userId = req.session.userId as string;
  const userRole = req.session.userRole as string;

  const result = toggleSave(eventId, userId, userRole);

  if (result.ok === false) {
    return res.status(403).send(result.error.message);
  }

  return res.status(200).send(result.value);
}

export async function handleGetSavedEvents(req: Request, res: Response) {
  const userId = req.session.userId as string;
  const userRole = req.session.userRole as string;

  const result = getSavedEvents(userId, userRole);

  if (result.ok === false) {
    return res.status(403).send(result.error.message);
  }

  return res.status(200).send(result.value);
}
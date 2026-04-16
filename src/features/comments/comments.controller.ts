// ensure eventId is always a string regardless of route param type
// import type { Request, Response } from "express";
import { postComment, getComments, removeComment } from "./comments.service.js";
import { getAuthenticatedUser } from "../../session/AppSession.js";

export async function handlePostComment(req: Request, res: Response) {
  const eventId = typeof req.params.eventId === 'string' ? req.params.eventId : req.params.eventId[0];
  const { text } = req.body;
  const user = getAuthenticatedUser(req.session as any);
  if (!user) return res.status(401).send("Not authenticated");

  const result = postComment(eventId, user.userId, text);
  if (result.ok === false) {
    return res.status(400).send(result.error.message);
  }
  return res.status(201).send(result.value);
}
export async function handleGetComments(req: Request, res: Response) {
  const eventId = typeof req.params.eventId === 'string' ? req.params.eventId : req.params.eventId[0];
  const user = getAuthenticatedUser(req.session as any);
  if (!user) return res.status(401).send("Not authenticated");
  if (!eventId) return res.status(400).send("Event ID is required");

  const result = getComments(eventId);
  return res.status(200).send(result.value);
}
export async function handleDeleteComment(req: Request, res: Response) {
  const { commentId } = req.params;
  const user = getAuthenticatedUser(req.session as any);
  if (!user) return res.status(401).send("Not authenticated");

  const organizerId = req.body.organizerId as string;
  const result = removeComment(commentId, user.userId, user.role, organizerId);
  if (result.ok === false) {
    if (result.error.name === "CommentNotFoundError") {
      return res.status(404).send(result.error.message);
    }
    return res.status(403).send(result.error.message);
  }
  return res.status(200).send(result.value);
}
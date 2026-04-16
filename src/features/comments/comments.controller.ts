import type { Request, Response } from "express";
import { postComment, getComments, removeComment } from "./comments.service.js";
import { getAuthenticatedUser } from "../../session/AppSession.js";

export async function handlePostComment(req: Request, res: Response) {
  const eventId =
    typeof req.params.eventId === "string" ? req.params.eventId : "";
  const text =
    typeof (req.body as any).text === "string" ? (req.body as any).text : "";
  const user = getAuthenticatedUser(req.session as any);

  if (!user) return res.status(401).send("Not authenticated");

  const result = postComment(eventId, user.userId, text);

  if (result.ok === false) {
    return res.status(400).send(result.error.message);
  }

  return res.status(201).send(result.value);
}

export async function handleGetComments(req: Request, res: Response) {
  const eventId =
    typeof req.params.eventId === "string" ? req.params.eventId : "";
  const user = getAuthenticatedUser(req.session as any);
  if (!user) return res.status(401).send("Not authenticated");
  if (!eventId) return res.status(400).send("Event ID is required");

  const result = getComments(eventId);
  if (result.ok === false) {
    return res.status(400).send("Unable to load comments");
  }
  return res.render("partials/comments", {
    comments: result.value,
    eventId,
    currentUserId: user.userId,
    userRole: user.role,
  });
}
export async function handleDeleteComment(req: Request, res: Response) {
  const commentId =
    typeof req.params.commentId === "string" ? req.params.commentId : "";
  const user = getAuthenticatedUser(req.session as any);

  if (!user) return res.status(401).send("Not authenticated");

  const organizerId =
    typeof (req.body as any).organizerId === "string"
      ? (req.body as any).organizerId
      : "";

  const result = removeComment(commentId, user.userId, user.role, organizerId);

  if (result.ok === false) {
    if (result.error.name === "CommentNotFoundError") {
      return res.status(404).send(result.error.message);
    }
    return res.status(403).send(result.error.message);
  }

  return res.status(200).send(result.value);
}
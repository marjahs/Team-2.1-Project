import type { Request, Response } from "express";
import { postComment, getComments, removeComment } from "./comments.service.js";
import { getAuthenticatedUser } from "../../session/AppSession.js";

export async function handlePostComment(req: Request, res: Response) {
  console.log("BODY:", req.body);
  const eventId =
    typeof req.params.eventId === "string" ? req.params.eventId : "";
  const text =
    typeof (req.body as any).text === "string" ? (req.body as any).text : "";
  const user = getAuthenticatedUser(req.session as any);
  if (!user) return res.status(401).send("Not authenticated");

  const result = await postComment(eventId, user.userId, text);
  if (result.ok === false) {
    return res.status(400).send(
      `<p id="comment-error" class="text-red-600 text-sm">${result.value.message}</p>`
    );
  }
  return res.status(201).render("partials/comment-item", {
    comment: result.value,
    currentUserId: user.userId,
    userRole: user.role,
    layout: false,
  });
}

export async function handleGetComments(req: Request, res: Response) {
  const eventId =
    typeof req.params.eventId === "string" ? req.params.eventId : "";
  const user = getAuthenticatedUser(req.session as any);
  if (!user) return res.status(401).send("Not authenticated");
  if (!eventId) return res.status(400).send("Event ID is required");

  const result = await getComments(eventId);
  if (result.ok === false) {
    return res.status(400).send("Unable to load comments");
  }
  return res.render("partials/comments", {
    comments: result.value,
    eventId,
    currentUserId: user.userId,
    userRole: user.role,
    layout: false,
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

  const result = await removeComment(commentId, user.userId, user.role, organizerId);
  if (result.ok === false) {
    if (result.value.name === "CommentNotFoundError") {
      return res.status(404).send(result.value.message);
    }
    return res.status(403).send(result.value.message);

  }
  return res.status(200).send(result.value);
}
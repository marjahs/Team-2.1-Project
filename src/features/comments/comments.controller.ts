import type { Request, Response } from "express";
import { postComment, getComments, removeComment } from "./comments.service.js";

export async function handlePostComment(req: Request, res: Response) {
  const { eventId } = req.params;
  const { text } = req.body;
  const userId = req.session.userId as string;

  const result = postComment(eventId, userId, text);

  if (result.ok === false) {
    return res.status(400).send(result.error.message);
  }

  return res.status(201).send(result.value);
}

export async function handleGetComments(req: Request, res: Response) {
  const { eventId } = req.params;

  const result = getComments(eventId);

  return res.status(200).send(result.value);
}

export async function handleDeleteComment(req: Request, res: Response) {
  const { commentId } = req.params;
  const userId = req.session.userId as string;
  const userRole = req.session.userRole as string;
  const organizerId = req.body.organizerId as string;

  const result = removeComment(commentId, userId, userRole, organizerId);

  if (result.ok === false) {
    if (result.error.name === "CommentNotFoundError") {
      return res.status(404).send(result.error.message);
    }
    return res.status(403).send(result.error.message);
  }

  return res.status(200).send(result.value);
}

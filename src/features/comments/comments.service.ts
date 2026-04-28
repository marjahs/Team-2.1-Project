import {
  createComment,
  deleteComment,
  getCommentById,
  getCommentsByEvent,
  type Comment,
} from "./comments.repo.js";
import { type Result, Ok, Err } from "../../lib/result.js";

export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInputError";
  }
}

export class CommentNotFoundError extends Error {
  constructor() {
    super("Comment not found");
    this.name = "CommentNotFoundError";
  }
}

export class UnauthorizedError extends Error {
  constructor() {
    super("You do not have permission to do that");
    this.name = "UnauthorizedError";
  }
}

export async function postComment(
  eventId: string,
  userId: string,
  text: string
): Promise<Result<Comment, InvalidInputError>> {
  if (!text || text.trim() === "") {
    return Err(new InvalidInputError("Comment cannot be empty"));
  }
  if (text.length > 500) {
    return Err(new InvalidInputError("Comment cannot exceed 500 characters"));
  }
  const comment = await createComment(eventId, userId, text.trim());
  return Ok(comment);
}

export async function getComments(
  eventId: string
): Promise<Result<Comment[], never>> {
  const result = await getCommentsByEvent(eventId);
  return Ok(result);
}

export async function removeComment(
  commentId: string,
  userId: string,
  userRole: string,
  organizerId: string
): Promise<Result<{ id: string; deleted: boolean }, CommentNotFoundError | UnauthorizedError>> {
  const comment = await getCommentById(commentId);
  if (!comment) {
    return Err(new CommentNotFoundError());
  }
  const isAuthor = comment.userId === userId;
  const isOrganizer = userId === organizerId;
  const isAdmin = userRole === "admin";
  if (!isAuthor && !isOrganizer && !isAdmin) {
    return Err(new UnauthorizedError());
  }
  await deleteComment(commentId);
  return Ok({ id: commentId, deleted: true });
}
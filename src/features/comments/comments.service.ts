import {
  createComment,
  deleteComment,
  getCommentById,
  getCommentsByEvent,
  type Comment,
} from "./comments.repo.js";

// Error types
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

// Result type
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

// Post a comment
export function postComment(
  eventId: string,
  userId: string,
  text: string
): Result<Comment, InvalidInputError> {
  if (!text || text.trim() === "") {
    return { ok: false, error: new InvalidInputError("Comment cannot be empty") };
  }

  if (text.length > 500) {
    return { ok: false, error: new InvalidInputError("Comment cannot exceed 500 characters") };
  }

  const comment = createComment(eventId, userId, text.trim());
  return { ok: true, value: comment };
}

// Get all comments for an event
export function getComments(
  eventId: string
): Result<Comment[], never> {
  const result = getCommentsByEvent(eventId);
  return { ok: true, value: result };
}

// Delete a comment
export function removeComment(
  commentId: string,
  userId: string,
  userRole: string,
  organizerId: string
): Result<{ id: string; deleted: boolean }, CommentNotFoundError | UnauthorizedError> {
  const comment = getCommentById(commentId);

  if (!comment) {
    return { ok: false, error: new CommentNotFoundError() };
  }

  const isAuthor = comment.userId === userId;
  const isOrganizer = userId === organizerId;
  const isAdmin = userRole === "admin";

  if (!isAuthor && !isOrganizer && !isAdmin) {
    return { ok: false, error: new UnauthorizedError() };
  }

  deleteComment(commentId);
  return { ok: true, value: { id: commentId, deleted: true } };
}
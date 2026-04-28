import type { Comment } from "./comments.repo.js";
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

export type CommentRepo = {
  createComment: (eventId: string, userId: string, text: string) => Promise<Comment>;
  getCommentsByEvent: (eventId: string) => Promise<Comment[]>;
  getCommentById: (commentId: string) => Promise<Comment | undefined>;
  deleteComment: (commentId: string) => Promise<boolean>;
};

export function createCommentService(repo: CommentRepo) {
  return {
    postComment: async (eventId: string, userId: string, text: string) => {
      if (!text || text.trim() === "") return Err(new InvalidInputError("Comment cannot be empty"));
      if (text.length > 500) return Err(new InvalidInputError("Comment cannot exceed 500 characters"));
      return Ok(await repo.createComment(eventId, userId, text.trim()));
    },
    getComments: async (eventId: string) => Ok(await repo.getCommentsByEvent(eventId)),
    removeComment: async (commentId: string, userId: string, userRole: string, organizerId: string) => {
      const comment = await repo.getCommentById(commentId);
      if (!comment) return Err(new CommentNotFoundError());
      if (!(comment.userId === userId || userId === organizerId || userRole === "admin"))
        return Err(new UnauthorizedError());
      await repo.deleteComment(commentId);
      return Ok({ id: commentId, deleted: true });
    },
  };
}
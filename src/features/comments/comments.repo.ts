import { randomUUID } from "crypto";

export interface Comment {
  id: string;
  eventId: string;
  userId: string;
  text: string;
  createdAt: Date;
}

const comments: Comment[] = [];

export function createComment(eventId: string, userId: string, text: string): Comment {
  const comment: Comment = {
    id: randomUUID(),
    eventId,
    userId,
    text,
    createdAt: new Date(),
  };
  comments.push(comment);
  return comment;
}

export function getCommentsByEvent(eventId: string): Comment[] {
  return comments.filter((c) => c.eventId === eventId);
}

export function getCommentById(commentId: string): Comment | undefined {
  return comments.find((c) => c.id === commentId);
}

export function deleteComment(commentId: string): boolean {
  const index = comments.findIndex((c) => c.id === commentId);
  if (index === -1) return false;
  comments.splice(index, 1);
  return true;
}
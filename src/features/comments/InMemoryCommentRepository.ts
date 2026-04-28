
import type { Comment } from "./comments.repo.js";

const comments: Comment[] = [];

export async function createComment(eventId: string, userId: string, text: string): Promise<Comment> {
  const comment: Comment = { id: crypto.randomUUID(), eventId, userId, text, createdAt: new Date() };
  comments.push(comment);
  return comment;
}

export async function getCommentsByEvent(eventId: string): Promise<Comment[]> {
  return comments.filter(c => c.eventId === eventId);
}

export async function getCommentById(commentId: string): Promise<Comment | undefined> {
  return comments.find(c => c.id === commentId);
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const idx = comments.findIndex(c => c.id === commentId);
  if (idx === -1) return false;
  comments.splice(idx, 1);
  return true;
}

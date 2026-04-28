import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

export interface Comment {
  id: string;
  eventId: string;
  userId: string;
  text: string;
  createdAt: Date;
}

export async function createComment(
  eventId: string,
  userId: string,
  text: string
): Promise<Comment> {
  return await prisma.comment.create({
    data: { eventId, userId, text },
  });
}

export async function getCommentsByEvent(eventId: string): Promise<Comment[]> {
  return await prisma.comment.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getCommentById(
  commentId: string
): Promise<Comment | undefined> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });
  return comment ?? undefined;
}

export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    await prisma.comment.delete({ where: { id: commentId } });
    return true;
  } catch {
    return false;
  }
}
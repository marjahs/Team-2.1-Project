import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface SavedEvent {
  id: string;
  eventId: string;
  userId: string;
  createdAt: Date;
}

export async function getSavedByUser(userId: string): Promise<SavedEvent[]> {
  return await prisma.savedEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSavedByUserAndEvent(
  userId: string,
  eventId: string
): Promise<SavedEvent | undefined> {
  const result = await prisma.savedEvent.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
  return result ?? undefined;
}

export async function createSaved(
  userId: string,
  eventId: string
): Promise<SavedEvent> {
  return await prisma.savedEvent.create({
    data: { userId, eventId },
  });
}

export async function deleteSaved(id: string): Promise<boolean> {
  try {
    await prisma.savedEvent.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import type { Event, EventStatus } from "./Event.js";
import type { EventFilter, EventRepository } from "./EventRepository.js";

const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

function toEvent(row: any): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    category: row.category,
    status: row.status as EventStatus,
    capacity: row.capacity ?? undefined,
    startDatetime: new Date(row.startDatetime),
    endDatetime: new Date(row.endDatetime),
    organizerId: row.organizerId,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

export class PrismaEventRepository implements EventRepository {
  async getAll(): Promise<Event[]> {
    const rows = await prisma.event.findMany();
    return rows.map(toEvent);
  }

  async getPublished(): Promise<Event[]> {
    const rows = await prisma.event.findMany({
      where: { status: "published" },
    });
    return rows.map(toEvent);
  }

  async save(event: Event): Promise<Event> {
    const row = await prisma.event.create({
      data: {
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        category: event.category,
        status: event.status,
        capacity: event.capacity ?? null,
        startDatetime: event.startDatetime,
        endDatetime: event.endDatetime,
        organizerId: event.organizerId,
      },
    });
    return toEvent(row);
  }

  async findPublishedByFilter(filter: EventFilter): Promise<Event[]> {
    const rows = await prisma.event.findMany({
      where: {
        status: "published",
        ...(filter.category ? { category: filter.category } : {}),
        ...(filter.startDatetime
          ? { startDatetime: { gte: filter.startDatetime } }
          : {}),
        ...(filter.endDatetime
          ? { startDatetime: { lte: filter.endDatetime } }
          : {}),
      },
    });
    return rows.map(toEvent);
  }

  async searchPublished(query: string): Promise<Event[]> {
    const now = new Date();
    const q = query.toLowerCase().trim();

    if (!q) {
      const rows = await prisma.event.findMany({
        where: {
          status: "published",
          startDatetime: { gte: now },
        },
      });
      return rows.map(toEvent);
    }

    const rows = await prisma.event.findMany({
      where: {
        status: "published",
        startDatetime: { gte: now },
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { category: { contains: q } },
          { location: { contains: q } },
        ],
      },
    });
    return rows.map(toEvent);
  }

  async findById(id: string): Promise<Event | null> {
    const row = await prisma.event.findUnique({ where: { id } });
    return row ? toEvent(row) : null;
  }

  async update(
    id: string,
    fields: Partial<Omit<Event, "id" | "createdAt">>
  ): Promise<Event | null> {
    try {
      const row = await prisma.event.update({
        where: { id },
        data: {
          ...fields,
          capacity: fields.capacity ?? null,
          updatedAt: new Date(),
        },
      });
      return toEvent(row);
    } catch {
      return null;
    }
  }
}
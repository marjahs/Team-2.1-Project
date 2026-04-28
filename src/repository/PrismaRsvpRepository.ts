import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import type { IRsvpRepository } from "./RsvpRepository"
import type { Rsvp, RsvpStatus } from "./Rsvp"

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" })
const prisma = new PrismaClient({ adapter })

function toRsvp(row: any): Rsvp {
  return {
    id: row.id,
    eventId: row.eventId,
    userId: row.userId,
    status: row.status as RsvpStatus,
    createdAt: new Date(row.createdAt),
  }
}

export class PrismaRsvpRepository implements IRsvpRepository {
  async findByEventAndUser(eventId: string, userId: string): Promise<Rsvp | null> {
    const row = await prisma.rsvp.findFirst({
      where: { eventId, userId },
    })
    return row ? toRsvp(row) : null
  }

  async listByUser(userId: string): Promise<Rsvp[]> {
    const rows = await prisma.rsvp.findMany({ where: { userId } })
    return rows.map(toRsvp)
  }

  async listByEvent(eventId: string): Promise<Rsvp[]> {
    const rows = await prisma.rsvp.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map(toRsvp)
  }

  async create(rsvp: Rsvp): Promise<Rsvp> {
    const row = await prisma.rsvp.create({
      data: {
        id: rsvp.id || undefined,
        eventId: rsvp.eventId,
        userId: rsvp.userId,
        status: rsvp.status,
      },
    })
    return toRsvp(row)
  }

  async update(rsvp: Rsvp): Promise<Rsvp> {
    const row = await prisma.rsvp.update({
      where: { id: rsvp.id },
      data: { status: rsvp.status },
    })
    return toRsvp(row)
  }
}
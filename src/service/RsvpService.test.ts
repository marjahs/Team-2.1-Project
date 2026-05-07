import type { Event } from "../events/Event";
import { InMemoryEventRepository } from "../events/InMemoryEventRepository";
import { InMemoryRsvpRepository } from "../repository/InMemoryRsvpRepository";
import {
  RsvpEventNotFoundError,
  RsvpEventNotRsvpableError,
  RsvpInvalidInputError,
} from "./RsvpErrors";
import { CreateRsvpService } from "./RsvpService";

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "event-1",
    title: "Board Game Night",
    description: "A night of games.",
    location: "Campus Center",
    category: "social",
    status: "published",
    capacity: 2,
    startDatetime: new Date("2026-04-20T18:00:00.000Z"),
    endDatetime: new Date("2026-04-20T20:00:00.000Z"),
    organizerId: "organizer-1",
    createdAt: new Date("2026-04-01T12:00:00.000Z"),
    updatedAt: new Date("2026-04-01T12:00:00.000Z"),
    ...overrides,
  };
}

describe("CreateRsvpService", () => {
  let events: InMemoryEventRepository;
  let rsvps: InMemoryRsvpRepository;

  beforeEach(() => {
    events = new InMemoryEventRepository();
    rsvps = new InMemoryRsvpRepository();
  });

  it("creates a going RSVP when capacity is available", async () => {
    await events.save(makeEvent({ capacity: 2 }));

    const service = CreateRsvpService(events, rsvps);
    const result = await service.toggleRsvp({
      eventId: "event-1",
      actingUserId: "user-1",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");

    expect(result.value.eventId).toBe("event-1");
    expect(result.value.userId).toBe("user-1");
    expect(result.value.status).toBe("going");
  });

  it("creates a waitlisted RSVP when capacity is full", async () => {
    await events.save(makeEvent({ capacity: 1 }));

    const service = CreateRsvpService(events, rsvps);

    const first = await service.toggleRsvp({
      eventId: "event-1",
      actingUserId: "user-1",
    });
    expect(first.ok).toBe(true);

    const second = await service.toggleRsvp({
      eventId: "event-1",
      actingUserId: "user-2",
    });

    expect(second.ok).toBe(true);
    if (!second.ok) throw new Error("expected ok");
    expect(second.value.status).toBe("waitlisted");
  });

  it("cancels an active RSVP on second toggle", async () => {
    await events.save(makeEvent());

    const service = CreateRsvpService(events, rsvps);

    const first = await service.toggleRsvp({
      eventId: "event-1",
      actingUserId: "user-1",
    });
    expect(first.ok).toBe(true);

    const second = await service.toggleRsvp({
      eventId: "event-1",
      actingUserId: "user-1",
    });

    expect(second.ok).toBe(true);
    if (!second.ok) throw new Error("expected ok");
    expect(second.value.status).toBe("cancelled");
  });

  it("reactivates a cancelled RSVP", async () => {
    await events.save(makeEvent());

    const service = CreateRsvpService(events, rsvps);

    await service.toggleRsvp({
      eventId: "event-1",
      actingUserId: "user-1",
    });

    await service.toggleRsvp({
      eventId: "event-1",
      actingUserId: "user-1",
    });

    const result = await service.toggleRsvp({
      eventId: "event-1",
      actingUserId: "user-1",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.value.status).toBe("going");
  });

  it("reactivates a cancelled RSVP as waitlisted when capacity is full", async () => {
    await events.save(makeEvent({ capacity: 1 }));

    const service = CreateRsvpService(events, rsvps);

    await service.toggleRsvp({
      eventId: "event-1",
      actingUserId: "user-1",
    });

    await service.toggleRsvp({
      eventId: "event-1",
      actingUserId: "user-1",
    });

    await service.toggleRsvp({
      eventId: "event-1",
      actingUserId: "user-2",
    });

    const result = await service.toggleRsvp({
      eventId: "event-1",
      actingUserId: "user-1",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.value.status).toBe("waitlisted");
  });

  it("returns an invalid input error for blank ids", async () => {
    await events.save(makeEvent());

    const service = CreateRsvpService(events, rsvps);
    const result = await service.toggleRsvp({
      eventId: "   ",
      actingUserId: "user-1",
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected err");
    expect(result.value).toBeInstanceOf(RsvpInvalidInputError);
  });

  it("returns not found for missing events", async () => {
    const service = CreateRsvpService(events, rsvps);
    const result = await service.toggleRsvp({
      eventId: "missing",
      actingUserId: "user-1",
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected err");
    expect(result.value).toBeInstanceOf(RsvpEventNotFoundError);
  });

  it.each([
    ["draft", makeEvent({ status: "draft" as const })],
    ["cancelled", makeEvent({ status: "cancelled" as const })],
    ["past", makeEvent({ status: "past" as const })],
  ])("rejects %s events", async (_label, event) => {
    await events.save(event);

    const service = CreateRsvpService(events, rsvps);
    const result = await service.toggleRsvp({
      eventId: "event-1",
      actingUserId: "user-1",
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected err");
    expect(result.value).toBeInstanceOf(RsvpEventNotRsvpableError);
  });

  it("rejects the organizer", async () => {
    await events.save(makeEvent({ organizerId: "user-1" }));

    const service = CreateRsvpService(events, rsvps);
    const result = await service.toggleRsvp({
      eventId: "event-1",
      actingUserId: "user-1",
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected err");
    expect(result.value).toBeInstanceOf(RsvpEventNotRsvpableError);
  });

  it("rejects admins", async () => {
    await events.save(makeEvent());

    const service = CreateRsvpService(events, rsvps);
    const result = await service.toggleRsvp({
      eventId: "event-1",
      actingUserId: "admin-1",
      actingUserRole: "admin",
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected err");
    expect(result.value).toBeInstanceOf(RsvpEventNotRsvpableError);
  });
});
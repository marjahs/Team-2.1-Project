import express from "express";
import session from "express-session";
import path from "node:path";
import request from "supertest";

import type { Event } from "../../events/Event";
import { InMemoryEventRepository } from "../../events/InMemoryEventRepository";
import { InMemoryRsvpRepository } from "../../repository/InMemoryRsvpRepository";
import { createInitialAppSession, type AppSessionStore } from "../../session/AppSession";
import { CreateRsvpService } from "../../service/RsvpService";
import { RsvpController } from "./RsvpController";

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

function buildApp(controller: RsvpController, authenticated = true) {
  const app = express();

  app.set("view engine", "ejs");
  app.set("views", path.join(process.cwd(), "src/views"));

  app.use(express.urlencoded({ extended: true }));
  app.use(
    session({
      name: "test.sid",
      secret: "test-secret",
      resave: false,
      saveUninitialized: true,
    }),
  );

  app.use((req, _res, next) => {
    if (!authenticated) {
      next();
      return;
    }

    const store = req.session as AppSessionStore;
    const now = new Date("2026-04-01T12:00:00.000Z");
    store.app = createInitialAppSession(now, "test-browser");
    store.app.authenticatedUser = {
      userId: "user-1",
      email: "user@example.com",
      displayName: "Test User",
      role: "user",
      signedInAt: now.toISOString(),
    };

    next();
  });

  app.post("/events/:eventId/rsvp/toggle", (req, res) =>
    controller.toggleFromForm(req, res, req.session as AppSessionStore),
  );

  return app;
}

describe("RsvpController", () => {
  it("returns an HTMX fragment after toggling RSVP", async () => {
    const events = new InMemoryEventRepository();
    const rsvps = new InMemoryRsvpRepository();
    await events.save(makeEvent());

    const controller = new RsvpController(CreateRsvpService(events, rsvps));
    const app = buildApp(controller, true);

    const response = await request(app)
      .post("/events/event-1/rsvp/toggle")
      .set("HX-Request", "true");

    expect(response.status).toBe(200);
    expect(response.text).toContain('hx-post="/events/event-1/rsvp/toggle"');
    expect(response.text).toContain("Current status: going");
  });

  it("redirects back for non-HTMX requests", async () => {
    const events = new InMemoryEventRepository();
    const rsvps = new InMemoryRsvpRepository();
    await events.save(makeEvent());

    const controller = new RsvpController(CreateRsvpService(events, rsvps));
    const app = buildApp(controller, true);

    const response = await request(app)
      .post("/events/event-1/rsvp/toggle")
      .set("Referer", "/events/event-1");

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/events/event-1");
  });

  it("returns 404 for missing events", async () => {
    const events = new InMemoryEventRepository();
    const rsvps = new InMemoryRsvpRepository();

    const controller = new RsvpController(CreateRsvpService(events, rsvps));
    const app = buildApp(controller, true);

    const response = await request(app)
      .post("/events/missing/rsvp/toggle")
      .set("HX-Request", "true");

    expect(response.status).toBe(404);
    expect(response.text).toContain("Event not found.");
  });

  it("returns 403 for admins", async () => {
    const events = new InMemoryEventRepository();
    const rsvps = new InMemoryRsvpRepository();
    await events.save(makeEvent());

    const controller = new RsvpController(CreateRsvpService(events, rsvps));

    const app = express();
    app.set("view engine", "ejs");
    app.set("views", path.join(process.cwd(), "src/views"));
    app.use(express.urlencoded({ extended: true }));
    app.use(
      session({
        name: "test.sid",
        secret: "test-secret",
        resave: false,
        saveUninitialized: true,
      }),
    );
    app.use((req, _res, next) => {
      const store = req.session as AppSessionStore;
      const now = new Date("2026-04-01T12:00:00.000Z");
      store.app = createInitialAppSession(now, "test-browser");
      store.app.authenticatedUser = {
        userId: "admin-1",
        email: "admin@example.com",
        displayName: "Admin User",
        role: "admin",
        signedInAt: now.toISOString(),
      };
      next();
    });
    app.post("/events/:eventId/rsvp/toggle", (req, res) =>
      controller.toggleFromForm(req, res, req.session as AppSessionStore),
    );

    const response = await request(app)
      .post("/events/event-1/rsvp/toggle")
      .set("HX-Request", "true");

    expect(response.status).toBe(403);
    expect(response.text).toContain("Admins cannot RSVP to events.");
  });

  it("returns 401 when the user is not signed in", async () => {
    const events = new InMemoryEventRepository();
    const rsvps = new InMemoryRsvpRepository();
    await events.save(makeEvent());

    const controller = new RsvpController(CreateRsvpService(events, rsvps));
    const app = buildApp(controller, false);

    const response = await request(app)
      .post("/events/event-1/rsvp/toggle")
      .set("HX-Request", "true");

    expect(response.status).toBe(401);
    expect(response.text).toContain("Please log in to continue.");
  });
});
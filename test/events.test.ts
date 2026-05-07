import request from "supertest";
import { createComposedApp, testEventRepository } from "../src/composition";
import type { Event } from "../src/events/Event";

const app = createComposedApp().getExpressApp();

function seedPublishedEvent(overrides: Partial<Event> = {}): void {
  const now = Date.now();
  const event: Event = {
    id:            Math.random().toString(36).slice(2),
    title:         "Test Event",
    description:   "A description",
    location:      "Boston",
    category:      "social",
    status:        "published",
    startDatetime: new Date(now + 86_400_000),
    endDatetime:   new Date(now + 2 * 86_400_000),
    organizerId:   "user-admin",
    createdAt:     new Date(),
    updatedAt:     new Date(),
    ...overrides,
  };
  (testEventRepository as any)["events"].push(event);
}

// ── Feature 6: Filter ────────────────────────────────────────────────────────

describe("GET /events/filter", () => {
  const agent = request.agent(app);

  beforeAll(async () => {
    await agent.post("/login").type("form")
      .send({ email: "admin@app.test", password: "password123" });

    seedPublishedEvent({ title: "Social Mixer", category: "social", location: "Cambridge" });
    seedPublishedEvent({ title: "Art Show", category: "arts", location: "Somerville" });
  }, 30000);

  it("returns 200 and renders the filter page", async () => {
    const res = await agent.get("/events/filter");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Filter Events");
  });

  it("returns only matching category events", async () => {
    const res = await agent.get("/events/filter?category=social");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Social Mixer");
    expect(res.text).not.toContain("Art Show");
  });

  it("returns HTMX partial with no layout when HX-Request header is set", async () => {
    const res = await agent.get("/events/filter?category=arts")
      .set("HX-Request", "true");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Art Show");
    expect(res.text).not.toContain("<html");
  });

  it("returns empty message when no events match", async () => {
    const res = await agent.get("/events/filter?category=volunteer")
      .set("HX-Request", "true");
    expect(res.status).toBe(200);
    expect(res.text).toContain("No published events match your filters");
  });

  it("returns 400 when startDatetime is after endDatetime", async () => {
    const start = new Date(Date.now() + 2 * 86_400_000).toISOString();
    const end   = new Date(Date.now() + 86_400_000).toISOString();
    const res = await agent.get(
      `/events/filter?startDatetime=${encodeURIComponent(start)}&endDatetime=${encodeURIComponent(end)}`
    );
    expect(res.status).toBe(400);
    expect(res.text).toContain("Start date must be before or equal to end date");
  });

  it("redirects unauthenticated users", async () => {
    const res = await request(app).get("/events/filter");
    expect([302, 401]).toContain(res.status);
  });

  it("excludes draft events from filter results", async () => {
    seedPublishedEvent({ title: "Draft Only Event", category: "social", status: "draft" });
    const res = await agent.get("/events/filter?category=social")
      .set("HX-Request", "true");
    expect(res.status).toBe(200);
    expect(res.text).not.toContain("Draft Only Event");
  });
});

// ── Feature 10: Search ───────────────────────────────────────────────────────

describe("GET /events/search", () => {
  const agent = request.agent(app);

  beforeAll(async () => {
    await agent.post("/login").type("form")
      .send({ email: "admin@app.test", password: "password123" });

    seedPublishedEvent({ title: "Yoga in the Park", category: "sports", location: "Northampton" });
    seedPublishedEvent({ title: "Community Potluck", category: "social", location: "Amherst" });
  }, 30000);

  it("returns 200 and renders the search page", async () => {
    const res = await agent.get("/events/search");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Event Search");
  });

  it("returns all published upcoming events when query is empty", async () => {
    const res = await agent.get("/events/search");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Yoga in the Park");
    expect(res.text).toContain("Community Potluck");
  });

  it("returns matching events for a title search", async () => {
    const res = await agent.get("/events/search?q=Yoga");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Yoga in the Park");
    expect(res.text).not.toContain("Community Potluck");
  });

  it("returns matching events for a location search", async () => {
    const res = await agent.get("/events/search?q=Amherst");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Community Potluck");
    expect(res.text).not.toContain("Yoga in the Park");
  });

  it("returns HTMX partial with no layout when HX-Request header is set", async () => {
    const res = await agent.get("/events/search?q=Yoga")
      .set("HX-Request", "true");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Yoga in the Park");
    expect(res.text).not.toContain("<html");
  });

  it("returns empty message when no events match", async () => {
    const res = await agent.get("/events/search?q=zzznomatch")
      .set("HX-Request", "true");
    expect(res.status).toBe(200);
    expect(res.text).toContain("No published upcoming events found");
  });

  it("redirects unauthenticated users", async () => {
    const res = await request(app).get("/events/search");
    expect([302, 401]).toContain(res.status);
  });

  it("treats whitespace-only query the same as empty (returns results)", async () => {
    const res = await agent.get("/events/search?q=   ")
      .set("HX-Request", "true");
    expect(res.status).toBe(200);
    expect(res.text).not.toContain("error");
  });

  it("excludes past events even when query matches", async () => {
    seedPublishedEvent({
      title:         "Past Yoga Retreat",
      category:      "sports",
      startDatetime: new Date(Date.now() - 2 * 86_400_000),
      endDatetime:   new Date(Date.now() - 86_400_000),
    });
    const res = await agent.get("/events/search?q=Past+Yoga")
      .set("HX-Request", "true");
    expect(res.status).toBe(200);
    expect(res.text).not.toContain("Past Yoga Retreat");
  });
});
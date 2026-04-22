import request from "supertest";
import { createComposedApp } from "../src/composition";

const app = createComposedApp().getExpressApp();

describe("Feature 14 — Save for Later", () => {
  const memberAgent = request.agent(app);
  const adminAgent = request.agent(app);

  beforeAll(async () => {
    await memberAgent
      .post("/login")
      .send({ email: "user@app.test", password: "password123" });
    await adminAgent
      .post("/login")
      .send({ email: "admin@app.test", password: "password123" });
  });

  describe("POST /events/:eventId/save", () => {
    it("happy path — first toggle saves, response contains Saved", async () => {
      const res = await memberAgent.post("/events/any-event-id/save");
      expect(res.status).toBe(200);
      expect(res.text).toContain("Saved");
    });

    it("second toggle unsaves, response contains Save for Later", async () => {
      await memberAgent.post("/events/toggle-test-id/save");
      const res = await memberAgent.post("/events/toggle-test-id/save");
      expect(res.status).toBe(200);
      expect(res.text).toContain("Save for Later");
    });

    it("admin cannot save → 403", async () => {
      const res = await adminAgent.post("/events/any-event-id/save");
      expect(res.status).toBe(403);
    });

    it("unauthenticated → 401", async () => {
      const res = await request(app).post("/events/any-event-id/save");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /saved", () => {
    it("member gets saved list → 200", async () => {
      const res = await memberAgent.get("/saved");
      expect(res.status).toBe(200);
    });

    it("admin cannot access saved list → 403", async () => {
      const res = await adminAgent.get("/saved");
      expect(res.status).toBe(403);
    });

    it("unauthenticated → 401 or redirect to login", async () => {
      const res = await request(app).get("/saved");
      expect([401, 302]).toContain(res.status);
    });
  });
});

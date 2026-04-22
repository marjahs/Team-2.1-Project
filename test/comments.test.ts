import request from "supertest";
import { createComposedApp } from "../src/composition";

const app = createComposedApp().getExpressApp();

describe("Feature 13 — Comments", () => {
  const agent = request.agent(app);

  beforeAll(async () => {
    await agent
      .post("/login")
      .send({ email: "user@app.test", password: "password123" });
  });

  describe("POST /events/:eventId/comments", () => {
    it("happy path — valid comment returns 201 with comment HTML", async () => {
      const res = await agent
        .post("/events/test-event/comments")
        .send({ text: "Great event!" });
      expect(res.status).toBe(201);
      expect(res.text).toContain("Great event!");
    });

    it("empty text → 400 with error HTML", async () => {
      const res = await agent
        .post("/events/test-event/comments")
        .send({ text: "" });
      expect(res.status).toBe(400);
      expect(res.text).toContain("empty");
    });

    it("text over 500 chars → 400", async () => {
      const res = await agent
        .post("/events/test-event/comments")
        .send({ text: "x".repeat(501) });
      expect(res.status).toBe(400);
    });

    it("unauthenticated → 401", async () => {
      const res = await request(app)
        .post("/events/test-event/comments")
        .send({ text: "hello" });
      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /comments/:commentId", () => {
    it("author can delete their own comment → 200 empty body", async () => {
      const post = await agent
        .post("/events/test-event/comments")
        .send({ text: "delete me" });
      const match = post.text.match(/id="comment-([^"]+)"/);
      expect(match).not.toBeNull();
      const commentId = match![1];

      const del = await agent.delete(`/comments/${commentId}`);
      expect(del.status).toBe(200);
      expect(del.text).toBe("");
    });

    it("nonexistent comment → 404", async () => {
      const res = await agent.delete("/comments/does-not-exist");
      expect(res.status).toBe(404);
    });

    it("unauthenticated → 401", async () => {
      const res = await request(app).delete("/comments/anything");
      expect(res.status).toBe(401);
    });

    it("different user who is not admin → 403", async () => {
      const post = await agent
        .post("/events/test-event/comments")
        .send({ text: "only I can delete this" });
      const match = post.text.match(/id="comment-([^"]+)"/);
      const commentId = match![1];

      const staffAgent = request.agent(app);
      await staffAgent
        .post("/login")
        .send({ email: "staff@app.test", password: "password123" });
      const res = await staffAgent.delete(`/comments/${commentId}`);
      expect(res.status).toBe(403);
    });
  });
});

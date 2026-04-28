import { Router } from "express";
import express from "express";
import type { createCommentService } from "./comments.service.js";
import { getAuthenticatedUser } from "../../session/AppSession.js";
import { postComment, getComments, removeComment } from "./comments.service.js";

export function createCommentsRouter(service: ReturnType<typeof createCommentService>) {
  const router = Router();
  router.use(express.urlencoded({ extended: true }));
  router.use(express.json());

  router.get("/events/:eventId/comments", async (req, res) => {
    const eventId = typeof req.params.eventId === "string" ? req.params.eventId : "";
    const user = getAuthenticatedUser(req.session as any);
    if (!user) return res.status(401).send("Not authenticated");
    const result = await service.getComments(eventId);
    if (!result.ok) return res.status(400).send("Unable to load comments");
    return res.render("partials/comments", {
      comments: result.value,
      eventId,
      currentUserId: user.userId,
      userRole: user.role,
      layout: false,
    });
  });

  router.post("/events/:eventId/comments", async (req, res) => {
    const eventId = typeof req.params.eventId === "string" ? req.params.eventId : "";
    const text = typeof req.body?.text === "string" ? req.body.text : "";
    const user = getAuthenticatedUser(req.session as any);
    if (!user) return res.status(401).send("Not authenticated");
    const result = await service.postComment(eventId, user.userId, text);
    if (!result.ok) {
      return res.status(400).send(
        `<p id="comment-error" class="text-red-600 text-sm">${result.value.message}</p>`
      );
    }
    return res.status(201).render("partials/comment-item", {
      comment: result.value,
      currentUserId: user.userId,
      userRole: user.role,
      layout: false,
    });
  });

  router.delete("/comments/:commentId", async (req, res) => {
    const commentId = typeof req.params.commentId === "string" ? req.params.commentId : "";
    const user = getAuthenticatedUser(req.session as any);
    if (!user) return res.status(401).send("Not authenticated");
    const result = await service.removeComment(commentId, user.userId, user.role, "");
    if (!result.ok) {
      if (result.value.name === "CommentNotFoundError") return res.status(404).send(result.value.message);
      return res.status(403).send(result.value.message);
    }
    return res.status(200).send("");
  });

  return router;
}
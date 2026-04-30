import { Router } from "express";
import express from "express";
import type { createCommentService } from "./comments.service.js";
import { createCommentsController } from "./comments.controller.js";

export function createCommentsRouter(service: ReturnType<typeof createCommentService>) {
  const router = Router();
  const controller = createCommentsController(service);

  router.use(express.urlencoded({ extended: true }));
  router.use(express.json());

  router.get("/events/:eventId/comments", (req, res) => controller.handleGetComments(req, res));
  router.post("/events/:eventId/comments", (req, res) => controller.handlePostComment(req, res));
  router.delete("/comments/:commentId", (req, res) => controller.handleDeleteComment(req, res));

  return router;
}
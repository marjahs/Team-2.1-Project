import { Router } from "express";
import {
  handlePostComment,
  handleGetComments,
  handleDeleteComment,
} from "./comments.controller.js";

const router = Router();

// Get all comments for an event
router.get("/events/:eventId/comments", handleGetComments);

// Post a comment on an event
router.post("/events/:eventId/comments", handlePostComment);

// Delete a comment
router.delete("/comments/:commentId", handleDeleteComment);

export default router;

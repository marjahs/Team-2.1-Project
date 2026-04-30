import { Router } from "express";
import {
  handlePostComment,
  handleGetComments,
  handleDeleteComment,
} from "./comments.controller.js";

const router = Router();

router.get("/events/:eventId/comments", handleGetComments);
router.post("/events/:eventId/comments", handlePostComment);
router.delete("/comments/:commentId", handleDeleteComment);

export default router;
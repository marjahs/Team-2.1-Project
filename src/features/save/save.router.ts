import { Router } from "express";
import {
  handleToggleSave,
  handleGetSavedEvents,
} from "./save.controller.js";

const router = Router();

// Get all saved 
// events for current user
router.get("/saved", handleGetSavedEvents);

// Toggle save/unsave an event
router.post("/events/:eventId/save", handleToggleSave);

export default router;
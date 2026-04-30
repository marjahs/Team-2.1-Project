import type { Request, Response } from "express";
import type { createCommentService } from "./comments.service.js";
import { getAuthenticatedUser } from "../../session/AppSession.js";

export function createCommentsController(service: ReturnType<typeof createCommentService>) {
  return {
    async handleGetComments(req: Request, res: Response) {
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
    },

    async handlePostComment(req: Request, res: Response) {
      const eventId = typeof req.params.eventId === "string" ? req.params.eventId : "";
      const text = typeof req.body?.text === "string" ? req.body.text : "";
      const user = getAuthenticatedUser(req.session as any);
      if (!user) return res.status(401).send("Not authenticated");
      const result = await service.postComment(eventId, user.userId, text);
      if (!result.ok) {
        return res.status(400).send(
          `<p id="comment-error" class="text-red-600 text-sm">${(result.value as any).message}</p>`
        );
      }
      return res.status(201).render("partials/comment-item", {
        comment: result.value,
        currentUserId: user.userId,
        userRole: user.role,
        layout: false,
      });
    },

    async handleDeleteComment(req: Request, res: Response) {
      const commentId = typeof req.params.commentId === "string" ? req.params.commentId : "";
      const user = getAuthenticatedUser(req.session as any);
      if (!user) return res.status(401).send("Not authenticated");
      const result = await service.removeComment(commentId, user.userId, user.role, "");
      if (!result.ok) {
        if (result.value.name === "CommentNotFoundError") return res.status(404).send(result.value.message);
        return res.status(403).send(result.value.message);
      }
      return res.status(200).send("");
    },
  };
}
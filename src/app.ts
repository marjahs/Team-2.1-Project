import path from "node:path";
import type { IEventController } from "./events/EventController";
import express, { Request, RequestHandler, Response } from "express";
import session from "express-session";
import Layouts from "express-ejs-layouts";
import { IAuthController } from "./auth/AuthController";
import { EventService } from "./service/eventService";
import {
  AuthenticationRequired,
  AuthorizationRequired,
} from "./auth/errors";
import type { UserRole } from "./auth/User";
import { IApp } from "./contracts";
import {
  getAuthenticatedUser,
  isAuthenticatedSession,
  AppSessionStore,
  recordPageView,
  touchAppSession,
} from "./session/AppSession";
import { ILoggingService } from "./service/LoggingService";
import commentsRouter from "./features/comments/comments.router.js";
import saveRouter from "./features/save/save.router.js";

type AsyncRequestHandler = RequestHandler;

function asyncHandler(fn: AsyncRequestHandler) {
  return function wrapped(req: Request, res: Response, next: (value?: unknown) => void) {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function sessionStore(req: Request): AppSessionStore {
  return req.session as AppSessionStore;
}

class ExpressApp implements IApp {
  private readonly app: express.Express;

  constructor(
    private readonly authController: IAuthController,
    private readonly eventController: IEventController,
    private readonly logger: ILoggingService,
  ) {
    this.app = express();
    this.registerMiddleware();
    this.registerTemplating();
    this.registerRoutes();
  }

  private registerMiddleware(): void {
    this.app.use(express.static(path.join(process.cwd(), "src/static")));
    this.app.use(
      session({
        name: "app.sid",
        secret: process.env.SESSION_SECRET ?? "project-starter-demo-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          sameSite: "lax",
        },
      }),
    );
    this.app.use(Layouts);
    this.app.use(express.urlencoded({ extended: true }));
  }

  private registerTemplating(): void {
    this.app.set("view engine", "ejs");
    this.app.set("views", path.join(process.cwd(), "src/views"));
    this.app.set("layout", "layouts/base");
  }

  private isHtmxRequest(req: Request): boolean {
    return req.get("HX-Request") === "true";
  }

  private requireAuthenticated(req: Request, res: Response): boolean {
    const store = sessionStore(req);
    touchAppSession(store);

    if (getAuthenticatedUser(store)) {
      return true;
    }

    this.logger.warn("Blocked unauthenticated request");
    if (this.isHtmxRequest(req) || req.method !== "GET") {
      res.status(401).render("partials/error", {
        message: AuthenticationRequired("Please log in").message,
        layout: false,
      });
      return false;
    }

    res.redirect("/login");
    return false;
  }

  private requireRole(
    req: Request,
    res: Response,
    allowedRoles: UserRole[],
    message: string,
  ): boolean {
    if (!this.requireAuthenticated(req, res)) return false;

    const currentUser = getAuthenticatedUser(sessionStore(req));
    if (currentUser && allowedRoles.includes(currentUser.role)) {
      return true;
    }

    res.status(403).render("partials/error", {
      message: AuthorizationRequired(message).message,
      layout: false,
    });
    return false;
  }

  private registerRoutes(): void {
    this.logger.info("Registering feature routes");
    this.app.get("/", asyncHandler(async (req, res) => {
      const store = sessionStore(req);
      res.redirect(isAuthenticatedSession(store) ? "/home" : "/login");
    }));

    this.app.get("/login", asyncHandler(async (req, res) => {
      const store = sessionStore(req);
      const browserSession = recordPageView(store);

      if (getAuthenticatedUser(store)) {
        res.redirect("/home");
        return;
      }

      await this.authController.showLogin(res, browserSession);
    }));

    this.app.post("/login", asyncHandler(async (req, res) => {
      const email = typeof req.body.email === "string" ? req.body.email : "";
      const password = typeof req.body.password === "string" ? req.body.password : "";
      await this.authController.loginFromForm(res, email, password, sessionStore(req));
    }));

    this.app.get("/home", asyncHandler(async (req, res) => {
      if (!this.requireAuthenticated(req, res)) return;
      const browserSession = recordPageView(sessionStore(req));
      res.render("home", { session: browserSession, pageError: null });
    }));

    // ✅ EVENT CREATION ROUTES (FIXED)

    this.app.get("/events/new", asyncHandler(async (req, res) => {
      if (!this.requireAuthenticated(req, res)) return;
      res.render("events/create");
    }));

    this.app.post("/events", asyncHandler(async (req, res) => {
      if (!this.requireAuthenticated(req, res)) return;

      const user = getAuthenticatedUser(sessionStore(req));
      if (!user) return;

      const result = await EventService.createEvent(
        {
          title: req.body.title,
          description: req.body.description,
          location: req.body.location,
          category: req.body.category,
          capacity: req.body.capacity ? Number(req.body.capacity) : undefined,
          startDatetime: new Date(req.body.startDatetime),
          endDatetime: new Date(req.body.endDatetime),
        },
        user.userId
      );

      // ✅ FIXED LINE HERE
      if (result.ok === false) {
        return res.status(400).render("partials/error", {
          message: result.value.message,
          layout: false,
        });
      }
      return res.redirect(`/events/${result.value.id}`);
    }));

    this.app.get(
      "/events/filter",
      asyncHandler(async (req, res) => {
        if (!this.requireAuthenticated(req, res)) {
          return;
        }

        await this.eventController.filterEvents(req, res);
      }),
    );

    this.app.get(
      "/events/search",
      asyncHandler(async (req, res) => {
        if (!this.requireAuthenticated(req, res)) return;
        await this.eventController.searchEvents(req, res);
      }),
    );
    // ── Feature routes ───────────────────────────────────────────────
    this.app.use(commentsRouter);
    this.app.use(saveRouter);
    // ── Error handler ────────────────────────────────────────────────
     

    this.app.use((err: unknown, _req: Request, res: Response, _next: (value?: unknown) => void) => {
      res.status(500).render("partials/error", {
        message: "Unexpected server error.",
        layout: false,
      });
    });
  }

  getExpressApp(): express.Express {
    return this.app;
  }
}

export function CreateApp(
  authController: IAuthController,
  eventController: IEventController,
  logger: ILoggingService,
): IApp {
  return new ExpressApp(authController, eventController, logger);
}

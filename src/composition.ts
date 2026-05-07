import { CreateAdminUserService } from "./auth/AdminUserService";
import { CreateAuthController } from "./auth/AuthController";
import { CreateAuthService } from "./auth/AuthService";
import { CreateInMemoryUserRepository } from "./auth/InMemoryUserRepository";
import { CreatePasswordHasher } from "./auth/PasswordHasher";
import { CreateApp } from "./app";
import type { IApp } from "./contracts";
import { CreateEventController } from "./events/EventController";
import { InMemoryEventRepository } from "./events/InMemoryEventRepository";
import { EventService } from "./events/EventService";
import { CreateLoggingService } from "./service/LoggingService";
import type { ILoggingService } from "./service/LoggingService";
import { InMemoryRsvpRepository } from "./repository/InMemoryRsvpRepository"; // ✅ FIXED
import { CreateRsvpService } from "./service/RsvpService";
import { RsvpController } from "./features/rsvp/RsvpController";
import * as commentRepo from "./features/comments/InMemoryCommentRepository.js";
import { createCommentService } from "./features/comments/comments.service.js";
import { createCommentsRouter } from "./features/comments/comments.router.js";


export const testEventRepository = new InMemoryEventRepository();

testEventRepository.events.push(
  {
    id: "yoga-id",
    title: "Yoga in the Park",
    description: "Relaxing yoga session",
    location: "Boston",
    category: "fitness",
    status: "published",
    startDatetime: new Date(Date.now() + 86400000),
    endDatetime: new Date(Date.now() + 172800000),
    organizerId: "user-admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "potluck-id",
    title: "Community Potluck",
    description: "Bring food to share",
    location: "Amherst",
    category: "social",
    status: "published",
    startDatetime: new Date(Date.now() + 86400000),
    endDatetime: new Date(Date.now() + 172800000),
    organizerId: "user-admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "past-event-id",
    title: "Past Yoga Retreat",
    description: "Old event",
    location: "NYC",
    category: "fitness",
    status: "published",
    startDatetime: new Date(Date.now() - 86400000),
    endDatetime: new Date(Date.now() - 3600000),
    organizerId: "user-admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  },


  {
    id: "any-event-id",
    title: "Test Event",
    description: "A test event",
    location: "Test Location",
    category: "social",
    status: "published",
    startDatetime: new Date(Date.now() + 86400000),
    endDatetime: new Date(Date.now() + 172800000),
    organizerId: "user-admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "toggle-test-id",
    title: "Toggle Test Event",
    description: "A test event",
    location: "Test Location",
    category: "social",
    status: "published",
    startDatetime: new Date(Date.now() + 86400000),
    endDatetime: new Date(Date.now() + 172800000),
    organizerId: "user-admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  }
);

export function createComposedApp(logger?: ILoggingService): IApp {
  const resolvedLogger = logger ?? CreateLoggingService();

  const authUsers = CreateInMemoryUserRepository();
  const passwordHasher = CreatePasswordHasher();
  const authService = CreateAuthService(authUsers, passwordHasher);
  const adminUserService = CreateAdminUserService(authUsers, passwordHasher);
  const authController = CreateAuthController(
    authService,
    adminUserService,
    resolvedLogger
  );

  const eventRepository = testEventRepository;
  const rsvpRepository = new InMemoryRsvpRepository(); // ✅ FIXED

  const eventService = new EventService(eventRepository);
  const eventController = CreateEventController(eventService);

  const rsvpService = CreateRsvpService(eventRepository, rsvpRepository);
  const rsvpController = new RsvpController(rsvpService);

  const commentService = createCommentService(commentRepo);
  const commentsRouter = createCommentsRouter(commentService);

  return CreateApp(
    authController,
    eventController,
    rsvpController,
    resolvedLogger,
    commentsRouter
  );
}
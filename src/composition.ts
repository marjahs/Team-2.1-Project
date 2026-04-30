import { CreateAdminUserService } from "./auth/AdminUserService";
import { CreateAuthController } from "./auth/AuthController";
import { CreateAuthService } from "./auth/AuthService";
import { CreateInMemoryUserRepository } from "./auth/InMemoryUserRepository";
import { CreatePasswordHasher } from "./auth/PasswordHasher";
import { CreateApp } from "./app";
import type { IApp } from "./contracts";
import { CreateEventController } from "./events/EventController";
import { InMemoryEventRepository } from "./events/InMemoryEventRepository";
import { PrismaEventRepository } from "./events/PrismaEventRepository";
import { EventService } from "./events/EventService";
import { CreateLoggingService } from "./service/LoggingService";
import type { ILoggingService } from "./service/LoggingService";
import { InMemoryRsvpRepository } from "./repository/InMemoryRsvpRepository";
import { PrismaRsvpRepository } from "./repository/PrismaRsvpRepository";
import { CreateRsvpService } from "./service/RsvpService";
import { RsvpController } from "./features/rsvp/RsvpController";
import { setEventRepository } from "./service/eventPublishingService";
import { setEventRepository as setAttendeeEventRepo, setRsvpRepository } from "./service/attendeeService";
import * as commentRepo from "./features/comments/InMemoryCommentRepository.js";
import { createCommentService } from "./features/comments/comments.service.js";
import { createCommentsRouter } from "./features/comments/comments.router.js";
import { Event } from "./events/Event.js";

export const testEventRepository = new InMemoryEventRepository();
testEventRepository.events.push(
  {
    id: "any-event-id",
    title: "Test Event",
    description: "A test event",
    location: "Test Location",
    category: "social",
    status: "published",
    startDatetime: new Date("2099-01-01"),
    endDatetime: new Date("2099-01-02"),
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
    startDatetime: new Date("2099-01-01"),
    endDatetime: new Date("2099-01-02"),
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
  const authController = CreateAuthController(authService, adminUserService, resolvedLogger);

  const eventRepository = new PrismaEventRepository();
  const rsvpRepository = new PrismaRsvpRepository();
  setEventRepository(eventRepository);
  setAttendeeEventRepo(eventRepository);
  setRsvpRepository(rsvpRepository);

  const eventService = new EventService(eventRepository);
  const eventController = CreateEventController(eventService);
  const rsvpService = CreateRsvpService(eventRepository, rsvpRepository);
  const rsvpController = new RsvpController(rsvpService);

  const commentService = createCommentService(commentRepo);
  const commentsRouter = createCommentsRouter(commentService);
  const seedEvent: Event = {
  id: "any-event-id",
  title: "Test Event",
  description: "A test event",
  location: "Amherst",
  category: "social",
  status: "published",
  startDatetime: new Date(Date.now() + 86400000),
  endDatetime: new Date(Date.now() + 172800000),
  organizerId: "user-admin",
  createdAt: new Date(),
  updatedAt: new Date(),
};
testEventRepository.events.push(seedEvent);
  return CreateApp(authController, eventController, rsvpController, resolvedLogger, commentsRouter);
}
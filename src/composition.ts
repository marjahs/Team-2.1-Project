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

// Keep this exported for tests — tests use InMemory directly
export const testEventRepository = new InMemoryEventRepository();

export function createComposedApp(logger?: ILoggingService): IApp {
  const resolvedLogger = logger ?? CreateLoggingService();

  const authUsers = CreateInMemoryUserRepository();
  const passwordHasher = CreatePasswordHasher();
  const authService = CreateAuthService(authUsers, passwordHasher);
  const adminUserService = CreateAdminUserService(authUsers, passwordHasher);
  const authController = CreateAuthController(
    authService,
    adminUserService,
    resolvedLogger,
  );

  // Use Prisma in production
  const eventRepository = new PrismaEventRepository();
  const rsvpRepository = new PrismaRsvpRepository();

  // Wire Prisma repos into Feature 5 and Feature 12 services
  setEventRepository(eventRepository);
  setAttendeeEventRepo(eventRepository);
  setRsvpRepository(rsvpRepository);

  const eventService = new EventService(eventRepository);
  const eventController = CreateEventController(eventService);

  const rsvpService = CreateRsvpService(eventRepository, rsvpRepository);
  const rsvpController = new RsvpController(rsvpService);

  return CreateApp(authController, eventController, rsvpController, resolvedLogger);
}
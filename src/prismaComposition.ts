import { CreateAdminUserService } from "./auth/AdminUserService";
import { CreateAuthController } from "./auth/AuthController";
import { CreateAuthService } from "./auth/AuthService";
import { CreateInMemoryUserRepository } from "./auth/InMemoryUserRepository";
import { CreatePasswordHasher } from "./auth/PasswordHasher";
import { CreateApp } from "./app";
import type { IApp } from "./contracts";
import { CreateEventController } from "./events/EventController";
import { PrismaEventRepository } from "./events/PrismaEventRepository";
import { EventService } from "./events/EventService";
import { CreateLoggingService } from "./service/LoggingService";
import type { ILoggingService } from "./service/LoggingService";
import { InMemoryRsvpRepository } from "./repository/InMemoryRsvpRepository";
import { CreateRsvpService } from "./service/RsvpService";
import { RsvpController } from "./features/rsvp/RsvpController";

export function createPrismaComposedApp(logger?: ILoggingService): IApp {
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

  const eventRepository = new PrismaEventRepository();
  const eventService = new EventService(eventRepository);
  const eventController = CreateEventController(eventService);

  const rsvpRepository = new InMemoryRsvpRepository();
  const rsvpService = CreateRsvpService(eventRepository, rsvpRepository);
  const rsvpController = new RsvpController(rsvpService);

  return CreateApp(authController, eventController, rsvpController, resolvedLogger);
}
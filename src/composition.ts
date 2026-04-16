import { CreateAdminUserService } from "./auth/AdminUserService";
import { CreateAuthController } from "./auth/AuthController";
import { CreateAuthService } from "./auth/AuthService";
import { CreateInMemoryUserRepository } from "./auth/InMemoryUserRepository";
import { CreatePasswordHasher } from "./auth/PasswordHasher";

import { CreateApp } from "./app";
import type { IApp } from "./contracts";

import { CreateLoggingService } from "./service/LoggingService";
import type { ILoggingService } from "./service/LoggingService";

// Events
import { InMemoryEventRepository } from "./events/InMemoryEventRepository";
import { EventService } from "./events/EventService";

// RSVPs
import { InMemoryRsvpRepository } from "./repository/InMemoryRsvpRepository";
import { CreateRsvpService } from "./service/RsvpService";
import { RsvpController } from "./service/RsvpController";

export function createComposedApp(logger?: ILoggingService): IApp {
  const resolvedLogger = logger ?? CreateLoggingService();

  // Authentication wiring
  const authUsers = CreateInMemoryUserRepository();
  const passwordHasher = CreatePasswordHasher();
  const authService = CreateAuthService(authUsers, passwordHasher);
  const adminUserService = CreateAdminUserService(authUsers, passwordHasher);
  const authController = CreateAuthController(authService, adminUserService, resolvedLogger);

  // Events wiring
  const eventRepository = new InMemoryEventRepository();
  const eventService = new EventService(eventRepository);

  // RSVP wiring (Feature 4)
  const rsvpRepository = new InMemoryRsvpRepository();
  const rsvpService = CreateRsvpService(eventRepository, rsvpRepository);
  const rsvpController = new RsvpController(rsvpService);

  return CreateApp(authController, rsvpController, resolvedLogger);
}
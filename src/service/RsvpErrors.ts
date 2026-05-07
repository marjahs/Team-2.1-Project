export class RsvpInvalidInputError extends Error {
  name = "RsvpInvalidInputError";

  constructor(message = "Invalid RSVP request.") {
    super(message);
  }
}

export class RsvpEventNotFoundError extends Error {
  name = "RsvpEventNotFoundError";

  constructor() {
    super("Event not found.");
  }
}

export class RsvpEventNotRsvpableError extends Error {
  name = "RsvpEventNotRsvpableError";

  constructor(message = "You cannot RSVP to this event.") {
    super(message);
  }
}

export type RsvpToggleError =
  | RsvpInvalidInputError
  | RsvpEventNotFoundError
  | RsvpEventNotRsvpableError;
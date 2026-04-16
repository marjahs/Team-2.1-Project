export class RsvpEventNotFoundError extends Error {
    name = "RsvpEventNotFoundError";
    constructor() {
      super("Event not found.");
    }
  }
  
  export class RsvpEventNotRsvpableError extends Error {
    name = "RsvpEventNotRsvpableError";
    constructor(message: string) {
      super(message);
    }
  }
  
  export type RsvpToggleError = RsvpEventNotFoundError | RsvpEventNotRsvpableError;
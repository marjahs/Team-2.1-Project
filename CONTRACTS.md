# CONTRACTS.md
# Team 2.1 — Local Event Board
# Interface contracts for all shared service methods.
# Do not change any method signature without coordinating with the affected teammate first.

---

## EventService.getEventById
**Owner:** Jasmine Eromosele (Feature 2)
**Used by:** Feature 13 (Comments), Feature 14 (Save for Later), Feature 12 (Attendee List)

**Parameters:**
- eventId: string
- userId: string
- userRole: string

**Success:**
`{ ok: true, value: { id, title, description, location, category, status, capacity, startDatetime, endDatetime, organizerId, createdAt, updatedAt } }`

**Errors:**
- `EventNotFoundError` — no event with that ID exists
- `UnauthorizedError` — event is a draft and user is not the organizer or admin

---

## EventService.createEvent
**Owner:** Jasmine Eromosele (Feature 1)
**Used by:** Feature 5 (Publishing & Cancellation), Feature 8 (Organizer Dashboard)

**Parameters:**
- data: { title, description, location, category, capacity?, startDatetime, endDatetime }
- organizerId: string

**Success:**
`{ ok: true, value: { id, title, description, location, category, status: "draft", capacity, startDatetime, endDatetime, organizerId, createdAt, updatedAt } }`

**Errors:**
- `InvalidInputError` — missing required fields or invalid values
- `InvalidDateError` — end time is before start time

---

## EventService.publishEvent / EventService.cancelEvent
**Owner:** Drisilla Twumasi (Feature 5)
**Used by:** Feature 8 (Organizer Dashboard)

**Parameters:**
- eventId: string
- userId: string
- userRole: string

**Success:**
`{ ok: true, value: { id, status, updatedAt } }`

**Errors:**
- `EventNotFoundError` — no event with that ID exists
- `UnauthorizedError` — user is not the organizer or admin
- `InvalidStateError` — event is already in that state or is cancelled/past

---

## RSVPService.toggleRSVP
**Owner:** Feature 4 (not yet assigned)
**Used by:** Feature 7 (My RSVPs Dashboard), Feature 9 (Waitlist Promotion)

**Parameters:**
- eventId: string
- userId: string
- userRole: string

**Success:**
`{ ok: true, value: { id, eventId, userId, status: "going" | "waitlisted" | "cancelled", createdAt } }`

**Errors:**
- `EventNotFoundError` — no event with that ID exists
- `UnauthorizedError` — user is an organizer or admin
- `InvalidStateError` — event is cancelled or past

---

## CommentService.postComment
**Owner:** Marjah Sanon (Feature 13)
**Used by:** Feature 2 (Event Detail Page)

**Parameters:**
- eventId: string
- userId: string
- text: string

**Success:**
`{ ok: true, value: { id, eventId, userId, text, createdAt } }`

**Errors:**
- `EventNotFoundError` — no event with that ID exists
- `InvalidInputError` — comment text is empty

---

## CommentService.deleteComment
**Owner:** Marjah Sanon (Feature 13)
**Used by:** Feature 2 (Event Detail Page)

**Parameters:**
- commentId: string
- userId: string
- userRole: string
- organizerId: string

**Success:**
`{ ok: true, value: { id, deleted: true } }`

**Errors:**
- `CommentNotFoundError` — no comment with that ID exists
- `UnauthorizedError` — user is not the author, organizer, or admin

---

## SaveService.toggleSave
**Owner:** Marjah Sanon (Feature 14)
**Used by:** Feature 2 (Event Detail Page)

**Parameters:**
- eventId: string
- userId: string
- userRole: string

**Success:**
`{ ok: true, value: { id, eventId, userId, saved: true | false } }`

**Errors:**
- `EventNotFoundError` — no event with that ID exists
- `UnauthorizedError` — user is an organizer or admin

---

## SaveService.getSavedEvents
**Owner:** Marjah Sanon (Feature 14)
**Used by:** Feature 2 (Event Detail Page)

**Parameters:**
- userId: string

**Success:**
`{ ok: true, value: [ { id, eventId, userId, createdAt } ] }`

**Errors:**
- `UnauthorizedError` — user is an organizer or admin

---

## EventService.getEventsByOrganizer
**Owner:** Jasmine Eromosele (Feature 1)
**Used by:** Feature 8 (Organizer Dashboard)

**Parameters:**
- organizerId: string
- userId: string
- userRole: string

**Success:**
`{ ok: true, value: [ { id, title, status, category, startDatetime, attendeeCount } ] }`

**Errors:**
- `UnauthorizedError` — user is not an organizer or admin

---

## EventService.filterEvents
**Owner:** Lorna Mokam (Feature 6)
**Used by:** Feature 10 (Event Search)

**Parameters:**
- filters: { category?: string, timeframe?: "all" | "this-week" | "this-weekend" }
- userId: string

**Success:**
`{ ok: true, value: [ { id, title, category, startDatetime, location, status } ] }`

**Errors:**
- `InvalidFilterError` — unrecognized category or timeframe value

---

## EventService.searchEvents
**Owner:** Lorna Mokam (Feature 10)
**Used by:** Feature 6 (Category and Date Filter)

**Parameters:**
- query: string
- userId: string

**Success:**
`{ ok: true, value: [ { id, title, description, location, category, startDatetime } ] }`

**Errors:**
- `InvalidInputError` — query contains invalid characters
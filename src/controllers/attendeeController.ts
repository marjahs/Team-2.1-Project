import type { Request, Response } from 'express'
import { getAttendeesForEvent } from '../service/attendeeService'
import { getAuthenticatedUser } from '../session/AppSession'
import type { GetAttendeesError } from '../service/attendeeService'

export async function handleGetAttendees(req: Request, res: Response): Promise<void> {
  const user = getAuthenticatedUser(req.session as any)
  const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId

  if (!user) {
    res.status(401).render('partials/error', { message: 'You must be logged in.', layout: false })
    return
  }

  const result = await getAttendeesForEvent(eventId, user.userId, user.role)

  if (!result.ok) {
    const error = result.value as GetAttendeesError
    const status = error.name === 'AttendeeEventNotFoundError' ? 404 : 403
    res.status(status).render('partials/error', { message: error.message, layout: false })
    return
  }

  // Group by status
  const grouped = {
    attending: result.value.filter(a => a.status === 'going'),
    waitlisted: result.value.filter(a => a.status === 'waitlisted'),
    cancelled: result.value.filter(a => a.status === 'cancelled'),
  }

  res.render('partials/attendee-list', { grouped, eventId, layout: false })
}
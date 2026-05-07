import type { Request, Response } from 'express'
import { publishEvent, cancelEvent } from '../service/eventPublishingService'
import { getAuthenticatedUser } from '../session/AppSession'
import type { PublishError, CancelError } from '../service/eventPublishingService'

function errorStatus(name: string): number {
  if (name === 'EventNotFoundError') return 404
  if (name === 'UnauthorizedError') return 403
  return 400
}

export async function handlePublish(req: Request, res: Response): Promise<void> {
  const user = getAuthenticatedUser(req.session as any)
  const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId

  if (!user) {
    res.status(401).render('partials/error', { message: 'You must be logged in.', layout: false })
    return
  }

  const result = await publishEvent(eventId, user.userId)

  if (!result.ok) {
  const error = result.value as PublishError
  const status = errorStatus(error.name)
    if (req.get('HX-Request') === 'true') {
      res.status(status).render('partials/error', { message: error.message, layout: false })
      return
    }
  res.status(status).send(error.message)
  return
  }

  if (req.get('HX-Request') === 'true') {
    res.render('partials/event-actions', { event: result.value, session: { authenticatedUser: user }, layout: false })
    return
  }

  res.redirect(`/events/${eventId}`)
}

export async function handleCancel(req: Request, res: Response): Promise<void> {
  const user = getAuthenticatedUser(req.session as any)
  const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId

  if (!user) {
    res.status(401).render('partials/error', { message: 'You must be logged in.', layout: false })
    return
  }

  const result = await cancelEvent(eventId, user.userId, user.role)

  if (!result.ok) {
  const error = result.value as CancelError
  const status = errorStatus(error.name)
    if (req.get('HX-Request') === 'true') {
      res.status(status).render('partials/error', { message: error.message, layout: false })
      return
    }
  res.status(status).send(error.message)
  return
  }

  res.redirect(`/events/${eventId}`)
}
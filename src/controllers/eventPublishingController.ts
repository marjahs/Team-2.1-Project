import type { Request, Response } from 'express'
import { publishEvent, cancelEvent } from '../service/eventPublishingService'

export async function handlePublish(req: Request, res: Response): Promise<void> {
  const userId = req.session.userId 
  const  eventId  = req.params.eventId as string

  if (!userId) {
    res.status(401).send('You must be logged in to publish an event')
    return
  }

  const result = await publishEvent(eventId, userId)

  if (!result.ok) {
    const status =
      result.value.name === 'EventNotFoundError'  ? 404 :
      result.value.name === 'UnauthorizedError'   ? 403 : 400
    res.status(status).send(result.value.message)
    return
  }

  res.redirect(`/events/${eventId}`)
}

export async function handleCancel(req: Request, res: Response): Promise<void> {
  const userId = req.session.userId 
  const  eventId  = req.params.eventID as string

  if (!userId) {
    res.status(401).send('You must be logged in to cancel an event')
    return
  }

  const result = await cancelEvent(eventId, userId)

  if (!result.ok) {
    const status =
      result.value.name === 'EventNotFoundError'  ? 404 :
      result.value.name === 'UnauthorizedError'   ? 403 : 400
    res.status(status).send(result.value.message)
    return
  }

  res.redirect(`/events/${eventId}`)
}
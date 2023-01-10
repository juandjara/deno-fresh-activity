import { HandlerContext } from "$fresh/server.ts";
import db from '@/lib/db.ts'
import { badRequest, notFound } from '@/lib/http.ts'

export const handler = (_req: Request, ctx: HandlerContext): Response => {
  const id = ctx.params.id || ''
  if (!id) {
    return badRequest('Bad Request. Missing id param')
  }

  const msg = db.prepareQuery('select message from messages where guid = ?').first([id])
  if (!msg) {
    return notFound(`Message ${id} Not Found`)
  }

  return new Response(JSON.stringify(msg));
}

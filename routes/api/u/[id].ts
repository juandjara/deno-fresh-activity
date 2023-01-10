import { HandlerContext } from "$fresh/server.ts";
import db from '@/lib/db.ts'
import config, { User } from '@/lib/config.ts'
import { badRequest, json, notFound } from '@/lib/http.ts'

export const handler = (_req: Request, ctx: HandlerContext): Response => {
  const id = ctx.params.id || ''
  if (!id) {
    return badRequest('Bad Request. Missing id param')
  }

  const fullname = `${id}@${config.domain}`
  const user = db.prepareQuery<unknown[], Pick<User, 'actor'>>('select actor from accounts where name = ?').firstEntry([fullname])
  if (!user) {
    return notFound(`User ${fullname} Not Found`)
  }

  return json(JSON.parse(user.actor))
}

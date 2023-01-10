import { HandlerContext } from "$fresh/server.ts";
import db from '@/lib/db.ts'
import { json, badRequest, notFound } from '@/lib/http.ts'
import { User } from '@/lib/config.ts'

export const handler = (req: Request, _ctx: HandlerContext): Response => {
  const resource = new URL(req.url).searchParams.get('resource')
  if (!resource || !resource.includes('acct:')) {
    return badRequest('Bad request. Please make sure "acct:USER@DOMAIN" is what you are sending as the "resource" query parameter.')
  }

  const name = resource.replace('acct:','')
  const user = db.prepareQuery<unknown[], User>('select webfinger from accounts where name = ?').firstEntry([name])
  if (!user) {
    return notFound(`User ${name} Not Found`)
  }

  return json(JSON.parse(user.webfinger))
}

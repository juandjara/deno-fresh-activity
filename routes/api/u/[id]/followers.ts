import { HandlerContext } from "$fresh/server.ts"
import { badRequest, json, notFound } from "@/lib/http.ts"
import db from "@/lib/db.ts"
import { localUserToHandle, localUserToUrl, User } from "../../../../lib/config.ts"

export const handler = (_req: Request, ctx: HandlerContext): Response => {
  const id = ctx.params.id || ''
  if (!id) {
    return badRequest('Bad Request. Missing id param')
  }

  const handle = localUserToHandle(id)
  const user = db
    .prepareQuery<unknown[], Pick<User, 'followers'>>('select followers from accounts where name = ?')
    .firstEntry([handle])

  if (!user) {
    return notFound(`User ${handle} Not Found`)
  }

  const followers = JSON.parse(user.followers || '[]') as string[]
  const object = {
    "@context":["https://www.w3.org/ns/activitystreams"],
    type: "OrderedCollection",
    totalItems: followers.length,
    id: `${localUserToUrl(id)}/followers`,
    first: {
      type: 'OrderedCollectionPage',
      totalItems: followers.length,
      partOf: `${localUserToUrl(id)}/followers`,
      orderedItems: followers,
      id: `${localUserToUrl(id)}/followers?page=1`,
    }
  }

  return json(object)
}
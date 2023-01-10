import { HandlerContext, Handlers } from "$fresh/server.ts";
import db from '@/lib/db.ts'
import { localMessageToUrl, localUserToHandle, localUserToUrl, Message, User, W3_PUBLIC } from "@/lib/config.ts";
import { httpForbidden, badRequest, json } from "@/lib/http.ts";
import signAndSend from "@/lib/signAndSend.ts";

export const handlers: Handlers = {
  GET: (_req: Request, _ctx: HandlerContext) => {
    const rows = db.prepareQuery<unknown[], Message>('select * from messages').allEntries()
    return json({ rows })
  },
  POST: async (req: Request, _ctx: HandlerContext) => {
    const { username, apikey, message } = await req.json()
    const user = db
      .prepareQuery<unknown[], Pick<User, 'apikey'>>('select apikey from usernames where name = ?')
      .firstEntry([localUserToHandle(username)])

    if (user?.apikey !== apikey) {
      return httpForbidden('Wrong API Key')
    }

    return sendCreateMessage(username, message)
  }
}

function sendCreateMessage(username: string, message: string) {
  const user = db
    .prepareQuery<unknown[], Pick<User, 'followers' | 'messages'>>('select messages, followers from accounts where name = ?')
    .firstEntry([localUserToHandle(username)])

  // QUESTION: if every message sent to every follower has a different id, how can we keep a list of "all the messages of a user"
  // let messages = JSON.parse(user?.messages || '[]')
  // const set = new Set(messages)
  // set.add('')
  // messages = [...set]

  const followers = JSON.parse(user?.followers || '[]') as string[]
  if (followers.length === 0) {
    return badRequest(`User ${username} has no followers. No inbox to send this meesage to.`)
  }

  const query = db.prepareQuery('INSERT OR REPLACE INTO messages(guid, message) values(?, ?)')
  for (const follower of followers) {
    const inbox = new URL(`${follower}/inbox`)
    const { create, createId, note, noteId } = buildCreateMessage(username, message, follower)
    query.execute([createId, JSON.stringify(create)])
    query.execute([noteId, JSON.stringify(note)])
    signAndSend(create, username, inbox)
  }
  query.finalize()

  return json({ message: `sent to ${followers.length} followers` })
}

function buildCreateMessage(username: string, message: string, recipient: string) {
  const noteId = crypto.randomUUID()
  const note = {
    id: localMessageToUrl(noteId),
    type: 'Note' as const,
    published: new Date().toISOString(),
    attributedTo: localUserToUrl(username),
    content: message,
    to: [W3_PUBLIC],
  }

  const createId = crypto.randomUUID()
  const create = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: localMessageToUrl(createId),
    type: 'Create',
    actor: localUserToUrl(username),
    to: [W3_PUBLIC],
    cc: [recipient],
    object: note
  }

  return { create, createId, note, noteId }
}

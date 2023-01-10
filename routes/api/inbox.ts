import { HandlerContext, Handlers } from "$fresh/server.ts";
import { http500, json, notFound } from "@/lib/http.ts";
import { localMessageToUrl, localUserFromUrl, localUserToHandle, localUserToUrl, parseJSON, User } from '@/lib/config.ts'
import db from '@/lib/db.ts'
import signAndSend from "../../lib/signAndSend.ts";

export const handler: Handlers = {
  POST: async (req: Request, _ctx: HandlerContext) => {
    const data = await req.json()
  
    if (data.type === 'Follow' && typeof data.object === 'string') {
      return parseFollowMessage(data)
    }
  
    if (data.type === 'Undo' && data.object.type === 'Follow' && typeof data.object.object === 'string') {
      return parseUndoFollowMessage(data)
    }
  
    return new Response(`Nothing to do with this response type ${data.type}`)
  }
}

function parseFollowMessage(data: Record<string, unknown>) {
  try {
    const localUser = localUserFromUrl(data.object as string)
    const inbox = new URL(`${data.actor}/inbox`)

    // respond to origin server with an Accept message
    sendAcceptMessage(data, localUser, inbox)

    // get the followers JSON for the user
    const handle = localUserToHandle(localUser)
    const result = db
      .prepareQuery<unknown[], Pick<User, 'followers'>>('select followers from accounts where name = ?')
      .firstEntry([handle]);

    if (!result) {
      return notFound(`No record found for "${handle}"`);
    }

    // create new followers collection
    let followers = parseJSON(result.followers)
    const set = new Set(followers)
    set.add(data.actor)
    followers = [...set]

    // update into DB
    const newFollowers = db
      .prepareQuery<unknown[], User>('update accounts set followers=? where name = ?')
      .allEntries([JSON.stringify(followers), handle]);

    console.log('updated followers: ', newFollowers);

    return json({ handle, newFollowers })
  } catch (err) {
    console.error(err)
    return http500((err as Error).message)
  }
}

function parseUndoFollowMessage(data: Record<string, unknown>) {
  try {
    const localUser = localUserFromUrl((data.object as Record<string, string>).object)
    const inbox = new URL(`${data.actor}/inbox`)

    // respond to origin server with an Accept message
    sendAcceptMessage(data, localUser, inbox)

    // get the followers JSON for the user
    const handle = localUserToHandle(localUser)
    const result = db
      .prepareQuery<unknown[], Pick<User, 'followers'>>('select followers from accounts where name = ?')
      .firstEntry([handle]);

    if (!result) {
      return notFound(`No record found for "${handle}"`);
    }

    // create new followers collection
    let followers = parseJSON(result.followers);
    const set = new Set(followers);
    set.delete(data.actor)
    followers = [...set]

    // update into DB
    const newFollowers = db
      .prepareQuery<unknown[], User>('update accounts set followers=? where name = ?')
      .allEntries([JSON.stringify(followers), handle]);

    console.log('updated followers: ', newFollowers);

    return json({ handle, newFollowers })
  } catch (err) {
    console.error(err)
    return http500((err as Error).message)
  }
}

function sendAcceptMessage(data: Record<string, unknown>, localUser: string, inbox: URL) {
  const guid = crypto.randomUUID()
  const message = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    'id': localMessageToUrl(guid),
    'type': 'Accept',
    'actor': localUserToUrl(localUser),
    'object': data,
  };
  return signAndSend(message, localUser, inbox);
}

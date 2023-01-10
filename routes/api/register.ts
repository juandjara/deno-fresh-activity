import { HandlerContext, Handlers } from "$fresh/server.ts";
import { badRequest, http500, json } from "../../lib/http.ts"
import cfg, { localUserToHandle, localUserToUrl, User } from '@/lib/config.ts'
import db from '@/lib/db.ts'
import { createKeyPair } from '@/lib/crypto.ts'

export const handler: Handlers = {
  POST: async (req: Request, _ctx: HandlerContext): Promise<Response> => {
    const body = await req.json()
    const account = body.account
    if (!account) {
      return badRequest('Bad request. Please make sure "account" is a property in the POST body.')
    }

    try {
      const { privateKey, publicKey } = await createKeyPair()
      const actor = createActor(account, publicKey);
      const webfinger = createWebfinger(account);
      const apikey = crypto.randomUUID()

      db
        .prepareQuery<unknown[], User>(`
          insert or replace into accounts(name, actor, apikey, pubkey, privkey, webfinger)
          values(?, ?, ?, ?, ?, ?)
        `)
        .execute([
          localUserToHandle(account),
          JSON.stringify(actor),
          apikey,
          publicKey,
          privateKey,
          JSON.stringify(webfinger)
        ]);

      return json({msg: 'ok', apikey});
    } catch (err) {
      return http500(err.message)
    }
  }
}

// TODO: add fields 'icon', 'description' and 'name' (displayName)
function createActor(username: string, pubkey: string) {
  const userUrl = localUserToUrl(username)
  return {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1'
    ] as const,
    'id': userUrl,
    'type': 'Person' as const,
    'preferredUsername': username,
    'inbox': `https://${cfg.domain}/api/inbox`,
    'followers': `${userUrl}/followers`,
    'publicKey': {
      'id': `${userUrl}#main-key`,
      'owner': userUrl,
      'publicKeyPem': pubkey
    }
  };
}

function createWebfinger(username: string) {
  return {
    'subject': `acct:${localUserToHandle(username)}`,
    'links': [
      {
        'rel': 'self' as const,
        'type': 'application/activity+json' as const,
        'href': localUserToUrl(username)
      }
    ]
  };
}

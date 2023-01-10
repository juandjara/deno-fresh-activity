import db from '@/lib/db.ts'
import { notFound } from './http.ts';
import { localUserToHandle, localUserToUrl, User } from './config.ts';
import { digest, signMessage } from './crypto.ts';

export default async function signAndSend(message: Record<string, unknown>, sender: string, inbox: URL) {
  const accountName = localUserToHandle(sender)
  const account = db
    .prepareQuery<unknown[], Pick<User, 'privkey'>>('select privkey from accounts where name = ?')
    .firstEntry([accountName])

  if (!account) {
    return notFound(`Account not found: ${accountName}`)
  }

  const privkey = account.privkey
  const date = new Date().toUTCString()
  const digestHash = await digest(JSON.stringify(message))

  const stringToSign = [
    `(request-target): post ${inbox.pathname}`,
    `host: ${inbox.hostname}`,
    `date: ${date}`,
    `digest: SHA-256=${digestHash}`
  ].join('\n')

  const signature = await signMessage(privkey, stringToSign)
  const signatureHeader = [
    `keyId="${localUserToUrl(sender)}#mainKey"`,
    'headers="(request-target) host date digest"',
    `signature="${signature}"`
  ].join(',')

  console.log(`Sending "${message.type}" message to ${inbox.href}`);

  const res = await fetch(inbox.href, {
    method: 'POST',
    body: JSON.stringify(message),
    headers: {
      'Host': inbox.hostname,
      'Date': date,
      'Digest': `SHA-256=${digestHash}`,
      'Signature': signatureHeader
    }
  })

  const text = await res.text()
  if (res.ok) {
    console.log('Response OK \n', text)
  } else {
    console.error('Error: \n', text)
  }
}

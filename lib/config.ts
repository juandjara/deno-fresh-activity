const config = {
  domain: 'af42-78-30-1-52.ngrok.io'
}
export default config

export const W3_PUBLIC = 'https://www.w3.org/ns/activitystreams#Public'

export type User = {
  name: string
  privkey: string
  pubkey: string
  webfinger: string
  actor: string
  apikey: string
  followers: string
  messages: string
}

export type Message = {
  guid: string
  message: string
}

export function parseJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch (_e) {
    return null;
  }
}

export function localUserToHandle(username: string) {
  return `${username}@${config.domain}`
}

export function localUserToUrl(username: string) {
  return `https://${config.domain}/api/u/${username}`
}

export function localUserFromUrl(url: string) {
  return url.replace(localUserToUrl(''), '')
}

export function localMessageToUrl(guid: string) {
  return `https://${config.domain}/api/m/${guid}`
}

import { encode as b64encode, decode as b64decode } from 'std/encoding/base64.ts'

const PEM_PUBLIC_HEADER = '-----BEGIN PUBLIC KEY-----'
const PEM_PUBLIC_FOOTER = '-----END PUBLIC KEY-----'
const PEM_PRIVATE_HEADER = '-----BEGIN PRIVATE KEY-----'
const PEM_PRIVATE_FOOTER = '-----END PRIVATE KEY-----'

// version of RSA used in all crypyo functions
const RSA = 'RSASSA-PKCS1-v1_5'

// version of SHA used in all crypyo functions
const SHA = 'SHA-256'

/** doc references:
 - https://github.com/mdn/dom-examples/blob/main/web-crypto/sign-verify/rsassa-pkcs1.js#L66
 - https://medium.com/deno-the-complete-reference/public-key-encryption-decryption-in-deno-f7304abe203d
*/
export async function createKeyPair() {
  const { privateKey, publicKey } = await crypto.subtle.generateKey(
    {
      name: RSA,
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: SHA
    },
    true,
    ['verify', 'sign']
  )

  const privBuf = await crypto.subtle.exportKey('pkcs8', privateKey)
  const pubBuf = await crypto.subtle.exportKey('spki', publicKey)

  const privPem = [PEM_PRIVATE_HEADER, b64encode(privBuf), PEM_PRIVATE_FOOTER].join('\n')
  const pubPem = [PEM_PUBLIC_HEADER, b64encode(pubBuf), PEM_PUBLIC_FOOTER].join('\n')

  return {
    privateKey: privPem,
    publicKey: pubPem
  }
}

export async function digest(message: string) {
  const encoded = new TextEncoder().encode(message)
  const buf = await crypto.subtle.digest(SHA, encoded)
  return b64encode(buf)
}

export async function signMessage(privKeyPem: string, message: string) {
  const privKeyContent = privKeyPem.substring(
    PEM_PRIVATE_HEADER.length,
    privKeyPem.length - PEM_PRIVATE_FOOTER.length
  )
  const privKeyBuf = b64decode(privKeyContent).buffer
  const privKey = await crypto.subtle.importKey(
    'pkcs8',
    privKeyBuf,
    { name: RSA, hash: SHA },
    true,
    ['sign']
  )

  const data = new TextEncoder().encode(message)
  const signature = await crypto.subtle.sign(
    RSA,
    privKey,
    data
  )

  return b64encode(signature)
}

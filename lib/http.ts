export function json(data: Record<string, unknown>) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-type': 'application/json'
    }
  })
}

export function badRequest(msg: string) {
  return new Response(msg, { status: 400, statusText: 'Bad Request' })
}

export function httpForbidden(msg: string) {
  return new Response(msg, { status: 403, statusText: 'Forbidden' })
}

export function notFound(msg: string) {
  return new Response(msg, { status: 404, statusText: 'Not Found' })
}

export function http500(msg: string) {
  return new Response(msg, { status: 500, statusText: 'Internal Server Error' })
}

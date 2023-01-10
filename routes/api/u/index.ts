import { HandlerContext } from "$fresh/server.ts";
import db from '@/lib/db.ts'
import { json } from '@/lib/http.ts'
import { User } from '@/lib/config.ts'

export const handler = (_req: Request, _ctx: HandlerContext): Response => {
  const rows = db.prepareQuery<unknown[], User>('select * from accounts').allEntries()
  return json({ rows })
}

import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { verifySession } from "./kimi/session";

export interface Context {
  user?: { id: number; unionId: string; name: string | null; role: string };
}

export async function createContext(opts: FetchCreateContextFnOptions): Promise<Context> {
  const cookie = opts.req.headers.get("cookie");
  if (!cookie) return {};

  try {
    const user = await verifySession(cookie);
    return user ? { user } : {};
  } catch {
    return {};
  }
}

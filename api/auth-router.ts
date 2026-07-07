import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

export const authRouter = createRouter({
  me: publicQuery.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    return ctx.user;
  }),
});

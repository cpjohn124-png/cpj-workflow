import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

export const userRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select({ id: users.id, name: users.name, email: users.email, avatar: users.avatar, role: users.role, createdAt: users.createdAt }).from(users).where(eq(users.role, "user"));
  }),

  admins: publicQuery.query(async () => {
    const db = getDb();
    return db.select({ id: users.id, name: users.name, email: users.email, avatar: users.avatar, role: users.role }).from(users).where(eq(users.role, "admin"));
  }),
});

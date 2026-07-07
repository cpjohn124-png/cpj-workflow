import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { progressUpdates, users } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const progressRouter = createRouter({
  list: publicQuery.input(z.object({ taskId: z.number() })).query(async ({ input }) => {
    const db = getDb();
    return db.select({ id: progressUpdates.id, taskId: progressUpdates.taskId, userId: progressUpdates.userId, content: progressUpdates.content, percentComplete: progressUpdates.percentComplete, createdAt: progressUpdates.createdAt, userName: users.name, userAvatar: users.avatar }).from(progressUpdates).innerJoin(users, eq(progressUpdates.userId, users.id)).where(eq(progressUpdates.taskId, input.taskId)).orderBy(desc(progressUpdates.createdAt));
  }),

  create: authedQuery.input(z.object({ taskId: z.number(), content: z.string().min(1), percentComplete: z.number().min(0).max(100).optional() })).mutation(async ({ input, ctx }) => {
    const db = getDb();
    const [result] = await db.insert(progressUpdates).values({ taskId: input.taskId, userId: ctx.user.id, content: input.content, percentComplete: input.percentComplete ?? 0 });
    return { id: Number(result.insertId), ...input };
  }),

  delete: authedQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(progressUpdates).where(eq(progressUpdates.id, input.id));
    return { success: true };
  }),
});

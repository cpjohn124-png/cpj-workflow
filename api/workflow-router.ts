import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { workflows, tasks, taskAssignees, progressUpdates, users } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const workflowRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    const result = await db.select({
      id: workflows.id,
      title: workflows.title,
      description: workflows.description,
      status: workflows.status,
      createdBy: workflows.createdBy,
      createdAt: workflows.createdAt,
      updatedAt: workflows.updatedAt,
      creatorName: users.name,
    }).from(workflows).leftJoin(users, eq(workflows.createdBy, users.id)).orderBy(desc(workflows.updatedAt));
    return result;
  }),

  getById: publicQuery.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = getDb();
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, input.id));
    if (!workflow) return null;

    const taskList = await db.select().from(tasks).where(eq(tasks.workflowId, input.id)).orderBy(desc(tasks.createdAt));
    const tasksWithAssignees = await Promise.all(taskList.map(async (task) => {
      const assignees = await db.select({ id: users.id, name: users.name, avatar: users.avatar })
        .from(taskAssignees).innerJoin(users, eq(taskAssignees.userId, users.id)).where(eq(taskAssignees.taskId, task.id));
      const progressList = await db.select().from(progressUpdates).where(eq(progressUpdates.taskId, task.id)).orderBy(desc(progressUpdates.createdAt));
      return { ...task, assignees, progressUpdates: progressList, latestProgress: progressList[0] || null };
    }));
    return { ...workflow, tasks: tasksWithAssignees };
  }),

  create: authedQuery.input(z.object({ title: z.string().min(1).max(255), description: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [result] = await db.insert(workflows).values({ title: input.title, description: input.description || null, createdBy: ctx.user.id });
      return { id: Number(result.insertId), ...input };
    }),

  update: authedQuery.input(z.object({ id: z.number(), title: z.string().min(1).max(255).optional(), description: z.string().optional(), status: z.enum(["active", "archived", "completed"]).optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(workflows).set(data).where(eq(workflows.id, id));
      return { success: true };
    }),

  delete: authedQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(workflows).where(eq(workflows.id, input.id));
    return { success: true };
  }),
});

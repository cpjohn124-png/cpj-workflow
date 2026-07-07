import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { tasks, taskAssignees, progressUpdates, users, workflows } from "@db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

export const taskRouter = createRouter({
  list: publicQuery.input(z.object({ workflowId: z.number().optional(), status: z.enum(["todo", "in_progress", "review", "done", "blocked"]).optional(), assigneeId: z.number().optional() }).optional()).query(async ({ input }) => {
    const db = getDb();
    const conditions = [];
    if (input?.workflowId) conditions.push(eq(tasks.workflowId, input.workflowId));
    if (input?.status) conditions.push(eq(tasks.status, input.status));

    const taskList = conditions.length > 0
      ? await db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.createdAt))
      : await db.select().from(tasks).orderBy(desc(tasks.createdAt));

    const tasksWithDetails = await Promise.all(taskList.map(async (task) => {
      const assignees = await db.select({ id: users.id, name: users.name, avatar: users.avatar })
        .from(taskAssignees).innerJoin(users, eq(taskAssignees.userId, users.id)).where(eq(taskAssignees.taskId, task.id));
      const progressList = await db.select().from(progressUpdates).where(eq(progressUpdates.taskId, task.id)).orderBy(desc(progressUpdates.createdAt));
      const [workflow] = await db.select({ title: workflows.title }).from(workflows).where(eq(workflows.id, task.workflowId));
      return { ...task, assignees, progressCount: progressList.length, latestProgress: progressList[0] || null, workflowTitle: workflow?.title || "" };
    }));

    if (input?.assigneeId) return tasksWithDetails.filter(t => t.assignees.some(a => a.id === input.assigneeId));
    return tasksWithDetails;
  }),

  getById: publicQuery.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = getDb();
    const [task] = await db.select().from(tasks).where(eq(tasks.id, input.id));
    if (!task) return null;
    const assignees = await db.select({ id: users.id, name: users.name, avatar: users.avatar })
      .from(taskAssignees).innerJoin(users, eq(taskAssignees.userId, users.id)).where(eq(taskAssignees.taskId, task.id));
    const progressList = await db.select({ id: progressUpdates.id, content: progressUpdates.content, percentComplete: progressUpdates.percentComplete, createdAt: progressUpdates.createdAt, userName: users.name })
      .from(progressUpdates).innerJoin(users, eq(progressUpdates.userId, users.id)).where(eq(progressUpdates.taskId, task.id)).orderBy(desc(progressUpdates.createdAt));
    return { ...task, assignees, progressUpdates: progressList };
  }),

  create: authedQuery.input(z.object({ workflowId: z.number(), title: z.string().min(1).max(255), description: z.string().optional(), priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"), dueDate: z.string().optional(), assigneeIds: z.array(z.number()).default([]) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { assigneeIds, dueDate, ...taskData } = input;
      const [result] = await db.insert(tasks).values({ ...taskData, dueDate: dueDate ? new Date(dueDate) : null, createdBy: ctx.user.id });
      const taskId = Number(result.insertId);
      if (assigneeIds.length > 0) await db.insert(taskAssignees).values(assigneeIds.map(userId => ({ taskId, userId })));
      return { id: taskId, ...input };
    }),

  update: authedQuery.input(z.object({ id: z.number(), title: z.string().min(1).max(255).optional(), description: z.string().optional(), status: z.enum(["todo", "in_progress", "review", "done", "blocked"]).optional(), priority: z.enum(["low", "medium", "high", "urgent"]).optional(), dueDate: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = { ...data };
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
      await db.update(tasks).set(updateData).where(eq(tasks.id, id));
      return { success: true };
    }),

  delete: authedQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(tasks).where(eq(tasks.id, input.id));
    return { success: true };
  }),

  assign: authedQuery.input(z.object({ taskId: z.number(), userIds: z.array(z.number()) })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(taskAssignees).where(eq(taskAssignees.taskId, input.taskId));
    if (input.userIds.length > 0) await db.insert(taskAssignees).values(input.userIds.map(userId => ({ taskId: input.taskId, userId })));
    return { success: true };
  }),

  myTasks: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myAssignments = await db.select({ taskId: taskAssignees.taskId }).from(taskAssignees).where(eq(taskAssignees.userId, ctx.user.id));
    if (myAssignments.length === 0) return [];
    const taskIds = myAssignments.map(a => a.taskId);
    const taskList = await db.select().from(tasks).where(inArray(tasks.id, taskIds)).orderBy(desc(tasks.createdAt));
    return Promise.all(taskList.map(async (task) => {
      const assignees = await db.select({ id: users.id, name: users.name, avatar: users.avatar })
        .from(taskAssignees).innerJoin(users, eq(taskAssignees.userId, users.id)).where(eq(taskAssignees.taskId, task.id));
      const progressList = await db.select().from(progressUpdates).where(eq(progressUpdates.taskId, task.id)).orderBy(desc(progressUpdates.createdAt));
      const [workflow] = await db.select({ title: workflows.title }).from(workflows).where(eq(workflows.id, task.workflowId));
      return { ...task, assignees, progressCount: progressList.length, latestProgress: progressList[0] || null, workflowTitle: workflow?.title || "" };
    }));
  }),
});

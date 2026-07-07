import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getAIService } from "./lib/ai-service";
import { getDb } from "./queries/connection";
import { workflows, tasks, taskAssignees, progressUpdates, users } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const bridgeRouter = createRouter({
  command: publicQuery.input(z.object({ message: z.string(), context: z.string().optional() })).mutation(async ({ input }) => {
    const aiService = getAIService();
    const messages = [{ role: "user" as const, content: input.message }];
    const aiResponse = await aiService.chat(messages);
    const results: Record<string, unknown>[] = [];
    if (aiResponse.actions && aiResponse.actions.length > 0) {
      for (const action of aiResponse.actions) {
        const result = await executeBridgeAction(action.action, action.params);
        results.push(result);
      }
    }
    return { reply: aiResponse.message, executed: aiResponse.actions?.length || 0, results, actions: aiResponse.actions || [] };
  }),

  status: publicQuery.query(async () => {
    const db = getDb();
    const workflowList = await db.select().from(workflows).orderBy(desc(workflows.updatedAt)).limit(10);
    const taskList = await db.select().from(tasks).orderBy(desc(tasks.createdAt)).limit(20);
    const userList = await db.select({ id: users.id, name: users.name, role: users.role }).from(users);
    const stats = { workflows: workflowList.length, tasks: taskList.length, todo: taskList.filter(t => t.status === "todo").length, in_progress: taskList.filter(t => t.status === "in_progress").length, review: taskList.filter(t => t.status === "review").length, done: taskList.filter(t => t.status === "done").length, blocked: taskList.filter(t => t.status === "blocked").length };
    return { stats, workflows: workflowList.map(w => ({ id: w.id, title: w.title, status: w.status })), tasks: taskList.map(t => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, workflowId: t.workflowId })), users: userList };
  }),
});

async function executeBridgeAction(action: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
  const db = getDb();
  switch (action) {
    case "create_workflow": {
      const [result] = await db.insert(workflows).values({ title: params.title as string, description: (params.description as string) || null, createdBy: 1 });
      return { success: true, workflowId: Number(result.insertId), title: params.title };
    }
    case "create_task": {
      const [result] = await db.insert(tasks).values({ workflowId: params.workflowId as number, title: params.title as string, description: (params.description as string) || null, priority: (params.priority as "low" | "medium" | "high" | "urgent") || "medium", createdBy: 1 });
      const taskId = Number(result.insertId);
      const assigneeNames = params.assigneeNames as string[] | undefined;
      if (assigneeNames && assigneeNames.length > 0) {
        const allUsers = await db.select().from(users);
        const matched = allUsers.filter(u => assigneeNames.some(name => u.name?.toLowerCase().includes(name.toLowerCase()) || u.id.toString() === name));
        if (matched.length > 0) await db.insert(taskAssignees).values(matched.map(u => ({ taskId, userId: u.id })));
      }
      return { success: true, taskId, title: params.title };
    }
    case "list_workflows": {
      const result = await db.select().from(workflows).orderBy(desc(workflows.updatedAt));
      return { workflows: result };
    }
    case "list_tasks": {
      const result = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
      return { tasks: result };
    }
    case "update_task_status": {
      await db.update(tasks).set({ status: params.status as "todo" | "in_progress" | "review" | "done" | "blocked" }).where(eq(tasks.id, params.taskId as number));
      return { success: true, taskId: params.taskId, status: params.status };
    }
    case "submit_progress": {
      await db.insert(progressUpdates).values({ taskId: params.taskId as number, userId: 1, content: params.content as string, percentComplete: (params.percentComplete as number) || 0 });
      return { success: true, taskId: params.taskId };
    }
    default:
      return { success: false, message: `未知操作: ${action}` };
  }
}

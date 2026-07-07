import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getAIService } from "./lib/ai-service";
import { getDb } from "./queries/connection";
import { workflows, tasks, taskAssignees, progressUpdates, users } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const aiRouter = createRouter({
  chat: authedQuery.input(z.object({ messages: z.array(z.object({ role: z.enum(["user", "assistant", "system"]), content: z.string() })), confirmAction: z.boolean().optional(), confirmationData: z.record(z.string(), z.unknown()).optional() })).mutation(async ({ input, ctx }) => {
    const aiService = getAIService();
    const db = getDb();
    const userId = ctx.user.id;

    if (input.confirmAction && input.confirmationData) {
      const result = await executeConfirmedAction(input.confirmationData as { action: string; params: Record<string, unknown> }, userId, db);
      return { message: result.message, executed: true, result: result.data };
    }

    const aiResponse = await aiService.chat(input.messages);
    let executionResults: Record<string, unknown>[] = [];
    if (aiResponse.actions && aiResponse.actions.length > 0) {
      for (const action of aiResponse.actions) {
        const result = await executeAction(action.action, action.params, userId, db);
        executionResults.push(result);
      }
    }
    return { message: aiResponse.message, needsConfirmation: aiResponse.needsConfirmation || false, confirmationData: aiResponse.confirmationData, actions: aiResponse.actions || [], results: executionResults };
  }),

  confirmPlan: authedQuery.input(z.object({ title: z.string(), tasks: z.array(z.object({ title: z.string(), description: z.string().optional(), priority: z.enum(["low", "medium", "high", "urgent"]).optional(), assigneeNames: z.array(z.string()).optional() })) })).mutation(async ({ input, ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;
    const [wfResult] = await db.insert(workflows).values({ title: input.title, description: `AI 生成的计划: ${input.title}`, createdBy: userId });
    const workflowId = Number(wfResult.insertId);
    const createdTasks = [];
    for (const taskData of input.tasks) {
      let assigneeIds: number[] = [];
      if (taskData.assigneeNames && taskData.assigneeNames.length > 0) {
        const foundUsers = await db.select().from(users);
        assigneeIds = foundUsers.filter(u => taskData.assigneeNames?.some(name => u.name?.toLowerCase().includes(name.toLowerCase()))).map(u => u.id);
      }
      const [taskResult] = await db.insert(tasks).values({ workflowId, title: taskData.title, description: taskData.description || null, priority: taskData.priority || "medium", createdBy: userId });
      const taskId = Number(taskResult.insertId);
      if (assigneeIds.length > 0) await db.insert(taskAssignees).values(assigneeIds.map(id => ({ taskId, userId: id })));
      createdTasks.push({ id: taskId, title: taskData.title });
    }
    return { message: `✅ 计划「${input.title}」已创建成功！包含 ${createdTasks.length} 个任务。`, workflowId, tasks: createdTasks };
  }),
});

async function executeConfirmedAction(action: { action: string; params: Record<string, unknown> }, userId: number, db: ReturnType<typeof getDb>) {
  const result = await executeAction(action.action, action.params, userId, db);
  return { message: `已执行: ${action.action}`, data: result };
}

async function executeAction(action: string, params: Record<string, unknown>, userId: number, db: ReturnType<typeof getDb>): Promise<Record<string, unknown>> {
  switch (action) {
    case "create_workflow": {
      const [result] = await db.insert(workflows).values({ title: params.title as string, description: (params.description as string) || null, createdBy: userId });
      return { workflowId: Number(result.insertId), title: params.title };
    }
    case "create_task": {
      const [result] = await db.insert(tasks).values({ workflowId: params.workflowId as number, title: params.title as string, description: (params.description as string) || null, priority: (params.priority as "low" | "medium" | "high" | "urgent") || "medium", createdBy: userId });
      const taskId = Number(result.insertId);
      const assigneeIds = params.assigneeIds as number[] | undefined;
      if (assigneeIds && assigneeIds.length > 0) await db.insert(taskAssignees).values(assigneeIds.map(id => ({ taskId, userId: id })));
      return { taskId, title: params.title };
    }
    case "list_workflows": {
      const result = await db.select().from(workflows).orderBy(desc(workflows.updatedAt));
      return { workflows: result };
    }
    case "list_tasks": {
      const result = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
      return { tasks: result };
    }
    case "submit_progress": {
      const [result] = await db.insert(progressUpdates).values({ taskId: params.taskId as number, userId, content: params.content as string, percentComplete: (params.percentComplete as number) || 0 });
      return { progressId: Number(result.insertId) };
    }
    default:
      return { message: `未知操作: ${action}` };
  }
}

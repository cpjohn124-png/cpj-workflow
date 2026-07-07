import { relations } from "drizzle-orm";
import { users, workflows, tasks, taskAssignees, progressUpdates } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  createdWorkflows: many(workflows),
  createdTasks: many(tasks),
  assignedTasks: many(taskAssignees),
  progressUpdates: many(progressUpdates),
}));

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  creator: one(users, { fields: [workflows.createdBy], references: [users.id] }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  workflow: one(workflows, { fields: [tasks.workflowId], references: [workflows.id] }),
  creator: one(users, { fields: [tasks.createdBy], references: [users.id] }),
  assignees: many(taskAssignees),
  progressUpdates: many(progressUpdates),
}));

export const taskAssigneesRelations = relations(taskAssignees, ({ one }) => ({
  task: one(tasks, { fields: [taskAssignees.taskId], references: [tasks.id] }),
  user: one(users, { fields: [taskAssignees.userId], references: [users.id] }),
}));

export const progressUpdatesRelations = relations(progressUpdates, ({ one }) => ({
  task: one(tasks, { fields: [progressUpdates.taskId], references: [tasks.id] }),
  user: one(users, { fields: [progressUpdates.userId], references: [users.id] }),
}));

import { authRouter } from "./auth-router";
import { workflowRouter } from "./workflow-router";
import { taskRouter } from "./task-router";
import { progressRouter } from "./progress-router";
import { userRouter } from "./user-router";
import { aiRouter } from "./ai-router";
import { bridgeRouter } from "./bridge-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  workflow: workflowRouter,
  task: taskRouter,
  progress: progressRouter,
  user: userRouter,
  ai: aiRouter,
  bridge: bridgeRouter,
});

export type AppRouter = typeof appRouter;

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../api/router";

export type RouterOutput = inferRouterOutputs<AppRouter>;
export type Workflow = RouterOutput["workflow"]["list"][number];
export type WorkflowDetail = RouterOutput["workflow"]["getById"];
export type Task = RouterOutput["task"]["list"][number];
export type TaskDetail = RouterOutput["task"]["getById"];
export type ProgressUpdate = RouterOutput["progress"]["list"][number];
export type User = RouterOutput["user"]["list"][number];

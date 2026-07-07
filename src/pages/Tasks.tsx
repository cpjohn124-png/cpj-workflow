import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListTodo, Clock, CheckCircle2, AlertCircle, PlayCircle, Eye } from "lucide-react";

export default function Tasks() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [workflowFilter, setWorkflowFilter] = useState<string>("all");
  const { data: tasks, isLoading } = trpc.task.list.useQuery(statusFilter !== "all" ? { status: statusFilter as "todo" | "in_progress" | "review" | "done" | "blocked" } : {});
  const { data: workflows } = trpc.workflow.list.useQuery();
  const filteredTasks = tasks?.filter(t => workflowFilter === "all" || t.workflowId === Number(workflowFilter));
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = { todo: { label: "待办", color: "text-slate-600", bg: "bg-slate-100" }, in_progress: { label: "进行中", color: "text-blue-600", bg: "bg-blue-50" }, review: { label: "审核中", color: "text-amber-600", bg: "bg-amber-50" }, done: { label: "已完成", color: "text-green-600", bg: "bg-green-50" }, blocked: { label: "阻塞", color: "text-red-600", bg: "bg-red-50" } };
  const priorityConfig: Record<string, { label: string; color: string }> = { low: { label: "低", color: "bg-slate-100 text-slate-600" }, medium: { label: "中", color: "bg-blue-50 text-blue-600" }, high: { label: "高", color: "bg-amber-50 text-amber-600" }, urgent: { label: "紧急", color: "bg-red-50 text-red-600" } };
  const statusIcon = (status: string) => { switch (status) { case "done": return <CheckCircle2 className="h-4 w-4 text-green-500" />; case "blocked": return <AlertCircle className="h-4 w-4 text-red-500" />; case "in_progress": return <PlayCircle className="h-4 w-4 text-blue-500" />; default: return <Clock className="h-4 w-4 text-slate-400" />; } };

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl sm:text-2xl font-bold tracking-tight">任务管理</h2><p className="text-muted-foreground mt-1 text-sm">查看和管理所有任务</p></div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2"><span className="text-sm font-medium shrink-0">状态:</span><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部</SelectItem><SelectItem value="todo">待办</SelectItem><SelectItem value="in_progress">进行中</SelectItem><SelectItem value="review">审核中</SelectItem><SelectItem value="done">已完成</SelectItem><SelectItem value="blocked">阻塞</SelectItem></SelectContent></Select></div>
        <div className="flex items-center gap-2"><span className="text-sm font-medium shrink-0">工作流:</span><Select value={workflowFilter} onValueChange={setWorkflowFilter}><SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部</SelectItem>{workflows?.map(wf => <SelectItem key={wf.id} value={String(wf.id)}>{wf.title}</SelectItem>)}</SelectContent></Select></div>
      </div>
      {isLoading ? <div className="text-center py-12 text-muted-foreground">加载中...</div> : filteredTasks?.length === 0 ? <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12"><ListTodo className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">暂无任务</p></CardContent></Card> : <div className="space-y-3">{filteredTasks?.map(task => <Card key={task.id} className="hover:shadow-sm transition-shadow"><CardContent className="p-4"><div className="flex flex-col sm:flex-row sm:items-start gap-3"><div className="flex items-start gap-3 flex-1 min-w-0">{statusIcon(task.status)}<div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="font-medium truncate">{task.title}</h4><Badge variant="secondary" className={priorityConfig[task.priority]?.color + " border-0 shrink-0"}>{priorityConfig[task.priority]?.label}</Badge></div><p className="text-sm text-muted-foreground mt-1 line-clamp-1">{task.description || "暂无描述"}</p><div className="flex flex-wrap items-center gap-2 mt-2"><span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[task.status].bg} ${statusConfig[task.status].color}`}>{statusConfig[task.status].label}</span><span className="text-xs text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full">{task.workflowTitle}</span>{task.dueDate && <span className="text-xs text-muted-foreground">截止: {new Date(task.dueDate).toLocaleDateString("zh-CN")}</span>}{task.assignees.length > 0 && <div className="flex flex-wrap items-center gap-1"><span className="text-xs text-muted-foreground">负责人:</span>{task.assignees.map(a => <span key={a.id} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{a.name || "未命名"}</span>)}</div>}</div></div></div><div className="flex items-center gap-2 sm:ml-4 self-end sm:self-auto">{task.latestProgress && <span className="text-xs text-muted-foreground whitespace-nowrap">进度: {task.latestProgress.percentComplete || 0}%</span>}<Link to={`/tasks/${task.id}`}><Badge variant="outline" className="cursor-pointer hover:bg-accent"><Eye className="h-3 w-3 mr-1" />详情</Badge></Link></div></div></CardContent></Card>)}</div>}
    </div>
  );
}

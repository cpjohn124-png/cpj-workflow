import { useState } from "react";
import { useParams, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, PlayCircle, Send, UserCircle, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const taskId = Number(id);
  const utils = trpc.useUtils();
  const { data: task, isLoading } = trpc.task.getById.useQuery({ id: taskId });
  const { data: progressList } = trpc.progress.list.useQuery({ taskId });
  const updateTaskMutation = trpc.task.update.useMutation({ onSuccess: () => { utils.task.getById.invalidate({ id: taskId }); utils.task.list.invalidate(); } });
  const createProgressMutation = trpc.progress.create.useMutation({ onSuccess: () => { utils.progress.list.invalidate({ taskId }); utils.task.getById.invalidate({ id: taskId }); setProgressContent(""); setProgressPercent(0); } });
  const [progressContent, setProgressContent] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = { todo: { label: "待办", color: "text-slate-600", bg: "bg-slate-100" }, in_progress: { label: "进行中", color: "text-blue-600", bg: "bg-blue-50" }, review: { label: "审核中", color: "text-amber-600", bg: "bg-amber-50" }, done: { label: "已完成", color: "text-green-600", bg: "bg-green-50" }, blocked: { label: "阻塞", color: "text-red-600", bg: "bg-red-50" } };
  const priorityConfig: Record<string, { label: string; color: string }> = { low: { label: "低", color: "bg-slate-100 text-slate-600" }, medium: { label: "中", color: "bg-blue-50 text-blue-600" }, high: { label: "高", color: "bg-amber-50 text-amber-600" }, urgent: { label: "紧急", color: "bg-red-50 text-red-600" } };
  const statusIcon = (status: string) => { switch (status) { case "done": return <CheckCircle2 className="h-5 w-5 text-green-500" />; case "blocked": return <AlertCircle className="h-5 w-5 text-red-500" />; case "in_progress": return <PlayCircle className="h-5 w-5 text-blue-500" />; default: return <Clock className="h-5 w-5 text-slate-400" />; } };

  const handleSubmitProgress = () => { if (!progressContent.trim()) return; createProgressMutation.mutate({ taskId, content: progressContent, percentComplete: progressPercent }); };
  const handleStatusChange = (newStatus: string) => { updateTaskMutation.mutate({ id: taskId, status: newStatus as "todo" | "in_progress" | "review" | "done" | "blocked" }); };

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;
  if (!task) return <div className="text-center py-12"><p className="text-muted-foreground">任务不存在</p><Link to="/tasks" className="text-primary hover:underline mt-2">返回任务列表</Link></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link to="/tasks" className="p-2 rounded-lg hover:bg-accent transition-colors shrink-0 mt-0.5"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex-1 min-w-0"><div className="flex items-center gap-2">{statusIcon(task.status)}<h2 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{task.title}</h2></div><p className="text-muted-foreground mt-1 text-sm line-clamp-2">{task.description || "暂无描述"}</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">状态</CardTitle></CardHeader><CardContent><Select value={task.status} onValueChange={handleStatusChange}><SelectTrigger className="w-full"><div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full bg-${task.status === "done" ? "green" : task.status === "blocked" ? "red" : task.status === "in_progress" ? "blue" : "slale"}-400`} /><span>{statusConfig[task.status].label}</span></div></SelectTrigger><SelectContent><SelectItem value="todo">待办</SelectItem><SelectItem value="in_progress">进行中</SelectItem><SelectItem value="review">审核中</SelectItem><SelectItem value="done">已完成</SelectItem><SelectItem value="blocked">阻塞</SelectItem></SelectContent></Select></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">优先级</CardTitle></CardHeader><CardContent><Badge variant="secondary" className={priorityConfig[task.priority]?.color + " border-0"}>{priorityConfig[task.priority]?.label}</Badge></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">截止日期</CardTitle></CardHeader><CardContent><span className="text-sm">{task.dueDate ? format(new Date(task.dueDate), "yyyy年MM月dd日", { locale: zhCN }) : "未设置"}</span></CardContent></Card>
      </div>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">负责人</CardTitle></CardHeader><CardContent>{task.assignees.length === 0 ? <p className="text-sm text-muted-foreground">未分配负责人</p> : <div className="flex flex-wrap gap-3">{task.assignees.map(a => <div key={a.id} className="flex items-center gap-2 bg-accent rounded-lg px-3 py-2"><UserCircle className="h-5 w-5 text-muted-foreground" /><span className="text-sm font-medium">{a.name || "未命名"}</span></div>)}</div>}</CardContent></Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Send className="h-4 w-4" />提交进度反馈</CardTitle></CardHeader><CardContent className="space-y-4">
          <div><label className="text-sm font-medium mb-1.5 block">进度内容</label><Textarea placeholder="描述你当前的工作进度..." value={progressContent} onChange={e => setProgressContent(e.target.value)} rows={4} /></div>
          <div><label className="text-sm font-medium mb-3 block">完成百分比: {progressPercent}%</label><Slider value={[progressPercent]} onValueChange={v => setProgressPercent(v[0])} max={100} step={5} className="w-full" /><div className="flex justify-between text-xs text-muted-foreground mt-1"><span>0%</span><span>50%</span><span>100%</span></div></div>
          <Button onClick={handleSubmitProgress} disabled={!progressContent.trim() || createProgressMutation.isPending} className="w-full">{createProgressMutation.isPending ? "提交中..." : "提交反馈"}</Button>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" />进度历史 ({progressList?.length || 0})</CardTitle></CardHeader><CardContent>{(!progressList || progressList.length === 0) ? <div className="text-center py-8 text-muted-foreground">暂无进度反馈</div> : <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">{progressList.map(progress => <div key={progress.id} className="border rounded-lg p-3"><div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1"><div className="flex items-center gap-2"><UserCircle className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">{progress.userName}</span></div><span className="text-xs text-muted-foreground">{progress.createdAt ? format(new Date(progress.createdAt), "MM/dd HH:mm", { locale: zhCN }) : ""}</span></div><p className="text-sm mb-2">{progress.content}</p><div className="flex items-center gap-2"><div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-primary transition-all rounded-full" style={{ width: `${progress.percentComplete || 0}%` }} /></div><span className="text-xs text-muted-foreground w-10 text-right">{progress.percentComplete || 0}%</span></div></div>)}</div>}</CardContent></Card>
      </div>
    </div>
  );
}

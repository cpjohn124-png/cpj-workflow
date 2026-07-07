import { useState } from "react";
import { useParams, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Clock, CheckCircle2, AlertCircle, PlayCircle, Eye } from "lucide-react";

export default function WorkflowDetail() {
  const { id } = useParams<{ id: string }>();
  const workflowId = Number(id);
  const utils = trpc.useUtils();
  const { data: workflow, isLoading } = trpc.workflow.getById.useQuery({ id: workflowId });
  const { data: allUsers } = trpc.user.list.useQuery();
  const createTaskMutation = trpc.task.create.useMutation({ onSuccess: () => { utils.workflow.getById.invalidate({ id: workflowId }); utils.task.list.invalidate(); setTaskOpen(false); resetTaskForm(); } });
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<number[]>([]);
  const resetTaskForm = () => { setTaskTitle(""); setTaskDesc(""); setTaskPriority("medium"); setTaskDueDate(""); setSelectedAssignees([]); };
  const handleCreateTask = () => { if (!taskTitle.trim()) return; createTaskMutation.mutate({ workflowId, title: taskTitle, description: taskDesc || undefined, priority: taskPriority, dueDate: taskDueDate || undefined, assigneeIds: selectedAssignees }); };
  const statusConfig: Record<string, { label: string; variant: string }> = { todo: { label: "待办", variant: "secondary" }, in_progress: { label: "进行中", variant: "default" }, review: { label: "审核中", variant: "outline" }, done: { label: "已完成", variant: "success" }, blocked: { label: "阻塞", variant: "destructive" } };
  const priorityConfig: Record<string, { label: string; color: string }> = { low: { label: "低", color: "bg-slate-100 text-slate-600" }, medium: { label: "中", color: "bg-blue-50 text-blue-600" }, high: { label: "高", color: "bg-amber-50 text-amber-600" }, urgent: { label: "紧急", color: "bg-red-50 text-red-600" } };
  const statusIcon = (status: string) => { switch (status) { case "done": return <CheckCircle2 className="h-4 w-4 text-green-500" />; case "blocked": return <AlertCircle className="h-4 w-4 text-red-500" />; case "in_progress": return <PlayCircle className="h-4 w-4 text-blue-500" />; default: return <Clock className="h-4 w-4 text-slate-400" />; } };

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;
  if (!workflow) return <div className="text-center py-12"><p className="text-muted-foreground">工作流不存在</p><Link to="/workflows" className="text-primary hover:underline mt-2">返回工作流列表</Link></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link to="/workflows" className="p-2 rounded-lg hover:bg-accent transition-colors shrink-0"><ArrowLeft className="h-5 w-5" /></Link>
          <div className="min-w-0"><h2 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{workflow.title}</h2><p className="text-muted-foreground mt-0.5 text-sm truncate">{workflow.description || "暂无描述"}</p></div>
        </div>
        <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />新建任务</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>新建任务</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div><label className="text-sm font-medium mb-1.5 block">任务名称</label><Input placeholder="输入任务名称" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} /></div>
              <div><label className="text-sm font-medium mb-1.5 block">描述</label><Textarea placeholder="输入任务描述（可选）" value={taskDesc} onChange={e => setTaskDesc(e.target.value)} rows={3} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium mb-1.5 block">优先级</label><Select value={taskPriority} onValueChange={(v: "low" | "medium" | "high" | "urgent") => setTaskPriority(v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">低</SelectItem><SelectItem value="medium">中</SelectItem><SelectItem value="high">高</SelectItem><SelectItem value="urgent">紧急</SelectItem></SelectContent></Select></div>
                <div><label className="text-sm font-medium mb-1.5 block">截止日期</label><Input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} /></div>
              </div>
              <div><label className="text-sm font-medium mb-1.5 block">分配给</label><div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">{allUsers?.map(user => <label key={user.id} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={selectedAssignees.includes(user.id)} onChange={e => { if (e.target.checked) setSelectedAssignees([...selectedAssignees, user.id]); else setSelectedAssignees(selectedAssignees.filter(id => id !== user.id)); }} className="rounded" /><span className="text-sm">{user.name || "未命名"}</span></label>)}{(!allUsers || allUsers.length === 0) && <p className="text-sm text-muted-foreground">暂无可分配员工</p>}</div></div>
              <Button onClick={handleCreateTask} disabled={!taskTitle.trim() || createTaskMutation.isPending} className="w-full">{createTaskMutation.isPending ? "创建中..." : "创建任务"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div><h3 className="text-lg font-semibold mb-4">任务列表 ({workflow.tasks?.length || 0})</h3>{workflow.tasks?.length === 0 ? <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12"><Clock className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground mb-4">此工作流下还没有任务</p><Button onClick={() => setTaskOpen(true)}><Plus className="h-4 w-4 mr-2" />创建第一个任务</Button></CardContent></Card> : <div className="space-y-3">{workflow.tasks?.map(task => <Card key={task.id} className="hover:shadow-sm transition-shadow"><CardContent className="p-4"><div className="flex flex-col sm:flex-row sm:items-start gap-3"><div className="flex items-start gap-3 flex-1 min-w-0">{statusIcon(task.status)}<div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="font-medium truncate">{task.title}</h4><Badge variant="secondary" className={priorityConfig[task.priority]?.color + " border-0 shrink-0"}>{priorityConfig[task.priority]?.label}</Badge></div><p className="text-sm text-muted-foreground mt-1 line-clamp-1">{task.description || "暂无描述"}</p><div className="flex flex-wrap items-center gap-2 mt-2"><Badge variant="outline" className="text-xs">{statusConfig[task.status]?.label}</Badge>{task.dueDate && <span className="text-xs text-muted-foreground">截止: {new Date(task.dueDate).toLocaleDateString("zh-CN")}</span>}{task.assignees.length > 0 && <div className="flex flex-wrap items-center gap-1"><span className="text-xs text-muted-foreground">负责人:</span>{task.assignees.map(a => <span key={a.id} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{a.name || "未命名"}</span>)}</div>}</div></div></div><div className="flex items-center gap-2 sm:ml-4 self-end sm:self-auto">{task.latestProgress && <span className="text-xs text-muted-foreground whitespace-nowrap">进度: {task.latestProgress.percentComplete || 0}%</span>}<Link to={`/tasks/${task.id}`}><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></Link></div></div></CardContent></Card>)}</div>}</div>
    </div>
  );
}

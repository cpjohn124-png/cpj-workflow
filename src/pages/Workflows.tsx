import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, Plus, CheckCircle2, PlayCircle, Trash2, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function Workflows() {
  const utils = trpc.useUtils();
  const { data: workflows, isLoading } = trpc.workflow.list.useQuery();
  const createMutation = trpc.workflow.create.useMutation({ onSuccess: () => { utils.workflow.list.invalidate(); setOpen(false); setTitle(""); setDescription(""); } });
  const deleteMutation = trpc.workflow.delete.useMutation({ onSuccess: () => utils.workflow.list.invalidate() });
  const updateMutation = trpc.workflow.update.useMutation({ onSuccess: () => utils.workflow.list.invalidate() });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = () => { if (!title.trim()) return; createMutation.mutate({ title, description: description || undefined }); };

  const statusIcon = (status: string) => { switch (status) { case "active": return <PlayCircle className="h-4 w-4 text-green-500" />; case "completed": return <CheckCircle2 className="h-4 w-4 text-slate-500" />; default: return <FolderKanban className="h-4 w-4" />; } };
  const statusLabel = (status: string) => { switch (status) { case "active": return "进行中"; case "completed": return "已完成"; case "archived": return "已归档"; default: return status; } };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h2 className="text-xl sm:text-2xl font-bold tracking-tight">工作流管理</h2><p className="text-muted-foreground mt-1 text-sm">创建和管理工作流项目</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />新建工作流</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>新建工作流</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div><label className="text-sm font-medium mb-1.5 block">工作流名称</label><Input placeholder="输入工作流名称" value={title} onChange={e => setTitle(e.target.value)} /></div>
              <div><label className="text-sm font-medium mb-1.5 block">描述</label><Textarea placeholder="输入工作流描述（可选）" value={description} onChange={e => setDescription(e.target.value)} rows={4} /></div>
              <Button onClick={handleCreate} disabled={!title.trim() || createMutation.isPending} className="w-full">{createMutation.isPending ? "创建中..." : "创建工作流"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? <div className="text-center py-12 text-muted-foreground">加载中...</div> : workflows?.length === 0 ? <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12"><FolderKanban className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground mb-4">还没有工作流</p><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />创建第一个工作流</Button></CardContent></Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{workflows?.map(wf => <Card key={wf.id} className="group hover:shadow-md transition-shadow"><CardHeader className="pb-3"><div className="flex items-start justify-between"><div className="flex items-center gap-2">{statusIcon(wf.status)}<CardTitle className="text-base">{wf.title}</CardTitle></div><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">{wf.status === "active" && <button onClick={() => updateMutation.mutate({ id: wf.id, status: "completed" })} className="p-1 rounded hover:bg-accent" title="标记完成"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /></button>}<button onClick={() => { if (confirm("确定删除？")) deleteMutation.mutate({ id: wf.id }); }} className="p-1 rounded hover:bg-accent" title="删除"><Trash2 className="h-3.5 w-3.5 text-red-500" /></button></div></div><span className={`text-xs px-2 py-0.5 rounded-full w-fit ${wf.status === "active" ? "bg-green-50 text-green-600" : wf.status === "completed" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-600"}`}>{statusLabel(wf.status)}</span></CardHeader><CardContent><p className="text-sm text-muted-foreground line-clamp-2 mb-3">{wf.description || "暂无描述"}</p><div className="flex items-center justify-between text-xs text-muted-foreground"><span>创建者: {wf.creatorName || "未知"}</span><span>{wf.updatedAt ? format(new Date(wf.updatedAt), "yyyy/MM/dd", { locale: zhCN }) : ""}</span></div><Link to={`/workflows/${wf.id}`} className="flex items-center justify-center gap-1 mt-4 pt-3 border-t text-sm text-primary hover:underline">查看详情 <ArrowRight className="h-3.5 w-3.5" /></Link></CardContent></Card>)}</div>}
    </div>
  );
}

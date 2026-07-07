import { useState, useRef, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Send, Bot, User, Sparkles, CheckCircle2, Loader2, Zap } from "lucide-react";

interface ChatMessage { role: "user" | "assistant" | "system"; content: string; }

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: "你好！我是你的 AI 工作流助手。\n\n你可以直接对我说：\n• \"帮我创建一个新工作流\"\n• \"设计一套专辑发行计划\"\n• \"查看当前进度\"\n• \"把混音任务分配给小李\"" }]);
  const [input, setInput] = useState("");
  const [pendingConfirmation, setPendingConfirmation] = useState<{ data: Record<string, unknown>; message: string; } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      if (data.needsConfirmation && data.confirmationData) { setPendingConfirmation({ data: data.confirmationData as Record<string, unknown>, message: data.message }); setMessages(prev => [...prev, { role: "assistant", content: data.message }]); }
      else { setMessages(prev => [...prev, { role: "assistant", content: data.message }]); }
      if (data.actions?.length) { utils.workflow.list.invalidate(); utils.task.list.invalidate(); }
    },
    onError: (error) => setMessages(prev => [...prev, { role: "assistant", content: `❌ 出错了: ${error.message}` }]),
  });

  const confirmMutation = trpc.ai.confirmPlan.useMutation({
    onSuccess: (data) => { setMessages(prev => [...prev, { role: "assistant", content: data.message }]); setPendingConfirmation(null); utils.workflow.list.invalidate(); utils.task.list.invalidate(); },
  });

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 100); }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages); setInput("");
    chatMutation.mutate({ messages: newMessages.filter(m => m.role !== "system") });
  };

  const handleConfirm = () => {
    if (!pendingConfirmation) return;
    const data = pendingConfirmation.data;
    if (data.title && data.tasks) confirmMutation.mutate({ title: data.title as string, tasks: data.tasks as { title: string; description?: string; priority?: "low" | "medium" | "high" | "urgent"; assigneeNames?: string[]; }[] });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const quickActions = [
    { label: "创建计划", prompt: "帮我设计一套新项目的工作进度计划" },
    { label: "查看进度", prompt: "查看当前所有任务的进度" },
    { label: "新建工作流", prompt: "帮我创建一个新工作流" },
  ];

  return (
    <>
      {!isOpen && <button onClick={() => setIsOpen(true)} className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"><Sparkles className="h-6 w-6" /></button>}
      {isOpen && <Card className="fixed bottom-20 md:bottom-6 right-2 md:right-6 z-50 w-[calc(100%-1rem)] md:w-[420px] h-[550px] flex flex-col shadow-2xl border-2">
        <CardHeader className="px-4 py-3 border-b shrink-0">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center"><Zap className="h-4 w-4 text-primary-foreground" /></div><span>AI 工作流助手</span>{(chatMutation.isPending || confirmMutation.isPending) && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}</div>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-accent transition-colors"><X className="h-4 w-4" /></button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((msg, i) => <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5"><Bot className="h-3.5 w-3.5 text-primary" /></div>}
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>{msg.content}</div>
            {msg.role === "user" && <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5"><User className="h-3.5 w-3.5 text-primary-foreground" /></div>}
          </div>)}
          {pendingConfirmation && <div className="flex items-center gap-2 pl-8">
            <Button size="sm" onClick={handleConfirm} disabled={confirmMutation.isPending} className="text-xs"><CheckCircle2 className="h-3.5 w-3.5 mr-1" />{confirmMutation.isPending ? "执行中..." : "确认执行"}</Button>
            <Button size="sm" variant="outline" onClick={() => setPendingConfirmation(null)} className="text-xs">取消</Button>
          </div>}
          <div ref={messagesEndRef} />
        </CardContent>
        {messages.length <= 1 && <div className="px-3 pb-2 flex flex-wrap gap-1.5">{quickActions.map(a => <button key={a.label} onClick={() => { setInput(a.prompt); inputRef.current?.focus(); }} className="text-xs px-2.5 py-1.5 rounded-full bg-muted hover:bg-accent transition-colors border">{a.label}</button>)}</div>}
        <div className="p-3 border-t shrink-0">
          <div className="flex gap-2">
            <Input ref={inputRef} placeholder="说一句话，我来帮你操作..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={chatMutation.isPending} className="flex-1 text-sm" />
            <Button size="icon" onClick={handleSend} disabled={!input.trim() || chatMutation.isPending} className="shrink-0"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>}
    </>
  );
}

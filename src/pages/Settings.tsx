import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle2, Bot, Shield, Server, Smartphone, MessageSquare, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

export default function Settings() {
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("mobile");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const mcpUrl = `${origin}/mcp`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(label); setTimeout(() => setCopied(null), 2000); });
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <button onClick={() => handleCopy(text, label)} className="ml-2 p-1.5 rounded hover:bg-accent transition-colors" title="复制">
      {copied === label ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
    </button>
  );

  const toggleSection = (section: string) => setExpandedSection(expandedSection === section ? null : section);

  const instructionTemplate = `【系统指令 - 工作流助手】\n\n你是一个工作流管理助手。当用户需要操作工作流平台时，请调用以下 API：\n\nAPI 地址：${origin}/api/trpc/bridge.command\n请求方式：POST\nContent-Type: application/json\n\n请求格式：\n{\n  "message": "用户的自然语言指令",\n  "context": "可选的上下文信息"\n}\n\n你可以帮用户做：\n- 创建工作流项目\n- 创建和分配任务\n- 查看工作进度\n- 更新任务状态\n- 提交进度反馈\n- 设计工作计划\n\n操作前请先询问用户确认，执行后汇报结果。\n\n---\n以上是指令，现在开始和用户对话。`;

  const SectionHeader = ({ icon: Icon, title, subtitle, section }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string; section: string }) => (
    <button onClick={() => toggleSection(section)} className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 text-left">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Icon className="h-4.5 w-4.5 text-primary" /></div>
        <div><h3 className="font-medium text-sm">{title}</h3><p className="text-xs text-muted-foreground">{subtitle}</p></div>
      </div>
      {expandedSection === section ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
    </button>
  );

  return (
    <div className="space-y-4 max-w-2xl">
      <div><h2 className="text-xl sm:text-2xl font-bold tracking-tight">连接 Kimi</h2><p className="text-muted-foreground mt-1 text-sm">选择适合你的方式，让 Kimi 直接操作工作流平台</p></div>
      <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-sm">服务运行中</span></div><Badge variant="outline" className="text-xs">MCP + Bridge</Badge></div></CardContent></Card>
      <Card className="overflow-hidden border-2 border-primary/20">
        <SectionHeader icon={Smartphone} title="方式一：手机端（最简单）" subtitle="复制粘贴指令到 Kimi，直接对话操作" section="mobile" />
        {expandedSection === "mobile" && <CardContent className="px-4 pb-4 pt-0 space-y-4">
          <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-800"><strong>提示：</strong>Kimi 手机 App 暂时不支持 MCP 配置，但可以通过复制粘贴指令的方式实现相同效果。</div>
          <div className="space-y-3">
            <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</div><div><p className="text-sm font-medium">复制下方指令</p><p className="text-xs text-muted-foreground">点击右侧复制按钮</p></div></div>
            <div className="bg-muted rounded-lg p-3 relative"><pre className="text-xs whitespace-pre-wrap break-all pr-8 text-muted-foreground">{instructionTemplate}</pre><div className="absolute top-2 right-2"><CopyButton text={instructionTemplate} label="instruction" /></div></div>
            <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</div><div><p className="text-sm font-medium">打开 Kimi App（或网页版）</p><p className="text-xs text-muted-foreground">新建一个对话，把复制的指令粘贴进去</p></div></div>
            <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</div><div><p className="text-sm font-medium">直接说话操作</p><p className="text-xs text-muted-foreground">之后像正常聊天一样说话，Kimi 会自动操作你的工作台</p></div></div>
          </div>
          <div className="border-t pt-3"><p className="text-xs font-medium mb-2">你可以说的话：</p><div className="space-y-1.5">{["帮我创建一个《慢花志》混音的工作流", "给工作流#1创建一个新任务叫母带处理，分配给小李", "查看所有进行中的任务", "帮我把任务#3标记为已完成", "帮我设计一套专辑发行的完整计划"].map(example => <div key={example} className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-50 rounded px-2.5 py-1.5"><MessageSquare className="h-3 w-3 shrink-0" /><span>{example}</span></div>)}</div></div>
        </CardContent>}
      </Card>
      <Card className="overflow-hidden">
        <SectionHeader icon={Bot} title="方式二：电脑端 MCP（高级）" subtitle="Kimi K Agent 配置 MCP Server" section="mcp" />
        {expandedSection === "mcp" && <CardContent className="px-4 pb-4 pt-0 space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</div><div><p className="text-sm font-medium">打开 Kimi 的 K Agent</p><p className="text-xs text-muted-foreground">在 Kimi 电脑端选择"探索" → "K Agent"</p></div></div>
            <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</div><div><p className="text-sm font-medium">添加 MCP Server</p><p className="text-xs text-muted-foreground">在 Agent 设置中找到"MCP 工具" → "添加 MCP Server"</p></div></div>
            <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</div><div className="flex-1"><p className="text-sm font-medium">填入 MCP 地址</p><div className="mt-1.5 bg-muted rounded-lg p-2.5 flex items-center justify-between"><code className="text-xs break-all">{mcpUrl}</code><CopyButton text={mcpUrl} label="mcp-url" /></div></div></div>
          </div>
        </CardContent>}
      </Card>
      <Card className="overflow-hidden">
        <SectionHeader icon={Sparkles} title="方式三：平台内置 AI 助手" subtitle="直接使用平台内的 AI 助手" section="assistant" />
        {expandedSection === "assistant" && <CardContent className="px-4 pb-4 pt-0"><p className="text-sm text-muted-foreground mb-3">平台右下角有内置 AI 助手，点击闪电图标即可对话操作。支持手机和电脑端。</p><div className="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="h-4 w-4 text-primary" /><span>在任何页面点击右下角的 ⚡ 图标</span></div></CardContent>}
      </Card>
      <Card className="overflow-hidden">
        <SectionHeader icon={Shield} title="安全说明" subtitle="数据安全和架构扩展性" section="security" />
        {expandedSection === "security" && <CardContent className="px-4 pb-4 pt-0"><ul className="space-y-2.5 text-sm">
          <li className="flex items-start gap-2"><span className="text-green-500 shrink-0 mt-0.5">✓</span><span className="text-muted-foreground"><strong className="text-foreground">数据库可替换</strong>：Drizzle ORM 抽象层，换 MySQL/PostgreSQL/TiDB 只需改环境变量</span></li>
          <li className="flex items-start gap-2"><span className="text-green-500 shrink-0 mt-0.5">✓</span><span className="text-muted-foreground"><strong className="text-foreground">服务可迁移</strong>：Docker 容器化部署，换服务器只需迁移容器</span></li>
          <li className="flex items-start gap-2"><span className="text-green-500 shrink-0 mt-0.5">✓</span><span className="text-muted-foreground"><strong className="text-foreground">MCP 端点不变</strong>：换服务器后 MCP 地址更新，Kimi 配置同步更新即可</span></li>
          <li className="flex items-start gap-2"><span className="text-green-500 shrink-0 mt-0.5">✓</span><span className="text-muted-foreground"><strong className="text-foreground">操作需认证</strong>：所有写入操作经过后端验证</span></li>
        </ul></CardContent>}
      </Card>
    </div>
  );
}

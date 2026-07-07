import OpenAI from "openai";

export interface ChatMessage { role: "user" | "assistant" | "system"; content: string; }
export interface AIAction { action: string; params: Record<string, unknown>; description?: string; }
export interface AIResponse { message: string; actions?: AIAction[]; needsConfirmation?: boolean; confirmationData?: unknown; }

const SYSTEM_PROMPT = `你是 CPJ Workflow 平台的 AI 工作流助手。你可以帮助用户通过自然语言操作工作流平台。

你的能力包括：
1. 创建工作流项目
2. 在工作流下创建任务
3. 分配任务给员工
4. 查询工作流和任务状态
5. 提交进度反馈
6. 生成完整的工作进度计划（需要用户确认后执行）

当你理解用户的意图后，请以 JSON 格式返回操作指令：
{
  "message": "对用户说的回复",
  "actions": [{ "action": "create_workflow", "params": { "title": "xxx", "description": "xxx" } }],
  "needsConfirmation": false
}

支持的 action 类型：
- create_workflow: 创建工作流 { title, description? }
- create_task: 创建任务 { workflowId, title, description?, priority?, assigneeIds? }
- list_workflows: 列出工作流 { }
- list_tasks: 列出任务 { workflowId?, status? }
- get_task_detail: 获取任务详情 { taskId }
- submit_progress: 提交进度 { taskId, content, percentComplete? }
- generate_plan: 生成计划 { title, tasks: [{title, description?, priority?, assigneeNames?}] }

如果用户要求生成一个完整计划，设置 needsConfirmation: true，把计划放在 confirmationData 中，等用户确认后再执行。

请用中文回复。保持简洁专业。`;

export class AIService {
  private client: OpenAI;
  private model: string;
  private mockMode: boolean;

  constructor(config?: { apiKey?: string; baseURL?: string; model?: string }) {
    const apiKey = config?.apiKey || process.env.AI_API_KEY || "";
    const baseURL = config?.baseURL || process.env.AI_BASE_URL;
    this.model = config?.model || process.env.AI_MODEL || "gpt-4o-mini";
    this.mockMode = !apiKey;
    if (!this.mockMode && baseURL) this.client = new OpenAI({ apiKey, baseURL });
    else if (!this.mockMode) this.client = new OpenAI({ apiKey });
    else this.client = new OpenAI({ apiKey: "mock" });
  }

  async chat(messages: ChatMessage[]): Promise<AIResponse> {
    if (this.mockMode) return this.mockChat(messages);
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });
      const content = completion.choices[0]?.message?.content || "{}";
      return JSON.parse(content) as AIResponse;
    } catch (error) {
      console.error("[AI Service Error]", error);
      return { message: "AI 服务暂时不可用，请稍后重试。" };
    }
  }

  private mockChat(messages: ChatMessage[]): AIResponse {
    const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || "";
    if (lastMessage.includes("创建") && lastMessage.includes("工作流")) {
      const title = lastMessage.match(/[「"'"']([^"'"'"']+)["'"'」]/)?.[1] || "新项目";
      return { message: `我来帮你创建工作流「${title}」。已准备就绪，正在执行...`, actions: [{ action: "create_workflow", params: { title, description: "" } }], needsConfirmation: false };
    }
    if (lastMessage.includes("计划") || lastMessage.includes("方案") || lastMessage.includes("进度表")) {
      const title = lastMessage.match(/(?:设计|制定|规划|做|建)(?:一套|一个|一份)?(.+?)(?:的|工作流|计划|方案|进度表|$)/)?.[1]?.trim() || "新项目计划";
      return {
        message: `我为你设计了一套「${title}」的工作进度计划，请确认：\n\n1. **项目启动** - 确定方向和时间线\n2. **内容制作** - 编曲/录音/混音\n3. **视觉设计** - 封面和宣传物料\n4. **审核验收** - 内部审核和修改\n5. **发布上线** - 正式发布\n\n确认后我会自动创建工作流和任务。`,
        actions: [], needsConfirmation: true,
        confirmationData: { title, tasks: [{ title: "项目启动", description: "确定方向和时间线", priority: "high" }, { title: "内容制作", description: "编曲/录音/混音", priority: "high" }, { title: "视觉设计", description: "封面和宣传物料", priority: "medium" }, { title: "审核验收", description: "内部审核和修改", priority: "medium" }, { title: "发布上线", description: "正式发布", priority: "high" }] }
      };
    }
    if (lastMessage.includes("进度") || lastMessage.includes("状态") || lastMessage.includes("哪里")) {
      return { message: "让我帮你查一下当前的工作进度...", actions: [{ action: "list_tasks", params: {} }], needsConfirmation: false };
    }
    return {
      message: `收到，我来帮你处理。你可以对我说：\n- "创建一个工作流"\n- "帮我设计一套计划"\n- "查看当前进度"\n\n（当前为模拟模式，配置 AI_API_KEY 后可启用真实 AI 能力）`,
      actions: [], needsConfirmation: false
    };
  }
}

let aiServiceInstance: AIService | null = null;
export function getAIService(): AIService { if (!aiServiceInstance) aiServiceInstance = new AIService(); return aiServiceInstance; }

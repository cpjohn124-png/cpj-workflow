# CPJ Workflow Platform

AI驱动的工作流管理平台，支持 MCP 协议，可与 Kimi/Claude 等 AI 助手直接对接。

## 部署

### Render（推荐）

1. 在 [Render](https://render.com) 注册账号
2. 点击 "New Web Service"
3. 选择此 GitHub 仓库
4. 环境变量填入 `.env.example` 中的配置
5. 点击 Deploy

### Replit

1. 在 Replit 创建 Node.js 项目
2. 在 Shell 中运行：
   ```bash
   git clone https://github.com/cpjohn124-png/cpj-workflow.git . && npm install && npm run build && npm start
   ```

## MCP 端点

部署后，MCP Server 地址为：`https://你的域名/mcp`

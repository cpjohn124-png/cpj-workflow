import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMCPServer } from "./mcp-bridge";

let mcpServer: McpServer | null = null;
let transport: WebStandardStreamableHTTPServerTransport | null = null;
let connected = false;

async function ensureConnected() {
  if (connected && mcpServer && transport) return;
  mcpServer = createMCPServer();
  transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await mcpServer.connect(transport);
  connected = true;
  console.log("[MCP] Server connected and ready");
}

export async function handleMCPRequest(req: Request): Promise<Response> {
  try {
    await ensureConnected();
    if (!transport) return new Response(JSON.stringify({ error: "MCP transport not initialized" }), { status: 500, headers: { "Content-Type": "application/json" } });
    return transport.handleRequest(req);
  } catch (error) {
    console.error("[MCP] Handler error:", error);
    return new Response(JSON.stringify({ error: "MCP handler error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

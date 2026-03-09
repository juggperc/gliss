import { NextResponse } from "next/server";

import { testMcpServer } from "@/lib/server/mcp";
import { mcpTestRequestSchema } from "@/lib/server/request-schemas";
import type { MCPServer } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = mcpTestRequestSchema.parse(await request.json());
    const server = payload as MCPServer;
    const result = await testMcpServer(server);

    return NextResponse.json({
      status: "connected",
      lastChecked: Date.now(),
      toolCount: result.tools.length,
      transport: result.transport,
      tools: result.tools,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to connect to MCP server";
    return NextResponse.json(
      {
        status: "error",
        lastChecked: Date.now(),
        toolCount: 0,
        tools: [],
        error: message,
      },
      { status: 400 },
    );
  }
}

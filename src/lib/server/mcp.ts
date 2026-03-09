import { dynamicTool, jsonSchema } from "ai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Tool as MCPToolDefinition } from "@modelcontextprotocol/sdk/types.js";

import { getHostedMcpRestrictionReason, isHostedRuntime } from "@/lib/mcp-safety";
import type { MCPServer } from "@/lib/types";

type ConnectedClient = {
  cacheKey: string;
  client: Client;
  transport: "streamable-http" | "sse";
};

type DiscoveredTool = {
  assignedName: string;
  originalName: string;
  serverId: string;
  serverName: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  client: Client;
};

const clientCache = new Map<string, ConnectedClient>();

function normalizeServerUrl(rawUrl: string, transport: MCPServer["transport"]) {
  if (rawUrl.startsWith("sse://")) {
    return {
      url: new URL(`http://${rawUrl.slice("sse://".length)}`),
      transport: "sse" as const,
    };
  }

  if (rawUrl.startsWith("sse+https://")) {
    return {
      url: new URL(rawUrl.replace("sse+https://", "https://")),
      transport: "sse" as const,
    };
  }

  if (rawUrl.startsWith("sse+http://")) {
    return {
      url: new URL(rawUrl.replace("sse+http://", "http://")),
      transport: "sse" as const,
    };
  }

  return {
    url: new URL(rawUrl),
    transport: transport === "auto" ? null : transport,
  };
}

async function openClient(server: MCPServer): Promise<ConnectedClient> {
  const hostedRestriction = getHostedMcpRestrictionReason(server.url, isHostedRuntime());
  if (hostedRestriction) {
    throw new Error(hostedRestriction);
  }

  const normalized = normalizeServerUrl(server.url, server.transport);
  const attempts = normalized.transport
    ? [normalized.transport]
    : (["streamable-http", "sse"] as const);

  let lastError: unknown;

  for (const attempt of attempts) {
    const cacheKey = `${attempt}:${normalized.url.toString()}`;
    const cached = clientCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const client = new Client(
      { name: "gliss-client", version: "1.0.0" },
      { capabilities: {} },
    );

    try {
      const transport =
        attempt === "streamable-http"
          ? new StreamableHTTPClientTransport(normalized.url)
          : new SSEClientTransport(normalized.url);

      await client.connect(transport);

      const connected: ConnectedClient = {
        cacheKey,
        client,
        transport: attempt,
      };
      clientCache.set(cacheKey, connected);
      return connected;
    } catch (error) {
      lastError = error;
      try {
        await client.close();
      } catch {
        // Ignore cleanup errors.
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to connect to MCP server");
}

function sanitizeToolName(value: string) {
  const cleaned = value.trim().replace(/[^a-zA-Z0-9_-]+/g, "_");
  const withoutDoubles = cleaned.replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  const safe = withoutDoubles || "tool";
  return /^[0-9]/.test(safe) ? `tool_${safe}` : safe;
}

function serializeCallToolResult(result: unknown) {
  const normalized = typeof result === "object" && result !== null ? (result as Record<string, unknown>) : {};
  const content =
    Array.isArray(normalized.content)
      ? normalized.content
      : Array.isArray(normalized.toolResult)
        ? normalized.toolResult
        : [];
  const textContent = content
    .map((part) => {
      if (typeof part === "object" && part !== null) {
        const block = part as Record<string, unknown>;

        if (block.type === "text" && typeof block.text === "string") {
          return block.text;
        }

        if (block.type === "resource_link") {
          return `${String(block.name ?? "resource")}: ${String(block.uri ?? "")}`;
        }
      }

      return JSON.stringify(part);
    })
    .filter(Boolean)
    .join("\n");

  return {
    isError: Boolean(normalized.isError),
    text: textContent || undefined,
    structuredContent: normalized.structuredContent ?? null,
    content,
  };
}

function createAssignedToolNames(tools: Array<DiscoveredTool>) {
  const nameCounts = tools.reduce<Record<string, number>>((accumulator, tool) => {
    accumulator[tool.originalName] = (accumulator[tool.originalName] ?? 0) + 1;
    return accumulator;
  }, {});

  return tools.map((tool) => ({
    ...tool,
    assignedName:
      nameCounts[tool.originalName] === 1
        ? sanitizeToolName(tool.originalName)
        : sanitizeToolName(`${tool.serverName}_${tool.originalName}`),
  }));
}

export async function listMcpTools(servers: MCPServer[]) {
  const enabledServers = servers.filter((server) => server.enabled);
  const discovered: Array<DiscoveredTool> = [];
  const warnings: string[] = [];

  for (const server of enabledServers) {
    try {
      const { client } = await openClient(server);
      const response = await client.listTools();

      for (const tool of response.tools) {
        discovered.push({
          assignedName: tool.name,
          originalName: tool.name,
          serverId: server.id,
          serverName: server.name,
          description: tool.description,
          inputSchema: (tool.inputSchema as Record<string, unknown> | undefined) ?? {
            type: "object",
            additionalProperties: true,
          },
          client,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      warnings.push(`${server.name}: ${message}`);
    }
  }

  return {
    tools: createAssignedToolNames(discovered),
    warnings,
  };
}

export async function buildMcpToolSet(servers: MCPServer[]) {
  const { tools, warnings } = await listMcpTools(servers);

  const toolSet = Object.fromEntries(
    tools.map((toolInfo) => [
      toolInfo.assignedName,
      dynamicTool({
        description: `${toolInfo.description ?? "Remote tool"} Connected server: ${toolInfo.serverName}.`,
        inputSchema: jsonSchema(toolInfo.inputSchema),
        execute: async (input) => {
          const result = await toolInfo.client.callTool({
            name: toolInfo.originalName,
            arguments: typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {},
          });

          return serializeCallToolResult(result);
        },
      }),
    ]),
  );

  return {
    toolSet,
    warnings,
  };
}

export async function testMcpServer(server: MCPServer) {
  const hostedRestriction = getHostedMcpRestrictionReason(server.url, isHostedRuntime());
  if (hostedRestriction) {
    throw new Error(hostedRestriction);
  }

  const { client, transport } = await openClient(server);
  const response = await client.listTools();

  return {
    transport,
    tools: response.tools.map((tool: MCPToolDefinition) => ({
      name: tool.name,
      description: tool.description,
    })),
  };
}

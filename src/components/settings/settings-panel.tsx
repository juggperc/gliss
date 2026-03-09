"use client";

import { useMemo, useState } from "react";
import { Plus, Server, Settings, Shield, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getHostedMcpRestrictionReason, isLocalBrowserRuntime } from "@/lib/mcp-safety";
import type { MCPServer, MCPTestResponse } from "@/lib/types";
import { useChatStore } from "@/store/use-chat-store";

type SettingsSection = "security" | "mcp" | "council";

const sectionMeta: Array<{ id: SettingsSection; label: string; icon: typeof Shield }> = [
  { id: "security", label: "Security", icon: Shield },
  { id: "mcp", label: "MCP Servers", icon: Server },
  { id: "council", label: "Council", icon: Users },
];

export function SettingsPanel() {
  const {
    openRouterKey,
    setOpenRouterKey,
    mcpServers,
    addMcpServer,
    updateMcpServer,
    removeMcpServer,
    toggleMcpServer,
    councilModels,
    setCouncilModels,
  } = useChatStore();

  const [section, setSection] = useState<SettingsSection>("security");
  const [newServer, setNewServer] = useState({
    name: "",
    url: "",
    transport: "auto" as MCPServer["transport"],
  });
  const [councilDraft, setCouncilDraft] = useState(councilModels.join(", "));
  const [testingServerId, setTestingServerId] = useState<string | null>(null);
  const [panelMessage, setPanelMessage] = useState<string | null>(null);

  const hasServers = mcpServers.length > 0;
  const councilHelper = useMemo(() => councilModels.join(", "), [councilModels]);
  const hostedBrowser = useMemo(() => !isLocalBrowserRuntime(), []);

  const handleAddServer = () => {
    if (!newServer.name.trim() || !newServer.url.trim()) {
      setPanelMessage("Give the server a name and URL before adding it.");
      return;
    }

    const restriction = getHostedMcpRestrictionReason(newServer.url.trim(), hostedBrowser);
    if (restriction) {
      setPanelMessage(restriction);
      return;
    }

    addMcpServer({
      id: crypto.randomUUID(),
      name: newServer.name.trim(),
      url: newServer.url.trim(),
      transport: newServer.transport,
      enabled: true,
      status: "idle",
      lastChecked: null,
      lastError: null,
      toolCount: 0,
    });

    setNewServer({ name: "", url: "", transport: "auto" });
    setPanelMessage("Server added. Use Test to verify the connection.");
  };

  const handleTestServer = async (server: MCPServer) => {
    const restriction = getHostedMcpRestrictionReason(server.url, hostedBrowser);
    if (restriction) {
      updateMcpServer(server.id, {
        status: "error",
        lastChecked: Date.now(),
        lastError: restriction,
        toolCount: 0,
      });
      setPanelMessage(restriction);
      return;
    }

    setTestingServerId(server.id);
    updateMcpServer(server.id, { status: "checking", lastError: null });
    setPanelMessage(null);

    try {
      const response = await fetch("/api/mcp/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(server),
      });
      const payload = (await response.json()) as MCPTestResponse & { error?: string; transport?: string };

      if (!response.ok) {
        throw new Error(payload.error || "MCP test failed");
      }

      updateMcpServer(server.id, {
        status: payload.status,
        lastChecked: payload.lastChecked,
        lastError: null,
        toolCount: payload.toolCount,
        transport: payload.transport === "sse" || payload.transport === "streamable-http" ? payload.transport : server.transport,
      });
      setPanelMessage(`${server.name} is connected with ${payload.toolCount} tool${payload.toolCount === 1 ? "" : "s"}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "MCP test failed";
      updateMcpServer(server.id, {
        status: "error",
        lastChecked: Date.now(),
        lastError: message,
        toolCount: 0,
      });
      setPanelMessage(message);
    } finally {
      setTestingServerId(null);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="icon" className="rounded-[1rem] bg-background">
          <Settings className="size-4 text-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full border-l border-border/70 bg-background/98 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border/70 px-6 py-5">
          <SheetTitle className="text-2xl font-semibold">Settings</SheetTitle>
          <SheetDescription>
            Configure models, browser-stored keys, and tool servers for this workspace.
          </SheetDescription>
        </SheetHeader>

        <div className="flex h-full min-h-0 flex-col">
          <div className="flex gap-2 overflow-x-auto border-b border-border/70 px-4 py-3">
            {sectionMeta.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant={section === item.id ? "secondary" : "ghost"}
                  onClick={() => setSection(item.id)}
                  className="rounded-[1rem]"
                >
                <item.icon className="size-4" />
                {item.label}
              </Button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {panelMessage ? (
              <div role="status" aria-live="polite" className="mb-5 rounded-2xl border border-border bg-muted px-4 py-3 text-sm leading-7 text-foreground">
                {panelMessage}
              </div>
            ) : null}

            {section === "security" ? (
              <div className="space-y-5">
                <div className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">OpenRouter Key</p>
                  <Input
                    type="password"
                    value={openRouterKey}
                    onChange={(event) => setOpenRouterKey(event.target.value)}
                    placeholder="sk-or-v1-..."
                    className="mt-4 h-11 rounded-2xl bg-background"
                  />
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    This key stays in your browser storage for the local app experience and is only sent when you make a request.
                  </p>
                </div>
              </div>
            ) : null}

            {section === "mcp" ? (
              <div className="space-y-5">
                <div className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Add Server</p>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {hostedBrowser
                      ? "Hosted Gliss can only reach publicly accessible MCP endpoints. Localhost and private-network URLs will be blocked."
                      : "Local development can use localhost MCP servers. Public endpoints will also work after deployment."}
                  </p>
                  <div className="mt-4 grid gap-3">
                    <Input
                      value={newServer.name}
                      onChange={(event) => setNewServer((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Local filesystem"
                      className="h-11 rounded-2xl bg-background"
                    />
                    <Input
                      value={newServer.url}
                      onChange={(event) => setNewServer((current) => ({ ...current, url: event.target.value }))}
                      placeholder="http://localhost:8000/mcp"
                      className="h-11 rounded-2xl bg-background"
                    />
                    <select
                      value={newServer.transport}
                      onChange={(event) => setNewServer((current) => ({ ...current, transport: event.target.value as MCPServer["transport"] }))}
                      className="h-11 rounded-2xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="auto">Auto detect</option>
                      <option value="streamable-http">Streamable HTTP</option>
                      <option value="sse">Legacy SSE</option>
                    </select>
                    <Button type="button" onClick={handleAddServer} className="rounded-2xl">
                      <Plus className="size-4" />
                      Add server
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {hasServers ? mcpServers.map((server) => (
                    <div key={server.id} className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                      {(() => {
                        const restriction = getHostedMcpRestrictionReason(server.url, hostedBrowser);

                        return restriction ? (
                          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
                            {restriction}
                          </div>
                        ) : null;
                      })()}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-foreground">{server.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{server.url}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{server.transport}</p>
                        </div>
                        <div className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground bg-muted">
                          {server.status}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button type="button" variant={server.enabled ? "secondary" : "outline"} onClick={() => toggleMcpServer(server.id, !server.enabled)} className="rounded-2xl">
                          {server.enabled ? "Enabled" : "Disabled"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => handleTestServer(server)} disabled={testingServerId === server.id} className="rounded-2xl">
                          {testingServerId === server.id ? "Testing..." : "Test"}
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => removeMcpServer(server.id)} className="rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive">
                          Remove
                        </Button>
                      </div>

                      <div className="mt-4 text-sm text-muted-foreground">
                        <p>Tools available: {server.toolCount ?? 0}</p>
                        {server.lastError ? <p className="mt-1 text-destructive">{server.lastError}</p> : null}
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-[28px] border border-dashed border-border bg-card/60 px-5 py-8 text-sm leading-7 text-muted-foreground">
                      Add a tool server to let Gliss call external tools through MCP.
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {section === "council" ? (
              <div className="space-y-5">
                <div className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Reviewer Models</p>
                  <Input
                    value={councilDraft}
                    onChange={(event) => setCouncilDraft(event.target.value)}
                    onBlur={() => setCouncilModels(councilDraft.split(",").map((value) => value.trim()).filter(Boolean))}
                    placeholder="google/gemini-2.0-flash-001, openai/gpt-4.1-mini"
                    className="mt-4 h-11 rounded-2xl bg-background"
                  />
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    Council mode uses the selected chat model as lead and the first different model here as reviewer.
                  </p>
                  {councilHelper ? <p className="mt-3 text-xs text-muted-foreground">Current: {councilHelper}</p> : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

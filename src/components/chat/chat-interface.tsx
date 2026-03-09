"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, BookOpen, BrainCircuit, LayoutTemplate, PenTool, Wrench } from "lucide-react";

import { ModelPicker } from "@/components/chat/model-picker";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import { Textarea } from "@/components/ui/textarea";
import type { ChatStreamEvent, FeatureMode, Message, ToolEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/use-chat-store";

function formatUsd(value?: number) {
  if (value == null) {
    return null;
  }

  return `$${value.toFixed(value < 0.01 ? 4 : 2)}`;
}

const modeMeta: Array<{ id: FeatureMode; label: string; icon: typeof BrainCircuit }> = [
  { id: "standard", label: "Standard", icon: BrainCircuit },
  { id: "lesson", label: "Lesson", icon: BookOpen },
  { id: "quiz", label: "Quiz", icon: PenTool },
  { id: "flashcard", label: "Flashcards", icon: LayoutTemplate },
  { id: "council", label: "Council", icon: BrainCircuit },
];

function messageLabel(message: Message) {
  if (message.role === "user") {
    return "You";
  }

  if (message.meta?.mode === "council") {
    return "Gliss Council";
  }

  return "Gliss";
}

export function ChatInterface() {
  const {
    activeChatId,
    chats,
    ensureActiveChat,
    addMessage,
    patchMessage,
    activeModel,
    councilModels,
    mcpServers,
    openRouterKey,
    upsertCouncilRun,
    appendCouncilLog,
    appendCouncilToolEvent,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [mode, setMode] = useState<FeatureMode>("standard");
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState<{ level: "info" | "warning" | "error"; message: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const chat = activeChatId ? chats[activeChatId] : null;
  const messages = chat?.messages ?? [];
  const isInitialState = messages.length === 0;

  const lastMessageContent = messages[messages.length - 1]?.content ?? "";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, lastMessageContent]);

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt || isGenerating) {
      return;
    }

    if (!openRouterKey) {
      setNotice({ level: "error", message: "Add your OpenRouter API key in Settings before sending a message." });
      return;
    }

    const chatId = ensureActiveChat();
    const currentMessages = chats[chatId]?.messages ?? [];
    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();

    addMessage(chatId, {
      id: userMessageId,
      role: "user",
      content: prompt,
      createdAt: Date.now(),
    });
    addMessage(chatId, {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
      meta: {
        mode,
        modelId: activeModel,
        reviewerModelId: mode === "council" ? councilModels.find((modelId) => modelId !== activeModel) : undefined,
        status: "streaming",
        toolEvents: [],
        error: null,
      },
    });

    setInput("");
    setNotice(null);
    setIsGenerating(true);

    let currentText = "";
    let activeCouncilRunId: string | null = null;
    const toolEvents: ToolEvent[] = [];

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          assistantMessageId,
          apiKey: openRouterKey,
          mode,
          modelId: activeModel,
          councilModels,
          messages: [
            ...currentMessages.map((message) => ({ role: message.role, content: message.content })),
            { role: "user", content: prompt },
          ],
          mcpServers,
        }),
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Unable to start chat request");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) {
            continue;
          }

          const event = JSON.parse(line) as ChatStreamEvent;

          if (event.type === "status") {
            setNotice({ level: event.level, message: event.message });
            continue;
          }

          if (event.type === "text-delta") {
            currentText += event.text;
            patchMessage(chatId, assistantMessageId, { content: currentText });
            continue;
          }

          if (event.type === "tool-event") {
            toolEvents.push(event.event);
            patchMessage(chatId, assistantMessageId, {
              meta: {
                toolEvents: [...toolEvents],
              },
            });

            if (activeCouncilRunId) {
              appendCouncilToolEvent(activeCouncilRunId, event.event);
            }
            continue;
          }

          if (event.type === "council-run-start") {
            activeCouncilRunId = event.runId;
            upsertCouncilRun({
              id: event.runId,
              chatId,
              prompt: event.prompt,
              leadModelId: event.leadModelId,
              reviewerModelId: event.reviewerModelId,
              createdAt: event.createdAt,
              status: "running",
              logs: [],
              toolEvents: [],
              finalMessageId: assistantMessageId,
            });
            patchMessage(chatId, assistantMessageId, {
              meta: {
                councilRunId: event.runId,
                reviewerModelId: event.reviewerModelId,
              },
            });
            continue;
          }

          if (event.type === "council-log") {
            appendCouncilLog(event.runId, event.log);
            continue;
          }

          if (event.type === "done") {
            patchMessage(chatId, assistantMessageId, {
              meta: {
                ...event.meta,
                toolEvents: [...toolEvents],
              },
            });

            if (event.councilRun) {
              upsertCouncilRun(event.councilRun);
            }

            setNotice(null);
            continue;
          }

          if (event.type === "error") {
            patchMessage(chatId, assistantMessageId, {
              content: currentText || "I ran into a problem before finishing this answer.",
              meta: {
                status: "error",
                error: event.error,
                toolEvents: [...toolEvents],
              },
            });

            if (event.councilRun) {
              upsertCouncilRun(event.councilRun);
            }

            throw new Error(event.error);
          }
        }
      }
    } catch (error) {
      setNotice({
        level: "error",
        message: error instanceof Error ? error.message : "Chat request failed",
      });
      patchMessage(chatId, assistantMessageId, {
        content: currentText || "I ran into a problem before finishing this answer.",
        meta: {
          status: "error",
          error: error instanceof Error ? error.message : "Chat request failed",
          toolEvents: [...toolEvents],
        },
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const activeToolsCount = mcpServers.filter((server) => server.enabled && server.status === "connected").reduce((total, server) => total + (server.toolCount ?? 0), 0);
  const currentModeMeta = modeMeta.find((item) => item.id === mode) ?? modeMeta[0];

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 md:px-6 md:py-8">
      <div className="rounded-[32px] border border-border/70 bg-card/80 px-6 py-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        {isInitialState ? (
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Gliss</p>
              <h1 className="mt-3 text-3xl font-semibold text-foreground md:text-4xl">Language learning that is finally built out.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                Pick a model, choose a mode, and Gliss will stream a readable answer with real council reviews, working lesson widgets, and tool activity you can inspect.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ModelPicker />
              <div className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-4 py-2 text-sm text-muted-foreground">
                <Wrench className="size-4 text-sky-700" />
                {activeToolsCount} connected tools
              </div>
            </div>
          </div>
        ) : null}

        {!isInitialState ? (
          <div className="space-y-6">
            {messages.map((message) => {
              const usageLabel = formatUsd(message.meta?.usage?.estimatedCostUsd);

              return (
                <article
                  key={message.id}
                  className={cn(
                    "rounded-[28px] border px-5 py-5 shadow-sm",
                    message.role === "user"
                      ? "ml-auto max-w-3xl border-sky-100 bg-sky-50/80"
                      : "border-border/70 bg-background/80",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <span>{messageLabel(message)}</span>
                    {message.meta?.mode ? <span className="rounded-full bg-muted px-2 py-1 tracking-normal normal-case">{message.meta.mode}</span> : null}
                    {usageLabel ? <span className="rounded-full bg-muted px-2 py-1 tracking-normal normal-case">{usageLabel}</span> : null}
                    {message.meta?.toolEvents?.length ? (
                      <span className="rounded-full bg-muted px-2 py-1 tracking-normal normal-case">{message.meta.toolEvents.length} tool events</span>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    {message.role === "assistant" ? (
                      message.content ? (
                        <Markdown content={message.content} />
                      ) : (
                        <p className="text-sm text-muted-foreground">Thinking...</p>
                      )
                    ) : (
                      <p className="whitespace-pre-wrap text-base leading-7 text-foreground">{message.content}</p>
                    )}
                  </div>

                  {message.meta?.error ? (
                    <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-800">{message.meta.error}</p>
                  ) : null}
                </article>
              );
            })}
            <div ref={bottomRef} />
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-0 mt-6">
        {notice ? (
          <div className={cn(
            "mb-3 rounded-2xl border px-4 py-3 text-sm leading-7 shadow-sm",
            notice.level === "error"
              ? "border-rose-200 bg-rose-50 text-rose-900"
              : notice.level === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-sky-200 bg-sky-50 text-sky-900",
          )} role="status" aria-live="polite">
            {notice.message}
          </div>
        ) : null}

        <div className="rounded-[32px] border border-border/70 bg-[rgba(255,255,255,0.94)] p-4 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {modeMeta.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant={mode === item.id ? "secondary" : "ghost"}
                  onClick={() => setMode(item.id)}
                  className="rounded-2xl"
                  aria-pressed={mode === item.id}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline">Mode</span>
              <span className="rounded-full bg-muted px-3 py-1 text-foreground">{currentModeMeta.label}</span>
            </div>
          </div>

          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Ask Gliss to explain, quiz, coach, or review language material..."
            rows={3}
            className="min-h-[120px] rounded-[24px] border-border/70 bg-white/80 px-4 py-4 text-base leading-7"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <ModelPicker />
              <div className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-4 py-2 text-sm text-muted-foreground">
                <Wrench className="size-4 text-sky-700" />
                {activeToolsCount} connected tools
              </div>
            </div>
            <Button type="button" onClick={() => void handleSend()} disabled={!input.trim() || isGenerating} className="rounded-2xl px-5">
              {isGenerating ? "Working..." : "Send"}
              <ArrowUp className="size-4" />
            </Button>
          </div>

          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            Gliss can still make mistakes. Review important facts, especially when a lesson result is going to be reused.
          </p>
        </div>
      </div>
    </section>
  );
}

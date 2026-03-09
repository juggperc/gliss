import { generateText, stepCountIs, streamText } from "ai";

import { buildMcpToolSet } from "@/lib/server/mcp";
import { getOpenRouterProvider, fetchOpenRouterModels } from "@/lib/server/openrouter";
import { buildLeadCouncilPrompt, buildReviewerPrompt, buildSynthesisPrompt, buildSystemPrompt } from "@/lib/server/prompts";
import { chatRequestSchema } from "@/lib/server/request-schemas";
import { createUsageStep, mapModelCatalogEntry, summarizeUsage } from "@/lib/server/usage";
import type { ChatStreamEvent, CouncilLogEntry, CouncilRun, MessageMeta, ToolEvent } from "@/lib/types";

export const runtime = "nodejs";

function createEventStream(
  executor: (write: (event: ChatStreamEvent) => void) => Promise<void>,
) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (event: ChatStreamEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        await executor(write);
      } catch (error) {
        write({
          type: "error",
          error: error instanceof Error ? error.message : "Chat request failed",
        });
      } finally {
        controller.close();
      }
    },
  });
}

function createCouncilLog(stage: CouncilLogEntry["stage"], summary: string, modelId?: string): CouncilLogEntry {
  return {
    id: crypto.randomUUID(),
    stage,
    summary,
    createdAt: Date.now(),
    modelId,
  };
}

function createToolEvent(type: ToolEvent["type"], toolName: string, payload?: unknown, message?: string): ToolEvent {
  return {
    id: crypto.randomUUID(),
    type,
    toolName,
    displayName: toolName.replace(/_/g, " "),
    timestamp: Date.now(),
    payload,
    message,
  };
}

function truncate(value: string, maxLength = 240) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

export async function POST(request: Request) {
  const body = chatRequestSchema.parse(await request.json());
  const appOrigin = new URL(request.url).origin;

  const stream = createEventStream(async (write) => {
    const provider = getOpenRouterProvider(body.apiKey, appOrigin);
    const modelCatalog = (await fetchOpenRouterModels()).map(mapModelCatalogEntry);
    const modelById = new Map(modelCatalog.map((model) => [model.id, model]));
    const usageSteps: ReturnType<typeof createUsageStep>[] = [];
    const toolEvents: ToolEvent[] = [];
    const councilLogs: CouncilLogEntry[] = [];

    const { toolSet, warnings } = await buildMcpToolSet(body.mcpServers);
    const hasTools = Object.keys(toolSet).length > 0;

    warnings.forEach((warning) => {
      write({ type: "status", level: "warning", message: warning });
    });

    const attachStepUsage = (label: string) => (event: { model: { modelId: string }; usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number } }) => {
      usageSteps.push(
        createUsageStep(label, event.model.modelId, modelById.get(event.model.modelId), {
          inputTokens: event.usage.inputTokens,
          inputTokenDetails: {
            noCacheTokens: undefined,
            cacheReadTokens: undefined,
            cacheWriteTokens: undefined,
          },
          outputTokens: event.usage.outputTokens,
          outputTokenDetails: {
            textTokens: event.usage.outputTokens,
            reasoningTokens: undefined,
          },
          totalTokens: event.usage.totalTokens,
        }),
      );
    };

    const baseMessages = body.messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    if (body.mode !== "council") {
      const result = streamText({
        model: provider.chat(body.modelId),
        system: buildSystemPrompt(body.mode),
        messages: baseMessages,
        tools: hasTools ? toolSet : undefined,
        stopWhen: stepCountIs(6),
        abortSignal: request.signal,
        onStepFinish: attachStepUsage("Assistant response"),
      });

      for await (const part of result.fullStream) {
        if (part.type === "text-delta") {
          write({ type: "text-delta", text: part.text });
          continue;
        }

        if (part.type === "tool-call") {
          const event = createToolEvent("call", part.toolName, part.input);
          toolEvents.push(event);
          write({ type: "tool-event", event });
          continue;
        }

        if (part.type === "tool-result") {
          const event = createToolEvent("result", part.toolName, part.output);
          toolEvents.push(event);
          write({ type: "tool-event", event });
          continue;
        }

        if (part.type === "tool-error") {
          const event = createToolEvent("error", part.toolName, part.input, String(part.error));
          toolEvents.push(event);
          write({ type: "tool-event", event });
          continue;
        }

        if (part.type === "error") {
          throw part.error instanceof Error ? part.error : new Error("Model stream failed");
        }
      }

      const meta: MessageMeta = {
        mode: body.mode,
        modelId: body.modelId,
        usage: summarizeUsage(usageSteps),
        toolEvents,
        status: "complete",
        error: null,
      };

      write({ type: "done", meta });
      return;
    }

    const reviewerModelId = body.councilModels.find((modelId) => modelId !== body.modelId) ?? body.councilModels[0] ?? body.modelId;
    const councilRunId = crypto.randomUUID();

    write({
      type: "council-run-start",
      runId: councilRunId,
      leadModelId: body.modelId,
      reviewerModelId,
      createdAt: Date.now(),
      prompt: body.messages[body.messages.length - 1]?.content ?? "",
    });

    councilLogs.push(createCouncilLog("lead", "Lead model is drafting a response.", body.modelId));
    write({ type: "council-log", runId: councilRunId, log: councilLogs[councilLogs.length - 1] });

    const leadResult = await generateText({
      model: provider.chat(body.modelId),
      system: buildLeadCouncilPrompt(),
      messages: baseMessages,
      tools: hasTools ? toolSet : undefined,
      stopWhen: stepCountIs(6),
      abortSignal: request.signal,
      onStepFinish: attachStepUsage("Lead draft"),
      experimental_onToolCallStart: (event) => {
        const toolEvent = createToolEvent("call", event.toolCall.toolName, event.toolCall.input);
        toolEvents.push(toolEvent);
        write({ type: "tool-event", event: toolEvent });
      },
      experimental_onToolCallFinish: (event) => {
        const toolEvent = createToolEvent(
          event.success ? "result" : "error",
          event.toolCall.toolName,
          event.success ? event.output : undefined,
          event.success ? undefined : (event.error instanceof Error ? event.error.message : String(event.error)),
        );
        toolEvents.push(toolEvent);
        write({ type: "tool-event", event: toolEvent });
      },
    });

    const leadSummary = truncate(leadResult.text || "Lead draft completed.");
    councilLogs.push(createCouncilLog("lead", leadSummary, body.modelId));
    write({ type: "council-log", runId: councilRunId, log: councilLogs[councilLogs.length - 1] });

    councilLogs.push(createCouncilLog("reviewer", "Reviewer model is checking the draft.", reviewerModelId));
    write({ type: "council-log", runId: councilRunId, log: councilLogs[councilLogs.length - 1] });

    const reviewerPrompt = [
      "Original conversation:",
      baseMessages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join("\n\n"),
      "Lead draft:",
      leadResult.text,
    ].join("\n\n");

    const reviewerResult = await generateText({
      model: provider.chat(reviewerModelId),
      system: buildReviewerPrompt(),
      prompt: reviewerPrompt,
      abortSignal: request.signal,
      onStepFinish: attachStepUsage("Reviewer pass"),
    });

    const critiqueSummary = truncate(reviewerResult.text || "Reviewer finished.");
    councilLogs.push(createCouncilLog("reviewer", critiqueSummary, reviewerModelId));
    write({ type: "council-log", runId: councilRunId, log: councilLogs[councilLogs.length - 1] });

    councilLogs.push(createCouncilLog("synthesis", "Synthesizing the final answer.", body.modelId));
    write({ type: "council-log", runId: councilRunId, log: councilLogs[councilLogs.length - 1] });

    const synthesisMessages = [
      ...baseMessages,
      {
        role: "assistant" as const,
        content: `Internal lead draft:\n${leadResult.text}`,
      },
      {
        role: "user" as const,
        content: `Internal reviewer feedback:\n${reviewerResult.text}\n\nPlease produce the final polished answer for the user now.`,
      },
    ];

    const synthesisStream = streamText({
      model: provider.chat(body.modelId),
      system: buildSynthesisPrompt(body.mode),
      messages: synthesisMessages,
      tools: hasTools ? toolSet : undefined,
      stopWhen: stepCountIs(4),
      abortSignal: request.signal,
      onStepFinish: attachStepUsage("Final synthesis"),
    });

    for await (const part of synthesisStream.fullStream) {
      if (part.type === "text-delta") {
        write({ type: "text-delta", text: part.text });
        continue;
      }

      if (part.type === "tool-call") {
        const event = createToolEvent("call", part.toolName, part.input);
        toolEvents.push(event);
        write({ type: "tool-event", event });
        continue;
      }

      if (part.type === "tool-result") {
          const event = createToolEvent("result", part.toolName, part.output);
        toolEvents.push(event);
        write({ type: "tool-event", event });
        continue;
      }

      if (part.type === "tool-error") {
        const event = createToolEvent("error", part.toolName, part.input, String(part.error));
        toolEvents.push(event);
        write({ type: "tool-event", event });
        continue;
      }

      if (part.type === "error") {
        throw part.error instanceof Error ? part.error : new Error("Council synthesis failed");
      }
    }

    const usage = summarizeUsage(usageSteps);
    const councilRun: CouncilRun = {
      id: councilRunId,
      chatId: body.chatId,
      prompt: body.messages[body.messages.length - 1]?.content ?? "",
      leadModelId: body.modelId,
      reviewerModelId,
      createdAt: councilLogs[0]?.createdAt ?? Date.now(),
      completedAt: Date.now(),
      status: "completed",
      logs: councilLogs,
      draft: leadResult.text,
      critique: reviewerResult.text,
      finalSummary: critiqueSummary,
      finalMessageId: body.assistantMessageId,
      toolEvents,
      usage,
    };

    const meta: MessageMeta = {
      mode: body.mode,
      modelId: body.modelId,
      reviewerModelId,
      councilRunId,
      usage,
      toolEvents,
      status: "complete",
      error: null,
    };

    write({ type: "done", meta, councilRun });
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

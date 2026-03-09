import { z } from "zod";

export const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

export const mcpServerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url(),
  transport: z.enum(["auto", "streamable-http", "sse"]),
  enabled: z.boolean(),
  status: z.enum(["idle", "checking", "connected", "error"]),
  lastChecked: z.number().nullable(),
  lastError: z.string().nullable().optional(),
  toolCount: z.number().optional(),
});

export const chatRequestSchema = z.object({
  chatId: z.string().min(1),
  assistantMessageId: z.string().min(1),
  apiKey: z.string().min(1),
  mode: z.enum(["standard", "lesson", "quiz", "flashcard", "council"]),
  modelId: z.string().min(1),
  councilModels: z.array(z.string().min(1)).default([]),
  messages: z.array(messageSchema).min(1),
  mcpServers: z.array(mcpServerSchema).default([]),
});

export const mcpTestRequestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url(),
  transport: z.enum(["auto", "streamable-http", "sse"]),
  enabled: z.boolean().default(true),
  status: z.enum(["idle", "checking", "connected", "error"]).default("checking"),
  lastChecked: z.number().nullable().default(null),
  lastError: z.string().nullable().optional(),
  toolCount: z.number().optional(),
});

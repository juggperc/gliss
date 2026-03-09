import type { FlashcardData, QuizData, TestData } from "@/lib/lesson-content";

export type AppView = "chat" | "saved-lessons" | "council-activity";
export type FeatureMode = "standard" | "lesson" | "quiz" | "flashcard" | "council";
export type MessageRole = "user" | "assistant" | "system";
export type MCPTransport = "auto" | "streamable-http" | "sse";
export type MCPServerStatus = "idle" | "checking" | "connected" | "error";

export interface ModelCatalogEntry {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  promptPricePerMillion?: number;
  completionPricePerMillion?: number;
  provider?: string;
}

export interface ModelUsageStep {
  id: string;
  label: string;
  modelId: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCostUsd: number;
}

export interface UsageSummary {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCostUsd: number;
  steps: ModelUsageStep[];
}

export interface ToolEvent {
  id: string;
  type: "call" | "result" | "error";
  toolName: string;
  displayName: string;
  serverName?: string;
  timestamp: number;
  payload?: unknown;
  message?: string;
}

export interface CouncilLogEntry {
  id: string;
  stage: "lead" | "reviewer" | "synthesis" | "tooling";
  summary: string;
  createdAt: number;
  modelId?: string;
}

export interface MessageMeta {
  mode: FeatureMode;
  modelId: string;
  reviewerModelId?: string;
  usage?: UsageSummary;
  toolEvents?: ToolEvent[];
  councilRunId?: string;
  status?: "streaming" | "complete" | "error";
  error?: string | null;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  meta?: MessageMeta;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface BaseSavedLessonComponent {
  id: string;
  title: string;
  summary: string;
  savedAt: number;
  sourceChatId?: string;
  sourceMessageId?: string;
}

export interface SavedFlashcard extends BaseSavedLessonComponent {
  type: "flashcard";
  data: FlashcardData;
}

export interface SavedQuiz extends BaseSavedLessonComponent {
  type: "quiz";
  data: QuizData;
}

export interface SavedTest extends BaseSavedLessonComponent {
  type: "test";
  data: TestData;
}

export type SavedLessonComponent = SavedFlashcard | SavedQuiz | SavedTest;

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  transport: MCPTransport;
  enabled: boolean;
  status: MCPServerStatus;
  lastChecked: number | null;
  lastError?: string | null;
  toolCount?: number;
}

export interface CouncilRun {
  id: string;
  chatId: string;
  prompt: string;
  leadModelId: string;
  reviewerModelId: string;
  createdAt: number;
  completedAt?: number;
  status: "running" | "completed" | "failed";
  logs: CouncilLogEntry[];
  draft?: string;
  critique?: string;
  finalSummary?: string;
  finalMessageId?: string;
  toolEvents: ToolEvent[];
  usage?: UsageSummary;
  error?: string;
}

export interface ChatRequestMessage {
  role: Exclude<MessageRole, "system"> | "system";
  content: string;
}

export interface ChatRequestBody {
  chatId: string;
  assistantMessageId: string;
  apiKey: string;
  mode: FeatureMode;
  modelId: string;
  councilModels: string[];
  messages: ChatRequestMessage[];
  mcpServers: MCPServer[];
}

export type ChatStreamEvent =
  | { type: "status"; level: "info" | "warning" | "error"; message: string }
  | { type: "text-delta"; text: string }
  | { type: "tool-event"; event: ToolEvent }
  | {
      type: "council-run-start";
      runId: string;
      leadModelId: string;
      reviewerModelId: string;
      createdAt: number;
      prompt: string;
    }
  | { type: "council-log"; runId: string; log: CouncilLogEntry }
  | {
      type: "done";
      meta: MessageMeta;
      councilRun?: CouncilRun;
    }
  | { type: "error"; error: string; councilRun?: CouncilRun };

export interface MCPTestResponse {
  status: MCPServerStatus;
  lastChecked: number;
  toolCount: number;
  tools: Array<{ name: string; description?: string }>;
  error?: string;
}

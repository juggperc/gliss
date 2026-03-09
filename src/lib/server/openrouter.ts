import { createOpenAI } from "@ai-sdk/openai";

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";
const MODEL_CACHE_TTL_MS = 1000 * 60 * 10;

type OpenRouterModelApiRecord = {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
};

let cachedModels:
  | {
      data: OpenRouterModelApiRecord[];
      fetchedAt: number;
    }
  | undefined;

export function getOpenRouterProvider(apiKey: string, appOrigin: string) {
  return createOpenAI({
    name: "openrouter",
    baseURL: OPENROUTER_API_URL,
    apiKey,
    headers: {
      "HTTP-Referer": appOrigin,
      "X-Title": "Gliss",
    },
  });
}

export async function fetchOpenRouterModels(forceRefresh = false): Promise<OpenRouterModelApiRecord[]> {
  const now = Date.now();

  if (!forceRefresh && cachedModels && now - cachedModels.fetchedAt < MODEL_CACHE_TTL_MS) {
    return cachedModels.data;
  }

  const response = await fetch(OPENROUTER_MODELS_URL, {
    headers: {
      Accept: "application/json",
    },
    next: {
      revalidate: 600,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch OpenRouter models (${response.status})`);
  }

  const payload = (await response.json()) as { data?: OpenRouterModelApiRecord[] };
  const data = Array.isArray(payload.data) ? payload.data : [];

  cachedModels = {
    data,
    fetchedAt: now,
  };

  return data;
}

export function getModelRecord(modelId: string, models: OpenRouterModelApiRecord[]) {
  return models.find((model) => model.id === modelId);
}

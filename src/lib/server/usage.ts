import type { LanguageModelUsage } from "ai";

import type { ModelCatalogEntry, ModelUsageStep, UsageSummary } from "@/lib/types";

function toNumber(value?: string): number | undefined {
  if (value == null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function mapModelCatalogEntry(model: {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}): ModelCatalogEntry {
  return {
    id: model.id,
    name: model.name,
    description: model.description,
    contextLength: model.context_length,
    promptPricePerMillion: toNumber(model.pricing?.prompt),
    completionPricePerMillion: toNumber(model.pricing?.completion),
    provider: model.id.split("/")[0],
  };
}

export function estimateCostUsd(entry: ModelCatalogEntry | undefined, usage: Pick<LanguageModelUsage, "inputTokens" | "outputTokens">): number {
  if (!entry) {
    return 0;
  }

  const promptCost = ((usage.inputTokens ?? 0) / 1_000_000) * (entry.promptPricePerMillion ?? 0);
  const completionCost = ((usage.outputTokens ?? 0) / 1_000_000) * (entry.completionPricePerMillion ?? 0);

  return Number((promptCost + completionCost).toFixed(6));
}

export function createUsageStep(label: string, modelId: string, entry: ModelCatalogEntry | undefined, usage: LanguageModelUsage): ModelUsageStep {
  return {
    id: crypto.randomUUID(),
    label,
    modelId,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
    estimatedCostUsd: estimateCostUsd(entry, usage),
  };
}

export function summarizeUsage(steps: ModelUsageStep[]): UsageSummary {
  return {
    inputTokens: steps.reduce((total, step) => total + (step.inputTokens ?? 0), 0) || undefined,
    outputTokens: steps.reduce((total, step) => total + (step.outputTokens ?? 0), 0) || undefined,
    totalTokens: steps.reduce((total, step) => total + (step.totalTokens ?? 0), 0) || undefined,
    estimatedCostUsd: Number(steps.reduce((total, step) => total + step.estimatedCostUsd, 0).toFixed(6)),
    steps,
  };
}

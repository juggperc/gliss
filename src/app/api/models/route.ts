import { NextResponse } from "next/server";

import { fetchOpenRouterModels } from "@/lib/server/openrouter";
import { mapModelCatalogEntry } from "@/lib/server/usage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const models = await fetchOpenRouterModels();
    const filtered = models
      .map(mapModelCatalogEntry)
      .sort((left, right) => {
        const leftPriority = /anthropic|openai|google|meta/i.test(left.id) ? 1 : 0;
        const rightPriority = /anthropic|openai|google|meta/i.test(right.id) ? 1 : 0;
        return rightPriority - leftPriority || (right.contextLength ?? 0) - (left.contextLength ?? 0);
      });

    return NextResponse.json({ data: filtered }, {
      headers: {
        "Cache-Control": "public, max-age=600, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load models";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

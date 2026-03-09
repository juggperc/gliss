"use client";

import { BrainCircuit, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/use-chat-store";

function formatUsd(value?: number) {
  return value == null ? "$0.00" : `$${value.toFixed(value < 0.01 ? 4 : 2)}`;
}

export function CouncilActivityView() {
  const { councilRuns, setActiveView } = useChatStore();
  const runs = Object.values(councilRuns).sort((left, right) => (right.completedAt ?? right.createdAt) - (left.completedAt ?? left.createdAt));

  if (runs.length === 0) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-12 md:px-6">
        <div className="max-w-lg rounded-[32px] border border-dashed border-border bg-card/80 px-8 py-10 text-center shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted text-sky-700">
            <BrainCircuit className="size-7" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-foreground">Council activity is empty right now</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Run a question in Council Mode to see the lead draft, critique, tools used, and final synthesis here.
          </p>
          <Button type="button" variant="secondary" onClick={() => setActiveView("chat")} className="mt-6 rounded-2xl">
            Return to chat
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <div className="rounded-[32px] border border-border/70 bg-card/80 px-6 py-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Council Activity</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">Every review pass, critique, and tool event</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Council mode uses a lead-and-reviewer pattern. This activity feed shows what happened under the hood so the logic is inspectable instead of magical.
        </p>
      </div>

      <div className="space-y-5">
        {runs.map((run) => (
          <article key={run.id} className="rounded-[32px] border border-border/70 bg-card/80 px-6 py-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Council Run</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">{run.prompt || "Untitled run"}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">Lead: {run.leadModelId} | Reviewer: {run.reviewerModelId}</p>
              </div>
              <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                <p>Usage</p>
                <p className="mt-1 font-semibold text-foreground">{formatUsd(run.usage?.estimatedCostUsd)}</p>
                <p className="mt-1">{run.usage?.totalTokens ?? 0} tokens</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="rounded-[28px] border border-border/70 bg-background/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Council Log</p>
                <div className="mt-4 space-y-3">
                  {run.logs.map((log) => (
                    <div key={log.id} className="rounded-2xl border border-border/70 px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">{log.stage}</p>
                      <p className="mt-1 text-sm leading-7 text-muted-foreground">{log.summary}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-border/70 bg-background/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Tool Events</p>
                {run.toolEvents.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-6 text-sm leading-7 text-muted-foreground">
                    No external tools were needed for this run.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {run.toolEvents.map((event) => (
                      <div key={event.id} className="rounded-2xl border border-border/70 px-4 py-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Wrench className="size-4 text-sky-700" />
                          <span>{event.displayName}</span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{event.type}</span>
                        </div>
                        {event.message ? <p className="mt-2 text-sm leading-7 text-muted-foreground">{event.message}</p> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

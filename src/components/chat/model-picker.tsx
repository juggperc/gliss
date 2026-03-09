"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Cpu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ModelCatalogEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/use-chat-store";

export function ModelPicker() {
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<ModelCatalogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeModel, setActiveModel } = useChatStore();

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/models");
        const payload = (await response.json()) as { data?: ModelCatalogEntry[]; error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "Failed to load models");
        }

        if (!cancelled) {
          setModels(Array.isArray(payload.data) ? payload.data : []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load models");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadModels();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredModels = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const source = normalizedSearch
      ? models.filter((model) => `${model.name} ${model.id}`.toLowerCase().includes(normalizedSearch))
      : models;

    return source.slice(0, 80);
  }, [models, search]);

  const selectedModel = models.find((model) => model.id === activeModel) ?? {
    id: activeModel,
    name: activeModel,
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="h-11 w-full min-w-[240px] justify-between rounded-2xl bg-white/85 px-3 sm:w-[320px]">
          <div className="flex min-w-0 items-center gap-2">
            <Cpu className="size-4 shrink-0" />
            <span className="truncate font-medium text-foreground">{selectedModel.name || "Select a model"}</span>
          </div>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[min(92vw,360px)] rounded-[24px] border border-border bg-popover p-0 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search models"
            className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <ScrollArea className="h-[340px]">
          <div className="space-y-1 p-2">
            {isLoading ? <p className="px-3 py-8 text-sm text-muted-foreground">Loading models...</p> : null}
            {error ? <p className="px-3 py-8 text-sm text-destructive">{error}</p> : null}
            {!isLoading && !error && filteredModels.length === 0 ? (
              <p className="px-3 py-8 text-sm text-muted-foreground">No matching models found.</p>
            ) : null}

            {!isLoading && !error
              ? filteredModels.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      setActiveModel(model.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full rounded-2xl border border-transparent px-3 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      activeModel === model.id ? "bg-muted text-foreground" : "hover:border-border/70 hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{model.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{model.id}</p>
                      </div>
                      {activeModel === model.id ? <Check className="size-4 shrink-0" /> : null}
                    </div>
                    {model.contextLength ? (
                      <p className="mt-2 text-xs text-muted-foreground">Context window: {model.contextLength.toLocaleString()} tokens</p>
                    ) : null}
                  </button>
                ))
              : null}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

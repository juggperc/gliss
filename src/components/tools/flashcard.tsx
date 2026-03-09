"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookmarkPlus, Check, RotateCcw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getLessonSummary, getLessonTitle, type FlashcardData } from "@/lib/lesson-content";
import { useChatStore } from "@/store/use-chat-store";

export interface FlashcardProps {
  data: FlashcardData;
  allowSave?: boolean;
}

export function Flashcard({ data, allowSave = true }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveLessonComponent = useChatStore((state) => state.saveLessonComponent);

  const cardTitle = useMemo(() => getLessonTitle("flashcard", data), [data]);
  const cardSummary = useMemo(() => getLessonSummary("flashcard", data), [data]);

  const handleSave = () => {
    saveLessonComponent({
      id: crypto.randomUUID(),
      type: "flashcard",
      title: cardTitle,
      summary: cardSummary,
      data,
      savedAt: Date.now(),
    });

    setSaved(true);
  };

  return (
    <div className="my-6 mx-auto w-full max-w-3xl">
      <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,249,255,0.96))] shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4 md:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Flashcard</p>
            <h3 className="mt-1 text-base font-semibold text-foreground">{cardTitle}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs uppercase tracking-[0.18em] text-sky-800">
              {isFlipped ? "Answer side" : "Prompt side"}
            </span>
            {allowSave ? (
              <Button
                type="button"
                variant={saved ? "secondary" : "outline"}
                size="sm"
                onClick={handleSave}
                disabled={saved}
                className="rounded-2xl"
              >
                {saved ? <Check className="size-4 text-emerald-600" /> : <BookmarkPlus className="size-4" />}
                {saved ? "Saved" : "Save"}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="p-4 md:p-6">
          <motion.button
            type="button"
            whileTap={{ scale: 0.995 }}
            onClick={() => setIsFlipped((current) => !current)}
            className="block w-full rounded-[1.75rem] border border-border/70 bg-white/80 p-6 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition focus-visible:ring-2 focus-visible:ring-ring/50 md:p-8"
            aria-pressed={isFlipped}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-700">
                <Sparkles className="size-3.5 text-sky-700" />
                {isFlipped ? "Back" : "Front"}
              </div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <RotateCcw className="size-3.5" />
                Flip card
              </div>
            </div>

            <div className="mt-8 min-h-52 md:min-h-64">
              {isFlipped ? (
                <div className="space-y-5">
                  <p className="max-w-4xl text-xl leading-9 text-foreground md:text-2xl">{data.back}</p>
                  {data.context ? (
                    <div className="rounded-[1.5rem] border border-border/70 bg-slate-50/85 px-5 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Context</p>
                      <p className="mt-2 max-w-4xl text-sm leading-7 text-muted-foreground">{data.context}</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-5">
                  <p className="max-w-4xl text-3xl leading-tight text-foreground md:text-4xl">{data.front}</p>
                  <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                    Flip this card to reveal the explanation, example, or target-language meaning.
                  </p>
                </div>
              )}
            </div>
          </motion.button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-5 py-4 text-sm text-muted-foreground md:px-6">
          <span>{saved ? "Saved to your lesson library" : "Use this as a quick review checkpoint"}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsFlipped((current) => !current)} className="rounded-2xl text-foreground">
            <RotateCcw className="size-4" />
            {isFlipped ? "Show prompt" : "Show answer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

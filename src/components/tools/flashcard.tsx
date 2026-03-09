"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookmarkPlus, Check, RotateCcw } from "lucide-react";

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

  const handleSave = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

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
    <div className="my-6 w-full max-w-md mx-auto">
      <motion.button
        type="button"
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsFlipped((current) => !current)}
        className="w-full overflow-hidden rounded-[28px] border border-border/70 bg-card text-left shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-pressed={isFlipped}
      >
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          <span>Flashcard</span>
          <div className="flex items-center gap-2">
            <span>{isFlipped ? "Back" : "Front"}</span>
            {allowSave ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleSave}
                disabled={saved}
                className="rounded-full"
                aria-label={saved ? "Saved flashcard" : "Save flashcard"}
              >
                {saved ? <Check className="size-4 text-emerald-600" /> : <BookmarkPlus className="size-4" />}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="min-h-64 px-6 py-8 md:px-8 md:py-10">
          {isFlipped ? (
            <div className="space-y-4">
              <p className="text-xl font-semibold leading-tight text-foreground">{data.back}</p>
              {data.context ? (
                <p className="max-w-prose rounded-2xl bg-muted px-4 py-3 text-sm leading-7 text-muted-foreground">
                  {data.context}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-2xl font-semibold leading-tight text-foreground md:text-3xl">{data.front}</p>
              <p className="text-sm leading-7 text-muted-foreground">Tap or press to flip and reveal the explanation.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/70 px-5 py-3 text-sm text-muted-foreground">
          <span>{saved ? "Saved to lessons" : "Review and save for later"}</span>
          <RotateCcw className="size-4" aria-hidden="true" />
        </div>
      </motion.button>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookmarkPlus, Check, CheckCircle2, RotateCcw, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getLessonSummary, getLessonTitle, type QuizData } from "@/lib/lesson-content";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/use-chat-store";

export interface QuizProps {
  data: QuizData;
  allowSave?: boolean;
}

export function Quiz({ data, allowSave = true }: QuizProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveLessonComponent = useChatStore((state) => state.saveLessonComponent);

  const title = useMemo(() => getLessonTitle("quiz", data), [data]);
  const summary = useMemo(() => getLessonSummary("quiz", data), [data]);

  const isCorrect = selectedIndex === data.correctIndex;

  const handleSave = () => {
    saveLessonComponent({
      id: crypto.randomUUID(),
      type: "quiz",
      title,
      summary,
      data,
      savedAt: Date.now(),
    });

    setSaved(true);
  };

  return (
    <div className="w-full max-w-xl mx-auto my-6 rounded-[28px] border border-border/70 bg-card shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Knowledge Check</p>
          <h3 className="mt-2 text-lg font-semibold text-foreground md:text-xl">{data.question}</h3>
        </div>
        <div className="flex items-center gap-2">
          {isSubmitted ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setIsSubmitted(false);
                setSelectedIndex(null);
              }}
              className="rounded-full"
              aria-label="Reset quiz"
            >
              <RotateCcw className="size-4" />
            </Button>
          ) : null}
          {allowSave ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleSave}
              disabled={saved}
              className="rounded-full"
              aria-label={saved ? "Saved quiz" : "Save quiz"}
            >
              {saved ? <Check className="size-4 text-emerald-600" /> : <BookmarkPlus className="size-4" />}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 px-5 py-5">
        {data.options.map((option, index) => {
          const selected = selectedIndex === index;
          const correct = index === data.correctIndex;
          const classes = !isSubmitted
            ? selected
              ? "border-primary bg-primary/5 text-foreground"
              : "border-border bg-background hover:border-primary/50 hover:bg-muted/50"
            : correct
              ? "border-emerald-400/70 bg-emerald-50 text-emerald-900"
              : selected
                ? "border-rose-400/70 bg-rose-50 text-rose-900"
                : "border-border/70 bg-background text-muted-foreground";

          return (
            <motion.button
              key={`${option}-${index}`}
              type="button"
              whileTap={{ scale: isSubmitted ? 1 : 0.99 }}
              onClick={() => !isSubmitted && setSelectedIndex(index)}
              disabled={isSubmitted}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                classes,
              )}
            >
              <span className="font-medium leading-6">{option}</span>
              {isSubmitted && correct ? <CheckCircle2 className="size-4" /> : null}
              {isSubmitted && selected && !correct ? <XCircle className="size-4" /> : null}
            </motion.button>
          );
        })}
      </div>

      <div className="border-t border-border/70 px-5 py-4">
        {!isSubmitted ? (
          <Button type="button" onClick={() => selectedIndex !== null && setIsSubmitted(true)} disabled={selectedIndex === null} className="rounded-xl">
            Check Answer
          </Button>
        ) : data.explanation ? (
          <div className={cn("rounded-2xl px-4 py-3 text-sm leading-7", isCorrect ? "bg-emerald-50 text-emerald-900" : "bg-muted text-foreground")}>
            <p className="font-semibold">{isCorrect ? "Correct" : "Try Again"}</p>
            <p>{data.explanation}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{isCorrect ? "Correct." : "That answer is not correct."}</p>
        )}
      </div>
    </div>
  );
}

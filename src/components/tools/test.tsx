"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookmarkPlus, Check, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getLessonSummary, getLessonTitle, type TestData } from "@/lib/lesson-content";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/use-chat-store";

export interface TestProps {
  data: TestData;
  allowSave?: boolean;
}

export function Test({ data, allowSave = true }: TestProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const saveLessonComponent = useChatStore((state) => state.saveLessonComponent);

  const title = useMemo(() => getLessonTitle("test", data), [data]);
  const summary = useMemo(() => getLessonSummary("test", data), [data]);
  const isFinished = answers.length === data.questions.length;

  const handleSave = () => {
    saveLessonComponent({
      id: crypto.randomUUID(),
      type: "test",
      title,
      summary,
      data,
      savedAt: Date.now(),
    });

    setSaved(true);
  };

  const handleNext = () => {
    if (selectedIndex === null) {
      return;
    }

    const nextAnswers = [...answers, selectedIndex];
    setAnswers(nextAnswers);
    setSelectedIndex(null);
    setCurrentQuestion((value) => value + 1);
  };

  const score = answers.filter((answer, index) => answer === data.questions[index].correctIndex).length;

  if (isFinished) {
    return (
      <div className="w-full max-w-xl mx-auto my-6 rounded-[28px] border border-border/70 bg-card shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Assessment</p>
            <h3 className="mt-2 text-lg font-semibold text-foreground">{data.title}</h3>
          </div>
          {allowSave ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleSave}
              disabled={saved}
              className="rounded-full"
              aria-label={saved ? "Saved assessment" : "Save assessment"}
            >
              {saved ? <Check className="size-4 text-emerald-600" /> : <BookmarkPlus className="size-4" />}
            </Button>
          ) : null}
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="rounded-2xl bg-muted px-4 py-4">
            <p className="text-sm text-muted-foreground">Score</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{Math.round((score / data.questions.length) * 100)}%</p>
            <p className="mt-2 text-sm text-muted-foreground">{score} of {data.questions.length} correct</p>
          </div>

          {data.questions.map((question, index) => (
            <div key={`${question.question}-${index}`} className="rounded-2xl border border-border/70 px-4 py-4">
              <p className="font-medium text-foreground">{question.question}</p>
              <p className={cn("mt-2 text-sm", answers[index] === question.correctIndex ? "text-emerald-700" : "text-rose-700")}>
                Your answer: {question.options[answers[index]]}
              </p>
              {answers[index] !== question.correctIndex ? (
                <p className="mt-1 text-sm text-emerald-700">Correct answer: {question.options[question.correctIndex]}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const question = data.questions[currentQuestion];

  return (
    <div className="w-full max-w-xl mx-auto my-6 rounded-[28px] border border-border/70 bg-card shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Assessment</p>
          <h3 className="mt-2 text-lg font-semibold text-foreground">{data.title}</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{currentQuestion + 1} / {data.questions.length}</span>
          {allowSave ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleSave}
              disabled={saved}
              className="rounded-full"
              aria-label={saved ? "Saved assessment" : "Save assessment"}
            >
              {saved ? <Check className="size-4 text-emerald-600" /> : <BookmarkPlus className="size-4" />}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 px-5 py-5">
        <p className="text-lg font-semibold text-foreground">{question.question}</p>
        {question.options.map((option, index) => (
          <motion.button
            key={`${option}-${index}`}
            type="button"
            whileTap={{ scale: 0.99 }}
            onClick={() => setSelectedIndex(index)}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              selectedIndex === index
                ? "border-primary bg-primary/5"
                : "border-border bg-background hover:border-primary/50 hover:bg-muted/50",
            )}
          >
            <span className="font-medium">{option}</span>
            {selectedIndex === index ? <Check className="size-4 text-primary" /> : null}
          </motion.button>
        ))}
      </div>

      <div className="flex justify-end border-t border-border/70 px-5 py-4">
        <Button type="button" onClick={handleNext} disabled={selectedIndex === null} className="rounded-xl">
          {currentQuestion === data.questions.length - 1 ? "Finish" : "Next"}
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

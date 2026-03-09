"use client";

import { BookMarked, Trash2 } from "lucide-react";

import { Flashcard } from "@/components/tools/flashcard";
import { Quiz } from "@/components/tools/quiz";
import { Test } from "@/components/tools/test";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/use-chat-store";

export function SavedLessonsView() {
  const { savedLessons, removeSavedLesson, setActiveView } = useChatStore();
  const lessons = Object.values(savedLessons).sort((left, right) => right.savedAt - left.savedAt);

  if (lessons.length === 0) {
    return (
      <section className="flex w-full flex-1 items-center justify-center px-5 py-12 lg:px-8">
        <div className="max-w-lg rounded-[32px] border border-dashed border-border bg-card/80 px-8 py-10 text-center shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted text-sky-700">
            <BookMarked className="size-7" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-foreground">Saved lessons will appear here</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Save a flashcard, quiz, or assessment from the chat and it will become a reusable study asset here.
          </p>
          <Button type="button" variant="secondary" onClick={() => setActiveView("chat")} className="mt-6 rounded-2xl">
            Go to chat
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-5 py-6 lg:px-8 lg:py-8">
      <div className="rounded-[32px] border border-border/70 bg-card/80 px-6 py-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Saved Lessons</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">Study materials you decided to keep</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Saved content stays in local storage so you can revisit it without digging through past chats.
        </p>
      </div>

      <div className="grid gap-6 2xl:grid-cols-2">
        {lessons.map((lesson) => (
          <article key={lesson.id} className="rounded-[32px] border border-border/70 bg-card/80 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-4 px-2 pb-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{lesson.type}</p>
                <h2 className="mt-2 text-lg font-semibold text-foreground">{lesson.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{lesson.summary}</p>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeSavedLesson(lesson.id)} className="rounded-full" aria-label={`Remove ${lesson.title}`}>
                <Trash2 className="size-4" />
              </Button>
            </div>

            {lesson.type === "flashcard" ? <Flashcard data={lesson.data} allowSave={false} /> : null}
            {lesson.type === "quiz" ? <Quiz data={lesson.data} allowSave={false} /> : null}
            {lesson.type === "test" ? <Test data={lesson.data} allowSave={false} /> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

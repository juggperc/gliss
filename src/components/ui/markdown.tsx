import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Flashcard } from "@/components/tools/flashcard";
import { Quiz } from "@/components/tools/quiz";
import { Test } from "@/components/tools/test";
import { parseFlashcardData, parseQuizData, parseTestData } from "@/lib/lesson-content";

function tryParseStructuredBlock(rawValue: string) {
  try {
    return JSON.parse(rawValue) as unknown;
  } catch {
    return null;
  }
}

export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-p:leading-7 prose-li:leading-7 prose-pre:rounded-2xl prose-pre:border prose-pre:border-border/70 prose-pre:bg-slate-950 prose-pre:px-0 prose-pre:py-0 prose-code:text-sky-700 prose-strong:text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-sky-700 underline decoration-sky-200 underline-offset-4 hover:text-sky-800"
            />
          ),
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match?.[1];
            const rawValue = String(children).trim();
            const parsedValue =
              language === "flashcard" || language === "quiz" || language === "test"
                ? tryParseStructuredBlock(rawValue)
                : null;

            if (language === "flashcard" && parsedValue) {
              const data = parseFlashcardData(parsedValue);
              if (data) {
                return <Flashcard data={data} />;
              }
            }

            if (language === "quiz" && parsedValue) {
              const data = parseQuizData(parsedValue);
              if (data) {
                return <Quiz data={data} />;
              }
            }

            if (language === "test" && parsedValue) {
              const data = parseTestData(parsedValue);
              if (data) {
                return <Test data={data} />;
              }
            }

            if (!language) {
              return (
                <code className="rounded-md bg-muted px-1.5 py-0.5 text-[0.92em] text-sky-700" {...props}>
                  {children}
                </code>
              );
            }

            return (
              <pre>
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-300">
                  <span>{language}</span>
                </div>
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

import type { FeatureMode } from "@/lib/types";

const basePrompt = [
  "You are Gliss, a sharp, calm AI language coach.",
  "Prioritize clarity, accurate explanations, readable Markdown, and practical examples.",
  "Keep formatting clean with short sections, concise bullets, and natural teaching language.",
  "If tools are available and they would materially improve the answer, use them.",
].join(" ");

const lessonContract = [
  "Return a structured lesson in Markdown.",
  "Include these sections in order: Overview, Key Ideas, Examples, Practice, Next Step.",
  "Keep paragraphs short and use bullets where it improves readability.",
].join(" ");

const quizContract = [
  "Return a short intro sentence followed by one or more fenced code blocks using the language tag quiz.",
  "Each quiz block must contain valid JSON with this exact shape:",
  '{"question":"string","options":["a","b"],"correctIndex":0,"explanation":"string"}',
  "Do not wrap the JSON in Markdown lists or prose inside the code fence.",
].join(" ");

const flashcardContract = [
  "Return a short intro sentence followed by two to four fenced code blocks using the language tag flashcard.",
  "Each flashcard block must contain valid JSON with this exact shape:",
  '{"front":"string","back":"string","context":"optional string"}',
  "Make the cards concise and useful for review.",
].join(" ");

export function buildSystemPrompt(mode: Exclude<FeatureMode, "council">) {
  switch (mode) {
    case "lesson":
      return `${basePrompt} ${lessonContract}`;
    case "quiz":
      return `${basePrompt} ${quizContract}`;
    case "flashcard":
      return `${basePrompt} ${flashcardContract}`;
    default:
      return basePrompt;
  }
}

export function buildLeadCouncilPrompt() {
  return [
    basePrompt,
    "You are the lead model in Gliss council mode.",
    "Produce the strongest answer you can, using tools when helpful.",
    "Optimize for factual accuracy, useful teaching structure, and concrete examples.",
  ].join(" ");
}

export function buildReviewerPrompt() {
  return [
    "You are the reviewer in Gliss council mode.",
    "Critique the lead draft for accuracy, missing context, pedagogy, readability, and whether tools should have been used differently.",
    "Return concise Markdown with sections: Verdict, Risks, Improvements.",
  ].join(" ");
}

export function buildSynthesisPrompt(mode: FeatureMode) {
  const modeNote =
    mode === "lesson"
      ? lessonContract
      : mode === "quiz"
        ? quizContract
        : mode === "flashcard"
          ? flashcardContract
          : "Return the final user-facing answer only.";

  return [
    basePrompt,
    "You are synthesizing a final answer after internal council review.",
    "Incorporate valid reviewer feedback without mentioning the internal process unless it directly helps the user.",
    modeNote,
  ].join(" ");
}

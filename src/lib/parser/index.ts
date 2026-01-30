import type { ParsedOptions } from "./meta/options-block-processor";
import { QuestionParser } from "./question-parser";
import type { Question } from "./questions/question";
import type { QuizOption, QuizQuestion } from "@/lib/types";

export type ParsedBank = {
  questions: QuizQuestion[];
  options: ParsedOptions;
  log: string[];
};

const loader = new QuestionParser();

function mapQuestionToQuiz(question: Question): QuizQuestion {
  const prompt = question.body.trim() || "Untitled question";
  const options: QuizOption[] = question.answers.map(answer => ({
    id: `${question.id}_${answer.id}`,
    text: answer.body,
    correct: answer.correct,
    explanation: question.explanation,
  }));
  return { id: question.id, prompt, options };
}

export function parseQuestionsFromText(text: string): ParsedBank {
  const { questions, options, log } = loader.parse(text);
  console.log("Parsed questions:", questions);
  return {
    questions: questions.map(mapQuestionToQuiz),
    options: options,
    log,
  };
}

import type { LogFn } from "../utils/pipeline";
import { matchAnswer, matchIdentifier, splitWithNewlines } from "../utils/parsing-utils";
import { QuestionBuilder } from "./question-builder";
import { QuestionMerger } from "./question-merger";
import type { Question } from "./question";

const excerpt = (question: Question, limit = 40) => {
  const body = question.body.trim();
  if (body.length > limit) return `${body.substring(0, limit)}...`;
  if (body.length === 0) return "[no body]";
  return body;
};

export class QuestionParsingUtils {
  parseQuestion(str: string, logFn: LogFn): Question {
    const lines = splitWithNewlines(str);
    const builder = new QuestionBuilder();

    let workingLines = [...lines];
    const identifierMatched = matchIdentifier(workingLines[0] ?? "");
    if (identifierMatched) {
      workingLines = workingLines.slice(1);
      builder.appendToBody(identifierMatched.content);
      builder.setIdentifier(identifierMatched.identifier);
    }

    let parsingAnswers = false;

    try {
      for (const line of workingLines) {
        if (!parsingAnswers) {
          const answerMatch = matchAnswer(line);
          if (!answerMatch) {
            builder.appendToBody(line);
          } else {
            parsingAnswers = true;
            builder.addAnswer(answerMatch.content, answerMatch.correct, answerMatch.letter);
          }
        } else {
          const answerMatch = matchAnswer(line);
          if (answerMatch) {
            builder.addAnswer(answerMatch.content, answerMatch.correct, answerMatch.letter);
          } else {
            builder.appendAnswerLine(line);
          }
        }
      }
    } catch (e) {
      logFn(`Error parsing question: ${(e as Error).message}`);
    }

    return builder.build();
  }

  mergeBrokenQuestions(questions: Question[], logFn: LogFn = () => undefined): Question[] {
    const mergeWithPrevious = questions.map(question => question.body.trim().length === 0);
    const mergeWithNext = mergeWithPrevious.slice(1);
    for (let index = 0; index < mergeWithNext.length; index += 1) {
      if (questions[index].answers.length === 0) {
        mergeWithNext[index] = true;
      }
    }
    mergeWithNext.push(false);

    const result: Question[] = [];
    const pending = [...questions];
    const merger = new QuestionMerger();

    while (pending.length > 1) {
      let processed = pending.shift()!;
      let shouldMergeNext = mergeWithNext.shift()!;
      let mergedCount = 1;
      while (shouldMergeNext) {
        const toMerge = pending.shift();
        const nextFlag = mergeWithNext.shift();
        if (!toMerge || nextFlag === undefined) break;
        processed = merger.merge(processed, toMerge);
        shouldMergeNext = nextFlag;
        mergedCount += 1;
      }
      result.push(processed);
      if (mergedCount > 1) {
        (processed as Question & { merged?: number }).merged = mergedCount;
        const questionExcerpt = excerpt(processed);
        const msg = `Merged ${mergedCount} questions: '${questionExcerpt}' (${processed.answers.length} answers total)`;
        logFn(msg);
      }
    }

    return result.concat(pending);
  }

  removeInvalidQuestions(questions: Question[], logFn: LogFn = () => undefined): Question[] {
    const valid: Question[] = [];

    for (const question of questions) {
      let msg = "";
      if (!question.body.trim().length) {
        msg = `Skipped question because it has no body (${question.answers.length} answers)`;
      } else if (question.answers.length < 2) {
        msg = `Skipped question because it has less than 2 answers: '${excerpt(question)}'`;
        if ((question as Question & { merged?: number }).merged) {
          msg += ` (merged from ${(question as Question & { merged?: number }).merged} questions)`;
        }
      } else if (!question.totalCorrect()) {
        msg = `Skipped question because it has no correct answers: '${excerpt(question)}'`;
        if ((question as Question & { merged?: number }).merged) {
          msg += ` (merged from ${(question as Question & { merged?: number }).merged} questions)`;
        }
      }

      if (msg) {
        logFn(msg);
      } else {
        valid.push(question);
      }
    }

    return valid;
  }

  matchNonEmptyStrings(str: string): boolean {
    return str.trim().length > 0;
  }
}

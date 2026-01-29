import type { LogFn } from "../utils/pipeline";
import { OptionsBlockProcessor, type ParsedOptions } from "./options-block-processor";
import type { Question } from "../questions/question";

const optionsBlockRegex = /<options>\s*(\{(?:.|\n|\r)*})\s*/i;

export class OptionsBlockUtils {
  private readonly processor = new OptionsBlockProcessor();

  loadOptions(target: ParsedOptions) {
    return (parts: string[], logFn: LogFn) => {
      if (!Array.isArray(parts)) throw new Error("Expected an array as input");
      if (typeof target !== "object" || target === null) throw new Error("Expected an object as target");
      if (parts.length === 0) return parts;

      const lastPart = parts[parts.length - 1];
      const matched = optionsBlockRegex.exec(lastPart);
      if (!matched) {
        Object.assign(target, this.processor.process("{}"));
        return parts;
      }

      const optionsString = matched[1];
      const options = this.processor.process(optionsString, logFn);
      Object.assign(target, options);
      return parts.slice(0, parts.length - 1);
    };
  }

  assignQuestionExtras(options: ParsedOptions) {
    const explanations = options.explanations || {};
    const relatedLinks = options.relatedLinks || {};

    return (questions: Question[], logFn: LogFn) => {
      if (!Array.isArray(questions)) throw new Error("Expected an array of questions");
      if (typeof explanations !== "object") throw new Error("Expected a map of explanations");
      if (typeof relatedLinks !== "object") throw new Error("Expected a map of related links");
      if (questions.length === 0) return questions;

      const loadedExplanationIds = Object.keys(explanations);
      const commonExplanationIds: string[] = [];
      for (const question of questions) {
        if (question.id in explanations) {
          question.setExplanation((explanations as Record<string, string>)[question.id]);
          commonExplanationIds.push(question.id);
        }
      }

      if (loadedExplanationIds.length > commonExplanationIds.length) {
        logFn(
          `${loadedExplanationIds.length - commonExplanationIds.length} explanations couldn't be matched to questions`,
        );
      }

      const loadedLinkIds = Object.keys(relatedLinks);
      const commonLinkIds: string[] = [];
      for (const question of questions) {
        if (question.id in relatedLinks) {
          question.setRelatedLinks((relatedLinks as Record<string, string[]>)[question.id]);
          commonLinkIds.push(question.id);
        }
      }

      if (loadedLinkIds.length > commonLinkIds.length) {
        logFn(`${loadedLinkIds.length - commonLinkIds.length} related links couldn't be matched to questions`);
      }

      options.explanationsAvailable = commonExplanationIds.length > 0;
      return questions;
    };
  }
}

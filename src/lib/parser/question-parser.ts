import { OptionsBlockUtils } from "./meta/options-block-utils";
import { QuestionParsingUtils } from "./questions/question-parsing-utils";
import { matchNonEmptyStrings, splitWithDoubleLines } from "./utils/parsing-utils";
import { Pipeline } from "./utils/pipeline";
import type { ParsedOptions } from "./meta/options-block-processor";
import type { QuestionI } from "./questions/question";

export type ParseResult = {
  questions: QuestionI[];
  options: ParsedOptions;
  log: string[];
};

const optionsUtils = new OptionsBlockUtils();
const parsingUtils = new QuestionParsingUtils();

export function parseQuestionsFromText(input: string): ParseResult {
  const options: ParsedOptions = {};

  const pipeline = new Pipeline<string | string[]>(input)
    .apply(splitWithDoubleLines)
    .filter(matchNonEmptyStrings)
    .apply(optionsUtils.loadOptions(options))
    .map((str: string, log) => parsingUtils.parseQuestion(str, log))
    .apply((items, log) => parsingUtils.mergeBrokenQuestions(items, log))
    .apply((items, log) => parsingUtils.removeInvalidQuestions(items, log))
    .apply(optionsUtils.assignQuestionExtras(options));

  return {
    questions: pipeline.get().map(item => item.toStaticQuestion()),
    options,
    log: pipeline.getLog(),
  };
}

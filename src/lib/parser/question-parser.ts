import { OptionsBlockUtils } from "./meta/options-block-utils";
import { QuestionParsingUtils } from "./questions/question-parsing-utils";
import { matchNonEmptyStrings, splitWithDoubleLines } from "./utils/parsing-utils";
import { Pipeline } from "./utils/pipeline";
import type { ParsedOptions } from "./meta/options-block-processor";
import type { Question } from "./questions/question";

export type ParseResult = {
  questions: Question[];
  options: ParsedOptions;
  log: string[];
};

export class QuestionParser {
  private readonly optionsUtils = new OptionsBlockUtils();
  private readonly parsingUtils = new QuestionParsingUtils();

  parse(input: string): ParseResult {
    const options: ParsedOptions = {};

    const pipeline = new Pipeline<string | string[]>(input)
      .apply(splitWithDoubleLines)
      .filter(matchNonEmptyStrings)
      .apply(this.optionsUtils.loadOptions(options))
      .map(str => this.parsingUtils.parseQuestion(str))
      .apply((items, log) => this.parsingUtils.mergeBrokenQuestions(items, log))
      .apply((items, log) => this.parsingUtils.removeInvalidQuestions(items, log))
      .apply(this.optionsUtils.assignQuestionExtras(options));

    return {
      questions: pipeline.get() as Question[],
      options,
      log: pipeline.getLog(),
    };
  }
}

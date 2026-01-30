import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { OptionsBlockUtils } from "./options-block-utils";
import { Question } from "../questions/question";
import { ParsedOptions } from "./options-block-processor";

const log = (_: string) => console.log(_);

describe("OptionsBlockUtils.loadOptions", () => {
  const utils = new OptionsBlockUtils();

  test("leaves content intact when no options block is present", () => {
    const logger: string[] = [];
    const input = [
      "Question\n> a) correct\nb> incorrect",
      "Question\n> a) correct\nb> incorrect",
      "Question\n> a) correct\nb> incorrect",
    ];
    const output = utils.loadOptions({})(input, message => logger.push(message));
    assert.equal(output.length, 3);
    output.forEach(item => assert.equal(item, "Question\n> a) correct\nb> incorrect"));
    assert.deepEqual(logger, []);
  });

  test("removes trailing options block and returns remaining parts", () => {
    const logger: string[] = [];
    const input = [
      "Question\n> a) correct\nb> incorrect",
      "Question\n> a) correct\nb> incorrect",
      "Question\n> a) correct\nb> incorrect",
      ' <options> {"format": "legacy"} ',
    ];
    const output = utils.loadOptions({})(input, message => logger.push(message));
    assert.equal(output.length, 3);
    assert.deepEqual(logger, []);
    input.forEach((item, index) => {
      if (index < 3) assert.equal(output[index], item);
    });
  });

  test("does not modify original input array", () => {
    const input = [
      "Question\n> a) correct\nb> incorrect",
      "Question\n> a) correct\nb> incorrect",
      "Question\n> a) correct\nb> incorrect",
      '<options> {"format": "legacy"}',
    ];
    utils.loadOptions({})(input, log);
    assert.equal(input.length, 4);
    assert.equal(input[3], '<options> {"format": "legacy"}');
  });

  test("throws for invalid inputs", () => {
    const validInput = ["Question\n> a) correct\nb> incorrect", '<options> {"format": "legacy"}'];
    assert.throws(() => utils.loadOptions({})({} as unknown as string[], log));
    assert.throws(() => utils.loadOptions({})("" as unknown as string[], log));
    assert.throws(() => utils.loadOptions({})(false as unknown as string[], log));
    assert.throws(() => utils.loadOptions("" as unknown as Record<string, unknown>)(validInput, log));
    assert.throws(() => utils.loadOptions(false as unknown as Record<string, unknown>)(validInput, log));
  });

  test("returns empty array when only options block is present", () => {
    const target: Record<string, unknown> = {};
    const output = utils.loadOptions(target)(['<options> {"format": "legacy"}'], log);
    assert.deepEqual(output, []);
    assert.ok(Object.keys(target).length > 0);
  });

  test("parses options into target object", () => {
    const target: Record<string, unknown> = {};
    utils.loadOptions(target)(["Question", '<options> {"format": "2"}'], log);
    assert.equal(target.format, "2");
    assert.ok("explanations" in target);
  });

  test("logs invalid values without throwing", () => {
    const target: Record<string, unknown> = {};
    const log: string[] = [];
    utils.loadOptions(target)(["Question", '<options> {"grading": "weird"}'], message => log.push(message));
    assert.equal(target.gradingMethod, "perAnswer");
    assert.ok(log.length >= 1);
  });
});

describe("OptionsBlockUtils.assignQuestionExtras", () => {
  const utils = new OptionsBlockUtils();

  test("throws on invalid inputs", () => {
    assert.throws(() => utils.assignQuestionExtras({ explanations: {}, relatedLinks: {} })({} as unknown as [], log));
    assert.throws(() => utils.assignQuestionExtras({ explanations: {}, relatedLinks: {} })("" as unknown as [], log));
    assert.throws(() =>
      utils.assignQuestionExtras({ explanations: {}, relatedLinks: {} })(false as unknown as [], log),
    );
  });

  test("handles empty input", () => {
    const log: string[] = [];
    assert.doesNotThrow(() =>
      utils.assignQuestionExtras({ explanations: {}, relatedLinks: {} })([], message => log.push(message)),
    );
    assert.deepEqual(log, []);
  });

  test("assigns explanations when ids match", () => {
    const log: string[] = [];
    const questions = [new Question("Body 1", "1"), new Question("Body 2", "2")];
    const explanations = { "1": "Explanation 1", "2": "Explanation 2" };
    const options: ParsedOptions = { explanations, relatedLinks: {} as Record<string, string[]> };
    const output = utils.assignQuestionExtras(options)(questions, message => log.push(message));
    assert.equal(output[0].explanation, "Explanation 1");
    assert.equal(output[1].explanation, "Explanation 2");
    assert.equal(options.explanationsAvailable, true);
    assert.deepEqual(log, []);
  });

  test("assigns related links when ids match", () => {
    const log: string[] = [];
    const questions = [new Question("Body 1", "1"), new Question("Body 2", "2")];
    const relatedLinks = { "1": ["link"], "2": ["also link"] };
    const options = { explanations: {}, relatedLinks };
    const output = utils.assignQuestionExtras(options)(questions, message => log.push(message));
    assert.deepEqual(output[0].relatedLinks, ["link"]);
    assert.deepEqual(output[1].relatedLinks, ["also link"]);
    assert.deepEqual(log, []);
  });

  test("logs unmatched explanations", () => {
    const log: string[] = [];
    const questions = [new Question("Body 2", "2"), new Question("Body 3", "3")];
    const explanations = { "0": "Explanation 1", "2": "Explanation 2" };
    const options: ParsedOptions = { explanations, relatedLinks: {} as Record<string, string[]> };
    const output = utils.assignQuestionExtras(options)(questions, message => log.push(message));
    assert.equal(output[0].explanation, "Explanation 2");
    assert.equal(output[1].explanation, undefined);
    assert.equal(options.explanationsAvailable, true);
    assert.ok(log.length >= 1);
  });

  test("logs unmatched related links", () => {
    const log: string[] = [];
    const questions = [new Question("Body 2", "2"), new Question("Body 3", "3")];
    const relatedLinks = { "0": ["link"], "2": ["also link"] };
    const options: ParsedOptions = { explanations: {}, relatedLinks };
    const output = utils.assignQuestionExtras(options)(questions, message => log.push(message));
    assert.deepEqual(output[0].relatedLinks, ["also link"]);
    assert.equal(output[1].relatedLinks, undefined);
    assert.ok(log.length >= 1);
  });

  test("sets explanationsAvailable only when matches occur", () => {
    const questions = [new Question("Body 2", "2")];
    const options: ParsedOptions = {
      explanations: { "0": "Explanation" },
      relatedLinks: {} as Record<string, string[]>,
    };
    utils.assignQuestionExtras(options)(questions, () => undefined);
    assert.equal(options.explanationsAvailable, false);
  });
});

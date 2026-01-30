import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { OptionsBlockProcessor } from "./options-block-processor";

const defaults = {
  format: "legacy",
  markdownReady: false,
  markdown: false,
  mathjaxReady: false,
  mathjax: false,
  gradingMethod: "perAnswer" as const,
  gradingRadical: "0",
  gradingPPQ: 1,
  timeLimitEnabled: false,
  timeLimitSecs: 60,
  repeatIncorrect: false,
  displayAsRadio: false,
  explain: "optional" as const,
  showExplanations: false,
  explanations: {},
  relatedLinks: {},
};

describe("OptionsBlockProcessor", () => {
  test("returns defaults for empty object", () => {
    const logger: string[] = [];
    const processor = new OptionsBlockProcessor();
    const result = processor.process("{}", message => logger.push(message));
    assert.deepEqual(result, defaults);
    assert.deepEqual(logger, []);
  });

  test("recognizes known formats", () => {
    const processor = new OptionsBlockProcessor();
    assert.equal(processor.process('{"format": "legacy"}').format, "legacy");
    assert.equal(processor.process('{"format": "2"}').format, "2");
    assert.equal(processor.process('{"format": "2.1"}').format, "2.1");
    assert.equal(processor.process('{"format": "2.2"}').format, "unknown");
  });

  test("parses markdown flag", () => {
    const processor = new OptionsBlockProcessor();
    const trueCases = ["true", "enabled", "enable", "yes", "1", 1, true];
    for (const value of trueCases) {
      const result = processor.process(JSON.stringify({ markdown: value }));
      assert.equal(result.markdownReady, true);
      assert.equal(result.markdown, true);
    }
    const falseCases = [false, "false", "disabled", "disable", "no", "0", 0];
    for (const value of falseCases) {
      const result = processor.process(JSON.stringify({ markdown: value }));
      assert.equal(result.markdownReady, false);
      assert.equal(result.markdown, false);
    }
  });

  test("parses mathjax flag", () => {
    const processor = new OptionsBlockProcessor();
    const resultTrue = processor.process('{"mathjax": "yes"}');
    assert.equal(resultTrue.mathjaxReady, true);
    assert.equal(resultTrue.mathjax, true);

    const resultFalse = processor.process('{"mathjax": "no"}');
    assert.equal(resultFalse.mathjaxReady, false);
    assert.equal(resultFalse.mathjax, false);
  });

  test("parses grading modes including custom", () => {
    const processor = new OptionsBlockProcessor();
    const perQuestion = processor.process('{"grading": "perQuestion"}');
    assert.equal(perQuestion.gradingMethod, "perQuestion");

    const perAnswer = processor.process('{"grading": "perAnswer"}');
    assert.equal(perAnswer.gradingMethod, "perAnswer");

    const custom = processor.process('{"grading": "custom: return 42;"}');
    assert.equal(custom.gradingMethod, "custom");
    assert.equal(custom.customGrader, "return 42;");
  });

  test("falls back and logs when custom grader is invalid", () => {
    const processor = new OptionsBlockProcessor();
    const log: string[] = [];
    const result = processor.process('{"grading": "custom: notValid(}"}', message => log.push(message));
    assert.equal(result.gradingMethod, "perAnswer");
    assert.equal("customGrader" in result, false);
    assert.ok(log.length >= 1);
  });

  test("parses gradingRadical and gradingPPQ", () => {
    const processor = new OptionsBlockProcessor();
    const radicalTrue = processor.process('{"gradingRadical": "yes"}');
    assert.equal(radicalTrue.gradingRadical, "1");
    const radicalFalse = processor.process('{"gradingRadical": "no"}');
    assert.equal(radicalFalse.gradingRadical, "0");

    const ppqThree = processor.process('{"gradingPPQ": 3}');
    assert.equal(ppqThree.gradingPPQ, 3);
    const ppqInvalid = processor.process('{"gradingPPQ": 0}');
    assert.equal(ppqInvalid.gradingPPQ, 1);
  });

  test("parses time limits", () => {
    const processor = new OptionsBlockProcessor();
    const enabled = processor.process('{"timeLimit": 30}');
    assert.equal(enabled.timeLimitEnabled, true);
    assert.equal(enabled.timeLimitSecs, 30);

    const disabled = processor.process('{"timeLimit": false}');
    assert.equal(disabled.timeLimitEnabled, false);
    assert.equal(disabled.timeLimitSecs, 60);
  });

  test("parses repeatIncorrect and displayAsRadio", () => {
    const processor = new OptionsBlockProcessor();
    assert.equal(processor.process('{"repeatIncorrect": true}').repeatIncorrect, true);
    assert.equal(processor.process('{"repeatIncorrect": "no"}').repeatIncorrect, false);
    assert.equal(processor.process('{"displayAsRadio": 1}').displayAsRadio, true);
    assert.equal(processor.process('{"displayAsRadio": 0}').displayAsRadio, false);
  });

  test("parses explanation maps", () => {
    const processor = new OptionsBlockProcessor();
    const input = '{"explanations": {"1": "test", "A_+-Z": "test2"}}';
    const result = processor.process(input);
    assert.deepEqual(result.explanations, { "1": "test", "A_+-Z": "test2" });
  });

  test("rejects invalid explanations and logs", () => {
    const processor = new OptionsBlockProcessor();
    const input = '{"explanations": {"1": "test", "bad": 5, "^regex$": ""}}';
    const log: string[] = [];
    const result = processor.process(input, message => log.push(message));
    assert.deepEqual(result.explanations, { "1": "test" });
    assert.ok(log.some(message => message.toLowerCase().includes("string")));
    assert.ok(log.some(message => message.toLowerCase().includes("invalid")));
  });

  test("parses related links", () => {
    const processor = new OptionsBlockProcessor();
    const input = '{"relatedLinks": {"1": ["a", "b"], "2": "single"}}';
    const result = processor.process(input);
    assert.deepEqual(result.relatedLinks, { "1": ["a", "b"], "2": ["single"] });
  });

  test("rejects invalid related links and logs", () => {
    const processor = new OptionsBlockProcessor();
    const input = '{"relatedLinks": {"1": [0, "ok"], "2": false}}';
    const log: string[] = [];
    const result = processor.process(input, message => log.push(message));
    assert.deepEqual(result.relatedLinks, {});
    assert.ok(log.length >= 2);
  });

  test("logs syntax errors and returns defaults", () => {
    const processor = new OptionsBlockProcessor();
    const log: string[] = [];
    const result = processor.process('{"format": "42",}', message => log.push(message));
    assert.deepEqual(result, defaults);
    assert.ok(log.length >= 1);
    assert.ok(log[0].toLowerCase().includes("syntax"));
  });
});

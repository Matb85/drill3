import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { QuestionParsingUtils } from "./question-parsing-utils";
import { Question } from "./question";

const utils = new QuestionParsingUtils();

const makeQuestion = (
  body: string,
  answerCount = 2,
  correctAt = 0,
  id = `Q${Math.random().toString(36).slice(2, 6)}`,
) => {
  const question = new Question(body, id);
  for (let index = 0; index < answerCount; index += 1) {
    const letter = String.fromCharCode(65 + index);
    question.addAnswer(`Answer #${index + 1}`, index === correctAt, letter);
  }
  return question;
};

describe("QuestionParsingUtils.parseQuestion", () => {
  test("parses simple questions", () => {
    const input = ["Hello world", "> a) Hello Karma", "b) Hello Sir William"].join("\n");
    const result = utils.parseQuestion(input, () => undefined);
    assert.equal(result.body, "Hello world");
    assert.ok(result.id);
    assert.equal(result.answers.length, 2);
    assert.equal(result.answers[0].body, "Hello Karma");
    assert.equal(result.answers[0].correct, true);
    assert.equal(result.answers[0].id, "a");
    assert.equal(result.answers[1].body, "Hello Sir William");
    assert.equal(result.answers[1].correct, false);
    assert.equal(result.answers[1].id, "b");
  });

  test("parses multi-line body", () => {
    const input = ["Hello world", "Hello darkness my old friend", "> a) Hello Karma", "b) Hello Sir William"].join(
      "\n",
    );
    const result = utils.parseQuestion(input, () => undefined);
    assert.equal(result.body, "Hello world\n\nHello darkness my old friend");
    assert.equal(result.answers.length, 2);
  });

  test("parses question without body", () => {
    const input = ["> a) Hello Karma", "b) Hello Sir William"].join("\n");
    const result = utils.parseQuestion(input, () => undefined);
    assert.equal(result.body, "");
    assert.equal(result.answers.length, 2);
  });

  test("parses identifiers in the first line", () => {
    const input = ["[#ok] Hello world", "> a) Hello Karma"].join("\n");
    const result = utils.parseQuestion(input, () => undefined);
    assert.equal(result.body, "Hello world");
    assert.equal(result.id, "ok");
    assert.equal(result.answers.length, 1);
    assert.equal(result.answers[0].id, "a");
  });

  test("parses multi-line answers", () => {
    const input = ["Hello world", "> a) Hello Karma", "How are you today?"].join("\n");
    const result = utils.parseQuestion(input, () => undefined);
    assert.equal(result.answers.length, 1);
    assert.equal(result.answers[0].body, "Hello Karma\nHow are you today?");
  });

  test("is reusable across calls", () => {
    const input = ["Hello world", "> a) Hello Karma", "b) Hello Sir William"].join("\n");
    utils.parseQuestion(input, () => undefined);
    utils.parseQuestion(input, () => undefined);
    const result = utils.parseQuestion(input, () => undefined);
    assert.equal(result.answers.length, 2);
  });
});

describe("QuestionParsingUtils.mergeBrokenQuestions", () => {
  test("leaves valid questions untouched", () => {
    const result = utils.mergeBrokenQuestions([makeQuestion("one"), makeQuestion("two"), makeQuestion("three")]);
    assert.equal(result.length, 3);
    result.forEach(item => assert.equal(item.answers.length, 2));
  });

  test("merges question without answers with following question", () => {
    const withoutAnswers = new Question("No answers", "QA");
    const withBody = makeQuestion("Has body", 1, 0, "QB");
    const result = utils.mergeBrokenQuestions([withoutAnswers, withBody]);
    assert.equal(result.length, 1);
    assert.equal(result[0].body, "No answers\n\nHas body");
    assert.equal(result[0].answers.length, 1);
  });

  test("merges questions that lack body into previous", () => {
    const valid = makeQuestion("Valid", 1, 0, "QC");
    const noBody = makeQuestion("", 2, 0, "QD");
    const result = utils.mergeBrokenQuestions([valid, noBody]);
    assert.equal(result.length, 1);
    assert.equal(result[0].body, "Valid");
    assert.equal(result[0].answers.length, 3);
  });

  test("logs when merging occurs", () => {
    const log: string[] = [];
    const withoutAnswers = new Question("No answers", "QE");
    const withBody = makeQuestion("Has body", 1, 0, "QF");
    utils.mergeBrokenQuestions([withoutAnswers, withBody], message => log.push(message));
    assert.ok(log.length >= 1);
    assert.ok(log[0].toLowerCase().includes("merged"));
  });
});

describe("QuestionParsingUtils.removeInvalidQuestions", () => {
  test("keeps valid questions", () => {
    const log: string[] = [];
    const questions = [makeQuestion("Valid 1"), makeQuestion("Valid 2"), makeQuestion("Valid 3")];
    const result = utils.removeInvalidQuestions(questions, message => log.push(message));
    assert.equal(result.length, 3);
    assert.deepEqual(log, []);
  });

  test("removes questions without body", () => {
    const log: string[] = [];
    const questions = [makeQuestion(""), makeQuestion("Valid")];
    const result = utils.removeInvalidQuestions(questions, message => log.push(message));
    assert.equal(result.length, 1);
    assert.equal(log.length, 1);
  });

  test("removes questions with insufficient answers", () => {
    const log: string[] = [];
    const singleAnswer = makeQuestion("Single", 1, 0);
    const result = utils.removeInvalidQuestions([singleAnswer], message => log.push(message));
    assert.equal(result.length, 0);
    assert.equal(log.length, 1);
  });

  test("removes questions with no correct answers", () => {
    const log: string[] = [];
    const noneCorrect = makeQuestion("No correct", 2, -1);
    noneCorrect.answers.forEach(answer => (answer.correct = false));
    const result = utils.removeInvalidQuestions([noneCorrect], message => log.push(message));
    assert.equal(result.length, 0);
    assert.equal(log.length, 1);
  });

  test("does not affect valid questions around invalid ones", () => {
    const log: string[] = [];
    const valid = makeQuestion("Valid");
    const invalid = makeQuestion("Invalid", 1, 0);
    const questions = [valid, invalid, valid];
    const result = utils.removeInvalidQuestions(questions, message => log.push(message));
    assert.equal(result.length, 2);
    assert.equal(result[0].body, "Valid");
    assert.equal(result[1].body, "Valid");
    assert.equal(log.length, 1);
  });
});

describe("QuestionParsingUtils.matchNonEmptyStrings", () => {
  test("matches only non-empty strings", () => {
    assert.equal(utils.matchNonEmptyStrings(""), false);
    assert.equal(utils.matchNonEmptyStrings(" \n"), false);
    assert.equal(utils.matchNonEmptyStrings("a"), true);
  });
});

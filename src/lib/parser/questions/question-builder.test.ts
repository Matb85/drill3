import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { QuestionBuilder } from "./question-builder";
import { validateAnswer, validateAnswers } from "./test-utils";

const randomIdPattern = /^Q[0-9a-z]{6}$/i;

describe("QuestionBuilder", () => {
  test("creates questions with body only", () => {
    const builder = new QuestionBuilder();
    builder.appendToBody("Hello world");
    const question = builder.build();
    assert.equal(question.body, "Hello world");
    assert.ok(question.id);
    assert.match(question.id, randomIdPattern);
    assert.equal(question.answers.length, 0);
  });

  test("merges multiple body chunks with blank lines", () => {
    const builder = new QuestionBuilder();
    builder.appendToBody("Hello\n\nworld");
    builder.appendToBody("Hiya");
    const question = builder.build();
    assert.equal(question.body, "Hello\n\nworld\n\nHiya");
  });

  test("respects explicit identifiers", () => {
    const builder = new QuestionBuilder();
    builder.appendToBody("Hello world");
    builder.setIdentifier("id");
    const question = builder.build();
    assert.equal(question.body, "Hello world");
    assert.equal(question.id, "id");
  });

  test("does not allow setting identifier twice", () => {
    const builder = new QuestionBuilder();
    builder.setIdentifier("id1");
    assert.throws(() => builder.setIdentifier("id2"));
  });

  test("throws when appending body after answers started", () => {
    const builder = new QuestionBuilder();
    builder.addAnswer("First", true, "a");
    assert.throws(() => builder.appendToBody("late body"));
  });

  test("builds question with answers", () => {
    const builder = new QuestionBuilder();
    builder.appendToBody("Hello world");
    builder.addAnswer("First answer", true, "a");
    builder.addAnswer("Second answer", false, "b");
    const question = builder.build();
    assert.equal(question.body, "Hello world");
    assert.equal(question.answers.length, 2);
    validateAnswer(question.answers[0], { id: "a", body: "First answer", correct: true });
    validateAnswer(question.answers[1], { id: "b", body: "Second answer", correct: false });
  });

  test("allows questions with no correct answers", () => {
    const builder = new QuestionBuilder();
    builder.addAnswer("First answer", false, "a");
    builder.addAnswer("Second answer", false, "b");
    const question = builder.build();
    assert.equal(question.answers.length, 2);
    assert.equal(question.totalCorrect(), 0);
  });

  test("supports multi-line answers", () => {
    const builder = new QuestionBuilder();
    builder.addAnswer("First line", true, "Z");
    builder.appendAnswerLine("Second line");
    const question = builder.build();
    assert.equal(question.answers.length, 1);
    validateAnswer(question.answers[0], { id: "Z", body: "First line\nSecond line", correct: true });
  });

  test("supports multiple multi-line answers", () => {
    const builder = new QuestionBuilder();
    builder.addAnswer("First line", true, "Z");
    builder.appendAnswerLine("Second line");
    builder.addAnswer("Line 2.1", false, "Y");
    builder.appendAnswerLine("Line 2.2");
    const question = builder.build();
    assert.equal(question.answers.length, 2);
    validateAnswer(question.answers[0], { id: "Z", body: "First line\nSecond line", correct: true });
    validateAnswer(question.answers[1], { id: "Y", body: "Line 2.1\nLine 2.2", correct: false });
  });

  test("throws when appending answer line before creating an answer", () => {
    const builder = new QuestionBuilder();
    assert.throws(() => builder.appendAnswerLine("no answer yet"));
  });

  test("adds multiple answers at once", () => {
    const builder = new QuestionBuilder();
    builder.addAnswers([
      { body: "answer 1", correct: true, id: "a" },
      { body: "answer 2", correct: false, id: "b" },
    ]);
    const question = builder.build();
    validateAnswers(question.answers, [
      { id: "a", body: "answer 1", correct: true },
      { id: "b", body: "answer 2", correct: false },
    ]);
  });

  test("supports chained calls", () => {
    const question = new QuestionBuilder()
      .appendToBody("body")
      .setIdentifier("id")
      .addAnswer("answer", true, "X")
      .appendAnswerLine("line 2")
      .addAnswers([
        { body: "answer 1", correct: true, id: "a" },
        { body: "answer 2", correct: false, id: "b" },
      ])
      .build();
    assert.equal(question.id, "id");
    assert.equal(question.answers.length, 3);
  });

  test("instances are independent", () => {
    const builder1 = new QuestionBuilder();
    const builder2 = new QuestionBuilder();
    builder1.appendToBody("one");
    assert.equal(builder1.build().body, "one");
    assert.equal(builder2.build().body, "");
  });
});

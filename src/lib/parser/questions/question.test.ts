import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { Question } from "./question";

describe("Question", () => {
  test("adds answers with default identifiers", () => {
    const question = new Question("Body", "Q1");
    question.addAnswer("First answer", true);
    question.addAnswer("Second answer", false);
    assert.equal(question.answers.length, 2);
    assert.deepEqual(question.answers[0], { id: "A1", body: "First answer", correct: true });
    assert.deepEqual(question.answers[1], { id: "A2", body: "Second answer", correct: false });
  });

  test("trims answer bodies and respects custom identifiers", () => {
    const question = new Question("Body", "Q2");
    question.addAnswer("  trimmed  ", false, "z");
    assert.deepEqual(question.answers[0], { id: "z", body: "trimmed", correct: false });
  });

  test("counts correct answers", () => {
    const question = new Question("Body", "Q4");
    question.addAnswer("First", true, "a");
    question.addAnswer("Second", false, "b");
    assert.equal(question.totalCorrect(), 1);
    question.addAnswer("Third", true, "c");
    assert.equal(question.totalCorrect(), 2);
  });

  test("stores explanations and related links", () => {
    const question = new Question("Body", "Q5");
    question.setExplanation("Reason");
    question.setRelatedLinks(["link1", "link2"]);
    assert.equal(question.explanation, "Reason");
    assert.deepEqual(question.relatedLinks, ["link1", "link2"]);
  });
});

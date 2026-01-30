import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { QuestionMerger } from "./question-merger";
import { QuestionBuilder } from "./question-builder";

describe("QuestionMerger", () => {
  const createQuestion = (id: string, body: string) =>
    new QuestionBuilder()
      .setIdentifier(id)
      .appendToBody(body)
      .addAnswer("answer 1", true, "x")
      .addAnswer("answer 2", false, "y")
      .build();

  test("merges questions using the first identifier", () => {
    const q1 = createQuestion("one", "first");
    const q2 = createQuestion("two", "second");
    const merged = new QuestionMerger().merge(q1, q2);

    assert.equal(merged.id, q1.id);
    assert.equal(merged.body, `${q1.body}\n\n${q2.body}`);
    assert.equal(merged.answers.length, 4);
    assert.deepEqual(merged.answers.slice(0, 2), q1.answers);
    assert.deepEqual(merged.answers.slice(2), q2.answers);
  });

  test("skips empty bodies when merging", () => {
    const q1 = createQuestion("one", "first");
    const q2 = new QuestionBuilder()
      .setIdentifier("two")
      .addAnswer("answer 3", true, "a")
      .addAnswer("answer 4", false, "b")
      .build();
    const merged = new QuestionMerger().merge(q1, q2);

    assert.equal(merged.body, q1.body);
    assert.equal(merged.answers.length, 4);
  });

  test("preserves auto-generated identifier from first question", () => {
    const q1 = new QuestionBuilder().addAnswer("answer", true, "a").build();
    const q2 = createQuestion("two", "second");
    const merged = new QuestionMerger().merge(q1, q2);

    assert.equal(merged.id, q1.id);
    assert.equal(merged.answers.length, 3);
  });
});

import assert from "node:assert/strict";
import { Answer } from "./question";

export function validateAnswers(orgs: Answer[], bs: Answer[]) {
  orgs.forEach((org, index) => {
    const b = bs[index];
    assert.equal(org.id.startsWith(b.id), true);
    assert.equal(org.body, b.body);
    assert.equal(org.correct, b.correct);
  });
}

export function validateAnswer(org: Answer, b: Answer) {
  assert.equal(org.id.startsWith(b.id), true);
  assert.equal(org.body, b.body);
  assert.equal(org.correct, b.correct);
}

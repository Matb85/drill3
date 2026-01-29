import { Question } from "./question";
import { QuestionBuilder } from "./question-builder";

export class QuestionMerger {
  merge(q1: Question, q2: Question): Question {
    const builder = new QuestionBuilder().setIdentifier(q1.id);

    if (q1.body.trim().length > 0) builder.appendToBody(q1.body);
    if (q2.body.trim().length > 0) builder.appendToBody(q2.body);

    return builder.addAnswers(q1.answers).addAnswers(q2.answers).build();
  }
}

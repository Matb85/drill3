import { Question } from "./question";

export class QuestionBuilder {
  private identifier: string | null = null;
  private bodyLines: string[] = [];
  private question: Question | null = null;
  private answer = { lines: [] as string[], correct: false, identifier: null as string | null };

  setIdentifier(identifier: string) {
    if (this.identifier) {
      throw new Error("Identifier already set");
    }
    this.identifier = identifier;
    return this;
  }

  appendToBody(line: string) {
    if (this.question) {
      throw new Error("Answers already appended");
    }
    this.bodyLines.push(line);
    return this;
  }

  private buildQuestion() {
    this.question = new Question(this.bodyLines.join("\n\n"), this.identifier || undefined);
  }

  private pushAnswer() {
    if (!this.question) return;
    const answerBody = this.answer.lines.join("\n");
    try {
      this.question.addAnswer(answerBody, this.answer.correct, this.answer.identifier || undefined);
    } catch (e) {
      this.answer.lines = [];
      throw e;
    }
    this.answer.lines = [];
  }

  addAnswer(line: string, correct: boolean, identifier: string) {
    if (!this.question) {
      this.buildQuestion();
    } else if (this.answer.lines.length) {
      this.pushAnswer();
    }
    this.answer.lines.push(line.trim());
    this.answer.correct = correct;
    this.answer.identifier = identifier;
    return this;
  }

  addAnswers(answers: { body: string; correct: boolean; id: string }[]) {
    if (!this.question) {
      this.buildQuestion();
    } else if (this.answer.lines.length) {
      this.pushAnswer();
    }
    for (const answer of answers) {
      this.question?.addAnswer(answer.body, answer.correct, answer.id);
    }
    return this;
  }

  appendAnswerLine(line: string) {
    if (!this.answer.lines.length) {
      throw new Error("Answer not created yet");
    }
    this.answer.lines.push(line.trim());
    return this;
  }

  build() {
    if (!this.question) {
      this.buildQuestion();
    } else if (this.answer.lines.length) {
      this.pushAnswer();
    }
    if (!this.question) {
      throw new Error("Failed to build question");
    }
    return this.question;
  }
}

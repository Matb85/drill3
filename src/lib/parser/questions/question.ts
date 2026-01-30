export type Answer = {
  id: string;
  body: string;
  correct: boolean;
  explanation?: string;
};

export class Question {
  readonly answers: Answer[] = [];
  explanation?: string;
  relatedLinks?: string[];

  constructor(
    public body: string,
    public id: string,
  ) {}

  addAnswer(body: string, correct: boolean, identifier?: string) {
    const answerId = identifier || `A${this.answers.length + 1}`;
    if (this.answers.find(ans => ans.id === answerId)) {
      // throw new Error(`Duplicate answer with ID ${answerId}) in question: "${this.body}". Answer IDs must be unique.`);
    }
    this.answers.push({ id: answerId, body: body.trim(), correct });
  }

  totalCorrect() {
    return this.answers.filter(answer => answer.correct).length;
  }

  setExplanation(text: string) {
    this.explanation = text;
  }

  setRelatedLinks(links: string[]) {
    this.relatedLinks = links;
  }
}

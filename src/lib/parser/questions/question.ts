export interface Answer {
  readonly id: string;
  readonly body: string;
  readonly correct: boolean;
}

export type QuestionI = {
  readonly id: string;
  readonly body: string;
  readonly explanation?: string;
  readonly answers: Answer[];
  scoreLog?: { score: number; total: number; timeLeft: number }[];
  timeLeft?: number;
};

function getRandomId() {
  return Math.random().toString(36).slice(2, 8);
}

export class Question {
  readonly id: string;
  readonly body: string;
  readonly answers: Answer[] = [];
  explanation?: string;
  relatedLinks?: string[];

  constructor(body: string, id = `Q${getRandomId()}`) {
    this.id = id;
    this.body = body;
  }

  addAnswer(body: string, correct: boolean, identifier?: string) {
    const answerId = identifier || `A${this.answers.length + 1}`;
    if (this.answers.find(ans => ans.id === answerId)) {
      // throw new Error(`Duplicate answer with ID ${answerId}) in question: "${this.body}". Answer IDs must be unique.`);
    }
    this.answers.push({ id: answerId + getRandomId(), body: body.trim(), correct });
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

  toStaticQuestion(): QuestionI {
    return {
      id: this.id,
      body: this.body,
      explanation: this.explanation,
      answers: this.answers,
    };
  }
}

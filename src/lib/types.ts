export type QuizOption = {
  id: string;
  text: string;
  correct: boolean;
  explanation?: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: QuizOption[];
};

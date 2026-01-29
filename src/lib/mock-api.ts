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

const mockQuestions: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "International finance primarily examines...",
    options: [
      { id: "q1a", text: "Domestic fiscal policy", correct: false },
      { id: "q1b", text: "Income distribution within countries", correct: false },
      { id: "q1c", text: "Financial interactions across national borders", correct: true },
      { id: "q1d", text: "Central bank hiring practices", correct: false },
    ],
  },
  {
    id: "q2",
    prompt: "Why might countries impose capital controls?",
    options: [
      { id: "q2a", text: "Protect domestic financial stability", correct: true },
      { id: "q2b", text: "Improve short-term exchange rate predictability", correct: true },
      { id: "q2c", text: "Increase immigration flows", correct: false },
      { id: "q2d", text: "Signal compliance with trade agreements", correct: false },
    ],
  },
  {
    id: "q3",
    prompt: "A widening current account deficit typically indicates...",
    options: [
      { id: "q3a", text: "Exports exceed imports", correct: false },
      { id: "q3b", text: "Imports exceed exports", correct: true },
      { id: "q3c", text: "Balanced capital inflows and outflows", correct: false },
      { id: "q3d", text: "A fixed exchange rate regime", correct: false },
    ],
  },
  {
    id: "q4",
    prompt: "Select the statements that describe floating exchange rates.",
    options: [
      { id: "q4a", text: "Currency value is set by market supply and demand", correct: true },
      { id: "q4b", text: "Central banks mechanically peg to another currency", correct: false },
      { id: "q4c", text: "They can absorb external shocks through depreciation", correct: true },
      { id: "q4d", text: "They eliminate all exchange rate volatility", correct: false },
    ],
  },
  {
    id: "q5",
    prompt: "Which tools are commonly used to defend a currency peg?",

    options: [
      { id: "q5a", text: "Selling foreign reserves", correct: true },
      { id: "q5b", text: "Changing domestic interest rates", correct: true },
      { id: "q5c", text: "Imposing capital flow measures", correct: true },
      { id: "q5d", text: "Publishing more GDP reports", correct: false },
    ],
  },
  {
    id: "q6",
    prompt: "Covered interest parity is expected to hold when...",

    options: [
      { id: "q6a", text: "Capital controls fully block arbitrage", correct: false },
      { id: "q6b", text: "Forward and spot rates offset rate differentials", correct: true },
      { id: "q6c", text: "Investors are extremely risk averse", correct: false },
      { id: "q6d", text: "Inflation expectations are zero", correct: false },
    ],
  },
];

function delay(ms = 320) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cloneQuestions() {
  return structuredClone(mockQuestions);
}

export const mockQuestionApi = {
  async loadFromFile(_: File | null) {
    await delay();
    return cloneQuestions();
  },
  async loadFromText(_: string) {
    await delay();
    return cloneQuestions();
  },
  async loadSample() {
    await delay();
    return cloneQuestions();
  },
};

import { useEffect, useRef, useState } from "react";

import { type QuizQuestion } from "@/lib/types";

export type Stage = "idle" | "ready" | "testing" | "done" | "loading";
export type ScoringMode = "per-question" | "per-answer";
export type PenaltyMode = "counterbalance" | "zeroes";

type TestConfig = {
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  scoring: ScoringMode;
  penalty: PenaltyMode;
  timePerQuestion: number;
};

type QuestionResult = {
  questionId: string;
  selected: string[];
  isCorrect: boolean;
  partial: boolean;
  score: number;
};

type QuizStoreState = {
  status: Stage;
  config: TestConfig;
  questions: QuizQuestion[];
  activeQuestions: QuizQuestion[];
  selectedOptions: Record<string, string[]>;
  results: QuestionResult[];
  currentIndex: number;
  fileName: string | null;
  pastedText: string;
  logs: string[];
};

type Listener = () => void;

const defaultConfig: TestConfig = {
  shuffleQuestions: true,
  shuffleAnswers: true,
  scoring: "per-answer",
  penalty: "counterbalance",
  timePerQuestion: 60,
};

const STORAGE_KEY = "quiz-store-26-01-30";

const initialState: QuizStoreState = {
  status: "idle",
  config: defaultConfig,
  questions: [],
  activeQuestions: [],
  selectedOptions: {},
  results: [],
  currentIndex: 0,
  fileName: null,
  pastedText: "",
  logs: [],
};

function delay(ms = 320) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function parseQuestions(text: string) {
  await delay();
  return await import("@/lib/parser").then(mod => mod.parseQuestionsFromText(text));
}
async function loadSample() {
  await delay();
  const questions = await import("@/lib/mock-questions.json").then(mod => mod.default);
  return { questions: structuredClone(questions), log: [] };
}

let state: QuizStoreState = initialState;
const listeners = new Set<Listener>();

function readFromStorage(): QuizStoreState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QuizStoreState) : null;
  } catch (error) {
    console.warn("Failed to read quiz store", error);
    return null;
  }
}

function writeToStorage(snapshot: QuizStoreState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn("Failed to persist quiz store", error);
  }
}

// hydrate state eagerly in browser
if (typeof window !== "undefined") {
  const stored = readFromStorage();
  if (stored) {
    state = {
      ...initialState,
      ...stored,
      config: { ...initialState.config, ...stored.config },
      logs: stored.logs ?? [],
    };
  }
}

function setState(next: QuizStoreState | ((prev: QuizStoreState) => QuizStoreState)) {
  state = typeof next === "function" ? (next as (prev: QuizStoreState) => QuizStoreState)(state) : next;
  writeToStorage(state);
  listeners.forEach(listener => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

function shuffleArray<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function prepareQuestions(list: QuizQuestion[], config: TestConfig) {
  const base = config.shuffleQuestions ? shuffleArray(list) : [...list];
  if (!config.shuffleAnswers) return base;
  return base.map(question => ({
    ...question,
    options: shuffleArray(question.options),
  }));
}

function computeResult(question: QuizQuestion, selected: string[], config: TestConfig): QuestionResult {
  const correctIds = question.options.filter(option => option.correct).map(option => option.id);
  const good = selected.filter(id => correctIds.includes(id)).length;
  const bad = selected.filter(id => !correctIds.includes(id)).length;
  const missed = correctIds.length - good;
  const isCorrect = bad === 0 && missed === 0 && selected.length > 0;
  const partial = !isCorrect && good > 0 && bad === 0;

  let score = 0;
  if (config.scoring === "per-question") {
    if (isCorrect) {
      score = 1;
    } else if (config.penalty === "counterbalance") {
      score = Math.max(0, (good - bad) / Math.max(correctIds.length, 1));
    }
  } else {
    score = Math.max(0, good - (config.penalty === "counterbalance" ? bad : 0)) / Math.max(correctIds.length, 1);
  }

  return { questionId: question.id, selected, isCorrect, partial, score };
}

export const quizStore = {
  getState: () => state,
  useStore<Selected>(selector: (state: QuizStoreState) => Selected): Selected {
    const selectorRef = useRef(selector);
    selectorRef.current = selector;

    const [selected, setSelected] = useState(() => selectorRef.current(state));

    useEffect(() => {
      const listener = () => setSelected(selectorRef.current(state));
      listener();
      return subscribe(listener);
    }, []);

    return selected;
  },
  setConfig(partial: Partial<TestConfig>) {
    setState(prev => ({ ...prev, config: { ...prev.config, ...partial } }));
  },
  setPastedText(text: string) {
    setState(prev => ({ ...prev, pastedText: text }));
  },
  reset() {
    setState(initialState);
  },
  restartProgress() {
    setState(prev => ({
      ...prev,
      status: "ready",
      selectedOptions: {},
      results: [],
      currentIndex: 0,
    }));
  },
  async loadFromFile(file: File | null) {
    setState(prev => ({ ...prev, status: "loading", fileName: file?.name ?? null }));
    const { questions, log } = await parseQuestions((await file?.text()) ?? "");
    setState(prev => ({
      ...prev,
      status: "ready",
      questions,
      activeQuestions: [],
      results: [],
      selectedOptions: {},
      currentIndex: 0,
      logs: log,
    }));
    return { questions, log };
  },
  async loadFromText(text: string) {
    setState(prev => ({ ...prev, status: "loading", pastedText: text }));
    const { questions, log } = await parseQuestions(text);
    setState(prev => ({
      ...prev,
      status: "ready",
      questions,
      activeQuestions: [],
      results: [],
      selectedOptions: {},
      currentIndex: 0,
      logs: log,
    }));
    return { questions, log };
  },
  async loadSample() {
    setState(prev => ({ ...prev, status: "loading" }));
    const { questions, log } = await loadSample();
    setState(prev => ({
      ...prev,
      status: "ready",
      questions,
      activeQuestions: [],
      results: [],
      selectedOptions: {},
      currentIndex: 0,
      logs: log,
    }));
    return { questions, log };
  },
  async startTest() {
    setState(prev => ({ ...prev, status: "loading" }));
    if (!state.questions.length) return false;
    const prepared = prepareQuestions(state.questions, state.config);
    setState(prev => ({
      ...prev,
      status: "testing",
      activeQuestions: prepared,
      selectedOptions: {},
      results: [],
      currentIndex: 0,
    }));
    return true;
  },
  toggleOption(question: QuizQuestion, optionId: string) {
    setState(prev => {
      const current = prev.selectedOptions[question.id] ?? [];
      const nextSelection = current.includes(optionId) ? current.filter(id => id !== optionId) : [...current, optionId];

      return { ...prev, selectedOptions: { ...prev.selectedOptions, [question.id]: nextSelection } };
    });
  },
  checkCurrent(question: QuizQuestion) {
    const selected = state.selectedOptions[question.id] ?? [];
    const result = computeResult(question, selected, state.config);
    setState(prev => {
      const filtered = prev.results.filter(item => item.questionId !== question.id);
      return { ...prev, results: [...filtered, result] };
    });
    return result;
  },
  nextQuestion() {
    setState(prev => {
      const isLast = prev.currentIndex + 1 >= prev.activeQuestions.length;
      return {
        ...prev,
        currentIndex: Math.min(prev.currentIndex + 1, Math.max(prev.activeQuestions.length - 1, 0)),
        status: isLast ? "done" : prev.status,
      };
    });
  },
};

export function selectSummary(state: QuizStoreState) {
  const correct = state.results.filter(item => item.isCorrect).length;
  const partial = state.results.filter(item => item.partial && !item.isCorrect).length;
  const incorrect = state.results.length - correct - partial;
  const scorePoints = state.results.reduce((acc, item) => acc + item.score, 0);
  const maxPoints = state.activeQuestions.length || state.results.length || 1;
  const scorePercent = Math.round((scorePoints / Math.max(maxPoints, 1)) * 100);
  return { correct, partial, incorrect, scorePoints, scorePercent };
}

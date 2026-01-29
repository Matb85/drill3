"use client";

import { type ReactNode, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  FileText,
  Loader2,
  Play,
  RefreshCw,
  Shuffle,
  Sparkles,
  UploadCloud,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { mockQuestionApi, type QuizQuestion } from "@/lib/mock-api";
import { cn } from "@/lib/utils";

type Stage = "prep" | "testing" | "summary";
type ScoringMode = "per-question" | "per-answer";
type PenaltyMode = "counterbalance" | "zeroes";

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

const defaultConfig: TestConfig = {
  shuffleQuestions: true,
  shuffleAnswers: true,
  scoring: "per-answer",
  penalty: "counterbalance",
  timePerQuestion: 60,
};

function shuffleArray<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pastedQuestions, setPastedQuestions] = useState("");
  const [stage, setStage] = useState<Stage>("prep");
  const [config, setConfig] = useState<TestConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentQuestion = activeQuestions[currentIndex];

  const resultMap = useMemo(() => Object.fromEntries(results.map(item => [item.questionId, item])), [results]);

  const answeredCount = useMemo(() => results.length, [results]);

  const summary = useMemo(() => {
    const correct = results.filter(item => item.isCorrect).length;
    const partial = results.filter(item => item.partial && !item.isCorrect).length;
    const incorrect = results.length - correct - partial;
    const scorePoints = results.reduce((acc, item) => acc + item.score, 0);
    const maxPoints = activeQuestions.length || results.length || 1;
    const scorePercent = Math.round((scorePoints / Math.max(maxPoints, 1)) * 100);
    return { correct, partial, incorrect, scorePoints, scorePercent };
  }, [activeQuestions.length, results]);

  async function hydrateQuestions(source: "sample" | "file" | "text", file?: File | null) {
    setLoading(true);
    try {
      let loaded: QuizQuestion[] = [];
      if (source === "file") {
        loaded = await mockQuestionApi.loadFromFile(file ?? null);
      } else if (source === "text") {
        loaded = await mockQuestionApi.loadFromText(pastedQuestions);
      } else {
        loaded = await mockQuestionApi.loadSample();
      }

      setQuestions(loaded);
      setStage("prep");
      setResults([]);
      setSelectedOptions({});
      setCurrentIndex(0);
    } finally {
      setLoading(false);
    }
  }

  async function ensureQuestionsReady() {
    if (questions.length) return questions;
    const loaded = await mockQuestionApi.loadSample();
    setQuestions(loaded);
    return loaded;
  }

  function prepareQuestions(list: QuizQuestion[]) {
    const base = config.shuffleQuestions ? shuffleArray(list) : [...list];
    if (!config.shuffleAnswers) return base;
    return base.map(question => ({
      ...question,
      options: shuffleArray(question.options),
    }));
  }

  async function startTest() {
    setLoading(true);
    try {
      const base = await ensureQuestionsReady();
      const prepared = prepareQuestions(base);
      setActiveQuestions(prepared);
      setStage("testing");
      setResults([]);
      setSelectedOptions({});
      setCurrentIndex(0);
    } finally {
      setLoading(false);
    }
  }

  function toggleOption(question: QuizQuestion, optionId: string) {
    setSelectedOptions(prev => {
      const current = prev[question.id] ?? [];
      const nextSelection =
        question.type === "single"
          ? [optionId]
          : current.includes(optionId)
            ? current.filter(id => id !== optionId)
            : [...current, optionId];

      return { ...prev, [question.id]: nextSelection };
    });
  }

  function checkCurrentQuestion() {
    if (!currentQuestion) return;
    const selected = selectedOptions[currentQuestion.id] ?? [];
    const correctIds = currentQuestion.options.filter(option => option.correct).map(option => option.id);
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

    setResults(prev => {
      const filtered = prev.filter(item => item.questionId !== currentQuestion.id);
      return [...filtered, { questionId: currentQuestion.id, selected, isCorrect, partial, score }];
    });
  }

  function goToNextQuestion() {
    if (currentIndex + 1 >= activeQuestions.length) {
      setStage("summary");
      return;
    }
    setCurrentIndex(index => index + 1);
  }

  function restart() {
    setStage("prep");
    setResults([]);
    setSelectedOptions({});
    setActiveQuestions([]);
    setCurrentIndex(0);
  }

  const currentResult = currentQuestion ? resultMap[currentQuestion.id] : undefined;
  const progress = activeQuestions.length ? Math.round((answeredCount / activeQuestions.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 pt-10 sm:px-8 lg:px-10">
        <Card className="overflow-hidden border-slate-800 bg-gradient-to-r from-indigo-950/60 via-slate-900/60 to-slate-950/70 text-white shadow-2xl">
          <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-indigo-200/90">
                <CircleDot className="size-4" /> Drill Companion
              </div>
              <CardTitle className="text-3xl font-semibold leading-tight sm:text-4xl">
                Multiple choice learning assistant
              </CardTitle>
              <CardDescription className="text-indigo-100/90 text-base">
                Load questions, configure scoring, practice at your pace, and finish with a clear summary.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-indigo-50 backdrop-blur">
              <Sparkles className="size-5 text-amber-300" />
              <div>
                <p className="text-xs uppercase tracking-wide text-indigo-100/80">Stage</p>
                <p className="text-sm font-semibold">
                  {stage === "prep" && "Setup"}
                  {stage === "testing" && "In progress"}
                  {stage === "summary" && "Summary"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardFooter className="flex flex-wrap gap-4 border-t border-white/10 bg-white/5 px-6 py-4 text-sm text-indigo-100/80">
            <div className="flex items-center gap-2">
              <Shuffle className="size-4" />
              {config.shuffleQuestions ? "Questions shuffled" : "Original order"}
            </div>
            <div className="flex items-center gap-2">
              <Clock3 className="size-4" />
              {config.timePerQuestion} s per question
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4" />
              {questions.length || "No"} questions loaded
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="size-4" />
              {config.scoring === "per-question" ? "Per question scoring" : "Per answer scoring"}
            </div>
          </CardFooter>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-slate-800 bg-slate-900/60 shadow-2xl shadow-slate-900/40">
            <CardHeader className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <UploadCloud className="size-5 text-indigo-300" /> Load questions
              </CardTitle>
              <CardDescription className="text-slate-300">
                Use a file or paste plain text. Parsing is mocked for now—preview the flow and visuals.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
                  <p className="text-sm text-slate-200">Upload a file</p>
                  <p className="text-xs text-slate-400">We mock the response while keeping your UX intact.</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
                      Select file
                    </Button>
                    {fileName && (
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">{fileName}</span>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={event => {
                        const file = event.target.files?.[0];
                        setFileName(file?.name ?? null);
                        void hydrateQuestions("file", file ?? null);
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
                  <p className="text-sm text-slate-200">Or paste questions</p>
                  <p className="text-xs text-slate-400">We return structured mock data—parsing comes later.</p>
                  <Textarea
                    rows={4}
                    value={pastedQuestions}
                    onChange={event => setPastedQuestions(event.target.value)}
                    placeholder="Paste your question bank..."
                    className="mt-3 bg-slate-900/60"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={loading}
                      onClick={() => void hydrateQuestions("text")}
                      className="gap-2"
                    >
                      {loading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                      Use pasted text
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPastedQuestions("")}
                      className="text-slate-300 hover:text-white"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-800" />

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 border-indigo-500/70 text-indigo-100 hover:bg-indigo-500/10"
                  disabled={loading}
                  onClick={() => void hydrateQuestions("sample")}
                >
                  <Wand2 className="size-4" />
                  Load mock sample
                </Button>
                <span className="text-xs text-slate-300">
                  {questions.length ? `${questions.length} questions ready` : "No questions loaded yet"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 shadow-xl">
            <CardHeader className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <SettingsBadge /> Test configuration
              </CardTitle>
              <CardDescription className="text-slate-300">
                Adjust shuffling, scoring, and pacing before you begin.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <FieldSet>
                <FieldLegend>Shuffling</FieldLegend>
                <FieldGroup>
                  <Field orientation="responsive">
                    <FieldLabel>
                      <Checkbox
                        checked={config.shuffleQuestions}
                        onCheckedChange={checked =>
                          setConfig(prev => ({ ...prev, shuffleQuestions: Boolean(checked) }))
                        }
                      />
                      <FieldTitle>Shuffle questions</FieldTitle>
                    </FieldLabel>
                    <FieldContent>
                      <FieldDescription>Randomize order each time.</FieldDescription>
                    </FieldContent>
                  </Field>
                  <Field orientation="responsive">
                    <FieldLabel>
                      <Checkbox
                        checked={config.shuffleAnswers}
                        onCheckedChange={checked => setConfig(prev => ({ ...prev, shuffleAnswers: Boolean(checked) }))}
                      />
                      <FieldTitle>Shuffle answers</FieldTitle>
                    </FieldLabel>
                    <FieldContent>
                      <FieldDescription>Keep students honest with fresh option order.</FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldGroup>
              </FieldSet>

              <FieldSeparator>Scoring</FieldSeparator>

              <FieldSet>
                <FieldGroup>
                  <Field orientation="vertical">
                    <FieldLabel className="!flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                      <div className="flex items-center gap-2">
                        <RadioGroup
                          value={config.scoring}
                          onValueChange={(value: ScoringMode) => setConfig(prev => ({ ...prev, scoring: value }))}
                          className="grid gap-3"
                        >
                          <Label className="flex items-center gap-2">
                            <RadioGroupItem value="per-question" id="scoring-question" />
                            Per question (1 pt if perfect)
                          </Label>
                          <Label className="flex items-center gap-2">
                            <RadioGroupItem value="per-answer" id="scoring-answer" />
                            Per answer (partials allowed)
                          </Label>
                        </RadioGroup>
                      </div>
                      <FieldDescription>Partial credit is supported when you pick "Per answer".</FieldDescription>
                    </FieldLabel>
                  </Field>
                </FieldGroup>
              </FieldSet>

              <FieldSeparator>Penalties</FieldSeparator>

              <FieldSet>
                <FieldGroup>
                  <Field orientation="vertical">
                    <RadioGroup
                      value={config.penalty}
                      onValueChange={(value: PenaltyMode) => setConfig(prev => ({ ...prev, penalty: value }))}
                      className="grid gap-3"
                    >
                      <Label className="flex items-center gap-2">
                        <RadioGroupItem value="counterbalance" id="penalty-counter" />
                        Wrong answers subtract from correct ones
                      </Label>
                      <Label className="flex items-center gap-2">
                        <RadioGroupItem value="zeroes" id="penalty-zero" />
                        One wrong zeros the question
                      </Label>
                    </RadioGroup>
                  </Field>
                </FieldGroup>
              </FieldSet>

              <FieldSeparator>Timing</FieldSeparator>

              <FieldSet>
                <FieldGroup>
                  <Field orientation="horizontal" className="items-center">
                    <FieldLabel className="gap-3">
                      <Clock3 className="size-4 text-indigo-300" />
                      <FieldTitle>Time per question</FieldTitle>
                    </FieldLabel>
                    <FieldContent>
                      <input
                        type="number"
                        min={15}
                        max={300}
                        value={config.timePerQuestion}
                        onChange={event =>
                          setConfig(prev => ({
                            ...prev,
                            timePerQuestion: Number(event.target.value) || prev.timePerQuestion,
                          }))
                        }
                        className="w-24 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-white shadow-inner"
                      />
                      <FieldDescription>Guidance only; no hard timer yet.</FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldGroup>
              </FieldSet>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 border-t border-slate-800 bg-slate-950/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-300">
                {questions.length ? `${questions.length} questions loaded` : "Load a set to get started."}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={restart} className="text-slate-200 hover:text-white">
                  Reset
                </Button>
                <Button onClick={() => void startTest()} className="gap-2" disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                  Begin practice
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="border-slate-800 bg-slate-900/70 shadow-2xl shadow-slate-900/50">
            <CardHeader className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <div className="flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-1 text-xs uppercase tracking-wide text-slate-200">
                    {stage === "prep" && "Configure"}
                    {stage === "testing" && `Question ${currentIndex + 1} / ${activeQuestions.length || "-"}`}
                    {stage === "summary" && "Summary"}
                  </div>
                  {stage !== "prep" && activeQuestions.length > 0 && (
                    <span className="text-slate-400">{progress}% complete</span>
                  )}
                </div>
                {stage === "testing" && currentQuestion && (
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Clock3 className="size-4" />~{currentQuestion.estimatedTime ?? config.timePerQuestion}s suggested
                  </div>
                )}
              </div>
              <CardTitle className="text-2xl">
                {stage === "prep" && "Ready when you are"}
                {stage === "testing" && currentQuestion?.prompt}
                {stage === "summary" && "Well done—here is your summary"}
              </CardTitle>
              <CardDescription className="text-slate-300">
                {stage === "prep" && "Start the session to see questions and track your answers."}
                {stage === "testing" && currentQuestion?.category}
                {stage === "summary" && "Scores, correctness, and a quick breakdown of your run."}
              </CardDescription>
            </CardHeader>

            {stage === "testing" && currentQuestion && (
              <CardContent className="flex flex-col gap-6">
                <div className="grid gap-3">
                  {currentQuestion.options.map(option => {
                    const selected = selectedOptions[currentQuestion.id]?.includes(option.id);
                    const result = resultMap[currentQuestion.id];
                    const isCorrectChoice = option.correct;
                    const shouldReveal = Boolean(result);
                    const stateClass = shouldReveal
                      ? isCorrectChoice
                        ? "border-emerald-500/60 bg-emerald-500/10"
                        : selected
                          ? "border-rose-500/60 bg-rose-500/10"
                          : "border-slate-800"
                      : "border-slate-800 hover:border-indigo-500/60";

                    const control =
                      currentQuestion.type === "single" ? (
                        <span
                          className={cn(
                            "mt-1 grid size-4 place-content-center rounded-full border border-slate-600",
                            selected && "border-indigo-400 bg-indigo-500/20",
                          )}
                        >
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full bg-indigo-400 transition-opacity",
                              selected ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </span>
                      ) : (
                        <Checkbox checked={selected} readOnly />
                      );

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggleOption(currentQuestion, option.id)}
                        className={cn(
                          "group flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-all",
                          "bg-slate-950/40 hover:bg-slate-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60",
                          stateClass,
                        )}
                      >
                        <div className="mt-1">{control}</div>
                        <div className="flex flex-1 flex-col gap-1">
                          <span className="text-sm font-medium text-slate-100">{option.text}</span>
                          {shouldReveal && option.explanation && (
                            <span className="text-xs text-slate-300">{option.explanation}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                    <CircleDot className="size-4" /> Status
                  </div>
                  {currentResult ? (
                    <p>
                      {currentResult.isCorrect && "Perfect! All correct."}
                      {currentResult.partial && !currentResult.isCorrect && "Good start—some answers still missing."}
                      {!currentResult.isCorrect && !currentResult.partial && "Not quite. Try adjusting your picks."}
                    </p>
                  ) : (
                    <p>Select and check to reveal correctness.</p>
                  )}
                </div>
              </CardContent>
            )}

            {stage === "summary" && (
              <CardContent className="grid gap-5 md:grid-cols-2">
                <SummaryStat label="Correct" value={summary.correct} tone="success" helper="Fully correct responses" />
                <SummaryStat
                  label="Partial"
                  value={summary.partial}
                  tone="warning"
                  helper="At least one correct, none wrong"
                />
                <SummaryStat
                  label="Incorrect"
                  value={summary.incorrect}
                  tone="destructive"
                  helper="Contains wrong picks"
                />
                <SummaryStat
                  label="Score"
                  value={`${summary.scorePercent}%`}
                  tone="info"
                  helper="Scaled by your scoring rules"
                />
              </CardContent>
            )}

            {stage === "prep" && (
              <CardContent className="flex flex-col gap-4">
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-200">
                  Load questions and tap Begin. We will keep the flow responsive while parsing is mocked.
                </div>
              </CardContent>
            )}

            <CardFooter className="flex flex-col gap-3 border-t border-slate-800 bg-slate-950/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-400">
                {stage === "testing" && `${answeredCount}/${activeQuestions.length} checked`}
                {stage === "summary" && "Session complete"}
                {stage === "prep" && "Waiting to start"}
              </div>
              <div className="flex flex-wrap gap-2">
                {stage === "testing" && (
                  <>
                    <Button
                      variant="secondary"
                      className="gap-2"
                      onClick={checkCurrentQuestion}
                      disabled={loading || !currentQuestion}
                    >
                      <CheckCircle2 className="size-4" /> Check answer
                    </Button>
                    <Button
                      variant="default"
                      className="gap-2"
                      onClick={goToNextQuestion}
                      disabled={!resultMap[currentQuestion?.id ?? ""]}
                    >
                      {currentIndex + 1 >= activeQuestions.length ? "Finish" : "Next"}
                      <ArrowRight className="size-4" />
                    </Button>
                  </>
                )}
                {stage === "summary" && (
                  <Button variant="secondary" className="gap-2" onClick={restart}>
                    <RefreshCw className="size-4" />
                    Restart setup
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 shadow-xl">
            <CardHeader className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="size-4 text-amber-300" /> Quick cues
              </CardTitle>
              <CardDescription className="text-slate-300">Little helpers while you test.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-slate-200">
              <HintRow
                icon={<Shuffle className="size-4" />}
                title="Shuffle ready"
                body="Toggles above control randomness for questions and answers."
              />
              <HintRow
                icon={<Clock3 className="size-4" />}
                title="Time guidance"
                body="Use the time per question field to pace yourself."
              />
              <HintRow
                icon={<CheckCircle2 className="size-4" />}
                title="Partial credit"
                body="Per-answer scoring rewards correct picks even on multi-select."
              />
              <HintRow
                icon={<FileText className="size-4" />}
                title="Mock API"
                body="We return curated mock data until parsing is implemented."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
  helper,
}: {
  label: string;
  value: string | number;
  tone: "success" | "warning" | "destructive" | "info";
  helper: string;
}) {
  const color = {
    success: "text-emerald-300",
    warning: "text-amber-300",
    destructive: "text-rose-300",
    info: "text-indigo-200",
  }[tone];

  const bg = {
    success: "bg-emerald-500/10 border-emerald-500/40",
    warning: "bg-amber-500/10 border-amber-500/40",
    destructive: "bg-rose-500/10 border-rose-500/40",
    info: "bg-indigo-500/10 border-indigo-500/40",
  }[tone];

  return (
    <div className={cn("rounded-lg border p-4", bg)}>
      <p className="text-xs uppercase tracking-wide text-slate-300">{label}</p>
      <p className={cn("text-3xl font-semibold", color)}>{value}</p>
      <p className="text-sm text-slate-200">{helper}</p>
    </div>
  );
}

function HintRow({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
      <div className="mt-0.5 text-indigo-200">{icon}</div>
      <div className="flex flex-col gap-1">
        <p className="font-medium text-slate-100">{title}</p>
        <p className="text-sm text-slate-300">{body}</p>
      </div>
    </div>
  );
}

function SettingsBadge() {
  return (
    <div className="flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-200">
      <Wand2 className="size-4" />
      Setup
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Clock3, Frown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { quizStore } from "@/lib/quiz-store";
import { cn } from "@/lib/utils";

export default function Test() {
  const router = useRouter();

  const { status, activeQuestions, currentIndex, selectedOptions, results, config } = quizStore.useStore(state => ({
    status: state.status,
    activeQuestions: state.activeQuestions,
    currentIndex: state.currentIndex,
    selectedOptions: state.selectedOptions,
    results: state.results,
    config: state.config,
  }));

  const question = activeQuestions[currentIndex];
  const resultMap = Object.fromEntries(results.map(item => [item.questionId, item]));
  const loading = status === "loading";
  const progress = activeQuestions.length ? Math.round(((currentIndex + 1) / activeQuestions.length) * 100) : 0;

  useEffect(() => {
    if (status === "done") {
      router.push("/summary");
    }
  }, [router, status]);

  if (!activeQuestions.length || !question) {
    return (
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>No test in progress</CardTitle>
          <CardDescription>Load questions and start from the welcome screen.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push("/")}>Back to welcome</Button>
        </CardFooter>
      </Card>
    );
  }

  function toggle(optionId: string) {
    quizStore.toggleOption(question, optionId);
  }

  function check() {
    quizStore.checkCurrent(question);
  }

  function next() {
    quizStore.nextQuestion();
    if (currentIndex + 1 >= activeQuestions.length) {
      router.push("/summary");
    }
  }

  const currentResult = resultMap[question.id];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-100">
          Question {currentIndex + 1} of {activeQuestions.length}
        </div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Clock3 className="size-4" /> ~{question.estimatedTime ?? config.timePerQuestion}s suggested
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
            {progress}%
          </span>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">{question.prompt}</CardTitle>
          <CardDescription>
            {question.category ?? "Practice set"} · Select all answers you believe are correct.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {question.options.map(option => {
            const selected = selectedOptions[question.id]?.includes(option.id);
            const reveal = Boolean(currentResult);
            const isCorrectChoice = option.correct;
            const stateClass = reveal
              ? isCorrectChoice
                ? "border-emerald-500/60 bg-emerald-50 dark:bg-emerald-500/10"
                : selected
                  ? "border-rose-500/60 bg-rose-50 dark:bg-rose-500/10"
                  : "border-slate-200 dark:border-slate-800"
              : "hover:border-indigo-400";

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggle(option.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                  "bg-white dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                  stateClass,
                )}
              >
                <Checkbox checked={selected} readOnly className="mt-1" />
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{option.text}</span>
                  {reveal && option.explanation && (
                    <span className="text-xs text-slate-600 dark:text-slate-300">{option.explanation}</span>
                  )}
                </div>
              </button>
            );
          })}

          {revealStatus(currentResult)}
        </CardContent>
        <CardFooter className="flex items-center justify-end gap-2">
          {!currentResult && (
            <Button variant="secondary" onClick={check} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Check
            </Button>
          )}
          {currentResult && (
            <Button onClick={next} className="gap-2">
              Next <ArrowRight className="size-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

function revealStatus(result?: { isCorrect: boolean; partial: boolean }) {
  if (!result) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-100">
      {result.isCorrect && <CheckCircle2 className="size-4 text-emerald-500" />}
      {!result.isCorrect && <Frown className="size-4 text-amber-500" />}
      <span>
        {result.isCorrect && "Correct"}
        {!result.isCorrect && result.partial && "Partially correct"}
        {!result.isCorrect && !result.partial && "Incorrect"}
      </span>
    </div>
  );
}

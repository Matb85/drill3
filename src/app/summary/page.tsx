"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Frown, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { quizStore, selectSummary } from "@/lib/quiz-store";
import { cn } from "@/lib/utils";

export default function Summary() {
  const router = useRouter();
  const { activeQuestions, results } = quizStore.useStore(state => ({
    activeQuestions: state.activeQuestions,
    results: state.results,
  }));
  const summary = quizStore.useStore(selectSummary);

  if (!results.length) {
    return (
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>No results yet</CardTitle>
          <CardDescription>Finish a test run to see your summary.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push("/")}>Go to welcome</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Test summary</CardTitle>
          <CardDescription>
            {activeQuestions.length} questions answered. Scores calculated from your chosen rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <SummaryStat label="Correct" value={summary.correct} tone="success" helper="Fully correct" />
          <SummaryStat label="Partial" value={summary.partial} tone="warning" helper="Some correct" />
          <SummaryStat label="Incorrect" value={summary.incorrect} tone="danger" helper="Contains wrong picks" />
          <SummaryStat label="Score" value={`${summary.scorePercent}%`} tone="info" helper="Weighted score" />
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button onClick={() => router.push("/")}>Go home</Button>
          <Button
            variant="secondary"
            className="gap-2"
            onClick={() => {
              quizStore.restartProgress();
              router.push("/test");
            }}
          >
            <RefreshCw className="size-4" /> Restart
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Question outcomes</CardTitle>
          <CardDescription>Full prompts with your picked answers.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          {activeQuestions.map(q => {
            const result = results.find(item => item.questionHash === q.hash);
            const selected = result?.selected ?? [];
            return (
              <div
                key={q.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{q.body}</p>
                  <OutcomePill result={result} />
                </div>
                <div className="mt-3 space-y-2">
                  {q.answers.map(option => {
                    const isSelected = selected.includes(option.id);
                    const isCorrect = option.correct;
                    const tone = isCorrect
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100"
                      : isSelected
                        ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-900/40 dark:text-rose-100"
                        : "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-100";

                    return (
                      <div key={option.id} className={cn("flex items-start gap-2 rounded-md border px-3 py-2", tone)}>
                        <div className="mt-0.5 size-2 rounded-full bg-current flex-none" />
                        <p className="text-sm font-medium">{option.body}</p>
                        {isCorrect && <CheckCircle2 className="size-4 text-emerald-500 flex-none" />}
                        {!isCorrect && isSelected && <Frown className="size-4 text-rose-500 flex-none" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string | number;
  helper: string;
  tone: "success" | "warning" | "danger" | "info";
}) {
  const colors = {
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
    warning:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
    danger: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200",
    info: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200",
  }[tone];

  return (
    <div className={cn("rounded-lg border p-4 shadow-sm", colors)}>
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-semibold">{value}</p>
      <p className="text-sm">{helper}</p>
    </div>
  );
}

function OutcomePill({ result }: { result?: { isCorrect: boolean; partial: boolean } }) {
  if (!result) {
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        Not checked
      </span>
    );
  }
  if (result.isCorrect) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
        <CheckCircle2 className="size-4" /> Correct
      </span>
    );
  }
  if (result.partial) {
    return (
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
        Partial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
      <Frown className="size-4" /> Wrong
    </span>
  );
}

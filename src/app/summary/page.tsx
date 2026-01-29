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
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
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
        <CardFooter className="flex gap-2">
          <Button onClick={() => router.push("/test")}>Review test</Button>
          <Button
            variant="secondary"
            className="gap-2"
            onClick={() => {
              quizStore.reset();
              router.push("/");
            }}
          >
            <RefreshCw className="size-4" /> Restart
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Question outcomes</CardTitle>
          <CardDescription>Quick glance at how each question went.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-slate-200 text-sm dark:divide-slate-800">
          {activeQuestions.map(q => {
            const result = results.find(item => item.questionId === q.id);
            return (
              <div key={q.id} className="flex items-center justify-between py-3">
                <div className="flex-1 pr-4">
                  <p className="font-medium text-slate-800 dark:text-slate-100 line-clamp-2">{q.prompt}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{q.category}</p>
                </div>
                <OutcomePill result={result} />
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

"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3, FileText, Loader2, Shuffle, UploadCloud, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { quizStore, type PenaltyMode, type ScoringMode } from "@/lib/quiz-store";

export default function Home() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { config, status, questions, pastedText } = quizStore.useStore(state => ({
    config: state.config,
    status: state.status,
    questions: state.questions,
    pastedText: state.pastedText,
  }));

  const loading = status === "loading";

  async function handleStart() {
    await quizStore.startTest();
    router.push("/test");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">Welcome</p>
          <h1 className="text-2xl font-semibold tracking-tight">Multiple choice practice assistant</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Load questions, set preferences, then jump into the test flow.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UploadCloud className="size-5 text-indigo-500" /> Load questions
            </CardTitle>
            <CardDescription>Upload a .txt file, paste text, or use the mock sample.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-slate-200 p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <p className="font-medium">Upload a file</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">We will use mock data until parsing ships.</p>
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={event => {
                      const file = event.target.files?.[0] ?? null;
                      void quizStore.loadFromFile(file);
                    }}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <p className="font-medium">Paste questions</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">The API returns a mock set for now.</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={loading}
                    onClick={() => void quizStore.loadFromText(pastedText)}
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                    Load pasted text
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => quizStore.setPastedText("")}>
                    Clear
                  </Button>
                </div>
                <Textarea
                  rows={4}
                  value={pastedText}
                  onChange={event => quizStore.setPastedText(event.target.value)}
                  placeholder="Paste your question bank..."
                  className="mt-3"
                />
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                disabled={loading}
                onClick={() => void quizStore.loadSample()}
              >
                <Wand2 className="size-4" /> Load mock sample
              </Button>
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {questions.length ? `${questions.length} questions ready` : "No questions loaded yet"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shuffle className="size-5 text-indigo-500" /> Test configuration
            </CardTitle>
            <CardDescription>Keep it simple and consistent.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <span className="text-slate-700 dark:text-slate-200">
                {questions.length ? `${questions.length} questions loaded` : "Load questions to begin."}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => quizStore.reset()} disabled={loading}>
                  Reset
                </Button>
                <Button onClick={() => void handleStart()} className="gap-2" disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                  Go to test
                </Button>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="space-y-1 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <label className="text-sm flex items-center gap-2 font-medium text-slate-800 dark:text-slate-100">
                  <Checkbox
                    checked={config.shuffleQuestions}
                    onCheckedChange={checked => quizStore.setConfig({ shuffleQuestions: Boolean(checked) })}
                  />
                  Shuffle questions
                </label>
                <p className="text-xs text-slate-600 dark:text-slate-400">Randomize question order each run.</p>
              </div>

              <div className="space-y-1 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <label className="text-sm flex items-center gap-2 font-medium text-slate-800 dark:text-slate-100">
                  <Checkbox
                    checked={config.shuffleAnswers}
                    onCheckedChange={checked => quizStore.setConfig({ shuffleAnswers: Boolean(checked) })}
                  />
                  Shuffle answers
                </label>
                <p className="text-xs text-slate-600 dark:text-slate-400">Mix option order per question.</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Scoring</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Choose how credit is assigned.</p>
                  </div>
                </div>
                <RadioGroup
                  value={config.scoring}
                  onValueChange={(value: ScoringMode) => quizStore.setConfig({ scoring: value })}
                  className="mt-3 grid gap-2"
                >
                  <Label className="flex items-center gap-2">
                    <RadioGroupItem value="per-question" id="score-question" /> Per question (perfect = 1)
                  </Label>
                  <Label className="flex items-center gap-2">
                    <RadioGroupItem value="per-answer" id="score-answer" /> Per answer (partials)
                  </Label>
                </RadioGroup>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Penalties</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Pick how wrong answers count.</p>
                  </div>
                </div>
                <RadioGroup
                  value={config.penalty}
                  onValueChange={(value: PenaltyMode) => quizStore.setConfig({ penalty: value })}
                  className="mt-3 grid gap-2"
                >
                  <Label className="flex items-center gap-2">
                    <RadioGroupItem value="counterbalance" id="penalty-counter" /> Wrong subtracts from correct
                  </Label>
                  <Label className="flex items-center gap-2">
                    <RadioGroupItem value="zeroes" id="penalty-zero" /> Any wrong zeros the question
                  </Label>
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="space-y-1 pr-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                    <Clock3 className="size-4 text-indigo-500" /> Time per question
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Guidance only; no timer yet.</p>
                </div>
                <input
                  type="number"
                  min={15}
                  max={300}
                  value={config.timePerQuestion}
                  onChange={event =>
                    quizStore.setConfig({ timePerQuestion: Number(event.target.value) || config.timePerQuestion })
                  }
                  className="w-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

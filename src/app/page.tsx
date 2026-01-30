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
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UploadCloud className="size-5 text-indigo-500" /> Load questions
          </CardTitle>
          <CardDescription>Upload a .txt file, paste text, or use the sample.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-slate-200 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <p className="font-medium">Upload a file</p>
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
                  accept=".txt"
                  className="hidden"
                  onChange={event => {
                    const file = event.target.files?.[0] ?? null;
                    void quizStore.loadFromFile(file);
                  }}
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <p className="font-medium">Paste questions</p>
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
            <Button variant="outline" className="gap-2" disabled={loading} onClick={() => void quizStore.loadSample()}>
              <Wand2 className="size-4" /> Load sample
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shuffle className="size-5 text-indigo-500" /> Test configuration
          </CardTitle>
          <CardDescription>
            {questions.length ? `${questions.length} questions loaded` : "Load questions to begin."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Button variant="outline" onClick={() => quizStore.reset()} disabled={loading}>
              Reset
            </Button>
            <Button disabled={!questions.length || loading} onClick={() => void handleStart()} className="gap-2">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              Go to test
            </Button>
          </div>

          <div className="space-y-1 border-slate-200 bg-white py-2 dark:border-slate-800 dark:bg-slate-900">
            <label className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-100">
              <Checkbox
                checked={config.shuffleQuestions}
                onCheckedChange={checked => quizStore.setConfig({ shuffleQuestions: Boolean(checked) })}
              />
              Shuffle questions
            </label>
            <p className="text-xs text-slate-600 dark:text-slate-400">Randomize question order each run.</p>
          </div>

          <div className="space-y-1 border-slate-200 bg-white py-2 dark:border-slate-800 dark:bg-slate-900">
            <label className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-100">
              <Checkbox
                checked={config.shuffleAnswers}
                onCheckedChange={checked => quizStore.setConfig({ shuffleAnswers: Boolean(checked) })}
              />
              Shuffle answers
            </label>
            <p className="text-xs text-slate-600 dark:text-slate-400">Mix option order per question.</p>
          </div>

          <div className="space-y-1 border-slate-200 bg-white py-2 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-100">Scoring</p>
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
                <RadioGroupItem value="per-answer" id="score-answer" /> Per answer (fractions allowed)
              </Label>
            </RadioGroup>
          </div>

          <div className="space-y-1 border-slate-200 bg-white py-2 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-100">Penalties</p>
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

          {/* 
            <div className="flex items-center justify-between border-slate-200 bg-white py-2 dark:border-slate-800 dark:bg-slate-900">
              <div className="space-y-1 pr-4">
                <p className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-100">
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
                className="w-24 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              />
            </div>
 */}
        </CardContent>
      </Card>
    </div>
  );
}

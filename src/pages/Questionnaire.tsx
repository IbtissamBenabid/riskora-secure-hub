import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useStore } from "@/store/StoreContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { AnswerValue } from "@/types";
import { cn } from "@/lib/utils";

const OPTIONS: { value: AnswerValue; label: string; tone: string }[] = [
  { value: "yes", label: "Yes", tone: "data-[state=on]:bg-risk-low-soft data-[state=on]:text-risk-low data-[state=on]:border-risk-low/50" },
  { value: "partial", label: "Partially", tone: "data-[state=on]:bg-risk-medium-soft data-[state=on]:text-risk-medium data-[state=on]:border-risk-medium/50" },
  { value: "no", label: "No", tone: "data-[state=on]:bg-risk-high-soft data-[state=on]:text-risk-high data-[state=on]:border-risk-high/50" },
  { value: "na", label: "N/A", tone: "data-[state=on]:bg-muted data-[state=on]:text-foreground" },
];

export default function Questionnaire() {
  const { id } = useParams();
  const store = useStore();
  const navigate = useNavigate();
  const a = store.assessments.find(x => x.id === id);
  if (!a) return <Navigate to="/supplier/portal" replace />;
  // suppliers can only access their own
  if (store.currentUser?.role === "supplier" && store.currentUser.supplierId !== a.supplierId) {
    return <Navigate to="/supplier/portal" replace />;
  }

  const supplier = store.suppliers.find(s => s.id === a.supplierId);
  const project = store.projects.find(p => p.id === a.projectId);

  const existing = store.responses.filter(r => r.assessmentId === a.id);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(() =>
    Object.fromEntries(existing.map(r => [r.questionId, r.answer]))
  );

  const completed = Object.keys(answers).length;
  const total = store.questions.length;
  const pct = Math.round((completed / total) * 100);
  const allAnswered = completed === total;

  const grouped = useMemo(() => {
    const g: Record<string, typeof store.questions> = {};
    for (const q of store.questions) (g[q.category] ??= []).push(q);
    return g;
  }, [store.questions]);

  function submit() {
    if (!allAnswered) { toast.error("Please answer all questions"); return; }
    store.saveResponses(a.id, answers);
    toast.success("Questionnaire submitted");
    navigate("/supplier/portal");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Logo />
          <Link to="/supplier/portal" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ChevronLeft className="h-3 w-3" /> Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-accent">Security questionnaire</div>
        <h1 className="text-2xl font-bold tracking-tight">{a.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{supplier?.name} • {project?.name}</p>

        <div className="mt-6 panel p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Progress</span>
            <span className="font-mono">{completed} / {total}</span>
          </div>
          <Progress value={pct} className="mt-2 h-2" />
        </div>

        <div className="mt-6 space-y-6">
          {Object.entries(grouped).map(([cat, qs]) => (
            <section key={cat} className="panel overflow-hidden">
              <header className="flex items-center gap-2 border-b border-border bg-surface-muted px-5 py-3">
                <ShieldCheck className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold">{cat}</h2>
              </header>
              <ul className="divide-y divide-border">
                {qs.map((q) => (
                  <li key={q.id} className="px-5 py-4">
                    <p className="text-sm font-medium">{q.text}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {OPTIONS.map(opt => {
                        const selected = answers[q.id] === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            data-state={selected ? "on" : "off"}
                            onClick={() => setAnswers({ ...answers, [q.id]: opt.value })}
                            className={cn(
                              "rounded-md border border-border bg-card px-3 py-2 text-sm font-medium transition hover:border-accent",
                              opt.tone,
                            )}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="sticky bottom-4 mt-8">
          <div className="panel flex items-center justify-between gap-4 p-4 shadow-md">
            <div className="text-xs text-muted-foreground">{allAnswered ? <span className="inline-flex items-center gap-1 text-risk-low font-medium"><CheckCircle2 className="h-4 w-4" />All questions answered</span> : `${total - completed} questions remaining`}</div>
            <Button onClick={submit} disabled={!allAnswered} className="bg-accent hover:bg-accent/90">Submit responses</Button>
          </div>
        </div>
      </main>

      <Textarea className="hidden" /> {/* keep import side-effect-free for tree-shaking */}
    </div>
  );
}

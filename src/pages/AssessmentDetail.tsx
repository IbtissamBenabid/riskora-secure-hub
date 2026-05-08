import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useStore } from "@/store/StoreContext";
import { computeRiskScore, levelLabel } from "@/lib/risk";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RiskBadge } from "@/components/RiskBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { ChevronLeft, Send, CheckCircle2, XCircle, AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";
import type { DecisionType } from "@/types";
import { AttachmentList } from "@/components/AttachmentList";

const ANSWER_LABEL: Record<string, string> = {
  yes: "Yes — fully implemented",
  partial: "Partially implemented",
  no: "No — not implemented",
  na: "Not applicable",
};

export default function AssessmentDetail() {
  const { id } = useParams();
  const store = useStore();
  const a = store.assessments.find(x => x.id === id);
  if (!a) return <Navigate to="/tprm" replace />;

  const supplier = store.suppliers.find(s => s.id === a.supplierId);
  const project = store.projects.find(p => p.id === a.projectId);
  const responses = store.responses.filter(r => r.assessmentId === a.id);
  const scoreRecord = store.riskScores.find(r => r.assessmentId === a.id);
  const decision = store.decisions.find(d => d.assessmentId === a.id);

  const result = useMemo(() => responses.length ? computeRiskScore(store.questions, responses) : null, [responses, store.questions]);
  const isConsultant = store.currentUser?.role === "consultant";
  const isClient = store.currentUser?.role === "client";

  const [decType, setDecType] = useState<DecisionType>(decision?.decision ?? "accept");
  const [decComment, setDecComment] = useState(decision?.comment ?? "");

  function send() {
    store.updateAssessmentStatus(a.id, "sent");
    toast.success("Questionnaire sent to supplier");
  }

  function markReviewed() {
    store.updateAssessmentStatus(a.id, "reviewed");
    toast.success("Marked as reviewed");
  }

  function submitDecision() {
    if (!decComment.trim()) { toast.error("Please add a comment"); return; }
    store.recordDecision({ assessmentId: a.id, decision: decType, comment: decComment.trim(), decidedBy: store.currentUser!.id });
    toast.success(`Decision recorded: ${decType.replace(/_/g, " ")}`);
  }

  return (
    <AppShell
      title={a.title}
      description={`${supplier?.name} • ${project?.name}`}
      actions={
        <Link to="/tprm" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ChevronLeft className="h-3 w-3" /> All assessments
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left — workflow & responses */}
        <div className="space-y-6 lg:col-span-2">
          {/* Workflow */}
          <div className="panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="stat-label">Workflow</div>
                <div className="mt-2 flex items-center gap-2"><StatusBadge status={a.status} /></div>
              </div>
              {isConsultant && (
                <div className="flex gap-2">
                  {a.status === "draft" && <Button size="sm" onClick={send}><Send className="mr-1.5 h-3.5 w-3.5" />Send to supplier</Button>}
                  {a.status === "completed" && <Button size="sm" onClick={markReviewed}><FileText className="mr-1.5 h-3.5 w-3.5" />Mark reviewed</Button>}
                </div>
              )}
            </div>
            <Stepper status={a.status} />
          </div>

          {/* Responses */}
          <div className="panel">
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-sm font-semibold">Questionnaire Responses</h3>
              <p className="text-xs text-muted-foreground">{responses.length} of {store.questions.length} answered</p>
            </div>
            {responses.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center">
                <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">Awaiting supplier responses.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {store.questions.map((q, i) => {
                  const r = responses.find(x => x.questionId === q.id);
                  return (
                    <li key={q.id} className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">{q.text}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="rounded bg-muted px-1.5 py-0.5">{q.category}</span>
                            <span>Weight {q.weight}</span>
                          </div>
                          {r && <div className={`mt-2 text-xs font-medium ${r.answer === "yes" ? "text-risk-low" : r.answer === "partial" ? "text-risk-medium" : r.answer === "no" ? "text-risk-high" : "text-muted-foreground"}`}>{ANSWER_LABEL[r.answer]}</div>}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right — scoring & decision */}
        <div className="space-y-6">
          <div className="panel p-6">
            <div className="stat-label">Risk Score</div>
            {result ? (
              <>
                <div className="mt-3 flex items-baseline gap-2">
                  <div className="font-mono text-5xl font-bold tracking-tight">{result.score}</div>
                  <div className="text-sm text-muted-foreground">/ 100</div>
                </div>
                <div className="mt-3"><RiskBadge level={result.level} /></div>
                <p className="mt-3 text-xs text-muted-foreground">{levelLabel(result.level)} based on weighted answers across {Object.keys(result.byCategory).length} control categories.</p>

                <div className="mt-5 space-y-3 border-t border-border pt-4">
                  {Object.entries(result.byCategory).map(([cat, v]) => (
                    <div key={cat}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium">{cat}</span>
                        <span className="font-mono text-muted-foreground">{v.score}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full ${v.level === "low" ? "bg-risk-low" : v.level === "medium" ? "bg-risk-medium" : "bg-risk-high"}`} style={{ width: `${v.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No score yet — awaiting completed responses.</p>
            )}
          </div>

          {/* Decision */}
          <div className="panel p-6">
            <div className="stat-label">Decision</div>
            {decision ? (
              <div className="mt-3 space-y-3">
                <DecisionPill decision={decision.decision} />
                <p className="text-sm text-muted-foreground leading-relaxed">"{decision.comment}"</p>
                <div className="text-xs text-muted-foreground">Decided {decision.decidedAt}</div>
              </div>
            ) : (isConsultant || isClient) && result ? (
              <div className="mt-3 space-y-3">
                <Select value={decType} onValueChange={(v) => setDecType(v as DecisionType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accept">Accept</SelectItem>
                    <SelectItem value="accept_with_conditions">Accept with conditions</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea placeholder="Justification / conditions…" rows={4} value={decComment} onChange={(e) => setDecComment(e.target.value)} />
                <Button onClick={submitDecision} className="w-full">Record decision</Button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">A decision can be recorded once the assessment is scored.</p>
            )}
          </div>

          <div className="panel p-6">
            <div className="stat-label">Supplier</div>
            <div className="mt-2 text-sm font-semibold">{supplier?.name}</div>
            <div className="text-xs text-muted-foreground">{supplier?.contactEmail}</div>
            <div className="mt-1 text-xs text-muted-foreground">{supplier?.category}</div>
          </div>

          {project && (
            <AttachmentList entityType="assessment" entityId={a.id} projectId={project.id} />
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Stepper({ status }: { status: string }) {
  const steps = ["draft", "sent", "completed", "reviewed", "approved"];
  const current = status === "rejected" ? 4 : Math.max(0, steps.indexOf(status));
  return (
    <ol className="mt-5 flex items-center gap-2">
      {steps.map((s, i) => {
        const done = i <= current && status !== "rejected";
        const isReject = status === "rejected" && i === 4;
        return (
          <li key={s} className="flex flex-1 items-center gap-2">
            <div className={`h-1.5 flex-1 rounded-full ${isReject ? "bg-risk-high" : done ? "bg-accent" : "bg-muted"}`} />
            <span className={`text-[10px] uppercase tracking-wider ${done || isReject ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
              {isReject ? "Rejected" : s}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function DecisionPill({ decision }: { decision: DecisionType }) {
  const map = {
    accept: { label: "Accepted", cls: "bg-risk-low-soft text-risk-low", icon: CheckCircle2 },
    accept_with_conditions: { label: "Accepted with conditions", cls: "bg-risk-medium-soft text-risk-medium", icon: AlertTriangle },
    reject: { label: "Rejected", cls: "bg-risk-high-soft text-risk-high", icon: XCircle },
  } as const;
  const m = map[decision];
  const Icon = m.icon;
  return (
    <div className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold ${m.cls}`}>
      <Icon className="h-4 w-4" />{m.label}
    </div>
  );
}

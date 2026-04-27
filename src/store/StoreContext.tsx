import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  Assessment, AssessmentStatus, Decision, DecisionType, Organization,
  Project, Response, RiskScore, Supplier, User,
} from "@/types";
import {
  seedAssessments, seedDecisions, seedOrganizations, seedProjects,
  seedResponses, seedRiskScores, seedSuppliers, seedUsers,
} from "@/data/seed";
import { SEED_QUESTIONS } from "@/data/questions";
import { computeRiskScore } from "@/lib/risk";

const STORAGE_KEY = "riskora.store.v1";

interface StoreState {
  users: User[];
  organizations: Organization[];
  projects: Project[];
  suppliers: Supplier[];
  assessments: Assessment[];
  responses: Response[];
  riskScores: RiskScore[];
  decisions: Decision[];
  currentUserId: string | null;
}

const initialState: StoreState = {
  users: seedUsers,
  organizations: seedOrganizations,
  projects: seedProjects,
  suppliers: seedSuppliers,
  assessments: seedAssessments,
  responses: seedResponses,
  riskScores: seedRiskScores,
  decisions: seedDecisions,
  currentUserId: null,
};

interface StoreContextValue extends StoreState {
  questions: typeof SEED_QUESTIONS;
  currentUser: User | null;
  login: (email: string) => User | null;
  logout: () => void;
  resetDemo: () => void;

  createProject: (input: { name: string; description: string; organizationId: string }) => Project;
  createSupplier: (input: { name: string; organizationId: string; contactEmail: string; category: string }) => Supplier;
  createAssessment: (input: { projectId: string; supplierId: string; title: string }) => Assessment;
  updateAssessmentStatus: (id: string, status: AssessmentStatus) => void;
  saveResponses: (assessmentId: string, answers: Record<string, Response["answer"]>) => void;
  recordDecision: (input: { assessmentId: string; decision: DecisionType; comment: string; decidedBy: string }) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function load(): StoreState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    return { ...initialState, ...JSON.parse(raw) };
  } catch {
    return initialState;
  }
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(() => load());

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId]
  );

  const login = useCallback((email: string) => {
    const user = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user) setState((s) => ({ ...s, currentUserId: user.id }));
    return user ?? null;
  }, [state.users]);

  const logout = useCallback(() => setState((s) => ({ ...s, currentUserId: null })), []);

  const resetDemo = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  }, []);

  const createProject: StoreContextValue["createProject"] = useCallback((input) => {
    const project: Project = {
      id: uid("p"),
      ...input,
      status: "active",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setState((s) => ({ ...s, projects: [project, ...s.projects] }));
    return project;
  }, []);

  const createSupplier: StoreContextValue["createSupplier"] = useCallback((input) => {
    const supplier: Supplier = { id: uid("s"), ...input };
    setState((s) => ({ ...s, suppliers: [supplier, ...s.suppliers] }));
    return supplier;
  }, []);

  const createAssessment: StoreContextValue["createAssessment"] = useCallback((input) => {
    const assessment: Assessment = {
      id: uid("a"),
      ...input,
      status: "draft",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setState((s) => ({ ...s, assessments: [assessment, ...s.assessments] }));
    return assessment;
  }, []);

  const updateAssessmentStatus: StoreContextValue["updateAssessmentStatus"] = useCallback((id, status) => {
    setState((s) => ({
      ...s,
      assessments: s.assessments.map((a) => {
        if (a.id !== id) return a;
        const now = new Date().toISOString().slice(0, 10);
        return {
          ...a,
          status,
          sentAt: status === "sent" && !a.sentAt ? now : a.sentAt,
          completedAt: status === "completed" && !a.completedAt ? now : a.completedAt,
        };
      }),
    }));
  }, []);

  const saveResponses: StoreContextValue["saveResponses"] = useCallback((assessmentId, answers) => {
    setState((s) => {
      const others = s.responses.filter((r) => r.assessmentId !== assessmentId);
      const next: Response[] = Object.entries(answers).map(([questionId, answer]) => ({
        id: `${assessmentId}-r-${questionId}`,
        assessmentId, questionId, answer,
      }));
      const result = computeRiskScore(SEED_QUESTIONS, next);
      const otherScores = s.riskScores.filter((r) => r.assessmentId !== assessmentId);
      const newScore: RiskScore = {
        id: uid("rs"), assessmentId, score: result.score, level: result.level,
        computedAt: new Date().toISOString().slice(0, 10),
      };
      const assessments = s.assessments.map((a) =>
        a.id === assessmentId
          ? { ...a, status: "completed" as AssessmentStatus, completedAt: new Date().toISOString().slice(0, 10) }
          : a
      );
      return {
        ...s,
        responses: [...others, ...next],
        riskScores: [...otherScores, newScore],
        assessments,
      };
    });
  }, []);

  const recordDecision: StoreContextValue["recordDecision"] = useCallback((input) => {
    setState((s) => {
      const decision: Decision = {
        id: uid("d"),
        ...input,
        decidedAt: new Date().toISOString().slice(0, 10),
      };
      const assessments = s.assessments.map((a) =>
        a.id === input.assessmentId
          ? { ...a, status: input.decision === "reject" ? "rejected" as AssessmentStatus : "approved" as AssessmentStatus }
          : a
      );
      const decisions = [...s.decisions.filter((d) => d.assessmentId !== input.assessmentId), decision];
      return { ...s, decisions, assessments };
    });
  }, []);

  const value: StoreContextValue = {
    ...state,
    questions: SEED_QUESTIONS,
    currentUser,
    login, logout, resetDemo,
    createProject, createSupplier, createAssessment,
    updateAssessmentStatus, saveResponses, recordDecision,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

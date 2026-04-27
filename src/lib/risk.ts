import type { AnswerValue, Question, Response, RiskLevel } from "@/types";

// Map answer to a 0..1 compliance factor (higher = better security posture)
const ANSWER_FACTOR: Record<AnswerValue, number | null> = {
  yes: 1,
  partial: 0.5,
  no: 0,
  na: null, // excluded from scoring
};

export interface ScoringResult {
  score: number; // 0..100, higher = safer
  level: RiskLevel;
  weightedAchieved: number;
  weightedMax: number;
  byCategory: Record<string, { score: number; level: RiskLevel }>;
}

export function computeRiskScore(
  questions: Question[],
  responses: Response[]
): ScoringResult {
  const responseMap = new Map(responses.map((r) => [r.questionId, r.answer]));

  let weightedAchieved = 0;
  let weightedMax = 0;
  const cat: Record<string, { achieved: number; max: number }> = {};

  for (const q of questions) {
    const ans = responseMap.get(q.id);
    if (!ans) continue;
    const factor = ANSWER_FACTOR[ans];
    if (factor === null) continue;
    weightedMax += q.weight;
    weightedAchieved += q.weight * factor;
    cat[q.category] ??= { achieved: 0, max: 0 };
    cat[q.category].max += q.weight;
    cat[q.category].achieved += q.weight * factor;
  }

  const score = weightedMax === 0 ? 0 : Math.round((weightedAchieved / weightedMax) * 100);
  const level = scoreToLevel(score);

  const byCategory: Record<string, { score: number; level: RiskLevel }> = {};
  for (const [k, v] of Object.entries(cat)) {
    const s = v.max === 0 ? 0 : Math.round((v.achieved / v.max) * 100);
    byCategory[k] = { score: s, level: scoreToLevel(s) };
  }

  return { score, level, weightedAchieved, weightedMax, byCategory };
}

export function scoreToLevel(score: number): RiskLevel {
  if (score >= 85) return "low";
  if (score >= 60) return "medium";
  return "high";
}

export function levelLabel(level: RiskLevel): string {
  return { low: "Low Risk", medium: "Medium Risk", high: "High Risk" }[level];
}

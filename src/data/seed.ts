import type {
  Assessment, Decision, Organization, Project, Response,
  RiskScore, Supplier, User,
} from "@/types";
import { SEED_QUESTIONS } from "./questions";

export const seedOrganizations: Organization[] = [
  { id: "org-1", name: "Northwind Bank" },
  { id: "org-2", name: "Helix Health" },
];

export const seedUsers: User[] = [
  { id: "u-1", name: "Alex Morgan", email: "alex@riskora.io", role: "consultant" },
  { id: "u-2", name: "Priya Shah", email: "priya@northwind.com", role: "client", organizationId: "org-1", assignedProjectIds: ["p-1", "p-2"] },
  { id: "u-3", name: "Marcus Vogel", email: "security@cloudfleet.io", role: "supplier", supplierId: "s-1" },
];

export const seedProjects: Project[] = [
  { id: "p-1", name: "Q2 Vendor Risk Review", description: "Annual third-party assessment cycle for critical SaaS vendors.", organizationId: "org-1", status: "active", createdAt: "2025-03-04" },
  { id: "p-2", name: "Cloud Migration Due Diligence", description: "Assess infrastructure providers ahead of core banking migration.", organizationId: "org-1", status: "active", createdAt: "2025-02-12" },
  { id: "p-3", name: "HIPAA Vendor Audit", description: "Compliance review of vendors handling PHI.", organizationId: "org-2", status: "completed", createdAt: "2024-11-20" },
];

export const seedSuppliers: Supplier[] = [
  { id: "s-1", name: "CloudFleet Infrastructure", organizationId: "org-1", contactEmail: "security@cloudfleet.io", category: "Cloud Hosting" },
  { id: "s-2", name: "Sentinel Payments", organizationId: "org-1", contactEmail: "compliance@sentinelpay.com", category: "Payments" },
  { id: "s-3", name: "Lumen Analytics", organizationId: "org-1", contactEmail: "trust@lumen.io", category: "Data Analytics" },
  { id: "s-4", name: "MedRecord Sync", organizationId: "org-2", contactEmail: "infosec@medrecord.io", category: "Healthcare SaaS" },
];

export const seedAssessments: Assessment[] = [
  { id: "a-1", projectId: "p-1", supplierId: "s-1", title: "CloudFleet — Annual Review", status: "sent", createdAt: "2025-03-05", sentAt: "2025-03-06" },
  { id: "a-2", projectId: "p-1", supplierId: "s-2", title: "Sentinel Payments — PCI Scope", status: "reviewed", createdAt: "2025-03-05", sentAt: "2025-03-05", completedAt: "2025-03-12" },
  { id: "a-3", projectId: "p-1", supplierId: "s-3", title: "Lumen — Data Handling", status: "approved", createdAt: "2025-02-20", sentAt: "2025-02-21", completedAt: "2025-02-28" },
  { id: "a-4", projectId: "p-2", supplierId: "s-1", title: "CloudFleet — Migration Readiness", status: "draft", createdAt: "2025-03-15" },
];

// Pre-filled answers for a-2 and a-3 so reports look real.
function buildResponses(assessmentId: string, pattern: ("yes" | "partial" | "no")[]): Response[] {
  return SEED_QUESTIONS.map((q, i) => ({
    id: `${assessmentId}-r-${i}`,
    assessmentId,
    questionId: q.id,
    answer: pattern[i % pattern.length],
  }));
}

export const seedResponses: Response[] = [
  ...buildResponses("a-2", ["yes", "yes", "partial", "yes", "yes", "partial", "yes", "no", "yes", "partial", "yes", "yes", "yes", "partial", "yes"]),
  ...buildResponses("a-3", ["yes", "yes", "yes", "yes", "yes", "yes", "yes", "yes", "yes", "yes", "yes", "yes", "yes", "yes", "yes"]),
];

export const seedRiskScores: RiskScore[] = [
  { id: "rs-2", assessmentId: "a-2", score: 72, level: "medium", computedAt: "2025-03-12" },
  { id: "rs-3", assessmentId: "a-3", score: 94, level: "low", computedAt: "2025-02-28" },
];

export const seedDecisions: Decision[] = [
  { id: "d-3", assessmentId: "a-3", decision: "accept", comment: "Strong controls across all categories. Approved without conditions.", decidedBy: "u-1", decidedAt: "2025-03-01" },
];

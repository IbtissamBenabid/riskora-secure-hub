export type Role = "consultant" | "client" | "supplier";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId?: string; // clients & suppliers belong to an org
  supplierId?: string; // suppliers are linked to a supplier record
  assignedProjectIds?: string[]; // for clients
}

export interface Organization {
  id: string;
  name: string;
}

export type ProjectStatus = "active" | "completed";

export interface Project {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  status: ProjectStatus;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  organizationId: string; // the client org that uses this supplier
  contactEmail: string;
  category: string;
}

export type AssessmentStatus =
  | "draft"
  | "sent"
  | "completed"
  | "reviewed"
  | "approved"
  | "rejected";

export type RiskLevel = "low" | "medium" | "high";

export type DecisionType = "accept" | "accept_with_conditions" | "reject";

export interface Question {
  id: string;
  text: string;
  category: string;
  weight: number; // 1..5
}

// Standard yes/no/partial answer with risk implication
export type AnswerValue = "yes" | "partial" | "no" | "na";

export interface Response {
  id: string;
  assessmentId: string;
  questionId: string;
  answer: AnswerValue;
  comment?: string;
}

export interface RiskScore {
  id: string;
  assessmentId: string;
  score: number; // 0..100
  level: RiskLevel;
  computedAt: string;
}

export interface Decision {
  id: string;
  assessmentId: string;
  decision: DecisionType;
  comment: string;
  decidedBy: string;
  decidedAt: string;
}

export interface Assessment {
  id: string;
  projectId: string;
  supplierId: string;
  title: string;
  status: AssessmentStatus;
  createdAt: string;
  sentAt?: string;
  completedAt?: string;
}

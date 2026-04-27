import { ModulePlaceholder } from "@/components/ModulePlaceholder";
import { Activity, FileCheck2, Code2, Bug, Scale } from "lucide-react";

export const RiskAnalysis = () => (
  <ModulePlaceholder
    title="Risk Analysis"
    description="Identify, score and prioritize risks across your client engagements with structured methodologies."
    icon={Activity}
    highlights={[
      "ISO 27005 / EBIOS-aligned risk registers",
      "Likelihood × impact scoring with treatment plans",
      "Cross-project risk heatmap and trends",
    ]}
  />
);

export const SecurityRequirements = () => (
  <ModulePlaceholder
    title="Security Requirements"
    description="Maintain a living catalog of security requirements derived from frameworks, contracts and threat models."
    icon={FileCheck2}
    highlights={[
      "Reusable requirement library per client",
      "Mapping to NIST, ISO 27002, OWASP ASVS",
      "Traceability from requirement → control → test",
    ]}
  />
);

export const SecureCodeReview = () => (
  <ModulePlaceholder
    title="Secure Code Review"
    description="Plan, conduct and report manual and tool-assisted code reviews with issue triage."
    icon={Code2}
    highlights={[
      "Repository onboarding and scope definition",
      "Finding tracker with severity and CWE mapping",
      "Reviewer notes, evidence and remediation guidance",
    ]}
  />
);

export const SecurityTesting = () => (
  <ModulePlaceholder
    title="Security Testing"
    description="Coordinate pentests, DAST and red-team engagements with structured deliverables."
    icon={Bug}
    highlights={[
      "Engagement scoping and rules of engagement",
      "Findings dashboard with retest workflow",
      "Client-facing executive and technical reports",
    ]}
  />
);

export const Compliance = () => (
  <ModulePlaceholder
    title="Compliance"
    description="Track control implementation status against the frameworks your clients are working towards."
    icon={Scale}
    highlights={[
      "ISO 27001, SOC 2, HIPAA, NIS2 control libraries",
      "Evidence collection with audit timeline",
      "Gap analysis and readiness scoring",
    ]}
  />
);

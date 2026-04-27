import type { Question } from "@/types";

export const SEED_QUESTIONS: Question[] = [
  // Access Control
  { id: "q1", category: "Access Control", weight: 5, text: "Do you enforce multi-factor authentication (MFA) for all administrative accounts?" },
  { id: "q2", category: "Access Control", weight: 4, text: "Do you apply the principle of least privilege when granting access to systems handling client data?" },
  { id: "q3", category: "Access Control", weight: 3, text: "Are user access rights reviewed at least quarterly?" },
  // Data Protection
  { id: "q4", category: "Data Protection", weight: 5, text: "Is client data encrypted at rest using industry-standard algorithms (AES-256 or equivalent)?" },
  { id: "q5", category: "Data Protection", weight: 5, text: "Is data encrypted in transit using TLS 1.2 or higher?" },
  { id: "q6", category: "Data Protection", weight: 4, text: "Do you have a documented data retention and secure deletion policy?" },
  // Incident Response
  { id: "q7", category: "Incident Response", weight: 5, text: "Do you have a documented incident response plan tested at least annually?" },
  { id: "q8", category: "Incident Response", weight: 4, text: "Will you notify clients of a security breach within 72 hours of detection?" },
  // Business Continuity
  { id: "q9", category: "Business Continuity", weight: 3, text: "Do you maintain a tested business continuity and disaster recovery plan?" },
  { id: "q10", category: "Business Continuity", weight: 3, text: "Are backups encrypted and stored in a geographically separate location?" },
  // Compliance & Governance
  { id: "q11", category: "Compliance", weight: 4, text: "Do you hold a current ISO 27001, SOC 2 Type II, or equivalent certification?" },
  { id: "q12", category: "Compliance", weight: 3, text: "Do you comply with applicable data protection regulations (GDPR, CCPA, etc.)?" },
  // Personnel & Vendor
  { id: "q13", category: "Personnel", weight: 3, text: "Do all employees with access to client data undergo background screening?" },
  { id: "q14", category: "Personnel", weight: 2, text: "Is annual security awareness training mandatory for all staff?" },
  { id: "q15", category: "Vendor Management", weight: 4, text: "Do you assess the security posture of your own subcontractors handling client data?" },
];

export type ProposalStatus = "draft" | "review" | "open" | "passed" | "rejected" | "blocked";
export type ExtractedFactCategory = "rules" | "dues" | "fines" | "contractor_terms" | "voting_rules" | "owner_rights";

export interface ExtractedFact {
  id?: string;
  category: ExtractedFactCategory;
  label: string;
  text: string;
  evidence?: string;
  confidence: number;
}

export interface DocumentAnalysis {
  summary: string;
  rules: string[];
  risks: string[];
  extractedFacts: ExtractedFact[];
  valueClaims: string[];
  suggestedProposals: string[];
  proposalDrafts: Array<{ title: string; body: string }>;
}

export interface Proposal {
  id: string;
  title: string;
  body: string;
  status: ProposalStatus;
  policyFlags: string[];
  requiredApprovals: string[];
  aiDraft?: boolean;
  createdAt: string;
}

export interface QuadraticVote {
  proposalId: string;
  residentId: string;
  votes: number;
  cost: number;
}

export interface PolicyResult {
  allowed: boolean;
  flags: string[];
  requiredApprovals: string[];
  guardrails: {
    planarIsolation: boolean;
    humanConsent: boolean;
    guardianVeto: boolean;
  };
}

const riskyTerms = [
  "foreclosure",
  "lien",
  "evict",
  "fine all",
  "publicly reveal",
  "publish names",
  "treasury transfer",
  "dissolve hoa",
  "legal action"
];

export function auditBeforeExecute(input: {
  action: string;
  text: string;
  planarIsolation?: boolean;
  humanConsent?: boolean;
  guardianVeto?: boolean;
}): PolicyResult {
  const haystack = `${input.action} ${input.text}`.toLowerCase();
  const flags = riskyTerms.filter(term => haystack.includes(term));
  const requiredApprovals: string[] = [];
  const guardrails = {
    planarIsolation: input.planarIsolation === true,
    humanConsent: input.humanConsent === true,
    guardianVeto: input.guardianVeto !== false
  };

  if (flags.includes("treasury transfer")) requiredApprovals.push("multisig_treasury");
  if (flags.some(f => ["foreclosure", "lien", "legal action", "dissolve hoa"].includes(f))) {
    requiredApprovals.push("attorney_review");
  }
  if (flags.includes("publicly reveal") || flags.includes("publish names")) {
    requiredApprovals.push("privacy_officer_review");
  }
  if (!guardrails.planarIsolation) requiredApprovals.push("planar_isolation");
  if (!guardrails.humanConsent) requiredApprovals.push("human_consent");
  if (!guardrails.guardianVeto) {
    flags.push("guardian_veto");
    requiredApprovals.push("guardian_veto_override");
  }

  return {
    allowed: requiredApprovals.length === 0 && guardrails.guardianVeto,
    flags,
    requiredApprovals: [...new Set(requiredApprovals)],
    guardrails
  };
}

export function quadraticCost(votes: number): number {
  if (!Number.isInteger(votes) || votes < 0) throw new Error("votes must be a non-negative integer");
  return votes * votes;
}

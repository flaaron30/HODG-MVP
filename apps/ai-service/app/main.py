from fastapi import FastAPI
from pydantic import BaseModel
import re

app = FastAPI(title="HODG AI Service", version="0.1.0")

class AnalyzeRequest(BaseModel):
    title: str = "Untitled"
    text: str

def first_sentence(pattern, text):
    match = re.search(rf"[^.\n]{{0,180}}{pattern}[^.\n]{{0,220}}", text, flags=re.I)
    return match.group(0).strip() if match else None

def bullets_for(patterns, text):
    hits = []
    for label, pattern in patterns:
        if re.search(pattern, text, flags=re.I):
            hits.append(label)
    return hits

def fact(category, label, pattern, text, confidence=0.72):
    evidence = first_sentence(pattern, text)
    if not evidence:
        return None
    return {
        "category": category,
        "label": label,
        "text": evidence,
        "evidence": evidence,
        "confidence": confidence
    }

@app.get("/health")
def health():
    return {"ok": True, "service": "hodg-ai"}

@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    text = req.text[:50000]
    rules = bullets_for([
        ("Architectural or property-use restrictions detected", r"restriction|covenant|architectural|paint|fence|vehicle"),
        ("Voting/governance mechanism detected", r"vote|quorum|board|governance|dao|quadratic"),
        ("Dues, fees, assessments, or treasury language detected", r"dues|assessment|fee|treasury|budget|dividend"),
        ("Contractor/service management language detected", r"contractor|vendor|landscap|maintenance|service"),
        ("Privacy or identity language detected", r"privacy|identity|DID|zero-knowledge|ZKP|personal data")
    ], text)
    risks = bullets_for([
        ("Potential legal-review requirement", r"dissolve|foreclosure|lien|statute|legal|attorney"),
        ("Potential privacy exposure", r"publish names|personal data|address|retaliation"),
        ("Potential treasury-control issue", r"transfer funds|treasury|escrow|payment")
    ], text)
    value_claims = re.findall(r"[^.]{0,120}(property value|appreciation|APR|premium|market value)[^.]{0,160}\.", text, flags=re.I)
    extracted_facts = [
        fact("rules", "Use restrictions or architectural rules are present", r"restriction|covenant|architectural|paint|fence|vehicle|lease|rental", text),
        fact("dues", "Dues, fees, assessments, or budget obligations are present", r"dues|assessment|fee|budget|reserve|special assessment", text),
        fact("fines", "Fine, enforcement, lien, or penalty language is present", r"fine|penalty|enforcement|violation|lien|foreclosure", text),
        fact("contractor_terms", "Contractor, vendor, maintenance, or service terms are present", r"contractor|vendor|landscap|maintenance|service|bid|escrow|milestone", text),
        fact("voting_rules", "Voting, quorum, proxy, board, or governance rules are present", r"vote|voting|quorum|proxy|board|governance|ballot|majority", text),
        fact("owner_rights", "Owner rights, notice, hearing, records, or appeal language is present", r"owner rights|notice|hearing|appeal|records|inspect|due process|member rights", text),
    ]
    extracted_facts = [item for item in extracted_facts if item]
    proposal_drafts = [
        {
            "title": "Evidence-backed enforcement review",
            "body": "Require all rule-enforcement proposals to cite extracted CC&R evidence, owner-notice obligations, and a human consent checkpoint before any fine, lien, or legal action."
        },
        {
            "title": "Transparent contractor bid policy",
            "body": "Publish contractor scopes, bid comparisons, milestone acceptance criteria, and payment approvals to the resident audit ledger before work begins."
        },
        {
            "title": "Quadratic voting pilot for community priorities",
            "body": "Run non-binding community priority polls with quadratic voting credits, private owner eligibility checks, and public aggregate results only."
        }
    ]
    suggested = [
        draft["title"] for draft in proposal_drafts
    ]
    return {
        "summary": f"{req.title}: AI-ready governance document with {len(rules)} detected policy areas and {len(risks)} risk flags.",
        "rules": rules,
        "risks": risks,
        "extractedFacts": extracted_facts,
        "valueClaims": value_claims[:8],
        "suggestedProposals": suggested,
        "proposalDrafts": proposal_drafts
    }

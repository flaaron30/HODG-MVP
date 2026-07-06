import crypto from "node:crypto";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { auditBeforeExecute, quadraticCost } from "../../../packages/policy-gate/src/index.js";

const app = Fastify({ logger: true });
const prisma = new PrismaClient();
await app.register(cors, { origin: true });

const json = z.record(z.unknown());
const factSchema = z.object({
  category: z.enum(["rules", "dues", "fines", "contractor_terms", "voting_rules", "owner_rights"]),
  label: z.string(),
  text: z.string(),
  evidence: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0.65)
});
const gateInput = z.object({
  planarIsolation: z.boolean().default(true),
  humanConsent: z.boolean().default(false),
  guardianVeto: z.boolean().default(true)
});

function stableHash(value: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function audit(action: string, payload: unknown, actorDid?: string) {
  const previous = await prisma.auditEvent.findFirst({ orderBy: { createdAt: "desc" } });
  const payloadHash = stableHash(payload);
  const eventHash = stableHash({ action, actorDid, payloadHash, previousHash: previous?.eventHash ?? null });
  return prisma.auditEvent.create({
    data: {
      action,
      actorDid,
      payload: payload as object,
      previousHash: previous?.eventHash,
      payloadHash,
      eventHash
    }
  });
}

async function demoCommunity() {
  const community = await prisma.community.upsert({
    where: { id: "demo-community" },
    update: {},
    create: { id: "demo-community", name: "HODG Demo HOA", state: "CA" }
  });
  await prisma.resident.upsert({
    where: { did: "did:hodg:demo-resident" },
    update: {},
    create: { communityId: community.id, did: "did:hodg:demo-resident", displayName: "Demo Resident" }
  });
  return community;
}

function factsFromAnalysis(analysis: any) {
  return factSchema.array().parse(analysis.extractedFacts ?? []);
}

async function analyzeDocument(title: string, text: string) {
  const response = await fetch(`${process.env.AI_SERVICE_URL ?? "http://localhost:8000"}/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, text })
  });
  if (!response.ok) throw new Error(`AI analysis failed: ${response.status}`);
  return response.json();
}

app.get("/health", async () => ({ ok: true, service: "hodg-api" }));

app.post("/documents/upload", async (req) => {
  const body = z.object({
    communityId: z.string().default("demo-community"),
    title: z.string().min(2),
    text: z.string().min(10),
    sourceType: z.string().default("hoa_document"),
    actorDid: z.string().default("did:hodg:demo-resident")
  }).parse(req.body);
  await demoCommunity();
  const analysis = await analyzeDocument(body.title, body.text);
  const document = await prisma.document.create({
    data: {
      communityId: body.communityId,
      title: body.title,
      sourceType: body.sourceType,
      rawText: body.text,
      analysis,
      facts: { create: factsFromAnalysis(analysis) }
    },
    include: { facts: true }
  });
  await audit("document.upload_and_extract", { documentId: document.id, title: document.title, facts: document.facts }, body.actorDid);
  return { document, analysis };
});

app.post("/documents/analyze", async (req) => {
  const body = z.object({ title: z.string(), text: z.string().min(10) }).parse(req.body);
  const analysis = await analyzeDocument(body.title, body.text);
  await audit("document.analyze_preview", { title: body.title, analysis });
  return analysis;
});

app.get("/documents/:id/facts", async (req) => {
  const params = z.object({ id: z.string() }).parse(req.params);
  return prisma.extractedFact.findMany({ where: { documentId: params.id }, orderBy: { createdAt: "asc" } });
});

app.post("/proposals/ai-drafts", async (req) => {
  const body = z.object({
    communityId: z.string().default("demo-community"),
    documentId: z.string(),
    actorDid: z.string().default("did:hodg:demo-resident"),
    gate: gateInput.default({ planarIsolation: true, humanConsent: false, guardianVeto: true })
  }).parse(req.body);
  await demoCommunity();
  const document = await prisma.document.findUniqueOrThrow({ where: { id: body.documentId }, include: { facts: true } });
  const analysis = json.parse(document.analysis ?? {});
  const drafts = z.object({ title: z.string(), body: z.string() }).array().parse((analysis as any).proposalDrafts ?? []);
  const proposals = await Promise.all(drafts.map(async draft => {
    const policy = auditBeforeExecute({ action: "proposal.ai_draft", text: `${draft.title}\n${draft.body}`, ...body.gate });
    const proposal = await prisma.proposal.create({
      data: {
        communityId: body.communityId,
        documentId: body.documentId,
        title: draft.title,
        body: draft.body,
        aiDraft: true,
        status: policy.allowed ? "review" : "blocked",
        policyFlags: policy.flags,
        requiredApprovals: policy.requiredApprovals
      }
    });
    await audit("proposal.ai_draft.policy_gate", { proposal, policy }, body.actorDid);
    return { ...proposal, policy };
  }));
  return proposals;
});

app.post("/proposals", async (req) => {
  const body = z.object({
    communityId: z.string().default("demo-community"),
    documentId: z.string().optional(),
    title: z.string().min(3),
    body: z.string().min(10),
    actorDid: z.string().default("did:hodg:demo-resident"),
    gate: gateInput.default({ planarIsolation: true, humanConsent: true, guardianVeto: true })
  }).parse(req.body);
  await demoCommunity();
  const policy = auditBeforeExecute({ action: "proposal.create", text: `${body.title}\n${body.body}`, ...body.gate });
  const proposal = await prisma.proposal.create({
    data: {
      communityId: body.communityId,
      documentId: body.documentId,
      title: body.title,
      body: body.body,
      status: policy.allowed ? "review" : "blocked",
      policyFlags: policy.flags,
      requiredApprovals: policy.requiredApprovals
    }
  });
  await audit("proposal.create.policy_gate", { proposal, policy }, body.actorDid);
  return { ...proposal, policy };
});

app.get("/proposals", async () => prisma.proposal.findMany({ orderBy: { createdAt: "desc" }, include: { votes: true } }));

app.post("/votes", async (req) => {
  const body = z.object({
    proposalId: z.string(),
    residentDid: z.string().default("did:hodg:demo-resident"),
    votes: z.number().int().min(1).max(10)
  }).parse(req.body);
  await demoCommunity();
  const resident = await prisma.resident.findUniqueOrThrow({ where: { did: body.residentDid } });
  const vote = await prisma.vote.create({
    data: { proposalId: body.proposalId, residentId: resident.id, votes: body.votes, cost: quadraticCost(body.votes) }
  });
  await audit("vote.cast.quadratic", vote, body.residentDid);
  return vote;
});

app.get("/audit", async () => prisma.auditEvent.findMany({ orderBy: { createdAt: "asc" } }));

const port = Number(process.env.API_PORT ?? 4000);
app.listen({ port, host: "0.0.0.0" });

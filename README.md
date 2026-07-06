# HODG MVP — Home Owners Decentralized Governance

HODG turns HOA documents, homeowner concerns, contractor bids, market data, and governance votes into a transparent resident-owned decision system.

## MVP Promise
1. Upload HOA / CC&R / board meeting text.
2. AI extracts rules, restrictions, risks, and homeowner-impact claims.
3. Residents create proposals.
4. Policy Gate checks privacy, legality-risk flags, and high-impact actions.
5. Members vote using quadratic voting credits.
6. Audit ledger records all proposal/vote/service events.

## Fast Start

```bash
cp .env.example .env
docker compose up --build
```

Open:
- Web UI: http://localhost:5173
- API: http://localhost:4000/health
- AI Service: http://localhost:8000/health

## MVP Modules
- `apps/web` — React/Vite resident dashboard.
- `apps/api` — Fastify TypeScript API.
- `apps/ai-service` — FastAPI document analysis service.
- `packages/shared` — shared TypeScript types.
- `packages/policy-gate` — Guardian-style Audit-Before-Execute checks.
- `packages/db` — Prisma schema for Postgres.
- `sample-data` — test HOA/decentralized governance data.

## HODG Guardrails
- No binding legal advice from AI.
- No irreversible treasury or contract action without human approval.
- Private owner identity is isolated from public proposal analytics.
- Sensitive data is redacted before AI analysis.
- All high-impact actions require audit log + approval status.

# HODG AI-Leveraged MVP Plan

## User Intent
Build a fast MVP for Home Owners Decentralized Governance that combines and analyzes HOA/research data, then converts it into homeowner-friendly governance workflows.

## MVP Outcome
A working local-first prototype where a resident can:
1. Upload or paste governing documents.
2. Get AI summaries of restrictions, recurring issues, financial claims, and recommended proposal language.
3. Create a proposal.
4. Run the proposal through Policy Gate.
5. Vote with quadratic voting credits.
6. See an audit trail and service/contractor task board.

## Data to Combine
- HOA CC&Rs, bylaws, meeting minutes, notices, budgets.
- Homeowner complaints, request history, violation patterns.
- Contractor bids, service history, ratings, insurance/certification metadata.
- Property value comparisons and neighborhood market data.
- Local ordinance / zoning references.
- DAO governance events, votes, proposals, treasury records.

## AI Build Leverage
Use AI as the compression and translation layer, not as the final authority.

### AI Agents
- Document Distiller: extracts rules, restrictions, deadlines, fee clauses.
- Value Claim Auditor: flags unsupported “property value” claims.
- Proposal Drafter: converts homeowner intent into plain-language proposals.
- Legal-Risk Spotter: flags topics requiring attorney review.
- Contractor Matcher: ranks bids using transparent scoring.
- Meeting Summarizer: converts board/community meetings into action items.

## Architecture
- Web App: resident dashboard.
- API: proposal/vote/document/audit routes.
- AI Service: text extraction + structured JSON analysis.
- Policy Gate: Guardian-style checks before execution.
- Postgres: durable relational data.
- Redis: hot cache and job queue placeholder.
- Audit Ledger: append-only events table in MVP; Holochain/source-chain later.

## 24–48 Hour Build Sequence
### Day 1
- Run monorepo locally with Docker.
- Load sample decentralized HOA research document.
- Confirm AI analyzer returns structured JSON.
- Create proposal and vote routes.
- Save audit events for every state-changing action.

### Day 2
- Add resident dashboard.
- Add quadratic voting calculator.
- Add contractor marketplace mock data.
- Add exportable community briefing report.
- Deploy to Render/Fly/Railway or a single VPS using Docker Compose.

## Deployment Path
### Fastest Demo
Docker Compose on local machine or VPS.

### Slightly Cleaner
- Web: Vercel/Netlify.
- API + AI: Render/Fly.io.
- DB: Neon/Supabase Postgres.
- Redis: Upstash.

### Later Production
- Replace mock auth with DID/wallet auth.
- Replace MVP audit events with Holochain source chains.
- Add ZK eligibility proof for private voting.
- Add multisig treasury.
- Add legal entity bridge for real property/common-area assets.

## Safety Rules
- AI never issues binding legal advice.
- AI never executes treasury payments.
- Identity and vote content remain separated.
- High-impact actions require human consent and audit log.

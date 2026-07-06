import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { FileText, Gavel, ShieldCheck, Vote } from "lucide-react";
import "./style.css";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

function quadraticCost(votes: number) { return votes * votes; }

function App() {
  const [title, setTitle] = useState("Sample HOA CC&R Upload");
  const [text, setText] = useState("Paste HOA bylaws, CC&Rs, meeting minutes, contractor bids, fines, dues, voting rules, owner rights, or the HODG research agenda here.");
  const [documentResult, setDocumentResult] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [selectedProposalId, setSelectedProposalId] = useState("");
  const [votes, setVotes] = useState(1);
  const [audit, setAudit] = useState<any[]>([]);

  async function uploadAndExtract() {
    const res = await fetch(`${API}/documents/upload`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, text, actorDid: "did:hodg:demo-resident" })
    });
    setDocumentResult(await res.json());
  }

  async function createAiDrafts() {
    if (!documentResult?.document?.id) return;
    const res = await fetch(`${API}/proposals/ai-drafts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        documentId: documentResult.document.id,
        actorDid: "did:hodg:demo-resident",
        gate: { planarIsolation: true, humanConsent: true, guardianVeto: true }
      })
    });
    const drafts = await res.json();
    setProposals(drafts);
    setSelectedProposalId(drafts[0]?.id ?? "");
  }

  async function castVote() {
    await fetch(`${API}/votes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ proposalId: selectedProposalId, residentDid: "did:hodg:demo-resident", votes })
    });
    await loadAudit();
  }

  async function loadAudit() {
    const res = await fetch(`${API}/audit`);
    setAudit(await res.json());
  }

  return <main>
    <section className="hero">
      <h1>HODG MVP</h1>
      <p>Upload HOA documents, extract governance facts, draft proposals, run Policy Gate, vote quadratically, and write immutable audit events.</p>
    </section>

    <section className="grid">
      <div className="card">
        <FileText />
        <h2>1. Upload and Extract</h2>
        <input value={title} onChange={e => setTitle(e.target.value)} />
        <textarea value={text} onChange={e => setText(e.target.value)} />
        <button onClick={uploadAndExtract}>Upload HOA / CC&R</button>
      </div>

      <div className="card">
        <ShieldCheck />
        <h2>2. Policy Gate</h2>
        <p>Planar Isolation, Human Consent, and Guardian VETO are explicit gate inputs on every proposal draft.</p>
        <button disabled={!documentResult} onClick={createAiDrafts}>Generate Gated AI Drafts</button>
      </div>

      <div className="card">
        <Vote />
        <h2>3. Quadratic Voting</h2>
        <select value={selectedProposalId} onChange={e => setSelectedProposalId(e.target.value)}>
          <option value="">Select proposal</option>
          {proposals.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <input type="range" min="1" max="10" value={votes} onChange={e => setVotes(Number(e.target.value))} />
        <p>{votes} votes costs {quadraticCost(votes)} credits.</p>
        <button disabled={!selectedProposalId} onClick={castVote}>Cast Vote</button>
      </div>

      <div className="card">
        <Gavel />
        <h2>4. Audit Ledger</h2>
        <p>Each upload, gated draft, and vote is stored with payload, previous, and event hashes.</p>
        <button onClick={loadAudit}>Refresh Audit</button>
      </div>
    </section>

    {documentResult && <section className="panel">
      <h2>Extracted Facts Stored in Postgres</h2>
      <div className="facts">
        {documentResult.document.facts.map((fact: any) => <article key={fact.id} className="fact">
          <strong>{fact.category.replace("_", " ")}</strong>
          <span>{fact.label}</span>
          <small>{fact.evidence}</small>
        </article>)}
      </div>
    </section>}

    {proposals.length > 0 && <section className="panel">
      <h2>AI Proposal Drafts After Policy Gate</h2>
      <div className="proposal-list">
        {proposals.map(proposal => <article key={proposal.id} className="proposal">
          <h3>{proposal.title}</h3>
          <p>{proposal.body}</p>
          <code>{proposal.status}</code>
          <small>Approvals: {(proposal.requiredApprovals ?? []).join(", ") || "none"}</small>
        </article>)}
      </div>
    </section>}

    {audit.length > 0 && <section className="panel">
      <h2>Immutable Audit Events</h2>
      <pre>{JSON.stringify(audit.slice(-5), null, 2)}</pre>
    </section>}
  </main>;
}

createRoot(document.getElementById("root")!).render(<App />);

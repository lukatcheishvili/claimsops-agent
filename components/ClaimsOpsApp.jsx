"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileText,
  GitBranch,
  LayoutDashboard,
  MessageSquare,
  Play,
  RefreshCw,
  Send,
  ShieldCheck
} from "lucide-react";

import {
  analyzeClaim,
  availableDocs,
  blankClaim,
  claimLabel,
  dashboardRows,
  insuranceLines,
  sampleClaims
} from "@/lib/claimsEngine";

const tabs = [
  { id: "submit", label: "Submit Claim", icon: FileText },
  { id: "review", label: "Agent Review", icon: ShieldCheck },
  { id: "communications", label: "Communications", icon: MessageSquare },
  { id: "dashboard", label: "Operations Dashboard", icon: LayoutDashboard },
  { id: "architecture", label: "Architecture", icon: GitBranch },
  { id: "prompts", label: "Prompt Pack", icon: ClipboardList }
];

export default function ClaimsOpsApp({ promptPack, skillContract }) {
  const [activeTab, setActiveTab] = useState("submit");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [submittedClaim, setSubmittedClaim] = useState(sampleClaims[0]);
  const [draft, setDraft] = useState(sampleClaims[0]);
  const [workflowNote, setWorkflowNote] = useState("Default mode: deterministic demo workflow.");
  const analysis = useMemo(() => analyzeClaim(submittedClaim), [submittedClaim]);

  function loadSelectedClaim() {
    const sample = sampleClaims[selectedIndex];
    setDraft(sample);
    setSubmittedClaim(sample);
    setWorkflowNote("Loaded sample claim and refreshed deterministic analysis.");
    setActiveTab("review");
  }

  function startNewClaim() {
    const next = blankClaim();
    setDraft(next);
    setSubmittedClaim(next);
    setWorkflowNote("Started a blank claim draft.");
    setActiveTab("submit");
  }

  function runWorkflow(event) {
    event.preventDefault();
    setSubmittedClaim(draft);
    setWorkflowNote("ClaimsOps Agent workflow completed with deterministic tools.");
    setActiveTab("review");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="ClaimsOps controls">
        <div className="sidebar-header">
          <span className="brand-mark">CO</span>
          <div>
            <h1>ClaimsOps Agent</h1>
            <p>Vercel MVP</p>
          </div>
        </div>

        <label className="field-label" htmlFor="sample-claim">
          Load Sample Claim
        </label>
        <select
          id="sample-claim"
          value={selectedIndex}
          onChange={(event) => setSelectedIndex(Number(event.target.value))}
        >
          {sampleClaims.map((claim, index) => (
            <option key={claim.claim_id} value={index}>
              {claimLabel(claim)}
            </option>
          ))}
        </select>

        <div className="sidebar-actions">
          <button type="button" className="button secondary" onClick={loadSelectedClaim}>
            <RefreshCw aria-hidden="true" size={16} />
            Load Selected Claim
          </button>
          <button type="button" className="button ghost" onClick={startNewClaim}>
            <FileText aria-hidden="true" size={16} />
            New Claim
          </button>
        </div>

        <div className="sidebar-status">
          <p className="section-label">CrewAI / Vertex AI</p>
          <StatusRow label="Runtime" value="Vercel Next.js" />
          <StatusRow label="Live Mode" value="Deterministic Demo" />
          <StatusRow label="Vertex Project" value="agenticai-500006" code />
          <StatusRow label="Location" value="us-central1" code />
          <StatusRow label="Model" value="gemini/gemini-2.0-flash" code />
          <p className="muted">{workflowNote}</p>
        </div>
      </aside>

      <main className="main" id="main-content">
        <Hero analysis={analysis} />
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <section className="tab-panel" aria-live="polite">
          {activeTab === "submit" && (
            <SubmitClaimForm draft={draft} setDraft={setDraft} runWorkflow={runWorkflow} />
          )}
          {activeTab === "review" && <AgentReview analysis={analysis} />}
          {activeTab === "communications" && <Communications analysis={analysis} />}
          {activeTab === "dashboard" && <OperationsDashboard />}
          {activeTab === "architecture" && <Architecture />}
          {activeTab === "prompts" && (
            <PromptPack promptPack={promptPack} skillContract={skillContract} />
          )}
        </section>
      </main>
    </div>
  );
}

function StatusRow({ label, value, code = false }) {
  return (
    <div className="status-row">
      <span>{label}</span>
      {code ? <code translate="no">{value}</code> : <strong>{value}</strong>}
    </div>
  );
}

function Hero({ analysis }) {
  const { claim, risk, recommendation } = analysis;
  return (
    <header className="hero">
      <div className="hero-copy">
        <p className="eyebrow">ClaimsOps Agent / Insurance Operations</p>
        <h2>Claims triage on a live operations canvas.</h2>
        <p>
          A multi-agent workflow for intake, coverage, evidence review, risk routing,
          and customer communication across insurance lines.
        </p>
        <div className="pill-row">
          <span className="pill primary">Human Approval Gate</span>
          <span className="pill">CrewAI Ready</span>
          <span className="pill">Vertex AI Optional</span>
        </div>
      </div>
      <div className="spotlight" aria-label="Active claim summary">
        <span>Active Claim</span>
        <div>
          <strong>{risk.score}/100</strong>
          <p>
            {claim.claim_id} - {claim.insurance_type} - {risk.severity} Severity
          </p>
        </div>
        <p>{recommendation.action}</p>
      </div>
    </header>
  );
}

function Tabs({ activeTab, setActiveTab }) {
  return (
    <nav className="tabs" aria-label="ClaimsOps views">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "active" : ""}
            aria-current={activeTab === tab.id ? "page" : undefined}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon aria-hidden="true" size={16} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

function SubmitClaimForm({ draft, setDraft, runWorkflow }) {
  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function toggleDocument(doc) {
    setDraft((current) => {
      const submitted = new Set(current.documents || []);
      if (submitted.has(doc)) submitted.delete(doc);
      else submitted.add(doc);
      return { ...current, documents: Array.from(submitted).sort() };
    });
  }

  return (
    <form className="form-grid" onSubmit={runWorkflow}>
      <div className="form-section">
        <h3>Claim Intake</h3>
        <TextField label="Claim ID" value={draft.claim_id} onChange={(value) => updateField("claim_id", value)} />
        <TextField
          label="Customer Name"
          value={draft.customer_name}
          onChange={(value) => updateField("customer_name", value)}
        />
        <TextField label="Policy ID" value={draft.policy_id} onChange={(value) => updateField("policy_id", value)} />
        <label className="field-label" htmlFor="insurance-line">
          Insurance Line
        </label>
        <select
          id="insurance-line"
          value={draft.insurance_type}
          onChange={(event) => updateField("insurance_type", event.target.value)}
        >
          {insuranceLines.map((line) => (
            <option key={line} value={line}>
              {line}
            </option>
          ))}
        </select>
        <TextField
          label="Incident Location"
          value={draft.location}
          onChange={(value) => updateField("location", value)}
        />
      </div>

      <div className="form-section">
        <h3>Incident Detail</h3>
        <TextField
          label="Incident Date"
          type="date"
          value={draft.incident_date}
          onChange={(value) => updateField("incident_date", value)}
        />
        <TextField
          label="Reported Date"
          type="date"
          value={draft.reported_date}
          onChange={(value) => updateField("reported_date", value)}
        />
        <TextField
          label="Estimated Claim Amount"
          type="number"
          min="0"
          step="500"
          value={draft.claim_amount}
          onChange={(value) => updateField("claim_amount", Number(value || 0))}
        />
        <label className="field-label" htmlFor="claim-description">
          Claim Description
        </label>
        <textarea
          id="claim-description"
          value={draft.description}
          onChange={(event) => updateField("description", event.target.value)}
          rows={5}
        />
      </div>

      <fieldset className="document-grid">
        <legend>Submitted Evidence</legend>
        {availableDocs.map((doc) => (
          <label key={doc} className="checkbox-row">
            <input
              type="checkbox"
              checked={(draft.documents || []).includes(doc)}
              onChange={() => toggleDocument(doc)}
            />
            <span>{doc}</span>
          </label>
        ))}
      </fieldset>

      <button type="submit" className="button primary wide">
        <Play aria-hidden="true" size={17} />
        Run ClaimsOps Agent Workflow
      </button>
    </form>
  );
}

function TextField({ label, value, onChange, type = "text", ...props }) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        {...props}
      />
    </>
  );
}

function AgentReview({ analysis }) {
  const { claim, coverage, evidence, risk, recommendation } = analysis;
  const evidencePercent = Math.round(evidence.completion * 100);

  return (
    <div className="stack">
      <div className="metrics">
        <Metric label="Risk Score" value={`${risk.score}/100`} />
        <Metric label="Severity" value={risk.severity} />
        <Metric label="Evidence Complete" value={`${evidencePercent}%`} />
        <Metric label="Coverage" value={coverage.covered ? "Yes" : "Review"} />
        <Metric label="SLA" value={recommendation.sla} />
      </div>

      <p className="summary-line">
        <strong>{claim.claim_id}</strong> for <strong>{claim.customer_name}</strong> is triaged as{" "}
        <SeverityPill severity={risk.severity} />.
      </p>

      <div className="action-panel">
        <span>Recommended Next Action</span>
        <strong>{recommendation.action}</strong>
      </div>

      <div className="two-column">
        <section className="panel">
          <h3>Routing</h3>
          <p><strong>Owner:</strong> {recommendation.owner}</p>
          <p><strong>Human Approval Gate:</strong> {recommendation.human_gate}</p>
          <h3>Coverage Check</h3>
          <p>{coverage.reason}</p>
          {coverage.deductible !== null && (
            <>
              <p><strong>Deductible:</strong> EUR {numberFormat(coverage.deductible)}</p>
              <p><strong>Claim Limit:</strong> EUR {numberFormat(coverage.limit)}</p>
            </>
          )}
          {!!coverage.exclusions.length && (
            <p><strong>Exclusions:</strong> {coverage.exclusions.join(", ")}</p>
          )}
        </section>

        <section className="panel">
          <h3>Evidence Checklist</h3>
          {evidence.missing.length ? (
            <div className="alert warning">
              <AlertTriangle aria-hidden="true" size={17} />
              Missing documents: {evidence.missing.join(", ")}
            </div>
          ) : (
            <div className="alert success">
              <CheckCircle2 aria-hidden="true" size={17} />
              All required documents are present.
            </div>
          )}
          <p><strong>Submitted:</strong> {evidence.submitted.join(", ") || "None"}</p>
          <h3>Risk Signals</h3>
          <ul className="signal-list">
            {risk.signals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel">
        <h3>Agent Trace</h3>
        <div className="trace-list">
          {analysis.trace.map((step, index) => (
            <details key={`${step.agent}-${step.tool_used}`} open={index === 0}>
              <summary>{index + 1}. {step.agent} - {step.tool_used}</summary>
              <p><strong>Decision:</strong> {step.decision}</p>
              <p><strong>Observation:</strong> {step.observation}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SeverityPill({ severity }) {
  return <span className={`severity ${severity.toLowerCase()}`}>{severity}</span>;
}

function Communications({ analysis }) {
  return (
    <div className="stack">
      <div className="two-column">
        <section className="panel">
          <h3>Customer Update Draft</h3>
          <textarea readOnly value={analysis.communications.customer_message} rows={8} />
        </section>
        <section className="panel">
          <h3>Adjuster Note Draft</h3>
          <textarea readOnly value={analysis.communications.adjuster_note} rows={8} />
        </section>
      </div>
      <div className="button-row">
        <button type="button" className="button secondary">
          <CheckCircle2 aria-hidden="true" size={17} />
          Approve Next Action
        </button>
        <button type="button" className="button secondary">
          <Send aria-hidden="true" size={17} />
          Request More Evidence
        </button>
        <button type="button" className="button secondary">
          <AlertTriangle aria-hidden="true" size={17} />
          Escalate Manually
        </button>
      </div>
      <p className="muted">Workflow actions remain gated by adjuster approval.</p>
    </div>
  );
}

function OperationsDashboard() {
  const rows = dashboardRows();
  const severityCounts = groupCount(rows, "severity");
  const lineCounts = groupCount(rows, "line");

  return (
    <div className="stack">
      <section className="panel">
        <h3>Claims Operations Queue</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Claim</th>
                <th>Customer</th>
                <th>Line</th>
                <th>Amount</th>
                <th>Severity</th>
                <th>Risk Score</th>
                <th>Next Action</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.claim}>
                  <td>{row.claim}</td>
                  <td>{row.customer}</td>
                  <td>{row.line}</td>
                  <td>EUR {numberFormat(row.amount)}</td>
                  <td><SeverityPill severity={row.severity} /></td>
                  <td>{row.riskScore}/100</td>
                  <td>{row.nextAction}</td>
                  <td>{row.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="two-column">
        <BarChart title="Severity Mix" data={severityCounts} />
        <BarChart title="Claims By Insurance Line" data={lineCounts} />
      </div>
    </div>
  );
}

function BarChart({ title, data }) {
  const max = Math.max(...data.map((item) => item.count), 1);
  return (
    <section className="panel">
      <h3>{title}</h3>
      <div className="bars">
        {data.map((item) => (
          <div className="bar-row" key={item.label}>
            <span>{item.label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(item.count / max) * 100}%` }} />
            </div>
            <strong>{item.count}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function Architecture() {
  const nodes = [
    "Claims Intake Agent",
    "Coverage Verification Agent",
    "Evidence Review Agent",
    "Risk & Fraud Triage Agent",
    "Communication Agent"
  ];

  return (
    <div className="stack">
      <section className="architecture panel">
        <h3>Agentic Architecture</h3>
        <div className="architecture-grid">
          <div className="node-list">
            {nodes.map((node) => (
              <div className="arch-node" key={node}>{node}</div>
            ))}
          </div>
          <div className="arch-node supervisor">Supervisor Agent</div>
          <div className="node-list">
            <div className="arch-node tools">Tools: policy lookup, history, checklist, risk rules, drafts</div>
            <div className="arch-node human">Human Adjuster Approval</div>
          </div>
        </div>
      </section>
      <p>
        The supervisor agent decides which specialist agent and tool to call. Tools execute lookups,
        scoring, and drafting; the agent chooses the next action. Final approval remains with a human adjuster.
      </p>
    </div>
  );
}

function PromptPack({ promptPack, skillContract }) {
  return (
    <div className="two-column docs-grid">
      <section className="panel">
        <h3>Prompt And Tool Pack</h3>
        <pre>{promptPack}</pre>
      </section>
      <section className="panel">
        <h3>Agent Skill Contract</h3>
        <pre>{skillContract}</pre>
      </section>
    </div>
  );
}

function groupCount(rows, key) {
  const counts = new Map();
  rows.forEach((row) => counts.set(row[key], (counts.get(row[key]) || 0) + 1));
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
}

function numberFormat(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

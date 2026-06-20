"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GitBranch,
  LayoutDashboard,
  MessageSquare,
  Play,
  RefreshCw,
  Route,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis
} from "recharts";

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

const chartColors = {
  high: "#ff5577",
  medium: "#ff7a3d",
  low: "#22c55e",
  blue: "#0099ff",
  magenta: "#d44df0",
  violet: "#6a4cf5",
  orange: "#ff7a3d",
  coral: "#ff5577",
  success: "#22c55e",
  surface: "#141414",
  muted: "#999999",
  ink: "#ffffff"
};

export default function ClaimsOpsApp({ promptPack, skillContract }) {
  const [activeTab, setActiveTab] = useState("submit");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [submittedClaim, setSubmittedClaim] = useState(sampleClaims[0]);
  const [draft, setDraft] = useState(sampleClaims[0]);
  const [approvalState, setApprovalState] = useState("Pending Adjuster Review");
  const [workflowNote, setWorkflowNote] = useState("Default mode: deterministic demo workflow.");
  const analysis = useMemo(() => analyzeClaim(submittedClaim), [submittedClaim]);
  const selectedSample = sampleClaims[selectedIndex];

  function loadSelectedClaim() {
    const sample = sampleClaims[selectedIndex];
    setDraft(sample);
    setSubmittedClaim(sample);
    setApprovalState("Pending Adjuster Review");
    setWorkflowNote("Loaded sample claim and refreshed deterministic analysis.");
    setActiveTab("review");
  }

  function startNewClaim() {
    const next = blankClaim();
    setDraft(next);
    setSubmittedClaim(next);
    setApprovalState("Pending Intake");
    setWorkflowNote("Started a blank claim draft.");
    setActiveTab("submit");
  }

  function runWorkflow(event) {
    event.preventDefault();
    setSubmittedClaim(draft);
    setApprovalState("Pending Adjuster Review");
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
          className="sample-select"
          value={selectedIndex}
          title={claimLabel(selectedSample)}
          onChange={(event) => setSelectedIndex(Number(event.target.value))}
        >
          {sampleClaims.map((claim, index) => (
            <option key={claim.claim_id} value={index}>
              {claimLabel(claim)}
            </option>
          ))}
        </select>

        <div className="selected-claim-card">
          <span>{selectedSample.insurance_type}</span>
          <strong>{selectedSample.claim_id}</strong>
          <p>{selectedSample.customer_name}</p>
        </div>

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
          <StatusRow label="Workflow" value="Deterministic Agent Tools" />
          <StatusRow label="Human Gate" value={approvalState} />
          <StatusRow label="Vertex Project" value="agenticai-500006" code />
          <StatusRow label="Location" value="us-central1" code />
          <StatusRow label="Model" value="gemini/gemini-2.0-flash" code />
          <p className="muted">{workflowNote}</p>
        </div>
      </aside>

      <main className="main" id="main-content">
        <Hero analysis={analysis} setActiveTab={setActiveTab} />
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <section className="tab-panel" aria-live="polite">
          {activeTab === "submit" && (
            <SubmitClaimForm draft={draft} setDraft={setDraft} runWorkflow={runWorkflow} />
          )}
          {activeTab === "review" && (
            <AgentReview analysis={analysis} approvalState={approvalState} />
          )}
          {activeTab === "communications" && (
            <Communications
              analysis={analysis}
              approvalState={approvalState}
              setApprovalState={setApprovalState}
            />
          )}
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

function Hero({ analysis, setActiveTab }) {
  const { claim, coverage, evidence, risk, recommendation } = analysis;
  const evidencePercent = Math.round(evidence.completion * 100);
  const scoreAngle = `${risk.score * 3.6}deg`;

  return (
    <header className="hero">
      <div className="hero-copy">
        <p className="eyebrow">ClaimsOps Agent / Insurance Operations</p>
        <h2>Claims triage on a live operations canvas.</h2>
        <p>
          A multi-agent workflow for intake, coverage, evidence review, risk routing,
          and customer communication across insurance lines.
        </p>
        <CapabilityStrip setActiveTab={setActiveTab} />
      </div>
      <div className="spotlight" aria-label="Active claim summary">
        <div className="spotlight-top">
          <span className="spotlight-label">Active Claim</span>
          <SeverityPill severity={risk.severity} />
        </div>

        <div className="spotlight-main">
          <div className="spotlight-score" style={{ "--score-angle": scoreAngle }}>
            <strong>{risk.score}</strong>
            <span>/100</span>
          </div>
          <div className="spotlight-claim">
            <span>{claim.claim_id}</span>
            <strong>{claim.insurance_type} claim</strong>
            <p>{claim.customer_name}</p>
            <small>EUR {numberFormat(claim.claim_amount)} estimated exposure</small>
          </div>
        </div>

        <div className="spotlight-kpis">
          <div>
            <span>Coverage</span>
            <strong>{coverage.covered ? "Clear" : "Review"}</strong>
          </div>
          <div>
            <span>Evidence</span>
            <strong>{evidencePercent}%</strong>
          </div>
          <div>
            <span>SLA</span>
            <strong>{recommendation.sla}</strong>
          </div>
          <div>
            <span>Owner</span>
            <strong>{recommendation.owner}</strong>
          </div>
        </div>

        <div className="spotlight-action">
          <span>Recommended Action</span>
          <p>{recommendation.action}</p>
        </div>
      </div>
    </header>
  );
}

function CapabilityStrip({ setActiveTab }) {
  const items = [
    {
      icon: UserCheck,
      title: "Human Approval Gate",
      status: "Active",
      body: "Recommendations stop before denial, settlement, payment, or fraud escalation.",
      action: "Review Controls",
      tab: "communications"
    },
    {
      icon: GitBranch,
      title: "CrewAI Workflow",
      status: "Python path ready",
      body: "The Streamlit app can run CrewAI live mode; this Vercel replica mirrors the same deterministic logic.",
      action: "View Flow",
      tab: "architecture"
    },
    {
      icon: Sparkles,
      title: "Vertex AI Optional",
      status: "Configurable",
      body: "Project settings are documented; a Vercel API route can be connected when credentials are added.",
      action: "See Prompt Pack",
      tab: "prompts"
    }
  ];

  return (
    <div className="capability-grid" aria-label="Workflow capability status">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            type="button"
            key={item.title}
            className="capability-card"
            onClick={() => setActiveTab(item.tab)}
          >
            <span className="capability-icon"><Icon aria-hidden="true" size={17} /></span>
            <span className="capability-copy">
              <strong>{item.title}</strong>
              <small>{item.status}</small>
              <em>{item.body}</em>
            </span>
            <span className="capability-action">{item.action}</span>
          </button>
        );
      })}
    </div>
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
        <AmountField
          value={draft.claim_amount}
          onChange={(value) => updateField("claim_amount", value)}
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
        <legend>
          Submitted Evidence
          <span>Select the documents currently available for review.</span>
        </legend>
        {availableDocs.map((doc) => (
          <label key={doc} className="checkbox-row">
            <input
              type="checkbox"
              checked={(draft.documents || []).includes(doc)}
              onChange={() => toggleDocument(doc)}
            />
            <span>{formatDocLabel(doc)}</span>
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

function AmountField({ value, onChange }) {
  const displayValue = value === 0 || value === "0" ? "" : String(value ?? "");
  return (
    <>
      <label className="field-label" htmlFor="estimated-claim-amount">
        Estimated Claim Amount
      </label>
      <div className="amount-input">
        <span>EUR</span>
        <input
          id="estimated-claim-amount"
          name="estimated-claim-amount"
          type="text"
          inputMode="numeric"
          value={displayValue}
          placeholder="0"
          onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, ""))}
          autoComplete="off"
        />
      </div>
    </>
  );
}

function AgentReview({ analysis, approvalState }) {
  const { claim, coverage, evidence, risk, recommendation, history } = analysis;
  const evidencePercent = Math.round(evidence.completion * 100);
  const topDrivers = [...risk.contributions]
    .filter((item) => item.impact !== 12)
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 4);

  return (
    <div className="stack">
      <div className="metrics expanded">
        <Metric label="Risk Score" value={`${risk.score}/100`} detail={`${risk.severity} severity`} />
        <Metric label="Evidence" value={`${evidencePercent}%`} detail={`${evidence.missing.length} missing`} />
        <Metric label="Coverage" value={coverage.covered ? "Clear" : "Review"} detail={coverage.status.replace("_", " ")} />
        <Metric label="Human Gate" value={approvalState} detail={recommendation.human_gate} />
        <Metric label="SLA" value={recommendation.sla} detail={recommendation.owner} />
      </div>

      <section className="decision-brief">
        <div>
          <span className="section-label">Plain-English Decision</span>
          <h3>{claim.claim_id} should go to {recommendation.owner}.</h3>
          <p>
            The workflow recommends <strong>{recommendation.action.toLowerCase()}</strong>. It reached that conclusion by
            combining policy coverage, document readiness, claim history, the claim amount, reporting timing,
            and risk words found in the claim description.
          </p>
          <p>{recommendation.rationale}</p>
        </div>
        <div className="decision-score">
          <span>Confidence Signal</span>
          <strong>{risk.score}</strong>
          <SeverityPill severity={risk.severity} />
        </div>
      </section>

      <div className="three-column">
        <ReasonCard
          icon={ShieldCheck}
          title="Coverage Logic"
          status={coverage.covered ? "Coverage is initially clear" : "Manual coverage review required"}
          body={coverage.reason}
        />
        <ReasonCard
          icon={ClipboardCheck}
          title="Evidence Logic"
          status={`${evidencePercent}% evidence readiness`}
          body={
            evidence.missing.length
              ? `Missing: ${evidence.missing.map(formatDocLabel).join(", ")}. The workflow pauses settlement review until these are received.`
              : "All required evidence for this insurance line is available for initial review."
          }
        />
        <ReasonCard
          icon={Activity}
          title="History And Urgency"
          status={risk.urgency}
          body={
            history.length
              ? `${history.length} prior claim${history.length === 1 ? "" : "s"} were found for this policy, so routing includes history context.`
              : "No prior claims were found for this policy in the demo history dataset."
          }
        />
      </div>

      <section className="panel">
        <h3>Risk Score Drivers</h3>
        <p className="panel-intro">
          The score is additive: each signal adds or subtracts points, then the final score is capped between 0 and 100.
          These are the signals that most influenced the current recommendation.
        </p>
        <div className="driver-grid">
          {topDrivers.map((driver) => (
            <div className={`driver-card ${driver.tone}`} key={driver.label}>
              <span>{driver.impact > 0 ? `+${driver.impact}` : driver.impact}</span>
              <strong>{driver.label}</strong>
              <p>{driver.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="two-column">
        <section className="panel">
          <h3>Routing Package</h3>
          <dl className="detail-list">
            <div><dt>Owner</dt><dd>{recommendation.owner}</dd></div>
            <div><dt>Human Approval Gate</dt><dd>{recommendation.human_gate}</dd></div>
            <div><dt>SLA</dt><dd>{recommendation.sla}</dd></div>
            <div><dt>Coverage Exclusions</dt><dd>{coverage.exclusions.length ? coverage.exclusions.join(", ") : "No exclusion flagged in demo data"}</dd></div>
            {coverage.deductible !== null && (
              <>
                <div><dt>Deductible</dt><dd>EUR {numberFormat(coverage.deductible)}</dd></div>
                <div><dt>Claim Limit</dt><dd>EUR {numberFormat(coverage.limit)}</dd></div>
              </>
            )}
          </dl>
        </section>

        <section className="panel">
          <h3>Risk Signals</h3>
          <ul className="signal-list">
            {risk.signals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel">
        <h3>Agent Reasoning Trace</h3>
        <p className="panel-intro">
          This is the audit trail. Each specialist agent contributes one decision, one observation, and one tool result
          before the supervisor chooses the recommended route.
        </p>
        <div className="trace-timeline">
          {analysis.trace.map((step, index) => (
            <article key={`${step.agent}-${step.tool_used}`} className="trace-step">
              <span>{index + 1}</span>
              <div>
                <strong>{step.agent}</strong>
                <p>{step.decision}</p>
                <small>{step.observation}</small>
                <code>{step.tool_used}</code>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReasonCard({ icon: Icon, title, status, body }) {
  return (
    <section className="reason-card">
      <Icon aria-hidden="true" size={19} />
      <span>{title}</span>
      <strong>{status}</strong>
      <p>{body}</p>
    </section>
  );
}

function Metric({ label, value, detail }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}

function SeverityPill({ severity }) {
  return <span className={`severity ${severity.toLowerCase()}`}>{severity}</span>;
}

function Communications({ analysis, approvalState, setApprovalState }) {
  return (
    <div className="stack">
      <section className="approval-console">
        <div>
          <span className="section-label">Human Approval Gate</span>
          <h3>{approvalState}</h3>
          <p>
            These controls simulate the adjuster checkpoint. The agent can recommend a route and draft messages,
            but human approval remains required before customer decisions, denial, settlement, payment, or escalation.
          </p>
        </div>
        <ShieldCheck aria-hidden="true" size={34} />
      </section>

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
        <button type="button" className="button secondary" onClick={() => setApprovalState("Approved For Next Action")}>
          <CheckCircle2 aria-hidden="true" size={17} />
          Approve Next Action
        </button>
        <button type="button" className="button secondary" onClick={() => setApprovalState("Evidence Requested")}>
          <Send aria-hidden="true" size={17} />
          Request More Evidence
        </button>
        <button type="button" className="button secondary" onClick={() => setApprovalState("Manual Escalation Opened")}>
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
  const kpis = getDashboardKpis(rows);
  const severityData = getSeverityData(rows);
  const exposureData = getExposureData(rows);
  const scatterData = rows.map((row) => ({
    ...row,
    z: Math.max(row.amount / 900, 80),
    name: row.claim
  }));
  const radarData = rows.map((row) => ({
    claim: row.claim.replace("CLM-2026-", ""),
    evidence: row.evidenceCompletion,
    risk: row.riskScore,
    coverage: row.covered ? 100 : 45
  }));
  const ownerData = getOwnerData(rows);

  return (
    <div className="stack dashboard-stack">
      <div className="metrics dashboard-kpis">
        <Metric label="Open Claims" value={kpis.totalClaims} detail="Demo operations queue" />
        <Metric label="Total Exposure" value={`EUR ${numberFormat(kpis.totalExposure)}`} detail="Claimed amount" />
        <Metric label="Avg Risk" value={`${kpis.avgRisk}/100`} detail="Queue risk score" />
        <Metric label="Manual Review" value={`${kpis.manualReviewRate}%`} detail="Coverage or high-risk route" />
        <Metric label="Evidence Ready" value={`${kpis.avgEvidence}%`} detail="Average completeness" />
      </div>

      <div className="dashboard-grid">
        <ChartPanel title="Severity Distribution" subtitle="Claims by triage severity">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={severityData}
                dataKey="value"
                nameKey="name"
                innerRadius={74}
                outerRadius={108}
                paddingAngle={4}
              >
                {severityData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<DarkTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Risk Vs Exposure" subtitle="Bubble size tracks claim amount">
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 18, right: 18, bottom: 12, left: 0 }}>
              <CartesianGrid stroke="#262626" strokeDasharray="4 4" />
              <XAxis dataKey="amount" name="Amount" tickFormatter={(value) => `${Math.round(value / 1000)}k`} stroke="#999999" />
              <YAxis dataKey="riskScore" name="Risk" stroke="#999999" />
              <ZAxis dataKey="z" range={[90, 640]} />
              <Tooltip content={<DarkTooltip />} cursor={{ strokeDasharray: "4 4" }} />
              <Scatter data={scatterData} fill={chartColors.blue} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Insurance Line Exposure" subtitle="Amount and risk by insurance line">
          <ResponsiveContainer width="100%" height={310}>
            <ComposedChart data={exposureData} margin={{ top: 20, right: 20, bottom: 12, left: 0 }}>
              <defs>
                <linearGradient id="exposureGradient" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor={chartColors.blue} />
                  <stop offset="50%" stopColor={chartColors.magenta} />
                  <stop offset="100%" stopColor={chartColors.orange} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#262626" strokeDasharray="4 4" />
              <XAxis dataKey="line" stroke="#999999" />
              <YAxis yAxisId="left" stroke="#999999" tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
              <YAxis yAxisId="right" orientation="right" stroke="#999999" />
              <Tooltip content={<DarkTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="amount" name="Exposure" fill="url(#exposureGradient)" radius={[6, 6, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="avgRisk" name="Avg Risk" stroke={chartColors.coral} strokeWidth={3} dot />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Evidence Readiness Radar" subtitle="Evidence, coverage, and risk by claim">
          <ResponsiveContainer width="100%" height={310}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#262626" />
              <PolarAngleAxis dataKey="claim" stroke="#999999" />
              <Radar dataKey="evidence" name="Evidence" stroke={chartColors.success} fill={chartColors.success} fillOpacity={0.22} />
              <Radar dataKey="risk" name="Risk" stroke={chartColors.coral} fill={chartColors.coral} fillOpacity={0.18} />
              <Radar dataKey="coverage" name="Coverage" stroke={chartColors.blue} fill={chartColors.blue} fillOpacity={0.16} />
              <Tooltip content={<DarkTooltip />} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Claims Operations Queue</h3>
            <p>Sorted view of risk, exposure, evidence readiness, and current owner.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Claim</th>
                <th>Customer</th>
                <th>Line</th>
                <th>Amount</th>
                <th>Severity</th>
                <th>Risk</th>
                <th>Evidence</th>
                <th>Owner</th>
                <th>Next Action</th>
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
                  <td>{row.evidenceCompletion}%</td>
                  <td>{row.owner}</td>
                  <td>{row.nextAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel owner-panel">
        <h3>Owner Workload</h3>
        <div className="owner-grid">
          {ownerData.map((owner) => (
            <div key={owner.owner} className="owner-card">
              <span>{owner.owner}</span>
              <strong>{owner.count} claim{owner.count === 1 ? "" : "s"}</strong>
              <div className="owner-meter"><i style={{ width: `${owner.avgRisk}%` }} /></div>
              <small>Avg risk {owner.avgRisk}/100</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ChartPanel({ title, subtitle, children }) {
  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  return (
    <div className="chart-tooltip">
      <strong>{item?.claim || item?.name || item?.line || label}</strong>
      {payload.map((entry) => (
        <span key={`${entry.name}-${entry.value}`}>
          {entry.name}: {typeof entry.value === "number" ? numberFormat(entry.value) : entry.value}
        </span>
      ))}
    </div>
  );
}

function Architecture() {
  const specialistNodes = [
    { id: "intake", label: "Claims Intake", detail: "Normalize claim details", x: 52, y: 70 },
    { id: "coverage", label: "Coverage Verification", detail: "Policy, dates, limits", x: 52, y: 174 },
    { id: "evidence", label: "Evidence Review", detail: "Required vs submitted", x: 52, y: 278 },
    { id: "risk", label: "Risk Triage", detail: "Severity and signals", x: 52, y: 382 }
  ];

  return (
    <div className="stack">
      <section className="workflow-panel">
        <div className="panel-heading">
          <div>
            <h3>Agentic Claims Workflow</h3>
            <p>Supervisor-led orchestration with deterministic tools, communication drafts, and human approval.</p>
          </div>
          <span className="figma-badge">Workflow Board</span>
        </div>

        <div className="workflow-canvas" role="img" aria-label="ClaimsOps agent workflow diagram">
          <div className="workflow-board">
            <svg className="workflow-lines" viewBox="0 0 1180 540" aria-hidden="true">
              <defs>
                <linearGradient id="flowGradient" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#0099ff" />
                  <stop offset="52%" stopColor="#d44df0" />
                  <stop offset="100%" stopColor="#ff7a3d" />
                </linearGradient>
                <marker id="arrowHead" markerWidth="9" markerHeight="9" refX="7.2" refY="4.5" orient="auto">
                  <path d="M0 0 L9 4.5 L0 9 Z" fill="#d44df0" />
                </marker>
                <marker id="approvalArrowHead" markerWidth="9" markerHeight="9" refX="7.2" refY="4.5" orient="auto">
                  <path d="M0 0 L9 4.5 L0 9 Z" fill="#22c55e" />
                </marker>
              </defs>
              {specialistNodes.map((node) => (
                <path
                  key={node.id}
                  d={`M304 ${node.y + 36} C 390 ${node.y + 36}, 394 258, 490 258`}
                  stroke="url(#flowGradient)"
                  strokeWidth="2.5"
                  fill="none"
                  markerEnd="url(#arrowHead)"
                />
              ))}
              <path d="M746 258 C 780 258, 784 138, 816 138" stroke="url(#flowGradient)" strokeWidth="2.5" fill="none" markerEnd="url(#arrowHead)" />
              <path d="M746 258 C 782 258, 784 258, 816 258" stroke="url(#flowGradient)" strokeWidth="2.5" fill="none" markerEnd="url(#arrowHead)" />
              <path d="M746 258 C 780 258, 784 378, 816 378" stroke="url(#flowGradient)" strokeWidth="2.5" fill="none" markerEnd="url(#arrowHead)" />
              <path d="M1076 378 C 1116 378, 1112 450, 1146 450" stroke="#22c55e" strokeWidth="2.5" fill="none" markerEnd="url(#approvalArrowHead)" />
            </svg>

            {specialistNodes.map((node, index) => (
              <FlowNode key={node.id} className="specialist" x={node.x} y={node.y} number={index + 1} title={node.label} detail={node.detail} />
            ))}
            <FlowNode className="supervisor" x={498} y={222} number={5} title="Supervisor Agent" detail="Chooses next tool and route" />
            <FlowNode className="tool" x={824} y={102} number={6} title="Tool Layer" detail="Policy, history, checklist, risk rules" />
            <FlowNode className="tool" x={824} y={222} number={7} title="Communication Drafts" detail="Customer update and adjuster note" />
            <FlowNode className="human" x={824} y={342} number={8} title="Human Approval Gate" detail="Adjuster validates final action" />
            <div className="workflow-note" style={{ left: 910, top: 430 }}>
              No final decision is automated.
            </div>
          </div>
        </div>
      </section>

      <div className="three-column">
        <ReasonCard
          icon={Route}
          title="Why This Architecture"
          status="Specialists reduce ambiguity"
          body="Each agent owns one narrow operational question, which makes the final recommendation easier to audit."
        />
        <ReasonCard
          icon={Activity}
          title="Where Tools Fit"
          status="Tools produce facts"
          body="Policy lookup, history, evidence checks, and scoring produce structured facts. The supervisor decides how to route them."
        />
        <ReasonCard
          icon={UserCheck}
          title="Human Control"
          status="Required for final decisions"
          body="The workflow can recommend, draft, and prioritize, but does not approve, deny, settle, pay, or accuse fraud."
        />
      </div>
    </div>
  );
}

function FlowNode({ className, x, y, number, title, detail }) {
  return (
    <div className={`flow-node ${className}`} style={{ left: x, top: y }}>
      <span>{number}</span>
      <strong>{title}</strong>
      <small>{detail}</small>
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

function getDashboardKpis(rows) {
  const totalClaims = rows.length;
  const totalExposure = rows.reduce((sum, row) => sum + row.amount, 0);
  const avgRisk = Math.round(rows.reduce((sum, row) => sum + row.riskScore, 0) / totalClaims);
  const avgEvidence = Math.round(rows.reduce((sum, row) => sum + row.evidenceCompletion, 0) / totalClaims);
  const manualReview = rows.filter((row) => !row.covered || row.severity === "High").length;
  return {
    totalClaims,
    totalExposure,
    avgRisk,
    avgEvidence,
    manualReviewRate: Math.round((manualReview / totalClaims) * 100)
  };
}

function getSeverityData(rows) {
  const counts = groupCount(rows, "severity");
  return counts.map((item) => ({
    name: item.label,
    value: item.count,
    color: item.label === "High" ? chartColors.high : item.label === "Medium" ? chartColors.medium : chartColors.low
  }));
}

function getExposureData(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    const current = grouped.get(row.line) || { line: row.line, amount: 0, riskTotal: 0, count: 0 };
    current.amount += row.amount;
    current.riskTotal += row.riskScore;
    current.count += 1;
    grouped.set(row.line, current);
  });
  return Array.from(grouped.values()).map((item) => ({
    line: item.line,
    amount: item.amount,
    avgRisk: Math.round(item.riskTotal / item.count)
  }));
}

function getOwnerData(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    const current = grouped.get(row.owner) || { owner: row.owner, count: 0, riskTotal: 0 };
    current.count += 1;
    current.riskTotal += row.riskScore;
    grouped.set(row.owner, current);
  });
  return Array.from(grouped.values()).map((item) => ({
    ...item,
    avgRisk: Math.round(item.riskTotal / item.count)
  }));
}

function groupCount(rows, key) {
  const counts = new Map();
  rows.forEach((row) => counts.set(row[key], (counts.get(row[key]) || 0) + 1));
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
}

function formatDocLabel(value) {
  const special = {
    customer_id: "Customer ID",
    beneficiary_id: "Beneficiary ID"
  };
  if (special[value]) return special[value];
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function numberFormat(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

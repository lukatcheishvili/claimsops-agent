"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Download,
  FileText,
  GitBranch,
  LayoutDashboard,
  Maximize2,
  MessageSquare,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  RefreshCw,
  Route,
  Send,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
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
  { id: "agent", label: "Agent Chat", icon: Bot },
  { id: "review", label: "Agent Review", icon: ShieldCheck },
  { id: "communications", label: "Communications", icon: MessageSquare },
  { id: "dashboard", label: "Operations Dashboard", icon: LayoutDashboard },
  { id: "manager", label: "Manager View", icon: Users },
  { id: "architecture", label: "Architecture", icon: GitBranch },
  { id: "prompts", label: "Prompt Pack", icon: ClipboardList }
];

const demoSteps = [
  {
    tab: "submit",
    title: "Submit Or Load A Claim",
    body: "Start with a sample claim or enter a new claim. The intake form controls the facts every agent will use."
  },
  {
    tab: "agent",
    title: "Ask The ClaimsOps Agent",
    body: "Use the chat to ask why the route was chosen, what evidence is missing, or whether the claim can move forward."
  },
  {
    tab: "review",
    title: "Review Agent Reasoning",
    body: "Show the deterministic tool results, Vertex AI live review status, risk drivers, and auditable reasoning trace."
  },
  {
    tab: "communications",
    title: "Use The Human Approval Gate",
    body: "Approve the recommended next action, request more evidence, or escalate manually. Every action is logged."
  },
  {
    tab: "manager",
    title: "Inspect Manager View",
    body: "Switch to queue oversight: high-risk claims, SLA watchlist, evidence blockers, owner load, and approval activity."
  },
  {
    tab: "architecture",
    title: "Explain The Agent Architecture",
    body: "Hover over each workflow box to explain why it exists, its role, and what it produces."
  }
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

const initialVertexState = {
  status: "checking",
  mode: "deterministic",
  enabled: false,
  liveRequested: false,
  hasCredentials: false,
  projectId: "agenticai-500006",
  projectNumber: "808855388233",
  location: "us-central1",
  model: "gemini-2.0-flash",
  message: "Checking Vertex AI runtime configuration...",
  review: null
};

export default function ClaimsOpsApp({ promptPack, skillContract }) {
  const [activeTab, setActiveTab] = useState("submit");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [submittedClaim, setSubmittedClaim] = useState(sampleClaims[0]);
  const [draft, setDraft] = useState(sampleClaims[0]);
  const [approvalState, setApprovalState] = useState("Pending Adjuster Review");
  const [workflowNote, setWorkflowNote] = useState("Default mode: deterministic demo workflow.");
  const [vertexState, setVertexState] = useState(initialVertexState);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [demoActive, setDemoActive] = useState(false);
  const [demoStepIndex, setDemoStepIndex] = useState(0);
  const [approvalLog, setApprovalLog] = useState(() => [
    createApprovalLogEntry("System", "Sample claim loaded for deterministic demo mode.", sampleClaims[0].claim_id)
  ]);
  const [chatMessages, setChatMessages] = useState(() => [
    createChatMessage("assistant", buildAgentGreeting(analyzeClaim(sampleClaims[0])))
  ]);
  const analysis = useMemo(() => analyzeClaim(submittedClaim), [submittedClaim]);
  const selectedSample = sampleClaims[selectedIndex];

  useEffect(() => {
    let active = true;

    async function loadVertexStatus() {
      try {
        const response = await fetch("/api/claimsops/analyze");
        const payload = await response.json();
        if (!active) return;
        const vertex = payload.vertex || {};
        setVertexState((current) => ({
          ...current,
          ...vertex,
          enabled: false,
          status: vertex.liveRequested && vertex.hasCredentials ? "ready" : vertex.liveRequested ? "missing_credentials" : "disabled",
          message: getVertexConfigMessage(vertex)
        }));
      } catch (error) {
        if (!active) return;
        setVertexState((current) => ({
          ...current,
          status: "error",
          message: `Unable to read Vertex AI runtime status: ${error.message}`
        }));
      }
    }

    loadVertexStatus();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function syncFullscreenState() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    syncFullscreenState();
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  function loadSelectedClaim() {
    const sample = sampleClaims[selectedIndex];
    const sampleAnalysis = analyzeClaim(sample);
    setDraft(sample);
    setSubmittedClaim(sample);
    setApprovalState("Pending Adjuster Review");
    setApprovalLog([createApprovalLogEntry("System", "Sample claim loaded and workflow refreshed.", sample.claim_id)]);
    setChatMessages([createChatMessage("assistant", buildAgentGreeting(sampleAnalysis))]);
    setWorkflowNote("Loaded sample claim and started ClaimsOps workflow.");
    setActiveTab("review");
    runVertexWorkflow(sample);
  }

  function startNewClaim() {
    const next = blankClaim();
    setDraft(next);
    setSubmittedClaim(next);
    setApprovalState("Pending Intake");
    setVertexState((current) => ({ ...current, review: null, enabled: false, mode: "deterministic" }));
    setApprovalLog([createApprovalLogEntry("System", "Blank claim draft started.", next.claim_id)]);
    setChatMessages([createChatMessage("assistant", "I started a blank claim. Fill the intake fields, then run the workflow so I can explain coverage, evidence, risk, and routing.")]);
    setWorkflowNote("Started a blank claim draft.");
    setActiveTab("submit");
  }

  async function runWorkflow(event) {
    event.preventDefault();
    const nextAnalysis = analyzeClaim(draft);
    setSubmittedClaim(draft);
    setApprovalState("Pending Adjuster Review");
    setApprovalLog((current) => [
      createApprovalLogEntry("ClaimsOps Agent", `Workflow run completed. Recommended owner: ${nextAnalysis.recommendation.owner}.`, draft.claim_id),
      ...current
    ]);
    setChatMessages((current) => [
      ...current,
      createChatMessage("assistant", buildAgentGreeting(nextAnalysis))
    ]);
    setWorkflowNote("Submitted claim and started ClaimsOps workflow.");
    setActiveTab("review");
    await runVertexWorkflow(draft);
  }

  function handleApprovalAction(nextState, detail) {
    setApprovalState(nextState);
    setApprovalLog((current) => [
      createApprovalLogEntry("Human Adjuster", detail, analysis.claim.claim_id),
      ...current
    ]);
  }

  function sendAgentMessage(message) {
    const text = message.trim();
    if (!text) return;
    const reply = answerAgentQuestion(text, analysis, approvalState, vertexState, approvalLog);
    setChatMessages((current) => [
      ...current,
      createChatMessage("user", text),
      createChatMessage("assistant", reply)
    ]);
  }

  function startGuidedDemo() {
    setDemoActive(true);
    setDemoStepIndex(0);
    setActiveTab(demoSteps[0].tab);
    setWorkflowNote("Guided demo mode started.");
  }

  function moveDemoStep(offset) {
    const nextIndex = Math.max(0, Math.min(demoSteps.length - 1, demoStepIndex + offset));
    setDemoStepIndex(nextIndex);
    setActiveTab(demoSteps[nextIndex].tab);
  }

  function stopGuidedDemo() {
    setDemoActive(false);
    setWorkflowNote("Guided demo mode ended.");
  }

  async function runVertexWorkflow(claim) {
    setVertexState((current) => ({
      ...current,
      status: "running",
      message: "Calling the ClaimsOps Vercel API route for Vertex AI review...",
      review: null
    }));

    try {
      const response = await fetch("/api/claimsops/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "ClaimsOps API route failed.");

      const vertex = payload.vertex || {};
      setVertexState((current) => ({
        ...current,
        ...vertex,
        mode: payload.mode || "deterministic",
        enabled: Boolean(vertex.enabled),
        review: vertex.review || null
      }));
      setWorkflowNote(vertex.enabled
        ? "ClaimsOps Agent workflow completed with Vertex AI live review and deterministic guardrails."
        : `ClaimsOps Agent workflow completed with deterministic tools. ${vertex.message || ""}`.trim());
    } catch (error) {
      setVertexState((current) => ({
        ...current,
        status: "error",
        mode: "deterministic",
        enabled: false,
        review: null,
        message: `Vertex AI review failed; deterministic analysis is still available. ${error.message}`
      }));
      setWorkflowNote("ClaimsOps Agent workflow completed with deterministic tools; Vertex AI review failed.");
    }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
      } else {
        await document.documentElement.requestFullscreen?.();
      }
    } catch {
      setWorkflowNote("Fullscreen mode is not available in this browser context.");
    }
  }

  return (
    <div className={`app-shell ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
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
          <StatusRow label="Workflow" value={vertexState.enabled ? "Vertex AI + Tools" : "Deterministic Agent Tools"} />
          <StatusRow label="Vertex" value={getVertexStatusLabel(vertexState.status)} />
          <StatusRow label="Human Gate" value={approvalState} />
          <StatusRow label="Vertex Project" value={vertexState.projectId || "agenticai-500006"} code />
          <StatusRow label="Location" value={vertexState.location || "us-central1"} code />
          <StatusRow label="Model" value={vertexState.model || "gemini-2.0-flash"} code />
          <p className="muted">{workflowNote}</p>
        </div>
      </aside>

      <main className="main" id="main-content">
        <div className="canvas-controls" aria-label="Canvas controls">
          <button
            type="button"
            className={`demo-control-button ${demoActive ? "active" : ""}`}
            onClick={demoActive ? stopGuidedDemo : startGuidedDemo}
          >
            <Play aria-hidden="true" size={16} />
            {demoActive ? "End Demo" : "Start Demo"}
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={sidebarOpen ? "Hide controls panel" : "Show controls panel"}
            title={sidebarOpen ? "Hide controls panel" : "Show controls panel"}
            aria-pressed={!sidebarOpen}
            onClick={() => setSidebarOpen((current) => !current)}
          >
            {sidebarOpen ? <PanelLeftClose aria-hidden="true" size={17} /> : <PanelLeftOpen aria-hidden="true" size={17} />}
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            aria-pressed={isFullscreen}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 aria-hidden="true" size={17} /> : <Maximize2 aria-hidden="true" size={17} />}
          </button>
        </div>
        {demoActive && (
          <DemoGuide
            step={demoSteps[demoStepIndex]}
            stepIndex={demoStepIndex}
            totalSteps={demoSteps.length}
            onPrevious={() => moveDemoStep(-1)}
            onNext={() => moveDemoStep(1)}
            onEnd={stopGuidedDemo}
          />
        )}
        <Hero analysis={analysis} setActiveTab={setActiveTab} vertexState={vertexState} />
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <section className="tab-panel" aria-live="polite">
          {activeTab === "submit" && (
            <SubmitClaimForm draft={draft} setDraft={setDraft} runWorkflow={runWorkflow} />
          )}
          {activeTab === "agent" && (
            <AgentChat
              analysis={analysis}
              approvalState={approvalState}
              vertexState={vertexState}
              approvalLog={approvalLog}
              messages={chatMessages}
              onSend={sendAgentMessage}
            />
          )}
          {activeTab === "review" && (
            <AgentReview
              analysis={analysis}
              approvalState={approvalState}
              vertexState={vertexState}
              approvalLog={approvalLog}
              onDownloadReport={() => downloadClaimReport(analysis, approvalState, approvalLog, vertexState)}
            />
          )}
          {activeTab === "communications" && (
            <Communications
              analysis={analysis}
              approvalState={approvalState}
              approvalLog={approvalLog}
              onApprovalAction={handleApprovalAction}
            />
          )}
          {activeTab === "dashboard" && <OperationsDashboard />}
          {activeTab === "manager" && <ManagerDashboard approvalLog={approvalLog} />}
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

function DemoGuide({ step, stepIndex, totalSteps, onPrevious, onNext, onEnd }) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  return (
    <section className="demo-guide" aria-label="Guided demo mode">
      <div>
        <span>Demo Step {stepIndex + 1} / {totalSteps}</span>
        <strong>{step.title}</strong>
        <p>{step.body}</p>
      </div>
      <div className="demo-actions">
        <button type="button" className="button ghost" onClick={onPrevious} disabled={isFirst}>Previous</button>
        <button type="button" className="button secondary" onClick={isLast ? onEnd : onNext}>{isLast ? "Finish Demo" : "Next"}</button>
      </div>
    </section>
  );
}

function Hero({ analysis, setActiveTab, vertexState }) {
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
        <CapabilityStrip setActiveTab={setActiveTab} vertexState={vertexState} />
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

function CapabilityStrip({ setActiveTab, vertexState }) {
  const vertexLive = vertexState.status === "live";
  const vertexReady = vertexState.status === "ready";
  const vertexMissing = vertexState.status === "missing_credentials";
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
      title: "Vertex AI Live Review",
      status: vertexLive ? "Live" : vertexReady ? "Ready" : vertexMissing ? "Needs credentials" : "API route wired",
      body: vertexLive
        ? "Gemini on Vertex AI added a live adjuster-facing explanation while deterministic tools stayed in control."
        : "The Vercel API route is implemented. Add the service account env var to turn on live Gemini review.",
      action: "View Review",
      tab: "review"
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
  const draftAnalysis = analyzeClaim(draft);
  const missingDocs = draftAnalysis.evidence.missing;

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

  function addDocument(doc) {
    setDraft((current) => {
      const submitted = new Set(current.documents || []);
      submitted.add(doc);
      return { ...current, documents: Array.from(submitted).sort() };
    });
  }

  function addAllMissingDocuments() {
    setDraft((current) => {
      const submitted = new Set(current.documents || []);
      missingDocs.forEach((doc) => submitted.add(doc));
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

      <section className="evidence-simulator">
        <div>
          <UploadCloud aria-hidden="true" size={20} />
          <div>
            <h3>Evidence Upload Simulation</h3>
            <p>
              Evidence readiness is {Math.round(draftAnalysis.evidence.completion * 100)}%.
              {missingDocs.length ? " Add missing evidence to see the review package improve." : " The current review package has all required evidence."}
            </p>
          </div>
        </div>
        {missingDocs.length ? (
          <div className="simulation-actions">
            {missingDocs.map((doc) => (
              <button type="button" className="button ghost" key={doc} onClick={() => addDocument(doc)}>
                Add {formatDocLabel(doc)}
              </button>
            ))}
            <button type="button" className="button secondary" onClick={addAllMissingDocuments}>
              Add All Missing Evidence
            </button>
          </div>
        ) : (
          <span className="status-pill ready">Evidence Ready</span>
        )}
      </section>

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

function AgentChat({ analysis, approvalState, vertexState, approvalLog, messages, onSend }) {
  const [draft, setDraft] = useState("");
  const prompts = [
    "What should happen next?",
    "Why is this the risk score?",
    "What evidence is missing?",
    "Can this be approved automatically?",
    "Explain the architecture"
  ];

  function submitMessage(event) {
    event.preventDefault();
    onSend(draft);
    setDraft("");
  }

  return (
    <div className="chat-layout">
      <section className="panel chat-panel">
        <div className="panel-heading">
          <div>
            <h3>ClaimsOps Agent Chat</h3>
            <p>Ask about the active claim, routing logic, missing evidence, safety gates, or architecture.</p>
          </div>
          <span className="runtime-badge">{vertexState.enabled ? "Vertex Assisted" : "Deterministic"}</span>
        </div>
        <div className="chat-messages" aria-live="polite">
          {messages.map((message) => (
            <article className={`chat-message ${message.role}`} key={message.id}>
              <span>{message.role === "assistant" ? "ClaimsOps Agent" : "You"}</span>
              <p>{message.content}</p>
            </article>
          ))}
        </div>
        <form className="chat-input-row" onSubmit={submitMessage}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask the agent about this claim..."
            aria-label="Ask the ClaimsOps Agent"
          />
          <button type="submit" className="button primary">
            <Send aria-hidden="true" size={16} />
            Send
          </button>
        </form>
      </section>

      <aside className="panel agent-context-panel">
        <h3>Agent Context</h3>
        <dl className="detail-list compact">
          <div><dt>Claim</dt><dd>{analysis.claim.claim_id}</dd></div>
          <div><dt>Risk</dt><dd>{analysis.risk.score}/100, {analysis.risk.severity}</dd></div>
          <div><dt>Evidence</dt><dd>{analysis.evidence.missing.length ? `${analysis.evidence.missing.length} missing` : "Complete"}</dd></div>
          <div><dt>Route</dt><dd>{analysis.recommendation.owner}</dd></div>
          <div><dt>Human Gate</dt><dd>{approvalState}</dd></div>
          <div><dt>Audit Events</dt><dd>{approvalLog.length}</dd></div>
        </dl>
        <div className="prompt-grid">
          {prompts.map((prompt) => (
            <button type="button" className="button ghost" key={prompt} onClick={() => onSend(prompt)}>
              {prompt}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

function AgentReview({ analysis, approvalState, vertexState, approvalLog, onDownloadReport }) {
  const { claim, coverage, evidence, risk, recommendation, history } = analysis;
  const evidencePercent = Math.round(evidence.completion * 100);
  const topDrivers = [...risk.contributions]
    .filter((item) => item.impact !== 12)
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 4);

  return (
    <div className="stack">
      <section className="review-toolbar">
        <div>
          <span className="section-label">Review Package</span>
          <strong>{claim.claim_id} analysis is ready for adjuster review.</strong>
        </div>
        <button type="button" className="button secondary" onClick={onDownloadReport}>
          <Download aria-hidden="true" size={17} />
          Download Claim Review
        </button>
      </section>

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

      <VertexReviewPanel vertexState={vertexState} />
      <VertexStatusPanel vertexState={vertexState} />

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
                <span className="tool-chip">{formatToolLabel(step.tool_used)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function VertexReviewPanel({ vertexState }) {
  const review = vertexState.review;
  const isLive = vertexState.status === "live";

  return (
    <section className={`panel vertex-panel ${isLive ? "live" : ""}`}>
      <div className="panel-heading">
        <div>
          <h3>Vertex AI Live Review</h3>
          <p>{vertexState.message}</p>
        </div>
        <span className={`runtime-badge ${isLive ? "live" : ""}`}>{getVertexStatusLabel(vertexState.status)}</span>
      </div>

      {review ? (
        <div className="vertex-review-grid">
          <div className="vertex-summary">
            <span>Generated Adjuster Summary</span>
            <p>{review.executive_summary}</p>
          </div>
          <VertexList title="How Vertex Read The Case" items={review.reasoning_steps} />
          <VertexList title="Questions For The Adjuster" items={review.adjuster_questions} />
          <VertexList title="Customer Next Steps" items={review.customer_next_steps} />
          <VertexList title="Risk Caveats" items={review.risk_caveats} />
        </div>
      ) : (
        <div className="vertex-empty">
          <p>
            The deterministic claims workflow is ready now. Vertex AI will add a live, plain-English review here
            once the deployment has service account credentials with Vertex AI access.
          </p>
          <dl className="detail-list compact">
            <div><dt>Project</dt><dd>{vertexState.projectId}</dd></div>
            <div><dt>Project Number</dt><dd>{vertexState.projectNumber}</dd></div>
            <div><dt>Location</dt><dd>{vertexState.location}</dd></div>
            <div><dt>Model</dt><dd>{vertexState.model}</dd></div>
          </dl>
        </div>
      )}
    </section>
  );
}

function VertexList({ title, items }) {
  if (!items?.length) return null;
  return (
    <div className="vertex-list">
      <span>{title}</span>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function VertexStatusPanel({ vertexState }) {
  const statusItems = [
    { label: "API Route", value: "/api/claimsops/analyze" },
    { label: "Mode", value: vertexState.enabled ? "Live Vertex AI review" : "Deterministic fallback" },
    { label: "Credentials", value: vertexState.hasCredentials ? "Configured" : "Not configured" },
    { label: "Project", value: vertexState.projectId },
    { label: "Location", value: vertexState.location },
    { label: "Model", value: vertexState.model }
  ];

  return (
    <section className="panel vertex-status-panel">
      <div className="panel-heading">
        <div>
          <h3>Vertex Runtime Status</h3>
          <p>Shows whether the live Gemini on Vertex AI path is actually active for this deployment.</p>
        </div>
        <span className={`runtime-badge ${vertexState.enabled ? "live" : ""}`}>{getVertexStatusLabel(vertexState.status)}</span>
      </div>
      <div className="vertex-status-grid">
        {statusItems.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value || "Not set"}</strong>
          </div>
        ))}
      </div>
    </section>
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

function Communications({ analysis, approvalState, approvalLog, onApprovalAction }) {
  const missingEvidence = analysis.evidence.missing.map(formatDocLabel).join(", ");
  const approvalDetail = `Approved recommended next action: ${analysis.recommendation.action}.`;
  const evidenceDetail = missingEvidence
    ? `Requested missing evidence: ${missingEvidence}.`
    : "Requested adjuster confirmation even though required evidence is complete.";
  const escalationDetail = `Manual escalation opened for ${analysis.recommendation.owner}.`;

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
        <button type="button" className="button secondary" onClick={() => onApprovalAction("Approved For Next Action", approvalDetail)}>
          <CheckCircle2 aria-hidden="true" size={17} />
          Approve Next Action
        </button>
        <button type="button" className="button secondary" onClick={() => onApprovalAction("Evidence Requested", evidenceDetail)}>
          <Send aria-hidden="true" size={17} />
          Request More Evidence
        </button>
        <button type="button" className="button secondary" onClick={() => onApprovalAction("Manual Escalation Opened", escalationDetail)}>
          <AlertTriangle aria-hidden="true" size={17} />
          Escalate Manually
        </button>
      </div>
      <section className="panel audit-log-panel">
        <div className="panel-heading">
          <div>
            <h3>Human Approval Action Log</h3>
            <p>Every simulated adjuster action is captured so the demo shows how governance works.</p>
          </div>
        </div>
        <div className="audit-log">
          {approvalLog.map((entry) => (
            <article className="audit-entry" key={entry.id}>
              <span>{entry.time}</span>
              <div>
                <strong>{entry.actor}</strong>
                <p>{entry.detail}</p>
                <small>{entry.claimId}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
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

function ManagerDashboard({ approvalLog }) {
  const rows = dashboardRows();
  const kpis = getDashboardKpis(rows);
  const ownerData = getOwnerData(rows);
  const highRisk = rows.filter((row) => row.severity === "High");
  const evidenceBlocked = rows.filter((row) => row.missingDocs > 0);
  const manualQueue = rows.filter((row) => !row.covered || row.severity === "High" || row.missingDocs > 0);
  const urgentQueue = rows.filter((row) => row.sla.includes("4"));
  const managerActions = [
    {
      label: "Staff high-risk review",
      detail: `${highRisk.length} claim${highRisk.length === 1 ? "" : "s"} should stay with a senior adjuster or SIU.`
    },
    {
      label: "Clear evidence blockers",
      detail: `${evidenceBlocked.length} claim${evidenceBlocked.length === 1 ? "" : "s"} need customer document follow-up.`
    },
    {
      label: "Protect the SLA queue",
      detail: `${urgentQueue.length} claim${urgentQueue.length === 1 ? "" : "s"} have a 4 business hour review target.`
    }
  ];

  return (
    <div className="stack manager-stack">
      <section className="manager-brief">
        <div>
          <span className="section-label">Highest-Value Additions</span>
          <h3>Manager control room for the ClaimsOps agent.</h3>
          <p>
            This view turns the demo from a single-claim assistant into an operations tool: leaders can see
            what is blocked, who owns it, what needs approval, and where the agent can reduce cycle time.
          </p>
        </div>
        <Users aria-hidden="true" size={34} />
      </section>

      <div className="metrics dashboard-kpis">
        <Metric label="Manual Queue" value={manualQueue.length} detail={`${kpis.manualReviewRate}% manual review rate`} />
        <Metric label="Evidence Blocked" value={evidenceBlocked.length} detail="Need customer follow-up" />
        <Metric label="High Risk" value={highRisk.length} detail="Senior review path" />
        <Metric label="Urgent SLA" value={urgentQueue.length} detail="4 business hour target" />
        <Metric label="Approval Events" value={approvalLog.length} detail="Current session audit log" />
      </div>

      <div className="manager-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Owner Load And Risk</h3>
              <p>Claim volume by owner with average risk overlay.</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={310}>
            <ComposedChart data={ownerData} margin={{ top: 18, right: 20, bottom: 12, left: 0 }}>
              <CartesianGrid stroke="#262626" strokeDasharray="4 4" />
              <XAxis dataKey="owner" stroke="#999999" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" allowDecimals={false} stroke="#999999" />
              <YAxis yAxisId="right" orientation="right" stroke="#999999" />
              <Tooltip content={<DarkTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="count" name="Claims" fill={chartColors.blue} radius={[6, 6, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="avgRisk" name="Avg Risk" stroke={chartColors.coral} strokeWidth={3} dot />
            </ComposedChart>
          </ResponsiveContainer>
        </section>

        <section className="panel manager-actions-panel">
          <div className="panel-heading">
            <div>
              <h3>Manager Actions</h3>
              <p>What a claims lead should do after the agent triage run.</p>
            </div>
          </div>
          <div className="manager-action-list">
            {managerActions.map((action, index) => (
              <article key={action.label}>
                <span>{index + 1}</span>
                <div>
                  <strong>{action.label}</strong>
                  <p>{action.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>SLA Watchlist</h3>
            <p>Claims that should receive manager attention before the next operating checkpoint.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="manager-table">
            <thead>
              <tr>
                <th>Claim</th>
                <th>Customer</th>
                <th>Risk</th>
                <th>Blocked By</th>
                <th>Owner</th>
                <th>SLA</th>
                <th>Next Action</th>
              </tr>
            </thead>
            <tbody>
              {manualQueue.map((row) => (
                <tr key={row.claim}>
                  <td>{row.claim}</td>
                  <td>{row.customer}</td>
                  <td><SeverityPill severity={row.severity} /> {row.riskScore}/100</td>
                  <td>{row.missingDocs ? `${row.missingDocs} missing document${row.missingDocs === 1 ? "" : "s"}` : row.covered ? "Risk review" : "Coverage review"}</td>
                  <td>{row.owner}</td>
                  <td>{row.sla}</td>
                  <td>{row.nextAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
    {
      id: "intake",
      label: "Claims Intake",
      detail: "Normalize claim details",
      x: 52,
      y: 70,
      tooltipSide: "right-down",
      info: {
        why: "Claims arrive with mixed formats, missing fields, and line-specific context. Intake creates the clean record every later agent can trust.",
        role: "Identifies the insurance line, customer, policy, incident dates, amount, location, description, and submitted evidence.",
        output: "A normalized claim package for coverage, evidence, and risk review."
      }
    },
    {
      id: "coverage",
      label: "Coverage Verification",
      detail: "Policy, dates, limits",
      x: 52,
      y: 174,
      tooltipSide: "right",
      info: {
        why: "The workflow should not move toward settlement until policy fit is clear or flagged for human review.",
        role: "Checks policy status, coverage window, insurance line match, limits, deductible, and exclusions.",
        output: "Coverage status, review reason, limits, and deductible context."
      }
    },
    {
      id: "evidence",
      label: "Evidence Review",
      detail: "Required vs submitted",
      x: 52,
      y: 278,
      tooltipSide: "right",
      info: {
        why: "Missing evidence is one of the most common reasons claims operations slow down.",
        role: "Compares submitted files with the required checklist for the selected insurance line.",
        output: "Evidence readiness percentage plus any missing documents to request."
      }
    },
    {
      id: "risk",
      label: "Risk Triage",
      detail: "Severity and signals",
      x: 52,
      y: 382,
      tooltipSide: "right-up",
      info: {
        why: "Claims teams need a consistent way to prioritize high exposure, urgent, or unusual cases.",
        role: "Scores claim amount, evidence gaps, coverage uncertainty, history, reporting delay, and description signals.",
        output: "Risk score, severity, urgency, and signals for routing."
      }
    }
  ];

  const supervisorInfo = {
    why: "Specialist outputs need one orchestrator that chooses the next safe operational step.",
    role: "Combines intake, coverage, evidence, and risk facts, then selects the route without making a final claim decision.",
    output: "Recommended owner, SLA, next action, and human approval gate."
  };
  const toolInfo = {
    why: "Agents should rely on structured tools instead of inventing policy or history facts.",
    role: "Provides deterministic lookup, checklist, history, risk, routing, and draft-generation functions.",
    output: "Auditable tool results used as the source of truth."
  };
  const communicationInfo = {
    why: "Claims teams need clear messages, but language must stay non-final and human-gated.",
    role: "Drafts customer updates and internal adjuster notes from the verified workflow facts.",
    output: "Communication drafts ready for adjuster review."
  };
  const humanGateInfo = {
    why: "Insurance decisions can affect payments, denials, settlements, and customer rights.",
    role: "Requires an adjuster to validate the recommendation before any final action.",
    output: "Approve next action, request more evidence, or escalate manually."
  };
  const outcomeInfo = {
    why: "The architecture must make clear where automation stops.",
    role: "Marks the boundary between agent recommendation and human-owned claim decision.",
    output: "A documented control point: no approval, denial, settlement, payment, or fraud accusation is automated."
  };

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
              </defs>
              {specialistNodes.map((node) => (
                <path
                  key={node.id}
                  d={`M292 ${node.y + 36} H 352 C 398 ${node.y + 36}, 398 258, 430 258`}
                  stroke="url(#flowGradient)"
                  strokeWidth="2.5"
                  fill="none"
                />
              ))}
              <path d="M430 258 H 498" stroke="url(#flowGradient)" strokeWidth="2.5" fill="none" />
              <path d="M738 258 H 778 C 812 258, 792 138, 824 138" stroke="url(#flowGradient)" strokeWidth="2.5" fill="none" />
              <path d="M738 258 H 824" stroke="url(#flowGradient)" strokeWidth="2.5" fill="none" />
              <path d="M738 258 H 778 C 812 258, 792 378, 824 378" stroke="url(#flowGradient)" strokeWidth="2.5" fill="none" />
              <circle cx="430" cy="258" r="3.5" fill="#d44df0" opacity="0.95" />
              <circle cx="778" cy="258" r="3.5" fill="#d44df0" opacity="0.95" />
            </svg>

            {specialistNodes.map((node, index) => (
              <FlowNode
                key={node.id}
                className="specialist"
                x={node.x}
                y={node.y}
                number={index + 1}
                title={node.label}
                detail={node.detail}
                info={node.info}
                tooltipSide={node.tooltipSide}
              />
            ))}
            <FlowNode className="supervisor" x={498} y={222} number={5} title="Supervisor Agent" detail="Chooses next tool and route" info={supervisorInfo} tooltipSide="bottom" />
            <FlowNode className="tool" x={824} y={102} number={6} title="Tool Layer" detail="Policy, history, checklist, risk rules" info={toolInfo} tooltipSide="left-down" />
            <FlowNode className="tool" x={824} y={222} number={7} title="Communication Drafts" detail="Customer update and adjuster note" info={communicationInfo} tooltipSide="left" />
            <FlowNode className="human" x={824} y={342} number={8} title="Human Approval Gate" detail="Adjuster validates final action" info={humanGateInfo} tooltipSide="left-up" />
            <div
              className="workflow-terminal"
              style={{ left: 824, top: 432 }}
              tabIndex={0}
              aria-describedby="architecture-outcome-popover"
            >
              <span>Human-Owned Outcome</span>
              <strong>No final decision is automated.</strong>
              <InfoPopover id="architecture-outcome-popover" title="Human-Owned Outcome" info={outcomeInfo} side="left-up" />
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

function FlowNode({ className, x, y, number, title, detail, info, tooltipSide = "right" }) {
  const popoverId = `architecture-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-popover`;
  return (
    <div
      className={`flow-node ${className}`}
      style={{ left: x, top: y }}
      tabIndex={0}
      aria-describedby={popoverId}
    >
      <span>{number}</span>
      <strong>{title}</strong>
      <small>{detail}</small>
      <InfoPopover id={popoverId} title={title} info={info} side={tooltipSide} />
    </div>
  );
}

function InfoPopover({ id, title, info, side }) {
  return (
    <div id={id} role="tooltip" className={`architecture-popover ${side}`}>
      <strong>{title}</strong>
      <dl>
        <div>
          <dt>Why It Is Here</dt>
          <dd>{info.why}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{info.role}</dd>
        </div>
        <div>
          <dt>Output</dt>
          <dd>{info.output}</dd>
        </div>
      </dl>
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

function createChatMessage(role, content) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content
  };
}

function createApprovalLogEntry(actor, detail, claimId) {
  const now = new Date();
  return {
    id: `log-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    actor,
    detail,
    claimId,
    date: now.toISOString(),
    time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  };
}

function buildAgentGreeting(analysis) {
  const missing = analysis.evidence.missing.length
    ? `${analysis.evidence.missing.length} missing evidence item${analysis.evidence.missing.length === 1 ? "" : "s"}`
    : "all required evidence present";
  return `I reviewed ${analysis.claim.claim_id} for ${analysis.claim.customer_name}. The claim is ${analysis.risk.severity.toLowerCase()} risk at ${analysis.risk.score}/100, coverage status is ${analysis.coverage.status.replace("_", " ")}, and the evidence package has ${missing}. My current recommendation is: ${analysis.recommendation.action}.`;
}

function answerAgentQuestion(question, analysis, approvalState, vertexState, approvalLog) {
  const q = question.toLowerCase();
  const missing = analysis.evidence.missing.map(formatDocLabel);
  const topDrivers = [...analysis.risk.contributions]
    .filter((item) => item.label !== "Baseline intake risk")
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 3);

  if (q.includes("evidence") || q.includes("document") || q.includes("missing")) {
    return missing.length
      ? `The evidence review agent found these missing items: ${missing.join(", ")}. That matters because settlement review should pause until the claim file contains the required documents for a ${analysis.claim.insurance_type.toLowerCase()} claim.`
      : "The evidence review agent found that all required documents are present for this insurance line. The claim can move to the next human-reviewed step unless risk or coverage checks require a specialist.";
  }

  if (q.includes("risk") || q.includes("score") || q.includes("why")) {
    const driverText = topDrivers.length
      ? topDrivers.map((driver) => `${driver.label} (${driver.impact > 0 ? "+" : ""}${driver.impact}): ${driver.detail}`).join(" ")
      : "No major risk drivers were detected beyond baseline intake review.";
    return `The risk score is ${analysis.risk.score}/100, which is ${analysis.risk.severity.toLowerCase()} severity. Main drivers: ${driverText} The urgency is ${analysis.risk.urgency}.`;
  }

  if (q.includes("approve") || q.includes("automatic") || q.includes("human") || q.includes("gate")) {
    return `No final decision should be automated. The current human gate is "${approvalState}". The agent can recommend, prioritize, and draft communications, but approval, denial, settlement, payment, or fraud escalation must stay with a human adjuster.`;
  }

  if (q.includes("next") || q.includes("route") || q.includes("action") || q.includes("owner")) {
    return `Next action: ${analysis.recommendation.action}. Owner: ${analysis.recommendation.owner}. SLA: ${analysis.recommendation.sla}. Rationale: ${analysis.recommendation.rationale}`;
  }

  if (q.includes("coverage") || q.includes("policy")) {
    const limit = analysis.coverage.limit ? ` The claim limit is EUR ${numberFormat(analysis.coverage.limit)} and deductible is EUR ${numberFormat(analysis.coverage.deductible)}.` : "";
    return `Coverage status is ${analysis.coverage.status.replace("_", " ")}. ${analysis.coverage.reason}${limit}`;
  }

  if (q.includes("architecture") || q.includes("agent") || q.includes("workflow")) {
    return "The architecture uses specialist agents for intake, coverage, evidence, risk, and communications. A supervisor agent combines their tool-backed outputs, selects the safest next route, and sends the case to a human approval gate before any final decision.";
  }

  if (q.includes("vertex") || q.includes("live") || q.includes("model")) {
    return `Vertex status is "${getVertexStatusLabel(vertexState.status)}". Project ${vertexState.projectId}, location ${vertexState.location}, model ${vertexState.model}. If credentials are configured and live mode is enabled, the app adds a Vertex AI review while deterministic tools remain the source of truth.`;
  }

  if (q.includes("log") || q.includes("audit")) {
    const latest = approvalLog[0];
    return latest
      ? `Latest audit event: ${latest.actor} at ${latest.time} for ${latest.claimId}: ${latest.detail}`
      : "No approval events have been recorded yet. Use the Human Approval Gate controls to create an auditable action trail.";
  }

  return `For ${analysis.claim.claim_id}, I can explain evidence, risk, coverage, routing, Vertex status, architecture, or the approval audit log. Current recommendation: ${analysis.recommendation.action}.`;
}

function downloadClaimReport(analysis, approvalState, approvalLog, vertexState) {
  const html = buildClaimReportHtml(analysis, approvalState, approvalLog, vertexState);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${analysis.claim.claim_id}-claimsops-review.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildClaimReportHtml(analysis, approvalState, approvalLog, vertexState) {
  const rows = [
    ["Claim ID", analysis.claim.claim_id],
    ["Customer", analysis.claim.customer_name],
    ["Insurance Line", analysis.claim.insurance_type],
    ["Claim Amount", `EUR ${numberFormat(analysis.claim.claim_amount)}`],
    ["Risk", `${analysis.risk.score}/100, ${analysis.risk.severity}`],
    ["Coverage", `${analysis.coverage.status.replace("_", " ")} - ${analysis.coverage.reason}`],
    ["Evidence", analysis.evidence.missing.length ? `Missing ${analysis.evidence.missing.map(formatDocLabel).join(", ")}` : "All required evidence is present"],
    ["Recommendation", `${analysis.recommendation.action} (${analysis.recommendation.owner}, ${analysis.recommendation.sla})`],
    ["Human Gate", approvalState],
    ["Vertex Runtime", `${getVertexStatusLabel(vertexState.status)} - ${vertexState.projectId} / ${vertexState.model}`]
  ];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(analysis.claim.claim_id)} ClaimsOps Review</title>
  <style>
    body { margin: 40px; color: #171717; font-family: Inter, Arial, sans-serif; line-height: 1.5; }
    h1 { margin-bottom: 4px; font-size: 34px; }
    h2 { margin-top: 28px; border-bottom: 1px solid #d4d4d4; padding-bottom: 6px; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #d4d4d4; padding: 10px; text-align: left; vertical-align: top; }
    th { width: 220px; background: #f5f5f5; }
    li { margin-bottom: 8px; }
    .muted { color: #525252; }
  </style>
</head>
<body>
  <h1>ClaimsOps Agent Review</h1>
  <p class="muted">Generated from the ClaimsOps MVP. Final insurance decisions remain human-owned.</p>
  <h2>Decision Summary</h2>
  <table>
    <tbody>
      ${rows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join("")}
    </tbody>
  </table>
  <h2>Risk Drivers</h2>
  <ul>${analysis.risk.contributions.map((item) => `<li><strong>${escapeHtml(item.label)}</strong> (${item.impact > 0 ? "+" : ""}${item.impact}): ${escapeHtml(item.detail)}</li>`).join("")}</ul>
  <h2>Agent Reasoning Trace</h2>
  <ol>${analysis.trace.map((step) => `<li><strong>${escapeHtml(step.agent)}</strong>: ${escapeHtml(step.decision)} ${escapeHtml(step.observation)} Tool: ${escapeHtml(formatToolLabel(step.tool_used))}.</li>`).join("")}</ol>
  <h2>Approval Log</h2>
  <ul>${approvalLog.map((entry) => `<li><strong>${escapeHtml(entry.actor)}</strong> at ${escapeHtml(entry.time)}: ${escapeHtml(entry.detail)}</li>`).join("")}</ul>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

function formatToolLabel(value) {
  const labels = {
    claim_intake_parser: "Claim Intake Parser",
    policy_lookup_tool: "Policy Lookup Tool",
    document_requirements_tool: "Document Requirements Tool",
    risk_scoring_tool: "Risk Scoring Tool",
    next_action_tool: "Next Action Tool",
    communication_draft_tool: "Communication Draft Tool",
    vertex_live_review_tool: "Vertex Live Review Tool"
  };
  if (labels[value]) return labels[value];
  return formatDocLabel(value);
}

function numberFormat(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

function getVertexStatusLabel(status) {
  const labels = {
    checking: "Checking",
    ready: "Ready",
    running: "Running",
    live: "Live",
    disabled: "Disabled",
    missing_credentials: "Needs Credentials",
    error: "Fallback Active"
  };
  return labels[status] || "Deterministic";
}

function getVertexConfigMessage(vertex) {
  if (vertex.liveRequested && vertex.hasCredentials) {
    return "Vertex AI live mode is configured. Load or submit a claim to generate a live review.";
  }
  if (vertex.liveRequested) {
    return "Vertex AI live mode is requested, but service account credentials are missing.";
  }
  return "Vertex AI API route is available. Set VERTEX_AI_LIVE=true and add service account credentials to enable it.";
}

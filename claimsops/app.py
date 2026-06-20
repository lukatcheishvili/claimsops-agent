from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd
import streamlit as st

from core.crewai_adapter import crewai_environment_status, try_live_crewai_summary
from core.engine import analyze_claim, blank_claim, sample_claims


ROOT = Path(__file__).resolve().parents[1]
DOCS_DIR = ROOT / "docs"


st.set_page_config(
    page_title="ClaimsOps Agent",
    page_icon="CO",
    layout="wide",
    initial_sidebar_state="expanded",
)


def inject_css() -> None:
    st.markdown(
        """
        <style>
        :root {
            --co-canvas: #090909;
            --co-deep: #050505;
            --co-surface-1: #141414;
            --co-surface-2: #1c1c1c;
            --co-graphite: #242424;
            --co-hairline: #262626;
            --co-hairline-soft: #1a1a1a;
            --co-hairline-strong: rgba(255,255,255,0.12);
            --co-ink: #ffffff;
            --co-body: rgba(255,255,255,0.78);
            --co-muted: #999999;
            --co-faint: #6b6b6b;
            --co-blue: #0099ff;
            --co-magenta: #d44df0;
            --co-violet: #6a4cf5;
            --co-orange: #ff7a3d;
            --co-coral: #ff5577;
            --co-gold: #ffffff;
            --co-gold-soft: #f4f4f4;
            --co-patina: #0099ff;
            --co-patina-deep: #063758;
            --co-warning: #ff7a3d;
            --co-success: #22c55e;
        }

        :root,
        html {
            color-scheme: dark;
        }

        html, body, [data-testid="stAppViewContainer"], .stApp {
            background: var(--co-canvas);
            color: var(--co-ink);
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            font-feature-settings: "cv01", "cv05", "cv09", "cv11", "ss03", "ss07", "tnum";
            letter-spacing: 0;
            overflow-x: hidden;
            -webkit-tap-highlight-color: rgba(0,153,255,0.18);
        }

        .block-container {
            max-width: 1199px;
            padding-top: 2rem;
            padding-bottom: 3rem;
        }

        h1, h2, h3, h4, h5, h6,
        .stMarkdown h1, .stMarkdown h2, .stMarkdown h3 {
            color: var(--co-ink);
            letter-spacing: 0;
            font-weight: 560;
            line-height: 1;
        }

        h1 { font-size: 62px; }
        h2 { font-size: 32px; }
        h3 { font-size: 22px; }

        p, li, label, span, div {
            letter-spacing: 0;
        }

        p, li, div, span {
            overflow-wrap: anywhere;
        }

        a {
            color: var(--co-patina) !important;
        }

        [data-testid="stSidebar"] {
            background: var(--co-deep);
            border-right: 1px solid var(--co-hairline);
        }

        [data-testid="stSidebar"] h1,
        [data-testid="stSidebar"] h2,
        [data-testid="stSidebar"] h3,
        [data-testid="stSidebar"] label,
        [data-testid="stSidebar"] [data-testid="stMarkdownContainer"] p,
        [data-testid="stSidebar"] [data-testid="stCaptionContainer"] p {
            color: var(--co-ink);
        }

        [data-testid="stSidebar"] [data-testid="stCaptionContainer"] {
            color: var(--co-muted);
        }

        [data-testid="stMetric"] {
            background: var(--co-surface-1);
            border: 1px solid var(--co-hairline);
            border-radius: 8px;
            padding: 1rem;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
        }

        [data-testid="stMetric"] label,
        [data-testid="stMetric"] [data-testid="stMetricLabel"] {
            color: var(--co-muted) !important;
            font-size: 13px;
            font-weight: 500;
        }

        [data-testid="stMetric"] [data-testid="stMetricValue"] {
            color: var(--co-ink);
            font-weight: 560;
        }

        .stButton > button,
        .stFormSubmitButton > button {
            min-height: 50px;
            border-radius: 5px;
            border: 1px solid var(--co-hairline-strong);
            background: var(--co-gold);
            color: var(--co-deep);
            font-size: 14px;
            font-weight: 650;
            padding: 12px 18px;
            box-shadow: none;
            touch-action: manipulation;
            transition: transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease, border-color 140ms ease, color 140ms ease;
        }

        .stButton > button *,
        .stFormSubmitButton > button * {
            color: inherit !important;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        [data-testid="stSidebar"] .stButton > button {
            background: var(--co-surface-2);
            color: var(--co-ink);
            border: 1px solid var(--co-hairline);
        }

        .stButton > button:hover,
        .stFormSubmitButton > button:hover,
        .stButton > button:active,
        .stFormSubmitButton > button:active {
            color: var(--co-deep);
            background: var(--co-gold-soft);
            border: 1px solid var(--co-hairline-strong);
            transform: translateY(-1px);
            box-shadow: 0 0 0 1px rgba(255,255,255,0.15), 0 10px 30px rgba(0,0,0,0.3);
        }

        [data-testid="stSidebar"] .stButton > button:hover,
        [data-testid="stSidebar"] .stButton > button:active {
            background: var(--co-graphite);
            color: var(--co-ink);
            border: 1px solid var(--co-hairline-strong);
        }

        .stButton > button:focus-visible,
        .stFormSubmitButton > button:focus-visible,
        a:focus-visible,
        input:focus-visible,
        textarea:focus-visible {
            box-shadow: 0 0 0 1px rgba(0,153,255,0.35) !important;
            outline: 1px solid rgba(0,153,255,0.55) !important;
            outline-offset: 4px !important;
        }

        [data-baseweb="input"]:focus-within > div,
        [data-baseweb="textarea"]:focus-within textarea,
        [data-baseweb="select"]:focus-within > div,
        [data-baseweb="datepicker"]:focus-within > div {
            border-color: var(--co-patina) !important;
            box-shadow: 0 0 0 1px rgba(0,153,255,0.35) !important;
        }

        [data-baseweb="input"] > div,
        [data-baseweb="textarea"] textarea,
        [data-baseweb="select"] > div,
        [data-baseweb="datepicker"] > div,
        [data-baseweb="base-input"] {
            background: var(--co-surface-1) !important;
            border: 1px solid var(--co-hairline) !important;
            border-radius: 8px !important;
            color: var(--co-ink) !important;
        }

        [data-baseweb="select"] span,
        [data-baseweb="select"] div,
        [data-baseweb="popover"] div,
        [role="listbox"] div,
        [role="option"] {
            color: var(--co-ink) !important;
        }

        [data-baseweb="popover"],
        [role="listbox"] {
            background: var(--co-surface-1) !important;
            border: 1px solid var(--co-hairline) !important;
            border-radius: 8px !important;
        }

        [role="option"]:hover,
        [role="option"][aria-selected="true"] {
            background: var(--co-surface-2) !important;
            color: var(--co-ink) !important;
        }

        input, textarea, select {
            background-color: var(--co-surface-1) !important;
            color: var(--co-ink) !important;
            caret-color: var(--co-patina);
        }

        code {
            color: var(--co-blue) !important;
            background: var(--co-surface-2) !important;
            border: 1px solid var(--co-hairline-soft);
            border-radius: 5px;
            padding: 2px 5px;
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        }

        [data-testid="stTabs"] [role="tablist"] {
            gap: 8px;
            border-bottom: 1px solid var(--co-hairline);
        }

        [data-testid="stTabs"] [role="tab"] {
            color: var(--co-muted);
            background: var(--co-canvas);
            border-radius: 5px;
            padding: 8px 14px;
            min-height: 40px;
        }

        [data-testid="stTabs"] [role="tab"] *,
        [data-testid="stTabs"] [aria-selected="true"] * {
            color: inherit !important;
        }

        [data-testid="stTabs"] [role="tab"]:hover,
        [data-testid="stTabs"] [role="tab"]:focus-visible,
        [data-testid="stTabs"] [aria-selected="true"] {
            color: var(--co-ink);
            background: var(--co-surface-2);
            box-shadow: inset 0 -1px 0 var(--co-hairline-strong);
        }

        [data-testid="stTabs"] [data-baseweb="tab-highlight"] {
            background-color: transparent;
        }

        [data-testid="stDataFrame"],
        [data-testid="stTable"] {
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid var(--co-hairline);
            background: var(--co-surface-1);
        }

        [data-testid="stExpander"] {
            background: var(--co-canvas);
            border: 1px solid var(--co-hairline-soft);
            border-radius: 8px;
        }

        [data-testid="stExpander"] summary,
        [data-testid="stExpander"] summary * {
            color: var(--co-ink) !important;
        }

        [data-testid="stAlert"] {
            border-radius: 8px;
            border: 1px solid var(--co-hairline);
            background: var(--co-surface-1);
            color: var(--co-ink);
        }

        .co-hero {
            display: grid;
            grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
            gap: 20px;
            align-items: stretch;
            margin: 10px 0 30px;
        }

        .co-hero-copy {
            min-width: 0;
            min-height: 290px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 40px 0;
        }

        .co-eyebrow {
            color: var(--co-muted);
            font-size: 13px;
            font-weight: 500;
            line-height: 1.2;
            margin-bottom: 14px;
        }

        .co-title {
            color: var(--co-ink);
            font-size: 62px;
            font-weight: 520;
            line-height: 0.98;
            letter-spacing: 0;
            max-width: 760px;
            text-wrap: balance;
        }

        .co-subtitle {
            color: var(--co-muted);
            max-width: 620px;
            font-size: 18px;
            line-height: 1.55;
            margin-top: 18px;
            text-wrap: pretty;
        }

        .co-pill-row {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 24px;
        }

        .co-pill {
            display: inline-flex;
            min-height: 40px;
            align-items: center;
            border-radius: 5px;
            padding: 8px 14px;
            background: var(--co-surface-1);
            color: var(--co-body);
            font-size: 14px;
            font-weight: 500;
            border: 1px solid var(--co-hairline);
        }

        .co-pill-primary {
            background: var(--co-gold);
            color: var(--co-deep);
            border-color: var(--co-gold);
            font-weight: 650;
        }

        .co-spotlight {
            position: relative;
            overflow: hidden;
            min-height: 290px;
            border-radius: 8px;
            padding: 30px;
            background:
                radial-gradient(circle at 18% 20%, rgba(212,77,240,0.96), transparent 33%),
                radial-gradient(circle at 78% 18%, rgba(106,76,245,0.9), transparent 35%),
                radial-gradient(circle at 70% 84%, rgba(255,122,61,0.94), transparent 38%),
                linear-gradient(135deg, #161616 0%, #0a0a0a 100%);
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 20px 60px rgba(0,0,0,0.38);
        }

        .co-spotlight::after {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.3));
            pointer-events: none;
        }

        .co-spotlight-content {
            position: relative;
            z-index: 1;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .co-spotlight-label {
            font-size: 13px;
            color: var(--co-muted);
            font-weight: 500;
        }

        .co-spotlight-value {
            color: var(--co-ink);
            font-size: 40px;
            font-weight: 620;
            line-height: 1;
            letter-spacing: 0;
        }

        .co-spotlight-meta {
            color: var(--co-body);
            font-size: 14px;
            line-height: 1.45;
            margin-top: 10px;
        }

        .co-action {
            border-radius: 8px;
            padding: 30px;
            background:
                radial-gradient(circle at 15% 12%, rgba(0,153,255,0.18), transparent 28%),
                var(--co-surface-2);
            border: 1px solid var(--co-hairline);
            margin: 16px 0 20px;
        }

        .co-action-label {
            color: var(--co-muted);
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 10px;
        }

        .co-action-text {
            color: var(--co-ink);
            font-size: 24px;
            line-height: 1.2;
            font-weight: 500;
            text-wrap: balance;
        }

        .status-pill {
            display: inline-block;
            padding: 8px 14px;
            border-radius: 5px;
            font-weight: 650;
            font-size: 13px;
            border: 1px solid var(--co-hairline);
        }

        .pill-low {
            color: #d9ffe7;
            background: rgba(34,197,94,0.16);
            border-color: rgba(34,197,94,0.28);
        }

        .pill-medium {
            color: #ffe4c8;
            background: rgba(255,122,61,0.16);
            border-color: rgba(255,122,61,0.28);
        }

        .pill-high {
            color: #ffd8e2;
            background: rgba(255,85,119,0.18);
            border-color: rgba(255,85,119,0.32);
        }

        .small-muted { color: var(--co-muted); font-size: 0.86rem; }
        .section-rule { border-top: 1px solid var(--co-hairline-soft); margin: 1rem 0; }

        @media (max-width: 810px) {
            .block-container { padding-top: 1rem; }
            .co-hero { grid-template-columns: 1fr; }
            .co-title { font-size: 40px; }
            .co-hero-copy {
                min-height: auto;
                padding: 24px 0;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                scroll-behavior: auto !important;
                transition-duration: 0.01ms !important;
            }

            .stButton > button:hover,
            .stFormSubmitButton > button:hover,
            .stButton > button:active,
            .stFormSubmitButton > button:active {
                transform: none;
            }
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def severity_pill(severity: str) -> str:
    css = {
        "Low": "pill-low",
        "Medium": "pill-medium",
        "High": "pill-high",
    }.get(severity, "pill-medium")
    return f'<span class="status-pill {css}">{severity}</span>'


def initialize_state() -> None:
    if "claim" not in st.session_state:
        st.session_state.claim = sample_claims()[0]
    if "analysis" not in st.session_state:
        st.session_state.analysis = analyze_claim(st.session_state.claim)
    if "live_note" not in st.session_state:
        st.session_state.live_note = None


def render_hero(analysis: dict[str, Any]) -> None:
    claim = analysis["claim"]
    risk = analysis["risk"]
    recommendation = analysis["recommendation"]
    st.markdown(
        f"""
        <div class="co-hero">
          <div class="co-hero-copy">
            <div class="co-eyebrow">ClaimsOps Agent / Insurance operations</div>
            <div class="co-title">Claims triage on a live operations canvas.</div>
            <div class="co-subtitle">
              A multi-agent workflow for intake, coverage, evidence review, risk routing,
              and customer communication across insurance lines.
            </div>
            <div class="co-pill-row">
              <span class="co-pill co-pill-primary">Human approval gate</span>
              <span class="co-pill">CrewAI ready</span>
              <span class="co-pill">Vertex AI optional</span>
            </div>
          </div>
          <div class="co-spotlight">
            <div class="co-spotlight-content">
              <div class="co-spotlight-label">Active claim</div>
              <div>
                <div class="co-spotlight-value">{risk['score']}/100</div>
                <div class="co-spotlight-meta">
                  {claim['claim_id']} - {claim['insurance_type']} - {risk['severity']} severity
                </div>
              </div>
              <div class="co-spotlight-meta">{recommendation['action']}</div>
            </div>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def sidebar() -> None:
    samples = sample_claims()
    labels = [f"{item['claim_id']} - {item['insurance_type']} - {item['customer_name']}" for item in samples]

    st.sidebar.title("ClaimsOps Agent")
    selected = st.sidebar.selectbox("Load sample claim", labels)
    sample = samples[labels.index(selected)]

    if st.sidebar.button("Load Selected Claim", width="stretch"):
        st.session_state.claim = sample
        st.session_state.analysis = analyze_claim(sample)
        st.session_state.live_note = None

    st.sidebar.divider()
    status = crewai_environment_status()
    st.sidebar.caption("CrewAI / Vertex AI")
    st.sidebar.write(f"CrewAI installed: **{status['crewai_installed']}**")
    st.sidebar.write(f"Live mode: **{status['live_enabled']}**")
    st.sidebar.write(f"Vertex project: `{status['vertex_project']}`")
    st.sidebar.write(f"Location: `{status['vertex_location']}`")
    st.sidebar.write(f"Model: `{status['model']}`")
    st.sidebar.caption("Default mode: deterministic demo workflow.")


def claim_form() -> None:
    claim = dict(st.session_state.claim)
    available_docs = [
        "claim_form",
        "customer_id",
        "photos",
        "police_report",
        "repair_estimate",
        "medical_invoice",
        "doctor_report",
        "travel_itinerary",
        "booking_receipt",
        "property_photos",
        "ownership_proof",
        "death_certificate",
        "beneficiary_id",
    ]

    with st.form("claim-form"):
        left, right = st.columns([1.1, 0.9])
        with left:
            claim["claim_id"] = st.text_input("Claim ID", value=claim.get("claim_id", ""))
            claim["customer_name"] = st.text_input("Customer name", value=claim.get("customer_name", ""))
            claim["policy_id"] = st.text_input("Policy ID", value=claim.get("policy_id", ""))
            claim["insurance_type"] = st.selectbox(
                "Insurance line",
                ["Auto", "Health", "Travel", "Home", "Life"],
                index=["Auto", "Health", "Travel", "Home", "Life"].index(claim.get("insurance_type", "Auto")),
            )
            claim["location"] = st.text_input("Incident location", value=claim.get("location", ""))
        with right:
            claim["incident_date"] = st.date_input("Incident date", value=pd.to_datetime(claim.get("incident_date")).date()).isoformat()
            claim["reported_date"] = st.date_input("Reported date", value=pd.to_datetime(claim.get("reported_date")).date()).isoformat()
            claim["claim_amount"] = st.number_input(
                "Estimated claim amount",
                min_value=0,
                max_value=250000,
                value=int(claim.get("claim_amount", 0)),
                step=500,
            )
            claim["documents"] = st.multiselect(
                "Submitted evidence",
                available_docs,
                default=[doc for doc in claim.get("documents", []) if doc in available_docs],
            )

        claim["description"] = st.text_area(
            "Claim description",
            value=claim.get("description", ""),
            height=110,
        )
        submitted = st.form_submit_button("Run ClaimsOps Agent Workflow", width="stretch")

    if submitted:
        st.session_state.claim = claim
        baseline = analyze_claim(claim)
        st.session_state.analysis = baseline
        st.session_state.live_note = try_live_crewai_summary(claim, baseline)


def review_panel(analysis: dict[str, Any]) -> None:
    claim = analysis["claim"]
    coverage = analysis["coverage"]
    evidence = analysis["evidence"]
    risk = analysis["risk"]
    recommendation = analysis["recommendation"]

    metric_cols = st.columns(5)
    metric_cols[0].metric("Risk score", f"{risk['score']}/100")
    metric_cols[1].metric("Severity", risk["severity"])
    metric_cols[2].metric("Evidence complete", f"{int(evidence['completion'] * 100)}%")
    metric_cols[3].metric("Coverage", "Yes" if coverage["covered"] else "Review")
    metric_cols[4].metric("SLA", recommendation["sla"])

    st.markdown(
        f"**{claim['claim_id']}** for **{claim['customer_name']}** is triaged as "
        f"{severity_pill(risk['severity'])}.",
        unsafe_allow_html=True,
    )
    st.markdown(
        f"""
        <div class="co-action">
          <div class="co-action-label">Recommended next action</div>
          <div class="co-action-text">{recommendation['action']}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    left, right = st.columns([1.1, 0.9])
    with left:
        st.subheader("Routing")
        st.write(f"**Owner:** {recommendation['owner']}")
        st.write(f"**Human approval gate:** {recommendation['human_gate']}")

        st.subheader("Coverage Check")
        st.write(coverage["reason"])
        if coverage["deductible"] is not None:
            st.write(f"**Deductible:** EUR {coverage['deductible']:,}")
            st.write(f"**Claim limit:** EUR {coverage['limit']:,}")
        if coverage["exclusions"]:
            st.write("**Exclusions:** " + ", ".join(coverage["exclusions"]))

    with right:
        st.subheader("Evidence Checklist")
        if evidence["missing"]:
            st.warning("Missing documents: " + ", ".join(evidence["missing"]))
        else:
            st.success("All required documents are present.")
        st.write("**Submitted:** " + (", ".join(evidence["submitted"]) or "None"))

        st.subheader("Risk Signals")
        for signal in risk["signals"]:
            st.write(f"- {signal}")

    st.subheader("Agent Trace")
    for index, step in enumerate(analysis["trace"], start=1):
        with st.expander(f"{index}. {step['agent']} - {step['tool_used']}", expanded=index == 1):
            st.write(f"**Decision:** {step['decision']}")
            st.write(f"**Observation:** {step['observation']}")

    if st.session_state.live_note:
        note = st.session_state.live_note
        if note.get("used_live_crewai"):
            st.info("Live CrewAI summary: " + note.get("summary", ""))
        else:
            st.caption(note.get("reason", "Live CrewAI mode was not used."))


def communications_panel(analysis: dict[str, Any]) -> None:
    communications = analysis["communications"]
    left, right = st.columns(2)
    with left:
        st.subheader("Customer Update Draft")
        st.text_area("Customer message", communications["customer_message"], height=170)
    with right:
        st.subheader("Adjuster Note Draft")
        st.text_area("Internal note", communications["adjuster_note"], height=170)

    approval_cols = st.columns(3)
    approval_cols[0].button("Approve Next Action", width="stretch")
    approval_cols[1].button("Request More Evidence", width="stretch")
    approval_cols[2].button("Escalate Manually", width="stretch")
    st.caption("Workflow actions remain gated by adjuster approval.")


def dashboard() -> None:
    analyses = [analyze_claim(item) for item in sample_claims()]
    rows = []
    for item in analyses:
        rows.append(
            {
                "Claim": item["claim"]["claim_id"],
                "Customer": item["claim"]["customer_name"],
                "Line": item["claim"]["insurance_type"],
                "Amount": item["claim"]["claim_amount"],
                "Severity": item["risk"]["severity"],
                "Risk Score": item["risk"]["score"],
                "Next Action": item["recommendation"]["action"],
                "Owner": item["recommendation"]["owner"],
            }
        )
    frame = pd.DataFrame(rows)

    st.subheader("Claims Operations Queue")
    st.dataframe(frame, width="stretch", hide_index=True)

    chart_cols = st.columns(2)
    with chart_cols[0]:
        st.caption("Severity Mix")
        st.bar_chart(frame.groupby("Severity").size())
    with chart_cols[1]:
        st.caption("Claims by Insurance Line")
        st.bar_chart(frame.groupby("Line").size())


def architecture() -> None:
    st.subheader("Agentic Architecture")
    st.graphviz_chart(
        """
        digraph {
          rankdir=LR;
          graph [bgcolor="#090909"];
          node [shape=box, style="rounded,filled", fillcolor="#141414", color="#262626", fontname="Arial", fontcolor="#FFFFFF", margin="0.18,0.12"];
          edge [color="#999999", fontcolor="#999999"];
          intake [label="Claims Intake Agent"];
          coverage [label="Coverage Verification Agent"];
          evidence [label="Evidence Review Agent"];
          risk [label="Risk & Fraud Triage Agent"];
          comms [label="Communication Agent"];
          supervisor [label="Supervisor Agent", fillcolor="#1c1c1c", color="#0099ff"];
          human [label="Human Adjuster Approval", fillcolor="#122318", color="#22c55e"];
          tools [label="Tools: policy lookup, history, checklist, risk rules, drafts", fillcolor="#241916", color="#ff7a3d"];
          intake -> supervisor;
          supervisor -> coverage;
          supervisor -> evidence;
          supervisor -> risk;
          supervisor -> comms;
          coverage -> tools;
          evidence -> tools;
          risk -> tools;
          comms -> tools;
          supervisor -> human;
        }
        """
    )
    st.write(
        "The supervisor agent decides which specialist agent/tool to call. "
        "Tools execute lookups, scoring, and drafting; the agent chooses the next action. "
        "Final approval remains with a human adjuster."
    )


def prompt_pack() -> None:
    docs = [
        DOCS_DIR / "prompts_and_tools.md",
        DOCS_DIR / "agent_skill_contract.md",
    ]
    found = [path for path in docs if path.exists()]
    if not found:
        st.info("Prompt pack files not found.")
        return

    for index, path in enumerate(found):
        if index:
            st.divider()
        st.markdown(path.read_text(encoding="utf-8"))


def main() -> None:
    inject_css()
    initialize_state()
    sidebar()

    render_hero(st.session_state.analysis)

    tab_submit, tab_review, tab_comms, tab_dashboard, tab_architecture, tab_prompts = st.tabs(
        [
            "Submit Claim",
            "Agent Review",
            "Communications",
            "Operations Dashboard",
            "Architecture",
            "Prompt Pack",
        ]
    )

    with tab_submit:
        claim_form()
    with tab_review:
        review_panel(st.session_state.analysis)
    with tab_comms:
        communications_panel(st.session_state.analysis)
    with tab_dashboard:
        dashboard()
    with tab_architecture:
        architecture()
    with tab_prompts:
        prompt_pack()


if __name__ == "__main__":
    main()

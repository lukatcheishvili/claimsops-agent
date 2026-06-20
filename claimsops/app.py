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
        .block-container {
            padding-top: 1.25rem;
            padding-bottom: 2rem;
        }
        [data-testid="stMetric"] {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 0.8rem 0.9rem;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .status-pill {
            display: inline-block;
            padding: 0.25rem 0.55rem;
            border-radius: 999px;
            font-weight: 700;
            font-size: 0.78rem;
            border: 1px solid transparent;
        }
        .pill-low { color: #166534; background: #dcfce7; border-color: #86efac; }
        .pill-medium { color: #92400e; background: #fef3c7; border-color: #fcd34d; }
        .pill-high { color: #991b1b; background: #fee2e2; border-color: #fca5a5; }
        .small-muted { color: #64748b; font-size: 0.86rem; }
        .section-rule { border-top: 1px solid #e2e8f0; margin: 1rem 0; }
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


def sidebar() -> None:
    samples = sample_claims()
    labels = [f"{item['claim_id']} - {item['insurance_type']} - {item['customer_name']}" for item in samples]

    st.sidebar.title("ClaimsOps Agent")
    selected = st.sidebar.selectbox("Load sample claim", labels)
    sample = samples[labels.index(selected)]

    if st.sidebar.button("Load selected claim", width="stretch"):
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
    st.sidebar.info("Demo mode is deterministic and recommended for the live presentation.")


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
        submitted = st.form_submit_button("Run ClaimsOps Agent workflow", width="stretch")

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

    left, right = st.columns([1.1, 0.9])
    with left:
        st.subheader("Recommended next action")
        st.success(recommendation["action"])
        st.write(f"**Owner:** {recommendation['owner']}")
        st.write(f"**Human approval gate:** {recommendation['human_gate']}")

        st.subheader("Coverage check")
        st.write(coverage["reason"])
        if coverage["deductible"] is not None:
            st.write(f"**Deductible:** EUR {coverage['deductible']:,}")
            st.write(f"**Claim limit:** EUR {coverage['limit']:,}")
        if coverage["exclusions"]:
            st.write("**Exclusions:** " + ", ".join(coverage["exclusions"]))

    with right:
        st.subheader("Evidence checklist")
        if evidence["missing"]:
            st.warning("Missing documents: " + ", ".join(evidence["missing"]))
        else:
            st.success("All required documents are present.")
        st.write("**Submitted:** " + (", ".join(evidence["submitted"]) or "None"))

        st.subheader("Risk signals")
        for signal in risk["signals"]:
            st.write(f"- {signal}")

    st.subheader("Agent trace")
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
        st.subheader("Customer update draft")
        st.text_area("Customer message", communications["customer_message"], height=170)
    with right:
        st.subheader("Adjuster note draft")
        st.text_area("Internal note", communications["adjuster_note"], height=170)

    approval_cols = st.columns(3)
    approval_cols[0].button("Approve next action", width="stretch")
    approval_cols[1].button("Request more evidence", width="stretch")
    approval_cols[2].button("Escalate manually", width="stretch")
    st.caption("Buttons are demo controls. In production they would create audited workflow actions.")


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

    st.subheader("Claims operations queue")
    st.dataframe(frame, width="stretch", hide_index=True)

    chart_cols = st.columns(2)
    with chart_cols[0]:
        st.caption("Severity mix")
        st.bar_chart(frame.groupby("Severity").size())
    with chart_cols[1]:
        st.caption("Claims by insurance line")
        st.bar_chart(frame.groupby("Line").size())


def architecture() -> None:
    st.subheader("Agentic architecture")
    st.graphviz_chart(
        """
        digraph {
          rankdir=LR;
          node [shape=box, style="rounded,filled", fillcolor="#FFFFFF", color="#CBD5E1", fontname="Arial"];
          intake [label="Claims Intake Agent"];
          coverage [label="Coverage Verification Agent"];
          evidence [label="Evidence Review Agent"];
          risk [label="Risk & Fraud Triage Agent"];
          comms [label="Communication Agent"];
          supervisor [label="Supervisor Agent", fillcolor="#DBEAFE", color="#60A5FA"];
          human [label="Human Adjuster Approval", fillcolor="#DCFCE7", color="#86EFAC"];
          tools [label="Tools: policy lookup, history, checklist, risk rules, drafts", fillcolor="#FEF3C7", color="#FCD34D"];
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
    path = DOCS_DIR / "prompts_and_tools.md"
    if path.exists():
        st.markdown(path.read_text(encoding="utf-8"))
    else:
        st.info("Prompt pack file not found.")


def main() -> None:
    inject_css()
    initialize_state()
    sidebar()

    st.title("ClaimsOps Agent")
    st.caption("Agentic AI MVP for insurance claims operations")

    tab_submit, tab_review, tab_comms, tab_dashboard, tab_architecture, tab_prompts = st.tabs(
        [
            "Submit claim",
            "Agent review",
            "Communications",
            "Operations dashboard",
            "Architecture",
            "Prompt pack",
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

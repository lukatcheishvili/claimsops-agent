from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any


DATA_DIR = Path(__file__).resolve().parents[1] / "demo_data"


@dataclass(frozen=True)
class AgentStep:
    agent: str
    decision: str
    observation: str
    tool_used: str


def load_json(name: str) -> Any:
    path = DATA_DIR / name
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def sample_claims() -> list[dict[str, Any]]:
    return load_json("sample_claims.json")


def policies() -> list[dict[str, Any]]:
    return load_json("policies.json")


def claim_history() -> list[dict[str, Any]]:
    return load_json("claim_history.json")


def document_requirements() -> dict[str, list[str]]:
    return load_json("document_requirements.json")


def blank_claim() -> dict[str, Any]:
    return {
        "claim_id": "CLM-DEMO-NEW",
        "customer_name": "",
        "policy_id": "",
        "insurance_type": "Auto",
        "incident_date": date.today().isoformat(),
        "reported_date": date.today().isoformat(),
        "claim_amount": 0,
        "location": "",
        "description": "",
        "documents": [],
    }


def analyze_claim(claim: dict[str, Any]) -> dict[str, Any]:
    normalized = normalize_claim(claim)
    policy = find_policy(normalized["policy_id"])
    history = find_claim_history(normalized["policy_id"])
    coverage = evaluate_coverage(normalized, policy)
    evidence = evaluate_evidence(normalized)
    risk = evaluate_risk(normalized, policy, history, evidence, coverage)
    recommendation = choose_recommendation(coverage, evidence, risk)
    trace = build_trace(normalized, policy, coverage, evidence, risk, recommendation)
    communications = draft_communications(normalized, policy, evidence, risk, recommendation)

    return {
        "claim": normalized,
        "policy": policy,
        "history": history,
        "coverage": coverage,
        "evidence": evidence,
        "risk": risk,
        "recommendation": recommendation,
        "communications": communications,
        "trace": [step.__dict__ for step in trace],
    }


def normalize_claim(claim: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(claim)
    normalized["insurance_type"] = str(normalized.get("insurance_type", "Auto")).strip().title()
    normalized["policy_id"] = str(normalized.get("policy_id", "")).strip().upper()
    normalized["customer_name"] = str(normalized.get("customer_name", "")).strip() or "Customer"
    normalized["description"] = str(normalized.get("description", "")).strip()
    normalized["location"] = str(normalized.get("location", "")).strip()
    normalized["claim_amount"] = int(float(normalized.get("claim_amount", 0) or 0))
    normalized["documents"] = sorted(set(normalized.get("documents", [])))
    return normalized


def find_policy(policy_id: str) -> dict[str, Any] | None:
    return next((policy for policy in policies() if policy["policy_id"] == policy_id), None)


def find_claim_history(policy_id: str) -> list[dict[str, Any]]:
    return [item for item in claim_history() if item["policy_id"] == policy_id]


def evaluate_coverage(claim: dict[str, Any], policy: dict[str, Any] | None) -> dict[str, Any]:
    if policy is None:
        return {
            "status": "not_found",
            "covered": False,
            "reason": "No matching policy was found.",
            "deductible": None,
            "limit": None,
            "exclusions": [],
        }

    incident = parse_date(claim["incident_date"])
    start = parse_date(policy["effective_date"])
    end = parse_date(policy["expiration_date"])
    type_match = policy["insurance_type"].lower() == claim["insurance_type"].lower()
    in_window = start <= incident <= end
    active = policy["status"].lower() == "active"
    amount_ok = claim["claim_amount"] <= int(policy["claim_limit"])

    covered = active and type_match and in_window and amount_ok
    reasons = []
    if not active:
        reasons.append("Policy is not active.")
    if not type_match:
        reasons.append("Claim type does not match policy line.")
    if not in_window:
        reasons.append("Incident date is outside the policy period.")
    if not amount_ok:
        reasons.append("Claim amount exceeds policy limit.")
    if not reasons:
        reasons.append("Policy is active and claim is within configured coverage limits.")

    return {
        "status": "covered" if covered else "manual_review",
        "covered": covered,
        "reason": " ".join(reasons),
        "deductible": policy["deductible"],
        "limit": policy["claim_limit"],
        "exclusions": policy["exclusions"],
    }


def evaluate_evidence(claim: dict[str, Any]) -> dict[str, Any]:
    requirements = document_requirements().get(claim["insurance_type"], [])
    submitted = set(claim.get("documents", []))
    missing = [doc for doc in requirements if doc not in submitted]
    completion = 1.0 if not requirements else (len(requirements) - len(missing)) / len(requirements)
    return {
        "required": requirements,
        "submitted": sorted(submitted),
        "missing": missing,
        "completion": round(completion, 2),
    }


def evaluate_risk(
    claim: dict[str, Any],
    policy: dict[str, Any] | None,
    history: list[dict[str, Any]],
    evidence: dict[str, Any],
    coverage: dict[str, Any],
) -> dict[str, Any]:
    score = 12
    signals: list[str] = []
    description = claim["description"].lower()
    amount = claim["claim_amount"]
    history_count = len(history)

    if amount >= 50000:
        score += 25
        signals.append("High claimed amount.")
    elif amount >= 15000:
        score += 15
        signals.append("Moderate-to-high claimed amount.")
    elif amount >= 5000:
        score += 8
        signals.append("Material claim amount.")

    if evidence["missing"]:
        score += min(24, 6 * len(evidence["missing"]))
        signals.append("Required evidence is missing.")

    if not coverage["covered"]:
        score += 18
        signals.append("Coverage requires manual review.")

    if history_count >= 3:
        score += 20
        signals.append("Multiple prior claims on this policy.")
    elif history_count == 2:
        score += 12
        signals.append("Two prior claims on this policy.")
    elif history_count == 1:
        score += 5
        signals.append("One prior claim on this policy.")

    keyword_rules = {
        "injury": 12,
        "hospital": 12,
        "stolen": 10,
        "theft": 10,
        "fire": 10,
        "flood": 8,
        "total loss": 14,
        "urgent": 8,
        "fraud": 15,
    }
    negated_terms = {"injury": ["no injury", "without injury", "no injuries"]}
    for keyword, points in keyword_rules.items():
        if keyword in description:
            if any(term in description for term in negated_terms.get(keyword, [])):
                continue
            score += points
            signals.append(f"Description contains '{keyword}'.")

    late_days = days_between(claim["incident_date"], claim["reported_date"])
    if late_days > 30:
        score += 12
        signals.append("Claim was reported more than 30 days after the incident.")
    elif late_days > 10:
        score += 6
        signals.append("Claim was reported more than 10 days after the incident.")

    if policy and policy["customer_segment"] == "VIP" and coverage["covered"]:
        score -= 5
        signals.append("VIP segment with active coverage reduces routing friction.")

    score = max(0, min(100, score))
    severity = "Low"
    if score >= 60:
        severity = "High"
    elif score >= 35:
        severity = "Medium"

    urgency = "Standard"
    if severity == "High":
        urgency = "Same day adjuster review"
    elif evidence["missing"]:
        urgency = "Customer follow-up within 24 hours"

    if not signals:
        signals.append("No unusual operational risk signals identified.")

    return {
        "score": score,
        "severity": severity,
        "urgency": urgency,
        "signals": signals,
    }


def choose_recommendation(
    coverage: dict[str, Any],
    evidence: dict[str, Any],
    risk: dict[str, Any],
) -> dict[str, Any]:
    if risk["score"] >= 75:
        action = "Escalate to senior adjuster and special investigation review"
        owner = "Senior Adjuster / SIU"
        human_gate = "Mandatory before customer decision or payment"
    elif not coverage["covered"]:
        action = "Route to manual coverage review"
        owner = "Coverage Specialist"
        human_gate = "Mandatory before denial or settlement"
    elif evidence["missing"]:
        action = "Request missing documents and pause settlement review"
        owner = "Claims Operations"
        human_gate = "Required before final settlement"
    elif risk["severity"] == "Medium":
        action = "Assign to adjuster with medium-priority review"
        owner = "Claims Adjuster"
        human_gate = "Adjuster approval required"
    else:
        action = "Fast-track for human approval"
        owner = "Claims Adjuster"
        human_gate = "Human approval before payment"

    return {
        "action": action,
        "owner": owner,
        "human_gate": human_gate,
        "sla": "4 business hours" if risk["severity"] == "High" else "1 business day",
    }


def draft_communications(
    claim: dict[str, Any],
    policy: dict[str, Any] | None,
    evidence: dict[str, Any],
    risk: dict[str, Any],
    recommendation: dict[str, Any],
) -> dict[str, str]:
    missing = evidence["missing"]
    first_name = claim["customer_name"].split()[0]
    policy_label = policy["policy_id"] if policy else claim["policy_id"]

    if missing:
        missing_sentence = " We still need: " + ", ".join(missing) + "."
    else:
        missing_sentence = " We have the core documents required for initial review."

    customer = (
        f"Hi {first_name}, we received your {claim['insurance_type'].lower()} claim "
        f"for policy {policy_label}.{missing_sentence} "
        "A claims specialist will review the case before any final decision is made."
    )

    adjuster = (
        f"Claim {claim['claim_id']} is triaged as {risk['severity']} risk "
        f"with score {risk['score']}/100. Recommended action: "
        f"{recommendation['action']}. Human gate: {recommendation['human_gate']}."
    )

    return {
        "customer_message": customer,
        "adjuster_note": adjuster,
    }


def build_trace(
    claim: dict[str, Any],
    policy: dict[str, Any] | None,
    coverage: dict[str, Any],
    evidence: dict[str, Any],
    risk: dict[str, Any],
    recommendation: dict[str, Any],
) -> list[AgentStep]:
    policy_observation = (
        f"Found policy {policy['policy_id']} for {policy['customer_name']}."
        if policy
        else "No policy record found."
    )
    return [
        AgentStep(
            agent="Claims Intake Agent",
            decision="Normalize the claim and identify the insurance playbook.",
            observation=f"Detected {claim['insurance_type']} claim for {claim['customer_name']}.",
            tool_used="claim_intake_parser",
        ),
        AgentStep(
            agent="Coverage Verification Agent",
            decision="Check whether policy and claim details allow initial coverage.",
            observation=f"{policy_observation} {coverage['reason']}",
            tool_used="policy_lookup_tool",
        ),
        AgentStep(
            agent="Evidence Review Agent",
            decision="Compare submitted evidence against the line-specific checklist.",
            observation=(
                "Missing: " + ", ".join(evidence["missing"])
                if evidence["missing"]
                else "All required documents are present."
            ),
            tool_used="document_requirements_tool",
        ),
        AgentStep(
            agent="Risk & Fraud Triage Agent",
            decision="Score severity, urgency, and operational risk signals.",
            observation=f"{risk['severity']} severity, {risk['score']}/100 risk score.",
            tool_used="risk_scoring_tool",
        ),
        AgentStep(
            agent="Supervisor Agent",
            decision="Choose next action and enforce the human approval gate.",
            observation=f"{recommendation['action']} assigned to {recommendation['owner']}.",
            tool_used="next_action_tool",
        ),
        AgentStep(
            agent="Communication Agent",
            decision="Draft customer and adjuster communications without finalizing the claim.",
            observation="Prepared customer update and internal adjuster note.",
            tool_used="communication_draft_tool",
        ),
    ]


def parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def days_between(start: str, end: str) -> int:
    return (parse_date(end) - parse_date(start)).days

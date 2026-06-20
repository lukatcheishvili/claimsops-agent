# ClaimsOps Agent Skill Contract

## Trigger

Use this workflow when a user submits, loads, or reviews an insurance claim across auto, health, travel, home, or life insurance.

## Inputs

- Claim ID, customer name, policy ID, insurance line, location, incident date, reported date, claim amount, submitted evidence, and claim description.
- Demo data from policy, claim history, document requirement, and sample claim JSON files.
- Optional live CrewAI and Vertex AI environment settings.

## Tools

| Tool | Executes | Agent decides |
| --- | --- | --- |
| `policy_lookup_tool` | Finds policy status, limits, deductibles, exclusions, and coverage window. | Whether coverage is clear or needs human review. |
| `claim_history_tool` | Retrieves prior claims for the same policy. | Whether history changes risk routing. |
| `document_requirements_tool` | Compares submitted documents with line-specific requirements. | Whether to request evidence or continue review. |
| `risk_scoring_tool` | Applies deterministic severity and risk rules. | Priority, routing, and escalation recommendation. |
| `next_action_tool` | Creates the recommended owner, SLA, and workflow action. | Whether the action is safe as a recommendation. |
| `communication_draft_tool` | Drafts customer and adjuster messages. | Whether wording remains non-final and human-gated. |
| `vertex_live_review_tool` | Calls Gemini on Vertex AI from the Vercel API route when credentials are configured. | Whether the live explanation is consistent with deterministic tool facts and human-gate constraints. |

## Specialist Agents

- Claims Intake Agent: normalizes the submitted claim and identifies the insurance playbook.
- Coverage Verification Agent: checks policy fit, active status, dates, limits, deductibles, and exclusions.
- Evidence Review Agent: checks missing and submitted evidence against requirements.
- Risk And Fraud Triage Agent: scores severity and identifies risk signals without making accusations.
- Communication Agent: drafts customer and adjuster messages.
- Supervisor Agent: chooses specialist order, composes the trace, and recommends the next action.

## Guardrails

- Do not approve, deny, settle, pay, or accuse fraud.
- Do not invent policy facts, customer history, document requirements, or coverage terms.
- Escalate ambiguous coverage, high risk, sensitive decisions, and missing critical evidence.
- Keep customer messages clear, empathetic, and non-final.
- Keep personally identifiable information minimized in demo data.

## Outputs

- Normalized claim record.
- Coverage check and evidence readiness.
- Risk score, severity, urgency, and signals.
- Recommended owner, SLA, next action, and human approval gate.
- Customer and adjuster communication drafts.
- Step-by-step agent trace for auditability.
- Optional Vertex AI live review with plain-English reasoning, adjuster questions, customer next steps, and caveats.

## Verification

- Deterministic mode returns a complete analysis for every sample claim.
- Live CrewAI and Vercel Vertex AI modes are optional and fall back safely if credentials, dependencies, or network calls fail.
- Streamlit UI keeps selected values and button text readable without hover.
- Prompt Pack tab shows both this contract and the prompt/tool pack.

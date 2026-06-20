# Product

## ClaimsOps Agent

ClaimsOps Agent is a clickable Streamlit MVP for insurance claims operations. It demonstrates how a multi-agent workflow can intake a claim, verify coverage, review evidence, score risk, recommend routing, and draft customer and adjuster communications while keeping final decisions with a human adjuster.

## Users

- Course evaluators and classmates who need to understand the project quickly during a live demo.
- Claims operations managers who care about queue visibility, consistency, auditability, and SLA routing.
- Claims adjusters who need a clear recommendation without losing control over approval, denial, settlement, or escalation decisions.
- Technical reviewers who need to see where CrewAI, Vertex AI, deterministic tools, and human approval gates fit together.

## Product Purpose

The MVP proves that agentic claims operations can be useful without pretending to automate final insurance decisions. Success means a viewer can load or submit a claim, see the agent trace, inspect the recommended next action, and understand why the workflow remains human-in-the-loop.

## Brand Personality

Precise, operational, and trustworthy. The app should feel like a control surface for professional claims work, not a generic AI showcase. It should be confident, clear, and restrained.

## Anti-References

- Generic AI dashboards with vague "boost productivity" copy, glass panels, or decorative effects that compete with the working demo.
- Marketing landing pages that delay the actual working demo.
- Low-contrast dark UI where button text, selected claims, or dropdown states disappear.
- Automation language that implies the agent can approve, deny, settle, or pay claims without human review.

## Design Principles

1. Show the workflow first. The opening screen should make the active claim, risk score, and agent route visible immediately.
2. Keep the product lane. This is an operations tool, so density, scanability, stable controls, and audit trails matter more than decorative storytelling.
3. Make states impossible to miss. Hover, active, focus, selected, disabled, and warning states must remain readable without relying on pointer hover.
4. Preserve human authority. All high-impact outputs are recommendations, drafts, or tasks until a human adjuster approves them.
5. Make the demo resilient. Deterministic mode must work without cloud credentials; live CrewAI and Vertex AI remain optional.

## Accessibility Baseline

- WCAG 2.1 AA contrast target for text and controls.
- Visible `:focus-visible` states for keyboard users.
- Controls must fit long claim IDs, names, and policy values without overlapping.
- Motion must respect `prefers-reduced-motion`.
- Charts, tables, and architecture diagrams should use the same palette as the rest of the app.

# Agent Instructions

Read `PRODUCT.md` and `DESIGN.md` before changing this project.

## Project Contract

ClaimsOps Agent is a classroom-ready MVP for insurance claims operations. Preserve deterministic demo mode as the default. CrewAI and Vertex AI are optional live paths and must fail gracefully without breaking the demo.

## Agent Skill Best Practices

- Start with the goal, user, inputs, tools, outputs, guardrails, and verification steps.
- Keep agent behavior explicit in docs and code. Do not hide critical safety rules only inside prompts.
- Separate tool execution from agent judgment. Tools can look up policy data, compare evidence, calculate risk, and draft messages; the agent recommends what to do next.
- Keep all final insurance decisions human-gated. The app must not approve, deny, settle, pay, or accuse fraud without human review.
- Make the audit trail visible. Agent steps should include specialist, tool used, decision, and observation.
- Keep class demos reliable. Deterministic mode should work without cloud credentials, network access, or LLM quota.

## Design Workflow

- Reuse the CSS tokens in `claimsops/app.py` before introducing a new visual value.
- Follow the system in `DESIGN.md`: warm dark surfaces, gold primary actions, patina focus/state, small radii, flat panels, and no nested card feel.
- Check rest, hover, active, focus, and selected states. Text must never disappear until hover.
- Treat Streamlit selectors, buttons, tabs, alerts, expanders, charts, and Graphviz as one product surface.

## Safety

- Never commit `.env`, `.streamlit/secrets.toml`, `.venv`, `.crewai_state`, course materials, screenshots, or generated caches.
- Do not use or print user-provided credentials. If a token is exposed in chat, remind the user to revoke and rotate it.
- Runtime settings belong in `.env` locally or deployment secrets, not in source code.

## Verification Before Push

Run these from the project root:

```powershell
.venv\Scripts\python -m py_compile claimsops\app.py claimsops\core\engine.py claimsops\core\crewai_adapter.py
rg -n "transition:\s*all|outline:\s*none|outline-none|user-scalable|maximum-scale|onPaste" claimsops .streamlit README.md docs PRODUCT.md DESIGN.md -S
rg -n "#(0099ff|d44df0|6a4cf5|ff7a3d|FFFFFF|000000|090909|141414|1c1c1c)" claimsops .streamlit README.md docs PRODUCT.md DESIGN.md -S
```

If UI code changed, start Streamlit and verify `http://localhost:8502` returns HTTP 200. When possible, visually inspect the sidebar, tabs, form controls, dashboard, architecture diagram, and prompt pack.

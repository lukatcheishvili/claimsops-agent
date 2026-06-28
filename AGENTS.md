# Agent Instructions

Read `docs/agent.md`, `docs/project/PRODUCT.md`, and `docs/project/DESIGN.md` before changing this project.

## Project Contract

ClaimsOps Agent is a classroom-ready MVP for insurance claims operations. Preserve deterministic demo mode as the default. CrewAI and Vertex AI are optional live paths and must fail gracefully without breaking the demo. The repo has two user surfaces: the original Streamlit app in `claimsops/app.py` and the Vercel-ready Next.js replica in `src/app/`, `src/components/`, and `src/lib/`. The latest continuation notes, project rating, verification history, and open context live in `docs/agent.md`.

## Agent Skill Best Practices

- Start with the goal, user, inputs, tools, outputs, guardrails, and verification steps.
- Keep agent behavior explicit in docs and code. Do not hide critical safety rules only inside prompts.
- Separate tool execution from agent judgment. Tools can look up policy data, compare evidence, calculate risk, and draft messages; the agent recommends what to do next.
- Keep all final insurance decisions human-gated. The app must not approve, deny, settle, pay, or accuse fraud without human review.
- Make the audit trail visible. Agent steps should include specialist, tool used, decision, and observation.
- Keep class demos reliable. Deterministic mode should work without cloud credentials, network access, or LLM quota.

## Design Workflow

- Reuse the CSS tokens in `claimsops/app.py` or `src/app/globals.css` before introducing a new visual value.
- Follow the system in `docs/project/DESIGN.md`: Framer-style dark surfaces, white primary actions, blue focus/live state, energetic accent colors, small radii, flat panels, and no nested card feel.
- Check rest, hover, active, focus, and selected states. Text must never disappear until hover.
- Treat Streamlit selectors, buttons, tabs, alerts, expanders, charts, and Graphviz as one product surface.
- Keep the Next.js/Vercel replica behaviorally aligned with the Streamlit app when changing demo data, claims scoring, agent trace, tabs, or presentation copy. The Vercel dashboard uses Recharts, so preserve chart responsiveness and dark-theme tooltip readability when changing visualizations.

## Safety

- Never commit `.env`, `.streamlit/secrets.toml`, `.venv`, `.crewai_state`, course materials, screenshots, or generated caches.
- Do not use or print user-provided credentials. If a token is exposed in chat, remind the user to revoke and rotate it.
- Runtime settings belong in `.env` locally or deployment secrets, not in source code.

## Commit And Pull Request Attribution

- Never add an LLM, AI assistant, or coding agent as a contributor, author, or co-author on any commit or pull request to this repository.
- Do not append `Co-Authored-By: Claude ...` (or any other AI/agent) trailers to commit messages, and do not add "Generated with ..." AI attribution to pull request descriptions.
- The only contributors on a pull request to `main` are the human users (the project team). Attribute work solely to the user who requested it.

## Verification Before Push

Run these from the project root:

```powershell
.venv\Scripts\python -m py_compile claimsops\app.py claimsops\core\engine.py claimsops\core\crewai_adapter.py
rg -n --glob '!README.md' --glob '!AGENTS.md' "transition:\s*all|outline:\s*none|outline-none|user-scalable|maximum-scale|onPaste" claimsops src .streamlit docs -S
pnpm build
```

If UI code changed, start Streamlit and verify `http://localhost:8502` returns HTTP 200. When possible, visually inspect the sidebar, tabs, form controls, dashboard, architecture diagram, and prompt pack.

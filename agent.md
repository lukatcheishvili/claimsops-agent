# ClaimsOps Agent Continuation Log

Last updated: 2026-06-24

## Current Objective

Build a classroom-ready agentic AI MVP for **Insurance - Claims Operations** that clearly demonstrates an interactive agent, explainable claims triage, human approval controls, Vertex AI readiness, and a professional operations UI.

Live demo: [ClaimsOps Agent on Vercel](https://claimsops-agent-git-main-lukatcheishvilis-projects.vercel.app/)

Team:

- Shreya Jha
- Claudia Aranguren Moliner
- Luka Tcheishvili
- Mohammad Alkhan
- Ghezlan Almatar

## Latest Product State

The project now has two surfaces:

- **Next.js / Vercel MVP** in `src/`: the preferred presentation demo.
- **Streamlit / Python MVP** in `claimsops/`: original Python implementation with optional CrewAI + Vertex AI path.

The Next.js MVP includes:

- Claim intake for auto, health, travel, home, and life insurance.
- Sample claim loader.
- Evidence checklist with human-readable labels.
- Evidence upload simulation for missing documents.
- Full-height right-side Agent Chat rail for natural-language interaction with the ClaimsOps agent from any primary workflow tab, with a canvas toggle to hide or show it.
- Agent Review tab with risk, coverage, evidence, history, reasoning trace, Vertex AI panel, and downloadable HTML review report.
- Communications tab with customer and adjuster drafts plus human approval action log.
- Operations Dashboard with Recharts visualizations.
- Manager View for highest-value operational controls.
- Architecture tab with professional workflow board and hover popovers for every node.
- Prompt Pack tab with the prompt/tool contract.
- Guided Demo Mode for classroom presentation.

## Agent Architecture

Specialist agents:

- **Claims Intake Agent** normalizes claim facts and chooses the insurance playbook.
- **Coverage Verification Agent** checks policy status, coverage window, insurance line, limits, deductible, and exclusions.
- **Evidence Review Agent** compares submitted evidence against line-specific requirements.
- **Risk and Fraud Triage Agent** scores exposure, history, missing evidence, reporting delay, and operational risk.
- **Communication Agent** drafts customer and adjuster messages without finalizing the claim.
- **Supervisor Agent** combines outputs and recommends the next action.

Guardrail:

- The agent can recommend, explain, prioritize, and draft.
- The agent must not approve, deny, settle, pay, or accuse fraud.
- Human approval remains required for final claim actions.

## Latest Implementation Log

2026-06-24 pass:

- Updated Vertex AI defaults from the retired Gemini 2.0 Flash path to `gemini-2.5-flash` with `global` location support. The Next.js API route now uses `https://aiplatform.googleapis.com` when location is `global`, while still supporting regional Vertex endpoints.
- Expanded **Agent Chat** from the hero area into a full-height right-side canvas rail. It now owns the right side of the desktop layout, keeps the active claim summary above the conversation, and gives the chat message stream the remaining vertical space.
- Kept the existing canvas chat toggle so presenters can hide the right rail when they need more workspace and show it again for agent interaction.
- Added responsive behavior so the chat rail stacks as a normal full-width panel on smaller screens instead of squeezing the main claim workflow.

2026-06-20 pass:

- Added a compact **Vertex AI Config** box in the left sidebar. It accepts Project ID, masked Project Number, location, model, and a masked one-time service account JSON value, then reruns the active claim with those settings. The API validates client-provided project settings, parses the credential only for the active request, and continues to return `***` for project number.
- Clarified the Vertex run path so Project ID and Project Number are treated as settings, not credentials. If no service account JSON is present, Apply And Run stops and shows a targeted credential warning.
- Changed the Vercel Vertex AI runtime to request live mode by default for project `agenticai-500006`. The UI should no longer show **Disabled** unless `VERTEX_AI_LIVE=false` is explicitly set. If credentials are not present, it will show **Needs Credentials**.
- Added local `.env.local` with non-secret Vertex project settings. It is ignored by Git and still requires a real `GOOGLE_SERVICE_ACCOUNT_JSON` value for live calls.
- Moved **Agent Chat** out of the tab bar and into the right-side canvas rail, with a canvas control button to show or hide it.
- Added deterministic chat answers for evidence, risk, coverage, routing, architecture, Vertex status, approval gate, and audit history.
- Added **Guided Demo Mode** with six presentation steps.
- Added **Evidence Upload Simulation** to close missing-document gaps from the intake form.
- Added **Download Claim Review** export in Agent Review.
- Added **Vertex Runtime Status** panel so live-mode readiness is visible.
- Added **Human Approval Action Log** in Communications.
- Added **Manager View** with manual queue, evidence blockers, high-risk claims, urgent SLA count, approval event count, owner load chart, manager actions, and SLA watchlist.
- Updated README with new workflows, repo structure, Vercel link, Vertex setup, and verification commands.
- Updated `AGENTS.md` so future AI agents read this file before making changes.

Previous important pushed work:

- Added Next.js / Vercel replica of the Streamlit MVP.
- Added Vertex AI API route and fallback behavior.
- Added architecture workflow board with professional lines.
- Fixed graph line alignment issues.
- Removed snake_case labels from user-facing evidence and tool names.
- Added hover popovers to every architecture node.
- Added fullscreen and sidebar toggle controls.
- Updated Streamlit styling earlier in the project to address dark-mode hover/readability issues.

## Current Evaluation

Self-rating after the latest pass: **98 / 100**

Scoring:

| Area | Score | Notes |
|---|---:|---|
| Agent interaction | 98 | Chat exists, understands current claim context, and explains decisions in non-technical language. |
| Claims workflow completeness | 98 | Intake, coverage, evidence, risk, routing, communications, approval, and manager oversight are represented. |
| Human-in-the-loop safety | 99 | Final decisions are explicitly human-gated in UI, docs, trace, chat answers, and approval controls. |
| UI/UX quality | 97 | Vercel UI is polished, responsive, and uses the prior dark ClaimsOps visual system. |
| Dashboard and visualizations | 97 | Recharts dashboard plus manager view give stronger operations storytelling. |
| Vertex AI readiness | 97 | Route and status panels are implemented; live mode still requires deployment credentials. |
| Documentation and handoff | 98 | README, AGENTS.md, and this continuation log explain how to continue. |

Why it is not 100:

- Vertex AI live mode cannot be fully validated without service account credentials in Vercel or local environment.
- The chat is deterministic and claim-aware, but not a full streaming LLM chat UI yet.
- No persistent database exists; approval log is session-only for demo safety and speed.
- No automated UI screenshot regression test is committed.

## Verification Log

Latest verification run from `claimsops-agent-repo` on 2026-06-24:

```powershell
pnpm build
```

Result:

- Next.js 15.5.19 production build completed successfully.
- `/` prerendered as static content.
- `/api/claimsops/analyze` built as dynamic route.

Local smoke check:

```powershell
Invoke-WebRequest http://localhost:3000
```

Result:

- HTTP 200.

Secret hygiene check:

- No matches for the exposed private-key or GitHub token fragments in tracked project files. The scan pattern itself was intentionally not stored here so future scans do not match the log text.

Design/security scan:

```powershell
rg -n --glob '!README.md' --glob '!AGENTS.md' "transition:\s*all|outline:\s*none|outline-none|user-scalable|maximum-scale|onPaste" claimsops src .streamlit docs -S
```

Expected result:

- No app-code matches. If it reports matches in docs, inspect them manually.

Diff hygiene:

```powershell
git diff --check
```

Result:

- No whitespace errors. PowerShell may show Git line-ending warnings on Windows; those are not functional failures.

## Vertex AI Context

Project settings provided by the user:

- Project ID: `agenticai-500006`
- Project Number: `***`
- Location: `global`
- Model: `gemini-2.5-flash`

Vercel environment variables needed:

```text
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=agenticai-500006
GOOGLE_CLOUD_PROJECT_NUMBER=***
GOOGLE_CLOUD_LOCATION=global
VERTEX_AI_LIVE=true
VERTEX_AI_MODEL=gemini-2.5-flash
GOOGLE_SERVICE_ACCOUNT_JSON={...service account JSON...}
```

The app requests live mode by default. Use `VERTEX_AI_LIVE=false` only when a deterministic-only deployment is desired.

Do not commit service account JSON or local `.env` files.

## Security Note

A GitHub token was shared in chat earlier in the project. Do not write it into files, logs, commits, comments, or terminal output. The safest action is to revoke and rotate that token in GitHub.

## Suggested Next Refinements

Highest-value next steps:

1. Add a real LLM chat path behind the right-side Agent Chat rail using the existing `/api/claimsops/analyze` route or a new `/api/claimsops/chat` route.
2. Store approval events in a lightweight persistence layer if the class demo needs multi-session history.
3. Add a PDF export option in addition to HTML.
4. Add a small Cypress or Playwright smoke test for tabs, chat, architecture popovers, and report download.
5. Add Vercel environment variables and redeploy to confirm live Vertex AI mode.
6. Record a short demo script for each team member: problem, architecture, workflow, dashboard, safety, and future work.

## Continuation Checklist For The Next AI Agent

Before editing:

- Read `README.md`, `AGENTS.md`, this `agent.md`, `docs/project/PRODUCT.md`, and `docs/project/DESIGN.md`.
- Check `git status --short`.
- Preserve deterministic demo mode.
- Keep all final claim decisions human-gated.
- Do not commit secrets, course materials, screenshots, `.env`, `.venv`, `.next`, or generated caches.

Before pushing:

- Run `pnpm build`.
- Run the design/security scan from the README.
- Check `git diff --check`.
- Smoke-test `http://localhost:3000`.
- Update this file with what changed, what was verified, and any remaining gaps.

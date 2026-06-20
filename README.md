# ClaimsOps Agent

Agentic AI MVP for insurance claims operations. The app demonstrates how a multi-agent claims workflow can intake a claim, verify policy coverage, inspect evidence, score operational risk, recommend the next action, and draft customer and adjuster communications.

## Quick Start

### Streamlit MVP

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m streamlit run claimsops\app.py
```

The default app runs in deterministic demo mode, so it is safe for a live class presentation without cloud credentials.

### Vercel / Next.js Replica

The repository also includes a Vercel-ready Next.js version of the same clickable MVP. It reuses the existing demo JSON data and ports the deterministic claims engine to JavaScript.

```powershell
pnpm install
pnpm dev
```

For Vercel, import the GitHub repo and keep the project root as the app root. Vercel will detect `package.json` and build the Next.js app with:

```powershell
pnpm build
```

## Optional CrewAI + Vertex AI

The project includes an optional CrewAI adapter. To experiment with live LLM-backed execution, install the optional dependencies:

```powershell
.venv\Scripts\python -m pip install -r requirements-crewai.txt
```

Create a local `.env` file from `.env.example`, then set:

```text
USE_CREWAI_LIVE=true
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=agenticai-500006
GOOGLE_CLOUD_LOCATION=us-central1
CREWAI_MODEL=gemini/gemini-2.0-flash
```

Authenticate with Google Cloud Application Default Credentials or a service account that can call Vertex AI for project `agenticai-500006`. Do not commit credentials.

After changing `.env`, restart Streamlit. The sidebar should show `Live mode: True`.

## Project Structure

```text
.env.example
AGENTS.md
app/
components/
DESIGN.md
lib/
next.config.mjs
package.json
PRODUCT.md
vercel.json
claimsops/
  app.py
  core/
    crewai_adapter.py
    engine.py
  demo_data/
    claim_history.json
    document_requirements.json
    policies.json
    sample_claims.json
docs/
  agent_skill_contract.md
  prompts_and_tools.md
```

## Design And Agent Guidance

Before changing the UI or agent workflow, read:

- `PRODUCT.md` for the product lane, users, purpose, anti-references, and accessibility baseline.
- `DESIGN.md` for the Streamlit visual system and design acceptance checks.
- `AGENTS.md` for implementation guardrails, secret handling, and verification steps.
- `docs/agent_skill_contract.md` for the operational agent/tool contract shown in the app.

## Presentation Positioning

Use this MVP as the "demo flow" for the final assignment:

1. Submit or load a claim.
2. Run the ClaimsOps Agent workflow.
3. Show the agent trace: intake, coverage, evidence, risk, recommendation, communication.
4. Emphasize the human-in-the-loop approval gate for high-impact decisions.

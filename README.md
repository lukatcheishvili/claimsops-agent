# ClaimsOps Agent

Agentic AI MVP for **Insurance Claims Operations**. ClaimsOps Agent demonstrates how a multi-agent workflow can intake a claim, verify policy coverage, inspect evidence, score operational risk, recommend the next action, and draft customer and adjuster communications while keeping final decisions human-gated.

The repository contains two working interfaces:

- **Vercel / Next.js app**: polished web MVP for deployment and presentation.
- **Streamlit app**: Python MVP with optional CrewAI + Vertex AI live mode.

## Demo Features

- Load sample claims across auto, health, travel, home, and life insurance.
- Submit a custom claim and run the ClaimsOps workflow.
- Explain recommendations in non-technical language for claims teams.
- Show risk score drivers, coverage logic, evidence readiness, history context, and SLA routing.
- Simulate a human approval gate for next-action approval, evidence requests, and manual escalation.
- Visualize the claims queue with Recharts-powered dashboard views.
- Show a Figma-style agent workflow board with smooth orchestration lines.
- Keep deterministic mode available for reliable class demos without cloud credentials.

## Repository Structure

```text
.
├── src/                         # Vercel / Next.js application source
│   ├── app/                     # Next.js App Router pages and global CSS
│   ├── components/              # Interactive ClaimsOps UI components
│   └── lib/                     # JavaScript claims engine used by Vercel UI
├── claimsops/                   # Streamlit / Python implementation
│   ├── app.py                   # Streamlit interface
│   ├── core/                    # Deterministic engine and CrewAI adapter
│   └── demo_data/               # Demo policies, claims, history, requirements
├── docs/
│   ├── agent_skill_contract.md  # Agent/tool contract shown in the app
│   ├── prompts_and_tools.md     # Prompt and tool pack
│   └── project/                 # Product and design guidance
├── .streamlit/                  # Streamlit theme config
├── .env.example                 # Optional local live-mode environment template
├── AGENTS.md                    # Instructions for future coding agents
├── next.config.mjs              # Next.js config
├── package.json                 # Vercel app scripts/dependencies
├── pnpm-lock.yaml               # Locked JS dependencies
├── requirements.txt             # Streamlit dependencies
├── requirements-crewai.txt      # Optional CrewAI + Vertex AI dependencies
└── vercel.json                  # Vercel build settings
```

## Run The Vercel App

Use this for the polished web MVP and Vercel deployment.

```powershell
pnpm install
pnpm dev
```

Open:

```text
http://localhost:3000
```

Production build check:

```powershell
pnpm build
```

## Deploy To Vercel

1. Import the GitHub repo `lukatcheishvili/claimsops-agent` in Vercel.
2. Keep the root directory as the repository root.
3. Vercel should auto-detect Next.js.
4. Use:

```text
Install Command: pnpm install
Build Command: pnpm build
Output Directory: .next
```

The Vercel app currently runs the deterministic JavaScript claims engine in `src/lib/claimsEngine.js`. It does not require cloud credentials.

## Run The Streamlit App

Use this for the Python MVP and optional live CrewAI path.

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m streamlit run claimsops\app.py
```

Open:

```text
http://localhost:8501
```

If port `8501` is busy, Streamlit may choose another port.

## Optional CrewAI + Vertex AI Live Mode

The Streamlit app includes an optional CrewAI adapter. Deterministic mode remains the default so the class demo works without cloud credentials.

Install optional dependencies:

```powershell
.venv\Scripts\python -m pip install -r requirements-crewai.txt
```

Create a local `.env` file from `.env.example`:

```powershell
Copy-Item .env.example .env
```

Set:

```text
USE_CREWAI_LIVE=true
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=agenticai-500006
GOOGLE_CLOUD_PROJECT_NUMBER=808855388233
GOOGLE_CLOUD_LOCATION=us-central1
CREWAI_MODEL=gemini/gemini-2.0-flash
```

Authenticate with Google Cloud Application Default Credentials or a service account that can call Vertex AI:

```powershell
gcloud auth application-default login
gcloud config set project agenticai-500006
gcloud services enable aiplatform.googleapis.com
```

Restart Streamlit after changing `.env`. The sidebar should show `Live mode: True`.

## Main Workflows

1. **Submit Claim**: Load a sample or enter a claim manually.
2. **Agent Review**: Show the plain-English recommendation, risk score drivers, coverage logic, evidence logic, history context, and audit trace.
3. **Communications**: Review customer and adjuster drafts, then simulate the human approval gate.
4. **Operations Dashboard**: Inspect queue KPIs, severity distribution, risk vs exposure, evidence readiness, owner workload, and the claims table.
5. **Architecture**: Explain the multi-agent workflow and human-in-the-loop control model.
6. **Prompt Pack**: Show the agent prompt, tool contract, and guardrails.

## Agent Design

ClaimsOps Agent uses specialist agents:

- Claims Intake Agent
- Coverage Verification Agent
- Evidence Review Agent
- Risk and Fraud Triage Agent
- Communication Agent
- Supervisor Agent

Tools provide structured facts: policy lookup, claim history, document requirements, risk scoring, next-action routing, and communication drafting. The supervisor agent recommends a route, but final insurance decisions remain with a human adjuster.

## Safety Guardrails

- No automated claim approval, denial, settlement, payment, or fraud accusation.
- Human approval is required for high-impact decisions.
- Demo mode minimizes personally identifiable information.
- Tool results are treated as source-of-truth for policy, evidence, history, and risk checks.
- Local secrets belong in `.env` or deployment secrets, never in Git.

## Project Guidance

Before changing product behavior or UI, read:

- `docs/project/PRODUCT.md`
- `docs/project/DESIGN.md`
- `AGENTS.md`
- `docs/agent_skill_contract.md`
- `docs/prompts_and_tools.md`

## Verification Checklist

Run these before pushing meaningful changes:

```powershell
pnpm build
.venv\Scripts\python -m py_compile claimsops\app.py claimsops\core\engine.py claimsops\core\crewai_adapter.py
rg -n "transition:\s*all|outline:\s*none|outline-none|user-scalable|maximum-scale|onPaste" claimsops src .streamlit docs -S
```

For UI changes, also verify:

- Vercel app responds at `http://localhost:3000`.
- Streamlit app responds at its local port.
- Sidebar selected claim text is readable.
- Estimated claim amount input does not prepend `0`.
- Submitted evidence labels are human readable.
- Dashboard charts render in dark theme.
- Architecture workflow lines and nodes do not overlap.

## Team

- Shreya Jha
- Claudia Aranguren Moliner
- Luka Tcheishvili
- Mohammad Alkhan
- Ghezlan Almatar

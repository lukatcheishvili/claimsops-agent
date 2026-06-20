# ClaimsOps Agent

**Live Demo:** [Open the Vercel MVP](https://claimsops-agent-git-main-lukatcheishvilis-projects.vercel.app/)

Agentic AI MVP for **Insurance Claims Operations**. ClaimsOps Agent demonstrates how a multi-agent workflow can intake a claim, verify coverage, inspect evidence, score operational risk, recommend the next action, draft communications, and keep final insurance decisions human-gated.

The repo contains two working interfaces:

- **Vercel / Next.js app**: polished web MVP for deployment and presentation.
- **Streamlit app**: Python MVP with optional CrewAI + Vertex AI live mode.

## What Is New

- **Agent Chat**: users can ask the ClaimsOps agent about risk, evidence, coverage, routing, Vertex status, audit history, and architecture.
- **Guided Demo Mode**: a step-by-step walkthrough for class presentation.
- **Evidence Upload Simulation**: missing evidence can be added from the intake form to show how readiness changes.
- **Downloadable Claim Review**: exports an HTML review package with summary, risk drivers, trace, and approval log.
- **Human Approval Action Log**: approval, evidence request, and escalation actions are recorded.
- **Manager View**: shows highest-value operational signals: manual queue, evidence blockers, high-risk claims, urgent SLAs, owner load, and recommended management actions.
- **Vertex Runtime Status**: makes live-mode readiness visible without hiding deterministic fallback behavior.
- **Sidebar Vertex Config**: lets presenters enter a Project ID and masked Project Number for the active run.
- **Architecture Popovers**: every architecture node explains why it exists, its role, and its output.

## Highest-Value Additions

These are the additions that most improve the project grade and demo clarity:

1. **Interactive agent layer**: the project now feels like an agent because users can ask questions instead of only reading a static review.
2. **Human-in-the-loop controls**: the app demonstrates governance, not just automation.
3. **Manager control room**: the MVP moves from a single-claim demo to an operations workflow.
4. **Auditable outputs**: trace, approval log, and downloadable review package make the result explainable.
5. **Live-ready architecture**: Vertex AI can be enabled later while deterministic tools keep demos reliable.

## Repository Structure

```text
.
|-- src/                         # Vercel / Next.js application source
|   |-- app/                     # Next.js App Router pages, API route, global CSS
|   |-- components/              # Interactive ClaimsOps UI components
|   `-- lib/                     # JavaScript claims engine and Vertex AI helper
|-- claimsops/                   # Streamlit / Python implementation
|   |-- app.py                   # Streamlit interface
|   |-- core/                    # Deterministic engine and CrewAI adapter
|   `-- demo_data/               # Demo policies, claims, history, requirements
|-- docs/
|   |-- agent_skill_contract.md  # Agent/tool contract shown in the app
|   |-- prompts_and_tools.md     # Prompt and tool pack
|   `-- project/                 # Product and design guidance
|-- .streamlit/                  # Streamlit theme config
|-- .env.example                 # Optional local live-mode environment template
|-- AGENTS.md                    # Instructions for future coding agents
|-- agent.md                     # Continuation log and project evaluation
|-- next.config.mjs              # Next.js config
|-- package.json                 # Vercel app scripts/dependencies
|-- pnpm-lock.yaml               # Locked JS dependencies
|-- requirements.txt             # Streamlit dependencies
|-- requirements-crewai.txt      # Optional CrewAI + Vertex AI dependencies
`-- vercel.json                  # Vercel build settings
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

The Vercel app uses the deterministic JavaScript claims engine in `src/lib/claimsEngine.js` as the source of truth. It also includes a server-side Vertex AI route at `src/app/api/claimsops/analyze/route.js`. When credentials are configured, the route calls Gemini on Vertex AI to generate a live adjuster-facing review while the deterministic tool output remains auditable.

## Enable Vertex AI On Vercel

The app now requests Vertex AI live mode by default for project `agenticai-500006`. It will show **Ready** or **Live** only when the runtime also has valid service account credentials. It will show **Needs Credentials** if the project settings are present but the private key is missing.

Add these environment variables in **Vercel Project Settings -> Environment Variables**:

```text
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=agenticai-500006
GOOGLE_CLOUD_PROJECT_NUMBER=***
GOOGLE_CLOUD_LOCATION=us-central1
VERTEX_AI_LIVE=true
VERTEX_AI_MODEL=gemini-2.0-flash
GOOGLE_SERVICE_ACCOUNT_JSON={...service account JSON...}
```

To explicitly disable live mode for a fallback-only demo, set:

```text
VERTEX_AI_LIVE=false
```

The service account must be allowed to call Vertex AI in project `agenticai-500006`. Do not commit the JSON key. After updating Vercel variables, redeploy the project. In the app, load or submit a claim and open **Agent Review**; the **Vertex AI Live Review** and **Vertex Runtime Status** panels will show either the live review or the exact fallback reason.

The sidebar also has a **Vertex AI Config** box. Use it to enter the Project ID and Project Number for a specific demo run. The Project Number field is masked in the UI and in API status responses. To clear **Needs Credentials**, paste a service account JSON value into the masked credential field or configure `GOOGLE_SERVICE_ACCOUNT_JSON` in Vercel. The sidebar credential is sent only for the active request and is not committed to the repo.

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
GOOGLE_CLOUD_PROJECT_NUMBER=***
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

1. **Submit Claim**: load a sample, enter a claim manually, or use the evidence upload simulation.
2. **Agent Chat**: ask the ClaimsOps agent why it chose a route, what evidence is missing, how risk was scored, or how the architecture works.
3. **Agent Review**: show the recommendation, risk score drivers, coverage logic, evidence logic, history context, Vertex status, and audit trace.
4. **Communications**: review customer and adjuster drafts, then simulate human approval, evidence request, or manual escalation.
5. **Operations Dashboard**: inspect queue KPIs, severity distribution, risk vs exposure, evidence readiness, owner workload, and the claims table.
6. **Manager View**: review highest-value operational blockers, urgent SLAs, owner load, and queue actions.
7. **Architecture**: hover over each node to explain the multi-agent workflow and human-in-the-loop control model.
8. **Prompt Pack**: show the agent prompt, tool contract, and guardrails.

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
- Tool results are treated as the source of truth for policy, evidence, history, and risk checks.
- Local secrets belong in `.env` or deployment secrets, never in Git.

## Project Guidance

Before changing product behavior or UI, read:

- `agent.md`
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
rg -n --glob '!README.md' --glob '!AGENTS.md' "transition:\s*all|outline:\s*none|outline-none|user-scalable|maximum-scale|onPaste" claimsops src .streamlit docs -S
```

For UI changes, also verify:

- Vercel app responds at `http://localhost:3000`.
- Streamlit app responds at its local port.
- Sidebar selected claim text is readable.
- Estimated claim amount input does not prepend `0`.
- Submitted evidence labels are human readable.
- Agent Chat can answer evidence, risk, coverage, route, Vertex, and audit questions.
- Dashboard charts render in dark theme.
- Architecture workflow lines, nodes, and popovers do not overlap.

## Team

- Shreya Jha
- Claudia Aranguren Moliner
- Luka Tcheishvili
- Mohammad Alkhan
- Ghezlan Almatar

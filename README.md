# ClaimsOps Agent

Agentic AI MVP for insurance claims operations. The app demonstrates how a multi-agent claims workflow can intake a claim, verify policy coverage, inspect evidence, score operational risk, recommend the next action, and draft customer and adjuster communications.

## Quick Start

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m streamlit run claimsops\app.py
```

The default app runs in deterministic demo mode, so it is safe for a live class presentation without cloud credentials.

## Optional CrewAI + Vertex AI

The project includes an optional CrewAI adapter. To experiment with live LLM-backed execution, install the optional dependencies and configure Vertex AI credentials:

```powershell
.venv\Scripts\python -m pip install -r requirements-crewai.txt
```

Create a local `.env` file from `.env.example` and authenticate with Google Cloud Application Default Credentials or a service account. Do not commit credentials.

## Project Structure

```text
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
  prompts_and_tools.md
```

## Presentation Positioning

Use this MVP as the "demo flow" for the final assignment:

1. Submit or load a claim.
2. Run the ClaimsOps Agent workflow.
3. Show the agent trace: intake, coverage, evidence, risk, recommendation, communication.
4. Emphasize the human-in-the-loop approval gate for high-impact decisions.


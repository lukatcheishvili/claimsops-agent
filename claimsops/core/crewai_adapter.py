from __future__ import annotations

import os
from importlib.util import find_spec
from pathlib import Path
from typing import Any


WORKSPACE_ROOT = Path(__file__).resolve().parents[2]
CREWAI_STATE_DIR = WORKSPACE_ROOT / ".crewai_state"
_ENV_LOADED = False


def crewai_environment_status() -> dict[str, Any]:
    """Return non-secret configuration status for the optional live CrewAI mode."""
    _load_local_env()
    return {
        "crewai_installed": _module_available("crewai"),
        "vertex_project": os.getenv("GOOGLE_CLOUD_PROJECT", ""),
        "vertex_location": os.getenv("GOOGLE_CLOUD_LOCATION", "global"),
        "model": os.getenv("CREWAI_MODEL", "gemini/gemini-2.5-flash"),
        "live_enabled": os.getenv("USE_CREWAI_LIVE", "false").lower() == "true",
        "vertex_enabled": os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "true").lower() == "true",
        "storage_dir": str(CREWAI_STATE_DIR),
    }


def try_live_crewai_summary(claim: dict[str, Any], baseline: dict[str, Any]) -> dict[str, Any]:
    """Optionally run a small CrewAI pass over the deterministic baseline.

    The Streamlit demo does not require this path. It is intentionally guarded so
    class presentations can run reliably without cloud credentials.
    """
    status = crewai_environment_status()
    if not status["live_enabled"]:
        return {
            "used_live_crewai": False,
            "reason": "Live CrewAI mode is disabled. Set USE_CREWAI_LIVE=true after Vertex credentials are verified.",
        }
    if not status["crewai_installed"]:
        return {
            "used_live_crewai": False,
            "reason": "CrewAI is not installed. Install requirements-crewai.txt to enable live mode.",
        }

    try:
        _prepare_crewai_environment()
        from crewai import Agent, Crew, LLM, Process, Task
    except Exception as exc:  # pragma: no cover - defensive import path
        return {"used_live_crewai": False, "reason": f"CrewAI import failed: {exc}"}

    try:
        llm = LLM(
            model=status["model"],
            temperature=0.2,
            timeout=90,
            response_format={"type": "json"},
        )
        manager = Agent(
            role="Claims Operations Supervisor",
            goal="Validate a claims triage recommendation and return concise JSON.",
            backstory=(
                "You supervise insurance claim triage. You are careful with coverage, "
                "customer communication, and human approval gates."
            ),
            llm=llm,
            verbose=False,
        )
        task = Task(
            description=(
                "Review this claim and deterministic baseline. Return JSON with keys "
                "executive_summary, confidence, and any_changes. Do not approve, deny, "
                "or settle the claim.\n\n"
                f"Claim: {claim}\n\nBaseline: {baseline}"
            ),
            expected_output="Strict JSON with executive_summary, confidence, any_changes.",
            agent=manager,
        )
        crew = Crew(agents=[manager], tasks=[task], process=Process.sequential, verbose=False)
        result = crew.kickoff()
        return {
            "used_live_crewai": True,
            "summary": str(result),
        }
    except Exception as exc:  # pragma: no cover - depends on external credentials
        return {
            "used_live_crewai": False,
            "reason": f"Live CrewAI execution failed, so the app kept deterministic demo output: {exc}",
        }


def _module_available(name: str) -> bool:
    return find_spec(name) is not None


def _load_local_env() -> None:
    """Load optional local .env settings when python-dotenv is installed."""
    global _ENV_LOADED
    if _ENV_LOADED:
        return
    _ENV_LOADED = True
    try:
        from dotenv import load_dotenv
    except Exception:
        return

    load_dotenv(WORKSPACE_ROOT / ".env", override=False)


def _prepare_crewai_environment() -> None:
    """Keep CrewAI local state inside the project workspace when possible."""
    local_appdata = CREWAI_STATE_DIR / "localappdata"
    local_cache = CREWAI_STATE_DIR / "cache"
    local_appdata.mkdir(parents=True, exist_ok=True)
    local_cache.mkdir(parents=True, exist_ok=True)
    os.environ["LOCALAPPDATA"] = str(local_appdata)
    os.environ.setdefault("CREWAI_STORAGE_DIR", "claimsops-agent")
    os.environ.setdefault("CREWAI_DISABLE_TELEMETRY", "true")
    os.environ.setdefault("CREWAI_DISABLE_TRACKING", "true")

    try:
        import appdirs

        def workspace_user_data_dir(appname=None, appauthor=None, *args, **kwargs):
            parts = [local_appdata]
            if appauthor:
                parts.append(Path(str(appauthor)))
            if appname:
                parts.append(Path(str(appname)))
            path = Path(*parts)
            path.mkdir(parents=True, exist_ok=True)
            return str(path)

        def workspace_user_cache_dir(appname=None, appauthor=None, *args, **kwargs):
            parts = [local_cache]
            if appauthor:
                parts.append(Path(str(appauthor)))
            if appname:
                parts.append(Path(str(appname)))
            path = Path(*parts)
            path.mkdir(parents=True, exist_ok=True)
            return str(path)

        appdirs.user_data_dir = workspace_user_data_dir
        appdirs.user_cache_dir = workspace_user_cache_dir
    except Exception:
        pass

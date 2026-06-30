// Shared prompt construction and review parsing for every live LLM path.
// Both the Vertex AI route (src/lib/vertexAi.js) and the API-key providers
// (src/lib/llmProviders.js) reuse these helpers so every provider produces the
// same auditable review shape on top of the deterministic claims engine.

export const CLAIMS_SYSTEM_INSTRUCTION =
  "You are a claims operations review agent. Use the deterministic tool output as source of truth. " +
  "Do not approve, deny, settle, pay, or accuse fraud. Explain routing in plain language for non-technical claims teams. " +
  "Return only valid JSON.";

export const REVIEW_JSON_SHAPE = {
  executive_summary: "string",
  reasoning_steps: ["string"],
  adjuster_questions: ["string"],
  customer_next_steps: ["string"],
  risk_caveats: ["string"]
};

export function buildClaimsContext(analysis) {
  const topDrivers = [...analysis.risk.contributions]
    .filter((item) => item.label !== "Baseline intake risk")
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 5);

  const evidenceForPrompt = {
    ...analysis.evidence,
    files: (analysis.evidence.files || []).map((file) => ({
      docType: file.docType,
      name: file.name,
      mime: file.mime,
      sizeLabel: file.sizeLabel,
      valid: file.valid,
      issues: file.issues
    }))
  };

  const claimForPrompt = { ...analysis.claim };
  delete claimForPrompt.files;

  return {
    expected_json_shape: REVIEW_JSON_SHAPE,
    claim: claimForPrompt,
    coverage: analysis.coverage,
    evidence: evidenceForPrompt,
    risk: {
      score: analysis.risk.score,
      severity: analysis.risk.severity,
      urgency: analysis.risk.urgency,
      signals: analysis.risk.signals,
      top_drivers: topDrivers
    },
    recommendation: analysis.recommendation,
    human_gate: analysis.recommendation.human_gate,
    trace: analysis.trace
  };
}

export function buildClaimsUserPrompt(analysis, providerLabel = "AI") {
  return (
    `Create a detailed but concise live ${providerLabel} review for this insurance claim. ` +
    "Explain how the workflow reached its conclusion and what a human adjuster should check next.\n\n" +
    JSON.stringify(buildClaimsContext(analysis), null, 2)
  );
}

export function parseClaimsReview(text, providerLabel = "The model") {
  const fallback = {
    executive_summary: text || `${providerLabel} returned an empty review.`,
    reasoning_steps: [],
    adjuster_questions: [],
    customer_next_steps: [],
    risk_caveats: []
  };

  if (!text) return fallback;

  try {
    const jsonText = extractJsonObject(text);
    const parsed = JSON.parse(jsonText);
    return {
      executive_summary: String(parsed.executive_summary || fallback.executive_summary),
      reasoning_steps: normalizeStringList(parsed.reasoning_steps),
      adjuster_questions: normalizeStringList(parsed.adjuster_questions),
      customer_next_steps: normalizeStringList(parsed.customer_next_steps),
      risk_caveats: normalizeStringList(parsed.risk_caveats)
    };
  } catch {
    return fallback;
  }
}

export function normalizeStringList(value) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean).slice(0, 6) : [];
}

export function extractJsonObject(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return text;
  return text.slice(start, end + 1);
}

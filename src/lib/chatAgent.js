// Shared chat-agent helpers used by every live LLM provider.
//
// The chat is a thin grounded layer on top of the deterministic claims engine:
// the engine's analysis is included as JSON context so the model never invents
// numbers. The model can also see uploaded evidence files (claim form, ID,
// photos) via the provider-specific multimodal channel. Final insurance
// decisions stay human-gated; the model can recommend, summarize, and explain
// but never approves, denies, settles, pays, or accuses fraud.

import { analyzeClaim, sampleClaims } from "@/lib/claimsEngine";

export const CHAT_SYSTEM_INSTRUCTION =
  "You are the ClaimsOps Agent assistant for an insurance claims adjuster. " +
  "Use the deterministic data below (ACTIVE CLAIM ANALYSIS + CLAIM QUEUE SUMMARY) as ground truth - do not invent risk scores, coverage outcomes, or recommendations. " +
  "The active claim is what the user is asking about by default. Use the queue summary when the user asks cross-claim questions like compare to another customer, highest risk, missing-evidence across the queue, or who needs urgent review. " +
  "Quote specific numbers, dates, claim ids, and policy fields when relevant. " +
  "If attachments are provided (claim form PDF, customer ID image, damage photo, repair estimate PDF), open them and reference what you actually see. " +
  "You can recommend, explain, prioritize, and draft. " +
  "You must never approve, deny, settle, pay, or accuse fraud - always remind the user that final claim decisions stay with a human adjuster. " +
  "Keep answers concise (2-5 sentences) unless the user asks for detail.";

export function buildChatContext(analysis) {
  const topDrivers = [...analysis.risk.contributions]
    .filter((item) => item.label !== "Baseline intake risk")
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 5);

  const claimForPrompt = { ...analysis.claim };
  delete claimForPrompt.files;

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

  return {
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
    trace: analysis.trace,
    history_count: Array.isArray(analysis.history) ? analysis.history.length : 0
  };
}

export function buildClaimsQueueSummary() {
  return sampleClaims.map((claim) => {
    const a = analyzeClaim(claim);
    return {
      claim_id: a.claim.claim_id,
      customer: a.claim.customer_name,
      line: a.claim.insurance_type,
      amount: a.claim.claim_amount,
      location: a.claim.location,
      incident_date: a.claim.incident_date,
      reported_date: a.claim.reported_date,
      risk_score: a.risk.score,
      severity: a.risk.severity,
      urgency: a.risk.urgency,
      coverage: a.coverage.covered ? "covered" : a.coverage.status,
      evidence_pct: Math.round(a.evidence.completion * 100),
      missing_evidence: a.evidence.missing,
      recommendation: a.recommendation.action,
      owner: a.recommendation.owner,
      sla: a.recommendation.sla,
      human_gate: a.recommendation.human_gate
    };
  });
}

export function buildGroundingPreamble(analysis) {
  const queue = buildClaimsQueueSummary();
  return (
    "Use the deterministic data below as ground truth. Cite specific values when relevant.\n\n" +
    "ACTIVE CLAIM ANALYSIS (the claim the adjuster is currently reviewing):\n" +
    JSON.stringify(buildChatContext(analysis), null, 2) +
    "\n\nCLAIM QUEUE SUMMARY (compact records of all claims in the operations queue - use for cross-claim questions like 'compare to Elena', 'highest risk', or 'who has missing evidence'):\n" +
    JSON.stringify(queue, null, 2)
  );
}

// Normalize chat history into the {role, text} shape the providers consume.
// Filter out empty/system messages and clamp the tail to the most recent turns
// so the request payload stays compact.
export function normalizeChatHistory(history = [], { maxTurns = 8 } = {}) {
  if (!Array.isArray(history)) return [];
  const cleaned = history
    .map((entry) => {
      const role = entry?.role === "assistant" ? "assistant" : entry?.role === "user" ? "user" : null;
      const text = String(entry?.content || entry?.text || "").trim();
      if (!role || !text) return null;
      return { role, text };
    })
    .filter(Boolean);
  return cleaned.slice(-maxTurns);
}

export function buildChatRequestSummary(question) {
  return `Adjuster question: ${String(question || "").trim()}`;
}

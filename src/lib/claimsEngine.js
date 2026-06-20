import claimHistoryData from "../../claimsops/demo_data/claim_history.json";
import documentRequirementsData from "../../claimsops/demo_data/document_requirements.json";
import policiesData from "../../claimsops/demo_data/policies.json";
import sampleClaimsData from "../../claimsops/demo_data/sample_claims.json";

export const sampleClaims = sampleClaimsData;
export const policies = policiesData;
export const claimHistory = claimHistoryData;
export const documentRequirements = documentRequirementsData;

export const insuranceLines = ["Auto", "Health", "Travel", "Home", "Life"];

export const availableDocs = [
  "claim_form",
  "customer_id",
  "photos",
  "police_report",
  "repair_estimate",
  "medical_invoice",
  "doctor_report",
  "travel_itinerary",
  "booking_receipt",
  "property_photos",
  "ownership_proof",
  "death_certificate",
  "beneficiary_id"
];

export function blankClaim() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    claim_id: "CLM-DEMO-NEW",
    customer_name: "",
    policy_id: "",
    insurance_type: "Auto",
    incident_date: today,
    reported_date: today,
    claim_amount: 0,
    location: "",
    description: "",
    documents: []
  };
}

export function claimLabel(claim) {
  return `${claim.claim_id} - ${claim.insurance_type} - ${claim.customer_name}`;
}

export function analyzeClaim(claim) {
  const normalized = normalizeClaim(claim);
  const policy = findPolicy(normalized.policy_id);
  const history = findClaimHistory(normalized.policy_id);
  const coverage = evaluateCoverage(normalized, policy);
  const evidence = evaluateEvidence(normalized);
  const risk = evaluateRisk(normalized, policy, history, evidence, coverage);
  const recommendation = chooseRecommendation(coverage, evidence, risk);
  const trace = buildTrace(normalized, policy, coverage, evidence, risk, recommendation);
  const communications = draftCommunications(normalized, policy, evidence, risk, recommendation);

  return {
    claim: normalized,
    policy,
    history,
    coverage,
    evidence,
    risk,
    recommendation,
    communications,
    trace
  };
}

export function dashboardRows() {
  return sampleClaims.map((item) => {
    const analysis = analyzeClaim(item);
    return {
      claim: analysis.claim.claim_id,
      customer: analysis.claim.customer_name,
      line: analysis.claim.insurance_type,
      amount: analysis.claim.claim_amount,
      severity: analysis.risk.severity,
      riskScore: analysis.risk.score,
      evidenceCompletion: Math.round(analysis.evidence.completion * 100),
      covered: analysis.coverage.covered,
      missingDocs: analysis.evidence.missing.length,
      urgency: analysis.risk.urgency,
      nextAction: analysis.recommendation.action,
      owner: analysis.recommendation.owner,
      sla: analysis.recommendation.sla
    };
  });
}

function normalizeClaim(claim) {
  const insuranceType = titleCase(String(claim.insurance_type || "Auto").trim());
  return {
    ...claim,
    insurance_type: insuranceType,
    policy_id: String(claim.policy_id || "").trim().toUpperCase(),
    customer_name: String(claim.customer_name || "").trim() || "Customer",
    description: String(claim.description || "").trim(),
    location: String(claim.location || "").trim(),
    claim_amount: Math.trunc(Number(claim.claim_amount || 0)),
    documents: Array.from(new Set(claim.documents || [])).sort()
  };
}

function findPolicy(policyId) {
  return policies.find((policy) => policy.policy_id === policyId) || null;
}

function findClaimHistory(policyId) {
  return claimHistory.filter((item) => item.policy_id === policyId);
}

function evaluateCoverage(claim, policy) {
  if (!policy) {
    return {
      status: "not_found",
      covered: false,
      reason: "No matching policy was found.",
      deductible: null,
      limit: null,
      exclusions: []
    };
  }

  const incident = parseDate(claim.incident_date);
  const start = parseDate(policy.effective_date);
  const end = parseDate(policy.expiration_date);
  const typeMatch = policy.insurance_type.toLowerCase() === claim.insurance_type.toLowerCase();
  const inWindow = start <= incident && incident <= end;
  const active = policy.status.toLowerCase() === "active";
  const amountOk = claim.claim_amount <= Number(policy.claim_limit);
  const covered = active && typeMatch && inWindow && amountOk;

  const reasons = [];
  if (!active) reasons.push("Policy is not active.");
  if (!typeMatch) reasons.push("Claim type does not match policy line.");
  if (!inWindow) reasons.push("Incident date is outside the policy period.");
  if (!amountOk) reasons.push("Claim amount exceeds policy limit.");
  if (!reasons.length) {
    reasons.push("Policy is active and claim is within configured coverage limits.");
  }

  return {
    status: covered ? "covered" : "manual_review",
    covered,
    reason: reasons.join(" "),
    deductible: policy.deductible,
    limit: policy.claim_limit,
    exclusions: policy.exclusions
  };
}

function evaluateEvidence(claim) {
  const requirements = documentRequirements[claim.insurance_type] || [];
  const submitted = new Set(claim.documents || []);
  const missing = requirements.filter((doc) => !submitted.has(doc));
  const completion = requirements.length ? (requirements.length - missing.length) / requirements.length : 1;

  return {
    required: requirements,
    submitted: Array.from(submitted).sort(),
    missing,
    completion: Math.round(completion * 100) / 100
  };
}

function evaluateRisk(claim, policy, history, evidence, coverage) {
  let score = 12;
  const signals = [];
  const contributions = [
    {
      label: "Baseline intake risk",
      impact: 12,
      detail: "Every claim starts with a small baseline score so it receives operational review.",
      tone: "neutral"
    }
  ];
  const description = claim.description.toLowerCase();
  const amount = claim.claim_amount;
  const historyCount = history.length;

  if (amount >= 50000) {
    score += 25;
    signals.push("High claimed amount.");
    contributions.push({
      label: "High claimed amount",
      impact: 25,
      detail: "Large exposure increases review priority and settlement risk.",
      tone: "risk"
    });
  } else if (amount >= 15000) {
    score += 15;
    signals.push("Moderate-to-high claimed amount.");
    contributions.push({
      label: "Moderate-to-high amount",
      impact: 15,
      detail: "The claim amount is material enough to require closer adjuster attention.",
      tone: "risk"
    });
  } else if (amount >= 5000) {
    score += 8;
    signals.push("Material claim amount.");
    contributions.push({
      label: "Material amount",
      impact: 8,
      detail: "The claim amount is above the low-value fast-track threshold.",
      tone: "risk"
    });
  }

  if (evidence.missing.length) {
    const evidenceImpact = Math.min(24, 6 * evidence.missing.length);
    score += evidenceImpact;
    signals.push("Required evidence is missing.");
    contributions.push({
      label: "Missing required evidence",
      impact: evidenceImpact,
      detail: `${evidence.missing.length} required document${evidence.missing.length === 1 ? " is" : "s are"} missing, so the claim should not proceed to settlement review yet.`,
      tone: "risk"
    });
  }

  if (!coverage.covered) {
    score += 18;
    signals.push("Coverage requires manual review.");
    contributions.push({
      label: "Coverage review required",
      impact: 18,
      detail: "The policy check did not produce clear straight-through coverage.",
      tone: "risk"
    });
  }

  if (historyCount >= 3) {
    score += 20;
    signals.push("Multiple prior claims on this policy.");
    contributions.push({
      label: "Multiple recent claims",
      impact: 20,
      detail: "Three or more prior claims on the same policy increases investigation priority.",
      tone: "risk"
    });
  } else if (historyCount === 2) {
    score += 12;
    signals.push("Two prior claims on this policy.");
    contributions.push({
      label: "Two prior claims",
      impact: 12,
      detail: "The policy history is active enough to influence routing.",
      tone: "risk"
    });
  } else if (historyCount === 1) {
    score += 5;
    signals.push("One prior claim on this policy.");
    contributions.push({
      label: "One prior claim",
      impact: 5,
      detail: "Prior history adds a small amount of review friction.",
      tone: "risk"
    });
  }

  const keywordRules = {
    injury: 12,
    hospital: 12,
    stolen: 10,
    theft: 10,
    fire: 10,
    flood: 8,
    "total loss": 14,
    urgent: 8,
    fraud: 15
  };
  const negatedTerms = { injury: ["no injury", "without injury", "no injuries"] };
  Object.entries(keywordRules).forEach(([keyword, points]) => {
    if (!description.includes(keyword)) return;
    if ((negatedTerms[keyword] || []).some((term) => description.includes(term))) return;
    score += points;
    signals.push(`Description contains '${keyword}'.`);
    contributions.push({
      label: `Description signal: ${keyword}`,
      impact: points,
      detail: `The claim description contains "${keyword}", which is treated as a review signal.`,
      tone: "risk"
    });
  });

  const lateDays = daysBetween(claim.incident_date, claim.reported_date);
  if (lateDays > 30) {
    score += 12;
    signals.push("Claim was reported more than 30 days after the incident.");
    contributions.push({
      label: "Late reporting",
      impact: 12,
      detail: "The claim was reported more than 30 days after the incident.",
      tone: "risk"
    });
  } else if (lateDays > 10) {
    score += 6;
    signals.push("Claim was reported more than 10 days after the incident.");
    contributions.push({
      label: "Delayed reporting",
      impact: 6,
      detail: "The claim was reported more than 10 days after the incident.",
      tone: "risk"
    });
  }

  if (policy && policy.customer_segment === "VIP" && coverage.covered) {
    score -= 5;
    signals.push("VIP segment with active coverage reduces routing friction.");
    contributions.push({
      label: "VIP active coverage offset",
      impact: -5,
      detail: "Active coverage and VIP segment reduce operational friction.",
      tone: "positive"
    });
  }

  score = Math.max(0, Math.min(100, score));
  let severity = "Low";
  if (score >= 60) severity = "High";
  else if (score >= 35) severity = "Medium";

  let urgency = "Standard";
  if (severity === "High") urgency = "Same day adjuster review";
  else if (evidence.missing.length) urgency = "Customer follow-up within 24 hours";

  if (!signals.length) {
    signals.push("No unusual operational risk signals identified.");
  }

  return { score, severity, urgency, signals, contributions };
}

function chooseRecommendation(coverage, evidence, risk) {
  if (risk.score >= 75) {
    return {
      action: "Escalate to senior adjuster and special investigation review",
      owner: "Senior Adjuster / SIU",
      human_gate: "Mandatory before customer decision or payment",
      sla: "4 business hours",
      rationale: "The risk score is high enough that a senior reviewer should validate facts, coverage, and potential investigation triggers before any customer decision."
    };
  }
  if (!coverage.covered) {
    return {
      action: "Route to manual coverage review",
      owner: "Coverage Specialist",
      human_gate: "Mandatory before denial or settlement",
      sla: risk.severity === "High" ? "4 business hours" : "1 business day",
      rationale: "Coverage is not clear enough for straight-through processing, so a specialist must review policy status, date window, line match, limits, and exclusions."
    };
  }
  if (evidence.missing.length) {
    return {
      action: "Request missing documents and pause settlement review",
      owner: "Claims Operations",
      human_gate: "Required before final settlement",
      sla: risk.severity === "High" ? "4 business hours" : "1 business day",
      rationale: "The claim has enough information for triage, but not enough evidence to proceed toward settlement review."
    };
  }
  if (risk.severity === "Medium") {
    return {
      action: "Assign to adjuster with medium-priority review",
      owner: "Claims Adjuster",
      human_gate: "Adjuster approval required",
      sla: "1 business day",
      rationale: "The claim appears covered and evidence is usable, but the operational risk level is high enough to require adjuster review before final action."
    };
  }
  return {
    action: "Fast-track for human approval",
    owner: "Claims Adjuster",
    human_gate: "Human approval before payment",
    sla: "1 business day",
    rationale: "Coverage, evidence, and risk signals are low enough for a faster adjuster review path, while payment authority remains human-gated."
  };
}

function draftCommunications(claim, policy, evidence, risk, recommendation) {
  const firstName = claim.customer_name.split(" ")[0];
  const policyLabel = policy ? policy.policy_id : claim.policy_id;
  const missingSentence = evidence.missing.length
    ? ` We still need: ${evidence.missing.join(", ")}.`
    : " We have the core documents required for initial review.";

  return {
    customer_message:
      `Hi ${firstName}, we received your ${claim.insurance_type.toLowerCase()} claim ` +
      `for policy ${policyLabel}.${missingSentence} ` +
      "A claims specialist will review the case before any final decision is made.",
    adjuster_note:
      `Claim ${claim.claim_id} is triaged as ${risk.severity} risk ` +
      `with score ${risk.score}/100. Recommended action: ` +
      `${recommendation.action}. Human gate: ${recommendation.human_gate}.`
  };
}

function buildTrace(claim, policy, coverage, evidence, risk, recommendation) {
  const policyObservation = policy
    ? `Found policy ${policy.policy_id} for ${policy.customer_name}.`
    : "No policy record found.";

  return [
    {
      agent: "Claims Intake Agent",
      decision: "Normalize the claim and identify the insurance playbook.",
      observation: `Detected ${claim.insurance_type} claim for ${claim.customer_name}.`,
      tool_used: "claim_intake_parser"
    },
    {
      agent: "Coverage Verification Agent",
      decision: "Check whether policy and claim details allow initial coverage.",
      observation: `${policyObservation} ${coverage.reason}`,
      tool_used: "policy_lookup_tool"
    },
    {
      agent: "Evidence Review Agent",
      decision: "Compare submitted evidence against the line-specific checklist.",
      observation: evidence.missing.length
        ? `Missing: ${evidence.missing.join(", ")}`
        : "All required documents are present.",
      tool_used: "document_requirements_tool"
    },
    {
      agent: "Risk & Fraud Triage Agent",
      decision: "Score severity, urgency, and operational risk signals.",
      observation: `${risk.severity} severity, ${risk.score}/100 risk score.`,
      tool_used: "risk_scoring_tool"
    },
    {
      agent: "Supervisor Agent",
      decision: "Choose next action and enforce the human approval gate.",
      observation: `${recommendation.action} assigned to ${recommendation.owner}.`,
      tool_used: "next_action_tool"
    },
    {
      agent: "Communication Agent",
      decision: "Draft customer and adjuster communications without finalizing the claim.",
      observation: "Prepared customer update and internal adjuster note.",
      tool_used: "communication_draft_tool"
    }
  ];
}

function parseDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function daysBetween(start, end) {
  return Math.round((parseDate(end) - parseDate(start)) / 86400000);
}

function titleCase(value) {
  return value ? value[0].toUpperCase() + value.slice(1).toLowerCase() : value;
}

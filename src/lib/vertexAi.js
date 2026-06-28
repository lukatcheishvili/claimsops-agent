import crypto from "node:crypto";
import fs from "node:fs";

import {
  CLAIMS_SYSTEM_INSTRUCTION,
  buildClaimsUserPrompt,
  parseClaimsReview
} from "@/lib/llmReview";

const PROVIDER_ID = "vertex";
const PROVIDER_LABEL = "Vertex AI";
const DEFAULT_PROJECT_ID = "";
const DEFAULT_PROJECT_NUMBER = "***";
const DEFAULT_LOCATION = "global";
const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_LIVE_REQUESTED = true;
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

export function getVertexRuntimeStatus() {
  const config = getVertexConfig();
  return {
    provider: PROVIDER_ID,
    providerLabel: PROVIDER_LABEL,
    projectId: config.projectId,
    projectNumber: maskProjectNumber(config.projectNumber),
    location: config.location,
    model: config.model,
    liveRequested: config.liveRequested,
    hasCredentials: Boolean(getServiceAccountCredentials())
  };
}

export async function runVertexClaimsReview(analysis, overrides = {}) {
  const config = getVertexConfig(overrides);
  const credentials = getServiceAccountCredentials(overrides);

  if (!config.liveRequested) {
    return buildStatus("disabled", config, "Vertex AI live mode is explicitly disabled. Set VERTEX_AI_LIVE=true or remove VERTEX_AI_LIVE=false in the deployment environment.", credentials);
  }

  if (!config.projectId) {
    return buildStatus("missing_project", config, "Vertex AI live mode is enabled, but GOOGLE_CLOUD_PROJECT is not configured.");
  }

  if (!credentials) {
    return buildStatus("missing_credentials", config, "Vertex AI live mode is enabled for this project, but service account credentials are not configured.");
  }

  try {
    const accessToken = await getAccessToken(credentials);
    const response = await fetch(buildGenerateContentUrl(config), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildVertexRequest(analysis))
    });

    if (!response.ok) {
      const text = await response.text();
      return buildStatus("error", config, `Vertex AI request failed with HTTP ${response.status}: ${text.slice(0, 220)}`, credentials);
    }

    const payload = await response.json();
    const text = extractCandidateText(payload);
    return {
      ...buildStatus("live", config, "Vertex AI produced a live claims review.", credentials),
      review: parseClaimsReview(text, PROVIDER_LABEL),
      rawText: text,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    return buildStatus("error", config, `Vertex AI live review failed: ${error.message}`, credentials);
  }
}

function getVertexConfig(overrides = {}) {
  const env = process.env;
  const model = normalizeModelName(sanitizeModelName(overrides.model) || env.VERTEX_AI_MODEL || env.CREWAI_MODEL || DEFAULT_MODEL);
  const liveRequested = overrides.liveRequested === true ? true : getLiveRequested(env);
  const projectId = sanitizeProjectId(overrides.projectId) || env.VERTEX_AI_PROJECT || env.GOOGLE_CLOUD_PROJECT || DEFAULT_PROJECT_ID;
  const projectNumber = sanitizeProjectNumber(overrides.projectNumber) || env.GOOGLE_CLOUD_PROJECT_NUMBER || DEFAULT_PROJECT_NUMBER;
  const location = sanitizeLocation(overrides.location) || env.VERTEX_AI_LOCATION || env.GOOGLE_CLOUD_LOCATION || DEFAULT_LOCATION;

  return {
    projectId,
    projectNumber,
    location,
    model,
    liveRequested
  };
}

function buildStatus(status, config, message, credentials = getServiceAccountCredentials()) {
  return {
    provider: PROVIDER_ID,
    providerLabel: PROVIDER_LABEL,
    enabled: status === "live",
    status,
    message,
    liveRequested: config.liveRequested,
    hasCredentials: Boolean(credentials),
    projectId: config.projectId,
    projectNumber: maskProjectNumber(config.projectNumber),
    location: config.location,
    model: config.model
  };
}

function maskProjectNumber(value) {
  return value ? "***" : "***";
}

function sanitizeProjectId(value) {
  const text = String(value || "").trim();
  return /^[a-z][a-z0-9-]{4,62}$/.test(text) ? text : "";
}

function sanitizeProjectNumber(value) {
  const text = String(value || "").replace(/\D/g, "");
  return text.length >= 6 && text.length <= 20 ? text : "";
}

function sanitizeLocation(value) {
  const text = String(value || "").trim();
  if (text === "global") return text;
  return /^[a-z]+-[a-z0-9-]+[0-9]$/.test(text) ? text : "";
}

function sanitizeModelName(value) {
  const text = String(value || "").trim();
  return /^[a-zA-Z0-9._/-]+$/.test(text) ? text : "";
}

function getLiveRequested(env) {
  const flags = [env.VERTEX_AI_LIVE, env.USE_VERTEX_AI_LIVE, env.GOOGLE_GENAI_USE_VERTEXAI];
  const hasExplicitFlag = flags.some((value) => value !== undefined && String(value).trim() !== "");
  if (!hasExplicitFlag) return DEFAULT_LIVE_REQUESTED;
  return flags.some(isTruthy);
}

function getServiceAccountCredentials(overrides = {}) {
  const overrideCredentials = parseCredentialJson(overrides.serviceAccountJson);
  if (overrideCredentials) return overrideCredentials;

  const env = process.env;
  const rawJson = env.GOOGLE_SERVICE_ACCOUNT_JSON || env.GOOGLE_APPLICATION_CREDENTIALS_JSON || env.VERTEX_AI_SERVICE_ACCOUNT_JSON;
  if (rawJson) return parseCredentialJson(rawJson);

  if (env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      return parseCredentialJson(fs.readFileSync(env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"));
    } catch {
      return null;
    }
  }

  if (env.GOOGLE_CLIENT_EMAIL && (env.GOOGLE_PRIVATE_KEY || env.GOOGLE_PRIVATE_KEY_BASE64)) {
    const privateKey = env.GOOGLE_PRIVATE_KEY_BASE64
      ? Buffer.from(env.GOOGLE_PRIVATE_KEY_BASE64, "base64").toString("utf8")
      : env.GOOGLE_PRIVATE_KEY;
    return normalizeCredentials({
      client_email: env.GOOGLE_CLIENT_EMAIL,
      private_key: privateKey
    });
  }

  return null;
}

function parseCredentialJson(rawValue) {
  try {
    const trimmed = rawValue.trim();
    const jsonText = trimmed.startsWith("{") ? trimmed : Buffer.from(trimmed, "base64").toString("utf8");
    return normalizeCredentials(JSON.parse(jsonText));
  } catch {
    return null;
  }
}

function normalizeCredentials(credentials) {
  if (!credentials?.client_email || !credentials?.private_key) return null;
  return {
    clientEmail: credentials.client_email,
    privateKey: credentials.private_key.replace(/\\n/g, "\n")
  };
}

async function getAccessToken(credentials) {
  const assertion = signServiceAccountJwt(credentials);
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  if (!response.ok) {
    throw new Error(`OAuth token exchange failed with HTTP ${response.status}`);
  }

  const token = await response.json();
  if (!token.access_token) throw new Error("OAuth token exchange did not return an access token.");
  return token.access_token;
}

function signServiceAccountJwt(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: credentials.clientEmail,
    scope: CLOUD_PLATFORM_SCOPE,
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now
  };
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsigned)
    .end()
    .sign(credentials.privateKey);
  return `${unsigned}.${base64Url(signature)}`;
}

function buildGenerateContentUrl(config) {
  const model = encodeURIComponent(config.model);
  const host = config.location === "global" ? "aiplatform.googleapis.com" : `${config.location}-aiplatform.googleapis.com`;
  return `https://${host}/v1/projects/${config.projectId}/locations/${config.location}/publishers/google/models/${model}:generateContent`;
}

function buildVertexRequest(analysis) {
  return {
    systemInstruction: {
      parts: [{ text: CLAIMS_SYSTEM_INSTRUCTION }]
    },
    contents: [
      {
        role: "user",
        parts: [{ text: buildClaimsUserPrompt(analysis, PROVIDER_LABEL) }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 900,
      responseMimeType: "application/json"
    }
  };
}

function extractCandidateText(payload) {
  return (
    payload?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || ""
  );
}

function normalizeModelName(model) {
  return String(model || DEFAULT_MODEL).replace(/^gemini\//, "");
}

function isTruthy(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").toLowerCase());
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

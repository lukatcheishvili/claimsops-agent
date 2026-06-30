// API-key LLM providers for the ClaimsOps live review.
//
// These run alongside the Vertex AI path (src/lib/vertexAi.js). The user picks a
// provider in the UI dropdown and supplies a plain API key per run, or the key
// comes from a deployment environment variable. Every provider returns the same
// normalized status object so the route and UI can render it exactly like the
// Vertex runtime status. Deterministic analysis always remains the source of
// truth; a failure here degrades gracefully to deterministic-only output.

import {
  CLAIMS_SYSTEM_INSTRUCTION,
  buildClaimsUserPrompt,
  parseClaimsReview
} from "@/lib/llmReview";
import {
  CHAT_SYSTEM_INSTRUCTION,
  buildGroundingPreamble,
  normalizeChatHistory
} from "@/lib/chatAgent";

// Provider catalog. Vertex AI is handled separately in vertexAi.js; this catalog
// covers the plain API-key providers exposed in the dropdown.
const PROVIDERS = {
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    defaultModel: "gemini-2.5-flash",
    keyEnvVars: ["GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"],
    keyHint: "Google AI Studio API key (aistudio.google.com/app/apikey)",
    run: runGemini
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    defaultModel: "gpt-4o-mini",
    keyEnvVars: ["OPENAI_API_KEY"],
    keyHint: "OpenAI API key starting with sk- (platform.openai.com/api-keys)",
    run: runOpenAi
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic Claude",
    defaultModel: "claude-3-5-haiku-latest",
    keyEnvVars: ["ANTHROPIC_API_KEY"],
    keyHint: "Anthropic API key (console.anthropic.com/settings/keys)",
    run: runAnthropic
  }
};

export function isApiKeyProvider(provider) {
  return Boolean(PROVIDERS[String(provider || "").toLowerCase()]);
}

// Public catalog for the GET status response. Includes whether a deployment
// environment variable is present so the UI can hint at server-side keys. Never
// returns the key value itself.
export function getProviderCatalog() {
  return Object.values(PROVIDERS).map((provider) => ({
    id: provider.id,
    label: provider.label,
    defaultModel: provider.defaultModel,
    keyHint: provider.keyHint,
    hasEnvKey: Boolean(resolveEnvKey(provider))
  }));
}

export async function runApiKeyClaimsReview(analysis, config = {}) {
  const provider = PROVIDERS[String(config.provider || "").toLowerCase()];
  if (!provider) {
    return buildStatus({ id: config.provider, label: "AI provider" }, "error", "", `Unknown LLM provider "${config.provider}".`);
  }

  const apiKey = sanitizeKey(config.apiKey) || resolveEnvKey(provider);
  const model = sanitizeModelName(config.model) || provider.defaultModel;

  if (!apiKey) {
    return buildStatus(
      provider,
      "missing_credentials",
      model,
      `${provider.label} live mode needs an API key. Paste a ${provider.keyHint} in the sidebar, or set one of ${provider.keyEnvVars.join(", ")} in the deployment environment.`
    );
  }

  try {
    const text = await provider.run({ analysis, apiKey, model });
    return {
      ...buildStatus(provider, "live", model, `${provider.label} produced a live claims review.`),
      review: parseClaimsReview(text, provider.label),
      rawText: text,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    return buildStatus(provider, "error", model, `${provider.label} live review failed; deterministic analysis is still available. ${error.message}`);
  }
}

function buildStatus(provider, status, model, message) {
  return {
    provider: provider.id,
    providerLabel: provider.label,
    enabled: status === "live",
    status,
    message,
    liveRequested: true,
    hasCredentials: status !== "missing_credentials",
    // Vertex-only fields are kept blank so the UI can render every provider with
    // the same status object without special-casing missing keys.
    projectId: "",
    projectNumber: "***",
    location: "",
    model,
    review: null
  };
}

// --- Chat path (multi-turn grounded conversation) ----------------------------

export async function runApiKeyClaimsChat(analysis, question, history, config = {}) {
  const provider = PROVIDERS[String(config.provider || "").toLowerCase()];
  if (!provider) {
    return chatStatusBlank(config.provider, "AI provider", "error", `Unknown LLM provider "${config.provider}".`);
  }
  const apiKey = sanitizeKey(config.apiKey) || resolveEnvKey(provider);
  const model = sanitizeModelName(config.model) || provider.defaultModel;
  if (!apiKey) {
    return chatStatusBlank(provider.id, provider.label, "missing_credentials", `${provider.label} needs an API key for chat.`);
  }

  try {
    const text = await runProviderChat(provider, { analysis, question, history, apiKey, model });
    return {
      provider: provider.id,
      providerLabel: provider.label,
      enabled: true,
      status: "live",
      model,
      answer: text || "I could not produce an answer for that question."
    };
  } catch (error) {
    return chatStatusBlank(provider.id, provider.label, "error", `${provider.label} chat failed: ${error.message}`);
  }
}

function chatStatusBlank(providerId, providerLabel, status, message) {
  return { provider: providerId, providerLabel, enabled: false, status, answer: "", message };
}

async function runProviderChat(provider, opts) {
  switch (provider.id) {
    case "gemini": return runGeminiChat(opts);
    case "openai": return runOpenAiChat(opts);
    case "anthropic": return runAnthropicChat(opts);
    default: throw new Error(`Chat not implemented for provider ${provider.id}.`);
  }
}

async function runGeminiChat({ analysis, question, history, apiKey, model }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const contents = [];
  contents.push({ role: "user", parts: [{ text: buildGroundingPreamble(analysis) }] });
  contents.push({ role: "model", parts: [{ text: "Understood. I will reference this analysis as the source of truth and keep final decisions human-gated." }] });
  normalizeChatHistory(history).forEach((entry) => {
    contents.push({ role: entry.role === "assistant" ? "model" : "user", parts: [{ text: entry.text }] });
  });
  const finalParts = [];
  appendGeminiFiles(finalParts, analysis);
  finalParts.push({ text: String(question || "").trim() });
  contents.push({ role: "user", parts: finalParts });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: CHAT_SYSTEM_INSTRUCTION }] },
      contents,
      generationConfig: { temperature: 0.3, maxOutputTokens: 700 }
    })
  });
  await assertOk(response, "Google Gemini");
  const payload = await response.json();
  return (
    payload?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || ""
  );
}

function appendGeminiFiles(parts, analysis) {
  const files = analysis?.claim?.files || {};
  Object.entries(files).forEach(([docType, file]) => {
    if (!file?.dataUrl) return;
    const base64 = String(file.dataUrl).split(",")[1];
    if (!base64) return;
    const mediaType = String(file.type || "");
    const ok = mediaType === "application/pdf" || mediaType.startsWith("image/");
    if (!ok) return;
    parts.push({ inlineData: { mimeType: mediaType, data: base64 } });
    parts.push({ text: `[Above attachment is the customer-submitted "${docType}" - filename "${file.name}".]` });
  });
}

async function runOpenAiChat({ analysis, question, history, apiKey, model }) {
  const messages = [
    { role: "system", content: `${CHAT_SYSTEM_INSTRUCTION}\n\n${buildGroundingPreamble(analysis)}` }
  ];
  normalizeChatHistory(history).forEach((entry) => {
    messages.push({ role: entry.role === "assistant" ? "assistant" : "user", content: entry.text });
  });
  messages.push({ role: "user", content: String(question || "").trim() });
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, temperature: 0.3, max_tokens: 700, messages })
  });
  await assertOk(response, "OpenAI");
  const payload = await response.json();
  return String(payload?.choices?.[0]?.message?.content || "").trim();
}

async function runAnthropicChat({ analysis, question, history, apiKey, model }) {
  const messages = [];
  normalizeChatHistory(history).forEach((entry) => {
    messages.push({ role: entry.role === "assistant" ? "assistant" : "user", content: entry.text });
  });
  const finalContent = [];
  appendAnthropicFiles(finalContent, analysis);
  finalContent.push({ type: "text", text: String(question || "").trim() });
  messages.push({ role: "user", content: finalContent.length > 1 ? finalContent : finalContent[0].text });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model,
      max_tokens: 700,
      temperature: 0.3,
      system: `${CHAT_SYSTEM_INSTRUCTION}\n\n${buildGroundingPreamble(analysis)}`,
      messages
    })
  });
  await assertOk(response, "Anthropic Claude");
  const payload = await response.json();
  return (
    (Array.isArray(payload?.content) ? payload.content : [])
      .map((block) => (block?.type === "text" ? block.text || "" : ""))
      .join("")
      .trim() || ""
  );
}

function appendAnthropicFiles(blocks, analysis) {
  const files = analysis?.claim?.files || {};
  Object.entries(files).forEach(([docType, file]) => {
    if (!file?.dataUrl) return;
    const base64 = String(file.dataUrl).split(",")[1];
    if (!base64) return;
    const mediaType = String(file.type || "");
    if (mediaType.startsWith("image/")) {
      blocks.push({ type: "image", source: { type: "base64", media_type: mediaType, data: base64 } });
      blocks.push({ type: "text", text: `[Above attachment is the customer-submitted "${docType}" - filename "${file.name}".]` });
    } else if (mediaType === "application/pdf") {
      blocks.push({ type: "document", source: { type: "base64", media_type: mediaType, data: base64 } });
      blocks.push({ type: "text", text: `[Above attachment is the customer-submitted "${docType}" - filename "${file.name}".]` });
    }
  });
}

// --- Provider request shapes --------------------------------------------------

async function runGemini({ analysis, apiKey, model }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: CLAIMS_SYSTEM_INSTRUCTION }] },
      contents: [{ role: "user", parts: [{ text: buildClaimsUserPrompt(analysis, "Google Gemini") }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 900,
        responseMimeType: "application/json"
      }
    })
  });

  await assertOk(response, "Google Gemini");
  const payload = await response.json();
  return (
    payload?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || ""
  );
}

async function runOpenAi({ analysis, apiKey, model }) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: CLAIMS_SYSTEM_INSTRUCTION },
        { role: "user", content: buildClaimsUserPrompt(analysis, "OpenAI") }
      ]
    })
  });

  await assertOk(response, "OpenAI");
  const payload = await response.json();
  return String(payload?.choices?.[0]?.message?.content || "").trim();
}

async function runAnthropic({ analysis, apiKey, model }) {
  const attachments = buildAnthropicAttachments(analysis);
  const userContent = [
    ...attachments,
    {
      type: "text",
      text: buildClaimsUserPrompt(analysis, "Anthropic Claude")
    }
  ];

  const systemPrompt = attachments.length
    ? `${CLAIMS_SYSTEM_INSTRUCTION} The user has attached the actual evidence files (claim form PDF, customer ID image, damage photos). Open each attachment, read or look at it, and reference specific things you observe — names, dates, amounts, plate numbers, visible damage — in the reasoning_steps and adjuster_questions. Respond with a single JSON object only.`
    : `${CLAIMS_SYSTEM_INSTRUCTION} Respond with a single JSON object only.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      temperature: 0.2,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }]
    })
  });

  await assertOk(response, "Anthropic Claude");
  const payload = await response.json();
  return (
    (Array.isArray(payload?.content) ? payload.content : [])
      .map((block) => (block?.type === "text" ? block.text || "" : ""))
      .join("")
      .trim() || ""
  );
}

function buildAnthropicAttachments(analysis) {
  const files = analysis?.claim?.files || {};
  const blocks = [];
  Object.entries(files).forEach(([docType, file]) => {
    if (!file?.dataUrl) return;
    const base64 = String(file.dataUrl).split(",")[1];
    if (!base64) return;
    const mediaType = String(file.type || "");
    if (mediaType.startsWith("image/")) {
      blocks.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data: base64 }
      });
      blocks.push({
        type: "text",
        text: `[Above attachment is the customer-submitted "${docType}" — filename "${file.name}". Look at it and reference what you actually see.]`
      });
    } else if (mediaType === "application/pdf") {
      blocks.push({
        type: "document",
        source: { type: "base64", media_type: mediaType, data: base64 }
      });
      blocks.push({
        type: "text",
        text: `[Above attachment is the customer-submitted "${docType}" — filename "${file.name}". Read it and reference specific values you can see (names, dates, amounts, addresses).]`
      });
    }
  });
  return blocks;
}

// --- Helpers ------------------------------------------------------------------

async function assertOk(response, label) {
  if (response.ok) return;
  const text = await response.text();
  throw new Error(`${label} request failed with HTTP ${response.status}: ${text.slice(0, 220)}`);
}

function resolveEnvKey(provider) {
  for (const name of provider.keyEnvVars) {
    const value = sanitizeKey(process.env[name]);
    if (value) return value;
  }
  return "";
}

function sanitizeKey(value) {
  return String(value || "").trim();
}

function sanitizeModelName(value) {
  const text = String(value || "").trim();
  return /^[a-zA-Z0-9._:/-]+$/.test(text) ? text : "";
}

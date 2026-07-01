import { NextResponse } from "next/server";

import { analyzeClaim } from "@/lib/claimsEngine";
import { isApiKeyProvider, runApiKeyClaimsChat } from "@/lib/llmProviders";
import { runVertexClaimsChat } from "@/lib/vertexAi";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body?.claim) {
      return NextResponse.json({ error: "Missing claim payload." }, { status: 400 });
    }
    const question = String(body.question || "").trim();
    if (!question) {
      return NextResponse.json({ error: "Missing question." }, { status: 400 });
    }

    const config = body.config || body.vertexConfig || {};
    const provider = String(body.provider || config.provider || "vertex").toLowerCase();
    const history = Array.isArray(body.history) ? body.history : [];

    const analysis = analyzeClaim(body.claim);
    const runtime = isApiKeyProvider(provider)
      ? await runApiKeyClaimsChat(analysis, question, history, { ...config, provider })
      : await runVertexClaimsChat(analysis, question, history, config);

    return NextResponse.json({
      mode: runtime.enabled ? runtime.provider : "deterministic",
      runtime
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Chat call failed.", detail: error.message },
      { status: 500 }
    );
  }
}

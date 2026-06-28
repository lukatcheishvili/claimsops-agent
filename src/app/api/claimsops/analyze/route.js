import { NextResponse } from "next/server";

import { analyzeClaim } from "@/lib/claimsEngine";
import { getProviderCatalog, isApiKeyProvider, runApiKeyClaimsReview } from "@/lib/llmProviders";
import { getVertexRuntimeStatus, runVertexClaimsReview } from "@/lib/vertexAi";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    vertex: getVertexRuntimeStatus(),
    providers: getProviderCatalog()
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body?.claim) {
      return NextResponse.json({ error: "Missing claim payload." }, { status: 400 });
    }

    const config = body.vertexConfig || body.config || {};
    const provider = String(body.provider || config.provider || "vertex").toLowerCase();

    const analysis = analyzeClaim(body.claim);
    const runtime = isApiKeyProvider(provider)
      ? await runApiKeyClaimsReview(analysis, { ...config, provider })
      : await runVertexClaimsReview(analysis, config);

    return NextResponse.json({
      mode: runtime.enabled ? runtime.provider : "deterministic",
      analysis,
      runtime,
      // Back-compat alias: earlier clients read the runtime status from `vertex`.
      vertex: runtime
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to analyze claim.",
        detail: error.message
      },
      { status: 500 }
    );
  }
}

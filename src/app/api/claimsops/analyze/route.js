import { NextResponse } from "next/server";

import { analyzeClaim } from "@/lib/claimsEngine";
import { getVertexRuntimeStatus, runVertexClaimsReview } from "@/lib/vertexAi";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    vertex: getVertexRuntimeStatus()
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body?.claim) {
      return NextResponse.json({ error: "Missing claim payload." }, { status: 400 });
    }

    const analysis = analyzeClaim(body.claim);
    const vertex = await runVertexClaimsReview(analysis, body.vertexConfig);

    return NextResponse.json({
      mode: vertex.enabled ? "vertex" : "deterministic",
      analysis,
      vertex
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

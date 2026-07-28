import { NextResponse } from "next/server";

// Returns the current deployment version so the KDS can detect new deploys and auto-reload
export async function GET() {
  return NextResponse.json({
    version: process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || "dev",
  });
}

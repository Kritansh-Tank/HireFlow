// ============================================
// GET /api/jobs — List saved jobs
// DELETE /api/jobs — Clear all saved jobs
// ============================================

import { NextRequest } from "next/server";
import { getJobs, deleteAllJobs } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const jobs = getJobs();
  return new Response(JSON.stringify({ jobs, total: jobs.length }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE() {
  deleteAllJobs();
  return new Response(JSON.stringify({ message: "All jobs cleared" }), {
    headers: { "Content-Type": "application/json" },
  });
}

// PATCH — update a single job status
export async function PATCH(request: NextRequest) {
  const { jobId, status } = await request.json();
  if (!jobId || !status) {
    return new Response(
      JSON.stringify({ error: "jobId and status required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { updateJobStatus } = await import("@/lib/storage");
  updateJobStatus(jobId, status);

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}

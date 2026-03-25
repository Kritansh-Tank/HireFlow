// ============================================
// POST /api/apply — Auto-fill job application forms
// ============================================

import { NextRequest } from "next/server";
import {
  streamAutomation,
  parseSSEEvent,
  buildApplyGoal,
} from "@/lib/tinyfish";
import { saveApplication, updateJobStatus } from "@/lib/storage";
import { ApplyRequest, ApplicationResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body: ApplyRequest = await request.json();
  const { jobUrl, jobId, profile } = body;

  if (!jobUrl || !profile) {
    return new Response(
      JSON.stringify({ error: "Job URL and profile are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      sendEvent({
        type: "APPLY_START",
        url: jobUrl,
        message: `📝 Starting auto-fill for job application...`,
        timestamp: new Date().toISOString(),
      });

      try {
        const goal = buildApplyGoal(profile);
        const tinyfishResponse = await streamAutomation(jobUrl, goal, {
          browserProfile: "stealth",
          proxyConfig: { enabled: true, country_code: "US" },
          featureFlags: { enable_agent_memory: true },
        });

        if (!tinyfishResponse.body) {
          throw new Error("No response body from TinyFish");
        }

        const reader = tinyfishResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let applyResult: unknown = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const event = parseSSEEvent(line);
            if (!event) continue;

            if (event.type === "PROGRESS") {
              sendEvent({
                type: "AGENT_PROGRESS",
                purpose: event.purpose,
                message: `📝 ${event.purpose}`,
                timestamp: new Date().toISOString(),
              });
            } else if (event.type === "STREAMING_URL") {
              sendEvent({
                type: "STREAMING_URL",
                streaming_url: event.streaming_url,
                timestamp: new Date().toISOString(),
              });
            } else if (event.type === "COMPLETE") {
              applyResult = event.result;
            }
          }
        }

        const stepsCompleted =
          typeof applyResult === "object" && applyResult !== null
            ? (
                (applyResult as Record<string, unknown>)
                  .stepsCompleted as string[]
              ) || []
            : [];

        const appRecord: ApplicationResult = {
          jobId,
          jobTitle: "",
          company: "",
          url: jobUrl,
          status: applyResult ? "success" : "failed",
          stepsCompleted,
          appliedAt: new Date().toISOString(),
        };

        saveApplication(appRecord);
        if (jobId) {
          updateJobStatus(jobId, "applied");
        }

        sendEvent({
          type: "APPLY_COMPLETE",
          result: applyResult,
          applicationRecord: appRecord,
          message: applyResult
            ? "✅ Application form filled successfully!"
            : "⚠️ Application completed with issues",
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        const appRecord: ApplicationResult = {
          jobId,
          jobTitle: "",
          company: "",
          url: jobUrl,
          status: "failed",
          stepsCompleted: [],
          error: error instanceof Error ? error.message : "Unknown error",
          appliedAt: new Date().toISOString(),
        };

        saveApplication(appRecord);

        sendEvent({
          type: "APPLY_ERROR",
          error: error instanceof Error ? error.message : "Unknown error",
          message: `❌ Auto-apply failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: new Date().toISOString(),
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

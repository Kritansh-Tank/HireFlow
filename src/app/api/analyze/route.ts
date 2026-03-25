// ============================================
// POST /api/analyze — Deep analyze a job listing
// ============================================

import { NextRequest } from "next/server";
import {
  streamAutomation,
  parseSSEEvent,
  buildAnalyzeGoal,
} from "@/lib/tinyfish";
import { saveJob, getJobs } from "@/lib/storage";
import { AnalyzeRequest } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body: AnalyzeRequest = await request.json();
  const { url, jobId } = body;

  if (!url) {
    return new Response(
      JSON.stringify({ error: "URL is required" }),
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
        type: "ANALYZE_START",
        url,
        message: `🔍 Analyzing job listing at ${new URL(url).hostname}...`,
        timestamp: new Date().toISOString(),
      });

      try {
        const goal = buildAnalyzeGoal();
        const tinyfishResponse = await streamAutomation(url, goal, {
          browserProfile: "stealth",
          proxyConfig: { enabled: true, country_code: "US" },
        });

        if (!tinyfishResponse.body) {
          throw new Error("No response body from TinyFish");
        }

        const reader = tinyfishResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let analyzeResult: unknown = null;

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
                message: `🔍 ${event.purpose}`,
                timestamp: new Date().toISOString(),
              });
            } else if (event.type === "STREAMING_URL") {
              sendEvent({
                type: "STREAMING_URL",
                streaming_url: event.streaming_url,
                timestamp: new Date().toISOString(),
              });
            } else if (event.type === "COMPLETE") {
              analyzeResult = event.result;
            }
          }
        }

        if (analyzeResult && jobId) {
          const jobs = getJobs();
          const existingJob = jobs.find((j) => j.id === jobId);
          if (existingJob) {
            const details =
              typeof analyzeResult === "object" && analyzeResult !== null
                ? (analyzeResult as Record<string, unknown>)
                : {};
            existingJob.description =
              String(details.description || existingJob.description);
            existingJob.tags = Array.isArray(details.tags)
              ? (details.tags as string[])
              : existingJob.tags;
            existingJob.salary =
              String(details.salary || existingJob.salary);
            existingJob.status = "analyzed";
            saveJob(existingJob);
          }
        }

        sendEvent({
          type: "ANALYZE_COMPLETE",
          result: analyzeResult,
          message: "✅ Analysis complete!",
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        sendEvent({
          type: "ANALYZE_ERROR",
          error: error instanceof Error ? error.message : "Unknown error",
          message: `❌ Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
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

// ============================================
// POST /api/search — Multi-board job search with SSE streaming
// ============================================

import { NextRequest } from "next/server";
import {
  streamAutomation,
  parseSSEEvent,
  buildSearchGoal,
} from "@/lib/tinyfish";
import { saveJobs } from "@/lib/storage";
import { Job, JOB_BOARDS, SearchRequest } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(request: NextRequest) {
  const body: SearchRequest = await request.json();
  const { keywords, location, experienceLevel, jobType, boards } = body;

  if (!keywords) {
    return new Response(
      JSON.stringify({ error: "Keywords are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const selectedBoards =
    boards && boards.length > 0 ? boards : ["linkedin"];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      sendEvent({
        type: "WORKFLOW_START",
        message: `Starting job search for "${keywords}" across ${selectedBoards.length} board(s)`,
        boards: selectedBoards,
        timestamp: new Date().toISOString(),
      });

      const allJobs: Job[] = [];

      for (const boardKey of selectedBoards) {
        const board = JOB_BOARDS[boardKey];
        if (!board) continue;

        sendEvent({
          type: "BOARD_START",
          board: boardKey,
          boardName: board.name,
          message: `${board.icon} Launching agent on ${board.name}...`,
          timestamp: new Date().toISOString(),
        });

        try {
          const goal = buildSearchGoal(
            keywords,
            location,
            experienceLevel,
            jobType,
            10
          );

          const tinyfishResponse = await streamAutomation(
            board.searchUrl,
            goal,
            {
              browserProfile: "stealth",
              proxyConfig: { enabled: true, country_code: "US" },
            }
          );

          if (!tinyfishResponse.body) {
            throw new Error("No response body from TinyFish");
          }

          const reader = tinyfishResponse.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let boardResult: unknown = null;

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
                  board: boardKey,
                  boardName: board.name,
                  purpose: event.purpose,
                  message: `${board.icon} [${board.name}] ${event.purpose}`,
                  timestamp: new Date().toISOString(),
                });
              } else if (event.type === "STREAMING_URL") {
                sendEvent({
                  type: "STREAMING_URL",
                  board: boardKey,
                  streaming_url: event.streaming_url,
                  timestamp: new Date().toISOString(),
                });
              } else if (event.type === "COMPLETE") {
                boardResult = event.result;
              }
            }
          }

          // Parse extracted jobs from result
          if (boardResult) {
            const jobs = extractJobsFromResult(
              boardResult,
              boardKey,
              board.name
            );
            allJobs.push(...jobs);

            sendEvent({
              type: "BOARD_COMPLETE",
              board: boardKey,
              boardName: board.name,
              jobsFound: jobs.length,
              message: `✅ ${board.name}: Found ${jobs.length} job(s)`,
              timestamp: new Date().toISOString(),
            });
          } else {
            sendEvent({
              type: "BOARD_COMPLETE",
              board: boardKey,
              boardName: board.name,
              jobsFound: 0,
              message: `⚠️ ${board.name}: No results extracted`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          sendEvent({
            type: "BOARD_ERROR",
            board: boardKey,
            boardName: board.name,
            error: error instanceof Error ? error.message : "Unknown error",
            message: `❌ ${board.name}: ${error instanceof Error ? error.message : "Failed"}`,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Save all found jobs
      if (allJobs.length > 0) {
        saveJobs(allJobs);
      }

      sendEvent({
        type: "WORKFLOW_COMPLETE",
        totalJobs: allJobs.length,
        jobs: allJobs,
        message: `🎉 Search complete! Found ${allJobs.length} job(s) across ${selectedBoards.length} board(s)`,
        timestamp: new Date().toISOString(),
      });

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

/**
 * Extract structured jobs from various TinyFish result formats.
 */
function extractJobsFromResult(
  result: unknown,
  source: string,
  sourceName: string
): Job[] {
  try {
    let jobsArray: Record<string, unknown>[] = [];

    if (Array.isArray(result)) {
      jobsArray = result;
    } else if (typeof result === "object" && result !== null) {
      const obj = result as Record<string, unknown>;
      // TinyFish may return { jobs: [...] } or { results: [...] } or { products: [...] }
      const possibleKeys = ["jobs", "results", "listings", "data", "items"];
      for (const key of possibleKeys) {
        if (Array.isArray(obj[key])) {
          jobsArray = obj[key] as Record<string, unknown>[];
          break;
        }
      }
      // If still empty, try treating the result string as JSON
      if (jobsArray.length === 0 && typeof obj.result === "string") {
        try {
          const parsed = JSON.parse(obj.result as string);
          if (Array.isArray(parsed)) jobsArray = parsed;
        } catch { /* ignore */ }
      }
    }

    return jobsArray.map((item) => ({
      id: generateJobId(),
      title: String(item.title || item.jobTitle || item.name || "Unknown"),
      company: String(item.company || item.companyName || item.employer || "Unknown"),
      location: String(item.location || item.city || "Not specified"),
      salary: String(item.salary || item.pay || item.compensation || "Not listed"),
      type: String(item.type || item.jobType || item.employmentType || "Full-time"),
      url: String(item.url || item.link || item.href || ""),
      description: String(item.description || item.summary || ""),
      postedDate: String(item.postedDate || item.date || item.posted || ""),
      source,
      tags: Array.isArray(item.tags)
        ? (item.tags as string[])
        : typeof item.skills === "string"
          ? (item.skills as string).split(",").map((s: string) => s.trim())
          : [],
      savedAt: new Date().toISOString(),
      status: "new" as const,
    }));
  } catch {
    return [];
  }
}

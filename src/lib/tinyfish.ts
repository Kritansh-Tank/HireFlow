// ============================================
// TinyFish API Client
// ============================================

const TINYFISH_API_URL = "https://agent.tinyfish.ai/v1/automation";

export interface TinyFishOptions {
  browserProfile?: "lite" | "stealth";
  proxyConfig?: {
    enabled: boolean;
    country_code?: string;
  };
  featureFlags?: {
    enable_agent_memory?: boolean;
  };
  useVault?: boolean;
}

/**
 * Stream automation events from TinyFish SSE endpoint.
 * Returns a ReadableStream of parsed SSE events.
 */
export async function streamAutomation(
  url: string,
  goal: string,
  options?: TinyFishOptions
): Promise<Response> {
  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey) {
    throw new Error("TINYFISH_API_KEY environment variable is not set");
  }

  const body: Record<string, unknown> = { url, goal };

  if (options?.browserProfile) {
    body.browser_profile = options.browserProfile;
  }
  if (options?.proxyConfig) {
    body.proxy_config = options.proxyConfig;
  }
  if (options?.featureFlags) {
    body.feature_flags = options.featureFlags;
  }
  if (options?.useVault) {
    body.use_vault = true;
  }

  const response = await fetch(`${TINYFISH_API_URL}/run-sse`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TinyFish API error (${response.status}): ${errorText}`);
  }

  return response;
}

/**
 * Run automation synchronously — blocks until complete.
 */
export async function runAutomation(
  url: string,
  goal: string,
  options?: TinyFishOptions
): Promise<{ status: string; result: unknown; error?: { message: string } }> {
  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey) {
    throw new Error("TINYFISH_API_KEY environment variable is not set");
  }

  const body: Record<string, unknown> = { url, goal };

  if (options?.browserProfile) {
    body.browser_profile = options.browserProfile;
  }
  if (options?.proxyConfig) {
    body.proxy_config = options.proxyConfig;
  }

  const response = await fetch(`${TINYFISH_API_URL}/run`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TinyFish API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Parse a single SSE data line into a typed event object.
 */
export function parseSSEEvent(line: string): Record<string, unknown> | null {
  const trimmed = line.trim();
  if (!trimmed || !trimmed.startsWith("data: ")) return null;

  try {
    return JSON.parse(trimmed.slice(6));
  } catch {
    return null;
  }
}

/**
 * Build the natural language goal for job searching on a specific board.
 */
export function buildSearchGoal(
  keywords: string,
  location: string,
  experienceLevel: string,
  jobType: string,
  maxResults: number
): string {
  const parts: string[] = [
    `Search for "${keywords}" jobs`,
  ];

  if (location && location !== "any") {
    parts[0] += ` in ${location}`;
  }

  parts.push(
    `Find up to ${maxResults} job listings.`,
    `For each job, extract: job title, company name, location, salary (if shown), job type (full-time/part-time/contract), posting date, and the direct URL to the job listing.`,
    `Return the results as a JSON array with fields: title, company, location, salary, type, postedDate, url.`,
    `If there are filters for experience level, set it to "${experienceLevel}".`,
    `If there are filters for job type, set it to "${jobType}".`,
    `Navigate through the search results. Click "Load More" or go to next page if needed to find more results.`
  );

  return parts.join(" ");
}

/**
 * Build goal for analyzing a specific job listing.
 */
export function buildAnalyzeGoal(): string {
  return `Visit this job listing page and extract ALL available information.
Return a JSON object with these fields:
- title: Job title
- company: Company name
- location: Job location
- salary: Salary range (if available)
- type: Employment type (full-time, part-time, contract, etc.)
- description: Full job description text
- requirements: Array of requirements/qualifications
- responsibilities: Array of job responsibilities
- benefits: Array of benefits/perks (if listed)
- applicationDeadline: Deadline if mentioned
- companyInfo: Brief company description if available
- tags: Array of key skills/technologies mentioned
Be thorough. Extract everything visible on the page.`;
}

/**
 * Build goal for auto-applying to a job.
 */
export function buildApplyGoal(
  profile: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedinUrl: string;
    portfolioUrl: string;
    desiredSalary: string;
    experienceYears: number;
    skills: string[];
  }
): string {
  return `Navigate to this job's application page and fill out the application form.
Use these details:
- Full Name: ${profile.fullName}
- Email: ${profile.email}
- Phone: ${profile.phone}
- Location: ${profile.location}
- LinkedIn: ${profile.linkedinUrl}
- Portfolio: ${profile.portfolioUrl}
- Expected Salary: ${profile.desiredSalary}
- Years of Experience: ${profile.experienceYears}
- Key Skills: ${profile.skills.join(", ")}

Instructions:
1. Look for an "Apply" or "Apply Now" or "Easy Apply" button and click it
2. Fill in all form fields using the provided information
3. For any dropdown selections, choose the closest matching option
4. For text areas asking "Why are you interested?" or cover letter, write a brief 2-3 sentence response expressing genuine interest in the role
5. DO NOT click the final "Submit" button — stop just before submission
6. Report what fields were filled and the current state of the application

Return a JSON object with:
- stepsCompleted: array of actions taken (e.g., "Clicked Apply Now", "Filled name field")
- fieldsFound: array of form field names found
- fieldsFilled: array of form field names successfully filled
- currentState: description of the current page state
- readyToSubmit: boolean indicating if the form appears complete`;
}

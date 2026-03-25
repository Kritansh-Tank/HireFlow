// ============================================
// TinyFish API Types
// ============================================

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string; // Full-time, Part-time, Contract
  url: string;
  description: string;
  postedDate: string;
  source: string; // linkedin, indeed, glassdoor
  tags: string[];
  relevanceScore?: number;
  savedAt: string;
  status: "new" | "analyzed" | "applied" | "rejected" | "interview";
}

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  resumeText: string;
  skills: string[];
  experienceYears: number;
  linkedinUrl: string;
  portfolioUrl: string;
  desiredRole: string;
  desiredSalary: string;
}

export interface SearchParams {
  keywords: string;
  location: string;
  experienceLevel: "entry" | "mid" | "senior" | "lead" | "any";
  jobType: "full-time" | "part-time" | "contract" | "any";
  boards: string[];
  maxResults: number;
}

export interface ApplicationResult {
  jobId: string;
  jobTitle: string;
  company: string;
  url: string;
  status: "success" | "partial" | "failed";
  stepsCompleted: string[];
  error?: string;
  appliedAt: string;
}

// ============================================
// TinyFish SSE Event Types
// ============================================

export type AgentEventType =
  | "STARTED"
  | "STREAMING_URL"
  | "PROGRESS"
  | "COMPLETE"
  | "HEARTBEAT"
  | "ERROR";

export interface AgentEvent {
  type: AgentEventType;
  run_id?: string;
  timestamp?: string;
  purpose?: string;
  streaming_url?: string;
  status?: "COMPLETED" | "FAILED";
  result?: unknown;
  error?: { message: string };
}

export interface WorkflowRun {
  id: string;
  type: "search" | "analyze" | "apply";
  status: "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  events: AgentEvent[];
  result?: unknown;
  targetUrl?: string;
  targetSite?: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface SearchRequest {
  keywords: string;
  location: string;
  experienceLevel: string;
  jobType: string;
  boards: string[];
}

export interface AnalyzeRequest {
  url: string;
  jobId?: string;
}

export interface ApplyRequest {
  jobUrl: string;
  jobId: string;
  profile: UserProfile;
}

// Board configuration
export const JOB_BOARDS: Record<
  string,
  { name: string; icon: string; color: string; searchUrl: string }
> = {
  linkedin: {
    name: "LinkedIn",
    icon: "💼",
    color: "#0A66C2",
    searchUrl: "https://www.linkedin.com/jobs/search/",
  },
  indeed: {
    name: "Indeed",
    icon: "🔍",
    color: "#2164f3",
    searchUrl: "https://www.indeed.com/jobs",
  },
  glassdoor: {
    name: "Glassdoor",
    icon: "🏢",
    color: "#0CAA41",
    searchUrl: "https://www.glassdoor.com/Job/",
  },
  remoteok: {
    name: "Remote OK",
    icon: "🌐",
    color: "#FF4742",
    searchUrl: "https://remoteok.com/",
  },
  wellfound: {
    name: "Wellfound",
    icon: "🚀",
    color: "#CC1016",
    searchUrl: "https://wellfound.com/jobs",
  },
};

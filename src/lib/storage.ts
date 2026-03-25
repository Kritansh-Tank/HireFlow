// ============================================
// Simple JSON File Storage
// ============================================

import fs from "fs";
import path from "path";
import { Job, ApplicationResult, UserProfile } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJSON<T>(filename: string, fallback: T): T {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJSON<T>(filename: string, data: T): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ---- Jobs ----

export function getJobs(): Job[] {
  return readJSON<Job[]>("jobs.json", []);
}

export function saveJob(job: Job): void {
  const jobs = getJobs();
  const existing = jobs.findIndex((j) => j.id === job.id);
  if (existing >= 0) {
    jobs[existing] = { ...jobs[existing], ...job };
  } else {
    jobs.push(job);
  }
  writeJSON("jobs.json", jobs);
}

export function saveJobs(newJobs: Job[]): void {
  const jobs = getJobs();
  for (const job of newJobs) {
    const existing = jobs.findIndex(
      (j) => j.url === job.url || j.id === job.id
    );
    if (existing >= 0) {
      jobs[existing] = { ...jobs[existing], ...job };
    } else {
      jobs.push(job);
    }
  }
  writeJSON("jobs.json", jobs);
}

export function updateJobStatus(
  jobId: string,
  status: Job["status"]
): void {
  const jobs = getJobs();
  const job = jobs.find((j) => j.id === jobId);
  if (job) {
    job.status = status;
    writeJSON("jobs.json", jobs);
  }
}

export function deleteAllJobs(): void {
  writeJSON("jobs.json", []);
}

// ---- Applications ----

export function getApplications(): ApplicationResult[] {
  return readJSON<ApplicationResult[]>("applications.json", []);
}

export function saveApplication(app: ApplicationResult): void {
  const apps = getApplications();
  apps.push(app);
  writeJSON("applications.json", apps);
}

// ---- Profile ----

export function getProfile(): UserProfile | null {
  return readJSON<UserProfile | null>("profile.json", null);
}

export function saveProfile(profile: UserProfile): void {
  writeJSON("profile.json", profile);
}

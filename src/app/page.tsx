"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Job, UserProfile, ApplicationResult, JOB_BOARDS } from "@/lib/types";

// ============================================
// Agent Feed Component
// ============================================
interface FeedEvent {
    id: string;
    type: string;
    message: string;
    timestamp: string;
    board?: string;
}

function AgentFeed({ events, isActive }: { events: FeedEvent[]; isActive: boolean }) {
    const feedRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (feedRef.current) {
            feedRef.current.scrollTop = feedRef.current.scrollHeight;
        }
    }, [events]);

    const getDotClass = (type: string) => {
        if (type.includes("START")) return "dot-blue animated";
        if (type.includes("PROGRESS")) return "dot-cyan animated";
        if (type.includes("COMPLETE")) return "dot-green";
        if (type.includes("ERROR")) return "dot-red";
        return "dot-yellow";
    };

    const getEventClass = (type: string) => {
        if (type.includes("START")) return "event-start";
        if (type.includes("PROGRESS")) return "event-progress";
        if (type.includes("COMPLETE")) return "event-complete";
        if (type.includes("ERROR")) return "event-error";
        return "";
    };

    return (
        <div>
            <div className="agent-feed-header">
                <span className="agent-feed-title">
                    {isActive && <span className="spinner" />}
                    🤖 Agent Activity
                </span>
                {events.length > 0 && (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {events.length} event{events.length !== 1 ? "s" : ""}
                    </span>
                )}
            </div>
            <div className="agent-feed" ref={feedRef}>
                {events.length === 0 ? (
                    <div className="empty-state" style={{ padding: "40px 20px" }}>
                        <p style={{ fontSize: "0.82rem" }}>
                            Agent events will appear here when you launch a search...
                        </p>
                    </div>
                ) : (
                    events.map((event) => (
                        <div
                            key={event.id}
                            className={`feed-event ${getEventClass(event.type)}`}
                        >
                            <div className={`feed-status-dot ${getDotClass(event.type)}`} />
                            <span className="feed-message">{event.message}</span>
                            <span className="feed-time">
                                {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ============================================
// Job Card Component
// ============================================
function JobCard({
    job,
    onAnalyze,
    onApply,
    isAnalyzing,
    isApplying,
}: {
    job: Job;
    onAnalyze: (job: Job) => void;
    onApply: (job: Job) => void;
    isAnalyzing: boolean;
    isApplying: boolean;
}) {
    const sourceColors: Record<string, string> = {
        linkedin: "#0A66C2",
        indeed: "#2164f3",
        glassdoor: "#0CAA41",
        remoteok: "#FF4742",
        wellfound: "#CC1016",
    };

    return (
        <div className="job-card">
            <div className="job-card-header">
                <div>
                    <div className="job-card-title">{job.title}</div>
                    <div className="job-card-company">{job.company}</div>
                </div>
                <span
                    className="job-card-source"
                    style={{ background: sourceColors[job.source] || "#666" }}
                >
                    {job.source}
                </span>
            </div>

            <div className="job-card-meta">
                <span className="job-meta-tag">📍 {job.location}</span>
                {job.salary && job.salary !== "Not listed" && (
                    <span className="job-meta-tag salary">💰 {job.salary}</span>
                )}
                <span className="job-meta-tag">🕐 {job.type}</span>
                <span className={`job-status-badge ${job.status}`}>{job.status}</span>
            </div>

            {job.tags.length > 0 && (
                <div className="job-card-tags">
                    {job.tags.slice(0, 5).map((tag, i) => (
                        <span key={i} className="job-tag">
                            {tag}
                        </span>
                    ))}
                    {job.tags.length > 5 && (
                        <span className="job-tag">+{job.tags.length - 5}</span>
                    )}
                </div>
            )}

            {job.description && (
                <p
                    style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const,
                        overflow: "hidden",
                    }}
                >
                    {job.description}
                </p>
            )}

            <div className="job-card-actions">
                {job.url && (
                    <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                    >
                        🔗 View
                    </a>
                )}
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onAnalyze(job)}
                    disabled={isAnalyzing}
                >
                    {isAnalyzing ? (
                        <>
                            <span className="spinner" /> Analyzing...
                        </>
                    ) : (
                        "🔍 Analyze"
                    )}
                </button>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onApply(job)}
                    disabled={isApplying}
                >
                    {isApplying ? (
                        <>
                            <span className="spinner" /> Applying...
                        </>
                    ) : (
                        "📝 Auto-Apply"
                    )}
                </button>
            </div>
        </div>
    );
}

// ============================================
// Profile Setup Component
// ============================================
function ProfileSetup({
    profile,
    onSave,
}: {
    profile: UserProfile | null;
    onSave: (profile: UserProfile) => void;
}) {
    const [formData, setFormData] = useState<UserProfile>(
        profile || {
            fullName: "",
            email: "",
            phone: "",
            location: "",
            resumeText: "",
            skills: [],
            experienceYears: 0,
            linkedinUrl: "",
            portfolioUrl: "",
            desiredRole: "",
            desiredSalary: "",
        }
    );
    const [skillInput, setSkillInput] = useState("");
    const [saved, setSaved] = useState(false);

    const handleChange = (
        field: keyof UserProfile,
        value: string | number | string[]
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const addSkill = () => {
        const skill = skillInput.trim();
        if (skill && !formData.skills.includes(skill)) {
            handleChange("skills", [...formData.skills, skill]);
            setSkillInput("");
        }
    };

    const removeSkill = (skill: string) => {
        handleChange(
            "skills",
            formData.skills.filter((s) => s !== skill)
        );
    };

    const handleSave = () => {
        onSave(formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="glass-card">
            <div className="section-header">
                <h3 className="section-title">👤 Your Profile</h3>
                {saved && (
                    <span style={{ fontSize: "0.82rem", color: "var(--accent-success)" }}>
                        ✅ Saved!
                    </span>
                )}
            </div>
            <div className="profile-panel">
                <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                        className="form-input"
                        value={formData.fullName}
                        onChange={(e) => handleChange("fullName", e.target.value)}
                        placeholder="John Doe"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                        className="form-input"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="john@example.com"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                        className="form-input"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="+1 (555) 123-4567"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                        className="form-input"
                        value={formData.location}
                        onChange={(e) => handleChange("location", e.target.value)}
                        placeholder="San Francisco, CA"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Desired Role</label>
                    <input
                        className="form-input"
                        value={formData.desiredRole}
                        onChange={(e) => handleChange("desiredRole", e.target.value)}
                        placeholder="Senior Software Engineer"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Desired Salary</label>
                    <input
                        className="form-input"
                        value={formData.desiredSalary}
                        onChange={(e) => handleChange("desiredSalary", e.target.value)}
                        placeholder="$150,000 - $200,000"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Years of Experience</label>
                    <input
                        className="form-input"
                        type="number"
                        min={0}
                        value={formData.experienceYears}
                        onChange={(e) =>
                            handleChange("experienceYears", parseInt(e.target.value) || 0)
                        }
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">LinkedIn URL</label>
                    <input
                        className="form-input"
                        value={formData.linkedinUrl}
                        onChange={(e) => handleChange("linkedinUrl", e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Portfolio URL</label>
                    <input
                        className="form-input"
                        value={formData.portfolioUrl}
                        onChange={(e) => handleChange("portfolioUrl", e.target.value)}
                        placeholder="https://myportfolio.com"
                    />
                </div>
                <div className="form-group full-width">
                    <label className="form-label">Skills</label>
                    <div className="skills-input-wrapper">
                        {formData.skills.map((skill) => (
                            <span key={skill} className="skill-chip">
                                {skill}
                                <button onClick={() => removeSkill(skill)}>×</button>
                            </span>
                        ))}
                        <input
                            className="skills-input"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addSkill();
                                }
                            }}
                            placeholder="Type a skill and press Enter..."
                        />
                    </div>
                </div>
                <div className="form-group full-width">
                    <label className="form-label">Resume Summary</label>
                    <textarea
                        className="form-textarea"
                        rows={4}
                        value={formData.resumeText}
                        onChange={(e) => handleChange("resumeText", e.target.value)}
                        placeholder="Brief summary of your experience and qualifications..."
                    />
                </div>
                <div className="profile-actions">
                    <button className="btn btn-primary" onClick={handleSave}>
                        💾 Save Profile
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Main Dashboard Page
// ============================================
export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<"search" | "jobs" | "applications" | "profile">("search");
    const [jobs, setJobs] = useState<Job[]>([]);
    const [applications, setApplications] = useState<ApplicationResult[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [analyzingJobId, setAnalyzingJobId] = useState<string | null>(null);
    const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
    const [streamingUrl, setStreamingUrl] = useState<string | null>(null);

    // Search form state
    const [searchKeywords, setSearchKeywords] = useState("");
    const [searchLocation, setSearchLocation] = useState("");
    const [searchExperience, setSearchExperience] = useState("any");
    const [searchJobType, setSearchJobType] = useState("any");
    const [selectedBoards, setSelectedBoards] = useState<string[]>(["linkedin"]);

    // Load saved data
    useEffect(() => {
        fetch("/api/jobs")
            .then((r) => r.json())
            .then((data) => setJobs(data.jobs || []))
            .catch(() => { });
        fetch("/api/profile")
            .then((r) => r.json())
            .then((data) => {
                if (data.profile) setProfile(data.profile);
            })
            .catch(() => { });
    }, []);

    const addFeedEvent = useCallback(
        (type: string, message: string, timestamp?: string) => {
            setFeedEvents((prev) => [
                ...prev,
                {
                    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    type,
                    message,
                    timestamp: timestamp || new Date().toISOString(),
                },
            ]);
        },
        []
    );

    // ---- SSE Stream Consumer ----
    const consumeSSE = useCallback(
        async (
            url: string,
            body: Record<string, unknown>,
            onComplete?: (data: Record<string, unknown>) => void
        ) => {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith("data: ")) continue;

                    try {
                        const event = JSON.parse(trimmed.slice(6));
                        if (event.message) {
                            addFeedEvent(event.type, event.message, event.timestamp);
                        }
                        if (event.streaming_url) {
                            setStreamingUrl(event.streaming_url);
                        }
                        if (event.type?.includes("COMPLETE") && onComplete) {
                            onComplete(event);
                        }
                    } catch {
                        // skip malformed events
                    }
                }
            }
        },
        [addFeedEvent]
    );

    // ---- Search Handler ----
    const handleSearch = async () => {
        if (!searchKeywords.trim()) return;

        setIsSearching(true);
        setFeedEvents([]);
        setStreamingUrl(null);

        try {
            await consumeSSE(
                "/api/search",
                {
                    keywords: searchKeywords,
                    location: searchLocation,
                    experienceLevel: searchExperience,
                    jobType: searchJobType,
                    boards: selectedBoards,
                },
                (event) => {
                    if (event.jobs && Array.isArray(event.jobs)) {
                        setJobs((prev) => {
                            const newJobs = event.jobs as Job[];
                            const existing = new Set(prev.map((j) => j.url));
                            const unique = newJobs.filter((j) => !existing.has(j.url));
                            return [...prev, ...unique];
                        });
                    }
                }
            );
        } catch (error) {
            addFeedEvent(
                "ERROR",
                `❌ Search failed: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }

        setIsSearching(false);
    };

    // ---- Analyze Handler ----
    const handleAnalyze = async (job: Job) => {
        if (!job.url) return;
        setAnalyzingJobId(job.id);

        try {
            await consumeSSE(
                "/api/analyze",
                { url: job.url, jobId: job.id },
                (event) => {
                    if (event.result) {
                        setJobs((prev) =>
                            prev.map((j) =>
                                j.id === job.id ? { ...j, status: "analyzed" } : j
                            )
                        );
                    }
                }
            );
        } catch (error) {
            addFeedEvent(
                "ERROR",
                `❌ Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }

        setAnalyzingJobId(null);
    };

    // ---- Apply Handler ----
    const handleApply = async (job: Job) => {
        if (!job.url || !profile) {
            addFeedEvent(
                "ERROR",
                "⚠️ Please set up your profile before applying"
            );
            setActiveTab("profile");
            return;
        }

        setApplyingJobId(job.id);

        try {
            await consumeSSE(
                "/api/apply",
                { jobUrl: job.url, jobId: job.id, profile },
                (event) => {
                    if (event.applicationRecord) {
                        setApplications((prev) => [
                            ...prev,
                            event.applicationRecord as ApplicationResult,
                        ]);
                        setJobs((prev) =>
                            prev.map((j) =>
                                j.id === job.id ? { ...j, status: "applied" } : j
                            )
                        );
                    }
                }
            );
        } catch (error) {
            addFeedEvent(
                "ERROR",
                `❌ Auto-apply failed: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }

        setApplyingJobId(null);
    };

    // ---- Profile Handler ----
    const handleSaveProfile = async (profileData: UserProfile) => {
        try {
            await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profileData),
            });
            setProfile(profileData);
        } catch {
            // ignore
        }
    };

    // ---- Clear Jobs ----
    const handleClearJobs = async () => {
        await fetch("/api/jobs", { method: "DELETE" });
        setJobs([]);
    };

    const toggleBoard = (board: string) => {
        setSelectedBoards((prev) =>
            prev.includes(board)
                ? prev.filter((b) => b !== board)
                : [...prev, board]
        );
    };

    // Stats
    const totalJobs = jobs.length;
    const analyzedJobs = jobs.filter((j) => j.status === "analyzed").length;
    const appliedJobs = jobs.filter((j) => j.status === "applied").length;
    const totalApps = applications.length;

    return (
        <div className="app-container">
            {/* Header */}
            <header className="app-header">
                <div className="app-logo">
                    <div className="app-logo-icon">⚡</div>
                    <div>
                        <h1>HireFlow</h1>
                        <p>AI-Powered Job Hunt Autopilot</p>
                    </div>
                </div>
                <div className="header-badge">
                    <span className="dot" />
                    Powered by TinyFish Web Agent
                </div>
            </header>

            {/* Stats */}
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-value">{totalJobs}</div>
                    <div className="stat-label">Jobs Found</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{analyzedJobs}</div>
                    <div className="stat-label">Analyzed</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{appliedJobs}</div>
                    <div className="stat-label">Applied</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{totalApps}</div>
                    <div className="stat-label">Applications</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                <button
                    className={`tab-button ${activeTab === "search" ? "active" : ""}`}
                    onClick={() => setActiveTab("search")}
                >
                    🔍 Search
                </button>
                <button
                    className={`tab-button ${activeTab === "jobs" ? "active" : ""}`}
                    onClick={() => setActiveTab("jobs")}
                >
                    📋 Jobs
                    {totalJobs > 0 && <span className="tab-badge">{totalJobs}</span>}
                </button>
                <button
                    className={`tab-button ${activeTab === "applications" ? "active" : ""}`}
                    onClick={() => setActiveTab("applications")}
                >
                    📝 Applications
                    {totalApps > 0 && <span className="tab-badge">{totalApps}</span>}
                </button>
                <button
                    className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
                    onClick={() => setActiveTab("profile")}
                >
                    👤 Profile
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === "search" && (
                <div className="two-col-layout">
                    {/* Search Form */}
                    <div className="glass-card search-panel">
                        <div className="section-header">
                            <h3 className="section-title">🚀 Launch Job Search Agent</h3>
                        </div>
                        <div className="search-form">
                            <div className="form-group">
                                <label className="form-label">Keywords / Job Title</label>
                                <input
                                    className="form-input"
                                    value={searchKeywords}
                                    onChange={(e) => setSearchKeywords(e.target.value)}
                                    placeholder="e.g., Software Engineer, Product Manager, Data Scientist..."
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSearch();
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Location</label>
                                <input
                                    className="form-input"
                                    value={searchLocation}
                                    onChange={(e) => setSearchLocation(e.target.value)}
                                    placeholder="e.g., Remote, San Francisco, New York..."
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Experience Level</label>
                                <select
                                    className="form-select"
                                    value={searchExperience}
                                    onChange={(e) => setSearchExperience(e.target.value)}
                                >
                                    <option value="any">Any Level</option>
                                    <option value="entry">Entry Level</option>
                                    <option value="mid">Mid Level</option>
                                    <option value="senior">Senior</option>
                                    <option value="lead">Lead / Staff</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Job Type</label>
                                <select
                                    className="form-select"
                                    value={searchJobType}
                                    onChange={(e) => setSearchJobType(e.target.value)}
                                >
                                    <option value="any">Any Type</option>
                                    <option value="full-time">Full-time</option>
                                    <option value="part-time">Part-time</option>
                                    <option value="contract">Contract</option>
                                </select>
                            </div>
                            <div className="boards-group form-group">
                                <label className="form-label">Job Boards to Scrape</label>
                                <div className="boards-grid">
                                    {Object.entries(JOB_BOARDS).map(([key, board]) => (
                                        <label
                                            key={key}
                                            className={`board-chip ${selectedBoards.includes(key) ? "selected" : ""}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedBoards.includes(key)}
                                                onChange={() => toggleBoard(key)}
                                            />
                                            {board.icon} {board.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="search-actions">
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSearch}
                                    disabled={isSearching || !searchKeywords.trim()}
                                >
                                    {isSearching ? (
                                        <>
                                            <span className="spinner" /> Agents Running...
                                        </>
                                    ) : (
                                        "🤖 Launch Agent"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Agent Activity Feed */}
                    <div className="glass-card">
                        <AgentFeed events={feedEvents} isActive={isSearching} />
                        {streamingUrl && (
                            <div className="stream-viewer">
                                <iframe src={streamingUrl} title="Agent Browser Stream" />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "jobs" && (
                <div>
                    <div className="section-header">
                        <h3 className="section-title">
                            📋 Saved Jobs ({jobs.length})
                        </h3>
                        {jobs.length > 0 && (
                            <button className="btn btn-danger btn-sm" onClick={handleClearJobs}>
                                🗑️ Clear All
                            </button>
                        )}
                    </div>
                    {jobs.length === 0 ? (
                        <div className="glass-card">
                            <div className="empty-state">
                                <div className="empty-state-icon">🔍</div>
                                <h3>No jobs found yet</h3>
                                <p>
                                    Launch a search agent to find jobs across multiple boards
                                    automatically.
                                </p>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setActiveTab("search")}
                                    style={{ marginTop: "16px" }}
                                >
                                    🚀 Start Searching
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="jobs-grid">
                            {jobs.map((job) => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    onAnalyze={handleAnalyze}
                                    onApply={handleApply}
                                    isAnalyzing={analyzingJobId === job.id}
                                    isApplying={applyingJobId === job.id}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "applications" && (
                <div>
                    <div className="section-header">
                        <h3 className="section-title">
                            📝 Application Tracker ({applications.length})
                        </h3>
                    </div>
                    {applications.length === 0 ? (
                        <div className="glass-card">
                            <div className="empty-state">
                                <div className="empty-state-icon">📝</div>
                                <h3>No applications yet</h3>
                                <p>
                                    Find jobs in the Search tab, then click &quot;Auto-Apply&quot; to let the
                                    agent fill out application forms for you.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="applications-list">
                            {applications.map((app, i) => (
                                <div key={i} className="application-item">
                                    <div
                                        className={`application-status-icon ${app.status}`}
                                    >
                                        {app.status === "success"
                                            ? "✅"
                                            : app.status === "partial"
                                                ? "⚠️"
                                                : "❌"}
                                    </div>
                                    <div className="application-info">
                                        <h4>{app.jobTitle || "Job Application"}</h4>
                                        <p>
                                            {app.company || app.url} •{" "}
                                            {new Date(app.appliedAt).toLocaleDateString()} •{" "}
                                            {app.stepsCompleted.length} steps completed
                                        </p>
                                        {app.error && (
                                            <p style={{ color: "var(--accent-error)", marginTop: "4px" }}>
                                                Error: {app.error}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`job-status-badge ${app.status === "success" ? "applied" : app.status === "failed" ? "rejected" : "new"}`}>
                                        {app.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "profile" && (
                <ProfileSetup profile={profile} onSave={handleSaveProfile} />
            )}
        </div>
    );
}

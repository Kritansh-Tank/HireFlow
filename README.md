# ⚡ HireFlow — AI-Powered Job Hunt Autopilot

> An autonomous web agent that monitors job boards, extracts listings, analyzes roles, and auto-fills application forms — powered by [TinyFish Web Agent API](https://tinyfish.ai).

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![TinyFish](https://img.shields.io/badge/TinyFish-Web%20Agent-cyan)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🧠 The Problem

Job seekers spend **30+ hours per week** manually:
- Browsing LinkedIn, Indeed, Glassdoor, and dozens of niche boards
- Copy-pasting job details into spreadsheets
- Filling out the same repetitive application forms over and over
- Tracking which roles they've applied to

**HireFlow eliminates all of that.** It deploys autonomous browser agents that navigate real job sites, extract structured data, and fill out multi-step application forms — all while you watch in real-time.

---

## 🚀 What It Does

| Capability | Description |
|---|---|
| **🔍 Multi-Board Scraping** | Launches parallel TinyFish agents across LinkedIn, Indeed, Glassdoor, Remote OK, and Wellfound simultaneously |
| **📊 Deep Job Analysis** | Navigates to individual listings and extracts full descriptions, requirements, salary, benefits, and company info |
| **📝 Auto-Apply** | Fills out multi-step application forms using your profile data — handles dynamic UIs, dropdowns, and text areas |
| **📡 Live Agent Feed** | Real-time SSE-powered dashboard showing exactly what the agent is doing as it navigates websites |
| **🥷 Stealth Mode** | Built-in anti-detection via TinyFish's stealth browser profiles and rotating proxies |
| **🔐 Session Management** | Persistent vault credentials for authenticated workflows |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│              Next.js Frontend               │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Search  │ │ Job Grid │ │  Agent Feed   │  │
│  │  Panel  │ │ & Cards  │ │ (Live SSE)   │  │
│  └────┬────┘ └────┬─────┘ └──────┬───────┘  │
│       │           │              │           │
│  ┌────▼───────────▼──────────────▼───────┐   │
│  │         Next.js API Routes            │   │
│  │  /api/search  /api/analyze  /api/apply│   │
│  └────────────────┬──────────────────────┘   │
└───────────────────┼──────────────────────────┘
                    │ SSE Streaming
                    ▼
        ┌───────────────────────┐
        │   TinyFish Web Agent  │
        │        API            │
        │  ┌─────────────────┐  │
        │  │ Stealth Browser │  │
        │  │ + Proxy Infra   │  │
        │  └────────┬────────┘  │
        └───────────┼───────────┘
                    │
     ┌──────────────┼──────────────┐
     ▼              ▼              ▼
 ┌────────┐   ┌──────────┐   ┌──────────┐
 │LinkedIn│   │  Indeed   │   │Glassdoor │
 │  Jobs  │   │   Jobs   │   │   Jobs   │
 └────────┘   └──────────┘   └──────────┘
```

---

## 🧰 Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 15** | Full-stack React framework (App Router) |
| **TypeScript** | Type safety across the entire codebase |
| **TinyFish API** | Browser automation & web agent infrastructure |
| **Server-Sent Events** | Real-time streaming from agent to frontend |
| **Vanilla CSS** | Custom dark theme with glassmorphism & animations |

---

## 🛠️ How TinyFish API Is Used

HireFlow uses TinyFish as its core browser automation engine. Every job board interaction goes through TinyFish — **no Puppeteer, no Selenium, no manual selectors.**

### 1. Job Search — Multi-Board Scraping

```typescript
// Dispatches a TinyFish agent to a job board with a natural language goal
const response = await fetch("https://agent.tinyfish.ai/v1/automation/run-sse", {
  method: "POST",
  headers: {
    "X-API-Key": process.env.TINYFISH_API_KEY!,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url: "https://www.linkedin.com/jobs/search/",
    goal: `Search for "Software Engineer" jobs in San Francisco. 
           Find up to 10 listings. For each job, extract: 
           title, company, location, salary, job type, posting date, and URL.
           Return results as a JSON array.
           Navigate through pages if needed.`,
    browser_profile: "stealth",
    proxy_config: { enabled: true, country_code: "US" },
  }),
});
```

### 2. Job Analysis — Deep Data Extraction

```typescript
// Sends agent to a specific job listing to extract all details
const response = await fetch("https://agent.tinyfish.ai/v1/automation/run-sse", {
  method: "POST",
  headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
  body: JSON.stringify({
    url: "https://linkedin.com/jobs/view/123456",
    goal: `Extract ALL information from this job listing:
           title, company, salary, full description, requirements,
           responsibilities, benefits, and key skills mentioned.
           Return as structured JSON.`,
    browser_profile: "stealth",
  }),
});
```

### 3. Auto-Apply — Multi-Step Form Fill

```typescript
// Agent navigates to application page and fills forms autonomously
const response = await fetch("https://agent.tinyfish.ai/v1/automation/run-sse", {
  method: "POST",
  headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
  body: JSON.stringify({
    url: jobApplicationUrl,
    goal: `Click "Apply Now", fill the form with:
           Name: John Doe, Email: john@example.com, Phone: +1-555-1234
           For dropdowns, select the closest match.
           DO NOT click the final Submit button.
           Report all fields filled and current form state.`,
    browser_profile: "stealth",
    feature_flags: { enable_agent_memory: true },
  }),
});
```

### 4. Real-Time SSE Streaming

All API calls use TinyFish's **SSE (Server-Sent Events)** endpoint, giving users real-time visibility:

```
data: {"type":"STARTED","run_id":"run_abc"}
data: {"type":"STREAMING_URL","streaming_url":"https://..."}
data: {"type":"PROGRESS","purpose":"Navigating to LinkedIn Jobs"}
data: {"type":"PROGRESS","purpose":"Applying search filters"}
data: {"type":"PROGRESS","purpose":"Extracting job cards from page"}
data: {"type":"PROGRESS","purpose":"Scrolling to load more results"}
data: {"type":"COMPLETE","status":"COMPLETED","result":{...}}
```

---

## 🎨 Features Walkthrough

### 🔍 Search Tab
- Enter keywords, location, experience level, and job type
- Select one or more job boards to scrape (LinkedIn, Indeed, Glassdoor, Remote OK, Wellfound)
- Hit **"Launch Agent"** — watch the live agent feed as TinyFish navigates each board
- Results are saved automatically and appear in the Jobs tab

### 📋 Jobs Tab
- Browse all scraped job listings in a responsive card grid
- Each card shows title, company, location, salary, source, and skill tags
- **"Analyze"** — sends TinyFish to deep-extract full job details
- **"Auto-Apply"** — launches the form-fill agent (requires profile setup)

### 📝 Applications Tab
- Track all application attempts with status (success / partial / failed)
- See which steps the agent completed and any errors encountered

### 👤 Profile Tab
- Set up your name, email, phone, skills, experience, LinkedIn, salary expectations
- This data is used by the Auto-Apply agent to fill out application forms

---

## 🔒 Safety

> The Auto-Apply agent is configured to **stop before clicking the final Submit button**. It fills out forms and reports the state, giving you the chance to review before submitting. This is a safety measure — you always have the final say.

---

## ⚡ Quick Start

### Prerequisites

- **Node.js 18+**
- **TinyFish API Key** — [Sign up here](https://agent.tinyfish.ai/sign-up), then grab your key from [API Keys page](https://agent.tinyfish.ai/api-keys)

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/hireflow.git
   cd hireflow
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure your API key:**
   ```bash
   # Edit .env.local and add your TinyFish API key
   TINYFISH_API_KEY=sk-tinyfish-your-key-here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser 🎉

---

## 📂 Project Structure

```
hireflow/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── search/route.ts    # Multi-board job search (SSE)
│   │   │   ├── analyze/route.ts   # Deep job analysis (SSE)
│   │   │   ├── apply/route.ts     # Auto-fill applications (SSE)
│   │   │   ├── jobs/route.ts      # CRUD for saved jobs
│   │   │   └── profile/route.ts   # User profile management
│   │   ├── globals.css            # Design system (dark theme)
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Main dashboard (all components)
│   └── lib/
│       ├── tinyfish.ts            # TinyFish API client & goal builders
│       ├── types.ts               # TypeScript interfaces
│       └── storage.ts             # JSON file-based persistence
├── data/                          # Auto-generated JSON storage
├── .env.local                     # API key configuration
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 📜 License

MIT License - See LICENSE file for details

---

<p align="center">
  Built with ⚡ by <strong>HireFlow</strong> — Stop job hunting. Start getting hired.
</p>

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "HireFlow — AI Job Hunt Autopilot",
    description:
        "Autonomous web agent that monitors job boards, extracts listings, and auto-fills applications. Powered by TinyFish Web Agent API.",
    keywords: [
        "job search",
        "AI agent",
        "web automation",
        "TinyFish",
        "job board scraper",
        "auto apply",
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}

// ============================================
// GET / POST /api/profile — User profile management
// ============================================

import { NextRequest } from "next/server";
import { getProfile, saveProfile } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = getProfile();
  return new Response(JSON.stringify({ profile }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: NextRequest) {
  const profile = await request.json();
  saveProfile(profile);
  return new Response(JSON.stringify({ success: true, profile }), {
    headers: { "Content-Type": "application/json" },
  });
}
